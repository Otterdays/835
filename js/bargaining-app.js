// [TRACE: ARCHITECTURE.md]
document.addEventListener('DOMContentLoaded', () => {
    const btn = document.getElementById('copy-meeting-language');
    const statusEl = document.getElementById('bargain-status');
    const text =
        'We are asking for an informed, lawful, member-supported bargaining process. We are not accusing anyone of wrongdoing based on rumors, and we are not authorizing a strike or unsafe action. We want the documents, the exact proposal, a legal review, and enough time to understand the complete text before any vote.';

    btn?.addEventListener('click', async () => {
        try {
            if (navigator.clipboard?.writeText) {
                await navigator.clipboard.writeText(text);
            } else {
                throw new Error('clipboard unavailable');
            }
            if (statusEl) {
                statusEl.hidden = false;
                statusEl.className = 'suggestion-status suggestion-status--success';
                statusEl.textContent = 'Copied.';
            }
        } catch (err) {
            console.error(err);
            if (statusEl) {
                statusEl.hidden = false;
                statusEl.className = 'suggestion-status suggestion-status--error';
                statusEl.textContent = 'Copy failed.';
            }
        }
    });
});
