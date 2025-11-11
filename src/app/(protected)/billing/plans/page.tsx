'use client'

import { useEffect, useMemo, useState } from 'react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog'
import { useSupabase } from '@/components/supabase-provider'
import {
  fetchBillingPlansData,
  type BillingPlansData,
} from '@/lib/supabase/billing'
import type {
  BillingRateCard,
  BillingRateActivity,
  BillingRateStorageTier,
} from '@/types/billing'

type ServiceEvent = 'ONCE' | 'PER_UNIT' | 'OTHER'

interface CatalogService {
  id: string
  category: string
  name: string
  event: ServiceEvent
  unit: string
  defaultRate: number
  active: boolean
}

interface StorageTier {
  id: string
  name: string
  min: number
  max?: number
  rate: number
  active: boolean
}

const formatCodeLabel = (code: string) =>
  code
    .split('_')
    .map((slice) => slice.charAt(0) + slice.slice(1).toLowerCase())
    .join(' ')

const deriveCategoryFromCode = (code: string) => {
  const [prefix] = code.split('_')
  return prefix ? prefix.toUpperCase() : 'GENERAL'
}

const deriveEventFromUnit = (unit: string): ServiceEvent => {
  const normalized = unit.toLowerCase()
  if (['unit', 'order', 'piece', 'pallet', 'kg'].includes(normalized)) {
    return 'PER_UNIT'
  }
  return 'ONCE'
}

const mapStorageTiers = (tiers: BillingRateStorageTier[]): StorageTier[] => {
  const sorted = [...tiers].sort((a, b) => a.tier_order - b.tier_order)
  let previousMax = 0
  return sorted.map((tier, index) => {
    const min = index === 0 ? 0 : previousMax
    const max =
      tier.max_cft === null || tier.max_cft === undefined ? undefined : Number(tier.max_cft)
    previousMax = max ?? previousMax
    return {
      id: tier.id,
      name: `Tier ${index + 1}`,
      min,
      max,
      rate: Number(tier.rate_per_cft ?? 0),
      active: true,
    }
  })
}

const mapActivityRatesToCatalog = (activities: BillingRateActivity[]): CatalogService[] => {
  return activities.map((activity) => {
    const unit = activity.unit || 'unit'
    return {
      id: activity.id,
      category: deriveCategoryFromCode(activity.code),
      name: formatCodeLabel(activity.code),
      event: deriveEventFromUnit(unit),
      unit,
      defaultRate: Number(activity.rate ?? 0),
      active: true,
    }
  })
}

export default function PlansPage() {
  const supabase = useSupabase()

  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const [rateCards, setRateCards] = useState<BillingRateCard[]>([])
  const [plansData, setPlansData] = useState<BillingPlansData | null>(null)
  const [selectedRateCardId, setSelectedRateCardId] = useState<string>('')

  const [tiers, setTiers] = useState<StorageTier[]>([])
  const [catalog, setCatalog] = useState<CatalogService[]>([])

  const [svcSearch, setSvcSearch] = useState('')
  const [openAddSvc, setOpenAddSvc] = useState(false)
  const [openBulkSvc, setOpenBulkSvc] = useState(false)

  const [newSvc, setNewSvc] = useState<CatalogService>({
    id: '',
    category: 'GENERAL',
    name: '',
    event: 'PER_UNIT',
    unit: 'unit',
    defaultRate: 0,
    active: true,
  })

  const [bulkText, setBulkText] = useState('')
  const [bulkCategory, setBulkCategory] = useState<string>('GENERAL')

  const [openAddTier, setOpenAddTier] = useState(false)
  const [newTier, setNewTier] = useState<StorageTier>({
    id: '',
    name: '',
    min: 0,
    max: undefined,
    rate: 0,
    active: true,
  })

  useEffect(() => {
    let active = true

    const load = async () => {
      setLoading(true)
      setError(null)
      try {
        const data = await fetchBillingPlansData(supabase)
        if (!active) return
        setPlansData(data)
        setRateCards(data.rateCards)
      } catch (err) {
        console.error(err)
        if (active) {
          setError(err instanceof Error ? err.message : 'Failed to load billing plans')
        }
      } finally {
        if (active) setLoading(false)
      }
    }

    load()
    return () => {
      active = false
    }
  }, [supabase])

  useEffect(() => {
    if (!plansData || selectedRateCardId) return
    const preferred =
      plansData.rateCards.find((card) => card.is_default) ?? plansData.rateCards[0]
    if (preferred) setSelectedRateCardId(preferred.id)
  }, [plansData, selectedRateCardId])

  useEffect(() => {
    if (!plansData || !selectedRateCardId) {
      setTiers([])
      setCatalog([])
      return
    }

    const storage = plansData.storageTiers.filter(
      (tier) => tier.rate_card_id === selectedRateCardId
    )
    setTiers(mapStorageTiers(storage))

    const activities = plansData.activityRates.filter(
      (activity) => activity.rate_card_id === selectedRateCardId
    )
    setCatalog(mapActivityRatesToCatalog(activities))
  }, [plansData, selectedRateCardId])

  const serviceCategories = useMemo(() => {
    const categories = new Set<string>()
    catalog.forEach((service) => categories.add(service.category))
    return Array.from(categories).sort()
  }, [catalog])

  useEffect(() => {
    const fallbackCategory = serviceCategories[0] ?? 'GENERAL'
    setNewSvc((prev) =>
      serviceCategories.length === 0 || serviceCategories.includes(prev.category)
        ? prev
        : { ...prev, category: fallbackCategory }
    )
    setBulkCategory((prev) =>
      serviceCategories.length === 0 || serviceCategories.includes(prev)
        ? prev
        : fallbackCategory
    )
  }, [serviceCategories])

  const totals = useMemo(
    () => ({
      activeHandling: catalog.filter((service) => service.active).length,
      activeTiers: tiers.filter((tier) => tier.active).length,
    }),
    [catalog, tiers]
  )

  const selectedCard = useMemo(
    () => rateCards.find((card) => card.id === selectedRateCardId) ?? null,
    [rateCards, selectedRateCardId]
  )

  const updateService = (id: string, patch: Partial<CatalogService>) => {
    setCatalog((prev) => prev.map((service) => (service.id === id ? { ...service, ...patch } : service)))
  }

  const addService = () => {
    if (!newSvc.name.trim()) return
    const id = `svc_${Math.random().toString(36).slice(2, 8)}`
    setCatalog((prev) => [...prev, { ...newSvc, id }])
    setOpenAddSvc(false)
    setNewSvc({
      id: '',
      category: serviceCategories[0] ?? 'GENERAL',
      name: '',
      event: 'PER_UNIT',
      unit: 'unit',
      defaultRate: 0,
      active: true,
    })
  }

  const runBulkImport = () => {
    const rows = bulkText.split(/\r?\n/).map((line) => line.trim()).filter(Boolean)
    if (!rows.length) {
      setOpenBulkSvc(false)
      setBulkText('')
      return
    }

    const parsed: CatalogService[] = []
    for (const line of rows) {
      const [name, unit, rateStr] = line.split(',').map((segment) => segment?.trim() ?? '')
      if (!name) continue
      parsed.push({
        id: `svc_${Math.random().toString(36).slice(2, 8)}`,
        category: bulkCategory,
        name,
        event: deriveEventFromUnit(unit || 'unit'),
        unit: unit || 'unit',
        defaultRate: Number(rateStr || 0),
        active: true,
      })
    }

    if (parsed.length) setCatalog((prev) => [...prev, ...parsed])
    setOpenBulkSvc(false)
    setBulkText('')
  }

  const updateTier = (id: string, patch: Partial<StorageTier>) => {
    setTiers((prev) => prev.map((tier) => (tier.id === id ? { ...tier, ...patch } : tier)))
  }

  const removeTier = (id: string) => {
    setTiers((prev) => prev.filter((tier) => tier.id !== id))
  }

  const addTier = () => {
    if (!newTier.name.trim()) return
    const id = `tier_${Math.random().toString(36).slice(2, 8)}`
    setTiers((prev) => [...prev, { ...newTier, id }])
    setOpenAddTier(false)
    setNewTier({ id: '', name: '', min: 0, max: undefined, rate: 0, active: true })
  }

  const filteredCatalog = useMemo(() => {
    const query = svcSearch.trim().toLowerCase()
    if (!query) return catalog
    return catalog.filter(
      (service) =>
        service.name.toLowerCase().includes(query) || service.unit.toLowerCase().includes(query)
    )
  }, [catalog, svcSearch])

  const servicesByCategory = useMemo(() => {
    const grouping: Record<string, CatalogService[]> = {}
    filteredCatalog.forEach((service) => {
      if (!grouping[service.category]) grouping[service.category] = []
      grouping[service.category].push(service)
    })
    return grouping
  }, [filteredCatalog])

  return (
    <div className="space-y-6 p-8">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Plans &amp; Tiers</h1>
          <p className="text-sm text-muted-foreground">
            Define handling rates and storage tiers used across client billing.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <Select
            value={selectedRateCardId}
            onValueChange={(value) => setSelectedRateCardId(value)}
            disabled={!rateCards.length}
          >
            <SelectTrigger className="w-64">
              <SelectValue placeholder="Select rate card" />
            </SelectTrigger>
            <SelectContent>
              {rateCards.map((card) => (
                <SelectItem key={card.id} value={card.id}>
                  {card.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Badge variant="secondary">Active handling: {totals.activeHandling}</Badge>
          <Badge variant="secondary">Active tiers: {totals.activeTiers}</Badge>
        </div>
      </div>

      {error && (
        <Card className="border-destructive/50 bg-destructive/10 p-4 text-destructive">
          <div className="text-sm font-medium">Unable to load billing plans</div>
          <div className="text-xs text-destructive/80">{error}</div>
        </Card>
      )}

      {loading && (
        <Card className="p-4">
          <div className="text-sm text-muted-foreground">Loading rate cards…</div>
        </Card>
      )}

      {!loading && rateCards.length === 0 && (
        <Card className="p-4">
          <div className="text-sm text-muted-foreground">No rate cards found.</div>
        </Card>
      )}

      {selectedCard && (
        <Card className="p-4">
          <div className="text-sm text-muted-foreground">Selected rate card</div>
          <div className="mt-1 text-base font-medium">{selectedCard.name}</div>
          <div className="mt-1 text-xs text-muted-foreground">
            Version {selectedCard.version}
          </div>
        </Card>
      )}

      <Card className="p-4">
        <div className="mb-3 flex items-center justify-between">
          <div className="text-sm font-medium">Storage Tiers</div>
          <Button size="sm" onClick={() => setOpenAddTier(true)} disabled={!selectedRateCardId}>
            Add Tier
          </Button>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="text-muted-foreground">
              <tr className="border-b text-left">
                <th className="py-2 pr-3">Name</th>
                <th className="py-2 pr-3">Min</th>
                <th className="py-2 pr-3">Max</th>
                <th className="py-2 pr-3">Rate</th>
                <th className="py-2 pr-3">Status</th>
                <th className="py-2 text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {tiers.map((tier) => (
                <tr key={tier.id} className="border-b last:border-0">
                  <td className="min-w-[160px] py-2 pr-3">
                    <Input
                      value={tier.name}
                      onChange={(event) => updateTier(tier.id, { name: event.target.value })}
                    />
                  </td>
                  <td className="w-32 py-2 pr-3">
                    <Input
                      type="number"
                      value={tier.min}
                      onChange={(event) =>
                        updateTier(tier.id, { min: Number(event.target.value || 0) })
                      }
                    />
                  </td>
                  <td className="w-32 py-2 pr-3">
                    <Input
                      type="number"
                      value={tier.max ?? ''}
                      placeholder="—"
                      onChange={(event) => {
                        const value = event.target.value
                        updateTier(tier.id, { max: value === '' ? undefined : Number(value) })
                      }}
                    />
                  </td>
                  <td className="w-40 py-2 pr-3">
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-muted-foreground">USD/m³</span>
                      <Input
                        type="number"
                        step="0.01"
                        value={tier.rate}
                        onChange={(event) =>
                          updateTier(tier.id, { rate: Number(event.target.value || 0) })
                        }
                      />
                    </div>
                  </td>
                  <td className="w-32 py-2 pr-3">
                    {tier.active ? <Badge>Active</Badge> : <Badge variant="secondary">Inactive</Badge>}
                  </td>
                  <td className="py-2 text-right">
                    <div className="flex justify-end gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => updateTier(tier.id, { active: !tier.active })}
                      >
                        {tier.active ? 'Disable' : 'Enable'}
                      </Button>
                      <Button size="sm" variant="outline" onClick={() => removeTier(tier.id)}>
                        Archive
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      <Card className="p-4">
        <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
          <div className="text-sm font-medium">Global Service Catalog</div>
          <div className="flex items-center gap-2">
            <Input
              placeholder="Search services…"
              value={svcSearch}
              onChange={(event) => setSvcSearch(event.target.value)}
              className="w-56"
            />
            <Button
              variant="outline"
              size="sm"
              onClick={() => setOpenBulkSvc(true)}
              disabled={!selectedRateCardId}
            >
              Bulk import
            </Button>
            <Button size="sm" onClick={() => setOpenAddSvc(true)} disabled={!selectedRateCardId}>
              Add service
            </Button>
          </div>
        </div>
        {Object.keys(servicesByCategory).map((category) => (
          <div key={category} className="mb-6 last:mb-0">
            <div className="mb-2 text-xs uppercase tracking-wider text-muted-foreground">
              {category}
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="text-muted-foreground">
                  <tr className="border-b text-left">
                    <th className="py-2 pr-3">Service</th>
                    <th className="py-2 pr-3">Event</th>
                    <th className="py-2 pr-3">Unit</th>
                    <th className="py-2 pr-3">Default rate</th>
                    <th className="py-2 pr-3">Status</th>
                    <th className="py-2 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {servicesByCategory[category].map((service) => (
                    <tr key={service.id} className="border-b last:border-0">
                      <td className="min-w-[240px] py-2 pr-3">
                        <Input
                          value={service.name}
                          onChange={(event) => updateService(service.id, { name: event.target.value })}
                        />
                      </td>
                      <td className="w-40 py-2 pr-3">
                        <Select
                          value={service.event}
                          onValueChange={(value: ServiceEvent) =>
                            updateService(service.id, { event: value })
                          }
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="ONCE">ONCE</SelectItem>
                            <SelectItem value="PER_UNIT">PER_UNIT</SelectItem>
                            <SelectItem value="OTHER">OTHER</SelectItem>
                          </SelectContent>
                        </Select>
                      </td>
                      <td className="w-40 py-2 pr-3">
                        <Input
                          value={service.unit}
                          onChange={(event) => updateService(service.id, { unit: event.target.value })}
                        />
                      </td>
                      <td className="w-40 py-2 pr-3">
                        <div className="flex items-center gap-2">
                          <span className="text-xs text-muted-foreground">USD</span>
                          <Input
                            type="number"
                            step="0.01"
                            value={service.defaultRate}
                            onChange={(event) =>
                              updateService(service.id, {
                                defaultRate: Number(event.target.value || 0),
                              })
                            }
                          />
                        </div>
                      </td>
                      <td className="w-32 py-2 pr-3">
                        {service.active ? <Badge>Active</Badge> : <Badge variant="secondary">Inactive</Badge>}
                      </td>
                      <td className="py-2 text-right">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => updateService(service.id, { active: !service.active })}
                        >
                          {service.active ? 'Disable' : 'Enable'}
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        ))}
        {!Object.keys(servicesByCategory).length && (
          <div className="py-6 text-center text-sm text-muted-foreground">
            No services for this rate card yet.
          </div>
        )}
      </Card>

      <Dialog open={openAddSvc} onOpenChange={setOpenAddSvc}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add global service</DialogTitle>
            <DialogDescription>Create a new item in the global catalog.</DialogDescription>
          </DialogHeader>
          <div className="grid gap-3 sm:grid-cols-2">
            <div>
              <Label>Category</Label>
              <Select
                value={newSvc.category}
                onValueChange={(value) => setNewSvc({ ...newSvc, category: value })}
              >
                <SelectTrigger className="mt-1">
                  <SelectValue placeholder="Select category" />
                </SelectTrigger>
                <SelectContent>
                  {serviceCategories.map((categoryOption) => (
                    <SelectItem key={categoryOption} value={categoryOption}>
                      {categoryOption}
                    </SelectItem>
                  ))}
                  {!serviceCategories.length && <SelectItem value="GENERAL">GENERAL</SelectItem>}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Event</Label>
              <Select
                value={newSvc.event}
                onValueChange={(value: ServiceEvent) => setNewSvc({ ...newSvc, event: value })}
              >
                <SelectTrigger className="mt-1">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ONCE">ONCE</SelectItem>
                  <SelectItem value="PER_UNIT">PER_UNIT</SelectItem>
                  <SelectItem value="OTHER">OTHER</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="sm:col-span-2">
              <Label>Service name</Label>
              <Input
                className="mt-1"
                value={newSvc.name}
                onChange={(event) => setNewSvc({ ...newSvc, name: event.target.value })}
              />
            </div>
            <div>
              <Label>Unit</Label>
              <Input
                className="mt-1"
                value={newSvc.unit}
                onChange={(event) => setNewSvc({ ...newSvc, unit: event.target.value })}
              />
            </div>
            <div>
              <Label>Default rate (USD)</Label>
              <Input
                className="mt-1"
                type="number"
                step="0.01"
                value={newSvc.defaultRate}
                onChange={(event) =>
                  setNewSvc({ ...newSvc, defaultRate: Number(event.target.value || 0) })
                }
              />
            </div>
          </div>
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setOpenAddSvc(false)}>
              Cancel
            </Button>
            <Button onClick={addService} disabled={!newSvc.name.trim()}>
              Add
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={openBulkSvc} onOpenChange={setOpenBulkSvc}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Bulk import services</DialogTitle>
            <DialogDescription>
              Paste CSV lines in the format: <code>name, unit, rate</code>
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-3 sm:grid-cols-2">
            <div>
              <Label>Category</Label>
              <Select value={bulkCategory} onValueChange={(value) => setBulkCategory(value)}>
                <SelectTrigger className="mt-1">
                  <SelectValue placeholder="Select category" />
                </SelectTrigger>
                <SelectContent>
                  {serviceCategories.map((categoryOption) => (
                    <SelectItem key={categoryOption} value={categoryOption}>
                      {categoryOption}
                    </SelectItem>
                  ))}
                  {!serviceCategories.length && <SelectItem value="GENERAL">GENERAL</SelectItem>}
                </SelectContent>
              </Select>
            </div>
            <div className="sm:col-span-2">
              <Label>CSV</Label>
              <textarea
                className="mt-1 h-40 w-full rounded-md border px-3 py-2 text-sm"
                placeholder={'Pick & Pack, unit, 1.25\nInbound receiving (pallet), pallet, 18'}
                value={bulkText}
                onChange={(event) => setBulkText(event.target.value)}
              />
            </div>
          </div>
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setOpenBulkSvc(false)}>
              Cancel
            </Button>
            <Button onClick={runBulkImport} disabled={!bulkText.trim()}>
              Import
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={openAddTier} onOpenChange={setOpenAddTier}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add storage tier</DialogTitle>
            <DialogDescription>Define a new tier for monthly storage pricing.</DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="sm:col-span-2">
              <Label>Name</Label>
              <Input
                className="mt-1"
                value={newTier.name}
                onChange={(event) => setNewTier({ ...newTier, name: event.target.value })}
              />
            </div>
            <div>
              <Label>Min</Label>
              <Input
                className="mt-1"
                type="number"
                value={newTier.min}
                onChange={(event) => setNewTier({ ...newTier, min: Number(event.target.value || 0) })}
              />
            </div>
            <div>
              <Label>Max</Label>
              <Input
                className="mt-1"
                type="number"
                value={newTier.max ?? ''}
                placeholder="—"
                onChange={(event) => {
                  const value = event.target.value
                  setNewTier({ ...newTier, max: value === '' ? undefined : Number(value) })
                }}
              />
            </div>
            <div className="sm:col-span-2">
              <Label>Rate (USD/m³)</Label>
              <Input
                className="mt-1"
                type="number"
                step="0.01"
                value={newTier.rate}
                onChange={(event) =>
                  setNewTier({ ...newTier, rate: Number(event.target.value || 0) })
                }
              />
            </div>
          </div>
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setOpenAddTier(false)}>
              Cancel
            </Button>
            <Button onClick={addTier} disabled={!newTier.name.trim()}>
              Add Tier
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
