// [TRACE: ACCOUNTS.md]
// GET /api/profile?meta=1                         -> option lists (themes, moods, titles...)
// GET /api/profile?u=<handle>                     -> one profile (signed-in members only)
// GET /api/profile?list=1[&q=&facility=&badge=&sort=new|active|name] -> directory
// PUT /api/profile                                -> edit your own profile (partial update ok)
const forum = require('../_lib/forum');
const schema = require('../_lib/profile-schema');
const accounts = require('../_lib/accounts');

const DIRECTORY_LIMIT = 60;
const EDIT_RATE = { max: 60, windowMs: 60 * 60 * 1000 };

const escapeRegex = (text) => text.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

function canSee(profile, viewer) {
    return (
        profile.visibility !== 'hidden' ||
        profile.username === viewer.username ||
        viewer.role === 'admin'
    );
}

async function directory(viewer, params, res) {
    const filter = { visibility: { $ne: 'hidden' } };
    const q = (params.get('q') || '').trim().slice(0, 40);
    if (q) {
        const rx = new RegExp(escapeRegex(q), 'i');
        filter.$or = [{ handle: rx }, { displayName: rx }, { jobTitle: rx }, { headline: rx }];
    }
    const facility = params.get('facility');
    if (facility) {
        filter.facility = schema.FACILITIES.includes(facility) ? facility : '__none__';
    }
    const badge = params.get('badge');
    if (badge) {
        filter.badges = Object.prototype.hasOwnProperty.call(schema.BADGES, badge) ? badge : '__none__';
    }
    const sortKey = params.get('sort') || 'new';
    const sort =
        sortKey === 'active'
            ? { lastSeenAt: -1, createdAt: -1 }
            : sortKey === 'name'
              ? { displayName: 1 }
              : { createdAt: -1 };

    const rows = await viewer.db
        .collection('profiles')
        .find(filter)
        .sort(sort)
        .limit(DIRECTORY_LIMIT)
        .toArray();
    const total = await viewer.db.collection('profiles').countDocuments(filter);
    return forum.json(res, 200, {
        ok: true,
        total,
        truncated: total > rows.length,
        profiles: rows.map(accounts.summaryOut)
    });
}

async function resolveTop8(db, profile) {
    const byKey = await accounts.loadSummaries(db, profile.top8 || []);
    return (profile.top8 || []).map((key) => byKey.get(key)).filter(Boolean);
}

module.exports = async function handler(req, res) {
    try {
        const params = new URL(req.url, 'http://localhost').searchParams;

        if (req.method === 'GET' && params.get('meta')) {
            return forum.json(res, 200, { ok: true, options: schema.options() });
        }

        const viewer = await accounts.requireUser(req);

        if (req.method === 'GET') {
            if (params.get('list')) {
                return await directory(viewer, params, res);
            }
            const key = String(params.get('u') || '').trim().toLowerCase();
            if (!schema.HANDLE_PATTERN.test(key)) {
                throw forum.httpError(400, 'Invalid username.');
            }
            const profile = await viewer.db.collection('profiles').findOne({ username: key });
            if (!profile || !canSee(profile, viewer)) {
                throw forum.httpError(404, 'No member by that name.');
            }
            const isSelf = profile.username === viewer.username;
            if (!isSelf) {
                await viewer.db.collection('profiles').updateOne({ username: key }, { $inc: { views: 1 } });
                profile.views = (profile.views || 0) + 1;
            }
            const top8 = await resolveTop8(viewer.db, profile);
            return forum.json(res, 200, {
                ok: true,
                profile: accounts.fullProfileOut(profile, { top8, isSelf }),
                viewer: { username: viewer.username, isAdmin: viewer.role === 'admin' }
            });
        }

        if (req.method === 'PUT') {
            const body = await forum.readJson(req);
            // Reserved-looking display names (like "Steward") are blocked for everyone but admins.
            const update = schema.cleanProfileUpdate(body, { allowReservedName: viewer.role === 'admin' });
            if (!Object.keys(update).length) {
                throw forum.httpError(400, 'Nothing to update.');
            }
            await forum.consumeRateLimit(viewer.db, `profile:${viewer.username}`, EDIT_RATE);

            if (update.top8) {
                update.top8 = update.top8.filter((key) => key !== viewer.username);
                const found = await accounts.loadSummaries(viewer.db, update.top8);
                const missing = update.top8.find((key) => !found.has(key));
                if (missing) {
                    throw forum.httpError(400, `No member named "${missing}" was found for your Top 8.`);
                }
            }
            update.updatedAt = new Date();
            await viewer.db.collection('profiles').updateOne({ username: viewer.username }, { $set: update });
            const fresh = await viewer.db.collection('profiles').findOne({ username: viewer.username });
            const top8 = await resolveTop8(viewer.db, fresh);
            return forum.json(res, 200, {
                ok: true,
                profile: accounts.fullProfileOut(fresh, { top8, isSelf: true })
            });
        }

        res.setHeader('Allow', 'GET, PUT');
        return forum.json(res, 405, { ok: false, error: 'Method not allowed' });
    } catch (err) {
        return forum.handleError(res, err, 'profile');
    }
};
