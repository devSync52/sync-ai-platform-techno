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

