// [TRACE: ACCOUNTS.md]
// Browser auth + account state.
//
// Pages stay open to everyone ("click to enter"): AUTH_DISABLED only controls whether
// the page gate redirects to the login page. Real accounts sit on top of that:
//   - Auth.account()      the signed-in member (from /api/auth/me) or null
//   - Auth.whenReady()    promise that resolves once the first session check is done
//   - Auth.login / Auth.register / Auth.logout   talk to /api/auth/*
// The forum, profiles and the member directory require a signed-in account on the server.

const AUTH_LOGIN_PAGE = 'index.html';
const AUTH_HOME_PAGE = 'home.html';
const AUTH_SESSION_KEY = 'oe835_auth';
const AUTH_DISABLED = true; // Open access to documents: no credentials needed to enter

const Auth = (() => {
    let cachedUser = null; // signed-in account from the API, or null for guests
    let mode = 'unknown'; // 'unknown' | 'api' | 'local'
    let readyPromise = null;

    const isLoginPage = () => {
        const file = window.location.pathname.split('/').pop() || AUTH_LOGIN_PAGE;
        return file === AUTH_LOGIN_PAGE || file === '';
    };

    const isLocalHost = () => {
        const h = window.location.hostname;
        return h === 'localhost' || h === '127.0.0.1';
    };

    const readLegacySession = () => {
        try {
            const raw = sessionStorage.getItem(AUTH_SESSION_KEY);
            if (!raw) {
                return null;
            }
            return JSON.parse(raw);
        } catch (err) {
            console.error('Auth session parse failed', err);
            return null;
        }
    };

    const writeLegacySession = (user) => {
        try {
            sessionStorage.setItem(
                AUTH_SESSION_KEY,
                JSON.stringify({ username: user.username, role: user.role, at: Date.now() })
            );
        } catch (err) {
            console.error('Auth session write failed', err);
        }
    };

    const clearLegacySession = () => {
        try {
            sessionStorage.removeItem(AUTH_SESSION_KEY);
        } catch (err) {
            console.error('Auth session clear failed', err);
        }
    };

    const probeApi = async () => {
        try {
            const res = await fetch('/api/auth/me', {
                credentials: 'same-origin',
                headers: { Accept: 'application/json' }
            });
            if (res.status === 404) {
                mode = 'local';
                cachedUser = null;
                return null;
            }
            mode = 'api';
            if (!res.ok) {
                cachedUser = null;
                return null;
            }
            const data = await res.json();
            cachedUser = data?.authenticated && data.user ? data.user : null;
            return cachedUser;
        } catch (err) {
            console.error('Auth me probe failed', err);
            mode = isLocalHost() ? 'local' : 'api';
            cachedUser = null;
            return null;
        }
    };

    const loadLocalAccounts = async () => {
        try {
            const res = await fetch('/local.auth.json', { cache: 'no-store' });
            if (!res.ok) {
                return [];
            }
            const data = await res.json();
            return Array.isArray(data.users) ? data.users : [];
        } catch (err) {
            console.error('local.auth.json load failed', err);
            return [];
        }
    };

    const announceReady = () => {
        document.dispatchEvent(new CustomEvent('auth:ready', { detail: { account: cachedUser } }));
    };

    const refresh = async () => {
        const user = await probeApi();
        announceReady();
        return user;
    };

    const whenReady = () => {
        if (!readyPromise) {
            readyPromise = refresh();
        }
        return readyPromise;
    };

    const grantAccess = () => {
        // Guest entry: lets the login page continue into the open document pages.
        writeLegacySession({ username: 'Member', role: 'member' });
        return { username: 'Member', role: 'member', guest: true };
    };

    const isAuthenticated = () => {
        if (AUTH_DISABLED) {
            return true;
        }
        return Boolean(cachedUser) || Boolean(readLegacySession());
    };

    const currentUser = () => {
        if (cachedUser) {
            return cachedUser;
        }
        if (AUTH_DISABLED) {
            return readLegacySession() || { username: 'Member', role: 'member', guest: true };
        }
        return readLegacySession();
    };

    const postJson = async (url, payload) => {
        const res = await fetch(url, {
            method: 'POST',
            credentials: 'same-origin',
            headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
            body: JSON.stringify(payload)
        });
        const data = await res.json().catch(() => ({}));
        return { res, data };
    };

    const accountsAvailable = () => mode === 'api';

    const login = async (username, password) => {
        const user = String(username || '').trim();
        const pass = String(password || '');

        if (mode === 'unknown') {
            await whenReady();
        }

        if (mode === 'api') {
            try {
                const { res, data } = await postJson('/api/auth/login', { username: user, password: pass });
                if (!res.ok || !data.ok) {
                    return { ok: false, error: data.error || 'Invalid username or password.' };
                }
                cachedUser = data.user;
                clearLegacySession();
                announceReady();
                return { ok: true, user: cachedUser };
            } catch (err) {
                console.error('Auth login failed', err);
                return { ok: false, error: 'Could not reach sign-in service.' };
            }
        }

        // Local static fallback (localhost only; no profiles or forum)
        if (!isLocalHost()) {
            return { ok: false, error: 'Sign-in service unavailable.' };
        }
        const accounts = await loadLocalAccounts();
        const match = accounts.find(
            (account) =>
                String(account.username || '').toLowerCase() === user.toLowerCase() &&
                String(account.password || '') === pass &&
                account.active !== false
        );
        if (!match) {
            return { ok: false, error: 'Invalid username or password.' };
        }
        writeLegacySession({ username: match.username, role: match.role || 'member' });
        return { ok: true, user: { username: match.username, role: match.role || 'member' } };
    };

    const register = async (fields) => {
        if (mode === 'unknown') {
            await whenReady();
        }
        if (mode !== 'api') {
            return { ok: false, error: 'Accounts need the live site (or `npm run vercel:dev`).' };
        }
        try {
            const { res, data } = await postJson('/api/auth/register', fields);
            if (!res.ok || !data.ok || !data.user) {
                return { ok: false, error: data.error || 'Could not create the account.' };
            }
            cachedUser = data.user;
            clearLegacySession();
            announceReady();
            return { ok: true, user: cachedUser };
        } catch (err) {
            console.error('Auth register failed', err);
            return { ok: false, error: 'Could not reach the sign-up service.' };
        }
    };

    const registrationInfo = async () => {
        try {
            const res = await fetch('/api/auth/register', { headers: { Accept: 'application/json' } });
            if (!res.ok) {
                return null;
            }
            return await res.json();
        } catch (err) {
            console.error('Auth registration info failed', err);
            return null;
        }
    };

    const logout = async () => {
        if (mode === 'api') {
            try {
                await fetch('/api/auth/logout', {
                    method: 'POST',
                    credentials: 'same-origin'
                });
            } catch (err) {
                console.error('Auth logout failed', err);
            }
        }
        cachedUser = null;
        clearLegacySession();
        window.location.href = AUTH_LOGIN_PAGE;
    };

    const requireAuth = async () => {
        const user = await whenReady();
        if (AUTH_DISABLED) {
            // Open access: never redirect, just know who (if anyone) is signed in.
            return;
        }
        if (isLoginPage()) {
            if (user || readLegacySession()) {
                window.location.replace(AUTH_HOME_PAGE);
            }
            return;
        }
        if (user) {
            return;
        }
        if (mode === 'local' && isLocalHost() && readLegacySession()) {
            return;
        }
        window.location.replace(AUTH_LOGIN_PAGE);
    };

    // Kick off the session check immediately (async)
    requireAuth();

    return {
        isAuthenticated,
        currentUser,
        account: () => cachedUser,
        isSignedIn: () => Boolean(cachedUser),
        accountsAvailable,
        whenReady,
        refresh,
        grantAccess,
        login,
        register,
        registrationInfo,
        logout,
        isLoginPage,
        isAuthDisabled: () => AUTH_DISABLED,
        HOME: AUTH_HOME_PAGE,
        LOGIN: AUTH_LOGIN_PAGE
    };
})();

window.Auth = Auth;
