'use client'

import { useMemo, useState, useEffect, useCallback } from 'react'
import Link from 'next/link'
import { useSupabase } from '@/components/supabase-provider'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Loader2 } from 'lucide-react'
import { cn } from '@/lib/utils'

interface WarehouseRow {
  id: string
  name: string
  city: string
  state: string
  is_default?: boolean | null
  parent_account_id?: string | null
  source?: string | null
  wms_facility_id?: string | null
  is_active?: boolean | null
}

const formatLocation = (city?: string | null, state?: string | null) =>
  [city, state].filter(Boolean).join(', ')

export default function WarehousesPage() {
  const [search, setSearch] = useState('')
  const [rows, setRows] = useState<WarehouseRow[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [openAdd, setOpenAdd] = useState(false)
  const [saving, setSaving] = useState(false)
  const [draft, setDraft] = useState<WarehouseRow>({ id: '', name: '', city: '', state: '', is_default: false })
  const supabase = useSupabase()

  const authFetch = useCallback(async (input: RequestInfo, init?: RequestInit) => {
    const {
      data: { session },
      error: sessionError,
    } = await supabase.auth.getSession()
    if (sessionError) throw sessionError
    const token = session?.access_token
    if (!token) throw new Error('Not authenticated')

    const headers = new Headers(init?.headers ?? {})
    if (!headers.has('Content-Type') && init?.body) {
      headers.set('Content-Type', 'application/json')
    }
    headers.set('Authorization', `Bearer ${token}`)

    return fetch(input, {
      credentials: 'include',
      ...init,
      headers,
    })
  }, [supabase])

  // Load warehouses via server API (Service Role) to access schema `billing`
  useEffect(() => {
    let isMounted = true
    const load = async () => {
      setLoading(true)
      setError(null)
      try {
        const res = await authFetch('/api/billing/warehouses', { cache: 'no-store' })
        const json = await res.json()
        if (!isMounted) return
        if (!res.ok) throw new Error(json.error || 'Failed to load warehouses')
        setRows(json.data as WarehouseRow[])
      } catch (e: any) {
        if (!isMounted) return
        setError(e.message)
        setRows([])
      } finally {
        if (isMounted) setLoading(false)
      }
    }
    load()
    return () => { isMounted = false }
  }, [authFetch])

  const filtered = useMemo(() => {
    if (!search.trim()) return rows
    const q = search.toLowerCase()
    return rows.filter(r => [r.name, r.city, r.state, r.id].some(v => (v || '').toLowerCase().includes(q)))
  }, [rows, search])

  const setDefault = async (id: string) => {
    // Optimistic UI
    const prev = rows
    setRows(prev => prev.map(r => ({ ...r, is_default: r.id === id })))
    try {
      const res = await authFetch('/api/billing/warehouses', {
        method: 'POST',
        body: JSON.stringify({ action: 'setDefault', warehouse_id: id })
      })
      const json = await res.json()
      if (!res.ok) throw new Error(json.error || 'Failed to set default warehouse')
      if (Array.isArray(json.data)) {
        setRows(json.data as WarehouseRow[])
      }
    } catch (e: any) {
      // rollback if failed
      setRows(prev)
      setError(e.message)
    }
  }

  const addWarehouse = async () => {
    if (!draft.name.trim() || !draft.city.trim() || !draft.state.trim()) return
    setSaving(true)
    try {
      const payload: any = {
        action: 'create',
        name: draft.name.trim(),
        city: draft.city.trim(),
        state: draft.state.trim(),
        is_default: Boolean(draft.is_default)
      }
      if (draft.id.trim()) payload.id = draft.id.trim() // optional custom id if backend allows

      const res = await authFetch('/api/billing/warehouses', {
        method: 'POST',
        body: JSON.stringify(payload)
      })
      const json = await res.json()
      if (!res.ok) throw new Error(json.error || 'Failed to create warehouse')
      setRows(prev => {
        if (Array.isArray(json.data)) {
          return json.data as WarehouseRow[]
        }
        if (json.data) {
          return [...prev, json.data as WarehouseRow]
        }
        return prev
      })
      setOpenAdd(false)
      setDraft({ id: '', name: '', city: '', state: '', is_default: false })
    } catch (e: any) {
      setError(e.message)
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="p-8 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Warehouses</h1>
          <p className="text-sm text-muted-foreground">Sites available for pricing and billing.</p>
        </div>
        <div className="flex gap-2">
          <Input placeholder="Search warehouses…" value={search} onChange={(e) => setSearch(e.target.value)} className="w-64" />
          <Button variant="outline" onClick={() => location.reload()}>Refresh</Button>
          <Button onClick={() => setOpenAdd(true)} disabled={saving}>{saving ? 'Saving…' : 'Add warehouse'}</Button>
        </div>
      </div>

      {error && (
        <div className="rounded border border-destructive/30 bg-destructive/10 text-destructive px-3 py-2 text-sm">
          {error}
        </div>
      )}

      {/* Table */}
      <Card className="p-4 bg-white">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="text-muted-foreground">
              <tr className="text-left border-b">
                <th className="py-2 pr-3">Name</th>
                <th className="py-2 pr-3">Location</th>
                <th className="py-2 pr-3">ID</th>
                <th className="py-2 text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading && (
                <tr>
                  <td colSpan={4} className="py-6 text-center text-muted-foreground">
                    <div className="inline-flex items-center gap-2">
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Loading warehouses…
                    </div>
                  </td>
                </tr>
              )}
              {!loading && filtered.map((w) => (
                <tr key={w.id} className="border-b last:border-0">
                  <td className="py-2 pr-3 font-medium">
                    {w.name}
                    {w.is_default && <span className="ml-2 text-xs rounded bg-muted px-2 py-0.5 align-middle">Default</span>}
                  </td>
                  <td className="py-2 pr-3">{formatLocation(w.city, w.state)}</td>
                  <td className="py-2 pr-3 font-mono text-xs text-muted-foreground">{w.id}</td>
                  <td className="py-2 text-right space-x-2">
                    <Link href="/billing/plans"><Button size="sm" variant="outline">Open catalog</Button></Link>
                    {!w.is_default && <Button size="sm" variant="outline" onClick={() => setDefault(w.id)}>Set default</Button>}
                  </td>
                </tr>
              ))}
              {!loading && filtered.length === 0 && (
                <tr>
                  <td colSpan={4} className="py-6 text-center text-muted-foreground">No warehouses found.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Add Warehouse Dialog */}
      <Dialog open={openAdd} onOpenChange={setOpenAdd}>
        <DialogContent className="bg-white">
          <DialogHeader>
            <DialogTitle>Add warehouse</DialogTitle>
            <DialogDescription>Register a new warehouse site for pricing and billing.</DialogDescription>
          </DialogHeader>
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="sm:col-span-2">
              <Label>Name</Label>
              <Input className="mt-1" value={draft.name} onChange={(e) => setDraft({ ...draft, name: e.target.value })} />
            </div>
            <div>
              <Label>City</Label>
              <Input className="mt-1" value={draft.city} onChange={(e) => setDraft({ ...draft, city: e.target.value })} />
            </div>
            <div>
              <Label>State</Label>
              <Input className="mt-1" value={draft.state} onChange={(e) => setDraft({ ...draft, state: e.target.value })} />
            </div>
            <div className="sm:col-span-2">
              <Label>ID (optional)</Label>
              <Input className="mt-1" placeholder="wh_custom" value={draft.id} onChange={(e) => setDraft({ ...draft, id: e.target.value })} />
            </div>
          </div>
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setOpenAdd(false)}>Cancel</Button>
            <Button onClick={addWarehouse} disabled={saving}>{saving ? 'Saving…' : 'Add'}</Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
