import { NextRequest } from 'next/server'
import { syncExtensivProducts } from '@/lib/extensiv-products-sync'

export async function POST(req: NextRequest) {
  try {
    const { channel_id, source } = await req.json()

    if (!channel_id || !source) {
      return new Response(JSON.stringify({ success: false, error: 'Missing channel_id or source' }), {
        status: 400,
      })
    }

    console.log('[sync-products] Request:', { channel_id, source })

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL ?? process.env.SUPABASE_URL
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY

    if (!supabaseUrl) {
      return new Response(
        JSON.stringify({
          success: false,
          error: 'Missing Supabase URL env (NEXT_PUBLIC_SUPABASE_URL or SUPABASE_URL)',
        }),
        { status: 500, headers: { 'Content-Type': 'application/json' } }
      )
    }

    if (source === 'extensiv') {
      const result = await syncExtensivProducts({
        supabaseUrl,
        serviceRoleKey,
        channelId: channel_id,
      })

      return new Response(JSON.stringify(result), {
        status: result.success ? 200 : 502,
        headers: { 'Content-Type': 'application/json' },
      })
    }

    const edgeFunctionMap: Record<string, string> = {
      sellercloud: 'import_products_sellercloud',
      magaya: 'sync_magaya_products',
      project44: 'import_products_project44',
    }

    const edgeFunction = edgeFunctionMap[source]
    if (!edgeFunction) {
      return new Response(JSON.stringify({ success: false, error: 'Unsupported source' }), {
        status: 400,
      })
    }

    const headers: HeadersInit = { 'Content-Type': 'application/json' }
    if (serviceRoleKey) headers.Authorization = `Bearer ${serviceRoleKey}`

    const res = await fetch(`${supabaseUrl}/functions/v1/${edgeFunction}`, {
      method: 'POST',
      headers,
      body: JSON.stringify({ channel_id }),
    })

    const text = await res.text()
    let data: any = { success: res.ok }
    if (text) {
      try {
        data = JSON.parse(text)
      } catch {
        data = { success: res.ok, message: text }
      }
    }

    return new Response(JSON.stringify(data), {
      status: res.status,
      headers: { 'Content-Type': 'application/json' },
    })
  } catch (err: any) {
    console.error('[sync-products] Error:', err)
    return new Response(JSON.stringify({ success: false, error: 'Internal server error' }), {
      status: 500,
    })
  }
}
