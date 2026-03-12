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

type ExtensivCredentials = {
  client_id: string;
  client_secret: string;
  extensiv_id: string;
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

function parseExtensivCredentials(raw: unknown): ExtensivCredentials | null {
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

  const creds: ExtensivCredentials = {
    client_id: String((parsed as any).client_id ?? "").trim(),
    client_secret: String((parsed as any).client_secret ?? "").trim(),
    extensiv_id: String(
      (parsed as any).extensiv_id ?? (parsed as any).user_login ?? "",
    ).trim(),
  };

  if (!creds.client_id || !creds.client_secret || !creds.extensiv_id)
    return null;
  return creds;
}

function getPath(obj: any, path: (string | number)[]): any {
  return path.reduce<any>((acc, key) => {
    if (acc && typeof acc === "object" && key in acc) return (acc as any)[key];
    return undefined;
  }, obj);
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
  return String(value || "")
    .trim()
    .toLowerCase();
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
    const clientAccountId = String(
      (billing as any)?.client_account_id || "",
    ).trim();
    if (!clientAccountId) continue;
    if (!accountIds.includes(clientAccountId)) accountIds.push(clientAccountId);

    const wms = normalizeText((billing as any)?.wms_customer_id);
    if (wms && !billingByWmsId.has(wms))
      billingByWmsId.set(wms, clientAccountId);

    const name = normalizeText((billing as any)?.name);
    if (name && !billingByName.has(name))
      billingByName.set(name, clientAccountId);
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
        const candidateEmail = normalizeText(
          (clientById.get(clientId) as any)?.email,
        );
        if (candidateEmail === email) return clientId;
      }
    }

    for (const name of names) {
      if (!name) continue;
      for (const clientId of candidates) {
        const candidateName = normalizeText(
          (clientById.get(clientId) as any)?.name,
        );
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
        pick(
          metadata,
          ["FirstName", "ShippingAddressFirstName", "BillingAddressFirstName"],
          "",
        ),
      );
      const last = normalizeText(
        pick(
          metadata,
          ["LastName", "ShippingAddressLastName", "BillingAddressLastName"],
          "",
        ),
      );
      const fullName = `${first} ${last}`.trim();
      const clientName = normalizeText(row?.client_name);
      if (fullName && byName.has(fullName)) return byName.get(fullName) || null;
      if (clientName && byName.has(clientName))
        return byName.get(clientName) || null;

      const company = normalizeText(
        pick(metadata, ["CompanyName", "company_name"], row?.client_name),
      );

      const names = [fullName, clientName, company].filter(Boolean);
      const mappedAccountId =
        (wmsId && billingByWmsId.get(wmsId)) ||
        (company && billingByName.get(company)) ||
        "";

      if (mappedAccountId) {
        const fromMappedAccount = pickClientFromAccount(
          mappedAccountId,
          names,
          email,
        );
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

async function getExtensivToken(
  credentials: ExtensivCredentials,
): Promise<string> {
  const tokenUrl = "https://secure-wms.com/AuthServer/api/Token";
  const basic = Buffer.from(
    `${credentials.client_id}:${credentials.client_secret}`,
  ).toString("base64");

  const payload = {
    grant_type: "client_credentials",
    user_login: credentials.extensiv_id,
  };

  const formResponse = await fetch(tokenUrl, {
    method: "POST",
    headers: {
      Accept: "application/json",
      "Content-Type": "application/json",
      Authorization: `Basic ${basic}`,
    },
    body: JSON.stringify(payload),
  });

  const formText = await formResponse.text();
  const json = safeJsonParse(formText);

  if (formResponse.ok && (json?.access_token || json?.token)) {
    return String(json.access_token || json.token);
  }

  throw new Error(
    String(
      json?.error_description ||
        json?.error ||
        json?.message ||
        formText ||
        `Extensiv token request failed (${formResponse.status})`,
    ),
  );
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

function extractExtensivOrdersFromPayload(payload: any): any[] {
  if (Array.isArray(payload)) return payload;
  if (!payload || typeof payload !== "object") return [];

  const embedded = (payload as any)._embedded || {};
  const preferredKeys = [
    "http://api.3plcentral.com/rels/orders/order",
    "http://api.3plCentral.com/rels/orders/order",
    // Some responses expose order details (with itemdetail=All) under a
    // slightly different rel; prefer those before falling back to the first
    // array we can find so we always return actual orders.
    "http://api.3plcentral.com/rels/orders/orderdetail",
    "http://api.3plCentral.com/rels/orders/orderdetail",
    "orders",
  ];

  for (const key of preferredKeys) {
    if (Array.isArray(embedded?.[key])) return embedded[key];
  }

  return extractArray(payload);
}

async function fetchExtensivOrderItemsById(
  token: string,
  orderId: string,
): Promise<any[]> {
  if (!orderId) return [];
  const url = `${EXTENSIV_BASE_URL}/orders/${orderId}/items?detail=All`;

  const res = await fetch(url, {
    method: "GET",
    headers: {
      Accept: "application/hal+json",
      Authorization: `Bearer ${token}`,
    },
  });

  const raw = await res.text();
  const json = safeJsonParse(raw);
  if (!res.ok || !json) {
    console.warn("[extensiv] items fetch failed", {
      orderId,
      status: res.status,
    });
    return [];
  }

  return extractExtensivItems(json);
}

function calculateExtensivItemsTotal(items: any[]): number | null {
  if (!Array.isArray(items) || !items.length) return null;
  const total = items.reduce((sum, item) => {
    const qty =
      toNumber(
        getPath(item, ["quantity", "ordered"]) ||
          (item as any)?.quantity ||
          (item as any)?.qty,
      ) || 0;
    const price =
      toNumber(pick(item, ["price", "Price", "unitPrice", "unit_price"], 0)) ||
      0;
    const extended =
      toNumber(
        pick(
          item,
          ["extendedPrice", "total_price", "line_total", "lineTotal"],
          null,
        ),
      ) ?? qty * price;

    const line = Number.isFinite(extended) ? extended : qty * price;
    return sum + (Number.isFinite(line) ? line : 0);
  }, 0);

  return Number.isFinite(total) ? total : null;
}

const EXTENSIV_BASE_URL = "https://secure-wms.com";

async function fetchExtensivOrders(
  credentials: ExtensivCredentials,
  options: { customerId?: string; fromDate?: string; toDate?: string } = {},
  authToken?: string,
): Promise<any[]> {
  const token = authToken || (await getExtensivToken(credentials));
  const baseUrl = EXTENSIV_BASE_URL;
  const pageSize = 100;
  const maxPages = 20;
  const results: any[] = [];

  for (let page = 1; page <= maxPages; page++) {
    const params = new URLSearchParams({
      pgsiz: String(pageSize),
      pgnum: String(page),
      detail: "All", // include order-level children (addresses, notes, etc.)
      itemdetail: "All", // include order line details
      sort: "readOnly.lastModifiedDate",
    });

    const rqlFilters: string[] = [];
    if (options.customerId) {
      rqlFilters.push(`customerIdentifier.id==${options.customerId}`);
    }
    if (options.fromDate) {
      rqlFilters.push(`readOnly.lastModifiedDate=ge=${options.fromDate}`);
      params.append("lastModifiedDate", `ge=${options.fromDate}`);
    }
    if (options.toDate) {
      rqlFilters.push(`readOnly.lastModifiedDate=le=${options.toDate}`);
      params.append("lastModifiedDate", `le=${options.toDate}`);
    }
    if (rqlFilters.length) {
      params.append("rql", rqlFilters.join(";"));
    }

    const url = `${baseUrl}/orders?${params.toString()}`;
    const res = await fetch(url, {
      method: "GET",
      headers: {
        Accept: "application/hal+json",
        "Content-Type": "application/hal+json; charset=utf-8",
        Authorization: `Bearer ${token}`,
      },
    });

    const raw = await res.text();
    const json = safeJsonParse(raw);
    console.log("[extensiv] page fetch", {
      page,
      url,
      status: res.status,
      ok: res.ok,
      hasEmbedded: Boolean((json as any)?._embedded),
      embeddedKeys: Object.keys((json as any)?._embedded || {}),
      error: (json as any)?.error || (json as any)?.message,
    });

    if (!res.ok || !json) {
      throw new Error(
        String(
          (json as any)?.error ||
            (json as any)?.message ||
            raw ||
            `Extensiv orders request failed (${res.status})`,
        ),
      );
    }

    const pageRows = extractExtensivOrdersFromPayload(json);
    console.log("pageRows", pageRows);

    results.push(...pageRows);

    if (!pageRows.length) {
      console.warn("[extensiv] empty page", {
        page,
        url,
        keys: Object.keys(json || {}),
        embeddedKeys: Object.keys((json as any)?._embedded || {}),
      });
    }

    const nextHref = (json as any)?._links?.next?.href;
    if (!nextHref && pageRows.length < pageSize) break;
  }

  return results.filter((row) => {
    const lastMod =
      toDateOnly(getPath(row, ["readOnly", "lastModifiedDate"])) ||
      toDateOnly((row as any)?.lastModifiedDate) ||
      toDateOnly((row as any)?.creationDate);
    return inDateRange(lastMod, options.fromDate, options.toDate);
  });
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
    shipping_status:
      String(pick(row, ["ShippingStatus", "shipping_status"], "")).trim() ||
      null,
    payment_status:
      String(pick(row, ["PaymentStatus", "payment_status"], "")).trim() || null,
    order_status: normalizeSellercloudStatus(row),
    source:
      String(pick(row, ["Source", "source"], ""))
        .trim()
        .toLowerCase() || "sellercloud",
    marketplace_name:
      String(
        pick(
          row,
          ["MarketplaceName", "ChannelName", "marketplace_name", "Marketplace"],
          "",
        ),
      ).trim() || null,
    marketplace_code:
      String(pick(row, ["MarketplaceCode", "marketplace_code"], "")).trim() ||
      null,
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
        pick(
          item,
          ["UnitPrice", "SitePrice", "Price", "price", "unit_price"],
          0,
        ),
      ) ?? 0;
    const totalPrice =
      toNumber(
        pick(
          item,
          ["TotalPrice", "LineTotal", "LineTotalPrice", "total_price"],
          null,
        ),
      ) ?? unitPrice * quantity;

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

  // Derive total from items when present.
  const rawData =
    row?.raw_data && typeof row.raw_data === "object" ? row.raw_data : {};
  const itemList = extractExtensivItems(rawData);
  const chargeList = extractExtensivCharges(rawData);
  const metadataPayload =
    rawData && typeof rawData === "object"
      ? { ...rawData, Items: itemList, Charges: chargeList }
      : row;

  const chargesTotal =
    chargeList.length > 0
      ? chargeList.reduce((sum: number, charge: any) => {
          const amount =
            toNumber(
              pick(charge, ["amount", "Amount", "chargeAmount", "total"], 0),
            ) || 0;
          return sum + (Number.isFinite(amount) ? amount : 0);
        }, 0)
      : 0;

  const derivedTotal =
    itemList.length > 0
      ? itemList.reduce((sum: number, item: any) => {
          const qty =
            toNumber(
              getPath(item, ["quantity", "ordered"]) ||
                (item as any)?.quantity ||
                (item as any)?.qty ||
                (item as any)?.quantityOrdered,
            ) || 0;
          const unit =
            toNumber(
              pick(item, ["unit_price", "unitPrice", "price", "UnitPrice"], 0),
            ) || 0;
          const line =
            toNumber(
              pick(item, ["total_price", "line_total", "lineTotal"], null),
            ) ?? unit * qty;
          return sum + (Number.isFinite(line) ? line : 0);
        }, 0)
      : null;

  return {
    order_uuid: orderUuid,
    account_id: effectiveAccountId,
    channel_account_id: requestedAccountId,
    order_id: orderId,
    order_source_order_id: orderSourceId,
    client_name: String(row?.customer_name || "").trim() || null,
    grand_total:
      derivedTotal !== null
        ? derivedTotal + chargesTotal
        : chargesTotal || null,
    order_date: toDateOnly(row?.creation_date || row?.process_date),
    status_code: toNumber(row?.status),
    shipping_status: null,
    payment_status: null,
    order_status: statusText,
    source: "extensiv",
    marketplace_name: String(row?.facility_name || "extensiv").trim(),
    marketplace_code: String(row?.facility_external_id || "").trim() || null,
    metadata: metadataPayload,
  };
}

function mapExtensivOrderItems(row: any, orderUuid: string) {
  const rawData =
    row?.raw_data && typeof row.raw_data === "object" ? row.raw_data : {};
  const sourceItems = extractExtensivItems(rawData);

  return sourceItems.map((item: any, idx: number) => {
    const sku = String(
      pick(item, ["sku", "SKU", "product_sku", "productSku"], "") ||
        getPath(item, ["itemIdentifier", "sku"]) ||
        getPath(item, ["itemIdentifier", "id"]),
    ).trim();
    const quantity = toNumber(pick(item, ["quantity", "qty", "Qty"], 0)) ?? 0;
    const unitPrice =
      toNumber(pick(item, ["unit_price", "unitPrice", "price"], 0)) ?? 0;
    const totalPrice =
      toNumber(
        pick(
          item,
          [
            "total_price",
            "line_total",
            "lineTotal",
            "line_total_price",
            "extendedPrice",
          ],
          null,
        ),
      ) ?? unitPrice * quantity;

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

function mapExtensivApiOrderToDbRow(
  row: any,
  effectiveAccountId: string,
  requestedAccountId: string,
) {
  const externalId =
    String(
      getPath(row, ["orderIdentifier", "orderId"]) ||
        getPath(row, ["orderIdentifier", "id"]) ||
        getPath(row, ["readOnly", "orderId"]) ||
        (row as any)?.orderId ||
        (row as any)?.id ||
        (row as any)?.external_id ||
        "",
    ).trim() || null;

  if (!externalId) return null;

  const orderNumber =
    String(
      (row as any)?.orderNumber ||
        getPath(row, ["orderIdentifier", "orderNumber"]) ||
        (row as any)?.referenceNum ||
        getPath(row, ["readOnly", "referenceNum"]) ||
        (row as any)?.customerPO ||
        (row as any)?.referenceNum ||
        (row as any)?.external_id ||
        "",
    ).trim() || null;

  const creationDate =
    toDateOnly((row as any)?.creationDate) ||
    toDateOnly(getPath(row, ["readOnly", "creationDate"])) ||
    toDateOnly(getPath(row, ["readOnly", "createdDate"])) ||
    toDateOnly((row as any)?.orderDate) ||
    null;

  const processDate =
    toDateOnly((row as any)?.processDate) ||
    toDateOnly(getPath(row, ["readOnly", "processDate"])) ||
    toDateOnly(getPath(row, ["readOnly", "processDate"])) ||
    null;

  const statusCode =
    toNumber((row as any)?.status) ||
    toNumber(getPath(row, ["readOnly", "status"])) ||
    toNumber(getPath(row, ["readOnly", "statusId"]));

  const statusClosed = Boolean(
    (row as any)?.statusClosed ?? getPath(row, ["readOnly", "isClosed"]),
  );

  const fullyAllocated = Boolean(
    (row as any)?.statusFullyAllocated ??
      (row as any)?.isFullyAllocated ??
      getPath(row, ["readOnly", "isFullyAllocated"]) ??
      getPath(row, ["readOnly", "fullyAllocated"]),
  );

  return {
    account_id: effectiveAccountId,
    account_id_channel: requestedAccountId,
    external_id: externalId,
    order_number: orderNumber,
    customer_name:
      String(
        (row as any)?.customerName ||
          getPath(row, ["customerIdentifier", "name"]) ||
          getPath(row, ["readOnly", "customerIdentifier", "name"]) ||
          "",
      ).trim() || null,
    customer_external_id:
      String(
        getPath(row, ["customerIdentifier", "id"]) ||
          getPath(row, ["readOnly", "customerIdentifier", "id"]) ||
          "",
      ).trim() || null,
    facility_external_id:
      String(
        getPath(row, ["facilityIdentifier", "id"]) ||
          getPath(row, ["readOnly", "facilityIdentifier", "id"]) ||
          "",
      ).trim() || null,
    facility_name:
      String(
        getPath(row, ["facilityIdentifier", "name"]) ||
          getPath(row, ["readOnly", "facilityIdentifier", "name"]) ||
          "",
      ).trim() || null,
    creation_date: creationDate,
    process_date: processDate,
    last_modified_date:
      toDateOnly(getPath(row, ["readOnly", "lastModifiedDate"])) ||
      toDateOnly((row as any)?.lastModifiedDate) ||
      null,
    status: statusCode,
    status_closed: statusClosed,
    status_fully_allocated: fullyAllocated,
    tracking_number:
      String(
        getPath(row, ["readOnly", "trackingNumber"]) ||
          (row as any)?.trackingNumber ||
          "",
      ).trim() || null,
    source: "extensiv",
    raw_data: row,
  };
}

function extractExtensivItems(row: any): any[] {
  if (Array.isArray((row as any)?.Items)) return (row as any).Items;
  if (Array.isArray((row as any)?.orderItems)) return (row as any).orderItems;

  const embedded = (row as any)?._embedded || {};
  const preferredKeys = [
    "http://api.3plcentral.com/rels/orders/item",
    "http://api.3plCentral.com/rels/orders/item",
    "http://api.3plcentral.com/rels/orders/item",
    "http://api.3plCentral.com/rels/orders/item",
    "http://api.3plcentral.com/rels/orders/itemdetail",
    "http://api.3plCentral.com/rels/orders/itemdetail",
    "items",
    "itemdetails",
    "itemDetails",
    "orderItems",
  ];

  for (const key of preferredKeys) {
    if (Array.isArray((embedded as any)?.[key])) return (embedded as any)[key];
  }

  const embeddedArray = Object.values(embedded).find(Array.isArray);
  if (embeddedArray && Array.isArray(embeddedArray)) return embeddedArray;

  return [];
}

function extractExtensivCharges(row: any): any[] {
  if (Array.isArray((row as any)?.charges)) return (row as any).charges;
  if (Array.isArray((row as any)?.Charges)) return (row as any).Charges;
  if (Array.isArray((row as any)?.orderCharges))
    return (row as any).orderCharges;

  const embedded = (row as any)?._embedded || {};
  const preferredKeys = [
    "http://api.3plcentral.com/rels/orders/charge",
    "http://api.3plCentral.com/rels/orders/charge",
    "charges",
    "orderCharges",
  ];

  for (const key of preferredKeys) {
    if (Array.isArray((embedded as any)?.[key])) return (embedded as any)[key];
  }

  const embeddedArray = Object.entries(embedded).find(([key, val]) => {
    return (
      typeof key === "string" &&
      key.toLowerCase().includes("charge") &&
      Array.isArray(val)
    );
  });
  if (embeddedArray && Array.isArray(embeddedArray[1])) return embeddedArray[1];

  return [];
}

function mapExtensivApiItems(
  row: any,
  orderId: number | null,
  orderExternalId?: string | null,
) {
  const items = extractExtensivItems(row);
  if (!items.length || !orderId) return [] as any[];

  return items.map((item: any, idx: number) => {
    const externalId = String(
      (item as any)?.orderItemId ||
        (item as any)?.id ||
        (item as any)?.order_item_id ||
        `${orderExternalId || "ext"}-${idx}`,
    ).trim();

    return {
      order_id: orderId,
      external_id: externalId,
      sku:
        String(
          getPath(item, ["itemIdentifier", "sku"]) ||
            (item as any)?.sku ||
            (item as any)?.itemSku ||
            "",
        ).trim() || null,
      sku_external_id:
        String(
          getPath(item, ["itemIdentifier", "id"]) ||
            (item as any)?.itemId ||
            "",
        ).trim() || null,
      qty:
        toNumber(
          getPath(item, ["quantity", "ordered"]) ||
            (item as any)?.quantity ||
            (item as any)?.qty ||
            (item as any)?.quantityOrdered,
        ) || 0,
      fully_allocated: Boolean(
        (item as any)?.fullyAllocated ??
          (item as any)?.isFullyAllocated ??
          getPath(item, ["status", "fullyAllocated"]),
      ),
      raw_data: item,
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
    const orderNumberRaw =
      row?.order_id || row?.order_source_order_id || row?.order_uuid;
    const orderNumber = orderNumberRaw ? String(orderNumberRaw) : null;
    const orderDate = row?.order_date ? String(row.order_date) : null;
    const createdAt =
      orderDate && !Number.isNaN(new Date(orderDate).getTime())
        ? orderDate
        : new Date().toISOString();
    return {
      id: String(
        row?.order_uuid ||
          uuidv5(
            `${row?.account_id}:${orderNumber || Math.random()}`,
            ORDER_UUID_NAMESPACE,
          ),
      ),
      account_id: row?.account_id || null,
      client_id: matcher.resolve(row),
      order_number: orderNumber,
      order_source_order_id: row?.order_source_order_id || null,
      client_name: row?.client_name || null,
      marketplace_name: row?.marketplace_name || null,
      origin: row?.source ? String(row.source) : null,
      status: row?.order_status ? String(row.order_status) : null,
      payment_status: row?.payment_status ? String(row.payment_status) : null,
      shipping_status: row?.shipping_status
        ? String(row.shipping_status)
        : null,
      total:
        row?.grand_total !== null && row?.grand_total !== undefined
          ? Number(row.grand_total)
          : null,
      created_at: createdAt,
      metadata:
        row?.metadata && typeof row.metadata === "object" ? row.metadata : null,
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
      throw new Error(
        `Failed to save universal orders: ${upsertError.message}`,
      );
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
      throw new Error(
        `Failed to save universal orders: ${minimalError.message}`,
      );
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
      const errorText = String(
        error.message || error.details || error.hint || "",
      ).toLowerCase();
      // Keep order sync resilient while migration is being applied.
      if (
        errorText.includes('relation "order_items" does not exist') ||
        errorText.includes("schema cache") ||
        errorText.includes("could not find") ||
        errorText.includes("column")
      ) {
        console.warn(
          "[sync-orders] order_items schema not ready, skipping line items",
        );
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

async function upsertExtensivOrders(
  admin: ReturnType<typeof createClient>,
  rows: any[],
) {
  if (!rows.length)
    return { savedCount: 0, orderIdByExternal: new Map<string, number>() };

  // Ensure we don't send transient fields (e.g., grand_total, metadata) that
  // aren't present in the extensing_orders schema. Missing columns trigger
  // a schema cache error in Supabase.
  const sanitizedRows = rows.map((row) => {
    const { grand_total, metadata, order_uuid, ...rest } = row || {};
    return rest;
  });

  const chunkSize = 300;
  const orderIdByExternal = new Map<string, number>();
  let savedCount = 0;

  const accountId = String(rows[0]?.account_id || "").trim() || null;
  if (accountId) {
    await admin.from("extensiv_orders").delete().eq("account_id", accountId);
  }

  for (let i = 0; i < sanitizedRows.length; i += chunkSize) {
    const chunk = sanitizedRows.slice(i, i + chunkSize);
    const { data, error } = await admin
      .from("extensiv_orders")
      .insert(chunk)
      .select("id, external_id");

    if (error) {
      throw new Error(`Failed to save Extensiv orders: ${error.message}`);
    }

    (data || []).forEach((row: any) => {
      if (row?.external_id && row?.id !== undefined && row?.id !== null) {
        orderIdByExternal.set(String(row.external_id), Number(row.id));
      }
    });

    savedCount += data?.length ?? chunk.length;
  }

  return { savedCount, orderIdByExternal };
}

async function upsertExtensivOrderItems(
  admin: ReturnType<typeof createClient>,
  rows: any[],
) {
  if (!rows.length) return;
  const chunkSize = 500;

  for (let i = 0; i < rows.length; i += chunkSize) {
    const chunk = rows.slice(i, i + chunkSize);
    const { error } = await admin
      .from("extensiv_order_items")
      .upsert(chunk, { onConflict: "external_id" });

    if (error) {
      const lower = String(error.message || "").toLowerCase();
      const schemaPending =
        lower.includes("does not exist") ||
        lower.includes("schema cache") ||
        lower.includes("relation") ||
        lower.includes("column");

      const missingConstraint =
        lower.includes("no unique or exclusion constraint") ||
        lower.includes("no unique constraint");

      if (schemaPending) {
        console.warn(
          "[sync-orders] extensiv_order_items schema not ready, skipping lines",
        );
        return;
      }

      if (missingConstraint) {
        // Fallback: insert rows individually to avoid unique constraint requirement.
        for (const row of chunk) {
          try {
            await admin.from("extensiv_order_items").insert(row);
          } catch (innerError: any) {
            const dup = String(innerError?.message || "").toLowerCase();
            const isDuplicate =
              dup.includes("duplicate key") ||
              dup.includes("unique constraint");
            if (!isDuplicate) {
              console.warn("[sync-orders] insert item failed (fallback)", {
                message: innerError?.message,
              });
            }
          }
        }
        continue;
      }

      console.warn("[sync-orders] failed to upsert extensiv items chunk", {
        message: error.message,
        details: (error as any).details,
        hint: (error as any).hint,
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
  const {
    admin,
    source,
    effectiveAccountId,
    requestedAccountId,
    fromDate,
    toDate,
  } = params;

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
    throw new Error(
      `Failed loading Extensiv orders for normalize: ${error.message}`,
    );
  }

  const rows = (data || []).map((row: any) =>
    mapExtensivOrderToUnifiedRow(row, effectiveAccountId, requestedAccountId),
  );
  const itemRows = (data || []).flatMap((row: any, idx: number) => {
    const orderUuid = rows[idx]?.order_uuid;
    if (!orderUuid) return [];
    return mapExtensivOrderItems(row, String(orderUuid));
  });

  // If totals are missing, derive them from the mapped item rows grouped by order_uuid.
  if (itemRows.length) {
    const totalsByOrder = new Map<string, number>();
    const itemsByOrder = new Map<string, any[]>();
    for (const item of itemRows) {
      const orderId = String(item.order_id || "");
      if (!orderId) continue;
      const list = itemsByOrder.get(orderId) || [];
      list.push(item);
      itemsByOrder.set(orderId, list);

      const lineTotal =
        toNumber(item.total_price) ??
        (toNumber(item.unit_price) || 0) * (toNumber(item.quantity) || 0);
      const prev = totalsByOrder.get(orderId) || 0;
      totalsByOrder.set(
        orderId,
        prev + (Number.isFinite(lineTotal) ? lineTotal : 0),
      );
    }
    for (const row of rows) {
      if (!row?.order_uuid) continue;
      if (row.grand_total === null || row.grand_total === undefined) {
        const derived = totalsByOrder.get(String(row.order_uuid));
        if (derived !== undefined) row.grand_total = derived;
      }
      const metaObj =
        row.metadata && typeof row.metadata === "object" ? row.metadata : {};
      if (
        !Array.isArray((metaObj as any).Items) ||
        !(metaObj as any).Items.length
      ) {
        const items = itemsByOrder.get(String(row.order_uuid));
        if (items && items.length) {
          row.metadata = { ...metaObj, Items: items };
        }
      }
    }
  }

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
    message:
      "Imported into universal orders table using direct Sellercloud fallback",
  };
}

async function directExtensivSync(params: {
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
    .eq("type", "extensiv")
    .in("account_id", [effectiveAccountId, requestedAccountId]);

  if (integrationError) {
    throw new Error(
      `Failed to load Extensiv integration: ${integrationError.message}`,
    );
  }

  const integration =
    integrationRows?.find((r) => r.account_id === effectiveAccountId) ||
    integrationRows?.find((r) => r.account_id === requestedAccountId) ||
    integrationRows?.[0] ||
    null;

  const credentials = parseExtensivCredentials(integration?.credentials);
  if (!credentials) {
    throw new Error("Extensiv integration credentials are missing or invalid");
  }

  const token = await getExtensivToken(credentials);

  const { data: accountRow } = await admin
    .from("accounts")
    .select("extensiv_customer_id")
    .eq("id", effectiveAccountId)
    .maybeSingle();

  const customerId =
    String((accountRow as any)?.extensiv_customer_id || "").trim() || undefined;

  const fetched = await fetchExtensivOrders(
    credentials,
    {
      customerId,
      fromDate,
      toDate,
    },
    token,
  );
  // console.log("fetched...", fetched);

  if (!fetched.length) {
    return {
      success: true,
      imported: 0,
      source_rows: [] as any[],
      message: "No Extensiv orders returned",
    };
  }

  const unifiedRows: any[] = [];
  const itemRows: any[] = [];

  for (const raw of fetched) {
    const extRow = mapExtensivApiOrderToDbRow(
      raw,
      effectiveAccountId,
      requestedAccountId,
    );
    // console.log("extRow", extRow);

    if (!extRow) continue;

    // Always fetch dedicated items endpoint to ensure we have line-level detail.
    let itemsPayload: any[] = [];
    if (extRow.external_id) {
      itemsPayload = await fetchExtensivOrderItemsById(
        token,
        String(extRow.external_id),
      );
    }
    console.log("itemsPayload", itemsPayload);

    // If the list call already contained items, merge them as a fallback.
    if (!itemsPayload.length) {
      itemsPayload = extractExtensivItems(raw);
    }

    if (itemsPayload.length) {
      extRow.raw_data = { ...(extRow.raw_data || raw), Items: itemsPayload };
      const fallbackTotal = calculateExtensivItemsTotal(itemsPayload);
      if (fallbackTotal !== null && (extRow as any).grand_total === undefined) {
        (extRow as any).grand_total = fallbackTotal;
      }
    }

    const unified = mapExtensivOrderToUnifiedRow(
      extRow,
      effectiveAccountId,
      requestedAccountId,
    );
    unifiedRows.push(unified);

    const orderUuid = unified.order_uuid;
    if (orderUuid) {
      const lineItems = mapExtensivOrderItems(extRow, String(orderUuid));
      if (lineItems?.length) itemRows.push(...lineItems);
    }
  }

  await upsertUniversalOrders(admin, unifiedRows);
  await upsertOrderItems(admin, itemRows);

  const now = new Date().toISOString();
  await admin
    .from("account_integrations")
    .update({ last_synced_at: now, status: "active" })
    .eq("type", "extensiv")
    .in("account_id", [effectiveAccountId, requestedAccountId]);

  return {
    success: true,
    imported: unifiedRows.length,
    imported_universal: unifiedRows.length,
    source_rows: fetched,
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
        console.warn(
          "[sync-orders] direct Sellercloud sync failed, falling back to edge",
          {
            message: directError?.message,
          },
        );
      }
    }

    if (source === "extensiv") {
      try {
        const direct = await directExtensivSync({
          admin,
          effectiveAccountId,
          requestedAccountId: account_id,
          fromDate,
          toDate,
        });
        // console.log("direct.....", direct);

        const { source_rows, ...publicDirect } = direct as any;

        return new Response(
          JSON.stringify({
            ...publicDirect,
            mode: "direct",
            imported_universal:
              publicDirect.imported_universal ?? publicDirect.imported,
          }),
          {
            status: 200,
            headers: { "Content-Type": "application/json" },
          },
        );
      } catch (directError: any) {
        console.warn(
          "[sync-orders] direct Extensiv sync failed, falling back to edge",
          {
            message: directError?.message,
          },
        );
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

      const basePayload = edgeResult ?? {
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
