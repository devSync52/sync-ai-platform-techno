import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { cookies } from 'next/headers'
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'

export async function GET(
  _req: NextRequest,
  { params }: { params: { id: string } }
) {
  const { id } = params

  const supabase = (createRouteHandlerClient as any)({ cookies })

  const { data, error } = await supabase
    .from('b1_v_billing_configs')
    .select(
      `
        client_account_id,
        parent_account_id,
        client_name,
        client_logo_url
      `
    )
    .eq('client_account_id', id)
    .maybeSingle()

  if (error) {
    console.error('[billing/clients] GET error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch client info', message: error.message },
      { status: 500 }
    )
  }

  if (!data) {
    return NextResponse.json(
      { error: 'Client not found', message: 'No client for this id' },
      { status: 404 }
    )
  }

  // shape que o front já está esperando: json.client
  return NextResponse.json({ client: data })
}