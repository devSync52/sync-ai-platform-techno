import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { createServerClient } from "@supabase/ssr";
import type Stripe from "stripe";
import { getStripe } from "@/lib/stripe";

type StripeInvoiceRow = {
  id: string;
  number: string | null;
  status: string;
  currency: string;
  total: number;
  amountPaid: number;
  amountDue: number;
  subtotal: number;
  tax: number;
  createdAt: string | null;
  dueDate: string | null;
  periodStart: string | null;
  periodEnd: string | null;
  hostedInvoiceUrl: string | null;
  invoicePdf: string | null;
  downloadUrl: string | null;
  payUrl: string | null;
  receiptUrl: string | null;
  isPaid: boolean;
  plan: {
    id: string | null;
    name: string | null;
    interval: string | null;
    amount: number | null;
    currency: string | null;
  };
};

async function resolveReceiptUrlForInvoice(
  stripe: Stripe,
  invoice: Stripe.Invoice,
): Promise<string | null> {
  try {
    const chargeRef = invoice.charge;
    if (chargeRef) {
      if (typeof chargeRef === "string") {
        const charge = await stripe.charges.retrieve(chargeRef);
        return charge.receipt_url ?? null;
      }
      return chargeRef.receipt_url ?? null;
    }

    const paymentIntentRef = invoice.payment_intent;
    if (paymentIntentRef) {
      const paymentIntent =
        typeof paymentIntentRef === "string"
          ? await stripe.paymentIntents.retrieve(paymentIntentRef, {
              expand: ["latest_charge"],
            })
          : paymentIntentRef;

      const latestCharge = paymentIntent.latest_charge;
      if (!latestCharge) return null;
      if (typeof latestCharge === "string") {
        const charge = await stripe.charges.retrieve(latestCharge);
        return charge.receipt_url ?? null;
      }
      return latestCharge.receipt_url ?? null;
    }
  } catch (error) {
    console.warn(
      "[api/stripe/invoices] failed to resolve receipt url:",
      invoice.id,
      error,
    );
  }

  return null;
}

const toIsoDate = (unix?: number | null) =>
  typeof unix === "number" && Number.isFinite(unix)
    ? new Date(unix * 1000).toISOString()
    : null;

const money = (cents?: number | null) =>
  typeof cents === "number" && Number.isFinite(cents) ? cents / 100 : 0;

const isInvoicePaid = (invoice: Stripe.Invoice | null | undefined) => {
  if (!invoice) return false;
  return invoice.status === "paid" || (invoice.amount_remaining ?? 0) <= 0;
};

type LocalPlanLike = {
  id?: string | null;
  name?: string | null;
  price?: number | null;
  interval?: string | null;
};

type PlanPayload = {
  id: string;
  name: string;
  amount: number;
  interval: string | null;
  currency: string;
};

type UpcomingDowngradePayload = PlanPayload & {
  effectiveAt: string | null;
};

type UpcomingCancellationPayload = {
  effectiveAt: string | null;
};

const managedSubscriptionStatuses = new Set<Stripe.Subscription.Status>([
  "active",
  "trialing",
  "past_due",
  "unpaid",
]);

async function resolvePlanPayloadByPriceId(
  stripe: Stripe,
  supabase: any,
  priceId: string,
): Promise<PlanPayload | null> {
  const { data: localPlan } = await supabase
    .from("plans")
    .select("id, name, price, interval")
    .eq("stripe_price_id", priceId)
    .maybeSingle();

  if (localPlan) {
    return {
      id: localPlan.id,
      name: localPlan.name,
      amount: Number(localPlan.price ?? 0),
      interval: localPlan.interval ?? null,
      currency: "USD",
    };
  }

  try {
    const price = await stripe.prices.retrieve(priceId, { expand: ["product"] });
    const productName =
      price.product && typeof price.product === "object" && "name" in price.product
        ? price.product.name
        : null;

    return {
      id: price.id,
      name: price.nickname ?? productName ?? "Planned plan",
      amount: money(price.unit_amount),
      interval: price.recurring?.interval ?? null,
      currency: price.currency?.toUpperCase() ?? "USD",
    };
  } catch (error) {
    console.warn(
      "[api/stripe/invoices] failed to resolve plan by Stripe price:",
      priceId,
      error,
    );
    return null;
  }
}

async function findUpcomingDowngrade(
  stripe: Stripe,
  supabase: any,
  customerIds: string[],
): Promise<UpcomingDowngradePayload | null> {
  for (const customerId of customerIds) {
    try {
      const subscriptions = await stripe.subscriptions.list({
        customer: customerId,
        status: "all",
        limit: 20,
        expand: ["data.items.data.price"],
      });

      const subscription = subscriptions.data.find((row) =>
        managedSubscriptionStatuses.has(row.status),
      );
      if (!subscription || !subscription.schedule) continue;

      const scheduleId =
        typeof subscription.schedule === "string"
          ? subscription.schedule
          : subscription.schedule.id;
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
      const nextPriceId =
        typeof nextPriceRef === "string" ? nextPriceRef : nextPriceRef?.id;
      if (!nextPriceId) continue;

      const nextPlan = await resolvePlanPayloadByPriceId(stripe, supabase, nextPriceId);
      if (!nextPlan) continue;

      const nextCents =
        typeof nextPlan.amount === "number" && Number.isFinite(nextPlan.amount)
          ? Math.round(nextPlan.amount * 100)
          : null;

      const isDowngrade =
        typeof currentCents === "number" &&
        Number.isFinite(currentCents) &&
        typeof nextCents === "number" &&
        Number.isFinite(nextCents) &&
        nextCents < currentCents;

      if (!isDowngrade) continue;

      return {
        ...nextPlan,
        effectiveAt: toIsoDate(nextPhase?.start_date ?? null),
      };
    } catch (error) {
      console.warn(
        "[api/stripe/invoices] failed to resolve upcoming downgrade:",
        customerId,
        error,
      );
    }
  }

  return null;
}

async function findUpcomingCancellation(
  stripe: Stripe,
  customerIds: string[],
  userId: string,
): Promise<UpcomingCancellationPayload | null> {
  const candidates: Stripe.Subscription[] = [];
  const addCandidate = (subscription?: Stripe.Subscription | null) => {
    if (!subscription) return;
    if (!managedSubscriptionStatuses.has(subscription.status)) return;
    if (candidates.some((row) => row.id === subscription.id)) return;
    candidates.push(subscription);
  };

  for (const customerId of customerIds) {
    try {
      const subscriptions = await stripe.subscriptions.list({
        customer: customerId,
        status: "all",
        limit: 20,
      });
      for (const subscription of subscriptions.data) {
        addCandidate(subscription);
      }
    } catch (error) {
      console.warn(
        "[api/stripe/invoices] failed to resolve upcoming cancellation by customer:",
        customerId,
        error,
      );
    }
  }

  const subscriptionsApi = stripe.subscriptions as any;
  if (typeof subscriptionsApi.search === "function") {
    try {
      const result = await subscriptionsApi.search({
        query: `metadata['userId']:'${userId}'`,
        limit: 20,
      });
      for (const subscription of result?.data ?? []) {
        addCandidate(subscription as Stripe.Subscription);
      }
    } catch (error) {
      console.warn(
        "[api/stripe/invoices] failed to resolve upcoming cancellation by metadata search:",
        error,
      );
    }
  }

  for (const subscription of candidates) {
    if (!subscription.cancel_at_period_end) continue;
    return {
      effectiveAt: toIsoDate(subscription.current_period_end),
    };
  }

  return null;
}

async function findCheckoutSessionByUser(
  stripe: Stripe,
  userId: string,
): Promise<Stripe.Checkout.Session | null> {
  const sessionsApi = stripe.checkout.sessions as any;

  if (typeof sessionsApi.search === "function") {
    try {
      const searchResult = await sessionsApi.search({
        query: `metadata['userId']:'${userId}'`,
        limit: 1,
      });

      const fromSearch = searchResult?.data?.[0];
      if (fromSearch) return fromSearch as Stripe.Checkout.Session;
    } catch (error) {
      console.warn("[api/stripe/invoices] checkout search failed:", error);
    }
  }

  try {
    let startingAfter: string | undefined;
    for (let page = 0; page < 5; page++) {
      const pageData = await stripe.checkout.sessions.list({
        limit: 100,
        starting_after: startingAfter,
      });

      const found = pageData.data.find(
        (session) => session.metadata?.userId === userId,
      );
      if (found) return found;

      if (!pageData.has_more || pageData.data.length === 0) break;
      startingAfter = pageData.data[pageData.data.length - 1].id;
    }
  } catch (error) {
    console.warn("[api/stripe/invoices] checkout list failed:", error);
  }

  return null;
}

async function listCustomerIdsByEmail(
  stripe: Stripe,
  email?: string | null,
): Promise<string[]> {
  if (!email) return [];
  const ids: string[] = [];

  try {
    let startingAfter: string | undefined;
    for (let page = 0; page < 10; page++) {
      const customers = await stripe.customers.list({
        email,
        limit: 100,
        starting_after: startingAfter,
      });

      for (const customer of customers.data) {
        if (!("deleted" in customer) && !ids.includes(customer.id)) {
          ids.push(customer.id);
        }
      }

      if (!customers.has_more || customers.data.length === 0) break;
      startingAfter = customers.data[customers.data.length - 1].id;
    }
  } catch (error) {
    console.warn(
      "[api/stripe/invoices] customer lookup by email failed:",
      error,
    );
  }

  return ids;
}

async function listCustomerIdsByUserMetadata(
  stripe: Stripe,
  userId: string,
): Promise<string[]> {
  const ids: string[] = [];
  const customersApi = stripe.customers as any;

  if (typeof customersApi.search === "function") {
    try {
      const result = await customersApi.search({
        query: `metadata['userId']:'${userId}'`,
        limit: 100,
      });
      for (const found of result?.data ?? []) {
        if (
          found &&
          !("deleted" in found) &&
          !ids.includes(found.id as string)
        ) {
          ids.push(found.id as string);
        }
      }
    } catch (error) {
      console.warn(
        "[api/stripe/invoices] customer lookup by metadata failed:",
        error,
      );
    }
  }

  return ids;
}

async function firstInvoiceForCustomer(stripe: Stripe, customerId: string) {
  try {
    const invoices = await stripe.invoices.list({
      customer: customerId,
      limit: 1,
    });
    return invoices.data[0] ?? null;
  } catch (error) {
    console.warn(
      "[api/stripe/invoices] first invoice lookup failed:",
      customerId,
      error,
    );
    return null;
  }
}

async function listInvoicesForCustomer(
  stripe: Stripe,
  customerId: string,
): Promise<Stripe.Invoice[]> {
  const invoices: Stripe.Invoice[] = [];

  try {
    let startingAfter: string | undefined;
    for (let page = 0; page < 20; page++) {
      const response = await stripe.invoices.list({
        customer: customerId,
        limit: 100,
        starting_after: startingAfter,
      });
      invoices.push(...response.data);
      if (!response.has_more || response.data.length === 0) break;
      startingAfter = response.data[response.data.length - 1].id;
    }
  } catch (error) {
    console.warn(
      "[api/stripe/invoices] invoices list failed:",
      customerId,
      error,
    );
  }

  return invoices;
}

async function latestSubscriptionInvoiceForCustomer(
  stripe: Stripe,
  customerId: string,
) {
  try {
    const subscriptions = await stripe.subscriptions.list({
      customer: customerId,
      status: "all",
      limit: 10,
      expand: ["data.latest_invoice"],
    });

    for (const subscription of subscriptions.data) {
      const latest = subscription.latest_invoice;
      if (latest && typeof latest === "object" && "id" in latest) {
        return latest as Stripe.Invoice;
      }
    }
  } catch (error) {
    console.warn(
      "[api/stripe/invoices] latest subscription invoice fallback failed:",
      customerId,
      error,
    );
  }

  return null;
}

async function searchInvoicesByEmail(stripe: Stripe, email?: string | null) {
  if (!email) return [] as Stripe.Invoice[];

  const invoicesApi = stripe.invoices as any;
  if (typeof invoicesApi.search !== "function") {
    const collected: Stripe.Invoice[] = [];
    try {
      let startingAfter: string | undefined;
      for (let page = 0; page < 20; page++) {
        const response = await stripe.invoices.list({
          limit: 100,
          starting_after: startingAfter,
        });
        for (const invoice of response.data) {
          if (
            (invoice.customer_email ?? "").toLowerCase() === email.toLowerCase()
          ) {
            collected.push(invoice);
          }
        }
        if (!response.has_more || response.data.length === 0) break;
        startingAfter = response.data[response.data.length - 1].id;
      }
    } catch (error) {
      console.warn(
        "[api/stripe/invoices] invoice list fallback by email failed:",
        error,
      );
    }
    return collected;
  }

  try {
    const result = await invoicesApi.search({
      query: `customer_email:'${email}'`,
      limit: 100,
    });

    return (result?.data ?? []) as Stripe.Invoice[];
  } catch (error) {
    console.warn(
      "[api/stripe/invoices] invoice search by email failed:",
      error,
    );
    return [] as Stripe.Invoice[];
  }
}

async function listSubscriptionFallbacksByUser(
  stripe: Stripe,
  userId: string,
): Promise<{ customerIds: string[]; invoices: Stripe.Invoice[] }> {
  const customerIds: string[] = [];
  const invoices: Stripe.Invoice[] = [];
  const addCustomer = (value?: string | null) => {
    if (!value) return;
    if (!customerIds.includes(value)) customerIds.push(value);
  };
  const addInvoice = (invoice?: Stripe.Invoice | null) => {
    if (!invoice) return;
    if (!invoices.some((row) => row.id === invoice.id)) invoices.push(invoice);
  };
  const subscriptionsApi = stripe.subscriptions as any;

  if (typeof subscriptionsApi.search === "function") {
    try {
      const result = await subscriptionsApi.search({
        query: `metadata['userId']:'${userId}'`,
        limit: 20,
        expand: ["data.latest_invoice"],
      });

      for (const subscription of result?.data ?? []) {
        if (!subscription) continue;
        const customer =
          typeof subscription.customer === "string"
            ? subscription.customer
            : subscription.customer?.id;
        addCustomer(customer);

        const latest = subscription.latest_invoice;
        if (latest && typeof latest === "object" && "id" in latest) {
          addInvoice(latest as Stripe.Invoice);
        }
      }
    } catch (error) {
      console.warn(
        "[api/stripe/invoices] subscription search by metadata failed:",
        error,
      );
    }
  }

  try {
    let startingAfter: string | undefined;
    for (let page = 0; page < 5; page++) {
      const result = await stripe.subscriptions.list({
        status: "all",
        limit: 100,
        starting_after: startingAfter,
        expand: ["data.latest_invoice"],
      });

      const matched = result.data.filter(
        (sub) => sub.metadata?.userId === userId,
      );
      for (const subscription of matched) {
        const customer =
          typeof subscription.customer === "string"
            ? subscription.customer
            : subscription.customer?.id;
        addCustomer(customer);

        const latest = subscription.latest_invoice;
        if (latest && typeof latest === "object" && "id" in latest) {
          addInvoice(latest as Stripe.Invoice);
        }
      }

      if (!result.has_more || result.data.length === 0) break;
      startingAfter = result.data[result.data.length - 1].id;
    }
  } catch (error) {
    console.warn(
      "[api/stripe/invoices] subscription list fallback failed:",
      error,
    );
  }

  return { customerIds, invoices };
}

async function listInvoicesGlobalFallback(
  stripe: Stripe,
  customerIds: string[],
  emails: string[],
  userId: string,
): Promise<Stripe.Invoice[]> {
  const invoices: Stripe.Invoice[] = [];
  const customerSet = new Set(customerIds.filter(Boolean));
  const emailSet = new Set(
    emails.map((value) => value.trim().toLowerCase()).filter(Boolean),
  );

  if (customerSet.size === 0 && emailSet.size === 0 && !userId) return invoices;

  try {
    let startingAfter: string | undefined;
    for (let page = 0; page < 20; page++) {
      const response = await stripe.invoices.list({
        limit: 100,
        starting_after: startingAfter,
      });

      for (const invoice of response.data) {
        const invoiceCustomerId =
          typeof invoice.customer === "string"
            ? invoice.customer
            : invoice.customer?.id;
        const invoiceEmail = (invoice.customer_email ?? "").toLowerCase();
        const subscriptionUserId =
          invoice.subscription &&
          typeof invoice.subscription === "object" &&
          "metadata" in invoice.subscription
            ? (invoice.subscription.metadata?.userId ?? "")
            : "";

        if (
          customerSet.has(invoiceCustomerId ?? "") ||
          emailSet.has(invoiceEmail) ||
          subscriptionUserId === userId
        ) {
          if (!invoices.some((row) => row.id === invoice.id)) {
            invoices.push(invoice);
          }
        }
      }

      if (!response.has_more || response.data.length === 0) break;
      startingAfter = response.data[response.data.length - 1].id;
    }
  } catch (error) {
    console.warn(
      "[api/stripe/invoices] global invoice fallback failed:",
      error,
    );
  }

  return invoices;
}

function getLinePlanDetails(invoice: Stripe.Invoice) {
  const lines = invoice.lines?.data ?? [];
  const primary =
    lines.find((line) => line.type === "subscription") ?? lines[0];
  const price = primary?.price ?? null;
  const recurring = price?.recurring ?? null;
  const product =
    price?.product &&
    typeof price.product === "object" &&
    "name" in price.product
      ? price.product.name
      : null;
  const lineDescription = primary?.description?.trim() || null;
  const metadataPlanName =
    invoice.subscription &&
    typeof invoice.subscription === "object" &&
    "metadata" in invoice.subscription
      ? (invoice.subscription.metadata?.planName ?? null)
      : null;

  return {
    id: price?.id ?? null,
    name:
      price?.nickname ?? product ?? lineDescription ?? metadataPlanName ?? null,
    interval: recurring?.interval ?? null,
    amount: money(price?.unit_amount),
    currency: price?.currency?.toUpperCase() ?? null,
  };
}

function getInvoicePeriod(invoice: Stripe.Invoice): {
  start: string | null;
  end: string | null;
} {
  const lines = invoice.lines?.data ?? [];
  const primary =
    lines.find((line) => line.type === "subscription") ?? lines[0] ?? null;

  const linePeriodStart =
    primary?.period && typeof primary.period.start === "number"
      ? toIsoDate(primary.period.start)
      : null;
  const linePeriodEnd =
    primary?.period && typeof primary.period.end === "number"
      ? toIsoDate(primary.period.end)
      : null;

  return {
    start: linePeriodStart ?? toIsoDate(invoice.period_start),
    end: linePeriodEnd ?? toIsoDate(invoice.period_end),
  };
}

async function mapInvoiceToRow(
  stripe: Stripe,
  invoice: Stripe.Invoice,
  localPlan: LocalPlanLike | null | undefined,
): Promise<StripeInvoiceRow> {
  const linePlan = getLinePlanDetails(invoice);
  const planName = linePlan.name ?? localPlan?.name ?? null;
  const isPaid = isInvoicePaid(invoice);
  const hostedUrl = invoice.hosted_invoice_url ?? null;
  const invoicePdf = invoice.invoice_pdf ?? null;
  const period = getInvoicePeriod(invoice);
  const receiptUrl = isPaid
    ? await resolveReceiptUrlForInvoice(stripe, invoice)
    : null;

  return {
    id: invoice.id,
    number: invoice.number ?? null,
    status: invoice.status ?? "draft",
    currency: invoice.currency.toUpperCase(),
    total: money(invoice.total),
    amountPaid: money(invoice.amount_paid),
    amountDue: money(invoice.amount_remaining),
    subtotal: money(invoice.subtotal),
    tax: money(invoice.tax),
    createdAt: toIsoDate(invoice.created),
    dueDate: toIsoDate(invoice.due_date),
    periodStart: period.start,
    periodEnd: period.end,
    hostedInvoiceUrl: hostedUrl,
    invoicePdf,
    downloadUrl: isPaid ? (invoicePdf ?? hostedUrl) : null,
    payUrl: !isPaid ? hostedUrl : null,
    receiptUrl,
    isPaid,
    plan: {
      id: linePlan.id ?? localPlan?.id ?? null,
      name: planName,
      interval: linePlan.interval ?? localPlan?.interval ?? null,
      amount:
        linePlan.amount !== null
          ? linePlan.amount
          : typeof localPlan?.price === "number"
            ? localPlan.price
            : null,
      currency: linePlan.currency ?? "USD",
    },
  };
}

export async function GET() {
  try {
    if (
      !process.env.NEXT_PUBLIC_SUPABASE_URL ||
      !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
    ) {
      return NextResponse.json(
        { error: "Missing Supabase environment variables" },
        { status: 500 },
      );
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
      .select("plan_id, stripe_customer_id")
      .eq("id", user.id)
      .maybeSingle();

    const { plan_id: planId, stripe_customer_id: stripeCustomerId } =
      userRow ?? {};

    const { data: localPlan } = planId
      ? await supabase
          .from("plans")
          .select("id, name, price, interval")
          .eq("id", planId)
          .maybeSingle()
      : { data: null as any };

    const localPlanPayload: PlanPayload | null = localPlan
      ? {
          id: localPlan.id,
          name: localPlan.name,
          amount: Number(localPlan.price ?? 0),
          interval: localPlan.interval ?? null,
          currency: "USD",
        }
      : null;

    if (!process.env.STRIPE_SECRET_KEY) {
      return NextResponse.json({
        plan: localPlanPayload,
        upcomingDowngrade: null,
        data: [],
      });
    }

    const stripe = getStripe();
    const candidateIds: string[] = [];
    const addCandidate = (value?: string | null) => {
      if (!value) return;
      if (!candidateIds.includes(value)) candidateIds.push(value);
    };

    addCandidate(stripeCustomerId ?? null);

    const session = await findCheckoutSessionByUser(stripe, user.id);
    if (typeof session?.customer === "string") {
      addCandidate(session.customer);
    } else if (
      session?.customer &&
      typeof session.customer === "object" &&
      "id" in session.customer
    ) {
      addCandidate(session.customer.id);
    }

    const customersByMetadata = await listCustomerIdsByUserMetadata(
      stripe,
      user.id,
    );
    for (const id of customersByMetadata) addCandidate(id);

    const customersByEmail = await listCustomerIdsByEmail(stripe, user.email);
    for (const id of customersByEmail) addCandidate(id);
    const subscriptionFallback = await listSubscriptionFallbacksByUser(
      stripe,
      user.id,
    );
    for (const customer of subscriptionFallback.customerIds) {
      addCandidate(customer);
    }

    let customerId: string | null = candidateIds[0] ?? null;
    const customersWithInvoices: string[] = [];
    for (const candidateId of candidateIds) {
      const probeInvoice = await firstInvoiceForCustomer(stripe, candidateId);
      if (probeInvoice) {
        customersWithInvoices.push(candidateId);
        if (!customerId) customerId = candidateId;
      }
    }

    const customerIdsToLoad =
      customersWithInvoices.length > 0
        ? customersWithInvoices
        : candidateIds.length > 0
          ? candidateIds
          : customerId
            ? [customerId]
            : [];

    const upcomingDowngrade = await findUpcomingDowngrade(
      stripe,
      supabase,
      candidateIds,
    );
    const upcomingCancellation = await findUpcomingCancellation(
      stripe,
      candidateIds,
      user.id,
    );

    if (customerIdsToLoad.length === 0) {
      if (subscriptionFallback.invoices.length === 0) {
        return NextResponse.json({
          plan: localPlanPayload,
          upcomingDowngrade,
          upcomingCancellation,
          data: [],
        });
      }
    }

    // Best-effort backfill so future requests do not depend on Stripe fallbacks.
    if (!stripeCustomerId && customerId) {
      const { error: backfillError } = await supabase
        .from("users")
        .update({ stripe_customer_id: customerId })
        .eq("id", user.id);
      if (backfillError) {
        console.warn(
          "[api/stripe/invoices] failed to backfill stripe_customer_id:",
          backfillError.message,
        );
      }
    }

    const mapped: StripeInvoiceRow[] = [];
    const pushUnique = async (invoice?: Stripe.Invoice | null) => {
      if (!invoice) return;
      if (mapped.some((row) => row.id === invoice.id)) return;
      mapped.push(await mapInvoiceToRow(stripe, invoice, localPlan));
    };

    for (const customerIdToLoad of customerIdsToLoad) {
      const invoices = await listInvoicesForCustomer(stripe, customerIdToLoad);
      for (const invoice of invoices) {
        await pushUnique(invoice);
      }
    }

    // If invoice list is still empty, Stripe may only have latest_invoice on subscription.
    if (mapped.length === 0) {
      if (customerId) {
        const latestSubscriptionInvoice =
          await latestSubscriptionInvoiceForCustomer(stripe, customerId);
        await pushUnique(latestSubscriptionInvoice);
      }
    }

    if (mapped.length === 0) {
      for (const invoice of subscriptionFallback.invoices) {
        await pushUnique(invoice);
      }
    }

    const emailInvoices = await searchInvoicesByEmail(stripe, user.email);
    for (const invoice of emailInvoices) {
      await pushUnique(invoice);
    }

    const globalFallbackInvoices = await listInvoicesGlobalFallback(
      stripe,
      candidateIds,
      [user.email ?? ""],
      user.id,
    );
    for (const invoice of globalFallbackInvoices) {
      await pushUnique(invoice);
    }

    const data: StripeInvoiceRow[] = mapped.sort((a, b) => {
      const aTs = a.createdAt ? new Date(a.createdAt).getTime() : 0;
      const bTs = b.createdAt ? new Date(b.createdAt).getTime() : 0;
      return bTs - aTs;
    });

    const fallbackPlanFromInvoice =
      data.length > 0
        ? {
            id: data[0].plan.id ?? "",
            name: data[0].plan.name ?? "Active plan",
            amount:
              typeof data[0].plan.amount === "number"
                ? data[0].plan.amount
                : data[0].total,
            interval: data[0].plan.interval ?? null,
            currency: data[0].plan.currency ?? data[0].currency,
          }
        : null;

    return NextResponse.json({
      plan: localPlanPayload ?? fallbackPlanFromInvoice,
      upcomingDowngrade,
      upcomingCancellation,
      data,
    });
  } catch (error) {
    console.error("[api/stripe/invoices] error:", error);
    const message =
      error instanceof Error
        ? error.message
        : typeof error === "string"
          ? error
          : "Unexpected error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
