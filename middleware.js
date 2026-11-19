// [TRACE: ACCOUNTS.md]
// Vercel Edge Middleware.
//  1. Offline drafts in /source/ are never served.
//  2. The admin page and its script are served ONLY to a signed-in admin. Everyone else
//     (guests, members, stewards, expired or forged sessions) gets the same 404 as a page
//     that does not exist. All other traffic passes straight through.
//
// The role in the session token is only used to hide the page. Every admin action is
// re-checked against the database in api/admin/index.js, so a stale token cannot do anything.
// The token library is loaded only for admin paths, so any problem there fails closed
// (404) without touching the rest of the site.

const COOKIE_NAME = 'oe835_session';
// Any path segment that starts with "admin" (admin.html, admin-app.js, /admin/..., /api/admin).
const ADMIN_PATTERN = /(^|\/)admin/;

const notFound = () => new Response('Not found', { status: 404, headers: { 'Cache-Control': 'no-store' } });

function readCookie(request, name) {
    const raw = request.headers.get('cookie') || '';
    for (const part of raw.split(';')) {
        const [key, ...rest] = part.trim().split('=');
        if (key === name) {
            return rest.join('=');
        }
    }
    return null;
}

async function isAdmin(request) {
    const secret = process.env.AUTH_SECRET;
    const token = readCookie(request, COOKIE_NAME);
    if (!secret || secret.length < 16 || !token) {
        return false;
    }
    try {
        const { jwtVerify } = await import('jose');
        const { payload } = await jwtVerify(token, new TextEncoder().encode(secret), { algorithms: ['HS256'] });
        return payload.role === 'admin';
    } catch (err) {
        // Bad, expired or forged token, or the library failed to load: treat as not an admin.
        return false;
    }
}

/**
 * Turn a request path into the form the file server will actually look up:
 * decode percent-escapes (repeatedly, so %2561 cannot hide an "a"), fold case, fix
 * backslashes and repeated slashes, and resolve "." / ".." segments.
 * Returns null for a malformed escape.
 */
function normalizePath(rawPath) {
    let path = rawPath;
    for (let i = 0; i < 4; i += 1) {
        let decoded;
        try {
            decoded = decodeURIComponent(path);
        } catch (err) {
            return null;
        }
        if (decoded === path) {
            break;
        }
        path = decoded;
    }
    path = path.toLowerCase().replace(/\\/g, '/').replace(/\/{2,}/g, '/');
    return new URL(path.startsWith('/') ? path : `/${path}`, 'https://local.invalid').pathname;
}

export default async function middleware(request) {
    // Plain Request in non-Next.js projects — `request.nextUrl` is undefined here.
    const pathname = normalizePath(new URL(request.url).pathname);
    if (pathname === null) {
        return notFound();
    }

    // Protect offline drafts in source/
    if (pathname.startsWith('/source/')) {
        return notFound();
    }

    // Admin page, script and API: admins only.
    if (ADMIN_PATTERN.test(pathname)) {
        if (!(await isAdmin(request))) {
            return notFound();
        }
        return;
    }

    // Direct access: allow all other traffic through
    return;
}

export const config = {
    matcher: [
        '/((?!api/auth|_vercel|favicon.ico).*)'
    ]
};
