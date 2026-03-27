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
});
