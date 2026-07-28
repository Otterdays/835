// [TRACE: ARCHITECTURE.md]
// Vercel Edge Middleware — gate HTML + data.js + images before paint.
import { jwtVerify } from 'jose';

const COOKIE_NAME = 'oe835_session';
const PUBLIC_PATHS = new Set([
    '/',
    '/index.html',
    '/style.css',
    '/js/auth.js',
    '/js/login-app.js'
]);

function isPublic(pathname) {
    if (PUBLIC_PATHS.has(pathname)) {
        return true;
    }
    if (pathname.startsWith('/api/auth/')) {
        return true;
    }
    if (pathname.startsWith('/_next') || pathname.startsWith('/favicon')) {
        return true;
    }
    return false;
}

function isProtectedAsset(pathname) {
    if (pathname === '/data.js') {
        return true;
    }
    if (pathname.startsWith('/images/')) {
        return true;
    }
    if (pathname.endsWith('.html') && pathname !== '/index.html') {
        return true;
    }
    if (pathname.startsWith('/js/') && !pathname.endsWith('/auth.js') && !pathname.endsWith('/login-app.js')) {
        return true;
    }
    return false;
}

export default async function middleware(request) {
    const { pathname } = request.nextUrl;

    if (isPublic(pathname) && !isProtectedAsset(pathname)) {
        return;
    }

    if (!isProtectedAsset(pathname) && !pathname.endsWith('.html')) {
        // Allow fonts/CDN; still block source if somehow present
        if (pathname.startsWith('/source/')) {
            return new Response('Not found', { status: 404 });
        }
        return;
    }

    const secret = process.env.AUTH_SECRET;
    if (!secret || secret.length < 16) {
        return new Response('Auth misconfigured', { status: 500 });
    }

    const token = request.cookies.get(COOKIE_NAME)?.value;
    if (!token) {
        const login = new URL('/index.html', request.url);
        return Response.redirect(login, 302);
    }

    try {
        await jwtVerify(token, new TextEncoder().encode(secret));
        return;
    } catch {
        const login = new URL('/index.html', request.url);
        const res = Response.redirect(login, 302);
        res.headers.append(
            'Set-Cookie',
            `${COOKIE_NAME}=; Path=/; Max-Age=0; HttpOnly; SameSite=Strict`
        );
        return res;
    }
}

export const config = {
    matcher: [
        '/((?!api/auth|_vercel|favicon.ico).*)'
    ]
};
