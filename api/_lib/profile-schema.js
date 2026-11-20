// [TRACE: ACCOUNTS.md]
// Single source of truth for member-profile options and validation.
// The browser reads these lists from GET /api/profile?meta=1 so they cannot drift.
// Profiles hold only picks from fixed lists plus plain text. There is no raw HTML,
// CSS, or image upload, so a profile cannot restyle or script the portal.

const forum = require('./forum');

const FACILITIES = ['CFCF', 'RCF', 'PICC', 'Other'];

// Job titles a member can pick: the trades shown on the site roster (data.js
// employeesData), without status notes, steward titles, or management roles. Combined roster
// titles are listed as their separate roles (Kitchen Supervisor/Mechanic, Stationary/Building Engineer).
// Steward titles are verified badges. tests/smoke.js fails if this drifts from the roster.
const JOB_TITLES = [
    'Building Engineer',
    'Data Clerk',
    'Electrician',
    'Electronic Security',
    'Engineer',
    'Helper',
    'Kitchen Mechanic',
    'Kitchen Mechanic Helper',
    'Kitchen Supervisor',
    'Laborer',
    'Locksmith',
    'Painter',
    'Plumber',
    'Project Management Assistant',
    'Stationary Engineer',
    'Trades Helper',
    'Warehouse Crew',
    'Welder'
];

// Verified titles. Only an admin can award these (scripts/manage-user.js);
// a member can never set their own.
const BADGES = {
    verified: 'Verified Member',
    'lead-admin': 'Lead Admin',
    steward: 'Shop Steward',
    'lead-steward': 'Lead Steward',
    'exec-board': 'Executive Board',
    'bargaining-committee': 'Bargaining Committee',
    'safety-committee': 'Safety Committee'
};

// Shown automatically on every account whose role is "admin". Not awardable, so it
// always matches the real role (including a role edited directly in the database).
const AUTO_BADGES = { admin: 'Site Admin' };

const THEMES = {
    classic: 'Classic Blue',
    hardhat: 'Hard Hat Yellow',
    steel: 'Steel',
    brick: 'Brick Red',
    pine: 'Pine',
    midnight: 'Midnight',
    graphite: 'Graphite',
    ember: 'Ember',
    forest: 'Dark Forest'
};

// Light or dark, so the editor can group them. The colors themselves live in profile.css.
const THEME_MODES = {
    classic: 'light',
    hardhat: 'light',
    steel: 'light',
    brick: 'light',
    pine: 'light',
    midnight: 'dark',
    graphite: 'dark',
    ember: 'dark',
    forest: 'dark'
};

const PATTERNS = {
    none: 'Plain',
    dots: 'Dots',
    stripes: 'Stripes',
    grid: 'Graph paper'
};

const MOODS = {
    chillin: { emoji: '😎', label: 'Chillin’' },
    grinding: { emoji: '💪', label: 'Grinding' },
    coffee: { emoji: '☕', label: 'Running on coffee' },
    fired: { emoji: '🔥', label: 'Fired up' },
    hopeful: { emoji: '🙂', label: 'Hopeful' },
    ready: { emoji: '🛠️', label: 'Ready to work' },
    solid: { emoji: '✊', label: 'Union strong' },
    off: { emoji: '🎣', label: 'Off the clock' }
};

const AVATAR_GLYPHS = {
    hardhat: '👷',
    wrench: '🔧',
    key: '🔑',
    gear: '⚙️',
    tools: '🛠️',
    tractor: '🚜',
    truck: '🚚',
    bolt: '⚡',
    flame: '🔥',
    snow: '❄️',
    bulb: '💡',
    fist: '✊',
    star: '⭐',
    anchor: '⚓',
    eagle: '🦅',
    shield: '🛡️'
};

const AVATAR_LABELS = {
    hardhat: 'Hard hat',
    wrench: 'Wrench',
    key: 'Key',
    gear: 'Gear',
    tools: 'Tools',
    tractor: 'Tractor',
    truck: 'Truck',
    bolt: 'Lightning bolt',
    flame: 'Flame',
    snow: 'Snowflake',
    bulb: 'Light bulb',
    fist: 'Raised fist',
    star: 'Star',
    anchor: 'Anchor',
    eagle: 'Eagle',
    shield: 'Shield'
};

const AVATAR_COLORS = {
    blue: '#1f4e9c',
    gold: '#b7791f',
    red: '#9b2c2c',
    green: '#1f6b4a',
    purple: '#5b3fa0',
    orange: '#b4541a',
    teal: '#0f6f7a',
    gray: '#44566b'
};

const VISIBILITY = { members: 'Visible to signed-in members', hidden: 'Hidden (only me)' };

const LIMITS = {
    handleMin: 3,
    handleMax: 20,
    displayName: { min: 2, max: 30 },
    headline: { min: 0, max: 80 },
    jobTitle: { min: 0, max: 40 },
    aboutMe: { min: 0, max: 1500 },
    interests: { min: 0, max: 800 },
    wantToMeet: { min: 0, max: 800 },
    comment: { min: 1, max: 500 },
    links: 5,
    linkLabel: { min: 1, max: 40 },
    linkUrl: 300,
    top8: 8,
    passwordMin: 8,
    passwordMax: 128
};

const HANDLE_PATTERN = /^[A-Za-z0-9][A-Za-z0-9_-]*[A-Za-z0-9]$/;
const DISPLAY_NAME_PATTERN = /^[\p{L}\p{N}][\p{L}\p{N} .'’_-]*$/u;
const COMMON_PASSWORDS = new Set([
    'password', 'password1', 'password123', '12345678', '123456789', '1234567890',
    'qwertyui', 'qwerty123', 'iloveyou', 'letmein1', 'welcome1', 'local835',
    'local8351', 'union123', 'operatingengineers', 'changeme'
]);

function isReservedName(value) {
    const normalized = String(value).toLowerCase().replace(/[^a-z0-9]/g, '');
    return forum.RESERVED_PREFIXES.some((prefix) => normalized.startsWith(prefix));
}

/** Handle = permanent sign-in name. No spaces so it is safe in links. */
function validateHandle(raw) {
    const value = String(raw || '').trim();
    if (value.length < LIMITS.handleMin || value.length > LIMITS.handleMax) {
        throw forum.httpError(400, `Username must be ${LIMITS.handleMin}–${LIMITS.handleMax} characters.`);
    }
    if (!HANDLE_PATTERN.test(value)) {
        throw forum.httpError(
            400,
            'Username may use letters, numbers, - and _ (no spaces; start and end with a letter or number).'
        );
    }
    if (isReservedName(value)) {
        throw forum.httpError(400, 'That username is reserved. Please pick another.');
    }
    return value;
}

function validatePassword(raw, handle) {
    const value = String(raw || '');
    if (value.length < LIMITS.passwordMin) {
        throw forum.httpError(400, `Password must be at least ${LIMITS.passwordMin} characters.`);
    }
    if (value.length > LIMITS.passwordMax) {
        throw forum.httpError(400, `Password must be ${LIMITS.passwordMax} characters or fewer.`);
    }
    const lowered = value.toLowerCase();
    if (COMMON_PASSWORDS.has(lowered) || (handle && lowered === String(handle).toLowerCase())) {
        throw forum.httpError(400, 'That password is too easy to guess. Please pick another.');
    }
    return value;
}

function validateDisplayName(raw, { allowReserved = false } = {}) {
    const value = String(raw || '').replace(/\s+/g, ' ').trim();
    if (value.length < LIMITS.displayName.min || value.length > LIMITS.displayName.max) {
        throw forum.httpError(
            400,
            `Display name must be ${LIMITS.displayName.min}–${LIMITS.displayName.max} characters.`
        );
    }
    if (!DISPLAY_NAME_PATTERN.test(value)) {
        throw forum.httpError(400, 'Display name may use letters, numbers, spaces, . \' - and _.');
    }
    if (!allowReserved && isReservedName(value)) {
        throw forum.httpError(400, 'That display name is reserved. Please pick another.');
    }
    return value;
}

function pick(map, raw, label, { allowEmpty = false } = {}) {
    const value = String(raw === undefined || raw === null ? '' : raw);
    if (allowEmpty && value === '') {
        return '';
    }
    if (!Object.prototype.hasOwnProperty.call(map, value)) {
        throw forum.httpError(400, `Unknown ${label}.`);
    }
    return value;
}

function defaultProfile(handle, displayName) {
    const now = new Date();
    return {
        username: String(handle).toLowerCase(),
        handle: String(handle),
        displayName: displayName || String(handle),
        headline: '',
        jobTitle: '',
        facility: '',
        mood: '',
        aboutMe: '',
        interests: '',
        wantToMeet: '',
        theme: 'classic',
        pattern: 'none',
        avatar: { glyph: 'hardhat', color: 'blue' },
        top8: [],
        links: [],
        visibility: 'members',
        badges: [],
        views: 0,
        createdAt: now,
        updatedAt: now,
        lastLoginAt: null,
        lastSeenAt: null,
        schemaVersion: 1
    };
}

/**
 * A member-supplied web address. Only plain http(s) pages on a normal hostname are kept:
 * no javascript:/data: links, no logins inside the address, no IP numbers or local names.
 * Returns the normalized address (the browser's own parsing, with the hostname lowercased).
 */
function cleanUrl(raw) {
    let text = String(raw || '').trim();
    if (!text) {
        throw forum.httpError(400, 'Enter a web address for each link.');
    }
    if (text.length > LIMITS.linkUrl) {
        throw forum.httpError(400, 'That web address is too long.');
    }
    if (/\s/.test(text)) {
        throw forum.httpError(400, 'Web addresses cannot contain spaces.');
    }
    // "example.com" is fine; anything with another scheme (javascript:, data:, ftp:) is not.
    if (!/^https?:\/\//i.test(text)) {
        if (/^[a-z][a-z0-9+.-]*:/i.test(text) && !/^[^/]*\.[^/]*(:\d+)?(\/|$)/.test(text)) {
            throw forum.httpError(400, 'Links must start with http:// or https://.');
        }
        text = `https://${text}`;
    }
    let url;
    try {
        url = new URL(text);
    } catch (err) {
        throw forum.httpError(400, 'That does not look like a web address.');
    }
    if (url.protocol !== 'http:' && url.protocol !== 'https:') {
        throw forum.httpError(400, 'Links must start with http:// or https://.');
    }
    if (url.username || url.password) {
        throw forum.httpError(400, 'Web addresses with a login inside them are not allowed.');
    }
    const host = url.hostname.toLowerCase();
    const looksLocal =
        !host.includes('.') ||
        host.includes(':') ||
        host.startsWith('[') ||
        /^\d+(\.\d+)*$/.test(host) ||
        host === 'localhost' ||
        /\.(local|internal|localhost|lan)$/.test(host);
    if (looksLocal) {
        throw forum.httpError(400, 'Use a normal website address (not an IP number or a local name).');
    }
    return url.href;
}

function cleanLinks(raw) {
    if (!Array.isArray(raw) || raw.length > LIMITS.links) {
        throw forum.httpError(400, `You can add up to ${LIMITS.links} links.`);
    }
    const seen = new Set();
    return raw.map((item) => {
        const entry = item && typeof item === 'object' ? item : {};
        const label = forum.cleanText(entry.label, LIMITS.linkLabel, 'Link name').replace(/\s+/g, ' ');
        const url = cleanUrl(entry.url);
        if (seen.has(url)) {
            throw forum.httpError(400, 'Each link must be different.');
        }
        seen.add(url);
        return { label, url };
    });
}

/**
 * Validate a profile edit. Only fields present in `body` are returned, so a
 * partial update (for example a Top 8 change) never wipes other fields.
 * Badges, handle, views and timestamps are never accepted from the client.
 */
function cleanProfileUpdate(body, { allowReservedName = false } = {}) {
    const out = {};
    const has = (key) => Object.prototype.hasOwnProperty.call(body, key);

    if (has('displayName')) {
        out.displayName = validateDisplayName(body.displayName, { allowReserved: allowReservedName });
    }
    ['headline', 'aboutMe', 'interests', 'wantToMeet'].forEach((key) => {
        if (has(key)) {
            out[key] = forum.cleanText(body[key], LIMITS[key], key);
            if (key === 'headline') {
                out[key] = out[key].replace(/\s+/g, ' ');
            }
        }
    });
    if (has('jobTitle')) {
        const title = String(body.jobTitle || '');
        if (title !== '' && !JOB_TITLES.includes(title)) {
            throw forum.httpError(400, 'Pick a job title from the list.');
        }
        out.jobTitle = title;
    }
    if (has('facility')) {
        out.facility = pick(Object.fromEntries(FACILITIES.map((f) => [f, f])), body.facility, 'facility', { allowEmpty: true });
    }
    if (has('mood')) {
        out.mood = pick(MOODS, body.mood, 'mood', { allowEmpty: true });
    }
    if (has('theme')) {
        out.theme = pick(THEMES, body.theme, 'theme');
    }
    if (has('pattern')) {
        out.pattern = pick(PATTERNS, body.pattern, 'pattern');
    }
    if (has('visibility')) {
        out.visibility = pick(VISIBILITY, body.visibility, 'visibility');
    }
    if (has('avatar')) {
        const avatar = body.avatar && typeof body.avatar === 'object' ? body.avatar : {};
        out.avatar = {
            glyph: pick(AVATAR_GLYPHS, avatar.glyph, 'avatar picture'),
            color: pick(AVATAR_COLORS, avatar.color, 'avatar color')
        };
    }
    if (has('links')) {
        out.links = cleanLinks(body.links);
    }
    if (has('top8')) {
        if (!Array.isArray(body.top8) || body.top8.length > LIMITS.top8) {
            throw forum.httpError(400, `Top ${LIMITS.top8} can list up to ${LIMITS.top8} members.`);
        }
        out.top8 = [...new Set(body.top8.map((h) => String(h || '').trim().toLowerCase()))].filter(Boolean);
        if (out.top8.some((h) => !HANDLE_PATTERN.test(h) && h.length > 1)) {
            throw forum.httpError(400, 'Top 8 contains an invalid username.');
        }
    }
    return out;
}

function options() {
    const labelled = (map) => Object.entries(map).map(([id, label]) => ({ id, label }));
    return {
        facilities: FACILITIES,
        jobTitles: JOB_TITLES,
        badges: labelled({ ...AUTO_BADGES, ...BADGES }),
        themes: Object.entries(THEMES).map(([id, label]) => ({ id, label, mode: THEME_MODES[id] })),
        patterns: labelled(PATTERNS),
        visibility: labelled(VISIBILITY),
        moods: Object.entries(MOODS).map(([id, m]) => ({ id, ...m })),
        avatarGlyphs: Object.entries(AVATAR_GLYPHS).map(([id, emoji]) => ({ id, emoji, label: AVATAR_LABELS[id] || id })),
        avatarColors: Object.entries(AVATAR_COLORS).map(([id, hex]) => ({ id, hex })),
        limits: LIMITS
    };
}

module.exports = {
    THEME_MODES,
    cleanUrl,
    FACILITIES,
    AUTO_BADGES,
    JOB_TITLES,
    BADGES,
    THEMES,
    PATTERNS,
    MOODS,
    AVATAR_GLYPHS,
    AVATAR_COLORS,
    VISIBILITY,
    LIMITS,
    HANDLE_PATTERN,
    isReservedName,
    validateHandle,
    validatePassword,
    validateDisplayName,
    defaultProfile,
    cleanProfileUpdate,
    options
};
