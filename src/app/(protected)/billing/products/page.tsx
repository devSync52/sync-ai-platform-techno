'use client'

import { useMemo, useState, useEffect, useCallback } from 'react'
import { useSupabase } from '@/components/supabase-provider'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Loader2 } from 'lucide-react'

interface ProductRow {
  id: string
  sku: string | null
  description: string | null
  available: number | null
  on_hold: number | null
  warehouse_name: string | null
  product_source: string | null
  account_name: string | null
  updated_at: string | null
}

const formatDateTime = (value?: string | null) => {
  if (!value) return '-'
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return '-'
  return date.toLocaleString()
}

const containsHtml = (value?: string | null) => {
  if (!value) return false
  return /<\/?[a-z][\s\S]*>/i.test(value)
}

const stripHtml = (value?: string | null) => {
  if (!value) return ''
  return value
    .replace(/<[^>]+>/g, ' ')
    .replace(/&nbsp;/gi, ' ')
    .replace(/&amp;/gi, '&')
    .replace(/&lt;/gi, '<')
    .replace(/&gt;/gi, '>')
    .replace(/&quot;/gi, '"')
    .replace(/&#39;/gi, "'")
    .replace(/\s+/g, ' ')
    .trim()
}

const sanitizeHtmlForPreview = (value?: string | null) => {
  if (!value) return ''
  return value
    .replace(/<script[\s\S]*?>[\s\S]*?<\/script>/gi, '')
    .replace(/<style[\s\S]*?>[\s\S]*?<\/style>/gi, '')
    .replace(/\son\w+="[^"]*"/gi, '')
    .replace(/\son\w+='[^']*'/gi, '')
    .replace(/\s(href|src)=["']javascript:[^"']*["']/gi, '')
}

export default function BillingProductsPage() {
  const [search, setSearch] = useState('')
  const [rows, setRows] = useState<ProductRow[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [syncingSellercloud, setSyncingSellercloud] = useState(false)
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

  const load = useCallback(async () => {
    setLoading(true)
    setError(null)

    try {
      const res = await authFetch('/api/billing/products', { cache: 'no-store' })
      const json = await res.json()
      if (!res.ok) throw new Error(json.error || 'Failed to load products')
      setRows(Array.isArray(json.data) ? (json.data as ProductRow[]) : [])
    } catch (e: any) {
      setRows([])
      setError(e.message)
    } finally {
      setLoading(false)
    }
  }, [authFetch])

  useEffect(() => {
    void load()
  }, [load])

  const filtered = useMemo(() => {
    if (!search.trim()) return rows
    const q = search.toLowerCase()
    return rows.filter((r) =>
      [
        r.sku,
        r.description,
        r.warehouse_name,
        r.product_source,
        r.account_name,
        r.id,
      ]
        .filter(Boolean)
        .some((v) => String(v).toLowerCase().includes(q)),
    )
  }, [rows, search])

  const syncSellercloudProducts = async () => {
    setSyncingSellercloud(true)
    setError(null)

    try {
      const res = await authFetch('/api/billing/products', {
        method: 'POST',
        body: JSON.stringify({ action: 'syncSellercloud' }),
      })
      const json = await res.json()
      if (!res.ok) throw new Error(json.error || 'Failed to sync Sellercloud products')
      setRows(Array.isArray(json.data) ? (json.data as ProductRow[]) : [])
    } catch (e: any) {
      setError(e.message)
    } finally {
      setSyncingSellercloud(false)
    }
  }

  return (
    <div className="p-8 space-y-6">
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Products</h1>
          <p className="text-sm text-muted-foreground">Items available for inventory and billing operations.</p>
        </div>
        <div className="flex gap-2">
          <Input
            placeholder="Search products..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-64"
          />
          <Button variant="outline" onClick={() => void load()} disabled={loading}>
            Refresh
          </Button>
          <Button variant="outline" onClick={syncSellercloudProducts} disabled={syncingSellercloud}>
            {syncingSellercloud ? 'Syncing...' : 'Sync Sellercloud'}
          </Button>
        </div>
      </div>

      {error && (
        <div className="rounded border border-destructive/30 bg-destructive/10 text-destructive px-3 py-2 text-sm">
          {error}
        </div>
      )}

      <Card className="p-4 bg-white">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="text-muted-foreground">
              <tr className="text-left border-b">
                <th className="py-2 pr-3">SKU</th>
                <th className="py-2 pr-3">Description</th>
                <th className="py-2 pr-3">Available</th>
                <th className="py-2 pr-3">On hold</th>
                <th className="py-2 pr-3">Warehouse</th>
                <th className="py-2 pr-3">Source</th>
                <th className="py-2 pr-3">Account</th>
                <th className="py-2 pr-3">Updated</th>
              </tr>
            </thead>
            <tbody>
              {loading && (
                <tr>
                  <td colSpan={8} className="py-6 text-center text-muted-foreground">
                    <div className="inline-flex items-center gap-2">
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Loading products...
                    </div>
                  </td>
                </tr>
              )}

              {!loading && filtered.map((p) => (
                <tr key={`${p.id}-${p.sku ?? 'no-sku'}`} className="border-b last:border-0">
                  <td className="py-2 pr-3 font-medium">{p.sku || '-'}</td>
                  <td className="py-2 pr-3">
                    {!p.description ? (
                      '-'
                    ) : containsHtml(p.description) ? (
                      <div
                        className="max-h-16 overflow-hidden text-sm leading-5 [&_table]:w-full [&_td]:align-top"
                        dangerouslySetInnerHTML={{ __html: sanitizeHtmlForPreview(p.description) }}
                      />
                    ) : (
                      stripHtml(p.description)
                    )}
                  </td>
                  <td className="py-2 pr-3">{p.available ?? '-'}</td>
                  <td className="py-2 pr-3">{p.on_hold ?? '-'}</td>
                  <td className="py-2 pr-3">{p.warehouse_name || '-'}</td>
                  <td className="py-2 pr-3">
                    <span className="rounded bg-muted px-2 py-0.5 text-xs uppercase">
                      {String(p.product_source || 'unknown')}
                    </span>
                  </td>
                  <td className="py-2 pr-3">{p.account_name || '-'}</td>
                  <td className="py-2 pr-3 whitespace-nowrap text-xs text-muted-foreground">
                    {formatDateTime(p.updated_at)}
                  </td>
                </tr>
              ))}

              {!loading && filtered.length === 0 && (
                <tr>
                  <td colSpan={8} className="py-6 text-center text-muted-foreground">
                    No products found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  )
}
