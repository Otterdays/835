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
            const query = (params.get('q') || '').trim().slice(0, 120);
            if (query.length >= 2) {
                const threadCollection = db.collection('forum_threads');
                const replyCollection = db.collection('forum_replies');
                const textSearch = { $text: { $search: query } };
                const [directMatches, replyMatches] = await Promise.all([
                    threadCollection
                        .find({ ...filter, ...textSearch })
                        .project({ score: { $meta: 'textScore' } })
                        .sort({ score: { $meta: 'textScore' }, lastActivityAt: -1 })
                        .limit(50)
                        .toArray(),
                    replyCollection
                        .find(textSearch)
                        .project({ score: { $meta: 'textScore' } })
                        .sort({ score: { $meta: 'textScore' }, createdAt: -1 })
                        .limit(100)
                        .toArray()
                ]);

                const repliesByThread = new Map();
                replyMatches.forEach((reply) => {
                    const id = String(reply.threadId);
                    if (!repliesByThread.has(id)) repliesByThread.set(id, []);
                    repliesByThread.get(id).push(forum.replyOut(reply));
                });

                const matchedIds = new Set(directMatches.map((thread) => String(thread._id)));
                replyMatches.forEach((reply) => matchedIds.add(String(reply.threadId)));
                const replyOnlyIds = [...matchedIds]
                    .filter((id) => !directMatches.some((thread) => String(thread._id) === id))
                    .map((id) => new (require('mongodb').ObjectId)(id));
                const replyParents = replyOnlyIds.length
                    ? await threadCollection.find({ _id: { $in: replyOnlyIds }, ...filter }).toArray()
                    : [];
                const threadMap = new Map(
                    [...directMatches, ...replyParents].map((thread) => [String(thread._id), thread])
                );

                const threads = [...matchedIds]
                    .map((id) => threadMap.get(id))
                    .filter(Boolean)
                    .map((thread) => ({
                        ...forum.threadOut(thread),
                        matchedReplies: (repliesByThread.get(String(thread._id)) || []).slice(0, 5)
                    }))
                    .sort((a, b) => new Date(b.lastActivityAt) - new Date(a.lastActivityAt))
                    .slice(0, 50);

                return forum.json(res, 200, { ok: true, threads });
            }

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
