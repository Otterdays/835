// [TRACE: ACCOUNTS.md]
// Account-backed forum client. Legacy guest authors remain plain text; new posts use session identity.
document.addEventListener('DOMContentLoaded', async () => {
    const API='/api/forum', $=id=>document.getElementById(id), P=window.ProfileUI;
    const CATEGORIES=[['General','General'],['Contract','Contract & bargaining'],['Workplace','Workplace issues'],['CFCF','CFCF'],['RCF','RCF'],['PICC','PICC'],['Website','Website feedback']];
    const labels=Object.fromEntries(CATEGORIES); const el=(tag,cls,text)=>{const n=document.createElement(tag);if(cls)n.className=cls;if(text!==undefined)n.textContent=text;return n;};
    const status=(n,t,bad=false)=>{n.textContent=t;n.className=`forum-status${bad?' forum-status--error':''}`;n.hidden=!t;};
    const signed=await Auth.whenReady(); const user=Auth.account();
    const list=$('forum-thread-list'), threadForm=$('forum-thread-form'), replyForm=$('forum-reply-form'); if(!list||!threadForm)return;
    $('forum-signin-prompt').hidden=Boolean(signed);
    $('forum-new-card').hidden=!signed; $('forum-reply-card').hidden=!signed;
    const APIcall=async(path,opts={})=>{const r=await fetch(API+path,{...opts,credentials:'same-origin',headers:{Accept:'application/json','Content-Type':'application/json',...(opts.headers||{})}});const d=await r.json().catch(()=>({}));if(!r.ok||!d.ok)throw Error(d.error||`Forum error (${r.status}).`);return d;};
    const authorNode=(author,profile,authorKey)=>{if(!profile){const plain=el('span','forum-author-wrap');plain.append(el('span','forum-author',author||'Guest'));if(!authorKey){const tag=el('span','forum-guest','guest');tag.title='Posted with a temporary name before member accounts existed.';plain.append(tag);}return plain;}const a=el('a','forum-author forum-author--member',profile.displayName||author);a.href=P.profileHref(profile.handle);const row=el('span','forum-author-wrap');row.append(a,P.badgeRow(profile.badges));return row;};
    const you=(key)=>Boolean(user&&key&&key.toLowerCase()===user.username.toLowerCase());
    const metaNode=(item,when,category)=>{const n=el('p',when?'forum-meta':'forum-row-meta');n.append(authorNode(item.author,item.authorProfile,item.authorKey));if(you(item.authorKey))n.append(el('span','forum-you',' (you)'));n.append(document.createTextNode(` · ${category?`${labels[item.category]||item.category} · `:''}${when||''}`));return n;};
    let threads=[],openThread=null;
    const VIEW_KEY='oe835_forum_view'; let view='board';
    try{if(localStorage.getItem(VIEW_KEY)==='list')view='list';}catch(err){console.error('Forum view preference unavailable',err);}
    const plural=(n,w)=>`${n} ${w}${n===1?'':'s'}`;
    const when=(t)=>`${t.replyCount} ${t.replyCount===1?'reply':'replies'} · ${new Date(t.lastActivityAt).toLocaleDateString()}`;
    const excerpt=(text)=>{const flat=String(text||'').replace(/\s+/g,' ').trim();return flat.length>130?`${flat.slice(0,130)}…`:flat;};
    const syncView=()=>{document.querySelectorAll('.forum-view-btn').forEach(b=>b.setAttribute('aria-pressed',String(b.dataset.view===view)));const onList=!/^#t=/.test(location.hash);document.body.classList.toggle('forum-board-mode',onList&&view==='board');};
    const renderBoard=()=>{
        list.className='forum-board';list.replaceChildren();
        const only=$('forum-filter').value;
        CATEGORIES.filter(([v])=>!only||v===only).forEach(([value,label])=>{
            const items=threads.filter(t=>t.category===value);
            const col=el('section','forum-col');col.setAttribute('aria-label',`${label}: ${plural(items.length,'thread')}`);
            const head=el('header','forum-col-head');head.append(el('h3','forum-col-title',label),el('span','forum-col-count',String(items.length)));
            const body=el('div','forum-col-body');
            if(!items.length)body.append(el('p','forum-col-empty','No threads yet.'));
            items.forEach(t=>{
                const card=el('article','forum-card');
                const a=el('a','forum-card-link');a.href=`#t=${encodeURIComponent(t.id)}`;a.append(el('h4','forum-card-title',t.title));card.append(a);
                const text=excerpt(t.body);if(text)card.append(el('p','forum-card-excerpt',text));
                const m=metaNode(t,when(t),false);m.className='forum-card-meta';card.append(m);
                body.append(card);
            });
            col.append(head,body);list.append(col);
        });
    };
    // Sideways-scroll arrows: shown only while the board really overflows, and only toward the side that has more.
    const arrowPrev=$('forum-board-prev'), arrowNext=$('forum-board-next'), boardWrap=$('forum-board-wrap');
    const syncArrows=()=>{
        const scrolls=view==='board'&&list.classList.contains('forum-board')&&list.scrollWidth>list.clientWidth+4;
        const max=list.scrollWidth-list.clientWidth;
        const showPrev=scrolls&&list.scrollLeft>4, showNext=scrolls&&list.scrollLeft<max-4;
        arrowPrev.hidden=!showPrev; arrowNext.hidden=!showNext;
        boardWrap.classList.toggle('has-more-left',showPrev); boardWrap.classList.toggle('has-more-right',showNext);
    };
    const nudge=(dir)=>{
        const reduce=window.matchMedia('(prefers-reduced-motion: reduce)').matches;
        list.scrollBy({left:dir*Math.max(list.clientWidth*0.8,200),behavior:reduce?'auto':'smooth'});
    };
    arrowPrev.addEventListener('click',()=>nudge(-1)); arrowNext.addEventListener('click',()=>nudge(1));
    list.addEventListener('scroll',syncArrows,{passive:true}); window.addEventListener('resize',syncArrows);if('ResizeObserver' in window)new ResizeObserver(syncArrows).observe(list);
    const renderRows=()=>{
        list.className='forum-list';list.replaceChildren();
        threads.forEach(t=>{const row=el('div','forum-row');const a=el('a','forum-row-link');a.href=`#t=${encodeURIComponent(t.id)}`;a.append(el('h3','forum-row-title',t.title));const m=metaNode(t,when(t),true);row.append(a,m);list.append(row);});
    };
    const renderList=()=>{
        syncView();
        const hint=$('forum-board-hint');hint.hidden=view!=='board'||!threads.length;
        $('forum-limit-note').textContent=threads.length>=50?'Showing the 50 most recently active threads.':'';
        if(!threads.length){list.className='forum-list';list.replaceChildren(el('p','forum-empty','No threads yet. Start the first one.'));syncArrows();return;}
        if(view==='board')renderBoard();else renderRows();
        list.scrollLeft=0;syncArrows();
    };
    const loadList=async()=>{list.replaceChildren(el('p','forum-empty','Loading threads…'));try{const cat=$('forum-filter').value;threads=(await APIcall(`/threads${cat?`?category=${encodeURIComponent(cat)}`:''}`)).threads;renderList();}catch(e){list.replaceChildren(el('p','forum-status forum-status--error',e.message));}};
    // Delete: your own posts, or any post if you are an admin. The server decides; this only decides whether to show the button.
    const canDelete=(item)=>Boolean(user&&(user.role==='admin'||you(item.authorKey)));
    const deleteButton=(label,onClick)=>{const b=el('button','forum-delete',label);b.type='button';b.addEventListener('click',onClick);return b;};
    const removeThread=async()=>{
        const {thread,replies}=openThread;const mine=you(thread.authorKey);
        const others=replies.filter(r=>!you(r.authorKey)).length;
        const note=replies.length?` This also removes its ${replies.length} ${replies.length===1?'reply':'replies'}${others?`, including ${others} from other members`:''}.`:'';
        if(!window.confirm(`Delete ${mine?'your thread':`${thread.author}'s thread`} "${thread.title}"?${note} This cannot be undone.`))return;
        try{await APIcall(`/thread?id=${encodeURIComponent(thread.id)}`,{method:'DELETE'});openThread=null;location.hash='';}
        catch(e){window.alert(e.message);}
    };
    const removeReply=async(reply)=>{
        if(!window.confirm(`Delete ${you(reply.authorKey)?'your reply':`${reply.author}'s reply`}? This cannot be undone.`))return;
        try{await APIcall(`/thread?reply=${encodeURIComponent(reply.id)}`,{method:'DELETE'});openThread.replies=openThread.replies.filter(r=>r.id!==reply.id);openThread.thread.replyCount=Math.max(0,(openThread.thread.replyCount||1)-1);renderThread();}
        catch(e){window.alert(e.message);}
    };
    const renderThread=()=>{
        const {thread,replies}=openThread;
        const main=$('forum-thread-main');
        main.replaceChildren(el('h2','',thread.title),metaNode(thread,`${labels[thread.category]||thread.category} · ${new Date(thread.createdAt).toLocaleString()}`,false),el('p','forum-body',thread.body));
        if(canDelete(thread))main.append(deleteButton('Delete thread',removeThread));
        $('forum-replies-count').textContent=replies.length?`(${replies.length})`:'';
        const target=$('forum-reply-list');target.replaceChildren();
        if(!replies.length)target.append(el('p','forum-empty','No replies yet.'));
        replies.forEach(r=>{const p=el('article','forum-post');p.append(metaNode(r,new Date(r.createdAt).toLocaleString(),false),el('p','forum-body',r.body));if(canDelete(r))p.append(deleteButton('Delete reply',()=>removeReply(r)));target.append(p);});
    };
    const loadThread=async(id)=>{try{openThread=await APIcall(`/thread?id=${encodeURIComponent(id)}`);renderThread();}catch(e){$('forum-thread-main').replaceChildren(el('p','forum-status forum-status--error',e.message));}};
    const route=()=>{const m=/^#t=([a-f0-9]{24})$/i.exec(location.hash),id=m?.[1];$('forum-list-view').hidden=Boolean(id);$('forum-thread-view').hidden=!id;syncView();if(id)loadThread(id);else{openThread=null;loadList();}};
    $('forum-filter').add(new Option('All categories',''));CATEGORIES.forEach(([v,l])=>{$('forum-thread-category').add(new Option(l,v));$('forum-filter').add(new Option(l,v));});
    document.querySelectorAll('.forum-view-btn').forEach(b=>b.addEventListener('click',()=>{view=b.dataset.view;try{localStorage.setItem(VIEW_KEY,view);}catch(err){console.error('Forum view preference not saved',err);}renderList();}));$('forum-filter').addEventListener('change',loadList);
    threadForm.addEventListener('submit',async e=>{e.preventDefault();if(!signed){location.href='signin.html?next=forum.html';return;}const b=$('forum-thread-submit');b.disabled=true;status($('forum-thread-status'),'Posting…');try{const d=await APIcall('/threads',{method:'POST',body:JSON.stringify({category:$('forum-thread-category').value,title:$('forum-thread-title').value,body:$('forum-thread-body').value,website:$('forum-thread-website').value})});threadForm.reset();location.hash=`t=${encodeURIComponent(d.thread.id)}`;}catch(err){status($('forum-thread-status'),err.message,true);}finally{b.disabled=false;}});
    replyForm.addEventListener('submit',async e=>{e.preventDefault();if(!signed){location.href='signin.html?next=forum.html';return;}if(!openThread)return;const b=$('forum-reply-submit');b.disabled=true;status($('forum-reply-status'),'Posting…');try{const d=await APIcall('/thread',{method:'POST',body:JSON.stringify({threadId:openThread.thread.id,body:$('forum-reply-body').value,website:$('forum-reply-website').value})});replyForm.reset();openThread.replies.push(d.reply);renderThread();}catch(err){status($('forum-reply-status'),err.message,true);}finally{b.disabled=false;}});
    window.addEventListener('hashchange',route);route();
});
