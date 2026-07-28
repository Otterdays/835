// [TRACE: ARCHITECTURE.md]
const { clearSessionCookie } = require('../lib/session');

module.exports = async function handler(req, res) {
    if (req.method !== 'POST') {
        res.statusCode = 405;
        res.setHeader('Content-Type', 'application/json');
        res.end(JSON.stringify({ ok: false, error: 'Method not allowed' }));
        return;
    }
    res.setHeader('Set-Cookie', clearSessionCookie());
    res.statusCode = 200;
    res.setHeader('Content-Type', 'application/json');
    res.end(JSON.stringify({ ok: true }));
};
