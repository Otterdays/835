document.addEventListener('DOMContentLoaded', () => {
    const employeesContainer = document.getElementById('employees-container');
    const headerTitle = document.getElementById('header-title');
    const headerParties = document.getElementById('header-parties');
    const headerDate = document.getElementById('header-date');
    const headerStatus = document.getElementById('header-status');
    const viewDescription = document.getElementById('view-description');
    const statEmployees = document.getElementById('stat-employees');
    const searchInput = document.getElementById('roster-search');
    const filterRoot = document.getElementById('roster-facility-filters');
    const resultsInfo = document.getElementById('roster-results-info');

    headerTitle.textContent = 'Site Roster';
    headerParties.textContent = 'Employee directory across CFCF, RCF, and PICC.';
    headerDate.textContent = `${employeesData.length} total staff members`;
    headerStatus.textContent = 'Facility Directory';
    viewDescription.textContent = 'Search by name or role, or filter by facility.';
    if (statEmployees) {
        statEmployees.textContent = employeesData.length;
    }

    const locations = ['RCF', 'CFCF', 'PICC'];
    let activeFacility = 'all';
    let searchQuery = '';

    const normalize = (value) => (value || '').toLowerCase().trim();

    const urlParams = new URLSearchParams(window.location.search);
    if (urlParams.get('q')) {
        searchQuery = normalize(urlParams.get('q'));
        if (searchInput) {
            searchInput.value = urlParams.get('q');
        }
    }

    const matchesFilter = (employee) => {
        if (activeFacility !== 'all' && employee.location !== activeFacility) {
            return false;
        }
        if (!searchQuery) {
            return true;
        }
        const haystack = `${employee.name} ${employee.role} ${employee.location}`.toLowerCase();
        return haystack.includes(searchQuery);
    };

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
                renderRoster();
            });
            filterRoot.appendChild(btn);
        });
    };

    const renderRoster = () => {
        employeesContainer.innerHTML = '';
        const filtered = employeesData.filter(matchesFilter);
        const visibleCount = filtered.length;

        if (resultsInfo) {
            if (searchQuery || activeFacility !== 'all') {
                resultsInfo.textContent = `${visibleCount} of ${employeesData.length} shown`;
            } else {
                resultsInfo.textContent = '';
            }
        }

        if (!visibleCount) {
            const empty = document.createElement('p');
            empty.className = 'roster-empty';
            empty.textContent = 'No matches. Try another name, role, or facility.';
            employeesContainer.appendChild(empty);
            return;
        }

        locations.forEach((loc) => {
            const group = filtered.filter((e) => e.location === loc);
            if (!group.length) {
                return;
            }

            const section = document.createElement('section');
            section.className = 'location-group';

            const heading = document.createElement('h2');
            heading.className = 'location-heading';
            heading.textContent = `${loc} Crew`;
            section.appendChild(heading);

            const grid = document.createElement('div');
            grid.className = 'employee-grid';

            group.forEach((employee, index) => {
                const card = document.createElement('div');
                card.className = 'employee-card';
                card.style.animationDelay = `${index * 0.05}s`;

                const name = document.createElement('div');
                name.className = 'employee-name';
                name.textContent = employee.name;

                const role = document.createElement('div');
                role.className = 'employee-role';
                role.textContent = employee.role;

                card.appendChild(name);
                card.appendChild(role);
                grid.appendChild(card);
            });

            section.appendChild(grid);
            employeesContainer.appendChild(section);
        });
    };

    renderFilters();
    renderRoster();

    searchInput?.addEventListener('input', (event) => {
        searchQuery = normalize(event.target.value);
        renderRoster();
    });
});
