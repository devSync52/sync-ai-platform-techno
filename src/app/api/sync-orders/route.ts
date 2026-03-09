import { createClient } from "@supabase/supabase-js";
import AES from "crypto-js/aes";
import Utf8 from "crypto-js/enc-utf8";
import { v5 as uuidv5 } from "uuid";
import { createSellercloudCustomerLogins } from "@/lib/sellercloudCustomerProvision";

const ENCRYPTION_KEY =
  process.env.NEXT_PUBLIC_CREDENTIAL_SECRET || "SYNC_SECRET";
const ORDER_UUID_NAMESPACE = "2b40d97b-6ca2-4b52-a8d9-55de8e1bc123";
const ORDER_ITEM_UUID_NAMESPACE = "c6aebcb7-87eb-4f34-8509-f06a7a98c4c0";

type SyncSource = "sellercloud" | "extensiv";

type SellercloudCredentials = {
  domain: string;
  username: string;
  password: string;
};

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

function safeJsonParse(text: string): any | null {
  try {
    if (!text || typeof text !== "string") return null;

    // Trim and check if it looks like JSON
    const trimmed = text.trim();
    if (!trimmed.startsWith("{") && !trimmed.startsWith("[")) {
      return null;
    }

    const parsed = JSON.parse(trimmed);
    if (typeof parsed === "string") {
      try {
        return JSON.parse(parsed);
      } catch {
        return parsed;
      }
    }
    return parsed;
  } catch (error) {
    console.warn(
      "JSON parse warning:",
      error instanceof Error ? error.message : String(error),
      "for text:",
      text?.substring?.(0, 100),
    );
    return null;
  }
}

function findFirstObjectArrayDeep(payload: any): any[] {
  const queue: any[] = [payload];
  const seen = new Set<any>();

  while (queue.length) {
    const node = queue.shift();
    if (!node || typeof node !== "object") continue;
    if (seen.has(node)) continue;
    seen.add(node);

    if (Array.isArray(node)) {
      if (
        node.length &&
        node.some((item) => item && typeof item === "object")
      ) {
        return node;
      }
      continue;
    }

    for (const value of Object.values(node)) {
      if (value && typeof value === "object") queue.push(value);
    }
  }

  return [];
}

function extractArray(payload: any): any[] {
  if (Array.isArray(payload)) return payload;
  if (!payload || typeof payload !== "object") return [];

  const keys = [
    "results",
    "Results",
    "data",
    "Data",
    "items",
    "Items",
    "orders",
    "Orders",
  ];
  for (const key of keys) {
    if (Array.isArray(payload[key])) return payload[key];
  }

  if (payload.result && Array.isArray(payload.result)) return payload.result;
  return findFirstObjectArrayDeep(payload);
}

function pick<T = any>(obj: any, keys: string[], fallback: T = null as T): T {
  for (const key of keys) {
    if (obj?.[key] !== undefined && obj?.[key] !== null) {
      return obj[key] as T;
    }
  }
  return fallback;
}

function toNumber(value: any): number | null {
  if (value === null || value === undefined || value === "") return null;
  const n = Number(value);
  return Number.isFinite(n) ? n : null;
}

function toDateOnly(value: any): string | null {
  if (!value) return null;
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return null;
  return d.toISOString();
}

function normalizeText(value: any): string {
  return String(value || "").trim().toLowerCase();
}

async function loadCustomerIdentityMatcher(
  admin: ReturnType<typeof createClient>,
  parentAccountId: string,
) {
  if (!parentAccountId) {
    return {
      resolve(): string | null {
        return null;
      },
    };
  }

  const { data: accounts } = await admin
    .from("accounts")
    .select("id, name, parent_account_id")
    .or(`id.eq.${parentAccountId},parent_account_id.eq.${parentAccountId}`);

  const accountIds = Array.from(
    new Set(
      (accounts || [])
        .map((a: any) => String(a?.id || "").trim())
        .filter(Boolean),
    ),
  );
  if (!accountIds.length) accountIds.push(parentAccountId);

  const { data: billingClients } = await admin
    .from("billing_clients")
    .select("client_account_id, name, wms_customer_id")
    .eq("parent_account_id", parentAccountId);

  const billingByWmsId = new Map<string, string>();
  const billingByName = new Map<string, string>();
  for (const billing of billingClients || []) {
    const clientAccountId = String((billing as any)?.client_account_id || "").trim();
    if (!clientAccountId) continue;
    if (!accountIds.includes(clientAccountId)) accountIds.push(clientAccountId);

    const wms = normalizeText((billing as any)?.wms_customer_id);
    if (wms && !billingByWmsId.has(wms)) billingByWmsId.set(wms, clientAccountId);

    const name = normalizeText((billing as any)?.name);
    if (name && !billingByName.has(name)) billingByName.set(name, clientAccountId);
  }

  const { data: clients } = await admin
    .from("clients")
    .select("id, account_id, name, email")
    .in("account_id", accountIds);

  const byEmail = new Map<string, string>();
  const byName = new Map<string, string>();
  const byAccount = new Map<string, string[]>();
  const clientById = new Map<string, any>();

  for (const client of clients || []) {
    const clientId = String((client as any)?.id || "").trim();
    const accountId = String((client as any)?.account_id || "").trim();
    if (!clientId) continue;

    clientById.set(clientId, client);
    if (accountId) {
      const current = byAccount.get(accountId) || [];
      current.push(clientId);
      byAccount.set(accountId, current);
    }

    const email = normalizeText((client as any)?.email);
    if (email && !byEmail.has(email)) byEmail.set(email, clientId);

    const name = normalizeText((client as any)?.name);
    if (name && !byName.has(name)) byName.set(name, clientId);
  }

  function pickClientFromAccount(
    accountId: string,
    names: string[],
    email: string,
  ): string | null {
    const candidates = byAccount.get(accountId) || [];
    if (!candidates.length) return null;

    if (email) {
      for (const clientId of candidates) {
        const candidateEmail = normalizeText((clientById.get(clientId) as any)?.email);
        if (candidateEmail === email) return clientId;
      }
    }

    for (const name of names) {
      if (!name) continue;
      for (const clientId of candidates) {
        const candidateName = normalizeText((clientById.get(clientId) as any)?.name);
        if (candidateName === name) return clientId;
      }
    }

    return candidates[0] || null;
  }

  return {
    resolve(row: any): string | null {
      const metadata =
        row?.metadata && typeof row.metadata === "object" ? row.metadata : {};

      const wmsId = normalizeText(
        pick(metadata, ["CustomerID", "customer_id", "WmsUserIdentifier"], ""),
      );

      const email = normalizeText(
        pick(metadata, ["CustomerEmail", "Email", "customer_email"], ""),
      );
      if (email && byEmail.has(email)) return byEmail.get(email) || null;

      const first = normalizeText(
        pick(metadata, ["FirstName", "ShippingAddressFirstName", "BillingAddressFirstName"], ""),
      );
      const last = normalizeText(
        pick(metadata, ["LastName", "ShippingAddressLastName", "BillingAddressLastName"], ""),
      );
      const fullName = `${first} ${last}`.trim();
      const clientName = normalizeText(row?.client_name);
      if (fullName && byName.has(fullName)) return byName.get(fullName) || null;
      if (clientName && byName.has(clientName)) return byName.get(clientName) || null;

      const company = normalizeText(
        pick(metadata, ["CompanyName", "company_name"], row?.client_name),
      );

      const names = [fullName, clientName, company].filter(Boolean);
      const mappedAccountId =
        (wmsId && billingByWmsId.get(wmsId)) ||
        (company && billingByName.get(company)) ||
        "";

      if (mappedAccountId) {
        const fromMappedAccount = pickClientFromAccount(mappedAccountId, names, email);
        if (fromMappedAccount) return fromMappedAccount;
      }

      return null;
    },
  };
}

function inDateRange(
  isoDate: string | null,
  fromDate?: string,
  toDate?: string,
): boolean {
  if (!isoDate) return true;
  const dateOnly = isoDate.slice(0, 10);
  if (fromDate && dateOnly < fromDate) return false;
  if (toDate && dateOnly > toDate) return false;
  return true;
}

async function getSellercloudToken(
  credentials: SellercloudCredentials,
): Promise<string> {
  const baseUrl = normalizeDomain(credentials.domain);
  if (!baseUrl) {
    throw new Error("Missing Sellercloud domain");
  }

  const tokenRes = await fetch(`${baseUrl}/rest/api/token`, {
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

  const tokenText = await tokenRes.text();
  const tokenJson = safeJsonParse(tokenText);

  if (!tokenRes.ok || !tokenJson?.access_token) {
    throw new Error(
      String(
        tokenJson?.error ||
          tokenJson?.message ||
          tokenText ||
          `Sellercloud token request failed (${tokenRes.status})`,
      ),
    );
  }

  return String(tokenJson.access_token);
}

async function fetchSellercloudOrders(
  credentials: SellercloudCredentials,
  fromDate?: string,
  toDate?: string,
): Promise<any[]> {
  const token = await getSellercloudToken(credentials);
  const baseUrl = normalizeDomain(credentials.domain);

  const pageSize = 200;
  const maxPages = 10;
  const allRows: any[] = [];

  for (let page = 1; page <= maxPages; page++) {
    const url = `${baseUrl}/rest/api/orders?pageNumber=${page}&pageSize=${pageSize}`;
    const res = await fetch(url, {
      method: "GET",
      headers: {
        Accept: "application/json",
        Authorization: `Bearer ${token}`,
      },
    });

    const raw = await res.text();
    const json = safeJsonParse(raw);
    console.log("res", res);
    console.log("json", json);
    if (!res.ok) {
      throw new Error(
        String(
          json?.error ||
            json?.message ||
            raw ||
            `Sellercloud orders request failed (${res.status})`,
        ),
      );
    }

    const rows = extractArray(json);
    if (!rows.length) break;

    allRows.push(...rows);

    const totalPages = toNumber(
      pick(json, [
        "TotalPages",
        "totalPages",
        "PageCount",
        "pageCount",
        "Pages",
      ]),
    );

    if (totalPages && page >= totalPages) break;
    if (rows.length < pageSize) break;
  }

  return allRows.filter((row) => {
    const orderDate = toDateOnly(
      pick(row, [
        "OrderDate",
        "orderDate",
        "CreatedOnUtc",
        "CreatedOn",
        "CreatedDate",
        "created_at",
      ]),
    );
    return inDateRange(orderDate, fromDate, toDate);
  });
}

function normalizeSellercloudStatus(row: any): string | null {
  const raw =
    String(
      pick(row, ["OrderStatus", "OrderStatusName", "Status", "status"], ""),
    ).trim() || "";
  if (raw) return raw;

  const shippingStatus = toNumber(
    pick(row, ["ShippingStatus", "shipping_status", "ShippingStatusCode"]),
  );
  if (shippingStatus === 2) return "Shipped";

  const statusCode = toNumber(
    pick(row, ["StatusCode", "status_code", "OrderStatusCode"]),
  );
  if (statusCode === null) return null;
  if (statusCode === 1) return "Processing";
  return `Status ${statusCode}`;
}

function mapSellercloudOrderToUnifiedRow(
  row: any,
  idx: number,
  effectiveAccountId: string,
  requestedAccountId: string,
) {
  const externalId =
    toNumber(
      pick(row, ["ID", "Id", "id", "OrderID", "OrderId", "ExternalID"]),
    ) ?? null;

  const orderIdRaw = pick(
    row,
    [
      "OrderID",
      "OrderId",
      "order_id",
      "ID",
      "Id",
      "id",
      "OrderNumber",
      "order_number",
      "InvoiceNumber",
    ],
    "",
  );
  const orderSourceRaw = pick(
    row,
    [
      "OrderSourceOrderID",
      "OrderSourceOrderId",
      "SourceOrderID",
      "SourceOrderId",
      "order_source_order_id",
    ],
    "",
  );
  const firstName = String(
    pick(row, ["FirstName", "first_name", "ShippingAddressFirstName"], ""),
  ).trim();
  const lastName = String(
    pick(row, ["LastName", "last_name", "ShippingAddressLastName"], ""),
  ).trim();
  const fullName = `${firstName} ${lastName}`.trim();
  const clientName =
    (
      pick(
        row,
        [
          "ClientName",
          "CustomerName",
          "BuyerName",
          "ShipToName",
          "CompanyName",
          "customer_name",
          "client_name",
        ],
        "",
      ) as string
    )?.trim() ||
    fullName ||
    String(pick(row, ["CustomerEmail", "Email", "email"], "")).trim() ||
    null;
  const orderDate = toDateOnly(
    pick(row, [
      "OrderDate",
      "orderDate",
      "CreatedOnUtc",
      "CreatedOn",
      "CreatedDate",
    ]),
  );

  const stableNaturalKey = `${effectiveAccountId}:${orderIdRaw || orderSourceRaw || externalId || pick(row, ["UniqueID", "UniqueId", "Guid"], idx)}`;
  const orderUuid = uuidv5(stableNaturalKey, ORDER_UUID_NAMESPACE);
  const metadataPayload =
    row?.metadata && typeof row.metadata === "object" ? row.metadata : row;

  return {
    order_uuid: orderUuid,
    account_id: effectiveAccountId,
    channel_account_id: requestedAccountId,
    order_id: orderIdRaw ? String(orderIdRaw) : null,
    order_source_order_id: orderSourceRaw ? String(orderSourceRaw) : null,
    client_name: clientName ? String(clientName) : null,
    grand_total: toNumber(
      pick(row, [
        "GrandTotal",
        "TotalAmount",
        "OrderTotal",
        "Total",
        "grand_total",
      ]),
    ),
    order_date: orderDate,
    status_code: toNumber(
      pick(row, ["StatusCode", "status_code", "OrderStatusCode"]),
    ),
    shipping_status: String(
      pick(row, ["ShippingStatus", "shipping_status"], ""),
    ).trim() || null,
    payment_status: String(
      pick(row, ["PaymentStatus", "payment_status"], ""),
    ).trim() || null,
    order_status: normalizeSellercloudStatus(row),
    source:
      String(pick(row, ["Source", "source"], "")).trim().toLowerCase() ||
      "sellercloud",
    marketplace_name:
      String(
        pick(
          row,
          [
            "MarketplaceName",
            "ChannelName",
            "marketplace_name",
            "Marketplace",
          ],
          "",
        ),
      ).trim() || null,
    marketplace_code: String(
      pick(row, ["MarketplaceCode", "marketplace_code"], ""),
    ).trim() || null,
    metadata: metadataPayload,
    _external_id: externalId,
  };
}

function mapSellercloudOrderItems(row: any, orderUuid: string) {
  const sourceItems = Array.isArray(row?.Items)
    ? row.Items
    : Array.isArray(row?.metadata?.Items)
      ? row.metadata.Items
      : [];

  return sourceItems.map((item: any, idx: number) => {
    const sku = String(
      pick(item, ["SKU", "Sku", "ProductID", "ProductId", "sku"], ""),
    ).trim();
    const quantity =
      toNumber(pick(item, ["Qty", "Quantity", "quantity", "qty"], 0)) ?? 0;
    const unitPrice =
      toNumber(
        pick(item, ["UnitPrice", "SitePrice", "Price", "price", "unit_price"], 0),
      ) ?? 0;
    const totalPrice =
      toNumber(
        pick(item, ["TotalPrice", "LineTotal", "LineTotalPrice", "total_price"], null),
      ) ??
      unitPrice * quantity;

    const lineNaturalKey = `${orderUuid}:${sku || "item"}:${idx}`;
    const lineId = uuidv5(lineNaturalKey, ORDER_ITEM_UUID_NAMESPACE);

    return {
      id: lineId,
      order_id: orderUuid,
      sku: sku || null,
      quantity,
      unit_price: unitPrice,
      total_price: totalPrice,
      metadata: item,
    };
  });
}

function mapExtensivOrderToUnifiedRow(
  row: any,
  effectiveAccountId: string,
  requestedAccountId: string,
) {
  const orderId =
    String(row?.order_number || row?.external_id || row?.id || "").trim() ||
    null;
  const orderSourceId =
    String(row?.external_id || row?.order_number || "").trim() || null;

  const stableNaturalKey = `${effectiveAccountId}:${orderSourceId || orderId || row?.id}`;
  const orderUuid = uuidv5(stableNaturalKey, ORDER_UUID_NAMESPACE);

  const statusText =
    row?.status_closed === true
      ? "Closed"
      : row?.status !== null && row?.status !== undefined
        ? `Status ${row.status}`
        : null;

  return {
    order_uuid: orderUuid,
    account_id: effectiveAccountId,
    channel_account_id: requestedAccountId,
    order_id: orderId,
    order_source_order_id: orderSourceId,
    client_name: String(row?.customer_name || "").trim() || null,
    grand_total: null,
    order_date: toDateOnly(row?.creation_date || row?.process_date),
    status_code: toNumber(row?.status),
    shipping_status: null,
    payment_status: null,
    order_status: statusText,
    source: "extensiv",
    marketplace_name: String(row?.facility_name || "extensiv").trim(),
    marketplace_code: String(row?.facility_external_id || "").trim() || null,
    metadata: row?.raw_data && typeof row.raw_data === "object" ? row.raw_data : row,
  };
}

function mapExtensivOrderItems(row: any, orderUuid: string) {
  const rawData = row?.raw_data && typeof row.raw_data === "object" ? row.raw_data : {};
  const sourceItems = Array.isArray(rawData?.items)
    ? rawData.items
    : Array.isArray(rawData?.Items)
      ? rawData.Items
      : [];

  return sourceItems.map((item: any, idx: number) => {
    const sku = String(pick(item, ["sku", "SKU", "product_sku", "productSku"], "")).trim();
    const quantity = toNumber(pick(item, ["quantity", "qty", "Qty"], 0)) ?? 0;
    const unitPrice = toNumber(pick(item, ["unit_price", "unitPrice", "price"], 0)) ?? 0;
    const totalPrice =
      toNumber(pick(item, ["total_price", "line_total", "lineTotal"], null)) ??
      unitPrice * quantity;

    const lineNaturalKey = `${orderUuid}:${sku || "item"}:${idx}`;
    const lineId = uuidv5(lineNaturalKey, ORDER_ITEM_UUID_NAMESPACE);
    return {
      id: lineId,
      order_id: orderUuid,
      sku: sku || null,
      quantity,
      unit_price: unitPrice,
      total_price: totalPrice,
      metadata: item,
    };
  });
}

async function upsertUniversalOrders(
  admin: ReturnType<typeof createClient>,
  rows: any[],
) {
  if (!rows.length) return;
  const matcher = await loadCustomerIdentityMatcher(
    admin,
    String(rows[0]?.account_id || ""),
  );
  const sanitizedRows = rows.map((row) => {
    const orderNumberRaw = row?.order_id || row?.order_source_order_id || row?.order_uuid;
    const orderNumber = orderNumberRaw ? String(orderNumberRaw) : null;
    const orderDate = row?.order_date ? String(row.order_date) : null;
    const createdAt =
      orderDate && !Number.isNaN(new Date(orderDate).getTime())
        ? orderDate
        : new Date().toISOString();
    return {
      id: String(row?.order_uuid || uuidv5(`${row?.account_id}:${orderNumber || Math.random()}`, ORDER_UUID_NAMESPACE)),
      account_id: row?.account_id || null,
      client_id: matcher.resolve(row),
      order_number: orderNumber,
      order_source_order_id: row?.order_source_order_id || null,
      client_name: row?.client_name || null,
      marketplace_name: row?.marketplace_name || null,
      origin: row?.source ? String(row.source) : null,
      status: row?.order_status ? String(row.order_status) : null,
      payment_status: row?.payment_status ? String(row.payment_status) : null,
      shipping_status: row?.shipping_status ? String(row.shipping_status) : null,
      total: row?.grand_total !== null && row?.grand_total !== undefined ? Number(row.grand_total) : null,
      created_at: createdAt,
      metadata: row?.metadata && typeof row.metadata === "object" ? row.metadata : null,
    };
  });

  const chunkSize = 500;
  for (let i = 0; i < sanitizedRows.length; i += chunkSize) {
    const chunk = sanitizedRows.slice(i, i + chunkSize);
    const { error: upsertError } = await admin.from("orders").upsert(chunk, {
      onConflict: "id",
    });
    if (!upsertError) continue;

    const errorText = String(upsertError.message || "").toLowerCase();
    const missingColumn =
      (errorText.includes("column") && errorText.includes("does not exist")) ||
      (errorText.includes("could not find") && errorText.includes("column")) ||
      errorText.includes("schema cache");

    if (!missingColumn) {
      throw new Error(`Failed to save universal orders: ${upsertError.message}`);
    }

    // Backward-compatible fallback while migration is pending.
    const minimalChunk = chunk.map((row: any) => ({
      id: row.id,
      account_id: row.account_id,
      client_id: row.client_id,
      order_number: row.order_number,
      origin: row.origin,
      status: row.status,
      total: row.total,
      created_at: row.created_at,
    }));
    const { error: minimalError } = await admin
      .from("orders")
      .upsert(minimalChunk, { onConflict: "id" });
    if (minimalError) {
      throw new Error(`Failed to save universal orders: ${minimalError.message}`);
    }
  }
}

async function upsertOrderItems(
  admin: ReturnType<typeof createClient>,
  itemRows: any[],
) {
  if (!itemRows.length) return;
  const chunkSize = 500;
  for (let i = 0; i < itemRows.length; i += chunkSize) {
    const chunk = itemRows.slice(i, i + chunkSize);
    const { error } = await admin
      .from("order_items")
      .upsert(chunk, { onConflict: "id" });
    if (error) {
      const errorText = String(error.message || error.details || error.hint || "").toLowerCase();
      // Keep order sync resilient while migration is being applied.
      if (
        errorText.includes("relation \"order_items\" does not exist") ||
        errorText.includes("schema cache") ||
        errorText.includes("could not find") ||
        errorText.includes("column")
      ) {
        console.warn("[sync-orders] order_items schema not ready, skipping line items");
        return;
      }

      // Non-fatal: orders/customer sync should not fail because items failed.
      console.warn("[sync-orders] failed to upsert order_items chunk:", {
        message: error.message,
        details: (error as any).details,
        hint: (error as any).hint,
        code: (error as any).code,
      });
      return;
    }
  }
}

async function syncUniversalFromSourceTables(params: {
  admin: ReturnType<typeof createClient>;
  source: SyncSource;
  effectiveAccountId: string;
  requestedAccountId: string;
  fromDate?: string;
  toDate?: string;
}) {
  const { admin, source, effectiveAccountId, requestedAccountId, fromDate, toDate } =
    params;

  if (source === "sellercloud") {
    const { data: integrationRows, error: integrationError } = await admin
      .from("account_integrations")
      .select("account_id, credentials")
      .eq("type", "sellercloud")
      .in("account_id", [effectiveAccountId, requestedAccountId]);

    if (integrationError) {
      throw new Error(
        `Failed to load Sellercloud integration: ${integrationError.message}`,
      );
    }

    const integration =
      integrationRows?.find((r) => r.account_id === effectiveAccountId) ||
      integrationRows?.find((r) => r.account_id === requestedAccountId) ||
      null;

    const credentials = parseCredentials(integration?.credentials);
    if (!credentials) {
      throw new Error(
        "Sellercloud integration credentials are missing or invalid",
      );
    }

    const fetched = await fetchSellercloudOrders(credentials, fromDate, toDate);
    const rows = fetched.map((row, idx) =>
      mapSellercloudOrderToUnifiedRow(
        row,
        idx,
        effectiveAccountId,
        requestedAccountId,
      ),
    );
    const itemRows = fetched.flatMap((row: any, idx: number) => {
      const orderUuid = rows[idx]?.order_uuid;
      if (!orderUuid) return [];
      return mapSellercloudOrderItems(row, String(orderUuid));
    });
    await upsertUniversalOrders(admin, rows);
    await upsertOrderItems(admin, itemRows);
    return {
      importedCount: rows.length,
      sourceRows: fetched,
    };
  }

  let query = admin
    .from("extensiv_orders")
    .select(
      "id, external_id, order_number, customer_name, creation_date, process_date, status, status_closed, facility_name, facility_external_id, raw_data",
    )
    .eq("account_id", effectiveAccountId);

  if (fromDate) query = query.gte("creation_date", fromDate);
  if (toDate) query = query.lte("creation_date", toDate);

  const { data, error } = await query.limit(5000);
  if (error) {
    throw new Error(`Failed loading Extensiv orders for normalize: ${error.message}`);
  }

  const rows = (data || []).map((row: any) =>
    mapExtensivOrderToUnifiedRow(row, effectiveAccountId, requestedAccountId),
  );
  const itemRows = (data || []).flatMap((row: any, idx: number) => {
    const orderUuid = rows[idx]?.order_uuid;
    if (!orderUuid) return [];
    return mapExtensivOrderItems(row, String(orderUuid));
  });
  await upsertUniversalOrders(admin, rows);
  await upsertOrderItems(admin, itemRows);
  return {
    importedCount: rows.length,
    sourceRows: [] as any[],
  };
}

async function tryDirectSellercloudFallback(params: {
  admin: ReturnType<typeof createClient>;
  effectiveAccountId: string;
  requestedAccountId: string;
  fromDate?: string;
  toDate?: string;
}) {
  const { admin, effectiveAccountId, requestedAccountId, fromDate, toDate } =
    params;

  const { data: integrationRows, error: integrationError } = await admin
    .from("account_integrations")
    .select("account_id, credentials")
    .eq("type", "sellercloud")
    .in("account_id", [effectiveAccountId, requestedAccountId]);

  if (integrationError) {
    throw new Error(
      `Failed to load Sellercloud integration: ${integrationError.message}`,
    );
  }

  const integration =
    integrationRows?.find((r) => r.account_id === effectiveAccountId) ||
    integrationRows?.find((r) => r.account_id === requestedAccountId) ||
    null;

  const credentials = parseCredentials(integration?.credentials);
  if (!credentials) {
    throw new Error(
      "Sellercloud integration credentials are missing or invalid",
    );
  }

  const fetched = await fetchSellercloudOrders(credentials, fromDate, toDate);
  if (!fetched.length) {
    return {
      success: true,
      imported: 0,
      source_rows: [] as any[],
      mode: "fallback_direct",
      message: "No orders found in Sellercloud",
    };
  }
  console.log("fetched", fetched);

  const rows = fetched.map((row, idx) =>
    mapSellercloudOrderToUnifiedRow(
      row,
      idx,
      effectiveAccountId,
      requestedAccountId,
    ),
  );
  const itemRows = fetched.flatMap((row: any, idx: number) => {
    const orderUuid = rows[idx]?.order_uuid;
    if (!orderUuid) return [];
    return mapSellercloudOrderItems(row, String(orderUuid));
  });

  await upsertUniversalOrders(admin, rows);
  await upsertOrderItems(admin, itemRows);

  const now = new Date().toISOString();
  await admin
    .from("account_integrations")
    .update({ last_synced_at: now, status: "active" })
    .eq("type", "sellercloud")
    .in("account_id", [effectiveAccountId, requestedAccountId]);

  return {
    success: true,
    imported: rows.length,
    source_rows: fetched,
    mode: "fallback_direct",
    message: "Imported into universal orders table using direct Sellercloud fallback",
  };
}

export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => ({}));
    const {
      account_id,
      fromDate,
      toDate,
      source = "sellercloud",
    } = body as {
      account_id?: string;
      fromDate?: string;
      toDate?: string;
      source?: SyncSource;
    };

    if (!account_id) {
      return new Response(
        JSON.stringify({ success: false, error: "Missing account_id" }),
        {
          status: 400,
          headers: { "Content-Type": "application/json" },
        },
      );
    }
    console.log("519");

    const syncUrls: Record<SyncSource, string> = {
      sellercloud:
        "https://euzjrgnyzfgldubqglba.supabase.co/functions/v1/get_sellercloud_orders",
      extensiv:
        "https://euzjrgnyzfgldubqglba.supabase.co/functions/v1/get_extensiv_orders",
    };

    if (!syncUrls[source]) {
      return new Response(
        JSON.stringify({ success: false, error: "Invalid source" }),
        {
          status: 400,
          headers: { "Content-Type": "application/json" },
        },
      );
    }

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const serviceRole = process.env.SUPABASE_SERVICE_ROLE_KEY;
    const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
    const bearer = serviceRole || anonKey;

    if (!supabaseUrl || !serviceRole) {
      return new Response(
        JSON.stringify({
          success: false,
          error: "Missing Supabase server configuration",
        }),
        {
          status: 500,
          headers: { "Content-Type": "application/json" },
        },
      );
    }

    const admin = createClient(supabaseUrl, serviceRole, {
      auth: { autoRefreshToken: false, persistSession: false },
    });

    let effectiveAccountId = account_id;
    const { data: accountRow } = await admin
      .from("accounts")
      .select("parent_account_id")
      .eq("id", account_id)
      .maybeSingle();

    if (accountRow?.parent_account_id) {
      effectiveAccountId = accountRow.parent_account_id;
    }

    // Prefer direct Sellercloud sync path to avoid edge-function
    // decrypt/env mismatches (e.g. "Malformed UTF-8 data").
    if (source === "sellercloud") {
      try {
        const direct = await tryDirectSellercloudFallback({
          admin,
          effectiveAccountId,
          requestedAccountId: account_id,
          fromDate,
          toDate,
        });
        const customerProvision = await createSellercloudCustomerLogins({
          admin,
          accountId: effectiveAccountId,
          inviteAccountId: account_id,
          sourceRows: Array.isArray((direct as any)?.source_rows)
            ? (direct as any).source_rows
            : undefined,
        });
        const { source_rows, ...directPublic } = direct as any;

        return new Response(
          JSON.stringify({
            ...directPublic,
            mode: "direct",
            customer_provision: customerProvision,
            imported_universal: directPublic.imported,
          }),
          {
            status: 200,
            headers: { "Content-Type": "application/json" },
          },
        );
      } catch (directError: any) {
        console.warn("[sync-orders] direct Sellercloud sync failed, falling back to edge", {
          message: directError?.message,
        });
      }
    }

    const edgeResponse = await fetch(syncUrls[source], {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...(anonKey ? { apikey: anonKey } : {}),
        ...(bearer ? { Authorization: `Bearer ${bearer}` } : {}),
      },
      body: JSON.stringify({
        account_id: effectiveAccountId,
        accountId: effectiveAccountId,
        fromDate,
        toDate,
        from_date: fromDate,
        to_date: toDate,
        requested_by_account_id: account_id,
      }),
    });

    const edgeRaw = await edgeResponse.text();
    const edgeResult = safeJsonParse(edgeRaw);
    const edgeSucceeded = edgeResponse.ok && edgeResult?.success !== false;
    console.log("593", edgeSucceeded);

    if (edgeSucceeded) {
      const normalized = await syncUniversalFromSourceTables({
        admin,
        source,
        effectiveAccountId,
        requestedAccountId: account_id,
        fromDate,
        toDate,
      });

      let customerProvision: Awaited<
        ReturnType<typeof createSellercloudCustomerLogins>
      > | null = null;

      if (source === "sellercloud") {
        customerProvision = await createSellercloudCustomerLogins({
          admin,
          accountId: effectiveAccountId,
          inviteAccountId: account_id,
          sourceRows: normalized.sourceRows,
        });
      }

      const basePayload =
        edgeResult ?? {
          success: true,
          message: "Sync completed with empty response body",
        };

      return new Response(
        JSON.stringify({
          ...basePayload,
          imported_universal: normalized.importedCount,
          ...(customerProvision
            ? { customer_provision: customerProvision }
            : {}),
        }),
        {
          status: edgeResponse.status,
          headers: { "Content-Type": "application/json" },
        },
      );
    }

    if (source === "sellercloud") {
      try {
        const fallback = await tryDirectSellercloudFallback({
          admin,
          effectiveAccountId,
          requestedAccountId: account_id,
          fromDate,
          toDate,
        });
        const customerProvision = await createSellercloudCustomerLogins({
          admin,
          accountId: effectiveAccountId,
          inviteAccountId: account_id,
          sourceRows: Array.isArray((fallback as any)?.source_rows)
            ? (fallback as any).source_rows
            : undefined,
        });
        const { source_rows, ...fallbackPublic } = fallback as any;

        return new Response(
          JSON.stringify({
            ...fallbackPublic,
            customer_provision: customerProvision,
            imported_universal: fallbackPublic.imported,
            fallback_warning:
              edgeResult?.error ||
              (edgeRaw ? edgeRaw.substring(0, 500) : null) ||
              `Sync function failed (${edgeResponse.status})`,
          }),
          {
            status: 200,
            headers: { "Content-Type": "application/json" },
          },
        );
      } catch (fallbackError: any) {
        const errorMessage =
          fallbackError?.message ||
          edgeResult?.error ||
          edgeResult?.message ||
          `Sync function failed (${edgeResponse.status})`;

        return new Response(
          JSON.stringify({
            success: false,
            error: errorMessage,
            details: edgeRaw ? edgeRaw.substring(0, 500) : null,
            fallback_error:
              fallbackError?.message || "Sellercloud direct fallback failed",
          }),
          {
            status: edgeResponse.status >= 400 ? edgeResponse.status : 500,
            headers: { "Content-Type": "application/json" },
          },
        );
      }
    }

    return new Response(
      JSON.stringify({
        success: false,
        error:
          edgeResult?.error ||
          edgeResult?.message ||
          `Sync function failed (${edgeResponse.status})`,
        details: edgeRaw ? edgeRaw.substring(0, 500) : null,
      }),
      {
        status: edgeResponse.status >= 400 ? edgeResponse.status : 500,
        headers: { "Content-Type": "application/json" },
      },
    );
  } catch (error: any) {
    console.error("Sync error:", error);
    return new Response(
      JSON.stringify({
        success: false,
        error: error?.message || "Internal server error",
        errorType: error?.constructor?.name || "Unknown",
      }),
      {
        status: 500,
        headers: { "Content-Type": "application/json" },
      },
    );
  }
}
