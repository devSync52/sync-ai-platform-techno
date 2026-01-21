import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { cookies } from 'next/headers'
import { createServerClient } from '@supabase/ssr'

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: warehouseId } = await params

    if (!warehouseId || warehouseId === 'undefined') {
      return NextResponse.json({ error: 'Missing warehouse id' }, { status: 400 })
    }

    const cookieStore = (await cookies()) as any

    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
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
        },
      }
    )

    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser()

    if (userError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const parentAccountId =
      (user.app_metadata as any)?.parent_account_id ??
      (user.user_metadata as any)?.parent_account_id ??
      (user.app_metadata as any)?.account_id ??
      (user.user_metadata as any)?.account_id

    if (!parentAccountId) {
      return NextResponse.json({ error: 'Missing account context' }, { status: 403 })
    }

    const { data, error } = await supabase
      .from('b1_v_warehouse_services_1')
      .select('*')
      .eq('warehouse_id', warehouseId)
      .eq('parent_account_id', parentAccountId)

    if (error) {
      console.error('[warehouse/services] GET error:', error)
      return NextResponse.json(
        { error: 'Failed to fetch warehouse services', details: error.message },
        { status: 500 }
      )
    }

    return NextResponse.json({ services: data ?? [] })
  } catch (err: any) {
    console.error('[warehouse/services] GET unexpected:', err)
    return NextResponse.json(
      { error: err?.message ?? 'Unexpected error' },
      { status: 500 }
    )
  }
}