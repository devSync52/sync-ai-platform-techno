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
    Record<'storage' | 'handling' | 'ecommerce' | 'extra', boolean>
  >({
    storage: true,
    handling: true,
    ecommerce: false,
    extra: false,
  })
  const [deletingItemId, setDeletingItemId] = useState<string | null>(null)
  const [editingItemId, setEditingItemId] = useState<string | null>(null)
  const [editDraft, setEditDraft] = useState<Partial<InvoiceItem>>({})
  const [shareLoading, setShareLoading] = useState(false)
  const [shareError, setShareError] = useState<string | null>(null)

  function getCategoryKey(item: InvoiceItem): 'storage' | 'handling' | 'ecommerce' | 'extra' {
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


    // Função auxiliar para normalizar várias strings em uma das 4 categorias
    const normalize = (
      candidate: string | null | undefined
    ): 'storage' | 'handling' | 'ecommerce' | 'extra' | null => {
      if (!candidate) return null
      const c = candidate.toLowerCase()

      if (['storage', 'storage_daily', 'storage_fee'].includes(c)) return 'storage'

      if (
        [
          'handling',
          'inbound',
          'crossdock',
          'cross-dock',
          'drayage',
          'labeling',
          'returns_insurance',
          'returns',
        ].includes(c)
      )
        return 'handling'

      if (['ecommerce', 'e-commerce', 'shipping', 'parcel'].includes(c)) return 'ecommerce'

      if (c === 'extra') return 'extra'

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
    if (typeLabel.includes('e-commerce') || typeLabel.includes('ecommerce') || typeLabel.includes('shipping'))
      return 'ecommerce'
    if (
      typeLabel.includes('handling') ||
      typeLabel.includes('inbound') ||
      typeLabel.includes('label') ||
      typeLabel.includes('barcode')
    )
      return 'handling'

    // 4) Heurísticas pela descrição
    if (desc.includes('storage')) return 'storage'
    if (desc.includes('barcode') || desc.includes('scan') || desc.includes('scanning') || desc.includes('label'))
      return 'handling'
    if (desc.includes('shipment') || desc.includes('ship') || desc.includes('parcel') || desc.includes('freight'))
      return 'ecommerce'

    // 5) Se ainda não classificou, cai em extra
    return 'extra'
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
    const totals: Record<'storage' | 'handling' | 'ecommerce' | 'extra', number> = {
      storage: 0,
      handling: 0,
      ecommerce: 0,
      extra: 0,
    }
    if (!data) return totals

    for (const item of data.items) {
      const amount = item.amount_cents || 0
      const catKey = getCategoryKey(item)
      totals[catKey] += amount
    }

    return totals
  }, [data])

  const categoryCounts = useMemo(() => {
    const counts: Record<'storage' | 'handling' | 'ecommerce' | 'extra', number> = {
      storage: 0,
      handling: 0,
      ecommerce: 0,
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

  const categoryOrder: { key: string; label: string }[] = [
    { key: 'storage', label: 'Storage' },
    { key: 'handling', label: 'Handling' },
    { key: 'ecommerce', label: 'E-commerce' },
    { key: 'extra', label: 'Extras' },
  ]

  // Issue Invoice logic
  const handleIssueInvoice = useCallback(async () => {
    if (!data?.invoice?.id) return
    try {
      const res = await fetch(`/api/billing/invoice/${data.invoice.id}/issue`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ invoiceId: data.invoice.id })
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
    } catch (err: any) {
      setError(err.message || 'Unexpected error while issuing invoice')
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
            <Link href="/billing/clients/624e9507-d7c4-4a7d-af64-3064e8743884/invoices">
              <Button variant="outline">Back to Invoices</Button>
            </Link>
            <Button variant="outline">Generate PDF</Button>
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
              ${(data.invoice.total_cents / 100).toFixed(2)}
            </p>
            <p className="text-[11px] text-muted-foreground">
              Subtotal ${(data.invoice.subtotal_cents / 100).toFixed(2)} · Tax{' '}
              ${(data.invoice.tax_cents / 100).toFixed(2)}
            </p>
          </div>
        </div>
      </div>

      {/* Category summary: 4 cards estilo dashboard */}
      <div className="grid sm:grid-cols-4 gap-4 text-xs pt-4 border-t mt-4">
        <div className="rounded-md border bg-muted/40 px-3 py-2">
          <p className="text-[11px] text-muted-foreground uppercase tracking-wide">
            Storage
          </p>
          <p className="text-xl font-semibold">
            ${(categoryTotals.storage / 100).toFixed(2)}
          </p>
          <p className="text-[11px] text-muted-foreground">
            {categoryCounts.storage} item
            {categoryCounts.storage === 1 ? '' : 's'}
          </p>
        </div>

        <div className="rounded-md border bg-muted/40 px-3 py-2">
          <p className="text-[11px] text-muted-foreground uppercase tracking-wide">
            Handling
          </p>
          <p className="text-xl font-semibold">
            ${(categoryTotals.handling / 100).toFixed(2)}
          </p>
          <p className="text-[11px] text-muted-foreground">
            {categoryCounts.handling} item
            {categoryCounts.handling === 1 ? '' : 's'}
          </p>
        </div>

        <div className="rounded-md border bg-muted/40 px-3 py-2">
          <p className="text-[11px] text-muted-foreground uppercase tracking-wide">
            E-commerce
          </p>
          <p className="text-xl font-semibold">
            ${(categoryTotals.ecommerce / 100).toFixed(2)}
          </p>
          <p className="text-[11px] text-muted-foreground">
            {categoryCounts.ecommerce} item
            {categoryCounts.ecommerce === 1 ? '' : 's'}
          </p>
        </div>

        <div className="rounded-md border bg-muted/40 px-3 py-2">
          <p className="text-[11px] text-muted-foreground uppercase tracking-wide">
            Extras
          </p>
          <p className="text-xl font-semibold">
            ${(categoryTotals.extra / 100).toFixed(2)}
          </p>
          <p className="text-[11px] text-muted-foreground">
            {categoryCounts.extra} item
            {categoryCounts.extra === 1 ? '' : 's'}
          </p>
        </div>
      </div>

      {/* Issue Invoice Button */}
      <div className="flex justify-end mt-4">
        <Button
          className="bg-primary text-white"
          onClick={handleIssueInvoice}
          disabled={loading || !data}
        >
          Issue Invoice
        </Button>
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
                      {s.category} – {s.name} ({s.unit}) @ ${s.rateUsd.toFixed(2)}
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
    const catKey = cat.key as 'storage' | 'handling' | 'ecommerce' | 'extra'
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
          <td className="pt-4 pb-2" />
          
        </tr>

          {/* Linhas da categoria (só quando expandida) */}
          {expanded &&
            items.map((item, index) => {
              const rowClass =
                'border-b last:border-0 ' +
                (index % 2 === 0 ? 'bg-white' : 'bg-gray-50')
              const catKey = getCategoryKey(item)
              const isEcomOrExtra = catKey === 'ecommerce' || catKey === 'extra'
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
                    {isEcomOrExtra && orderId ? orderId : '-'}
                  </td>

                  <td className="py-2 pr-3 text-right">
                    {editingItemId === item.id ? (
                      <input
                        type="date"
                        className="border rounded px-1 text-xs"
                        value={String(editDraft.occurred_at ?? item.occurred_at).slice(0,10)}
                        onChange={(e)=> setEditDraft({...editDraft, occurred_at: e.target.value})}
                      />
                    ) : occurredDate}
                  </td>

                  <td className="py-2 pr-3 text-right">
                    {editingItemId === item.id ? (
                      <input
                        type="text"
                        className="border rounded px-1 text-xs w-full"
                        value={editDraft.description ?? item.description}
                        onChange={(e)=> setEditDraft({...editDraft, description: e.target.value})}
                      />
                    ) : item.description}
                  </td>

                  <td className="py-2 pr-3 text-right">
                    {editingItemId === item.id ? (
                      <input
                        type="number"
                        step="0.01"
                        className="border rounded px-1 text-xs w-20"
                        value={editDraft.qty ?? item.qty}
                        onChange={(e)=> setEditDraft({...editDraft, qty: Number(e.target.value)})}
                      />
                    ) : (() => {
                      const n = Number(item.qty ?? 0)
                      return Number.isFinite(n) && Math.floor(n) === n ? n.toString() : n.toFixed(2)
                    })()}
                  </td>

                  <td className="py-2 pr-3 text-right">
                    {editingItemId === item.id ? (
                      <input
                        type="number"
                        step="0.01"
                        className="border rounded px-1 text-xs w-20"
                        value={(editDraft.rate_cents ?? item.rate_cents) / 100}
                        onChange={(e)=> setEditDraft({...editDraft, rate_cents: Math.round(Number(e.target.value)*100)})}
                      />
                    ) : `$${(item.rate_cents / 100).toFixed(2)}`}
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
  onClick={() => { setEditingItemId(null); setEditDraft({}) }}
  aria-label="Cancel edit"
>
  <X className="w-4 h-4" />
</button>
                      </>
                    ) : (
                      <>
<button
  className="p-2 rounded hover:bg-muted text-blue-600 mr-2"
  onClick={() => { setEditingItemId(item.id); setEditDraft(item) }}
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
  {deletingItemId === item.id ? '…' : <Trash className="w-4 h-4" />}
</button>
                      </>
                    )}
                  </td>
                </tr>
              )
            })}
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
            disabled={loading || !data}
          >
            Issue Invoice
          </Button>
        </div>
      </Card>
    </div>
  )
}