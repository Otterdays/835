// [TRACE: ARCHITECTURE.md]
const { MongoClient } = require('mongodb');

let cached = globalThis.__oe835Mongo;

async function getDb() {
    const uri = process.env.MONGODB_URI;
    const dbName = process.env.MONGODB_DB || 'oe835';
    if (!uri) {
        throw new Error('MONGODB_URI is not set');
    }
    if (!cached) {
        cached = { client: null, db: null };
        globalThis.__oe835Mongo = cached;
    }
    if (!cached.client) {
        cached.client = new MongoClient(uri, { maxPoolSize: 5 });
        await cached.client.connect();
        cached.db = cached.client.db(dbName);
        await ensureIndexes(cached.db);
    }
    return cached.db;
}

async function ensureIndexes(db) {
    await db.collection('users').createIndex({ username: 1 }, { unique: true });
    await db.collection('login_attempts').createIndex({ expiresAt: 1 }, { expireAfterSeconds: 0 });
    await db.collection('login_attempts').createIndex({ key: 1 });
}

module.exports = { getDb };
