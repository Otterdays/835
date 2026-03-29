document.addEventListener('DOMContentLoaded', () => {
    // Populate header
    document.getElementById('header-title').textContent = contractData.title;
    document.getElementById('header-parties').textContent = contractData.parties;
    document.getElementById('header-date').textContent = contractData.effectiveDate;

    const container = document.getElementById('contract-container');
    const searchInput = document.getElementById('search-input');
    const noResults = document.getElementById('no-results');
    const resultsInfo = document.getElementById('results-info');
    
    // Split View Elements
    const splitViewBtn = document.getElementById('split-view-btn');
    const splitViewWrapper = document.getElementById('split-view-wrapper');
    const containerRight = document.getElementById('contract-container-right');
    const mainContainer = document.getElementById('main-container');
    let isSplitView = false;
    
    if (splitViewBtn) {
        splitViewBtn.addEventListener('click', () => {
            isSplitView = !isSplitView;
            splitViewBtn.classList.toggle('active', isSplitView);
            mainContainer.classList.toggle('split-mode', isSplitView);
            splitViewWrapper.classList.toggle('is-split', isSplitView);
            
            if (isSplitView) {
                if(floatingDesk) floatingDesk.style.opacity = '0';
                if(floatingDesk) floatingDesk.style.pointerEvents = 'none';
            } else {
                if(floatingDesk) floatingDesk.style.opacity = '1';
                if(floatingDesk) floatingDesk.style.pointerEvents = 'auto';
            }
            
            // Re-render based on current search
            const query = searchInput.value.toLowerCase().trim();
            const filtered = query ? contractData.articles.filter(article => 
                article.title.toLowerCase().includes(query) || 
                article.content.toLowerCase().includes(query)
            ) : contractData.articles;
            
            renderArticles(filtered, query);
        });
    }
    
    // Floating Desk Elements
    const floatingDesk = document.getElementById('floating-desk');
    const deskList = document.getElementById('desk-list');
    
    // Quick Jump Elements
    const quickJumpSelect = document.getElementById('quick-jump-select');
    const quickJumpContainer = document.getElementById('quick-jump-container');
    
    let observer;

    // Initial render
    renderArticles(contractData.articles);

    // Search functionality
    searchInput.addEventListener('input', (e) => {
        const query = e.target.value.toLowerCase().trim();
        
        if (!query) {
            renderArticles(contractData.articles);
            resultsInfo.style.display = 'none';
            return;
        }

        const filtered = contractData.articles.filter(article => 
            article.title.toLowerCase().includes(query) || 
            article.content.toLowerCase().includes(query)
        );

        renderArticles(filtered, query);

        resultsInfo.textContent = `Found ${filtered.length} matching article(s)`;
        resultsInfo.style.display = 'block';

        if (filtered.length === 0) {
            noResults.style.display = 'block';
            splitViewWrapper.style.display = 'none';
        } else {
            noResults.style.display = 'none';
            splitViewWrapper.style.display = 'flex';
        }
    });

    function highlightText(text, query) {
        if (!text) return '';
        const escapedText = escapeHTML(text).replace(/\n/g, '<br>');
        if (!query) return escapedText;
        
        // Escape regex special characters
        const escapedQuery = query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
        const regex = new RegExp(`(${escapedQuery})`, 'gi');
        
        // When highlighting, we need to be careful not to break the <br> tags we just inserted
        // or highlight parts of them. A simpler way: split by query on the original text,
        // escape/newline-replace the non-matching parts, and wrap matching parts in <mark>.
        
        const parts = text.split(regex);
        return parts.map(part => {
            if (part.toLowerCase() === query.toLowerCase()) {
                return `<mark>${escapeHTML(part)}</mark>`;
            }
            return escapeHTML(part).replace(/\n/g, '<br>');
        }).join('');
    }

    function escapeHTML(str) {
        return str.replace(/[&<>'"]/g, 
            tag => ({
                '&': '&amp;',
                '<': '&lt;',
                '>': '&gt;',
                "'": '&#39;',
                '"': '&quot;'
            }[tag] || tag)
        );
    }

    // Floating Desk Logic

    function updateDesk(articles) {
        if (!deskList || !floatingDesk) return;
        deskList.innerHTML = '';
        
        // Reset and populate Quick Jump Select (Mobile)
        if (quickJumpSelect) {
            quickJumpSelect.innerHTML = '<option value="" disabled selected>Jump to Article...</option>';
        }

        articles.forEach(article => {
            // Desk Item (Desktop)
            const li = document.createElement('li');
            li.className = 'desk-item';
            li.textContent = article.title.replace('ARTICLE ', 'ART ');
            li.dataset.target = `view-${article.id}`;
            li.onclick = () => {
                const target = document.getElementById(`view-${article.id}`);
                if (target) {
                    target.scrollIntoView({ behavior: 'smooth', block: 'center' });
                }
            };
            deskList.appendChild(li);

            // Select Option (Mobile)
            if (quickJumpSelect) {
                const option = document.createElement('option');
                option.value = `view-${article.id}`;
                option.textContent = article.title;
                quickJumpSelect.appendChild(option);
            }
        });
        
        if (articles.length > 1) {
            floatingDesk.classList.add('visible');
            if (quickJumpContainer) quickJumpContainer.style.display = ''; // Reset to CSS default (block on mobile)
        } else {
            floatingDesk.classList.remove('visible');
            if (quickJumpContainer) quickJumpContainer.style.display = 'none';
        }
    }

    if (quickJumpSelect) {
        quickJumpSelect.addEventListener('change', (e) => {
            const targetId = e.target.value;
            const target = document.getElementById(targetId);
            if (target) {
                target.scrollIntoView({ behavior: 'smooth', block: 'center' });
                // Briefly reset the select after a delay or just leave it
                setTimeout(() => { quickJumpSelect.selectedIndex = 0; }, 1000);
            }
        });
    }

    function setupObserver() {
        if (observer) observer.disconnect();

        observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    // Update classes on cards
                    document.querySelectorAll('.article-card').forEach(c => c.classList.remove('active-article'));
                    entry.target.classList.add('active-article');

                    // Update desk active state
                    document.querySelectorAll('.desk-item').forEach(item => {
                        item.classList.toggle('active', item.dataset.target === entry.target.id);
                        if (item.classList.contains('active')) {
                            item.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
                        }
                    });
                }
            });
        }, {
            threshold: 0.3,
            rootMargin: '-10% 0px -40% 0px'
        });

        document.querySelectorAll('.article-card').forEach(card => observer.observe(card));
    }

    function renderArticles(articles, query = '') {
        container.innerHTML = '';
        if (containerRight) containerRight.innerHTML = '';
        
        articles.forEach((article, index) => {
            const card = document.createElement('div');
            card.className = 'article-card';
            card.id = `view-${article.id}`; // Match the ID for observer
            card.style.animationDelay = `${index * 0.05}s`;

            const title = document.createElement('h2');
            title.className = 'article-title';
            title.innerHTML = highlightText(article.title, query);

            const content = document.createElement('div');
            content.className = 'article-content';
            content.innerHTML = highlightText(article.content, query);

            card.appendChild(title);
            card.appendChild(content);
            container.appendChild(card);
            
            if (isSplitView && containerRight) {
                const rightCard = card.cloneNode(true);
                rightCard.id = `view-right-${article.id}`;
                containerRight.appendChild(rightCard);
            }
        });

        // Ensure container is visible if articles exist
        if (articles.length > 0) {
            splitViewWrapper.style.display = 'flex';
            noResults.style.display = 'none';
            setupObserver(); // Re-setup observer after re-render
            updateDesk(articles);
        } else {
            if (floatingDesk) floatingDesk.classList.remove('visible');
        }
    }

    // Sidebar and Navigation Logic
    const menuBtn = document.getElementById('menu-btn');
    const sidePanel = document.getElementById('side-panel');
    const overlay = document.getElementById('panel-overlay');
    const closeBtn = document.getElementById('close-btn');
    const linkContract = document.getElementById('link-contract');
    const linkGallery = document.getElementById('link-gallery');
    const linkStewards = document.getElementById('link-stewards');
    const linkEmployees = document.getElementById('link-employees');
    const searchContainer = document.querySelector('.search-container');
    const headerTitle = document.getElementById('header-title');
    const headerParties = document.getElementById('header-parties');
    const employeesContainer = document.getElementById('employees-container');
    const stewardsContainer = document.getElementById('stewards-container');
    const galleryContainer = document.getElementById('gallery-container');

    function toggleMenu() {
        sidePanel.classList.toggle('open');
        overlay.classList.toggle('active');
    }

    menuBtn.addEventListener('click', toggleMenu);
    closeBtn.addEventListener('click', toggleMenu);
    overlay.addEventListener('click', toggleMenu);

    linkContract.addEventListener('click', (e) => {
        e.preventDefault();
        linkContract.classList.add('active');
        linkGallery.classList.remove('active');
        linkStewards.classList.remove('active');
        linkEmployees.classList.remove('active');
        searchContainer.style.display = 'block';
        headerTitle.textContent = contractData.title;
        headerParties.textContent = contractData.parties;
        employeesContainer.style.display = 'none';
        stewardsContainer.style.display = 'none';
        galleryContainer.style.display = 'none';
        splitViewWrapper.style.display = 'flex';
        if (splitViewBtn) splitViewBtn.style.display = 'flex';
        floatingDesk.classList.add('visible');
        if (quickJumpContainer) quickJumpContainer.style.display = ''; 
        toggleMenu();
        // Reset search
        searchInput.value = '';
        renderArticles(contractData.articles);
        resultsInfo.style.display = 'none';
    });

    linkGallery.addEventListener('click', (e) => {
        e.preventDefault();
        linkGallery.classList.add('active');
        linkContract.classList.remove('active');
        linkStewards.classList.remove('active');
        linkEmployees.classList.remove('active');
        searchContainer.style.display = 'none';
        headerTitle.textContent = "Scanned Pages";
        headerParties.textContent = "Original Contract Documents";
        splitViewWrapper.style.display = 'none';
        if (splitViewBtn) splitViewBtn.style.display = 'none';
        employeesContainer.style.display = 'none';
        stewardsContainer.style.display = 'none';
        resultsInfo.style.display = 'none';
        noResults.style.display = 'none';
        galleryContainer.style.display = 'flex';
        floatingDesk.classList.remove('visible');
        if (quickJumpContainer) quickJumpContainer.style.display = 'none';
        renderGallery(contractImages);
        toggleMenu();
    });

    linkStewards.addEventListener('click', (e) => {
        e.preventDefault();
        linkStewards.classList.add('active');
        linkContract.classList.remove('active');
        linkGallery.classList.remove('active');
        linkEmployees.classList.remove('active');
        searchContainer.style.display = 'none';
        headerTitle.textContent = "Shop Stewards";
        headerParties.textContent = "Your Union Leadership";
        splitViewWrapper.style.display = 'none';
        if (splitViewBtn) splitViewBtn.style.display = 'none';
        employeesContainer.style.display = 'none';
        galleryContainer.style.display = 'none';
        resultsInfo.style.display = 'none';
        noResults.style.display = 'none';
        stewardsContainer.style.display = 'flex';
        floatingDesk.classList.remove('visible');
        if (quickJumpContainer) quickJumpContainer.style.display = 'none';
        renderStewards(shopStewards);
        toggleMenu();
    });

    linkEmployees.addEventListener('click', (e) => {
        e.preventDefault();
        linkEmployees.classList.add('active');
        linkContract.classList.remove('active');
        linkGallery.classList.remove('active');
        linkStewards.classList.remove('active');
        searchContainer.style.display = 'none';
        headerTitle.textContent = "Employees";
        headerParties.textContent = "RCF Location Roster";
        splitViewWrapper.style.display = 'none';
        if (splitViewBtn) splitViewBtn.style.display = 'none';
        galleryContainer.style.display = 'none';
        stewardsContainer.style.display = 'none';
        resultsInfo.style.display = 'none';
        noResults.style.display = 'none';
        employeesContainer.style.display = 'flex';
        floatingDesk.classList.remove('visible');
        if (quickJumpContainer) quickJumpContainer.style.display = 'none';
        renderEmployees(employeesData);
        toggleMenu();
    });

    function renderEmployees(employees) {
        employeesContainer.innerHTML = '';
        if (employees.length === 0) {
            employeesContainer.innerHTML = '<div class="no-results" style="display:block;">No employees found.</div>';
            return;
        }
        employees.forEach((emp, index) => {
            const card = document.createElement('div');
            card.className = 'employee-card';
            card.style.animationDelay = `${index * 0.05}s`;
            
            const name = document.createElement('div');
            name.className = 'employee-name';
            name.textContent = emp.name;
            
            const loc = document.createElement('div');
            loc.className = 'employee-location';
            loc.textContent = emp.location;
            
            card.appendChild(name);
            card.appendChild(loc);
            employeesContainer.appendChild(card);
        });
    }

    function renderStewards(stewards) {
        stewardsContainer.innerHTML = '';
        stewards.forEach((steward, index) => {
            const card = document.createElement('div');
            card.className = 'steward-card';
            card.style.animationDelay = `${index * 0.1}s`;

            const img = document.createElement('img');
            img.src = steward.image;
            img.className = 'steward-img';

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
            card.appendChild(img);
            card.appendChild(info);
            stewardsContainer.appendChild(card);
        });
    }

    function renderGallery(images) {
        galleryContainer.innerHTML = '';
        images.forEach((img, index) => {
            const item = document.createElement('div');
            item.className = 'gallery-item';
            item.style.animationDelay = `${index * 0.1}s`;

            const image = document.createElement('img');
            image.src = img.url;
            image.alt = img.caption;
            image.className = 'gallery-img';

            const caption = document.createElement('div');
            caption.className = 'gallery-caption';
            caption.textContent = img.caption;

            item.appendChild(image);
            item.appendChild(caption);
            galleryContainer.appendChild(item);
            
            // Simple click-to-view-full-size logic
            image.addEventListener('click', () => {
                window.open(img.url, '_blank');
            });
        });
    }
});
