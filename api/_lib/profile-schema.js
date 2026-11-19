// [TRACE: ACCOUNTS.md]
// Single source of truth for member-profile options and validation.
// The browser reads these lists from GET /api/profile?meta=1 so they cannot drift.
// Profiles hold only picks from fixed lists plus plain text. There is no raw HTML,
// CSS, or image upload, so a profile cannot restyle or script the portal.

const forum = require('./forum');

const FACILITIES = ['CFCF', 'RCF', 'PICC', 'Other'];

// Verified titles. Only an admin can award these (scripts/manage-user.js);
// a member can never set their own.
const BADGES = {
    verified: 'Verified Member',
    steward: 'Shop Steward',
    'lead-steward': 'Lead Steward',
    'exec-board': 'Executive Board',
    'bargaining-committee': 'Bargaining Committee',
    'safety-committee': 'Safety Committee'
};

const THEMES = {
    classic: 'Classic Blue',
    hardhat: 'Hard Hat Yellow',
    midnight: 'Midnight',
    steel: 'Steel',
    brick: 'Brick Red',
    pine: 'Pine'
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
    ['headline', 'jobTitle', 'aboutMe', 'interests', 'wantToMeet'].forEach((key) => {
        if (has(key)) {
            out[key] = forum.cleanText(body[key], LIMITS[key], key);
            if (key === 'headline' || key === 'jobTitle') {
                out[key] = out[key].replace(/\s+/g, ' ');
            }
        }
    });
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
        badges: labelled(BADGES),
        themes: labelled(THEMES),
        patterns: labelled(PATTERNS),
        visibility: labelled(VISIBILITY),
        moods: Object.entries(MOODS).map(([id, m]) => ({ id, ...m })),
        avatarGlyphs: Object.entries(AVATAR_GLYPHS).map(([id, emoji]) => ({ id, emoji })),
        avatarColors: Object.entries(AVATAR_COLORS).map(([id, hex]) => ({ id, hex })),
        limits: LIMITS
    };
}

module.exports = {
    FACILITIES,
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
