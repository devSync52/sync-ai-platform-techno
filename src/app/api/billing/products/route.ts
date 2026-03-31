import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { createServerClient } from "@supabase/ssr";
import { createClient } from "@supabase/supabase-js";

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

type ProductRow = {
  id: string;
  sku: string | null;
  description: string | null;
  product_name?: string | null;
  image?: string | null;
  available: number | null;
  on_hold: number | null;
  warehouse_name: string | null;
  warehouse_id?: string | null;
  product_source: string | null;
  account_name: string | null;
  updated_at: string | null;
};

type UserContext =
  | { ok: true; userId: string; accountId: string; rawAccountId: string }
  | { ok: false; status: number; message: string };

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

  return {
    ok: true,
    userId,
    accountId: effectiveAccountId,
    rawAccountId,
  };
}

async function loadProducts(userId: string, source?: string | null) {
  const sr = getServiceRoleClient();
  const { data, error } = await sr
    .from("products_relation")
    .select(`product:products (*)`)
    .eq("user_id", userId);

  if (error) {
    throw new Error(error.message);
  }

  let rows: ProductRow[] = (data ?? [])
    .map((r: any) => r.product)
    .filter(Boolean)
    .map((p: any) => ({
      id: p.id,
      sku: p.sku ?? null,
      product_name: p.product_name ?? p.name ?? null,
      description: p.description ?? p.product_name ?? null,
      image:
        p.image ??
        p.meta?.image ??
        p.raw?.image ??
        p.meta?.Image ??
        p.raw?.Image ??
        null,
      available: p.available ?? p.physical_qty ?? null,
      on_hold: p.on_hold ?? null,
      warehouse_name: p.warehouse_name ?? null,
      warehouse_id:
        p.warehouse_id ??
        p.meta?.warehouse_id ??
        p.raw?.warehouse_id ??
        p.meta?.WarehouseId ??
        p.raw?.WarehouseId ??
        null,
      product_source: p.source ?? null,
      account_name: null,
      updated_at: p.updated_at ?? null,
    }));

  // Resolve warehouse names via warehouses table
  const warehouseIds = Array.from(
    new Set(
      rows
        .map((r) => r.warehouse_id)
        .filter((v): v is string => !!v),
    ),
  );

  if (warehouseIds.length) {
    const { data: warehouses, error: whError } = await getServiceRoleClient()
      .from("warehouses")
      .select("id,name")
      .in("id", warehouseIds);

    if (!whError && warehouses) {
      const map = new Map(warehouses.map((w: any) => [String(w.id), w.name]));
      rows = rows.map((r) => ({
        ...r,
        warehouse_name:
          map.get(String(r.warehouse_id)) ?? r.warehouse_name ?? "default",
      }));
    }
  }

  if (source) {
    const filter = source.trim().toLowerCase();
    rows = rows.filter(
      (r) => String(r.product_source || "").toLowerCase() === filter,
    );
  }

  const sources = Array.from(
    new Set(rows.map((r) => r.product_source).filter(Boolean) as string[]),
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

  const { searchParams } = new URL(request.url);
  const source = searchParams.get("source");

  try {
    const { rows, sources } = await loadProducts(context.userId, source);
    return NextResponse.json({ data: rows, sources });
  } catch (error: any) {
    return NextResponse.json(
      { error: error?.message ?? "Failed to load products" },
      { status: 400 },
    );
  }
}

// POST currently not supported in this simplified handler
export async function POST() {
  return NextResponse.json({ error: "Not implemented" }, { status: 405 });
}
