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
      Accept: "application/hal+json",
      "Content-Type": "application/hal+json; charset=utf-8",
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
    const { data: channelRows, error: channelErr } = await admin
      .from("channels")
      .select("id, external_id")
      .eq("account_id", accountId)
      .eq("source", "extensiv")
      .order("created_at", { ascending: false })
      .limit(1);

    const channel = Array.isArray(channelRows) ? channelRows[0] : channelRows;

    if (channelErr || !channel?.external_id) {
      return NextResponse.json(
        { error: "No Extensiv channel with external_id (customer id) found" },
        { status: 400 },
      );
    }

    const extensivCustomerId = toNumber(channel.external_id);
    if (!extensivCustomerId) {
      return NextResponse.json(
        { error: "Extensiv channel external_id must be a numeric customer id" },
        { status: 400 },
      );
    }

    // Resolve facility id from ship_from.warehouse metadata (optional)
    const shipFrom = parseJson<any>(draft.ship_from) || {};
    let facilityId: number | null = null;
    if (shipFrom?.wms_facility_id) {
      facilityId = toNumber(shipFrom.wms_facility_id);
    }
    if (shipFrom?.warehouse_id) {
      const whId = String(shipFrom.warehouse_id);

      const { data: warehouse } = await admin
        .from("warehouses")
        .select("metadata")
        .eq("id", whId)
        .maybeSingle();

      const meta = (warehouse as any)?.metadata || {};
      facilityId = toNumber((meta as any)?.extensiv_facility_id);
      if (!facilityId) facilityId = toNumber((meta as any)?.wms_facility_id);

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

    const normalizeSku = (s: string) => s.replace(/^SC[-\\s]*/i, "").trim();

    const normalizeQty = (value: any): number => {
      const raw = toNumber(value, 1);
      if (raw === null || !Number.isFinite(raw) || raw <= 0) return 1;
      return Math.round(raw);
    };

    // Map SKUs to Extensiv items (support Sellercloud prefix "SC-")
    const requestedSkus = items
      .map((it) => String(it.sku || "").trim())
      .filter(Boolean);
    const normalizedRequested = requestedSkus.map(normalizeSku);
    const allQuerySkus = Array.from(
      new Set([...requestedSkus, ...normalizedRequested]),
    ).filter(Boolean);

    const { data: products, error: prodErr } = await admin
      .from("extensiv_products_n")
      .select("sku, item_id, uom, extensiv_customer_id")
      .in("sku", allQuerySkus)
      .or(
        `client_account_id.eq.${accountId},parent_account_id.eq.${accountId}`,
      );

    if (prodErr) {
      return NextResponse.json(
        { error: `Failed to load Extensiv products: ${prodErr.message}` },
        { status: 500 },
      );
    }

    const findProduct = (sku: string) => {
      const norm = normalizeSku(sku);
      return (
        products?.find((p) => p.sku === sku) ||
        products?.find((p) => normalizeSku(p.sku) === norm)
      );
    };

    const missingSkus = requestedSkus.filter((sku) => !findProduct(sku));
    if (missingSkus.length) {
      return NextResponse.json(
        {
          error: `Missing Extensiv product mapping for SKUs: ${missingSkus.join(", ")}`,
        },
        { status: 400 },
      );
    }

    const orderItems = items.map((line) => {
      const sku = String(line.sku || "").trim();
      const product = findProduct(sku);
      const outgoingSku = product?.sku || sku;
      const qty = normalizeQty(line.quantity ?? line.qty ?? line.PrimaryInvQty);
      return {
        qty,
        PrimaryInvQty: qty,
        itemIdentifier: {
          id: product?.item_id ?? null,
          customerId: product?.extensiv_customer_id ?? extensivCustomerId,
          sku: outgoingSku,
        },
        qualifier: "",
        description: line.product_name || line.description || outgoingSku,
      };
    });

    const invalidPrimaryQty = orderItems.filter(
      (it) => it.PrimaryInvQty === null || it.PrimaryInvQty === undefined,
    );
    if (invalidPrimaryQty.length) {
      return NextResponse.json(
        {
          error:
            "Order item PrimaryInvQty is required and must be a positive integer",
        },
        { status: 400 },
      );
    }

    const missingItemIds = orderItems
      .filter((it) => !it.itemIdentifier?.id)
      .map((it) => it.itemIdentifier?.sku)
      .filter(Boolean);

    if (missingItemIds.length) {
      return NextResponse.json(
        {
          error: `Extensiv item_id not found for SKUs: ${missingItemIds.join(", ")}`,
        },
        { status: 400 },
      );
    }

    const payload: any = {
      orderNumber: draft.id,
      referenceNum: draft.summary?.order_number ?? draft.id,
      orderIdentifier: { type: "ReferenceNum", value: draft.id },
      orderDate: new Date().toISOString(),
      customerIdentifier: { id: 19 }, //extensivCustomerId },
      shipTo: {
        name: shipTo.full_name || shipTo.name || "",
        // email: shipTo.email || null,
        phone: shipTo.phone || null,
        address: {
          address1: shipTo.address_line1 || "",
          address2: shipTo.address_line2 || null,
          city: shipTo.city || "",
          state: shipTo.state || "",
          postalCode: shipTo.zip_code || shipTo.zip || "",
          countryCode: shipTo.country || "US",
        },
      },
      _embedded: {
        "http://api.3plcentral.com/rels/orders/item": orderItems,
      },
      status: 1,
    };

    if (facilityId) {
      payload.facilityIdentifier = { id: facilityId };
    } else {
      return NextResponse.json(
        {
          error:
            "Extensiv facility id is required; set warehouse.metadata.extensiv_facility_id or configure facilities for this customer in Extensiv.",
          hint: "Select an Extensiv warehouse and ensure it has wms_facility_id, or sync facilities from Extensiv.",
        },
        { status: 400 },
      );
    }
    console.log("payload", payload);

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
