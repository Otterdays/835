// [TRACE: ARCHITECTURE.md]
const { SignJWT, jwtVerify } = require('jose');

const COOKIE_NAME = 'oe835_session';

function getSecret() {
    const secret = process.env.AUTH_SECRET;
    if (!secret || secret.length < 16) {
        throw new Error('AUTH_SECRET must be set (min 16 chars)');
    }
    return new TextEncoder().encode(secret);
}

function ttlHours() {
    const n = Number(process.env.SESSION_TTL_HOURS || 12);
    return Number.isFinite(n) && n > 0 ? n : 12;
}

async function createSessionToken(payload) {
    const hours = ttlHours();
    return new SignJWT({
        sub: payload.username,
        role: payload.role || 'member'
    })
        .setProtectedHeader({ alg: 'HS256' })
        .setIssuedAt()
        .setExpirationTime(`${hours}h`)
        .sign(getSecret());
}

async function verifySessionToken(token) {
    const { payload } = await jwtVerify(token, getSecret());
    return {
        username: payload.sub,
        role: payload.role || 'member',
        exp: payload.exp
    };
}

function sessionCookie(token) {
    const hours = ttlHours();
    const maxAge = hours * 60 * 60;
    const secure = process.env.NODE_ENV === 'production' || process.env.VERCEL === '1';
    const parts = [
        `${COOKIE_NAME}=${token}`,
        'HttpOnly',
        'Path=/',
        'SameSite=Strict',
        `Max-Age=${maxAge}`
    ];
    if (secure) {
        parts.push('Secure');
    }
    return parts.join('; ');
}

function clearSessionCookie() {
    const secure = process.env.NODE_ENV === 'production' || process.env.VERCEL === '1';
    const parts = [`${COOKIE_NAME}=`, 'HttpOnly', 'Path=/', 'SameSite=Strict', 'Max-Age=0'];
    if (secure) {
        parts.push('Secure');
    }
    return parts.join('; ');
}

function readCookie(req, name) {
    const raw = req.headers.cookie || '';
    const parts = raw.split(';');
    for (const part of parts) {
        const [k, ...rest] = part.trim().split('=');
        if (k === name) {
            return rest.join('=');
        }
    }
    return null;
}

module.exports = {
    COOKIE_NAME,
    createSessionToken,
    verifySessionToken,
    sessionCookie,
    clearSessionCookie,
    readCookie
};
