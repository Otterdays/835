(function () {
    const MIN_QUERY_LEN = 2;
    const MAX_RESULTS = 12;

    let index = [];
    let dataReady = false;
    let dataPromise = null;
    let overlay;
    let input;
    let resultsEl;
    let statusEl;
    let activeIndex = -1;

    const normalize = (value) => (value || '').toLowerCase().trim();

    const escapeHtml = (value) =>
        value.replace(/[&<>'"]/g, (char) =>
            ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;' }[char] || char)
        );

    const isTypingTarget = (target) => {
        if (!target) return false;
        const tag = target.tagName;
        return tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT' || target.isContentEditable;
    };

    const ensureData = () => {
        if (dataReady) {
            return Promise.resolve();
        }
        if (typeof contractData !== 'undefined') {
            dataReady = true;
            buildIndex();
            return Promise.resolve();
        }
        if (!dataPromise) {
            dataPromise = new Promise((resolve, reject) => {
                const script = document.createElement('script');
                script.src = 'data.js';
                script.onload = () => {
                    dataReady = true;
                    buildIndex();
                    resolve();
                };
                script.onerror = () => reject(new Error('Could not load search data.'));
                document.head.appendChild(script);
            });
        }
        return dataPromise;
    };

    const buildIndex = () => {
        index = [];

        if (typeof contractData !== 'undefined' && contractData.articles) {
            contractData.articles.forEach((article) => {
                index.push({
                    category: 'Contract',
                    title: article.title,
                    body: `${article.title}\n${article.content}`,
                    meta: article.separateFromMainAgreement ? 'Separate paper' : 'CBA article',
                    href: (query) =>
                        `contract.html?q=${encodeURIComponent(query)}&article=${encodeURIComponent(article.id)}`
                });
            });
        }

        if (typeof cbaScannedPages !== 'undefined') {
            cbaScannedPages.forEach((item) => {
                index.push({
                    category: 'Scanned Pages',
                    title: `${item.label}: ${item.title}`,
                    body: [item.label, item.title, item.description, item.section, item.transcription]
                        .filter(Boolean)
                        .join('\n'),
                    meta: item.section || 'CBA scan',
                    href: () => `scans.html?item=${encodeURIComponent(item.id)}`
                });
            });
        }

        if (typeof toolProgramScans !== 'undefined') {
            toolProgramScans.forEach((item) => {
                index.push({
                    category: 'Tool Program',
                    title: `${item.label}: ${item.title}`,
                    body: [item.label, item.title, item.description, item.transcription]
                        .filter(Boolean)
                        .join('\n'),
                    meta: 'Tool policy',
                    href: () => `tool-program.html?item=${encodeURIComponent(item.id)}`
                });
            });
        }

        if (typeof shopStewards !== 'undefined') {
            shopStewards.forEach((steward) => {
                index.push({
                    category: 'Shop Stewards',
                    title: steward.name,
                    body: [steward.name, steward.role, steward.location, steward.tagline].join('\n'),
                    meta: `${steward.role} — ${steward.location}`,
                    href: () =>
                        `stewards.html?site=${encodeURIComponent(steward.location)}`
                });
            });
        }

        if (typeof employeesData !== 'undefined') {
            employeesData.forEach((employee) => {
                index.push({
                    category: 'Site Roster',
                    title: employee.name,
                    body: [employee.name, employee.role, employee.location].join('\n'),
                    meta: `${employee.location} — ${employee.role}`,
                    href: (query) =>
                        `employees.html?q=${encodeURIComponent(query || employee.name)}`
                });
            });
        }
    };

    const queryTokens = (query) => normalize(query).split(/\s+/).filter(Boolean);

    const scoreEntry = (entry, tokens) => {
        const title = normalize(entry.title);
        const body = normalize(entry.body);
        let score = 0;

        for (const token of tokens) {
            if (!title.includes(token) && !body.includes(token)) {
                return 0;
            }
            if (title.includes(token)) score += 8;
            if (body.includes(token)) score += 2;
            if (title.startsWith(token)) score += 4;
        }

        return score;
    };

    const makeSnippet = (entry, tokens) => {
        const flat = entry.body.replace(/\s+/g, ' ').trim();
        const needle = tokens[0] || '';
        const idx = flat.toLowerCase().indexOf(needle);
        if (idx === -1) {
            return flat.slice(0, 140) + (flat.length > 140 ? '…' : '');
        }
        const start = Math.max(0, idx - 50);
        const end = Math.min(flat.length, idx + needle.length + 90);
        let snippet = flat.slice(start, end);
        if (start > 0) snippet = '…' + snippet;
        if (end < flat.length) snippet += '…';
        return snippet;
    };

    const highlightSnippet = (snippet, tokens) => {
        let html = escapeHtml(snippet);
        tokens.forEach((token) => {
            const escaped = token.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
            html = html.replace(new RegExp(`(${escaped})`, 'gi'), '<mark>$1</mark>');
        });
        return html;
    };

    const search = (query) => {
        const tokens = queryTokens(query);
        if (!tokens.length) {
            return [];
        }

        return index
            .map((entry) => ({ entry, score: scoreEntry(entry, tokens) }))
            .filter((row) => row.score > 0)
            .sort((a, b) => b.score - a.score)
            .slice(0, MAX_RESULTS)
            .map((row) => ({
                ...row.entry,
                snippet: makeSnippet(row.entry, tokens),
                tokens
            }));
    };

    const renderResults = (query) => {
        const tokens = queryTokens(query);
        resultsEl.innerHTML = '';
        activeIndex = -1;

        if (!tokens.length) {
            statusEl.textContent = 'Type to search contract, scans, tool program, stewards, and roster.';
            return;
        }

        if (tokens.join('').length < MIN_QUERY_LEN) {
            statusEl.textContent = 'Keep typing…';
            return;
        }

        const hits = search(query);
        statusEl.textContent = hits.length
            ? `${hits.length} result${hits.length === 1 ? '' : 's'}`
            : 'No matches. Try fewer words or different terms.';

        hits.forEach((hit, i) => {
            const li = document.createElement('li');
            const link = document.createElement('a');
            link.className = 'site-search-result';
            link.href = hit.href(query);
            link.dataset.index = String(i);

            const top = document.createElement('div');
            top.className = 'site-search-result-top';

            const cat = document.createElement('span');
            cat.className = 'site-search-result-cat';
            cat.textContent = hit.category;

            const title = document.createElement('span');
            title.className = 'site-search-result-title';
            title.textContent = hit.title;

            top.appendChild(cat);
            top.appendChild(title);

            const meta = document.createElement('p');
            meta.className = 'site-search-result-meta';
            meta.textContent = hit.meta;

            const snippet = document.createElement('p');
            snippet.className = 'site-search-result-snippet';
            snippet.innerHTML = highlightSnippet(hit.snippet, hit.tokens);

            link.appendChild(top);
            link.appendChild(meta);
            link.appendChild(snippet);
            li.appendChild(link);
            resultsEl.appendChild(li);
        });
    };

    const getResultLinks = () => [...resultsEl.querySelectorAll('.site-search-result')];

    const setActiveResult = (nextIndex) => {
        const links = getResultLinks();
        if (!links.length) {
            activeIndex = -1;
            return;
        }

        activeIndex = ((nextIndex + links.length) % links.length);
        links.forEach((link, i) => {
            link.classList.toggle('is-active', i === activeIndex);
        });
        links[activeIndex].scrollIntoView({ block: 'nearest' });
    };

    const isOpen = () => overlay?.classList.contains('is-open');

    const open = async () => {
        if (!overlay) {
            return;
        }

        overlay.classList.add('is-open');
        overlay.hidden = false;
        document.body.classList.add('site-search-open');
        input.value = '';
        renderResults('');
        statusEl.textContent = 'Loading search index…';

        try {
            await ensureData();
            statusEl.textContent = 'Type to search contract, scans, tool program, stewards, and roster.';
        } catch {
            statusEl.textContent = 'Search data failed to load. Refresh and try again.';
        }

        window.setTimeout(() => input.focus(), 0);
    };

    const close = () => {
        if (!overlay || !isOpen()) {
            return;
        }
        overlay.classList.remove('is-open');
        overlay.hidden = true;
        document.body.classList.remove('site-search-open');
        document.getElementById('site-search-btn')?.focus();
    };

    const mount = () => {
        const btn = document.createElement('button');
        btn.id = 'site-search-btn';
        btn.type = 'button';
        btn.className = 'site-search-btn';
        btn.setAttribute('aria-label', 'Search entire site');
        btn.setAttribute('aria-keyshortcuts', 'Control+K');
        btn.innerHTML =
            '<svg viewBox="0 0 24 24" width="22" height="22" stroke="currentColor" stroke-width="2" fill="none" aria-hidden="true"><circle cx="11" cy="11" r="7"></circle><line x1="21" y1="21" x2="16.65" y2="16.65"></line></svg>';

        overlay = document.createElement('div');
        overlay.id = 'site-search-overlay';
        overlay.className = 'site-search-overlay';
        overlay.hidden = true;

        const dialog = document.createElement('div');
        dialog.className = 'site-search-dialog';
        dialog.setAttribute('role', 'dialog');
        dialog.setAttribute('aria-modal', 'true');
        dialog.setAttribute('aria-labelledby', 'site-search-title');

        const header = document.createElement('div');
        header.className = 'site-search-header';

        const title = document.createElement('h2');
        title.id = 'site-search-title';
        title.className = 'site-search-title';
        title.textContent = 'Search site';

        const hints = document.createElement('div');
        hints.className = 'site-search-hints';
        hints.innerHTML = '<span class="hint-chip">↑↓ Navigate</span><span class="hint-chip">Enter Open</span><span class="hint-chip">Esc Close</span>';

        header.appendChild(title);
        header.appendChild(hints);

        input = document.createElement('input');
        input.id = 'site-search-input';
        input.type = 'search';
        input.className = 'site-search-input';
        input.placeholder = 'Contract language, scans, names, roles…';
        input.setAttribute('aria-label', 'Search site');
        input.setAttribute('autocomplete', 'off');

        statusEl = document.createElement('p');
        statusEl.className = 'site-search-status';
        statusEl.textContent = 'Type to search contract, scans, tool program, stewards, and roster.';

        resultsEl = document.createElement('ul');
        resultsEl.id = 'site-search-results';
        resultsEl.className = 'site-search-results';

        dialog.appendChild(header);
        dialog.appendChild(input);
        dialog.appendChild(statusEl);
        dialog.appendChild(resultsEl);
        overlay.appendChild(dialog);
        document.body.appendChild(btn);
        document.body.appendChild(overlay);

        btn.addEventListener('click', () => open());
        overlay.addEventListener('click', (event) => {
            if (event.target === overlay) {
                close();
            }
        });

        input.addEventListener('input', () => renderResults(input.value));
        input.addEventListener('keydown', (event) => {
            const links = getResultLinks();

            if (event.key === 'ArrowDown') {
                event.preventDefault();
                setActiveResult(activeIndex + 1);
                return;
            }
            if (event.key === 'ArrowUp') {
                event.preventDefault();
                setActiveResult(activeIndex <= 0 ? links.length - 1 : activeIndex - 1);
                return;
            }
            if (event.key === 'Enter' && activeIndex >= 0 && links[activeIndex]) {
                event.preventDefault();
                window.location.href = links[activeIndex].href;
                return;
            }
            if (event.key === 'Escape') {
                event.preventDefault();
                close();
            }
        });
    };

    document.addEventListener('DOMContentLoaded', () => {
        mount();

        document.addEventListener('keydown', (event) => {
            if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === 'k') {
                event.preventDefault();
                if (isOpen()) {
                    close();
                } else {
                    open();
                }
                return;
            }

            if (event.key === '/' && !isTypingTarget(event.target) && !isOpen()) {
                const onContract =
                    (SITE_PAGE_IDS?.[window.location.pathname.split('/').pop() || 'index.html'] || '') ===
                    'contract';
                if (!onContract) {
                    event.preventDefault();
                    open();
                }
            }
        });

        document.getElementById('gateway-search-btn')?.addEventListener('click', () => open());
    });

    window.SiteSearch = { open, close, isOpen };
})();
