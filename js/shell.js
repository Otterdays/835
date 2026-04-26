document.addEventListener('DOMContentLoaded', () => {
    const menuBtn = document.getElementById('menu-btn');
    const sidePanel = document.getElementById('side-panel');
    const overlay = document.getElementById('panel-overlay');
    const closeBtn = document.getElementById('close-btn');

    if (!menuBtn || !sidePanel || !overlay) {
        return;
    }

    const setMenuState = (isOpen) => {
        sidePanel.classList.toggle('open', isOpen);
        overlay.classList.toggle('active', isOpen);
        menuBtn.setAttribute('aria-expanded', String(isOpen));
    };

    menuBtn.addEventListener('click', () => setMenuState(!sidePanel.classList.contains('open')));
    closeBtn?.addEventListener('click', () => setMenuState(false));
    overlay.addEventListener('click', () => setMenuState(false));

    document.addEventListener('keydown', (event) => {
        if (event.key !== 'Escape') {
            return;
        }
        const lightbox = document.getElementById('image-modal');
        if (lightbox && lightbox.classList.contains('is-open')) {
            return;
        }
        if (sidePanel.classList.contains('open')) {
            setMenuState(false);
        }
    });
});
