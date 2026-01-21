import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export async function middleware(req: NextRequest) {
  const requestHeaders = new Headers(req.headers)

  const { pathname } = req.nextUrl

  // Allow public assets through without auth redirects
  const isPublicAsset =
    pathname === '/site.webmanifest' ||
    pathname === '/manifest.json' ||
    pathname === '/robots.txt' ||
    pathname === '/sitemap.xml' ||
    pathname === '/favicon.ico' ||
    pathname.startsWith('/_next/') ||
    /\.[a-zA-Z0-9]+$/.test(pathname)

  if (isPublicAsset) {
    return NextResponse.next()
  }

  // --- Rotas públicas ---
  const PUBLIC_PATHS = ['/invoice']
  if (PUBLIC_PATHS.some((p) => req.nextUrl.pathname.startsWith(p))) {
    return NextResponse.next()
  }

  // Cria response (middleware roda no Edge Runtime)
  const res = NextResponse.next({
    request: {
      headers: requestHeaders,
    },
  })

  // Supabase SSR client puxa APIs de Node (ex: process.version) e não é compatível com Edge.
  // Aqui fazemos um check leve por cookie/token apenas para redirecionar cedo.
  // A proteção real deve continuar no servidor (route handlers / server components).

  // Tenta encontrar um access token do Supabase nas cookies (nomes podem variar conforme config)
  const accessToken =
    req.cookies.get('sb-access-token')?.value ||
    req.cookies.get('supabase-access-token')?.value ||
    req.cookies.get('sb:token')?.value ||
    req.cookies
      .getAll()
      .find((c) => c.name.includes('sb-') && c.name.includes('auth-token'))?.value

  if (!accessToken) {
    return NextResponse.redirect(new URL('/login', req.url))
  }

  // Opcional: tenta ler role do JWT (SEM validar assinatura) apenas para redirect de UX.
  // Não use isso como autorização.
  let userRole = ''
  try {
    const parts = accessToken.split('.')
    if (parts.length >= 2) {
      const base64 = parts[1].replace(/-/g, '+').replace(/_/g, '/')
      const padded = base64 + '='.repeat((4 - (base64.length % 4)) % 4)
      const json = atob(padded)
      const payload = JSON.parse(json) as any
      userRole = (payload?.user_metadata?.role as string) || ''
    }
  } catch {
    // ignore
  }

  // Redirect staff-client to orders/quotes instead of dashboard
  const path = req.nextUrl.pathname
  if (userRole === 'staff-client' && (path === '/' || path === '/dashboard')) {
    return NextResponse.redirect(new URL('/orders/quotes', req.url))
  }

  res.headers.set('x-pathname', req.nextUrl.pathname)

  return res
}

export const config = {
  matcher: [
    '/((?!login|register|forgot-password|reset-password|onboarding|accept-invite|api|_next|favicon.ico|site.webmanifest|manifest.json|robots.txt|sitemap.xml|public|test|invoice).*)',
  ],
}