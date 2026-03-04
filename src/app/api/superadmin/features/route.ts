import { NextRequest, NextResponse } from "next/server";
import { requireSuperadmin } from "@/lib/superadmin";
import { supabaseAdmin } from "@/lib/supabaseAdmin";
import { isMissingFeaturesTableError, loadFeatureCatalog } from "@/lib/planFeatures";

type FeaturePayload = {
  name?: string;
  slug?: string;
  description?: string | null;
};

export async function GET() {
  const auth = await requireSuperadmin();
  if (!auth.ok) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  try {
    const features = await loadFeatureCatalog();
    return NextResponse.json({ features });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to load features" },
      { status: 500 },
    );
  }
}

export async function POST(req: NextRequest) {
  const auth = await requireSuperadmin();
  if (!auth.ok) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  let body: FeaturePayload;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const name = body.name?.trim() ?? "";
  const slug = body.slug?.trim().toLowerCase() ?? "";
  const description = body.description?.trim() || null;

  if (!name || !slug) {
    return NextResponse.json({ error: "name and slug are required" }, { status: 400 });
  }

  const { data, error } = await supabaseAdmin
    .from("features")
    .insert({
      name,
      slug,
      description,
    })
    .select("id, name, slug, description")
    .single();

  if (error) {
    if (isMissingFeaturesTableError(error)) {
      return NextResponse.json(
        { error: "Features table is missing. Run latest migrations." },
        { status: 500 },
      );
    }

    const message = error.message.toLowerCase();
    if (message.includes("duplicate") || message.includes("unique")) {
      return NextResponse.json(
        { error: "Feature slug must be unique" },
        { status: 409 },
      );
    }

    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ success: true, feature: data });
}
