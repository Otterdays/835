document.addEventListener('DOMContentLoaded', () => {
    const stewardsContainer = document.getElementById('stewards-container');
    const headerTitle = document.getElementById('header-title');
    const headerParties = document.getElementById('header-parties');
    const headerDate = document.getElementById('header-date');
    const headerStatus = document.getElementById('header-status');
    const viewDescription = document.getElementById('view-description');
    const statStewards = document.getElementById('stat-stewards');
    const filterRoot = document.getElementById('steward-facility-filters');

    headerTitle.textContent = 'Shop Stewards';
    headerParties.textContent = 'Current representation contacts for Local 835 members.';
    headerDate.textContent = `${shopStewards.length} active steward profiles`;
    headerStatus.textContent = 'Leadership Contacts';
    viewDescription.textContent = 'Filter by site to find who represents your facility.';
    if (statStewards) {
        statStewards.textContent = shopStewards.length;
    }

    const locations = [...new Set(shopStewards.map((s) => s.location))].sort();
    let activeFacility = 'all';

    const urlParams = new URLSearchParams(window.location.search);
    const siteParam = urlParams.get('site');
    if (siteParam && locations.includes(siteParam)) {
        activeFacility = siteParam;
    }

    const renderFilters = () => {
        if (!filterRoot) {
            return;
        }

        const chips = [
            { id: 'all', label: 'All sites' },
            ...locations.map((loc) => ({ id: loc, label: loc }))
        ];

        filterRoot.innerHTML = '';
        chips.forEach((chip) => {
            const btn = document.createElement('button');
            btn.type = 'button';
            btn.className = 'filter-chip';
            if (chip.id === activeFacility) {
                btn.classList.add('is-active');
            }
            btn.textContent = chip.label;
            btn.setAttribute('aria-pressed', String(chip.id === activeFacility));
            btn.addEventListener('click', () => {
                activeFacility = chip.id;
                renderFilters();
                renderStewards();
            });
            filterRoot.appendChild(btn);
        });
    };

    const renderStewards = () => {
        stewardsContainer.innerHTML = '';
        const list =
            activeFacility === 'all'
                ? shopStewards
                : shopStewards.filter((s) => s.location === activeFacility);

        if (!list.length) {
            const empty = document.createElement('p');
            empty.className = 'roster-empty';
            empty.textContent = 'No stewards for this site.';
            stewardsContainer.appendChild(empty);
            return;
        }

        list.forEach((steward, index) => {
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
            role.textContent = `${steward.role} — ${steward.location}`;

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
    };

    renderFilters();
    renderStewards();
});
