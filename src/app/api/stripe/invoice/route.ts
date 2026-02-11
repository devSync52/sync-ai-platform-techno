import { NextRequest, NextResponse } from "next/server";
import type Stripe from "stripe";
import { getStripe } from "@/lib/stripe";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
);

export async function GET(req: NextRequest) {
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

    const userId = session.metadata?.userId;
    const planId = session.metadata?.planId;

    if (userId && planId) {
      const { error: updateError } = await supabase
        .from("users")
        .update({
          plan_id: planId,
          is_onboarding_complete: true,
        })
        .eq("id", userId);

      if (updateError) {
        console.error("Failed to sync plan from session:", updateError.message);
      }
    }

    const subscription = session.subscription as Stripe.Subscription | null;
    const latestInvoice =
      (subscription?.latest_invoice as Stripe.Invoice | null) ?? null;

    const invoicePdf = latestInvoice?.invoice_pdf ?? null;
    const invoiceUrl = latestInvoice?.hosted_invoice_url ?? null;

    if (!invoicePdf && !invoiceUrl) {
      return NextResponse.json(
        { error: "Invoice not available yet" },
        { status: 404 },
      );
    }

    return NextResponse.json({
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
