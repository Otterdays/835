document.addEventListener('DOMContentLoaded', () => {
    const container = document.getElementById('contract-container');
    const containerRight = document.getElementById('contract-container-right');
    const searchInput = document.getElementById('search-input');
    const clearSearchBtn = document.getElementById('clear-search-btn');
    const noResults = document.getElementById('no-results');
    const resultsInfo = document.getElementById('results-info');
    const currentArticleLabel = document.getElementById('current-article-label');
    const quickJumpSelect = document.getElementById('quick-jump-select');
    const quickJumpContainer = document.getElementById('quick-jump-container');
    const floatingDesk = document.getElementById('floating-desk');
    const deskList = document.getElementById('desk-list');
    const contractToolbar = document.getElementById('contract-toolbar');
    const contractToolsToggle = document.getElementById('contract-tools-toggle');
    const contractToolsContent = document.getElementById('contract-tools-content');
    const splitViewBtn = document.getElementById('split-view-btn');
    const splitViewWrapper = document.getElementById('split-view-wrapper');
    const mainContainer = document.getElementById('main-container');

    const headerTitle = document.getElementById('header-title');
    const headerDate = document.getElementById('header-date');
    const headerStatus = document.getElementById('header-status');
    const viewDescription = document.getElementById('view-description');

    const statArticles = document.getElementById('stat-articles');

    const cbaArticleCount = () =>
        contractData.articles.filter((a) => !a.separateFromMainAgreement).length;
    const separatePaperSectionCount = () =>
        contractData.articles.filter((a) => a.separateFromMainAgreement).length;

    function getArticleMetaLine(article) {
        if (article.separateFromMainAgreement) {
            const i = article.separatePaperIndex;
            const t = article.separatePaperTotal;
            return t ? `Separate contract paper ${i}/${t} (not a CBA article #)` : 'Separate contract paper';
        }
        const idx = contractData.articles.findIndex((a) => a.id === article.id);
        const n = contractData.articles.slice(0, idx + 1).filter((a) => !a.separateFromMainAgreement)
            .length;
        return `CBA article ${String(n).padStart(2, '0')}`;
    }

    function deskTitle(article) {
        if (article.navLabel) {
            return article.navLabel;
        }
        return article.title.replace('ARTICLE ', 'ART ');
    }

    function buildSeparatePaperBanner() {
        const el = document.createElement('div');
        el.className = 'article-separate-paper-banner';
        el.setAttribute('role', 'region');
        el.setAttribute('aria-label', 'Separate contract paper');
        el.textContent = contractData.separatePapersIntro || '';
        return el;
    }

    let observer;
    let isSplitView = false;
    const compactContractTools = window.matchMedia('(max-width: 767px)');

    const setContractToolsExpanded = (expanded) => {
        if (!contractToolsToggle || !contractToolsContent) return;
        contractToolsToggle.setAttribute('aria-expanded', String(expanded));
        contractToolsContent.hidden = !expanded;
        contractToolbar.classList.toggle('is-collapsed', !expanded);
    };

    setContractToolsExpanded(!compactContractTools.matches);
    contractToolsToggle?.addEventListener('click', () => {
        setContractToolsExpanded(contractToolsContent.hidden);
        if (!contractToolsContent.hidden && compactContractTools.matches) searchInput.focus();
    });
    compactContractTools.addEventListener('change', (event) => {
        setContractToolsExpanded(!event.matches);
    });

    const cbaN = cbaArticleCount();
    const sepN = separatePaperSectionCount();
    headerTitle.textContent = 'Agreements & Contract';
    headerDate.textContent = `${contractData.effectiveDate} · ${contractData.termLabel} agreement`;
    headerStatus.textContent = 'Agreement reader';
    viewDescription.textContent = `Search the 2022–2026 agreement text or move through its articles. Partial articles are labeled; scanned pages show the source wording.`;
    if (statArticles) {
        statArticles.textContent = String(cbaN);
    }

    const urlParams = new URLSearchParams(window.location.search);
    if (urlParams.get('q')) {
        searchInput.value = urlParams.get('q');
    }
    if (urlParams.get('focus') === 'search' && searchInput) {
        setContractToolsExpanded(true);
        searchInput.focus();
    }

    updateContractView();

    if (urlParams.get('article')) {
        const articleId = urlParams.get('article');
        window.requestAnimationFrame(() => {
            const target = document.getElementById(`view-${articleId}`);
            target?.scrollIntoView({ behavior: 'smooth', block: 'start' });
        });
    }

    if (splitViewBtn) {
        splitViewBtn.addEventListener('click', () => {
            setSplitView(!isSplitView);
        });
    }

    searchInput.addEventListener('input', () => {
        updateContractView();
    });

    clearSearchBtn.addEventListener('click', () => {
        clearSearch(true);
    });

    if (quickJumpSelect) {
        quickJumpSelect.addEventListener('change', (event) => {
            const target = document.getElementById(event.target.value);
            if (!target) return;

            target.scrollIntoView({ behavior: 'smooth', block: 'start' });
            if (compactContractTools.matches) setContractToolsExpanded(false);
            setTimeout(() => {
                quickJumpSelect.selectedIndex = 0;
            }, 800);
        });
    }

    document.addEventListener('keydown', (event) => {
        if (event.key === '/' && !isTypingTarget(event.target)) {
            event.preventDefault();
            setContractToolsExpanded(true);
            searchInput.focus();
            searchInput.select();
            return;
        }

        if (event.key === 'Escape' && document.activeElement === searchInput && searchInput.value) {
            clearSearch(false);
        }
    });

    window.addEventListener('resize', () => {
        if (window.innerWidth <= 1024 && isSplitView) {
            setSplitView(false);
        }
    });

    function normalizeQuery(value = searchInput.value) {
        return value
            .normalize('NFKD')
            .replace(/[\u0300-\u036f]/g, '')
            .toLocaleLowerCase()
            .replace(/[^\p{L}\p{N}]+/gu, ' ')
            .trim();
    }

    function normalizeWithOffsets(value, joinPunctuation = false) {
        const source = String(value || '');
        const sourceChars = [...source];
        let normalized = '';
        const starts = [];
        const ends = [];
        let offset = 0;
        sourceChars.forEach((char, index) => {
            const start = offset;
            offset += char.length;
            if (joinPunctuation && !/[\p{L}\p{N}\s]/u.test(char) &&
                /[\p{L}\p{N}]/u.test(sourceChars[index - 1] || '') &&
                /[\p{L}\p{N}]/u.test(sourceChars[index + 1] || '')) {
                return;
            }
            const folded = char.normalize('NFKD').replace(/[\u0300-\u036f]/g, '').toLocaleLowerCase();
            [...folded].forEach((part) => {
                if (/[\p{L}\p{N}]/u.test(part)) {
                    normalized += part;
                    for (let i = 0; i < part.length; i += 1) {
                        starts.push(start);
                        ends.push(offset);
                    }
                } else if (normalized && !normalized.endsWith(' ')) {
                    normalized += ' ';
                    starts.push(start);
                    ends.push(offset);
                }
            });
        });
        if (normalized.endsWith(' ')) {
            normalized = normalized.slice(0, -1);
            starts.pop();
            ends.pop();
        }
        return { normalized, starts, ends };
    }

    function clearSearch(shouldFocusInput) {
        searchInput.value = '';
        updateContractView();
        if (shouldFocusInput) {
            searchInput.focus();
        }
    }

    function updateContractView() {
        const query = normalizeQuery();
        const filteredArticles = getFilteredArticles(query);

        renderArticles(filteredArticles, query);

        const hasResults = filteredArticles.length > 0;
        splitViewWrapper.style.display = hasResults ? 'flex' : 'none';
        noResults.style.display = hasResults ? 'none' : 'block';

        updateResultsInfo(query, filteredArticles.length);
        currentArticleLabel.textContent = hasResults
            ? filteredArticles[0].title
            : 'No article matches current search.';
        clearSearchBtn.hidden = !query;
        syncNavigationVisibility(filteredArticles.length);
    }

    function getFilteredArticles(query) {
        if (!query) {
            return contractData.articles;
        }

        const tokens = query.split(/\s+/).filter(Boolean);
        return contractData.articles.filter((article) => {
            const source = `${article.title}\n${article.content}`;
            const haystack = normalizeQuery(source);
            const joined = normalizeQuery(source.replace(/([\p{L}\p{N}])[^\p{L}\p{N}\s](?=[\p{L}\p{N}])/gu, '$1'));
            return tokens.every((token) => haystack.includes(token) || joined.includes(token));
        });
    }

    function updateResultsInfo(query, count) {
        const total = contractData.articles.length;
        const itemLabel = count === 1 ? 'entry' : 'entries';
        const verb = count === 1 ? 'matches' : 'match';

        if (query) {
            resultsInfo.textContent = `${count} of ${total} ${itemLabel} ${verb} all words in "${searchInput.value.trim()}"`;
            return;
        }

        resultsInfo.textContent = `All ${total} contract entries ready (CBA + separate papers)`;
    }

    function syncNavigationVisibility(articleCount) {
        const showNavigation = articleCount > 1;
        quickJumpContainer.hidden = !showNavigation;
        floatingDesk.classList.toggle('visible', showNavigation && !isSplitView);
    }

    function highlightText(text, query) {
        if (!text) return '';

        if (!query) {
            return escapeHTML(text).replace(/\n/g, '<br>');
        }

        const source = String(text);
        const tokens = query.split(/\s+/).filter(Boolean);
        const forms = [normalizeWithOffsets(source), normalizeWithOffsets(source, true)];
        const ranges = [];
        forms.forEach(({ normalized, starts, ends }) => {
            tokens.forEach((token) => {
                let at = normalized.indexOf(token);
                while (at >= 0) {
                    const last = at + token.length - 1;
                    if (starts[at] !== undefined && ends[last] !== undefined) ranges.push([starts[at], ends[last]]);
                    at = normalized.indexOf(token, at + Math.max(1, token.length));
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
            html += escapeHTML(source.slice(cursor, start)).replace(/\n/g, '<br>');
            html += `<mark>${escapeHTML(source.slice(start, end))}</mark>`;
            cursor = end;
        });
        return html + escapeHTML(source.slice(cursor)).replace(/\n/g, '<br>');
    }

    function escapeHTML(value) {
        return value.replace(/[&<>'"]/g, (char) => ({
            '&': '&amp;',
            '<': '&lt;',
            '>': '&gt;',
            "'": '&#39;',
            '"': '&quot;'
        }[char] || char));
    }

    function renderArticles(articles, query = '') {
        container.innerHTML = '';
        containerRight.innerHTML = '';

        articles.forEach((article, index) => {
            const isFirstSeparateInList = Boolean(
                article.separateFromMainAgreement &&
                contractData.separatePapersIntro &&
                (index === 0 || !articles[index - 1].separateFromMainAgreement)
            );
            if (isFirstSeparateInList) {
                const banner = buildSeparatePaperBanner();
                container.appendChild(banner);
                if (isSplitView) {
                    containerRight.appendChild(banner.cloneNode(true));
                }
            }

            const card = buildArticleCard(article, index, query);
            container.appendChild(card);

            if (isSplitView) {
                const rightCard = card.cloneNode(true);
                rightCard.id = `view-right-${article.id}`;
                rightCard.classList.remove('active-article');
                containerRight.appendChild(rightCard);
            }
        });

        updateDesk(articles);

        if (articles.length > 0) {
            setupObserver();
        } else if (observer) {
            observer.disconnect();
        }
    }

    function buildArticleCard(article, animationIndex, query) {
        const card = document.createElement('article');
        card.className = 'article-card';
        if (article.separateFromMainAgreement) {
            card.classList.add('article-card--separate-paper');
        }
        card.id = `view-${article.id}`;
        card.dataset.articleId = article.id;
        card.dataset.articleTitle = article.title;
        card.style.animationDelay = `${animationIndex * 0.04}s`;

        const meta = document.createElement('div');
        meta.className = 'article-meta';
        meta.textContent = getArticleMetaLine(article);

        const title = document.createElement('h2');
        title.className = 'article-title';
        title.innerHTML = highlightText(article.title, query);

        const content = document.createElement('div');
        content.className = 'article-content';
        content.innerHTML = highlightText(article.content, query);

        card.appendChild(meta);
        card.appendChild(title);
        card.appendChild(content);

        return card;
    }

    function updateDesk(articles) {
        deskList.innerHTML = '';
        quickJumpSelect.innerHTML = '<option value="" disabled selected>Jump to Article...</option>';

        articles.forEach((article) => {
            const item = document.createElement('li');
            item.className = 'desk-item';
            item.textContent = deskTitle(article);
            item.dataset.target = `view-${article.id}`;
            item.addEventListener('click', () => scrollToArticle(`view-${article.id}`));
            deskList.appendChild(item);

            const option = document.createElement('option');
            option.value = `view-${article.id}`;
            option.textContent = deskTitle(article);
            quickJumpSelect.appendChild(option);
        });
    }

    function scrollToArticle(targetId) {
        const target = document.getElementById(targetId);
        if (!target) return;

        target.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }

    function setupObserver() {
        if (observer) {
            observer.disconnect();
        }

        observer = new IntersectionObserver((entries) => {
            entries.forEach((entry) => {
                if (!entry.isIntersecting) {
                    return;
                }

                const activeId = entry.target.dataset.articleId;
                const activeTitle = entry.target.dataset.articleTitle;

                document.querySelectorAll('#contract-container .article-card').forEach((card) => {
                    card.classList.toggle('active-article', card.dataset.articleId === activeId);
                });

                document.querySelectorAll('#contract-container-right .article-card').forEach((card) => {
                    card.classList.toggle('active-article', card.id === `view-right-${activeId}`);
                });

                document.querySelectorAll('.desk-item').forEach((item) => {
                    const isActive = item.dataset.target === `view-${activeId}`;
                    item.classList.toggle('active', isActive);
                    if (isActive) {
                        item.scrollIntoView({ block: 'nearest' });
                    }
                });

                currentArticleLabel.textContent = activeTitle;
            });
        }, {
            threshold: 0.25,
            root: isSplitView ? container : null,
            rootMargin: '-10% 0px -55% 0px'
        });

        document.querySelectorAll('#contract-container .article-card').forEach((card) => observer.observe(card));
    }

    function setSplitView(nextState) {
        isSplitView = Boolean(nextState) && window.innerWidth > 1024;

        splitViewBtn.classList.toggle('active', isSplitView);
        mainContainer.classList.toggle('split-mode', isSplitView);
        splitViewWrapper.classList.toggle('is-split', isSplitView);

        updateContractView();
    }

    function isTypingTarget(target) {
        if (!target) return false;

        const tagName = target.tagName;
        return tagName === 'INPUT' || tagName === 'TEXTAREA' || tagName === 'SELECT' || target.isContentEditable;
    }
});
