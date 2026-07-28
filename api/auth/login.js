// [TRACE: ARCHITECTURE.md]
const { getDb } = require('../lib/mongo');
const { verifyPassword } = require('../lib/password');
const {
    createSessionToken,
    sessionCookie
} = require('../lib/session');
const {
    assertNotRateLimited,
    recordFailedAttempt,
    clearAttempts
} = require('../lib/rate-limit');

function clientKey(req, username) {
    const fwd = req.headers['x-forwarded-for'];
    const ip = (typeof fwd === 'string' ? fwd.split(',')[0] : req.socket?.remoteAddress) || 'unknown';
    return `${ip}:${String(username || '').toLowerCase()}`;
}

function json(res, status, body) {
    res.statusCode = status;
    res.setHeader('Content-Type', 'application/json');
    res.end(JSON.stringify(body));
}

module.exports = async function handler(req, res) {
    if (req.method !== 'POST') {
        return json(res, 405, { ok: false, error: 'Method not allowed' });
    }

    try {
        const chunks = [];
        for await (const chunk of req) {
            chunks.push(chunk);
        }
        const raw = Buffer.concat(chunks).toString('utf8');
        let body;
        try {
            body = JSON.parse(raw || '{}');
        } catch {
            return json(res, 400, { ok: false, error: 'Invalid JSON body' });
        }

        const username = String(body.username || '').trim().toLowerCase();
        const password = String(body.password || '');
        if (!username || !password) {
            return json(res, 400, { ok: false, error: 'Username and password required' });
        }

        const key = clientKey(req, username);
        await assertNotRateLimited(key);

        const db = await getDb();
        const user = await db.collection('users').findOne({ username, active: true });
        if (!user || !user.passwordSalt || !user.passwordHash) {
            await recordFailedAttempt(key);
            return json(res, 401, { ok: false, error: 'Invalid username or password.' });
        }

        const ok = await verifyPassword(password, user.passwordSalt, user.passwordHash);
        if (!ok) {
            await recordFailedAttempt(key);
            return json(res, 401, { ok: false, error: 'Invalid username or password.' });
        }

        await clearAttempts(key);
        const token = await createSessionToken({ username: user.username, role: user.role });
        res.setHeader('Set-Cookie', sessionCookie(token));
        return json(res, 200, {
            ok: true,
            user: { username: user.username, role: user.role || 'member' }
        });
    } catch (err) {
        console.error('login failed', err);
        const status = err.status || 500;
        return json(res, status, {
            ok: false,
            error: status === 429 ? err.message : 'Sign-in failed. Try again.'
        });
    }
};
