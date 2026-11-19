// [TRACE: ARCHITECTURE.md]
// Builds dark.css (the dark appearance) from the light stylesheets.
//
// For every rule that sets a hard-coded color, it writes a matching dark rule scoped to
// :where(:root[data-theme="dark"]) (same specificity as the original, so more specific rules
// such as a member's own profile theme still win). Light backgrounds become dark surfaces, dark
// text becomes light text, and borders are adjusted to stay visible. Colors that come from
// var(--token) are handled by the dark tokens in style.css, not here.
//
// Usage: npm run build:dark     (re-run after changing colors in style.css, forum.css or profile.css)
const fs = require('fs');
const path = require('path');

const root = path.join(__dirname, '..');
const SOURCES = ['style.css', 'forum.css', 'profile.css'];
const SCOPE = ':where(:root[data-theme="dark"])';
// Parts of the site that are already dark in the light theme (menu, floating buttons, desk).
// A member's own profile theme (light or dark) owns its colors, so site dark mode never touches it.
const MEMBER_THEME = /\.pf-(profile|swatch|theme--)/;
const ALREADY_DARK = /^(\.nav-|\.side-panel|\.panel-|\.close-btn|\.forum-bubble|\.floating-desk|\.desk-|\.roster-index-bubble)/;

/* ---------- color helpers ---------- */

const NAMED = { white: '#ffffff', black: '#000000' };

function parseColor(text) {
    const t = text.trim().toLowerCase();
    if (NAMED[t]) {
        return parseColor(NAMED[t]);
    }
    let m = t.match(/^#([0-9a-f]{3,8})$/);
    if (m) {
        let h = m[1];
        if (h.length === 3 || h.length === 4) {
            h = [...h].map((c) => c + c).join('');
        }
        if (h.length !== 6 && h.length !== 8) {
            return null;
        }
        return { r: parseInt(h.slice(0, 2), 16), g: parseInt(h.slice(2, 4), 16), b: parseInt(h.slice(4, 6), 16), a: h.length === 8 ? parseInt(h.slice(6, 8), 16) / 255 : 1 };
    }
    m = t.match(/^rgba?\(([^)]+)\)$/);
    if (m) {
        const p = m[1].split(/[\s,/]+/).filter(Boolean).map(parseFloat);
        return p.length >= 3 ? { r: p[0], g: p[1], b: p[2], a: p.length > 3 ? p[3] : 1 } : null;
    }
    return null;
}

function toHsl({ r, g, b }) {
    r /= 255; g /= 255; b /= 255;
    const max = Math.max(r, g, b);
    const min = Math.min(r, g, b);
    const l = (max + min) / 2;
    let h = 0;
    let s = 0;
    if (max !== min) {
        const d = max - min;
        s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
        if (max === r) { h = (g - b) / d + (g < b ? 6 : 0); } else if (max === g) { h = (b - r) / d + 2; } else { h = (r - g) / d + 4; }
        h *= 60;
    }
    return { h, s, l };
}

function fromHsl({ h, s, l }, a) {
    const k = (n) => (n + h / 30) % 12;
    const f = (n) => l - s * Math.min(l, 1 - l) * Math.max(-1, Math.min(k(n) - 3, Math.min(9 - k(n), 1)));
    const [r, g, b] = [f(0), f(8), f(4)].map((v) => Math.round(v * 255));
    return a >= 0.999 ? `#${[r, g, b].map((v) => v.toString(16).padStart(2, '0')).join('')}` : `rgba(${r}, ${g}, ${b}, ${+a.toFixed(3)})`;
}

// kind: 'bg' | 'text' | 'border'
function mapColor(color, kind) {
    const hsl = toHsl(color);
    let { l } = hsl;
    // Neutral grays pick up the portal's navy hue so dark surfaces match the rest of the site.
    const neutral = hsl.s < 0.12;
    const h = neutral ? 212 : hsl.h;
    const s = neutral ? 0.3 : Math.min(hsl.s, 0.6);
    if (kind === 'bg') {
        if (l <= 0.55 || color.a <= 0.3) {
            return null; // already dark, or a faint overlay that still works on dark
        }
        l = 0.14 + (1 - l) * 0.35;
    } else if (kind === 'text') {
        if (l >= 0.55) {
            return null;
        }
        l = 0.97 - l * 0.62;
    } else {
        if (l > 0.9 && color.a <= 0.3) {
            return null; // faint white lines already suit dark surfaces
        }
        if (l > 0.6) {
            l = 0.28 + (1 - l) * 0.3;
        } else if (l < 0.4) {
            l = 0.6 - l * 0.25;
        } else {
            return null;
        }
    }
    return fromHsl({ h, s, l }, color.a);
}

const COLOR_RE = /#[0-9a-fA-F]{3,8}\b|rgba?\([^)]*\)|\bwhite\b|\bblack\b/g;
const URL_HEX_RE = /%23([0-9a-fA-F]{6})/g;

function mapValue(value, kind) {
    let changed = false;
    let out = value.replace(COLOR_RE, (match) => {
        const parsed = parseColor(match);
        const mapped = parsed && mapColor(parsed, kind);
        if (mapped) {
            changed = true;
            return mapped;
        }
        return match;
    });
    out = out.replace(URL_HEX_RE, (match, hex) => {
        const parsed = parseColor(`#${hex}`);
        const mapped = parsed && mapColor(parsed, 'text');
        if (mapped) {
            changed = true;
            return `%23${mapped.slice(1)}`;
        }
        return match;
    });
    return changed ? out : null;
}

function kindOf(prop) {
    if (prop === 'color' || prop === 'fill' || prop === 'stroke' || prop === 'caret-color' || prop === 'text-decoration-color') {
        return 'text';
    }
    if (prop.startsWith('background')) {
        return 'bg';
    }
    if (prop.startsWith('border') || prop.startsWith('outline')) {
        return 'border';
    }
    return null;
}

/* ---------- tiny CSS reader ---------- */

function stripComments(css) {
    return css.replace(/\/\*[\s\S]*?\*\//g, '');
}

function readBlock(css, start) {
    // css[start] is just after "{"; returns index of the matching "}".
    let depth = 1;
    let i = start;
    let quote = null;
    while (i < css.length && depth > 0) {
        const c = css[i];
        if (quote) {
            if (c === quote) { quote = null; }
        } else if (c === '"' || c === "'") {
            quote = c;
        } else if (c === '{') {
            depth += 1;
        } else if (c === '}') {
            depth -= 1;
        }
        i += 1;
    }
    return i - 1;
}

function splitTop(text, sep) {
    const parts = [];
    let depth = 0;
    let quote = null;
    let cur = '';
    for (const c of text) {
        if (quote) {
            if (c === quote) { quote = null; }
        } else if (c === '"' || c === "'") {
            quote = c;
        } else if (c === '(' || c === '[') {
            depth += 1;
        } else if (c === ')' || c === ']') {
            depth -= 1;
        } else if (c === sep && depth === 0) {
            parts.push(cur);
            cur = '';
            continue;
        }
        cur += c;
    }
    parts.push(cur);
    return parts;
}

function walk(css, emit, wrappers = []) {
    let i = 0;
    while (i < css.length) {
        const open = css.indexOf('{', i);
        if (open === -1) { break; }
        const prelude = css.slice(i, open).trim();
        const close = readBlock(css, open + 1);
        const body = css.slice(open + 1, close);
        i = close + 1;
        if (prelude.startsWith('@media') || prelude.startsWith('@supports')) {
            if (/print|prefers-reduced-motion/.test(prelude)) { continue; }
            walk(body, emit, [...wrappers, prelude]);
        } else if (prelude.startsWith('@')) {
            continue; // @keyframes, @font-face, ...
        } else {
            emit(prelude, body, wrappers);
        }
    }
}

/* ---------- build ---------- */

const groups = new Map(); // wrapper key -> [rule text]
let ruleCount = 0;

function addRule(wrappers, text) {
    const key = wrappers.join(' | ');
    if (!groups.has(key)) { groups.set(key, { wrappers, rules: [] }); }
    groups.get(key).rules.push(text);
    ruleCount += 1;
}

for (const file of SOURCES) {
    const css = stripComments(fs.readFileSync(path.join(root, file), 'utf8'));
    walk(css, (selector, body, wrappers) => {
        if (selector.includes('data-theme') || MEMBER_THEME.test(selector) || ALREADY_DARK.test(selector.trim())) { return; }
        const decls = [];
        for (const raw of splitTop(body, ';')) {
            const idx = raw.indexOf(':');
            if (idx === -1) { continue; }
            const prop = raw.slice(0, idx).trim().toLowerCase();
            const value = raw.slice(idx + 1).trim();
            if (prop.startsWith('--') || !value) { continue; }
            const kind = kindOf(prop);
            if (!kind) { continue; }
            const mapped = mapValue(value, kind);
            if (mapped) { decls.push(`${prop}: ${mapped}`); }
        }
        if (!decls.length) { return; }
        const scoped = splitTop(selector, ',').map((s) => `${SCOPE} ${s.trim()}`).join(',\n');
        addRule(wrappers, `${scoped} { ${decls.join('; ')}; }`);
    });
}

let out = '/* GENERATED by scripts/gen-dark-css.js (npm run build:dark). Do not edit by hand. */\n';
out += '/* Dark appearance overrides for hard-coded colors; token-based colors live in style.css. */\n';
for (const { wrappers, rules } of groups.values()) {
    let block = rules.join('\n');
    for (const w of [...wrappers].reverse()) {
        block = `${w} {\n${block.split('\n').map((l) => `  ${l}`).join('\n')}\n}`;
    }
    out += `${block}\n`;
}
fs.writeFileSync(path.join(root, 'dark.css'), out);
console.log(`dark.css written: ${ruleCount} rules, ${(out.length / 1024).toFixed(1)} KB`);
