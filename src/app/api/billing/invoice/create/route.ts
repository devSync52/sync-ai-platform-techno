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

    const { data, error } = await supabase.rpc("billing_create_invoice_2", {
      p_parent_account_id: body.parent_account_id,
      p_client_account_id: body.client_account_id,
      p_period_start: body.period_start,
      p_period_end: body.period_end,
      p_currency_code: body.currency_code,
      p_warehouse_id: body.warehouse_id ?? null,
    });

    if (error) {
      console.error("[billing_create_invoice_2] ERROR:", error);

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