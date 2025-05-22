import { NextRequest } from 'next/server'

export async function POST(req: NextRequest) {
  try {
    const { channel_id, source } = await req.json()

    if (!channel_id || !source) {
      return new Response(JSON.stringify({ success: false, error: 'Missing channel_id or source' }), {
        status: 400,
      })
    }

    console.log('[sync-products] Request:', { channel_id, source })

    const edgeFunctionMap: Record<string, string> = {
      sellercloud: 'import_products_sellercloud',
      extensiv: 'import_products_extensiv',
      project44: 'import_products_project44',
    }

    const edgeFunction = edgeFunctionMap[source]

    if (!edgeFunction) {
      return new Response(JSON.stringify({ success: false, error: 'Unsupported source' }), {
        status: 400,
      })
    }

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    const res = await fetch(`${supabaseUrl}/functions/v1/${edgeFunction}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ channel_id }),
    })

    const data = await res.json()

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