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
    const sortRoot = document.getElementById('roster-sort');

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

    // "By role" view: inside each site, people are grouped under their main role (the text before " · "),
    // roles A-Z, names A-Z inside each role. Management stays in rank order.
    const primaryRole = (employee) => String(employee.role || '').split(' · ')[0].trim();
    const compareRole = (a, b) => {
        if (Number.isFinite(rankOf(a)) && Number.isFinite(rankOf(b))) {
            return rankOf(a) - rankOf(b);
        }
        return primaryRole(a).localeCompare(primaryRole(b), undefined, { sensitivity: 'base' }) || compareStaff(a, b);
    };
    let sortMode = 'name';

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

    const renderSort = () => {
        if (!sortRoot) {
            return;
        }
        const label = document.createElement('span');
        label.className = 'roster-sort-label';
        label.textContent = 'Sort by';
        sortRoot.replaceChildren(label);
        [{ id: 'name', text: 'Name A-Z' }, { id: 'role', text: 'Role' }].forEach((option) => {
            const btn = document.createElement('button');
            btn.type = 'button';
            btn.className = 'filter-chip';
            btn.classList.toggle('is-active', option.id === sortMode);
            btn.textContent = option.text;
            btn.setAttribute('aria-pressed', String(option.id === sortMode));
            btn.addEventListener('click', () => {
                sortMode = option.id;
                renderSort();
                renderRoster();
            });
            sortRoot.appendChild(btn);
        });
    };

    /* ---------- A-Z jump rail (phones) ---------- */
    // A slim strip on the right edge. Touch or drag along it to jump to the first name starting with
    // that letter within the crew section you are reading (the strip only lists letters that crew has).
    // By name it jumps to names; in the By role view it jumps to role headings.
    const letterOf = (employee) => {
        const first = normalize(employee.name).charAt(0).toUpperCase();
        return /[A-Z]/.test(first) ? first : '#';
    };
    const rail = document.createElement('nav');
    rail.className = 'roster-index';
    rail.setAttribute('aria-label', 'Jump to a letter');
    rail.hidden = true;
    const bubble = document.createElement('div');
    bubble.className = 'roster-index-bubble';
    bubble.setAttribute('aria-hidden', 'true');
    document.body.append(rail, bubble);

    // The crew section being read: the last one whose top has passed 35% of the screen, else the first.
    const currentGroup = () => {
        const groups = [...employeesContainer.querySelectorAll('.location-group')];
        return groups.filter((group) => group.getBoundingClientRect().top <= window.innerHeight * 0.35).pop() || groups[0] || null;
    };

    const jumpTo = (letter) => {
        const group = currentGroup();
        const target = group && [...group.querySelectorAll('[data-letter]')].find((node) => node.dataset.letter === letter);
        if (target) {
            target.scrollIntoView({ block: 'start', behavior: 'instant' }); // the page is smooth-scroll by default; scrubbing needs it immediate
        }
    };

    let bubbleTimer = 0;
    const showBubble = (letter, button) => {
        bubble.textContent = letter;
        const box = button.getBoundingClientRect();
        bubble.style.top = `${box.top + box.height / 2}px`;
        bubble.classList.add('is-on');
        window.clearTimeout(bubbleTimer);
        bubbleTimer = window.setTimeout(() => bubble.classList.remove('is-on'), 700);
    };

    let lastLetter = '';
    const scrub = (event) => {
        const buttons = [...rail.querySelectorAll('button')];
        if (!buttons.length) {
            return;
        }
        const box = rail.getBoundingClientRect();
        const ratio = Math.min(0.999, Math.max(0, (event.clientY - box.top) / box.height));
        const button = buttons[Math.floor(ratio * buttons.length)];
        if (button.dataset.letter === lastLetter) {
            return;
        }
        lastLetter = button.dataset.letter;
        showBubble(lastLetter, button);
        jumpTo(lastLetter);
    };
    rail.addEventListener('pointerdown', (event) => {
        if (event.pointerType === 'mouse' && event.button !== 0) {
            return;
        }
        lastLetter = '';
        rail.setPointerCapture(event.pointerId);
        rail.classList.add('is-dragging');
        scrub(event);
    });
    rail.addEventListener('pointermove', (event) => {
        if (rail.classList.contains('is-dragging')) {
            scrub(event);
        }
    });
    const endScrub = () => {
        rail.classList.remove('is-dragging');
        lastLetter = '';
    };
    rail.addEventListener('pointerup', endScrub);
    rail.addEventListener('pointercancel', endScrub);
    // Keyboard and screen readers: the letters are real buttons.
    rail.addEventListener('keydown', (event) => {
        const button = event.target.closest('button');
        if (button && (event.key === 'Enter' || event.key === ' ')) {
            event.preventDefault();
            showBubble(button.dataset.letter, button);
            jumpTo(button.dataset.letter);
        }
    });

    // Only show the rail while the list is on screen, so it never sits over the page header.
    if ('IntersectionObserver' in window) {
        new IntersectionObserver(([entry]) => rail.classList.toggle('is-away', !entry.isIntersecting)).observe(employeesContainer);
        rail.classList.add('is-away');
    }

    // The rail lists only the letters in the crew section on screen, so every tap lands in that crew.
    // It follows you as you scroll from one crew to the next (and is left alone while you are dragging).
    let railKey = '';
    const renderIndex = () => {
        if (rail.classList.contains('is-dragging')) {
            return;
        }
        const group = currentGroup();
        const letters = group
            ? [...new Set([...group.querySelectorAll('[data-letter]')].map((node) => node.dataset.letter))].sort()
            : [];
        const key = letters.join('');
        if (key !== railKey) {
            railKey = key;
            rail.replaceChildren(
                ...letters.map((letter) => {
                    const button = document.createElement('button');
                    button.type = 'button';
                    button.dataset.letter = letter;
                    button.textContent = letter;
                    button.setAttribute('aria-label', `Jump to names starting with ${letter}`);
                    return button;
                })
            );
        }
        rail.hidden = letters.length < 2;
    };
    let indexFrame = 0;
    window.addEventListener('scroll', () => {
        if (!indexFrame) {
            indexFrame = window.setTimeout(() => {
                indexFrame = 0;
                renderIndex();
            }, 80);
        }
    }, { passive: true });

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
            renderIndex();
            return;
        }

        // A facility filter shows only that facility's crew. Multi-site staff (e.g. security) would
        // otherwise also pull in a section for every other site they cover.
        const visibleLocations = activeFacility === 'all' ? locations : [activeFacility];
        visibleLocations.forEach((loc) => {
            const group = filtered.filter((e) => sitesOf(e).includes(loc)).sort(sortMode === 'role' ? compareRole : compareStaff);
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

            const buildCard = (employee, index) => {
                const card = document.createElement('div');
                card.className = 'employee-card';
                if (loc === 'Management') {
                    card.dataset.tooltip = managementTooltip;
                    card.setAttribute('aria-label', `${employee.name}, ${employee.role}. ${managementTooltip}`);
                    card.tabIndex = 0;
                }
                card.style.animationDelay = `${index * 0.05}s`;
                if (sortMode === 'name') {
                    card.dataset.letter = letterOf(employee);
                }

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
                return card;
            };

            const newGrid = () => {
                const grid = document.createElement('div');
                grid.className = 'employee-grid';
                return grid;
            };

            if (sortMode === 'role' && loc !== 'Management') {
                const byRole = new Map();
                group.forEach((employee) => {
                    const key = primaryRole(employee) || 'Other';
                    byRole.set(key, [...(byRole.get(key) || []), employee]);
                });
                byRole.forEach((people, roleName) => {
                    const block = document.createElement('div');
                    block.className = 'role-group';
                    const roleHeading = document.createElement('h3');
                    roleHeading.className = 'role-group-heading';
                    roleHeading.dataset.letter = /[A-Z]/i.test(roleName.charAt(0)) ? roleName.charAt(0).toUpperCase() : '#';
                    roleHeading.textContent = `${roleName} · ${people.length}`;
                    const grid = newGrid();
                    people.forEach((employee, index) => grid.appendChild(buildCard(employee, index)));
                    block.append(roleHeading, grid);
                    section.appendChild(block);
                });
            } else {
                const grid = newGrid();
                group.forEach((employee, index) => grid.appendChild(buildCard(employee, index)));
                section.appendChild(grid);
            }
            employeesContainer.appendChild(section);
        });
        renderIndex();
    };

    renderFilters();
    renderSort();
    renderRoster();

    searchInput?.addEventListener('input', (event) => {
        searchQuery = normalize(event.target.value);
        renderRoster();
    });
});
