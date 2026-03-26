import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { createServerClient } from "@supabase/ssr";
import AES from "crypto-js/aes";
import Utf8 from "crypto-js/enc-utf8";

const EXTENSIV_BASE_URL = "https://secure-wms.com";
const ENCRYPTION_KEY =
  process.env.NEXT_PUBLIC_CREDENTIAL_SECRET || "SYNC_SECRET";

export const dynamic = "force-dynamic";

type ExtensivCredentials = {
  client_id: string;
  client_secret: string;
  extensiv_id: string;
};

function parseCredentials(raw: unknown): ExtensivCredentials | null {
  if (!raw) return null;

  let parsed: any = raw;
  if (typeof raw === "string") {
    try {
      const decrypted = AES.decrypt(raw, ENCRYPTION_KEY).toString(Utf8);
      parsed = JSON.parse(decrypted);
    } catch {
      return null;
    }
  }

  if (!parsed?.client_id || !parsed?.client_secret || !parsed?.extensiv_id)
    return null;
  return {
    client_id: parsed.client_id,
    client_secret: parsed.client_secret,
    extensiv_id: parsed.extensiv_id,
  };
}

async function getExtensivToken(creds: ExtensivCredentials) {
  const basic = Buffer.from(
    `${creds.client_id}:${creds.client_secret}`,
  ).toString("base64");

  const formBody = new URLSearchParams({
    grant_type: "client_credentials",
    user_login: creds.extensiv_id,
  }).toString();

  const formRes = await fetch(`${EXTENSIV_BASE_URL}/AuthServer/api/Token`, {
    method: "POST",
    headers: {
      Accept: "application/json",
      "Content-Type": "application/x-www-form-urlencoded",
      Authorization: `Basic ${basic}`,
    },
    body: formBody,
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

  // Fallback JSON body
  const jsonRes = await fetch(`${EXTENSIV_BASE_URL}/AuthServer/api/Token`, {
    method: "POST",
    headers: {
      Accept: "application/json",
      "Content-Type": "application/json",
      Authorization: `Basic ${basic}`,
    },
    body: JSON.stringify({
      grant_type: "client_credentials",
      user_login: creds.extensiv_id,
    }),
  });

  const jsonText = await jsonRes.text();
  const json = (() => {
    try {
      return jsonText ? JSON.parse(jsonText) : null;
    } catch {
      return null;
    }
  })();
  if (jsonRes.ok && (json?.access_token || json?.token)) {
    return json.access_token || json.token;
  }

  const msg =
    formJson?.error_description ||
    formJson?.error ||
    json?.error_description ||
    json?.error ||
    jsonText ||
    formText ||
    "Extensiv token failed";
  throw new Error(msg);
}

export async function GET(req: NextRequest) {
  const cookieStore = (await cookies()) as any;
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get: (name: string) => cookieStore.get(name)?.value,
        set: (name: string, value: string, options: any) => {
          cookieStore.set({ name, value, ...options });
        },
        remove: (name: string, options: any) => {
          try {
            cookieStore.delete(name);
          } catch {
            cookieStore.set({ name, value: "", ...options, maxAge: 0 });
          }
        },
      },
    },
  );

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { data: userRow, error: userErr } = await supabase
    .from("users")
    .select("account_id")
    .eq("id", user.id)
    .maybeSingle();

  if (userErr || !userRow?.account_id) {
    return NextResponse.json({ error: "Account not found" }, { status: 400 });
  }

  const accountId = userRow.account_id;

  const { data: integrationRow } = await supabase
    .from("account_integrations")
    .select("credentials")
    .eq("account_id", accountId)
    .eq("type", "extensiv")
    .maybeSingle();

  const creds = parseCredentials(integrationRow?.credentials);
  if (!creds) {
    return NextResponse.json(
      { error: "Extensiv credentials not configured for this account" },
      { status: 400 },
    );
  }

  const token = await getExtensivToken(creds);

  const { searchParams } = new URL(req.url);
  const pageSize = Number(searchParams.get("pageSize") || 50);
  const page = Number(searchParams.get("page") || 1);

  // NOTE: Extensiv's V2 API rejects the `embed` parameter with QueryParameterException.
  // Using `detail=OrderItems` + `itemdetail=All` returns items in `OrderItems` without embed.
  const url = `${EXTENSIV_BASE_URL}/orders?detail=OrderItems&itemdetail=All&pgsiz=${Math.min(pageSize, 200)}&pgnum=${page}`;

  const res = await fetch(url, {
    method: "GET",
    headers: {
      Authorization: `Bearer ${token}`,
      Accept: "application/json",
      "Content-Type": "application/json",
    },
  });

  const text = await res.text();
  let json: any = null;
  try {
    json = text ? JSON.parse(text) : null;
  } catch {
    json = null;
  }
  console.log("json", json);

  if (!res.ok) {
    return NextResponse.json(
      {
        error:
          json?.error ||
          json?.message ||
          text ||
          "Failed to fetch Extensiv orders",
      },
      { status: res.status },
    );
  }

  return NextResponse.json({ success: true, data: json });
}
