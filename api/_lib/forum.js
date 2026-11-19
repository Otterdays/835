// [TRACE: ARCHITECTURE.md]
// Shared forum helpers. The `_lib` folder is underscore-prefixed so Vercel does
// NOT deploy it as its own serverless function (keeps us under the Hobby limit).
//
// Posting requires a signed-in account (see accounts.js); the author is taken from
// the session, never from the request body. Posts made before accounts existed keep
// their old temporary guest name and have no authorKey.
// Validation here is the authority; js/forum-app.js only mirrors it for UX.

const CATEGORIES = ['General', 'Contract', 'Workplace', 'CFCF', 'RCF', 'PICC', 'Website'];

const LIMITS = {
    title: { min: 5, max: 120 },
    threadBody: { min: 1, max: 5000 },
    replyBody: { min: 1, max: 3000 },
    usernameMin: 3,
    usernameMax: 20,
    maxRequestBytes: 20000,
    listLimit: 50,
    replyLimit: 500
};

const RATE = {
    thread: { max: 5, windowMs: 60 * 60 * 1000 },
    reply: { max: 20, windowMs: 60 * 60 * 1000 }
};

// Block names that could pass as union officials. Compared after stripping
// spaces / _ / - and lowercasing, as an exact match or prefix.
const RESERVED_PREFIXES = [
    'admin',
    'moderator',
    'mod',
    'steward',
    'shopsteward',
    'local835',
    'oe835',
    'iuoe',
    'union',
    'official',
    'staff',
    'system',
    'support'
];

const USERNAME_PATTERN = /^[A-Za-z0-9][A-Za-z0-9 _-]*[A-Za-z0-9]$/;

function httpError(status, message) {
    const err = new Error(message);
    err.status = status;
    return err;
}

function json(res, status, body) {
    res.statusCode = status;
    res.setHeader('Content-Type', 'application/json');
    res.setHeader('Cache-Control', 'no-store');
    res.end(JSON.stringify(body));
}

function handleError(res, err, label) {
    if (err && err.status) {
        return json(res, err.status, { ok: false, error: err.message });
    }
    console.error(`${label} failed`, err);
    return json(res, 500, { ok: false, error: 'Forum is temporarily unavailable.' });
}

async function readJson(req) {
    const chunks = [];
    let size = 0;
    for await (const chunk of req) {
        size += chunk.length;
        if (size > LIMITS.maxRequestBytes) {
            throw httpError(413, 'Request too large.');
        }
        chunks.push(chunk);
    }
    const raw = Buffer.concat(chunks).toString('utf8');
    try {
        const parsed = JSON.parse(raw || '{}');
        if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) {
            throw new Error('not an object');
        }
        return parsed;
    } catch {
        throw httpError(400, 'Invalid JSON body.');
    }
}

function clientIp(req) {
    const fwd = req.headers['x-forwarded-for'];
    const ip = (typeof fwd === 'string' ? fwd.split(',')[0] : req.socket?.remoteAddress) || 'unknown';
    return ip.trim();
}

function validateUsername(raw) {
    const value = String(raw || '').replace(/\s+/g, ' ').trim();
    if (value.length < LIMITS.usernameMin || value.length > LIMITS.usernameMax) {
        throw httpError(
            400,
            `Name must be ${LIMITS.usernameMin}–${LIMITS.usernameMax} characters.`
        );
    }
    if (!USERNAME_PATTERN.test(value)) {
        throw httpError(
            400,
            'Name may use letters, numbers, spaces, - and _ (start and end with a letter or number).'
        );
    }
    const normalized = value.toLowerCase().replace(/[ _-]/g, '');
    if (RESERVED_PREFIXES.some((prefix) => normalized.startsWith(prefix))) {
        throw httpError(400, 'That name is reserved. Please pick another.');
    }
    return value;
}

function cleanText(raw, { min, max }, label) {
    // Keep newlines/tabs, drop other control characters.
    const value = String(raw || '')
        .replace(/\r\n?/g, '\n')
        .replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/g, '')
        .trim();
    if (value.length < min) {
        throw httpError(400, `${label} must be at least ${min} character${min === 1 ? '' : 's'}.`);
    }
    if (value.length > max) {
        throw httpError(400, `${label} must be ${max} characters or fewer.`);
    }
    return value;
}

function validateCategory(raw) {
    const value = String(raw || '');
    if (!CATEGORIES.includes(value)) {
        throw httpError(400, 'Unknown category.');
    }
    return value;
}

function parseObjectId(raw) {
    const { ObjectId } = require('mongodb');
    const value = String(raw || '');
    if (!/^[a-f0-9]{24}$/i.test(value)) {
        throw httpError(400, 'Invalid thread id.');
    }
    return new ObjectId(value);
}

/** Fixed-window per-key counter in Mongo (TTL index cleans expired docs). */
async function consumeRateLimit(db, key, { max, windowMs }) {
    const coll = db.collection('forum_rate');
    const now = new Date();
    await coll.deleteOne({ key, expiresAt: { $lte: now } });

    let doc = null;
    for (let attempt = 0; attempt < 2 && !doc; attempt += 1) {
        try {
            doc = await coll.findOneAndUpdate(
                { key },
                {
                    $inc: { count: 1 },
                    $setOnInsert: { expiresAt: new Date(now.getTime() + windowMs) }
                },
                { upsert: true, returnDocument: 'after' }
            );
        } catch (err) {
            // Two concurrent first-hits race on the unique index; retry once.
            if (err.code !== 11000 || attempt === 1) {
                throw err;
            }
        }
    }
    if (doc.count > max) {
        throw httpError(429, 'Slow down — too many posts from your connection. Try again later.');
    }
}

function threadOut(doc) {
    return {
        id: String(doc._id),
        title: doc.title,
        body: doc.body,
        category: doc.category,
        author: doc.author,
        // authorKey is set only on posts made from a signed-in account.
        // Older posts (temporary guest names) have none and show as guests.
        authorKey: doc.authorKey || null,
        createdAt: doc.createdAt.toISOString(),
        lastActivityAt: doc.lastActivityAt.toISOString(),
        replyCount: doc.replyCount || 0
    };
}

function replyOut(doc) {
    return {
        id: String(doc._id),
        threadId: String(doc.threadId),
        body: doc.body,
        author: doc.author,
        authorKey: doc.authorKey || null,
        createdAt: doc.createdAt.toISOString()
    };
}

module.exports = {
    CATEGORIES,
    LIMITS,
    RATE,
    RESERVED_PREFIXES,
    httpError,
    json,
    handleError,
    readJson,
    clientIp,
    validateUsername,
    cleanText,
    validateCategory,
    parseObjectId,
    consumeRateLimit,
    threadOut,
    replyOut
};
