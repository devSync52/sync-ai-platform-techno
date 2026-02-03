import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!;

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

type CreateInvoicePayload = {
  parent_account_id: string;
  client_account_id: string;
  period_start: string;   // YYYY-MM-DD
  period_end: string;     // YYYY-MM-DD
  currency_code: "USD";
  warehouse_id?: string | null;
};

export async function POST(req: Request) {
  try {
    const body = (await req.json()) as Partial<CreateInvoicePayload>;

    if (
      !body.parent_account_id ||
      !body.client_account_id ||
      !body.period_start ||
      !body.period_end ||
      !body.currency_code
    ) {
      return NextResponse.json(
        {
          success: false,
          error_code: "MISSING_PARAMETERS",
          message:
            "Required fields: parent_account_id, client_account_id, period_start, period_end, currency_code",
        },
        { status: 400 }
      );
    }

    // If warehouse_id is provided, create a single invoice.
    // If not provided, create one invoice per warehouse that has pending usage in the period.

    const createOne = async (warehouseId: string | null) => {
      const { data, error } = await supabase.rpc("billing_create_invoice_3", {
        p_parent_account_id: body.parent_account_id,
        p_client_account_id: body.client_account_id,
        p_period_start: body.period_start,
        p_period_end: body.period_end,
        p_currency_code: body.currency_code,
        p_warehouse_id: warehouseId,
      });

      return { data, error };
    };

    if (body.warehouse_id) {
      const { data, error } = await createOne(body.warehouse_id);

      if (error) {
        console.error("[billing_create_invoice_3] ERROR:", error);

        if (
          error.message.includes("Invoice already exists") ||
          error.message.includes("Invoice já existe")
        ) {
          return NextResponse.json(
            {
              success: false,
              error_code: "INVOICE_ALREADY_EXISTS",
              message: error.message,
            },
            { status: 409 }
          );
        }

        if (error.message.includes("No pending usage rows")) {
          return NextResponse.json(
            {
              success: false,
              error_code: "NO_PENDING_USAGE",
              message: error.message,
            },
            { status: 422 }
          );
        }

        return NextResponse.json(
          {
            success: false,
            error_code: "CREATE_INVOICE_FAILED",
            message: error.message,
          },
          { status: 500 }
        );
      }

      return NextResponse.json(
        {
          success: true,
          data: {
            invoice_id: data,
          },
        },
        { status: 201 }
      );
    }

    // No warehouse_id: discover which warehouses have pending usage
    const { data: usageWhRows, error: whErr } = await supabase
      .from("b1_v_invoice_usage_unified_2")
      .select("warehouse_id")
      .eq("parent_account_id", body.parent_account_id)
      .eq("client_account_id", body.client_account_id)
      .gte("snapshot_date", body.period_start)
      .lte("snapshot_date", body.period_end)
      .eq("status", "pending")
      .not("warehouse_id", "is", null);

    if (whErr) {
      console.error("[billing/invoice/create] Failed to list warehouses:", whErr);
      return NextResponse.json(
        {
          success: false,
          error_code: "LIST_WAREHOUSES_FAILED",
          message: whErr.message,
        },
        { status: 500 }
      );
    }

    const warehouseIds = Array.from(
      new Set((usageWhRows ?? []).map((r: any) => r.warehouse_id).filter(Boolean))
    ) as string[];

    if (warehouseIds.length === 0) {
      return NextResponse.json(
        {
          success: false,
          error_code: "NO_PENDING_USAGE",
          message: "No pending usage rows found for this period.",
        },
        { status: 422 }
      );
    }

    // Fetch human-friendly warehouse labels
    const { data: whInfoRows, error: whInfoErr } = await supabase
      .from("v_billing_warehouses")
      .select("id,name,city,state")
      .eq("parent_account_id", body.parent_account_id)
      .in("id", warehouseIds);

    if (whInfoErr) {
      console.error("[billing/invoice/create] Failed to fetch warehouse info:", whInfoErr);
      // Non-fatal: we can still proceed with IDs only
    }

    const warehouseLabelById: Record<string, string> = {};
    for (const w of whInfoRows ?? []) {
      const name = (w as any).name ?? (w as any).id;
      const city = String((w as any).city ?? "").trim();
      const state = String((w as any).state ?? "").trim();
      const suffix = city || state ? ` (${[city, state].filter(Boolean).join(", ")})` : "";
      warehouseLabelById[(w as any).id] = `${name}${suffix}`;
    }

    const results: Array<
      | { warehouse_id: string; warehouse_label: string; invoice_id: string; success: true }
      | { warehouse_id: string; warehouse_label: string; success: false; error_code: string; message: string }
    > = [];

    for (const wid of warehouseIds) {
      const { data, error } = await createOne(wid);
      if (error) {
        const msg = error.message ?? "Unknown error";
        let code = "CREATE_INVOICE_FAILED";
        if (msg.includes("Invoice already exists") || msg.includes("Invoice já existe")) {
          code = "INVOICE_ALREADY_EXISTS";
        } else if (msg.includes("No pending usage rows")) {
          code = "NO_PENDING_USAGE";
        }
        results.push({
          warehouse_id: wid,
          warehouse_label: warehouseLabelById[wid] ?? wid,
          success: false,
          error_code: code,
          message: msg,
        });
      } else {
        results.push({
          warehouse_id: wid,
          warehouse_label: warehouseLabelById[wid] ?? wid,
          invoice_id: data as string,
          success: true,
        });
      }
    }

    const created = results.filter((r) => (r as any).success === true);

    return NextResponse.json(
      {
        success: true,
        data: {
          mode: "per_warehouse",
          results,
          created_count: created.length,
        },
      },
      { status: 201 }
    );
  } catch (err: any) {
    console.error("[POST invoice/create] Fatal:", err);
    return NextResponse.json(
      {
        success: false,
        error_code: "SERVER_ERROR",
        message: err?.message ?? "Unexpected server error",
      },
      { status: 500 }
    );
  }
}