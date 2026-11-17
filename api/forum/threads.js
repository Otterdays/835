// [TRACE: ARCHITECTURE.md]
// GET  /api/forum/threads[?category=CFCF]  -> newest-activity-first thread list
// POST /api/forum/threads                  -> create a thread (temporary username, no login)
const { getDb } = require('../lib/mongo');
const forum = require('../_lib/forum');

module.exports = async function handler(req, res) {
    try {
        if (req.method === 'GET') {
            const params = new URL(req.url, 'http://localhost').searchParams;
            const filter = {};
            if (params.get('category')) {
                filter.category = forum.validateCategory(params.get('category'));
            }
            const db = await getDb();
            const docs = await db
                .collection('forum_threads')
                .find(filter)
                .sort({ lastActivityAt: -1 })
                .limit(forum.LIMITS.listLimit)
                .toArray();
            return forum.json(res, 200, { ok: true, threads: docs.map(forum.threadOut) });
        }

        if (req.method === 'POST') {
            const body = await forum.readJson(req);

            // Honeypot: real users never see or fill this field.
            if (body.website) {
                return forum.json(res, 200, { ok: true });
            }

            const author = forum.validateUsername(body.author);
            const title = forum.cleanText(body.title, forum.LIMITS.title, 'Title');
            const text = forum.cleanText(body.body, forum.LIMITS.threadBody, 'Message');
            const category = forum.validateCategory(body.category);

            const db = await getDb();
            await forum.consumeRateLimit(db, `thread:${forum.clientIp(req)}`, forum.RATE.thread);

            const now = new Date();
            const doc = {
                title,
                body: text,
                category,
                author,
                createdAt: now,
                lastActivityAt: now,
                replyCount: 0
            };
            const result = await db.collection('forum_threads').insertOne(doc);
            return forum.json(res, 201, {
                ok: true,
                thread: forum.threadOut({ ...doc, _id: result.insertedId })
            });
        }

        res.setHeader('Allow', 'GET, POST');
        return forum.json(res, 405, { ok: false, error: 'Method not allowed' });
    } catch (err) {
        return forum.handleError(res, err, 'forum threads');
    }
};
