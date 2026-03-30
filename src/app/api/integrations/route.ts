/* eslint-disable @typescript-eslint/no-explicit-any */
import { NextResponse } from "next/server";
import { Tables } from "@/types/supabase";
import { createServerSupabaseClient } from "@/lib/supabase-server";
import { supabaseAdmin } from "@/lib/supabaseAdmin";
export type IntegrationWithAccountDetails = Tables<"integrations"> & {
  account_integration: Tables<"account_integrations"> | null;
  connected: boolean;
};

export async function GET(req: Request) {
  try {
    const params = new URL(req.url);

    const supabase = await createServerSupabaseClient();

    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (params.searchParams.get("type") == "connected") {
      const { data: integrations, error } = await supabase
        .from("account_integrations")
        .select("*, integrations!inner(*)")
        .eq("user_id", user.id)
        .eq("integrations.is_active", true);

      if (error) throw error;

      return NextResponse.json(integrations);
    } else {
      const { data: integrations, error } = await supabase
        .from("integrations")
        .select("*, account_integrations:account_integrations(*)")
        .eq("is_active", true)
        .order("created_at", { ascending: true });

      if (error) throw error;

      const data = integrations.map((integration) => {
        const accountIntegration =
          integration.account_integrations?.[0] ?? null;
        return {
          ...integration,
          account_integrations: undefined,
          account_integration: accountIntegration,
          connected: !!accountIntegration,
        };
      });

      return NextResponse.json({ data });
    }
  } catch (error) {
    console.log(error);
    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Failed to fetch integrations",
      },
      { status: 500 },
    );
  }
}

export async function POST(req: Request) {
  try {
    const {
      type,
      headers,
      body,
      domain,
      checkingURL,
      provider_id,
      content_type,
    } = await req.json();

    const supabase = await createServerSupabaseClient();

    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError) throw userError;

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    switch (type) {
      case "STORE_CONFIGURATION": {
        const { data: details, error: fetchError } = await supabaseAdmin
          .from("account_integrations")
          .select("id")
          .eq("user_id", user.id)
          .eq("provider_id", provider_id)
          .maybeSingle();

        if (fetchError) throw fetchError;

        if (details) {
          const { data, error } = await supabaseAdmin
            .from("account_integrations")
            .update({
              credentials: {
                headers,
                body,
              },
              domain: domain,
            })
            .eq("id", details.id)
            .select()
            .single();

          if (error) throw error;

          return NextResponse.json(data);
        } else {
          const { data, error } = await supabaseAdmin
            .from("account_integrations")
            .insert({
              credentials: {
                headers,
                body,
              },
              domain: domain,
              provider_id: provider_id,
              user_id: user.id,
            })
            .select()
            .maybeSingle();

          if (error) throw error;

          return NextResponse.json(data);
        }
      }

      default: {
        const requestHeaders = {
          Accept: "application/json",
          "Content-Type": content_type,
          ...headers,
        } as Record<string, string>;

        const basicClientId = headers?.ClientID;
        const basicClientSecret = headers?.ClientSecret;

        if (basicClientId && basicClientSecret) {
          requestHeaders.Authorization = `Basic ${Buffer.from(`${basicClientId}:${basicClientSecret}`).toString("base64")}`;
          delete requestHeaders.ClientID;
          delete requestHeaders.ClientSecret;
        }

        let requestBody: any = JSON.stringify(body);

        if (content_type.includes("x-www-form-urlencoded")) {
          const urlencoded = new URLSearchParams();
          Object.entries(body).forEach(([key, value]) => {
            urlencoded.append(key, value as string);
          });
          requestBody = urlencoded;
        }

        const response = await fetch(checkingURL, {
          method: "POST",
          headers: requestHeaders,
          body: requestBody,
        }).then((res) => res.json());

        return NextResponse.json(response);
      }
    }
  } catch (error) {
    console.log(error);
    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Failed to test integrations",
      },
      { status: 500 },
    );
  }
}

export async function DELETE(req: Request) {
  try {
    const { id } = await req.json();

    const supabase = await createServerSupabaseClient();

    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError) throw userError;

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { data, error } = await supabase
      .from("account_integrations")
      .delete()
      .eq("user_id", user.id)
      .eq("id", id)
      .select("*")
      .maybeSingle();

    if (error) throw error;

    if (!data) {
      return NextResponse.json(
        { error: "Configuration not found" },
        { status: 404 },
      );
    }

    return NextResponse.json({ success: true, data });
  } catch (error) {
    console.log(error);
    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Failed to delete integration configuration",
      },
      { status: 500 },
    );
  }
}

export async function PATCH(req: Request) {
  try {
    const { id } = await req.json();

    const supabase = await createServerSupabaseClient();

    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError) throw userError;

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    await supabase
      .from("account_integrations")
      .update({ is_default: false })
      .eq("user_id", user.id);

    const { data, error } = await supabase
      .from("account_integrations")
      .update({ is_default: true })
      .eq("user_id", user.id)
      .eq("id", id)
      .select("*")
      .maybeSingle();

    if (error) throw error;

    if (!data) {
      return NextResponse.json(
        { error: "Configuration is not found" },
        { status: 404 },
      );
    }

    return NextResponse.json(data);
  } catch (error) {
    console.log(error);
    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Failed to make default integration configuration",
      },
      { status: 500 },
    );
  }
}
