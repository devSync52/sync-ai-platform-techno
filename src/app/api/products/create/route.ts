import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { createServerClient } from "@supabase/ssr";
import { createClient } from "@supabase/supabase-js";
import AES from "crypto-js/aes";
import Utf8 from "crypto-js/enc-utf8";

const ENCRYPTION_KEY =
  process.env.NEXT_PUBLIC_CREDENTIAL_SECRET || "SYNC_SECRET";
const EXTENSIV_BASE_URL = "https://secure-wms.com";

type SellercloudCredentials = {
  domain: string;
  username: string;
  password: string;
  company_id?: number | null;
  channel?: number | null;
  warehouse_id?: number | null;
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

function parseSellercloudCredentials(
  raw: unknown,
): SellercloudCredentials | null {
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
    company_id:
      Number(
        (parsed as any).company_id ??
          (parsed as any).companyId ??
          (parsed as any).default_company_id ??
          0,
      ) || null,
    channel:
      Number(
        (parsed as any).channel ??
          (parsed as any).channel_id ??
          (parsed as any).default_channel_id ??
          0,
      ) || null,
    warehouse_id:
      Number(
        (parsed as any).warehouse_id ??
          (parsed as any).ship_from_warehouse_id ??
          0,
      ) || null,
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
    extensiv_id: String((parsed as any).extensiv_id ?? "").trim(),
  };

  if (!creds.client_id || !creds.client_secret || !creds.extensiv_id)
    return null;
  return creds;
}

async function getSellercloudToken(credentials: SellercloudCredentials) {
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
        data?.error ||
          data?.message ||
          data?.ErrorMessage ||
          `Sellercloud token failed (${response.status})`,
      ),
    );
  }

  return { token: String(data.access_token), baseUrl };
}

async function getExtensivToken(creds: ExtensivCredentials) {
  const basic = Buffer.from(
    `${creds.client_id}:${creds.client_secret}`,
  ).toString("base64");

  const bodyForm = new URLSearchParams({
    grant_type: "client_credentials",
    user_login: creds.extensiv_id,
  });

  const res = await fetch(`${EXTENSIV_BASE_URL}/AuthServer/api/Token`, {
    method: "POST",
    headers: {
      Accept: "application/json",
      "Content-Type": "application/x-www-form-urlencoded",
      Authorization: `Basic ${basic}`,
    },
    body: bodyForm.toString(),
  });

  const text = await res.text();
  let json: any = null;
  try {
    json = text ? JSON.parse(text) : null;
  } catch {
    json = null;
  }

  if (res.ok && (json?.access_token || json?.token)) {
    return String(json.access_token || json.token);
  }

  throw new Error(
    String(
      json?.error_description ||
        json?.error ||
        json?.message ||
        text ||
        `Extensiv token failed (${res.status})`,
    ),
  );
}

function toNumber(value: any): number | undefined {
  const n = Number(value);
  return Number.isFinite(n) ? n : undefined;
}

function pruneUndefined<T extends Record<string, any>>(obj: T): T {
  const clone: Record<string, any> = {};
  Object.entries(obj).forEach(([key, value]) => {
    if (value !== undefined && value !== null) {
      clone[key] = value;
    }
  });
  return clone as T;
}

async function getAccountContext() {
  const cookieStore = (await cookies()) as any;
  const auth = createServerClient(
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

  const {
    data: { user },
    error,
  } = await auth.auth.getUser();

  if (error || !user) return { error: "Unauthorized", status: 401 as const };

  const { data: userRow, error: userRowError } = await auth
    .from("users")
    .select("account_id")
    .eq("id", user.id)
    .maybeSingle();

  if (userRowError || !userRow?.account_id) {
    return { error: "Missing account context", status: 403 as const };
  }

  const accountId = String(userRow.account_id);
  const admin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } },
  );

  return { accountId, admin };
}

export async function GET(req: Request) {
  try {
    const url = new URL(req.url);
    const source = String(
      url.searchParams.get("source") ?? "sellercloud",
    ).toLowerCase();

    const ctx = await getAccountContext();
    if ("error" in ctx) {
      return NextResponse.json({ error: ctx.error }, { status: ctx.status });
    }

    const { accountId, admin } = ctx;

    if (source === "sellercloud") {
      const { data: integration, error } = await admin
        .from("account_integrations")
        .select("credentials, status")
        .eq("account_id", accountId)
        .eq("type", "sellercloud")
        .maybeSingle();

      if (error) throw new Error(error.message);
      if (
        !integration ||
        String(integration.status || "").toLowerCase() !== "active"
      ) {
        return NextResponse.json(
          { error: "Sellercloud integration not active" },
          { status: 400 },
        );
      }

      const creds = parseSellercloudCredentials(integration.credentials);
      if (!creds) {
        return NextResponse.json(
          { error: "Invalid Sellercloud credentials" },
          { status: 400 },
        );
      }

      const { token, baseUrl } = await getSellercloudToken(creds);
      const companies = await fetchSellercloudCompanies(baseUrl, token);
      const items = companies
        .map((c: any) => ({
          id:
            toNumber(c?.ID) ??
            toNumber(c?.Id) ??
            toNumber(c?.CompanyID) ??
            toNumber(c?.CompanyId) ??
            null,
          name:
            String(
              c?.CompanyName ?? c?.Name ?? c?.company_name ?? c?.name ?? "",
            ).trim() || null,
        }))
        .filter((c: any) => c.id);

      return NextResponse.json({ companies: items }, { status: 200 });
    }

    if (source === "extensiv") {
      const { data: channels, error } = await admin
        .from("channels")
        .select("id, external_id, name, company_name")
        .eq("account_id", accountId)
        .eq("source", "extensiv");

      if (error) throw new Error(error.message);

      const customers =
        channels
          ?.map((row: any) => ({
            id: toNumber(row?.external_id) ?? toNumber(row?.id) ?? null,
            name:
              String(
                row?.company_name || row?.name || row?.external_id || "",
              ).trim() || null,
          }))
          ?.filter((c: any) => c.id) ?? [];

      return NextResponse.json({ customers }, { status: 200 });
    }

    return NextResponse.json({ error: "Unsupported source" }, { status: 400 });
  } catch (error: any) {
    console.error("[api/products/create GET]", error?.message || error);
    return NextResponse.json(
      { error: error?.message || "Failed to load companies" },
      { status: 500 },
    );
  }
}

async function fetchSellercloudCompanies(
  baseUrl: string,
  token: string,
): Promise<any[]> {
  const res = await fetch(`${baseUrl}/rest/api/Companies`, {
    method: "GET",
    headers: {
      Accept: "application/json",
      Authorization: `Bearer ${token}`,
    },
  });

  const text = await res.text();
  let json: any = null;
  try {
    json = text ? JSON.parse(text) : null;
  } catch {
    json = null;
  }

  if (!res.ok) {
    throw new Error(
      json?.message ||
        json?.error ||
        text ||
        `Failed to load companies (${res.status})`,
    );
  }

  if (Array.isArray(json)) return json;
  if (Array.isArray(json?.Items)) return json.Items;
  if (Array.isArray(json?.items)) return json.items;
  if (Array.isArray(json?.results)) return json.results;
  return [];
}

async function createSellercloudProduct(opts: {
  admin: ReturnType<typeof createClient>;
  accountId: string;
  product: any;
}) {
  const { admin, accountId, product } = opts;

  const { data: integration, error } = await admin
    .from("account_integrations")
    .select("credentials, metadata, status")
    .eq("account_id", accountId)
    .eq("type", "sellercloud")
    .maybeSingle();

  if (error) throw new Error(error.message);
  if (
    !integration ||
    String(integration.status || "").toLowerCase() !== "active"
  ) {
    throw new Error("Sellercloud integration is not active for this account");
  }

  const creds = parseSellercloudCredentials(integration.credentials);
  if (!creds) throw new Error("Invalid Sellercloud credentials");

  const { token, baseUrl } = await getSellercloudToken(creds);

  let companyId =
    toNumber(product?.companyId) ??
    toNumber(product?.company_id) ??
    toNumber((integration as any)?.metadata?.default_company_id) ??
    toNumber((integration as any)?.metadata?.company_id) ??
    creds.company_id ??
    undefined;
  let companyName: string | null =
    (integration as any)?.metadata?.company_name ?? null;

  // Auto-resolve first active company when not provided
  if (!companyId) {
    const companies = await fetchSellercloudCompanies(baseUrl, token);
    const first =
      companies.find((c: any) => c?.IsActive !== false) ?? companies[0];
    const extracted =
      toNumber(first?.ID) ??
      toNumber(first?.Id) ??
      toNumber(first?.CompanyID) ??
      toNumber(first?.CompanyId);
    if (extracted) companyId = extracted;
    companyName =
      String(
        first?.CompanyName ??
          first?.Name ??
          first?.company_name ??
          first?.name ??
          "",
      ).trim() ||
      companyName ||
      null;
  }

  if (!companyId) {
    throw new Error(
      "Sellercloud CompanyId is required (set in integration metadata or form)",
    );
  }

  const payload = pruneUndefined({
    ProductID: product?.productId || product?.sku,
    ProductSKU: product?.sku,
    SKU: product?.sku,
    ProductName: product?.name || product?.description || product?.sku,
    Description: product?.description || product?.name || "",
    UPC: product?.upc,
    Price: toNumber(product?.price) ?? toNumber(product?.site_price),
    SitePrice: toNumber(product?.site_price) ?? toNumber(product?.price),
    Weight: toNumber(product?.weight) ?? toNumber(product?.pkg_weight_lb),
    Height: toNumber(product?.height) ?? toNumber(product?.pkg_height_in),
    Length: toNumber(product?.length) ?? toNumber(product?.pkg_length_in),
    Width: toNumber(product?.width) ?? toNumber(product?.pkg_width_in),
    CompanyID: companyId,
    ProductTypeName: product?.productTypeName || "Regular",
    DefaultWarehouseID:
      toNumber(product?.warehouseId) ??
      toNumber((integration as any)?.metadata?.default_warehouse_id) ??
      creds.warehouse_id ??
      undefined,
  });

  if (!payload.SKU || !payload.ProductID || !payload.ProductName) {
    throw new Error(
      "SKU, ProductID and ProductName are required for Sellercloud",
    );
  }

  const res = await fetch(`${baseUrl}/rest/api/products`, {
    method: "POST",
    headers: {
      Accept: "application/json",
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(payload),
  });

  const text = await res.text();
  let json: any = null;
  try {
    json = text ? JSON.parse(text) : null;
  } catch {
    json = null;
  }

  if (!res.ok) {
    const msg = String(
      json?.message || json?.error || json?.ErrorMessage || text || res.status,
    ).toLowerCase();
    if (res.status === 409 || msg.includes("exists")) {
      return { externalId: payload.ProductID, alreadyExisted: true, raw: json };
    }
    throw new Error(
      json?.message || json?.error || text || `Sellercloud error ${res.status}`,
    );
  }

  const externalId =
    json?.ID || json?.ProductID || json?.Id || json?.id || payload.ProductID;

  // Best-effort UI availability: upsert into sellercloud_products table so the
  // inventory list reflects the new item without waiting for a full sync.
  try {
    await admin.from("sellercloud_products").upsert(
      {
        id: externalId || payload.ProductID || product?.sku,
        external_id: externalId || payload.ProductID || product?.sku,
        account_id: accountId,
        sku: product?.sku,
        name: product?.name || product?.description || product?.sku,
        description: product?.description || null,
        company_id: companyId,
        company_name: companyName,
        quantity_available: null,
        quantity_physical: null,
        warehouse_name: product?.warehouseId
          ? String(product?.warehouseId)
          : null,
        updated_at: new Date().toISOString(),
        created_at: new Date().toISOString(),
      },
      { onConflict: "id" },
    );
  } catch (upsertErr) {
    console.warn(
      "[create product] sellercloud_products upsert warning",
      upsertErr,
    );
  }

  return { externalId, raw: json, alreadyExisted: false };
}

async function createExtensivProduct(opts: {
  admin: ReturnType<typeof createClient>;
  accountId: string;
  product: any;
}) {
  const { admin, accountId, product } = opts;

  const { data: integration, error } = await admin
    .from("account_integrations")
    .select("credentials, metadata, status")
    .eq("account_id", accountId)
    .eq("type", "extensiv")
    .maybeSingle();

  if (error) throw new Error(error.message);
  if (
    !integration ||
    String(integration.status || "").toLowerCase() !== "active"
  ) {
    throw new Error("Extensiv integration is not active for this account");
  }

  const creds = parseExtensivCredentials(integration.credentials);
  if (!creds) throw new Error("Invalid Extensiv credentials");

  const token = await getExtensivToken(creds);

  const customerId =
    toNumber(product?.customerId) ??
    toNumber(product?.customer_id) ??
    toNumber((integration as any)?.metadata?.customer_id) ??
    toNumber((integration as any)?.metadata?.extensiv_customer_id);

  if (!customerId) {
    throw new Error("Extensiv customerId is required to create a product");
  }

  const payload = pruneUndefined({
    itemIdentifier: {
      itemId: toNumber(product?.item_id),
      sku: product?.sku,
    },
    customerIdentifier: { id: customerId },
    description: product?.name || product?.description || product?.sku,
    status: product?.status || "Active",
    itemUnitWeight:
      toNumber(product?.weight) ?? toNumber(product?.pkg_weight_lb),
    itemUnitLength:
      toNumber(product?.length) ?? toNumber(product?.pkg_length_in),
    itemUnitWidth: toNumber(product?.width) ?? toNumber(product?.pkg_width_in),
    itemUnitHeight:
      toNumber(product?.height) ?? toNumber(product?.pkg_height_in),
    itemValue: toNumber(product?.price) ?? toNumber(product?.site_price),
    upc: product?.upc,
  });

  if (!payload.itemIdentifier?.sku) {
    throw new Error("SKU is required for Extensiv");
  }

  const urls = [
    `${EXTENSIV_BASE_URL}/customers/${customerId}/items`,
    `${EXTENSIV_BASE_URL}/items`,
  ];

  // Timeout for product creation requests (30 seconds)
  const REQUEST_TIMEOUT_MS = 30000;

  const doRequest = async (url: string): Promise<Response> => {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

    try {
      const response = await fetch(url, {
        method: "POST",
        headers: {
          Accept: "application/json",
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
        signal: controller.signal,
      });
      return response;
    } finally {
      clearTimeout(timeoutId);
    }
  };

  // Enhanced retry strategy with special handling for 503 (Service Unavailable)
  // For transient errors: [0, 500, 1000, 2000, 4000, 8000]
  // For persistent 503: fallback to longer waits [2000, 4000, 8000, 16000, 32000]
  const baseDelays = [0, 500, 1000, 2000, 4000, 8000];
  const recoveryDelays = [2000, 4000, 8000, 16000, 32000]; // For persistent 503s
  const addJitter = (ms: number) => ms + Math.random() * Math.min(ms, 1000);

  let res: Response | null = null;
  let lastUrlTried = urls[0];
  let lastError: Error | null = null;
  let persistent503Count = 0;

  for (let i = 0; i < baseDelays.length; i += 1) {
    const delayMs = i === 0 ? 0 : addJitter(baseDelays[i]);
    if (delayMs > 0) await new Promise((r) => setTimeout(r, delayMs));

    for (let u = 0; u < urls.length; u += 1) {
      const url = urls[u];
      lastUrlTried = url;

      try {
        res = await doRequest(url);
      } catch (err: any) {
        const errMsg = err?.message || String(err);
        if (errMsg.includes("abort") || errMsg.includes("timeout")) {
          lastError = new Error(
            `Request timeout after ${REQUEST_TIMEOUT_MS}ms for ${url}`,
          );
        } else {
          lastError = err;
        }

        // On timeout/network error, try next URL or retry
        if (u < urls.length - 1) {
          console.warn(`[extensiv create] request error on ${url}:`, errMsg);
          continue;
        }
        // Last URL, will retry with next delay
        continue;
      }

      // Unauthorized on customer endpoint? try global next
      if ((res.status === 401 || res.status === 403) && u < urls.length - 1) {
        continue;
      }

      // Break if not a server error (don't retry other 4xx or 2xx)
      if (res.status < 500) break;

      // Track persistent 503s for extended retry
      if (res.status === 503) {
        persistent503Count++;
      }
    }

    if (res && res.status < 500) break;

    // For 503 specifically, apply extended retry with longer waits
    if (res && res.status === 503 && i < baseDelays.length - 1) {
      console.warn(
        `[extensiv create] received 503, will retry (attempt ${i + 1}/${baseDelays.length}, persistent count: ${persistent503Count})`,
      );
      continue;
    }
  }

  // If still getting 503 after initial attempts, try extended recovery delays
  if (res && res.status === 503 && persistent503Count >= baseDelays.length) {
    console.warn(
      `[extensiv create] persistent 503 detected, attempting extended recovery with longer delays`,
    );

    for (let i = 0; i < recoveryDelays.length; i += 1) {
      const delayMs = addJitter(recoveryDelays[i]);
      console.warn(
        `[extensiv create] recovery attempt ${i + 1}/${recoveryDelays.length}, waiting ${Math.round(delayMs)}ms`,
      );

      if (delayMs > 0) await new Promise((r) => setTimeout(r, delayMs));

      for (let u = 0; u < urls.length; u += 1) {
        const url = urls[u];
        lastUrlTried = url;

        try {
          res = await doRequest(url);
        } catch (err: any) {
          console.warn(
            `[extensiv create] recovery attempt error:`,
            err?.message,
          );
          if (u < urls.length - 1) continue;
          continue;
        }

        // If not 503, break out
        if (res.status !== 503) break;
      }

      // Success (non-503), break out of recovery loop
      if (res && res.status !== 503) {
        console.warn(
          `[extensiv create] recovery succeeded with status ${res.status}`,
        );
        break;
      }
    }
  }

  res = res as Response;

  const text = await res.text();
  let json: any = null;
  try {
    json = text ? JSON.parse(text) : null;
  } catch {
    json = null;
  }

  if (!res.ok) {
    const msg = String(
      json?.message || json?.error || text || res.status,
    ).toLowerCase();
    if (
      res.status === 409 ||
      msg.includes("duplicate") ||
      msg.includes("exists")
    ) {
      return {
        externalId:
          json?.itemIdentifier?.itemId ||
          json?.itemId ||
          product?.item_id ||
          product?.sku,
        alreadyExisted: true,
        raw: json,
      };
    }

    let friendly = "";
    if (res.status === 503) {
      if (persistent503Count > baseDelays.length) {
        friendly = `Extensiv service is currently unavailable. We've tried to reach the service multiple times over the past ~5 minutes with no success. Please check Extensiv status and try again in a few moments.`;
      } else {
        friendly = `Extensiv service temporarily unavailable (503). The service may be undergoing maintenance. Please try again in a moment.`;
      }
    } else if (res.status >= 500) {
      friendly = `Extensiv service error (${res.status}). Please try again in a moment.`;
    } else if (res.status === 401 || res.status === 403) {
      // Check for specific authorization errors
      const responseText = text?.toLowerCase() || "";
      const jsonMsg = (json?.message || json?.error || "")
        .toString()
        .toLowerCase();

      if (
        responseText.includes("usernotauthorized") ||
        responseText.includes("customerdata") ||
        jsonMsg.includes("usernotauthorized") ||
        jsonMsg.includes("customerdata")
      ) {
        friendly = `Extensiv user "${creds.extensiv_id}" does not have permission to create products for customer ID ${customerId}. Please verify the user has proper warehouse permissions and is assigned to this customer in Extensiv.`;
      } else {
        friendly =
          "Extensiv credentials are not authorized. Verify user_login permissions or choose a different customer.";
      }
    } else {
      friendly =
        json?.message || json?.error || text || `Extensiv error ${res.status}`;
    }

    // Include detailed retry information in warning log
    console.warn("[extensiv create] failed after retries", {
      status: res.status,
      url: res.url,
      lastUrlTried,
      initialAttempts: baseDelays.length,
      recoveryAttempts:
        persistent503Count > baseDelays.length ? recoveryDelays.length : 0,
      totalRetries: persistent503Count,
      response: text?.slice(0, 300),
      lastError: lastError?.message,
    });

    throw new Error(friendly);
  }

  const externalId =
    json?.itemIdentifier?.itemId ||
    json?.itemId ||
    json?.ItemID ||
    json?.id ||
    json?.Id ||
    product?.sku;

  return { externalId, raw: json, alreadyExisted: false };
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}));
    const sourceRaw = String(body?.source ?? "")
      .trim()
      .toLowerCase();
    const product = body?.product ?? body;

    if (!sourceRaw || !["sellercloud", "extensiv"].includes(sourceRaw)) {
      return NextResponse.json(
        { error: "Invalid or missing source" },
        { status: 400 },
      );
    }

    const ctx = await getAccountContext();
    if ("error" in ctx) {
      return NextResponse.json({ error: ctx.error }, { status: ctx.status });
    }

    const { accountId, admin } = ctx;

    if (!product?.sku) {
      return NextResponse.json({ error: "SKU is required" }, { status: 400 });
    }

    const result =
      sourceRaw === "sellercloud"
        ? await createSellercloudProduct({ admin, accountId, product })
        : await createExtensivProduct({ admin, accountId, product });

    return NextResponse.json({ success: true, source: sourceRaw, ...result });
  } catch (error: any) {
    console.error("[api/products/create]", error?.message || error);
    return NextResponse.json(
      { error: error?.message || "Failed to create product" },
      { status: 500 },
    );
  }
}
