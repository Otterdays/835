// [TRACE: ARCHITECTURE.md]
document.addEventListener('DOMContentLoaded', () => {
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

    const showStatus = (el, text, type = 'info') => {
        if (!el) {
            return;
        }
        el.textContent = text;
        el.className = `suggestion-status suggestion-status--${type}`;
        el.hidden = !text;
    };

    const grievanceCopy = document.getElementById('grievance-copy-btn');
    grievanceCopy?.addEventListener('click', async () => {
        const date = document.getElementById('grievance-incident-date')?.value || '(date TBD)';
        const facility = document.getElementById('grievance-facility')?.value || '(facility TBD)';
        const summary = document.getElementById('grievance-summary')?.value.trim() || '';
        const remedy = document.getElementById('grievance-remedy')?.value.trim() || '';
        const checks = [
            ['chk-step1', 'Step 1 discussion'],
            ['chk-written', 'Written grievance drafted'],
            ['chk-steward', 'Steward contacted'],
            ['chk-hr', 'Prepared for HR / Step 3']
        ]
            .map(([id, label]) => `${document.getElementById(id)?.checked ? '[x]' : '[ ]'} ${label}`)
            .join('\n');

        const text = [
            'Local 835 — Grievance worksheet (draft — not filed)',
            `Facility: ${facility}`,
            `Incident date: ${date}`,
            '',
            'Summary:',
            summary || '(add facts)',
            '',
            'Remedy requested:',
            remedy || '(add remedy)',
            '',
            'Checkpoints:',
            checks,
            '',
            'Ref: CBA Article IV — confirm calendar-day limits with steward.'
        ].join('\n');

        try {
            await copyText(text);
            showStatus(document.getElementById('grievance-status'), 'Worksheet copied.', 'success');
        } catch (err) {
            console.error(err);
            showStatus(document.getElementById('grievance-status'), 'Copy failed.', 'error');
        }
    });

    const facilitySelect = document.getElementById('steward-facility');
    const siteLink = document.getElementById('steward-site-link');
    const syncSiteLink = () => {
        const site = facilitySelect?.value || 'CFCF';
        if (siteLink) {
            siteLink.href = `stewards.html?site=${encodeURIComponent(site)}`;
            siteLink.textContent = `Open ${site} stewards`;
        }
    };
    facilitySelect?.addEventListener('change', syncSiteLink);
    syncSiteLink();

    document.getElementById('steward-copy-btn')?.addEventListener('click', async () => {
        const site = facilitySelect?.value || '';
        const text = [
            'Local 835 — Steward prep notes',
            `Facility: ${site}`,
            `When: ${document.getElementById('steward-when')?.value.trim() || ''}`,
            `Witnesses: ${document.getElementById('steward-witnesses')?.value.trim() || ''}`,
            `Supervisor: ${document.getElementById('steward-supervisor')?.value.trim() || ''}`,
            `Suspected article: ${document.getElementById('steward-article')?.value.trim() || ''}`,
            `Step 1 discussion: ${document.getElementById('steward-step1')?.value || ''}`,
            '',
            'Remedy requested:',
            document.getElementById('steward-remedy')?.value.trim() || '',
            '',
            'Facts:',
            document.getElementById('steward-facts')?.value.trim() || ''
        ].join('\n');

        try {
            await copyText(text);
            showStatus(document.getElementById('steward-status'), 'Prep notes copied.', 'success');
        } catch (err) {
            console.error(err);
            showStatus(document.getElementById('steward-status'), 'Copy failed.', 'error');
        }
    });
});
