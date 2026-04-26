document.addEventListener('DOMContentLoaded', () => {
    const galleryContainer = document.getElementById('gallery-container');
    const headerTitle = document.getElementById('header-title');
    const headerParties = document.getElementById('header-parties');
    const headerDate = document.getElementById('header-date');
    const headerStatus = document.getElementById('header-status');
    const viewDescription = document.getElementById('view-description');
    const statPages = document.getElementById('stat-pages');

    headerTitle.textContent = 'Scanned Pages';
    headerParties.textContent = 'Full-page source scans for everything you host here — starting with the 2022–2026 CBA; add more years and document types over time.';
    headerDate.textContent = `${cbaScannedPages.length} page scans in library`;
    headerStatus.textContent = 'Scanned Archive';
    viewDescription.textContent = 'All full-page images you publish in this list — agreement pages, exhibits, and anything else. Pick a row, read the notes, open full size, or use the filter as the set grows.';
    if (statPages) {
        statPages.textContent = cbaScannedPages.length;
    }

    const modal = initImageModal();
    renderPaneledArchive(galleryContainer, cbaScannedPages, {
        idPrefix: 'cba',
        filterPlaceholder: 'Filter by label, title, or description…',
        railLabel: 'Scanned pages list',
        emptyFilterMessage: 'No pages match this filter. Clear the search or try other words.',
        openImageModal: modal.open
    });
});
