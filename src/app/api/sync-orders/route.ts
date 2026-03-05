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

function mapOrderRow(
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
  const id = uuidv5(stableNaturalKey, ORDER_UUID_NAMESPACE);

  return {
    id,
    account_id: effectiveAccountId,
    channel_account_id: requestedAccountId,
    external_id: externalId,
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
    shipping_status: toNumber(pick(row, ["ShippingStatus", "shipping_status"])),
    payment_status: toNumber(pick(row, ["PaymentStatus", "payment_status"])),
    sellercloud_customer_id: pick(
      row,
      ["CustomerID", "SellercloudCustomerID", "sellercloud_customer_id"],
      null,
    ),
    sellercloud_user_id: toNumber(
      pick(row, ["SellercloudUserID", "sellercloud_user_id", "UserID"]),
    ),
    metadata: row,
  };
}

function mapOrderItemRows(row: any, orderUuid: string) {
  const sourceItems = Array.isArray(row?.Items) ? row.Items : [];
  return sourceItems.map((item: any, idx: number) => {
    const quantity =
      toNumber(pick(item, ["Qty", "Quantity", "quantity", "qty"], 0)) ?? 0;
    const unitPrice =
      toNumber(pick(item, ["UnitPrice", "Price", "price", "unit_price"], 0)) ??
      0;
    const totalPrice =
      toNumber(pick(item, ["TotalPrice", "LineTotal", "total_price"], null)) ??
      unitPrice * quantity;
    const sku = String(
      pick(item, ["SKU", "Sku", "ProductID", "ProductId", "sku"], ""),
    ).trim();

    const naturalKey = `${orderUuid}:${sku || "item"}:${idx}`;
    const id = uuidv5(naturalKey, ORDER_ITEM_UUID_NAMESPACE);

    return {
      id,
      order_uuid: orderUuid,
      sku: sku || null,
      quantity,
      unit_price: unitPrice,
      total_price: totalPrice,
      metadata: item,
    };
  });
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
      mode: "fallback_direct",
      message: "No orders found in Sellercloud",
    };
  }
  console.log("fetched", fetched);

  const rows = fetched.map((row, idx) =>
    mapOrderRow(row, idx, effectiveAccountId, requestedAccountId),
  );
  const itemRows = fetched.flatMap((row: any, idx: number) =>
    mapOrderItemRows(row, rows[idx].id),
  );

  const chunkSize = 500;
  for (let i = 0; i < rows.length; i += chunkSize) {
    const chunk = rows.slice(i, i + chunkSize);
    const { error: upsertError } = await admin
      .from("sellercloud_orders")
      .upsert(chunk, { onConflict: "id" });

    if (upsertError) {
      throw new Error(
        `Failed to save Sellercloud orders: ${upsertError.message}`,
      );
    }
  }

  for (let i = 0; i < itemRows.length; i += chunkSize) {
    const chunk = itemRows.slice(i, i + chunkSize);
    const { error: upsertItemsError } = await admin
      .from("sellercloud_order_items")
      .upsert(chunk, { onConflict: "id" });

    if (upsertItemsError) {
      throw new Error(
        `Failed to save Sellercloud order items: ${upsertItemsError.message}`,
      );
    }
  }

  const now = new Date().toISOString();
  await admin
    .from("account_integrations")
    .update({ last_synced_at: now, status: "active" })
    .eq("type", "sellercloud")
    .in("account_id", [effectiveAccountId, requestedAccountId]);

  return {
    success: true,
    imported: rows.length,
    imported_items: itemRows.length,
    mode: "fallback_direct",
    message: "Imported using direct Sellercloud fallback",
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
    const edgeSucceeded = false; //edgeResponse.ok && edgeResult?.success !== false;
    console.log("593", edgeSucceeded);

    if (edgeSucceeded) {
      let customerProvision: Awaited<
        ReturnType<typeof createSellercloudCustomerLogins>
      > | null = null;

      if (source === "sellercloud") {
        customerProvision = await createSellercloudCustomerLogins({
          admin,
          accountId: effectiveAccountId,
          inviteAccountId: account_id,
        });
      }

      return new Response(
        JSON.stringify(
          customerProvision
            ? {
                ...(edgeResult ?? {
                  success: true,
                  message: "Sync completed with empty response body",
                }),
                customer_provision: customerProvision,
              }
            : (edgeResult ?? {
                success: true,
                message: "Sync completed with empty response body",
              }),
        ),
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
        });

        return new Response(
          JSON.stringify({
            ...fallback,
            customer_provision: customerProvision,
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
          edgeResult?.error ||
          edgeResult?.message ||
          fallbackError?.message ||
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
