function filterScanQuery(value) {
    return (value || '').toLowerCase().trim();
}

/**
 * @param {HTMLElement} container
 * @param {Array} items
 * @param {object} options
 * @param {function(string, string): void} options.openImageModal
 */
function renderPaneledArchive(container, items, options = {}) {
    const {
        idPrefix = 'scan',
        showFilter = true,
        filterPlaceholder = 'Filter list…',
        railLabel = 'Document list',
        emptyFilterMessage = 'No items match this filter.',
        openImageModal
    } = options;

    const showModal = typeof openImageModal === 'function' ? openImageModal : () => {};

    container.innerHTML = '';

    if (!items.length) {
        const empty = document.createElement('p');
        empty.className = 'scan-empty-msg';
        empty.textContent = 'No documents loaded.';
        container.appendChild(empty);
        return;
    }

    const byId = new Map(items.map((it) => [it.id, it]));
    const root = document.createElement('div');
    root.className = 'scan-archive';

    let filterInput;
    if (showFilter) {
        const toolbar = document.createElement('div');
        toolbar.className = 'scan-toolbar';
        filterInput = document.createElement('input');
        filterInput.type = 'search';
        filterInput.className = 'scan-filter';
        filterInput.placeholder = filterPlaceholder;
        filterInput.setAttribute('aria-label', 'Filter this document list');
        toolbar.appendChild(filterInput);
        root.appendChild(toolbar);
    }

    const panels = document.createElement('div');
    panels.className = 'scan-panels';

    const rail = document.createElement('aside');
    rail.className = 'scan-rail';
    rail.setAttribute('aria-label', railLabel);

    const railScroll = document.createElement('div');
    railScroll.className = 'scan-rail-scroll';

    const detail = document.createElement('div');
    detail.className = 'scan-detail';

    const detailTitle = document.createElement('h2');
    detailTitle.className = 'scan-detail-title';
    detailTitle.id = `${idPrefix}-detail-title`;

    const detailBody = document.createElement('div');
    detailBody.className = 'scan-detail-body';
    detailBody.id = `${idPrefix}-detail-body`;

    const figure = document.createElement('figure');
    figure.className = 'scan-detail-figure';

    const img = document.createElement('img');
    img.className = 'scan-detail-img';
    img.loading = 'lazy';
    img.decoding = 'async';
    img.alt = '';

    const openBtn = document.createElement('button');
    openBtn.type = 'button';
    openBtn.className = 'scan-open-full';
    openBtn.textContent = 'Open full size';

    figure.appendChild(img);
    const figActions = document.createElement('div');
    figActions.className = 'scan-detail-actions';
    figActions.appendChild(openBtn);
    figure.appendChild(figActions);

    detail.appendChild(detailTitle);
    detail.appendChild(detailBody);
    detail.appendChild(figure);

    rail.appendChild(railScroll);
    panels.appendChild(rail);
    panels.appendChild(detail);
    root.appendChild(panels);
    container.appendChild(root);

    let lastSection = null;
    const railButtonRows = [];

    function buildDescriptionBlocks(text) {
        detailBody.innerHTML = '';
        const parts = String(text).split(/\n{2,}/).map((s) => s.trim()).filter(Boolean);
        const useParts = parts.length > 0 ? parts : (text ? [String(text).trim()] : []);
        useParts.forEach((block) => {
            const p = document.createElement('p');
            p.textContent = block;
            detailBody.appendChild(p);
        });
    }

    function buildTranscriptionBlock(text) {
        if (!text) return;
        const divider = document.createElement('hr');
        divider.className = 'scan-detail-divider';
        detailBody.appendChild(divider);

        const sub = document.createElement('h3');
        sub.className = 'scan-detail-transcription-title';
        sub.textContent = 'Transcribed text';
        detailBody.appendChild(sub);

        const pre = document.createElement('pre');
        pre.className = 'scan-detail-transcription';
        pre.textContent = text;
        detailBody.appendChild(pre);
    }

    function markActiveButton(activeId) {
        railButtonRows.forEach(({ btn, item }) => {
            const on = item.id === activeId;
            btn.classList.toggle('is-active', on);
        });
    }

    let selectedId = items[0].id;

    function selectItem(id) {
        const item = byId.get(id);
        if (!item) {
            return;
        }

        selectedId = id;
        detailTitle.textContent = item.title;
        buildDescriptionBlocks(item.description);
        buildTranscriptionBlock(item.transcription);
        img.src = item.url;
        img.alt = item.title;
        figure.style.display = '';
        openBtn.disabled = false;

        openBtn.onclick = () => showModal(item.url, item.title);
        img.onclick = () => showModal(item.url, item.title);

        markActiveButton(id);
    }

    function setEmptyFilterState() {
        detailTitle.textContent = 'No matches';
        detailBody.innerHTML = '';
        const p = document.createElement('p');
        p.className = 'scan-empty-msg';
        p.textContent = emptyFilterMessage;
        detailBody.appendChild(p);
        img.removeAttribute('src');
        img.alt = '';
        figure.style.display = 'none';
        openBtn.disabled = true;
    }

    function matchesItem(item) {
        if (!filterInput) {
            return true;
        }
        const q = filterScanQuery(filterInput.value);
        if (!q) {
            return true;
        }
        const basket = (
            [item.label, item.title, item.description, item.section || '', item.transcription || ''].join(' ')
        );
        return basket.toLowerCase().includes(q);
    }

    function applyRail() {
        const visible = items.filter((it) => matchesItem(it));
        railScroll.innerHTML = '';
        railButtonRows.length = 0;
        lastSection = null;

        if (visible.length === 0) {
            setEmptyFilterState();
            return;
        }

        const nextId = visible.some((v) => v.id === selectedId) ? selectedId : visible[0].id;

        visible.forEach((item, index) => {
            if (item.section && item.section !== lastSection) {
                const sec = document.createElement('div');
                sec.className = 'scan-rail-section';
                sec.textContent = item.section;
                railScroll.appendChild(sec);
                lastSection = item.section;
            }

            const btn = document.createElement('button');
            btn.type = 'button';
            btn.className = 'scan-rail-item';
            btn.style.animationDelay = `${index * 0.04}s`;
            const lab = document.createElement('span');
            lab.className = 'scan-rail-label';
            lab.textContent = item.label;
            const sub = document.createElement('span');
            sub.className = 'scan-rail-sub';
            sub.textContent = item.title;
            btn.appendChild(lab);
            btn.appendChild(sub);
            btn.addEventListener('click', () => selectItem(item.id));
            railScroll.appendChild(btn);
            railButtonRows.push({ btn, item });
        });

        selectItem(nextId);
    }

    if (filterInput) {
        filterInput.addEventListener('input', () => {
            applyRail();
        });
    }

    const initialParam =
        options.initialItemId ||
        new URLSearchParams(window.location.search).get('item') ||
        window.location.hash.replace(/^#/, '');
    if (initialParam && byId.has(initialParam)) {
        selectedId = initialParam;
        if (filterInput) {
            filterInput.value = '';
        }
    }

    applyRail();
}
