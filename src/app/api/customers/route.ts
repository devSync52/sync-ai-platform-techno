import { NextRequest, NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase-server";
import { supabaseAdmin } from "@/lib/supabaseAdmin";
import { sendCustomerCredentialsEmail } from "@/lib/emails/sendCustomerCredentialsEmail";
import AES from "crypto-js/aes";
import Utf8 from "crypto-js/enc-utf8";

type AuthType = "local" | "wms_extensiv";
type SourceType = "local" | "sellercloud" | "extensiv";
type RoleType = "client";

const ALLOWED_ROLES = new Set(["superadmin", "admin", "staff-admin"]);
const EXTENSIV_BASE_URL = "https://secure-wms.com";
const CREDENTIAL_SECRET =
  process.env.NEXT_PUBLIC_CREDENTIAL_SECRET ||
  process.env.CREDENTIAL_SECRET ||
  "SYNC_SECRET";

// ── Sellercloud helpers ─────────────────────────────────────────────
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

function decryptSellercloudCredentials(
  raw: any,
): SellercloudCredentials | null {
  if (!raw) return null;
  let parsed: any = raw;
  if (typeof raw === "string") {
    try {
      const decrypted = AES.decrypt(raw, CREDENTIAL_SECRET).toString(Utf8);
      parsed = JSON.parse(decrypted || "{}");
    } catch {
      return null;
    }
  }
  const domain = normalizeDomain(String(parsed?.domain ?? ""));
  const username = String(parsed?.username ?? "").trim();
  const password = String(parsed?.password ?? "").trim();
  if (!domain || !username || !password) return null;
  return { domain, username, password };
}

async function getSellercloudToken(
  credentials: SellercloudCredentials,
): Promise<string> {
  const response = await fetch(`${credentials.domain}/rest/api/token`, {
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
          `Sellercloud token failed (${response.status})`,
      ),
    );
  }
  return String(data.access_token);
}

async function createSellercloudCustomer(args: {
  creds: SellercloudCredentials;
  token: string;
  payload: any;
}) {
  const { creds, token, payload } = args;
  const res = await fetch(`${creds.domain}/rest/api/customers`, {
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
    throw new Error(String(json?.message || json?.error || text || res.status));
  }
  return json;
}

async function fetchSellercloudCompanies(
  creds: SellercloudCredentials,
  token: string,
) {
  const res = await fetch(`${creds.domain}/rest/api/companies`, {
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
  console.log("json", json);

  if (!res.ok) {
    throw new Error(String(json?.message || json?.error || text || res.status));
  }

  const arr = Array.isArray(json) ? json : json?.Items || json?.results || [];
  console.log("arr", arr);

  return arr;
}

const normalizeCountryCode = (val: string | undefined | null) => {
  const v = (val || "").trim();
  if (!v) return "US";
  if (v.length <= 4) return v.toUpperCase();
  // Prefer common USA variants
  if (v.toLowerCase().startsWith("united states")) return "US";
  return v.slice(0, 4).toUpperCase();
};

function pick<T = any>(obj: any, keys: string[], fallback: T = null as T): T {
  for (const key of keys) {
    if (obj?.[key] !== undefined && obj?.[key] !== null) return obj[key] as T;
  }
  return fallback;
}

function deriveCustomerName(primary: any, metadata: any) {
  const first = String(
    pick(
      metadata,
      ["FirstName", "ShippingAddressFirstName", "BillingAddressFirstName"],
      "",
    ),
  ).trim();
  const last = String(
    pick(
      metadata,
      ["LastName", "ShippingAddressLastName", "BillingAddressLastName"],
      "",
    ),
  ).trim();
  const full = `${first} ${last}`.trim();
  if (full) return full;

  const fromPrimary = String(primary || "").trim();
  if (fromPrimary) return fromPrimary;

  const company = String(pick(metadata, ["CompanyName"], "")).trim();
  if (company) return company;

  const email = String(pick(metadata, ["CustomerEmail", "Email"], "")).trim();
  return email || "Customer";
}

function normalizeAuthType(value: unknown): AuthType | null {
  if (value === "local") return "local";
  if (value === "wms_extensiv") return "wms_extensiv";
  return null;
}

function isValidEmail(value: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
}

function generateSecurePassword(length = 12) {
  const chars =
    "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*()";
  let password = "";
  for (let i = 0; i < length; i += 1) {
    password += chars[Math.floor(Math.random() * chars.length)];
  }
  return password;
}

function decryptExtensivCredentials(raw: any) {
  if (!raw) return null;
  let parsed: any = raw;
  if (typeof raw === "string") {
    try {
      const decrypted = AES.decrypt(raw, CREDENTIAL_SECRET).toString(Utf8);
      parsed = JSON.parse(decrypted || "{}");
    } catch {
      return null;
    }
  }
  const client_id = String(parsed?.client_id ?? "").trim();
  const client_secret = String(parsed?.client_secret ?? "").trim();
  const extensiv_id = String(parsed?.extensiv_id ?? "").trim();
  if (!client_id || !client_secret || !extensiv_id) return null;
  return { client_id, client_secret, extensiv_id };
}

async function getExtensivToken(creds: {
  client_id: string;
  client_secret: string;
  extensiv_id: string;
}) {
  const basic = Buffer.from(
    `${creds.client_id}:${creds.client_secret}`,
  ).toString("base64");
  const formBody = new URLSearchParams({
    grant_type: "client_credentials",
    user_login: creds.extensiv_id,
  });

  const formRes = await fetch(`${EXTENSIV_BASE_URL}/AuthServer/api/Token`, {
    method: "POST",
    headers: {
      Accept: "application/json",
      "Content-Type": "application/x-www-form-urlencoded",
      Authorization: `Basic ${basic}`,
    },
    body: formBody.toString(),
  });

  const formText = await formRes.text();
  let formJson: any = null;
  try {
    formJson = formText ? JSON.parse(formText) : null;
  } catch {
    formJson = null;
  }

  if (formRes.ok && (formJson?.access_token || formJson?.token)) {
    return formJson.access_token || formJson.token;
  }

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
  let jsonData: any = null;
  try {
    jsonData = jsonText ? JSON.parse(jsonText) : null;
  } catch {
    jsonData = null;
  }

  if (jsonRes.ok && (jsonData?.access_token || jsonData?.token)) {
    return jsonData.access_token || jsonData.token;
  }

  const msg =
    formJson?.error_description ||
    formJson?.error ||
    jsonData?.error_description ||
    jsonData?.error ||
    jsonText ||
    formText ||
    "Failed to obtain Extensiv token";

  throw new Error(msg);
}

async function fetchExtensivCustomers(args: { accountId: string }): Promise<
  | {
      ok: true;
      rows: any[];
    }
  | { ok: false; error: string }
> {
  const { accountId } = args;

  try {
    const { data: integration, error } = await supabaseAdmin
      .from("account_integrations")
      .select("credentials")
      .eq("account_id", accountId)
      .eq("type", "extensiv")
      .maybeSingle();

    if (error) {
      console.error("[customers][extensiv] integration fetch error", error);
      return { ok: false, error: error.message };
    }

    const creds = decryptExtensivCredentials(integration?.credentials);
    if (!creds) {
      return {
        ok: false,
        error: "Extensiv credentials not configured for this account",
      };
    }

    const token = await getExtensivToken(creds);
    console.log("token", token);

    const headers = {
      Authorization: `Bearer ${token}`,
      Accept: "application/json",
    } as const;

    const res = await fetch(`${EXTENSIV_BASE_URL}/customers`, { headers });
    const text = await res.text();

    let json: any = null;
    try {
      json = text ? JSON.parse(text) : null;
    } catch (err) {
      console.error("[customers][extensiv] parse error", err, text);
      return { ok: false, error: "Failed to parse Extensiv response" };
    }

    if (!res.ok) {
      const message =
        json?.error || json?.message || json?.Error || json || res.statusText;
      return {
        ok: false,
        error: `Extensiv fetch failed: ${String(message || res.status)}`,
      };
    }

    const list = Array.isArray(json?.ResourceList)
      ? json.ResourceList
      : Array.isArray(json)
        ? json
        : [];

    return { ok: true, rows: list };
  } catch (err: any) {
    return { ok: false, error: err?.message || "Unknown Extensiv error" };
  }
}

async function resolveCallerContext() {
  const supabase = await createServerSupabaseClient();
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    return { error: "Unauthorized", status: 401 as const };
  }

  const { data: me, error: meError } = await supabaseAdmin
    .from("users")
    .select("id, role, account_id")
    .eq("id", user.id)
    .maybeSingle();

  if (meError || !me) {
    return {
      error: meError?.message || "User not found",
      status: 404 as const,
    };
  }

  if (!ALLOWED_ROLES.has(me.role)) {
    return { error: "Forbidden", status: 403 as const };
  }

  let accountId = me.account_id;

  if (!accountId) {
    const { data: account } = await supabaseAdmin
      .from("accounts")
      .select("id")
      .eq("created_by_user_id", user.id)
      .maybeSingle();

    accountId = account?.id ?? null;
  }

  if (!accountId) {
    return { error: "Account not found", status: 404 as const };
  }

  return { userId: user.id, accountId };
}

export async function GET(req: NextRequest) {
  const context = await resolveCallerContext();
  if ("error" in context) {
    return NextResponse.json(
      { error: context.error },
      { status: context.status },
    );
  }

  const service = req.nextUrl.searchParams.get("service")?.toLowerCase();

  // Special branch: when order creation is for Extensiv, pull live customers directly
  if (service === "extensiv") {
    const res = await fetchExtensivCustomers({ accountId: context.accountId });
    if (!res.ok) {
      return NextResponse.json({ error: res.error }, { status: 400 });
    }

    const customers = res.rows.map((row: any) => {
      const readOnly = row?.ReadOnly || {};
      const company = row?.CompanyInfo || {};
      const primary = row?.PrimaryContact || {};
      const name =
        String(company.CompanyName || primary.Name || "Extensiv Customer").trim();
      const email = String(primary.EmailAddress || "").trim();
      const custId = String(readOnly.CustomerId || row?.CustomerId || "").trim();
      const createdAt = readOnly.CreationDate || row?.CreationDate || null;
      const deactivated = Boolean(readOnly.Deactivated || false);

      return {
        id: `ext-${custId || name}`,
        account_id: context.accountId,
        name,
        email: email || "-",
        role: "client",
        created_at: createdAt,
        last_login_at: null,
        has_logged_in: null,
        auth_type: "wms_extensiv" as AuthType,
        wms_user_identifier: custId || null,
        external_id: custId || null,
        status: deactivated ? "disabled" : "active",
        source: "extensiv" as SourceType,
        origin: "extensiv",
      };
    });

    return NextResponse.json({ customers });
  }

  const { data: customers, error } = await supabaseAdmin
    .from("users")
    .select(
      "id, account_id, name, email, role, created_at, last_login_at, has_logged_in",
    )
    .eq("account_id", context.accountId)
    .in("role", ["client", "staff-client", "staff-user", "client-user"])
    .order("created_at", { ascending: false });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  const authUsersResult = await supabaseAdmin.auth.admin.listUsers({
    page: 1,
    perPage: 1000,
  });
  if (authUsersResult.error) {
    return NextResponse.json(
      { error: authUsersResult.error.message },
      { status: 500 },
    );
  }

  const now = Date.now();
  const authById = new Map(
    authUsersResult.data.users.map((authUser) => [authUser.id, authUser]),
  );

  const payload = (customers ?? []).map((customer) => {
    const authUser = authById.get(customer.id);
    const userMetadata = authUser?.user_metadata ?? {};
    const appMetadata = authUser?.app_metadata ?? {};

    const authType =
      normalizeAuthType(
        userMetadata.customer_auth_type ??
          userMetadata.auth_type ??
          appMetadata.customer_auth_type ??
          appMetadata.auth_type,
      ) ?? "local";

    const bannedUntil = authUser?.banned_until
      ? new Date(authUser.banned_until).getTime()
      : 0;

    return {
      ...customer,
      account_id: (customer as any)?.account_id ?? context.accountId,
      auth_type: authType,
      wms_user_identifier:
        (userMetadata.wms_user_identifier as string | undefined) ??
        (appMetadata.wms_user_identifier as string | undefined) ??
        null,
      status: bannedUntil > now ? "disabled" : "active",
      source: "local",
      origin:
        (userMetadata.customer_source as string | undefined) ??
        (appMetadata.customer_source as string | undefined) ??
        "manual",
    };
  });

  // Merge customers discovered from synced orders so they are visible
  // in the Customers screen even when they are not platform auth users.
  const { data: orderRows, error: ordersError } = await supabaseAdmin
    .from("orders")
    .select("client_name, origin, metadata, created_at, order_number")
    .eq("account_id", context.accountId)
    .order("created_at", { ascending: false })
    .limit(5000);

  if (ordersError) {
    console.error("[customers][orders] failed to load orders:", ordersError);
    return NextResponse.json({ customers: payload });
  }

  const existingEmails = new Set(
    payload
      .map((row: any) =>
        String(row?.email || "")
          .trim()
          .toLowerCase(),
      )
      .filter((email: string) => email.length > 0),
  );

  const seenKeys = new Set<string>();
  const discoveredRows: any[] = [];

  // Pull live customers directly from Extensiv using the same account credentials
  const extensivResult = await fetchExtensivCustomers({
    accountId: context.accountId,
  });

  if (extensivResult.ok) {
    for (const row of extensivResult.rows) {
      const wmsId = String(
        row?.ReadOnly?.CustomerId || row?.CustomerId || "",
      ).trim();
      const companyInfo = row?.CompanyInfo || {};
      const primaryContact = row?.PrimaryContact || {};
      const name =
        String(companyInfo.CompanyName || primaryContact.Name || "").trim() ||
        "Extensiv Customer";
      const email = String(primaryContact.EmailAddress || "").trim();
      const dedupeKey = wmsId || email || name;
      if (!dedupeKey || seenKeys.has(dedupeKey)) continue;
      seenKeys.add(dedupeKey);
      if (email) existingEmails.add(email.toLowerCase());

      discoveredRows.push({
        id: `ext-${wmsId || name}`,
        name,
        email: email || "-",
        role: "client",
        created_at:
          row?.ReadOnly?.CreationDate ||
          row?.creationDate ||
          row?.CreationDate ||
          null,
        last_login_at: null,
        has_logged_in: null,
        account_id: context.accountId,
        auth_type: "wms_extensiv",
        wms_user_identifier: wmsId || null,
        status: row?.ReadOnly?.Deactivated ? "disabled" : "active",
        source: "extensiv",
        origin: "extensiv",
      });
    }
  } else {
    console.warn("[customers][extensiv]", extensivResult.error);
  }

  // Also surface customers that were synced into the `channels` table (e.g.,
  // Sellercloud/Extensiv) even if login users have not been provisioned yet.
  const { data: channelRows, error: channelError } = await supabaseAdmin
    .from("channels")
    .select(
      "id, company_name, contact_name, email, external_id, source, created_at",
    )
    .eq("account_id", context.accountId)
    .order("created_at", { ascending: false });

  if (channelError) {
    console.error(
      "[customers][channels] failed to load channels:",
      channelError,
    );
  }

  for (const channel of channelRows || []) {
    const email = String(channel.email || "")
      .trim()
      .toLowerCase();
    const wmsId = String(channel.external_id || "").trim();
    const name =
      String(channel.contact_name || "").trim() ||
      String(channel.company_name || "").trim() ||
      "Channel Customer";
    const source = String(channel.source || "channel").toLowerCase();
    const dedupeKey = wmsId || email || `channel:${channel.id}`;

    if (!dedupeKey || seenKeys.has(dedupeKey)) continue;
    seenKeys.add(dedupeKey);
    if (email) existingEmails.add(email);

    discoveredRows.push({
      id: `chn-${channel.id}`,
      name,
      email: email || "-",
      role: "client",
      created_at: channel.created_at ?? null,
      last_login_at: null,
      has_logged_in: null,
      account_id: context.accountId,
      auth_type: "wms_extensiv",
      wms_user_identifier: wmsId || null,
      status: "active",
      source,
      origin: source,
    });
  }

  for (const row of orderRows || []) {
    const metadata = (row as any)?.metadata || {};
    const customerName = deriveCustomerName(
      (row as any)?.client_name,
      metadata,
    );

    const email = String(metadata?.CustomerEmail || "")
      .trim()
      .toLowerCase();
    const wmsId = String(
      metadata?.CustomerID || metadata?.customer_id || "",
    ).trim();
    const source =
      String((row as any)?.origin || "orders")
        .trim()
        .toLowerCase() || "orders";
    const dedupeKey =
      wmsId || email || `${source}:${customerName.toLowerCase()}`;
    if (!dedupeKey || seenKeys.has(dedupeKey)) continue;
    seenKeys.add(dedupeKey);

    if (email && existingEmails.has(email)) {
      continue;
    }

    discoveredRows.push({
      id: `ord-${wmsId || email || String((row as any)?.order_number || dedupeKey)}`,
      name: customerName,
      email: email || "-",
      role: "client",
      created_at: (row as any)?.created_at ?? null,
      last_login_at: null,
      has_logged_in: null,
      account_id: context.accountId,
      auth_type: "wms_extensiv",
      wms_user_identifier: wmsId || null,
      status: "active",
      source,
      origin: source,
    });
  }

  return NextResponse.json({ customers: [...payload, ...discoveredRows] });
}

export async function POST(req: NextRequest) {
  const context = await resolveCallerContext();
  if ("error" in context) {
    return NextResponse.json(
      { error: context.error },
      { status: context.status },
    );
  }

  let body: {
    name?: string;
    email?: string;
    role?: RoleType;
    authType?: AuthType;
    temporaryPassword?: string;
    wmsUserIdentifier?: string;
    source?: SourceType;
    companyId?: string;
    companyName?: string;
    firstName?: string;
    lastName?: string;
    phone?: string;
    address1?: string;
    address2?: string;
    city?: string;
    state?: string;
    postalCode?: string;
    country?: string;
    customerType?: "wholesale" | "retail";
    contactPassword?: string;
  };

  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const name = (body.name ?? "").trim();
  const email = (body.email ?? "").trim().toLowerCase();
  const role: RoleType = body.role === "client" ? "client" : "client";
  const authType = normalizeAuthType(body.authType);
  const temporaryPassword = (body.temporaryPassword ?? "").trim();
  const wmsUserIdentifier = (body.wmsUserIdentifier ?? "").trim();
  const source: SourceType = (body.source as SourceType) || "local";
  const companyId = (body.companyId ?? "").trim();
  const companyName = (body.companyName ?? "").trim();
  const firstName = (body.firstName ?? "").trim();
  const lastName = (body.lastName ?? "").trim();
  const phone = (body.phone ?? "").trim();
  const address1 = (body.address1 ?? "").trim();
  const address2 = (body.address2 ?? "").trim();
  const city = (body.city ?? "").trim();
  const state = (body.state ?? "").trim();
  const postalCode = (body.postalCode ?? "").trim();
  const country = (body.country ?? "").trim() || "US";
  const customerType =
    (body.customerType as "wholesale" | "retail") ?? "wholesale";
  const contactPassword = (body.contactPassword ?? "").trim();

  if (!name) {
    return NextResponse.json({ error: "Name is required" }, { status: 400 });
  }

  if (!email) {
    return NextResponse.json({ error: "Email is required" }, { status: 400 });
  }
  if (!isValidEmail(email)) {
    return NextResponse.json(
      { error: "Invalid email format" },
      { status: 400 },
    );
  }

  if (!authType) {
    return NextResponse.json(
      { error: "Authentication type is required" },
      { status: 400 },
    );
  }

  const isPlatform = source === "extensiv" || source === "sellercloud";

  if (!isPlatform && authType === "local" && temporaryPassword.length < 8) {
    return NextResponse.json(
      {
        error:
          "Temporary Password must be at least 8 characters for Local auth",
      },
      { status: 400 },
    );
  }

  if ((authType === "wms_extensiv" || isPlatform) && !wmsUserIdentifier) {
    return NextResponse.json(
      { error: "WMS User Identifier is required for WMS auth" },
      { status: 400 },
    );
  }

  if (isPlatform && source === "extensiv") {
    if (!companyId)
      return NextResponse.json(
        { error: "Customer ID is required for Extensiv" },
        { status: 400 },
      );
    if (!companyName)
      return NextResponse.json(
        { error: "Company name is required for Extensiv" },
        { status: 400 },
      );
    if (!firstName)
      return NextResponse.json(
        { error: "First name is required for Extensiv" },
        { status: 400 },
      );
    if (!phone)
      return NextResponse.json(
        { error: "Phone is required for Extensiv" },
        { status: 400 },
      );
    if (!address1 || !city || !state || !postalCode || !country) {
      return NextResponse.json(
        {
          error:
            "Address, city, state, postal code and country are required for Extensiv",
        },
        { status: 400 },
      );
    }
    if (!contactPassword) {
      return NextResponse.json(
        { error: "Contact temp password is required for Extensiv" },
        { status: 400 },
      );
    }
  }

  // Branch: platform customers (Extensiv/Sellercloud) are created in external system and tracked in channels
  if (source === "extensiv") {
    try {
      const { data: integration } = await supabaseAdmin
        .from("account_integrations")
        .select("credentials")
        .eq("account_id", context.accountId)
        .eq("type", "extensiv")
        .maybeSingle();

      const creds = decryptExtensivCredentials(integration?.credentials);
      if (!creds) {
        return NextResponse.json(
          { error: "Extensiv credentials not configured for this account" },
          { status: 400 },
        );
      }

      const token = await getExtensivToken(creds);
      console.log("token", token);

      const headers = {
        Authorization: `Bearer ${token}`,
        Accept: "application/json",
        "Content-Type": "application/json",
      };

      const desc = companyName || name || email;
      const countryCode = normalizeCountryCode(country);
      const payload: any = {
        companyInfo: {
          companyName,
          name: desc, // maps to Customer.Description
          address1,
          address2,
          city,
          state,
          zip: postalCode,
          country: countryCode,
          phoneNumber: phone,
          emailAddress: email,
        },
        primaryContact: {
          companyName,
          name: `${firstName} ${lastName}`.trim() || firstName || companyName,
          title: "",
          address1,
          address2,
          city,
          state,
          zip: postalCode,
          country: countryCode,
          phoneNumber: phone,
          emailAddress: email,
        },
        facilities: [],
        options: {},
      };

      const res = await fetch(`${EXTENSIV_BASE_URL}/customers`, {
        method: "POST",
        headers,
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const txt = await res.text();
        // If duplicate customer description, treat as success (idempotent create)
        if (txt && txt.toLowerCase().includes("duplicate")) {
          console.warn(
            "Extensiv customer appears to already exist; proceeding with channel upsert",
          );
        } else {
          return NextResponse.json(
            { error: `Extensiv create failed: ${txt || res.status}` },
            { status: 400 },
          );
        }
      }

      // Create/update channel row for visibility
      const { error: upsertError, data: channelRow } = await supabaseAdmin
        .from("channels")
        .upsert(
          {
            account_id: context.accountId,
            external_id: companyId,
            name: companyName,
            company_name: companyName,
            contact_name: `${firstName} ${lastName}`.trim(),
            email,
            phone,
            address_line1: address1,
            address_line2: address2,
            city,
            state,
            zip_code: postalCode,
            country: countryCode,
            source: "extensiv",
          },
          { onConflict: "account_id,external_id" },
        )
        .select()
        .single();

      if (upsertError) {
        return NextResponse.json(
          { error: upsertError.message },
          { status: 500 },
        );
      }

      return NextResponse.json({
        success: true,
        customer: {
          id: channelRow?.id ?? `chn-${companyId}`,
          name: channelRow?.company_name || companyName,
          email: channelRow?.email || email,
          role: "client",
          created_at: channelRow?.created_at ?? new Date().toISOString(),
          last_login_at: null,
          has_logged_in: null,
          account_id: context.accountId,
          auth_type: "wms_extensiv",
          wms_user_identifier: companyId,
          status: "active",
          source: "extensiv",
          origin: "extensiv",
        },
      });
    } catch (err: any) {
      return NextResponse.json(
        { error: err?.message || "Failed to create Extensiv customer" },
        { status: 400 },
      );
    }
  }

  if (source === "sellercloud") {
    try {
      const { data: integration } = await supabaseAdmin
        .from("account_integrations")
        .select("credentials")
        .eq("account_id", context.accountId)
        .eq("type", "sellercloud")
        .maybeSingle();

      const creds = decryptSellercloudCredentials(integration?.credentials);
      if (!creds) {
        return NextResponse.json(
          { error: "Sellercloud credentials not configured for this account" },
          { status: 400 },
        );
      }

      const token = await getSellercloudToken(creds);

      // If companyId missing, pick the first company from Sellercloud
      let companyIdForUse = companyId;
      if (!companyIdForUse) {
        const companies = await fetchSellercloudCompanies(creds, token);
        const list = Array.isArray(companies)
          ? companies
          : companies?.Items ||
            companies?.items ||
            companies?.Results ||
            companies?.results ||
            [];
        const first = list && list.length > 0 ? list[0] : null;
        const candidateId =
          first?.CompanyID ??
          first?.companyID ??
          first?.Id ??
          first?.id ??
          first?.ID ??
          null;
        if (!candidateId) {
          return NextResponse.json(
            {
              error:
                "Sellercloud: Company ID missing and no companies found via API. Please enter a valid Company ID.",
            },
            { status: 400 },
          );
        }
        companyIdForUse = String(candidateId);
      }

      const scPayload = {
        CompanyID: Number(companyIdForUse) || 0,
        CompanyName: companyName || name,
        CustomerCode: `SYNC-${Date.now()}`,
        FirstName: firstName,
        LastName: lastName,
        Email: email,
        Phone: phone,
        CustomerType: customerType === "retail" ? 1 : 0, // 0 wholesale, 1 retail
        Addresses: [
          {
            AddressType: 0,
            Address1: address1,
            Address2: address2,
            City: city,
            State: state,
            Zip: postalCode,
            Country: normalizeCountryCode(country),
            Phone: phone,
          },
        ],
      };

      const created = await createSellercloudCustomer({
        creds,
        token,
        payload: scPayload,
      });
      const createdExternalId =
        created?.CustomerID ??
        created?.customerID ??
        created?.Id ??
        created?.ID ??
        created?.customerId ??
        created?.CustomerCode ??
        created?.customerCode ??
        scPayload.CustomerCode;

      const { error: upsertError, data: channelRow } = await supabaseAdmin
        .from("channels")
        .upsert(
          {
            account_id: context.accountId,
            external_id: String(createdExternalId),
            name: companyName || name,
            company_name: companyName || name,
            contact_name: `${firstName} ${lastName}`.trim(),
            email,
            phone,
            address_line1: address1,
            address_line2: address2,
            city,
            state,
            zip_code: postalCode,
            country: normalizeCountryCode(country),
            source: "sellercloud",
          },
          { onConflict: "account_id,external_id" },
        )
        .select()
        .single();

      if (upsertError) {
        return NextResponse.json(
          { error: upsertError.message },
          { status: 500 },
        );
      }

      return NextResponse.json({
        success: true,
        customer: {
          id: channelRow?.id ?? `chn-${companyId}`,
          name: channelRow?.company_name || companyName || name,
          email: channelRow?.email || email,
          role: "client",
          created_at: channelRow?.created_at ?? new Date().toISOString(),
          last_login_at: null,
          has_logged_in: null,
          account_id: context.accountId,
          auth_type: "wms_extensiv",
          wms_user_identifier: companyId,
          status: "active",
          source: "sellercloud",
          origin: "sellercloud",
          external: created,
        },
      });
    } catch (err: any) {
      return NextResponse.json(
        { error: err?.message || "Failed to create Sellercloud customer" },
        { status: 400 },
      );
    }
  }

  // Fallback: local/manual path
  const passwordForLogin =
    authType === "local" ? temporaryPassword : generateSecurePassword(12);

  const { data: authData, error: authError } =
    await supabaseAdmin.auth.admin.createUser({
      email,
      password: passwordForLogin,
      email_confirm: true,
      user_metadata: {
        name,
        account_id: context.accountId,
        customer_auth_type: authType,
        wms_user_identifier:
          authType === "wms_extensiv" ? wmsUserIdentifier : null,
        customer_source: source,
      },
      app_metadata: {
        role,
      },
    });

  let emailWarning: string | null = null;
  try {
    await sendCustomerCredentialsEmail({
      to: email,
      customerName: name,
      authType,
      password: passwordForLogin,
      wmsUserIdentifier: authType === "wms_extensiv" ? wmsUserIdentifier : null,
      source,
    });
  } catch (error) {
    console.error(
      "[customers][create] failed to send credentials email:",
      error,
    );
    const message =
      error instanceof Error ? error.message : "Unknown email delivery error.";
    emailWarning = `User created, but failed to send credentials email: ${message}`;
  }

  return NextResponse.json({
    success: true,
    warning: emailWarning,
    customer: {
      ...userRow,
      auth_type: authType,
      wms_user_identifier:
        authType === "wms_extensiv" ? wmsUserIdentifier : null,
      status: "active",
      source: "local",
      origin: "manual",
    },
  });
}
