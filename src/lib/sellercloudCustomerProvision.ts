import { createClient } from "@supabase/supabase-js";
import { sendCustomerCredentialsEmail } from "@/lib/emails/sendCustomerCredentialsEmail";

type SellercloudCandidate = {
  email: string;
  name: string;
  wmsUserIdentifier: string | null;
};

function isValidEmail(value: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
}

function generateSecurePassword(length = 12): string {
  const chars =
    "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*()";
  let password = "";
  for (let i = 0; i < length; i += 1) {
    password += chars[Math.floor(Math.random() * chars.length)];
  }
  return password;
}

function extractSellercloudCandidates(rows: any[]): SellercloudCandidate[] {
  const seen = new Set<string>();
  const candidates: SellercloudCandidate[] = [];

  for (const row of rows || []) {
    const metadata = row?.metadata || {};
    const first = String(metadata?.FirstName || "").trim();
    const last = String(metadata?.LastName || "").trim();
    const fullName = `${first} ${last}`.trim();
    const fallbackName = String(row?.client_name || "").trim();
    const companyName = String(metadata?.CompanyName || "").trim();
    const name = fullName || fallbackName || companyName || "Sellercloud Customer";

    const email = String(metadata?.CustomerEmail || "")
      .trim()
      .toLowerCase();
    if (!isValidEmail(email)) continue;

    const wmsUserIdentifier = String(
      row?.sellercloud_customer_id || metadata?.CustomerID || "",
    ).trim();

    const dedupeKey = wmsUserIdentifier || email || name.toLowerCase();
    if (!dedupeKey || seen.has(dedupeKey)) continue;
    seen.add(dedupeKey);

    candidates.push({
      email,
      name,
      wmsUserIdentifier: wmsUserIdentifier || null,
    });
  }

  return candidates;
}

export async function createSellercloudCustomerLogins(params: {
  admin: ReturnType<typeof createClient>;
  accountId: string;
}) {
  const { admin, accountId } = params;
  const summary = {
    discovered: 0,
    created: 0,
    emailed: 0,
    skipped_existing: 0,
    skipped_invalid: 0,
    errors: [] as string[],
  };

  const { data: scOrders, error: scError } = await admin
    .from("sellercloud_orders")
    .select("client_name, sellercloud_customer_id, metadata")
    .eq("account_id", accountId)
    .order("order_date", { ascending: false })
    .limit(5000);

  if (scError) {
    summary.errors.push(`Failed loading Sellercloud customers: ${scError.message}`);
    return summary;
  }

  const candidates = extractSellercloudCandidates(scOrders || []);
  summary.discovered = candidates.length;

  if (!candidates.length) return summary;

  const { data: existingRows, error: existingError } = await admin
    .from("users")
    .select("email")
    .eq("account_id", accountId)
    .in("role", ["client", "staff-client"]);

  if (existingError) {
    summary.errors.push(
      `Failed loading existing customer users: ${existingError.message}`,
    );
    return summary;
  }

  const existingEmails = new Set(
    (existingRows || [])
      .map((row: any) => String(row?.email || "").trim().toLowerCase())
      .filter(Boolean),
  );

  const authUsersResult = await admin.auth.admin.listUsers({ page: 1, perPage: 1000 });
  const authByEmail = new Map<string, string>();
  if (authUsersResult.error) {
    summary.errors.push(
      `Failed loading auth users for duplicate resolution: ${authUsersResult.error.message}`,
    );
  } else {
    for (const authUser of authUsersResult.data.users || []) {
      const email = String(authUser?.email || "").trim().toLowerCase();
      if (!email) continue;
      authByEmail.set(email, authUser.id);
    }
  }

  for (const candidate of candidates) {
    if (!candidate.email) {
      summary.skipped_invalid += 1;
      continue;
    }

    if (existingEmails.has(candidate.email)) {
      summary.skipped_existing += 1;
      continue;
    }

    const temporaryPassword = generateSecurePassword(12);
    let userId: string | null = authByEmail.get(candidate.email) || null;

    if (userId) {
      const { error: existingAuthUpdateError } = await admin.auth.admin.updateUserById(
        userId,
        {
          password: temporaryPassword,
          email_confirm: true,
          user_metadata: {
            name: candidate.name,
            account_id: accountId,
            customer_auth_type: "wms_extensiv",
            wms_user_identifier: candidate.wmsUserIdentifier,
            customer_source: "sellercloud",
          },
          app_metadata: {
            role: "client",
          },
        },
      );
      if (existingAuthUpdateError) {
        summary.errors.push(
          `Failed updating existing auth user for ${candidate.email}: ${existingAuthUpdateError.message}`,
        );
        continue;
      }
    } else {
      const { data: authData, error: authError } =
        await admin.auth.admin.createUser({
          email: candidate.email,
          password: temporaryPassword,
          email_confirm: true,
          user_metadata: {
            name: candidate.name,
            account_id: accountId,
            customer_auth_type: "wms_extensiv",
            wms_user_identifier: candidate.wmsUserIdentifier,
            customer_source: "sellercloud",
          },
          app_metadata: {
            role: "client",
          },
        });

      if (authError || !authData?.user?.id) {
        summary.errors.push(
          `Failed creating auth user for ${candidate.email}: ${authError?.message || "Unknown error"}`,
        );
        continue;
      }
      userId = authData.user.id;
      authByEmail.set(candidate.email, userId);
    }

    if (!userId) {
      summary.errors.push(`Failed resolving auth user id for ${candidate.email}`);
      continue;
    }

    const { error: userUpsertError } = await admin.from("users").upsert(
      {
        id: userId,
        name: candidate.name,
        email: candidate.email,
        role: "client",
        account_id: accountId,
        created_by_user_id: null,
      },
      { onConflict: "id" },
    );

    if (userUpsertError) {
      summary.errors.push(
        `Failed upserting public user for ${candidate.email}: ${userUpsertError.message}`,
      );
      continue;
    }

    existingEmails.add(candidate.email);
    summary.created += 1;

    try {
      await sendCustomerCredentialsEmail({
        to: candidate.email,
        customerName: candidate.name,
        authType: "wms_extensiv",
        password: temporaryPassword,
        wmsUserIdentifier: candidate.wmsUserIdentifier,
      });
      summary.emailed += 1;
    } catch (emailError: any) {
      summary.errors.push(
        `User ${candidate.email} created but email failed: ${emailError?.message || "Unknown email error"}`,
      );
    }
  }

  return summary;
}
