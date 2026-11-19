// [TRACE: ACCOUNTS.md]
// Admin-only account management. ONE function (Vercel Hobby cap), every request re-checked.
//   GET  /api/admin?users=1[&q=]   -> accounts with roles, status, awarded titles
//   GET  /api/admin?audit=1        -> recent admin actions
//   POST /api/admin { action, username, ... }
//        action: setRole | setActive | badge | resetPassword
//
// Security rules:
//   - The caller's role is read from the database on every request (not from the token).
//     Anyone who is not an active admin gets the same 404 as a route that does not exist.
//   - POSTs must come from this site (Origin check) on top of the SameSite=Strict cookie.
//   - You cannot change your own role or status, and the last active admin cannot be removed.
//   - Every change is written to `admin_audit` (never containing passwords).
const forum = require('../_lib/forum');
const schema = require('../_lib/profile-schema');
const accounts = require('../_lib/accounts');
const { hashPassword } = require('../_lib/password');

const ROLES = ['member', 'steward', 'admin'];
const ADMIN_RATE = { max: 300, windowMs: 60 * 60 * 1000 };
const LIST_LIMIT = 100;
const escapeRegex = (text) => text.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

function notFound(res) {
    return forum.json(res, 404, { ok: false, error: 'Not found' });
}

async function requireAdmin(req) {
    const user = await accounts.getSessionUser(req);
    if (!user || user.role !== 'admin') {
        return null;
    }
    return user;
}

function rowOut(user, profile, selfKey) {
    const p = profile || {};
    return {
        username: user.username,
        handle: p.handle || user.username,
        displayName: p.displayName || user.username,
        avatar: p.avatar || { glyph: 'hardhat', color: 'blue' },
        role: user.role || 'member',
        active: user.active !== false,
        badges: Array.isArray(p.badges) ? p.badges : [],
        visibility: p.visibility || 'members',
        createdAt: user.createdAt ? new Date(user.createdAt).toISOString() : null,
        lastLoginAt: p.lastLoginAt ? new Date(p.lastLoginAt).toISOString() : null,
        lastSeenAt: p.lastSeenAt ? new Date(p.lastSeenAt).toISOString() : null,
        isSelf: user.username === selfKey
    };
}

async function loadRow(db, username, selfKey) {
    const user = await db.collection('users').findOne({ username });
    if (!user) {
        throw forum.httpError(404, 'No account by that name.');
    }
    const profile = await db.collection('profiles').findOne({ username });
    return rowOut(user, profile, selfKey);
}

async function audit(db, actor, action, target, detail) {
    await db.collection('admin_audit').insertOne({ at: new Date(), actor, action, target, detail: detail || {} });
}

async function otherActiveAdmins(db, excludeUsername) {
    return db
        .collection('users')
        .countDocuments({ role: 'admin', active: { $ne: false }, username: { $ne: excludeUsername } });
}

async function listUsers(admin, params, res) {
    const db = admin.db;
    const q = (params.get('q') || '').trim().slice(0, 40);
    let filter = {};
    if (q) {
        const rx = new RegExp(escapeRegex(q), 'i');
        const matches = await db
            .collection('profiles')
            .find({ $or: [{ handle: rx }, { displayName: rx }] })
            .limit(LIST_LIMIT)
            .toArray();
        filter = { username: { $in: matches.map((m) => m.username) } };
    }
    const users = await db.collection('users').find(filter).sort({ createdAt: -1 }).limit(LIST_LIMIT).toArray();
    const profiles = await db
        .collection('profiles')
        .find({ username: { $in: users.map((u) => u.username) } })
        .limit(LIST_LIMIT)
        .toArray();
    const byKey = new Map(profiles.map((p) => [p.username, p]));
    return forum.json(res, 200, {
        ok: true,
        roles: ROLES,
        badges: Object.entries(schema.BADGES).map(([id, label]) => ({ id, label })),
        users: users.map((u) => rowOut(u, byKey.get(u.username), admin.username))
    });
}

async function listAudit(admin, res) {
    const rows = await admin.db.collection('admin_audit').find({}).sort({ at: -1 }).limit(50).toArray();
    return forum.json(res, 200, {
        ok: true,
        audit: rows.map((r) => ({
            at: new Date(r.at).toISOString(),
            actor: r.actor,
            action: r.action,
            target: r.target,
            detail: r.detail || {}
        }))
    });
}

async function act(admin, body, res) {
    const db = admin.db;
    const target = String(body.username || '').trim().toLowerCase();
    if (!schema.HANDLE_PATTERN.test(target)) {
        throw forum.httpError(400, 'Invalid username.');
    }
    const user = await db.collection('users').findOne({ username: target });
    if (!user) {
        throw forum.httpError(404, 'No account by that name.');
    }
    const isSelf = target === admin.username;
    const now = new Date();

    switch (body.action) {
        case 'setRole': {
            if (!ROLES.includes(body.role)) {
                throw forum.httpError(400, 'Unknown role.');
            }
            if (isSelf) {
                throw forum.httpError(400, 'You cannot change your own role.');
            }
            if (user.role === 'admin' && body.role !== 'admin' && !(await otherActiveAdmins(db, target))) {
                throw forum.httpError(400, 'That is the last active admin.');
            }
            await db.collection('users').updateOne({ username: target }, { $set: { role: body.role, updatedAt: now } });
            await audit(db, admin.username, 'setRole', target, { from: user.role || 'member', to: body.role });
            break;
        }
        case 'setActive': {
            if (typeof body.active !== 'boolean') {
                throw forum.httpError(400, 'active must be true or false.');
            }
            if (isSelf) {
                throw forum.httpError(400, 'You cannot disable your own account.');
            }
            if (!body.active && user.role === 'admin' && !(await otherActiveAdmins(db, target))) {
                throw forum.httpError(400, 'That is the last active admin.');
            }
            await db.collection('users').updateOne({ username: target }, { $set: { active: body.active, updatedAt: now } });
            await audit(db, admin.username, body.active ? 'activate' : 'deactivate', target, {});
            break;
        }
        case 'badge': {
            if (!Object.prototype.hasOwnProperty.call(schema.BADGES, body.badge) || typeof body.on !== 'boolean') {
                throw forum.httpError(400, 'Unknown title.');
            }
            await accounts.ensureProfile(db, user);
            await db
                .collection('profiles')
                .updateOne({ username: target }, body.on ? { $addToSet: { badges: body.badge } } : { $pull: { badges: body.badge } });
            await audit(db, admin.username, body.on ? 'badgeAdd' : 'badgeRemove', target, { badge: body.badge });
            break;
        }
        case 'resetPassword': {
            if (isSelf) {
                throw forum.httpError(400, 'Use Change password for your own account.');
            }
            const password = schema.validatePassword(body.newPassword, target);
            const hashed = await hashPassword(password);
            await db.collection('users').updateOne(
                { username: target },
                { $set: { passwordHash: hashed.hash, passwordSalt: hashed.salt, passwordChangedAt: now, updatedAt: now } }
            );
            await audit(db, admin.username, 'resetPassword', target, {});
            break;
        }
        default:
            throw forum.httpError(400, 'Unknown action.');
    }
    return forum.json(res, 200, { ok: true, user: await loadRow(db, target, admin.username) });
}

module.exports = async function handler(req, res) {
    try {
        // Check the caller first: everyone who is not an admin sees "Not found" for every method.
        const admin = await requireAdmin(req);
        if (!admin) {
            return notFound(res);
        }
        const params = new URL(req.url, 'http://localhost').searchParams;

        if (req.method === 'GET') {
            if (params.get('audit')) {
                return await listAudit(admin, res);
            }
            return await listUsers(admin, params, res);
        }

        if (req.method === 'POST') {
            if (!accounts.sameSite(req)) {
                throw forum.httpError(403, 'Request not allowed.');
            }
            await forum.consumeRateLimit(admin.db, `admin:${admin.username}`, ADMIN_RATE);
            return await act(admin, await forum.readJson(req), res);
        }

        res.setHeader('Allow', 'GET, POST');
        return forum.json(res, 405, { ok: false, error: 'Method not allowed' });
    } catch (err) {
        return forum.handleError(res, err, 'admin', 'The admin tools are temporarily unavailable.');
    }
};
