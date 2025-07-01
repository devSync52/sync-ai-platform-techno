import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { createServerClient } from '@supabase/ssr'
import { Database } from '@/types/supabase'

export async function middleware(req: NextRequest) {
  const requestHeaders = new Headers(req.headers)

  // 🔧 Cria a response com headers clonados do request
  const res = NextResponse.next({
    request: {
      headers: requestHeaders,
    },
  })

  // 🔐 Autenticação via Supabase
  const supabase = createServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get: (name: string) => req.cookies.get(name)?.value,
        set: (name: string, value: string, options) => {
          res.cookies.set({ name, value, ...options })
        },
        remove: (name: string, options) => {
          res.cookies.set({ name, value: '', ...options })
        },
      },
    }
  )

  const {
    data: { session },
  } = await supabase.auth.getSession()

  if (!session) {
    return NextResponse.redirect(new URL('/login', req.url))
  }

  // ✅ Agora esse header será acessível no layout.tsx
  res.headers.set('x-pathname', req.nextUrl.pathname)

  return res
}

export const config = {
  matcher: [
    '/((?!login|register|forgot-password|reset-password|onboarding|accept-invite|api|_next|favicon.ico|public).*)',
  ],
}