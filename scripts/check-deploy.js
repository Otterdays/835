#!/usr/bin/env node
// [TRACE: ARCHITECTURE.md]
const fs = require('fs');
const path = require('path');

const root = path.join(__dirname, '..');
const problems = [];
const vercelIgnore = fs.readFileSync(path.join(root, '.vercelignore'), 'utf8');
const ignoreLines = new Set(
    vercelIgnore
        .split(/\r?\n/)
        .map((l) => l.trim())
        .filter(Boolean)
);

['source/', 'local.auth.json', '.env', 'DOCS/'].forEach((entry) => {
    if (!ignoreLines.has(entry)) {
        problems.push(`.vercelignore missing ${entry}`);
    }
});

if (!fs.existsSync(path.join(root, '.gitignore'))) {
    problems.push('missing .gitignore');
}

const indexHtml = fs.readFileSync(path.join(root, 'index.html'), 'utf8');
if (indexHtml.includes('<code>sample</code>')) {
    problems.push('sample password still rendered on login page');
}

const memberDocs = fs.readFileSync(path.join(root, 'member-documents.html'), 'utf8');
if (memberDocs.includes('href="source/')) {
    problems.push('member-documents still links to source/');
}

const authJs = fs.readFileSync(path.join(root, 'js/auth.js'), 'utf8');
if (authJs.includes("password: 'sample'")) {
    problems.push('auth.js still hardcodes sample password');
}

if (!fs.existsSync(path.join(root, 'middleware.js'))) {
    problems.push('middleware.js missing');
}

if (!fs.existsSync(path.join(root, 'api/auth/login.js'))) {
    problems.push('api/auth/login.js missing');
}

if (problems.length) {
    console.error('Deploy check failed:');
    problems.forEach((p) => console.error(` - ${p}`));
    process.exit(1);
}

console.log('Deploy check passed.');
console.log('Reminder: private repo; set MONGODB_URI + AUTH_SECRET on Vercel; npm run seed:user.');
