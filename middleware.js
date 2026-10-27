// [TRACE: ARCHITECTURE.md]
// Vercel Edge Middleware — Sign-in service disabled: allow direct click-to-enter access.

export default async function middleware(request) {
    // Plain Request in non-Next.js projects — `request.nextUrl` is undefined here.
    const { pathname } = new URL(request.url);

    // Protect offline drafts in source/
    if (pathname.startsWith('/source/')) {
        return new Response('Not found', { status: 404 });
    }

    // Direct access: allow all other traffic through
    return;
}

export const config = {
    matcher: [
        '/((?!api/auth|_vercel|favicon.ico).*)'
    ]
};
