#!/usr/bin/env node
// [TRACE: ARCHITECTURE.md]
const fs = require('fs');
const path = require('path');
const assert = require('assert');

const root = path.join(__dirname, '..');
let failed = 0;

function ok(cond, msg) {
    try {
        assert.ok(cond, msg);
        console.log(`PASS  ${msg}`);
    } catch (err) {
        failed += 1;
        console.error(`FAIL  ${msg}`);
    }
}

const requiredPages = [
    'index.html',
    'home.html',
    'member-action.html',
    'evidence-log.html',
    'bargaining.html',
    'contract.html',
    'suggestions.html',
    'member-documents.html',
    'forum.html',
    'signin.html',
    'profile.html',
    'profile-edit.html',
    'members.html',
    'updates.html',
    'contract-updates.html',
    'calendar.html'
];

const htmlFiles = fs.readdirSync(root).filter((file) => file.endsWith('.html'));
htmlFiles.forEach((file) => {
    const source = fs.readFileSync(path.join(root, file), 'utf8');
    if (file !== 'index.html') {
        ok(source.includes('js/nav-config.js'), `${file} loads shared navigation`);
        ok(source.includes('js/shell.js'), `${file} loads shared page shell`);
        ok(source.includes('js/site-search.js'), `${file} loads sitewide search`);
    }
    const localTargets = [...source.matchAll(/(?:href|src)="([^"#?]+(?:\.html|\.js|\.css|\.jpg|\.png|\.webp))"/g)]
        .map((match) => match[1])
        .filter((target) => !/^(?:https?:)?\/\//i.test(target));
    localTargets.forEach((target) => {
        ok(fs.existsSync(path.join(root, target)), `${file} local asset exists: ${target}`);
    });
});

requiredPages.forEach((file) => {
    ok(fs.existsSync(path.join(root, file)), `page exists: ${file}`);
});

const nav = fs.readFileSync(path.join(root, 'js/nav-config.js'), 'utf8');
const navTargets = [...nav.matchAll(/href:\s*'([^']+\.html)'/g)].map((match) => match[1]);
navTargets.forEach((target) => ok(fs.existsSync(path.join(root, target)), `navigation destination exists: ${target}`));
ok(nav.includes('member-action.html'), 'nav includes Action Center');
ok(nav.includes('evidence-log.html'), 'nav includes evidence log');
ok(nav.includes('bargaining.html'), 'nav includes bargaining');
ok(nav.includes('members.html') && nav.includes('signin.html'), 'nav includes member accounts and directory');

const auth = fs.readFileSync(path.join(root, 'js/auth.js'), 'utf8');
ok(auth.includes('/api/auth/login'), 'auth client calls API login');
ok(!auth.includes("password: 'sample'"), 'hardcoded sample password removed from auth.js');

const indexHtml = fs.readFileSync(path.join(root, 'index.html'), 'utf8');
ok(!indexHtml.includes('<code>sample</code>'), 'login page does not show sample password');

const memberDocs = fs.readFileSync(path.join(root, 'member-documents.html'), 'utf8');
ok(!memberDocs.includes('href="source/'), 'member-documents does not link source/');

const vercelIgnore = fs.readFileSync(path.join(root, '.vercelignore'), 'utf8');
ok(vercelIgnore.includes('source/'), '.vercelignore excludes source/');

const apiLogin = fs.existsSync(path.join(root, 'api/auth/login.js'));
ok(apiLogin, 'api/auth/login.js exists');
ok(fs.existsSync(path.join(root, 'middleware.js')), 'middleware.js exists');

const data = fs.readFileSync(path.join(root, 'data.js'), 'utf8');
ok(data.includes('article-19'), 'Article XIX present');
ok(data.includes('New Year\'s Day') && data.includes('essential employees'), 'Article XIX holiday provisions transcribed');
ok(data.includes('id: "article-20"') && data.includes('401(k) deferrals on a bi-weekly basis'), 'Article XX Pension Sections 1–4 transcribed');
ok(data.includes('id: "article-21"') && data.includes('Pennsylvania Wage Payment and collection law'), 'Article XXI wage provisions transcribed');
ok(data.includes('id: "article-22"') && data.includes('Group Long Term Disability (LTD)'), 'Article XXII opening transcribed');
ok(data.includes('id: "article-21"') && data.includes('Trades Helper, shift | $33.89 | $35.10 | $36.36 | $37.58'), 'Exhibit B wage table connected to Article XXI');
ok(data.includes('id: "article-22"') && data.includes('Effective July 1, 2023 — $12.21 per hour'), 'Exhibit A contribution schedule connected to Article XXII');
ok(data.includes('id: "article-23"') && data.includes('Random Drug Testing Policy') && data.includes('Gas Chromatography/Mass Spectrometry'), 'Exhibit C policy text connected to Article XXIII');
ok(data.includes('id: "cba-p14"') && data.includes('images/page_14.jpg'), 'page 14 scan added to gallery');
ok(data.includes('id: "cba-p15"') && data.includes('images/page_15.jpg') && data.includes('id: "cba-p27"') && data.includes('images/page_27.jpg') && data.includes('pages 1–27'), 'CBA scan sequence and current range through page 27 added to gallery');
ok(data.includes('id: "cba-p21"') && data.includes('Drug Paraphernalia: Any equipment') && data.includes('id: "cba-p22"') && data.includes('positive-dilute') && data.includes('id: "cba-p23"') && data.includes('NIDA certified laboratory') && data.includes('id: "cba-p24"') && data.includes('reasonable and articulable belief') && data.includes('id: "cba-p25"') && data.includes('non-minor on-the-job industrial') && data.includes('id: "cba-p26"') && data.includes('Union Steward') && data.includes('id: "cba-p27"') && data.includes('Are you sick?') && data.includes('When did you stop?'), 'Exhibit C scan-page text is indexed in page records');
const dataImagePaths = [...data.matchAll(/(?:url|image):\s*"(images\/[^\"]+)"/g)].map((match) => match[1]);
dataImagePaths.forEach((image) => ok(fs.existsSync(path.join(root, image)), `data image exists: ${image}`));

const memberAction = fs.readFileSync(path.join(root, 'member-action.html'), 'utf8');
ok(memberAction.includes('PICC'), 'Action Center includes PICC coverage note');
ok(memberAction.includes('7 calendar days'), 'Action Center cites 7-day windows');

const suggestions = fs.readFileSync(path.join(root, 'suggestions.html'), 'utf8');
ok(suggestions.includes('suggestion-facility'), 'structured facility field');
ok(suggestions.includes('Privacy'), 'privacy warning present');

// Community forum (temporary usernames, no login)
const forumLib = require(path.join(root, 'api/_lib/forum.js'));
const rejects = (fn) => {
    try {
        fn();
        return false;
    } catch (err) {
        return err.status === 400;
    }
};
ok(forumLib.validateUsername('  Steady   Wrench 42 ') === 'Steady Wrench 42', 'forum: username whitespace normalized');
ok(rejects(() => forumLib.validateUsername('ab')), 'forum: username too short rejected');
ok(rejects(() => forumLib.validateUsername('x'.repeat(21))), 'forum: username too long rejected');
ok(rejects(() => forumLib.validateUsername('bad<name>')), 'forum: username markup rejected');
ok(rejects(() => forumLib.validateUsername('Shop Steward Joe')), 'forum: steward-impersonating username rejected');
ok(rejects(() => forumLib.validateUsername('ADMIN')), 'forum: reserved username rejected');
ok(rejects(() => forumLib.validateCategory('Nope')), 'forum: unknown category rejected');
ok(rejects(() => forumLib.parseObjectId('not-an-id')), 'forum: bad thread id rejected');
ok(forumLib.cleanText('a\u0000b\r\nc', { min: 1, max: 10 }, 'x') === 'ab\nc', 'forum: control chars stripped');
ok(fs.existsSync(path.join(root, 'api/forum/threads.js')), 'api/forum/threads.js exists');
ok(fs.existsSync(path.join(root, 'api/forum/thread.js')), 'api/forum/thread.js exists');
ok(nav.includes('forum.html'), 'nav includes forum');
const forumApp = fs.readFileSync(path.join(root, 'js/forum-app.js'), 'utf8');
ok(!forumApp.includes('innerHTML'), 'forum client never uses innerHTML');
ok(!forumApp.includes('oe835_forum_username') && !forumApp.includes('body: JSON.stringify({\n                    author'), 'forum client does not accept or store guest author names');
ok(forumApp.includes('ProfileUI.badgeRow') || forumApp.includes('P.badgeRow'), 'forum displays account profile badges');

// Every page that runs a script using window.ProfileUI must load js/profile-ui.js first.
['profile.html', 'profile-edit.html', 'members.html', 'forum.html'].forEach((page) => {
    const html = fs.readFileSync(path.join(root, page), 'utf8');
    const ui = html.indexOf('js/profile-ui.js');
    const app = Math.max(html.indexOf('js/profile-app.js'), html.indexOf('js/profile-edit-app.js'), html.indexOf('js/forum-app.js'));
    ok(ui !== -1 && ui < app, `${page} loads profile-ui.js before its page script`);
});

ok(forumApp.includes("new Option('All categories'") && forumApp.includes('renderBoard') && forumApp.includes('forum-col'), 'forum defaults to all categories with a board of topic columns');
ok(forumApp.includes("data-view") || forumApp.includes('dataset.view'), 'forum can switch between board and list');

// Profile job titles are exactly the trades on the roster (no status notes, stewards, or management).
{
    const vm = require('vm');
    const sandbox = {};
    vm.createContext(sandbox);
    vm.runInContext(`${data}\nthis.roster = employeesData;`, sandbox);
    // A roster entry with a combined title counts as each of its separate roles.
    const separateRoles = {
        'Kitchen Supervisor/Mechanic': ['Kitchen Supervisor', 'Kitchen Mechanic'],
        'Stationary/Building Engineer': ['Stationary Engineer', 'Building Engineer']
    };
    const rosterTitles = [...new Set(
        sandbox.roster
            .filter((e) => e.location !== 'Management')
            .map((e) => e.role.split(' · ')[0].trim())
            .filter((title) => !/Shop Steward$/.test(title))
            .flatMap((title) => separateRoles[title] || [title])
    )].sort();
    const schemaTitles = [...require(path.join(root, 'api/_lib/profile-schema.js')).JOB_TITLES].sort();
    ok(JSON.stringify(rosterTitles) === JSON.stringify(schemaTitles), 'profile job titles match the roster trades exactly');
    const schemaLib = require(path.join(root, 'api/_lib/profile-schema.js'));
    ok(rejects(() => schemaLib.cleanProfileUpdate({ jobTitle: 'Project Manager' })), 'profile rejects job titles outside the roster list');
    ok(schemaLib.cleanProfileUpdate({ jobTitle: 'Plumber' }).jobTitle === 'Plumber' && schemaLib.cleanProfileUpdate({ jobTitle: '' }).jobTitle === '', 'profile accepts a roster title or none');
}

// Profile links and themes: fixed theme list with light/dark modes, strict http(s) link validation.
{
    const schemaLib = require(path.join(root, 'api/_lib/profile-schema.js'));
    const themes = schemaLib.options().themes;
    ok(themes.length >= 8 && themes.some((t) => t.mode === 'light') && themes.some((t) => t.mode === 'dark'), 'profile offers several light and dark themes');
    ok(themes.every((t) => t.id in schemaLib.THEME_MODES), 'every theme has a light/dark mode');
    ok(schemaLib.cleanProfileUpdate({ theme: 'forest' }).theme === 'forest' && rejects(() => schemaLib.cleanProfileUpdate({ theme: 'neon;}body{display:none' })), 'profile accepts listed themes and rejects anything else');
    const cssText = fs.readFileSync(path.join(root, 'profile.css'), 'utf8');
    ok(themes.every((t) => t.id === 'classic' || cssText.includes(`.pf-theme--${t.id}{`)), 'profile.css styles every listed theme');
    const links = schemaLib.cleanProfileUpdate({ links: [{ label: ' My shop ', url: 'example.com/shop' }] }).links;
    ok(links.length === 1 && links[0].label === 'My shop' && links[0].url === 'https://example.com/shop', 'profile link gets https:// added and label trimmed');
    ['javascript:alert(1)', 'data:text/html,hi', 'file:///etc/passwd', 'ftp://example.com', 'mailto:a@b.com', 'http://localhost/x', 'http://127.0.0.1/', 'https://user:pw@example.com/', 'https://[::1]/', 'https://intranet/', 'https://exa mple.com'].forEach((bad) => {
        ok(rejects(() => schemaLib.cleanProfileUpdate({ links: [{ label: 'x', url: bad }] })), `profile link rejects ${bad}`);
    });
    ok(rejects(() => schemaLib.cleanProfileUpdate({ links: [{ label: '', url: 'https://example.com' }] })), 'profile link needs a name');
    ok(rejects(() => schemaLib.cleanProfileUpdate({ links: Array.from({ length: 6 }, (_, i) => ({ label: `l${i}`, url: `https://example${i}.com` })) })), 'profile allows at most 5 links');
    ok(rejects(() => schemaLib.cleanProfileUpdate({ links: [{ label: 'a', url: 'https://example.com' }, { label: 'b', url: 'https://example.com' }] })), 'profile rejects duplicate links');
    const ui = fs.readFileSync(path.join(root, 'js/profile-ui.js'), 'utf8');
    ok(ui.includes("'noopener noreferrer nofollow ugc'") && ui.includes("url.protocol !== 'https:' && url.protocol !== 'http:'"), 'profile links open safely and are re-checked in the browser');
    const adminApi = fs.readFileSync(path.join(root, 'api/admin/index.js'), 'utf8');
    ok(adminApi.includes("case 'clearLinks'") && fs.readFileSync(path.join(root, 'js/admin-app.js'), 'utf8').includes("action: 'clearLinks'"), 'admins can remove a member\'s links');
}

// Admin markers: Lead Admin is an awardable title; Site Admin is automatic from the role.
{
    const schemaLib = require(path.join(root, 'api/_lib/profile-schema.js'));
    const accountsLib = require(path.join(root, 'api/_lib/accounts.js'));
    ok(schemaLib.BADGES['lead-admin'] === 'Lead Admin', 'Lead Admin is an awardable badge');
    ok(!('admin' in schemaLib.BADGES) && schemaLib.AUTO_BADGES.admin === 'Site Admin', 'Site Admin is automatic, never awardable');
    ok(schemaLib.options().badges.some((b) => b.id === 'admin'), 'badge options include the automatic Site Admin label');
    const profile = { username: 'ryanlorenz', handle: 'RyanLorenz', displayName: 'Ryan', badges: ['lead-admin'], avatar: {} };
    ok(accountsLib.summaryOut(profile, true).badges.join() === 'admin,lead-admin', 'admin profiles show Site Admin before awarded titles');
    ok(accountsLib.summaryOut(profile, false).badges.join() === 'lead-admin', 'non-admin profiles show only awarded titles');
    ok(accountsLib.accountOut({ role: 'admin', profile }).badges.includes('admin'), 'signed-in admin account reports the Site Admin marker');
    ok(!accountsLib.accountOut({ role: 'member', profile }).badges.includes('admin'), 'member account does not report Site Admin');
    const rows = (list) => ({ limit() { return this; }, toArray: async () => list });
    const adminDb = {
        collection: (name) => ({
            find: () => rows(name === 'users' ? [{ username: 'ryanlorenz', role: 'admin' }] : [profile])
        })
    };
    accountsLib.loadSummaries(adminDb, ['RyanLorenz']).then((map) => {
        ok(map.get('ryanlorenz')?.badges[0] === 'admin', 'forum/comment author summaries pick up the admin role from users');
    }).catch((err) => { console.error(err); ok(false, 'forum/comment author summaries pick up the admin role from users'); });
}

// Admin panel: hidden from everyone but admins, at the edge and in the API.
{
    const mw = fs.readFileSync(path.join(root, 'middleware.js'), 'utf8');
    ok(mw.includes('ADMIN_PATTERN') && mw.includes("payload.role === 'admin'") && mw.includes('algorithms'), 'middleware gates admin paths on a verified admin token');
    ok(mw.includes('decodeURIComponent') && mw.includes('toLowerCase'), 'middleware normalizes encoded and mixed-case admin paths');
    ok(mw.includes("await import('jose')"), 'middleware loads the token library only for admin paths');
    const adminApi = fs.readFileSync(path.join(root, 'api/admin/index.js'), 'utf8');
    ok(adminApi.indexOf('requireAdmin(req)') < adminApi.indexOf("req.method === 'GET'"), 'admin API checks the admin role before looking at the method');
    ok(adminApi.includes('last active admin') && adminApi.includes('cannot change your own role'), 'admin API protects the last admin and the caller');
    ok(adminApi.includes('admin_audit') && !/audit\([^)]*newPassword/.test(adminApi), 'admin changes are logged without passwords');
    const vercel = JSON.parse(fs.readFileSync(path.join(root, 'vercel.json'), 'utf8'));
    ok(JSON.stringify(vercel.headers || []).includes('no-store') && JSON.stringify(vercel.headers).includes('noindex'), 'admin page is served uncached and noindex');
    const adminHtml = fs.readFileSync(path.join(root, 'admin.html'), 'utf8');
    ok(adminHtml.includes('noindex'), 'admin.html asks search engines not to index it');
    ok(!nav.includes('admin.html'), 'admin page is not in the shared public navigation');
    ok(!siteSearchSource().includes('admin.html'), 'admin page is not in sitewide search');
    ok(fs.readFileSync(path.join(root, 'js/shell.js'), 'utf8').includes("account.role === 'admin'"), 'menu shows the Admin panel link only to admins');
    const endpoints = [];
    (function walk(dir) {
        fs.readdirSync(dir, { withFileTypes: true }).forEach((e) => {
            const full = path.join(dir, e.name);
            if (e.isDirectory() && e.name !== '_lib') walk(full);
            else if (e.isFile() && e.name.endsWith('.js')) endpoints.push(full);
        });
    })(path.join(root, 'api'));
    ok(endpoints.length <= 12, `API has ${endpoints.length} deployable functions (Hobby cap is 12)`);
}
function siteSearchSource() { return fs.readFileSync(path.join(root, 'js/site-search.js'), 'utf8'); }

// Forum deletion: author or admin only, logged when an admin removes someone else's post.
{
    const threadApi = fs.readFileSync(path.join(root, 'api/forum/thread.js'), 'utf8');
    ok(threadApi.includes("req.method === 'DELETE'") && threadApi.includes('accounts.requireUser') && threadApi.includes("user.role === 'admin'") && threadApi.includes('doc.authorKey === user.username'), 'forum delete is limited to the author or an admin');
    ok(threadApi.includes('accounts.sameSite(req)') && threadApi.includes('forumDeleteThread') && threadApi.includes('forumDeleteReply'), 'forum delete blocks cross-site requests and logs admin deletions');
    ok(forumApp.includes('canDelete') && forumApp.includes("method:'DELETE'") && forumApp.includes('window.confirm'), 'forum shows confirmed delete buttons only where allowed');
}

const siteSearch = fs.readFileSync(path.join(root, 'js/site-search.js'), 'utf8');
ok(siteSearch.includes('/api/forum/threads'), 'site search indexes forum threads');
['home.html', 'member-action.html', 'evidence-log.html', 'bargaining.html', 'suggestions.html'].forEach((page) => {
    ok(siteSearch.includes(`href: '${page}'`), `site search indexes ${page}`);
});
ok(siteSearch.includes("href: 'updates.html'") && siteSearch.includes("href: 'contract-updates.html'"), 'site search indexes both update pages');
ok(siteSearch.includes("href: 'calendar.html'"), 'site search indexes the member calendar');
const calendar = fs.readFileSync(path.join(root, 'calendar.html'), 'utf8');
['2026-12-08', '7:00 p.m.', '5th and Willow', 'Philadelphia', 'third Wednesday', 'Assistant shop stewards and the chief shop steward only'].forEach((detail) => {
    ok(calendar.includes(detail), `member calendar includes meeting detail: ${detail}`);
});
ok(siteSearch.includes('.normalize(\'NFKD\')'), 'site search folds Unicode accents');
ok(siteSearch.includes('new Set(normalize(query)'), 'site search deduplicates normalized terms');
ok(siteSearch.includes('href: () => `contract.html?article='), 'contract search result deep-links without a fragile text filter');
ok(siteSearch.includes('normalizeWithOffsets') && siteSearch.includes('<mark>'), 'site search highlights accent-folded matches safely');
ok(siteSearch.includes('joinPunctuation = false') && siteSearch.includes('getEntryTextForms'), 'site search caches normalized punctuation variants for responsive typing');
ok(siteSearch.includes('site-search-result-number') && siteSearch.includes('Top ${hits.length} of ${total}'), 'site search numbers results and reports when more matches exist');
ok(siteSearch.includes('site-search-close') && siteSearch.includes('aria-live'), 'site search has an accessible close control and live status');
ok(siteSearch.includes("document.createElement('ol')") && siteSearch.includes('Ranked search results'), 'site search exposes result order semantically');
const contractPage = fs.readFileSync(path.join(root, 'contract.html'), 'utf8');
ok(contractPage.includes('contract-tools-toggle') && contractPage.includes('aria-controls="contract-tools-content"'), 'contract tools has a labelled disclosure control');
const contractApp = fs.readFileSync(path.join(root, 'js/contract-app.js'), 'utf8');
ok(contractApp.includes("matchMedia('(max-width: 767px)')") && contractApp.includes('contractToolsContent.hidden = !expanded'), 'contract tools collapses on mobile and remains controllable');
const stylesheet = fs.readFileSync(path.join(root, 'style.css'), 'utf8');
ok(stylesheet.includes('.contract-toolbar {\n        position: static;') && stylesheet.includes('.contract-toolbar.is-collapsed'), 'mobile Document Tools does not stick over contract text');
ok(contractApp.includes('.normalize(\'NFKD\')') && contractApp.includes('tokens.every'), 'contract search folds accents and requires every query word');
ok(contractApp.includes('normalizeWithOffsets(source, true)') && contractApp.includes('source.replace(/([\\p{L}\\p{N}])'), 'contract search supports joined and hyphenated word forms');
ok(contractApp.includes('result entries') || contractApp.includes('itemLabel'), 'contract search reports matching entry counts');
const employeesApp = fs.readFileSync(path.join(root, 'js/employees-app.js'), 'utf8');
ok(employeesApp.includes('new Set(employeesData.flatMap(sitesOf))') && employeesApp.includes(".normalize('NFKD')"), 'roster filters follow current locations and normalize searches');
const mongo = fs.readFileSync(path.join(root, 'api/_lib/mongo.js'), 'utf8');
ok(mongo.includes('forum_threads_search') && mongo.includes('forum_replies_search'), 'forum text-search indexes exist');
const forumThreadsApi = fs.readFileSync(path.join(root, 'api/forum/threads.js'), 'utf8');
ok(forumThreadsApi.includes('matchedReplies'), 'forum search returns matching replies');
const { ObjectId } = require('mongodb');
const sampleThreadId = new ObjectId('64b000000000000000000001');
const sampleThread = {
    _id: sampleThreadId,
    title: 'Holiday schedule question',
    body: 'Does the holiday schedule apply to our shift?',
    category: 'Contract',
    author: 'Member 835',
    createdAt: new Date('2026-01-01T00:00:00Z'),
    lastActivityAt: new Date('2026-01-02T00:00:00Z'),
    replyCount: 1
};
const sampleReply = {
    _id: new ObjectId('64b000000000000000000002'),
    threadId: sampleThreadId,
    body: 'The holiday language is in Article XIX.',
    author: 'Member Two',
    createdAt: new Date('2026-01-02T00:00:00Z')
};
const cursor = (rows) => ({
    project() { return this; },
    sort() { return this; },
    limit() { return this; },
    toArray: async () => rows
});
const fakeDb = {
    collection(name) {
        return {
            find(query) {
                if (name === 'forum_replies') return cursor(query.$text ? [sampleReply] : []);
                if (query.$text) return cursor([]);
                if (query._id?.$in) return cursor([sampleThread]);
                return cursor([]);
            }
        };
    }
};
const mongoModulePath = require.resolve(path.join(root, 'api/_lib/mongo.js'));
require.cache[mongoModulePath] = {
    id: mongoModulePath,
    filename: mongoModulePath,
    loaded: true,
    exports: { getDb: async () => fakeDb }
};
const forumThreadsHandler = require(path.join(root, 'api/forum/threads.js'));
const apiResponse = {
    headers: {},
    setHeader(name, value) { this.headers[name] = value; },
    end(value) { this.body = JSON.parse(value); }
};
forumThreadsHandler({ method: 'GET', url: '/api/forum/threads?q=holiday' }, apiResponse)
    .then(() => {
        const hit = apiResponse.body.threads?.[0];
        ok(hit?.matchedReplies?.[0]?.body === sampleReply.body, 'forum search finds a reply and links its thread');
    })
    .catch((err) => {
        console.error('Forum search API fake-DB check failed', err);
        ok(false, 'forum search finds a reply and links its thread');
    })
    .finally(() => {
        console.log(failed ? `\n${failed} smoke check(s) failed` : '\nAll smoke checks passed');
        process.exit(failed ? 1 : 0);
    });
const homeHtml = fs.readFileSync(path.join(root, 'home.html'), 'utf8');
ok(homeHtml.includes('forum-fab') && homeHtml.includes('home-forum-callout'), 'home promotes the forum (floating button + callout)');

const agents = fs.readFileSync(path.join(root, 'AGENTS.md'), 'utf8');
const claude = fs.readFileSync(path.join(root, 'CLAUDE.md'), 'utf8');
const ingestionGuidePath = path.join(root, 'DOCS/CONTRACT_PAGE_INGESTION.md');
ok(agents.includes('DOCS/CONTRACT_PAGE_INGESTION.md'), 'shared agent rules point to the page-ingestion guide');
ok(claude.trimStart().startsWith('@AGENTS.md'), 'Claude Code imports shared AGENTS.md rules');
ok(fs.existsSync(ingestionGuidePath), 'page-ingestion guide exists');
const ingestionGuide = fs.readFileSync(ingestionGuidePath, 'utf8');
['cbaScannedPages', 'sitewide search', 'printed page', 'America/New_York', 'partial'].forEach((term) => {
    ok(ingestionGuide.includes(term), `page-ingestion guide covers ${term}`);
});

// Roster: people at more than one site use `alsoAt`; the roster page and search both honor it.
{
    const dataJs = fs.readFileSync(path.join(root, 'data.js'), 'utf8');
    const app = fs.readFileSync(path.join(root, 'js/employees-app.js'), 'utf8');
    const searchJs = fs.readFileSync(path.join(root, 'js/site-search.js'), 'utf8');
    ok(/name: "Mike Henry", location: "RCF", alsoAt: \["CFCF"\], role: "Plumber"/.test(dataJs), 'Mike Henry is listed once at RCF and CFCF');
    ok(/name: "Mike Brown", location: "CFCF", role: "Plumber"/.test(dataJs) && /name: "Lauren Battilana", location: "CFCF", role: "Data Clerk"/.test(dataJs), 'roster has Mike Brown and Lauren Battilana at CFCF');
    ok(['Eric Levin', 'Kent Koung', 'Kyle Lloyd'].every((n) => new RegExp(`name: "${n}", location: "PICC", alsoAt: \\["RCF", "CFCF"\\], role: "Electronic Security"`).test(dataJs)), 'electronic security staff are listed at all three sites');
    ok(app.includes('alsoAt') && searchJs.includes('alsoAt'), 'roster page and search handle people at several sites');
    {
        const css = fs.readFileSync(path.join(root, 'style.css'), 'utf8');
        ok(app.includes('roster-index') && app.includes('setPointerCapture') && app.includes("behavior: 'instant'") && /\.roster-index\s*\{[^}]*position:\s*fixed/.test(css), 'roster has a phone A-Z jump rail with drag support');
        ok(app.includes('const currentGroup') && app.includes("group.querySelectorAll('[data-letter]')") && app.includes("addEventListener('scroll'"), 'jump rail lists only the letters of the crew section on screen');
        ok(/@media \(max-width: 767px\)\s*\{\s*\.roster-index\s*\{/.test(css) && /\.roster-index,\s*\.roster-index-bubble\s*\{\s*display:\s*none/.test(css), 'jump rail is phone-only');
    }
    ok(app.includes('compareRole') && app.includes('role-group-heading') && fs.readFileSync(path.join(root, 'employees.html'), 'utf8').includes('id="roster-sort"'), 'roster can be grouped by role inside each site');
    ok(app.includes('compareStaff') && app.includes('localeCompare'), 'roster sections sort A-Z by first name, with management in rank order');
    {
        const names = [...dataJs.matchAll(/\{ name: "([^"]+)", location: "(?!Management)/g)].map((m) => m[1].toLowerCase());
        ok(names.every((n, k) => k === 0 || names[k - 1] <= n), 'employeesData stays alphabetical by first name (Management last, in rank order)');
    }
    ok(app.includes("activeFacility === 'all' ? locations : [activeFacility]"), 'a facility filter shows only that facility\'s crew section');
}
