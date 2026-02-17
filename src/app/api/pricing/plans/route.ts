import { NextResponse } from "next/server";
import { loadPlansWithFeatures } from "@/lib/planFeatures";

export async function GET() {
  try {
    const plans = await loadPlansWithFeatures();
    const activePlans = plans.filter((plan) => (plan.status ?? "active") === "active");
    return NextResponse.json({ plans: activePlans });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to load pricing plans" },
      { status: 500 },
    );
  }
}
