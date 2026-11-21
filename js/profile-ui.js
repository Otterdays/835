// [TRACE: ACCOUNTS.md]
// Shared helpers for profile, directory, sign-in and forum pages.
// Everything is built with textContent / DOM nodes. Member text is never parsed as HTML.
window.ProfileUI = (() => {
    const BADGE_ICONS = {
        admin: '🛠️',
        'lead-admin': '👑',
        verified: '✔',
        steward: '🛡️',
        'lead-steward': '⭐',
        'exec-board': '🏛️',
        'bargaining-committee': '🤝',
        'safety-committee': '🦺'
    };
    const FALLBACK_AVATAR = { glyph: 'hardhat', color: 'blue' };

    let optionsPromise = null;
    let optionsCache = null;

    const el = (tag, className, text) => {
        const node = document.createElement(tag);
        if (className) {
            node.className = className;
        }
        if (text !== undefined && text !== null) {
            node.textContent = text;
        }
        return node;
    };

    const api = async (path, { method = 'GET', body } = {}) => {
        let res;
        try {
            res = await fetch(path, {
                method,
                credentials: 'same-origin',
                headers: { Accept: 'application/json', 'Content-Type': 'application/json' },
                body: body === undefined ? undefined : JSON.stringify(body)
            });
        } catch (err) {
            console.error('Profile request failed', err);
            throw Object.assign(new Error('Could not reach the server. Check your connection and try again.'), {
                status: 0
            });
        }
        if (res.status === 404 && !res.headers.get('content-type')?.includes('json')) {
            throw Object.assign(
                new Error('Accounts need the live site (or `npm run vercel:dev`); this static preview has no server.'),
                { status: 404, unavailable: true }
            );
        }
        const data = await res.json().catch((err) => {
            console.error('Profile response parse failed', err);
            return {};
        });
        if (!res.ok || !data.ok) {
            throw Object.assign(new Error(data.error || `Request failed (${res.status}).`), {
                status: res.status,
                code: data.code || null,
                rateLimit: data.rateLimit || null,
                freeModelDailyRequests: data.freeModelDailyRequests || null
            });
        }
        return data;
    };

    const getOptions = () => {
        if (!optionsPromise) {
            optionsPromise = api('/api/profile?meta=1')
                .then((data) => {
                    optionsCache = data.options;
                    return optionsCache;
                })
                .catch((err) => {
                    optionsPromise = null; // allow a retry on the next call
                    throw err;
                });
        }
        return optionsPromise;
    };

    const glyphOf = (avatar) => {
        const a = avatar || FALLBACK_AVATAR;
        const found = optionsCache?.avatarGlyphs.find((g) => g.id === a.glyph);
        return found ? found.emoji : '👷';
    };

    const colorOf = (avatar) => {
        const a = avatar || FALLBACK_AVATAR;
        const found = optionsCache?.avatarColors.find((c) => c.id === a.color);
        return found ? found.hex : '#1f4e9c';
    };

    /** Round "profile picture": a chosen glyph on a chosen color. */
    const avatarNode = (avatar, size = 'md') => {
        const frame = /^[a-z]+$/.test(avatar?.frame || '') ? avatar.frame : 'none';
        const node = el('span', `pf-avatar pf-avatar--${size} pf-avatar--frame-${frame}`, glyphOf(avatar));
        node.style.background = colorOf(avatar);
        node.setAttribute('aria-hidden', 'true');
        return node;
    };

    const badgeLabel = (id) => optionsCache?.badges.find((b) => b.id === id)?.label || id;

    const badgeNode = (id) => {
        const node = el('span', `pf-badge pf-badge--${id}`);
        node.append(el('span', 'pf-badge-icon', BADGE_ICONS[id] || '•'), document.createTextNode(` ${badgeLabel(id)}`));
        node.title = id === 'verified' ? 'Verified by a Local 835 officer' : id === 'admin' ? 'Runs this website for Local 835' : `${badgeLabel(id)} (awarded by Local 835)`;
        return node;
    };

    const badgeRow = (ids) => {
        const row = el('span', 'pf-badges');
        (ids || []).forEach((id) => row.append(badgeNode(id)));
        return row;
    };

    /**
     * A member's links. The address is re-checked here (http/https only) even though the server
     * already did, and the real website name is always shown next to the member's label so the
     * label cannot disguise where a link goes. Opens in a new tab without passing the page along.
     */
    const linksBox = (links) => {
        const box = el('section', 'pf-box pf-links');
        box.append(el('h2', 'pf-box-title', 'Links'));
        const list = el('ul', 'pf-link-list');
        (links || []).forEach((link) => {
            let url;
            try {
                url = new URL(link.url);
            } catch (err) {
                console.error('Skipping invalid profile link', err);
                return;
            }
            if (url.protocol !== 'https:' && url.protocol !== 'http:') {
                return;
            }
            const li = el('li', 'pf-link-item');
            const a = el('a', 'pf-link', link.label);
            a.href = url.href;
            a.target = '_blank';
            a.rel = 'noopener noreferrer nofollow ugc';
            li.append(a, el('span', 'pf-link-host', url.hostname.replace(/^www\./, '')));
            list.append(li);
        });
        box.append(list, el('p', 'pf-muted pf-link-note', 'Links open in a new tab. They are chosen by the member, not checked by Local 835.'));
        return box;
    };

    const profileHref = (handle) => `profile.html?u=${encodeURIComponent(handle)}`;

    const formatDate = (iso) => {
        const d = iso ? new Date(iso) : null;
        return d && !Number.isNaN(d.getTime())
            ? d.toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' })
            : '';
    };

    const formatDateTime = (iso) => {
        const d = iso ? new Date(iso) : null;
        return d && !Number.isNaN(d.getTime()) ? d.toLocaleString() : '';
    };

    const status = (node, text, type = 'info') => {
        node.textContent = text;
        node.className = `pf-status pf-status--${type}`;
        node.hidden = !text;
    };

    /** Panel shown in place of member-only content for guests. */
    const signInPrompt = (what, next) => {
        const box = el('section', 'pf-box pf-gate');
        box.append(el('h2', 'pf-box-title', 'Sign in to continue'));
        const body = el('div', 'pf-box-body');
        body.append(el('p', '', `${what} is for signed-in Local 835 members.`));
        const link = el('a', 'pf-btn pf-btn--primary', 'Sign in or create an account');
        link.href = `signin.html?next=${encodeURIComponent(next || window.location.pathname.split('/').pop() || 'home.html')}`;
        body.append(link);
        box.append(body);
        return box;
    };

    return {
        el,
        api,
        getOptions,
        avatarNode,
        badgeNode,
        badgeRow,
        badgeLabel,
        linksBox,
        profileHref,
        formatDate,
        formatDateTime,
        status,
        signInPrompt,
        options: () => optionsCache
    };
})();
