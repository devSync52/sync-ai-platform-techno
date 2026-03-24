import { createClient } from "@supabase/supabase-js";
import AES from "crypto-js/aes";
import Utf8 from "crypto-js/enc-utf8";
import { createSellercloudCustomerLogins } from "@/lib/sellercloudCustomerProvision";

const EXTENSIV_BASE_URL = "https://secure-wms.com";
const CREDENTIAL_SECRET =
  process.env.NEXT_PUBLIC_CREDENTIAL_SECRET ||
  process.env.CREDENTIAL_SECRET ||
  "SYNC_SECRET";

type ExtensivCredentials = {
  client_id: string;
  client_secret: string;
  extensiv_id: string;
};

async function lookupParentAccountId(admin: any, accountId: string) {
  const { data } = await admin
    .from("accounts")
    .select("parent_account_id")
    .eq("id", accountId)
    .maybeSingle();
  return data?.parent_account_id ?? null;
}

function decryptExtensivCredentials(raw: any): ExtensivCredentials | null {
  if (!raw) return null;

  let parsed: any = raw;
  if (typeof raw === "string") {
    try {
      const decrypted = AES.decrypt(raw, CREDENTIAL_SECRET).toString(Utf8);
      parsed = JSON.parse(decrypted || "{}");
    } catch (err) {
      console.warn("[sync-channels] Failed to decrypt Extensiv credentials", err);
      return null;
    }
  }

  const client_id = String(parsed?.client_id ?? "").trim();
  const client_secret = String(parsed?.client_secret ?? "").trim();
  const extensiv_id = String(parsed?.extensiv_id ?? "").trim();

  if (!client_id || !client_secret || !extensiv_id) return null;
  return { client_id, client_secret, extensiv_id };
}

async function getExtensivToken(creds: ExtensivCredentials) {
  const basic = Buffer.from(`${creds.client_id}:${creds.client_secret}`).toString("base64");

  const formBody = new URLSearchParams({
    grant_type: "client_credentials",
    user_login: creds.extensiv_id,
  });

  const formRes = await fetch(`${EXTENSIV_BASE_URL}/AuthServer/api/Token`, {
    method: "POST",
    headers: {
      Accept: "application/json",
      "Content-Type": "application/x-www-form-urlencoded",
      Authorization: `Basic ${basic}`,
    },
    body: formBody.toString(),
  });

  const formText = await formRes.text();
  const formJson = (() => {
    try {
      return formText ? JSON.parse(formText) : null;
    } catch {
      return null;
    }
  })();

  if (formRes.ok && (formJson?.access_token || formJson?.token)) {
    return formJson.access_token || formJson.token;
  }

  const jsonRes = await fetch(`${EXTENSIV_BASE_URL}/AuthServer/api/Token`, {
    method: "POST",
    headers: {
      Accept: "application/json",
      "Content-Type": "application/json",
      Authorization: `Basic ${basic}`,
    },
    body: JSON.stringify({ grant_type: "client_credentials", user_login: creds.extensiv_id }),
  });

  const jsonText = await jsonRes.text();
  const jsonBody = (() => {
    try {
      return jsonText ? JSON.parse(jsonText) : null;
    } catch {
      return null;
    }
  })();

  if (jsonRes.ok && (jsonBody?.access_token || jsonBody?.token)) {
    return jsonBody.access_token || jsonBody.token;
  }

  const errMsg =
    formJson?.error_description ||
    formJson?.error ||
    jsonBody?.error_description ||
    jsonBody?.error ||
    jsonText ||
    formText ||
    "Failed to obtain Extensiv token";
  throw new Error(errMsg);
}

function extractEmail(customer: any): string | null {
  const candidates = [
    customer?.contactEmail,
    customer?.email,
    customer?.emailAddress,
    customer?.email_address,
    customer?.contact?.email,
    customer?.contactInformation?.email,
    customer?.contactInformation?.emailAddress,
    customer?.contactInformation?.email_address,
    customer?.primaryContact?.email,
    customer?.primaryContactEmail,
    customer?.readOnly?.contactEmail,
    customer?.readOnly?.email,
    customer?.billingAddress?.email,
    customer?.shippingAddress?.email,
    customer?.billToAddress?.email,
    customer?.shipToAddress?.email,
    // nested contacts array
    Array.isArray(customer?.contacts) ? customer.contacts[0]?.email : null,
    Array.isArray(customer?.contacts) ? customer.contacts[0]?.contactEmail : null,
  ];

  for (const candidate of candidates) {
    if (typeof candidate === "string") {
      const trimmed = candidate.trim();
      if (trimmed.includes("@")) return trimmed.toLowerCase();
    }
  }
  return null;
}

function extractContactName(customer: any): string | null {
  const candidates = [
    customer?.contactName,
    customer?.contact?.name,
    customer?.primaryContact?.name,
    customer?.readOnly?.contactName,
    customer?.companyName,
    customer?.customerIdentifier?.name,
    customer?.readOnly?.customerIdentifier?.name,
  ];
  for (const c of candidates) {
    if (typeof c === "string" && c.trim()) return c.trim();
  }
  return null;
}

async function backfillExtensivEmails(accountId: string) {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRole = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !serviceRole) {
    throw new Error("Missing Supabase server configuration");
  }

  const admin = createClient(supabaseUrl, serviceRole, {
    auth: { autoRefreshToken: false, persistSession: false },
  });

  // Try to fetch credentials for this account; if missing, also check parent.
  const { data: integration } = await admin
    .from("account_integrations")
    .select("credentials, account_id")
    .eq("type", "extensiv")
    .in("account_id", [accountId, await lookupParentAccountId(admin, accountId)].filter(Boolean) as string[])
    .order("account_id", { ascending: false }) // prefer the exact accountId first
    .limit(1)
    .maybeSingle();

  const creds = decryptExtensivCredentials(integration?.credentials);
  if (!creds) {
    throw new Error("Extensiv credentials not found for account");
  }

  const token = await getExtensivToken(creds);
  const headers = { Authorization: `Bearer ${token}`, Accept: "application/hal+json" };

  const { data: channels, error: channelsError } = await admin
    .from("channels")
    .select("id, external_id, contact_name, email")
    .eq("account_id", accountId)
    .eq("source", "extensiv")
    .limit(2000);

  if (channelsError) {
    throw new Error(channelsError.message);
  }

  const updates: any[] = [];

  for (const channel of channels || []) {
    const hasEmail = typeof channel.email === "string" && channel.email.trim().length > 0;
    if (hasEmail) continue;

    const customerId = channel.external_id;
    if (!customerId) continue;

    try {
      const res = await fetch(`${EXTENSIV_BASE_URL}/customers/${customerId}`, { headers });
      if (!res.ok) {
        console.warn(
          "[sync-channels] Extensiv customer fetch failed",
          customerId,
          res.status,
          await res.text(),
        );
        continue;
      }

      const body = await res.json();
      const email = extractEmail(body);
      const contactName = extractContactName(body);

      if (!email && !contactName) continue;

      updates.push({
        id: channel.id,
        email: email ?? channel.email ?? null,
        contact_name: contactName ?? channel.contact_name ?? null,
      });
    } catch (err) {
      console.warn("[sync-channels] Error hydrating customer", customerId, err);
    }
  }

  if (updates.length > 0) {
    const { error: upsertError } = await admin.from("channels").upsert(updates, {
      onConflict: "id",
    });
    if (upsertError) throw new Error(upsertError.message);
  }

  return { patched: updates.length };
}

export async function POST(request: Request) {
  try {
    const { account_id, source } = await request.json()

    if (!account_id || !source) {
      return new Response(JSON.stringify({ success: false, error: 'Missing account_id or source' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      })
    }

    // Escolhe a função serverless correta
    let functionUrl: string | null = null

    if (source === 'sellercloud') {
      functionUrl = 'https://euzjrgnyzfgldubqglba.supabase.co/functions/v1/sync_sellercloud_channels'
    } else if (source === 'extensiv') {
      functionUrl = 'https://euzjrgnyzfgldubqglba.supabase.co/functions/v1/sync-customers-extensiv'
    } else if (source === 'magaya') {
      functionUrl = 'https://euzjrgnyzfgldubqglba.supabase.co/functions/v1/sync-customers-magaya'
    } else {
      return new Response(JSON.stringify({ success: false, error: 'Invalid source' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      })
    }

    const response = await fetch(functionUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ account_id }),
    })

    const data = await response.json()
    const isSuccess = response.ok && data?.success !== false

    if (source === "extensiv" && isSuccess) {
      try {
        // Extensiv channels may be stored on the parent tenant; mirror the sellercloud logic.
        const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
        const serviceRole = process.env.SUPABASE_SERVICE_ROLE_KEY

        let effectiveAccountId = account_id
        if (supabaseUrl && serviceRole) {
          const admin = createClient(supabaseUrl, serviceRole, {
            auth: { autoRefreshToken: false, persistSession: false },
          })
          const { data: accountRow } = await admin
            .from("accounts")
            .select("parent_account_id")
            .eq("id", account_id)
            .maybeSingle()
          if (accountRow?.parent_account_id) {
            effectiveAccountId = accountRow.parent_account_id
          }
        }

        const backfill = await backfillExtensivEmails(effectiveAccountId)
        data.patched_emails = backfill.patched
      } catch (err: any) {
        console.warn("[sync-channels] Extensiv email backfill failed:", err?.message || err)
      }
    }

    if (source === 'sellercloud' && isSuccess) {
      const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
      const serviceRole = process.env.SUPABASE_SERVICE_ROLE_KEY

      if (!supabaseUrl || !serviceRole) {
        return new Response(
          JSON.stringify({
            success: false,
            error: 'Missing Supabase server configuration',
          }),
          {
            status: 500,
            headers: { 'Content-Type': 'application/json' },
          }
        )
      }

      const admin = createClient(supabaseUrl, serviceRole, {
        auth: { autoRefreshToken: false, persistSession: false },
      })

      let effectiveAccountId = account_id
      const { data: accountRow } = await admin
        .from('accounts')
        .select('parent_account_id')
        .eq('id', account_id)
        .maybeSingle()

      if (accountRow?.parent_account_id) {
        effectiveAccountId = accountRow.parent_account_id
      }

      const customerProvision = await createSellercloudCustomerLogins({
        admin,
        accountId: effectiveAccountId,
        inviteAccountId: account_id,
      })

      return new Response(JSON.stringify({ ...data, customer_provision: customerProvision }), {
        status: response.status,
        headers: { 'Content-Type': 'application/json' },
      })
    }

    return new Response(JSON.stringify(data), {
      status: response.status,
      headers: { 'Content-Type': 'application/json' },
    })
  } catch (error) {
    console.error('[sync-channels] ❌ Error:', error)
    return new Response(
      JSON.stringify({ success: false, error: 'Internal server error' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    )
  }
}
