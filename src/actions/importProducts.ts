"use server";

import { createClient } from "@supabase/supabase-js";
import { syncExtensivProductsAction } from "@/actions/extensivProducts";

export async function importProductsByAccountAction(
  accountId: string,
  source: "sellercloud" | "extensiv" | "magaya",
) {
  try {
    // Extensiv sync runs in-process (no Edge function)
    if (source === "extensiv") {
      // Ensure channels exist; otherwise the sync is a no-op.
      const supabaseUrl =
        process.env.NEXT_PUBLIC_SUPABASE_URL ?? process.env.SUPABASE_URL;
      const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

      if (supabaseUrl && serviceRoleKey) {
        const admin = createClient(supabaseUrl, serviceRoleKey, {
          auth: { autoRefreshToken: false, persistSession: false },
        });

        const { count: channelCount } = await admin
          .from("channels")
          .select("id", { count: "exact", head: true })
          .eq("account_id", accountId)
          .eq("source", "extensiv");

        if (!channelCount || channelCount === 0) {
          // Populate Extensiv channels first (same as /api/sync-channels)
          await fetch(`${supabaseUrl}/functions/v1/sync-customers-extensiv`, {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${serviceRoleKey}`,
            },
            body: JSON.stringify({ account_id: accountId }),
          });
        }
      }

      const result = await syncExtensivProductsAction({ accountId });
      if (!result.success)
        throw new Error(result.message || "Failed to import products");
      return { success: true, ...result };
    }

    // Other sources still use their Edge functions
    const functionPath =
      source === "sellercloud"
        ? "import_sellercloud_products"
        : source === "magaya"
          ? "sync_magaya_products"
          : null

    if (!functionPath) throw new Error("Invalid source selected");

    const response = await fetch(
      `${process.env.NEXT_PUBLIC_SUPABASE_URL}/functions/v1/${functionPath}`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${process.env.SUPABASE_SERVICE_ROLE_KEY!}`,
        },
        body: JSON.stringify({ account_id: accountId }),
      }
    )

    const result = await response.json()

    if (!response.ok) {
      throw new Error(result.error || "Failed to import products");
    }

    return { success: true, ...result };
  } catch (err: any) {
    console.error("[importProductsByAccountAction] Erro:", err.message);
    return { success: false, message: err.message };
  }
}
