document.addEventListener('DOMContentLoaded', () => {
    // Populate header
    document.getElementById('header-title').textContent = contractData.title;
    document.getElementById('header-parties').textContent = contractData.parties;
    document.getElementById('header-date').textContent = contractData.effectiveDate;

    const container = document.getElementById('contract-container');
    const searchInput = document.getElementById('search-input');
    const noResults = document.getElementById('no-results');
    const resultsInfo = document.getElementById('results-info');

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
            container.style.display = 'none';
        } else {
            noResults.style.display = 'none';
            container.style.display = 'flex';
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

    function renderArticles(articles, query = '') {
        container.innerHTML = '';
        
        articles.forEach((article, index) => {
            const card = document.createElement('div');
            card.className = 'article-card';
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
        });

        // Ensure container is visible if articles exist
        if (articles.length > 0) {
            container.style.display = 'flex';
            noResults.style.display = 'none';
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
        container.style.display = 'flex';
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
        container.style.display = 'none';
        employeesContainer.style.display = 'none';
        stewardsContainer.style.display = 'none';
        resultsInfo.style.display = 'none';
        noResults.style.display = 'none';
        galleryContainer.style.display = 'flex';
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
        container.style.display = 'none';
        employeesContainer.style.display = 'none';
        galleryContainer.style.display = 'none';
        resultsInfo.style.display = 'none';
        noResults.style.display = 'none';
        stewardsContainer.style.display = 'flex';
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
        container.style.display = 'none';
        galleryContainer.style.display = 'none';
        stewardsContainer.style.display = 'none';
        resultsInfo.style.display = 'none';
        noResults.style.display = 'none';
        employeesContainer.style.display = 'flex';
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
