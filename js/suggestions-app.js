document.addEventListener('DOMContentLoaded', () => {
    const form = document.getElementById('suggestion-form');
    const nameInput = document.getElementById('suggestion-name');
    const messageInput = document.getElementById('suggestion-message');
    const topicSelect = document.getElementById('suggestion-topic');
    const statusEl = document.getElementById('suggestion-status');
    const shareBtn = document.getElementById('suggestion-share-btn');
    const copyBtn = document.getElementById('suggestion-copy-btn');

    if (!form || !messageInput) {
        return;
    }

    const buildMessage = () => {
        const topic = topicSelect?.value || 'General';
        const name = nameInput?.value.trim();
        const body = messageInput.value.trim();
        const lines = [`Topic: ${topic}`];
        if (name) {
            lines.push(`From: ${name}`);
        }
        lines.push('', body);
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

    form.addEventListener('submit', async (event) => {
        event.preventDefault();
        const text = buildMessage();

        if (!messageInput.value.trim()) {
            showStatus('Add a message before sending.', 'error');
            messageInput.focus();
            return;
        }

        if (navigator.share) {
            try {
                await navigator.share({
                    title: 'Local 835 member suggestion',
                    text
                });
                showStatus('Shared — thank you.', 'success');
                form.reset();
                return;
            } catch (err) {
                if (err?.name === 'AbortError') {
                    return;
                }
            }
        }

        try {
            await copyText(text);
            showStatus('Copied to clipboard — paste into email or text your steward.', 'success');
        } catch {
            showStatus('Could not copy. Use the Copy button below.', 'error');
        }
    });

    shareBtn?.addEventListener('click', async () => {
        const text = buildMessage();
        if (!messageInput.value.trim()) {
            showStatus('Add a message first.', 'error');
            messageInput.focus();
            return;
        }
        if (!navigator.share) {
            showStatus('Share not supported here — use Copy instead.', 'info');
            return;
        }
        try {
            await navigator.share({ title: 'Local 835 member suggestion', text });
            showStatus('Shared — thank you.', 'success');
        } catch (err) {
            if (err?.name !== 'AbortError') {
                showStatus('Share failed. Try Copy instead.', 'error');
            }
        }
    });

    copyBtn?.addEventListener('click', async () => {
        const text = buildMessage();
        if (!messageInput.value.trim()) {
            showStatus('Add a message first.', 'error');
            messageInput.focus();
            return;
        }
        try {
            await copyText(text);
            showStatus('Copied — paste into email or message.', 'success');
        } catch {
            showStatus('Copy failed on this device.', 'error');
        }
    });
});
