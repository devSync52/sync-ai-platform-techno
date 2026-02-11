import { createServerSupabaseClient } from "@/lib/supabase-server";
import DashboardClient from "./DashboardClient";

export default async function DashboardPage() {
  const supabase = await createServerSupabaseClient();

  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();
  console.log("user", user);

  if (userError || !user) {
    throw new Error("User not authenticated");
  }

  return <DashboardClient userId={user.id} />;
}
