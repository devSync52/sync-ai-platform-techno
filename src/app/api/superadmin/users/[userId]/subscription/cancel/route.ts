import { NextRequest, NextResponse } from "next/server";
import type Stripe from "stripe";
import { getStripe } from "@/lib/stripe";
import { supabaseAdmin } from "@/lib/supabaseAdmin";
import { requireSuperadmin } from "@/lib/superadmin";

const managedSubscriptionStatuses = new Set<Stripe.Subscription.Status>([
  "active",
  "trialing",
  "past_due",
  "unpaid",
]);

const toIsoDate = (unix?: number | null) =>
  typeof unix === "number" && Number.isFinite(unix)
    ? new Date(unix * 1000).toISOString()
    : null;

export async function POST(
  _req: NextRequest,
  { params }: { params: Promise<{ userId: string }> },
) {
  const auth = await requireSuperadmin();
  if (!auth.ok) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  if (!process.env.STRIPE_SECRET_KEY) {
    return NextResponse.json({ error: "Missing Stripe configuration" }, { status: 500 });
  }

  const { userId } = await params;
  if (!userId) {
    return NextResponse.json({ error: "Missing userId" }, { status: 400 });
  }

  const { data: userRow, error: userError } = await supabaseAdmin
    .from("users")
    .select("id, email, stripe_customer_id")
    .eq("id", userId)
    .maybeSingle();

  if (userError) {
    return NextResponse.json({ error: userError.message }, { status: 500 });
  }
  if (!userRow) {
    return NextResponse.json({ error: "User not found" }, { status: 404 });
  }

  try {
    const stripe = getStripe();
    const candidates: Stripe.Subscription[] = [];
    const addCandidate = (subscription?: Stripe.Subscription | null) => {
      if (!subscription) return;
      if (!managedSubscriptionStatuses.has(subscription.status)) return;
      if (candidates.some((row) => row.id === subscription.id)) return;
      candidates.push(subscription);
    };

    const customerId = userRow.stripe_customer_id ?? null;
    if (customerId) {
      const byCustomer = await stripe.subscriptions.list({
        customer: customerId,
        status: "all",
        limit: 20,
      });
      for (const subscription of byCustomer.data) {
        addCandidate(subscription);
      }
    }

    const subscriptionsApi = stripe.subscriptions as any;
    if (typeof subscriptionsApi.search === "function") {
      const byUserMetadata = await subscriptionsApi.search({
        query: `metadata['userId']:'${userId}'`,
        limit: 20,
      });
      for (const subscription of byUserMetadata?.data ?? []) {
        addCandidate(subscription as Stripe.Subscription);
      }
    }

    const existingCancellation = candidates.find(
      (subscription) => subscription.cancel_at_period_end,
    );
    if (existingCancellation) {
      return NextResponse.json({
        success: true,
        message: "Cancellation is already scheduled for this user.",
        effectiveAt: toIsoDate(existingCancellation.current_period_end),
      });
    }

    const subscriptionToCancel = candidates[0] ?? null;
    if (!subscriptionToCancel) {
      return NextResponse.json(
        { error: "No active subscription found for this user." },
        { status: 404 },
      );
    }

    const scheduleId =
      typeof subscriptionToCancel.schedule === "string"
        ? subscriptionToCancel.schedule
        : subscriptionToCancel.schedule?.id;
    if (scheduleId) {
      await stripe.subscriptionSchedules.release(scheduleId);
    }

    const updatedSubscription = await stripe.subscriptions.update(
      subscriptionToCancel.id,
      {
        cancel_at_period_end: true,
      },
    );

    return NextResponse.json({
      success: true,
      message: "Subscription cancellation scheduled at period end.",
      effectiveAt: toIsoDate(updatedSubscription.current_period_end),
    });
  } catch (error) {
    console.error("[api/superadmin/users/:userId/subscription/cancel] error:", error);
    const message =
      error instanceof Error
        ? error.message
        : typeof error === "string"
          ? error
          : "Unexpected error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
