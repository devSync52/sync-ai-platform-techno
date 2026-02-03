import { createClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'

export async function POST(req: Request) {
  const authHeader = req.headers.get('authorization')
  const token = authHeader?.replace('Bearer ', '')

  if (!token) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      {
        global: {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        },
      }
    )

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      console.error('❌ FedEx - Unauthorized:', authError)
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    console.log('✅ FedEx - Supabase user:', user)

    const accountId = user?.user_metadata?.account_id
    const userId = user?.id

    if (!userId || !accountId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await req.json()

    console.log('📦 FedEx - Request body:', body)

    const response = await fetch(
      'https://euzjrgnyzfgldubqglba.supabase.co/functions/v1/get_fedex_quotes',
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${process.env.SUPABASE_SERVICE_ROLE_KEY}`,
        },
        body: JSON.stringify(body),
      }
    )

    const text = await response.text()

    console.log('📬 FedEx - Raw response:', text)

    try {
      const data = JSON.parse(text)
      return NextResponse.json(data)
    } catch (err) {
      console.error('❌ FedEx - Failed to parse JSON:', err)
      console.error('❌ FedEx - Invalid JSON from function:', text)
      return NextResponse.json({ error: 'Invalid FedEx response' }, { status: 500 })
    }
  } catch (err) {
    console.error('[quote/fedex] Unexpected error:', err)
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}