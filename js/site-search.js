(function () {
    const MIN_QUERY_LEN = 2;
    const MAX_RESULTS = 12;
    const SEARCH_HINT =
        'Search project updates, member pages, contract text, scans, names, roster, and forum.';

    let index = [];
    let forumEntries = [];
    let forumLoad = null;
    let dataReady = false;
    let dataPromise = null;
    let overlay;
    let input;
    let resultsEl;
    let statusEl;
    let activeIndex = -1;
    let returnFocusTo = null;

    const normalize = (value) =>
        String(value || '')
            .normalize('NFKD')
            .replace(/[\u0300-\u036f]/g, '')
            .toLocaleLowerCase()
            .replace(/[^\p{L}\p{N}]+/gu, ' ')
            .trim();

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
                script.src = new URL('data.js', document.baseURI).href;
                script.onload = () => {
                    dataReady = true;
                    buildIndex();
                    resolve();
                };
                script.onerror = () => {
                    dataPromise = null;
                    script.remove();
                    reject(new Error('Could not load search data.'));
                };
                document.head.appendChild(script);
            });
        }
        return dataPromise;
    };

    const buildIndex = () => {
        index = [];

        [
            {
                category: 'Home',
                title: 'Local 835 Member Home',
                body: 'Operating Engineers Local 835 State Road U.S. Facilities CFCF RCF PICC portal member resources home',
                meta: 'Member portal',
                href: 'home.html'
            },
            {
                category: 'Member Calendar',
                title: 'Member Calendar',
                body: 'Local 835 union members meeting December 8 2026 7 pm 7:00 p.m. fifth and willow Philadelphia meeting',
                meta: 'Upcoming member meeting',
                href: 'calendar.html'
            },
            {
                category: 'Updates',
                title: 'Project Updates',
                body: 'recent changes activity log changelog forum discussion board community forum MongoDB mobile readability thread reply temporary username page 13 high resolution scan page 14 Article XIX holiday pay Article XX pension contribution schedule trust 401k page 15 Article XXI wages Exhibit B biweekly pay Article XXII health care LTD partial search searchability steward roster roles portraits taglines Charles Kevin Ryan Orlando next page 16 CBA transcription future information scan transcription workflow image gallery search Codex OpenAI Claude Code future agents',
                meta: 'Recent work and what is next',
                href: 'updates.html'
            },
            {
                category: 'Contract & Employment Updates',
                title: 'Contract & Employment Updates',
                body: 'contract negotiations employment updates weekly pay weekly payroll bi-weekly pay every two weeks union increases USF U.S. Facilities management implementation timeline Susan Laramore-Johnson',
                meta: 'Negotiations and workplace changes',
                href: 'contract-updates.html'
            },
            {
                category: 'Member Tools',
                title: 'Member Action Center',
                body: 'grievance preparation grievance prep issue article steward preparation steward prep facts dates witnesses remedy Article IV time limits CFCF RCF PICC',
                meta: 'Grievance and steward preparation',
                href: 'member-action.html'
            },
            {
                category: 'Member Tools',
                title: 'Evidence Log',
                body: 'evidence log V R A Q L record source date proves does not prove follow up export markdown JSON in memory',
                meta: 'Organize evidence and export notes',
                href: 'evidence-log.html'
            },
            {
                category: 'Member Tools',
                title: 'Bargaining Tools',
                body: 'bargaining checklist document requests transparency proposals member vote contract ratification legal review wages benefits hours',
                meta: 'Checklists and document requests',
                href: 'bargaining.html'
            },
            {
                category: 'Feedback',
                title: 'Suggestions',
                body: 'suggestions feedback member input share copy topic issue workplace facility steward contact follow up',
                meta: 'Share member input',
                href: 'suggestions.html'
            }
        ].forEach((page) => index.push({
            ...page,
            body: `${page.title}\n${page.body}`,
            href: () => page.href
        }));

        [
            {
                title: 'IUOE Local 835 Working Packet',
                body: 'Meeting preparation facts questions document requests proposed member action legal review bargaining U.S. Facilities',
                meta: 'Word and Markdown working draft'
            },
            {
                title: 'Petition and Meeting Motion',
                body: 'Member petition signature sheet floor motion minutes language bargaining disclosure legal consultation ratification',
                meta: 'Word and Markdown working draft'
            }
        ].forEach((document) => {
            index.push({
                category: 'Member Documents',
                title: document.title,
                body: `${document.title}\n${document.body}`,
                meta: document.meta,
                href: () => 'member-documents.html'
            });
        });

        index.push({
            category: 'Community Forum',
            title: 'Community Forum',
            body: 'Community forum discussion board members talk threads posts replies general contract workplace',
            meta: 'Talk with fellow members',
            href: () => 'forum.html'
        });

        if (typeof contractData !== 'undefined' && contractData.articles) {
            contractData.articles.forEach((article) => {
                index.push({
                    category: 'Contract',
                    title: article.title,
                    body: `${article.title}\n${article.content}`,
                    meta: article.separateFromMainAgreement ? 'Separate paper' : 'CBA article',
                    href: () => `contract.html?article=${encodeURIComponent(article.id)}`
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
                    meta: steward.location ? `${steward.role} — ${steward.location}` : steward.role,
                    href: () => steward.location
                        ? `stewards.html?site=${encodeURIComponent(steward.location)}`
                        : 'stewards.html'
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

    /** Live forum threads and matching replies. Failure only drops forum results. */
    const loadForum = (query = '') => {
        forumLoad?.abort();
        const controller = new AbortController();
        forumLoad = controller;
        forumEntries = [];
        const timeout = window.setTimeout(() => controller.abort(), 6000);
        const url = new URL('/api/forum/threads', window.location.origin);
        if (query) url.searchParams.set('q', queryTokens(query).join(' '));
        return fetch(url, {
            headers: { Accept: 'application/json' },
            signal: controller.signal
        })
            .then((res) => {
                if (!res.ok) {
                    throw new Error(`Forum search load failed (${res.status})`);
                }
                return res.json();
            })
            .then((data) => {
                if (forumLoad !== controller) return;
                forumEntries = (data.threads || []).map((t) => ({
                    category: 'Forum',
                    title: t.title,
                    body: [
                        t.title,
                        t.body,
                        t.author,
                        t.category,
                        ...(t.matchedReplies || []).flatMap((reply) => [reply.author, reply.body])
                    ].join('\n'),
                    meta: `${t.author} · ${t.replyCount} ${t.replyCount === 1 ? 'reply' : 'replies'}`,
                    href: () => `forum.html#t=${encodeURIComponent(t.id)}`
                }));
            })
            .catch((err) => {
                if (err.name !== 'AbortError') {
                    console.error('Forum search index unavailable', err);
                }
            })
            .finally(() => {
                window.clearTimeout(timeout);
            });
    };

    const queryTokens = (query) => [...new Set(normalize(query).split(/\s+/).filter(Boolean))];

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

        const phrase = tokens.join(' ');
        if (phrase && title.includes(phrase)) score += 12;
        if (phrase && body.includes(phrase)) score += 4;

        return score;
    };

    const makeSnippet = (entry, tokens) => {
        const flat = String(entry.body || '').replace(/\s+/g, ' ').trim();
        const needle = tokens[0] || '';
        let originalOffset = 0;
        let normalized = '';
        const sourceOffsets = [];
        [...flat].forEach((char) => {
            const sourceOffset = originalOffset;
            originalOffset += char.length;
            const part = char
                .normalize('NFKD')
                .replace(/[\u0300-\u036f]/g, '')
                .toLocaleLowerCase();
            [...part].forEach((partChar) => {
                if (/[\p{L}\p{N}]/u.test(partChar)) {
                    normalized += partChar;
                    sourceOffsets.push(sourceOffset);
                } else if (normalized && !normalized.endsWith(' ')) {
                    normalized += ' ';
                    sourceOffsets.push(sourceOffset);
                }
            });
        });
        if (normalized.endsWith(' ')) {
            normalized = normalized.slice(0, -1);
            sourceOffsets.pop();
        }
        const normalizedIndex = normalized.indexOf(needle);
        const idx = normalizedIndex < 0 ? -1 : sourceOffsets[normalizedIndex];
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
            .concat(forumEntries)
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
            statusEl.textContent = SEARCH_HINT;
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

        returnFocusTo = document.activeElement instanceof HTMLElement ? document.activeElement : null;
        overlay.classList.add('is-open');
        overlay.hidden = false;
        document.body.classList.add('site-search-open');
        input.value = '';
        renderResults('');
        statusEl.textContent = 'Loading search index…';

        try {
            await ensureData();
            renderResults(input.value);
            // Search the local index immediately; live forum results can arrive later.
            loadForum(input.value.trim()).then(() => {
                if (isOpen()) {
                    if (input.value.trim()) renderResults(input.value);
                    else statusEl.textContent = SEARCH_HINT;
                }
            });
        } catch {
            statusEl.textContent = 'Search data failed to load. Refresh and try again.';
        }

        window.setTimeout(() => input.focus(), 0);
    };

    const close = () => {
        if (!overlay || !isOpen()) {
            return;
        }
        forumLoad?.abort();
        overlay.classList.remove('is-open');
        overlay.hidden = true;
        document.body.classList.remove('site-search-open');
        returnFocusTo?.focus();
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
        statusEl.textContent = SEARCH_HINT;

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

        let forumSearchTimer;
        input.addEventListener('input', () => {
            forumEntries = [];
            forumLoad?.abort();
            renderResults(input.value);
            window.clearTimeout(forumSearchTimer);
            const query = input.value.trim();
            if (queryTokens(query).join('').length >= MIN_QUERY_LEN) {
                forumSearchTimer = window.setTimeout(() => {
                    if (!isOpen()) return;
                    loadForum(query).then(() => {
                        if (isOpen() && input.value.trim() === query) renderResults(query);
                    });
                }, 250);
            } else {
                forumEntries = [];
                forumLoad?.abort();
            }
        });
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
                return;
            }
        });
        overlay.addEventListener('keydown', (event) => {
            if (event.key !== 'Tab') return;
            const focusable = [...dialog.querySelectorAll('input:not([disabled]), a[href], button:not([disabled])')]
                .filter((node) => !node.hidden && node.getClientRects().length);
            if (!focusable.length) return;
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
                    (SITE_PAGE_IDS?.[window.location.pathname.split('/').pop() || 'home.html'] || '') ===
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
