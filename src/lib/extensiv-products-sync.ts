import { NextRequest } from 'next/server'

type JsonRecord = Record<string, unknown>

export type ExtensivProductSyncResult = {
  success: boolean
  upserted: number
  functionName: string | null
  payloadUsed: JsonRecord | null
  raw: JsonRecord | null
  error: string | null
}

type SyncInput = {
  supabaseUrl: string
  serviceRoleKey?: string | null
  channelId?: string | null
  accountId?: string | null
}

const toRecord = (value: unknown): JsonRecord | null =>
  value && typeof value === 'object' && !Array.isArray(value) ? (value as JsonRecord) : null

const toNumber = (value: unknown): number => {
  const numeric = Number(value)
  return Number.isFinite(numeric) ? numeric : 0
}

const parseResponseBody = async (response: Response): Promise<JsonRecord | null> => {
  const text = await response.text()
  if (!text) return null

  try {
    return toRecord(JSON.parse(text))
  } catch {
    return { message: text }
  }
}

const getErrorMessage = (body: JsonRecord | null, status: number): string => {
  const explicit =
    (typeof body?.error === 'string' && body.error) ||
    (typeof body?.message === 'string' && body.message) ||
    null

  return explicit ?? `Edge function call failed with status ${status}`
}

export async function syncExtensivProducts(input: SyncInput): Promise<ExtensivProductSyncResult> {
  const { supabaseUrl, serviceRoleKey, channelId, accountId } = input
  const baseUrl = supabaseUrl.replace(/\/+$/, '')

  const headers: HeadersInit = {
    'Content-Type': 'application/json',
  }

  if (serviceRoleKey) {
    headers.Authorization = `Bearer ${serviceRoleKey}`
  }

  const attempts: Array<{ functionName: string; payload: JsonRecord }> = []

  if (channelId) {
    attempts.push(
      { functionName: 'import_products_extensiv', payload: { channel_id: channelId } },
      { functionName: 'sync_extensiv_products', payload: { channel_id: channelId } }
    )
  }

  if (accountId) {
    attempts.push(
      { functionName: 'n-sync-products-extensiv', payload: { account_id: accountId } },
      { functionName: 'sync_extensiv_products', payload: { account_id: accountId } },
      { functionName: 'import_products_extensiv', payload: { account_id: accountId } }
    )
  }

  if (!attempts.length) {
    return {
      success: false,
      upserted: 0,
      functionName: null,
      payloadUsed: null,
      raw: null,
      error: 'Missing channelId/accountId for Extensiv sync',
    }
  }

  const seen = new Set<string>()
  const uniqueAttempts = attempts.filter(({ functionName, payload }) => {
    const key = `${functionName}:${JSON.stringify(payload)}`
    if (seen.has(key)) return false
    seen.add(key)
    return true
  })

  let lastError = 'All Extensiv product sync attempts failed'
  let lastBody: JsonRecord | null = null

  for (const attempt of uniqueAttempts) {
    const response = await fetch(`${baseUrl}/functions/v1/${attempt.functionName}`, {
      method: 'POST',
      headers,
      body: JSON.stringify(attempt.payload),
    })

    const body = await parseResponseBody(response)

    if (response.ok && body?.success !== false) {
      return {
        success: true,
        upserted: toNumber(body?.upserted ?? body?.imported ?? body?.total_upserted),
        functionName: attempt.functionName,
        payloadUsed: attempt.payload,
        raw: body,
        error: null,
      }
    }

    lastBody = body
    lastError = getErrorMessage(body, response.status)
  }

  return {
    success: false,
    upserted: 0,
    functionName: null,
    payloadUsed: null,
    raw: lastBody,
    error: lastError,
  }
}

export async function OPTIONS(req: NextRequest) {
  return new Response('ok', { status: 200 })
}
