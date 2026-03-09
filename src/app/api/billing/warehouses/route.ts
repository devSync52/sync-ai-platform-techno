// /src/app/api/billing/warehouses/route.ts
import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { createServerClient } from "@supabase/ssr";
import { createClient } from "@supabase/supabase-js";
import AES from "crypto-js/aes";
import Utf8 from "crypto-js/enc-utf8";

// Helper para SR (sem depender de outro arquivo)
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

const shapeWarehouse = (w: any) => ({
  id: w.id,
  name: w.name,
  city: w.city,
  state: w.state,
  is_default: w.is_default,
  parent_account_id: w.parent_account_id,
  source: w.source,
  wms_facility_id: w.wms_facility_id,
  is_active: w.is_active,
});

type SellercloudCredentials = {
  domain: string;
  username: string;
  password: string;
};

const ENCRYPTION_KEY =
  process.env.NEXT_PUBLIC_CREDENTIAL_SECRET || "SYNC_SECRET";

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

type UserContext =
  | { ok: true; accountId: string; rawAccountId: string }
  | { ok: false; status: number; message: string };

async function resolveAccountContext(request: Request): Promise<UserContext> {
  // 1) User client to identify current user/session
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

  // 2) Descobrir o parent_account_id do usuário (public.users)
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

export async function GET(request: Request) {
  const context = await resolveAccountContext(request);
  if (!context.ok) {
    return NextResponse.json(
      { error: context.message },
      { status: context.status },
    );
  }

  // 3) Service Role para ler a view pública e filtrar por parent_account_id
  const sr = getServiceRoleClient();
  const { data, error } = await sr
    .from("v_billing_warehouses")
    .select("*")
    .eq("parent_account_id", context.accountId)
    .eq("is_active", true)
    .order("is_default", { ascending: false })
    .order("name", { ascending: true });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }

  // 4) Retorne apenas os campos usados pela sua UI (ou tudo)
  const shaped = (data ?? []).map(shapeWarehouse);

  return NextResponse.json({ data: shaped });
}

export async function POST(request: Request) {
  const context = await resolveAccountContext(request);
  if (!context.ok) {
    return NextResponse.json(
      { error: context.message },
      { status: context.status },
    );
  }
  //creating payload parsing with error handling
  let payload: any;
  try {
    payload = await request.json();
  } catch (err) {
    return NextResponse.json(
      { error: "Invalid JSON payload" },
      { status: 400 },
    );
  }

  const action = payload?.action;
  if (!action || typeof action !== "string") {
    return NextResponse.json({ error: "Missing action" }, { status: 400 });
  }

  const sr = getServiceRoleClient();
  const accountId = context.accountId;

  if (action === "setDefault") {
    const warehouseId = payload?.warehouse_id;
    if (!warehouseId || typeof warehouseId !== "string") {
      return NextResponse.json(
        { error: "Missing warehouse_id" },
        { status: 400 },
      );
    }

    const { data: targetWarehouse, error: fetchErr } = await sr
      .from("v_billing_warehouses")
      .select("*")
      .eq("parent_account_id", accountId)
      .eq("id", warehouseId)
      .maybeSingle();

    if (fetchErr) {
      return NextResponse.json({ error: fetchErr.message }, { status: 400 });
    }
    if (!targetWarehouse) {
      return NextResponse.json(
        { error: "Warehouse not found" },
        { status: 404 },
      );
    }

    const { error: clearErr } = await sr
      .schema("billing")
      .from("warehouses")
      .update({ is_default: false })
      .eq("parent_account_id", accountId);

    if (clearErr) {
      return NextResponse.json({ error: clearErr.message }, { status: 400 });
    }

    const { error: setErr } = await sr
      .schema("billing")
      .from("warehouses")
      .update({ is_default: true })
      .eq("id", warehouseId)
      .eq("parent_account_id", accountId);

    if (setErr) {
      return NextResponse.json({ error: setErr.message }, { status: 400 });
    }

    const { data: refreshed, error: refreshErr } = await sr
      .from("v_billing_warehouses")
      .select("*")
      .eq("parent_account_id", accountId)
      .eq("is_active", true)
      .order("is_default", { ascending: false })
      .order("name", { ascending: true });

    if (refreshErr) {
      return NextResponse.json({ error: refreshErr.message }, { status: 400 });
    }

    return NextResponse.json({ data: (refreshed ?? []).map(shapeWarehouse) });
  }

  if (action === "create") {
    const name = String(payload?.name ?? "").trim();
    const city = String(payload?.city ?? "").trim();
    const state = String(payload?.state ?? "").trim();
    const isDefault = Boolean(payload?.is_default);
    const customId = payload?.id ? String(payload.id).trim() : null;

    if (!name || !city || !state) {
      return NextResponse.json(
        { error: "Name, city, and state are required" },
        { status: 400 },
      );
    }

    const insertPayload: Record<string, any> = {
      parent_account_id: accountId,
      name,
      city,
      state,
      is_active: true,
      is_default: isDefault,
      source: payload?.source ?? "manual",
      wms_facility_id: payload?.wms_facility_id ?? null,
    };

    if (customId) insertPayload.id = customId;

    const { data: inserted, error: insertErr } = await sr
      .schema("billing")
      .from("warehouses")
      .insert(insertPayload)
      .select("*")
      .maybeSingle();

    if (insertErr) {
      return NextResponse.json({ error: insertErr.message }, { status: 400 });
    }

    const createdId = (inserted?.id ?? customId) as string | null;
    if (!createdId) {
      return NextResponse.json(
        { error: "Warehouse identifier not returned" },
        { status: 500 },
      );
    }

    if (isDefault && createdId) {
      const { error: clearErr } = await sr
        .schema("billing")
        .from("warehouses")
        .update({ is_default: false })
        .eq("parent_account_id", accountId)
        .neq("id", createdId);

      if (clearErr) {
        return NextResponse.json({ error: clearErr.message }, { status: 400 });
      }
    }

    const { data: refreshed, error: refreshErr } = await sr
      .from("v_billing_warehouses")
      .select("*")
      .eq("parent_account_id", accountId)
      .eq("is_active", true)
      .order("is_default", { ascending: false })
      .order("name", { ascending: true });

    if (refreshErr) {
      return NextResponse.json({ error: refreshErr.message }, { status: 400 });
    }

    return NextResponse.json({ data: (refreshed ?? []).map(shapeWarehouse) });
  }

  if (action === "syncSellercloud") {
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

    const token = await getSellercloudToken(credentials);
    const baseUrl = normalizeDomain(credentials.domain);
    const whRes = await fetch(`${baseUrl}/rest/api/Warehouses`, {
      method: "GET",
      headers: {
        Accept: "application/json",
        Authorization: `Bearer ${token}`,
      },
    });

    const whText = await whRes.text();
    let whJson: any = null;
    try {
      whJson = whText ? JSON.parse(whText) : [];
    } catch {
      whJson = [];
    }

    if (!whRes.ok) {
      return NextResponse.json(
        {
          error: `Failed fetching Sellercloud warehouses (${whRes.status})`,
          details: whJson || whText,
        },
        { status: 400 },
      );
    }
    const rows = Array.isArray(whJson)
      ? whJson
      : Array.isArray(whJson?.Items)
        ? whJson.Items
        : Array.isArray(whJson?.Warehouses)
          ? whJson.Warehouses
          : Array.isArray(whJson?.items)
            ? whJson.items
            : Array.isArray(whJson?.data)
              ? whJson.data
              : Array.isArray(whJson?.results)
                ? whJson.results
                : [];

    let synced = 0;
    const failures: Array<{ externalId: string; name: string; error: string }> =
      [];

    for (const row of rows) {
      const externalId = String(row?.ID ?? row?.Id ?? row?.id ?? "").trim();
      if (!externalId) continue;
      const name = String(
        row?.Name ?? row?.WarehouseName ?? `Sellercloud ${externalId}`,
      ).trim();
      const warehouseAddress =
        row?.WarehouseAddress && typeof row.WarehouseAddress === "object"
          ? row.WarehouseAddress
          : {};
      const city = String(warehouseAddress?.City ?? "").trim() || null;
      const state = String(warehouseAddress?.State ?? "").trim() || null;
      const isDefault = Boolean(row?.IsDefault ?? false);

      const { data: existing } = await sr
        .schema("billing")
        .from("warehouses")
        .select("id")
        .eq("parent_account_id", accountId)
        .eq("source", "sellercloud")
        .eq("wms_facility_id", externalId)
        .maybeSingle();

      if (existing?.id) {
        const { error: updateErr } = await sr
          .schema("billing")
          .from("warehouses")
          .update({
            name,
            city,
            state,
            is_default: isDefault,
            is_active: true,
          })
          .eq("id", existing.id);
        if (updateErr) {
          failures.push({ externalId, name, error: updateErr.message });
        } else {
          synced += 1;
        }
      } else {
        const { error: insertErr } = await sr
          .schema("billing")
          .from("warehouses")
          .insert({
            parent_account_id: accountId,
            name,
            city,
            state,
            is_active: true,
            is_default: isDefault,
            source: "sellercloud",
            wms_facility_id: externalId,
          });
        if (insertErr) {
          failures.push({ externalId, name, error: insertErr.message });
        } else {
          synced += 1;
        }
      }
    }

    const { data: refreshed, error: refreshErr } = await sr
      .from("v_billing_warehouses")
      .select("*")
      .eq("parent_account_id", accountId)
      .eq("is_active", true)
      .order("is_default", { ascending: false })
      .order("name", { ascending: true });

    if (refreshErr) {
      return NextResponse.json({ error: refreshErr.message }, { status: 400 });
    }

    return NextResponse.json({
      data: (refreshed ?? []).map(shapeWarehouse),
      summary: {
        received: rows.length,
        synced,
        failed: failures.length,
      },
      failures,
    });
  }

  return NextResponse.json(
    { error: `Unsupported action: ${action}` },
    { status: 400 },
  );
}
