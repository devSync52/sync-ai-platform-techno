import { NextRequest, NextResponse } from 'next/server'
import { createMiddlewareClient } from '@supabase/auth-helpers-nextjs'

export async function middleware(req: NextRequest) {
  const res = NextResponse.next()
  const supabase = createMiddlewareClient({ req, res })

  const {
    data: { user },
  } = await supabase.auth.getUser()

  console.log('👀 Middleware | Usuário:', user?.email || 'NÃO AUTENTICADO')

  // Redireciona a home '/' para /login ou /dashboard baseado na sessão
  if (req.nextUrl.pathname === '/') {
    const redirectUrl = req.nextUrl.clone()
    redirectUrl.pathname = user ? '/dashboard' : '/login'
    return NextResponse.redirect(redirectUrl)
  }

  // Protege as rotas dashboard e settings
  if (!user && (req.nextUrl.pathname.startsWith('/dashboard') || req.nextUrl.pathname.startsWith('/settings'))) {
    const redirectUrl = req.nextUrl.clone()
    redirectUrl.pathname = '/login'
    return NextResponse.redirect(redirectUrl)
  }

  return res
}

export const config = {
  matcher: ['/', '/dashboard/:path*', '/settings/:path*'],
}