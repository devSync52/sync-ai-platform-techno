import { createServerComponentClient } from "@supabase/auth-helpers-nextjs";
import { cookies } from "next/headers";
import { NextRequest, NextResponse } from "next/server";

export async function GET() {
  const supabase = createServerComponentClient({ cookies });
  const { data: { session } } = await supabase.auth.getSession();

  const { data: user } = await supabase
    .from("users")
    .select("account_id")
    .eq("id", session?.user.id)
    .single();

  const { data, error } = await supabase
    .from("ai_settings")
    .select("*")
    .eq("account_id", user?.account_id)
    .single();

  if (error) {
    return NextResponse.json({
      model: "gpt-4",
      max_tokens: 100000,
      auto_reply_enabled: false,
      access_orders: true,
      access_inventory: true,
      access_sales: true,
    });
  }

  return NextResponse.json(data);
}

export async function POST(req: NextRequest) {
  const supabase = createServerComponentClient({ cookies });
  const { data: { session } } = await supabase.auth.getSession();
  const body = await req.json();

  const { data: user } = await supabase
    .from("users")
    .select("account_id")
    .eq("id", session?.user.id)
    .single();

  const { data: existing } = await supabase
    .from("ai_settings")
    .select("id")
    .eq("account_id", user?.account_id)
    .single();

  let response;

  if (existing) {
    response = await supabase
      .from("ai_settings")
      .update({ ...body })
      .eq("account_id", user?.account_id);
  } else {
    response = await supabase
      .from("ai_settings")
      .insert({ ...body, account_id: user?.account_id });
  }

  if (response.error) {
    return NextResponse.json({ error: response.error.message }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}