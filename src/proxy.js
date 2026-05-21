import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';

export async function proxy(request) {
    const { pathname } = request.nextUrl;
    const cookieStore = await cookies();
    const token = cookieStore.get('auth-token')?.value;
    const forcePasswordChange = cookieStore.get('force-change-password')?.value == 'true';
    const isChangePasswordRoute = pathname == '/change-password';

    if (!token && isChangePasswordRoute) {
        const loginUrl = new URL('/auth/login', request.url);
        loginUrl.searchParams.set('redirect', pathname);
        return NextResponse.redirect(loginUrl);
    }

    if (token && forcePasswordChange && !isChangePasswordRoute) {
        return NextResponse.redirect(new URL('/change-password', request.url));
    }

    if (token && !forcePasswordChange && isChangePasswordRoute) {
        return NextResponse.redirect(new URL('/dashboard', request.url));
    }

    // If user is authenticated and trying to access root or auth pages, redirect to dashboard
    if (token && (pathname == '/' || pathname.startsWith('/auth'))) {
        return NextResponse.redirect(new URL('/dashboard', request.url));
    }

    // If user is not authenticated and trying to access dashboard, redirect to login with redirect param
    if (!token && pathname.startsWith('/dashboard')) {
        const loginUrl = new URL('/auth/login', request.url);
        loginUrl.searchParams.set('redirect', pathname);
        return NextResponse.redirect(loginUrl);
    }

    return NextResponse.next();
}

export const config = {
    matcher: ['/((?!api|_next/static|_next/image|favicon.ico).*)'],
};
