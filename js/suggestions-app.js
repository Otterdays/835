// [TRACE: ARCHITECTURE.md]
document.addEventListener('DOMContentLoaded', () => {
    const STORAGE_KEY = 'oe835_suggestions';
    const form = document.getElementById('suggestion-form');
    const nameInput = document.getElementById('suggestion-name');
    const messageInput = document.getElementById('suggestion-message');
    const topicSelect = document.getElementById('suggestion-topic');
    const facilitySelect = document.getElementById('suggestion-facility');
    const dateInput = document.getElementById('suggestion-date');
    const articleInput = document.getElementById('suggestion-article');
    const stewardSelect = document.getElementById('suggestion-steward');
    const followupInput = document.getElementById('suggestion-followup');
    const statusEl = document.getElementById('suggestion-status');
    const shareBtn = document.getElementById('suggestion-share-btn');
    const copyBtn = document.getElementById('suggestion-copy-btn');
    const listEl = document.getElementById('suggestion-list');
    const countEl = document.getElementById('suggestion-board-count');

    if (!form || !messageInput || !listEl) {
        return;
    }

    const escapeHtml = (s) =>
        String(s)
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;');

    const displayName = () => {
        const raw = nameInput?.value.trim();
        return raw || 'Anonymous';
    };

    const loadEntries = () => {
        try {
            const raw = localStorage.getItem(STORAGE_KEY);
            if (!raw) {
                return [];
            }
            const parsed = JSON.parse(raw);
            return Array.isArray(parsed) ? parsed : [];
        } catch (err) {
            console.error('Suggestion load failed', err);
            return [];
        }
    };

    const saveEntries = (entries) => {
        try {
            localStorage.setItem(STORAGE_KEY, JSON.stringify(entries));
        } catch (err) {
            console.error('Suggestion save failed', err);
            throw err;
        }
    };

    let entries = loadEntries();

    const formatWhen = (iso) => {
        try {
            return new Date(iso).toLocaleString();
        } catch {
            return iso;
        }
    };

    const render = () => {
        if (countEl) {
            countEl.textContent = `${entries.length} posted`;
        }
        if (!entries.length) {
            listEl.innerHTML =
                '<p class="suggestion-empty">No suggestions yet. Post one above and it will show here.</p>';
            return;
        }
        listEl.innerHTML = entries
            .map(
                (entry) => `<article class="suggestion-post">
                <header class="suggestion-post-meta">
                    <span class="suggestion-post-name">${escapeHtml(entry.name || 'Anonymous')}</span>
                    <span class="suggestion-post-topic">${escapeHtml(entry.topic || 'General')}</span>
                    <time datetime="${escapeHtml(entry.at || '')}">${escapeHtml(formatWhen(entry.at))}</time>
                </header>
                <p class="suggestion-post-body">${escapeHtml(entry.message || '')}</p>
                <ul class="suggestion-post-details">
                    ${entry.facility ? `<li><strong>Facility:</strong> ${escapeHtml(entry.facility)}</li>` : ''}
                    ${entry.date ? `<li><strong>Issue date:</strong> ${escapeHtml(entry.date)}</li>` : ''}
                    ${entry.article ? `<li><strong>Article:</strong> ${escapeHtml(entry.article)}</li>` : ''}
                    <li><strong>Steward contacted:</strong> ${escapeHtml(entry.steward || 'No')}</li>
                    ${entry.followup ? `<li><strong>Follow-up:</strong> ${escapeHtml(entry.followup)}</li>` : ''}
                </ul>
            </article>`
            )
            .join('');
    };

    const readEntry = () => ({
        id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
        at: new Date().toISOString(),
        name: displayName(),
        topic: topicSelect?.value || 'General',
        facility: facilitySelect?.value || '',
        date: dateInput?.value || '',
        article: articleInput?.value.trim() || '',
        steward: stewardSelect?.value || 'No',
        message: messageInput.value.trim(),
        followup: followupInput?.value.trim() || ''
    });

    const buildMessage = () => {
        const entry = readEntry();
        const lines = [
            `From: ${entry.name}`,
            `Topic: ${entry.topic}`,
            `Facility: ${entry.facility || '(not specified)'}`,
            `Date of issue: ${entry.date || '(not specified)'}`,
            `CBA article: ${entry.article || '(not specified)'}`,
            `Steward contacted: ${entry.steward}`
        ];
        lines.push('', 'Factual summary:', entry.message);
        if (entry.followup) {
            lines.push('', 'Requested follow-up:', entry.followup);
        }
        return lines.join('\n');
    };

    const showStatus = (text, type = 'info') => {
        if (!statusEl) {
            return;
        }
        statusEl.textContent = text;
        statusEl.className = `suggestion-status suggestion-status--${type}`;
        statusEl.hidden = !text;
    };

    const copyText = async (text) => {
        if (navigator.clipboard?.writeText) {
            await navigator.clipboard.writeText(text);
            return;
        }
        const ta = document.createElement('textarea');
        ta.value = text;
        ta.setAttribute('readonly', '');
        ta.style.position = 'fixed';
        ta.style.left = '-9999px';
        document.body.appendChild(ta);
        ta.select();
        document.execCommand('copy');
        document.body.removeChild(ta);
    };

    const postSuggestion = () => {
        if (!messageInput.value.trim()) {
            showStatus('Add a factual summary before posting.', 'error');
            messageInput.focus();
            return null;
        }
        const entry = readEntry();
        entries = [entry, ...entries];
        try {
            saveEntries(entries);
        } catch (err) {
            showStatus('Could not save locally. Try again.', 'error');
            return null;
        }
        render();
        return entry;
    };

    form.addEventListener('submit', async (event) => {
        event.preventDefault();
        const entry = postSuggestion();
        if (!entry) {
            return;
        }

        const text = buildMessage();
        form.reset();
        showStatus(`Posted as ${entry.name}.`, 'success');

        if (navigator.share) {
            try {
                await navigator.share({ title: 'Local 835 member suggestion', text });
            } catch (err) {
                if (err?.name !== 'AbortError') {
                    // Post already saved; share is optional
                    console.error('Share after post failed', err);
                }
            }
        }
    });

    shareBtn?.addEventListener('click', async () => {
        if (!messageInput.value.trim()) {
            showStatus('Add a summary first.', 'error');
            return;
        }
        const text = buildMessage();
        if (!navigator.share) {
            showStatus('Share not supported — use Copy.', 'info');
            return;
        }
        try {
            await navigator.share({ title: 'Local 835 member suggestion', text });
            showStatus('Shared.', 'success');
        } catch (err) {
            if (err?.name !== 'AbortError') {
                showStatus('Share failed. Try Copy.', 'error');
            }
        }
    });

    copyBtn?.addEventListener('click', async () => {
        if (!messageInput.value.trim()) {
            showStatus('Add a summary first.', 'error');
            return;
        }
        try {
            await copyText(buildMessage());
            showStatus('Copied.', 'success');
        } catch (err) {
            console.error(err);
            showStatus('Copy failed.', 'error');
        }
    });

    render();
});
