import { NextRequest, NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { createServerClient } from '@supabase/ssr'
import type { Database } from '@/types/supabase'

type ExtensivCredentials = {
  client_id: string
  client_secret: string
  extensiv_id: string
}

function getCookieHandlers(cookieStore: any) {
  return {
    get(name: string) {
      return cookieStore.get(name)?.value
    },
    set(name: string, value: string, options: any) {
      cookieStore.set({ name, value, ...options })
    },
    remove(name: string, options: any) {
      try {
        ;(cookieStore as any).delete(name)
      } catch {
        cookieStore.set({ name, value: '', ...options, maxAge: 0 })
      }
    },
  }
}

function parseCredentialsFromBody(raw: unknown): ExtensivCredentials | null {
  if (!raw || typeof raw !== 'object') return null

  const creds: ExtensivCredentials = {
    client_id: String((raw as any).client_id ?? '').trim(),
    client_secret: String((raw as any).client_secret ?? '').trim(),
    extensiv_id: String((raw as any).extensiv_id ?? '').trim(),
  }

  if (!creds.client_id || !creds.client_secret || !creds.extensiv_id) return null
  return creds
}

async function testExtensivToken(credentials: ExtensivCredentials) {
  const tokenUrl = 'https://secure-wms.com/AuthServer/api/Token'
  const basic = Buffer.from(`${credentials.client_id}:${credentials.client_secret}`).toString(
    'base64',
  )

  const bodyForm = new URLSearchParams({
    grant_type: 'client_credentials',
    user_login: credentials.extensiv_id,
  })

  // Preferred format per OAuth-style token endpoints.
  const formResponse = await fetch(tokenUrl, {
    method: 'POST',
    headers: {
      Accept: 'application/json',
      'Content-Type': 'application/x-www-form-urlencoded',
      Authorization: `Basic ${basic}`,
    },
    body: bodyForm.toString(),
  })

  const formText = await formResponse.text()
  let formJson: any = null
  try {
    formJson = formText ? JSON.parse(formText) : null
  } catch {
    formJson = null
  }

  if (formResponse.ok && (formJson?.access_token || formJson?.token)) {
    return {
      ok: true as const,
      tokenType: formJson?.token_type ?? null,
      expiresIn: formJson?.expires_in ?? null,
    }
  }

  // Fallback to JSON payload format because some tenants/proxies accept this.
  const jsonResponse = await fetch(tokenUrl, {
    method: 'POST',
    headers: {
      Accept: 'application/json',
      'Content-Type': 'application/json',
      Authorization: `Basic ${basic}`,
    },
    body: JSON.stringify({
      grant_type: 'client_credentials',
      user_login: credentials.extensiv_id,
    }),
  })

  const jsonText = await jsonResponse.text()
  let jsonData: any = null
  try {
    jsonData = jsonText ? JSON.parse(jsonText) : null
  } catch {
    jsonData = null
  }

  if (jsonResponse.ok && (jsonData?.access_token || jsonData?.token)) {
    return {
      ok: true as const,
      tokenType: jsonData?.token_type ?? null,
      expiresIn: jsonData?.expires_in ?? null,
    }
  }

  const message =
    formJson?.error_description ||
    formJson?.error ||
    formJson?.message ||
    jsonData?.error_description ||
    jsonData?.error ||
    jsonData?.message ||
    formText ||
    jsonText ||
    `Extensiv token request failed (${formResponse.status}/${jsonResponse.status})`

  return { ok: false as const, error: String(message) }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({} as Record<string, unknown>))
    const action = String(body?.action ?? '').toLowerCase()

    if (action !== 'test_credentials') {
      return NextResponse.json({ error: 'Invalid action' }, { status: 400 })
    }

    const cookieStore = (await cookies()) as any
    const authClient = createServerClient<Database>(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      { cookies: getCookieHandlers(cookieStore) },
    )

    const {
      data: { user },
      error: userError,
    } = await authClient.auth.getUser()

    if (userError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { data: userRow, error: userRowError } = await authClient
      .from('users')
      .select('account_id')
      .eq('id', user.id)
      .maybeSingle()

    if (userRowError || !userRow?.account_id) {
      return NextResponse.json({ error: 'Missing account context' }, { status: 403 })
    }

    const accountId = String(userRow.account_id)
    const requestedAccountId = String(body?.accountId ?? '').trim()

    if (requestedAccountId && requestedAccountId !== accountId) {
      return NextResponse.json({ error: 'Forbidden account scope' }, { status: 403 })
    }

    const inputCredentials = parseCredentialsFromBody(body?.credentials)
    if (!inputCredentials) {
      return NextResponse.json(
        { error: 'Client ID, Client Secret and User login e-mail are required' },
        { status: 400 },
      )
    }

    const tested = await testExtensivToken(inputCredentials)
    if (!tested.ok) {
      return NextResponse.json({ success: false, error: tested.error }, { status: 400 })
    }

    return NextResponse.json({
      success: true,
      token: {
        type: tested.tokenType,
        expires_in: tested.expiresIn,
      },
    })
  } catch (error: any) {
    return NextResponse.json({ error: error?.message || 'Unexpected server error' }, { status: 500 })
  }
}

