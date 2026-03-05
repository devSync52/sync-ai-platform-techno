import { createClient } from "@supabase/supabase-js";

type SellercloudCandidate = {
  email: string;
  name: string;
  wmsUserIdentifier: string | null;
};

function isValidEmail(value: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
}

function generateSecurePassword(length = 12): string {
  return "12345678";
}

async function sendCustomerInviteLikeTeam(params: {
  email: string;
  password: string;
  name: string;
  accountId: string;
  invitedBy: string;
}) {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRole = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!supabaseUrl || !serviceRole) {
    throw new Error("Missing Supabase configuration for staff invite function");
  }

  const response = await fetch(
    `${supabaseUrl}/functions/v1/send_staff_invite_custom`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${serviceRole}`,
      },
      body: JSON.stringify({
        email: params.email,
        password: params.password,
        name: params.name,
        role: "staff-user",
        accountId: params.accountId,
        invitedBy: params.invitedBy,
      }),
    },
  );

  const result = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(
      result?.error || result?.message || "Failed sending invite",
    );
  }
  return result;
}

async function resendCustomerInviteLikeTeam(params: {
  email: string;
  password: string;
  name: string;
  accountId: string;
  invitedBy: string;
}) {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRole = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!supabaseUrl || !serviceRole) {
    throw new Error(
      "Missing Supabase configuration for resend invite function",
    );
  }

  const response = await fetch(
    `${supabaseUrl}/functions/v1/send_staff_invite_custom`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${serviceRole}`,
      },
      body: JSON.stringify({
        email: params.email,
        password: params.password,
        name: params.name,
        role: "staff-user",
        accountId: params.accountId,
        invitedBy: params.invitedBy,
      }),
    },
  );

  const result = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(
      result?.error || result?.message || "Failed resending invite",
    );
  }
  return result;
}

async function ensureInviteLogForResend(params: {
  admin: ReturnType<typeof createClient>;
  accountId: string;
  email: string;
  invitedBy: string;
}) {
  const { admin, accountId, email, invitedBy } = params;
  const { error } = await admin.from("invite_logs").insert({
    account_id: accountId,
    email,
    invited_by: invitedBy,
    role: "staff-user",
    status: "sent",
    type: "staff_invite",
    message: "Customer invite generated from Sellercloud sync",
  });

  if (error) {
    // Non-fatal: resend may still work if an invite log already exists.
    console.warn("[sellercloud][invite-log] warning:", error.message);
  }
}

function isAlreadyRegisteredError(message: string): boolean {
  const text = String(message || "").toLowerCase();
  return (
    text.includes("already been registered") ||
    text.includes("already registered") ||
    text.includes("already exists")
  );
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
    const name =
      fullName || fallbackName || companyName || "Sellercloud Customer";

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
  inviteAccountId?: string;
}) {
  const { admin, accountId, inviteAccountId } = params;
  const accountIdForInvite = inviteAccountId || accountId;
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
    summary.errors.push(
      `Failed loading Sellercloud customers: ${scError.message}`,
    );
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
      .map((row: any) =>
        String(row?.email || "")
          .trim()
          .toLowerCase(),
      )
      .filter(Boolean),
  );

  const authUsersResult = await admin.auth.admin.listUsers({
    page: 1,
    perPage: 1000,
  });
  const authByEmail = new Map<string, string>();
  if (authUsersResult.error) {
    summary.errors.push(
      `Failed loading auth users for duplicate resolution: ${authUsersResult.error.message}`,
    );
  } else {
    for (const authUser of authUsersResult.data.users || []) {
      const email = String(authUser?.email || "")
        .trim()
        .toLowerCase();
      if (!email) continue;
      authByEmail.set(email, authUser.id);
    }
  }

  const { data: accountRow, error: accountError } = await admin
    .from("accounts")
    .select("created_by_user_id")
    .eq("id", accountIdForInvite)
    .maybeSingle();
  let invitedBy = String(accountRow?.created_by_user_id || "").trim();
  if (accountError) {
    summary.errors.push(
      `Failed loading account owner: ${accountError.message}`,
    );
  }
  if (!invitedBy) {
    const { data: fallbackInviter, error: fallbackInviterError } = await admin
      .from("users")
      .select("id")
      .eq("account_id", accountIdForInvite)
      .in("role", ["superadmin", "admin", "staff-admin"])
      .order("created_at", { ascending: true })
      .limit(1)
      .maybeSingle();

    if (fallbackInviterError) {
      summary.errors.push(
        `Failed resolving inviter user for account ${accountId}: ${fallbackInviterError.message}`,
      );
    } else {
      invitedBy = String(fallbackInviter?.id || "").trim();
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
    let inviteEmailSent = false;
    let inviteEmailError: string | null = null;

    if (!invitedBy) {
      summary.errors.push(
        `Missing inviter user for ${candidate.email}. Sync invite email requires a valid account admin user.`,
      );
      continue;
    }

    if (userId) {
      try {
        await ensureInviteLogForResend({
          admin,
          accountId: accountIdForInvite,
          email: candidate.email,
          invitedBy,
        });
        await resendCustomerInviteLikeTeam({
          email: candidate.email,
          password: temporaryPassword,
          name: candidate.name,
          accountId: accountIdForInvite,
          invitedBy,
        });
        inviteEmailSent = true;
      } catch (resendError: any) {
        inviteEmailError = String(
          resendError?.message || "Unknown resend invite error",
        );
        summary.errors.push(
          `Resend invite failed for ${candidate.email}: ${inviteEmailError}`,
        );
      }
    }

    if (!userId) {
      try {
        await sendCustomerInviteLikeTeam({
          email: candidate.email,
          password: temporaryPassword,
          name: candidate.name,
          accountId: accountIdForInvite,
          invitedBy,
        });
        inviteEmailSent = true;
      } catch (inviteError: any) {
        inviteEmailError = String(
          inviteError?.message || "Unknown invite error",
        );
        if (isAlreadyRegisteredError(inviteEmailError)) {
          try {
            await ensureInviteLogForResend({
              admin,
              accountId: accountIdForInvite,
              email: candidate.email,
              invitedBy,
            });
            await resendCustomerInviteLikeTeam({
              email: candidate.email,
              password: temporaryPassword,
              name: candidate.name,
              accountId: accountIdForInvite,
              invitedBy,
            });
            inviteEmailSent = true;
          } catch (resendError: any) {
            summary.errors.push(
              `Resend invite failed for ${candidate.email}: ${resendError?.message || "Unknown resend invite error"}`,
            );
          }
        } else {
          summary.errors.push(
            `Invite flow failed for ${candidate.email}: ${inviteEmailError}`,
          );
        }
      }

      const refreshedUsers = await admin.auth.admin.listUsers({
        page: 1,
        perPage: 1000,
      });
      if (!refreshedUsers.error) {
        for (const authUser of refreshedUsers.data.users || []) {
          const email = String(authUser?.email || "")
            .trim()
            .toLowerCase();
          if (!email) continue;
          authByEmail.set(email, authUser.id);
        }
      }
      userId = authByEmail.get(candidate.email) || null;
    }

    if (!userId) {
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

    const { error: existingAuthUpdateError } =
      await admin.auth.admin.updateUserById(userId, {
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
    if (existingAuthUpdateError) {
      summary.errors.push(
        `Failed updating auth user for ${candidate.email}: ${existingAuthUpdateError.message}`,
      );
      continue;
    }

    if (!userId) {
      summary.errors.push(
        `Failed resolving auth user id for ${candidate.email}`,
      );
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

    if (inviteEmailSent) {
      summary.emailed += 1;
    } else {
      const inviteContext = inviteEmailError
        ? ` (invite flow note: ${inviteEmailError})`
        : "";
      summary.errors.push(
        `Invite email not sent for ${candidate.email}.${inviteContext}`,
      );
    }
  }

  return summary;
}
