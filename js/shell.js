document.addEventListener('DOMContentLoaded', () => {
    const menuBtn = document.getElementById('menu-btn');
    const sidePanel = document.getElementById('side-panel');
    const overlay = document.getElementById('panel-overlay');
    const closeBtn = document.getElementById('close-btn');
    const navRoot = document.getElementById('nav-links');

    const currentPageId = () => {
        const file = window.location.pathname.split('/').pop() || 'home.html';
        return SITE_PAGE_IDS[file] || '';
    };

    const renderNav = () => {
        if (!navRoot || !Array.isArray(SITE_NAV)) {
            return;
        }

        const activeId = currentPageId();
        navRoot.innerHTML = '';

        SITE_NAV.forEach((group) => {
            const groupEl = document.createElement('li');
            groupEl.className = 'nav-group';

            const heading = document.createElement('span');
            heading.className = 'nav-group-label';
            heading.textContent = group.label;
            groupEl.appendChild(heading);

            const sub = document.createElement('ul');
            sub.className = 'nav-group-links';

            group.items.forEach((item) => {
                const li = document.createElement('li');
                if (item.disabled) {
                    li.className = 'nav-item-muted';
                    li.title = item.title || '';
                    li.setAttribute('aria-label', item.title || item.label);
                    const span = document.createElement('span');
                    span.className = 'nav-link nav-link--disabled';
                    span.textContent = item.label;
                    if (item.soon) {
                        const badge = document.createElement('span');
                        badge.className = 'nav-soon';
                        badge.textContent = 'soon';
                        span.appendChild(document.createTextNode(' '));
                        span.appendChild(badge);
                    }
                    li.appendChild(span);
                } else {
                    const link = document.createElement('a');
                    link.href = item.href;
                    link.textContent = item.label;
                    if (item.id === activeId) {
                        link.classList.add('active');
                    }
                    li.appendChild(link);
                }
                sub.appendChild(li);
            });

            groupEl.appendChild(sub);
            navRoot.appendChild(groupEl);
        });
    };

    // Appearance switch: Auto follows the device; Light and Dark are remembered on this device.
    const renderAppearance = () => {
        if (!sidePanel || !window.SiteTheme || sidePanel.querySelector('.nav-appearance')) {
            return;
        }
        const wrap = document.createElement('section');
        wrap.className = 'nav-appearance';
        wrap.setAttribute('aria-label', 'Appearance');
        const label = document.createElement('span');
        label.className = 'nav-appearance-label';
        label.textContent = 'Appearance';
        const group = document.createElement('div');
        group.className = 'nav-appearance-group';
        group.setAttribute('role', 'group');
        group.setAttribute('aria-label', 'Light or dark appearance');
        const buttons = [['auto', 'Auto'], ['light', 'Light'], ['dark', 'Dark']].map(([value, text]) => {
            const b = document.createElement('button');
            b.type = 'button';
            b.className = 'nav-appearance-btn';
            b.dataset.value = value;
            b.textContent = text;
            b.addEventListener('click', () => SiteTheme.set(value));
            group.appendChild(b);
            return b;
        });
        const sync = () => buttons.forEach((b) => b.setAttribute('aria-pressed', String(b.dataset.value === SiteTheme.get())));
        document.addEventListener('sitetheme:change', sync);
        sync();
        wrap.append(label, group);
        sidePanel.appendChild(wrap);
    };

    // Account footer of the menu: who is signed in, shortcuts, and Sign out (or Sign in for guests).
    // Built from the real session once Auth has checked it, so it never flashes the wrong state.
    const renderAccount = () => {
        if (!sidePanel || !window.Auth) {
            return;
        }
        sidePanel.querySelector('.nav-account')?.remove();

        const footer = document.createElement('section');
        footer.className = 'nav-account';
        footer.setAttribute('aria-label', 'Your account');
        const account = Auth.account?.();

        const makeLink = (label, href, className) => {
            const a = document.createElement('a');
            a.href = href;
            a.textContent = label;
            a.className = className;
            return a;
        };

        if (!account) {
            const note = document.createElement('p');
            note.className = 'nav-account-note';
            note.textContent = 'You are not signed in.';
            const next = encodeURIComponent(window.location.pathname.split('/').pop() || 'home.html');
            footer.append(note, makeLink('Sign in / create account', `signin.html?next=${next}`, 'nav-account-btn nav-account-btn--primary'));
            sidePanel.appendChild(footer);
            return;
        }

        const name = account.displayName || account.username;
        const who = document.createElement('div');
        who.className = 'nav-account-who';
        const initial = document.createElement('span');
        initial.className = 'nav-account-initial';
        initial.setAttribute('aria-hidden', 'true');
        initial.textContent = [...String(name)][0]?.toUpperCase() || '?';
        const text = document.createElement('span');
        text.className = 'nav-account-text';
        const strong = document.createElement('strong');
        strong.textContent = name;
        const handle = document.createElement('span');
        handle.textContent = `@${account.username}${account.role === 'admin' ? ' · Site Admin' : ''}`;
        text.append(strong, handle);
        const signOut = document.createElement('button');
        signOut.type = 'button';
        signOut.className = 'nav-account-btn nav-account-btn--signout';
        signOut.textContent = 'Sign out';
        signOut.addEventListener('click', () => {
            signOut.disabled = true;
            signOut.textContent = 'Signing out…';
            Promise.resolve(Auth.logout()).catch((err) => {
                console.error('Logout failed', err);
                signOut.disabled = false;
                signOut.textContent = 'Sign out';
            });
        });

        who.append(initial, text, signOut);

        const links = document.createElement('div');
        links.className = 'nav-account-links';
        const items = [
            ['My profile', `profile.html?u=${encodeURIComponent(account.username)}`],
            ['Edit profile', 'profile-edit.html'],
            ['Password', 'signin.html#password']
        ];
        if (account.role === 'admin') {
            items.push(['Admin panel', 'admin.html']);
        }
        items.forEach(([label, href]) => links.appendChild(makeLink(label, href, 'nav-account-link')));

        footer.append(who, links);
        sidePanel.appendChild(footer);
    };

    // Floating speech bubble that leads to the forum. Not shown where it would be redundant or in the way.
    const renderForumBubble = () => {
        const file = window.location.pathname.split('/').pop();
        if (!file || ['forum.html', 'index.html', 'signin.html', 'admin.html', 'profile-edit.html'].includes(file)) {
            return;
        }
        if (document.querySelector('.forum-bubble')) {
            return;
        }
        const link = document.createElement('a');
        link.className = 'forum-bubble';
        link.href = 'forum.html';
        link.setAttribute('aria-label', 'Open the Community Forum');

        const icon = document.createElement('span');
        icon.className = 'forum-bubble-icon';
        icon.setAttribute('aria-hidden', 'true');
        const svgNs = 'http://www.w3.org/2000/svg';
        const svg = document.createElementNS(svgNs, 'svg');
        svg.setAttribute('viewBox', '0 0 24 24');
        svg.setAttribute('width', '18');
        svg.setAttribute('height', '18');
        svg.setAttribute('fill', 'none');
        svg.setAttribute('stroke', 'currentColor');
        svg.setAttribute('stroke-width', '2.4');
        svg.setAttribute('stroke-linecap', 'round');
        svg.setAttribute('stroke-linejoin', 'round');
        const path = document.createElementNS(svgNs, 'path');
        path.setAttribute('d', 'M21 15a2 2 0 0 1-2 2H8l-5 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z');
        svg.appendChild(path);
        icon.appendChild(svg);

        const text = document.createElement('span');
        text.className = 'forum-bubble-text';
        const title = document.createElement('strong');
        title.textContent = 'Community Forum';
        const sub = document.createElement('small');
        sub.textContent = 'Talk with members';
        text.append(title, sub);

        link.append(icon, text);
        document.body.appendChild(link);
    };

    const renderBreadcrumb = () => {
        const crumb = document.querySelector('.breadcrumb[data-page-title]');
        if (!crumb || currentPageId() === 'home') {
            return;
        }

        const title = crumb.dataset.pageTitle;
        crumb.innerHTML = '';
        crumb.appendChild(makeCrumbLink('Home', 'home.html'));

        const sep = document.createElement('span');
        sep.className = 'breadcrumb-sep';
        sep.textContent = '›';
        sep.setAttribute('aria-hidden', 'true');
        crumb.appendChild(sep);

        const current = document.createElement('span');
        current.className = 'breadcrumb-current';
        current.textContent = title;
        crumb.appendChild(current);
    };

    const makeCrumbLink = (label, href) => {
        const link = document.createElement('a');
        link.href = href;
        link.textContent = label;
        return link;
    };

    renderNav();
    renderAppearance();
    renderForumBubble();
    window.Auth?.whenReady?.().then(renderAccount).catch((err) => console.error('Account menu failed', err));
    renderBreadcrumb();

    if (!menuBtn || !sidePanel || !overlay) {
        return;
    }

    const focusableSelector =
        'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled])';

    const getFocusable = () =>
        [...sidePanel.querySelectorAll(focusableSelector)].filter(
            (el) => el.tabIndex !== -1 && !el.hidden
        );

    const setMenuState = (isOpen) => {
        sidePanel.classList.toggle('open', isOpen);
        overlay.classList.toggle('active', isOpen);
        menuBtn.setAttribute('aria-expanded', String(isOpen));

        if (isOpen) {
            const focusable = getFocusable();
            if (focusable.length) {
                focusable[0].focus();
            }
        } else {
            menuBtn.focus();
        }
    };

    menuBtn.addEventListener('click', () => setMenuState(!sidePanel.classList.contains('open')));
    closeBtn?.addEventListener('click', () => setMenuState(false));
    overlay.addEventListener('click', () => setMenuState(false));

    sidePanel.addEventListener('keydown', (event) => {
        if (event.key !== 'Tab' || !sidePanel.classList.contains('open')) {
            return;
        }

        const focusable = getFocusable();
        if (!focusable.length) {
            return;
        }

        const first = focusable[0];
        const last = focusable[focusable.length - 1];

        if (event.shiftKey && document.activeElement === first) {
            event.preventDefault();
            last.focus();
        } else if (!event.shiftKey && document.activeElement === last) {
            event.preventDefault();
            first.focus();
        }
    });

    document.addEventListener('keydown', (event) => {
        if (event.key !== 'Escape') {
            return;
        }
        if (window.SiteSearch?.isOpen?.()) {
            window.SiteSearch.close();
            return;
        }
        const lightbox = document.getElementById('image-modal');
        if (lightbox && lightbox.classList.contains('is-open')) {
            return;
        }
        if (sidePanel.classList.contains('open')) {
            setMenuState(false);
        }
    });
});
