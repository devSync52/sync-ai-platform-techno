import { NextResponse } from 'next/server';
import { API_URL, PROJECT_URL } from '@/utils/constants';

const isChangePasswordRoute = (pathname) => pathname == PROJECT_URL.CHANGE_PASSWORD;
const isSubscriptionRoute = (pathname) => pathname == PROJECT_URL.SUBSCRIPTION;
const isOnboardingRoute = (pathname) => pathname.startsWith(PROJECT_URL.ONBOARDING);

const isPublicRoute = (pathname) => pathname == PROJECT_URL.HOME || pathname.startsWith(PROJECT_URL.AUTH);
const hasGeneratedPassword = (user) => Boolean(user?.clientProfile?.generatedPassword);

const redirectToLogin = (request, pathname) => {
    const loginUrl = new URL(PROJECT_URL.LOGIN, request.url);
    if (!pathname.startsWith(PROJECT_URL.AUTH)) {
        loginUrl.searchParams.set('redirect', pathname);
    }
    return NextResponse.redirect(loginUrl);
};

const getUserDetails = async (token) => {
    if (!API_URL.ROOT) {
        return null;
    }

    try {
        const response = await fetch(`${API_URL.ROOT}${API_URL.USERS}`, {
            headers: {
                Authorization: `Bearer ${token}`,
                timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
            },
            cache: 'no-store',
        });

        if (!response.ok) {
            return null;
        }

        return await response.json();
    } catch {
        return null;
    }
};

export async function proxy(request) {
    const { pathname } = request.nextUrl;
    const token = request.cookies.get('auth-token')?.value;

    if (!token) {
        if (isPublicRoute(pathname)) {
            return NextResponse.next();
        }

        return redirectToLogin(request, pathname);
    }

    const user = await getUserDetails(token);

    if (!user) {
        if (isPublicRoute(pathname)) {
            return NextResponse.next();
        }

        return redirectToLogin(request, pathname);
    }

    if (hasGeneratedPassword(user)) {
        if (!isChangePasswordRoute(pathname)) {
            return NextResponse.redirect(new URL(PROJECT_URL.CHANGE_PASSWORD, request.url));
        }

        return NextResponse.next();
    }

    if (isChangePasswordRoute(pathname)) {
        return NextResponse.redirect(new URL(PROJECT_URL.DASHBOARD, request.url));
    }

    if (user?.onboardingStep == 'subscription') {
        if (!isSubscriptionRoute(pathname)) {
            return NextResponse.redirect(new URL(PROJECT_URL.SUBSCRIPTION, request.url));
        }

        return NextResponse.next();
    }

    if (isOnboardingRoute(pathname)) {
        return NextResponse.redirect(new URL(PROJECT_URL.DASHBOARD, request.url));
    }

    if (isPublicRoute(pathname)) {
        return NextResponse.redirect(new URL(PROJECT_URL.DASHBOARD, request.url));
    }

    return NextResponse.next();
}

export const config = {
    matcher: ['/((?!api|_next/static|_next/image|assets|favicon.ico|.*\\..*).*)'],
};
