// src/app/api/quotes/enrich/route.ts
import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { createServerClient } from '@supabase/ssr'
import { createRequire } from 'module'

export const runtime = 'nodejs'


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

function getAccountContextFromUser(user: any): { accountId: string | null; role: string | null } {
  const role =
    (user?.user_metadata as any)?.role ??
    (user?.app_metadata as any)?.role ??
    null

  const accountId =
    (user?.app_metadata as any)?.parent_account_id ??
    (user?.user_metadata as any)?.parent_account_id ??
    (user?.app_metadata as any)?.account_id ??
    (user?.user_metadata as any)?.account_id ??
    null

  return { accountId: accountId ? String(accountId) : null, role: role ? String(role) : null }
}

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

async function pdfToTextPages(pdfBytes: ArrayBuffer, maxPages = 10): Promise<string[]> {
  // Extract embedded text from PDFs without pdfjs-dist bundling issues.
  // Uses `pdf-parse` (CJS). If the PDF is scanned/image-only, text will be empty.
  const req = createRequire(import.meta.url)

  // IMPORTANT: Use static string-literal requires so Next/Webpack can bundle the dependency.
  // Avoid dynamic `req(spec)` which triggers the "Critical dependency" warning and can lead to MODULE_NOT_FOUND at runtime.
  let pdfParse: any = null
  let lastErr: any = null

  try {
    pdfParse = req('pdf-parse/lib/pdf-parse.js')
  } catch (e: any) {
    lastErr = e
    try {
      pdfParse = req('pdf-parse/lib/pdf-parse')
    } catch (e2: any) {
      lastErr = e2
      try {
        pdfParse = req('pdf-parse')
      } catch (e3: any) {
        lastErr = e3
      }
    }
  }

  if (!pdfParse) {
    throw new Error(
      `Failed to load pdf-parse. Ensure it is installed (npm i pdf-parse). Last error: ${lastErr?.message || lastErr}`
    )
  }

  let data: any
  try {
    data = await pdfParse(Buffer.from(pdfBytes))
  } catch (e: any) {
    throw new Error(`pdf-parse failed to parse PDF: ${e?.message || e}`)
  }
  const text: string = String(data?.text || '').trim()

  if (!text) return []

  // Try to split by form-feed (common page separator); otherwise treat as a single page.
  const rawPages = text.split('\f').map((p) => p.trim()).filter(Boolean)
  const pages = (rawPages.length ? rawPages : [text]).slice(0, maxPages)

  return pages
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

async function callOpenAIText(documentText: string) {
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
            {
              type: 'input_text',
              text: `DOCUMENT_TEXT\n\n${documentText}`.slice(0, 120_000),
            },
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

async function resolveWarehouseIdByZip(
  supabase: any,
  accountId: string,
  zipRaw: any
): Promise<string | null> {
  const zip = String(zipRaw ?? '')
    .trim()
    .slice(0, 5) // ZIP+4 → ZIP5

  if (!zip) return null

  const { data, error } = await supabase
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

async function resolveWarehouseIdByZipWithFallback(
  supabase: any,
  childAccountId: string,
  parentAccountId: string,
  zipRaw: any
): Promise<{ id: string | null; parentAccountId: string }> {
  const fromParent = await resolveWarehouseIdByZip(supabase, parentAccountId, zipRaw)
  if (fromParent) return { id: fromParent, parentAccountId }

  // Fallback: some setups store warehouses on the child account.
  const fromChild = await resolveWarehouseIdByZip(supabase, childAccountId, zipRaw)
  return { id: fromChild, parentAccountId }
}

export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => null)
    const draftId = String(body?.draftId || '')
    if (!draftId) {
      return NextResponse.json({ error: 'draftId is required' }, { status: 400 })
    }

    const cookieStore = (await cookies()) as any

    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          get(name: string) {
            return cookieStore.get(name)?.value
          },
          set(name: string, value: string, options: any) {
            cookieStore.set({ name, value, ...options })
          },
          remove(name: string, options: any) {
            try {
              ;(cookieStore as any).delete(name)
            } catch {
              cookieStore.set({ name, value: '', ...options, maxAge: 0 })
            }
          },
        },
      }
    )

    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser()

    if (userError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { accountId: callerAccountId } = getAccountContextFromUser(user)
    if (!callerAccountId) {
      return NextResponse.json({ error: 'Missing account context' }, { status: 403 })
    }

    const { data: draft, error: draftErr } = await supabase
      .from('saip_quote_drafts')
      .select('id, user_id, account_id, preferences')
      .eq('id', draftId)
      .maybeSingle()

    if (draftErr) {
      return NextResponse.json({ error: draftErr.message }, { status: 500 })
    }

    if (!draft) {
      return NextResponse.json({ error: 'Draft not found or access denied (RLS).' }, { status: 404 })
    }

    // Extra safety: if the draft is scoped to a different tenant, deny.
    // (RLS should already enforce this, but we keep defense-in-depth.)
    const draftAccountId = String((draft as any).account_id ?? '')
    if (draftAccountId && draftAccountId !== callerAccountId) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const prefs: any = (draft as any).preferences ?? {}
    const files: EnrichmentFile[] = Array.isArray(prefs?.enrichment_files) ? prefs.enrichment_files : []

    // Images + PDFs (PDFs are parsed as text when possible; scanned PDFs need an image pipeline)
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
      const { data: signed, error: sErr } = await supabase.storage
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
        console.error('[enrich][image] vision failed', { draftId, file: f.path, error: e })
        perFile.push({ path: f.path, name: f.name, ok: false, error: e?.message || 'vision_failed' })
      }
    }

    // PDFs: extract up to 10 pages of TEXT (no canvas) and run the model per page.
    // If the PDF is scanned (no embedded text), we'll likely get empty pages and return a helpful error.
    for (const f of pdfFiles.slice(0, 1)) {
      const { data: signed, error: sErr } = await supabase.storage
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

        const pageTexts = await pdfToTextPages(pdfBytes, 10)

        const nonEmptyCount = pageTexts.filter((t) => (t || '').trim().length > 0).length
        if (nonEmptyCount === 0) {
          perFile.push({
            path: f.path,
            name: f.name,
            ok: false,
            error: 'pdf_has_no_extractable_text',
            hint: 'This PDF looks scanned/image-only. Upload a photo/PNG of the label or enable a PDF->image converter service to use vision.',
          })
          continue
        }

        for (let i = 0; i < pageTexts.length; i++) {
          const pageText = (pageTexts[i] || '').trim()
          if (!pageText) continue

          const pageName = `${f.name}#page${i + 1}`

          try {
            const { text, usage, cost } = await callOpenAIText(pageText)
            const parsed = tryParseJson<EnrichSuggestion>(text)
            if (!parsed.ok) {
              perFile.push({
                path: f.path,
                name: pageName,
                ok: false,
                error: 'model_returned_invalid_json',
                rawText: text,
                usage,
                cost,
              })
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
            console.error('[enrich][pdf][page] failed', { draftId, file: f.path, page: i + 1, error: e })
            perFile.push({ path: f.path, name: pageName, ok: false, error: e?.message || 'text_model_failed' })
          }
        }
      } catch (e: any) {
        console.error('[enrich][pdf] processing failed', { draftId, file: f.path, error: e })
        perFile.push({ path: f.path, name: f.name, ok: false, error: e?.message || 'pdf_processing_failed' })
      }
    }

    const nextPrefsDebug: any = {}

    // Server-side warehouse resolution by Ship From ZIP (avoids client-side RLS issues)
    try {
      const childAccountId = String((draft as any).account_id ?? '')
      const zip = merged?.ship_from?.zip_code

      if (childAccountId && merged?.ship_from && !merged.ship_from.warehouse_id) {
        const resolved = await resolveWarehouseIdByZipWithFallback(
          supabase,
          childAccountId,
          callerAccountId,
          zip
        )

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

    const { error: updErr } = await supabase
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
