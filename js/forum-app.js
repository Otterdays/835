// [TRACE: ARCHITECTURE.md]
// Community forum client. Temporary usernames live in localStorage only —
// there is no login. All post text is rendered with textContent only.
document.addEventListener('DOMContentLoaded', () => {
    const NAME_KEY = 'oe835_forum_username';
    const API = '/api/forum';

    // Mirror of api/_lib/forum.js (server is authoritative).
    const CATEGORIES = [
        ['General', 'General'],
        ['Contract', 'Contract & bargaining'],
        ['Workplace', 'Workplace issues'],
        ['CFCF', 'CFCF'],
        ['RCF', 'RCF'],
        ['PICC', 'PICC'],
        ['Website', 'Website feedback']
    ];
    const CATEGORY_LABEL = Object.fromEntries(CATEGORIES);
    const NAME_MIN = 3;
    const NAME_MAX = 20;
    const NAME_PATTERN = /^[A-Za-z0-9][A-Za-z0-9 _-]*[A-Za-z0-9]$/;
    const RESERVED_PREFIXES = [
        'admin', 'moderator', 'mod', 'steward', 'shopsteward', 'local835',
        'oe835', 'iuoe', 'union', 'official', 'staff', 'system', 'support'
    ];
    const ADJECTIVES = ['Steady', 'Quiet', 'Bright', 'Solid', 'Swift', 'Calm', 'Bold', 'Sharp'];
    const NOUNS = ['Wrench', 'Gauge', 'Valve', 'Bolt', 'Lever', 'Torque', 'Boiler', 'Pipe'];

    const $ = (id) => document.getElementById(id);
    const els = {
        account: $('forum-account'),
        accountName: $('forum-account-name'),
        accountToggle: $('forum-account-toggle'),
        accountPanel: $('forum-account-panel'),
        nameForm: $('forum-name-form'),
        nameChange: $('forum-name-change'),
        nameRandomChange: $('forum-name-random-change'),
        nameForget: $('forum-name-forget'),
        accountStatus: $('forum-account-status'),
        setup: $('forum-name-setup'),
        setupForm: $('forum-setup-form'),
        setupName: $('forum-setup-name'),
        nameRandomSetup: $('forum-name-random-setup'),
        setupStatus: $('forum-setup-status'),
        listView: $('forum-list-view'),
        newCard: $('forum-new-card'),
        threadForm: $('forum-thread-form'),
        threadCategory: $('forum-thread-category'),
        threadTitle: $('forum-thread-title'),
        threadBody: $('forum-thread-body'),
        threadWebsite: $('forum-thread-website'),
        threadSubmit: $('forum-thread-submit'),
        threadStatus: $('forum-thread-status'),
        filter: $('forum-filter'),
        boardCount: $('forum-board-count'),
        threadList: $('forum-thread-list'),
        threadView: $('forum-thread-view'),
        threadMain: $('forum-thread-main'),
        repliesCount: $('forum-replies-count'),
        replyList: $('forum-reply-list'),
        replyCard: $('forum-reply-card'),
        replyForm: $('forum-reply-form'),
        replyBody: $('forum-reply-body'),
        replyWebsite: $('forum-reply-website'),
        replySubmit: $('forum-reply-submit'),
        replyStatus: $('forum-reply-status'),
        back: $('forum-back')
    };

    if (!els.threadList || !els.threadForm) {
        return;
    }

    /* ---------- temporary username (local only) ---------- */

    let memoryName = ''; // fallback when localStorage is blocked
    let storageWarned = false;

    const readName = () => {
        try {
            return localStorage.getItem(NAME_KEY) || memoryName;
        } catch (err) {
            console.error('Forum name read failed', err);
            return memoryName;
        }
    };

    const writeName = (name) => {
        memoryName = name;
        try {
            if (name) {
                localStorage.setItem(NAME_KEY, name);
            } else {
                localStorage.removeItem(NAME_KEY);
            }
            return true;
        } catch (err) {
            console.error('Forum name save failed', err);
            storageWarned = true;
            return false;
        }
    };

    const checkName = (raw) => {
        const value = String(raw || '').replace(/\s+/g, ' ').trim();
        if (value.length < NAME_MIN || value.length > NAME_MAX) {
            return { error: `Name must be ${NAME_MIN}–${NAME_MAX} characters.` };
        }
        if (!NAME_PATTERN.test(value)) {
            return { error: 'Use letters, numbers, spaces, - and _ (start and end with a letter or number).' };
        }
        const normalized = value.toLowerCase().replace(/[ _-]/g, '');
        if (RESERVED_PREFIXES.some((p) => normalized.startsWith(p))) {
            return { error: 'That name is reserved. Please pick another.' };
        }
        return { value };
    };

    const randomName = () => {
        const pick = (list) => list[Math.floor(Math.random() * list.length)];
        return `${pick(ADJECTIVES)}-${pick(NOUNS)}-${Math.floor(100 + Math.random() * 900)}`;
    };

    /* ---------- small helpers ---------- */

    const el = (tag, className, text) => {
        const node = document.createElement(tag);
        if (className) {
            node.className = className;
        }
        if (text !== undefined) {
            node.textContent = text;
        }
        return node;
    };

    const formatWhen = (iso) => {
        const d = new Date(iso);
        return Number.isNaN(d.getTime()) ? '' : d.toLocaleString();
    };

    const showStatus = (node, text, type = 'info') => {
        node.textContent = text;
        node.className = `suggestion-status suggestion-status--${type}`;
        node.hidden = !text;
    };

    const api = async (path, options) => {
        let res;
        try {
            res = await fetch(`${API}${path}`, {
                ...options,
                headers: { Accept: 'application/json', 'Content-Type': 'application/json' }
            });
        } catch (err) {
            console.error('Forum request failed', err);
            throw new Error('Could not reach the forum. Check your connection and try again.');
        }
        if (res.status === 404 && !path.includes('id=')) {
            throw new Error('Forum service not available here (needs the Vercel deployment or `npm run vercel:dev`).');
        }
        const data = await res.json().catch((err) => {
            console.error('Forum response parse failed', err);
            return {};
        });
        if (!res.ok || !data.ok) {
            throw new Error(data.error || `Forum error (${res.status}).`);
        }
        return data;
    };

    /* ---------- account UI ---------- */

    const currentName = () => readName();

    const applyNameState = () => {
        const name = currentName();
        const hasName = Boolean(name);
        els.setup.hidden = hasName;
        els.account.hidden = !hasName;
        els.accountName.textContent = name;
        els.newCard.hidden = !hasName;
        els.replyCard.hidden = !hasName;
        if (!hasName) {
            els.accountPanel.hidden = true;
            els.accountToggle.setAttribute('aria-expanded', 'false');
        }
    };

    const setName = (raw, statusNode) => {
        const checked = checkName(raw);
        if (checked.error) {
            showStatus(statusNode, checked.error, 'error');
            return false;
        }
        const saved = writeName(checked.value);
        applyNameState();
        rerenderCurrent();
        showStatus(
            statusNode,
            saved ? `You're posting as ${checked.value}.` : `Using ${checked.value} for this visit — your browser blocked saving it.`,
            saved ? 'success' : 'info'
        );
        return true;
    };

    els.setupForm.addEventListener('submit', (event) => {
        event.preventDefault();
        if (setName(els.setupName.value, els.setupStatus)) {
            els.setupName.value = '';
            showStatus(els.setupStatus, '', 'info');
        }
    });

    els.nameForm.addEventListener('submit', (event) => {
        event.preventDefault();
        setName(els.nameChange.value, els.accountStatus);
    });

    const fillRandom = (input) => {
        input.value = randomName();
        input.focus();
    };
    els.nameRandomSetup.addEventListener('click', () => fillRandom(els.setupName));
    els.nameRandomChange.addEventListener('click', () => fillRandom(els.nameChange));

    els.nameForget.addEventListener('click', () => {
        writeName('');
        els.nameChange.value = '';
        showStatus(els.accountStatus, '', 'info');
        applyNameState();
        rerenderCurrent();
    });

    els.accountToggle.addEventListener('click', () => {
        const open = els.accountPanel.hidden;
        els.accountPanel.hidden = !open;
        els.accountToggle.setAttribute('aria-expanded', String(open));
        if (open) {
            els.nameChange.value = currentName();
            showStatus(els.accountStatus, '', 'info');
            els.nameChange.focus();
        }
    });

    /* ---------- thread list ---------- */

    let threads = [];
    let openThread = null; // { thread, replies } for the thread view

    const fillCategories = () => {
        CATEGORIES.forEach(([value, label]) => {
            els.threadCategory.append(new Option(label, value));
        });
        els.filter.append(new Option('All categories', ''));
        CATEGORIES.forEach(([value, label]) => {
            els.filter.append(new Option(label, value));
        });
    };

    const authorNode = (author) => {
        const wrap = el('span', 'suggestion-post-name', author);
        if (author && author === currentName()) {
            wrap.append(el('span', 'forum-you', ' (you)'));
        }
        return wrap;
    };

    const renderThreadList = () => {
        els.threadList.replaceChildren();
        els.boardCount.textContent = `${threads.length} shown`;
        if (!threads.length) {
            els.threadList.append(el('p', 'suggestion-empty', 'No threads yet. Start the first one.'));
            return;
        }
        threads.forEach((t) => {
            const link = el('a', 'suggestion-post forum-thread-row');
            link.href = `#t=${encodeURIComponent(t.id)}`;
            link.append(el('h3', 'forum-thread-title', t.title));

            const meta = el('div', 'suggestion-post-meta');
            meta.append(authorNode(t.author), el('span', 'suggestion-post-topic', CATEGORY_LABEL[t.category] || t.category));
            const time = el('time', '', formatWhen(t.lastActivityAt));
            time.dateTime = t.lastActivityAt;
            meta.append(time);
            link.append(meta);

            link.append(
                el('p', 'forum-thread-replies', `${t.replyCount} ${t.replyCount === 1 ? 'reply' : 'replies'}`)
            );
            els.threadList.append(link);
        });
    };

    const loadThreads = async () => {
        els.threadList.replaceChildren(el('p', 'suggestion-empty', 'Loading threads…'));
        try {
            const query = els.filter.value ? `?category=${encodeURIComponent(els.filter.value)}` : '';
            const data = await api(`/threads${query}`);
            threads = data.threads;
            renderThreadList();
        } catch (err) {
            console.error('Forum list load failed', err);
            els.boardCount.textContent = '';
            els.threadList.replaceChildren(el('p', 'suggestion-status suggestion-status--error', err.message));
        }
    };

    els.filter.addEventListener('change', loadThreads);

    els.threadForm.addEventListener('submit', async (event) => {
        event.preventDefault();
        const author = currentName();
        if (!author) {
            showStatus(els.threadStatus, 'Pick a temporary name first.', 'error');
            return;
        }
        els.threadSubmit.disabled = true;
        showStatus(els.threadStatus, 'Posting…', 'info');
        try {
            const data = await api('/threads', {
                method: 'POST',
                body: JSON.stringify({
                    author,
                    category: els.threadCategory.value,
                    title: els.threadTitle.value,
                    body: els.threadBody.value,
                    website: els.threadWebsite.value
                })
            });
            els.threadForm.reset();
            showStatus(els.threadStatus, 'Thread posted.', 'success');
            if (data.thread) {
                window.location.hash = `t=${encodeURIComponent(data.thread.id)}`;
            }
        } catch (err) {
            console.error('Forum thread post failed', err);
            showStatus(els.threadStatus, err.message, 'error');
        } finally {
            els.threadSubmit.disabled = false;
        }
    });

    /* ---------- single thread ---------- */

    const renderThread = () => {
        const { thread, replies } = openThread;
        els.threadMain.replaceChildren();
        els.threadMain.append(el('h2', 'forum-thread-title', thread.title));

        const meta = el('header', 'suggestion-post-meta');
        meta.append(authorNode(thread.author), el('span', 'suggestion-post-topic', CATEGORY_LABEL[thread.category] || thread.category));
        const time = el('time', '', formatWhen(thread.createdAt));
        time.dateTime = thread.createdAt;
        meta.append(time);
        els.threadMain.append(meta, el('p', 'suggestion-post-body forum-body', thread.body));

        els.repliesCount.textContent = `${replies.length} ${replies.length === 1 ? 'reply' : 'replies'}`;
        els.replyList.replaceChildren();
        if (!replies.length) {
            els.replyList.append(el('p', 'suggestion-empty', 'No replies yet.'));
        }
        replies.forEach((r) => {
            const post = el('article', 'suggestion-post');
            const rmeta = el('header', 'suggestion-post-meta');
            rmeta.append(authorNode(r.author));
            const rtime = el('time', '', formatWhen(r.createdAt));
            rtime.dateTime = r.createdAt;
            rmeta.append(rtime);
            post.append(rmeta, el('p', 'suggestion-post-body forum-body', r.body));
            els.replyList.append(post);
        });
    };

    const loadThread = async (id) => {
        els.threadMain.replaceChildren(el('p', 'suggestion-empty', 'Loading thread…'));
        els.replyList.replaceChildren();
        els.repliesCount.textContent = '';
        try {
            openThread = await api(`/thread?id=${encodeURIComponent(id)}`);
            renderThread();
        } catch (err) {
            console.error('Forum thread load failed', err);
            openThread = null;
            els.threadMain.replaceChildren(el('p', 'suggestion-status suggestion-status--error', err.message));
        }
    };

    els.replyForm.addEventListener('submit', async (event) => {
        event.preventDefault();
        const author = currentName();
        if (!author) {
            showStatus(els.replyStatus, 'Pick a temporary name first.', 'error');
            return;
        }
        if (!openThread) {
            showStatus(els.replyStatus, 'Thread is not loaded.', 'error');
            return;
        }
        els.replySubmit.disabled = true;
        showStatus(els.replyStatus, 'Posting…', 'info');
        try {
            const data = await api('/thread', {
                method: 'POST',
                body: JSON.stringify({
                    threadId: openThread.thread.id,
                    author,
                    body: els.replyBody.value,
                    website: els.replyWebsite.value
                })
            });
            els.replyForm.reset();
            showStatus(els.replyStatus, 'Reply posted.', 'success');
            if (data.reply) {
                openThread.replies.push(data.reply);
                openThread.thread.replyCount += 1;
                renderThread();
            }
        } catch (err) {
            console.error('Forum reply failed', err);
            showStatus(els.replyStatus, err.message, 'error');
        } finally {
            els.replySubmit.disabled = false;
        }
    });

    /* ---------- routing (#t=<threadId>) ---------- */

    const threadIdFromHash = () => {
        const match = /^#t=([a-f0-9]{24})$/i.exec(window.location.hash);
        return match ? match[1] : '';
    };

    const rerenderCurrent = () => {
        if (threadIdFromHash()) {
            if (openThread) {
                renderThread();
            }
        } else {
            renderThreadList();
        }
    };

    const route = () => {
        const id = threadIdFromHash();
        els.listView.hidden = Boolean(id);
        els.threadView.hidden = !id;
        showStatus(els.threadStatus, '', 'info');
        showStatus(els.replyStatus, '', 'info');
        if (id) {
            loadThread(id);
        } else {
            openThread = null;
            loadThreads();
        }
        window.scrollTo({ top: 0 });
    };

    window.addEventListener('hashchange', route);

    /* ---------- init ---------- */

    fillCategories();
    applyNameState();
    if (storageWarned) {
        showStatus(els.setupStatus, 'Your browser is blocking saved names; your name will reset when you leave.', 'info');
    }
    route();
});
