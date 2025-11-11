import type { SupabaseClient } from '@supabase/supabase-js'
import type {
  BillingRateCard,
  BillingRateActivity,
  BillingRateStorageTier,
  BillingRateOutboundBucket,
  BillingRateOutboundTier,
  BillingClient,
} from '@/types/billing'

/**
 * Lightweight helpers to read the PUBLIC b1_* views directly from Supabase.
 * We deliberately avoid the old dashboard RPC and internal tables.
 *
 * Views expected (already created on DB side):
 *  - public.b1_v_billing_warehouses
 *  - public.b1_v_billing_accounts
 *  - public.b1_v_billing_configs
 *  - public.b1_v_billing_upcoming
 *  - public.b1_v_usage_monthly_summary
 *
 * All functions below accept a Supabase client (client-side) and return plain JS objects.
 * We keep return types as `any[]` to avoid tight coupling while your front settles final types.
 */

/* ------------------------------- Basic utils ------------------------------- */

export const indexById = <T extends { id: string }>(items: T[]) =>
  items.reduce<Record<string, T>>((acc, item) => {
    acc[item.id] = item
    return acc
  }, {})

/* --------------------------- Warehouses / Accounts -------------------------- */

export async function fetchWarehouses(
  client: SupabaseClient,
  parentAccountId: string
): Promise<any[]> {
  const { data, error } = await client
    .from('b1_v_billing_warehouses')
    .select('*')
    .eq('parent_account_id', parentAccountId)
    .order('warehouse_name', { ascending: true })

  if (error) throw error
  return data ?? []
}

export async function fetchAccounts(
  client: SupabaseClient,
  parentAccountId: string
): Promise<any[]> {
  const { data, error } = await client
    .from('b1_v_billing_accounts')
    .select('*')
    .eq('parent_account_id', parentAccountId)
    .order('name', { ascending: true })

  if (error) throw error
  return data ?? []
}

export async function fetchConfigs(
  client: SupabaseClient,
  parentAccountId: string
): Promise<any[]> {
  const { data, error } = await client
    .from('b1_v_billing_configs')
    .select('*')
    .eq('parent_account_id', parentAccountId)

  if (error) throw error
  return data ?? []
}

/* ------------------------------ Upcoming (AR) ------------------------------ */

export async function fetchUpcomingInvoices(
  client: SupabaseClient,
  parentAccountId: string,
  monthISO?: string // e.g. '2025-11-01'
): Promise<any[]> {
  let query = client
    .from('b1_v_billing_upcoming')
    .select('*')
    .eq('parent_account_id', parentAccountId)

  if (monthISO) {
    // Coluna pode ser period_start/period_month dependendo da sua view.
    // Mantemos um filtro robusto por month via date_trunc.
    const start = new Date(monthISO)
    const next = new Date(start.getFullYear(), start.getMonth() + 1, 1)
    const startISO = `${start.getFullYear()}-${String(start.getMonth()+1).padStart(2,'0')}-01`
    const nextISO = `${next.getFullYear()}-${String(next.getMonth()+1).padStart(2,'0')}-01`
    query = query.gte('period_start', startISO).lt('period_start', nextISO)
  }

  const { data, error } = await query.order('period_start', { ascending: true })
  if (error) throw error
  return data ?? []
}

/* -------------------------- Usage (Storage + Surchg) ----------------------- */

export async function fetchUsageMonthlySummary(
  client: SupabaseClient,
  parentAccountId: string,
  from?: string, // 'YYYY-MM-01'
  to?: string    // 'YYYY-MM-01'
): Promise<any[]> {
  let query = client
    .from('b1_v_usage_monthly_summary')
    .select('*')
    .eq('parent_account_id', parentAccountId)

  if (from) query = query.gte('month', from)
  if (to)   query = query.lte('month', to)

  const { data, error } = await query.order('month', { ascending: false })
  if (error) throw error
  return data ?? []
}

/* ------------------------------ One-shot fetch ----------------------------- */

export async function fetchBillingOverviewBundle(
  client: SupabaseClient,
  parentAccountId: string,
  opts?: { from?: string; to?: string; monthISO?: string }
): Promise<{
  warehouses: any[]
  accounts: any[]
  configs: any[]
  upcoming: any[]
  usage: any[]
}> {
  const [warehouses, accounts, configs, upcoming, usage] = await Promise.all([
    fetchWarehouses(client, parentAccountId),
    fetchAccounts(client, parentAccountId),
    fetchConfigs(client, parentAccountId),
    fetchUpcomingInvoices(client, parentAccountId, opts?.monthISO),
    fetchUsageMonthlySummary(client, parentAccountId, opts?.from, opts?.to),
  ])

  return { warehouses, accounts, configs, upcoming, usage }
}

/* ---------------------------- Rates / Catalog data ------------------------- */

export interface BillingPlansData {
  rateCards: BillingRateCard[]
  activityRates: BillingRateActivity[]
  storageTiers: BillingRateStorageTier[]
  outboundBuckets: BillingRateOutboundBucket[]
  outboundTiers: BillingRateOutboundTier[]
}

export async function fetchBillingPlansData(client: SupabaseClient): Promise<BillingPlansData> {
  const [
    { data: rateCards, error: rateCardsError },
    { data: activityRates, error: activityError },
    { data: storageTiers, error: storageError },
    { data: outboundBuckets, error: bucketsError },
    { data: outboundTiers, error: tiersError },
  ] = await Promise.all([
    client.from('billing_rate_cards').select('*').order('is_default', { ascending: false }),
    client.from('billing_rate_activity').select('*').order('code', { ascending: true }),
    client.from('billing_rate_storage_tiers').select('*').order('tier_order', { ascending: true }),
    client.from('billing_rate_outbound_buckets').select('*'),
    client.from('billing_rate_outbound_tiers').select('*').order('tier_order', { ascending: true }),
  ])

  const errors = [rateCardsError, activityError, storageError, bucketsError, tiersError].filter(Boolean)
  if (errors.length > 0) throw errors[0]!

  return {
    rateCards: rateCards ?? [],
    activityRates: activityRates ?? [],
    storageTiers: storageTiers ?? [],
    outboundBuckets: outboundBuckets ?? [],
    outboundTiers: outboundTiers ?? [],
  }
}

/* --------------------------------- Clients -------------------------------- */

export async function fetchBillingClients(client: SupabaseClient): Promise<BillingClient[]> {
  const { data, error } = await client
    .from('billing_clients')
    .select('*')
    .order('name', { ascending: true })

  if (error) throw error
  return (data ?? []) as BillingClient[]
}

export type ClientServiceEffective = {
  service_id: string
  category: string
  name: string
  unit: string
  effective_rate_cents: number | null
  override_rate_cents: number | null
  warehouse_default_rate_cents: number | null
  global_default_rate_cents: number | null
  active_override: boolean | null
}

export async function fetchClientServicesEffective(
  client: SupabaseClient,
  parentAccountId: string,
  clientAccountId: string,
  warehouseId: string
): Promise<ClientServiceEffective[]> {
  const { data, error } = await client
    .from('b1_v_client_services_effective')
    .select(
      [
        'service_id',
        'category',
        'name',
        'unit',
        'effective_rate_cents',
        'override_rate_cents',
        'warehouse_default_rate_cents',
        'global_default_rate_cents',
        'active_override',
      ].join(',')
    )
    .eq('parent_account_id', parentAccountId)
    .eq('client_account_id', clientAccountId)
    .eq('warehouse_id', warehouseId)
    .order('category', { ascending: true })
    .order('name', { ascending: true })

  if (error) throw error
  const rows = (data ?? []) as unknown as ClientServiceEffective[]
  return rows
}

export async function setClientServiceOverride(client: SupabaseClient, args: {
  parentAccountId: string
  clientAccountId: string
  warehouseId: string
  serviceId: string
  rateCents: number
  notes?: string
}): Promise<void> {
  const { error } = await client.rpc('b1_set_client_service_override', {
    p_parent: args.parentAccountId,
    p_client: args.clientAccountId,
    p_warehouse: args.warehouseId,
    p_service: args.serviceId,
    p_rate_cents: args.rateCents,
    p_notes: args.notes ?? null,
  })
  if (error) throw error
}

export async function unsetClientServiceOverride(client: SupabaseClient, args: {
  parentAccountId: string
  clientAccountId: string
  warehouseId: string
  serviceId: string
  notes?: string
}): Promise<void> {
  const { error } = await client.rpc('b1_unset_client_service_override', {
    p_parent: args.parentAccountId,
    p_client: args.clientAccountId,
    p_warehouse: args.warehouseId,
    p_service: args.serviceId,
    p_notes: args.notes ?? null,
  })
  if (error) throw error
}

export async function setClientServiceVisibility(client: SupabaseClient, args: {
  parentAccountId: string
  clientAccountId: string
  warehouseId: string
  serviceId: string
  visible: boolean
}): Promise<void> {
  const { error } = await client.rpc('b1_set_client_service_visibility', {
    p_parent: args.parentAccountId,
    p_client: args.clientAccountId,
    p_warehouse: args.warehouseId,
    p_service: args.serviceId,
    p_visible: args.visible,
  })
  if (error) throw error
}