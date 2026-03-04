import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseAdmin";

function isValidEmail(value: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
}

async function existsInAuthUsers(email: string) {
  const normalizedEmail = email.trim().toLowerCase();
  const perPage = 1000;
  const maxPages = 20;

  for (let page = 1; page <= maxPages; page += 1) {
    const result = await supabaseAdmin.auth.admin.listUsers({ page, perPage });
    if (result.error) {
      throw new Error(result.error.message);
    }

    const users = result.data.users ?? [];
    const hasMatch = users.some(
      (user) => (user.email ?? "").trim().toLowerCase() === normalizedEmail,
    );
    if (hasMatch) return true;

    if (users.length < perPage) break;
  }

  return false;
}

export async function GET(req: NextRequest) {
  const email = (req.nextUrl.searchParams.get("email") ?? "").trim().toLowerCase();
  if (!email) {
    return NextResponse.json({ error: "Email is required" }, { status: 400 });
  }
  if (!isValidEmail(email)) {
    return NextResponse.json({ error: "Invalid email format" }, { status: 400 });
  }

  try {
    // Fast path: most users are mirrored in public.users.
    const { data: localUser, error: localUserError } = await supabaseAdmin
      .from("users")
      .select("id")
      .eq("email", email)
      .maybeSingle();

    if (localUserError) {
      return NextResponse.json({ error: localUserError.message }, { status: 500 });
    }
    if (localUser) {
      return NextResponse.json({ exists: true });
    }

    const existsInAuth = await existsInAuthUsers(email);
    return NextResponse.json({ exists: existsInAuth });
  } catch (error) {
    const message =
      error instanceof Error
        ? error.message
        : typeof error === "string"
          ? error
          : "Unexpected error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

