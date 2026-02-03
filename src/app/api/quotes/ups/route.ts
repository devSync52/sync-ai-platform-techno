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
      console.error('❌ Erro ao autenticar:', authError)
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // const {
    //   data: { user },
    // } = await supabase.auth.getUser()

    console.log('✅ Supabase user:', user)

    const accountId = user?.user_metadata?.account_id
    const userId = user?.id

    if (!userId || !accountId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await req.json()

    console.log('📦 Request body enviado para UPS:', body)

    const response = await fetch('https://euzjrgnyzfgldubqglba.supabase.co/functions/v1/get_ups_services', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${process.env.SUPABASE_SERVICE_ROLE_KEY}`,
        },
        body: JSON.stringify(body),
      });

    const text = await response.text()

    console.log('📬 Resposta bruta da UPS:', text)

    try {
      const data = JSON.parse(text)
      return NextResponse.json(data)
    } catch (err) {
      console.error('❌ Falha ao parsear JSON da UPS:', err)
      console.error('❌ Invalid JSON from UPS function:', text)
      return NextResponse.json({ error: 'Invalid UPS response' }, { status: 500 })
    }
  } catch (err) {
    console.error('[quote/ups] Erro inesperado:', err)
    console.error('[quote/ups] Unexpected error:', err)
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}