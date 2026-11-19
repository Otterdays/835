// [TRACE: ACCOUNTS.md]
// GET /api/auth/me -> who is signed in. Guests get 200 { authenticated: false }
// (not 401) so every page can ask without logging a browser error.
const forum = require('../_lib/forum');
const accounts = require('../_lib/accounts');

module.exports = async function handler(req, res) {
    if (req.method !== 'GET') {
        res.setHeader('Allow', 'GET');
        return forum.json(res, 405, { ok: false, error: 'Method not allowed' });
    }

    try {
        const user = await accounts.getSessionUser(req);
        if (!user) {
            return forum.json(res, 200, { ok: true, authenticated: false });
        }
        // Presence ("online now"): refresh at most every couple of minutes.
        const seen = user.profile.lastSeenAt ? new Date(user.profile.lastSeenAt).getTime() : 0;
        if (Date.now() - seen > accounts.SEEN_THROTTLE_MS) {
            await user.db
                .collection('profiles')
                .updateOne({ username: user.username }, { $set: { lastSeenAt: new Date() } });
        }
        return forum.json(res, 200, { ok: true, authenticated: true, user: accounts.accountOut(user) });
    } catch (err) {
        console.error('me failed', err);
        // Treat any failure (for example Mongo down) as signed out so pages still load.
        return forum.json(res, 200, { ok: true, authenticated: false });
    }
};
