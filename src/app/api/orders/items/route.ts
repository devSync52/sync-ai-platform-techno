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
  const orderId = searchParams.get("orderId");

  if (!orderId) {
    return NextResponse.json({ error: "orderId query param is required" }, { status: 400 });
  }

  // Validate that the user is related to this order via order_relation
  const { data: relation, error: relationError } = await supabaseAdmin.from("order_relation").select("order_id").eq("user_id", user.id).eq("order_id", orderId).maybeSingle();

  if (relationError) {
    return NextResponse.json(
      { error: relationError.message },
      { status: 500 },
    );
  }

  if (!relation) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { data, error } = await supabaseAdmin.from("ordered_products").select(`id, order_id, product_id, quantity, price, meta, external_id, created_at, product:product_id (id, sku, product_name, site_price, raw)`).eq("order_id", orderId);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ items: data || [] });
}
