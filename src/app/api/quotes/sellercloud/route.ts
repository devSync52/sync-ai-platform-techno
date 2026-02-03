import { NextResponse } from 'next/server'

export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => ({} as any))

    if (!body?.draftId) {
      return NextResponse.json(
        { error: 'Missing draftId in request body' },
        { status: 400 }
      )
    }

    console.log('📦 [SellercloudRoute] Request body recebido:', body)

    const edgeUrl = `${process.env.NEXT_PUBLIC_SUPABASE_URL}/functions/v1/send_quote_to_sellercloud`

    const response = await fetch(edgeUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        // usamos a SERVICE ROLE para a edge, como nas outras funções
        Authorization: `Bearer ${process.env.SUPABASE_SERVICE_ROLE_KEY}`,
      },
      body: JSON.stringify({ draft_id: body.draftId }),
    })

    const text = await response.text()
    console.log('📬 [SellercloudRoute] Resposta RAW da edge Sellercloud:', text)

    try {
      const parsed = JSON.parse(text)
      return NextResponse.json(parsed, { status: response.status })
    } catch (_err) {
      console.error('❌ [SellercloudRoute] Erro ao parsear resposta da edge:', _err)
      return NextResponse.json(
        { error: 'Invalid Sellercloud edge response', raw: text },
        { status: 500 }
      )
    }
  } catch (err) {
    console.error('[quote/sellercloud] Erro inesperado:', err)
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}