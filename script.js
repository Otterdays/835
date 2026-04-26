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

    const menuBtn = document.getElementById('menu-btn');
    const sidePanel = document.getElementById('side-panel');
    const overlay = document.getElementById('panel-overlay');
    const closeBtn = document.getElementById('close-btn');
    const linkContract = document.getElementById('link-contract');
    const linkGallery = document.getElementById('link-gallery');
    const linkStewards = document.getElementById('link-stewards');
    const linkEmployees = document.getElementById('link-employees');

    const headerTitle = document.getElementById('header-title');
    const headerParties = document.getElementById('header-parties');
    const headerDate = document.getElementById('header-date');
    const headerStatus = document.getElementById('header-status');
    const viewDescription = document.getElementById('view-description');

    const statArticles = document.getElementById('stat-articles');
    const statPages = document.getElementById('stat-pages');
    const statStewards = document.getElementById('stat-stewards');
    const statEmployees = document.getElementById('stat-employees');

    const employeesContainer = document.getElementById('employees-container');
    const stewardsContainer = document.getElementById('stewards-container');
    const galleryContainer = document.getElementById('gallery-container');

    const imageModal = document.getElementById('image-modal');
    const imageModalImg = document.getElementById('image-modal-img');
    const imageModalCaption = document.getElementById('image-modal-caption');
    const imageModalClose = document.getElementById('image-modal-close');

    const articleOrderMap = new Map(
        contractData.articles.map((article, index) => [article.id, String(index + 1).padStart(2, '0')])
    );

    const viewMeta = {
        contract: {
            title: 'Operating Engineers Local 835 Agreement',
            parties: 'U.S. Facilities, Inc. and International Union of Operating Engineers, Local 835, AFL-CIO.',
            date: contractData.effectiveDate,
            status: 'Active Agreement',
            description: 'Search clauses, compare article language, and move through sections without losing place.'
        },
        gallery: {
            title: 'Scanned Pages',
            parties: 'CBA pages plus facility tool-control and related policy scans.',
            date: `${contractImages.length} scans`,
            status: 'Scanned Archive',
            description: 'Open full-page scans in the lightbox. Policies are grouped under section headings below.'
        },
        stewards: {
            title: 'Shop Stewards',
            parties: 'Current representation contacts for Local 835 members.',
            date: `${shopStewards.length} active steward profiles`,
            status: 'Leadership Contacts',
            description: 'Review site leadership and coverage locations in single roster.'
        },
        employees: {
            title: 'Employees',
            parties: 'Current RCF employee roster for quick location reference.',
            date: `${employeesData.length} employees listed`,
            status: 'RCF Roster',
            description: 'Fast internal lookup for names and location assignments.'
        }
    };

    let observer;
    let isSplitView = false;
    let activeView = 'contract';

    statArticles.textContent = contractData.articles.length;
    statPages.textContent = contractImages.length;
    statStewards.textContent = shopStewards.length;
    statEmployees.textContent = employeesData.length;

    applyViewMeta(activeView);
    renderEmployees(employeesData);
    renderStewards(shopStewards);
    renderGallery(contractImages);
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

    menuBtn.addEventListener('click', () => setMenuState(!sidePanel.classList.contains('open')));
    closeBtn.addEventListener('click', () => setMenuState(false));
    overlay.addEventListener('click', () => setMenuState(false));

    linkContract.addEventListener('click', (event) => {
        event.preventDefault();
        setView('contract');
    });

    linkGallery.addEventListener('click', (event) => {
        event.preventDefault();
        setView('gallery');
    });

    linkStewards.addEventListener('click', (event) => {
        event.preventDefault();
        setView('stewards');
    });

    linkEmployees.addEventListener('click', (event) => {
        event.preventDefault();
        setView('employees');
    });

    imageModalClose.addEventListener('click', closeImageModal);
    imageModal.addEventListener('click', (event) => {
        if (event.target === imageModal) {
            closeImageModal();
        }
    });

    document.addEventListener('keydown', (event) => {
        if (event.key === '/' && activeView === 'contract' && !isTypingTarget(event.target)) {
            event.preventDefault();
            searchInput.focus();
            searchInput.select();
            return;
        }

        if (event.key !== 'Escape') {
            return;
        }

        if (imageModal.classList.contains('is-open')) {
            closeImageModal();
            return;
        }

        if (sidePanel.classList.contains('open')) {
            setMenuState(false);
            return;
        }

        if (activeView === 'contract' && searchInput.value) {
            clearSearch(false);
        }
    });

    window.addEventListener('resize', () => {
        if (window.innerWidth <= 1024 && isSplitView) {
            setSplitView(false);
        }
    });

    function applyViewMeta(view) {
        const meta = viewMeta[view];
        headerTitle.textContent = meta.title;
        headerParties.textContent = meta.parties;
        headerDate.textContent = meta.date;
        headerStatus.textContent = meta.status;
        viewDescription.textContent = meta.description;
    }

    function setView(view) {
        activeView = view;
        applyViewMeta(view);
        setActiveLink(view);
        setMenuState(false);

        const isContractView = view === 'contract';
        contractToolbar.hidden = !isContractView;
        splitViewWrapper.style.display = isContractView ? 'flex' : 'none';
        if (splitViewBtn) {
            splitViewBtn.hidden = !isContractView;
        }

        employeesContainer.style.display = view === 'employees' ? 'flex' : 'none';
        stewardsContainer.style.display = view === 'stewards' ? 'flex' : 'none';
        galleryContainer.style.display = view === 'gallery' ? 'flex' : 'none';
        noResults.style.display = 'none';

        if (view === 'contract') {
            updateContractView();
            return;
        }

        floatingDesk.classList.remove('visible');
        currentArticleLabel.textContent = viewMeta[view].description;
    }

    function setActiveLink(view) {
        linkContract.classList.toggle('active', view === 'contract');
        linkGallery.classList.toggle('active', view === 'gallery');
        linkStewards.classList.toggle('active', view === 'stewards');
        linkEmployees.classList.toggle('active', view === 'employees');
    }

    function setMenuState(isOpen) {
        sidePanel.classList.toggle('open', isOpen);
        overlay.classList.toggle('active', isOpen);
        menuBtn.setAttribute('aria-expanded', String(isOpen));
    }

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
        currentArticleLabel.textContent = hasResults ? filteredArticles[0].title : 'No article matches current search.';
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
        const articleLabel = count === 1 ? 'article' : 'articles';
        const verb = count === 1 ? 'matches' : 'match';

        if (query) {
            resultsInfo.textContent = `${count} of ${total} ${articleLabel} ${verb} "${query}"`;
            return;
        }

        resultsInfo.textContent = `All ${total} articles ready`;
    }

    function syncNavigationVisibility(articleCount) {
        const showNavigation = activeView === 'contract' && articleCount > 1;
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
        card.id = `view-${article.id}`;
        card.dataset.articleId = article.id;
        card.dataset.articleTitle = article.title;
        card.style.animationDelay = `${animationIndex * 0.04}s`;

        const meta = document.createElement('div');
        meta.className = 'article-meta';
        meta.textContent = `Article ${articleOrderMap.get(article.id)}`;

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
            item.textContent = article.title.replace('ARTICLE ', 'ART ');
            item.dataset.target = `view-${article.id}`;
            item.addEventListener('click', () => scrollToArticle(`view-${article.id}`));
            deskList.appendChild(item);

            const option = document.createElement('option');
            option.value = `view-${article.id}`;
            option.textContent = article.title;
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
        isSplitView = Boolean(nextState) && activeView === 'contract' && window.innerWidth > 1024;

        splitViewBtn.classList.toggle('active', isSplitView);
        mainContainer.classList.toggle('split-mode', isSplitView);
        splitViewWrapper.classList.toggle('is-split', isSplitView);

        if (activeView === 'contract') {
            updateContractView();
        }
    }

    function renderEmployees(employees) {
        employeesContainer.innerHTML = '';

        if (employees.length === 0) {
            employeesContainer.innerHTML = '<div class="no-results" style="display:block;">No employees found.</div>';
            return;
        }

        employees.forEach((employee, index) => {
            const card = document.createElement('div');
            card.className = 'employee-card';
            card.style.animationDelay = `${index * 0.05}s`;

            const name = document.createElement('div');
            name.className = 'employee-name';
            name.textContent = employee.name;

            const location = document.createElement('div');
            location.className = 'employee-location';
            location.textContent = employee.location;

            card.appendChild(name);
            card.appendChild(location);
            employeesContainer.appendChild(card);
        });
    }

    function renderStewards(stewards) {
        stewardsContainer.innerHTML = '';

        stewards.forEach((steward, index) => {
            const card = document.createElement('div');
            card.className = 'steward-card';
            card.style.animationDelay = `${index * 0.08}s`;

            const image = document.createElement('img');
            image.src = steward.image;
            image.alt = `${steward.name} portrait`;
            image.className = 'steward-img';

            const info = document.createElement('div');
            info.className = 'steward-info';

            const name = document.createElement('div');
            name.className = 'steward-name';
            name.textContent = steward.name;

            const role = document.createElement('div');
            role.className = 'steward-role';
            role.textContent = `${steward.role} - ${steward.location}`;

            const tagline = document.createElement('div');
            tagline.className = 'steward-tagline';
            tagline.textContent = steward.tagline;

            info.appendChild(name);
            info.appendChild(role);
            info.appendChild(tagline);
            card.appendChild(image);
            card.appendChild(info);
            stewardsContainer.appendChild(card);
        });
    }

    function renderGallery(images) {
        galleryContainer.innerHTML = '';
        let lastSection = null;

        images.forEach((imageData, index) => {
            if (imageData.section && imageData.section !== lastSection) {
                const sectionEl = document.createElement('h3');
                sectionEl.className = 'gallery-section-title';
                sectionEl.textContent = imageData.section;
                galleryContainer.appendChild(sectionEl);
                lastSection = imageData.section;
            }

            const item = document.createElement('div');
            item.className = 'gallery-item';
            item.style.animationDelay = `${index * 0.08}s`;

            const image = document.createElement('img');
            image.src = imageData.url;
            image.alt = imageData.caption;
            image.className = 'gallery-img';
            image.addEventListener('click', () => openImageModal(imageData.url, imageData.caption));

            const caption = document.createElement('div');
            caption.className = 'gallery-caption';
            caption.textContent = imageData.caption;

            item.appendChild(image);
            item.appendChild(caption);
            galleryContainer.appendChild(item);
        });
    }

    function openImageModal(src, caption) {
        imageModalImg.src = src;
        imageModalImg.alt = caption;
        imageModalCaption.textContent = caption;
        imageModal.classList.add('is-open');
        imageModal.setAttribute('aria-hidden', 'false');
        document.body.style.overflow = 'hidden';
    }

    function closeImageModal() {
        imageModal.classList.remove('is-open');
        imageModal.setAttribute('aria-hidden', 'true');
        imageModalImg.src = '';
        imageModalImg.alt = '';
        document.body.style.overflow = '';
    }

    function isTypingTarget(target) {
        if (!target) return false;

        const tagName = target.tagName;
        return tagName === 'INPUT' || tagName === 'TEXTAREA' || tagName === 'SELECT' || target.isContentEditable;
    }
});
