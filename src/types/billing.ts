import type { SupabaseClient } from '@supabase/supabase-js'
// ---- Billing Types (aligned with current DB schema) ----

// Invoice statuses in billing.invoice
export type BillingInvoiceStatus = 'draft' | 'issued' | 'paid' | 'void' | string

// Core invoice row from billing.invoice
export interface BillingInvoice {
  id: string
  parent_account_id: string
  client_account_id: string
  warehouse_id: string | null
  period_start: string
  period_end: string
  total_cents: number
  status: BillingInvoiceStatus
  issued_at: string | null
  created_at: string | null

  // Legacy/optional fields kept for backward compatibility with UI bits
  currency?: string | null
  subtotal?: number | null
  tax?: number | null
  total?: number | null
  generated_at?: string | null
  delivered_at?: string | null
  pdf_url?: string | null
  meta?: Record<string, unknown> | null
  updated_at?: string | null
  warehouse_account_id?: string | null
}

// Storage basis (enum billing.storage_basis)
export type StorageBasis = 'CUFT' | 'UNIT' | 'LB' | 'PALLET_DAY'

// Config row from billing.configs (new)
export interface BillingConfigV2 {
  id: string
  parent_account_id: string
  client_account_id: string
  warehouse_id: string | null
  currency_code: string
  storage_rate_model: StorageBasis
  storage_price_per_cuft_cents: number | null
  storage_price_per_lb_cents: number | null
  storage_price_per_unit_cents: number | null
  storage_price_per_pallet_day_cents: number | null
  free_storage_days: number | null
  snapshot_hour_utc: number | null
  monthly_minimum_cents: number | null
  dim_divisor: number | null
  default_volume_cuft: number | null
  default_weight_lb: number | null
  created_at: string | null

  // Outbound (opcional, quando existir em views agregadas)
  outbound_price_per_pack_cents?: number | null
  outbound_price_per_line_cents?: number | null
  outbound_price_per_unit_cents?: number | null
  outbound_price_per_label_cents?: number | null
  outbound_price_per_lb_cents?: number | null
  outbound_min_order_cents?: number | null

  // View helpers
  rate_storage_usd_per_cuft?: string | number | null
  is_active?: boolean | null
}

// Legacy config (mantido para não quebrar importações antigas)
export interface BillingConfig {
  id: string
  client_id: string
  assigned_warehouse: string | null
  billing_frequency: string
  monthly_billing_day: number | null
  rate_card_id: string | null
  enabled_services: string[] | null
}

// Activity event (generic)
export interface BillingActivityEvent {
  id: string
  client_id: string
  event_type: string
  occurred_at: string
  quantity: number
  meta: Record<string, unknown> | null
  source: string | null
  external_id: string | null
  raw: Record<string, unknown> | null
  created_at: string | null
}

// Warehouse registry (billing.warehouses)
export interface BillingWarehouse {
  id: string
  parent_account_id: string | null
  name: string | null
  is_active: boolean | null
  source: string | null
  wms_facility_id: string | null
  warehouse_id: string
  warehouse_name: string
  upcoming_total_usd?: string | number
  draft_count?: number
  open_count?: number
  overdue_count?: number


  // Legacy/optional fields kept for UI
  account_id?: string | null
  city?: string | null
  state?: string | null
  is_default?: boolean | null
}

// Account/Client summaries
export interface AccountSummary {
  id: string
  name: string
  status: string | null
}

export interface BillingAccount {
  id: string
  name: string
  status: string | null
  parent_account_id: string | null
}

export interface BillingClient {
  id: string
  parent_account_id: string | null
  client_account_id: string | null
  name: string | null
  source: string | null
  wms_customer_id: string | null
  is_active: boolean | null
  warehouse_id: string | null
  warehouse_id_norm: string | null
  external_ids?: string[] | null
}

// Slim client card for lists
export interface BillingClientSummary {
  recordId: string
  clientAccountId: string
  name: string | null
  isActive: boolean
  billingMethod: string | null
  warehouseId: string | null
  warehouseName: string | null
  nextInvoiceDate: string | null
  mtdTotal: number | null
  source: string | null
  wmsCustomerId: string | null
}

// Outbound usage (normalized)
export interface BillingUsageOutbound {
  id: string
  client_id: string | null
  occurred_at: string | null
  service_code: string | null
  description: string | null
  quantity: number | null
  unit: string | null
  rate: number | null
  amount: number | null
  status: string | null
  warehouse_id: string | null
  metadata: Record<string, unknown> | null
  source: string | null
  parent_account_id?: string | null
  client_account_id?: string | null

}

// Rate-card (legacy; kept until removal)
export interface BillingRateCard {
  id: string
  account_id: string
  name: string
  is_default: boolean
  version: number
  created_by: string | null
  created_at: string | null
  updated_at: string | null
}

export interface BillingRateActivity {
  id: string
  rate_card_id: string | null
  code: string
  unit: string
  rate: number
}

export interface BillingRateStorageTier {
  id: string
  rate_card_id: string | null
  tier_order: number
  max_cft: number | null
  rate_per_cft: number
}

export interface BillingRateOutboundBucket {
  id: string
  rate_card_id: string | null
  size_min_cft: number | null
  size_max_cft: number | null
}

export interface BillingRateOutboundTier {
  id: string
  bucket_id: string
  tier_order: number
  max_units: number | null
  channel: string | null
  rate_per_unit: number | null
}

// ---- Dashboard (public.b1_* views / function) ----

export interface B1WarehouseSummary {
  name: string
  open: number
  draft: number
  overdue: number
  warehouse_id: string | null
  upcoming_total: number
}

export interface B1UpcomingInvoice {
  invoice_id: string
  client_name: string
  warehouse_name: string | null
  period_start: string
  period_end: string
  total_usd: number
  status: BillingInvoiceStatus
}

export interface B1UnclassifiedEvent {
  date: string        // YYYY-MM-DD
  type: string        // e.g., 'outbound_missing_metrics' | 'storage_missing_config'
  items: number
  warehouse_id: string | null
  client_account_id: string | null
  description?: string
}

export interface B1DashboardRow {
  parent_account_id: string
  kpis: {
    mrr_est: number
    open_invoices: number
    overdue_invoices: number
    revenue_last_month: number
  }
  warehouses: B1WarehouseSummary[]
  upcoming_invoices: B1UpcomingInvoice[]
  unclassified_events: B1UnclassifiedEvent[]
}

export interface B1StorageDailyBillingRow {
  snapshot_date: string
  parent_account_id: string
  client_account_id: string
  warehouse_id: string
  total_volume_cuft: string | number
  base_rate_usd_per_cuft_day: string | number
  surcharge_usd_per_cuft_day: string | number
  total_rate_usd_per_cuft_day: string | number
  amount_usd: string | number
}

export interface B1BarcodeTieredSummaryByClient {
  client_account_id: string
  cf_tier: '0–0.99' | '1–1.99' | '2–4.99' | 'Large (>=5)' | string
  orders: number
  units: string | number
  rate_usd: string | number
  total_usd: string | number
}

export interface B1BarcodeTieredSummaryByClientWithName
  extends B1BarcodeTieredSummaryByClient {
  client_name: string | null
}

export interface B1SuppliesUsageRow {
  occurred_at: string
  ref_id: string
  parent_account_id?: string
  client_account_id?: string
  warehouse_id?: string
  description: 'Small Box/Bag' | 'Shipping Mailer' | 'Pallet (default)' | 'Customized Boxes' | 'Pallet Repack' | string
  quantity: string | number
  rate_usd: string | number
  amount_usd: string | number
}

export interface B1SuppliesSummaryRow {
  description: string
  n: number
  total_usd: string | number
}

export interface ClientServiceEffective {
  service_id: string
  service_name: string
  category: string | null
  unit: string | null
  default_rate_cents: number | null
  override_rate_cents: number | null
  effective_rate_cents: number | null
  source: string | null
  warehouse_id?: string | null
  client_account_id?: string | null
  parent_account_id?: string | null
  name?: string | null
  effective_rate_usd?: number | null
  visible?: boolean | null
}



export interface BillingClientPricingConfig {
  id: string
  parent_account_id: string
  client_account_id: string
  warehouse_id: string | null

  currency_code: string
  storage_rate_model: 'CUFT' | 'LB' | 'UNIT' | 'PALLET_DAY'
  snapshot_hour_utc: number | null
  is_active: boolean | null

  // Storage
  storage_price_per_cuft_cents: number | null
  storage_price_per_lb_cents: number | null
  storage_price_per_unit_cents: number | null
  storage_price_per_pallet_day_cents: number | null
  free_storage_days: number | null
  monthly_minimum_cents: number | null
  dim_divisor: number | null
  default_volume_cuft: number | null
  default_weight_lb: number | null
  rate_storage_usd_per_cuft: string | number | null

  // Outbound
  outbound_price_per_pack_cents: number | null
  outbound_price_per_line_cents: number | null
  outbound_price_per_unit_cents: number | null
  outbound_price_per_label_cents: number | null
  outbound_price_per_lb_cents: number | null
  outbound_min_order_cents: number | null
}

const EFFECTIVE_VIEW = 'b1_v_client_services_effective'

// ---- FETCH EFFECTIVE SERVICES ----
export async function fetchClientServicesEffective(
  supabase: SupabaseClient, // ou SupabaseClient<Database>
  parentAccountId: string,
  clientAccountId: string,
  warehouseId: string
): Promise<ClientServiceEffective[]> {
  const { data, error } = await supabase
    .from(EFFECTIVE_VIEW)
    .select('*')
    .eq('parent_account_id', parentAccountId)
    .eq('client_account_id', clientAccountId)
    .eq('warehouse_id', warehouseId)

  if (error) {
    console.error('[billing] fetchClientServicesEffective error:', error)
    throw error
  }

  return (data ?? []) as ClientServiceEffective[]
}

// ---- OVERRIDE RATE ----
/*
billing.client_service_overrides (
  parent_account_id uuid not null,
  client_account_id uuid not null,
  warehouse_id uuid not null,
  service_id uuid not null,
  override_rate_cents integer null,
  active_override boolean null,
  notes text null,
  updated_at timestamptz default now(),
  primary key (client_account_id, warehouse_id, service_id)
)
*/

type OverrideArgs = {
  parentAccountId: string
  clientAccountId: string
  warehouseId: string
  serviceId: string
  rateCents?: number
}

export async function setClientServiceOverride(
  supabase: SupabaseClient,
  args: OverrideArgs
) {
  const { parentAccountId, clientAccountId, warehouseId, serviceId, rateCents } = args

  const { error } = await supabase
    .from('billing.client_service_overrides')
    .upsert(
      {
        parent_account_id: parentAccountId,
        client_account_id: clientAccountId,
        warehouse_id: warehouseId,
        service_id: serviceId,
        override_rate_cents: rateCents ?? null,
        active_override: true,
        updated_at: new Date().toISOString(),
      },
      {
        onConflict: 'client_account_id,warehouse_id,service_id',
      }
    )

  if (error) {
    console.error('[billing] setClientServiceOverride error:', error)
    throw error
  }
}

export async function unsetClientServiceOverride(
  supabase: SupabaseClient,
  args: Omit<OverrideArgs, 'rateCents'>
) {
  const { parentAccountId, clientAccountId, warehouseId, serviceId } = args

  const { error } = await supabase
    .from('billing.client_service_overrides')
    .delete()
    .match({
      parent_account_id: parentAccountId,
      client_account_id: clientAccountId,
      warehouse_id: warehouseId,
      service_id: serviceId,
    })

  if (error) {
    console.error('[billing] unsetClientServiceOverride error:', error)
    throw error
  }
}

// ---- VISIBILITY ----
// Aqui estou assumindo que existe uma tabela separada para visibilidade.
// Se você estiver usando um campo na própria client_service_overrides,
// dá pra adaptar (comentei nos comentários abaixo).

type VisibilityArgs = {
  parentAccountId: string
  clientAccountId: string
  warehouseId: string
  serviceId: string
  visible: boolean
}

export async function setClientServiceVisibility(
  supabase: SupabaseClient,
  args: VisibilityArgs
) {
  const { parentAccountId, clientAccountId, warehouseId, serviceId, visible } = args

  // OPÇÃO A: tabela separada billing.client_service_visibility
  const { error } = await supabase
    .from('billing.client_service_visibility')
    .upsert(
      {
        parent_account_id: parentAccountId,
        client_account_id: clientAccountId,
        warehouse_id: warehouseId,
        service_id: serviceId,
        visible,
        updated_at: new Date().toISOString(),
      },
      {
        onConflict: 'client_account_id,warehouse_id,service_id',
      }
    )

  /*
  // OPÇÃO B: reaproveitar client_service_overrides e usar active_override como "visible"
  const { error } = await supabase
    .from('billing.client_service_overrides')
    .upsert(
      {
        parent_account_id: parentAccountId,
        client_account_id: clientAccountId,
        warehouse_id,
        service_id: serviceId,
        active_override: visible,   // visível ou não
        updated_at: new Date().toISOString(),
      },
      {
        onConflict: 'client_account_id,warehouse_id,service_id',
      }
    )
  */

  if (error) {
    console.error('[billing] setClientServiceVisibility error:', error)
    throw error
  }
}