import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
);

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const accountId = searchParams.get("account_id");
  const role = searchParams.get("role"); // 'client', 'admin', 'owner', 'staff-client'
  const sourceParam = searchParams.get("source")?.trim().toLowerCase();

  if (!accountId) {
    return new Response(JSON.stringify({ error: "Missing account_id" }), {
      status: 400,
    });
  }

  // base query on the view
  let baseQuery =
    sourceParam === "sellercloud"
      ? supabase.from("sellercloud_products").select("*")
      : sourceParam === "extensiv"
        ? supabase.from("extensiv_products_n").select("*")
        : supabase.from("vw_products_master_enriched").select("*");

  if (role === "client" || role === "staff-client") {
    // client vê apenas os produtos da própria conta (account_id da view)
    baseQuery =
      sourceParam === "extensiv"
        ? baseQuery.eq("client_account_id", accountId)
        : baseQuery.eq("account_id", accountId);
  } else {
    // admin/owner vê todos os produtos relacionados a esse tenant:
    // tanto os que batem no parent_account_id quanto os que batem no account_id
    baseQuery =
      sourceParam === "sellercloud"
        ? baseQuery.eq("account_id", accountId)
        : sourceParam === "extensiv"
          ? baseQuery.or(
              `parent_account_id.eq.${accountId},client_account_id.eq.${accountId}`,
            ) // restringe ao tenant para extensiv também
          : baseQuery.or(
              `parent_account_id.eq.${accountId},account_id.eq.${accountId}`,
            );
  }

  const PAGE_SIZE = 1000;
  let from = 0;
  let all: any[] = [];

  while (true) {
    const { data, error } = await baseQuery.range(from, from + PAGE_SIZE - 1);

    if (error) {
      console.error(
        "[api/products] 🔥 Erro ao buscar produtos (paginado):",
        error.message,
      );
      return new Response(JSON.stringify({ error: error.message }), {
        status: 500,
      });
    }

    if (!data || data.length === 0) {
      break;
    }

    all = all.concat(data);

    if (data.length < PAGE_SIZE) {
      // última página
      break;
    }

    from += PAGE_SIZE;
  }

  const normalizeSellercloud = (row: any) => ({
    // Normalize to match ProductList UI expectations
    id: row.id,
    parent_account_id: row.account_id ?? "",
    client_account_id: row.account_id ?? "",
    sku: row.sku ?? "",
    upc: row.upc ?? null,
    description: row.description ?? row.name ?? null,
    uom: null,
    pkg_length_in: null,
    pkg_width_in: null,
    pkg_height_in: null,
    pkg_weight_lb:
      row.weight ?? row.shipping_weight ?? row.package_weight_lbs ?? null,
    volume_cuft: null,
    track_serial: false,
    has_item_storage_rate: false,
    product_source: "sellercloud",
    source_item_id: row.external_id ?? null,
    created_at: row.created_at ?? "",
    updated_at: row.updated_at ?? "",
    carton_units: null,
    is_wrapping: false,
    client_id: row.account_id ?? "",
    client_name: row.company_name ?? "",
    client_source: "sellercloud",
    wms_customer_id: "",
    client_is_active: true,
    warehouse_id: "",
    billing_method: null,
    external_ids: null,
    account_id: row.account_id ?? "",
    account_name: row.company_name ?? "",
    account_external_id: row.company_id ? String(row.company_id) : null,
    account_source: "sellercloud",
    account_status: row.is_active === false ? "inactive" : "active",
    image_url: row.image_url ?? null,
    quantity_available: row.quantity_available ?? null,
    quantity_physical: row.quantity_physical ?? null,
    site_price: row.site_price ?? row.price ?? null,
    available: row.quantity_available ?? null,
    on_hold: null,
    warehouse_name: row.warehouse_name ?? "",
  });

  const normalizeExtensiv = (row: any) => {
    const rawVal = row.raw;
    const raw =
      rawVal && typeof rawVal === "string"
        ? (() => {
            try {
              return JSON.parse(rawVal);
            } catch {
              return {};
            }
          })()
        : rawVal ?? {};

    const stockRaw = raw?.stockSummaries ?? raw?.stocksummaries ?? [];
    const stock = Array.isArray(stockRaw) ? stockRaw : [];

    const sumFields = (...fields: string[]) =>
      stock.reduce((sum: number, s: any) => {
        for (const f of fields) {
          const v = s?.[f];
          if (typeof v === "number") return sum + v;
        }
        return sum;
      }, 0);

    const qtyFromStock = sumFields(
      "quantityAvailable",
      "quantityavailable",
      "quantityAvailableToAllocate",
      "quantity_available",
      "quantity_available_to_allocate",
      "quantityOnHand",
      "quantity_on_hand",
    );
    const onHoldFromStock = sumFields(
      "quantityOnHold",
      "quantity_on_hold",
      "quantityHold",
      "quantity_hold",
    );
    const warehouses =
      stock
        .map((s: any) => s.facilityIdentifier?.name)
        .filter(Boolean)
        .join(", ") || row.warehouse_name || "";

    const quantityAvailable =
      row.quantity_available ?? row.available ?? (qtyFromStock || null);
    const onHold = row.on_hold ?? (onHoldFromStock || null);

    const companyName =
      row.company_name ??
      row.client_name ??
      row.account_name ??
      raw?.readOnly?.customerIdentifier?.name ??
      "";

    return {
      id: row.id ?? row.external_id ?? row.sku ?? "",
      parent_account_id: row.parent_account_id ?? row.account_id ?? "",
      client_account_id:
        row.client_account_id ?? row.channel_account_id ?? row.account_id ?? "",
      sku: row.sku ?? "",
      upc: row.upc ?? null,
      description: row.description ?? row.name ?? null,
      uom: row.uom ?? null,
      pkg_length_in: row.pkg_length_in ?? row.length ?? null,
      pkg_width_in: row.pkg_width_in ?? row.width ?? null,
      pkg_height_in: row.pkg_height_in ?? row.height ?? null,
      pkg_weight_lb: row.pkg_weight_lb ?? row.weight ?? null,
      volume_cuft: row.volume_cuft ?? null,
      track_serial: row.track_serial ?? false,
      has_item_storage_rate:
        row.has_item_storage_rate ?? row.has_storage_rates ?? false,
      product_source: "extensiv",
      source_item_id:
        row.source_item_id ??
        row.external_id ??
        (row.item_id ? String(row.item_id) : null),
      created_at: row.created_at ?? "",
      updated_at: row.updated_at ?? "",
      carton_units: row.carton_units ?? null,
      is_wrapping: row.is_wrapping ?? false,
      client_id:
        row.client_account_id ?? row.channel_account_id ?? row.account_id ?? "",
      client_name: companyName,
      client_source: "extensiv",
      wms_customer_id: row.extensiv_customer_id
        ? String(row.extensiv_customer_id)
        : "",
      client_is_active: row.is_active ?? true,
      warehouse_id: row.warehouse_id ?? "",
      billing_method: row.billing_method ?? null,
      external_ids: row.external_ids ?? null,
      account_id: row.parent_account_id ?? row.account_id ?? "",
      account_name: row.account_name ?? row.company_name ?? "",
      account_external_id: row.account_external_id ?? row.company_id ?? null,
      account_source: "extensiv",
      account_status:
        row.account_status ?? (row.is_active === false ? "inactive" : "active"),
      image_url: row.image_url ?? null,
      quantity_available: quantityAvailable,
      quantity_physical: row.quantity_physical ?? null,
      site_price: row.site_price ?? row.price ?? null,
      available: quantityAvailable,
      on_hold: onHold,
      warehouse_name: warehouses,
    };
  };

  const products =
    sourceParam === "sellercloud"
      ? all.map(normalizeSellercloud)
      : sourceParam === "extensiv"
        ? all.map(normalizeExtensiv)
        : all;

  // Fetch available integration sources for the account to drive UI filters
  const { data: integrations, error: integrationsError } = await supabase
    .from("account_integrations")
    .select("type")
    .eq("account_id", accountId);

  if (integrationsError) {
    console.error(
      "[api/products] ⚠️ Failed to fetch account integrations:",
      integrationsError.message,
    );
  }

  const sources = Array.from(
    new Set(
      (integrations || [])
        .map((row: any) =>
          String(row?.type ?? "")
            .trim()
            .toLowerCase(),
        )
        .filter(Boolean),
    ),
  );

  return new Response(JSON.stringify({ products, sources }), { status: 200 });
}
