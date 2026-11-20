#!/usr/bin/env node
// [TRACE: LLM_INTEGRATION.md]
// Builds api/_lib/ai-site-data.json, the curated site knowledge used by the
// admin-only AI assistant. Run `npm run build:ai-context` after changing data.js,
// the contract, the calendar or any of the HTML pages listed in PAGE_SOURCES.
//
// Privacy rules enforced here (the build fails instead of leaking):
//   - Contract/scans plus sanitized public roster and shopStewards fields are read
//     from data.js. Account/profile/forum and user-submitted content stay excluded.
//   - updates.html, members.html, forum.html and all account pages are excluded.
//   - Employee and steward names may appear only in their dedicated public-directory
//     chunks. Injury/termination notes and contact/account fields are never included.
//   - The output stays server-side under api/_lib/, which Vercel does not serve as static files.
const fs = require('fs');
const path = require('path');
const vm = require('vm');
const crypto = require('crypto');

const root = path.join(__dirname, '..');
const OUT_FILE = path.join(root, 'api/_lib/ai-site-data.json');
const VERSION = 1;
const MAX_CHUNK_CHARS = 1400;

// Pages the assistant may read. `updates.html` and `members.html` are deliberately absent:
// updates.html contains member names and the directory page itself is personal roster data.
const PAGE_SOURCES = [
    'calendar.html',
    'contract-updates.html',
    'agreement-2026-27.html',
    'contract.html',
    'scans.html',
    'tool-program.html',
    'member-documents.html',
    'member-action.html',
    'evidence-log.html',
    'bargaining.html',
    'suggestions.html'
];

// Short directory of every page, including pages whose body text is not included.
const PAGES = [
    { href: 'home.html', title: 'Home', summary: 'Gateway with links to the contract, scans, tools, roster, calendar, forum and account pages.' },
    { href: 'employees.html', title: 'Site Roster', summary: 'Public facility roster with employee names, trades, and facility assignments; sensitive status notes are not provided to the assistant.' },
    { href: 'stewards.html', title: 'Union Leadership & Shop Stewards', summary: 'Public Local 835 leadership and shop steward names, roles, and facility assignments.' },
    { href: 'members.html', title: 'Member Directory', summary: 'Member profile directory; account and profile data are not provided to the assistant.' },
    { href: 'calendar.html', title: 'Member Calendar', summary: 'Upcoming Local 835 meetings and events with dates, times and locations.' },
    { href: 'updates.html', title: 'Project Updates', summary: 'Dated log of portal and content changes. Body text is not included in the assistant context because it contains member names.' },
    { href: 'contract-updates.html', title: 'Contract & Employment Updates', summary: 'Dated contract and employment notices.' },
    { href: 'agreement-2026-27.html', title: '2026–27 Tentative Agreement', summary: 'Guided reader for the tentative 2026–27 terms, subject to ratification.' },
    { href: 'contract.html', title: 'Contract (2022–26)', summary: 'Searchable 2022–2026 CBA articles, exhibits and wage/benefit tables by article.' },
    { href: 'scans.html', title: 'Scanned Pages', summary: 'Scanned CBA and tentative-agreement page images with transcriptions.' },
    { href: 'tool-program.html', title: 'Tool Program', summary: 'Facility Tool Control Program policy scans and text.' },
    { href: 'member-documents.html', title: 'Member Documents', summary: 'Summaries of member documents and forms; no source-file downloads.' },
    { href: 'member-action.html', title: 'Action Center', summary: 'Grievance preparation, issue-to-article lookup and steward preparation steps.' },
    { href: 'evidence-log.html', title: 'Evidence Log', summary: 'In-browser evidence log with V/R/A/Q/L accountability labels; data stays in the page.' },
    { href: 'bargaining.html', title: 'Bargaining Tools', summary: 'Factual bargaining checklists and contract references.' },
    { href: 'suggestions.html', title: 'Suggestions', summary: 'Member suggestion form with a privacy notice.' },
    { href: 'forum.html', title: 'Forum', summary: 'Signed-in member discussion threads. User-generated forum content is not included in the assistant context.' },
    { href: 'signin.html', title: 'Sign In', summary: 'Sign-in and account creation page.' },
    { href: 'profile.html', title: 'Member Profile', summary: 'Member profile view.' },
    { href: 'profile-edit.html', title: 'Edit Profile', summary: 'Member profile editing page.' }
];

const ENTITIES = {
    amp: '&',
    lt: '<',
    gt: '>',
    quot: '"',
    apos: "'",
    nbsp: ' ',
    mdash: '—',
    ndash: '–',
    rsquo: '’',
    lsquo: '‘',
    ldquo: '“',
    rdquo: '”',
    hellip: '…',
    middot: '·',
    times: '×',
    copy: '©'
};

function decodeEntities(text) {
    return String(text)
        .replace(/&#x([0-9a-f]+);/gi, (_, hex) => String.fromCodePoint(parseInt(hex, 16)))
        .replace(/&#(\d+);/g, (_, num) => String.fromCodePoint(parseInt(num, 10)))
        .replace(/&([a-z]+);/gi, (match, name) => ENTITIES[name.toLowerCase()] || match);
}

function htmlText(html) {
    const main = html.match(/<main[^>]*>([\s\S]*?)<\/main>/i);
    let body = main ? main[1] : '';
    if (!body) {
        // Several pages use <div id="main-container"> instead of <main>.
        const start = html.search(/<div[^>]*id=["']main-container["'][^>]*>/i);
        if (start >= 0) {
            const after = html.slice(start);
            const script = after.search(/<script\b/i);
            body = script >= 0 ? after.slice(0, script) : after;
        }
    }
    return decodeEntities(
        body
            .replace(/<(script|style|noscript|svg|template)\b[^>]*>[\s\S]*?<\/\1>/gi, ' ')
            .replace(/<br\s*\/?>/gi, '\n')
            .replace(/<\/(p|li|h[1-6]|tr|section|article|div|dt|dd|blockquote)>/gi, '\n')
            .replace(/<[^>]+>/g, ' ')
    )
        .replace(/\r\n?/g, '\n')
        .replace(/[ \t\f\v]+/g, ' ')
        .replace(/ *\n */g, '\n')
        .replace(/\n{3,}/g, '\n\n')
        .trim();
}

function loadData() {
    const source = fs.readFileSync(path.join(root, 'data.js'), 'utf8');
    const sandbox = {};
    vm.createContext(sandbox);
    vm.runInContext(
        `${source}\nthis.contract = contractData;this.scans = cbaScannedPages;this.tool = toolProgramScans;this.stewards = shopStewards;this.employees = employeesData;`,
        sandbox,
        { filename: 'data.js' }
    );
    return { contract: sandbox.contract, scans: sandbox.scans || [], tool: sandbox.tool || [], stewards: sandbox.stewards || [], employees: sandbox.employees || [] };
}

const publicEmployeeName = (row) => String(row && row.name || '').trim();
const publicStewardName = (row) => String(row && row.name || '').trim();
function containsName(text, name) {
    const escaped = name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    return new RegExp(`(?<![\\p{L}\\p{N}])${escaped}(?![\\p{L}\\p{N}])`, 'iu').test(text);
}

function sourceHash() {
    const hash = crypto.createHash('sha256');
    hash.update(`v${VERSION}\n`);
    for (const file of ['data.js', 'scripts/build-ai-context.js', ...PAGE_SOURCES]) {
        hash.update(`\n--- ${file} ---\n`);
        hash.update(fs.readFileSync(path.join(root, file)));
    }
    hash.update(`\n--- pages ---\n${JSON.stringify(PAGES)}`);
    return hash.digest('hex');
}

function chunkText(text) {
    const paragraphs = String(text)
        .split(/\n{2,}/)
        .map((part) => part.trim())
        .filter(Boolean);
    const chunks = [];
    let current = '';
    for (const paragraph of paragraphs) {
        if (current && current.length + paragraph.length + 2 > MAX_CHUNK_CHARS) {
            chunks.push(current);
            current = '';
        }
        if (paragraph.length > MAX_CHUNK_CHARS) {
            // Break a long paragraph on sentence boundaries so one giant article section
            // cannot crowd every other source out of the retrieval budget.
            let rest = paragraph;
            while (rest.length > MAX_CHUNK_CHARS) {
                let cut = rest.lastIndexOf('. ', MAX_CHUNK_CHARS);
                if (cut < MAX_CHUNK_CHARS * 0.45) {
                    cut = rest.lastIndexOf(' ', MAX_CHUNK_CHARS);
                }
                if (cut < MAX_CHUNK_CHARS * 0.3) {
                    cut = MAX_CHUNK_CHARS;
                }
                chunks.push(rest.slice(0, cut + 1).trim());
                rest = rest.slice(cut + 1).trim();
            }
            if (rest) {
                if (current && current.length + rest.length + 2 <= MAX_CHUNK_CHARS) {
                    current = `${current}\n\n${rest}`;
                } else {
                    if (current) {
                        chunks.push(current);
                    }
                    current = rest;
                }
            }
            continue;
        }
        current = current ? `${current}\n\n${paragraph}` : paragraph;
    }
    if (current) {
        chunks.push(current);
    }
    return chunks.filter((chunk) => chunk.length >= 20);
}

function addDocument(chunks, doc) {
    const parts = chunkText(doc.text);
    parts.forEach((text, index) => {
        chunks.push({
            id: `${doc.id}#${index}`,
            docId: doc.id,
            kind: doc.kind,
            title: doc.title,
            citation: doc.citation,
            href: doc.href,
            text
        });
    });
}

function articleCitation(article) {
    const match = String(article.title || '').match(/^ARTICLE\s+([IVXL]+)\.?\s*(.*)$/i);
    if (!match) {
        return article.title;
    }
    const smallWords = new Set(['a', 'an', 'and', 'as', 'at', 'but', 'by', 'for', 'from', 'in', 'into', 'nor', 'of', 'on', 'or', 'the', 'to', 'with']);
    const heading = match[2]
        ? match[2]
              .toLowerCase()
              .split(/(\s+)/)
              .map((word, index) => {
                  if (!/^[a-z]/.test(word)) {
                      return word;
                  }
                  if (index > 0 && smallWords.has(word)) {
                      return word;
                  }
                  return word[0].toUpperCase() + word.slice(1);
              })
              .join('')
        : '';
    return `CBA Article ${match[1]}${heading ? ` — ${heading}` : ''}`;
}

const SCAN_CITATION = (scan) => {
    const section = String(scan.section || '');
    if (/tentative/i.test(section)) {
        return `Tentative Agreement ${scan.label || scan.title}`;
    }
    if (/tool/i.test(section) || String(scan.id || '').startsWith('tcp')) {
        return `Tool Control Program ${scan.label || scan.title}`;
    }
    return `CBA scan ${scan.label || scan.title}`;
};

function build() {
    const data = loadData();
    const chunks = [];

    const stewardDirectory = (data.stewards || [])
        .map((steward) => `- ${String(steward.name || '').trim()} — ${String(steward.role || '').trim()}${steward.location ? `, ${String(steward.location).trim()}` : ''}`)
        .filter((line) => !/^[- ]+—/.test(line));
    if (stewardDirectory.length) {
        addDocument(chunks, {
            id: 'steward-directory',
            kind: 'directory',
            title: 'Union Leadership & Shop Stewards',
            citation: 'Union Leadership & Shop Steward Directory',
            href: 'stewards.html',
            text: `Current public directory listing from the member portal:\n${stewardDirectory.join('\n')}\n\nThe directory provides names, roles and facility assignments only; it does not provide phone numbers or email addresses.`
        });
    }

    const rosterRows = (data.employees || []).map((employee) => {
        const role = String(employee.role || '').split(' · ')[0].trim();
        const regularSites = [employee.location, ...(employee.alsoAt || [])].filter(Boolean);
        const temporarySites = [...new Set(employee.temporaryAt || [])].filter(Boolean);
        const assignments = [
            ...regularSites,
            ...temporarySites.map((site) => `${site} temporary assignment`)
        ];
        return `- ${publicEmployeeName(employee)} — ${role}${assignments.length ? ` (${[...new Set(assignments)].join(', ')})` : ''}`;
    }).filter((line) => !/^[- ]+—/.test(line));
    if (rosterRows.length) {
        addDocument(chunks, {
            id: 'employee-roster',
            kind: 'directory',
            title: 'Site Roster',
            citation: 'Public Site Roster',
            href: 'employees.html',
            text: `Public roster fields only: name, listed trade or role, and facility assignment. No member account/profile details or private contact information are included.\n\n${rosterRows.join('\n')}`
        });
    }

    for (const article of data.contract.articles || []) {
        addDocument(chunks, {
            id: `article:${article.id}`,
            kind: 'article',
            title: article.title,
            citation: articleCitation(article),
            href: `contract.html?article=${encodeURIComponent(article.id)}`,
            text: article.content || ''
        });
    }

    for (const scan of data.scans) {
        addDocument(chunks, {
            id: `scan:${scan.id}`,
            kind: 'scan',
            title: `${scan.label || 'Page'} — ${scan.title || 'Scanned page'}`,
            citation: SCAN_CITATION(scan),
            href: 'scans.html',
            text: [scan.title, scan.description, scan.transcription].filter(Boolean).join('\n\n')
        });
    }

    for (const scan of data.tool) {
        addDocument(chunks, {
            id: `tool:${scan.id}`,
            kind: 'tool',
            title: `${scan.label || 'Page'} — ${scan.title || 'Tool Control Program'}`,
            citation: SCAN_CITATION(scan),
            href: 'tool-program.html',
            text: [scan.title, scan.description, scan.transcription].filter(Boolean).join('\n\n')
        });
    }

    for (const file of PAGE_SOURCES) {
        const page = PAGES.find((entry) => entry.href === file);
        if (!page) {
            throw new Error(`Page ${file} has no directory entry.`);
        }
        const text = htmlText(fs.readFileSync(path.join(root, file), 'utf8'));
        addDocument(chunks, {
            id: `page:${file}`,
            kind: 'page',
            title: page.title,
            citation: page.title,
            href: file,
            text
        });
    }

    const rosterChunks = chunks.filter((chunk) => chunk.docId === 'employee-roster');
    const stewardChunks = chunks.filter((chunk) => chunk.docId === 'steward-directory');
    if (!rosterChunks.length || !stewardChunks.length) {
        throw new Error('Refusing to build: public roster or steward directory chunk is missing or duplicated.');
    }
    const sensitiveStatus = /\b(injured|let go|terminated|termination|contest(?:ing)? the firing)\b/i;
    if (rosterChunks.some((chunk) => sensitiveStatus.test(chunk.text))) {
        throw new Error('Refusing to build: sensitive employee status text found in public roster context.');
    }
    const sourceNames = [...(data.employees || []).map(publicEmployeeName), ...(data.stewards || []).map(publicStewardName)].filter(Boolean);
    const leakedOutsideDirectory = chunks
        .filter((chunk) => !['employee-roster', 'steward-directory'].includes(chunk.docId))
        .flatMap((chunk) => sourceNames.filter((name) => containsName(chunk.text, name)));
    if (leakedOutsideDirectory.length) {
        throw new Error(`Refusing to build: directory names found outside their dedicated chunks: ${[...new Set(leakedOutsideDirectory)].join(', ')}`);
    }
    if (chunks.some((chunk) => chunk.href === 'updates.html')) {
        throw new Error('Refusing to build: updates.html content is excluded.');
    }

    const hash = sourceHash();
    const payload = {
        version: VERSION,
        sourceHash: hash,
        generatedAt: new Date().toISOString(),
        contract: {
            title: data.contract.title,
            parties: data.contract.parties,
            effectiveDate: data.contract.effectiveDate,
            termLabel: data.contract.termLabel
        },
        pages: PAGES,
        chunkCount: chunks.length,
        charCount: chunks.reduce((total, chunk) => total + chunk.text.length, 0),
        chunks
    };

    if (fs.existsSync(OUT_FILE)) {
        try {
            const previous = JSON.parse(fs.readFileSync(OUT_FILE, 'utf8'));
            if (previous.version === VERSION && previous.sourceHash === hash) {
                console.log(`AI context is up to date (${previous.chunkCount} chunks, ${previous.charCount} chars).`);
                return previous;
            }
        } catch (err) {
            console.warn('Existing AI context could not be read; rebuilding.', err.message);
        }
    }

    fs.mkdirSync(path.dirname(OUT_FILE), { recursive: true });
    fs.writeFileSync(OUT_FILE, `${JSON.stringify(payload)}\n`);
    console.log(`AI context written: ${payload.chunkCount} chunks, ${payload.charCount} chars, ${(fs.statSync(OUT_FILE).size / 1024).toFixed(1)} KB.`);
    return payload;
}

if (require.main === module) {
    try {
        build();
    } catch (err) {
        console.error('build:ai-context failed:', err.message);
        process.exit(1);
    }
}

module.exports = { build, sourceHash, htmlText, chunkText, OUT_FILE, PAGE_SOURCES, PAGES };
