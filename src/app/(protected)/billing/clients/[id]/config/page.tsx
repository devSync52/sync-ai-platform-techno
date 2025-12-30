'use client'

import Link from 'next/link'
import { useParams, useRouter } from 'next/navigation'
import { useEffect, useMemo, useRef, useState } from 'react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Switch } from '@/components/ui/switch'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog'
import { useSupabase } from '@/components/supabase-provider'
import type { BillingConfig } from '@/types/billing'
import { ClientPageHeader } from '@/components/billing/client-page-header'
import {
  fetchClientServicesEffective,
  setClientServiceOverride,
  unsetClientServiceOverride,
  setClientServiceVisibility,
  type ClientServiceEffective,
} from '@/lib/supabase/billing'

type BillingFormState = {
  billingActive: boolean
  method: 'prepaid' | 'postpaid'
  minMonthlyFee: number
  discountPct: number
  taxExempt: boolean
  taxId: string
  invoiceCycle: 'monthly' | 'biweekly' | 'weekly'
  cutDay: number
  templatePrimary: string
  // Storage
  storageModel: 'CUFT' | 'LB' | 'UNIT' | 'PALLET_DAY'
  storagePricePerCuft: number
  storagePricePerLb: number
  storagePricePerUnit: number
  storagePricePerPalletDay: number
  freeStorageDays: number
  snapshotHourUtc: number
  defaultVolumeCuft: number
  defaultWeightLb: number
  // Outbound
  outboundPricePerPack: number
  outboundPricePerLine: number
  outboundPricePerUnit: number
  outboundPricePerLabel: number
  outboundPricePerLb: number
  outboundMinOrder: number
}

type ServiceCatalogRow = {
  id: string
  name: string
  category: string
  unit: string
  defaultRate?: number
  active?: boolean
}

type ServiceOverrideRow = {
  clientId: string
  planServiceId: string
  overrideRate?: number
  activeOverride?: boolean
}

function useClientBillingConfigActions({
  parentAccountId,
  clientId,
}: {
  parentAccountId: string
  clientId: string
}) {
  const supabase = useSupabase()
  const [savingConfig, setSavingConfig] = useState(false)
  const [savingOverrides, setSavingOverrides] = useState(false)
  const [lastError, setLastError] = useState<string | null>(null)

  const saveConfig = async (form: BillingFormState): Promise<BillingConfig | null> => {
    try {
      setSavingConfig(true)
      setLastError(null)

      const payload = {
        billing_active: form.billingActive,
        billing_method: form.method,
        min_monthly_fee_cents: toCents(form.minMonthlyFee),
        discount_pct: form.discountPct,
        tax_exempt: form.taxExempt,
        tax_id: form.taxId,
        invoice_cycle: form.invoiceCycle,
        cut_off_day: form.cutDay,
        template_primary_color: form.templatePrimary,
        // Storage
        storage_rate_model: form.storageModel,
        storage_price_per_cuft_cents: toCents(form.storagePricePerCuft),
        storage_price_per_lb_cents: toCents(form.storagePricePerLb),
        storage_price_per_unit_cents: toCents(form.storagePricePerUnit),
        storage_price_per_pallet_day_cents: toCents(form.storagePricePerPalletDay),
        free_storage_days: form.freeStorageDays,
        snapshot_hour_utc: form.snapshotHourUtc,
        default_volume_cuft: form.defaultVolumeCuft,
        default_weight_lb: form.defaultWeightLb,
        // Outbound
        outbound_price_per_pack_cents: toCents(form.outboundPricePerPack),
        outbound_price_per_line_cents: toCents(form.outboundPricePerLine),
        outbound_price_per_unit_cents: toCents(form.outboundPricePerUnit),
        outbound_price_per_label_cents: toCents(form.outboundPricePerLabel),
        outbound_price_per_lb_cents: toCents(form.outboundPricePerLb),
        outbound_min_order_cents: toCents(form.outboundMinOrder),
      }

      const res = await fetch(`/api/billing/configs/${clientId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })

      if (!res.ok) {
        let msg = 'Failed to save config.'
        try {
          const errJson = await res.json()
          if (errJson?.error) msg = errJson.error
        } catch {
          // ignore
        }
        setLastError(msg)
        throw new Error(msg)
      }

      let updated: BillingConfig | null = null
      try {
        const json = await res.json()
        updated = (json?.data ?? null) as BillingConfig | null
      } catch {
        // ignore
      }

      return updated
    } catch (e) {
      console.error('[billing] saveConfig failed:', e)
      if (!lastError) setLastError('Failed to save config.')
      return null
    } finally {
      setSavingConfig(false)
    }
  }

  const saveOverrides = async (args: {
    selectedWarehouseId: string
    servicesCatalog: ServiceCatalogRow[]
    overrides: ServiceOverrideRow[]
  }): Promise<ClientServiceEffective[] | null> => {
    const { selectedWarehouseId, servicesCatalog, overrides } = args
    if (!selectedWarehouseId) return null

    try {
      setSavingOverrides(true)
      setLastError(null)

      for (const srv of servicesCatalog) {
        const ov = overrides.find(o => o.planServiceId === srv.id)
        const desiredVisible = !(ov?.activeOverride === false)

        await setClientServiceVisibility(supabase, {
          parentAccountId,
          clientAccountId: clientId,
          warehouseId: selectedWarehouseId,
          serviceId: srv.id,
          visible: desiredVisible,
        })

        if (ov && typeof ov.overrideRate === 'number') {
          await setClientServiceOverride(supabase, {
            parentAccountId,
            clientAccountId: clientId,
            warehouseId: selectedWarehouseId,
            serviceId: srv.id,
            rateCents: Math.round(ov.overrideRate * 100),
          })
        } else {
          await unsetClientServiceOverride(supabase, {
            parentAccountId,
            clientAccountId: clientId,
            warehouseId: selectedWarehouseId,
            serviceId: srv.id,
          })
        }
      }

      const list = await fetchClientServicesEffective(
        supabase,
        parentAccountId,
        clientId,
        selectedWarehouseId
      )

      return list ?? []
    } catch (e) {
      console.error('[billing] saveOverrides failed:', e)
      setLastError('Failed to save overrides.')
      return null
    } finally {
      setSavingOverrides(false)
    }
  }

  return {
    saveConfig,
    saveOverrides,
    savingConfig,
    savingOverrides,
    lastError,
  }
}


const FALLBACK_WAREHOUSE_LABEL = 'Unassigned'

const toUSD = (cents?: number | null) => ((cents ?? 0) / 100)
const toCents = (usd: number) => Math.round((usd ?? 0) * 100)
const formatUSD = (usd?: number) =>
  new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(usd ?? 0)
// TEMP: fixando parent enquanto conectamos tudo
const PARENT_ID = '80dddf96-059f-4d4a-86f0-69443ceb0db9'

type WarehouseOption = { id: string; name: string }

// Resolved rate: prioriza o efetivo do backend; se não tiver, cai no local
function resolveServiceRate(
  id: string,
  services: Array<{ id: string; defaultRate?: number; active?: boolean }>,
  overrides: Array<{ planServiceId: string; overrideRate?: number; activeOverride?: boolean }>,
  effById: Record<string, ClientServiceEffective>
) {
  const eff = effById[id]
  if (eff) {
    const rate =
      typeof (eff as any).effective_rate_usd === 'number'
        ? (eff as any).effective_rate_usd
        : (typeof (eff as any).effective_rate_cents === 'number'
            ? ((eff as any).effective_rate_cents / 100)
            : undefined)
    const active = (eff as any).visible !== false
    return { rate: rate ?? 0, active }
  }
  const svc = services.find(s => s.id === id)
  const ov  = overrides.find(o => o.planServiceId === id)
  const hidden = ov?.activeOverride === false
  const rate = ov?.overrideRate ?? svc?.defaultRate ?? 0
  return { rate, active: !hidden }
}

// Mocked initial values (swap with real fetch later)
const initialMock: BillingFormState = {
  billingActive: true,
  method: 'postpaid',
  minMonthlyFee: 150,
  discountPct: 5,
  taxExempt: false,
  taxId: '12-3456789',
  invoiceCycle: 'monthly',
  cutDay: 31,
  templatePrimary: '#3f2d90',
  // Storage
  storageModel: 'CUFT',
  storagePricePerCuft: 0,
  storagePricePerLb: 0,
  storagePricePerUnit: 0,
  storagePricePerPalletDay: 0,
  freeStorageDays: 0,
  snapshotHourUtc: 3,
  defaultVolumeCuft: 0,
  defaultWeightLb: 0,
  // Outbound
  outboundPricePerPack: 0,
  outboundPricePerLine: 0,
  outboundPricePerUnit: 0,
  outboundPricePerLabel: 0,
  outboundPricePerLb: 0,
  outboundMinOrder: 0,
}

// Derive local form state from loaded BillingConfig
const deriveFormFromConfig = (cfg: BillingConfig | null): BillingFormState => {
  if (!cfg) return initialMock
  const anyCfg = cfg as any
  return {
    billingActive: anyCfg.billing_active ?? true,
    method: anyCfg.billing_method ?? 'postpaid',
    minMonthlyFee:
      typeof anyCfg.min_monthly_fee_cents === 'number'
        ? anyCfg.min_monthly_fee_cents / 100
        : 0,
    discountPct: anyCfg.discount_pct ?? 0,
    taxExempt: anyCfg.tax_exempt ?? false,
    taxId: anyCfg.tax_id ?? '',
    invoiceCycle: anyCfg.invoice_cycle ?? 'monthly',
    cutDay: anyCfg.cut_off_day ?? 31,
    templatePrimary: anyCfg.template_primary_color ?? '#3f2d90',
    // Storage
    storageModel: anyCfg.storage_rate_model ?? 'CUFT',
    storagePricePerCuft: toUSD(anyCfg.storage_price_per_cuft_cents),
    storagePricePerLb: toUSD(anyCfg.storage_price_per_lb_cents),
    storagePricePerUnit: toUSD(anyCfg.storage_price_per_unit_cents),
    storagePricePerPalletDay: toUSD(anyCfg.storage_price_per_pallet_day_cents),
    freeStorageDays: anyCfg.free_storage_days ?? 0,
    snapshotHourUtc: anyCfg.snapshot_hour_utc ?? 3,
    defaultVolumeCuft: anyCfg.default_volume_cuft ?? 0,
    defaultWeightLb: anyCfg.default_weight_lb ?? 0,
    // Outbound
    outboundPricePerPack: toUSD(anyCfg.outbound_price_per_pack_cents),
    outboundPricePerLine: toUSD(anyCfg.outbound_price_per_line_cents),
    outboundPricePerUnit: toUSD(anyCfg.outbound_price_per_unit_cents),
    outboundPricePerLabel: toUSD(anyCfg.outbound_price_per_label_cents),
    outboundPricePerLb: toUSD(anyCfg.outbound_price_per_lb_cents),
    outboundMinOrder: toUSD(anyCfg.outbound_min_order_cents),
  }
}

export default function ClientConfigPage() {
  const { id } = useParams<{ id: string }>()
  const router = useRouter()
  const supabase = useSupabase()

  // --- Local config state & helpers (added) ---
  const [config, setConfig] = useState<BillingConfig | null>(null)
  const [configLoading, setConfigLoading] = useState<boolean>(false)
  const [configError, setConfigError] = useState<string | null>(null)

  const clientLabel =
    (config as any)?.client_name ??
    (config as any)?.client_code ??
    String(id)
  const clientLogo =
    (config as any)?.client_logo_url
      ? String((config as any).client_logo_url)
      : null

  // Services visibility & override helpers
  const enabledServices = useMemo(() => new Set(config?.enabled_services ?? []), [config])

  const isHidden = (serviceId: string) => {
    const ov = overrides.find(o => o.planServiceId === serviceId)
    return ov?.activeOverride === false
  }

  const setOverrideRate = (serviceId: string, rate: number | undefined) => {
    setOverrides(prev => {
      const idx = prev.findIndex(o => o.planServiceId === serviceId)
      if (idx === -1) {
        return [...prev, { clientId, planServiceId: serviceId, overrideRate: rate }]
      }
      const next = [...prev]
      next[idx] = { ...next[idx], overrideRate: rate }
      return next
    })
  }

  const toggleHidden = (serviceId: string, hide: boolean) => {
    setOverrides(prev => {
      const idx = prev.findIndex(o => o.planServiceId === serviceId)
      if (idx === -1) {
        return [...prev, { clientId, planServiceId: serviceId, activeOverride: !hide }]
      }
      const next = [...prev]
      next[idx] = { ...next[idx], activeOverride: !hide }
      return next
    })
  }

  const resetOverride = (serviceId: string) => {
    setOverrides(prev => prev.filter(o => o.planServiceId !== serviceId))
  }

  const currency = (n?: number) => {
    const v = typeof n === 'number' ? n : 0
    return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(v)
  }

  // Temporary pricing plans list until backend is wired
  const pricingPlans = [
    { id: 'default', name: 'Standard', isDefault: true },
    { id: 'premium', name: 'Premium' },
  ] as Array<{ id: string; name: string; isDefault?: boolean }>

  const [form, setForm] = useState(initialMock)

  useEffect(() => {
    setForm(deriveFormFromConfig(config))
  }, [config])

  // Pricing plan + overrides (mocked)
  const clientId = String(id)
  const {
    saveConfig,
    saveOverrides,
    savingConfig,
    savingOverrides,
    lastError,
  } = useClientBillingConfigActions({
    parentAccountId: PARENT_ID,
    clientId,
  })
  const [selectedPlanId, setSelectedPlanId] = useState<string>('default')
  const [overrides, setOverrides] = useState<
    Array<{ clientId: string; planServiceId: string; overrideRate?: number; activeOverride?: boolean }>
  >([])

  // Warehouse & Global Catalog filtering (must be declared before any effects that use them)
  const [warehouseOptions, setWarehouseOptions] = useState<WarehouseOption[]>([])
  const [selectedWh, setSelectedWh] = useState<string>('')

  const [servicesCatalog, setServicesCatalog] = useState<
    Array<{ id: string; name: string; category: string; unit: string; defaultRate?: number; active?: boolean }>
  >([])
  const [effectiveServices, setEffectiveServices] = useState<ClientServiceEffective[]>([])

  const effById = useMemo(() => {
    const m: Record<string, ClientServiceEffective> = {}
    for (const e of effectiveServices ?? []) m[e.service_id] = e
    return m
  }, [effectiveServices])

  const adapterPlanServices = useMemo(
    () => servicesCatalog.map(s => ({ id: s.id, defaultRate: s.defaultRate, active: s.active })),
    [servicesCatalog]
  )

  // Hydrate overrides from backend effective rows (once per warehouse selection)
  const overridesHydratedRef = useRef(false)
  useEffect(() => {
    // when switching warehouse/client, allow re-hydration
    overridesHydratedRef.current = false
  }, [selectedWh, clientId])

  useEffect(() => {
    if (overridesHydratedRef.current) return

    // If backend returns no rows, clear local overrides for that warehouse
    if (!effectiveServices || effectiveServices.length === 0) {
      setOverrides([])
      overridesHydratedRef.current = true
      return
    }

    const next = (effectiveServices as any[])
      .map((e) => {
        const overrideUsd =
          typeof e.override_rate_usd === 'number'
            ? e.override_rate_usd
            : typeof e.override_rate_cents === 'number'
              ? e.override_rate_cents / 100
              : undefined

        // In our UI model: activeOverride=false means hidden
        const activeOverride = e.visible === false ? false : true

        // Only keep rows that actually represent a customization (rate override or hidden)
        if (overrideUsd === undefined && activeOverride === true) return null

        return {
          clientId,
          planServiceId: String(e.service_id ?? e.id),
          overrideRate: overrideUsd,
          activeOverride,
        }
      })
      .filter(Boolean) as Array<{
      clientId: string
      planServiceId: string
      overrideRate?: number
      activeOverride?: boolean
    }>

    setOverrides(next)
    overridesHydratedRef.current = true
  }, [effectiveServices, clientId])


  // Group services by category (from global catalog)
  const svcCategories = useMemo(() => Array.from(new Set(servicesCatalog.map(s => s.category))).sort(), [servicesCatalog])

  // Collapsible state per category
  const [openCats, setOpenCats] = useState<Record<string, boolean>>({})
  // Ensure state covers current categories
  useEffect(() => {
    setOpenCats(prev => {
      const next: Record<string, boolean> = { ...prev }
      for (const c of svcCategories) if (next[c] === undefined) next[c] = true
      for (const k of Object.keys(next)) if (!svcCategories.includes(k)) delete next[k]
      return next
    })
  }, [svcCategories])

  const expandAllCats = () => setOpenCats(Object.fromEntries(svcCategories.map(c => [c, true])))
  const collapseAllCats = () => setOpenCats(Object.fromEntries(svcCategories.map(c => [c, false])))

  useEffect(() => {
    let active = true
    const load = async () => {
      setConfigLoading(true)
      setConfigError(null)
      try {
        // 1) Config do cliente
        const { data: cfg, error: e1 } = await supabase
          .from('b1_v_billing_configs')
          .select('*')
          .eq('parent_account_id', PARENT_ID)
          .eq('client_account_id', clientId)
          .limit(1)
          .maybeSingle()
        if (e1) throw e1
        if (!active) return
        setConfig(cfg as unknown as BillingConfig | null)
  
        // 2) Warehouses do parent
        const { data: whs, error: e2 } = await supabase
          .from('b1_v_billing_warehouses')
          .select('warehouse_id, warehouse_name')
          .eq('parent_account_id', PARENT_ID)
          .order('warehouse_name', { ascending: true })
        if (e2) throw e2
        if (!active) return
        const mapped: WarehouseOption[] = (whs ?? []).map(w => ({ id: w.warehouse_id, name: w.warehouse_name }))
        setWarehouseOptions(mapped)
        if (cfg?.assigned_warehouse) {
          const assigned = String(cfg.assigned_warehouse)
          const hit = mapped.find(w => w.id === assigned)
          setSelectedWh(hit ? hit.id : (mapped[0]?.id ?? ''))
        } else {
          setSelectedWh(mapped[0]?.id ?? '')
        }
  
        // 3) Catálogo de serviços (global; sem escopo por warehouse)
        setServicesCatalog([])
        setEffectiveServices([])
        
      } catch (err) {
        console.error(err)
        if (active) setConfigError(err instanceof Error ? err.message : 'Failed to load billing config')
      } finally {
        if (active) setConfigLoading(false)
      }
    }
    load()
    return () => { active = false }
  }, [clientId, supabase])

  useEffect(() => {
    let active = true
    const loadCatalog = async () => {
      try {
        if (!selectedWh) { setServicesCatalog([]); return }
        const { data: svcs, error } = await supabase
          .from('b1_v_billing_services_by_wh')
          .select('service_id, category, name, unit, default_rate_usd, active')
          .eq('warehouse_id', selectedWh)
          .order('category', { ascending: true })
          .order('name', { ascending: true })
        if (error) throw error
        if (!active) return
        const mapped = (svcs ?? []).map((s: any) => ({
          id: s.service_id,
          name: s.name,
          category: s.category,
          unit: s.unit,
          defaultRate: s.default_rate_usd ?? 0,
          active: s.active ?? true,
        }))
        setServicesCatalog(mapped)
      } catch (e) {
        console.error('[billing] load services catalog failed:', e)
        if (active) setServicesCatalog([])
      }
    }
    loadCatalog()
    return () => { active = false }
  }, [selectedWh, supabase])

  useEffect(() => {
    let active = true
    const run = async () => {
      if (!selectedWh) { setEffectiveServices([]); return }
      try {
        const list = await fetchClientServicesEffective(
          supabase,
          PARENT_ID, clientId, selectedWh
        )
        if (!active) return
        setEffectiveServices(list ?? [])
      } catch (e) {
        console.warn('[billing] fetchClientServicesEffective wrapper error:', e)
        if (active) setEffectiveServices([])
      }
    }
    run()
    return () => { active = false }
  }, [selectedWh, clientId, supabase])

  // Client-only custom services (not tied to plan)
  interface ClientCustomService {
    id: string
    category: string
    name: string
    event: 'ONCE' | 'PER_UNIT' | 'OTHER'
    unit: string
    rate: number
    active: boolean
  }
 
    const [customServices, setCustomServices] = useState<ClientCustomService[]>([
      { id: 'cs_unld_20', category: 'UNLOADING', name: "CNTR 20' / TRUCK 26' - LOOSE SHIPMENT", event: 'ONCE', unit: 'container', rate: 850, active: true },
      { id: 'cs_unld_40', category: 'UNLOADING', name: 'CNTR 40/40 HC LOOSE', event: 'ONCE', unit: 'container', rate: 1250, active: true },
      { id: 'cs_unld_53', category: 'UNLOADING', name: "TRAILER 53' LOOSE", event: 'ONCE', unit: 'trailer', rate: 1450, active: true },
      { id: 'cs_unld_pallet', category: 'UNLOADING', name: 'PER PALLET (THE SAME SKU)', event: 'ONCE', unit: 'pallet', rate: 40, active: true },
      { id: 'cs_unld_carton', category: 'UNLOADING', name: 'CARTON BOX (THE SAME SKU)', event: 'ONCE', unit: 'carton', rate: 4.5, active: true },
    ])
  // Dialog controls
  const [openAddCustom, setOpenAddCustom] = useState(false)
  const [openBulkImport, setOpenBulkImport] = useState(false)

  // Form state for add
  const [newCustom, setNewCustom] = useState<ClientCustomService>({
    id: '',
    category: 'UNLOADING',
    name: '',
    event: 'ONCE',
    unit: 'unit',
    rate: 0,
    active: true,
  })

  const addCustomService = () => {
    if (!newCustom.name.trim()) return
    const id = `cs_${Math.random().toString(36).slice(2,8)}`
    setCustomServices(prev => [...prev, { ...newCustom, id }])
    setOpenAddCustom(false)
    setNewCustom({
      id: '',
      category: 'UNLOADING',
      name: '',
      event: 'ONCE',
      unit: 'unit',
      rate: 0,
      active: true,
    })
  }

  const removeCustomService = (id: string) => setCustomServices(prev => prev.filter(s => s.id !== id))

  // Bulk import (CSV lines: name,unit,rate)
  const [bulkText, setBulkText] = useState('')
  const runBulkImport = () => {
    const rows = bulkText.split(/\r?\n/).map(l => l.trim()).filter(Boolean)
    const parsed: ClientCustomService[] = []
    for (const line of rows) {
      const [name, unit, rateStr] = line.split(',').map(s => s?.trim())
      if (!name) continue
      const rate = Number(rateStr || 0)
      parsed.push({
        id: `cs_${Math.random().toString(36).slice(2,8)}`,
        category: 'UNLOADING',
        name,
        event: 'ONCE',
        unit: unit || 'unit',
        rate: isNaN(rate) ? 0 : rate,
        active: true,
      })
    }
    if (parsed.length) setCustomServices(prev => [...prev, ...parsed])
    setOpenBulkImport(false)
    setBulkText('')
  }

  // Helper: group categories
  const categories = useMemo(() => Array.from(new Set(customServices.map(s => s.category))), [customServices])

  const handleSaveConfig = async () => {
    const updated = await saveConfig(form)
    if (updated) {
      setConfig(updated as BillingConfig)
      // eslint-disable-next-line no-alert
      alert('Client billing config saved.')
    } else if (lastError) {
      // eslint-disable-next-line no-alert
      alert(lastError)
    }
  }

  const onReset = () => {
    setForm(deriveFormFromConfig(config))
  }

  return (
    <div className="p-8 space-y-6">
      {/* Header */}
      <ClientPageHeader
  clientLabel={clientLabel}
  clientLogo={clientLogo}
  title="Client Config"
  subtitle={`Manage billing settings for ${clientLabel}.`}
  actions={
    <>
      <Link href="/billing/clients">
        <Button variant="outline">Back to Clients</Button>
      </Link>
      <Button
        variant="outline"
        onClick={() => router.push(`/billing/simulator?clientId=${id}`)}
      >
        Test Rules (Simulator)
      </Button>
      <Button onClick={handleSaveConfig} disabled={savingConfig}>
        {savingConfig ? 'Saving…' : 'Save'}
      </Button>
    </>
  }
/>

      <Tabs defaultValue="billing" className="w-full">
        <TabsList>
          <TabsTrigger value="billing">Billing Method</TabsTrigger>
          <TabsTrigger value="discounts">Discounts</TabsTrigger>
          <TabsTrigger value="taxes">Taxes</TabsTrigger>
          <TabsTrigger value="cycle">Invoice Cycle</TabsTrigger>
          <TabsTrigger value="template">Template</TabsTrigger>
          <TabsTrigger value="pricing_overrides">Pricing Overrides</TabsTrigger>
        </TabsList>

        {/* Billing Method */}
        <TabsContent value="billing" className="space-y-4">
          <Card className="p-6 space-y-4 bg-white">
            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <Label className="text-base">Billing active</Label>
                <p className="text-sm text-muted-foreground">Enable/disable billing for this client.</p>
              </div>
              <Switch checked={form.billingActive} onCheckedChange={(v) => setForm({ ...form, billingActive: v })} />
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <Label>Billing method</Label>
                <Select value={form.method} onValueChange={(v: 'prepaid' | 'postpaid') => setForm({ ...form, method: v })}>
                  <SelectTrigger className="mt-1"><SelectValue placeholder="Select method" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="prepaid">Prepaid</SelectItem>
                    <SelectItem value="postpaid">Postpaid</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Minimum monthly fee (USD)</Label>
                <Input
                  className="mt-1"
                  value={form.minMonthlyFee}
                  onChange={(e) => {
                    const n = Number(e.target.value)
                    setForm({ ...form, minMonthlyFee: Number.isFinite(n) ? n : 0 })
                  }}
                  type="number"
                  min={0}
                />
              </div>
              <div>
                <Label>Pricing plan</Label>
                <Select value={selectedPlanId} onValueChange={(v) => setSelectedPlanId(v)}>
                  <SelectTrigger className="mt-1"><SelectValue placeholder="Select plan" /></SelectTrigger>
                  <SelectContent>
                    {pricingPlans.map((p) => (
                      <SelectItem key={p.id} value={p.id}>{p.name}{p.isDefault ? ' (default)' : ''}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </Card>
          <div className="flex gap-2 justify-end">
            <Button variant="outline" onClick={onReset}>Reset</Button>
            <Button onClick={handleSaveConfig} disabled={savingConfig}>
              {savingConfig ? 'Saving…' : 'Save changes'}
            </Button>
          </div>
        </TabsContent>

        {/* Discounts */}
        <TabsContent value="discounts" className="space-y-4">
          <Card className="p-6 space-y-4 bg-white">
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <Label>Discount (%)</Label>
                <Input
                  className="mt-1"
                  value={form.discountPct}
                  onChange={(e) => setForm({ ...form, discountPct: Number(e.target.value || 0) })}
                  type="number"
                  min={0}
                  max={100}
                />
              </div>
              <div className="self-end text-sm text-muted-foreground">
                Apply a global discount across invoice items (applied after item rates).
              </div>
            </div>
          </Card>
          <div className="flex gap-2 justify-end">
            <Button variant="outline" onClick={onReset}>Reset</Button>
            <Button onClick={handleSaveConfig} disabled={savingConfig}>
              {savingConfig ? 'Saving…' : 'Save changes'}
            </Button>
          </div>
        </TabsContent>

        {/* Taxes */}
        <TabsContent value="taxes" className="space-y-4">
          <Card className="p-6 space-y-4 bg-white">
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <Label className="text-base">Tax exempt</Label>
                  <p className="text-sm text-muted-foreground">If enabled, taxes will not be applied.</p>
                </div>
                <Switch checked={form.taxExempt} onCheckedChange={(v) => setForm({ ...form, taxExempt: v })} />
              </div>
              <div>
                <Label>Tax ID (EIN/CNPJ)</Label>
                <Input className="mt-1" value={form.taxId} onChange={(e) => setForm({ ...form, taxId: e.target.value })} />
              </div>
            </div>
          </Card>
          <div className="flex gap-2 justify-end">
            <Button variant="outline" onClick={onReset}>Reset</Button>
            <Button onClick={handleSaveConfig} disabled={savingConfig}>
              {savingConfig ? 'Saving…' : 'Save changes'}
            </Button>
          </div>
        </TabsContent>

        {/* Invoice Cycle */}
        <TabsContent value="cycle" className="space-y-4">
          <Card className="p-6 space-y-4 bg-white">
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <Label>Invoice cycle</Label>
                <Select value={form.invoiceCycle} onValueChange={(v: 'monthly' | 'biweekly' | 'weekly') => setForm({ ...form, invoiceCycle: v })}>
                  <SelectTrigger className="mt-1"><SelectValue placeholder="Select cycle" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="monthly">Monthly</SelectItem>
                    <SelectItem value="biweekly">Biweekly</SelectItem>
                    <SelectItem value="weekly">Weekly</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Cut-off day</Label>
                <Input
                  className="mt-1"
                  value={form.cutDay}
                  onChange={(e) => setForm({ ...form, cutDay: Number(e.target.value || 1) })}
                  onBlur={() => {
                    setForm(prev => {
                      let v = Number(prev.cutDay || 1)
                      if (Number.isNaN(v)) v = 1
                      if (v < 1) v = 1
                      if (v > 31) v = 31
                      return { ...prev, cutDay: v }
                    })
                  }}
                  type="number"
                  min={1}
                  max={31}
                />
              </div>
            </div>
          </Card>
          <div className="flex gap-2 justify-end">
            <Button variant="outline" onClick={onReset}>Reset</Button>
            <Button onClick={handleSaveConfig} disabled={savingConfig}>
              {savingConfig ? 'Saving…' : 'Save changes'}
            </Button>
          </div>
        </TabsContent>

        {/* Template */}
        <TabsContent value="template" className="space-y-4">
          <Card className="p-6 space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <Label>Primary color</Label>
                <Input
                  className="mt-1"
                  value={form.templatePrimary}
                  onChange={(e) => setForm({ ...form, templatePrimary: e.target.value })}
                  type="text"
                  placeholder="#3f2d90"
                />
              </div>
              <div className="self-end text-sm text-muted-foreground">
                Used in invoice header and accents.
              </div>
            </div>
            </Card>
  <div className="flex gap-2 justify-end">
    <Button variant="outline" onClick={onReset}>Reset</Button>
    <Button onClick={handleSaveConfig}>Save changes</Button>
  </div>
</TabsContent>

        {/* Pricing Overrides */}
        <TabsContent value="pricing_overrides" className="space-y-4">
          {configLoading && (
            <Card className="p-4 text-sm text-muted-foreground">Loading billing config…</Card>
          )}
          {configError && (
            <Card className="p-4 text-sm text-destructive">{configError}</Card>
          )}
          {config && (
            <Card className="p-6 grid gap-4 sm:grid-cols-2 bg-white">
              <div>
                <Label className="text-xs uppercase text-muted-foreground">Assigned warehouse</Label>
                <div className="text-sm font-medium">
                {(() => {
  if (!config?.assigned_warehouse) return FALLBACK_WAREHOUSE_LABEL
  const found = warehouseOptions.find(w => w.id === String(config.assigned_warehouse))
  return found?.name ?? String(config.assigned_warehouse)
})()}
                </div>
              </div>
              <div>
                <Label className="text-xs uppercase text-muted-foreground">Billing frequency</Label>
                <div className="text-sm font-medium">{config.billing_frequency ?? '—'}</div>
              </div>
              <div>
                <Label className="text-xs uppercase text-muted-foreground">Cut-off day</Label>
                <div className="text-sm font-medium">{config.monthly_billing_day ?? '—'}</div>
              </div>
              <div>
                <Label className="text-xs uppercase text-muted-foreground">Rate card</Label>
                <div className="text-sm font-medium break-all">{config.rate_card_id ?? '—'}</div>
              </div>
              <div className="sm:col-span-2">
                <Label className="text-xs uppercase text-muted-foreground">Enabled services</Label>
                <div className="mt-1 flex flex-wrap gap-2">
                  {config.enabled_services?.length ? (
                    config.enabled_services.map((service: string) => (
                      <Badge key={service} variant={enabledServices.has(service) ? 'default' : 'secondary'}>
                        {service.toUpperCase()}
                      </Badge>
                    ))
                  ) : (
                    <span className="text-sm text-muted-foreground">All services enabled</span>
                  )}
                </div>
              </div>
            </Card>
          )}
          <Card className="p-6 bg-white">
            <div className="mb-3 flex items-center justify-between gap-3 flex-wrap">
              <div className="text-sm font-medium">Service Overrides</div>
              <div className="flex items-center gap-2 flex-wrap">
                <Button size="sm" variant="outline" onClick={expandAllCats}>Expand all</Button>
                <Button size="sm" variant="outline" onClick={collapseAllCats}>Collapse all</Button>
                <div className="text-xs text-muted-foreground">Warehouse</div>
                <Select value={selectedWh} onValueChange={setSelectedWh}>
                  <SelectTrigger className="w-56"><SelectValue placeholder="Select warehouse" /></SelectTrigger>
                  <SelectContent>
                  {warehouseOptions.map((w) => (
  <SelectItem key={w.id} value={w.id}>{w.name}</SelectItem>
))}
                  </SelectContent>
                </Select>
                {/* <Button size="sm" variant="outline" onClick={() => setOpenBulkImport(true)}>Bulk import</Button>
                <Button size="sm" onClick={() => setOpenAddCustom(true)}>Add custom service</Button>*/}
              </div>
            </div>
            <div className="space-y-4">
              {svcCategories.map((cat) => {
                const catServices = servicesCatalog.filter(s => s.category === cat)
                const hiddenCount = catServices.filter(s => isHidden(s.id)).length
                const overrideCount = catServices.filter(s => overrides.some(o => o.planServiceId === s.id && o.overrideRate !== undefined)).length
                const isOpen = openCats[cat] ?? true
                return (
                  <div key={cat} className="rounded-md border">
                    <details open={isOpen}>
                      <summary onClick={() => setOpenCats(prev => ({ ...prev, [cat]: !isOpen }))} className="cursor-pointer select-none px-4 py-3 flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <span className="text-xs uppercase text-muted-foreground tracking-wider">{cat}</span>
                          <span className="text-xs text-muted-foreground">• {catServices.length} items</span>
                          {hiddenCount > 0 && <span className="text-xs">• Hidden: {hiddenCount}</span>}
                          {overrideCount > 0 && <span className="text-xs">• Overrides: {overrideCount}</span>}
                        </div>
                        <span className="text-xs text-muted-foreground">{isOpen ? 'Click to collapse' : 'Click to expand'}</span>
                      </summary>
                      <div className="px-4 pb-4">
                        <div className="overflow-x-auto">
                          <table className="w-full text-sm">
                            <thead className="text-muted-foreground">
                              <tr className="text-left border-b">
                                <th className="py-2 pr-3">Service</th>
                                <th className="py-2 pr-3">Unit</th>
                                <th className="py-2 pr-3">Default rate</th>
                                <th className="py-2 pr-3">Override rate</th>
                                <th className="py-2 pr-3">Effective rate</th>
                                <th className="py-2 pr-3">Status</th>
                                <th className="py-2 pr-3">Hide</th>
                                <th className="py-2 text-right">Actions</th>
                              </tr>
                            </thead>
                            <tbody>
                              {catServices.map((srv) => {
                                const eff = resolveServiceRate(srv.id, adapterPlanServices as any, overrides, effById)
                                const currentOverride = overrides.find(o => o.planServiceId === srv.id)
                                const hidden = ((effById[srv.id] as any)?.visible === false) ? true : isHidden(srv.id)
                                return (
                                  <tr key={srv.id} className="border-b last:border-0">
                                    <td className="py-2 pr-3 font-medium min-w-[240px]">{srv.name}</td>
                                    <td className="py-2 pr-3">{srv.unit}</td>
                                    <td className="py-2 pr-3">{currency(srv.defaultRate)}</td>
                                    <td className="py-2 pr-3 w-40">
                                      <Input
                                        type="number"
                                        step="0.01"
                                        value={currentOverride?.overrideRate ?? ''}
                                        placeholder="—"
                                        onChange={(e) => {
                                          const val = e.target.value
                                          if (val === '') setOverrideRate(srv.id, undefined)
                                          else setOverrideRate(srv.id, Number(val))
                                        }}
                                      />
                                    </td>
                                    <td className="py-2 pr-3">{typeof eff?.rate === 'number' ? currency(eff.rate) : '—'}</td>
                                    <td className="py-2 pr-3">{hidden ? <span className="text-muted-foreground">Hidden</span> : (eff?.active ? <span className="text-green-700">Active</span> : <span className="text-muted-foreground">Inactive</span>)}</td>
                                    <td className="py-2 pr-3"><Switch checked={hidden} onCheckedChange={(v) => toggleHidden(srv.id, v)} /></td>
                                    <td className="py-2 text-right"><Button size="sm" variant="outline" onClick={() => resetOverride(srv.id)}>Reset</Button></td>
                                  </tr>
                                )
                              })}
                              {catServices.length === 0 && (
                                <tr>
                                  <td colSpan={8} className="py-4 text-center text-muted-foreground">No services in this category.</td>
                                </tr>
                              )}
                            </tbody>
                          </table>
                        </div>
                      </div>
                    </details>
                  </div>
                )
              })}
            </div>
            
          </Card>
          <div className="flex gap-2 justify-end">
            <Button
              disabled={savingOverrides}
              onClick={async () => {
                if (!selectedWh) return
                const list = await saveOverrides({
                  selectedWarehouseId: selectedWh,
                  servicesCatalog,
                  overrides,
                })
                if (list) {
                  setEffectiveServices(list)
                  // eslint-disable-next-line no-alert
                  alert('Overrides saved.')
                } else if (lastError) {
                  // eslint-disable-next-line no-alert
                  alert(lastError)
                }
              }}
            >
              {savingOverrides ? 'Saving…' : 'Save overrides'}
            </Button>
          </div>
          <Dialog open={openAddCustom} onOpenChange={setOpenAddCustom}>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Add custom service</DialogTitle>
                <DialogDescription>Create a service specific to this client.</DialogDescription>
              </DialogHeader>
              <div className="grid gap-3 sm:grid-cols-2">
                <div className="sm:col-span-2">
                  <Label>Service name</Label>
                  <Input className="mt-1" value={newCustom.name} onChange={(e) => setNewCustom({ ...newCustom, name: e.target.value })} />
                </div>
                <div>
                  <Label>Category</Label>
                  <Input className="mt-1" value={newCustom.category} onChange={(e) => setNewCustom({ ...newCustom, category: e.target.value })} />
                </div>
                <div>
                  <Label>Event</Label>
                  <Select value={newCustom.event} onValueChange={(v: 'ONCE' | 'PER_UNIT' | 'OTHER') => setNewCustom({ ...newCustom, event: v })}>
                    <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="ONCE">ONCE</SelectItem>
                      <SelectItem value="PER_UNIT">PER_UNIT</SelectItem>
                      <SelectItem value="OTHER">OTHER</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Unit</Label>
                  <Input className="mt-1" value={newCustom.unit} onChange={(e) => setNewCustom({ ...newCustom, unit: e.target.value })} />
                </div>
                <div>
                  <Label>Rate (USD)</Label>
                  <Input className="mt-1" type="number" step="0.01" value={newCustom.rate} onChange={(e) => setNewCustom({ ...newCustom, rate: Number(e.target.value || 0) })} />
                </div>
              </div>
              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={() => setOpenAddCustom(false)}>Cancel</Button>
                <Button onClick={addCustomService}>Add</Button>
              </div>
            </DialogContent>
          </Dialog>

          <Dialog open={openBulkImport} onOpenChange={setOpenBulkImport}>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Bulk import services</DialogTitle>
                <DialogDescription>Paste CSV lines in the format: <code>name, unit, rate</code></DialogDescription>
              </DialogHeader>
              <div>
                <Label>CSV</Label>
                <textarea
                  className="mt-1 w-full h-40 rounded-md border px-3 py-2 text-sm"
                  placeholder={"Pick & Pack, unit, 1.25\nInbound receiving (pallet), pallet, 18"}
                  value={bulkText}
                  onChange={(e) => setBulkText(e.target.value)}
                />
              </div>
              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={() => setOpenBulkImport(false)}>Cancel</Button>
                <Button onClick={runBulkImport}>Import</Button>
              </div>
            </DialogContent>
          </Dialog>
        </TabsContent>
      </Tabs>
    </div>
  )
}

        