import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { cookies } from 'next/headers'
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'

export async function POST(
  req: NextRequest,
  { params }: { params: { invoiceId: string } }
) {
  const { invoiceId } = params

  if (!invoiceId) {
    return NextResponse.json(
      { success: false, message: 'Missing invoiceId in route params' },
      { status: 400 }
    )
  }

  const supabase = (createRouteHandlerClient as any)({ cookies })

  // Chama a RPC oficial, que retorna um jsonb com token, expires_at, etc.
  const { data, error } = await supabase.rpc(
    'billing_invoice_share_generate_1',
    {
      p_invoice_id: invoiceId,
      // opcional, mas deixamos explícito: 60 dias de validade
      p_valid_for_days: 60,
    }
  )

  if (error) {
    console.error('[billing/invoices/share] RPC error:', error)
    return NextResponse.json(
      {
        success: false,
        message: 'Failed to generate share link for invoice',
        details: error.message,
      },
      { status: 400 }
    )
  }

  if (!data || typeof data !== 'object') {
    console.error('[billing/invoices/share] Invalid RPC result:', data)
    return NextResponse.json(
      {
        success: false,
        message: 'Could not generate share link (invalid RPC result)',
      },
      { status: 500 }
    )
  }

  // Nossa função retorna jsonb_build_object(... 'token', v_token, ...)
  const token = (data as any).token as string | undefined

  if (!token) {
    console.error('[billing/invoices/share] Missing token in RPC result:', data)
    return NextResponse.json(
      {
        success: false,
        message: 'Could not generate share link (missing token in RPC result)',
      },
      { status: 500 }
    )
  }

  const origin =
    process.env.NEXT_PUBLIC_SITE_URL ||
    process.env.NEXT_PUBLIC_APP_URL ||
    req.nextUrl.origin

  const publicUrl = `${origin}/invoice/${token}`

  return NextResponse.json({
    success: true,
    token,
    url: publicUrl,
  })
}