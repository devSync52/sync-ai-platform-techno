import { NextRequest, NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase-server";
import { supabaseAdmin } from "@/lib/supabaseAdmin";

function pick<T = any>(obj: any, keys: string[], fallback: T = null as T): T {
  for (const key of keys) {
    if (obj?.[key] !== undefined && obj?.[key] !== null) return obj[key] as T;
  }
  return fallback;
}

function deriveCustomerName(primary: any, metadata: any): string {
  const first = String(
    pick(metadata, ["FirstName", "ShippingAddressFirstName", "BillingAddressFirstName"], ""),
  ).trim();
  const last = String(
    pick(metadata, ["LastName", "ShippingAddressLastName", "BillingAddressLastName"], ""),
  ).trim();
  const full = `${first} ${last}`.trim();
  if (full) return full;

  const company = String(pick(metadata, ["CompanyName"], "")).trim();
  if (company) return company;

  const fromPrimary = String(primary || "").trim();
  if (fromPrimary) return fromPrimary;

  const email = String(pick(metadata, ["CustomerEmail", "Email"], "")).trim();
  return email || "—";
}

function normalizeOrderRow(row: any) {
  const metadata =
    row?.metadata && typeof row.metadata === "object" ? row.metadata : {};

  const orderSourceOrderId =
    row.order_source_order_id ||
    pick(
      metadata,
      [
        "OrderSourceOrderID",
        "OrderSourceOrderId",
        "SourceOrderID",
        "SourceOrderId",
        "order_source_order_id",
      ],
      null,
    );

  const marketplaceName =
    row.marketplace_name ||
    pick(
      metadata,
      ["MarketplaceName", "ChannelName", "marketplace_name", "Marketplace"],
      null,
    ) ||
    row.origin ||
    "—";

  return {
    order_uuid: row.id,
    _client_id: row.client_id || null,
    order_id: row.order_number || row.id,
    order_source_order_id: orderSourceOrderId || "—",
    client_name: deriveCustomerName(row.client_name, metadata),
    grand_total: row.total,
    order_date: row.created_at,
    order_status: row.status || "—",
    payment_status: row.payment_status || "—",
    shipping_status: row.shipping_status || "—",
    source: row.origin || "manual",
    marketplace_name: marketplaceName,
    _metadata: metadata,
  };
}

function matchesCustomerIdentity(params: {
  row: any;
  customerEmail: string;
  customerWmsId: string;
  customerName: string;
  customerCompanyName: string;
}): boolean {
  const { row, customerEmail, customerWmsId, customerName, customerCompanyName } = params;
  const metadata = row?._metadata || {};
  const rowEmail = String(
    pick(metadata, ["CustomerEmail", "Email", "customer_email"], ""),
  )
    .trim()
    .toLowerCase();
  const rowWmsId = String(
    pick(metadata, ["CustomerID", "customer_id", "WmsUserIdentifier"], ""),
  ).trim();
  const rowName = String(row?.client_name || "").trim().toLowerCase();
  const rowCompany = String(
    pick(metadata, ["CompanyName", "company_name"], row?.client_name || ""),
  )
    .trim()
    .toLowerCase();

  if (customerWmsId && rowWmsId && customerWmsId === rowWmsId) return true;
  if (customerEmail && rowEmail && customerEmail === rowEmail) return true;
  if (customerName && rowName && customerName === rowName) return true;
  if (customerCompanyName && rowCompany && customerCompanyName === rowCompany)
    return true;
  return false;
}

export async function GET(req: NextRequest) {
  const supabase = await createServerSupabaseClient();
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const page = Math.max(Number(searchParams.get("page") || "1"), 1);
  const pageSize = Math.max(Number(searchParams.get("pageSize") || "10"), 1);
  const source = String(searchParams.get("source") || "all");
  const status = searchParams.get("status");
  const search = String(searchParams.get("search") || "").trim();
  const startDate = searchParams.get("startDate");
  const endDate = searchParams.get("endDate");

  const { data: userRecord, error: userError } = await supabaseAdmin
    .from("users")
    .select("account_id, role, name, email")
    .eq("id", user.id)
    .maybeSingle();

  if (userError || !userRecord?.account_id) {
    return NextResponse.json(
      { error: userError?.message || "User account not found" },
      { status: 400 },
    );
  }

  const isCustomerUser =
    userRecord.role === "client" ||
    userRecord.role === "staff-client" ||
    userRecord.role === "staff-user" ||
    userRecord.role === "client-user";

  const { data: accountRecord } = await supabaseAdmin
    .from("accounts")
    .select("parent_account_id")
    .eq("id", userRecord.account_id)
    .maybeSingle();

  const effectiveAccountId = accountRecord?.parent_account_id || userRecord.account_id;
  const customerAccountScope = Array.from(
    new Set([effectiveAccountId, userRecord.account_id].filter(Boolean)),
  );

  const start = (page - 1) * pageSize;
  const end = start + pageSize - 1;

  if (isCustomerUser) {
    let strictQuery = supabaseAdmin
      .from("orders")
      .select("*")
      .in("account_id", customerAccountScope)
      .eq("client_id", userRecord.account_id);
    if (source !== "all") strictQuery = strictQuery.eq("origin", source);
    if (status) strictQuery = strictQuery.eq("status", status);
    if (startDate)
      strictQuery = strictQuery.gte("created_at", `${startDate}T00:00:00.000Z`);
    if (endDate)
      strictQuery = strictQuery.lte("created_at", `${endDate}T23:59:59.999Z`);

    const { data: strictRows, error: strictError } = await strictQuery
      .order("created_at", { ascending: false })
      .limit(5000);

    if (strictError) {
      return NextResponse.json({ error: strictError.message }, { status: 500 });
    }

    let mapped = (strictRows || []).map(normalizeOrderRow);
    if (search) {
      const term = search.toLowerCase();
      mapped = mapped.filter((row: any) =>
        String(row.order_id || "").toLowerCase().includes(term) ||
        String(row.order_source_order_id || "").toLowerCase().includes(term) ||
        String(row.marketplace_name || "").toLowerCase().includes(term) ||
        String(row.client_name || "").toLowerCase().includes(term),
      );
    }

    if (mapped.length > 0) {
      const allStatuses = Array.from(
        new Set(
          mapped
            .map((row: any) => row?.order_status)
            .filter((v: any) => v !== null && v !== undefined)
            .map((v: any) => String(v)),
        ),
      );
      const pagedRows = mapped
        .slice(start, end + 1)
        .map(({ _metadata, _client_id, ...rest }) => rest);
      return NextResponse.json({
        role: userRecord.role,
        accountId: effectiveAccountId,
        totalCount: mapped.length,
        statuses: allStatuses,
        rows: pagedRows,
      });
    }

    // Backward-compatible fallback for old rows where client_id was not set.
    let customerQuery = supabaseAdmin
      .from("orders")
      .select("*")
      .in("account_id", customerAccountScope);
    if (source !== "all") customerQuery = customerQuery.eq("origin", source);
    if (status) customerQuery = customerQuery.eq("status", status);
    if (startDate)
      customerQuery = customerQuery.gte("created_at", `${startDate}T00:00:00.000Z`);
    if (endDate)
      customerQuery = customerQuery.lte("created_at", `${endDate}T23:59:59.999Z`);

    const { data: allRows, error } = await customerQuery
      .order("created_at", { ascending: false })
      .limit(5000);

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    const legacyMapped = (allRows || []).map(normalizeOrderRow);
    const { data: customerAccount } = await supabaseAdmin
      .from("accounts")
      .select("name")
      .eq("id", userRecord.account_id)
      .maybeSingle();
    const customerEmail = String(user.email || userRecord.email || "")
      .trim()
      .toLowerCase();
    const customerWmsId = String(
      (user.user_metadata as any)?.wms_user_identifier ||
        (user.app_metadata as any)?.wms_user_identifier ||
        "",
    ).trim();
    const customerName = String(userRecord.name || "").trim().toLowerCase();
    const customerCompanyName = String(customerAccount?.name || "")
      .trim()
      .toLowerCase();

    let ownRows = legacyMapped.filter(
      (row: any) =>
        String((row as any)?._client_id || "").trim() ===
          String(userRecord.account_id || "").trim() ||
        matchesCustomerIdentity({
          row,
          customerEmail,
          customerWmsId,
          customerName,
          customerCompanyName,
        }),
    );

    if (search) {
      const term = search.toLowerCase();
      ownRows = ownRows.filter((row: any) =>
        String(row.order_id || "").toLowerCase().includes(term) ||
        String(row.order_source_order_id || "").toLowerCase().includes(term) ||
        String(row.marketplace_name || "").toLowerCase().includes(term) ||
        String(row.client_name || "").toLowerCase().includes(term),
      );
    }

    const allStatuses = Array.from(
      new Set(
        ownRows
          .map((row: any) => row?.order_status)
          .filter((v: any) => v !== null && v !== undefined)
          .map((v: any) => String(v)),
      ),
    );

    const pagedRows = ownRows
      .slice(start, end + 1)
      .map(({ _metadata, _client_id, ...rest }) => rest);
    return NextResponse.json({
      role: userRecord.role,
      accountId: effectiveAccountId,
      totalCount: ownRows.length,
      statuses: allStatuses,
      rows: pagedRows,
    });
  }

  let statusQuery = supabaseAdmin
    .from("orders")
    .select("status")
    .eq("account_id", effectiveAccountId);
  if (source !== "all") statusQuery = statusQuery.eq("origin", source);
  if (startDate) statusQuery = statusQuery.gte("created_at", `${startDate}T00:00:00.000Z`);
  if (endDate) statusQuery = statusQuery.lte("created_at", `${endDate}T23:59:59.999Z`);
  if (search) {
    statusQuery = statusQuery.or(
      `order_number.ilike.%${search}%,origin.ilike.%${search}%,status.ilike.%${search}%`,
    );
  }

  const { data: statusRows } = await statusQuery;
  const allStatuses = Array.from(
    new Set(
      (statusRows || [])
        .map((row: any) => row?.status)
        .filter((v: any) => v !== null && v !== undefined)
        .map((v: any) => String(v)),
    ),
  );

  let query = supabaseAdmin
    .from("orders")
    .select("*", {
      count: "exact",
    })
    .eq("account_id", effectiveAccountId);

  if (source !== "all") query = query.eq("origin", source);
  if (status) query = query.eq("status", status);
  if (startDate) query = query.gte("created_at", `${startDate}T00:00:00.000Z`);
  if (endDate) query = query.lte("created_at", `${endDate}T23:59:59.999Z`);
  if (search) {
    query = query.or(
      `order_number.ilike.%${search}%,origin.ilike.%${search}%,status.ilike.%${search}%`,
    );
  }

  const { data, count, error } = await query
    .order("created_at", { ascending: false })
    .range(start, end);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  const rows = (data || []).map((row: any) => {
    const { _metadata, ...rest } = normalizeOrderRow(row);
    return rest;
  });

  return NextResponse.json({
    role: userRecord.role,
    accountId: effectiveAccountId,
    totalCount: count || 0,
    statuses: allStatuses,
    rows,
  });
}
