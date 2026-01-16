// src/app/api/quotes/enrich/route.ts
import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { createRequire } from 'module'

export const runtime = 'nodejs'

// NOTE: Service-role client (server-side only)
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

type EnrichmentFile = {
  name: string
  path: string
  url: string | null
  contentType: string | null
  size: number | null
  createdAt: string
}

type EnrichSuggestion = {
  ship_from: {
    name: string | null
    address_line1: string | null
    address_line2: string | null
    city: string | null
    state: string | null
    zip_code: string | null
    country: string | null
    phone: string | null
    email: string | null
    warehouse_id: string | null
  } | null
  ship_to: {
    full_name: string | null
    address_line1: string | null
    address_line2: string | null
    city: string | null
    state: string | null
    zip_code: string | null
    country: string | null
    phone: string | null
    email: string | null
  } | null
  items: Array<{
    sku: string | null
    description: string | null
    quantity: number | null
    upc: string | null
  }>
  notes?: string | null
}

const SAFE_PROMPT = `
You extract structured shipping data from invoices, packing lists, and shipping labels.

Return ONLY valid JSON (no markdown, no commentary).

Schema:
{
  "ship_from": {
    "name": string|null,
    "address_line1": string|null,
    "address_line2": string|null,
    "city": string|null,
    "state": string|null,
    "zip_code": string|null,
    "country": string|null,
    "phone": string|null,
    "email": string|null,
    "warehouse_id": string|null
  } | null,
  "ship_to": {
    "full_name": string|null,
    "address_line1": string|null,
    "address_line2": string|null,
    "city": string|null,
    "state": string|null,
    "zip_code": string|null,
    "country": string|null,
    "phone": string|null,
    "email": string|null
  } | null,
  "items": [
    { "sku": string|null, "description": string|null, "quantity": number|null, "upc": string|null }
  ],
  "notes": string|null
}

Rules:
- If a field is missing, use null.
- Quantity must be a number when present.
- Do not invent data.
`

function extractOutputText(resp: any): string {
  if (typeof resp?.output_text === 'string') return resp.output_text

  // Fallback: traverse responses output structure
  const out = resp?.output
  if (!Array.isArray(out)) return ''

  const chunks: string[] = []
  for (const item of out) {
    const content = item?.content
    if (!Array.isArray(content)) continue
    for (const c of content) {
      if (c?.type === 'output_text' && typeof c?.text === 'string') chunks.push(c.text)
      if (c?.type === 'text' && typeof c?.text === 'string') chunks.push(c.text)
    }
  }
  return chunks.join('\n').trim()
}

async function pdfToPngDataUrls(pdfBytes: ArrayBuffer, maxPages = 5, scale = 2.0): Promise<string[]> {
  // Lazy-load deps at runtime (Node only). Use createRequire to avoid RSC/webpack eval issues.
  const req = createRequire(import.meta.url)

  // Load pdfjs at runtime (ESM). This path exists in modern pdfjs-dist.
  const pdfjsLib = (await import('pdfjs-dist/legacy/build/pdf.mjs')) as any
  const { createCanvas } = req('@napi-rs/canvas') as any

  const loadingTask = (pdfjsLib as any).getDocument({ data: new Uint8Array(pdfBytes) })
  const pdf = await loadingTask.promise

  const pageCount = Math.min(pdf.numPages, maxPages)
  const images: string[] = []

  for (let pageNum = 1; pageNum <= pageCount; pageNum++) {
    const page = await pdf.getPage(pageNum)
    const viewport = page.getViewport({ scale })

    const canvas = createCanvas(Math.ceil(viewport.width), Math.ceil(viewport.height))
    const ctx = canvas.getContext('2d')

    await (page as any).render({ canvas, canvasContext: ctx as any, viewport } as any).promise

    const pngBuffer = canvas.toBuffer('image/png')
    images.push(`data:image/png;base64,${pngBuffer.toString('base64')}`)
  }

  return images
}

function extractUsage(resp: any): { input_tokens: number; output_tokens: number; total_tokens: number } | null {
  const u = resp?.usage
  if (!u) return null
  const input = Number(u.input_tokens ?? u.prompt_tokens ?? 0)
  const output = Number(u.output_tokens ?? u.completion_tokens ?? 0)
  const total = Number(u.total_tokens ?? input + output)
  if (!Number.isFinite(input) || !Number.isFinite(output) || !Number.isFinite(total)) return null
  return { input_tokens: input, output_tokens: output, total_tokens: total }
}

function estimateCostUsdFromUsage(
  usage: { input_tokens: number; output_tokens: number },
  rates?: { input_per_mtok?: number; output_per_mtok?: number }
) {
  // Defaults (0.4 / 1.6 USD per 1M tokens) can be overridden via env vars (optional).
  const inputPerMTok =
    rates?.input_per_mtok ??
    (process.env.OPENAI_VISION_INPUT_USD_PER_MTOK ? Number(process.env.OPENAI_VISION_INPUT_USD_PER_MTOK) : 0.4)
  const outputPerMTok =
    rates?.output_per_mtok ??
    (process.env.OPENAI_VISION_OUTPUT_USD_PER_MTOK ? Number(process.env.OPENAI_VISION_OUTPUT_USD_PER_MTOK) : 1.6)

  const inputCost = (usage.input_tokens / 1_000_000) * inputPerMTok
  const outputCost = (usage.output_tokens / 1_000_000) * outputPerMTok

  return {
    input_per_mtok: inputPerMTok,
    output_per_mtok: outputPerMTok,
    input_cost_usd: inputCost,
    output_cost_usd: outputCost,
    total_cost_usd: inputCost + outputCost,
  }
}

async function callOpenAIVision(imageUrl: string) {
  const apiKey = process.env.OPENAI_API_KEY
  if (!apiKey) throw new Error('OPENAI_API_KEY is not set')

  const res = await fetch('https://api.openai.com/v1/responses', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: 'gpt-4.1-mini',
      input: [
        {
          role: 'user',
          content: [
            { type: 'input_text', text: SAFE_PROMPT },
            { type: 'input_image', image_url: imageUrl },
          ],
        },
      ],
    }),
  })

  const json = await res.json().catch(() => ({}))
  if (!res.ok) {
    throw new Error(json?.error?.message || `OpenAI error (${res.status})`)
  }

  const text = extractOutputText(json)
  const usage = extractUsage(json)
  const cost = usage ? estimateCostUsdFromUsage(usage) : null
  return { raw: json, text, usage, cost }
}

function tryParseJson<T>(text: string): { ok: true; value: T } | { ok: false; error: string } {
  try {
    const value = JSON.parse(text)
    return { ok: true, value }
  } catch (e: any) {
    return { ok: false, error: e?.message || 'Invalid JSON' }
  }
}

function mergeSuggestions(a: EnrichSuggestion, b: EnrichSuggestion): EnrichSuggestion {
  // Prefer non-null values from b
  const pickObj = (oa: any, ob: any) => {
    if (!oa && !ob) return null
    const out: any = { ...(oa || {}) }
    for (const k of Object.keys(ob || {})) {
      if (ob[k] !== null && ob[k] !== undefined && ob[k] !== '') out[k] = ob[k]
    }
    return out
  }

  // Items: concatenate and later you can dedupe by sku/description
  return {
    ship_from: pickObj(a.ship_from, b.ship_from),
    ship_to: pickObj(a.ship_to, b.ship_to),
    items: [...(a.items || []), ...(b.items || [])].filter(Boolean),
    notes: [a.notes, b.notes].filter(Boolean).join('\n') || null,
  }
}

async function resolveParentAccountId(childAccountId: string): Promise<string> {
  const { data, error } = await supabaseAdmin
    .from('accounts')
    .select('parent_account_id')
    .eq('id', childAccountId)
    .single()

  if (error) {
    console.warn('[enrich] Failed to resolve parent account, using child account id', error)
    return childAccountId
  }

  return String((data as any)?.parent_account_id ?? childAccountId)
}

async function resolveWarehouseIdByZip(accountId: string, zipRaw: any): Promise<string | null> {
  const zip = String(zipRaw ?? '')
    .trim()
    .slice(0, 5) // ZIP+4 → ZIP5

  if (!zip) return null

  const { data, error } = await supabaseAdmin
    .from('warehouses')
    .select('id, is_default')
    .eq('account_id', accountId)
    .ilike('zip_code', `${zip}%`)

  if (error) {
    console.error('[enrich] Warehouse ZIP lookup failed', error)
    return null
  }

  if (!data || data.length === 0) return null

  const preferred = (data as any[]).find((w) => w.is_default) ?? (data as any[])[0]
  return preferred?.id ? String(preferred.id) : null
}

async function resolveWarehouseIdByZipWithFallback(childAccountId: string, zipRaw: any): Promise<{ id: string | null; parentAccountId: string }> {
  const parentAccountId = await resolveParentAccountId(childAccountId)
  const fromParent = await resolveWarehouseIdByZip(parentAccountId, zipRaw)
  if (fromParent) return { id: fromParent, parentAccountId }

  // Fallback: some setups store warehouses on the child account.
  const fromChild = await resolveWarehouseIdByZip(childAccountId, zipRaw)
  return { id: fromChild, parentAccountId }
}

export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => null)
    const draftId = String(body?.draftId || '')
    if (!draftId) {
      return NextResponse.json({ error: 'draftId is required' }, { status: 400 })
    }

    // Minimal authorization (same pattern as upload/delete)
    const callerUserId = req.headers.get('x-user-id')

    const { data: draft, error: draftErr } = await supabaseAdmin
      .from('saip_quote_drafts')
      .select('id, user_id, account_id, preferences')
      .eq('id', draftId)
      .single()

    if (draftErr || !draft) {
      return NextResponse.json({ error: 'Draft not found' }, { status: 404 })
    }

    if (!callerUserId || String(draft.user_id) !== String(callerUserId)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const prefs: any = (draft as any).preferences ?? {}
    const files: EnrichmentFile[] = Array.isArray(prefs?.enrichment_files) ? prefs.enrichment_files : []

    // Images + PDFs (PDF pages are converted to images)
    const imageFiles = files.filter((f) => (f.contentType || '').startsWith('image/'))
    const pdfFiles = files.filter((f) => (f.contentType || '') === 'application/pdf')

    const skipped = files
      .filter((f) => {
        const ct = f.contentType || ''
        return !(ct.startsWith('image/') || ct === 'application/pdf')
      })
      .map((f) => ({ name: f.name, path: f.path, reason: 'unsupported_file_type' }))

    if (!imageFiles.length && !pdfFiles.length) {
      return NextResponse.json(
        { error: 'No supported files to process (images or PDFs)', skipped },
        { status: 400 }
      )
    }

    let merged: EnrichSuggestion = { ship_from: null, ship_to: null, items: [], notes: null }
    const perFile: any[] = []

    const usageTotals = { input_tokens: 0, output_tokens: 0, total_tokens: 0 }
    let totalCostUsd = 0

    for (const f of imageFiles.slice(0, 5)) {
      // signed url (10 min)
      const { data: signed, error: sErr } = await supabaseAdmin.storage
        .from('quote_uploads')
        .createSignedUrl(f.path, 60 * 10)

      if (sErr || !signed?.signedUrl) {
        perFile.push({ path: f.path, name: f.name, ok: false, error: sErr?.message || 'signed_url_failed' })
        continue
      }

      try {
        const { text, usage, cost } = await callOpenAIVision(signed.signedUrl)
        const parsed = tryParseJson<EnrichSuggestion>(text)
        if (!parsed.ok) {
          perFile.push({ path: f.path, name: f.name, ok: false, error: 'model_returned_invalid_json', rawText: text })
          continue
        }

        merged = mergeSuggestions(merged, parsed.value)

        if (usage) {
          usageTotals.input_tokens += usage.input_tokens
          usageTotals.output_tokens += usage.output_tokens
          usageTotals.total_tokens += usage.total_tokens
        }
        if (cost) totalCostUsd += cost.total_cost_usd

        perFile.push({ path: f.path, name: f.name, ok: true, usage, cost })
      } catch (e: any) {
        perFile.push({ path: f.path, name: f.name, ok: false, error: e?.message || 'vision_failed' })
      }
    }

    // PDFs: convert up to 5 pages to images and run vision per page (single file per draft)
    for (const f of pdfFiles.slice(0, 1)) {
      const { data: signed, error: sErr } = await supabaseAdmin.storage
        .from('quote_uploads')
        .createSignedUrl(f.path, 60 * 10)

      if (sErr || !signed?.signedUrl) {
        perFile.push({ path: f.path, name: f.name, ok: false, error: sErr?.message || 'signed_url_failed' })
        continue
      }

      try {
        const pdfRes = await fetch(signed.signedUrl)
        if (!pdfRes.ok) throw new Error(`Failed to download PDF (${pdfRes.status})`)
        const pdfBytes = await pdfRes.arrayBuffer()

        const pageImages = await pdfToPngDataUrls(pdfBytes, 5, 2.0)

        for (let i = 0; i < pageImages.length; i++) {
          const pageName = `${f.name}#page${i + 1}`
          try {
            const { text, usage, cost } = await callOpenAIVision(pageImages[i])
            const parsed = tryParseJson<EnrichSuggestion>(text)
            if (!parsed.ok) {
              perFile.push({ path: f.path, name: pageName, ok: false, error: 'model_returned_invalid_json', rawText: text, usage, cost })
              continue
            }

            merged = mergeSuggestions(merged, parsed.value)

            if (usage) {
              usageTotals.input_tokens += usage.input_tokens
              usageTotals.output_tokens += usage.output_tokens
              usageTotals.total_tokens += usage.total_tokens
            }
            if (cost) totalCostUsd += cost.total_cost_usd

            perFile.push({ path: f.path, name: pageName, ok: true, usage, cost })
          } catch (e: any) {
            perFile.push({ path: f.path, name: pageName, ok: false, error: e?.message || 'vision_failed' })
          }
        }
      } catch (e: any) {
        perFile.push({ path: f.path, name: f.name, ok: false, error: e?.message || 'pdf_processing_failed' })
      }
    }

    const nextPrefsDebug: any = {}

    // Server-side warehouse resolution by Ship From ZIP (avoids client-side RLS issues)
    try {
      const childAccountId = String((draft as any).account_id ?? '')
      const zip = merged?.ship_from?.zip_code

      if (childAccountId && merged?.ship_from && !merged.ship_from.warehouse_id) {
        const resolved = await resolveWarehouseIdByZipWithFallback(childAccountId, zip)

        if (resolved.id) {
          merged = {
            ...merged,
            ship_from: {
              ...merged.ship_from,
              warehouse_id: resolved.id,
            },
          }
        }

        ;(nextPrefsDebug as any).warehouse_resolution = {
          zip: String(zip ?? ''),
          childAccountId,
          parentAccountId: resolved.parentAccountId,
          resolvedWarehouseId: resolved.id,
        }
      }
    } catch (e) {
      console.warn('[enrich] Warehouse resolution skipped/failed', e)
    }

    nextPrefsDebug.openai_usage_totals = usageTotals
    nextPrefsDebug.openai_estimated_total_cost_usd = totalCostUsd
    nextPrefsDebug.openai_rates_usd_per_mtok = {
      input: process.env.OPENAI_VISION_INPUT_USD_PER_MTOK ? Number(process.env.OPENAI_VISION_INPUT_USD_PER_MTOK) : 0.4,
      output: process.env.OPENAI_VISION_OUTPUT_USD_PER_MTOK ? Number(process.env.OPENAI_VISION_OUTPUT_USD_PER_MTOK) : 1.6,
    }

    const nextPrefs = {
      ...prefs,
      enrichment_suggestions: {
        generatedAt: new Date().toISOString(),
        model: 'gpt-4.1-mini',
        suggestion: merged,
        perFile,
        skipped,
        debug: process.env.NODE_ENV !== 'production' ? nextPrefsDebug : undefined,
      },
    }

    const { error: updErr } = await supabaseAdmin
      .from('saip_quote_drafts')
      .update({ preferences: nextPrefs })
      .eq('id', draftId)

    if (updErr) {
      return NextResponse.json({ error: updErr.message }, { status: 500 })
    }

    return NextResponse.json(
      {
        ok: true,
        suggestion: merged,
        perFile,
        skipped,
        debug: process.env.NODE_ENV !== 'production' ? nextPrefsDebug : undefined,
      },
      { status: 200 }
    )
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || 'Server error' }, { status: 500 })
  }
}
