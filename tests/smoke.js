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
    const app = Math.max(html.indexOf('js/profile-app.js'), html.indexOf('js/forum-app.js'));
    ok(ui !== -1 && ui < app, `${page} loads profile-ui.js before its page script`);
});

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
ok(employeesApp.includes('new Set(employeesData.map') && employeesApp.includes(".normalize('NFKD')"), 'roster filters follow current locations and normalize searches');
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
