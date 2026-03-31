import { createClient } from "@supabase/supabase-js";
import { cookies } from "next/headers";
import { createServerClient } from "@supabase/ssr";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
);

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const userIdParam = searchParams.get("user_id");
  const sourceParam = searchParams.get("source")?.trim().toLowerCase();

  // Resolve user id from session if not provided
  let userId = userIdParam;
  if (!userId) {
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
    const { data: authData } = await userClient.auth.getUser();
    userId = authData?.user?.id ?? null;
  }

  if (!userId) {
    return new Response(JSON.stringify({ error: "Not authenticated" }), {
      status: 401,
    });
  }

  const { data, error } = await supabase
    .from("products_relation")
    .select(`product:products (*)`)
    .eq("user_id", userId);

  if (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: Number(error.code) || 400,
    });
  }

  let products = (data ?? [])
    .map((row: any) => row?.product)
    .filter(Boolean)
    .map((p: any) => {
      const meta = (p as any)?.meta ?? {};
      const raw = (p as any)?.raw ?? {};
      const warehouse =
        p.warehouse_name ??
        meta.WarehouseName ??
        raw.WarehouseName ??
        "default";
      const warehouseId =
        p.warehouse_id ??
        meta.warehouse_id ??
        raw.warehouse_id ??
        meta.WarehouseId ??
        raw.WarehouseId ??
        null;
      const name =
        p.product_name ??
        p.name ??
        meta.ProductName ??
        raw.ProductName ??
        null;
      const image =
        p.image ??
        meta.image ??
        raw.image ??
        meta.Image ??
        raw.Image ??
        null;
      const sku =
        p.sku ??
        meta.ID ??
        raw.ID ??
        p.external_id ??
        p.id ??
        null;
      const available =
        p.available ??
        p.available_quantity ??
        p.quantity ??
        p.physical_qty ??
        meta.InventoryAvailableQty ??
        meta.AggregatedQty ??
        meta.AggregateQty ??
        null;
      const onHold =
        p.on_hold ??
        meta.ReservedQty ??
        meta.ReserveQtyTotalValue ??
        raw.ReservedQty ??
        null;
      const company = p.account_name ?? meta.CompanyName ?? raw.CompanyName ?? null;

      return {
        ...p,
        sku,
        product_name: name,
        description: p.description ?? name,
        image,
        available,
        on_hold: onHold,
        warehouse_name: warehouse,
        warehouse_id: warehouseId,
        account_name: company,
      };
    });

  // Resolve warehouse names when warehouse_id is present
  const warehouseIds = Array.from(
    new Set(
      products
        .map((p: any) => p?.warehouse_id)
        .filter((v): v is string => !!v),
    ),
  );

  if (warehouseIds.length) {
    const { data: warehouses, error: whError } = await supabase
      .from("warehouses")
      .select("id,name")
      .in("id", warehouseIds);

    if (!whError && warehouses) {
      const map = new Map(warehouses.map((w: any) => [String(w.id), w.name]));
      products = products.map((p: any) => ({
        ...p,
        warehouse_name:
          map.get(String(p.warehouse_id)) ??
          p.warehouse_name ??
          "default",
      }));
    }
  }

  if (sourceParam) {
    products = products.filter(
      (p: any) => String(p?.source || "").toLowerCase() === sourceParam,
    );
  }

  const sources = Array.from(
    new Set(products.map((p: any) => p?.source).filter(Boolean) as string[]),
  );

  return new Response(JSON.stringify({ products, sources }), { status: 200 });
}

// POST not supported in this simplified handler
export async function POST() {
  return new Response(JSON.stringify({ error: "Not implemented" }), {
    status: 405,
  });
}
