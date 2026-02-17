import type Stripe from "stripe";
import { getStripe } from "@/lib/stripe";

type SyncStripePlanPriceInput = {
  planId: string;
  name: string;
  price: number;
  interval?: string | null;
  existingStripePriceId?: string | null;
};

const DEFAULT_CURRENCY = "usd";
const MANAGED_BY = "syncai_superadmin";

function normalizeInterval(interval?: string | null): Stripe.PriceCreateParams.Recurring.Interval {
  const value = (interval ?? "month").trim().toLowerCase();
  if (value === "day" || value === "week" || value === "month" || value === "year") {
    return value;
  }
  return "month";
}

export async function syncStripePriceForPlan(input: SyncStripePlanPriceInput) {
  const unitAmount = Math.round(input.price * 100);
  if (!Number.isFinite(unitAmount) || unitAmount <= 0) {
    throw new Error("Plan price must be greater than 0 for Stripe sync");
  }

  const stripe = getStripe();
  const interval = normalizeInterval(input.interval);

  let productId: string | null = null;
  if (input.existingStripePriceId) {
    try {
      const currentPrice = await stripe.prices.retrieve(input.existingStripePriceId, {
        expand: ["product"],
      });
      const productRef = currentPrice.product;
      if (typeof productRef === "string") {
        productId = productRef;
      } else if (productRef && !("deleted" in productRef && productRef.deleted)) {
        productId = productRef.id;
      }
    } catch {
      productId = null;
    }
  }

  if (!productId) {
    const product = await stripe.products.create({
      name: input.name,
      metadata: {
        managed_by: MANAGED_BY,
        local_plan_id: input.planId,
      },
    });
    productId = product.id;
  } else {
    await stripe.products.update(productId, {
      name: input.name,
      metadata: {
        managed_by: MANAGED_BY,
        local_plan_id: input.planId,
      },
    });
  }

  const nextPrice = await stripe.prices.create({
    product: productId,
    unit_amount: unitAmount,
    currency: DEFAULT_CURRENCY,
    recurring: { interval },
    nickname: `${input.name} (${interval})`,
    metadata: {
      managed_by: MANAGED_BY,
      local_plan_id: input.planId,
    },
  });

  return nextPrice.id;
}
