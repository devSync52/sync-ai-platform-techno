import { createServerSupabaseClient } from "@/lib/supabase-server";
import { supabaseAdmin } from "@/lib/supabaseAdmin";
import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest) {
    const supabase = await createServerSupabaseClient();
    const { data: { user }, error: authError, } = await supabase.auth.getUser();

    if (authError || !user) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);

    const page = searchParams.get("page") ? Math.max(Number(searchParams.get("page") || "1"), 1) : null;
    const pageSize = searchParams.get("pageSize") ? Math.max(Number(searchParams.get("pageSize") || "10"), 1) : null;
    const providerId = searchParams.get("providerId");

    const ordersJoin = `*,warehouse:warehouses!inner(*,provider:integrations!warehouses_provider_id_fkey(*))`;

    let countQuery = supabaseAdmin.from("warehouses_relation").select(ordersJoin, { count: "exact", head: true }).eq("user_id", user.id).not("warehouse_id", "is", null);
    let relationQuery = supabaseAdmin.from("warehouses_relation").select(ordersJoin).eq("user_id", user.id).not("warehouse_id", "is", null).order("created_at", { ascending: false });

    if (providerId) {
        countQuery = countQuery.eq("orders.provider_id", providerId);
        relationQuery = relationQuery.eq("orders.provider_id", providerId);
    }

    const { count } = await countQuery;

    if (page && pageSize) {
        const offset = (page - 1) * pageSize;
        const { data, error } = await relationQuery.range(offset, offset + pageSize);

        if (error) {
            return NextResponse.json({ error: error.message }, { status: 500 });
        }

        return NextResponse.json({ rows: data, totalCount: count || 0 });
    }

    const { data, error } = await relationQuery

    if (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json(data);
}