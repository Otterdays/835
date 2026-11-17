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
    'forum.html'
];

requiredPages.forEach((file) => {
    ok(fs.existsSync(path.join(root, file)), `page exists: ${file}`);
});

const nav = fs.readFileSync(path.join(root, 'js/nav-config.js'), 'utf8');
ok(nav.includes('member-action.html'), 'nav includes Action Center');
ok(nav.includes('evidence-log.html'), 'nav includes evidence log');
ok(nav.includes('bargaining.html'), 'nav includes bargaining');

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
ok(data.includes('Pending digitization') || data.includes('HOLIDAYS'), 'Article XIX marked pending or present');

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
ok(forumApp.includes('oe835_forum_username'), 'forum client stores temp username locally');

console.log(failed ? `\n${failed} smoke check(s) failed` : '\nAll smoke checks passed');
process.exit(failed ? 1 : 0);
