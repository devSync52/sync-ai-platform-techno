import { NextRequest } from 'next/server'

export async function POST(request: NextRequest) {
  try {
    const { account_id } = await request.json()

    const response = await fetch(
      'https://euzjrgnyzfgldubqglba.supabase.co/functions/v1/sync_sellercloud_channels',
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ account_id }),
      }
    )

    const data = await response.json()

    return new Response(JSON.stringify(data), {
      status: response.status,
      headers: { 'Content-Type': 'application/json' },
    })
  } catch (error) {
    console.error('[sync-customers] ❌ Error:', error)
    return new Response(
      JSON.stringify({ success: false, error: 'Internal server error' }),
      { status: 500 }
    )
  }
}