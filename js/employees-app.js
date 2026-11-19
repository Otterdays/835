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
    headerParties.textContent = 'Employee and management directory across CFCF, RCF, and PICC.';
    headerDate.textContent = `${employeesData.length} total staff members`;
    headerStatus.textContent = 'Facility Directory';
    viewDescription.textContent = 'Search by name or role, or filter by facility.';
    if (statEmployees) {
        statEmployees.textContent = employeesData.length;
    }

    // Main site first, then any extra sites (`alsoAt`) for people who work at more than one facility.
    const sitesOf = (employee) => [employee.location, ...(employee.alsoAt || [])].filter(Boolean);

    // Sort rule: A-Z by first name (names are stored "First Last"), then by full name. Management is the
    // exception and keeps its rank order, which is the leading number in the role ("1 · Project Manager").
    const rankOf = (employee) => Number.parseInt(employee.role, 10);
    const compareStaff = (a, b) => {
        if (Number.isFinite(rankOf(a)) && Number.isFinite(rankOf(b))) {
            return rankOf(a) - rankOf(b);
        }
        return a.name.localeCompare(b.name, undefined, { sensitivity: 'base' });
    };

    const preferredLocations = ['RCF', 'CFCF', 'PICC'];
    const locations = [...new Set(employeesData.flatMap(sitesOf))]
        .sort((a, b) => {
            const ai = preferredLocations.indexOf(a);
            const bi = preferredLocations.indexOf(b);
            if (ai !== -1 || bi !== -1) {
                return (ai === -1 ? Number.MAX_SAFE_INTEGER : ai) -
                    (bi === -1 ? Number.MAX_SAFE_INTEGER : bi);
            }
            return a.localeCompare(b);
        });
    let activeFacility = 'all';
    let searchQuery = '';

    const normalize = (value) =>
        String(value || '')
            .normalize('NFKD')
            .replace(/[\u0300-\u036f]/g, '')
            .toLocaleLowerCase()
            .replace(/[^\p{L}\p{N}]+/gu, ' ')
            .trim();

    const urlParams = new URLSearchParams(window.location.search);
    if (urlParams.get('q')) {
        searchQuery = normalize(urlParams.get('q'));
        if (searchInput) {
            searchInput.value = urlParams.get('q');
        }
    }

    const matchesFilter = (employee) => {
        if (activeFacility !== 'all' && !sitesOf(employee).includes(activeFacility)) {
            return false;
        }
        if (!searchQuery) {
            return true;
        }
        const haystack = normalize(`${employee.name} ${employee.role} ${sitesOf(employee).join(' ')}`);
        return haystack.includes(searchQuery);
    };

    const managementTooltip = 'BEST IN CLASS ASSHOLES';

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

        // A facility filter shows only that facility's crew. Multi-site staff (e.g. security) would
        // otherwise also pull in a section for every other site they cover.
        const visibleLocations = activeFacility === 'all' ? locations : [activeFacility];
        visibleLocations.forEach((loc) => {
            const group = filtered.filter((e) => sitesOf(e).includes(loc)).sort(compareStaff);
            if (!group.length) {
                return;
            }

            const section = document.createElement('section');
            section.className = 'location-group';

            const heading = document.createElement('h2');
            heading.className = 'location-heading';
            heading.textContent = `${loc} Crew`;
            if (loc === 'Management') {
                heading.dataset.tooltip = managementTooltip;
                heading.setAttribute('aria-label', `${loc} Crew. ${managementTooltip}`);
                heading.tabIndex = 0;
            }
            section.appendChild(heading);

            const grid = document.createElement('div');
            grid.className = 'employee-grid';

            group.forEach((employee, index) => {
                const card = document.createElement('div');
                card.className = 'employee-card';
                if (loc === 'Management') {
                    card.dataset.tooltip = managementTooltip;
                    card.setAttribute('aria-label', `${employee.name}, ${employee.role}. ${managementTooltip}`);
                    card.tabIndex = 0;
                }
                card.style.animationDelay = `${index * 0.05}s`;

                const name = document.createElement('div');
                name.className = 'employee-name';
                name.textContent = employee.name;

                const role = document.createElement('div');
                role.className = 'employee-role';
                role.textContent = employee.role;

                card.appendChild(name);
                card.appendChild(role);
                const otherSites = sitesOf(employee).filter((site) => site !== loc);
                if (otherSites.length) {
                    const also = document.createElement('div');
                    also.className = 'employee-also';
                    also.textContent = `Also works at ${otherSites.join(' and ')}`;
                    card.appendChild(also);
                }
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
