import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseAdmin";
import { requireSuperadmin } from "@/lib/superadmin";

const ALLOWED_ROLES = new Set([
  "superadmin",
  "admin",
  "staff-admin",
  "staff-user",
  "staff-client",
  "client",
]);

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ userId: string }> },
) {
  const auth = await requireSuperadmin();
  if (!auth.ok) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  const { userId } = await params;
  if (!userId) {
    return NextResponse.json({ error: "Missing userId" }, { status: 400 });
  }

  let body: {
    role?: string;
    planId?: string | null;
    status?: "active" | "disabled";
    name?: string | null;
    email?: string;
    phone?: string | null;
    gender?: string | null;
    birth_date?: string | null;
    address_line_1?: string | null;
    address_line_2?: string | null;
    city?: string | null;
    state?: string | null;
    country?: string | null;
    postal_code?: string | null;
    account_name?: string | null;
    account_email?: string | null;
    account_phone?: string | null;
    account_website?: string | null;
    account_tax_id?: string | null;
    account_address_line_1?: string | null;
    account_address_line_2?: string | null;
    account_city?: string | null;
    account_state?: string | null;
    account_zip_code?: string | null;
    account_country?: string | null;
    account_status?: string | null;
  };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const updates: Record<string, string | null> = {};
  const userDetailsUpdates: Record<string, string | null> = {};
  const accountUpdates: Record<string, string | null> = {};

  if (typeof body.role === "string") {
    if (!ALLOWED_ROLES.has(body.role)) {
      return NextResponse.json({ error: "Invalid role" }, { status: 400 });
    }
    updates.role = body.role;
  }

  if ("planId" in body) {
    updates.plan_id = body.planId ?? null;
  }
  if ("name" in body) {
    updates.name = body.name ?? null;
  }
  if ("phone" in body) {
    updates.phone = body.phone ?? null;
  }
  if (typeof body.email === "string") {
    const normalizedEmail = body.email.trim().toLowerCase();
    if (!normalizedEmail) {
      return NextResponse.json({ error: "Invalid email" }, { status: 400 });
    }
    updates.email = normalizedEmail;
  }
  if ("gender" in body) userDetailsUpdates.gender = body.gender ?? null;
  if ("birth_date" in body) userDetailsUpdates.birth_date = body.birth_date ?? null;
  if ("address_line_1" in body) userDetailsUpdates.address_line_1 = body.address_line_1 ?? null;
  if ("address_line_2" in body) userDetailsUpdates.address_line_2 = body.address_line_2 ?? null;
  if ("city" in body) userDetailsUpdates.city = body.city ?? null;
  if ("state" in body) userDetailsUpdates.state = body.state ?? null;
  if ("country" in body) userDetailsUpdates.country = body.country ?? null;
  if ("postal_code" in body) userDetailsUpdates.postal_code = body.postal_code ?? null;
  if ("account_name" in body) accountUpdates.name = body.account_name ?? null;
  if ("account_email" in body) accountUpdates.email = body.account_email ?? null;
  if ("account_phone" in body) accountUpdates.phone = body.account_phone ?? null;
  if ("account_website" in body) accountUpdates.website = body.account_website ?? null;
  if ("account_tax_id" in body) accountUpdates.tax_id = body.account_tax_id ?? null;
  if ("account_address_line_1" in body)
    accountUpdates.address_line_1 = body.account_address_line_1 ?? null;
  if ("account_address_line_2" in body)
    accountUpdates.address_line_2 = body.account_address_line_2 ?? null;
  if ("account_city" in body) accountUpdates.city = body.account_city ?? null;
  if ("account_state" in body) accountUpdates.state = body.account_state ?? null;
  if ("account_zip_code" in body) accountUpdates.zip_code = body.account_zip_code ?? null;
  if ("account_country" in body) accountUpdates.country = body.account_country ?? null;
  if ("account_status" in body) accountUpdates.status = body.account_status ?? null;

  const hasStatusUpdate = body.status === "active" || body.status === "disabled";
  const hasUserDetailsUpdate = Object.keys(userDetailsUpdates).length > 0;
  const hasAccountUpdate = Object.keys(accountUpdates).length > 0;
  if (
    Object.keys(updates).length === 0 &&
    !hasStatusUpdate &&
    !hasUserDetailsUpdate &&
    !hasAccountUpdate
  ) {
    return NextResponse.json({ error: "No fields to update" }, { status: 400 });
  }

  let updatedUser:
    | { id: string; role: string; plan_id: string | null; account_id: string | null }
    | null = null;
  if (Object.keys(updates).length > 0) {
    const { data, error: updateError } = await supabaseAdmin
      .from("users")
      .update(updates)
      .eq("id", userId)
      .select("id, role, plan_id, account_id")
      .maybeSingle();

    if (updateError) {
      return NextResponse.json({ error: updateError.message }, { status: 500 });
    }

    if (!data) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }
    updatedUser = data;
  } else {
    const { data, error } = await supabaseAdmin
      .from("users")
      .select("id, role, plan_id, account_id")
      .eq("id", userId)
      .maybeSingle();
    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
    if (!data) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }
    updatedUser = data;
  }

  if (updates.role) {
    const { error: authUpdateError } = await supabaseAdmin.auth.admin.updateUserById(
      userId,
      {
        app_metadata: { role: updates.role },
      },
    );

    if (authUpdateError) {
      return NextResponse.json({ error: authUpdateError.message }, { status: 500 });
    }
  }

  if (updates.email) {
    const { error: emailUpdateError } = await supabaseAdmin.auth.admin.updateUserById(userId, {
      email: updates.email,
    });
    if (emailUpdateError) {
      return NextResponse.json({ error: emailUpdateError.message }, { status: 500 });
    }
  }

  if (hasStatusUpdate) {
    const { error: statusError } = await supabaseAdmin.auth.admin.updateUserById(userId, {
      ban_duration: body.status === "disabled" ? "876000h" : "none",
    });
    if (statusError) {
      return NextResponse.json({ error: statusError.message }, { status: 500 });
    }
  }

  if (hasUserDetailsUpdate) {
    const { error: userDetailsError } = await supabaseAdmin.from("user_details").upsert(
      {
        id: userId,
        ...userDetailsUpdates,
        updated_at: new Date().toISOString(),
      },
      { onConflict: "id" },
    );
    if (userDetailsError) {
      return NextResponse.json({ error: userDetailsError.message }, { status: 500 });
    }
  }

  if (hasAccountUpdate) {
    const accountId = updatedUser?.account_id ?? null;
    if (!accountId) {
      return NextResponse.json(
        { error: "User does not have an account to update" },
        { status: 400 },
      );
    }
    const { error: accountUpdateError } = await supabaseAdmin
      .from("accounts")
      .update({
        ...accountUpdates,
        updated_at: new Date().toISOString(),
      })
      .eq("id", accountId);
    if (accountUpdateError) {
      return NextResponse.json({ error: accountUpdateError.message }, { status: 500 });
    }
  }

  return NextResponse.json({ success: true, user: updatedUser });
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ userId: string }> },
) {
  const auth = await requireSuperadmin();
  if (!auth.ok) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  const { userId } = await params;
  if (!userId) {
    return NextResponse.json({ error: "Missing userId" }, { status: 400 });
  }
  if (userId === auth.userId) {
    return NextResponse.json(
      { error: "You cannot delete your own superadmin user" },
      { status: 400 },
    );
  }

  await supabaseAdmin.from("user_details").delete().eq("id", userId);

  const { error: publicDeleteError } = await supabaseAdmin
    .from("users")
    .delete()
    .eq("id", userId);

  if (publicDeleteError) {
    return NextResponse.json({ error: publicDeleteError.message }, { status: 500 });
  }

  const { error: authDeleteError } = await supabaseAdmin.auth.admin.deleteUser(userId);
  if (authDeleteError) {
    return NextResponse.json({ error: authDeleteError.message }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}
