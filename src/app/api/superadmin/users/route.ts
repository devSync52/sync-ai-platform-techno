import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseAdmin";
import { requireSuperadmin } from "@/lib/superadmin";

export async function GET(req: NextRequest) {
  const auth = await requireSuperadmin();
  if (!auth.ok) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  const role = req.nextUrl.searchParams.get("role");

  let usersQuery = supabaseAdmin
    .from("users")
    .select(
      "id, name, email, phone, role, account_id, plan_id, created_by_user_id, created_at, last_login_at, has_logged_in",
    )
    .order("created_at", { ascending: false });

  if (role) {
    usersQuery = usersQuery.eq("role", role);
  }

  const { data: users, error: usersError } = await usersQuery;

  if (usersError) {
    return NextResponse.json({ error: usersError.message }, { status: 500 });
  }

  const { data: details, error: detailsError } = await supabaseAdmin
    .from("user_details")
    .select(
      "id, avatar_url, gender, birth_date, address_line_1, address_line_2, city, state, country, postal_code",
    );
  if (detailsError) {
    return NextResponse.json({ error: detailsError.message }, { status: 500 });
  }

  const detailsById = new Map((details ?? []).map((row) => [row.id, row]));

  const accountIds = Array.from(
    new Set((users ?? []).map((user) => user.account_id).filter(Boolean)),
  ) as string[];
  let accountsById = new Map<string, any>();
  if (accountIds.length > 0) {
    const { data: accounts, error: accountsError } = await supabaseAdmin
      .from("accounts")
      .select(
        "id, name, tax_id, phone, email, website, address_line_1, address_line_2, city, state, zip_code, country, status",
      )
      .in("id", accountIds);
    if (accountsError) {
      return NextResponse.json({ error: accountsError.message }, { status: 500 });
    }
    accountsById = new Map((accounts ?? []).map((account) => [account.id, account]));
  }

  const authUsers = await supabaseAdmin.auth.admin.listUsers({
    page: 1,
    perPage: 1000,
  });
  if (authUsers.error) {
    return NextResponse.json({ error: authUsers.error.message }, { status: 500 });
  }

  const now = Date.now();
  const statusById = new Map<string, "active" | "disabled">();
  for (const authUser of authUsers.data.users ?? []) {
    const bannedUntil = authUser.banned_until
      ? new Date(authUser.banned_until).getTime()
      : 0;
    statusById.set(authUser.id, bannedUntil > now ? "disabled" : "active");
  }

  return NextResponse.json({
    users: (users ?? []).map((user) => ({
      ...user,
      user_details: detailsById.get(user.id) ?? null,
      account: user.account_id ? accountsById.get(user.account_id) ?? null : null,
      status: statusById.get(user.id) ?? "active",
    })),
  });
}
