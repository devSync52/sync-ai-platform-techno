import { createServerSupabaseClient } from "@/lib/supabase-server";

export type SuperadminAuthResult =
  | { ok: true; userId: string }
  | { ok: false; status: number; error: string };

export async function requireSuperadmin(): Promise<SuperadminAuthResult> {
  const supabase = await createServerSupabaseClient();

  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    return { ok: false, status: 401, error: "Unauthorized" };
  }

  const { data: currentUser, error: roleError } = await supabase
    .from("users")
    .select("role")
    .eq("id", user.id)
    .maybeSingle();

  if (roleError) {
    return { ok: false, status: 500, error: roleError.message };
  }

  if (currentUser?.role !== "superadmin") {
    return { ok: false, status: 403, error: "Forbidden" };
  }

  return { ok: true, userId: user.id };
}
