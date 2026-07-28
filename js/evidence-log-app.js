// [TRACE: ARCHITECTURE.md]
document.addEventListener('DOMContentLoaded', () => {
    /** In-memory only — never posted to a server */
    const entries = [];
    const form = document.getElementById('evidence-form');
    const listEl = document.getElementById('ev-list');
    const statusEl = document.getElementById('ev-status');

    const showStatus = (text, type = 'info') => {
        if (!statusEl) {
            return;
        }
        statusEl.textContent = text;
        statusEl.className = `suggestion-status suggestion-status--${type}`;
        statusEl.hidden = !text;
    };

    const render = () => {
        if (!listEl) {
            return;
        }
        if (!entries.length) {
            listEl.innerHTML = '<p class="action-lead">No entries yet.</p>';
            return;
        }
        listEl.innerHTML = entries
            .map(
                (e, i) => `<article class="evidence-card">
                <p class="evidence-tag">${e.status}</p>
                <h3>${escapeHtml(e.item)}</h3>
                <p><strong>Source:</strong> ${escapeHtml(e.source || '—')}</p>
                <p><strong>Date:</strong> ${escapeHtml(e.date || '—')}</p>
                <p><strong>Proves:</strong> ${escapeHtml(e.proves || '—')}</p>
                <p><strong>Does not prove:</strong> ${escapeHtml(e.doesNotProve || '—')}</p>
                <p><strong>Follow-up:</strong> ${escapeHtml(e.followUp || '—')}</p>
                <button type="button" class="btn-secondary" data-remove="${i}">Remove</button>
            </article>`
            )
            .join('');
    };

    const escapeHtml = (s) =>
        String(s)
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;');

    const toMarkdown = () => {
        const rows = entries.map(
            (e, i) =>
                `| E-${String(i + 1).padStart(3, '0')} | ${e.status} | ${e.item} | ${e.source} | ${e.date} | ${e.proves} / NOT: ${e.doesNotProve} | ${e.followUp} |`
        );
        return [
            '# Evidence log export',
            '',
            '| ID | Status | Item | Source | Date | Proves / does not | Follow-up |',
            '|---|---|---|---|---|---|---|',
            ...rows
        ].join('\n');
    };

    const download = (filename, text, type) => {
        const blob = new Blob([text], { type });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = filename;
        a.click();
        URL.revokeObjectURL(url);
    };

    form?.addEventListener('submit', (event) => {
        event.preventDefault();
        entries.push({
            status: document.getElementById('ev-status')?.value || 'Q',
            item: document.getElementById('ev-item')?.value.trim() || '',
            source: document.getElementById('ev-source')?.value.trim() || '',
            date: document.getElementById('ev-date')?.value || '',
            proves: document.getElementById('ev-proves')?.value.trim() || '',
            doesNotProve: document.getElementById('ev-not')?.value.trim() || '',
            followUp: document.getElementById('ev-follow')?.value.trim() || ''
        });
        form.reset();
        render();
        showStatus('Entry added (memory only).', 'success');
    });

    listEl?.addEventListener('click', (event) => {
        const btn = event.target.closest('[data-remove]');
        if (!btn) {
            return;
        }
        const idx = Number(btn.getAttribute('data-remove'));
        if (Number.isInteger(idx)) {
            entries.splice(idx, 1);
            render();
        }
    });

    document.getElementById('ev-export-md')?.addEventListener('click', () => {
        if (!entries.length) {
            showStatus('Add an entry first.', 'error');
            return;
        }
        download('oe835-evidence-log.md', toMarkdown(), 'text/markdown');
        showStatus('Markdown downloaded.', 'success');
    });

    document.getElementById('ev-export-json')?.addEventListener('click', () => {
        if (!entries.length) {
            showStatus('Add an entry first.', 'error');
            return;
        }
        download('oe835-evidence-log.json', JSON.stringify(entries, null, 2), 'application/json');
        showStatus('JSON downloaded.', 'success');
    });

    document.getElementById('ev-clear')?.addEventListener('click', () => {
        entries.length = 0;
        render();
        showStatus('Cleared.', 'info');
    });

    render();
});
