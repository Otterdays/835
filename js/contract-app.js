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
    const splitViewBtn = document.getElementById('split-view-btn');
    const splitViewWrapper = document.getElementById('split-view-wrapper');
    const mainContainer = document.getElementById('main-container');

    const headerTitle = document.getElementById('header-title');
    const headerParties = document.getElementById('header-parties');
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

    const cbaN = cbaArticleCount();
    const sepN = separatePaperSectionCount();
    headerTitle.textContent = '2022–2026 Agreement';
    headerParties.textContent = 'U.S. Facilities, Inc. and International Union of Operating Engineers, Local 835, AFL-CIO.';
    headerDate.textContent = `${contractData.effectiveDate} · ${contractData.termLabel} term · ${cbaN} CBA articles`;
    headerStatus.textContent = 'Current CBA (2022–26)';
    viewDescription.textContent = 'Master agreement: Articles I–XIX. Use the search bar to find specific clauses or terms. Scanned pages and facility-specific tool policies are located in their respective sections.';
    if (statArticles) {
        statArticles.textContent = String(cbaN);
    }

    updateContractView();

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
            setTimeout(() => {
                quickJumpSelect.selectedIndex = 0;
            }, 800);
        });
    }

    document.addEventListener('keydown', (event) => {
        if (event.key === '/' && !isTypingTarget(event.target)) {
            event.preventDefault();
            searchInput.focus();
            searchInput.select();
            return;
        }

        if (event.key === 'Escape' && searchInput.value) {
            clearSearch(false);
        }
    });

    window.addEventListener('resize', () => {
        if (window.innerWidth <= 1024 && isSplitView) {
            setSplitView(false);
        }
    });

    function normalizeQuery(value = searchInput.value) {
        return value.toLowerCase().trim();
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

        return contractData.articles.filter((article) =>
            article.title.toLowerCase().includes(query) ||
            article.content.toLowerCase().includes(query)
        );
    }

    function updateResultsInfo(query, count) {
        const total = contractData.articles.length;
        const sectionLabel = count === 1 ? 'section' : 'sections';
        const verb = count === 1 ? 'matches' : 'match';

        if (query) {
            resultsInfo.textContent = `${count} of ${total} ${sectionLabel} ${verb} "${query}"`;
            return;
        }

        resultsInfo.textContent = `All ${total} sections ready (CBA + separate paper parts)`;
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

        const escapedQuery = query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
        const regex = new RegExp(`(${escapedQuery})`, 'gi');

        return text.split(regex).map((part) => {
            if (part.toLowerCase() === query.toLowerCase()) {
                return `<mark>${escapeHTML(part)}</mark>`;
            }
            return escapeHTML(part).replace(/\n/g, '<br>');
        }).join('');
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
