// [TRACE: ARCHITECTURE.md]
// NOTE: Prefer Vercel /api/auth/* + HttpOnly cookie. Local static serve may
// use gitignored local.auth.json (never deploy). Middleware gates assets on Vercel.

const AUTH_LOGIN_PAGE = 'index.html';
const AUTH_HOME_PAGE = 'home.html';
const AUTH_SESSION_KEY = 'oe835_auth';

const Auth = (() => {
    let cachedUser = null;
    let mode = 'unknown'; // 'api' | 'local' | 'unknown'

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
                return null;
            }
            mode = 'api';
            if (!res.ok) {
                return null;
            }
            const data = await res.json();
            if (data?.authenticated && data.user) {
                cachedUser = data.user;
                return data.user;
            }
            return null;
        } catch (err) {
            console.error('Auth me probe failed', err);
            mode = isLocalHost() ? 'local' : 'api';
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

    const isAuthenticated = () => Boolean(cachedUser) || Boolean(readLegacySession());

    const currentUser = () => cachedUser || readLegacySession();

    const login = async (username, password) => {
        const user = String(username || '').trim();
        const pass = String(password || '');

        if (mode === 'unknown') {
            await probeApi();
        }

        if (mode === 'api') {
            try {
                const res = await fetch('/api/auth/login', {
                    method: 'POST',
                    credentials: 'same-origin',
                    headers: {
                        'Content-Type': 'application/json',
                        Accept: 'application/json'
                    },
                    body: JSON.stringify({ username: user, password: pass })
                });
                const data = await res.json().catch(() => ({}));
                if (!res.ok || !data.ok) {
                    return { ok: false, error: data.error || 'Invalid username or password.' };
                }
                cachedUser = data.user;
                clearLegacySession();
                return { ok: true };
            } catch (err) {
                console.error('Auth login failed', err);
                return { ok: false, error: 'Could not reach sign-in service.' };
            }
        }

        // Local static fallback (localhost only)
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
        cachedUser = { username: match.username, role: match.role || 'member' };
        writeLegacySession(cachedUser);
        return { ok: true };
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
        const user = await probeApi();
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
            cachedUser = readLegacySession();
            return;
        }
        window.location.replace(AUTH_LOGIN_PAGE);
    };

    // Kick off gate immediately (async)
    requireAuth();

    return {
        isAuthenticated,
        currentUser,
        login,
        logout,
        isLoginPage,
        HOME: AUTH_HOME_PAGE,
        LOGIN: AUTH_LOGIN_PAGE
    };
})();

window.Auth = Auth;
