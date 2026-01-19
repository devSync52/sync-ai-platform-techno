'use client'

import { useParams } from 'next/navigation'
import Link from 'next/link'
import React, { useEffect, useMemo, useState, useCallback } from 'react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { ClientPageHeader } from '@/components/billing/client-page-header'
import { Trash, Pencil, Check, X } from 'lucide-react'

interface InvoiceItem {
  id: string
  description: string
  qty: number
  unit: string | null
  rate_cents: number
  amount_cents: number
  occurred_at: string
  usage_kind: string
  metadata: any
}

interface InvoiceData {
  invoice: {
    id: string
    status: string
    period: string
    subtotal_cents: number
    tax_cents: number
    total_cents: number
    created_at: string
    due_date: string | null
    issue_date: string
    warehouse_id?: string | null
    client_name?: string | null
    client_code?: string | null
    client_logo_url?: string | null
  }
  items: InvoiceItem[]
}

interface ServiceOption {
  id: string
  warehouseServiceId: string
  category: string
  name: string
  unit: string
  rateCents: number
  rateUsd: number
}

export default function InvoiceDetailPage() {
  const { invoiceId } = useParams()

  const [data, setData] = useState<InvoiceData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const [services, setServices] = useState<ServiceOption[]>([])
  const [servicesLoading, setServicesLoading] = useState(false)
  const [servicesError, setServicesError] = useState<string | null>(null)

  const [showAddServiceForm, setShowAddServiceForm] = useState(false)
  const [selectedServiceId, setSelectedServiceId] = useState<string>('')
  const [serviceQty, setServiceQty] = useState<string>('1')
  const [serviceRateUsd, setServiceRateUsd] = useState<string>('')
  const [serviceSaving, setServiceSaving] = useState(false)
  const [serviceDate, setServiceDate] = useState<string>('')

  const [expandedCategories, setExpandedCategories] = useState<
    Record<'unloading' | 'inbound' | 'storage' | 'outbound' | 'replacement' | 'return' | 'insurance' | 'extra', boolean>
  >({
    unloading: true,
    inbound: true,
    storage: true,
    outbound: true,
    replacement: true,
    return: false,
    insurance: false,
    extra: false,
  })
  function isReplacementItem(item: InvoiceItem): boolean {
    const meta = (item.metadata || {}) as any

    // Primary signal coming from your unified usage view:
    // order_id = 'REPLACEMENT'
    const orderId = String(meta.order_id ?? meta.orderId ?? '').toUpperCase()
    if (orderId === 'REPLACEMENT') return true

    // Secondary: usage id text sometimes carries it (e.g. outbound-*-REPLACEMENT)
    const usageId = String((item as any).usage_id ?? meta.usage_id ?? meta.usageId ?? '')
    const usageIdText = String((item as any).usage_id_text ?? (item as any).usageIdText ?? '')
    const combinedIds = `${usageId} ${usageIdText} ${String((item as any).usage_id_text ?? '')}`.toUpperCase()
    if (combinedIds.includes('REPLACEMENT')) return true

    // Fallback: description/type label heuristics
    const typeLabel = String(meta.type_label ?? meta.typeLabel ?? '').toUpperCase()
    const desc = String(item.description ?? '').toUpperCase()
    const hay = `${typeLabel} ${desc}`
    if (hay.includes('REPLACEMENT')) return true

    return false
  }

  const [expandedOutboundGroups, setExpandedOutboundGroups] = useState<Record<string, boolean>>({})
  const [bulkRateUsdByGroup, setBulkRateUsdByGroup] = useState<Record<string, string>>({})
  const [bulkApplyLoadingByGroup, setBulkApplyLoadingByGroup] = useState<Record<string, boolean>>({})
  const handleApplyBulkRate = async (
    groupKey: string,
    displayLabel: string,
    itemsToUpdate: InvoiceItem[]
  ) => {
    if (!data) return

    const rawUsd = (bulkRateUsdByGroup[groupKey] ?? '').trim()
    const rateUsd = Number(rawUsd)

    if (!rawUsd || !Number.isFinite(rateUsd) || rateUsd < 0) {
      alert('Please enter a valid rate in USD (e.g. 0.30).')
      return
    }

    const rateCents = Math.round(rateUsd * 100)

    if (typeof window !== 'undefined') {
      const confirmed = window.confirm(
        `Apply rate $${rateUsd.toFixed(2)} to all ${itemsToUpdate.length} items in ${displayLabel}?`
      )
      if (!confirmed) return
    }

    setBulkApplyLoadingByGroup((prev) => ({ ...prev, [groupKey]: true }))

    try {
      // Patch all items in the subgroup
      await Promise.all(
        itemsToUpdate.map((it) =>
          fetch(`/api/billing/invoice-items/${it.id}`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ rate_cents: rateCents }),
          }).then(async (res) => {
            const json = await res.json().catch(() => ({}))
            if (!res.ok || !json?.success) {
              throw new Error(json?.message || `Failed to update item ${it.id}`)
            }
          })
        )
      )

      // Recalculate invoice totals after bulk update
      await fetch('/api/billing/invoice/recalculate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ invoiceId }),
      })

      // Reload invoice once
      const reloadRes = await fetch(`/api/billing/invoice/${invoiceId}`)
      const reloadJson = await reloadRes.json()
      if (reloadRes.ok && reloadJson.success) {
        setData(reloadJson.data)
      } else {
        alert(reloadJson?.message || 'Updated items, but failed to reload invoice')
      }

      // Optional: clear input after apply
      setBulkRateUsdByGroup((prev) => ({ ...prev, [groupKey]: '' }))
    } catch (err: any) {
      alert(err?.message || 'Unexpected error while applying bulk rate')
    } finally {
      setBulkApplyLoadingByGroup((prev) => ({ ...prev, [groupKey]: false }))
    }
  }
  const [deletingItemId, setDeletingItemId] = useState<string | null>(null)
  const [editingItemId, setEditingItemId] = useState<string | null>(null)
  const [editDraft, setEditDraft] = useState<Partial<InvoiceItem>>({})
  const [shareLoading, setShareLoading] = useState(false)
  const [shareError, setShareError] = useState<string | null>(null)
  const [notice, setNotice] = useState<string | null>(null)
  const [issuing, setIssuing] = useState(false)

  function getCategoryKey(
    item: InvoiceItem
  ):
    | 'unloading'
    | 'inbound'
    | 'storage'
    | 'outbound'
    | 'replacement'
    | 'return'
    | 'insurance'
    | 'extra' {
    const meta = (item.metadata || {}) as any

    // Tenta descobrir o "usage" bruto de vários lugares possíveis
    const rawUsage =
      (item.usage_kind as any) ||
      (meta.usage_kind ?? meta.usageKind) ||
      (meta.category ?? meta.service_category ?? meta.global_category ?? meta.serviceCategory ?? meta.globalCategory) ||
      (item as any).usageKind ||
      (item as any).category ||
      ''

    let key = String(rawUsage || '').toLowerCase()


    const typeLabelRaw = (meta.type_label ?? meta.typeLabel ?? '') as string
    const typeLabel = typeLabelRaw.toLowerCase()

    const desc = (item.description || '').toLowerCase()


    // Função auxiliar para normalizar várias strings em uma das 7 categorias
    const normalize = (
      candidate: string | null | undefined
    ):
      | 'unloading'
      | 'inbound'
      | 'storage'
      | 'outbound'
      | 'replacement'
      | 'return'
      | 'insurance'
      | 'extra'
      | null => {
      if (!candidate) return null
      const c = candidate.toLowerCase()

      // Storage
      if (
        [
          'storage',
          'storage_daily',
          'storage_fee',
          'warehouse_storage',
          'warehouse storage',
          'cuft_day',
          'cuft-day',
        ].includes(c)
      )
        return 'storage'

      // Unloading (Crossdock + Drayage)
      if (
        [
          'unloading',
          'crossdock',
          'cross-dock',
          'cross dock',
          'crossdock_transfer',
          'cross-dock transfer',
          'crossdock transfer',
          'drayage',
        ].includes(c)
      )
        return 'unloading'

      // Inbound
      if (['inbound', 'barcode scanning', 'barcode_scanning', 'barcode', 'scanning'].includes(c))
        return 'inbound'

      // Outbound
      if (
        [
          'outbound',
          'ecommerce',
          'e-commerce',
          'e commerce',
          'shipping',
          'parcel',
          'fulfillment',
          'fulfillment unit',
          'e-commerce transaction',
          'ecommerce transaction',
          'retail transaction',
          'retail transaction (fba)',
          'labeling',
          'standard labeling',
          'wrapping',
        ].includes(c)
      )
        return isReplacementItem(item) ? 'replacement' : 'outbound'

      // Return
      if (['return', 'returns', 'returns processing', 'returns_processing'].includes(c))
        return 'return'

      // Insurance
      if (['insurance', 'returns_insurance', 'returns insurance'].includes(c)) return 'insurance'

      // Extras (supplies and anything explicitly marked)
      if (
        [
          'extra',
          'extras',
          'supplies',
          'packaging',
          'boxes',
          'mailer',
          'pallet',
        ].includes(c)
      )
        return 'extra'

      return null
    }

    // 1) Primeiro, tenta normalizar o usage_kind/category bruto
    let normalized = normalize(key)
    if (normalized) return normalized

    // 2) Se não deu, tenta normalizar o type_label do metadata
    normalized = normalize(typeLabel)
    if (normalized) return normalized

    // 3) Heurísticas pelo type_label (frases mais longas)
    if (typeLabel.includes('storage')) return 'storage'
    if (typeLabel.includes('drayage') || typeLabel.includes('cross-dock') || typeLabel.includes('crossdock'))
      return 'unloading'
    if (typeLabel.includes('inbound') || typeLabel.includes('barcode') || typeLabel.includes('scan'))
      return 'inbound'
    if (
      typeLabel.includes('outbound') ||
      typeLabel.includes('e-commerce') ||
      typeLabel.includes('ecommerce') ||
      typeLabel.includes('shipping') ||
      typeLabel.includes('fulfillment') ||
      typeLabel.includes('labeling') ||
      typeLabel.includes('wrapping')
    )
      return isReplacementItem(item) ? 'replacement' : 'outbound'
    if (typeLabel.includes('return')) return 'return'
    if (typeLabel.includes('insurance')) return 'insurance'

    // 4) Heurísticas pela descrição
    if (desc.includes('storage')) return 'storage'
    if (desc.includes('drayage') || desc.includes('cross-dock') || desc.includes('crossdock')) return 'unloading'
    if (desc.includes('inbound') || desc.includes('barcode') || desc.includes('scan') || desc.includes('scanning'))
      return 'inbound'
    if (
      desc.includes('outbound') ||
      desc.includes('shipment') ||
      desc.includes('ship') ||
      desc.includes('parcel') ||
      desc.includes('freight') ||
      desc.includes('fulfillment') ||
      desc.includes('label') ||
      desc.includes('wrapping')
    )
      return isReplacementItem(item) ? 'replacement' : 'outbound'
    if (desc.includes('return')) return 'return'
    if (desc.includes('insurance')) return 'insurance'

    // 5) Se ainda não classificou, cai em extra
    return 'extra'
  }

  function getOutboundSubLabel(item: InvoiceItem): string {
    const meta = (item.metadata || {}) as any
    const raw = String(
      meta.type_label ??
        meta.typeLabel ??
        meta.service_name ??
        meta.serviceName ??
        item.description ??
        ''
    ).toLowerCase()

    if (
      raw.includes('outbound_ecom') ||
      raw.includes('outbound-ecom') ||
      raw.includes('outbound ecom')
    ) {
      return 'E-commerce Transaction'
    }

    if (
      raw.includes('outbound_fulfillment') ||
      raw.includes('outbound-fulfillment') ||
      raw.includes('fulfillment unit') ||
      raw.includes('fulfillment units')
    ) {
      return 'Fulfillment Units'
    }

    if (raw.includes('standard labeling') || (raw.includes('labeling') && !raw.includes('barcode'))) {
      return 'Standard Labeling'
    }

    if (raw.includes('wrapping')) {
      return 'Wrapping'
    }

    if (raw.includes('retail transaction')) {
      return 'Retail Transaction (FBA)'
    }

    return 'Other'
  }

  const clientLabel =
    (data?.invoice as any)?.client_label ??
    data?.invoice.client_name ??
    data?.invoice.client_code ??
    String(invoiceId)

  const clientLogoRaw =
    (data?.invoice as any)?.client_logo_url ??
    (data?.invoice as any)?.logo_url ??
    null

  const clientLogo = clientLogoRaw ? String(clientLogoRaw) : null

  async function loadServicesForWarehouse(warehouseId: string) {
    setServicesLoading(true)
    setServicesError(null)
    try {
      const res = await fetch(`/api/billing/warehouses/${warehouseId}/services`)
      const json = await res.json()
      if (!res.ok || !json.success) {
        setServicesError(json.message || 'Failed to load services')
      } else {
        const rows = (json.data ?? []) as any[]
        setServices(
          rows.map((row) => ({
            id: String(row.id),
            warehouseServiceId: String(row.warehouseServiceId ?? row.warehouse_service_id ?? ''),
            category: String(row.category),
            name: String(row.name),
            unit: String(row.unit),
            rateCents: Number(row.rateCents ?? row.rate_cents ?? 0),
            rateUsd: Number(row.rateUsd ?? row.rate_usd ?? 0),
          }))
        )
      }
    } catch (err: any) {
      setServicesError(err.message || 'Unexpected error while loading services')
    } finally {
      setServicesLoading(false)
    }
  }

  useEffect(() => {
    async function load() {
      try {
        const res = await fetch(`/api/billing/invoice/${invoiceId}`)
        const json = await res.json()
        console.log('[invoice debug]', json)
  
        if (!res.ok || !json.success) {
          setError(json.message || 'Failed to load invoice')
          return
        }
  
        setData(json.data)
  
        const inv = json.data?.invoice as any

        // Set default service date based on invoice
        let defaultServiceDate = ''
        if (inv?.period_end) {
          defaultServiceDate = String(inv.period_end).slice(0, 10)
        } else if (inv?.issue_date) {
          defaultServiceDate = String(inv.issue_date).slice(0, 10)
        }
        if (defaultServiceDate) {
          setServiceDate(defaultServiceDate)
        }
  
        // 1) Primeiro tenta usar o warehouse diretamente da invoice
        let whId: string | null =
          (inv?.warehouse_id as string | null) ??
          (inv?.warehouseId as string | null) ??
          null
  
        // 2) Se a invoice não tiver warehouse, tenta buscar da billing config do client
        if (!whId && inv?.client_account_id) {
          try {
            const cfgRes = await fetch(`/api/billing/configs/${inv.client_account_id}`)
            const cfgJson = await cfgRes.json()
            if (cfgRes.ok && cfgJson?.config) {
              const cfg = cfgJson.config as any
              whId =
                (cfg.warehouse_id as string | null) ??
                (cfg.assigned_warehouse as string | null) ??
                null
            }
          } catch (cfgErr) {
            console.error(
              '[invoice] failed to load billing config for warehouse fallback',
              cfgErr
            )
          }
        }
  
        // 3) Se em algum lugar achamos um warehouse_id, carrega os serviços
        if (whId) {
          await loadServicesForWarehouse(String(whId))
        }
      } catch (err: any) {
        setError(err.message || 'Unexpected error')
      } finally {
        setLoading(false)
      }
    }
  
    load()
  }, [invoiceId])

  const categoryTotals = useMemo(() => {
    const totals: Record<'unloading' | 'inbound' | 'storage' | 'outbound' | 'replacement' | 'return' | 'insurance' | 'extra', number> = {
      unloading: 0,
      inbound: 0,
      storage: 0,
      outbound: 0,
      replacement: 0,
      return: 0,
      insurance: 0,
      extra: 0,
    }
    if (!data) return totals

    for (const item of data.items) {
      // PostgREST pode serializar bigint como string -> sempre converter
      const amount = Number(item.amount_cents ?? 0)
      const catKey = getCategoryKey(item)
      totals[catKey] += amount
    }

    return totals
  }, [data])

  const categoryCounts = useMemo(() => {
    const counts: Record<'unloading' | 'inbound' | 'storage' | 'outbound' | 'replacement' | 'return' | 'insurance' | 'extra', number> = {
      unloading: 0,
      inbound: 0,
      storage: 0,
      outbound: 0,
      replacement: 0,
      return: 0,
      insurance: 0,
      extra: 0,
    }

    if (!data) return counts

    for (const item of data.items) {
      const catKey = getCategoryKey(item)
      counts[catKey] += 1
    }

    return counts
  }, [data])

  const groupedItems = useMemo(() => {
    const groups: Record<string, InvoiceItem[]> = {}
    if (!data) return groups

    for (const item of data.items) {
      const key = getCategoryKey(item)
      if (!groups[key]) groups[key] = []
      groups[key].push(item)
    }

    return groups
  }, [data])

 // Compute subtotal and total from items on the client
  const computedSubtotalCents = useMemo(() => {
  if (!data) return 0
  return data.items.reduce((sum, item) => sum + (Number(item.amount_cents) || 0), 0)
}, [data])

const computedTotalCents = useMemo(() => {
  if (!data) return 0
  const tax = Number(data.invoice.tax_cents) || 0
  return computedSubtotalCents + tax
}, [data, computedSubtotalCents])

const categoryOrder: { key: string; label: string }[] = [
  { key: 'unloading', label: 'Unloading' },
  { key: 'inbound', label: 'Inbound' },
  { key: 'storage', label: 'Storage' },
  { key: 'outbound', label: 'Outbound' },
  { key: 'replacement', label: 'Replacement' },
  { key: 'return', label: 'Return' },
  { key: 'insurance', label: 'Insurance' },
  { key: 'extra', label: 'Extras' },
]

  // Issue Invoice logic
  const handleIssueInvoice = useCallback(async () => {
    if (!data?.invoice?.id) return
    setIssuing(true)
    setError(null)
    setNotice(null)
    try {
      const res = await fetch(`/api/billing/invoices/${data.invoice.id}/issue`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ invoiceId: data.invoice.id }),
      })
      const json = await res.json()
      if (!res.ok || !json.success) {
        setError(json.message || 'Failed to issue invoice')
        return
      }

      // Reload invoice data and update status
      const reloadRes = await fetch(`/api/billing/invoice/${data.invoice.id}`)
      const reloadJson = await reloadRes.json()
      if (reloadRes.ok && reloadJson.success) {
        setData(reloadJson.data)
      }

      setNotice('Invoice issued successfully.')

      if (typeof window !== 'undefined') {
        window.scrollTo({ top: 0, behavior: 'smooth' })
      }
    } catch (err: any) {
      setError(err.message || 'Unexpected error while issuing invoice')
    } finally {
      setIssuing(false)
    }
  }, [data])

  // Recalculate Totals logic
  const handleRecalculateTotals = useCallback(async () => {
    if (!data?.invoice?.id) return
    try {
      const res = await fetch('/api/billing/invoice/recalculate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ invoiceId: data.invoice.id })
      })
      const json = await res.json()
      if (!res.ok || !json.success) {
        setError(json.message || 'Failed to recalculate totals')
        return
      }
      // Reload invoice
      const reloadRes = await fetch(`/api/billing/invoice/${data.invoice.id}`)
      const reloadJson = await reloadRes.json()
      if (reloadRes.ok && reloadJson.success) {
        setData(reloadJson.data)
      }
    } catch (err: any) {
      setError(err.message || 'Unexpected error while recalculating totals')
    }
  }, [data])

  const handleShareInvoice = useCallback(async () => {
    if (!data?.invoice?.id) return

    setShareError(null)
    setShareLoading(true)

    try {
      const res = await fetch(`/api/billing/invoice/${data.invoice.id}/share`, {
        method: 'POST',
      })

      const json = await res.json()

      if (!res.ok || !json.success) {
        const msg = json.message || 'Failed to generate share link'
        setShareError(msg)
        alert(msg)
        return
      }

      const shareUrl: string = json.url || ''

      if (!shareUrl) {
        const msg = 'Share link generated, but URL is missing in the response.'
        setShareError(msg)
        alert(msg)
        return
      }

      if (typeof navigator !== 'undefined' && navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(shareUrl)
        alert('Public invoice link copied to clipboard!')
      } else if (typeof window !== 'undefined') {
        window.prompt('Copy this link:', shareUrl)
      }
    } catch (err: any) {
      const msg = err?.message || 'Unexpected error while generating share link'
      setShareError(msg)
      alert(msg)
    } finally {
      setShareLoading(false)
    }
  }, [data])

  const handleDeleteItem = async (itemId: string) => {
    if (!itemId) return
    if (typeof window !== 'undefined') {
      const confirmed = window.confirm('Are you sure you want to remove this line from the invoice?')
      if (!confirmed) return
    }

    setDeletingItemId(itemId)
    setError(null)

    try {
      const res = await fetch(`/api/billing/invoice-items/${itemId}`, {
        method: 'DELETE',
      })

      const json = await res.json()

      if (!res.ok || !json.success) {
        const msg = json.message || 'Failed to delete invoice item'
        console.error('[invoice-items/delete] error:', json)
        setError(msg)
        return
      }

      // Reload invoice to refresh items and totals
      const reloadRes = await fetch(`/api/billing/invoice/${invoiceId}`)
      const reloadJson = await reloadRes.json()
      if (reloadRes.ok && reloadJson.success) {
        setData(reloadJson.data)
      }
    } catch (err: any) {
      console.error('[invoice-items/delete] unexpected error:', err)
      setError(err.message || 'Unexpected error while deleting item')
    } finally {
      setDeletingItemId(null)
    }
  }
  const handleSaveEdit = async () => {
    if (!editingItemId || !data) return
    try {
      const payload = {
        qty: editDraft.qty,
        rate_cents: editDraft.rate_cents,
        description: editDraft.description,
        occurred_at: editDraft.occurred_at
      }
      const res = await fetch(`/api/billing/invoice-items/${editingItemId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      })
      const json = await res.json()
      if (!res.ok || !json.success) {
        alert(json.message || 'Failed to update invoice item')
        return
      }
      const reloadRes = await fetch(`/api/billing/invoice/${invoiceId}`)
      const reloadJson = await reloadRes.json()
      if (reloadRes.ok && reloadJson.success) {
        setData(reloadJson.data)
      }
      setEditingItemId(null)
      setEditDraft({})
    } catch (err: any) {
      alert(err.message || 'Unexpected error while updating item')
    }
  }
  const handleAddService = async () => {
    if (!data) return

    if (!selectedServiceId) {
      setServicesError('Please select a service')
      return
    }

    const qtyNum = Number(serviceQty || '0')
    if (!qtyNum || qtyNum <= 0) {
      setServicesError('Quantity must be greater than zero')
      return
    }

    const service = services.find((s) => s.id === selectedServiceId)
    if (!service) {
      setServicesError('Invalid service selected')
      return
    }

    const rateUsdNum = serviceRateUsd
      ? Number(serviceRateUsd)
      : service.rateUsd

    const rateCents = Math.round(rateUsdNum * 100)

    setServiceSaving(true)
    setServicesError(null)

    try {
      const occurredAt =
        serviceDate && serviceDate.trim()
          ? serviceDate
          : data.invoice.period && typeof data.invoice.period === 'string'
          ? data.invoice.period.split('–')[1]?.trim() || data.invoice.issue_date
          : data.invoice.issue_date

      const res = await fetch('/api/billing/invoice-items/add-service', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          invoiceId: data.invoice.id,
          globalServiceId: selectedServiceId,
          qty: qtyNum,
          rateCents,
          occurredAt,
        }),
      })

      const json = await res.json()
      if (!res.ok || !json.success) {
        setServicesError(json.message || 'Failed to add service')
        return
      }

      // Reload invoice to refresh items and totals
      const reloadRes = await fetch(`/api/billing/invoice/${invoiceId}`)
      const reloadJson = await reloadRes.json()
      if (reloadRes.ok && reloadJson.success) {
        setData(reloadJson.data)
      }

      setShowAddServiceForm(false)
      setSelectedServiceId('')
      setServiceQty('1')
      setServiceRateUsd('')
    } catch (err: any) {
      setServicesError(err.message || 'Unexpected error while adding service')
    } finally {
      setServiceSaving(false)
    }
  }

  return (
    <div className="p-8 space-y-6">
      {/* Header */}
      <ClientPageHeader
        clientLabel={clientLabel}
        clientLogo={clientLogo}
        title={`Invoice for ${clientLabel}`}
        subtitle={data?.invoice.period
          ? `Billing period ${data.invoice.period}`
          : 'Detailed view of the selected invoice.'}
        actions={
          <>
            
            <Button variant="outline">Send to Quickbooks</Button>
            <Button
              variant="outline"
              onClick={handleShareInvoice}
              disabled={shareLoading || !data}
            >
              {shareLoading ? 'Generating link…' : 'Share invoice'}
            </Button>
          </>
        }
      />

      {/* Invoice Summary */}
      {/* Invoice Summary */}
<Card className="p-6 space-y-6 bg-white">
  {loading && (
    <div className="text-sm text-muted-foreground">
      Loading invoice…
    </div>
  )}

  {error && (
    <div className="text-sm text-destructive">
      Error: {error}
    </div>
  )}
  {shareError && (
    <div className="text-sm text-destructive">
      Share error: {shareError}
    </div>
  )}
  {notice && (
    <div className="text-sm border border-green-200 bg-green-50 text-green-700 rounded-md px-3 py-2">
      {notice}
    </div>
  )}

  {data && (
    <>
      {/* Top row: meta da invoice + total */}
      <div className="flex flex-col md:flex-row justify-between gap-6">
        <div className="space-y-2">
          <p className="text-xs uppercase tracking-wide text-muted-foreground">
            Invoice
          </p>

          <h2 className="text-lg font-semibold">
            #{data.invoice.id.slice(0, 8)}
          </h2>

          <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
            <span>Period:</span>
            <span className="font-medium text-foreground">
              {data.invoice.period}
            </span>

            {data.invoice.issue_date && (
              <>
                <span className="mx-1">•</span>
                <span>
                  Issued on{' '}
                  {new Date(data.invoice.issue_date).toLocaleDateString(
                    'en-US',
                    { timeZone: 'UTC' }
                  )}
                </span>
              </>
            )}

            {data.invoice.due_date && (
              <>
                <span className="mx-1">•</span>
                <span>
                  Due{' '}
                  {new Date(data.invoice.due_date).toLocaleDateString(
                    'en-US',
                    { timeZone: 'UTC' }
                  )}
                </span>
              </>
            )}
          </div>
        </div>

        <div className="text-right space-y-2">
          <div className="flex items-center justify-end gap-2">
            <Badge
              variant={
                data.invoice.status === 'paid'
                  ? 'default'
                  : data.invoice.status === 'draft'
                  ? 'outline'
                  : 'secondary'
              }
              className="uppercase tracking-wide text-[11px] px-2 py-1"
            >
              {data.invoice.status}
            </Badge>
          </div>

          <div>
            <p className="text-xs text-muted-foreground">
              Invoice total
            </p>
            <p className="text-2xl font-semibold">
              ${(computedTotalCents / 100).toFixed(2)}
            </p>
            <p className="text-[11px] text-muted-foreground">
              Subtotal ${(computedSubtotalCents / 100).toFixed(2)} · Tax{' '}
              ${(data.invoice.tax_cents / 100).toFixed(2)}
            </p>
          </div>
        </div>
      </div>

      {/* Category summary */}
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-4 text-xs pt-4 border-t mt-4">
        {categoryOrder.map((cat) => {
          const key = cat.key as
            | 'unloading'
            | 'inbound'
            | 'storage'
            | 'outbound'
            | 'replacement'
            | 'return'
            | 'insurance'
            | 'extra'
          return (
            <div key={cat.key} className="rounded-md border bg-muted/40 px-3 py-2">
              <p className="text-[11px] text-muted-foreground uppercase tracking-wide">
                {cat.label}
              </p>
              <p className="text-xl font-semibold">
                ${(categoryTotals[key] / 100).toFixed(2)}
              </p>
              <p className="text-[11px] text-muted-foreground">
                {categoryCounts[key]} item
                {categoryCounts[key] === 1 ? '' : 's'}
              </p>
            </div>
          )
        })}
      </div>

    </>
  )}
</Card>

      {/* Items Table */}
      <Card className="p-6 bg-white">
        <div className="flex items-center justify-between mb-3">
          <div className="text-xl font-medium">Invoice Items</div>
          <div className="flex gap-2">
            {/* <Button
              className="bg-primary text-white"
              variant="outline"
              size="sm"
              onClick={handleRecalculateTotals}
              disabled={loading || !data}
            >
              Recalculate Totals
            </Button> */}
            <Button className="bg-primary text-white"
              variant="outline"
              size="sm"
              onClick={() => setShowAddServiceForm((prev) => !prev)}
              disabled={servicesLoading || !data}
            >
              {showAddServiceForm ? 'Cancel' : 'Add Service'}
            </Button>
          </div>
        </div>

        {showAddServiceForm && (
          <div className="mb-4 border rounded-md p-3 bg-muted/30 space-y-2">
            <div className="grid sm:grid-cols-5 gap-3 text-xs sm:text-sm">
              <div className="sm:col-span-2">
                <label className="block mb-1 text-muted-foreground">Service</label>
                <select
                  className="w-full border rounded px-2 py-1 bg-background"
                  value={selectedServiceId}
                  onChange={(e) => setSelectedServiceId(e.target.value)}
                >
                  <option value="">Select a service…</option>
                  {services.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.category} – {s.name} {/*({s.unit}) @ ${s.rateUsd.toFixed(2)*/}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block mb-1 text-muted-foreground">Quantity</label>
                <input
                  type="number"
                  min={0}
                  step="0.01"
                  value={serviceQty}
                  onChange={(e) => setServiceQty(e.target.value)}
                  className="w-full border rounded px-2 py-1 bg-background"
                />
              </div>
              <div>
                <label className="block mb-1 text-muted-foreground">Date</label>
                <input
                  type="date"
                  value={serviceDate}
                  onChange={(e) => setServiceDate(e.target.value)}
                  className="w-full border rounded px-2 py-1 bg-background"
                />
              </div>
              <div>
                <label className="block mb-1 text-muted-foreground">Rate (USD)</label>
                <input
                  type="number"
                  min={0}
                  step="0.01"
                  value={serviceRateUsd}
                  placeholder={
                    selectedServiceId
                      ? (() => {
                          const svc = services.find((s) => s.id === selectedServiceId)
                          return svc ? svc.rateUsd.toFixed(2) : ''
                        })()
                      : ''
                  }
                  onChange={(e) => setServiceRateUsd(e.target.value)}
                  className="w-full border rounded px-2 py-1 bg-background"
                />
              </div>
            </div>
            {servicesError && (
              <div className="text-xs text-destructive mt-1">{servicesError}</div>
            )}
            <div className="flex justify-end mt-2">
              <Button
                size="sm"
                onClick={handleAddService}
                disabled={serviceSaving || servicesLoading}
              >
                {serviceSaving ? 'Saving…' : 'Add to Invoice'}
              </Button>
            </div>
          </div>
        )}

        <div className="overflow-x-auto">
  <table className="w-full text-sm border-separate border-spacing-0">
    <thead className="text-xs text-muted-foreground sticky top-0 z-10">
      <tr className="text-left bg-gray-100 border-b">
        <th className="py-3 pr-3 font-medium text-right">Item</th>
        <th className="py-3 pr-3 font-medium text-right">Date</th>
        <th className="py-3 pr-3 font-medium text-right">Description</th>
        <th className="py-3 pr-3 font-medium text-right">Quantity</th>
        <th className="py-3 pr-3 font-medium text-right">Rate</th>
        <th className="py-3 pr-3 font-medium text-right">Subtotal</th>
        <th className="py-3 pr-6 font-medium text-right">Actions</th>
      </tr>
    </thead>
    <tbody>
            {data &&
  categoryOrder.map((cat) => {
    const items = groupedItems[cat.key] || []
    if (!items.length) return null

    const itemCount = items.length
    const catKey = cat.key as
      | 'unloading'
      | 'inbound'
      | 'storage'
      | 'outbound'
      | 'replacement'
      | 'return'
      | 'insurance'
      | 'extra'
    const expanded = expandedCategories[catKey]

    const totalCents = categoryTotals[catKey] || 0

    return (
      <React.Fragment key={cat.key}>
        <tr className="align-right bg-gray-50 border-b-2">
          <td
            colSpan={3}
            className="pt-4 pb-2 pl-4 text-base font-semibold uppercase"
          >
            {cat.label}
            <span className="ml-2 font-normal normal-case text-[11px] text-muted-foreground/80">
              ({itemCount} item{itemCount === 1 ? '' : 's'})
            </span>
          </td>

          {/* Coluna Quantity: só mostra quando está COLAPSADO */}
          <td className="pt-4 pb-2 text-xs text-right text-muted-foreground">
            {!expanded && (
              <span>
                {/* itemCount aqui também */}
                {/* {itemCount} items */}
              </span>
            )}
          </td>

          {/* Coluna Rate fica vazia no resumo */}
          <td className="pt-4 pb-2" />

          {/* Coluna Subtotal: sempre mostra o total da categoria */}
          {catKey === 'extra' ? (
            // Bulk Rate para Extras
            <td className="pt-4 pb-2 text-right">
              <div className="flex flex-wrap items-center justify-end gap-2">
                <span className="text-lg font-semibold">
                  ${(totalCents / 100).toFixed(2)}
                </span>

                {expanded && (
                  <div className="flex items-center gap-1">
                    <span className="text-[11px] text-muted-foreground">Rate</span>
                    <input
                      type="number"
                      min={0}
                      step="0.01"
                      className="border rounded px-2 py-1 text-xs w-20 bg-background"
                      placeholder={(() => {
                        const first = items[0]
                        if (!first) return ''
                        const allSame = items.every((it) => it.rate_cents === first.rate_cents)
                        return allSame ? (first.rate_cents / 100).toFixed(2) : '—'
                      })()}
                      value={bulkRateUsdByGroup['__extras__'] ?? ''}
                      onChange={(e) =>
                        setBulkRateUsdByGroup((prev) => ({
                          ...prev,
                          ['__extras__']: e.target.value,
                        }))
                      }
                    />
                    <button
                      type="button"
                      className="text-[11px] px-2 py-1 border bg-white rounded-md text-muted-foreground hover:bg-muted disabled:opacity-50"
                      disabled={!!bulkApplyLoadingByGroup['__extras__'] || items.length === 0}
                      onClick={() => handleApplyBulkRate('__extras__', 'EXTRAS', items)}
                    >
                      {bulkApplyLoadingByGroup['__extras__'] ? 'Applying…' : 'Apply to all'}
                    </button>
                  </div>
                )}

                <button
                  type="button"
                  className="text-[11px] px-2 py-1 border bg-white rounded-md text-muted-foreground hover:bg-muted"
                  onClick={() =>
                    setExpandedCategories((prev) => ({
                      ...prev,
                      extra: !expanded,
                    }))
                  }
                >
                  {expanded ? 'Hide details' : 'Show details'}
                </button>
              </div>
            </td>
          ) : (
            <td className="pt-4 pb-2 text-right">
              <div className="flex items-center justify-end gap-2">
                <span className="text-lg font-semibold">
                  ${(totalCents / 100).toFixed(2)}
                </span>
                <button
                  type="button"
                  className="text-[11px] px-2 py-1 border bg-white rounded-md text-muted-foreground hover:bg-muted"
                  onClick={() =>
                    setExpandedCategories((prev) => ({
                      ...prev,
                      [catKey]: !expanded,
                    }))
                  }
                >
                  {expanded ? 'Hide details' : 'Show details'}
                </button>
              </div>
            </td>
          )}
          <td className="pt-4 pb-2" />
        </tr>

          {/* Linhas da categoria (só quando expandida) */}
          {expanded &&
            (catKey === 'outbound' || catKey === 'replacement'
              ? (() => {
                  // Group OUTBOUND items by sub-service
                  const groups = new Map<
                    string,
                    { items: InvoiceItem[]; totalCents: number; totalQty: number }
                  >()

                  for (const it of items) {
                    const label = getOutboundSubLabel(it)
                    const prev = groups.get(label) ?? { items: [], totalCents: 0, totalQty: 0 }
                    prev.items.push(it)
                    prev.totalCents += Number(it.amount_cents ?? 0)
                    prev.totalQty += Number(it.qty ?? 0)
                    groups.set(label, prev)
                  }

                  // Stable order: common ones first, then the rest
                  const preferredOrder = [
                    'E-commerce Transaction',
                    'Fulfillment Units',
                    'Retail Transaction (FBA)',
                    'Standard Labeling',
                    'Wrapping',
                    'Other',
                  ]

                  const ordered = Array.from(groups.entries()).sort((a, b) => {
                    const ai = preferredOrder.indexOf(a[0])
                    const bi = preferredOrder.indexOf(b[0])
                    if (ai === -1 && bi === -1) return a[0].localeCompare(b[0])
                    if (ai === -1) return 1
                    if (bi === -1) return -1
                    return ai - bi
                  })

                  let globalIndex = 0

                  const formatQty = (n: number) => {
                    if (!Number.isFinite(n)) return '0'
                    return Math.floor(n) === n ? String(n) : n.toFixed(2)
                  }

                  const shouldShowQtyInHeader = (label: string) =>
                    label === 'Fulfillment Units' || label === 'Standard Labeling' || label === 'Wrapping'

                  return ordered.map(([label, payload]) => {
                    const groupKey = `${catKey}:${label}`
                    const displayLabel = `${catKey === 'replacement' ? 'REPLACEMENT' : 'OUTBOUND'} – ${label}`
                    const subExpanded = expandedOutboundGroups[groupKey] ?? false
                    return (
                      <React.Fragment key={`outbound-sub-${label}`}>
                        {/* Subheader row */}
                        <tr className="bg-white border-b">
                          <td colSpan={3} className="py-3 pl-6 text-sm font-semibold">
                            {displayLabel}
                            <span className="ml-2 font-normal normal-case text-[11px] text-muted-foreground/80">
                              ({payload.items.length} item{payload.items.length === 1 ? '' : 's'}
                              {shouldShowQtyInHeader(label)
                                ? ` / ${formatQty(payload.totalQty)} quantity`
                                : ''})
                            </span>
                          </td>
                          <td className="py-3" />
                          <td className="py-3" />
                          <td className="py-3 pr-3 text-right">
                            <div className="flex flex-wrap items-center justify-end gap-2">
                              <span className="text-base font-semibold">
                                ${(payload.totalCents / 100).toFixed(2)}
                              </span>

                              {subExpanded && (
                                <div className="flex items-center gap-1">
                                  <span className="text-[11px] text-muted-foreground">Rate</span>
                                  <input
                                    type="number"
                                    min={0}
                                    step="0.01"
                                    className="border rounded px-2 py-1 text-xs w-20 bg-background"
                                    placeholder={(() => {
                                      const first = payload.items[0]
                                      if (!first) return ''
                                      const allSame = payload.items.every((it) => it.rate_cents === first.rate_cents)
                                      return allSame ? (first.rate_cents / 100).toFixed(2) : '—'
                                    })()}
                                    value={bulkRateUsdByGroup[groupKey] ?? ''}
                                    onChange={(e) =>
                                      setBulkRateUsdByGroup((prev) => ({
                                        ...prev,
                                        [groupKey]: e.target.value,
                                      }))
                                    }
                                  />
                                  <button
                                    type="button"
                                    className="text-[11px] px-2 py-1 border bg-white rounded-md text-muted-foreground hover:bg-muted disabled:opacity-50"
                                    disabled={
                                      !!bulkApplyLoadingByGroup[groupKey] ||
                                      payload.items.length === 0
                                    }
                                    onClick={() => handleApplyBulkRate(groupKey, displayLabel, payload.items)}
                                  >
                                    {bulkApplyLoadingByGroup[groupKey] ? 'Applying…' : 'Apply to all'}
                                  </button>
                                </div>
                              )}

                              <button
                                type="button"
                                className="text-[11px] px-2 py-1 border bg-white rounded-md text-muted-foreground hover:bg-muted"
                                onClick={() =>
                                  setExpandedOutboundGroups((prev) => ({
                                    ...prev,
                                    [groupKey]: !subExpanded,
                                  }))
                                }
                              >
                                {subExpanded ? 'Hide details' : 'Show details'}
                              </button>
                            </div>
                          </td>
                          <td className="py-3" />
                        </tr>

                        {/* Rows for this subgroup */}
                        {subExpanded &&
                          payload.items.map((item) => {
                            const rowClass =
                              'border-b last:border-0 ' +
                              (globalIndex++ % 2 === 0 ? 'bg-white' : 'bg-gray-50')

                            const itemCatKey = getCategoryKey(item)
                            const isOutboundOrExtra =
                              itemCatKey === 'outbound' || itemCatKey === 'replacement' || itemCatKey === 'extra'

                            const orderId =
                              item.metadata?.order_id || item.metadata?.orderId || null

                            const occurredDate = item.occurred_at
                              ? new Date(item.occurred_at).toLocaleDateString('en-US', {
                                  timeZone: 'UTC',
                                })
                              : '-'

                            return (
                              <tr key={item.id} className={rowClass}>
                                <td className="py-2 pr-3 text-right">
                                  {isOutboundOrExtra && orderId ? orderId : '-'}
                                </td>

                                <td className="py-2 pr-3 text-right">
                                  {editingItemId === item.id ? (
                                    <input
                                      type="date"
                                      className="border rounded px-1 text-xs"
                                      value={String(
                                        editDraft.occurred_at ?? item.occurred_at
                                      ).slice(0, 10)}
                                      onChange={(e) =>
                                        setEditDraft({
                                          ...editDraft,
                                          occurred_at: e.target.value,
                                        })
                                      }
                                    />
                                  ) : (
                                    occurredDate
                                  )}
                                </td>

                                <td className="py-2 pr-3 text-right">
                                  {editingItemId === item.id ? (
                                    <input
                                      type="text"
                                      className="border rounded px-1 text-xs w-full"
                                      value={editDraft.description ?? item.description}
                                      onChange={(e) =>
                                        setEditDraft({
                                          ...editDraft,
                                          description: e.target.value,
                                        })
                                      }
                                    />
                                  ) : (
                                    item.metadata?.sellercloud_cs_key ?? item.description
                                  )}
                                </td>

                                <td className="py-2 pr-3 text-right">
                                  {editingItemId === item.id ? (
                                    <input
                                      type="number"
                                      step="0.01"
                                      className="border rounded px-1 text-xs w-20"
                                      value={editDraft.qty ?? item.qty}
                                      onChange={(e) =>
                                        setEditDraft({
                                          ...editDraft,
                                          qty: Number(e.target.value),
                                        })
                                      }
                                    />
                                  ) : (
                                    (() => {
                                      const n = Number(item.qty ?? 0)
                                      return Number.isFinite(n) && Math.floor(n) === n
                                        ? n.toString()
                                        : n.toFixed(2)
                                    })()
                                  )}
                                </td>

                                <td className="py-2 pr-3 text-right">
                                  {editingItemId === item.id ? (
                                    <input
                                      type="number"
                                      step="0.01"
                                      className="border rounded px-1 text-xs w-20"
                                      value={(editDraft.rate_cents ?? item.rate_cents) / 100}
                                      onChange={(e) =>
                                        setEditDraft({
                                          ...editDraft,
                                          rate_cents: Math.round(
                                            Number(e.target.value) * 100
                                          ),
                                        })
                                      }
                                    />
                                  ) : (
                                    `$${(item.rate_cents / 100).toFixed(2)}`
                                  )}
                                </td>

                                <td className="py-2 pr-3 text-right">
                                  {`$${(item.amount_cents / 100).toFixed(2)}`}
                                </td>

                                <td className="py-2 pr-3 text-right">
                                  {editingItemId === item.id ? (
                                    <>
                                      <button
                                        className="p-2 rounded hover:bg-muted text-green-600 mr-2"
                                        onClick={handleSaveEdit}
                                        aria-label="Save item"
                                      >
                                        <Check className="w-4 h-4" />
                                      </button>
                                      <button
                                        className="p-2 rounded hover:bg-muted text-muted-foreground"
                                        onClick={() => {
                                          setEditingItemId(null)
                                          setEditDraft({})
                                        }}
                                        aria-label="Cancel edit"
                                      >
                                        <X className="w-4 h-4" />
                                      </button>
                                    </>
                                  ) : (
                                    <>
                                      <button
                                        className="p-2 rounded hover:bg-muted text-blue-600 mr-2"
                                        onClick={() => {
                                          setEditingItemId(item.id)
                                          setEditDraft(item)
                                        }}
                                        aria-label="Edit item"
                                      >
                                        <Pencil className="w-4 h-4" />
                                      </button>
                                      <button
                                        className="p-2 rounded hover:bg-muted text-destructive disabled:opacity-50"
                                        onClick={() => handleDeleteItem(item.id)}
                                        disabled={!!deletingItemId}
                                        aria-label="Delete item"
                                      >
                                        {deletingItemId === item.id ? '…' : (
                                          <Trash className="w-4 h-4" />
                                        )}
                                      </button>
                                    </>
                                  )}
                                </td>
                              </tr>
                            )
                          })}
                      </React.Fragment>
                    )
                  })
                })()
              : items.map((item, index) => {
                  const rowClass =
                    'border-b last:border-0 ' +
                    (index % 2 === 0 ? 'bg-white' : 'bg-gray-50')
                  const itemCatKey = getCategoryKey(item)
                  const isOutboundOrExtra =
                    itemCatKey === 'outbound' || itemCatKey === 'replacement' || itemCatKey === 'extra'
                  const orderId =
                    item.metadata?.order_id || item.metadata?.orderId || null
                  const occurredDate = item.occurred_at
                    ? new Date(item.occurred_at).toLocaleDateString('en-US', {
                        timeZone: 'UTC',
                      })
                    : '-'

                  return (
                    <tr key={item.id} className={rowClass}>
                      <td className="py-2 pr-3 text-right">
                        {isOutboundOrExtra && orderId ? orderId : '-'}
                      </td>

                      <td className="py-2 pr-3 text-right">
                        {editingItemId === item.id ? (
                          <input
                            type="date"
                            className="border rounded px-1 text-xs"
                            value={String(
                              editDraft.occurred_at ?? item.occurred_at
                            ).slice(0, 10)}
                            onChange={(e) =>
                              setEditDraft({
                                ...editDraft,
                                occurred_at: e.target.value,
                              })
                            }
                          />
                        ) : (
                          occurredDate
                        )}
                      </td>

                      <td className="py-2 pr-3 text-right">
                        {editingItemId === item.id ? (
                          <input
                            type="text"
                            className="border rounded px-1 text-xs w-full"
                            value={editDraft.description ?? item.description}
                            onChange={(e) =>
                              setEditDraft({
                                ...editDraft,
                                description: e.target.value,
                              })
                            }
                          />
                        ) : (
                          item.description
                        )}
                      </td>

                      <td className="py-2 pr-3 text-right">
                        {editingItemId === item.id ? (
                          <input
                            type="number"
                            step="0.01"
                            className="border rounded px-1 text-xs w-20"
                            value={editDraft.qty ?? item.qty}
                            onChange={(e) =>
                              setEditDraft({
                                ...editDraft,
                                qty: Number(e.target.value),
                              })
                            }
                          />
                        ) : (
                          (() => {
                            const n = Number(item.qty ?? 0)
                            return Number.isFinite(n) && Math.floor(n) === n
                              ? n.toString()
                              : n.toFixed(2)
                          })()
                        )}
                      </td>

                      <td className="py-2 pr-3 text-right">
                        {editingItemId === item.id ? (
                          <input
                            type="number"
                            step="0.01"
                            className="border rounded px-1 text-xs w-20"
                            value={(editDraft.rate_cents ?? item.rate_cents) / 100}
                            onChange={(e) =>
                              setEditDraft({
                                ...editDraft,
                                rate_cents: Math.round(Number(e.target.value) * 100),
                              })
                            }
                          />
                        ) : (
                          `$${(item.rate_cents / 100).toFixed(2)}`
                        )}
                      </td>

                      <td className="py-2 pr-3 text-right">
                        {`$${(item.amount_cents / 100).toFixed(2)}`}
                      </td>

                      <td className="py-2 pr-3 text-right">
                        {editingItemId === item.id ? (
                          <>
                            <button
                              className="p-2 rounded hover:bg-muted text-green-600 mr-2"
                              onClick={handleSaveEdit}
                              aria-label="Save item"
                            >
                              <Check className="w-4 h-4" />
                            </button>
                            <button
                              className="p-2 rounded hover:bg-muted text-muted-foreground"
                              onClick={() => {
                                setEditingItemId(null)
                                setEditDraft({})
                              }}
                              aria-label="Cancel edit"
                            >
                              <X className="w-4 h-4" />
                            </button>
                          </>
                        ) : (
                          <>
                            <button
                              className="p-2 rounded hover:bg-muted text-blue-600 mr-2"
                              onClick={() => {
                                setEditingItemId(item.id)
                                setEditDraft(item)
                              }}
                              aria-label="Edit item"
                            >
                              <Pencil className="w-4 h-4" />
                            </button>
                            <button
                              className="p-2 rounded hover:bg-muted text-destructive disabled:opacity-50"
                              onClick={() => handleDeleteItem(item.id)}
                              disabled={!!deletingItemId}
                              aria-label="Delete item"
                            >
                              {deletingItemId === item.id ? '…' : (
                                <Trash className="w-4 h-4" />
                              )}
                            </button>
                          </>
                        )}
                      </td>
                    </tr>
                  )
                }))}
        </React.Fragment>
      )
    })}
</tbody>
          </table>
        </div>
      </Card>

      {/* Totals and Actions */}
      <Card className="p-6 flex justify-between items-center">
        <div className="text-sm text-muted-foreground">All values are in USD</div>
        <div className="flex gap-2">
          <Button
            className="bg-primary text-white"
            onClick={handleIssueInvoice}
            disabled={loading || !data || issuing}
          >
            {issuing ? 'Issuing…' : 'Issue Invoice'}
          </Button>
        </div>
      </Card>
    </div>
  )
}