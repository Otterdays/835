// [TRACE: ARCHITECTURE.md]
// GET  /api/forum/thread?id=<threadId>  -> one thread + its replies (oldest first)
// POST /api/forum/thread                -> reply { threadId, body } (signed-in members only)
// DELETE /api/forum/thread?id=<threadId>      -> delete a thread and its replies
// DELETE /api/forum/thread?reply=<replyId>    -> delete one reply
//   Allowed for the post's author or an admin. Posts from before accounts (no authorKey)
//   can only be deleted by an admin. An admin deleting someone else's post is logged.
const { getDb } = require('../_lib/mongo');
const forum = require('../_lib/forum');
const accounts = require('../_lib/accounts');

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
            const [threadOut] = await accounts.attachAuthors(db, [forum.threadOut(thread)]);
            return forum.json(res, 200, {
                ok: true,
                thread: threadOut,
                replies: await accounts.attachAuthors(db, replies.map(forum.replyOut))
            });
        }

        if (req.method === 'POST') {
            const body = await forum.readJson(req);

            if (body.website) {
                return forum.json(res, 200, { ok: true });
            }

            const user = await accounts.requireUser(req);
            const threadId = forum.parseObjectId(body.threadId);
            const text = forum.cleanText(body.body, forum.LIMITS.replyBody, 'Reply');

            const db = user.db;
            const exists = await db.collection('forum_threads').findOne({ _id: threadId }, { projection: { _id: 1 } });
            if (!exists) {
                throw forum.httpError(404, 'Thread not found.');
            }
            await forum.consumeRateLimit(db, `reply:${user.username}`, forum.RATE.reply);

            const now = new Date();
            const doc = {
                threadId,
                body: text,
                author: user.profile.handle,
                authorKey: user.username,
                createdAt: now
            };
            const result = await db.collection('forum_replies').insertOne(doc);
            await db
                .collection('forum_threads')
                .updateOne({ _id: threadId }, { $inc: { replyCount: 1 }, $set: { lastActivityAt: now } });
            const [reply] = await accounts.attachAuthors(db, [
                forum.replyOut({ ...doc, _id: result.insertedId })
            ]);
            return forum.json(res, 201, { ok: true, reply });
        }

        if (req.method === 'DELETE') {
            if (!accounts.sameSite(req)) {
                throw forum.httpError(403, 'Request not allowed.');
            }
            const user = await accounts.requireUser(req);
            const params = new URL(req.url, 'http://localhost').searchParams;
            const db = user.db;
            const isAdmin = user.role === 'admin';
            const mayDelete = (doc) => isAdmin || Boolean(doc.authorKey && doc.authorKey === user.username);
            const logAdmin = (action, doc, detail) =>
                isAdmin && doc.authorKey !== user.username
                    ? db.collection('admin_audit').insertOne({
                          at: new Date(),
                          actor: user.username,
                          action,
                          target: doc.authorKey || String(doc.author || 'guest').toLowerCase(),
                          detail
                      })
                    : null;

            if (params.get('reply')) {
                const replyId = forum.parseObjectId(params.get('reply'));
                const reply = await db.collection('forum_replies').findOne({ _id: replyId });
                if (!reply) {
                    throw forum.httpError(404, 'Reply not found.');
                }
                if (!mayDelete(reply)) {
                    throw forum.httpError(403, 'You can only delete your own replies.');
                }
                await db.collection('forum_replies').deleteOne({ _id: replyId });
                await db
                    .collection('forum_threads')
                    .updateOne({ _id: reply.threadId, replyCount: { $gt: 0 } }, { $inc: { replyCount: -1 } });
                await logAdmin('forumDeleteReply', reply, { threadId: String(reply.threadId), excerpt: String(reply.body || '').slice(0, 60) });
                return forum.json(res, 200, { ok: true });
            }

            const threadId = forum.parseObjectId(params.get('id'));
            const thread = await db.collection('forum_threads').findOne({ _id: threadId });
            if (!thread) {
                throw forum.httpError(404, 'Thread not found.');
            }
            if (!mayDelete(thread)) {
                throw forum.httpError(403, 'You can only delete your own threads.');
            }
            const replies = await db.collection('forum_replies').find({ threadId }).toArray();
            await db.collection('forum_replies').deleteMany({ threadId });
            await db.collection('forum_threads').deleteOne({ _id: threadId });
            await logAdmin('forumDeleteThread', thread, { title: String(thread.title || '').slice(0, 80), replies: replies.length });
            return forum.json(res, 200, { ok: true, removedReplies: replies.length });
        }

        res.setHeader('Allow', 'GET, POST, DELETE');
        return forum.json(res, 405, { ok: false, error: 'Method not allowed' });
    } catch (err) {
        return forum.handleError(res, err, 'forum thread');
    }
};
