import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { createServerClient } from "@supabase/ssr";
import type Stripe from "stripe";
import { getStripe } from "@/lib/stripe";

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

export async function POST() {
  try {
    if (
      !process.env.NEXT_PUBLIC_SUPABASE_URL ||
      !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
      !process.env.STRIPE_SECRET_KEY
    ) {
      return NextResponse.json({ error: "Missing environment variables" }, { status: 500 });
    }

    const cookieStore = (await cookies()) as any;
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
      {
        cookies: {
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
        },
      },
    );

    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { data: userRow } = await supabase
      .from("users")
      .select("stripe_customer_id")
      .eq("id", user.id)
      .maybeSingle();

    const stripe = getStripe();
    const candidates: Stripe.Subscription[] = [];
    const addCandidate = (subscription?: Stripe.Subscription | null) => {
      if (!subscription) return;
      if (!managedSubscriptionStatuses.has(subscription.status)) return;
      if (candidates.some((row) => row.id === subscription.id)) return;
      candidates.push(subscription);
    };

    const customerId = userRow?.stripe_customer_id ?? null;
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
        query: `metadata['userId']:'${user.id}'`,
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
        message: "Plan cancellation is already scheduled.",
        effectiveAt: toIsoDate(existingCancellation.current_period_end),
      });
    }

    const subscriptionToCancel = candidates[0] ?? null;
    if (!subscriptionToCancel) {
      return NextResponse.json(
        { error: "No active subscription found." },
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
      message: "Your plan will be canceled at the end of the current billing period.",
      effectiveAt: toIsoDate(updatedSubscription.current_period_end),
    });
  } catch (error) {
    console.error("[api/stripe/subscription/cancel] error:", error);
    const message =
      error instanceof Error
        ? error.message
        : typeof error === "string"
          ? error
          : "Unexpected error";

    return NextResponse.json({ error: message }, { status: 500 });
  }
}
