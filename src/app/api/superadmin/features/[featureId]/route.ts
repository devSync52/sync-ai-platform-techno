import { NextRequest, NextResponse } from "next/server";
import { requireSuperadmin } from "@/lib/superadmin";
import { supabaseAdmin } from "@/lib/supabaseAdmin";
import { isMissingFeaturesTableError } from "@/lib/planFeatures";

type FeaturePayload = {
  name?: string;
  slug?: string;
  description?: string | null;
};

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ featureId: string }> },
) {
  const auth = await requireSuperadmin();
  if (!auth.ok) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  const { featureId } = await params;
  if (!featureId) {
    return NextResponse.json({ error: "Missing featureId" }, { status: 400 });
  }

  let body: FeaturePayload;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const updates: Record<string, unknown> = {};

  if (typeof body.name === "string") {
    const name = body.name.trim();
    if (!name) {
      return NextResponse.json({ error: "name cannot be empty" }, { status: 400 });
    }
    updates.name = name;
  }

  if ("slug" in body) {
    return NextResponse.json(
      { error: "slug cannot be edited after feature creation" },
      { status: 400 },
    );
  }

  if ("description" in body) {
    updates.description = body.description?.trim() || null;
  }

  if (Object.keys(updates).length === 0) {
    return NextResponse.json({ error: "No fields to update" }, { status: 400 });
  }

  const { data, error } = await supabaseAdmin
    .from("features")
    .update(updates)
    .eq("id", featureId)
    .select("id, name, slug, description")
    .maybeSingle();

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

  if (!data) {
    return NextResponse.json({ error: "Feature not found" }, { status: 404 });
  }

  return NextResponse.json({ success: true, feature: data });
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ featureId: string }> },
) {
  const auth = await requireSuperadmin();
  if (!auth.ok) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  const { featureId } = await params;
  if (!featureId) {
    return NextResponse.json({ error: "Missing featureId" }, { status: 400 });
  }

  const { error } = await supabaseAdmin.from("features").delete().eq("id", featureId);

  if (error) {
    if (isMissingFeaturesTableError(error)) {
      return NextResponse.json(
        { error: "Features table is missing. Run latest migrations." },
        { status: 500 },
      );
    }
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}
