// [TRACE: ARCHITECTURE.md]
const {
    COOKIE_NAME,
    readCookie,
    verifySessionToken
} = require('../lib/session');

module.exports = async function handler(req, res) {
    if (req.method !== 'GET') {
        res.statusCode = 405;
        res.setHeader('Content-Type', 'application/json');
        res.end(JSON.stringify({ ok: false, error: 'Method not allowed' }));
        return;
    }

    try {
        const token = readCookie(req, COOKIE_NAME);
        if (!token) {
            res.statusCode = 401;
            res.setHeader('Content-Type', 'application/json');
            res.end(JSON.stringify({ ok: false, authenticated: false }));
            return;
        }
        const session = await verifySessionToken(token);
        res.statusCode = 200;
        res.setHeader('Content-Type', 'application/json');
        res.end(
            JSON.stringify({
                ok: true,
                authenticated: true,
                user: { username: session.username, role: session.role }
            })
        );
    } catch (err) {
        console.error('me failed', err);
        res.statusCode = 401;
        res.setHeader('Content-Type', 'application/json');
        res.end(JSON.stringify({ ok: false, authenticated: false }));
    }
};
