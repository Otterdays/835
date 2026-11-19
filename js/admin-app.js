// [TRACE: ACCOUNTS.md]
// Admin panel client. This file and admin.html are only served to signed-in admins
// (middleware.js), and every request below is re-checked on the server (api/admin).
// Hiding things here is a convenience, not the security boundary. DOM nodes only, no innerHTML.
document.addEventListener('DOMContentLoaded', async () => {
    const P = window.ProfileUI;
    const list = document.getElementById('adm-list');
    const countNode = document.getElementById('adm-count');
    if (!P || !list) {
        return;
    }

    const me = await Auth.whenReady();
    if (!me) {
        list.replaceChildren(P.signInPrompt('The admin panel', 'admin.html'));
        countNode.hidden = true;
        return;
    }

    const call = (path, options) => P.api(`/api/admin${path}`, options);
    let meta = { roles: [], badges: [] };

    const button = (text, className, onClick) => {
        const b = P.el('button', className, text);
        b.type = 'button';
        b.addEventListener('click', onClick);
        return b;
    };

    const when = (iso) => (iso ? P.formatDateTime(iso) : 'never');

    /* ---------- one account card ---------- */

    const renderCard = (row, wasOpen = false) => {
        const card = P.el('article', `adm-card${row.active ? '' : ' is-disabled'}`);
        card.dataset.username = row.username;

        const head = P.el('div', 'adm-card-head');
        head.append(P.avatarNode(row.avatar, 'md'));
        const who = P.el('div', 'adm-who');
        const name = P.el('a', 'pf-name-link', row.displayName);
        name.href = P.profileHref(row.handle);
        who.append(name, P.el('span', 'adm-handle', `@${row.handle}${row.isSelf ? ' (you)' : ''}`));
        head.append(who);
        const chips = P.el('div', 'adm-chips');
        chips.append(P.el('span', `adm-chip adm-chip--${row.role}`, row.role));
        if (!row.active) {
            chips.append(P.el('span', 'adm-chip adm-chip--off', 'Disabled'));
        }
        head.append(chips);
        card.append(head);

        const titles = P.badgeRow(row.badges);
        if (row.badges.length) {
            card.append(titles);
        }
        card.append(P.el('p', 'adm-meta', `Joined ${row.createdAt ? P.formatDate(row.createdAt) : 'unknown'} · Last seen ${when(row.lastSeenAt)}`));

        const details = P.el('details', 'adm-manage');
        details.open = wasOpen;
        details.append(P.el('summary', '', 'Manage this account'));
        const body = P.el('div', 'adm-manage-body');
        const status = P.el('p', 'pf-status');
        status.hidden = true;
        status.setAttribute('aria-live', 'polite');

        const run = async (payload, doneText) => {
            P.status(status, 'Saving…');
            try {
                const data = await call('', { method: 'POST', body: { username: row.username, ...payload } });
                const fresh = renderCard(data.user, true);
                card.replaceWith(fresh);
                const note = fresh.querySelector('.adm-manage .pf-status');
                P.status(note, doneText, 'success');
            } catch (err) {
                console.error('Admin action failed', err);
                P.status(status, err.message, 'error');
            }
        };

        // Role
        const roleSelect = document.createElement('select');
        meta.roles.forEach((r) => roleSelect.add(new Option(r, r)));
        roleSelect.value = row.role;
        roleSelect.disabled = row.isSelf;
        roleSelect.id = `role-${row.username}`;
        const roleLabel = P.el('label', 'pf-field');
        roleLabel.append(P.el('span', 'pf-field-label', 'Role'), roleSelect);
        if (row.isSelf) {
            roleLabel.append(P.el('small', 'pf-field-help', 'You cannot change your own role.'));
        }
        const roleSave = button('Save role', 'pf-btn', () => {
            if (roleSelect.value === 'admin' && !window.confirm(`Make ${row.displayName} an admin? Admins can manage every account.`)) {
                return;
            }
            run({ action: 'setRole', role: roleSelect.value }, 'Role saved.');
        });
        roleSave.disabled = row.isSelf;
        const roleRow = P.el('div', 'adm-row');
        roleRow.append(roleLabel, roleSave);

        // Titles
        const titleSet = document.createElement('fieldset');
        titleSet.className = 'adm-titles';
        const lg = document.createElement('legend');
        lg.textContent = 'Titles (shown on their profile)';
        titleSet.append(lg);
        meta.badges.forEach((badge) => {
            const label = P.el('label', 'adm-check');
            const box = document.createElement('input');
            box.type = 'checkbox';
            box.checked = row.badges.includes(badge.id);
            box.addEventListener('change', () => run({ action: 'badge', badge: badge.id, on: box.checked }, `${badge.label} ${box.checked ? 'awarded' : 'removed'}.`));
            label.append(box, document.createTextNode(` ${badge.label}`));
            titleSet.append(label);
        });

        // Enable / disable
        const accountRow = P.el('div', 'adm-row');
        if (!row.isSelf) {
            accountRow.append(
                button(row.active ? 'Disable account' : 'Enable account', row.active ? 'pf-btn pf-btn--danger' : 'pf-btn', () => {
                    const verb = row.active ? 'Disable' : 'Enable';
                    if (!window.confirm(`${verb} ${row.displayName}'s account?${row.active ? ' They will be signed out and unable to sign in.' : ''}`)) {
                        return;
                    }
                    run({ action: 'setActive', active: !row.active }, row.active ? 'Account disabled.' : 'Account enabled.');
                })
            );
        }

        body.append(roleRow, titleSet, accountRow);

        // Password reset
        if (!row.isSelf) {
            const pwLabel = P.el('label', 'pf-field');
            pwLabel.append(P.el('span', 'pf-field-label', 'Set a new password'));
            const pw = document.createElement('input');
            pw.type = 'text';
            pw.autocomplete = 'off';
            pw.spellcheck = false;
            pw.minLength = 8;
            pw.maxLength = 128;
            pwLabel.append(pw, P.el('small', 'pf-field-help', 'At least 8 characters. Tell the member in person. This signs them out everywhere; they should change it after signing in.'));
            const pwRow = P.el('div', 'adm-row');
            pwRow.append(
                pwLabel,
                button('Set password', 'pf-btn', () => {
                    if (pw.value.length < 8) {
                        P.status(status, 'Use at least 8 characters.', 'error');
                        return;
                    }
                    if (!window.confirm(`Reset ${row.displayName}'s password? They will be signed out everywhere.`)) {
                        return;
                    }
                    const newPassword = pw.value;
                    pw.value = '';
                    run({ action: 'resetPassword', newPassword }, 'Password reset.');
                })
            );
            body.append(pwRow);
        }

        body.append(status);
        details.append(body);
        card.append(details);
        return card;
    };

    /* ---------- list and search ---------- */

    const load = async (query = '') => {
        P.status(countNode, 'Loading accounts…');
        countNode.className = 'pf-muted';
        try {
            const data = await call(`?users=1${query ? `&q=${encodeURIComponent(query)}` : ''}`);
            meta = { roles: data.roles, badges: data.badges };
            list.replaceChildren(...data.users.map((u) => renderCard(u)));
            countNode.className = 'pf-muted';
            countNode.textContent = data.users.length
                ? `${data.users.length} account${data.users.length === 1 ? '' : 's'}${data.users.length >= 100 ? ' (showing the newest 100; search to narrow)' : ''}.`
                : 'No accounts match.';
        } catch (err) {
            console.error('Admin list failed', err);
            list.replaceChildren();
            countNode.className = 'pf-status pf-status--error';
            countNode.textContent = err.message;
        }
    };

    document.getElementById('adm-search').addEventListener('submit', (event) => {
        event.preventDefault();
        load(new FormData(event.currentTarget).get('q').trim());
    });

    /* ---------- audit log ---------- */

    const auditBox = document.getElementById('adm-audit');
    const auditBody = document.getElementById('adm-audit-body');
    const ACTION_TEXT = {
        setRole: (r) => `changed role from ${r.detail.from} to ${r.detail.to} for`,
        deactivate: () => 'disabled',
        activate: () => 'enabled',
        badgeAdd: (r) => `awarded "${r.detail.badge}" to`,
        badgeRemove: (r) => `removed "${r.detail.badge}" from`,
        resetPassword: () => 'reset the password for',
        forumDeleteThread: (r) => `deleted the thread "${r.detail.title}" (${r.detail.replies} replies) by`,
        forumDeleteReply: (r) => `deleted a reply ("${r.detail.excerpt}") by`
    };
    auditBox.addEventListener('toggle', async () => {
        if (!auditBox.open) {
            return;
        }
        auditBody.replaceChildren(P.el('p', 'pf-muted', 'Loading…'));
        try {
            const { audit } = await call('?audit=1');
            if (!audit.length) {
                auditBody.replaceChildren(P.el('p', 'pf-muted', 'No admin actions yet.'));
                return;
            }
            const ol = P.el('ol', 'adm-log');
            audit.forEach((r) => {
                const text = (ACTION_TEXT[r.action] || (() => r.action))(r);
                ol.append(P.el('li', '', `${P.formatDateTime(r.at)} — @${r.actor} ${text} @${r.target}`));
            });
            auditBody.replaceChildren(ol);
        } catch (err) {
            console.error('Audit load failed', err);
            auditBody.replaceChildren(P.el('p', 'pf-status pf-status--error', err.message));
        }
    });

    try {
        await P.getOptions(); // avatar pictures
    } catch (err) {
        console.error('Profile options unavailable', err);
    }
    load();
});
