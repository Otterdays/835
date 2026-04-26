document.addEventListener('DOMContentLoaded', () => {
    const employeesContainer = document.getElementById('employees-container');
    const headerTitle = document.getElementById('header-title');
    const headerParties = document.getElementById('header-parties');
    const headerDate = document.getElementById('header-date');
    const headerStatus = document.getElementById('header-status');
    const viewDescription = document.getElementById('view-description');
    const statEmployees = document.getElementById('stat-employees');

    headerTitle.textContent = 'Site Roster';
    headerParties.textContent = 'Employee directory across CFCF, RCF, and PICC.';
    headerDate.textContent = `${employeesData.length} total staff members`;
    headerStatus.textContent = 'Facility Directory';
    viewDescription.textContent = 'Browse the complete team grouped by facility assignment.';
    if (statEmployees) {
        statEmployees.textContent = employeesData.length;
    }

    const locations = ['RCF', 'CFCF', 'PICC'];
    employeesContainer.innerHTML = '';

    locations.forEach((loc) => {
        const filtered = employeesData.filter(e => e.location === loc);
        if (filtered.length === 0) return;

        const section = document.createElement('section');
        section.className = 'location-group';
        
        const heading = document.createElement('h2');
        heading.className = 'location-heading';
        heading.textContent = `${loc} Crew`;
        section.appendChild(heading);

        const grid = document.createElement('div');
        grid.className = 'employee-grid';
        
        filtered.forEach((employee, index) => {
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
});
