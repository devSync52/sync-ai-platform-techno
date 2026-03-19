import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { createServerClient } from "@supabase/ssr";
import type { Database } from "@/types/supabase";

type FedexCredentials = {
  account_number: string;
  client_id: string;
  client_secret: string;
  scope?: string;
};

function getCookieHandlers(cookieStore: any) {
  return {
    get(name: string) {
      return cookieStore.get(name)?.value;
    },
    set(name: string, value: string, options: any) {
      cookieStore.set({ name, value, ...options });
    },
    remove(name: string, options: any) {
      try {
        (cookieStore as any).delete(name);
      } catch {
        cookieStore.set({ name, value: "", ...options, maxAge: 0 });
      }
    },
  };
}

function parseCredentialsFromBody(raw: unknown): FedexCredentials | null {
  if (!raw || typeof raw !== "object") return null;

  const creds: FedexCredentials = {
    account_number: String((raw as any).account_number ?? "").trim(),
    client_id: String((raw as any).client_id ?? "").trim(),
    client_secret: String((raw as any).client_secret ?? "").trim(),
    scope: String((raw as any).scope ?? "").trim() || undefined,
  };

  if (!creds.account_number || !creds.client_id || !creds.client_secret)
    return null;

  return creds;
}

type FedexTokenResult =
  | {
      ok: true;
      accessToken: string;
      expiresIn: number;
      scope: string;
      environment: "prod" | "sandbox";
    }
  | { ok: false; error: string };

async function requestFedexToken(
  credentials: FedexCredentials,
  url: string,
  env: "prod" | "sandbox",
): Promise<FedexTokenResult> {
  try {
    const body = new URLSearchParams({
      grant_type: "client_credentials",
      client_id: credentials.client_id,
      client_secret: credentials.client_secret,
    });

    if (credentials.scope) {
      body.append("scope", credentials.scope);
    }

    const response = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: body.toString(),
    });

    const json = await response.json().catch(() => null);

    if (response.ok && json?.access_token) {
      return {
        ok: true,
        accessToken: json.access_token,
        expiresIn: json.expires_in ?? 0,
        scope: json.scope ?? "",
        environment: env,
      };
    }

    const errorMessage =
      json?.errors?.[0]?.message ||
      json?.error_description ||
      json?.error ||
      "FedEx token request failed";

    return { ok: false, error: errorMessage };
  } catch (err: any) {
    return { ok: false, error: err.message || "Network error" };
  }
}

async function testFedexToken(credentials: FedexCredentials) {
  const prodUrl =
    process.env.FEDEX_OAUTH_URL || "https://apis.fedex.com/oauth/token";

  const sandboxUrl =
    process.env.FEDEX_OAUTH_URL_SANDBOX ||
    "https://apis-sandbox.fedex.com/oauth/token";

  // Try production first
  const prod = await requestFedexToken(credentials, prodUrl, "prod");
  if (prod.ok) return prod;

  // Then sandbox
  const sandbox = await requestFedexToken(credentials, sandboxUrl, "sandbox");
  console.log("sandbox", sandbox);

  if (sandbox.ok) return sandbox;

  return {
    ok: false as const,
    error: `${prod.error} (prod) / ${sandbox.error} (sandbox)`,
  };
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}));
    const action = String(body?.action ?? "").toLowerCase();

    if (action !== "test_credentials") {
      return NextResponse.json({ error: "Invalid action" }, { status: 400 });
    }

    const cookieStore = await cookies();

    const supabase = createServerClient<Database>(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      { cookies: getCookieHandlers(cookieStore) },
    );

    // ✅ Auth check
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // ✅ Get account
    const { data: userRow, error: userRowError } = await supabase
      .from("users")
      .select("account_id")
      .eq("id", user.id)
      .maybeSingle();

    if (userRowError || !userRow?.account_id) {
      return NextResponse.json(
        { error: "Missing account context" },
        { status: 403 },
      );
    }

    const accountId = String(userRow.account_id);
    const requestedAccountId = String(body?.accountId ?? "").trim();

    if (requestedAccountId && requestedAccountId !== accountId) {
      return NextResponse.json(
        { error: "Forbidden account scope" },
        { status: 403 },
      );
    }

    // ✅ Validate credentials
    const credentials = parseCredentialsFromBody(body?.credentials);
    if (!credentials) {
      return NextResponse.json(
        { error: "Account number, Client ID and Client Secret are required" },
        { status: 400 },
      );
    }

    // ✅ Test FedEx API
    const result = await testFedexToken(credentials);

    if (!result.ok) {
      return NextResponse.json(
        { success: false, error: result.error },
        { status: 400 },
      );
    }

    return NextResponse.json({
      success: true,
      environment: result.environment,
      token: {
        access_token: result.accessToken,
        expires_in: result.expiresIn,
        scope: result.scope,
      },
    });
  } catch (error: any) {
    return NextResponse.json(
      { error: error?.message || "Unexpected server error" },
      { status: 500 },
    );
  }
}
