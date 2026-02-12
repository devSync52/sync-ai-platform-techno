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

const managedSubscriptionStatuses = new Set<Stripe.Subscription.Status>([
  "active",
  "trialing",
  "past_due",
  "unpaid",
]);

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
      .select("id, name, price, stripe_price_id")
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
      .select("stripe_customer_id, plan_id")
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

    if (userRow?.plan_id === plan.id) {
      return NextResponse.json({
        success: true,
        message: "You are already on this plan.",
      });
    }

    const subscriptions = await stripe.subscriptions.list({
      customer: customerId,
      status: "all",
      limit: 20,
      expand: ["data.items.data.price", "data.latest_invoice"],
    });

    const existingSubscription =
      subscriptions.data.find((subscription) =>
        managedSubscriptionStatuses.has(subscription.status),
      ) ?? null;

    if (existingSubscription) {
      const currentItem = existingSubscription.items.data[0];
      if (!currentItem) {
        return NextResponse.json(
          { error: "Subscription item not found for current plan." },
          { status: 400 },
        );
      }

      const currentAmount = currentItem.price.unit_amount;
      const nextAmount = Number.isFinite(plan.price) ? Number(plan.price) * 100 : null;
      const isDowngrade =
        typeof currentAmount === "number" &&
        Number.isFinite(currentAmount) &&
        typeof nextAmount === "number" &&
        Number.isFinite(nextAmount) &&
        nextAmount < currentAmount;

      if (isDowngrade) {
        const scheduleId =
          typeof existingSubscription.schedule === "string"
            ? existingSubscription.schedule
            : existingSubscription.schedule?.id;

        const schedule =
          scheduleId != null
            ? await stripe.subscriptionSchedules.retrieve(scheduleId)
            : await stripe.subscriptionSchedules.create({
              from_subscription: existingSubscription.id,
            });

        await stripe.subscriptionSchedules.update(schedule.id, {
          end_behavior: "release",
          phases: [
            {
              start_date: existingSubscription.current_period_start,
              end_date: existingSubscription.current_period_end,
              items: [
                {
                  price: currentItem.price.id,
                  quantity: currentItem.quantity ?? 1,
                },
              ],
              proration_behavior: "none",
              metadata: {
                ...existingSubscription.metadata,
                userId,
              },
            },
            {
              start_date: existingSubscription.current_period_end,
              items: [
                {
                  price: stripePriceId,
                  quantity: currentItem.quantity ?? 1,
                },
              ],
              proration_behavior: "none",
              metadata: {
                ...existingSubscription.metadata,
                userId,
                planId: plan.id,
                planName: plan.name,
              },
            },
          ],
        });

        return NextResponse.json({
          success: true,
          effective: "next_billing_cycle",
          message:
            "Downgrade scheduled. Your current plan remains active until the next billing cycle.",
        });
      }

      const updatedSubscription = await stripe.subscriptions.update(
        existingSubscription.id,
        {
          items: [{ id: currentItem.id, price: stripePriceId }],
          proration_behavior: "always_invoice",
          metadata: {
            ...existingSubscription.metadata,
            userId,
            planId: plan.id,
            planName: plan.name,
          },
        },
      );

      const { error: syncError } = await supabase
        .from("users")
        .update({
          stripe_customer_id: customerId,
          plan_id: plan.id,
          is_onboarding_complete: true,
        })
        .eq("id", userId);

      if (syncError) {
        console.warn(
          "[api/stripe/checkout] failed to sync upgraded plan immediately:",
          syncError.message,
        );
      }

      const latestInvoiceId =
        typeof updatedSubscription.latest_invoice === "string"
          ? updatedSubscription.latest_invoice
          : updatedSubscription.latest_invoice?.id;

      return NextResponse.json({
        success: true,
        effective: "immediate",
        message:
          "Plan upgraded successfully. Any prorated charge was generated automatically.",
        latestInvoiceId: latestInvoiceId ?? null,
      });
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
