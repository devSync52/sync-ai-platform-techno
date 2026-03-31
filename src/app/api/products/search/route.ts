import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { createServerClient } from "@supabase/ssr";
import type { Database } from "@/types/supabase";
import AES from "crypto-js/aes";
import Utf8 from "crypto-js/enc-utf8";

function getAccountContextFromUser(user: any): {
  accountId: string | null;
  role: string | null;
} {
  const role =
    (user?.user_metadata as any)?.role ??
    (user?.app_metadata as any)?.role ??
    null;

  const accountId =
    (user?.app_metadata as any)?.parent_account_id ??
    (user?.user_metadata as any)?.parent_account_id ??
    (user?.app_metadata as any)?.account_id ??
    (user?.user_metadata as any)?.account_id ??
    null;

  return {
    accountId: accountId ? String(accountId) : null,
    role: role ? String(role) : null,
  };
}

function toNum(value: unknown): number | null {
  if (value == null || value === "") return null;
  const n = Number(value);
  return Number.isFinite(n) ? n : null;
}

const CREDENTIAL_SECRET =
  process.env.NEXT_PUBLIC_CREDENTIAL_SECRET ||
  process.env.CREDENTIAL_SECRET ||
  "SYNC_SECRET";

const EXT_SERVICE = "extensiv";

function decryptExtensivCredentials(
  raw: any,
): { client_id: string; client_secret: string; extensiv_id: string } | null {
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

  const res = await fetch("https://secure-wms.com/AuthServer/api/Token", {
    method: "POST",
    headers: {
      Accept: "application/json",
      "Content-Type": "application/x-www-form-urlencoded",
      Authorization: `Basic ${basic}`,
    },
    body: formBody.toString(),
  });

  const txt = await res.text();
  let json: any = null;
  try {
    json = txt ? JSON.parse(txt) : null;
  } catch {
    json = null;
  }

  if (res.ok && (json?.access_token || json?.token)) {
    return json.access_token || json.token;
  }

  throw new Error(
    json?.error_description || json?.error || txt || "Extensiv token failed",
  );
}

async function fetchExtensivItems(params: {
  token: string;
  customerId: string;
  page: number;
  pageSize: number;
  term: string;
}) {
  const { token, customerId, page, pageSize, term } = params;
  const headers = {
    Authorization: `Bearer ${token}`,
    Accept: "application/json",
  };

  // Extensiv supports pagination via pgsiz / pgnum.
  console.log("customerIs", customerId);

  const url = new URL(`https://secure-wms.com/customers/${customerId}/items`);
  // const url = new URL(`https://secure-wms.com/customers/2/items`);
  url.searchParams.set("pgsiz", String(pageSize));
  url.searchParams.set("pgnum", String(page));

  const res = await fetch(url.toString(), { headers });
  const text = await res.text();
  let json: any = null;
  try {
    json = text ? JSON.parse(text) : null;
  } catch {
    json = null;
  }

  if (!res.ok) {
    throw new Error(
      json?.error || json?.message || json?.Error || text || res.statusText,
    );
  }

  let items: any[] = Array.isArray(json?.ResourceList)
    ? json.ResourceList
    : Array.isArray(json)
      ? json
      : [];
  // console.log("fetched items", items, items.length);

  // Always filter out deactivated records at the API layer (extensiv does not support deactivated query param)
  // items = items.filter((it) => {
  //   const isDeactivated =
  //     it?.Deactivated === true ||
  //     it?.ReadOnly?.Deactivated === true ||
  //     String(it?.ReadOnly?.ItemStatus || "").toLowerCase() === "deactivated";
  //   return !isDeactivated;
  // });

  // Client-side term filtering (Extensiv API search filter not documented here)
  const q = term.trim().toLowerCase();
  if (q) {
    items = items.filter((it) => {
      const sku = String(it?.Sku || "").toLowerCase();
      const desc = String(it?.Description || "").toLowerCase();
      return sku.includes(q) || desc.includes(q);
    });
  }

  // Since Extensiv does not support deactivated query filtering, we enforce it in-memory.
  // `total` must reflect the active set shown on UI, not raw extension count.
  const total = items.length;

  return { items, total };
}

async function fetchExtensivCustomersList(token: string) {
  const headers = {
    Authorization: `Bearer ${token}`,
    Accept: "application/json",
  };
  const res = await fetch("https://secure-wms.com/customers", { headers });
  const text = await res.text();
  let json: any = null;
  try {
    json = text ? JSON.parse(text) : null;
  } catch {
    json = null;
  }
  if (!res.ok) {
    throw new Error(
      json?.error || json?.message || json?.Error || text || res.statusText,
    );
  }
  const list = Array.isArray(json?.ResourceList)
    ? json.ResourceList
    : Array.isArray(json)
      ? json
      : [];
  return list;
}

async function resolveExtensivCustomerId(opts: {
  clientIdParam: string;
  callerAccountId: string;
  supabase: any;
}): Promise<string | null> {
  const { clientIdParam, callerAccountId, supabase } = opts;

  // ext-123 or numeric
  if (clientIdParam.startsWith("ext-")) {
    return clientIdParam.slice(4);
  }
  if (/^\d+$/.test(clientIdParam)) {
    return clientIdParam;
  }

  // Try channels.external_id (Extensiv)
  const { data: ch } = await supabase
    .from("channels")
    .select("external_id")
    .eq("account_id", callerAccountId)
    .eq("source", EXT_SERVICE)
    .or(`id.eq.${clientIdParam},external_id.eq.${clientIdParam}`)
    .maybeSingle();

  const extId = String(ch?.external_id ?? "").trim();
  if (extId && /^\d+$/.test(extId)) return extId;

  // Fallback: first Extensiv channel for this account
  const { data: chAny } = await supabase
    .from("channels")
    .select("external_id")
    .eq("account_id", callerAccountId)
    .eq("source", EXT_SERVICE)
    .limit(1);

  const fallback = String(chAny?.[0]?.external_id ?? "").trim();
  if (fallback && /^\d+$/.test(fallback)) return fallback;

  return null;
}

async function canAccessClientAccount(
  supabase: any,
  callerAccountId: string,
  callerRole: string | null,
  clientId: string,
): Promise<boolean> {
  if (callerAccountId === clientId) return true;

  const elevated = new Set(["admin", "superadmin", "staff-admin"]);
  if (!callerRole || !elevated.has(callerRole)) return false;

  const { data, error } = await supabase
    .from("accounts")
    .select("id, parent_account_id")
    .eq("id", clientId)
    .maybeSingle();

  if (error) return false;
  if (!data) return false;

  return String((data as any).parent_account_id ?? "") === callerAccountId;
}

export async function GET(req: Request) {
  try {
    const cookieStore = (await cookies()) as any;

    const supabase = createServerClient<Database>(
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
      error: userError,
    } = await supabase.auth.getUser();

    if (userError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Prefer DB account context (users -> accounts.parent_account_id) for consistency
    // with billing routes. Metadata can be stale or child-scoped.
    const { data: meRow, error: meErr } = await (supabase as any)
      .from("users")
      .select("account_id, role")
      .eq("id", user.id)
      .maybeSingle();

    if (meErr || !meRow?.account_id) {
      return NextResponse.json(
        { error: meErr?.message || "Missing account context" },
        { status: 403 },
      );
    }

    const { data: accountRow } = await (supabase as any)
      .from("accounts")
      .select("parent_account_id")
      .eq("id", String(meRow.account_id))
      .maybeSingle();

    const callerAccountId = String(
      (accountRow as any)?.parent_account_id ?? meRow.account_id,
    );
    const callerRole =
      String(
        (meRow as any)?.role ?? getAccountContextFromUser(user).role ?? "",
      ).trim() || null;

    // Define allowed account IDs for draft access
    const allowedAccountIds = [callerAccountId];
    if (meRow.account_id !== callerAccountId) {
      allowedAccountIds.push(String(meRow.account_id));
    }

    const url = new URL(req.url);
    const clientIdParam = String(url.searchParams.get("clientId") ?? "").trim();
    const extCustomerIdParam = String(
      url.searchParams.get("extCustomerId") ??
        url.searchParams.get("customerId") ??
        "",
    ).trim();
    const warehousePublicIdRaw = String(
      url.searchParams.get("warehouseId") ?? "",
    ).trim();
    const warehousePublicId = warehousePublicIdRaw;
    const shipFromName = String(
      url.searchParams.get("shipFromName") ?? "",
    ).trim();
    const term = String(url.searchParams.get("term") ?? "").trim();
    const draftId = String(url.searchParams.get("draftId") ?? "").trim();
    const serviceParam = url.searchParams.get("service")?.toLowerCase().trim();
    const page = Math.max(1, Number(url.searchParams.get("page") ?? 1) || 1);
    const pageSizeRaw = Math.max(
      1,
      Number(url.searchParams.get("pageSize") ?? 10) || 10,
    );

    // Use warehouseId as Extensiv customer selector when clientId is app UUID
    let extensivClientIdParam = clientIdParam;
    if (!extensivClientIdParam && warehousePublicIdRaw.startsWith("ext-")) {
      extensivClientIdParam = warehousePublicIdRaw;
    }
    if (extCustomerIdParam) {
      extensivClientIdParam = extCustomerIdParam;
    }

    // If draftId is provided, fetch draft and extract client extensiv_customer_id
    if (draftId) {
      const { data: draft, error: draftError } = await supabase
        .from("saip_quote_drafts")
        .select("*")
        .eq("id", draftId)
        // .in("account_id", allowedAccountIds)
        .maybeSingle();
      console.log("draft", draft);

      if (draftError) {
        console.error("[products/search] Draft fetch error:", draftError);
      } else if (draft?.preferences) {
        const clientData = draft.preferences as any;
        if (clientData?.extensiv_customer_id) {
          extensivClientIdParam = String(clientData.extensiv_customer_id);
          console.log(
            "[products/search] Using extensiv_customer_id from draft:",
            extensivClientIdParam,
          );
        }
      }
    }

    const pageSize = Math.min(pageSizeRaw, 50);
    const from = (page - 1) * pageSize;
    const to = from + pageSize - 1;

    // Extensiv branch removed: we only serve DB-backed products.

    if (!warehousePublicId) {
      return NextResponse.json(
        { error: "Missing warehouseId" },
        { status: 400 },
      );
    }

    // Kept only for debugging/UI context
    const shipFromKey = String(shipFromName || "")
      .trim()
      .split(" ")[0]; // e.g. "Miami"

    // Resolve to an effective client_account_id (scoped to this caller's parent account)
    let effectiveClientId = clientIdParam || callerAccountId;
    let clientIdResolvedFrom:
      | "client_account_id"
      | "account_id"
      | "user_id"
      | "unknown" = "unknown";

    if (!effectiveClientId) {
      effectiveClientId = callerAccountId;
      clientIdResolvedFrom = "account_id";
    }

    // Primary (and only) source: products_relation joined to products
    let relQuery = (supabase as any)
      .from("products_relation")
      .select(
        `product:products(
             id, sku, name, description, price, available_quantity, physical_qty, on_hold,
             warehouse_name, source,external_id
           )`,
      )
      // .select(
      //   `
      //     product:products (
      //       id, sku, product_name, description, site_price, available, physical_qty, on_hold,
      //       warehouse_name, warehouse_id, raw, parent_account_id, client_account_id, source
      //     )
      //   `,
      //   { count: "exact" },
      // )
      .eq("user_id", user.id);
    // .eq("product.parent_account_id", callerAccountId)
    // .range(from, to);

    // if (effectiveClientId) {
    //   relQuery = relQuery.eq("product.client_account_id", effectiveClientId);
    // }

    // if (candidateWarehouseIds.length > 0) {
    //   relQuery = relQuery.in("product.warehouse_id", candidateWarehouseIds);
    // }

    // if (term.length > 0) {
    //   relQuery = relQuery.or(
    //     `product.sku.ilike.%${term}%,product.description.ilike.%${term}%,product.product_name.ilike.%${term}%`,
    //   );
    // }

    // relQuery = relQuery.range(from, to);

    const { data: relData, error: relErr, count: relCount } = await relQuery;
    console.log("relData", relData);

    if (relErr) {
      return NextResponse.json({ error: relErr.message }, { status: 500 });
    }

    let products =
      (relData ?? [])
        .map((row: any) => row?.product)
        .filter(Boolean)
        .map((p: any) => {
          const raw = p?.raw && typeof p.raw === "object" ? p.raw : {};
          const available =
            toNum(p?.available) ??
            toNum(p?.physical_qty) ??
            toNum((raw as any)?.InventoryAvailableQty) ??
            null;
          const onHold = toNum(p?.on_hold) ?? toNum((raw as any)?.ReservedQty);
          return {
            id: p.id,
            sku: p.sku,
            description: p.description ?? p.name ?? null,
            product_name: p.name ?? p.description ?? null,
            price: toNum(p?.price) ?? null,
            available: p?.available_quantity,
            on_hand: toNum(p?.physical_qty) ?? null,
            allocated: onHold,
            warehouse_id: p.warehouse_id ?? null,
            inventory_warehouse_id: p.warehouse_id ?? null,
            parent_account_id: p.parent_account_id ?? callerAccountId,
            client_account_id: p.client_account_id ?? effectiveClientId,
            source: p.source ?? "db",
            warehouse_name: p.warehouse_name ?? null,
            external_id: p.external_id ?? null,
          };
        }) ?? [];

    const totalCount = relCount ?? products.length;

    return NextResponse.json({
      products,
      pagination: {
        page,
        pageSize,
        total: totalCount,
        totalPages: Math.max(1, Math.ceil((totalCount || 0) / pageSize)),
      },
      shipFromKey,
      effectiveClientId,
      clientIdResolvedFrom,
      warehousePublicId,
    });
  } catch (e: any) {
    return NextResponse.json(
      { error: e?.message || "Unexpected error" },
      { status: 500 },
    );
  }
}
