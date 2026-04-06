import { NextRequest, NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase-server";
import { supabaseAdmin } from "@/lib/supabaseAdmin";

export async function GET(req: NextRequest) {
  const supabase = await createServerSupabaseClient();
  const { data: { user }, error: authError, } = await supabase.auth.getUser();

  if (authError || !user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const page = Math.max(Number(searchParams.get("page") || "1"), 1);
  const pageSize = Math.max(Number(searchParams.get("pageSize") || "10"), 1);
  const providerId = searchParams.get("providerId");
  const startDate = searchParams.get("startDate");
  const endDate = searchParams.get("endDate");
  const warehouseId = searchParams.get("warehouseId");
  const search = searchParams.get("search")?.trim() || "";

  const offset = (page - 1) * pageSize;

  const ordersJoin = `*,orders!inner(*,provider:integrations!orders_provider_id_fkey(*),ordered_products(*,product:products!ordered_products_product_id_fkey(*,warehouse:warehouses!products_warehouse_id_fkey(*))))`;

  let countQuery = supabaseAdmin.from("order_relation").select(ordersJoin, { count: "exact", head: true }).eq("user_id", user.id).not("order_id", "is", null);
  let relationQuery = supabaseAdmin.from("order_relation").select(ordersJoin).eq("user_id", user.id).not("order_id", "is", null).order("created_at", { ascending: false });

  if (providerId) {
    countQuery = countQuery.eq("orders.provider_id", providerId);
    relationQuery = relationQuery.eq("orders.provider_id", providerId);
  }

  if (startDate) {
    countQuery = countQuery.gte("orders.created_at", `${startDate}T00:00:00.000Z`);
    relationQuery = relationQuery.gte("orders.created_at", `${startDate}T00:00:00.000Z`);
  }

  if (endDate) {
    countQuery = countQuery.lte("orders.created_at", `${endDate}T23:59:59.999Z`);
    relationQuery = relationQuery.lte("orders.created_at", `${endDate}T23:59:59.999Z`);
  }

  if (search) {
    const filter = `order_number.ilike.%${search}%,order_source_order_id.ilike.%${search}%`;
    countQuery = countQuery.or(filter, { referencedTable: "orders" });
    relationQuery = relationQuery.or(filter, { referencedTable: "orders" });
  }

  const { count } = await countQuery;
  const { data: relationData, error: relationError } = await relationQuery.range(offset, offset + pageSize - 1);

  if (relationError) {
    console.log("Error fetching relation data:", relationError);
    return NextResponse.json({ error: relationError.message }, { status: 500 });
  }

  const formattedData = relationData?.map((relation) => {
    const order = relation.orders;
    const warehouses = new Set<string>();
    (order?.ordered_products || []).forEach((op: any) => {
      const warehouse = op?.product?.warehouse;
      if (warehouse) warehouses.add(warehouse.name);
    });
    return { ...relation, orders: { ...order, warehouse_names: Array.from(warehouses).join(", ") } };
  });

  const filteredData = warehouseId ? formattedData?.filter((relation) => (relation.orders?.ordered_products || []).some((op: any) => String(op?.product?.warehouse?.id) == warehouseId)) : formattedData;

  return NextResponse.json({ rows: filteredData, totalCount: warehouseId ? (filteredData?.length ?? 0) : (count || 0) });
}
