// [TRACE: ARCHITECTURE.md]
const { getDb } = require('./mongo');

const WINDOW_MS = 15 * 60 * 1000;
const MAX_ATTEMPTS = 20;

async function assertNotRateLimited(key) {
    const db = await getDb();
    const now = new Date();
    const doc = await db.collection('login_attempts').findOne({ key });
    if (doc && doc.count >= MAX_ATTEMPTS && doc.expiresAt > now) {
        const err = new Error('Too many login attempts. Try again later.');
        err.status = 429;
        throw err;
    }
}

async function recordFailedAttempt(key) {
    const db = await getDb();
    const expiresAt = new Date(Date.now() + WINDOW_MS);
    await db.collection('login_attempts').updateOne(
        { key },
        {
            $inc: { count: 1 },
            $set: { expiresAt },
            $setOnInsert: { createdAt: new Date() }
        },
        { upsert: true }
    );
}

async function clearAttempts(key) {
    const db = await getDb();
    await db.collection('login_attempts').deleteOne({ key });
}

module.exports = { assertNotRateLimited, recordFailedAttempt, clearAttempts };
