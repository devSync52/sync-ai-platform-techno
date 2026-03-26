import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { createServerClient } from "@supabase/ssr";
import { createClient } from "@supabase/supabase-js";
import AES from "crypto-js/aes";
import Utf8 from "crypto-js/enc-utf8";

const EXTENSIV_BASE_URL = "https://secure-wms.com";
const ENCRYPTION_KEY =
  process.env.NEXT_PUBLIC_CREDENTIAL_SECRET || "SYNC_SECRET";

function getCookieHandlers(cookieStore: any) {
  return {
    get(name: string) {
      return cookieStore.get(name)?.value;
    },
    set(name: string, value: string, options: any) {
      cookieStore.set({ name, value, ...options });
    },
    remove(name: string, options: any) {
      try {
        (cookieStore as any).delete(name);
      } catch {
        cookieStore.set({ name, value: "", ...options, maxAge: 0 });
      }
    },
  };
}

type DraftRow = {
  id: string;
  account_id: string | null;
  user_id: string | null;
  ship_from: any;
  ship_to: any;
  items: any;
  preferences: any;
  client: any;
  summary?: any;
};

type ExtensivCredentials = {
  client_id: string;
  client_secret: string;
  extensiv_id: string;
};

function parseCredentials(raw: unknown): ExtensivCredentials | null {
  if (!raw) return null;

  let parsed: any = raw;
  if (typeof raw === "string") {
    try {
      const decrypted = AES.decrypt(raw, ENCRYPTION_KEY).toString(Utf8);
      parsed = JSON.parse(decrypted);
    } catch {
      return null;
    }
  }

  if (!parsed || typeof parsed !== "object") return null;

  const client_id = String((parsed as any).client_id ?? "").trim();
  const client_secret = String((parsed as any).client_secret ?? "").trim();
  const extensiv_id = String((parsed as any).extensiv_id ?? "").trim();

  if (!client_id || !client_secret || !extensiv_id) return null;
  return { client_id, client_secret, extensiv_id };
}

function toNumber(val: any, fallback: number | null = null): number | null {
  const n = Number(val);
  return Number.isFinite(n) ? n : fallback;
}

function toExtensivId(val: any): number | null {
  if (val === null || val === undefined) return null;
  const str = String(val).trim();
  // accept forms like "ext-123" or "customer:123"
  const match = str.match(/(\d+)/);
  if (match) {
    return toNumber(match[1]);
  }
  return toNumber(str);
}

function parseJson<T = any>(v: any): T | null {
  if (v === null || v === undefined) return null;
  if (typeof v === "object") return v as T;
  if (typeof v === "string") {
    try {
      return JSON.parse(v) as T;
    } catch {
      return null;
    }
  }
  return null;
}

async function getExtensivToken(creds: ExtensivCredentials) {
  const basic = Buffer.from(
    `${creds.client_id}:${creds.client_secret}`,
  ).toString("base64");

  const bodyForm = new URLSearchParams({
    grant_type: "client_credentials",
    user_login: creds.extensiv_id,
  });

  // Prefer form payload (more widely accepted)
  const formRes = await fetch(`${EXTENSIV_BASE_URL}/AuthServer/api/Token`, {
    method: "POST",
    headers: {
      Accept: "application/json",
      "Content-Type": "application/x-www-form-urlencoded",
      Authorization: `Basic ${basic}`,
    },
    body: bodyForm.toString(),
  });

  const formText = await formRes.text();
  const formJson = (() => {
    try {
      return formText ? JSON.parse(formText) : null;
    } catch {
      return null;
    }
  })();
  if (formRes.ok && (formJson?.access_token || formJson?.token)) {
    return formJson.access_token || formJson.token;
  }

  // Fallback to JSON body
  const jsonRes = await fetch(`${EXTENSIV_BASE_URL}/AuthServer/api/Token`, {
    method: "POST",
    headers: {
      Accept: "application/json",
      "Content-Type": "application/json",
      Authorization: `Basic ${basic}`,
    },
    body: JSON.stringify({
      grant_type: "client_credentials",
      user_login: creds.extensiv_id,
    }),
  });

  const jsonText = await jsonRes.text();
  const json = (() => {
    try {
      return jsonText ? JSON.parse(jsonText) : null;
    } catch {
      return null;
    }
  })();
  if (jsonRes.ok && (json?.access_token || json?.token)) {
    return json.access_token || json.token;
  }

  const msg =
    formJson?.error_description ||
    formJson?.error ||
    json?.error_description ||
    json?.error ||
    jsonText ||
    formText ||
    "Failed to get Extensiv token";
  throw new Error(msg);
}

async function fetchExtensivItemsForSkus(opts: {
  token: string;
  customerId: number;
  skus: string[];
  maxPages?: number;
  pageSize?: number;
}) {
  const { token, customerId, skus } = opts;
  const maxPages = opts.maxPages ?? 10;
  // Extensiv API caps pgsiz at 100; enforce to avoid QueryParameterException
  const pageSize = Math.min(opts.pageSize ?? 100, 100);
  const target = new Set(skus.map((s) => s.toLowerCase()));
  const found = new Map<string, any>();

  const headers = {
    Authorization: `Bearer ${token}`,
    Accept: "application/json",
  };

  for (let page = 1; page <= maxPages && found.size < target.size; page++) {
    const url = new URL(`${EXTENSIV_BASE_URL}/customers/${customerId}/items`);
    url.searchParams.set("pgsiz", String(pageSize));
    url.searchParams.set("pgnum", String(page));

    const res = await fetch(url.toString(), { headers });
    const txt = await res.text();
    let json: any = null;
    try {
      json = txt ? JSON.parse(txt) : null;
    } catch {
      json = null;
    }
    if (!res.ok) {
      throw new Error(
        json?.error || json?.message || json?.Error || txt || res.statusText,
      );
    }

    const list: any[] = Array.isArray(json?.ResourceList)
      ? json.ResourceList
      : Array.isArray(json)
        ? json
        : [];

    for (const it of list) {
      const sku = String(it?.Sku || "").toLowerCase();
      if (target.has(sku) && !found.has(sku)) {
        found.set(sku, it);
      }
    }

    const total = Number(json?.TotalResults ?? 0);
    const returned = list.length;
    if (returned < pageSize && found.size === target.size) break;
    if (returned === 0) break;
    if (page * pageSize >= total) break;
  }

  return found;
}

async function fetchExtensivItemsForIds(opts: {
  token: string;
  customerId: number;
  ids: Array<number | string>;
  maxPages?: number;
  pageSize?: number;
}) {
  const { token, customerId } = opts;
  const maxPages = opts.maxPages ?? 10;
  const pageSize = Math.min(opts.pageSize ?? 100, 100);
  const target = new Set(
    opts.ids
      .map((v) => Number(v))
      .filter((n) => Number.isFinite(n))
      .map((n) => n),
  );
  const found = new Map<number, any>();

  const headers = {
    Authorization: `Bearer ${token}`,
    Accept: "application/json",
  };

  for (let page = 1; page <= maxPages && found.size < target.size; page++) {
    const url = new URL(`${EXTENSIV_BASE_URL}/customers/${customerId}/items`);
    url.searchParams.set("pgsiz", String(pageSize));
    url.searchParams.set("pgnum", String(page));

    const res = await fetch(url.toString(), { headers });
    const txt = await res.text();
    let json: any = null;
    try {
      json = txt ? JSON.parse(txt) : null;
    } catch {
      json = null;
    }
    if (!res.ok) {
      throw new Error(
        json?.error || json?.message || json?.Error || txt || res.statusText,
      );
    }

    const list: any[] = Array.isArray(json?.ResourceList)
      ? json.ResourceList
      : Array.isArray(json)
        ? json
        : [];

    for (const it of list) {
      const id =
        Number(it?.ItemId) ||
        Number(it?.itemId) ||
        Number(it?.ReadOnly?.ItemId) ||
        null;
      if (id && target.has(id) && !found.has(id)) {
        found.set(id, it);
      }
    }

    const total = Number(json?.TotalResults ?? 0);
    const returned = list.length;
    if (returned < pageSize && found.size === target.size) break;
    if (returned === 0) break;
    if (page * pageSize >= total) break;
  }

  return found;
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}));
    const draftId = String(body?.draftId || "").trim();

    if (!draftId) {
      return NextResponse.json(
        { error: "draftId is required" },
        { status: 400 },
      );
    }

    const cookieStore = (await cookies()) as any;
    const supabaseAuth = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      { cookies: getCookieHandlers(cookieStore) },
    );

    const {
      data: { user },
      error: authError,
    } = await supabaseAuth.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const admin = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
    );

    const { data: draft, error: draftErr } = await admin
      .from("saip_quote_drafts")
      .select("*")
      .eq("id", draftId)
      .maybeSingle();

    if (draftErr || !draft) {
      return NextResponse.json(
        { error: draftErr?.message || "Draft not found" },
        { status: 404 },
      );
    }

    const accountId = draft.account_id;
    if (!accountId) {
      return NextResponse.json(
        { error: "Draft missing account_id" },
        { status: 400 },
      );
    }

    // Ensure user belongs to the same tenant
    const { data: userRow, error: userRowErr } = await admin
      .from("users")
      .select("account_id")
      .eq("id", user.id)
      .maybeSingle();

    if (
      userRowErr ||
      !userRow?.account_id ||
      userRow.account_id !== accountId
    ) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    // Load Extensiv credentials for this tenant
    const { data: integrationRow, error: integrationErr } = await admin
      .from("account_integrations")
      .select("credentials")
      .eq("account_id", accountId)
      .eq("type", "extensiv")
      .maybeSingle();

    if (integrationErr || !integrationRow?.credentials) {
      return NextResponse.json(
        { error: "Extensiv integration not configured for this account" },
        { status: 400 },
      );
    }

    const credentials = parseCredentials(integrationRow.credentials);
    if (!credentials) {
      return NextResponse.json(
        { error: "Invalid Extensiv credentials" },
        { status: 400 },
      );
    }

    const token = await getExtensivToken(credentials);
    console.log("token", token);

    const headers = {
      Authorization: `Bearer ${token}`,
      Accept: "application/json",
      "Content-Type": "application/json",
    };

    const fetchDefaultFacilityId = async (): Promise<{
      id: number | null;
      debug?: any;
    }> => {
      try {
        const tried: string[] = [];
        const candidates: Array<number | null> = [];
        const push = (val: any) => {
          const n = toNumber(val);
          if (n) candidates.push(n);
        };

        const pullIds = (json: any) => {
          if (Array.isArray(json)) {
            for (const entry of json) {
              push((entry as any)?.id);
              push((entry as any)?.facilityId);
              push((entry as any)?.facilityIdentifier?.id);
              push((entry as any)?.facilityIdentifier?.facilityId);
            }
          } else if (json && typeof json === "object") {
            push((json as any)?.id);
            push((json as any)?.facilityId);
            push((json as any)?.facilityIdentifier?.id);
            push((json as any)?.facilityIdentifier?.facilityId);
            const embedded = (json as any)?._embedded;
            if (embedded) {
              const facilities =
                embedded["http://api.3plcentral.com/rels/inventory/facility"] ||
                embedded["facilities"] ||
                embedded["facility"] ||
                [];
              if (Array.isArray(facilities)) {
                facilities.forEach((f) => {
                  push((f as any)?.id);
                  push((f as any)?.facilityId);
                  push((f as any)?.facilityIdentifier?.id);
                  push((f as any)?.facilityIdentifier?.facilityId);
                });
              }
            }
          }
        };

        const tryFetch = async (url: string) => {
          tried.push(url);
          const res = await fetch(url, { method: "GET", headers });
          const text = await res.text();
          let json: any = null;
          try {
            json = text ? JSON.parse(text) : null;
          } catch {
            json = null;
          }
          if (res.ok) pullIds(json);
          return res.ok ? null : text || res.statusText;
        };

        let lastError: any = null;
        lastError = await tryFetch(
          `${EXTENSIV_BASE_URL}/customers/${extensivCustomerId}/facilities`,
        );
        if (!candidates.length) {
          lastError =
            (await tryFetch(
              `${EXTENSIV_BASE_URL}/customer/${extensivCustomerId}/inventory/facilities`,
            )) || lastError;
        }
        if (!candidates.length) {
          lastError =
            (await tryFetch(`${EXTENSIV_BASE_URL}/inventory/facilities`)) ||
            lastError;
        }

        return {
          id: candidates.find(Boolean) ?? null,
          debug: { tried, lastError },
        };
      } catch (e: any) {
        return { id: null, debug: { error: e?.message ?? String(e) } };
      }
    };

    // Resolve Extensiv customer (channel)
    const prefs = parseJson<any>(draft.preferences) || {};
    const clientMeta = parseJson<any>(draft.client) || {};
    const summary = parseJson<any>(draft.summary) || {};

    let extensivCustomerId: number | null =
      toExtensivId((body as any)?.customerId) ||
      toExtensivId((body as any)?.customerIdentifier?.id) ||
      toExtensivId(prefs?.extensiv_customer_id) ||
      toExtensivId(prefs?.customer_id) ||
      toExtensivId(prefs?.customerId) ||
      toExtensivId(prefs?.customerIdentifier?.id) ||
      toExtensivId(clientMeta?.extensiv_customer_id) ||
      toExtensivId(clientMeta?.customer_id) ||
      toExtensivId(clientMeta?.customerId) ||
      toExtensivId(clientMeta?.customerIdentifier?.id) ||
      toExtensivId(clientMeta?.identifier?.id) ||
      toExtensivId(clientMeta?.external_id) ||
      toExtensivId(clientMeta?.extensiv_id) ||
      toExtensivId(clientMeta?.id) ||
      toExtensivId(summary?.customer?.extensiv_customer_id) ||
      toExtensivId(summary?.customer?.customer_id) ||
      toExtensivId(summary?.customer?.id) ||
      toExtensivId(summary?.customer_id) ||
      toExtensivId(summary?.customerId) ||
      toExtensivId(summary?.client_id) ||
      null;

    if (!extensivCustomerId) {
      const { data: channelRows, error: channelErr } = await admin
        .from("channels")
        .select("id, external_id")
        .eq("account_id", accountId)
        .eq("source", "extensiv")
        .order("created_at", { ascending: false })
        .limit(1);

      const channel = Array.isArray(channelRows) ? channelRows[0] : channelRows;

      const chanId = toExtensivId(channel?.external_id);
      if (channelErr || !chanId) {
        return NextResponse.json(
          {
            error:
              "No Extensiv customer id found. Provide customerId in request or configure channels.external_id for Extensiv.",
          },
          { status: 400 },
        );
      }

      extensivCustomerId = chanId;
    }

    // Resolve facility id from ship_from.warehouse metadata (optional)
    const shipFrom = parseJson<any>(draft.ship_from) || {};
    let facilityId: number | null =
      toNumber((body as any)?.facilityId) ||
      toNumber((body as any)?.facilityIdentifier?.id) ||
      toNumber(prefs?.facility_id) ||
      toNumber(prefs?.extensiv_facility_id) ||
      toNumber(prefs?.wms_facility_id) ||
      toNumber(summary?.facility_id) ||
      toNumber(summary?.facilityIdentifier?.id) ||
      null;

    if (!facilityId && shipFrom?.facility_id) {
      facilityId = toNumber(shipFrom.facility_id);
    }
    if (!facilityId && shipFrom?.wms_facility_id) {
      facilityId = toNumber(shipFrom.wms_facility_id);
    }
    if (!facilityId && shipFrom?.warehouse_id) {
      const whId = String(shipFrom.warehouse_id);

      const { data: warehouse } = await admin
        .from("warehouses")
        .select("metadata")
        .eq("id", whId)
        .maybeSingle();

      const meta = (warehouse as any)?.metadata || {};
      facilityId =
        facilityId ||
        toNumber((meta as any)?.extensiv_facility_id) ||
        toNumber((meta as any)?.wms_facility_id) ||
        null;

      // If warehouse row lacks metadata, try billing warehouses view/table.
      if (!facilityId) {
        const { data: billingWh } = await admin
          .from("v_billing_warehouses")
          .select("wms_facility_id")
          .eq("id", whId)
          .maybeSingle();

        facilityId = toNumber((billingWh as any)?.wms_facility_id);
      }
    }

    if (!facilityId) {
      const fallback = await fetchDefaultFacilityId();
      facilityId = fallback.id;
      if (!facilityId && fallback?.debug) {
        console.warn("[extensiv] facility lookup failed", fallback.debug);
      }
    }

    const shipTo = parseJson<any>(draft.ship_to) || {};
    const items = (parseJson<any[]>(draft.items) || []).filter(Boolean);

    if (!items.length) {
      return NextResponse.json(
        { error: "At least one item is required" },
        { status: 400 },
      );
    }

    const normalizeQty = (value: any): number => {
      const raw = toNumber(value, 1);
      if (raw === null || !Number.isFinite(raw) || raw <= 0) return 1;
      return Math.round(raw);
    };

    // Collect requested item ids / skus
    const itemIdsRequested = items
      .map(
        (line) =>
          (line as any)?.itemIdentifier?.id ||
          (line as any)?.itemId ||
          (line as any)?.item_id ||
          null,
      )
      .filter((v) => v !== null && v !== undefined)
      .map((v) => Number(v))
      .filter((n) => Number.isFinite(n));

    const skusRequested = items
      .map((line) => String((line as any)?.sku || "").trim())
      .filter(Boolean);

    // Validate item ids belong to this customer; if missing/invalid, try resolving by SKU
    let extItemsById: Map<number, any> | null = null;
    if (itemIdsRequested.length > 0) {
      extItemsById = await fetchExtensivItemsForIds({
        token,
        customerId: extensivCustomerId,
        ids: itemIdsRequested,
      });
    } else {
      extItemsById = new Map<number, any>();
    }

    // Resolve by SKU for lines whose id is missing or not found
    const needSkuResolution = items.some((line) => {
      const id =
        (line as any)?.itemIdentifier?.id ||
        (line as any)?.itemId ||
        (line as any)?.item_id ||
        null;
      return !id || !extItemsById?.has(Number(id));
    });

    let extItemsBySku: Map<string, any> | null = null;
    if (needSkuResolution && skusRequested.length > 0) {
      extItemsBySku = await fetchExtensivItemsForSkus({
        token,
        customerId: extensivCustomerId,
        skus: skusRequested,
      });
    }

    const orderItems = items.map((line) => {
      const qty = normalizeQty(line.quantity ?? line.qty ?? line.PrimaryInvQty);

      // Prefer provided id; if missing/invalid, resolve via SKU for this customer.
      let itemId =
        (line as any)?.itemIdentifier?.id ||
        (line as any)?.itemId ||
        (line as any)?.item_id ||
        null;

      const numericId = itemId !== null ? Number(itemId) : null;
      const hasValidId =
        numericId !== null &&
        Number.isFinite(numericId) &&
        extItemsById?.has(numericId);

      if (!hasValidId) {
        const sku = String((line as any)?.sku || "").trim().toLowerCase();
        const fromSku =
          sku && extItemsBySku
            ? extItemsBySku.get(sku) ||
              extItemsBySku.get(sku.toLowerCase()) ||
              null
            : null;
        const resolvedId =
          Number(fromSku?.ItemId) ||
          Number(fromSku?.itemId) ||
          Number(fromSku?.ReadOnly?.ItemId) ||
          null;
        if (resolvedId && Number.isFinite(resolvedId)) {
          itemId = resolvedId;
        }
      }

      if (!itemId) {
        throw new Error(
          "Extensiv item id missing on an order line; include itemIdentifier.id (or itemId/item_id) in items array.",
        );
      }

      if (extItemsById && extItemsById.size > 0) {
        const numId = Number(itemId);
        if (!extItemsById.has(numId)) {
          throw new Error(
            `Extensiv item id ${itemId} not found for customer ${extensivCustomerId}. Ensure the item is assigned to this customer in Extensiv.`,
          );
        }
      }

      return {
        qty,
        itemIdentifier: {
          id: itemId,
          customerId: extensivCustomerId,
        },
        qualifier: "",
        description:
          line.product_name ||
          line.description ||
          (line as any)?.description ||
          "",
      };
    });

    const payload: any = {
      customerIdentifier: { id: extensivCustomerId },
      facilityIdentifier: { id: facilityId },
      referenceNum: draft.summary?.order_number ?? draft.id,
      notes: draft.summary?.notes ?? null,
      shippingNotes: prefs?.shipping_notes ?? null,
      billingCode: prefs?.billing_code ?? "Prepaid",
      asnNumber: prefs?.asn_number ?? null,
      routingInfo: {
        isCod: Boolean(prefs?.is_cod || prefs?.cod),
        isInsurance: Boolean(prefs?.is_insurance || prefs?.insurance),
        requiresDeliveryConf: Boolean(
          prefs?.requires_delivery_conf || prefs?.delivery_confirmation,
        ),
        requiresReturnReceipt: Boolean(
          prefs?.requires_return_receipt || prefs?.return_receipt,
        ),
        carrier:
          prefs?.carrier ||
          prefs?.service_carrier ||
          prefs?.carrier_code ||
          null,
        mode: prefs?.mode || prefs?.service_mode || null,
        scacCode: prefs?.scac_code || null,
        account:
          prefs?.carrier_account ||
          prefs?.billing_account ||
          prefs?.account ||
          null,
      },
      shipTo: {
        companyName:
          shipTo.company ||
          shipTo.company_name ||
          shipTo.business_name ||
          shipTo.name ||
          shipTo.full_name ||
          "",
        name: shipTo.full_name || shipTo.name || "",
        address1: shipTo.address_line1 || "",
        address2: shipTo.address_line2 || null,
        city: shipTo.city || "",
        state: shipTo.state || "",
        zip: shipTo.zip_code || shipTo.zip || "",
        country: shipTo.country || "US",
      },
      orderItems: orderItems.map((it) => ({
        itemIdentifier: {
          id: it.itemIdentifier?.id,
          customerId: extensivCustomerId,
        },
        qty: it.qty,
      })),
    };

    if (!facilityId) {
      return NextResponse.json(
        {
          error:
            "Extensiv facility id is required; set warehouse.metadata.extensiv_facility_id or configure facilities for this customer in Extensiv.",
          hint: "Select an Extensiv warehouse and ensure it has wms_facility_id, or sync facilities from Extensiv.",
        },
        { status: 400 },
      );
    }
    console.log("payload", JSON.stringify(payload), payload);

    const res = await fetch(`${EXTENSIV_BASE_URL}/orders`, {
      method: "POST",
      headers,
      body: JSON.stringify(payload),
    });

    const text = await res.text();
    const json = text
      ? (() => {
          try {
            return JSON.parse(text);
          } catch {
            return null;
          }
        })()
      : null;

    if (!res.ok) {
      return NextResponse.json(
        {
          error:
            json?.message ||
            json?.error ||
            text ||
            "Extensiv create order failed",
        },
        { status: res.status },
      );
    }

    const createdId = json?.id ?? json?.orderId ?? null;

    // Mark draft as converted for bookkeeping
    await admin
      .from("saip_quote_drafts")
      .update({
        status: "converted",
        step: 4,
        extensiv_order_id: createdId,
      } as any)
      .eq("id", draft.id);

    return NextResponse.json({
      success: true,
      extensivOrderId: createdId,
      response: json,
    });
  } catch (error: any) {
    return NextResponse.json(
      { error: error?.message || "Unexpected server error" },
      { status: 500 },
    );
  }
}
