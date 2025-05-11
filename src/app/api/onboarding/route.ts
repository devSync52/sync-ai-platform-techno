import { NextRequest, NextResponse } from 'next/server'

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    console.log('📨 Received onboarding data:', body)

    const res = await fetch(`${process.env.NEXT_PUBLIC_SUPABASE_URL}/functions/v1/create_account_and_user`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${process.env.SUPABASE_SERVICE_ROLE_KEY}`,
      },
      body: JSON.stringify(body),
    })

    const data = await res.json()
    console.log('✅ Response from Edge Function:', data)

    return NextResponse.json(data, { status: res.status })
  } catch (err: any) {
    console.error('❌ Error in /api/onboarding route:', err.message || err)
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
  }
}
