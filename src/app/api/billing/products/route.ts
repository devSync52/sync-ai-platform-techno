import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { createServerClient } from "@supabase/ssr";
import { createClient } from "@supabase/supabase-js";
import AES from "crypto-js/aes";
import Utf8 from "crypto-js/enc-utf8";

function getServiceRoleClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY!;
  return createClient(url, key, { auth: { persistSession: false } });
}

function getAnonClient(token: string) {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
  return createClient(url, anon, {
    auth: { persistSession: false, autoRefreshToken: false },
    global: { headers: { Authorization: `Bearer ${token}` } },
  });
}

const ENCRYPTION_KEY =
  process.env.NEXT_PUBLIC_CREDENTIAL_SECRET || "SYNC_SECRET";

type SellercloudCredentials = {
  domain: string;
  username: string;
  password: string;
};

type UserContext =
  | { ok: true; accountId: string; rawAccountId: string }
  | { ok: false; status: number; message: string };

type ProductRow = {
  id: string;
  sku: string | null;
  description: string | null;
  available: number | null;
  on_hold: number | null;
  warehouse_name: string | null;
  product_source: string | null;
  account_name: string | null;
  updated_at: string | null;
};

type ProductUpsert = {
  parent_account_id: string;
  source: string;
  external_product_id: string | null;
  sku: string;
  product_name: string | null;
  description: string | null;
  upc: string | null;
  available: number | null;
  on_hold: number | null;
  physical_qty: number | null;
  site_price: number | null;
  warehouse_name: string;
  raw: Record<string, unknown>;
  sellercloud_last_modified_at: string | null;
  updated_at: string;
};

function isMissingProductsTableError(error: unknown): boolean {
  const code = String((error as any)?.code ?? "");
  const msg = String((error as any)?.message ?? "").toLowerCase();
  return (
    code === "42P01" ||
    msg.includes('relation "products" does not exist') ||
    msg.includes('relation "public.products" does not exist')
  );
}

function normalizeDomain(domain: string): string {
  const trimmed = String(domain || "").trim();
  if (!trimmed) return "";
  if (/^https?:\/\//i.test(trimmed)) return trimmed.replace(/\/+$/, "");
  return `https://${trimmed.replace(/\/+$/, "")}`;
}

function parseCredentials(raw: unknown): SellercloudCredentials | null {
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

  const creds: SellercloudCredentials = {
    domain: String((parsed as any).domain ?? "").trim(),
    username: String((parsed as any).username ?? "").trim(),
    password: String((parsed as any).password ?? "").trim(),
  };

  if (!creds.domain || !creds.username || !creds.password) return null;
  return creds;
}

function toOptionalNumber(value: unknown): number | null {
  if (value == null || value === "") return null;
  const num = Number(value);
  return Number.isFinite(num) ? num : null;
}

function pickNumber(...values: unknown[]): number | null {
  for (const value of values) {
    const num = toOptionalNumber(value);
    if (num !== null) return num;
  }
  return null;
}

function toWarehouseName(value: unknown): string {
  const name = String(value ?? "").trim();
  return name || "default";
}

function toOptionalIso(value: unknown): string | null {
  if (!value) return null;
  const date = new Date(String(value));
  if (Number.isNaN(date.getTime())) return null;
  return date.toISOString();
}

function firstNonEmpty(...values: unknown[]): string {
  for (const value of values) {
    const str = String(value ?? "").trim();
    if (str) return str;
  }
  return "";
}

function unwrapCatalogRow(row: any): any {
  if (!row || typeof row !== "object") return row;
  return (
    row.Product ??
    row.product ??
    row.CatalogProduct ??
    row.CatalogItem ??
    row.Item ??
    row.item ??
    row
  );
}

function toUpsertRow(accountId: string, row: any): ProductUpsert | null {
  const candidate = unwrapCatalogRow(row);
  const externalId = firstNonEmpty(
    candidate?.ID,
    candidate?.Id,
    candidate?.id,
    candidate?.ProductID,
    candidate?.ProductId,
    row?.ID,
    row?.Id,
    row?.id,
  );

  const sku = firstNonEmpty(
    candidate?.SKU,
    candidate?.Sku,
    candidate?.sku,
    candidate?.ClientSKU,
    candidate?.ClientSku,
    candidate?.Client_Sku,
    candidate?.VendorSKU,
    candidate?.VendorSku,
    candidate?.MerchantSKU,
    candidate?.MerchantSku,
    row?.SKU,
    row?.Sku,
    row?.sku,
    externalId ? `SC-${externalId}` : "",
  );
  if (!sku) return null;

  const warehouseName = toWarehouseName(
    candidate?.WarehouseName ??
      candidate?.Warehouse ??
      row?.WarehouseName ??
      row?.Warehouse ??
      row?.warehouse_name ??
      null,
  );

  return {
    parent_account_id: accountId,
    source: "sellercloud",
    external_product_id: externalId || null,
    sku,
    product_name:
      firstNonEmpty(
        candidate?.ProductName,
        candidate?.Name,
        candidate?.name,
        row?.ProductName,
        row?.Name,
        row?.name,
      ) || null,
    description: String(
      candidate?.Description ??
        candidate?.ShortDescription ??
        candidate?.LongDescription ??
        row?.Description ??
        row?.ShortDescription ??
        row?.LongDescription ??
        "",
    ).trim() || null,
    upc:
      firstNonEmpty(
        candidate?.UPC,
        candidate?.Upc,
        candidate?.upc,
        row?.UPC,
        row?.Upc,
        row?.upc,
      ) || null,
    available: pickNumber(
      candidate?.AvailableQty ??
        candidate?.AvailableQuantity ??
        candidate?.QtyAvailableForSale ??
        candidate?.QtyAvailableForPicking ??
        candidate?.InventoryAvailableQty ??
        candidate?.AggregatedQty ??
        candidate?.AggregateQty ??
        candidate?.AggregatePhysicalQty ??
        candidate?.AggregatePhysicalSellableQtyIncludingPhysicalValue ??
        candidate?.WarehousePhysicalQty ??
        candidate?.QtyAvailable ??
        candidate?.available ??
        candidate?.InStockQty ??
        candidate?.InStockQuantity ??
        candidate?.Inventory?.AvailableQty ??
        candidate?.Inventory?.QtyAvailable ??
        candidate?.Inventory?.Available ??
        row?.AvailableQty ??
        row?.AvailableQuantity ??
        row?.QtyAvailableForSale ??
        row?.QtyAvailableForPicking ??
        row?.InventoryAvailableQty ??
        row?.AggregatedQty ??
        row?.AggregateQty ??
        row?.AggregatePhysicalQty ??
        row?.AggregatePhysicalSellableQtyIncludingPhysicalValue ??
        row?.WarehousePhysicalQty ??
        row?.QtyAvailable ??
        row?.available,
    ),
    on_hold: toOptionalNumber(
      candidate?.OnHoldQty ??
        candidate?.ReservedQty ??
        candidate?.on_hold ??
        row?.OnHoldQty ??
        row?.ReservedQty ??
        row?.on_hold,
    ),
    physical_qty: pickNumber(
      candidate?.PhysicalQty ??
        candidate?.PhysicalQuantity ??
        candidate?.OnHandQty ??
        candidate?.QuantityOnHand ??
        candidate?.WarehousePhysicalQty ??
        candidate?.AggregatePhysicalQty ??
        candidate?.QtyOnHand ??
        candidate?.on_hand ??
        candidate?.Inventory?.PhysicalQty ??
        candidate?.Inventory?.QtyOnHand ??
        candidate?.Inventory?.OnHandQty ??
        row?.PhysicalQty ??
        row?.PhysicalQuantity ??
        row?.OnHandQty ??
        row?.QuantityOnHand ??
        row?.WarehousePhysicalQty ??
        row?.AggregatePhysicalQty ??
        row?.QtyOnHand ??
        row?.on_hand,
    ),
    site_price: toOptionalNumber(
      candidate?.SitePrice ??
        candidate?.Price ??
        candidate?.UnitPrice ??
        candidate?.site_price ??
        row?.SitePrice ??
        row?.Price ??
        row?.UnitPrice ??
        row?.site_price,
    ),
    warehouse_name: warehouseName,
    raw: candidate && typeof candidate === "object" ? candidate : row ?? {},
    sellercloud_last_modified_at: toOptionalIso(
      candidate?.LastModifiedDate ??
        candidate?.LastUpdated ??
        candidate?.ModifiedOn ??
        row?.LastModifiedDate ??
        row?.LastUpdated ??
        row?.ModifiedOn,
    ),
    updated_at: new Date().toISOString(),
  };
}

async function getSellercloudToken(
  credentials: SellercloudCredentials,
): Promise<string> {
  const baseUrl = normalizeDomain(credentials.domain);
  if (!baseUrl) throw new Error("Missing Sellercloud domain");

  const response = await fetch(`${baseUrl}/rest/api/token`, {
    method: "POST",
    headers: {
      Accept: "application/json",
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      Username: credentials.username,
      Password: credentials.password,
    }),
  });

  const text = await response.text();
  const data = text ? JSON.parse(text) : {};
  if (!response.ok || !data?.access_token) {
    throw new Error(
      String(
        data?.error || data?.message || `Token failed (${response.status})`,
      ),
    );
  }

  return String(data.access_token);
}

async function fetchCatalogAll(
  baseUrl: string,
  token: string,
  pageSize = 250,
): Promise<any[]> {
  const all: any[] = [];
  let pageNumber = 1;

  while (true) {
    const res = await fetch(
      `${baseUrl}/rest/api/catalog?pageNumber=${pageNumber}&pageSize=${pageSize}`,
      {
        method: "GET",
        headers: {
          Accept: "application/json",
          Authorization: `Bearer ${token}`,
        },
      },
    );

    const text = await res.text();
    let payload: any = null;
    try {
      payload = text ? JSON.parse(text) : null;
    } catch {
      payload = null;
    }

    if (!res.ok) {
      throw new Error(
        payload?.error ||
          payload?.message ||
          `Catalog fetch failed (${res.status})`,
      );
    }

    const candidates = [
      payload,
      payload?.Data,
      payload?.data,
      payload?.Result,
      payload?.result,
    ];
    let items: any[] = [];
    for (const c of candidates) {
      if (Array.isArray(c)) {
        items = c;
        break;
      }
      if (Array.isArray(c?.Items)) {
        items = c.Items;
        break;
      }
      if (Array.isArray(c?.items)) {
        items = c.items;
        break;
      }
      if (Array.isArray(c?.Results)) {
        items = c.Results;
        break;
      }
      if (Array.isArray(c?.results)) {
        items = c.results;
        break;
      }
    }

    all.push(...items);

    if (items.length < pageSize) break;
    pageNumber += 1;
    if (pageNumber > 2000) break;
  }

  return all;
}

async function resolveAccountContext(request: Request): Promise<UserContext> {
  const cookieStore = (await cookies()) as any;
  const userClient = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
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
      },
    },
  );

  const { data: authData, error: authErr } = await userClient.auth.getUser();
  let activeClient = userClient;
  let userId = authData?.user?.id ?? null;

  if ((!authData?.user || authErr) && !userId) {
    const authHeader = request.headers.get("authorization");
    const token = authHeader?.toLowerCase().startsWith("bearer ")
      ? authHeader.slice(7).trim()
      : null;

    if (token) {
      const anonClient = getAnonClient(token);
      const { data: tokenData, error: tokenError } =
        await anonClient.auth.getUser();
      if (!tokenError && tokenData?.user) {
        activeClient = anonClient;
        userId = tokenData.user.id;
      }
    }
  }

  if (!userId) {
    return { ok: false, status: 401, message: "Not authenticated" };
  }

  const { data: me, error: meErr } = await activeClient
    .from("users")
    .select("account_id")
    .eq("id", userId)
    .maybeSingle();

  if (meErr || !me?.account_id) {
    return {
      ok: false,
      status: 400,
      message: meErr?.message ?? "User account not found",
    };
  }

  const rawAccountId = String(me.account_id);
  const { data: accountRow } = await activeClient
    .from("accounts")
    .select("parent_account_id")
    .eq("id", rawAccountId)
    .maybeSingle();

  const effectiveAccountId = String(
    accountRow?.parent_account_id ?? rawAccountId,
  );
  return { ok: true, accountId: effectiveAccountId, rawAccountId };
}

async function loadProducts(
  accountId: string,
  source?: string | null,
  rawAccountId?: string | null,
): Promise<{ rows: ProductRow[]; sources: string[] }> {
  const sourceFilter = source ? String(source).trim().toLowerCase() : null;
  const sr = getServiceRoleClient();
  const { data: accountRow } = await sr
    .from("accounts")
    .select("name")
    .eq("id", accountId)
    .maybeSingle();
  const accountName = String((accountRow as any)?.name ?? "").trim() || null;

  const rawId = rawAccountId ? String(rawAccountId) : null;
  const scopedIds = Array.from(
    new Set([accountId, rawId].filter((v): v is string => Boolean(v))),
  );

  let productQuery = sr
    .from("products")
    .select(
      "id, sku, description, available, physical_qty, on_hold, warehouse_name, source, raw, updated_at, parent_account_id",
    )
    .in("parent_account_id", scopedIds);

  if (sourceFilter && sourceFilter !== "all") {
    productQuery = productQuery.ilike("source", sourceFilter);
  }

  const { data, error } = await productQuery
    .order("updated_at", { ascending: false })
    .limit(2000);

  if (error) {
    if (!isMissingProductsTableError(error)) throw error;

    let fallbackQuery = sr
      .from("vw_products_master_enriched")
      .select(
        "id, sku, description, available, on_hold, warehouse_name, product_source, account_name, updated_at, parent_account_id, account_id",
      )
      .or(
        scopedIds
          .map(
            (id) => `parent_account_id.eq.${id},account_id.eq.${id},client_account_id.eq.${id}`,
          )
          .join(","),
      );

    if (sourceFilter && sourceFilter !== "all") {
      fallbackQuery = fallbackQuery.ilike("product_source", sourceFilter);
    }

    const { data: fallbackData, error: fallbackError } = await fallbackQuery
      .order("updated_at", { ascending: false })
      .limit(2000);

    if (fallbackError) throw fallbackError;

    const rows = (fallbackData ?? []).map((row: any) => ({
      id: String(row.id),
      sku: row.sku ?? null,
      description: row.description ?? null,
      available: row.available ?? null,
      on_hold: row.on_hold ?? null,
      warehouse_name: row.warehouse_name ?? null,
      product_source: row.product_source ?? null,
      account_name: row.account_name ?? null,
      updated_at: row.updated_at ?? null,
    }));

    const sources = Array.from(
      new Set(
        rows
          .map((row) => row.product_source)
          .filter((v): v is string => Boolean(v)),
      ),
    );

    return { rows, sources };
  }

  const rows = (data ?? []).map((row: any) => {
    const raw = row?.raw && typeof row.raw === "object" ? row.raw : {};
    const available = pickNumber(
      row.available,
      row.physical_qty,
      (raw as any)?.InventoryAvailableQty,
      (raw as any)?.AggregatedQty,
      (raw as any)?.AggregateQty,
      (raw as any)?.AggregatePhysicalQty,
      (raw as any)?.WarehousePhysicalQty,
      (raw as any)?.PhysicalQty,
    );

    const accountNameFromRaw = firstNonEmpty(
      (raw as any)?.CompanyName,
      (raw as any)?.CompanyNameAbbreviation,
      (raw as any)?.SellerName,
      (raw as any)?.VendorOfProduct,
    );

    return {
      id: String(row.id),
      sku: row.sku ?? null,
      description: row.description ?? null,
      available,
      on_hold: row.on_hold ?? null,
      warehouse_name: row.warehouse_name ?? null,
      product_source: row.source ?? null,
      account_name: accountNameFromRaw || accountName,
      updated_at: row.updated_at ?? null,
    };
  });

  // If nothing was found in products table for a specific source, attempt
  // to read directly from integration-specific tables so the UI can still
  // display data even before a sync has been upserted into products.
  if (rows.length === 0 && sourceFilter === "sellercloud") {
    const { data: scRows, error: scError } = await sr
      .from("sellercloud_products")
      .select(
        "id, account_id, sku, name, description, quantity_available, quantity_physical, warehouse_name, company_name, updated_at, created_at",
      )
      .or(`account_id.eq.${accountId},account_id.eq.${rawId}`)
      .order("updated_at", { ascending: false })
      .limit(2000);

    if (!scError && Array.isArray(scRows)) {
      scRows.forEach((row: any) => {
        rows.push({
          id: String(row.id),
          sku: row.sku ?? null,
          description: row.description ?? row.name ?? null,
          available: row.quantity_available ?? row.quantity_physical ?? null,
          on_hold: null,
          warehouse_name: row.warehouse_name ?? null,
          product_source: "sellercloud",
          account_name: row.company_name ?? null,
          updated_at: row.updated_at ?? row.created_at ?? null,
        });
      });
    }
  }

  if (rows.length === 0 && sourceFilter === "extensiv") {
    // Match the same scoping used by /api/products for extensiv
    const orFilters = Array.from(
      new Set(
        scopedIds
          .map(
            (id) =>
              `parent_account_id.eq.${id},client_account_id.eq.${id}`,
          )
          .flatMap((s) => s.split(",")),
      ),
    ).join(",");

    const { data: exRows, error: exError } = await sr
      .from("extensiv_products_n")
      .select("*")
      .or(orFilters)
      .order("updated_at", { ascending: false })
      .limit(2000);

    if (!exError && Array.isArray(exRows)) {
      exRows.forEach((row: any) => {
        const available = pickNumber(
          row.available,
          row.quantity_available,
          row.qty_available,
          row.quantity_available_to_allocate,
          row.qty_on_hand,
          row.quantity_on_hand,
          row.physical_qty,
        );
        const onHold = pickNumber(
          row.on_hold,
          row.quantity_on_hold,
          row.qty_on_hold,
          row.quantity_hold,
        );
        rows.push({
          id: String(row.id ?? row.sku ?? crypto.randomUUID()),
          sku: row.sku ?? null,
          description: row.description ?? row.name ?? null,
          available,
          on_hold: onHold,
          warehouse_name:
            row.warehouse_name ??
            row.warehouse ??
            row.facility_name ??
            row.facility ??
            null,
          product_source: "extensiv",
          account_name:
            row.account_name ??
            row.company_name ??
            row.client_name ??
            row.customer_name ??
            null,
          updated_at: row.updated_at ?? row.created_at ?? null,
        });
      });
    } else if (exError) {
      console.error("[billing/products] extensiv fallback error", exError);
    }
  }

  // Last-resort fallback: pull from vw_products_master_enriched (same view used
  // by inventory page) scoped to both parent and raw account ids.
  if (rows.length === 0) {
    let viewQuery = sr
      .from("vw_products_master_enriched")
      .select(
        "id, sku, description, available, on_hold, warehouse_name, product_source, account_name, updated_at, parent_account_id, account_id, client_account_id",
      )
      .or(
        scopedIds
          .map(
            (id) =>
              `parent_account_id.eq.${id},account_id.eq.${id},client_account_id.eq.${id}`,
          )
          .join(","),
      )
      .order("updated_at", { ascending: false })
      .limit(2000);

    if (sourceFilter && sourceFilter !== "all") {
      viewQuery = viewQuery.ilike("product_source", sourceFilter);
    }

    const { data: viewData, error: viewError } = await viewQuery;
    if (!viewError && Array.isArray(viewData)) {
      const maybeFiltered =
        sourceFilter && sourceFilter !== "all"
          ? viewData.filter(
              (row) =>
                String(row.product_source || "")
                  .toLowerCase()
                  .trim() === sourceFilter,
            )
          : viewData;

      maybeFiltered.forEach((row: any) => {
        rows.push({
          id: String(row.id),
          sku: row.sku ?? null,
          description: row.description ?? null,
          available: row.available ?? null,
          on_hold: row.on_hold ?? null,
          warehouse_name: row.warehouse_name ?? null,
          product_source: row.product_source ?? null,
          account_name: row.account_name ?? null,
          updated_at: row.updated_at ?? null,
        });
      });
    }
  }

  // If still empty and a source filter is set, fetch without source filter then
  // filter in memory (covers inconsistent casing/spacing in DB values).
  if (rows.length === 0 && sourceFilter && sourceFilter !== "all") {
    const { data: viewData2, error: viewError2 } = await sr
      .from("vw_products_master_enriched")
      .select(
        "id, sku, description, available, on_hold, warehouse_name, product_source, account_name, updated_at, parent_account_id, account_id, client_account_id",
      )
      .or(
        scopedIds
          .map(
            (id) =>
              `parent_account_id.eq.${id},account_id.eq.${id},client_account_id.eq.${id}`,
          )
          .join(","),
      )
      .order("updated_at", { ascending: false })
      .limit(2000);

    if (!viewError2 && Array.isArray(viewData2)) {
      viewData2
        .filter(
          (row) =>
            String(row.product_source || "").toLowerCase().trim() ===
            sourceFilter,
        )
        .forEach((row: any) =>
          rows.push({
            id: String(row.id),
            sku: row.sku ?? null,
            description: row.description ?? null,
            available: row.available ?? null,
            on_hold: row.on_hold ?? null,
            warehouse_name: row.warehouse_name ?? null,
            product_source: row.product_source ?? null,
            account_name: row.account_name ?? null,
            updated_at: row.updated_at ?? null,
          }),
        );
    }
  }

  // Absolute last resort: if still empty, return unfiltered view rows for the
  // account scope so the UI at least shows something (mirrors inventory page).
  if (rows.length === 0) {
    const { data: viewData3, error: viewError3 } = await sr
      .from("vw_products_master_enriched")
      .select(
        "id, sku, description, available, on_hold, warehouse_name, product_source, account_name, updated_at, parent_account_id, account_id, client_account_id",
      )
      .or(
        [
          `parent_account_id.eq.${accountId}`,
          `account_id.eq.${accountId}`,
          rawId ? `parent_account_id.eq.${rawId}` : null,
          rawId ? `account_id.eq.${rawId}` : null,
          rawId ? `client_account_id.eq.${rawId}` : null,
        ]
          .filter(Boolean)
          .join(","),
      )
      .order("updated_at", { ascending: false })
      .limit(2000);

    if (!viewError3 && Array.isArray(viewData3)) {
      viewData3.forEach((row: any) =>
        rows.push({
          id: String(row.id),
          sku: row.sku ?? null,
          description: row.description ?? null,
          available: row.available ?? null,
          on_hold: row.on_hold ?? null,
          warehouse_name: row.warehouse_name ?? null,
          product_source: row.product_source ?? null,
          account_name: row.account_name ?? null,
          updated_at: row.updated_at ?? null,
        }),
      );
    }
  }

  const { data: integrations } = await sr
    .from("account_integrations")
    .select("type, status")
    .eq("account_id", accountId);

  const sources = Array.from(
    new Set(
      [
        ...(rows
          .map((row) => row.product_source || (row as any).source)
          .filter((v): v is string => Boolean(v)) as string[]),
        ...((integrations || [])
          .filter(
            (row) =>
              String(row?.status || "").toLowerCase() === "active" &&
              Boolean(row?.type),
          )
          .map((row) => String(row.type).toLowerCase()) as string[]),
      ].filter(Boolean),
    ),
  );

  return { rows, sources };
}

export async function GET(request: Request) {
  const context = await resolveAccountContext(request);
  if (!context.ok) {
    return NextResponse.json(
      { error: context.message },
      { status: context.status },
    );
  }

  try {
    const { searchParams } = new URL(request.url);
    const source = searchParams.get("source");

    const { rows, sources } = await loadProducts(
      context.accountId,
      source,
      context.rawAccountId,
    );
    console.log("[billing/products] debug", {
      accountId: context.accountId,
      rawAccountId: context.rawAccountId,
      source,
      rows: rows.length,
      sources,
      sample: rows.slice(0, 3).map((r) => ({
        sku: r.sku,
        src: r.product_source,
        acc: r.account_name,
      })),
    });
    return NextResponse.json({ data: rows, sources });
  } catch (error: any) {
    return NextResponse.json(
      { error: error?.message ?? "Failed to load products" },
      { status: 400 },
    );
  }
}

export async function POST(request: Request) {
  const context = await resolveAccountContext(request);
  if (!context.ok) {
    return NextResponse.json(
      { error: context.message },
      { status: context.status },
    );
  }

  let payload: any;
  try {
    payload = await request.json();
  } catch {
    return NextResponse.json(
      { error: "Invalid JSON payload" },
      { status: 400 },
    );
  }

  const action = payload?.action;
  if (!action || typeof action !== "string") {
    return NextResponse.json({ error: "Missing action" }, { status: 400 });
  }
  if (action !== "syncSellercloud") {
    return NextResponse.json(
      { error: `Unsupported action: ${action}` },
      { status: 400 },
    );
  }

  const sr = getServiceRoleClient();
  const accountId = context.accountId;

  const { data: integration, error: integrationError } = await sr
    .from("account_integrations")
    .select("credentials, status")
    .eq("account_id", accountId)
    .eq("type", "sellercloud")
    .maybeSingle();

  if (integrationError) {
    return NextResponse.json(
      { error: integrationError.message },
      { status: 400 },
    );
  }
  if (
    !integration ||
    String(integration.status || "").toLowerCase() !== "active"
  ) {
    return NextResponse.json(
      { error: "Sellercloud integration is not active" },
      { status: 400 },
    );
  }

  const credentials = parseCredentials((integration as any).credentials);
  if (!credentials) {
    return NextResponse.json(
      { error: "Invalid Sellercloud credentials" },
      { status: 400 },
    );
  }

  try {
    const token = await getSellercloudToken(credentials);
    const baseUrl = normalizeDomain(credentials.domain);
    const rawRows = await fetchCatalogAll(baseUrl, token);

    const normalizedRows = rawRows
      .map((row) => toUpsertRow(accountId, row))
      .filter((row): row is ProductUpsert => Boolean(row));

    const pageSize = 500;
    let upserted = 0;
    for (let i = 0; i < normalizedRows.length; i += pageSize) {
      const chunk = normalizedRows.slice(i, i + pageSize);
      const { error } = await sr.from("products").upsert(chunk, {
        onConflict: "parent_account_id,source,sku,warehouse_name",
        ignoreDuplicates: false,
      });
      if (error) {
        if (isMissingProductsTableError(error)) {
          throw new Error(
            "Products table is missing. Apply migration 20260309_create_products_table.sql first.",
          );
        }
        throw new Error(error.message);
      }
      upserted += chunk.length;
    }

    const { rows: data } = await loadProducts(accountId);
    return NextResponse.json({
      data,
      summary: {
        received: rawRows.length,
        normalized: normalizedRows.length,
        upserted,
      },
    });
  } catch (error: any) {
    return NextResponse.json(
      { error: error?.message ?? "Failed to sync Sellercloud products" },
      { status: 400 },
    );
  }
}
