// [TRACE: ACCOUNTS.md]
// Shared account helpers: session lookup, profile creation, and response shaping.
// Auth data (`users`: password hash, role) stays separate from profile data
// (`profiles`: what other members can see), and nothing secret is ever returned.
const { getDb } = require('./mongo');
const { COOKIE_NAME, readCookie, verifySessionToken } = require('./session');
const forum = require('./forum');
const schema = require('./profile-schema');

const ONLINE_WINDOW_MS = 5 * 60 * 1000;
const SEEN_THROTTLE_MS = 2 * 60 * 1000;

async function ensureProfile(db, user) {
    const handle = user.handle || user.username;
    const defaults = schema.defaultProfile(handle, user.displayName);
    // $setOnInsert only, so an existing profile is never overwritten.
    await db.collection('profiles').updateOne(
        { username: defaults.username },
        { $setOnInsert: defaults },
        { upsert: true }
    );
    return db.collection('profiles').findOne({ username: defaults.username });
}

/** Resolve the signed-in account from the cookie, or null for guests. */
async function getSessionUser(req) {
    const token = readCookie(req, COOKIE_NAME);
    if (!token) {
        return null;
    }
    let session;
    try {
        session = await verifySessionToken(token);
    } catch (err) {
        // Expired or tampered token: treat as signed out.
        return null;
    }
    const db = await getDb();
    const user = await db.collection('users').findOne({ username: session.username, active: true });
    if (!user) {
        return null;
    }
    // A password change signs out every older session.
    if (user.passwordChangedAt) {
        const changedSecond = Math.floor(new Date(user.passwordChangedAt).getTime() / 1000);
        if (session.iat < changedSecond) {
            return null;
        }
    }
    const profile = await ensureProfile(db, user);
    return {
        db,
        username: user.username,
        role: user.role || 'member',
        profile
    };
}

async function requireUser(req) {
    const user = await getSessionUser(req);
    if (!user) {
        throw forum.httpError(401, 'Please sign in first.');
    }
    return user;
}

function isOnline(profile, now = Date.now()) {
    return Boolean(profile.lastSeenAt) && now - new Date(profile.lastSeenAt).getTime() < ONLINE_WINDOW_MS;
}

function iso(value) {
    return value ? new Date(value).toISOString() : null;
}

/** Small card used in lists, Top 8 tiles and forum author chips. */
function summaryOut(profile) {
    return {
        handle: profile.handle,
        username: profile.username,
        displayName: profile.displayName,
        headline: profile.headline || '',
        jobTitle: profile.jobTitle || '',
        facility: profile.facility || '',
        avatar: profile.avatar || { glyph: 'hardhat', color: 'blue' },
        badges: Array.isArray(profile.badges) ? profile.badges : [],
        online: isOnline(profile)
    };
}

function fullProfileOut(profile, { top8 = [], isSelf = false } = {}) {
    return {
        ...summaryOut(profile),
        mood: profile.mood || '',
        aboutMe: profile.aboutMe || '',
        interests: profile.interests || '',
        wantToMeet: profile.wantToMeet || '',
        theme: profile.theme || 'classic',
        pattern: profile.pattern || 'none',
        visibility: profile.visibility || 'members',
        views: profile.views || 0,
        memberSince: iso(profile.createdAt),
        lastLoginAt: iso(profile.lastLoginAt),
        top8Handles: profile.top8 || [],
        top8,
        isSelf
    };
}

/** The signed-in user's own identity, as returned by login / register / me. */
function accountOut(user) {
    const profile = user.profile;
    return {
        username: profile.handle,
        role: user.role,
        displayName: profile.displayName,
        avatar: profile.avatar || { glyph: 'hardhat', color: 'blue' },
        badges: Array.isArray(profile.badges) ? profile.badges : []
    };
}

async function loadSummaries(db, usernames) {
    const keys = [...new Set(usernames.filter(Boolean).map((u) => String(u).toLowerCase()))];
    if (!keys.length) {
        return new Map();
    }
    const rows = await db
        .collection('profiles')
        .find({ username: { $in: keys }, visibility: { $ne: 'hidden' } })
        .limit(keys.length)
        .toArray();
    return new Map(rows.map((row) => [row.username, summaryOut(row)]));
}

/** Add `authorProfile` to forum threads / replies that came from an account. */
async function attachAuthors(db, items) {
    const keys = items.map((item) => item.authorKey).filter(Boolean);
    if (!keys.length) {
        return items;
    }
    const byKey = await loadSummaries(db, keys);
    return items.map((item) => {
        const profile = item.authorKey ? byKey.get(item.authorKey) : null;
        return profile ? { ...item, authorProfile: profile } : item;
    });
}

module.exports = {
    ONLINE_WINDOW_MS,
    SEEN_THROTTLE_MS,
    ensureProfile,
    getSessionUser,
    requireUser,
    isOnline,
    summaryOut,
    fullProfileOut,
    accountOut,
    loadSummaries,
    attachAuthors
};
