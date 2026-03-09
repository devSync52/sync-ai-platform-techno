import { NextRequest, NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { createServerClient } from '@supabase/ssr'
import { createClient } from '@supabase/supabase-js'
import AES from 'crypto-js/aes'
import Utf8 from 'crypto-js/enc-utf8'
import type { Database } from '@/types/supabase'

type SellercloudCredentials = {
  domain: string
  username: string
  password: string
  company_id?: number | null
  companyId?: number | null
  default_company_id?: number | null
  channel?: number | null
  channel_id?: number | null
  default_channel_id?: number | null
  warehouse_id?: number | null
  ship_from_warehouse_id?: number | null
}

const ENCRYPTION_KEY = process.env.NEXT_PUBLIC_CREDENTIAL_SECRET || 'SYNC_SECRET'

function getCookieHandlers(cookieStore: any) {
  return {
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
  }
}

function normalizeDomain(domain: string): string {
  const trimmed = String(domain || '').trim()
  if (!trimmed) return ''
  if (/^https?:\/\//i.test(trimmed)) return trimmed.replace(/\/+$/, '')
  return `https://${trimmed.replace(/\/+$/, '')}`
}

function parseCredentials(raw: unknown): SellercloudCredentials | null {
  if (!raw) return null

  let parsed: any = raw
  if (typeof raw === 'string') {
    try {
      const decrypted = AES.decrypt(raw, ENCRYPTION_KEY).toString(Utf8)
      parsed = JSON.parse(decrypted)
    } catch {
      return null
    }
  }

  if (!parsed || typeof parsed !== 'object') return null

  const creds: SellercloudCredentials = {
    domain: String((parsed as any).domain ?? '').trim(),
    username: String((parsed as any).username ?? '').trim(),
    password: String((parsed as any).password ?? '').trim(),
    company_id: Number((parsed as any).company_id ?? (parsed as any).companyId ?? (parsed as any).default_company_id ?? 0) || null,
    channel: Number((parsed as any).channel ?? (parsed as any).channel_id ?? (parsed as any).default_channel_id ?? 0) || null,
    warehouse_id: Number((parsed as any).warehouse_id ?? (parsed as any).ship_from_warehouse_id ?? 0) || null,
  }

  if (!creds.domain || !creds.username || !creds.password) return null
  return creds
}

function parseMaybeJson<T = any>(raw: any): T | null {
  if (raw === null || raw === undefined) return null
  if (typeof raw === 'object') return raw as T
  if (typeof raw === 'string') {
    try {
      return JSON.parse(raw) as T
    } catch {
      return null
    }
  }
  return null
}

function toNumber(value: any, fallback = 0): number {
  const n = Number(value)
  return Number.isFinite(n) ? n : fallback
}

function toPositiveInt(value: any): number | null {
  const n = Number(value)
  if (!Number.isFinite(n)) return null
  const i = Math.trunc(n)
  return i > 0 ? i : null
}

function normalizeSellercloudProductId(value: any): string {
  const raw = String(value ?? '').trim()
  if (!raw) return ''
  if (/^SC-/i.test(raw)) {
    return raw.replace(/^SC-/i, '').trim()
  }
  return raw
}

function splitName(fullName: string) {
  const clean = String(fullName || '').trim()
  if (!clean) return { firstName: '', lastName: '' }
  const parts = clean.split(/\s+/)
  if (parts.length === 1) return { firstName: parts[0], lastName: '' }
  return { firstName: parts[0], lastName: parts.slice(1).join(' ') }
}

function normalizeCountry(value: any): string {
  const raw = String(value ?? '').trim()
  const lower = raw.toLowerCase()
  if (!raw) return ''
  if (lower === 'us' || lower === 'usa') return 'US'
  if (lower.startsWith('unit')) return 'US'
  return raw
}

function ensureRequiredName(firstRaw: any, lastRaw: any, emailRaw?: any) {
  const first = String(firstRaw ?? '').trim()
  const last = String(lastRaw ?? '').trim()
  const email = String(emailRaw ?? '').trim()
  const emailLocalPart = email.includes('@') ? email.split('@')[0].trim() : ''

  if (first && last) return { firstName: first, lastName: last }
  if (first && !last) return { firstName: first, lastName: first || 'Customer' }
  if (!first && last) return { firstName: last, lastName: last }
  if (emailLocalPart) return { firstName: emailLocalPart, lastName: emailLocalPart }
  return { firstName: 'Customer', lastName: 'Customer' }
}

function buildAddress(addressRaw: any) {
  const address = addressRaw && typeof addressRaw === 'object' ? addressRaw : {}
  const fullName = String(address.full_name ?? address.name ?? '').trim()
  const parsedName = splitName(fullName)
  const safeName = ensureRequiredName(
    address.first_name ?? parsedName.firstName,
    address.last_name ?? parsedName.lastName,
    address.email
  )

  return {
    Business: String(address.business ?? '').trim(),
    FirstName: safeName.firstName,
    MiddleName: String(address.middle_name ?? '').trim(),
    LastName: safeName.lastName,
    Country: normalizeCountry(address.country),
    City: String(address.city ?? '').trim(),
    State: String(address.state ?? '').trim(),
    Region: String(address.region ?? '').trim(),
    ZipCode: String(address.zip_code ?? address.zip ?? '').trim(),
    Address: String(address.address_line1 ?? address.line1 ?? address.address ?? '').trim(),
    Address2: String(address.address_line2 ?? address.line2 ?? '').trim(),
    Phone: String(address.phone ?? '').trim(),
    Fax: String(address.fax ?? '').trim(),
    btnShowRealAddressVisible: false,
    RealShippingAddress: '',
  }
}

function mapDraftToSellercloudOrder(draft: any, body: any) {
  const shipTo = parseMaybeJson<any>(draft?.ship_to) || {}
  const shipFrom = parseMaybeJson<any>(draft?.ship_from) || {}
  const items = parseMaybeJson<any[]>(draft?.items) || []
  const preferences = parseMaybeJson<any>(draft?.preferences) || {}
  const selectedShipping = draft?.selected_service ?? {}
  const customerName = splitName(String(shipTo?.full_name || ''))
  const safeCustomerName = ensureRequiredName(
    shipTo?.first_name ?? customerName.firstName,
    shipTo?.last_name ?? customerName.lastName,
    shipTo?.email
  )

  const products = items
    .filter((item) => item && (item.sku || item.product_name))
    .map((item) => {
      const qty = Math.max(1, toNumber(item.quantity, 1))
      const sitePrice = toNumber(item.price, 0)
      const sourceProductId = String(item.sku ?? item.product_id ?? '').trim()
      const normalizedProductId = normalizeSellercloudProductId(sourceProductId)
      const referenceId = String(item.reference_id ?? '').trim()
      return {
        ProductID: normalizedProductId || sourceProductId,
        ReferenceID: referenceId || (normalizedProductId !== sourceProductId ? sourceProductId : ''),
        ProductName: String(item.product_name ?? item.name ?? '').trim(),
        SitePrice: sitePrice,
        DiscountValue: toNumber(item.discount_value, 0),
        DiscountType: toNumber(item.discount_type, 0),
        Qty: qty,
        LineTaxTotal: toNumber(item.line_tax_total, 0),
        FinalValueFee: toNumber(item.final_value_fee, 0),
        Notes: String(item.notes ?? '').trim(),
        ShipFromWareHouseID: toNumber(
          item.ship_from_warehouse_id ??
            shipFrom?.sellercloud_warehouse_id ??
            shipFrom?.warehouse_id ??
            body?.shipFromWarehouseId,
          0
        ),
        PricePerCase: toNumber(item.price_per_case, 0),
        TotalCases: toNumber(item.total_cases, 0),
        QtyPerCase: toNumber(item.qty_per_case, 0),
      }
    })

  const shippingAddress = buildAddress(shipTo)
  const billingAddressInput = preferences?.billing_address ?? shipTo
  const billingAddress = buildAddress(billingAddressInput)

  const pounds = Math.max(0, Math.trunc(toNumber(body?.weightPounds ?? 0, 0)))
  const ounces = Math.max(0, Math.trunc(toNumber(body?.weightOunces ?? 0, 0)))

  return {
    ID: 0,
    CustomerDetails: {
      ID: toNumber(body?.customerId, 0),
      Email: String(shipTo?.email ?? '').trim(),
      FirstName: safeCustomerName.firstName,
      LastName: safeCustomerName.lastName,
      Business: String(shipTo?.business ?? '').trim(),
      IsWholesale: Boolean(body?.isWholesale ?? false),
      IgnoreCreditLimit: Boolean(body?.ignoreCreditLimit ?? false),
    },
    OrderDetails: {
      CompanyID: toNumber(body?.companyId, 0),
      MarketingSource: toNumber(body?.marketingSource, 0),
      SalesRepresentative: toNumber(body?.salesRepresentative, 0),
      CurrencyCode: toNumber(body?.currencyCode, 0),
      CurrencyRateFromUSD: toNumber(body?.currencyRateFromUSD, 0),
      CurrencyRateToUSD: toNumber(body?.currencyRateToUSD, 0),
      TaxExempt: Boolean(body?.taxExempt ?? false),
      IsQuoteOrder: false,
      IsSampleOrder: Boolean(body?.isSampleOrder ?? false),
      GiftOrder: Boolean(body?.giftOrder ?? false),
      Channel: toNumber(body?.channel, 0),
      OrderSourceOrderID: String(body?.orderSourceOrderId ?? draft?.id ?? '').trim(),
      DisableInventoryCount: Boolean(body?.disableInventoryCount ?? false),
      OrderDate: String(body?.orderDate ?? draft?.created_at ?? new Date().toISOString()),
      EbaySellingManagerSalesRecordNumber: String(body?.ebaySellingManagerSalesRecordNumber ?? '').trim(),
    },
    GiftDetails: {
      UseGiftWrap: Boolean(body?.useGiftWrap ?? false),
      GiftMessage: String(body?.giftMessage ?? '').trim(),
      GiftWrap: toNumber(body?.giftWrap, 0),
      GiftWrapType: String(body?.giftWrapType ?? '').trim(),
    },
    Products: products,
    ShippingAddress: shippingAddress,
    BillingAddress: billingAddress,
    ShippingMethodDetails: {
      Carrier: String(body?.carrier ?? selectedShipping?.carrier ?? '').trim(),
      ShippingMethod: String(
        body?.shippingMethod ??
          selectedShipping?.service_type ??
          selectedShipping?.serviceCode ??
          ''
      ).trim(),
      Weight: {
        Pounds: pounds,
        Ounces: ounces,
      },
      Dimension: {
        Width: toNumber(body?.dimensionWidth, 0),
        Height: toNumber(body?.dimensionHeight, 0),
        Length: toNumber(body?.dimensionLength, 0),
      },
      HandlingFee: toNumber(body?.handlingFee, 0),
      ShippingFee: toNumber(body?.shippingFee ?? selectedShipping?.total, 0),
      InsuranceFee: toNumber(body?.insuranceFee, 0),
      LockShippingMethod: Boolean(body?.lockShippingMethod ?? false),
      RushOrder: Boolean(body?.rushOrder ?? false),
      RequirePinToShip: Boolean(body?.requirePinToShip ?? false),
      OtherCarrier: String(body?.otherCarrier ?? '').trim(),
      OtherMethod: String(body?.otherMethod ?? '').trim(),
      PromiseDate: String(body?.promiseDate ?? new Date().toISOString()),
      AllowShippingEvenNotPaid: Boolean(body?.allowShippingEvenNotPaid ?? true),
    },
    Notes: Array.isArray(body?.notes) ? body.notes : [],
  }
}

async function getSellercloudToken(credentials: SellercloudCredentials): Promise<string> {
  const baseUrl = normalizeDomain(credentials.domain)
  if (!baseUrl) throw new Error('Missing Sellercloud domain')

  const response = await fetch(`${baseUrl}/rest/api/token`, {
    method: 'POST',
    headers: {
      Accept: 'application/json',
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      Username: credentials.username,
      Password: credentials.password,
    }),
  })

  const text = await response.text()
  const data = text ? JSON.parse(text) : {}
  if (!response.ok || !data?.access_token) {
    throw new Error(String(data?.error || data?.message || `Token failed (${response.status})`))
  }

  return String(data.access_token)
}

async function fetchSellercloudJson(baseUrl: string, token: string, path: string): Promise<any> {
  const response = await fetch(`${baseUrl}${path}`, {
    method: 'GET',
    headers: {
      Accept: 'application/json',
      Authorization: `Bearer ${token}`,
    },
  })
  const text = await response.text()
  if (!response.ok) return null
  try {
    return text ? JSON.parse(text) : null
  } catch {
    return null
  }
}

function extractArray(payload: any): any[] {
  if (Array.isArray(payload)) return payload
  if (!payload || typeof payload !== 'object') return []
  const keys = ['results', 'Results', 'data', 'Data', 'items', 'Items', 'companies', 'Companies', 'warehouses', 'Warehouses']
  for (const key of keys) {
    if (Array.isArray((payload as any)[key])) return (payload as any)[key]
  }
  return []
}

async function loadSellercloudContext() {
  const cookieStore = (await cookies()) as any
  const authClient = createServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { cookies: getCookieHandlers(cookieStore) }
  )

  const {
    data: { user },
    error: userError,
  } = await authClient.auth.getUser()

  if (userError || !user) {
    return { error: 'Unauthorized', status: 401 as const }
  }

  const { data: userRow, error: userRowError } = await authClient
    .from('users')
    .select('account_id')
    .eq('id', user.id)
    .maybeSingle()

  if (userRowError || !userRow?.account_id) {
    return { error: 'Missing account context', status: 403 as const }
  }

  const accountId = String(userRow.account_id)
  const admin = createClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  )

  const { data: integration, error: integrationError } = await admin
    .from('account_integrations')
    .select('credentials, metadata, status')
    .eq('account_id', accountId)
    .eq('type', 'sellercloud')
    .maybeSingle()

  if (integrationError) {
    return {
      error: 'Failed to load Sellercloud integration',
      details: integrationError.message,
      status: 500 as const,
    }
  }

  if (!integration || String(integration.status || '').toLowerCase() !== 'active') {
    return { error: 'Sellercloud integration is not active for this account', status: 400 as const }
  }

  const credentials = parseCredentials(integration.credentials)
  if (!credentials) {
    return { error: 'Invalid Sellercloud credentials', status: 400 as const }
  }

  return { accountId, admin, credentials, integration }
}

export async function GET() {
  try {
    const ctx = await loadSellercloudContext()
    if ('error' in ctx) {
      return NextResponse.json({ error: ctx.error, details: (ctx as any).details ?? null }, { status: ctx.status })
    }

    const token = await getSellercloudToken(ctx.credentials)
    const baseUrl = normalizeDomain(ctx.credentials.domain)
    const response = await fetch(`${baseUrl}/rest/api/Warehouses`, {
      method: 'GET',
      headers: {
        Accept: 'application/json',
        Authorization: `Bearer ${token}`,
      },
    })

    const text = await response.text()
    let json: any = null
    try {
      json = text ? JSON.parse(text) : []
    } catch {
      json = []
    }

    if (!response.ok) {
      return NextResponse.json(
        { error: `Failed to load Sellercloud warehouses (${response.status})`, details: json || text },
        { status: 400 }
      )
    }

    const rows = Array.isArray(json)
      ? json
      : Array.isArray(json?.Warehouses)
      ? json.Warehouses
      : Array.isArray(json?.results)
      ? json.results
      : []

    const warehouses = rows.map((row: any) => ({
      id: String(row?.ID ?? row?.Id ?? row?.id ?? ''),
      name: String(row?.Name ?? row?.WarehouseName ?? row?.name ?? 'Unnamed Warehouse'),
      raw: row,
    })).filter((row: any) => row.id)

    return NextResponse.json({ warehouses })
  } catch (error: any) {
    return NextResponse.json({ error: error?.message || 'Unexpected server error' }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({} as Record<string, unknown>))
    const draftId = String(body?.draftId ?? '').trim()
    if (!draftId) {
      return NextResponse.json({ error: 'Missing draftId' }, { status: 400 })
    }

    const ctx = await loadSellercloudContext()
    if ('error' in ctx) {
      return NextResponse.json({ error: ctx.error, details: (ctx as any).details ?? null }, { status: ctx.status })
    }

    const { data: draft, error: draftError } = await ctx.admin
      .from('saip_quote_drafts')
      .select('*')
      .eq('id', draftId)      
      .eq('account_id', ctx.accountId)
      .maybeSingle()

    if (draftError) {
      return NextResponse.json(
        { error: 'Failed to load draft', details: draftError.message },
        { status: 500 }
      )
    }

    if (!draft) {
      return NextResponse.json({ error: 'Draft not found' }, { status: 404 })
    }

    const payload = mapDraftToSellercloudOrder(draft, body)
    if (!Array.isArray(payload.Products) || payload.Products.length === 0) {
      return NextResponse.json({ error: 'Order must include at least one product line' }, { status: 400 })
    }

    const token = await getSellercloudToken(ctx.credentials)
    const baseUrl = normalizeDomain(ctx.credentials.domain)

    // Resolve ShipFrom warehouse id when draft stores public warehouse UUID only.
    let resolvedShipFromWarehouseId =
      toPositiveInt(body?.shipFromWarehouseId) ??
      toPositiveInt((draft as any)?.ship_from?.sellercloud_warehouse_id) ??
      toPositiveInt((ctx.credentials as any)?.warehouse_id)

    if (!resolvedShipFromWarehouseId) {
      const publicWarehouseId = String((draft as any)?.ship_from?.warehouse_id ?? '').trim()
      if (publicWarehouseId) {
        const { data: warehouseRow } = await ctx.admin
          .from('v_billing_warehouses')
          .select('wms_facility_id')
          .eq('id', publicWarehouseId)
          .maybeSingle()
        resolvedShipFromWarehouseId = toPositiveInt((warehouseRow as any)?.wms_facility_id)
      }
    }

    if (resolvedShipFromWarehouseId) {
      for (const product of payload.Products || []) {
        const current = toPositiveInt((product as any)?.ShipFromWareHouseID)
        if (!current) (product as any).ShipFromWareHouseID = resolvedShipFromWarehouseId
      }
    }

    // Resolve CompanyID: body -> integration metadata/credentials -> warehouse company -> companies default.
    let resolvedCompanyId =
      toPositiveInt(body?.companyId) ??
      toPositiveInt((ctx.integration as any)?.metadata?.default_company_id) ??
      toPositiveInt((ctx.integration as any)?.metadata?.company_id) ??
      toPositiveInt((ctx.credentials as any)?.company_id) ??
      toPositiveInt((ctx.credentials as any)?.companyId)

    if (!resolvedCompanyId) {
      const whJson = await fetchSellercloudJson(baseUrl, token, '/rest/api/Warehouses')
      const warehouses = extractArray(whJson)
      const matchedWarehouse = warehouses.find((w: any) => {
        const id = toPositiveInt(w?.ID ?? w?.Id ?? w?.id)
        return !!resolvedShipFromWarehouseId && id === resolvedShipFromWarehouseId
      })
      resolvedCompanyId = toPositiveInt(
        (matchedWarehouse as any)?.CompanyID ??
          (matchedWarehouse as any)?.CompanyId ??
          (matchedWarehouse as any)?.company_id,
      )
    }

    if (!resolvedCompanyId) {
      const companiesJson =
        (await fetchSellercloudJson(baseUrl, token, '/rest/api/Companies')) ??
        (await fetchSellercloudJson(baseUrl, token, '/rest/api/Company'))
      const companies = extractArray(companiesJson)
      const preferred = companies.find((c: any) => Boolean(c?.IsDefault ?? c?.isDefault))
      const picked = preferred || companies[0]
      resolvedCompanyId = toPositiveInt((picked as any)?.ID ?? (picked as any)?.Id ?? (picked as any)?.id)
    }

    if (!resolvedCompanyId) {
      return NextResponse.json(
        {
          error:
            'Sellercloud CompanyID is required but could not be resolved. Configure default company in integration metadata or pass companyId in request.',
          payload,
        },
        { status: 400 }
      )
    }

    payload.OrderDetails.CompanyID = resolvedCompanyId

    const response = await fetch(`${baseUrl}/rest/api/Orders`, {
      method: 'POST',
      headers: {
        Accept: 'application/json',
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(payload),
    })

    const responseText = await response.text()
    let responseJson: any = null
    try {
      responseJson = responseText ? JSON.parse(responseText) : null
    } catch {
      responseJson = { raw: responseText }
    }

    if (!response.ok) {
      const message =
        responseJson?.error ||
        responseJson?.message ||
        responseJson?.Message ||
        `Sellercloud create order failed (${response.status})`

      return NextResponse.json(
        { error: String(message), sellercloud: responseJson, payload },
        { status: 400 }
      )
    }

    const sellercloudOrderId =
      responseJson?.ID ??
      responseJson?.Id ??
      responseJson?.OrderID ??
      responseJson?.OrderId ??
      null

    return NextResponse.json({
      success: true,
      sellercloudOrderId,
      sellercloud: responseJson,
      payload,
    })
  } catch (error: any) {
    return NextResponse.json({ error: error?.message || 'Unexpected server error' }, { status: 500 })
  }
}
