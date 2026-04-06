import { createServerSupabaseClient } from '@/lib/supabase-server'
import OrdersClient from './OrdersClient'
import { normalizeIntegrationTypes, resolveOperationalOnlySource, } from '@/lib/integrations/operationalSource'

export default async function OrdersPage() {
  const supabase = await createServerSupabaseClient()

  const { data: { user }, error: userError, } = await supabase.auth.getUser()

  if (userError || !user) {
    throw new Error('User not authenticated')
  }

  let isParentOnlyExtensiv = false
  let isParentOnlyMagaya = false

  const { data: userRecord } = await supabase.from('users').select('account_id,role').eq('id', user.id).maybeSingle()

  const userAccountId = userRecord?.account_id
  const userRole = String(userRecord?.role ?? '').trim().toLowerCase()
  const isClientLikeRole = userRole == 'client' || userRole == 'staff-client'

  if (userAccountId) {
    const { data: userAccountRecord } = await supabase.from('accounts').select('id,parent_account_id').eq('id', userAccountId).maybeSingle()

    const userAccountParentId = userAccountRecord?.parent_account_id ?? null
    let integrationAccountId = userAccountParentId ?? userAccountId

    if (isClientLikeRole) {
      const principalAccountId = userAccountParentId ?? userAccountId
      const { data: principalAccountRecord } = await supabase.from('accounts').select('id,parent_account_id').eq('id', principalAccountId).maybeSingle()
      integrationAccountId = principalAccountRecord?.parent_account_id ?? principalAccountId
    }

    const { data: parentIntegrations } = await supabase.from('account_integrations').select('type').eq('account_id', integrationAccountId)

    const integrationTypes = normalizeIntegrationTypes(parentIntegrations || [])
    const onlyOperationalSource = resolveOperationalOnlySource(integrationTypes)
    isParentOnlyExtensiv = onlyOperationalSource === 'extensiv'
    isParentOnlyMagaya = onlyOperationalSource === 'magaya'
  }

  return (
    <OrdersClient
      userId={user.id}
      isParentOnlyExtensiv={isParentOnlyExtensiv}
      isParentOnlyMagaya={isParentOnlyMagaya}
    />
  )
}
