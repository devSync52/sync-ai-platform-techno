import { NextResponse } from "next/server";
import { headers } from "next/headers";
import { createClient } from "@supabase/supabase-js";
import type Stripe from "stripe";
import { getStripe } from "@/lib/stripe";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
);

const stripeId = (
  ref: string | { id: string } | null | undefined,
): string | null => {
  if (!ref) return null;
  return typeof ref === "string" ? ref : ref.id;
};

const isInvoicePaid = (invoice: Stripe.Invoice | null | undefined) => {
  if (!invoice) return false;
  return invoice.status === "paid" || (invoice.amount_remaining ?? 0) <= 0;
};

async function autoPayLatestSubscriptionInvoice(
  stripe: Stripe,
  subscriptionId: string,
) {
  const subscription = await stripe.subscriptions.retrieve(subscriptionId, {
    expand: ["latest_invoice", "default_payment_method", "customer"],
  });

  const latestInvoice = subscription.latest_invoice as Stripe.Invoice | null;
  if (!latestInvoice) {
    return { paid: false, subscription };
  }

  if (isInvoicePaid(latestInvoice)) {
    return { paid: true, subscription };
  }

  let paymentMethodId = stripeId(
    subscription.default_payment_method as string | { id: string } | null,
  );

  if (!paymentMethodId) {
    const customerId = stripeId(
      subscription.customer as string | { id: string } | null,
    );
    if (customerId) {
      const customer = await stripe.customers.retrieve(customerId);
      if (!("deleted" in customer)) {
        paymentMethodId = stripeId(
          customer.invoice_settings.default_payment_method as
            | string
            | { id: string }
            | null,
        );
      }
    }
  }

  try {
    const paidInvoice = paymentMethodId
      ? await stripe.invoices.pay(latestInvoice.id, {
          payment_method: paymentMethodId,
        })
      : await stripe.invoices.pay(latestInvoice.id);

    return { paid: isInvoicePaid(paidInvoice), subscription };
  } catch (error) {
    console.warn(
      "[stripe/webhook] auto-pay latest invoice failed:",
      latestInvoice.id,
      error,
    );
    return { paid: false, subscription };
  }
}

export async function POST(req: Request) {
  const headerStore = await headers();
  const signature = headerStore.get("stripe-signature");
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

  if (!signature || !webhookSecret) {
    return NextResponse.json(
      { error: "Missing webhook signature" },
      { status: 400 },
    );
  }

  let event: Stripe.Event;

  try {
    const body = await req.text();
    const stripe = getStripe();
    event = stripe.webhooks.constructEvent(body, signature, webhookSecret);
  } catch {
    return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
  }

  const syncUserPlan = async (
    userId?: string,
    planId?: string,
    customerId?: string,
  ) => {
    if (!userId || !planId) return;

    const { error } = await supabase
      .from("users")
      .update({
        stripe_customer_id: customerId,
        plan_id: planId,
        is_onboarding_complete: true,
      })
      .eq("id", userId);

    if (error) {
      console.error(
        "[stripe/webhook] failed to sync user plan:",
        error.message,
      );
    } else if (customerId) {
      // Also update the customer's metadata in Stripe with our user ID for good measure.
      await getStripe().customers.update(customerId, { metadata: { userId } });
    }
  };

  if (event.type === "checkout.session.completed") {
    const session = event.data.object as Stripe.Checkout.Session;
    const stripe = getStripe();
    const subscriptionId = stripeId(
      session.subscription as string | { id: string } | null,
    );

    if (subscriptionId) {
      const result = await autoPayLatestSubscriptionInvoice(
        stripe,
        subscriptionId,
      );
      await syncUserPlan(
        result.subscription.metadata?.userId ?? session.metadata?.userId,
        result.subscription.metadata?.planId ?? session.metadata?.planId,
        stripeId(session.customer),
      );
      if (!result.paid) {
        console.warn(
          "[stripe/webhook] subscription checkout completed but invoice is not paid yet:",
          subscriptionId,
        );
      }
    } else if (session.payment_status === "paid") {
      await syncUserPlan(
        session.metadata?.userId,
        session.metadata?.planId,
        stripeId(session.customer),
      );
    }
  }

  if (event.type === "invoice.paid") {
    const invoice = event.data.object as Stripe.Invoice;
    const subId =
      typeof invoice.subscription === "string"
        ? invoice.subscription
        : invoice.subscription?.id;

    if (subId) {
      const stripe = getStripe();
      const subscription = await stripe.subscriptions.retrieve(subId);
      await syncUserPlan(
        subscription.metadata?.userId,
        subscription.metadata?.planId,
        stripeId(subscription.customer),
      );
    }
  }

  return NextResponse.json({ received: true });
}
