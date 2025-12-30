'use client'

import Link from 'next/link'
import { useEffect, useMemo, useState } from 'react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import type { BillingClientSummary } from '@/types/billing'

const FALLBACK_WAREHOUSE_LABEL = 'Unassigned'

const formatCurrency = (value: number | null | undefined) =>
  new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(
    Number.isFinite(value) ? Number(value) : 0
  )

const formatDate = (value: string | null | undefined) => {
  if (!value) return '—'
  const parsed = new Date(value)
  if (Number.isNaN(parsed.getTime())) return '—'
  return parsed.toLocaleDateString()
}

export default function ClientsPage() {
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [rows, setRows] = useState<BillingClientSummary[]>([])

  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'inactive'>('active')
  const [methodFilter, setMethodFilter] = useState<'all' | string>('all')
  const [warehouseFilter, setWarehouseFilter] = useState<'all' | string>('all')

  useEffect(() => {
    let active = true

    const load = async () => {
      setLoading(true)
      setError(null)
      try {
        const response = await fetch('/api/billing/clients')
        if (!response.ok) throw new Error('Failed to load clients')
        const payload: { data: BillingClientSummary[] } = await response.json()
        if (!active) return
        setRows(payload.data)
      } catch (err) {
        console.error(err)
        if (active) setError(err instanceof Error ? err.message : 'Failed to load clients')
      } finally {
        if (active) setLoading(false)
      }
    }

    load()
    return () => {
      active = false
    }
  }, [])

  const warehouseOptions = useMemo(() => {
    const unique = new Map<string, string>()
    let hasUnassigned = false
    rows.forEach((row) => {
      if (row.warehouseId) {
        unique.set(row.warehouseId, row.warehouseName ?? row.warehouseId)
      } else if (row.warehouseName) {
        unique.set(row.warehouseName, row.warehouseName)
      } else {
        hasUnassigned = true
      }
    })
    if (hasUnassigned) unique.set('unassigned', FALLBACK_WAREHOUSE_LABEL)
    return Array.from(unique.entries())
      .map(([value, label]) => ({ value, label }))
      .sort((a, b) => a.label.localeCompare(b.label))
  }, [rows])

  const methodOptions = useMemo(() => {
    const unique = new Set<string>()
    rows.forEach((row) => {
      const value = row.billingMethod ? row.billingMethod.toLowerCase() : 'unknown'
      unique.add(value)
    })
    return Array.from(unique).sort((a, b) => a.localeCompare(b))
  }, [rows])

  const filteredRows = useMemo(() => {
    const query = search.trim().toLowerCase()
    return rows.filter((row) => {
      const matchesSearch =
        !query ||
        (row.name ?? '').toLowerCase().includes(query) ||
        (row.warehouseName ?? '').toLowerCase().includes(query)

      const matchesStatus =
        statusFilter === 'all' || (row.isActive ? 'active' : 'inactive') === statusFilter

      const methodValue = row.billingMethod ? row.billingMethod.toLowerCase() : 'unknown'

      const matchesMethod =
        methodFilter === 'all' || methodValue === methodFilter.toLowerCase()

      const matchesWarehouse = (() => {
        if (warehouseFilter === 'all') return true
        if (warehouseFilter === 'unassigned') return !row.warehouseId && !row.warehouseName
        if (row.warehouseId === warehouseFilter) return true
        return (row.warehouseName ?? '').toLowerCase() === warehouseFilter.toLowerCase()
      })()

      return matchesSearch && matchesStatus && matchesMethod && matchesWarehouse
    })
  }, [rows, search, statusFilter, methodFilter, warehouseFilter])

  const statusBadge = (active: boolean) => (
    <Badge variant={active ? 'default' : 'secondary'}>{active ? 'Active' : 'Inactive'}</Badge>
  )

  const resolveWarehouseLabel = (row: BillingClientSummary) =>
    row.warehouseName ?? row.warehouseId ?? FALLBACK_WAREHOUSE_LABEL

const resolveMethodLabel = (value: string | null | undefined) => {
  if (!value) return 'Unknown'
  const normalized = value.toLowerCase()
  return normalized.charAt(0).toUpperCase() + normalized.slice(1)
}

  const resolveLinkId = (row: BillingClientSummary) => row.clientAccountId || row.recordId

  return (
    <div className="space-y-6 p-8">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Clients</h1>
          <p className="text-sm text-muted-foreground">
            Manage client billing settings, usage, and invoices.
          </p>
        </div>
        <div className="flex gap-2">
          <Link href="/">
            <Button variant="outline">Back to Billing</Button>
          </Link>
          
        </div>
      </div>

      {error && (
        <Card className="border-destructive/50 bg-destructive/10 p-4 text-destructive">
          <div className="text-sm font-medium">Unable to load clients</div>
          <div className="text-xs text-destructive/80">{error}</div>
        </Card>
      )}

      <Card className="p-4 bg-white">
        <div className="flex flex-col items-start gap-3 sm:flex-row sm:items-center">
          <div className="w-full sm:w-64">
            <Input
              placeholder="Search client…"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
            />
          </div>
          <div className="w-full sm:w-48">
            <Select
              value={statusFilter}
              onValueChange={(value: 'all' | 'active' | 'inactive') => setStatusFilter(value)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="inactive">Inactive</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="w-full sm:w-48">
            <Select
              value={methodFilter}
              onValueChange={(value) => setMethodFilter(value)}
            >
              <SelectTrigger>
                <SelectValue placeholder="All methods" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All methods</SelectItem>
                {methodOptions.map((method) => (
                  <SelectItem key={method} value={method}>
                    {resolveMethodLabel(method)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          
        </div>
      </Card>

      <Card className="p-4 bg-white">
        <div className="mb-3 text-lg font-medium">Client List</div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="text-muted-foreground">
              <tr className="border-b text-left">
                <th className="py-2 pr-3">Client</th>
                <th className="py-2 pr-3">Status</th>
                <th className="py-2 pr-3">Method</th>
                <th className="py-2 text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading && (
                <tr>
                  <td colSpan={7} className="py-6 text-center text-muted-foreground">
                    Loading…
                  </td>
                </tr>
              )}
              {!loading && filteredRows.length === 0 && (
                <tr>
                  <td colSpan={7} className="py-6 text-center text-muted-foreground">
                    No clients match the selected filters.
                  </td>
                </tr>
              )}
              {!loading &&
                filteredRows.map((row) => {
                  const warehouseLabel = resolveWarehouseLabel(row)
                  const linkId = resolveLinkId(row)
                  return (
                    <tr key={row.recordId} className="border-b last:border-0">
                      <td className="py-2 pr-3 font-medium">{row.name ?? row.clientAccountId}</td>
                      <td className="py-2 pr-3">{statusBadge(row.isActive)}</td>
                      <td className="py-2 pr-3">{resolveMethodLabel(row.billingMethod)}</td>
                      <td className="py-2 text-right space-x-2">
                        <Link href={`/billing/clients/${linkId}/config`}>
                          <Button size="sm" variant="outline">
                            Configs
                          </Button>
                        </Link>

                        <Link href={`/billing/clients/${linkId}/invoices`}>
                          <Button size="sm" variant="outline">
                            Invoices
                          </Button>
                        </Link>
                      </td>
                    </tr>
                  )
                })}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  )
}
