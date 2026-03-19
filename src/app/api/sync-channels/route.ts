import { createClient } from "@supabase/supabase-js";
import { createSellercloudCustomerLogins } from "@/lib/sellercloudCustomerProvision";

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
    } else if (source === 'magaya') {
      functionUrl = 'https://euzjrgnyzfgldubqglba.supabase.co/functions/v1/sync-customers-magaya'
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
    const isSuccess = response.ok && data?.success !== false

    if (source === 'sellercloud' && isSuccess) {
      const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
      const serviceRole = process.env.SUPABASE_SERVICE_ROLE_KEY

      if (!supabaseUrl || !serviceRole) {
        return new Response(
          JSON.stringify({
            success: false,
            error: 'Missing Supabase server configuration',
          }),
          {
            status: 500,
            headers: { 'Content-Type': 'application/json' },
          }
        )
      }

      const admin = createClient(supabaseUrl, serviceRole, {
        auth: { autoRefreshToken: false, persistSession: false },
      })

      let effectiveAccountId = account_id
      const { data: accountRow } = await admin
        .from('accounts')
        .select('parent_account_id')
        .eq('id', account_id)
        .maybeSingle()

      if (accountRow?.parent_account_id) {
        effectiveAccountId = accountRow.parent_account_id
      }

      const customerProvision = await createSellercloudCustomerLogins({
        admin,
        accountId: effectiveAccountId,
        inviteAccountId: account_id,
      })

      return new Response(JSON.stringify({ ...data, customer_provision: customerProvision }), {
        status: response.status,
        headers: { 'Content-Type': 'application/json' },
      })
    }

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
