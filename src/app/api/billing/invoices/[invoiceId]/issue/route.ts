import { NextRequest, NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'

export async function POST(
  _req: NextRequest,
  { params }: { params: { invoiceId: string } }
) {
  const { invoiceId } = params

  const supabase = (createRouteHandlerClient as any)({ cookies })

  const { data, error } = await supabase.rpc(
    'billing_invoice_issue_1',
    { p_invoice_id: invoiceId }
  )

  if (error) {
    console.error('[invoice/issue] error:', error)
    return NextResponse.json(
      { success: false, message: error.message },
      { status: 400 }
    )
  }

  return NextResponse.json({ success: true, data })
}