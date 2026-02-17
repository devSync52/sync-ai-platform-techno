import { NextResponse } from "next/server";
import { loadPlansWithFeatures } from "@/lib/planFeatures";

export async function GET() {
  try {
    const plans = await loadPlansWithFeatures();
    return NextResponse.json({ plans });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to load pricing plans" },
      { status: 500 },
    );
  }
}
