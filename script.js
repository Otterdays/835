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
        if (!query) return escapeHTML(text);
        
        // Escape regex special characters
        const escapedQuery = query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
        const regex = new RegExp(`(${escapedQuery})`, 'gi');
        
        const parts = text.split(regex);
        return parts.map(part => {
            if (part.toLowerCase() === query.toLowerCase()) {
                return `<mark>${escapeHTML(part)}</mark>`;
            }
            return escapeHTML(part);
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

            const content = document.createElement('p');
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
    const linkEmployees = document.getElementById('link-employees');
    const searchContainer = document.querySelector('.search-container');
    const headerTitle = document.getElementById('header-title');
    const headerParties = document.getElementById('header-parties');
    const employeesContainer = document.getElementById('employees-container');

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
        linkEmployees.classList.remove('active');
        searchContainer.style.display = 'block';
        headerTitle.textContent = contractData.title;
        headerParties.textContent = contractData.parties;
        employeesContainer.style.display = 'none';
        container.style.display = 'flex';
        toggleMenu();
        // Reset search
        searchInput.value = '';
        renderArticles(contractData.articles);
        resultsInfo.style.display = 'none';
    });

    linkEmployees.addEventListener('click', (e) => {
        e.preventDefault();
        linkEmployees.classList.add('active');
        linkContract.classList.remove('active');
        searchContainer.style.display = 'none';
        headerTitle.textContent = "Employees";
        headerParties.textContent = "RCF Location Roster";
        container.style.display = 'none';
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
});
