import { NextRequest, NextResponse } from 'next/server'
import { createMiddlewareClient } from '@supabase/auth-helpers-nextjs'

export async function middleware(req: NextRequest) {
  const res = NextResponse.next()
  const supabase = createMiddlewareClient({ req, res })

  const {
    data: { user },
  } = await supabase.auth.getUser()

  console.log('🛡️ Middleware | User:', user?.email || 'NOT AUTHENTICATED')

  // 🔒 Block access to protected routes if not authenticated
  const isProtectedRoute =
    req.nextUrl.pathname.startsWith('/dashboard') ||
    req.nextUrl.pathname.startsWith('/settings')

  if (isProtectedRoute && !user) {
    const redirectUrl = req.nextUrl.clone()
    redirectUrl.pathname = '/login'
    return NextResponse.redirect(redirectUrl)
  }

  // 🚧 Check if user has completed onboarding (has account_id)
  if (isProtectedRoute && user) {
    const { data: userRecord, error } = await supabase
      .from('users')
      .select('account_id')
      .eq('id', user.id)
      .maybeSingle()

    if (error) {
      console.error('❌ Error fetching user record:', error.message)
    }

    if (!userRecord?.account_id) {
      const redirectUrl = req.nextUrl.clone()
      redirectUrl.pathname = '/onboarding'
      return NextResponse.redirect(redirectUrl)
    }
  }

  return res
}

export const config = {
  matcher: ['/dashboard/:path*', '/settings/:path*'], // 🚫 '/' removed
}