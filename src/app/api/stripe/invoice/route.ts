import { NextRequest, NextResponse } from "next/server";
import type Stripe from "stripe";
import { getStripe } from "@/lib/stripe";

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
