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
        main.append(box('About me',profile.aboutMe),box('Interests',profile.interests));
        const details=P.el('section','pf-box');details.append(P.el('h2','pf-box-title','Member details'));const dl=document.createElement('dl');[['Job title',profile.jobTitle?`${profile.jobTitle} (self-reported)`:'' ],['Facility',profile.facility],['Member since',P.formatDate(profile.memberSince)],['Profile views',String(profile.views||0)]].forEach(([k,v])=>{if(!v)return;dl.append(P.el('dt','',k),P.el('dd','',v));});details.append(dl);rail.append(details);
        if((profile.links||[]).length){rail.append(P.linksBox(profile.links));}
        const top=P.el('section','pf-box');top.append(P.el('h2','pf-box-title','Top 8'));const topgrid=P.el('div','pf-top8');(profile.top8||[]).forEach(m=>topgrid.append(card(m)));if(!topgrid.children.length)topgrid.append(P.el('p','pf-muted','No Top 8 members added yet.'));top.append(topgrid);rail.append(top);columns.append(main,rail);page.append(columns);
        const wall=P.el('section','pf-box pf-wall');wall.append(P.el('h2','pf-box-title','Comments wall'));const list=P.el('div','pf-comment-list');
        const renderComment=c=>{const article=P.el('article','pf-comment');const meta=P.el('div','pf-comment-meta');meta.append(linkName(c.author),document.createTextNode(` · ${P.formatDateTime(c.createdAt)}`),P.badgeRow(c.author.badges));article.append(meta,P.el('p','',c.body));if(c.canDelete){const del=P.el('button','pf-text-button','Delete');del.type='button';del.addEventListener('click',async()=>{try{await P.api(`/api/profile/comments?id=${encodeURIComponent(c.id)}`,{method:'DELETE'});article.remove();}catch(err){setStatus(wallStatus,err.message,true);}});article.append(del);}return article;};
        commentsData.comments.forEach(c=>list.append(renderComment(c)));if(!list.children.length)list.append(P.el('p','pf-muted','No comments yet.'));
        const wallStatus=P.el('p','pf-status');wallStatus.hidden=true;const commentForm=P.el('form','pf-form');commentForm.append(P.el('label','','Leave a comment'));const ta=document.createElement('textarea');ta.name='body';ta.maxLength=500;ta.required=true;commentForm.lastChild.append(ta);const button=P.el('button','pf-btn pf-btn--primary','Post comment');button.type='submit';commentForm.append(button,wallStatus);commentForm.addEventListener('submit',async e=>{e.preventDefault();button.disabled=true;try{const data=await P.api('/api/profile/comments',{method:'POST',body:{u:profile.handle,body:ta.value}});list.prepend(renderComment(data.comment));ta.value='';setStatus(wallStatus,'Comment posted.');}catch(err){setStatus(wallStatus,err.message,true);}finally{button.disabled=false;}});wall.append(list,commentForm);page.append(wall);root.replaceChildren(page);
    } catch(err) { root.replaceChildren(P.el('p','pf-status pf-status--error',err.message)); }
});
