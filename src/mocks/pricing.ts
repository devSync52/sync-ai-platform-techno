export interface PricingPlan { id: string; name: string; isDefault?: boolean }

export interface PlanService {
  id: string; planId: string; code: string; name: string; unit: string;
  defaultRate: number; active: boolean;
}

export interface PlanTier {
  id: string; planId: string; name: string; min: number; max?: number;
  rate: number; active: boolean;
}

export interface ClientPricing { clientId: string; planId: string }

export interface ClientServiceOverride {
  clientId: string; planServiceId: string; overrideRate?: number; activeOverride?: boolean;
}

export interface ClientTierOverride {
  clientId: string; planTierId: string; overrideRate?: number;
}

export interface GlobalService {
  id: string
  category: string // e.g., UNLOADING, DRAYAGE, INBOUND, STORAGE, OUTBOUND, E-COMMERCE, RETURNS, LABELING, SUPPLIES
  name: string
  event?: 'ONCE' | 'PER_UNIT' | 'OTHER'
  unit: string
  defaultRate: number
  active: boolean
  warehouseId?: string
}

export function resolveServiceRate(
  planServices: PlanService[],
  overrides: ClientServiceOverride[] | undefined,
  planServiceId: string
) {
  const base = planServices.find(s => s.id === planServiceId);
  if (!base) return undefined;
  const ov = overrides?.find(o => o.planServiceId === planServiceId);
  const active = ov?.activeOverride ?? base.active;
  const rate = ov?.overrideRate ?? base.defaultRate;
  return { active, rate, base };
}

// --- Mocks
export const pricingPlans: PricingPlan[] = [{ id: 'plan_default', name: 'Standard', isDefault: true }];

export const planServices: PlanService[] = [
  { id: 'ps_pick', planId: 'plan_default', code: 'PICK_PACK', name: 'Pick & Pack', unit: 'unit', defaultRate: 1.25, active: true },
  { id: 'ps_inbound', planId: 'plan_default', code: 'INBOUND_PALLET', name: 'Inbound receiving (pallet)', unit: 'pallet', defaultRate: 18, active: true },
  { id: 'ps_relabel', planId: 'plan_default', code: 'RELABEL', name: 'Manual relabel', unit: 'unit', defaultRate: 1.5, active: true },
];

export const planTiers: PlanTier[] = [
  { id: 'pt_a', planId: 'plan_default', name: 'Tier A', min: 0, max: 10, rate: 30, active: true },
  { id: 'pt_b', planId: 'plan_default', name: 'Tier B', min: 10, max: 50, rate: 27.5, active: true },
];

export const clientPricing: ClientPricing[] = [
  { clientId: 'acc_dentalclean', planId: 'plan_default' },
  { clientId: 'acc_fttf', planId: 'plan_default' },
];

export const clientServiceOverrides: ClientServiceOverride[] = [
  { clientId: 'acc_fttf', planServiceId: 'ps_pick', overrideRate: 1.15 },
  { clientId: 'acc_dentalclean', planServiceId: 'ps_relabel', overrideRate: 1.8 },
];

export const globalServices: GlobalService[] = [
  // UNLOADING
  { id: 'gs_unld_20', category: 'UNLOADING', name: "CNTR 20' / TRUCK 26' - LOOSE SHIPMENT", event: 'ONCE', unit: 'container', defaultRate: 850, active: true, warehouseId: 'wh_hou' },
  { id: 'gs_unld_40', category: 'UNLOADING', name: 'CNTR 40/40 HC LOOSE', event: 'ONCE', unit: 'container', defaultRate: 1250, active: true, warehouseId: 'wh_hou' },
  { id: 'gs_unld_53', category: 'UNLOADING', name: "TRAILER 53' LOOSE", event: 'ONCE', unit: 'trailer', defaultRate: 1450, active: true, warehouseId: 'wh_hou' },
  { id: 'gs_unld_pallet', category: 'UNLOADING', name: 'PER PALLET (THE SAME SKU)', event: 'ONCE', unit: 'pallet', defaultRate: 40, active: true, warehouseId: 'wh_hou' },
  { id: 'gs_unld_carton', category: 'UNLOADING', name: 'CARTON BOX (THE SAME SKU)', event: 'ONCE', unit: 'carton', defaultRate: 4.5, active: true, warehouseId: 'wh_hou' },

  // DRAYAGE SERVICES
  { id: 'gs_dry_port_wh', category: 'DRAYAGE', name: 'Port to Warehouse (Port of Houston → SynC Houston)', event: 'PER_UNIT', unit: 'container', defaultRate: 285, active: true, warehouseId: 'wh_hou' },
  { id: 'gs_dry_airport', category: 'DRAYAGE', name: 'Airport Transfer (IAH → SynC Houston)', event: 'PER_UNIT', unit: 'kg', defaultRate: 0.85, active: true, warehouseId: 'wh_hou' },
  { id: 'gs_dry_rail_wh', category: 'DRAYAGE', name: 'Rail Terminal (Houston Rail Terminal → Warehouse)', event: 'PER_UNIT', unit: 'container', defaultRate: 195, active: true, warehouseId: 'wh_hou' },
  { id: 'gs_dry_crossdock', category: 'DRAYAGE', name: 'Cross-dock Transfer', event: 'PER_UNIT', unit: 'pallet', defaultRate: 45, active: true, warehouseId: 'wh_hou' },

  // INBOUND
  { id: 'gs_inb_barcode', category: 'INBOUND', name: 'Barcode Scanning (per unit)', event: 'PER_UNIT', unit: 'unit', defaultRate: 1.5, active: true, warehouseId: 'wh_hou' },

  // STORAGE
  { id: 'gs_sto_tier2', category: 'STORAGE', name: 'Storage Tier 2 (15,001 to 100,000 CF)', event: 'PER_UNIT', unit: 'cf', defaultRate: 0.6, active: true, warehouseId: 'wh_hou' },

  // OUTBOUND
  { id: 'gs_out_0_99_t501_1000', category: 'OUTBOUND', name: 'Outbound 0–0.99 CF/Unit — Tier 501–1,000', event: 'PER_UNIT', unit: 'unit', defaultRate: 2.76, active: true, warehouseId: 'wh_hou' },
  { id: 'gs_out_1_1_99_t1_500', category: 'OUTBOUND', name: 'Outbound 1–1.99 CF/Unit — Tier 1–500', event: 'PER_UNIT', unit: 'unit', defaultRate: 5.5, active: true, warehouseId: 'wh_hou' },
  { id: 'gs_out_fba', category: 'OUTBOUND', name: 'FBA Orders (Amazon FBA)', event: 'PER_UNIT', unit: 'order', defaultRate: 2.49, active: true, warehouseId: 'wh_hou' },

  // E-COMMERCE
  { id: 'gs_ecom_tx', category: 'E-COMMERCE', name: 'E-commerce Transaction (WMS)', event: 'PER_UNIT', unit: 'order', defaultRate: 0.3, active: true, warehouseId: 'wh_hou' },
  { id: 'gs_ecom_retail_tx', category: 'E-COMMERCE', name: 'Retail Transaction (WMS)', event: 'PER_UNIT', unit: 'order', defaultRate: 0.3, active: true, warehouseId: 'wh_hou' },

  // RETURNS & INSURANCE
  { id: 'gs_ret_processing', category: 'RETURNS', name: 'Returns Processing (per piece)', event: 'PER_UNIT', unit: 'piece', defaultRate: 4.3, active: true, warehouseId: 'wh_hou' },

  // LABELING
  { id: 'gs_lbl_std_5001', category: 'LABELING', name: 'Standard Labeling (≥ 5,001 units)', event: 'PER_UNIT', unit: 'unit', defaultRate: 0.25, active: true, warehouseId: 'wh_hou' },

  // SUPPLIES & MATERIALS
  { id: 'gs_sup_small_box', category: 'SUPPLIES', name: 'Small Box/Bag', event: 'PER_UNIT', unit: 'unit', defaultRate: 2.5, active: true, warehouseId: 'wh_hou' },
  { id: 'gs_sup_mailer', category: 'SUPPLIES', name: 'Shipping Mailer', event: 'PER_UNIT', unit: 'unit', defaultRate: 1.5, active: true, warehouseId: 'wh_hou' },
  { id: 'gs_sup_plastic_pallet', category: 'SUPPLIES', name: 'Industrial Plastic Pallet 40x48', event: 'PER_UNIT', unit: 'unit', defaultRate: 18, active: true, warehouseId: 'wh_hou' },
  { id: 'gs_sup_custom_boxes', category: 'SUPPLIES', name: 'Customized Boxes', event: 'PER_UNIT', unit: 'unit', defaultRate: 25, active: true, warehouseId: 'wh_hou' },
]

export interface Warehouse {
    id: string
    name: string
    city: string
    state: string
  }
  
  export const warehouses: Warehouse[] = [
    { id: 'wh_hou', name: 'SynC Houston', city: 'Houston', state: 'TX' },
    { id: 'wh_mia', name: 'SynC Miami', city: 'Miami', state: 'FL' },
    { id: 'wh_ewr', name: 'SynC New Jersey', city: 'Newark', state: 'NJ' },
  ]