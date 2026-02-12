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

const stripeId = (
  ref: string | { id: string } | null | undefined,
): string | null => {
  if (!ref) return null;
  return typeof ref === "string" ? ref : ref.id;
};

async function isUpcomingDowngrade(
  stripe: Stripe,
  subscription: Stripe.Subscription,
): Promise<boolean> {
  const scheduleRef = subscription.schedule;
  if (!scheduleRef) return false;

  const scheduleId = stripeId(scheduleRef);
  if (!scheduleId) return false;

  const schedule = await stripe.subscriptionSchedules.retrieve(scheduleId);
  const nextPhase =
    schedule.phases.find(
      (phase) =>
        typeof phase.start_date === "number" &&
        phase.start_date >= subscription.current_period_end,
    ) ?? null;

  const currentItem = subscription.items.data[0];
  const currentCents = currentItem?.price?.unit_amount ?? null;
  const nextPriceRef = nextPhase?.items?.[0]?.price;
  const nextPriceId = stripeId(nextPriceRef as string | { id: string } | null);

  if (!nextPriceId || typeof currentCents !== "number") return false;

  const nextPrice = await stripe.prices.retrieve(nextPriceId);
  const nextCents = nextPrice.unit_amount;
  if (typeof nextCents !== "number") return false;

  return nextCents < currentCents;
}

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
    const candidateSubscriptions: Stripe.Subscription[] = [];

    const addCandidate = (sub?: Stripe.Subscription | null) => {
      if (!sub) return;
      if (!managedSubscriptionStatuses.has(sub.status)) return;
      if (candidateSubscriptions.some((row) => row.id === sub.id)) return;
      candidateSubscriptions.push(sub);
    };

    const customerId = userRow?.stripe_customer_id ?? null;
    if (customerId) {
      const byCustomer = await stripe.subscriptions.list({
        customer: customerId,
        status: "all",
        limit: 20,
        expand: ["data.items.data.price"],
      });
      for (const sub of byCustomer.data) addCandidate(sub);
    }

    const subscriptionsApi = stripe.subscriptions as any;
    if (typeof subscriptionsApi.search === "function") {
      const byUserMetadata = await subscriptionsApi.search({
        query: `metadata['userId']:'${user.id}'`,
        limit: 20,
      });
      for (const sub of byUserMetadata?.data ?? []) {
        addCandidate(sub as Stripe.Subscription);
      }
    }

    for (const subscription of candidateSubscriptions) {
      const scheduleId = stripeId(
        subscription.schedule as string | { id: string } | null | undefined,
      );
      if (!scheduleId) continue;

      const isDowngrade = await isUpcomingDowngrade(stripe, subscription);
      if (!isDowngrade) continue;

      await stripe.subscriptionSchedules.release(scheduleId);
      return NextResponse.json({
        success: true,
        message: "Scheduled downgrade has been canceled.",
      });
    }

    return NextResponse.json(
      { error: "No scheduled downgrade found." },
      { status: 404 },
    );
  } catch (error) {
    console.error("[api/stripe/downgrade/cancel] error:", error);
    const message =
      error instanceof Error
        ? error.message
        : typeof error === "string"
          ? error
          : "Unexpected error";

    return NextResponse.json({ error: message }, { status: 500 });
  }
}
