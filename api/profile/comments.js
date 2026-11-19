// [TRACE: ACCOUNTS.md]
// The profile "comments wall".
// GET    /api/profile/comments?u=<handle>  -> latest comments (signed-in members)
// POST   /api/profile/comments { u, body } -> leave a comment
// DELETE /api/profile/comments?id=<id>     -> remove (comment author, profile owner, or admin)
const { ObjectId } = require('mongodb');
const forum = require('../_lib/forum');
const schema = require('../_lib/profile-schema');
const accounts = require('../_lib/accounts');

const LIST_LIMIT = 50;
const COMMENT_RATE = { max: 20, windowMs: 60 * 60 * 1000 };

async function loadTarget(viewer, rawHandle) {
    const key = String(rawHandle || '').trim().toLowerCase();
    if (!schema.HANDLE_PATTERN.test(key)) {
        throw forum.httpError(400, 'Invalid username.');
    }
    const target = await viewer.db.collection('profiles').findOne({ username: key });
    const visible =
        target &&
        (target.visibility !== 'hidden' || target.username === viewer.username || viewer.role === 'admin');
    if (!visible) {
        throw forum.httpError(404, 'No member by that name.');
    }
    return target;
}

function commentOut(doc, authors, viewer, target) {
    const canDelete =
        doc.authorUsername === viewer.username ||
        target.username === viewer.username ||
        viewer.role === 'admin';
    return {
        id: String(doc._id),
        body: doc.body,
        createdAt: doc.createdAt.toISOString(),
        author: authors.get(doc.authorUsername) || {
            handle: doc.authorHandle,
            displayName: doc.authorHandle,
            avatar: { glyph: 'hardhat', color: 'gray' },
            badges: []
        },
        canDelete
    };
}

module.exports = async function handler(req, res) {
    try {
        const viewer = await accounts.requireUser(req);
        const params = new URL(req.url, 'http://localhost').searchParams;
        const comments = viewer.db.collection('profile_comments');

        if (req.method === 'GET') {
            const target = await loadTarget(viewer, params.get('u'));
            const docs = await comments
                .find({ profileUsername: target.username })
                .sort({ createdAt: -1 })
                .limit(LIST_LIMIT)
                .toArray();
            const authors = await accounts.loadSummaries(
                viewer.db,
                docs.map((doc) => doc.authorUsername)
            );
            return forum.json(res, 200, {
                ok: true,
                comments: docs.map((doc) => commentOut(doc, authors, viewer, target))
            });
        }

        if (req.method === 'POST') {
            const body = await forum.readJson(req);
            if (body.website) {
                return forum.json(res, 200, { ok: true });
            }
            const target = await loadTarget(viewer, body.u);
            const text = forum.cleanText(body.body, schema.LIMITS.comment, 'Comment');
            await forum.consumeRateLimit(viewer.db, `pcomment:${viewer.username}`, COMMENT_RATE);
            const doc = {
                profileUsername: target.username,
                authorUsername: viewer.username,
                authorHandle: viewer.profile.handle,
                body: text,
                createdAt: new Date()
            };
            const result = await comments.insertOne(doc);
            const authors = await accounts.loadSummaries(viewer.db, [viewer.username]);
            return forum.json(res, 201, {
                ok: true,
                comment: commentOut({ ...doc, _id: result.insertedId }, authors, viewer, target)
            });
        }

        if (req.method === 'DELETE') {
            const raw = String(params.get('id') || '');
            if (!/^[a-f0-9]{24}$/i.test(raw)) {
                throw forum.httpError(400, 'Invalid comment id.');
            }
            const doc = await comments.findOne({ _id: new ObjectId(raw) });
            if (!doc) {
                throw forum.httpError(404, 'Comment not found.');
            }
            const allowed =
                doc.authorUsername === viewer.username ||
                doc.profileUsername === viewer.username ||
                viewer.role === 'admin';
            if (!allowed) {
                throw forum.httpError(403, 'You can only delete your own comments or comments on your profile.');
            }
            await comments.deleteOne({ _id: doc._id });
            return forum.json(res, 200, { ok: true });
        }

        res.setHeader('Allow', 'GET, POST, DELETE');
        return forum.json(res, 405, { ok: false, error: 'Method not allowed' });
    } catch (err) {
        return forum.handleError(res, err, 'profile comments');
    }
};
