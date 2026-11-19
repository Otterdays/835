// [TRACE: ACCOUNTS.md]
document.addEventListener('DOMContentLoaded', async () => {
    const P = window.ProfileUI;
    const $ = (s, root = document) => root.querySelector(s);
    const setStatus = (node, message, error = false) => { node.textContent = message; node.hidden = !message; node.classList.toggle('is-error', error); };
    const signedIn = await Auth.whenReady();
    const options = await P.getOptions().catch((err) => { console.error(err); return null; });
    const root = $('#profile-root');

    const linkName = (summary) => {
        const a = P.el('a', 'pf-name-link', summary.displayName || summary.handle);
        a.href = P.profileHref(summary.handle);
        return a;
    };
    const card = (summary) => {
        const article = P.el('article', 'pf-member-card');
        article.append(P.avatarNode(summary.avatar, 'md'));
        const copy = P.el('div', 'pf-member-copy');
        copy.append(linkName(summary));
        copy.append(P.el('p', 'pf-muted', `@${summary.handle}${summary.facility ? ` · ${summary.facility}` : ''}${summary.online ? ' · Online now' : ''}`));
        if (summary.headline) copy.append(P.el('p', 'pf-headline', summary.headline));
        if (summary.badges?.length) copy.append(P.badgeRow(summary.badges));
        article.append(copy);
        return article;
    };

    if ($('#members-grid')) {
        const grid = $('#members-grid'), status = $('#members-status'), form = $('#member-filter');
        if (!signedIn) { grid.replaceChildren(P.signInPrompt('The member directory', 'members.html')); return; }
        options?.facilities.forEach((f) => form.elements.facility.add(new Option(f, f)));
        const load = async (event) => {
            event?.preventDefault();
            const params = new URLSearchParams(new FormData(form));
            setStatus(status, 'Loading members…');
            try {
                const data = await P.api(`/api/profile?list=1&${params}`);
                grid.replaceChildren(...data.profiles.map(card));
                setStatus(status, data.total ? `${data.total} member${data.total === 1 ? '' : 's'}${data.truncated ? ' shown (directory limit reached).' : '.'}` : 'No member profiles match.');
            } catch (err) { setStatus(status, err.message, true); }
        };
        form.addEventListener('submit', load); form.elements.sort.addEventListener('change', load); load(); return;
    }

    if ($('#profile-edit-root')) {
        const host = $('#profile-edit-root');
        if (!signedIn) { host.replaceChildren(P.signInPrompt('Profile editing', 'profile-edit.html')); return; }
        try {
            const me = Auth.account();
            const data = await P.api(`/api/profile?u=${encodeURIComponent(me.username)}`);
            const profile = data.profile;
            const form = P.el('form', 'pf-box pf-form pf-editor');
            const groups = [
                ['Basics and work', 'Your display name, headline, and work details.'],
                ['About you', 'Share only what you are comfortable sharing with other signed-in members.'],
                ['Profile look', 'Choose from the available colors, patterns, and icons.'],
                ['Top 8 and visibility', 'Add up to eight members by username. Hidden profiles are visible only to you.']
            ].map(([title, help]) => {
                const group = document.createElement('fieldset');
                group.className = 'pf-editor-group';
                const legend = document.createElement('legend'); legend.textContent = title;
                group.append(legend, P.el('p', 'pf-muted pf-editor-help', help));
                form.append(group);
                return group;
            });
            let groupIndex = 0;
            const field = (label, name, value = '', type = 'text', max = 1500) => {
                const wrap = P.el('label', 'pf-field', label);
                const input = type === 'textarea' ? P.el('textarea') : P.el('input');
                if (type !== 'textarea') input.type = type;
                input.name = name; input.maxLength = max; input.value = value || '';
                wrap.append(input); groups[groupIndex].append(wrap); return input;
            };
            const select = (label, name, rows, selected) => {
                const wrap = P.el('label', 'pf-field', label), input = document.createElement('select');
                input.name = name;
                rows.forEach(row => input.add(new Option(row.label || row, row.id || row)));
                input.value = selected || ''; wrap.append(input); groups[groupIndex].append(wrap); return input;
            };
            groupIndex = 0;
            field('Display name', 'displayName', profile.displayName, 'text', 30);
            field('Short headline', 'headline', profile.headline, 'text', 80);
            field('Job title (self-reported)', 'jobTitle', profile.jobTitle, 'text', 40);
            select('Facility', 'facility', [{id:'',label:'Choose a facility'}, ...options.facilities.map(x => ({id:x,label:x}))], profile.facility);
            groupIndex = 1;
            field('About me', 'aboutMe', profile.aboutMe, 'textarea', 1500);
            field('Interests', 'interests', profile.interests, 'textarea', 800);
            field("Who I'd like to meet", 'wantToMeet', profile.wantToMeet, 'textarea', 800);
            groupIndex = 2;
            select('Mood', 'mood', [{id:'',label:'No mood'}, ...options.moods], profile.mood);
            select('Profile theme', 'theme', options.themes, profile.theme);
            select('Background pattern', 'pattern', options.patterns, profile.pattern);
            select('Avatar icon', 'avatarGlyph', options.avatarGlyphs.map(x => ({id:x.id,label:`${x.emoji} ${x.id}`})), profile.avatar.glyph);
            select('Avatar color', 'avatarColor', options.avatarColors.map(x => ({id:x.id,label:x.id})), profile.avatar.color);
            groupIndex = 3;
            select('Profile visibility', 'visibility', options.visibility, profile.visibility);
            field('Top 8 member usernames, separated by commas', 'top8', (profile.top8Handles || []).join(', '), 'text', 200);
            const actions = P.el('div', 'pf-editor-actions');
            const submit = P.el('button', 'pf-btn pf-btn--primary', 'Save profile'); submit.type = 'submit'; actions.append(submit);
            const status = P.el('p', 'pf-status'); status.hidden = true; status.setAttribute('aria-live', 'polite'); actions.append(status);
            form.append(actions);
            host.replaceChildren(form);
            form.addEventListener('submit',async e=>{e.preventDefault();submit.disabled=true;const f=new FormData(form);const body=Object.fromEntries(f);body.avatar={glyph:body.avatarGlyph,color:body.avatarColor};delete body.avatarGlyph;delete body.avatarColor;body.top8=String(body.top8||'').split(',').map(x=>x.trim()).filter(Boolean);try{await P.api('/api/profile',{method:'PUT',body});setStatus(status,'Profile saved.');}catch(err){setStatus(status,err.message,true);}finally{submit.disabled=false;}});
        } catch(err) { host.replaceChildren(P.el('p','pf-status pf-status--error',err.message)); }
        return;
    }

    if (!root) return;
    if (!signedIn) { root.replaceChildren(P.signInPrompt('Member profiles', 'profile.html')); return; }
    const handle = new URLSearchParams(location.search).get('u') || Auth.account()?.username;
    if (!handle) { root.replaceChildren(P.signInPrompt('Member profiles', 'profile.html')); return; }
    try {
        const [{profile}, commentsData] = await Promise.all([P.api(`/api/profile?u=${encodeURIComponent(handle)}`), P.api(`/api/profile/comments?u=${encodeURIComponent(handle)}`)]);
        document.title = `${profile.displayName} — Local 835`;
        $('#profile-title').textContent = profile.displayName;
        $('#profile-intro').textContent = profile.headline || `@${profile.handle}${profile.online ? ' · Online now' : ''}`;
        const page = P.el('div',`pf-profile pf-theme--${profile.theme} pf-pattern--${profile.pattern}`);
        const mast = P.el('section','pf-box pf-masthead');
        mast.append(P.avatarNode(profile.avatar,'lg'));
        const intro=P.el('div');intro.append(P.el('h2','',profile.displayName),P.el('p','pf-handle',`@${profile.handle}${profile.facility?` · ${profile.facility}`:''}${profile.online?' · Online now':''}`));if(profile.mood){const mood=options.moods.find(x=>x.id===profile.mood);intro.append(P.el('p','pf-mood',`${mood.emoji} ${mood.label}`));} intro.append(P.badgeRow(profile.badges));mast.append(intro);
        if(profile.isSelf){const edit=P.el('a','pf-btn','Edit profile');edit.href='profile-edit.html';mast.append(edit);} page.append(mast);
        const columns=P.el('div','pf-profile-columns'); const main=P.el('div','pf-profile-main'), rail=P.el('aside','pf-profile-rail');
        const box=(title,text)=>{const b=P.el('section','pf-box');b.append(P.el('h2','pf-box-title',title),P.el('div','pf-box-body',text||'Nothing here yet.'));return b;};
        main.append(box('About me',profile.aboutMe),box('Interests',profile.interests),box("Who I'd like to meet",profile.wantToMeet));
        const details=P.el('section','pf-box');details.append(P.el('h2','pf-box-title','Member details'));const dl=document.createElement('dl');[['Job title',profile.jobTitle?`${profile.jobTitle} (self-reported)`:'' ],['Facility',profile.facility],['Member since',P.formatDate(profile.memberSince)],['Profile views',String(profile.views||0)]].forEach(([k,v])=>{if(!v)return;dl.append(P.el('dt','',k),P.el('dd','',v));});details.append(dl);rail.append(details);
        const top=P.el('section','pf-box');top.append(P.el('h2','pf-box-title','Top 8'));const topgrid=P.el('div','pf-top8');(profile.top8||[]).forEach(m=>topgrid.append(card(m)));if(!topgrid.children.length)topgrid.append(P.el('p','pf-muted','No Top 8 members added yet.'));top.append(topgrid);rail.append(top);columns.append(main,rail);page.append(columns);
        const wall=P.el('section','pf-box pf-wall');wall.append(P.el('h2','pf-box-title','Comments wall'));const list=P.el('div','pf-comment-list');
        const renderComment=c=>{const article=P.el('article','pf-comment');const meta=P.el('div','pf-comment-meta');meta.append(linkName(c.author),document.createTextNode(` · ${P.formatDateTime(c.createdAt)}`),P.badgeRow(c.author.badges));article.append(meta,P.el('p','',c.body));if(c.canDelete){const del=P.el('button','pf-text-button','Delete');del.type='button';del.addEventListener('click',async()=>{try{await P.api(`/api/profile/comments?id=${encodeURIComponent(c.id)}`,{method:'DELETE'});article.remove();}catch(err){setStatus(wallStatus,err.message,true);}});article.append(del);}return article;};
        commentsData.comments.forEach(c=>list.append(renderComment(c)));if(!list.children.length)list.append(P.el('p','pf-muted','No comments yet.'));
        const wallStatus=P.el('p','pf-status');wallStatus.hidden=true;const commentForm=P.el('form','pf-form');commentForm.append(P.el('label','','Leave a comment'));const ta=document.createElement('textarea');ta.name='body';ta.maxLength=500;ta.required=true;commentForm.lastChild.append(ta);const button=P.el('button','pf-btn pf-btn--primary','Post comment');button.type='submit';commentForm.append(button,wallStatus);commentForm.addEventListener('submit',async e=>{e.preventDefault();button.disabled=true;try{const data=await P.api('/api/profile/comments',{method:'POST',body:{u:profile.handle,body:ta.value}});list.prepend(renderComment(data.comment));ta.value='';setStatus(wallStatus,'Comment posted.');}catch(err){setStatus(wallStatus,err.message,true);}finally{button.disabled=false;}});wall.append(list,commentForm);page.append(wall);root.replaceChildren(page);
    } catch(err) { root.replaceChildren(P.el('p','pf-status pf-status--error',err.message)); }
});
