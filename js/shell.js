document.addEventListener('DOMContentLoaded', () => {
    const menuBtn = document.getElementById('menu-btn');
    const sidePanel = document.getElementById('side-panel');
    const overlay = document.getElementById('panel-overlay');
    const closeBtn = document.getElementById('close-btn');
    const navRoot = document.getElementById('nav-links');

    const currentPageId = () => {
        const file = window.location.pathname.split('/').pop() || 'index.html';
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

    const renderBreadcrumb = () => {
        const crumb = document.querySelector('.breadcrumb[data-page-title]');
        if (!crumb || currentPageId() === 'index') {
            return;
        }

        const title = crumb.dataset.pageTitle;
        crumb.innerHTML = '';
        crumb.appendChild(makeCrumbLink('Home', 'index.html'));

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
