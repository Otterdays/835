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
    let lastResultCount = 0;
    const entryTextCache = new WeakMap();

    const normalize = (value) =>
        String(value || '')
            .normalize('NFKD')
            .replace(/[\u0300-\u036f]/g, '')
            .toLocaleLowerCase()
            .replace(/[^\p{L}\p{N}]+/gu, ' ')
            .trim();

    const normalizeWithOffsets = (value, joinPunctuation = false) => {
        const source = String(value || '');
        const sourceChars = [...source];
        let normalized = '';
        const starts = [];
        const ends = [];
        let sourceOffset = 0;

        sourceChars.forEach((char, index) => {
            const start = sourceOffset;
            sourceOffset += char.length;
            const folded = char.normalize('NFKD').replace(/[\u0300-\u036f]/g, '').toLocaleLowerCase();
            if (joinPunctuation && !/[\p{L}\p{N}\s]/u.test(char) &&
                /[\p{L}\p{N}]/u.test(sourceChars[index - 1] || '') &&
                /[\p{L}\p{N}]/u.test(sourceChars[index + 1] || '')) {
                return;
            }
            [...folded].forEach((part) => {
                if (/[\p{L}\p{N}]/u.test(part)) {
                    normalized += part;
                    for (let i = 0; i < part.length; i += 1) {
                        starts.push(start);
                        ends.push(sourceOffset);
                    }
                } else if (normalized && !normalized.endsWith(' ')) {
                    normalized += ' ';
                    starts.push(start);
                    ends.push(sourceOffset);
                }
            });
        });

        if (normalized.endsWith(' ')) {
            normalized = normalized.slice(0, -1);
            starts.pop();
            ends.pop();
        }
        return { normalized, starts, ends };
    };

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
            { category: 'Member Directory', title: 'Member Directory', body: 'Find member profiles, facilities, roles, and recently active members', meta: 'Member accounts', href: () => 'members.html' },
            { category: 'Member Profiles', title: 'Your profile', body: 'Member profile themes avatars Top 8 comments wall edit profile', meta: 'Myspace-style member pages', href: () => 'profile.html' },
            { category: 'Member Accounts', title: 'Sign in or create an account', body: 'Sign in register create member account password profile', meta: 'Member account', href: () => 'signin.html' },
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
                body: 'Local 835 union wide meeting every third Wednesday monthly assistant shop stewards chief shop steward December 8 2026 7 pm 7:00 p.m. fifth and willow Philadelphia',
                meta: 'Monthly union-wide meeting and December 8 steward meeting',
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
                category: 'Contract',
                title: '2026–27 Tentative Agreement',
                body: 'Memorandum of Tentative Agreement proposed one year extension current CBA remains unchanged July 1 2026 June 30 2027 weekly wages UTO STO accruals bi-weekly 1.5% general wage increase retroactive July 1 2026 ratification within thirty days layoffs pension $2.65 per hour badge pulling discipline ten days forced overtime hooking one hour notice labor management meeting ratification recommendation October 5 2026 source scans pages 1 2 3',
                meta: 'Proposed terms; supplied copy signature/date lines blank',
                href: 'agreement-2026-27.html'
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
                const sites = [employee.location, ...(employee.alsoAt || []), ...(employee.temporaryAt || [])].filter(Boolean).join(' + ');
                const assignment = employee.temporaryAt && employee.temporaryAt.length
                    ? `Temporary assignment: ${employee.temporaryAt.join(', ')}`
                    : '';
                index.push({
                    category: 'Site Roster',
                    title: employee.name,
                    body: [employee.name, employee.role, sites, assignment].join('\n'),
                    meta: `${sites}${assignment ? ' (temporary assignment)' : ''} — ${employee.role}`,
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

    const getEntryTextForms = (entry) => {
        const cached = entryTextCache.get(entry);
        if (cached) return cached;
        const body = String(entry.body || '').replace(/\s+/g, ' ').trim();
        const forms = {
            body,
            title: normalize(entry.title),
            bodyNormalized: normalizeWithOffsets(body),
            bodyJoined: normalizeWithOffsets(body, true),
            titleJoined: normalizeWithOffsets(entry.title, true).normalized
        };
        entryTextCache.set(entry, forms);
        return forms;
    };

    const scoreEntry = (entry, tokens) => {
        const forms = getEntryTextForms(entry);
        const body = forms.bodyNormalized.normalized;
        const joinedBody = forms.bodyJoined.normalized;
        let score = 0;

        for (const token of tokens) {
            if (!forms.title.includes(token) && !body.includes(token) &&
                !forms.titleJoined.includes(token) && !joinedBody.includes(token)) {
                return 0;
            }
            if (forms.title.includes(token) || forms.titleJoined.includes(token)) score += 8;
            if (body.includes(token) || joinedBody.includes(token)) score += 2;
            if (forms.title.startsWith(token) || forms.titleJoined.startsWith(token)) score += 4;
        }

        const phrase = tokens.join(' ');
        if (phrase && forms.title.includes(phrase)) score += 12;
        if (phrase && body.includes(phrase)) score += 4;

        return score;
    };

    const makeSnippet = (entry, tokens) => {
        const { body: flat, bodyNormalized, bodyJoined } = getEntryTextForms(entry);
        const forms = [bodyNormalized, bodyJoined];
        const matches = forms.flatMap(({ normalized, starts }) =>
            tokens.map((token) => {
                const position = normalized.indexOf(token);
                return position < 0 ? -1 : starts[position];
            })
        ).filter((position) => position >= 0);
        const idx = matches.length ? Math.min(...matches) : -1;
        if (idx === -1) {
            return flat.slice(0, 140) + (flat.length > 140 ? '…' : '');
        }
        const start = Math.max(0, idx - 50);
        const end = Math.min(flat.length, idx + 130);
        let snippet = flat.slice(start, end);
        if (start > 0) snippet = '…' + snippet;
        if (end < flat.length) snippet += '…';
        return snippet;
    };

    const highlightSnippet = (snippet, tokens) => {
        const forms = [normalizeWithOffsets(snippet), normalizeWithOffsets(snippet, true)];
        const ranges = [];
        forms.forEach(({ normalized, starts, ends }) => {
            tokens.forEach((token) => {
                let from = 0;
                let found = normalized.indexOf(token, from);
                while (found >= 0) {
                    const last = found + token.length - 1;
                    if (starts[found] !== undefined && ends[last] !== undefined) {
                        ranges.push([starts[found], ends[last]]);
                    }
                    from = found + Math.max(1, token.length);
                    found = normalized.indexOf(token, from);
                }
            });
        });
        ranges.sort((a, b) => a[0] - b[0] || a[1] - b[1]);
        const merged = ranges.reduce((all, [start, end]) => {
            const last = all[all.length - 1];
            if (last && start <= last[1]) last[1] = Math.max(last[1], end);
            else all.push([start, end]);
            return all;
        }, []);
        let cursor = 0;
        let html = '';
        merged.forEach(([start, end]) => {
            html += escapeHtml(snippet.slice(cursor, start));
            html += `<mark>${escapeHtml(snippet.slice(start, end))}</mark>`;
            cursor = end;
        });
        return html + escapeHtml(snippet.slice(cursor));
    };

    const search = (query) => {
        const tokens = queryTokens(query);
        if (!tokens.length) {
            return [];
        }

        const ranked = index
            .concat(forumEntries)
            .map((entry) => ({ entry, score: scoreEntry(entry, tokens) }))
            .filter((row) => row.score > 0)
            .sort((a, b) => b.score - a.score);
        const hits = ranked.slice(0, MAX_RESULTS).map((row) => ({
                ...row.entry,
                snippet: makeSnippet(row.entry, tokens),
                tokens
            }));
        return { hits, total: ranked.length };
    };

    const renderResults = (query) => {
        const tokens = queryTokens(query);
        resultsEl.innerHTML = '';
        activeIndex = -1;

        if (!tokens.length) {
            lastResultCount = 0;
            statusEl.textContent = SEARCH_HINT;
            return;
        }

        if (tokens.join('').length < MIN_QUERY_LEN) {
            lastResultCount = 0;
            statusEl.textContent = 'Keep typing…';
            return;
        }

        const { hits, total } = search(query);
        lastResultCount = total;
        statusEl.textContent = total
            ? (total > hits.length
                ? `Top ${hits.length} of ${total} matches · add a word to narrow results.`
                : `${total} match${total === 1 ? '' : 'es'}`)
            : 'No matches. Try fewer words or different terms.';

        hits.forEach((hit, i) => {
            const li = document.createElement('li');
            const link = document.createElement('a');
            link.className = 'site-search-result';
            link.href = hit.href(query);
            link.dataset.index = String(i);
            link.setAttribute('aria-current', 'false');

            const top = document.createElement('div');
            top.className = 'site-search-result-top';

            const number = document.createElement('span');
            number.className = 'site-search-result-number';
            number.textContent = String(i + 1).padStart(2, '0');
            number.setAttribute('aria-hidden', 'true');

            const cat = document.createElement('span');
            cat.className = 'site-search-result-cat';
            cat.textContent = hit.category;

            const title = document.createElement('span');
            title.className = 'site-search-result-title';
            title.textContent = hit.title;

            top.appendChild(number);
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
            link.setAttribute('aria-current', i === activeIndex ? 'true' : 'false');
        });
        statusEl.textContent = `Result ${activeIndex + 1} of ${lastResultCount}: ${links[activeIndex].querySelector('.site-search-result-title')?.textContent || 'match'}. Press Enter to open.`;
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
        document.getElementById('site-search-btn')?.setAttribute('aria-expanded', 'true');
        document.body.classList.add('site-search-open');
        input.value = '';
        renderResults('');
        statusEl.textContent = 'Loading search index…';
        input.focus();

        try {
            await ensureData();
            if (!isOpen()) return;
            renderResults(input.value);
            // Search the local index immediately; live forum results can arrive later.
            const query = input.value.trim();
            if (queryTokens(query).join('').length >= MIN_QUERY_LEN) {
                loadForum(query).then(() => {
                    if (isOpen() && input.value.trim() === query) renderResults(query);
                });
            }
        } catch {
            statusEl.textContent = 'Search data failed to load. Refresh and try again.';
        }

    };

    const close = () => {
        if (!overlay || !isOpen()) {
            return;
        }
        forumLoad?.abort();
        overlay.classList.remove('is-open');
        overlay.hidden = true;
        document.body.classList.remove('site-search-open');
        document.getElementById('site-search-btn')?.setAttribute('aria-expanded', 'false');
        returnFocusTo?.focus();
    };

    const mount = () => {
        const btn = document.createElement('button');
        btn.id = 'site-search-btn';
        btn.type = 'button';
        btn.className = 'site-search-btn';
        btn.setAttribute('aria-label', 'Search entire site');
        btn.setAttribute('aria-keyshortcuts', 'Control+K Meta+K');
        btn.title = 'Search the site (Ctrl/⌘K)';
        btn.setAttribute('aria-haspopup', 'dialog');
        btn.setAttribute('aria-controls', 'site-search-dialog');
        btn.setAttribute('aria-expanded', 'false');
        btn.innerHTML =
            '<svg viewBox="0 0 24 24" width="22" height="22" stroke="currentColor" stroke-width="2" fill="none" aria-hidden="true"><circle cx="11" cy="11" r="7"></circle><line x1="21" y1="21" x2="16.65" y2="16.65"></line></svg>';

        overlay = document.createElement('div');
        overlay.id = 'site-search-overlay';
        overlay.className = 'site-search-overlay';
        overlay.hidden = true;

        const dialog = document.createElement('div');
        dialog.id = 'site-search-dialog';
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

        const closeBtn = document.createElement('button');
        closeBtn.className = 'site-search-close';
        closeBtn.type = 'button';
        closeBtn.setAttribute('aria-label', 'Close search');
        closeBtn.textContent = '×';

        const hints = document.createElement('div');
        hints.className = 'site-search-hints';
        hints.innerHTML = '<span class="hint-chip">Ctrl/⌘K Search</span><span class="hint-chip">↑↓ Navigate</span><span class="hint-chip">Enter Open</span><span class="hint-chip">Esc Close</span>';

        header.appendChild(title);
        header.appendChild(closeBtn);
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
        statusEl.setAttribute('role', 'status');
        statusEl.setAttribute('aria-live', 'polite');
        statusEl.textContent = SEARCH_HINT;

        resultsEl = document.createElement('ol');
        resultsEl.id = 'site-search-results';
        resultsEl.className = 'site-search-results';
        resultsEl.setAttribute('aria-label', 'Ranked search results');

        dialog.appendChild(header);
        dialog.appendChild(input);
        dialog.appendChild(statusEl);
        dialog.appendChild(resultsEl);
        overlay.appendChild(dialog);
        document.body.appendChild(btn);
        document.body.appendChild(overlay);

        btn.addEventListener('click', () => open());
        closeBtn.addEventListener('click', close);
        overlay.addEventListener('click', (event) => {
            if (event.target === overlay) {
                close();
            }
        });

        let forumSearchTimer;
        input.addEventListener('input', () => {
            forumEntries = [];
            forumLoad?.abort();
            window.clearTimeout(forumSearchTimer);
            const query = input.value.trim();
            if (!dataReady) {
                statusEl.textContent = 'Loading search index…';
                return;
            }
            renderResults(input.value);
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
            if (event.key === 'Enter' && activeIndex < 0 && links.length === 1) {
                event.preventDefault();
                window.location.href = links[0].href;
                return;
            }
            if (event.key === 'Enter' && activeIndex < 0 && links.length > 1) {
                event.preventDefault();
                setActiveResult(0);
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
