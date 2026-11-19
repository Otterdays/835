// [TRACE: ACCOUNTS.md]
// Profile editor: grouped fields, character counters, picture and color pickers,
// a Top 8 list you can reorder, a live preview, and a warning before leaving unsaved changes.
// Everything is built with textContent / DOM nodes; member text is never parsed as HTML.
document.addEventListener('DOMContentLoaded', async () => {
    const P = window.ProfileUI;
    const host = document.getElementById('profile-edit-root');
    const backLink = document.getElementById('edit-back');
    if (!host || !P) {
        return;
    }

    const me = await Auth.whenReady();
    if (!me) {
        backLink.hidden = true;
        host.replaceChildren(P.signInPrompt('Profile editing', 'profile-edit.html'));
        return;
    }

    let options;
    let profile;
    try {
        options = await P.getOptions();
        profile = (await P.api(`/api/profile?u=${encodeURIComponent(me.username)}`)).profile;
    } catch (err) {
        console.error('Profile editor load failed', err);
        host.replaceChildren(P.el('p', 'pf-status pf-status--error', err.message));
        return;
    }

    const profileUrl = `profile.html?u=${encodeURIComponent(profile.handle)}`;
    backLink.href = profileUrl;

    const limits = options.limits;
    const hasLimit = { displayName: limits.displayName.max, headline: limits.headline.max, aboutMe: limits.aboutMe.max, interests: limits.interests.max, wantToMeet: limits.wantToMeet.max };
    let dirty = false;

    /* ---------- field builders ---------- */

    const textField = (label, name, value, { area = false, help = '' } = {}) => {
        const max = hasLimit[name];
        const wrap = P.el('label', 'pf-field');
        wrap.append(P.el('span', 'pf-field-label', label));
        const input = area ? P.el('textarea') : P.el('input');
        if (!area) {
            input.type = 'text';
        } else {
            input.rows = 5;
        }
        input.name = name;
        input.maxLength = max;
        input.value = value || '';
        wrap.append(input);
        if (help) {
            wrap.append(P.el('small', 'pf-field-help', help));
        }
        const count = P.el('span', 'pf-counter');
        const updateCount = () => { count.textContent = `${input.value.length} / ${max}`; };
        input.addEventListener('input', updateCount);
        updateCount();
        wrap.append(count);
        return wrap;
    };

    const selectField = (label, name, rows, selected) => {
        const wrap = P.el('label', 'pf-field');
        wrap.append(P.el('span', 'pf-field-label', label));
        const select = document.createElement('select');
        select.name = name;
        rows.forEach((row) => select.add(new Option(row.label, row.id)));
        select.value = selected || '';
        wrap.append(select);
        return wrap;
    };

    // A grid of radio buttons drawn as pictures or color swatches.
    const choiceGrid = (legend, name, items, selected, paint) => {
        const set = document.createElement('fieldset');
        set.className = 'pf-choice-set';
        const lg = document.createElement('legend');
        lg.textContent = legend;
        set.append(lg);
        const grid = P.el('div', 'pf-choice-grid');
        items.forEach((item) => {
            const label = P.el('label', 'pf-choice');
            const input = document.createElement('input');
            input.type = 'radio';
            input.name = name;
            input.value = item.id;
            input.checked = item.id === selected;
            const face = P.el('span', 'pf-choice-face');
            paint(face, item);
            label.append(input, face, P.el('span', 'pf-sr-only', item.label));
            label.title = item.label;
            grid.append(label);
        });
        set.append(grid);
        return set;
    };

    const group = (title, help) => {
        const set = document.createElement('fieldset');
        set.className = 'pf-editor-group';
        const lg = document.createElement('legend');
        lg.textContent = title;
        set.append(lg, P.el('p', 'pf-muted pf-editor-help', help));
        return set;
    };

    /* ---------- form ---------- */

    const form = P.el('form', 'pf-edit-form');
    const rosterJobTitle = options.jobTitles.includes(profile.jobTitle) ? profile.jobTitle : '';

    const basics = group('Basics and work', 'How your name and work show on your profile and forum posts.');
    const awarded = P.el('div', 'pf-titles');
    awarded.append(P.el('p', 'pf-muted', 'Titles awarded by Local 835 (you cannot change these):'));
    awarded.append(profile.badges.length ? P.badgeRow(profile.badges) : P.el('span', 'pf-muted', 'None yet.'));
    basics.append(
        awarded,
        textField('Display name', 'displayName', profile.displayName),
        textField('Short headline', 'headline', profile.headline, { help: 'One line under your name, like a motto.' }),
        selectField('Job title (self-reported)', 'jobTitle', [{ id: '', label: 'Not listed / prefer not to say' }, ...options.jobTitles.map((t) => ({ id: t, label: t }))], rosterJobTitle),
        selectField('Facility', 'facility', [{ id: '', label: 'Not listed / prefer not to say' }, ...options.facilities.map((f) => ({ id: f, label: f }))], profile.facility)
    );

    const about = group('About you', 'Share only what you are comfortable sharing with other signed-in members.');
    about.append(
        textField('About me', 'aboutMe', profile.aboutMe, { area: true }),
        textField('Interests', 'interests', profile.interests, { area: true }),
        textField("Who I'd like to meet", 'wantToMeet', profile.wantToMeet, { area: true })
    );

    const look = group('Profile look', 'Pick a theme, a background pattern, and your picture.');
    look.append(
        selectField('Mood', 'mood', [{ id: '', label: 'No mood' }, ...options.moods.map((m) => ({ id: m.id, label: `${m.emoji} ${m.label}` }))], profile.mood),
        selectField('Profile theme', 'theme', options.themes, profile.theme),
        selectField('Background pattern', 'pattern', options.patterns, profile.pattern),
        choiceGrid('Picture', 'avatarGlyph', options.avatarGlyphs, profile.avatar.glyph, (face, item) => { face.textContent = item.emoji; }),
        choiceGrid('Picture color', 'avatarColor', options.avatarColors.map((c) => ({ ...c, label: c.id.charAt(0).toUpperCase() + c.id.slice(1) })), profile.avatar.color, (face, item) => { face.style.background = item.hex; })
    );

    /* ---------- Top 8 ---------- */

    const people = group('Top 8 and visibility', 'Your closest brothers and sisters, in order. Only members with a visible profile can be added.');
    let top8 = (profile.top8 || []).map((m) => ({ handle: m.handle, displayName: m.displayName }));
    const chipList = P.el('ol', 'pf-chips');
    const top8Status = P.el('p', 'pf-status');
    top8Status.hidden = true;
    top8Status.setAttribute('aria-live', 'polite');

    const chipButton = (text, label, onClick, disabled = false) => {
        const b = P.el('button', 'pf-chip-btn', text);
        b.type = 'button';
        b.setAttribute('aria-label', label);
        b.disabled = disabled;
        b.addEventListener('click', onClick);
        return b;
    };

    const renderChips = () => {
        chipList.replaceChildren();
        if (!top8.length) {
            chipList.append(P.el('li', 'pf-muted', 'No one yet. You can add up to 8 members.'));
        }
        top8.forEach((member, index) => {
            const li = P.el('li', 'pf-chip');
            li.append(P.el('span', 'pf-chip-pos', String(index + 1)));
            const who = P.el('span', 'pf-chip-who');
            who.append(P.el('span', 'pf-chip-name', member.displayName), P.el('span', 'pf-chip-handle', `@${member.handle}`));
            li.append(who);
            li.append(
                chipButton('↑', `Move ${member.displayName} up`, () => move(index, -1), index === 0),
                chipButton('↓', `Move ${member.displayName} down`, () => move(index, 1), index === top8.length - 1),
                chipButton('Remove', `Remove ${member.displayName} from your Top 8`, () => remove(index))
            );
            chipList.append(li);
        });
    };

    const move = (index, step) => {
        const other = index + step;
        [top8[index], top8[other]] = [top8[other], top8[index]];
        markDirty();
        renderChips();
    };
    const remove = (index) => {
        top8.splice(index, 1);
        markDirty();
        renderChips();
        P.status(top8Status, '');
    };

    const addWrap = P.el('div', 'pf-top8-add');
    const addLabel = P.el('label', 'pf-field');
    addLabel.append(P.el('span', 'pf-field-label', 'Add a member by username'));
    const addInput = P.el('input');
    addInput.type = 'text';
    addInput.autocomplete = 'off';
    addInput.autocapitalize = 'none';
    addInput.spellcheck = false;
    addInput.maxLength = limits.handleMax + 1;
    addLabel.append(addInput);
    const addButton = P.el('button', 'pf-btn', 'Add to Top 8');
    addButton.type = 'button';
    addWrap.append(addLabel, addButton);

    const addMember = async () => {
        const raw = addInput.value.trim().replace(/^@/, '');
        if (!raw) {
            return;
        }
        const key = raw.toLowerCase();
        if (top8.length >= limits.top8) {
            P.status(top8Status, `Your Top ${limits.top8} is full. Remove someone first.`, 'error');
            return;
        }
        if (key === profile.username) {
            P.status(top8Status, 'You cannot add yourself.', 'error');
            return;
        }
        if (top8.some((m) => m.handle.toLowerCase() === key)) {
            P.status(top8Status, 'That member is already in your Top 8.', 'error');
            return;
        }
        addButton.disabled = true;
        P.status(top8Status, 'Looking up member…');
        try {
            // The directory search does not count as a profile view.
            const found = (await P.api(`/api/profile?list=1&q=${encodeURIComponent(raw)}`)).profiles.find((m) => m.handle.toLowerCase() === key);
            if (!found) {
                P.status(top8Status, `No member named "${raw}" with a visible profile.`, 'error');
                return;
            }
            top8.push({ handle: found.handle, displayName: found.displayName });
            addInput.value = '';
            markDirty();
            renderChips();
            P.status(top8Status, `${found.displayName} added.`, 'success');
        } catch (err) {
            console.error('Top 8 lookup failed', err);
            P.status(top8Status, err.message, 'error');
        } finally {
            addButton.disabled = false;
        }
    };
    addButton.addEventListener('click', addMember);
    addInput.addEventListener('keydown', (event) => {
        if (event.key === 'Enter') {
            event.preventDefault();
            addMember();
        }
    });

    people.append(
        selectField('Who can see my profile', 'visibility', options.visibility, profile.visibility),
        chipList,
        addWrap,
        top8Status
    );

    /* ---------- actions ---------- */

    const actions = P.el('div', 'pf-editor-actions');
    const submit = P.el('button', 'pf-btn pf-btn--primary', 'Save profile');
    submit.type = 'submit';
    const cancel = P.el('a', 'pf-btn', 'Cancel');
    cancel.href = profileUrl;
    const viewLink = P.el('a', 'pf-btn', 'View my profile');
    viewLink.href = profileUrl;
    viewLink.hidden = true;
    const status = P.el('p', 'pf-status');
    status.hidden = true;
    status.setAttribute('aria-live', 'polite');
    const buttons = P.el('div', 'pf-editor-buttons');
    buttons.append(submit, cancel, viewLink);
    actions.append(buttons, status);

    form.append(basics, about, look, people, actions);

    /* ---------- live preview ---------- */

    const previewHost = P.el('div', 'pf-preview-body');
    const preview = P.el('aside', 'pf-preview');
    preview.setAttribute('aria-label', 'Live preview of your profile');
    preview.append(P.el('h2', 'pf-preview-title', 'Live preview'), previewHost);

    const value = (name) => form.elements[name].value;
    const renderPreview = () => {
        const mood = options.moods.find((m) => m.id === value('mood'));
        const page = P.el('div', `pf-profile pf-theme--${value('theme')} pf-pattern--${value('pattern')}`);
        const mast = P.el('section', 'pf-box pf-masthead');
        const avatar = { glyph: value('avatarGlyph'), color: value('avatarColor') };
        mast.append(P.avatarNode(avatar, 'md'));
        const info = P.el('div', 'pf-preview-info');
        const facility = value('facility');
        const job = value('jobTitle');
        info.append(
            P.el('h3', 'pf-preview-name', value('displayName').trim() || profile.handle),
            P.el('p', 'pf-handle', `@${profile.handle}${facility ? ` · ${facility}` : ''}${job ? ` · ${job}` : ''}`)
        );
        if (mood) {
            info.append(P.el('p', 'pf-mood', `${mood.emoji} ${mood.label}`));
        }
        if (value('headline').trim()) {
            info.append(P.el('p', 'pf-headline', value('headline').trim()));
        }
        if (profile.badges.length) {
            info.append(P.badgeRow(profile.badges));
        }
        mast.append(info);
        const aboutBox = P.el('section', 'pf-box');
        const text = value('aboutMe').trim();
        aboutBox.append(
            P.el('h3', 'pf-box-title', 'About me'),
            P.el('div', 'pf-box-body', text ? (text.length > 220 ? `${text.slice(0, 220)}…` : text) : 'Nothing here yet.')
        );
        page.append(mast, aboutBox);
        previewHost.replaceChildren(page);
    };

    /* ---------- dirty tracking, leaving, saving ---------- */

    function markDirty() {
        dirty = true;
        viewLink.hidden = true;
        renderPreview();
    }
    form.addEventListener('input', markDirty);
    form.addEventListener('change', markDirty);
    window.addEventListener('beforeunload', (event) => {
        if (dirty) {
            event.preventDefault();
            event.returnValue = '';
        }
    });

    form.addEventListener('submit', async (event) => {
        event.preventDefault();
        submit.disabled = true;
        P.status(status, 'Saving…');
        const body = {
            displayName: value('displayName'),
            headline: value('headline'),
            jobTitle: value('jobTitle'),
            facility: value('facility'),
            mood: value('mood'),
            aboutMe: value('aboutMe'),
            interests: value('interests'),
            wantToMeet: value('wantToMeet'),
            theme: value('theme'),
            pattern: value('pattern'),
            visibility: value('visibility'),
            avatar: { glyph: value('avatarGlyph'), color: value('avatarColor') },
            top8: top8.map((m) => m.handle)
        };
        try {
            await P.api('/api/profile', { method: 'PUT', body });
            dirty = false;
            P.status(status, 'Saved. Your profile is up to date.', 'success');
            viewLink.hidden = false;
        } catch (err) {
            console.error('Profile save failed', err);
            P.status(status, err.message, 'error');
        } finally {
            submit.disabled = false;
        }
    });

    const layout = P.el('div', 'pf-edit-layout');
    layout.append(form, preview);
    host.replaceChildren(layout);
    renderChips();
    renderPreview();
});
