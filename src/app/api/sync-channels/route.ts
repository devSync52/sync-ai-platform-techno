export async function POST(request: Request) {
  try {
    const { account_id, source } = await request.json()

    if (!account_id || !source) {
      return new Response(JSON.stringify({ success: false, error: 'Missing account_id or source' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      })
    }

    // Escolhe a função serverless correta
    let functionUrl: string | null = null

    if (source === 'sellercloud') {
      functionUrl = 'https://euzjrgnyzfgldubqglba.supabase.co/functions/v1/sync_sellercloud_channels'
    } else if (source === 'extensiv') {
      functionUrl = 'https://euzjrgnyzfgldubqglba.supabase.co/functions/v1/sync-customers-extensiv'
    } else {
      return new Response(JSON.stringify({ success: false, error: 'Invalid source' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      })
    }

    const response = await fetch(functionUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ account_id }),
    })

    const data = await response.json()

    return new Response(JSON.stringify(data), {
      status: response.status,
      headers: { 'Content-Type': 'application/json' },
    })
  } catch (error) {
    console.error('[sync-channels] ❌ Error:', error)
    return new Response(
      JSON.stringify({ success: false, error: 'Internal server error' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    )
  }
}