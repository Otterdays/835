// [TRACE: ARCHITECTURE.md]
// GET  /api/forum/thread?id=<threadId>  -> one thread + its replies (oldest first)
// POST /api/forum/thread                -> reply { threadId, author, body }
const { getDb } = require('../lib/mongo');
const forum = require('../_lib/forum');

module.exports = async function handler(req, res) {
    try {
        if (req.method === 'GET') {
            const params = new URL(req.url, 'http://localhost').searchParams;
            const threadId = forum.parseObjectId(params.get('id'));
            const db = await getDb();
            const thread = await db.collection('forum_threads').findOne({ _id: threadId });
            if (!thread) {
                throw forum.httpError(404, 'Thread not found.');
            }
            const replies = await db
                .collection('forum_replies')
                .find({ threadId })
                .sort({ createdAt: 1 })
                .limit(forum.LIMITS.replyLimit)
                .toArray();
            return forum.json(res, 200, {
                ok: true,
                thread: forum.threadOut(thread),
                replies: replies.map(forum.replyOut)
            });
        }

        if (req.method === 'POST') {
            const body = await forum.readJson(req);

            if (body.website) {
                return forum.json(res, 200, { ok: true });
            }

            const threadId = forum.parseObjectId(body.threadId);
            const author = forum.validateUsername(body.author);
            const text = forum.cleanText(body.body, forum.LIMITS.replyBody, 'Reply');

            const db = await getDb();
            const exists = await db.collection('forum_threads').findOne({ _id: threadId }, { projection: { _id: 1 } });
            if (!exists) {
                throw forum.httpError(404, 'Thread not found.');
            }
            await forum.consumeRateLimit(db, `reply:${forum.clientIp(req)}`, forum.RATE.reply);

            const now = new Date();
            const doc = { threadId, body: text, author, createdAt: now };
            const result = await db.collection('forum_replies').insertOne(doc);
            await db
                .collection('forum_threads')
                .updateOne({ _id: threadId }, { $inc: { replyCount: 1 }, $set: { lastActivityAt: now } });
            return forum.json(res, 201, {
                ok: true,
                reply: forum.replyOut({ ...doc, _id: result.insertedId })
            });
        }

        res.setHeader('Allow', 'GET, POST');
        return forum.json(res, 405, { ok: false, error: 'Method not allowed' });
    } catch (err) {
        return forum.handleError(res, err, 'forum thread');
    }
};
