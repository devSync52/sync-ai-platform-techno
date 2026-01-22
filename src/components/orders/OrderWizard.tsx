'use client'

import { useParams, useRouter } from 'next/navigation'
import { useEffect, useRef, useState } from 'react'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import type { Database } from '@/types/supabase'
import QuoteStepsHeader, { QuoteStepsHeaderProps } from './QuoteStepsHeader'
import { Step1ClientSelection } from './steps/Step1ClientSelection'
import { Step2WarehouseSelection } from './steps/Step2WarehouseSelection'
import Step3ShippingDetails from './steps/Step3ShippingDetails'
import Step4PackageDetails from './steps/Step4PackageDetails'
import { Button } from '@/components/ui/button'


type Json = string | number | boolean | null | { [key: string]: Json } | Json[]

type WizardError = {
  message: string
  details?: string | null
  hint?: string | null
  code?: string | null
}


// Robustly extract a client id from various draft.client shapes (string, JSON object, JSON-encoded string, etc)
const extractClientId = (raw: any): string | null => {
  if (raw === null || raw === undefined) return null

  // If it's already an object (jsonb), try common shapes
  if (typeof raw === 'object') {
    const id = (raw as any)?.id ?? (raw as any)?.client_id ?? (raw as any)?.value
    return id ? String(id) : null
  }

  // If it's a string, it might be a plain uuid OR a JSON-encoded string (e.g. "\"uuid\"")
  if (typeof raw === 'string') {
    const s = raw.trim()
    if (!s) return null

    // Try parse JSON if it looks like JSON (quotes/braces/brackets)
    if (
      (s.startsWith('"') && s.endsWith('"')) ||
      s.startsWith('{') ||
      s.startsWith('[')
    ) {
      try {
        const parsed = JSON.parse(s)
        return extractClientId(parsed)
      } catch {
        // fall through
      }
    }

    return s
  }

  return null
}

const sanitizeFileName = (name: string) => {
  // Supabase Storage keys are URL-path-like; avoid spaces/unicode/control chars.
  // Keep it deterministic and readable.
  const normalized = name.normalize('NFD').replace(/\p{Diacritic}+/gu, '')
  const replaced = normalized.replace(/\s+/g, '-').replace(/[^a-zA-Z0-9._-]/g, '')
  // Prevent empty or overly long filenames
  const safe = replaced.length > 0 ? replaced : 'file'
  return safe.slice(0, 120)
}

type EnrichmentFile = {
  name: string
  path: string
  url: string | null
  contentType: string | null
  size: number | null
  createdAt: string
}

const supabase = createClientComponentClient<Database>()

export default function OrderWizard() {
  const { id: quoteId } = useParams()
  const [quoteData, setQuoteData] = useState<Database['public']['Tables']['saip_quote_drafts']['Row'] | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<WizardError | null>(null)
  const [currentStep, setCurrentStep] = useState(0)

  const [docsOpen, setDocsOpen] = useState(false)
  const [uploadingDocs, setUploadingDocs] = useState(false)
  const [enriching, setEnriching] = useState(false)
  const [enrichModalOpen, setEnrichModalOpen] = useState(false)

  const [dragActive, setDragActive] = useState(false)

  const fileInputRef = useRef<HTMLInputElement | null>(null)
  const cameraInputRef = useRef<HTMLInputElement | null>(null)

  // Keep the selected client id in sync with the draft
  const [clientId, setClientId] = useState<string | null>(null)

  // Only allow document upload/extraction after the user selects a client.
  const canUseDocs = !!clientId
  useEffect(() => {
    const next = extractClientId(quoteData?.client)
    setClientId(next)
  }, [quoteData?.client])

  const openFilePicker = () => {
    if (!canUseDocs) {
      alert('Select a client first to upload a document/photo.')
      return
    }
    fileInputRef.current?.click()
  }
  const openCamera = () => {
    if (!canUseDocs) {
      alert('Select a client first to take a photo.')
      return
    }
    cameraInputRef.current?.click()
  }

  const onDrag = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()

    if (!canUseDocs) return

    if (e.type === 'dragenter' || e.type === 'dragover') setDragActive(true)
    if (e.type === 'dragleave') setDragActive(false)
  }

  const onDrop = async (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setDragActive(false)

    if (!canUseDocs) {
      alert('Select a client first to upload a document/photo.')
      return
    }

    const files = e.dataTransfer?.files

    if (getExistingFiles().length > 0) {
      alert('Only one document/photo is allowed. Remove the current file to upload a new one.')
      return
    }

    if (files && files.length) await handleUploadDocuments(files)
  }

  useEffect(() => {
    if (!quoteId) return

    const fetchQuote = async () => {
      try {
        const id = Array.isArray(quoteId) ? quoteId[0] : quoteId
    
        const res = await fetch(`/api/quotes/drafts/${id}`, {
          credentials: 'include',
        })
    
        const json = await res.json().catch(() => ({}))
    
        if (!res.ok) {
          setError({
            message:
              json?.error ||
              json?.message ||
              'Quote not found or access denied (RLS).',
            details: null,
            hint: json?.hint ?? null,
            code: String(res.status),
          })
          return
        }
    
        const draft = (json?.draft ?? json?.data?.draft ?? null) as any
    
        if (!draft) {
          setError({
            message: 'Quote not found or access denied (RLS).',
            details: null,
            hint:
              'Ensure the server route validates the user and tenant for this draft.',
            code: 'PGRST116',
          })
          return
        }
    
        setQuoteData(draft)
      } catch (e: any) {
        setError({
          message: e?.message || 'Failed to load quote',
          details: null,
          hint: null,
          code: 'FETCH_ERROR',
        })
      } finally {
        setLoading(false)
      }
    }

    fetchQuote()
  }, [quoteId])


  const getExistingFiles = (): EnrichmentFile[] => {
    const prefs: any = quoteData?.preferences ?? {}
    const files = prefs?.enrichment_files
    return Array.isArray(files) ? (files as EnrichmentFile[]) : []
  }

  const getEnrichmentSuggestions = () => {
    const prefs: any = quoteData?.preferences ?? {}
    return prefs?.enrichment_suggestions ?? null
  }

  const parseJsonMaybe = <T,>(v: any): T | null => {
    if (v === null || v === undefined) return null
    if (typeof v === 'object') return v as T
    if (typeof v === 'string') {
      try {
        return JSON.parse(v) as T
      } catch {
        return null
      }
    }
    return null
  }

  const normalizeCountry = (c: any): string | null => {
    if (!c) return null
    const s = String(c).trim()
    if (!s) return null
    const up = s.toUpperCase()
    if (up === 'USA' || up === 'UNITED STATES' || up === 'UNITED STATES OF AMERICA') return 'US'
    return s
  }

  const formatLine = (...parts: Array<string | null | undefined>) =>
    parts
      .map((p) => (typeof p === 'string' ? p.trim() : ''))
      .filter(Boolean)
      .join(', ')

  const renderAddressBlock = (label: string, a: any) => {
    if (!a) return null

    const nameLine = a.full_name || a.name || ''
    const addr1 = a.address_line1 || a.line1 || ''
    const addr2 = a.address_line2 || a.line2 || ''
    const cityStateZip = formatLine(a.city, a.state, a.zip_code)
    const country = a.country || ''
    const contact = formatLine(a.email, a.phone)

    return (
      <div className="rounded-md border bg-background p-3">
        <p className="text-xs font-semibold text-muted-foreground">{label}</p>
        <p className="mt-1 text-sm font-medium">{nameLine || '—'}</p>
        <p className="mt-1 text-sm text-muted-foreground">
          {[addr1, addr2].filter(Boolean).join(' ')}
        </p>
        <p className="text-sm text-muted-foreground">{cityStateZip || ''}</p>
        <p className="text-sm text-muted-foreground">{country || ''}</p>
        {contact ? <p className="mt-1 text-xs text-muted-foreground">{contact}</p> : null}
      </div>
    )
  }

  const renderItemsTable = (items: any[]) => {
    const rows = Array.isArray(items) ? items : []
    if (rows.length === 0) {
      return (
        <div className="rounded-md border bg-background p-3">
          <p className="text-xs font-semibold text-muted-foreground">Items</p>
          <p className="mt-1 text-sm">No items detected.</p>
        </div>
      )
    }

    return (
      <div className="rounded-md border bg-background p-3">
        <div className="flex items-center justify-between">
          <p className="text-xs font-semibold text-muted-foreground">Items</p>
          <p className="text-xs text-muted-foreground">{rows.length} line(s)</p>
        </div>
        <div className="mt-2 overflow-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-xs text-muted-foreground">
                <th className="pr-3">SKU</th>
                <th className="pr-3">Description</th>
                <th className="w-16">Qty</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((it: any, idx: number) => (
                <tr key={idx} className="border-t">
                  <td className="pr-3 py-2 align-top">{it?.sku || '—'}</td>
                  <td className="pr-3 py-2 align-top">{it?.description || '—'}</td>
                  <td className="py-2 align-top">{it?.quantity ?? '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    )
  }

  const enrichViaApi = async (draftId: string) => {
    const res = await fetch('/api/quotes/enrich', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        // Minimal authorization header used by the API route
        'x-user-id': String(quoteData?.user_id ?? ''),
      },
      body: JSON.stringify({ draftId }),
    })

    const json = await res.json().catch(() => ({}))
    if (!res.ok) throw new Error(json?.error || `Enrich failed (${res.status})`)
    return json
  }

  const handleExtractInfo = async () => {
    if (!quoteData?.id) return
    if (getExistingFiles().length === 0) {
      alert('Please upload at least one document or photo first.')
      return
    }

    setEnrichModalOpen(true)
    setEnriching(true)
    try {
      const res = await enrichViaApi(quoteData.id)

      // The API also saves `preferences.enrichment_suggestions` server-side.
      // For immediate UI feedback, mirror it into local state as well.
      const prefs: any = quoteData?.preferences ?? {}
      const nextPrefs = {
        ...prefs,
        enrichment_suggestions: {
          generatedAt: new Date().toISOString(),
          model: res?.model ?? 'gpt-4.1-mini',
          suggestion: res?.suggestion ?? res?.data?.suggestion ?? null,
          perFile: res?.perFile ?? [],
          skipped: res?.skipped ?? [],
        },
      }

      setQuoteData((prev) => (prev ? { ...prev, preferences: nextPrefs as any } : prev))
    } catch (e: any) {
      console.error('❌ Enrich error:', e)
      alert(e?.message || 'Failed to extract info')
    } finally {
      setEnriching(false)
    }
  }

  const saveFilesToDraft = async (files: EnrichmentFile[]) => {
    if (!quoteData?.id) return
  
    const prefs: any = quoteData?.preferences ?? {}
    const nextPrefs = { ...prefs, enrichment_files: files }
  
    const res = await fetch(`/api/quotes/drafts/${quoteData.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({ preferences: nextPrefs }),
    })
  
    const json = await res.json().catch(() => ({}))
  
    if (!res.ok) {
      console.error('❌ Failed to save enrichment_files (api):', json)
      throw new Error(json?.error || 'Failed to save enrichment files')
    }
  
    const nextDraft = (json?.draft ?? json?.data?.draft ?? null) as any
    if (nextDraft) setQuoteData(nextDraft)
    else setQuoteData((prev) => (prev ? { ...prev, preferences: nextPrefs as any } : prev))
  }

  const updateDraft = async (
    patch: Partial<Database['public']['Tables']['saip_quote_drafts']['Update']>
  ) => {
    if (!quoteData?.id) throw new Error('Missing draft id')
  
    const res = await fetch(`/api/quotes/drafts/${quoteData.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify(patch),
    })
  
    const json = await res.json().catch(() => ({}))
  
    if (!res.ok) {
      throw new Error(json?.error || json?.message || 'Failed to update draft')
    }
  
    const nextDraft = (json?.draft ?? json?.data?.draft ?? null) as any
    if (!nextDraft) {
      throw new Error(
        'Update succeeded but draft could not be read back. Ensure the server route returns the updated row.'
      )
    }
  
    setQuoteData(nextDraft)
    return nextDraft
  }

  const getSuggestion = () => {
    const suggestions = getEnrichmentSuggestions()
    return suggestions?.suggestion ?? null
  }

  const getShipFromWarehouseId = (): string | null => {
    const sf = parseJsonMaybe<any>(quoteData?.ship_from)
    const wid = sf?.warehouse_id
    return wid ? String(wid) : null
  }

  const resolveEffectiveAccountId = async (): Promise<string | null> => {
    const accountId = quoteData?.account_id
    if (!accountId) return null

    // Warehouses are stored under the parent account (draft.account_id is the child).
    const { data, error } = await supabase
      .from('accounts')
      .select('parent_account_id')
      .eq('id', accountId)
      .single()

    if (error) {
      console.warn('[Warehouse] Failed to resolve parent account, using draft.account_id', error)
      return String(accountId)
    }

    return String((data as any)?.parent_account_id ?? accountId)
  }

  const resolveWarehouseIdByZip = async (zipRaw: any): Promise<string | null> => {
    const effectiveAccountId = await resolveEffectiveAccountId()
    if (!effectiveAccountId) return null

    const zip = String(zipRaw ?? '')
      .trim()
      // Handle ZIP+4
      .slice(0, 5)

    if (!zip) return null

    const { data, error } = await supabase
      .from('warehouses')
      .select('id, is_default')
      .eq('account_id', effectiveAccountId)
      .eq('zip_code', zip)

    if (error) {
      console.error('[Warehouse] ZIP lookup failed', error)
      return null
    }

    if (!data || data.length === 0) return null

    const preferred = (data as any[]).find((w) => w.is_default) ?? (data as any[])[0]
    return preferred?.id ? String(preferred.id) : null
  }

  const handleApplyShipFrom = async () => {
    const s: any = getSuggestion()
    if (!s?.ship_from) {
      alert('No Ship From data to apply.')
      return
    }

    const existing = parseJsonMaybe<any>(quoteData?.ship_from)
    const existingWarehouseId = existing?.warehouse_id ?? null

    const nextShipFrom = {
      name: s.ship_from.name ?? s.ship_from.full_name ?? null,
      address: {
        line1: s.ship_from.address_line1 ?? null,
        line2: s.ship_from.address_line2 ?? null,
        city: s.ship_from.city ?? null,
        state: s.ship_from.state ?? null,
        country: s.ship_from.country ?? null,
        zip_code: s.ship_from.zip_code ?? null,
      },
      contact: {
        email: s.ship_from.email ?? null,
        phone: s.ship_from.phone ?? null,
      },
      warehouse_id: existingWarehouseId,
    }

    const hasExisting = !!parseJsonMaybe<any>(quoteData?.ship_from)
    if (hasExisting) {
      const ok = confirm('This will overwrite Ship From fields (warehouse_id will be preserved). Continue?')
      if (!ok) return
    }

    try {
      // If the draft doesn't have a warehouse yet, try to resolve it by Ship From ZIP.
      if (!nextShipFrom.warehouse_id) {
        const resolved = await resolveWarehouseIdByZip(nextShipFrom?.address?.zip_code)
        if (resolved) nextShipFrom.warehouse_id = resolved
      }

      await updateDraft({ ship_from: nextShipFrom as any })
    } catch (e: any) {
      console.error('❌ Apply Ship From failed:', e)
      alert(e?.message || 'Failed to apply Ship From')
    }
  }

  const handleApplyShipTo = async () => {
    const s: any = getSuggestion()
    if (!s?.ship_to) {
      alert('No Ship To data to apply.')
      return
    }

    const nextShipTo = {
      full_name: s.ship_to.full_name ?? null,
      address_line1: s.ship_to.address_line1 ?? null,
      address_line2: s.ship_to.address_line2 ?? null,
      city: s.ship_to.city ?? null,
      state: s.ship_to.state ?? null,
      zip_code: s.ship_to.zip_code ?? null,
      country: normalizeCountry(s.ship_to.country),
      phone: s.ship_to.phone ?? null,
      email: s.ship_to.email ?? null,
    }

    const hasExisting = !!parseJsonMaybe<any>(quoteData?.ship_to)
    if (hasExisting) {
      const ok = confirm('This will overwrite Ship To fields. Continue?')
      if (!ok) return
    }

    try {
      await updateDraft({ ship_to: nextShipTo as any })
    } catch (e: any) {
      console.error('❌ Apply Ship To failed:', e)
      alert(e?.message || 'Failed to apply Ship To')
    }
  }

  const handleApplyItems = async () => {
    const s: any = getSuggestion()
    const items = Array.isArray(s?.items) ? s.items : []
    if (items.length === 0) {
      alert('No Items data to apply.')
      return
    }

    const hasExisting = Array.isArray(parseJsonMaybe<any[]>(quoteData?.items))
      ? (parseJsonMaybe<any[]>(quoteData?.items) as any[]).length > 0
      : Array.isArray(quoteData?.items)
        ? (quoteData?.items as any[]).length > 0
        : false

    if (hasExisting) {
      const ok = confirm('This will overwrite Items. Continue?')
      if (!ok) return
    }

    const nextItems = items.map((it: any) => ({
      sku: it?.sku ?? null,
      product_name: it?.description ?? null,
      quantity: typeof it?.quantity === 'number' ? it.quantity : it?.quantity ? Number(it.quantity) : null,
      // Leave optional dimensions/weight fields for the user to confirm later
      width: null,
      height: null,
      length: null,
      weight_lbs: null,
      price: null,
      subtotal: null,
      hazardous: false,
      stackable: false,
      freight_class: '',
    }))

    try {
      await updateDraft({ items: nextItems as any })
    } catch (e: any) {
      console.error('❌ Apply Items failed:', e)
      alert(e?.message || 'Failed to apply Items')
    }
  }
  const router = useRouter()
  const handleApplyAll = async () => {
    await handleApplyShipFrom()
    await handleApplyShipTo()
    await handleApplyItems()
  }

  const handleSaveOrder = async () => {
    if (!quoteData?.id) return
  
    try {
      await updateDraft(
        {
          order: true,
          status: 'converted',

          step: 4,
        } as any
      )
  
      router.push('/orders/create-order')
    } catch (e: any) {
      console.error('❌ Save Order failed:', e)
      alert(e?.message || 'Failed to save order')
    }
  }

  const uploadViaApi = async (draftId: string, file: File) => {
    const form = new FormData()
    form.append('draftId', draftId)
    form.append('file', file)

    const res = await fetch('/api/quotes/documents/upload', {
      method: 'POST',
      credentials: 'include',
      body: form,
    })

    const json = await res.json().catch(() => ({}))

    if (!res.ok) {
      throw new Error(json?.error || `Upload failed (${res.status})`)
    }

    return json as { path: string; url: string | null }
  }

  const deleteViaApi = async (draftId: string, path: string) => {
    const res = await fetch('/api/quotes/documents/delete', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        // Minimal authorization header used by the API route
        'x-user-id': String(quoteData?.user_id ?? ''),
      },
      body: JSON.stringify({ draftId, path }),
    })

    const json = await res.json().catch(() => ({}))
    if (!res.ok) throw new Error(json?.error || `Delete failed (${res.status})`)
    return json as { ok: boolean; files: EnrichmentFile[] }
  }

  const signedUrlViaApi = async (draftId: string, path: string) => {
    const res = await fetch('/api/quotes/documents/signed-url', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        // Minimal authorization header used by the API route
        'x-user-id': String(quoteData?.user_id ?? ''),
      },
      body: JSON.stringify({ draftId, path }),
    })

    const json = await res.json().catch(() => ({}))
    if (!res.ok) throw new Error(json?.error || `Signed URL failed (${res.status})`)
    return json as { url: string }
  }

  const handleViewDocument = async (doc: EnrichmentFile) => {
    if (doc.url) {
      window.open(doc.url, '_blank', 'noreferrer')
      return
    }

    if (!quoteData?.id) return

    try {
      const res = await signedUrlViaApi(quoteData.id, doc.path)
      window.open(res.url, '_blank', 'noreferrer')

      // Optional: cache the signed URL in local state for convenience (it will expire)
      const next = getExistingFiles().map((f) => (f.path === doc.path ? { ...f, url: res.url } : f))
      await saveFilesToDraft(next)
    } catch (e: any) {
      console.error('❌ Signed URL error:', e)
      alert(e?.message || 'Failed to open document')
    }
  }
  
  const handleUploadDocuments = async (fileList: FileList | null) => {
    console.log('[Docs] handleUploadDocuments called', {
      fileCount: fileList?.length ?? 0,
      draftId: quoteData?.id ?? null,
    })

    if (!fileList || fileList.length === 0) return
    if (!quoteData?.id) return
    if (getExistingFiles().length > 0) {
      alert('Only one document/photo is allowed. Remove the current file to upload a new one.')
      return
    }
    if (!canUseDocs) {
      alert('Select a client first to upload a document/photo.')
      return
    }

    let hasSupabaseSession = false

    // Debug: confirm Supabase Auth session is present for Storage RLS
    try {
      const { data: userData } = await supabase.auth.getUser()
      const { data: sessionData } = await supabase.auth.getSession()
      hasSupabaseSession = !!sessionData?.session
      console.log('[Supabase auth] user', userData?.user?.id)
      console.log('[Supabase auth] session', {
        hasSession: hasSupabaseSession,
        sessionUser: sessionData?.session?.user?.id,
      })
    } catch (e) {
      console.warn('[Supabase auth] failed to read session', e)
    }

    setUploadingDocs(true)
    try {
      const uploaded: EnrichmentFile[] = []

      for (const file of Array.from(fileList)) {
        if (!hasSupabaseSession) {
          // No Supabase Auth session on the client (RLS would block). Use server-side upload endpoint.
          try {
            const apiRes = await uploadViaApi(quoteData.id, file)
            uploaded.push({
              name: file.name,
              path: apiRes.path,
              url: apiRes.url ?? null,
              contentType: file.type ?? null,
              size: file.size ?? null,
              createdAt: new Date().toISOString(),
            })
          } catch (e: any) {
            console.error('❌ Upload error (api):', e)
            alert(e?.message || 'Upload failed')
          }
          continue
        }

        // Supabase Auth session exists: upload directly to Storage
        const key = `${crypto.randomUUID?.() ?? String(Date.now())}-${sanitizeFileName(file.name)}`
        const path = `drafts/${quoteData.id}/${key}`.replace(/^\/+/, '')

        const { error: upErr } = await supabase.storage
          .from('quote_uploads')
          .upload(path, file, {
            contentType: file.type,
            cacheControl: '3600',
            upsert: false,
          })

        if (upErr) {
          console.error('❌ Upload error:', upErr)
          continue
        }

        const { data: pub } = supabase.storage.from('quote_uploads').getPublicUrl(path)

        uploaded.push({
          name: file.name,
          path,
          url: pub?.publicUrl ?? null,
          contentType: file.type ?? null,
          size: file.size ?? null,
          createdAt: new Date().toISOString(),
        })
      }

      const merged = [...getExistingFiles(), ...uploaded]
      await saveFilesToDraft(merged)

      // Auto-extract after upload to reduce friction.
      // Runs in the background and updates the local draft preferences when done.
      if (uploaded.length > 0) {
        void (async () => {
          setEnrichModalOpen(true)
          setEnriching(true)
          try {
            const res = await enrichViaApi(quoteData.id)

            setQuoteData((prev) => {
              if (!prev) return prev
              const prefs: any = prev.preferences ?? {}
              return {
                ...prev,
                preferences: {
                  ...prefs,
                  enrichment_suggestions: {
                    generatedAt: new Date().toISOString(),
                    model: res?.model ?? 'gpt-4.1-mini',
                    suggestion: res?.suggestion ?? res?.data?.suggestion ?? null,
                    perFile: res?.perFile ?? [],
                    skipped: res?.skipped ?? [],
                  },
                } as any,
              }
            })
          } catch (e) {
            // Keep it non-blocking; user can re-run manually if needed.
            console.error('❌ Auto-enrich error:', e)
          } finally {
            setEnriching(false)
          }
        })()
      }
    } finally {
      setUploadingDocs(false)
    }
  }

  const handleRemoveDocument = async (doc: EnrichmentFile) => {
    if (!quoteData?.id) return

    const ok = confirm(`Remove ${doc.name}?`)
    if (!ok) return

    try {
      const res = await deleteViaApi(quoteData.id, doc.path)
      await saveFilesToDraft(res.files)
    } catch (e: any) {
      console.error('❌ Delete error:', e)
      alert(e?.message || 'Delete failed')
    }
  }


  useEffect(() => {
    if (currentStep === 3) {
      console.log('🚚 Itens carregados:', quoteData?.items)
    }
  }, [currentStep, quoteData])

  if (loading)
    return (
      <div className="flex h-[60vh] items-center justify-center px-3 text-sm text-muted-foreground">
        Loading...
      </div>
    )

  if (error)
    return (
      <div className="px-3 py-4 text-sm text-destructive">
        Error loading quote: {error.message}
      </div>
    )

  return (
    <div className="min-h-screen px-3 py-3 md:px-6 md:py-6 pb-[env(safe-area-inset-bottom)]">
      {/* Hidden inputs reused by desktop sidebar + mobile drawer */}
      <input
        ref={fileInputRef}
        type="file"
        multiple
        accept="image/*,application/pdf"
        className="hidden"
        onChange={(e) => {
          const input = e.currentTarget
          const files = input.files
          console.log('[Docs] file input change', { fileCount: files?.length ?? 0 })
          ;(async () => {
            await handleUploadDocuments(files)
            // Clear value so the same file can be selected again
            if (input) input.value = ''
          })()
        }}
      />
      <input
        ref={cameraInputRef}
        type="file"
        accept="image/*"
        capture="environment"
        className="hidden"
        onChange={(e) => {
          const input = e.currentTarget
          const files = input.files
          console.log('[Docs] camera input change', { fileCount: files?.length ?? 0 })
          ;(async () => {
            await handleUploadDocuments(files)
            if (input) input.value = ''
          })()
        }}
      />

      {/* Sticky / scrollable steps header on mobile */}
      <div className="sticky top-[env(safe-area-inset-top)] z-30 -mx-3 border-b bg-background/90 backdrop-blur md:static md:mx-0 md:border-0 md:bg-transparent md:backdrop-blur-0">
        <div className="overflow-x-auto px-3 md:overflow-visible md:px-0">
          <QuoteStepsHeader currentStep={currentStep} onStepClick={(idx) => setCurrentStep(Math.min(idx, 3))} />
        </div>
      </div>

      {/* Content area */}
      <div className="mx-auto mt-3 max-w-7xl md:mt-4 md:grid md:grid-cols-[1fr_360px] md:gap-4">
        <div>
          {currentStep === 0 && (
            <Step1ClientSelection
              draftId={quoteData!.id}
              initialClient={clientId}
              onClientChange={(newClientId) => setClientId(newClientId)}
              onNext={() => setCurrentStep(1)}
            />
          )}
          {currentStep === 1 && (
            <Step2WarehouseSelection
              draftId={quoteData!.id}
              initialWarehouse={getShipFromWarehouseId()}
              onWarehouseChange={(warehouseId) => {
                // ship_from is JSON; keep it as the source of truth.
                setQuoteData((prev) => {
                  if (!prev) return prev
                  const sf = parseJsonMaybe<any>(prev.ship_from) ?? {}
                  return { ...prev, ship_from: { ...sf, warehouse_id: warehouseId } as any }
                })
              }}
              onNext={() => setCurrentStep(2)}
              onBack={() => setCurrentStep(0)}
            />
          )}
          {currentStep === 2 && (
            <Step3ShippingDetails
              draftId={quoteData!.id}
              initialShipTo={quoteData!.ship_to}
              initialPreferences={quoteData!.preferences}
              onNext={() => setCurrentStep(3)}
              onBack={() => setCurrentStep(1)}
            />
          )}
          {currentStep === 3 && (
            <Step4PackageDetails
              draftId={quoteData!.id}
              initialItems={(quoteData!.items as any[]) || []}
              onNext={handleSaveOrder}
              onBack={() => setCurrentStep(2)}
              nextLabel="Save Order"
            />
          )}
        </div>

        {/* Documents panel (desktop) */}
        {canUseDocs ? (
          <aside className="hidden md:block">
          <div className="sticky top-24 rounded-lg border bg-white p-4 shadow-sm">
            <div className="mb-2 flex items-center justify-between">
              <div>
                <h3 className="text-lg font-semibold">Documents</h3>

              </div>
              <span className="rounded-full bg-muted px-2 py-1 text-xs text-muted-foreground">
                {getExistingFiles().length} {getExistingFiles().length === 1 ? 'file' : 'files'}
              </span>
            </div>
            <p className="mb-3 text-xs text-muted-foreground">
              Uploading documents helps automatically fill shipping details and items.
            </p>

            {/* Dropzone */}
            {getExistingFiles().length === 0 ? (
  <div
    onDragEnter={onDrag}
    onDragOver={onDrag}
    onDragLeave={onDrag}
    onDrop={onDrop}
    className={
      'rounded-md border-2 border-dashed p-4 text-center ' +
      (dragActive ? 'border-primary bg-primary/5' : 'border-muted-foreground/30')
    }
  >
    <p className="text-sm">{dragActive ? 'Drop to upload' : 'Drag & drop files here'}</p>
    <p className="mt-1 text-xs text-muted-foreground">PDF, JPG, PNG — we’ll use this to pre-fill steps</p>

    <div className="mt-3 flex flex-col gap-2 sm:flex-row sm:justify-center">
      <Button type="button" onClick={openFilePicker} disabled={uploadingDocs || enriching}>
        Upload files
      </Button>
      <Button type="button" variant="secondary" onClick={openCamera} disabled={uploadingDocs || enriching}>
        Take photo
      </Button>

    </div>

    {uploadingDocs && <p className="mt-3 text-xs text-muted-foreground">Uploading…</p>}
  </div>
) : (
  <div className="rounded-md border bg-muted/20 p-4 text-center">
    <p className="text-sm font-medium">1 file attached</p>
    <p className="mt-1 text-xs text-muted-foreground">
      Remove the current file to upload a new document/photo.
    </p>
    <div className="mt-3 flex justify-center">
      <Button type="button" variant="outline" onClick={handleExtractInfo} disabled={enriching}>
        {enriching ? 'Extracting…' : 'Re-extract info'}
      </Button>
    </div>
  </div>
)}

            {/* List */}
            <div className="mt-3 space-y-2">
              {getExistingFiles().length === 0 ? (
                <p className="text-sm text-muted-foreground">No files attached yet.</p>
              ) : (
                getExistingFiles().map((f, idx) => {
                  const isImage = (f.contentType || '').startsWith('image/')
                  return (
                    <div
                      key={`${f.path}-${idx}`}
                      className="flex items-center justify-between gap-2 rounded-md border px-2 py-2"
                    >
                      <div className="flex min-w-0 items-center gap-2">
                        {isImage && f.url ? (
                          <img src={f.url} alt={f.name} className="h-10 w-10 rounded object-cover" />
                        ) : (
                          <div className="flex h-10 w-10 items-center justify-center rounded bg-muted text-sm">
                            {isImage ? '🖼️' : '📄'}
                          </div>
                        )}

                        <div className="min-w-0">
                          <p className="truncate text-sm">{f.name}</p>
                          <p className="text-xs text-muted-foreground">
                            {f.contentType || 'file'}{f.size ? ` · ${(f.size / 1024).toFixed(1)} KB` : ''}
                          </p>
                        </div>
                      </div>

                      <div className="flex shrink-0 items-center gap-2">
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          className="h-7 px-2 text-xs"
                          onClick={() => handleViewDocument(f)}
                        >
                          view
                        </Button>
                        <Button variant="ghost" size="sm" onClick={() => handleRemoveDocument(f)}>
                          remove
                        </Button>
                      </div>
                    </div>
                  )
                })
              )}
            </div>

            <div className="mt-4 rounded-md bg-muted/40 p-3 text-xs text-muted-foreground">
              Tip: Upload an invoice or packing list. We’ll use it to pre-fill Ship From/To and Items.
            </div>

            {(() => {
              const suggestions = getEnrichmentSuggestions()
              const s = suggestions?.suggestion
              if (!s) return null
              return (
                <div className="mt-3 rounded-md border bg-background p-3">
                  <div className="mb-2 flex items-center justify-between">
                    <p className="text-sm font-semibold">Extracted preview</p>
                    <p className="text-xs text-muted-foreground">
                      {suggestions?.generatedAt ? new Date(suggestions.generatedAt).toLocaleString() : ''}
                    </p>
                  </div>

                  <div className="space-y-2 text-sm">
                    <div>
                      <p className="text-xs font-semibold text-muted-foreground">Ship From</p>
                      <p className="text-sm">
                        {s?.ship_from?.name || ''}{s?.ship_from?.city ? ` — ${s.ship_from.city}` : ''}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs font-semibold text-muted-foreground">Ship To</p>
                      <p className="text-sm">
                        {s?.ship_to?.full_name || ''}{s?.ship_to?.city ? ` — ${s.ship_to.city}` : ''}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs font-semibold text-muted-foreground">Items</p>
                      <p className="text-sm">{Array.isArray(s?.items) ? s.items.length : 0} line(s)</p>
                    </div>
                  </div>

                  <div className="mt-2 flex items-center justify-between gap-2">
                    <p className="text-xs text-muted-foreground">
                      Review details before applying to the form.
                    </p>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      className="h-7 px-2 text-xs"
                      onClick={() => setEnrichModalOpen(true)}
                    >
                      View details
                    </Button>
                  </div>
                </div>
              )
            })()}
          </div>
          </aside>
        ) : null}
      </div>

      {/* Documents FAB (mobile) */}
      {canUseDocs ? (
        <div className="md:hidden">
        <Button
          className="fixed bottom-5 right-5 z-40 rounded-full px-4 py-3 shadow-lg"
          onClick={() => setDocsOpen(true)}
        >
          Documents
          <span className="ml-2 rounded-full bg-background/70 px-2 py-0.5 text-xs">
            {getExistingFiles().length}
          </span>
        </Button>

        {docsOpen && (
          <div className="fixed inset-0 z-50">
            <div className="absolute inset-0 bg-black/40" onClick={() => setDocsOpen(false)} />
            <div className="absolute bottom-0 left-0 right-0 max-h-[85vh] rounded-t-xl border bg-background p-4 shadow-xl">
              <div className="mb-3 flex items-center justify-between">
                <h3 className="text-lg font-semibold">Documents</h3>
                <Button variant="ghost" onClick={() => setDocsOpen(false)}>
                  Close
                </Button>
              </div>
              <p className="mb-3 text-sm text-muted-foreground">
                Uploading documents helps automatically fill shipping details and items.
              </p>

              {/* Dropzone */}
              {getExistingFiles().length === 0 ? (
  <div
    onDragEnter={onDrag}
    onDragOver={onDrag}
    onDragLeave={onDrag}
    onDrop={onDrop}
    className={
      'rounded-md border-2 border-dashed p-4 text-center ' +
      (dragActive ? 'border-primary bg-primary/5' : 'border-muted-foreground/30')
    }
  >
    <p className="text-sm">{dragActive ? 'Drop to upload' : 'Drag & drop files here'}</p>
    <p className="mt-1 text-xs text-muted-foreground">PDF, JPG, PNG — we’ll use this to pre-fill steps</p>

    <div className="mt-3 flex flex-col gap-2 sm:flex-row sm:justify-center">
      <Button type="button" onClick={openFilePicker} disabled={uploadingDocs || enriching}>
        Upload files
      </Button>
      <Button type="button" variant="secondary" onClick={openCamera} disabled={uploadingDocs || enriching}>
        Take photo
      </Button>

    </div>

    {uploadingDocs && <p className="mt-3 text-xs text-muted-foreground">Uploading…</p>}
  </div>
) : (
  <div className="rounded-md border bg-muted/20 p-4 text-center">
    <p className="text-sm font-medium">1 file attached</p>
    <p className="mt-1 text-xs text-muted-foreground">
      Remove the current file to upload a new document/photo.
    </p>
    <div className="mt-3 flex justify-center">
      <Button type="button" variant="outline" onClick={handleExtractInfo} disabled={enriching}>
        {enriching ? 'Extracting…' : 'Re-extract info'}
      </Button>
    </div>
  </div>
)}

              <div className="space-y-2 overflow-auto pb-6">
                {getExistingFiles().length === 0 ? (
                  <p className="text-sm text-muted-foreground">No files attached yet.</p>
                ) : (
                  getExistingFiles().map((f, idx) => (
                    <div key={`${f.path}-${idx}`} className="flex items-center justify-between gap-2 rounded-md border px-2 py-2">
                      <div className="min-w-0">
                        <p className="truncate text-sm">{f.name}</p>
                        <p className="text-xs text-muted-foreground">
                          {f.contentType || 'file'}{f.size ? ` · ${(f.size / 1024).toFixed(1)} KB` : ''}
                        </p>
                      </div>
                      <div className="flex shrink-0 items-center gap-2">
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          className="h-7 px-2 text-xs"
                          onClick={() => handleViewDocument(f)}
                        >
                          view
                        </Button>
                        <Button variant="ghost" size="sm" onClick={() => handleRemoveDocument(f)}>
                          remove
                        </Button>
                      </div>
                    </div>
                  ))
                )}

                <div className="mt-3 rounded-md bg-muted/40 p-3 text-xs text-muted-foreground">
                  Tip: Upload an invoice or packing list. We’ll use it to pre-fill Ship From/To and Items.
                </div>

                {(() => {
                  const suggestions = getEnrichmentSuggestions()
                  const s = suggestions?.suggestion
                  if (!s) return null
                  return (
                    <div className="mt-3 rounded-md border bg-background p-3">
                      <div className="mb-2 flex items-center justify-between">
                        <p className="text-sm font-semibold">Extracted preview</p>
                        <p className="text-xs text-muted-foreground">
                          {suggestions?.generatedAt ? new Date(suggestions.generatedAt).toLocaleString() : ''}
                        </p>
                      </div>

                      <div className="space-y-2 text-sm">
                        <div>
                          <p className="text-xs font-semibold text-muted-foreground">Ship From</p>
                          <p className="text-sm">
                            {s?.ship_from?.name || ''}{s?.ship_from?.city ? ` — ${s.ship_from.city}` : ''}
                          </p>
                        </div>
                        <div>
                          <p className="text-xs font-semibold text-muted-foreground">Ship To</p>
                          <p className="text-sm">
                            {s?.ship_to?.full_name || ''}{s?.ship_to?.city ? ` — ${s.ship_to.city}` : ''}
                          </p>
                        </div>
                        <div>
                          <p className="text-xs font-semibold text-muted-foreground">Items</p>
                          <p className="text-sm">{Array.isArray(s?.items) ? s.items.length : 0} line(s)</p>
                        </div>
                      </div>

                      <div className="mt-2 flex items-center justify-between gap-2">
                        <p className="text-xs text-muted-foreground">
                          Review details before applying to the form.
                        </p>
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          className="h-7 px-2 text-xs"
                          onClick={() => setEnrichModalOpen(true)}
                        >
                          View details
                        </Button>
                      </div>
                    </div>
                  )
                })()}
              </div>
            </div>
          </div>
        )}
        </div>
      ) : null}
      {/* Enrichment modal */}
      {enrichModalOpen && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center">
          <div className="absolute inset-0 bg-black/40" onClick={() => setEnrichModalOpen(false)} />
          <div className="relative mx-3 w-full max-w-3xl rounded-xl border bg-background p-4 shadow-xl">
            <div className="flex items-start justify-between gap-4">
              <div>
                <h3 className="text-lg font-semibold">Document extraction</h3>
                <p className="mt-1 text-sm text-muted-foreground">
                  {enriching
                    ? 'We’re extracting shipping details and items from your document…'
                    : 'Review the extracted data before applying it to the form.'}
                </p>
              </div>
              <Button type="button" variant="ghost" onClick={() => setEnrichModalOpen(false)}>
                Close
              </Button>
            </div>

            {enriching ? (
              <div className="mt-4 rounded-md border bg-muted/20 p-4">
                <p className="text-sm font-medium">Extracting…</p>
                <p className="mt-1 text-sm text-muted-foreground">
                  This usually takes a few seconds. You can keep working while we process.
                </p>
              </div>
            ) : (
              (() => {
                const suggestions = getEnrichmentSuggestions()
                const s = suggestions?.suggestion
                if (!s) {
                  return (
                    <div className="mt-4 rounded-md border bg-muted/20 p-4">
                      <p className="text-sm">No extracted data yet.</p>
                      <p className="mt-1 text-sm text-muted-foreground">
                        Upload a document/photo and we’ll extract the details automatically.
                      </p>
                    </div>
                  )
                }

                return (
                  <div className="mt-4 space-y-3">
                    <div className="grid gap-3 md:grid-cols-2">
                      {renderAddressBlock('Ship From', s?.ship_from)}
                      {renderAddressBlock('Ship To', s?.ship_to)}
                    </div>

                    {renderItemsTable(s?.items)}

                    {s?.notes ? (
                      <div className="rounded-md border bg-background p-3">
                        <p className="text-xs font-semibold text-muted-foreground">Notes</p>
                        <p className="mt-1 whitespace-pre-wrap text-sm">{s.notes}</p>
                      </div>
                    ) : null}

                    <div className="rounded-md border bg-background p-3">
                      <p className="text-xs font-semibold text-muted-foreground">Processing</p>
                      <div className="mt-2 space-y-1 text-sm">
                        {Array.isArray(suggestions?.perFile) && suggestions.perFile.length > 0 ? (
                          suggestions.perFile.map((pf: any, idx: number) => (
                            <div key={idx} className="flex items-center justify-between gap-2">
                              <span className="truncate">{pf?.name || pf?.path || 'file'}</span>
                              <span className="text-xs text-muted-foreground">{pf?.ok ? 'ok' : pf?.error || 'failed'}</span>
                            </div>
                          ))
                        ) : (
                          <p className="text-sm text-muted-foreground">No file status available.</p>
                        )}
                      </div>
                    </div>

                    <div className="flex flex-col gap-2 pt-2 sm:flex-row sm:items-center sm:justify-between">
                      <div className="flex flex-wrap gap-2">

                        <Button type="button" onClick={handleApplyAll}>
                          Apply
                        </Button>
                      </div>

                      <Button type="button" variant="outline" onClick={() => setEnrichModalOpen(false)}>
                        Done
                      </Button>
                    </div>
                  </div>
                )
              })()
            )}
          </div>
        </div>
      )}
    </div>
  )
}