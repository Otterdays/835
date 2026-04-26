document.addEventListener('DOMContentLoaded', () => {
    const employeesContainer = document.getElementById('employees-container');
    const headerTitle = document.getElementById('header-title');
    const headerParties = document.getElementById('header-parties');
    const headerDate = document.getElementById('header-date');
    const headerStatus = document.getElementById('header-status');
    const viewDescription = document.getElementById('view-description');
    const statEmployees = document.getElementById('stat-employees');

    headerTitle.textContent = 'Employees';
    headerParties.textContent = 'Current RCF employee roster for quick location reference.';
    headerDate.textContent = `${employeesData.length} employees listed`;
    headerStatus.textContent = 'RCF Roster';
    viewDescription.textContent = 'Fast internal lookup for names and location assignments.';
    if (statEmployees) {
        statEmployees.textContent = employeesData.length;
    }

    employeesContainer.innerHTML = '';
    employeesData.forEach((employee, index) => {
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
});
