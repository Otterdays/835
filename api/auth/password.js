// [TRACE: ACCOUNTS.md]
// POST /api/auth/password { currentPassword, newPassword } -> change own password.
// Older sessions (other devices) stop working; this one is re-issued.
const { getDb } = require('../_lib/mongo');
const { hashPassword, verifyPassword } = require('../_lib/password');
const { createSessionToken, sessionCookie } = require('../_lib/session');
const { assertNotRateLimited, recordFailedAttempt, clearAttempts } = require('../_lib/rate-limit');
const forum = require('../_lib/forum');
const schema = require('../_lib/profile-schema');
const accounts = require('../_lib/accounts');

module.exports = async function handler(req, res) {
    try {
        if (req.method !== 'POST') {
            res.setHeader('Allow', 'POST');
            return forum.json(res, 405, { ok: false, error: 'Method not allowed' });
        }
        const session = await accounts.requireUser(req);
        const body = await forum.readJson(req);
        const next = schema.validatePassword(body.newPassword, session.profile.handle);

        const key = `pw:${session.username}`;
        await assertNotRateLimited(key);

        const db = await getDb();
        const user = await db.collection('users').findOne({ username: session.username, active: true });
        const valid =
            user &&
            user.passwordSalt &&
            user.passwordHash &&
            (await verifyPassword(String(body.currentPassword || ''), user.passwordSalt, user.passwordHash));
        if (!valid) {
            await recordFailedAttempt(key);
            throw forum.httpError(400, 'Your current password is not right.');
        }
        await clearAttempts(key);

        const hashed = await hashPassword(next);
        const now = new Date();
        await db.collection('users').updateOne(
            { username: session.username },
            {
                $set: {
                    passwordHash: hashed.hash,
                    passwordSalt: hashed.salt,
                    passwordChangedAt: now,
                    updatedAt: now
                }
            }
        );
        const token = await createSessionToken({ username: session.username, role: session.role });
        res.setHeader('Set-Cookie', sessionCookie(token));
        return forum.json(res, 200, { ok: true });
    } catch (err) {
        return forum.handleError(res, err, 'password change');
    }
};
