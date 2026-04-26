document.addEventListener('DOMContentLoaded', () => {
    const stewardsContainer = document.getElementById('stewards-container');
    const headerTitle = document.getElementById('header-title');
    const headerParties = document.getElementById('header-parties');
    const headerDate = document.getElementById('header-date');
    const headerStatus = document.getElementById('header-status');
    const viewDescription = document.getElementById('view-description');
    const statStewards = document.getElementById('stat-stewards');

    headerTitle.textContent = 'Shop Stewards';
    headerParties.textContent = 'Current representation contacts for Local 835 members.';
    headerDate.textContent = `${shopStewards.length} active steward profiles`;
    headerStatus.textContent = 'Leadership Contacts';
    viewDescription.textContent = 'Review site leadership and coverage locations in single roster.';
    if (statStewards) {
        statStewards.textContent = shopStewards.length;
    }

    stewardsContainer.innerHTML = '';
    shopStewards.forEach((steward, index) => {
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
        role.textContent = `${steward.role} - ${steward.location}`;

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
});
