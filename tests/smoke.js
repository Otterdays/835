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
    'member-documents.html'
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

console.log(failed ? `\n${failed} smoke check(s) failed` : '\nAll smoke checks passed');
process.exit(failed ? 1 : 0);
