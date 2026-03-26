import { createClient } from "@supabase/supabase-js";
import AES from "crypto-js/aes";
import Utf8 from "crypto-js/enc-utf8";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
);

const EXT_SERVICE = "extensiv";
const ENCRYPTION_KEY =
  process.env.NEXT_PUBLIC_CREDENTIAL_SECRET ||
  process.env.CREDENTIAL_SECRET ||
  "SYNC_SECRET";

const decryptExtensivCredentials = (raw: unknown) => {
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
  const client_id = String(parsed?.client_id ?? "").trim();
  const client_secret = String(parsed?.client_secret ?? "").trim();
  const extensiv_id = String(parsed?.extensiv_id ?? "").trim();
  if (!client_id || !client_secret || !extensiv_id) return null;
  return { client_id, client_secret, extensiv_id };
};

const getExtensivToken = async (creds: {
  client_id: string;
  client_secret: string;
  extensiv_id: string;
}): Promise<string> => {
  const basicAuth = Buffer.from(
    `${creds.client_id}:${creds.client_secret}`,
  ).toString("base64");

  const res = await fetch("https://secure-wms.com/AuthServer/api/Token", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Basic ${basicAuth}`,
    },
    body: JSON.stringify({
      grant_type: "client_credentials",
      user_login: creds.extensiv_id,
    }),
  });

  const json = await res.json().catch(() => ({}));
  if (!res.ok || !json?.access_token) {
    throw new Error(
      json?.error_description ||
        json?.message ||
        `Extensiv token failed (${res.status})`,
    );
  }
  return String(json.access_token);
};

const fetchExtensivItems = async (opts: {
  token: string;
  customerId: string;
  page?: number;
  pageSize?: number;
}) => {
  const { token, customerId } = opts;
  const page = opts.page ?? 1;
  const pageSize = opts.pageSize ?? 100;
  const headers = {
    Authorization: `Bearer ${token}`,
    Accept: "application/json",
  };
  const url = new URL(
    `https://secure-wms.com/customers/${customerId}/items`,
  );
  url.searchParams.set("pgsiz", String(pageSize));
  url.searchParams.set("pgnum", String(page));

  const res = await fetch(url.toString(), { headers });
  const text = await res.text();
  let json: any = {};
  try {
    json = text ? JSON.parse(text) : {};
  } catch {
    json = {};
  }
  if (!res.ok) {
    throw new Error(
      json?.error || json?.message || json?.Error || text || res.statusText,
    );
  }
  const items = Array.isArray(json?.ResourceList)
    ? json.ResourceList
    : Array.isArray(json)
      ? json
      : [];
  return items;
};

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const accountId = searchParams.get("account_id");
  const role = searchParams.get("role"); // 'client', 'admin', 'owner', 'staff-client'
  const sourceParam = searchParams.get("source")?.trim().toLowerCase();

  if (!accountId) {
    return new Response(JSON.stringify({ error: "Missing account_id" }), {
      status: 400,
    });
  }

  // Resolve parent account so admin/owner scoping matches billing endpoints
  let effectiveAccountId = accountId;
  try {
    const { data: accountRow } = await supabase
      .from("accounts")
      .select("parent_account_id")
      .eq("id", accountId)
      .maybeSingle();

    if (accountRow?.parent_account_id) {
      effectiveAccountId = String(accountRow.parent_account_id);
    }
  } catch (err) {
    console.warn("[api/products] ⚠️ failed to resolve parent_account_id", err);
  }

  const scopedIds = Array.from(
    new Set([accountId, effectiveAccountId].filter(Boolean)),
  );

  // base query on the source-specific table/view
  let baseQuery =
    sourceParam === "sellercloud"
      ? supabase.from("sellercloud_products").select("*")
      : sourceParam === "extensiv"
        ? supabase.from("extensiv_products_n").select("*")
        : supabase.from("vw_products_master_enriched").select("*");

  const extensivFilters = Array.from(
    new Set(
      scopedIds.flatMap((id) => [
        `parent_account_id.eq.${id}`,
        `client_account_id.eq.${id}`,
      ]),
    ),
  ).join(",");

  const defaultFilters = Array.from(
    new Set(
      scopedIds.flatMap((id) => [
        `parent_account_id.eq.${id}`,
        `account_id.eq.${id}`,
        `client_account_id.eq.${id}`,
      ]),
    ),
  ).join(",");

  if (role === "client" || role === "staff-client") {
    // client only sees its own tenant scope (raw or parent id)
    baseQuery =
      sourceParam === "extensiv"
        ? baseQuery.or(extensivFilters)
        : baseQuery.or(defaultFilters);
  } else {
    // admin/owner/staff-admin see data scoped to both parent and raw ids
    baseQuery =
      sourceParam === "sellercloud"
        ? baseQuery.in("account_id", scopedIds)
        : sourceParam === "extensiv"
          ? baseQuery.or(extensivFilters)
          : baseQuery.or(defaultFilters);
  }

  const PAGE_SIZE = 1000;
  let from = 0;
  let all: any[] = [];

  while (true) {
    const { data, error } = await baseQuery.range(from, from + PAGE_SIZE - 1);

    if (error) {
      console.error(
        "[api/products] 🔥 Erro ao buscar produtos (paginado):",
        error.message,
      );
      return new Response(JSON.stringify({ error: error.message }), {
        status: 500,
      });
    }

    if (!data || data.length === 0) {
      break;
    }

    all = all.concat(data);

    if (data.length < PAGE_SIZE) {
      // última página
      break;
    }

    from += PAGE_SIZE;
  }

  const normalizeSellercloud = (row: any) => ({
    // Normalize to match ProductList UI expectations
    id: row.id,
    parent_account_id: row.account_id ?? "",
    client_account_id: row.account_id ?? "",
    sku: row.sku ?? "",
    upc: row.upc ?? null,
    description: row.description ?? row.name ?? null,
    uom: null,
    pkg_length_in: null,
    pkg_width_in: null,
    pkg_height_in: null,
    pkg_weight_lb:
      row.weight ?? row.shipping_weight ?? row.package_weight_lbs ?? null,
    volume_cuft: null,
    track_serial: false,
    has_item_storage_rate: false,
    product_source: "sellercloud",
    source_item_id: row.external_id ?? null,
    created_at: row.created_at ?? "",
    updated_at: row.updated_at ?? "",
    carton_units: null,
    is_wrapping: false,
    client_id: row.account_id ?? "",
    client_name: row.company_name ?? "",
    client_source: "sellercloud",
    wms_customer_id: "",
    client_is_active: true,
    warehouse_id: "",
    billing_method: null,
    external_ids: null,
    account_id: row.account_id ?? "",
    account_name: row.company_name ?? "",
    account_external_id: row.company_id ? String(row.company_id) : null,
    account_source: "sellercloud",
    account_status: row.is_active === false ? "inactive" : "active",
    image_url: row.image_url ?? null,
    quantity_available: row.quantity_available ?? null,
    quantity_physical: row.quantity_physical ?? null,
    site_price: row.site_price ?? row.price ?? null,
    available: row.quantity_available ?? null,
    on_hold: null,
    warehouse_name: row.warehouse_name ?? "",
  });

  const normalizeExtensiv = (row: any) => {
    const rawVal = row.raw;
    const raw =
      rawVal && typeof rawVal === "string"
        ? (() => {
            try {
              return JSON.parse(rawVal);
            } catch {
              return {};
            }
          })()
        : rawVal ?? {};

    const stockRaw = raw?.stockSummaries ?? raw?.stocksummaries ?? [];
    const stock = Array.isArray(stockRaw) ? stockRaw : [];

    const sumFields = (...fields: string[]) =>
      stock.reduce((sum: number, s: any) => {
        for (const f of fields) {
          const v = s?.[f];
          if (typeof v === "number") return sum + v;
        }
        return sum;
      }, 0);

    const qtyFromStock = sumFields(
      "quantityAvailable",
      "quantityavailable",
      "quantityAvailableToAllocate",
      "quantity_available",
      "quantity_available_to_allocate",
      "quantityOnHand",
      "quantity_on_hand",
    );
    const onHoldFromStock = sumFields(
      "quantityOnHold",
      "quantity_on_hold",
      "quantityHold",
      "quantity_hold",
    );
    const warehouses =
      stock
        .map((s: any) => s.facilityIdentifier?.name)
        .filter(Boolean)
        .join(", ") || row.warehouse_name || "";

    const quantityAvailable =
      row.quantity_available ?? row.available ?? (qtyFromStock || null);
    const onHold = row.on_hold ?? (onHoldFromStock || null);

    const companyName =
      row.company_name ??
      row.client_name ??
      row.account_name ??
      raw?.readOnly?.customerIdentifier?.name ??
      "";

    return {
      id: row.id ?? row.external_id ?? row.sku ?? "",
      parent_account_id: row.parent_account_id ?? row.account_id ?? "",
      client_account_id:
        row.client_account_id ?? row.channel_account_id ?? row.account_id ?? "",
      sku: row.sku ?? "",
      upc: row.upc ?? null,
      description: row.description ?? row.name ?? null,
      uom: row.uom ?? null,
      pkg_length_in: row.pkg_length_in ?? row.length ?? null,
      pkg_width_in: row.pkg_width_in ?? row.width ?? null,
      pkg_height_in: row.pkg_height_in ?? row.height ?? null,
      pkg_weight_lb: row.pkg_weight_lb ?? row.weight ?? null,
      volume_cuft: row.volume_cuft ?? null,
      track_serial: row.track_serial ?? false,
      has_item_storage_rate:
        row.has_item_storage_rate ?? row.has_storage_rates ?? false,
      product_source: "extensiv",
      source_item_id:
        row.source_item_id ??
        row.external_id ??
        (row.item_id ? String(row.item_id) : null),
      created_at: row.created_at ?? "",
      updated_at: row.updated_at ?? "",
      carton_units: row.carton_units ?? null,
      is_wrapping: row.is_wrapping ?? false,
      client_id:
        row.client_account_id ?? row.channel_account_id ?? row.account_id ?? "",
      client_name: companyName,
      client_source: "extensiv",
      wms_customer_id: row.extensiv_customer_id
        ? String(row.extensiv_customer_id)
        : "",
      client_is_active: row.is_active ?? true,
      warehouse_id: row.warehouse_id ?? "",
      billing_method: row.billing_method ?? null,
      external_ids: row.external_ids ?? null,
      account_id: row.parent_account_id ?? row.account_id ?? "",
      account_name: row.account_name ?? row.company_name ?? "",
      account_external_id: row.account_external_id ?? row.company_id ?? null,
      account_source: "extensiv",
      account_status:
        row.account_status ?? (row.is_active === false ? "inactive" : "active"),
      image_url: row.image_url ?? null,
      quantity_available: quantityAvailable,
      quantity_physical: row.quantity_physical ?? null,
      site_price: row.site_price ?? row.price ?? null,
      available: quantityAvailable,
      on_hold: onHold,
      warehouse_name: warehouses,
    };
  };

  const resolveExtensivCustomerId = async (): Promise<string | null> => {
    const { data: channel } = await supabase
      .from("channels")
      .select("external_id")
      .eq("account_id", effectiveAccountId)
      .eq("source", EXT_SERVICE)
      .maybeSingle();

    const extIdRaw = String(channel?.external_id ?? "").trim();
    if (extIdRaw.startsWith("ext-")) return extIdRaw.slice(4);
    if (/^\d+$/.test(extIdRaw)) return extIdRaw;
    return null;
  };

  const fetchLiveExtensivProducts = async () => {
    const { data: integration } = await supabase
      .from("account_integrations")
      .select("credentials")
      .eq("account_id", effectiveAccountId)
      .eq("type", EXT_SERVICE)
      .maybeSingle();

    const creds = decryptExtensivCredentials(integration?.credentials);
    if (!creds) return [];

    const customerId = await resolveExtensivCustomerId();
    if (!customerId) return [];

    const token = await getExtensivToken(creds);
    const items = await fetchExtensivItems({
      token,
      customerId,
      page: 1,
      pageSize: 200,
    });

    return items.map((it: any) => {
      const pkg = it?.Options?.PackageUnit?.Imperial || {};
      const qtyAvail =
        it?.QuantityAvailable ??
        it?.AvailableQuantity ??
        it?.AvailableQty ??
        it?.Available ??
        it?.OnHand ??
        it?.QuantityOnHand ??
        it?.Quantity ??
        it?.QtyAvailable ??
        null;
      return normalizeExtensiv({
        id: it?.ItemId ?? it?.ReadOnly?.ItemId ?? it?.Sku ?? "",
        sku: it?.Sku ?? "",
        description: it?.Description ?? null,
        pkg_weight_lb: pkg?.Weight ?? pkg?.weight ?? null,
        pkg_length_in: pkg?.Length ?? pkg?.length ?? null,
        pkg_width_in: pkg?.Width ?? pkg?.width ?? null,
        pkg_height_in: pkg?.Height ?? pkg?.height ?? null,
        quantity_available: qtyAvail === null ? null : Number(qtyAvail) || 0,
        available: qtyAvail === null ? null : Number(qtyAvail) || 0,
        parent_account_id: effectiveAccountId,
        client_account_id: effectiveAccountId,
        source: EXT_SERVICE,
        raw: it,
        warehouse_name:
          it?.facilityIdentifier?.name ??
          it?.FacilityIdentifier?.name ??
          it?.facilityIdentifier?.Name ??
          it?.FacilityIdentifier?.Name ??
          "",
      });
    });
  };

  const products =
    sourceParam === "sellercloud"
      ? all.map(normalizeSellercloud)
      : sourceParam === "extensiv"
        ? all.map(normalizeExtensiv)
        : all;

  // Fetch available integration sources for the account to drive UI filters
  const { data: integrations, error: integrationsError } = await supabase
    .from("account_integrations")
    .select("type")
    .eq("account_id", accountId);

  if (integrationsError) {
    console.error(
      "[api/products] ⚠️ Failed to fetch account integrations:",
      integrationsError.message,
    );
  }

  const sources = Array.from(
    new Set(
      (integrations || [])
        .map((row: any) =>
          String(row?.type ?? "")
            .trim()
            .toLowerCase(),
        )
        .filter(Boolean),
    ),
  );

  // Live Extensiv fallback: if requesting extensiv and no rows, fetch directly from API
  if (sourceParam === EXT_SERVICE && products.length === 0) {
    try {
      const live = await fetchLiveExtensivProducts();
      if (live.length) {
        return new Response(JSON.stringify({ products: live, sources }), {
          status: 200,
        });
      }
    } catch (err) {
      console.warn("[api/products] extensiv live fallback failed", err);
    }
  }

  return new Response(JSON.stringify({ products, sources }), { status: 200 });
}
