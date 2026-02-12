import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import type Stripe from "stripe";
import { getStripe } from "@/lib/stripe";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
);

type CheckoutPayload = {
  userId: string;
  planId: string;
  userEmail?: string | null;
};

async function findCustomerByUserId(
  stripe: Stripe,
  userId: string,
): Promise<string | null> {
  const customersApi = stripe.customers as any;

  if (typeof customersApi.search === "function") {
    try {
      const result = await customersApi.search({
        query: `metadata['userId']:'${userId}'`,
        limit: 1,
      });
      const found = result?.data?.[0];
      if (found && !("deleted" in found)) return found.id as string;
    } catch (error) {
      console.warn("[api/stripe/checkout] customer search failed:", error);
    }
  }

  return null;
}

async function findCustomerByEmail(
  stripe: Stripe,
  email?: string | null,
): Promise<string | null> {
  if (!email) return null;
  try {
    const result = await stripe.customers.list({ email, limit: 10 });
    const found = result.data.find((c) => !("deleted" in c));
    return found?.id ?? null;
  } catch (error) {
    console.warn("[api/stripe/checkout] customer list by email failed:", error);
    return null;
  }
}

export async function POST(req: NextRequest) {
  try {
    if (!process.env.NEXT_PUBLIC_SUPABASE_URL) {
      return NextResponse.json(
        { error: "Missing NEXT_PUBLIC_SUPABASE_URL" },
        { status: 500 },
      );
    }
    if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
      return NextResponse.json(
        { error: "Missing SUPABASE_SERVICE_ROLE_KEY" },
        { status: 500 },
      );
    }
    if (!process.env.STRIPE_SECRET_KEY) {
      return NextResponse.json(
        { error: "Missing STRIPE_SECRET_KEY" },
        { status: 500 },
      );
    }

    const { userId, planId, userEmail } = (await req.json()) as CheckoutPayload;

    if (!userId || !planId) {
      return NextResponse.json(
        { error: "Missing userId or planId" },
        { status: 400 },
      );
    }

    const { data: plan, error: planError } = await supabase
      .from("plans")
      .select("id, name, stripe_price_id")
      .eq("id", planId)
      .single();

    if (planError || !plan) {
      return NextResponse.json({ error: "Plan not found" }, { status: 404 });
    }

    const stripePriceId = plan.stripe_price_id ?? undefined;

    if (!stripePriceId) {
      return NextResponse.json(
        { error: "Plan is missing Stripe price ID" },
        { status: 400 },
      );
    }

    const origin =
      req.headers.get("origin") ??
      process.env.NEXT_PUBLIC_SITE_URL ??
      "http://localhost:3000";

    const stripe = getStripe();
    const { data: userRow } = await supabase
      .from("users")
      .select("stripe_customer_id")
      .eq("id", userId)
      .maybeSingle();

    let customerId: string | null = userRow?.stripe_customer_id ?? null;

    if (customerId) {
      try {
        await stripe.customers.update(customerId, {
          email: userEmail ?? undefined,
          metadata: { userId },
        });
      } catch (error) {
        console.warn(
          "[api/stripe/checkout] failed to update existing customer:",
          error,
        );
        customerId = null;
      }
    }

    if (!customerId) {
      customerId = await findCustomerByUserId(stripe, userId);
    }

    if (!customerId) {
      customerId = await findCustomerByEmail(stripe, userEmail);
      if (customerId) {
        await stripe.customers.update(customerId, {
          metadata: { userId },
        });
      }
    }

    if (!customerId) {
      const customer = await stripe.customers.create({
        email: userEmail ?? undefined,
        metadata: { userId },
      });
      customerId = customer.id;
    }

    if (customerId && customerId !== userRow?.stripe_customer_id) {
      const { error: customerUpdateError } = await supabase
        .from("users")
        .update({ stripe_customer_id: customerId })
        .eq("id", userId);

      if (customerUpdateError) {
        console.warn(
          "[api/stripe/checkout] failed to store stripe_customer_id:",
          customerUpdateError.message,
        );
      }
    }

    const session = await stripe.checkout.sessions.create({
      mode: "subscription",
      line_items: [{ price: stripePriceId, quantity: 1 }],
      payment_method_types: ["card"],
      payment_method_collection: "always",
      customer: customerId,
      subscription_data: {
        metadata: {
          userId,
          planId,
          planName: plan.name,
        },
      },
      success_url: `${origin}/dashboard?checkout=success&session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${origin}/pricing?checkout=cancel`,
      metadata: {
        userId,
        planId,
        planName: plan.name,
      },
    });

    return NextResponse.json({ url: session.url });
  } catch (error) {
    console.error("Stripe checkout error:", error);
    const errorMessage =
      error instanceof Error
        ? error.message
        : typeof error === "string"
          ? error
          : JSON.stringify(error);
    return NextResponse.json(
      { error: errorMessage || "Server error" },
      { status: 500 },
    );
  }
}
