// [TRACE: ACCOUNTS.md]
// GET  /api/auth/register -> { open, codeRequired } so the sign-up form can adapt
// POST /api/auth/register -> create an account (member role), then sign in
//
// Env switches (see .env.example):
//   SIGNUP_CODE   if set, new accounts must supply it (hand it out at meetings)
//   SIGNUP_CLOSED set to "1" to stop new sign-ups entirely
const crypto = require('crypto');
const { getDb } = require('../_lib/mongo');
const { hashPassword } = require('../_lib/password');
const { createSessionToken, sessionCookie } = require('../_lib/session');
const forum = require('../_lib/forum');
const schema = require('../_lib/profile-schema');
const accounts = require('../_lib/accounts');

const SIGNUP_RATE = { max: 5, windowMs: 60 * 60 * 1000 };

function signupConfig() {
    return {
        open: process.env.SIGNUP_CLOSED !== '1',
        code: String(process.env.SIGNUP_CODE || '')
    };
}

function codeMatches(given, expected) {
    // Hash both sides so the comparison is constant-length and constant-time.
    const a = crypto.createHash('sha256').update(String(given || '').trim()).digest();
    const b = crypto.createHash('sha256').update(expected).digest();
    return crypto.timingSafeEqual(a, b);
}

module.exports = async function handler(req, res) {
    try {
        const config = signupConfig();

        if (req.method === 'GET') {
            return forum.json(res, 200, { ok: true, open: config.open, codeRequired: Boolean(config.code) });
        }
        if (req.method !== 'POST') {
            res.setHeader('Allow', 'GET, POST');
            return forum.json(res, 405, { ok: false, error: 'Method not allowed' });
        }

        const body = await forum.readJson(req);
        if (body.website) {
            // Honeypot: pretend it worked so bots do not learn anything.
            return forum.json(res, 200, { ok: true });
        }
        if (!config.open) {
            throw forum.httpError(403, 'New accounts are closed right now. Ask a steward.');
        }
        if (config.code && !codeMatches(body.signupCode, config.code)) {
            throw forum.httpError(403, 'That sign-up code is not right. Ask a steward for the current code.');
        }

        const handle = schema.validateHandle(body.username);
        const password = schema.validatePassword(body.password, handle);
        const displayName = body.displayName
            ? schema.validateDisplayName(body.displayName)
            : handle;

        const db = await getDb();
        try {
            await forum.consumeRateLimit(db, `register:${forum.clientIp(req)}`, SIGNUP_RATE);
        } catch (err) {
            if (err.status === 429) {
                throw forum.httpError(429, 'Too many new accounts from your connection. Try again later.');
            }
            throw err;
        }

        const key = handle.toLowerCase();
        const hashed = await hashPassword(password);
        const now = new Date();
        try {
            await db.collection('users').insertOne({
                username: key,
                passwordHash: hashed.hash,
                passwordSalt: hashed.salt,
                role: 'member',
                active: true,
                schemaVersion: 1,
                createdAt: now,
                updatedAt: now
            });
        } catch (err) {
            if (err.code === 11000) {
                throw forum.httpError(409, 'That username is already taken.');
            }
            throw err;
        }

        const profile = await accounts.ensureProfile(db, { username: key, handle, displayName });
        const token = await createSessionToken({ username: key, role: 'member' });
        res.setHeader('Set-Cookie', sessionCookie(token));
        return forum.json(res, 201, {
            ok: true,
            user: accounts.accountOut({ role: 'member', profile })
        });
    } catch (err) {
        return forum.handleError(res, err, 'register');
    }
};
