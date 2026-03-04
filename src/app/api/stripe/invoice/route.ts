import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import type Stripe from "stripe";
import { getStripe } from "@/lib/stripe";

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

const supabase =
  process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.SUPABASE_SERVICE_ROLE_KEY
    ? createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.SUPABASE_SERVICE_ROLE_KEY,
    )
    : null;

async function autoPayInvoiceForSubscription(
  stripe: Stripe,
  subscriptionId: string,
) {
  const subscription = await stripe.subscriptions.retrieve(subscriptionId, {
    expand: ["latest_invoice", "default_payment_method", "customer"],
  });
  const latestInvoice = subscription.latest_invoice as Stripe.Invoice | null;

  if (!latestInvoice) return null;
  if (isInvoicePaid(latestInvoice)) return latestInvoice;

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
    return paymentMethodId
      ? await stripe.invoices.pay(latestInvoice.id, {
        payment_method: paymentMethodId,
      })
      : await stripe.invoices.pay(latestInvoice.id);
  } catch (error) {
    console.warn(
      "[api/stripe/invoice] auto-pay failed:",
      latestInvoice.id,
      error,
    );
    return latestInvoice;
  }
}

export async function GET(req: NextRequest) {
  try {
    if (!process.env.STRIPE_SECRET_KEY) {
      return NextResponse.json(
        { error: "Missing STRIPE_SECRET_KEY" },
        { status: 500 },
      );
    }

    const sessionId = req.nextUrl.searchParams.get("session_id");
    if (!sessionId) {
      return NextResponse.json(
        { error: "Missing session_id" },
        { status: 400 },
      );
    }

    const stripe = getStripe();
    const session = await stripe.checkout.sessions.retrieve(sessionId, {
      expand: ["subscription.latest_invoice"],
    });
    const subscription = session.subscription as Stripe.Subscription | null;
    const subscriptionId = stripeId(
      session.subscription as string | { id: string } | null,
    );

    const latestInvoice = subscriptionId
      ? await autoPayInvoiceForSubscription(stripe, subscriptionId)
      : ((subscription?.latest_invoice as Stripe.Invoice | null) ?? null);

    if (!isInvoicePaid(latestInvoice)) {
      return NextResponse.json(
        { error: "Invoice payment is still processing." },
        { status: 409 },
      );
    }

    const invoicePdf = latestInvoice?.invoice_pdf ?? null;
    const invoiceUrl = latestInvoice?.hosted_invoice_url ?? null;

    const sessionUserId = session.metadata?.userId;
    const sessionPlanId =
      (subscription &&
        typeof subscription === "object" &&
        "metadata" in subscription &&
        subscription.metadata?.planId
        ? subscription.metadata.planId
        : null) ?? session.metadata?.planId;
    const sessionCustomerId = stripeId(
      session.customer as string | { id: string } | null,
    );

    if (supabase && sessionUserId && sessionPlanId) {
      const { error: syncError } = await supabase
        .from("users")
        .update({
          stripe_customer_id: sessionCustomerId,
          plan_id: sessionPlanId,
          is_onboarding_complete: true,
        })
        .eq("id", sessionUserId);

      if (syncError) {
        console.warn("[api/stripe/invoice] failed to sync user plan:", syncError);
      }
    }

    if (!invoicePdf && !invoiceUrl) {
      return NextResponse.json(
        { error: "Invoice not available yet" },
        { status: 404 },
      );
    }

    return NextResponse.json({
      status: latestInvoice.status,
      invoice_pdf: invoicePdf,
      invoice_url: invoiceUrl,
    });
  } catch (error) {
    console.error("Stripe invoice lookup error:", error);
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
