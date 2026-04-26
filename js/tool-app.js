document.addEventListener('DOMContentLoaded', () => {
    const toolProgramContainer = document.getElementById('toolprogram-container');
    const headerTitle = document.getElementById('header-title');
    const headerParties = document.getElementById('header-parties');
    const headerDate = document.getElementById('header-date');
    const headerStatus = document.getElementById('header-status');
    const viewDescription = document.getElementById('view-description');
    const statToolPages = document.getElementById('stat-toolpages');

    headerTitle.textContent = 'Tool Control Program';
    headerParties.textContent = 'U.S. Facilities Tab H — tool control and lost-tool policy references (2009/1998).';
    headerDate.textContent = `${toolProgramScans.length} policy scans`;
    headerStatus.textContent = 'Facility policy';
    viewDescription.textContent = 'Same panel layout as Scanned Pages: pick an entry, read notes, open the full image. Add more entries in data.js (toolProgramScans) to grow this list.';
    if (statToolPages) {
        statToolPages.textContent = toolProgramScans.length;
    }

    const modal = initImageModal();
    renderPaneledArchive(toolProgramContainer, toolProgramScans, {
        idPrefix: 'tcp',
        filterPlaceholder: 'Filter tool program entries…',
        railLabel: 'Tool program list',
        emptyFilterMessage: 'No entries match. Clear the search box.',
        showFilter: true,
        openImageModal: modal.open
    });
});
