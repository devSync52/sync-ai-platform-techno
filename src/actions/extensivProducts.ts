"use server";

import AES from "crypto-js/aes";
import Utf8 from "crypto-js/enc-utf8";
import { createClient } from "@supabase/supabase-js";

const EXTENSIV_BASE_URL = "https://secure-wms.com";
const MAX_PAGES_PER_CHANNEL_RUN = 10;
const PAGE_DELAY_MS = 250;
const CHANNEL_DELAY_MS = 500;
const ITEM_RATES_TIMEOUT_MS = 6000;
const STOCK_SUMMARY_TIMEOUT_MS = 20000;

type SyncResult = {
  success: boolean;
  imported: number;
  errors: number;
  logs: Array<Record<string, any>>;
  message?: string;
};

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));
const safeNumber = (val: any): number | null => {
  const n = typeof val === "number" ? val : Number(val);
  return Number.isFinite(n) ? n : null;
};

// ─── FIX 3: Robust quantity extractor ────────────────────────────────────────
// Returns null when no summary had a matching field (distinguishes "no data"
// from "genuinely zero stock"), and correctly sums across multiple summaries.
function extractQty(summaries: any[], fields: string[]): number | null {
  if (!summaries.length) return null;
  let total = 0;
  let found = false;
  for (const s of summaries) {
    for (const f of fields) {
      if (typeof s[f] === "number") {
        total += s[f];
        found = true;
        break;
      }
    }
  }
  return found ? total : null;
}
// ─────────────────────────────────────────────────────────────────────────────

async function fetchItemRates(
  customerId: number,
  itemId: number,
  headers: Record<string, string>,
) {
  // FIX 2: Guard against NaN / falsy before making the network call
  if (!customerId || !itemId || isNaN(customerId) || isNaN(itemId)) return [];

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), ITEM_RATES_TIMEOUT_MS);

  try {
    console.log("fetchItemRates →", customerId, itemId);

    const res = await fetch(
      `${EXTENSIV_BASE_URL}/customers/${customerId}/items/${itemId}/rates`,
      { headers, signal: controller.signal },
    );

    if (!res.ok) {
      const msg = await res.text();
      console.warn("fetchItemRates non-200", customerId, itemId, msg);
      return [];
    }

    const json = await res.json();
    console.log("fetchItemRates facilityRates →", json.facilityRates);

    if (Array.isArray(json.facilityRates)) return json.facilityRates;

    return (
      json._embedded?.["http://api.3plcentral.com/rels/customers/itemrate"] ??
      []
    );
  } catch (err: any) {
    console.warn(
      "fetchItemRates failed",
      customerId,
      itemId,
      err?.message || err,
    );
    return [];
  } finally {
    clearTimeout(timeout);
  }
}

// Known unsupported RQL properties on the stocksummaries endpoint (returns 400):
//   customerid, facilityid — confirmed from Extensiv error logs.
// Only "itemid" is safe to use in RQL. Customer/facility scoping must be done
// via the HAL link returned on the item itself (stockUrlFromItem), which already
// carries the correct context baked into the URL by Extensiv.
async function fetchStockSummaries(
  itemId: number,
  customerId: number | null,
  stockUrlFromItem: string | undefined,
  headers: Record<string, string>,
) {
  if (!itemId) return [];

  const controller = new AbortController();
  const timeout = setTimeout(
    () => controller.abort(),
    STOCK_SUMMARY_TIMEOUT_MS,
  );

  // Extract summaries from a parsed HAL response, trying both known rel casings.
  const extractSummaries = (j: any): any[] => {
    // Extensiv uses inconsistent casing across versions — try both
    return (
      j._embedded?.[
        "http://api.3plcentral.com/rels/inventory/stocksummaries"
      ] ??
      j._embedded?.[
        "http://api.3plCentral.com/rels/inventory/stocksummaries"
      ] ??
      // Direct summaries array (most common response format)
      j.summaries ??
      // Some responses embed directly as an array at the root
      (Array.isArray(j) ? j : null) ??
      []
    );
  };

  const tryFetch = async (targetUrl: string): Promise<any[]> => {
    try {
      const r = await fetch(targetUrl, { headers, signal: controller.signal });
      if (!r.ok) {
        const msg = await r.text();
        console.warn("fetchStockSummaries non-200", itemId, targetUrl, msg);
        return [];
      }
      const j = await r.json();
      // Log the raw response once so we can see the actual shape
      console.log(
        `fetchStockSummaries raw [itemId=${itemId}] url=${targetUrl}`,
        JSON.stringify(j).slice(0, 500),
      );
      return extractSummaries(j);
    } catch (err: any) {
      console.warn(
        "fetchStockSummaries fetch error",
        itemId,
        targetUrl,
        err?.message,
      );
      return [];
    }
  };

  try {
    // Attempt 1: Use the HAL link from the item response — this is the most
    // reliable source and carries the correct customer/facility scope already.
    // NEVER append customerid or facilityid to RQL — the endpoint rejects them.
    if (stockUrlFromItem && typeof stockUrlFromItem === "string") {
      const url = stockUrlFromItem.startsWith("http")
        ? stockUrlFromItem
        : `${EXTENSIV_BASE_URL}${stockUrlFromItem}`;
      const summaries = await tryFetch(url);
      if (summaries.length > 0) return summaries;
    }

    // Attempt 2: Bare itemid-only RQL — the only filter property confirmed
    // supported by the stocksummaries endpoint.
    const byItemId = `${EXTENSIV_BASE_URL}/inventory/stocksummaries?rql=itemid==${itemId}`;
    const summaries = await tryFetch(byItemId);
    if (summaries.length > 0) return summaries;

    // Attempt 3: Try without any RQL at all, scoping via path param if possible.
    // Some Extensiv versions expose /customers/{id}/inventory/stocksummaries.
    if (customerId) {
      const byCustomerPath = `${EXTENSIV_BASE_URL}/customers/${customerId}/inventory/stocksummaries?rql=itemid==${itemId}`;
      const summariesByPath = await tryFetch(byCustomerPath);
      if (summariesByPath.length > 0) return summariesByPath;
    }

    console.warn(
      "fetchStockSummaries: no results after all attempts for itemId",
      itemId,
    );
    return [];
  } catch (err: any) {
    console.warn("fetchStockSummaries failed", itemId, err?.message || err);
    return [];
  } finally {
    clearTimeout(timeout);
  }
}

export async function syncExtensivProductsAction(params: {
  accountId: string;
  force?: boolean;
}) {
  const { accountId, force = false } = params;

  const supabaseUrl =
    process.env.NEXT_PUBLIC_SUPABASE_URL ?? process.env.SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  const credentialSecret =
    process.env.NEXT_PUBLIC_CREDENTIAL_SECRET || "SYNC_SECRET";

  if (!supabaseUrl || !serviceRoleKey) {
    return {
      success: false,
      imported: 0,
      errors: 1,
      logs: [],
      message: "Missing Supabase env",
    };
  }

  const admin = createClient(supabaseUrl, serviceRoleKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });

  try {
    // 1) Load encrypted Extensiv credentials
    const { data: integration, error: integrationErr } = await admin
      .from("account_integrations")
      .select("credentials")
      .eq("account_id", accountId)
      .eq("type", "extensiv")
      .maybeSingle();

    if (integrationErr)
      throw new Error(`Failed to load credentials: ${integrationErr.message}`);
    if (!integration?.credentials)
      throw new Error("No Extensiv credentials found");

    const decrypted = AES.decrypt(
      integration.credentials,
      credentialSecret,
    ).toString(Utf8);
    const { client_id, client_secret, extensiv_id } = JSON.parse(
      decrypted || "{}",
    );
    if (!client_id || !client_secret || !extensiv_id) {
      throw new Error(
        "Missing Extensiv credentials (client_id/client_secret/extensiv_id)",
      );
    }

    // 2) Auth token
    const basicAuth = Buffer.from(`${client_id}:${client_secret}`).toString(
      "base64",
    );

    const tokenRes = await fetch(`${EXTENSIV_BASE_URL}/AuthServer/api/Token`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Basic ${basicAuth}`,
      },
      body: JSON.stringify({
        grant_type: "client_credentials",
        user_login: extensiv_id,
      }),
    });

    const tokenJson = await tokenRes.json();
    const token = tokenJson.access_token;
    if (!token) throw new Error("No access_token returned from Extensiv");

    const headers = {
      Authorization: `Bearer ${token}`,
      Accept: "application/hal+json",
      "Content-Type": "application/hal+json; charset=utf-8",
    };

    // 3) Fetch extensiv channels for this account
    const { data: clients, error: clientsErr } = await admin
      .from("channels")
      .select("external_id, source, account_id")
      .eq("account_id", accountId)
      .eq("source", "extensiv");

    if (clientsErr)
      throw new Error(
        `Failed to fetch Extensiv channels: ${clientsErr.message}`,
      );
    if (!clients || clients.length === 0) {
      return {
        success: true,
        imported: 0,
        errors: 0,
        logs: [],
        message: "No Extensiv channels for this account",
      };
    }

    let totalImported = 0;
    const logs: SyncResult["logs"] = [];

    for (const client of clients) {
      const channelId = client.account_id;
      const externalId = client.external_id;
      if (!externalId) continue;

      // FIX 2: Validate early; skip entire channel if customer ID is unusable
      const extensivCustomerId = Number(externalId);
      if (isNaN(extensivCustomerId)) {
        console.warn(
          "Skipping channel — external_id is not a valid number:",
          externalId,
        );
        logs.push({
          channel: externalId,
          error: "external_id is not a valid number, skipping",
        });
        continue;
      }

      // 3a) Load cursor
      const { data: cursor } = await admin
        .from("extensiv_products_sync_cursor")
        .select("next_page, completed, last_synced_at")
        .eq("client_account_id", channelId)
        .maybeSingle();

      let page = 1;
      if (
        cursor &&
        !cursor.completed &&
        cursor.next_page &&
        cursor.next_page > 0
      ) {
        page = cursor.next_page;
      }

      let keepGoing = true;
      let pagesProcessed = 0;

      while (keepGoing && pagesProcessed < MAX_PAGES_PER_CHANNEL_RUN) {
        const url = `${EXTENSIV_BASE_URL}/customers/${externalId}/items?pgsiz=100&pgnum=${page}&kitinclusion=Either`;
        const res = await fetch(url, { headers });

        if (!res.ok) {
          const msg = await res.text();
          logs.push({ channel: externalId, page, error: msg });
          await admin.from("extensiv_products_sync_cursor").upsert(
            {
              parent_account_id: accountId,
              client_account_id: channelId,
              extensiv_customer_id: extensivCustomerId,
              next_page: page,
              completed: false,
              last_synced_at: new Date().toISOString(),
            },
            { onConflict: "client_account_id" },
          );
          break;
        }

        const json = await res.json();

        const items =
          json._embedded?.["http://api.3plCentral.com/rels/customers/item"] ||
          [];

        const rows: any[] = [];

        for (const item of items) {
          const readOnly = item.readOnly ?? {};
          const options = item.options ?? {};

          const pkg = options.packageUnit?.imperial ?? {};
          const track = options.trackBys ?? {};
          const secondary = options.secondaryUnit ?? {};

          const lengthIn = typeof pkg.length === "number" ? pkg.length : null;
          const widthIn = typeof pkg.width === "number" ? pkg.width : null;
          const heightIn = typeof pkg.height === "number" ? pkg.height : null;

          const volumeCuft =
            lengthIn && widthIn && heightIn
              ? (lengthIn * widthIn * heightIn) / 1728
              : null;

          // FIX 2: safeCustomerId is guaranteed non-NaN here (we validated above)
          const rates = await fetchItemRates(
            extensivCustomerId,
            item.itemId,
            headers,
          );

          // ─── FIX 1: Correct stock URL extraction ─────────────────────────
          // item._links[STOCK_REL] is a HAL link object { href: "..." }, so we
          // must read .href. Guard with typeof to ensure we always get a string.
          const STOCK_REL =
            "http://api.3plcentral.com/rels/inventory/stocksummaries";

          const rawLink =
            item._links?.[STOCK_REL]?.href ??
            item._links?.[STOCK_REL] ?? // sometimes bare string
            item._embedded?.[
              "http://api.3plCentral.com/rels/customers/item"
            ]?.[0]?._links?.[STOCK_REL]?.href ??
            undefined;

          const stockLink: string | undefined =
            typeof rawLink === "string" ? rawLink : undefined;

          console.log(`stockLink for itemId=${item.itemId}:`, stockLink);
          // ─────────────────────────────────────────────────────────────────

          const stockSummaries = await fetchStockSummaries(
            item.itemId,
            extensivCustomerId,
            stockLink,
            headers,
          );
          console.log(
            `stockSummaries for sku=${item.sku} itemId=${item.itemId}:`,
            stockSummaries,
          );

          // ─── FIX 3: Use robust extractQty instead of inline reduce ────────
          const quantityAvailable = extractQty(stockSummaries, [
            "quantityAvailable",
            "quantityavailable",
            "quantityAvailableToAllocate",
            "quantity_available_to_allocate",
            "quantityOnHand",
            "quantity_on_hand",
            "available",
            "availableQuantity",
            "available_quantity",
            "onHand",
            "quantityOnHand",
            "quantity_on_hand",
          ]);

          const quantityOnHold = extractQty(stockSummaries, [
            "quantityOnHold",
            "quantity_on_hold",
            "quantityHold",
            "quantity_hold",
            "onHold",
            "holdQuantity",
            "hold_quantity",
            "allocatedQuantity",
            "allocated_quantity",
            "allocated",
          ]);
          // ─────────────────────────────────────────────────────────────────

          const warehouses = Array.from(
            new Set(
              stockSummaries
                .map((s: any) => s.facilityIdentifier?.name)
                .filter(Boolean),
            ),
          );
          console.log(
            "readOnly.customerIdentifier",
            readOnly.customerIdentifier,
          );

          rows.push({
            parent_account_id: accountId,
            client_account_id: channelId,
            extensiv_customer_id: extensivCustomerId,
            item_id: readOnly.itemId ?? item.itemId ?? null,
            sku: item.sku,
            upc: item.upc ?? null,
            description: item.description ?? null,
            cost: safeNumber(item.cost),
            price: safeNumber(item.price),
            uom:
              options.packageUnit?.unitIdentifier?.name ??
              options.inventoryUnit?.unitIdentifier?.name ??
              "Each",
            pkg_length_in: safeNumber(lengthIn),
            pkg_width_in: safeNumber(widthIn),
            pkg_height_in: safeNumber(heightIn),
            pkg_weight_lb: safeNumber(pkg.weight),
            volume_cuft: safeNumber(volumeCuft),
            track_serial: track.trackSerialNumber === 1,
            has_storage_rates: readOnly.hasStorageRates ?? null,
            carton_units: safeNumber(secondary.inventoryUnitsPerUnit),
            // FIX 3: straightforward — null means no data, 0 means confirmed zero
            quantity_available: safeNumber(quantityAvailable),
            available: safeNumber(quantityAvailable),
            on_hold: safeNumber(quantityOnHold),
            warehouse_name: warehouses.join(", ") || null,
            // Supabase column is numeric; coerce non-numeric (e.g., "NEWCO") to null
            // company_name: safeNumber(
            //   readOnly.customerIdentifier?.customerId ??
            //     readOnly.customerIdentifier?.id ??
            //     readOnly.customerIdentifier?.name,
            // ),
            company_name: readOnly.customerIdentifier?.name,
            last_synced_at: new Date().toISOString(),
            raw: { ...item, rates, stockSummaries },
          });
        }
        console.log("rows", rows);

        if (rows.length > 0) {
          const { error: upsertError } = await admin
            .from("extensiv_products_n")
            .upsert(rows, { onConflict: "client_account_id,sku" });
          console.log("Error", upsertError);

          if (upsertError) {
            logs.push({
              channel: externalId,
              page,
              error: upsertError.message,
            });
          } else {
            totalImported += rows.length;
          }
        }

        keepGoing = items.length === 100;

        await admin.from("extensiv_products_sync_cursor").upsert(
          {
            parent_account_id: accountId,
            client_account_id: channelId,
            extensiv_customer_id: extensivCustomerId,
            next_page: keepGoing ? page + 1 : 1,
            completed: !keepGoing,
            last_synced_at: new Date().toISOString(),
          },
          { onConflict: "client_account_id" },
        );

        page++;
        pagesProcessed++;

        if (keepGoing && pagesProcessed < MAX_PAGES_PER_CHANNEL_RUN) {
          await sleep(PAGE_DELAY_MS);
        }
      }

      await sleep(CHANNEL_DELAY_MS);
    }

    await admin.from("sync_logs").insert({
      account_id: accountId,
      entity: "extensiv_products_n",
      action: "manual_sync",
      status: logs.length > 0 ? "partial" : "success",
      details: { imported: totalImported, errors: logs },
    });

    return {
      success: true,
      imported: totalImported,
      errors: logs.length,
      logs,
    } satisfies SyncResult;
  } catch (error: any) {
    console.error(
      "[syncExtensivProductsAction] Error:",
      error?.message || error,
    );
    return {
      success: false,
      imported: 0,
      errors: 1,
      logs: [{ error: error?.message || "Unexpected error" }],
      message: error?.message,
    } satisfies SyncResult;
  }
}
// "use server";

// import AES from "crypto-js/aes";
// import Utf8 from "crypto-js/enc-utf8";
// import { createClient } from "@supabase/supabase-js";

// const EXTENSIV_BASE_URL = "https://secure-wms.com";
// const MAX_PAGES_PER_CHANNEL_RUN = 10;
// const PAGE_DELAY_MS = 250;
// const CHANNEL_DELAY_MS = 500;
// const ITEM_RATES_TIMEOUT_MS = 6000;
// // Stock summaries can be slow; allow a generous timeout
// const STOCK_SUMMARY_TIMEOUT_MS = 20000;

// type SyncResult = {
//   success: boolean;
//   imported: number;
//   errors: number;
//   logs: Array<Record<string, any>>;
//   message?: string;
// };

// const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

// async function fetchItemRates(
//   customerId: number,
//   itemId: number,
//   headers: Record<string, string>,
// ) {
//   if (!customerId || !itemId) return [];

//   const controller = new AbortController();
//   const timeout = setTimeout(() => controller.abort(), ITEM_RATES_TIMEOUT_MS);

//   try {
//     console.log(customerId, itemId);

//     const res = await fetch(
//       `${EXTENSIV_BASE_URL}/customers/${customerId}/items/${itemId}/rates`,
//       { headers, signal: controller.signal },
//     );
//     console.log("headers", headers);

//     if (!res.ok) {
//       const msg = await res.text();
//       console.warn("fetchItemRates non-200", customerId, itemId, msg);
//       return [];
//     }

//     const json = await res.json();
//     console.log("resjson", json.facilityRates);

//     if (Array.isArray(json.facilityRates)) return json.facilityRates;

//     return (
//       json._embedded?.["http://api.3plcentral.com/rels/customers/itemrate"] ??
//       []
//     );
//   } catch (err: any) {
//     console.warn(
//       "fetchItemRates failed",
//       customerId,
//       itemId,
//       err?.message || err,
//     );
//     return [];
//   } finally {
//     clearTimeout(timeout);
//   }
// }

// async function fetchStockSummaries(
//   itemId: number,
//   customerId: number | null,
//   facilityIds: number[] | undefined,
//   stockUrlFromItem: string | undefined,
//   headers: Record<string, string>,
// ) {
//   if (!itemId) return [];

//   const controller = new AbortController();
//   const timeout = setTimeout(
//     () => controller.abort(),
//     STOCK_SUMMARY_TIMEOUT_MS,
//   );

//   try {
//     const url =
//       stockUrlFromItem && stockUrlFromItem.startsWith("http")
//         ? stockUrlFromItem
//         : `${EXTENSIV_BASE_URL}${
//             stockUrlFromItem ||
//             `/inventory/stocksummaries?rql=itemid==${itemId}${
//               customerId ? `;customerid==${customerId}` : ""
//             }`
//           }`;

//     const tryFetch = async (targetUrl: string) => {
//       const r = await fetch(targetUrl, { headers, signal: controller.signal });
//       if (!r.ok) {
//         const msg = await r.text();
//         console.warn("fetchStockSummaries non-200", itemId, targetUrl, msg);
//         return [];
//       }
//       const j = await r.json();
//       return (
//         j._embedded?.[
//           "http://api.3plcentral.com/rels/inventory/stocksummaries"
//         ] ?? []
//       );
//     };

//     // First, try the provided link (or itemid+customerid with qualifier if present)
//     let summaries = await tryFetch(url);

//     // If nothing came back, retry with a simpler query (no qualifier, no customer filter)
//     if (!summaries || summaries.length === 0) {
//       const fallback = `${EXTENSIV_BASE_URL}/inventory/stocksummaries?rql=itemid==${itemId}`;

//       summaries = await tryFetch(fallback);
//     }

//     // If still empty and we have facilityIds from rates, try per-facility filters
//     if ((!summaries || summaries.length === 0) && facilityIds?.length) {
//       for (const fid of facilityIds) {
//         const byFacility = `${EXTENSIV_BASE_URL}/inventory/stocksummaries?rql=itemid==${itemId};facilityid==${fid}`;
//         const res = await tryFetch(byFacility);
//         if (res && res.length) {
//           summaries = res;
//           break;
//         }
//       }
//     }

//     return summaries ?? [];
//   } catch (err: any) {
//     console.warn("fetchStockSummaries failed", itemId, err?.message || err);
//     return [];
//   } finally {
//     clearTimeout(timeout);
//   }
// }

// export async function syncExtensivProductsAction(params: {
//   accountId: string;
//   force?: boolean;
// }) {
//   const { accountId, force = false } = params;

//   const supabaseUrl =
//     process.env.NEXT_PUBLIC_SUPABASE_URL ?? process.env.SUPABASE_URL;
//   const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
//   const credentialSecret = process.env.CREDENTIAL_SECRET || "SYNC_SECRET";

//   if (!supabaseUrl || !serviceRoleKey) {
//     return {
//       success: false,
//       imported: 0,
//       errors: 1,
//       logs: [],
//       message: "Missing Supabase env",
//     };
//   }
//   console.log("here");

//   const admin = createClient(supabaseUrl, serviceRoleKey, {
//     auth: { autoRefreshToken: false, persistSession: false },
//   });

//   try {
//     // 1) Load encrypted Extensiv credentials
//     const { data: integration, error: integrationErr } = await admin
//       .from("account_integrations")
//       .select("credentials")
//       .eq("account_id", accountId)
//       .eq("type", "extensiv")
//       .maybeSingle();

//     if (integrationErr)
//       throw new Error(`Failed to load credentials: ${integrationErr.message}`);
//     if (!integration?.credentials)
//       throw new Error("No Extensiv credentials found");

//     const decrypted = AES.decrypt(
//       integration.credentials,
//       credentialSecret,
//     ).toString(Utf8);
//     const { client_id, client_secret, extensiv_id } = JSON.parse(
//       decrypted || "{}",
//     );
//     if (!client_id || !client_secret || !extensiv_id) {
//       throw new Error(
//         "Missing Extensiv credentials (client_id/client_secret/extensiv_id)",
//       );
//     }
//     console.log("Decrypted credential", client_id, client_secret);

//     // 2) Auth token
//     const basicAuth = Buffer.from(`${client_id}:${client_secret}`).toString(
//       "base64",
//     );
//     console.log("Basic Auth", basicAuth, extensiv_id);

//     const tokenRes = await fetch(`${EXTENSIV_BASE_URL}/AuthServer/api/Token`, {
//       method: "POST",
//       headers: {
//         "Content-Type": "application/json",
//         Authorization: `Basic ${basicAuth}`,
//       },
//       body: JSON.stringify({
//         grant_type: "client_credentials",
//         user_login: extensiv_id,
//       }),
//     });

//     const tokenJson = await tokenRes.json();
//     const token = tokenJson.access_token;
//     if (!token) throw new Error("No access_token returned from Extensiv");

//     const headers = {
//       Authorization: `Bearer ${token}`,
//       Accept: "application/hal+json",
//       "Content-Type": "application/hal+json; charset=utf-8",
//     };

//     // 3) Fetch extensiv channels for this account
//     const { data: clients, error: clientsErr } = await admin
//       .from("channels")
//       .select("external_id, source, account_id")
//       .eq("account_id", accountId)
//       .eq("source", "extensiv");

//     if (clientsErr)
//       throw new Error(
//         `Failed to fetch Extensiv channels: ${clientsErr.message}`,
//       );
//     if (!clients || clients.length === 0) {
//       return {
//         success: true,
//         imported: 0,
//         errors: 0,
//         logs: [],
//         message: "No Extensiv channels for this account",
//       };
//     }

//     let totalImported = 0;
//     const logs: SyncResult["logs"] = [];
//     console.log("clients", clients);

//     for (const client of clients) {
//       const channelId = client.account_id;
//       const externalId = client.external_id;
//       if (!externalId) continue;
//       const extensivCustomerId = Number(externalId);

//       // 3a) Load cursor
//       const { data: cursor } = await admin
//         .from("extensiv_products_sync_cursor")
//         .select("next_page, completed, last_synced_at")
//         .eq("client_account_id", channelId)
//         .maybeSingle();

//       let page = 1;
//       if (
//         cursor &&
//         !cursor.completed &&
//         cursor.next_page &&
//         cursor.next_page > 0
//       ) {
//         page = cursor.next_page;
//       }

//       let keepGoing = true;
//       let pagesProcessed = 0;

//       while (keepGoing && pagesProcessed < MAX_PAGES_PER_CHANNEL_RUN) {
//         const url = `${EXTENSIV_BASE_URL}/customers/${externalId}/items?pgsiz=100&pgnum=${page}&kitinclusion=Either`;
//         const res = await fetch(url, { headers });

//         if (!res.ok) {
//           const msg = await res.text();
//           logs.push({ channel: externalId, page, error: msg });
//           await admin.from("extensiv_products_sync_cursor").upsert(
//             {
//               parent_account_id: accountId,
//               client_account_id: channelId,
//               extensiv_customer_id: isNaN(extensivCustomerId)
//                 ? null
//                 : extensivCustomerId,
//               next_page: page,
//               completed: false,
//               last_synced_at: new Date().toISOString(),
//             },
//             { onConflict: "client_account_id" },
//           );
//           break;
//         }

//         const json = await res.json();
//         // console.log("json/...", json);

//         // Log the embedded payload with full depth for easier debugging (Node collapses nested objects as [Object])
//         // console.dir(json._embedded, { depth: null });

//         const items =
//           json._embedded?.["http://api.3plCentral.com/rels/customers/item"] ||
//           [];

//         const rows: any[] = [];

//         for (const item of items) {
//           // console.log("item-->", item);

//           const readOnly = item.readOnly ?? {};
//           const options = item.options ?? {};

//           // Some items come without packageUnit (Extensiv only sends it when dimensions are set)
//           const pkg = options.packageUnit?.imperial ?? {};
//           const track = options.trackBys ?? {};
//           const secondary = options.secondaryUnit ?? {};

//           const lengthIn = typeof pkg.length === "number" ? pkg.length : null;
//           const widthIn = typeof pkg.width === "number" ? pkg.width : null;
//           const heightIn = typeof pkg.height === "number" ? pkg.height : null;

//           const volumeCuft =
//             lengthIn && widthIn && heightIn
//               ? (lengthIn * widthIn * heightIn) / 1728
//               : null;

//           const rates = await fetchItemRates(
//             extensivCustomerId,
//             item.itemId,
//             headers,
//           );
//           // console.log("rates", rates);

//           const stockLink =
//             item._embedded?.item?.[0]?._links?.[
//               "http://api.3plcentral.com/rels/inventory/stocksummaries"
//             ]?.href;

//           const facilityIdsFromRates = Array.isArray(rates)
//             ? rates
//                 .map((r: any) => r.facilityIdentifier?.id)
//                 .filter((v: any) => typeof v === "number")
//             : [];

//           const stockSummaries = await fetchStockSummaries(
//             item.itemId,
//             isNaN(extensivCustomerId) ? null : extensivCustomerId,
//             facilityIdsFromRates,
//             stockLink,
//             headers,
//           );
//           console.log("stockSummaries", stockSummaries);

//           const quantityAvailable = stockSummaries.reduce(
//             (sum: number, s: any) => {
//               const fields = [
//                 s.quantityAvailable,
//                 s.quantityavailable,
//                 s.quantityAvailableToAllocate,
//                 s.quantity_available_to_allocate,
//                 s.quantityOnHand,
//                 s.quantity_on_hand,
//               ];
//               const firstNum = fields.find((v) => typeof v === "number");
//               return sum + (typeof firstNum === "number" ? firstNum : 0);
//             },
//             0,
//           );

//           const quantityOnHold = stockSummaries.reduce(
//             (sum: number, s: any) => {
//               const fields = [
//                 s.quantityOnHold,
//                 s.quantity_on_hold,
//                 s.quantityHold,
//                 s.quantity_hold,
//               ];
//               const firstNum = fields.find((v) => typeof v === "number");
//               return sum + (typeof firstNum === "number" ? firstNum : 0);
//             },
//             0,
//           );

//           const warehouses = Array.from(
//             new Set(
//               stockSummaries
//                 .map((s: any) => s.facilityIdentifier?.name)
//                 .filter(Boolean),
//             ),
//           );

//           rows.push({
//             parent_account_id: accountId,
//             client_account_id: channelId,
//             extensiv_customer_id: isNaN(extensivCustomerId)
//               ? null
//               : extensivCustomerId,
//             item_id: readOnly.itemId ?? item.itemId ?? null,
//             sku: item.sku,
//             upc: item.upc ?? null,
//             description: item.description ?? null,
//             cost: typeof item.cost === "number" ? item.cost : null,
//             price: typeof item.price === "number" ? item.price : null,
//             uom:
//               options.packageUnit?.unitIdentifier?.name ??
//               options.inventoryUnit?.unitIdentifier?.name ??
//               "Each",
//             pkg_length_in: lengthIn,
//             pkg_width_in: widthIn,
//             pkg_height_in: heightIn,
//             pkg_weight_lb: typeof pkg.weight === "number" ? pkg.weight : null,
//             volume_cuft: volumeCuft,
//             track_serial: track.trackSerialNumber === 1,
//             has_storage_rates: readOnly.hasStorageRates ?? null,
//             carton_units:
//               typeof secondary.inventoryUnitsPerUnit === "number"
//                 ? secondary.inventoryUnitsPerUnit
//                 : null,
//             quantity_available:
//               quantityAvailable === 0 ? 0 : quantityAvailable || null,
//             available: quantityAvailable === 0 ? 0 : quantityAvailable || null,
//             on_hold: quantityOnHold === 0 ? 0 : quantityOnHold || null,
//             warehouse_name: warehouses.join(", ") || null,
//             company_name: readOnly.customerIdentifier?.name ?? null,
//             last_synced_at: new Date().toISOString(),
//             // Keep rates nested under raw to avoid schema changes if the column doesn't exist
//             raw: { ...item, rates, stockSummaries },
//           });
//         }
//         // console.log("rows", rows);

//         if (rows.length > 0) {
//           const { error: upsertError } = await admin
//             .from("extensiv_products_n")
//             .upsert(rows, { onConflict: "client_account_id,sku" });

//           if (upsertError) {
//             logs.push({
//               channel: externalId,
//               page,
//               error: upsertError.message,
//             });
//           } else {
//             totalImported += rows.length;
//           }
//         }

//         keepGoing = items.length === 100;

//         await admin.from("extensiv_products_sync_cursor").upsert(
//           {
//             parent_account_id: accountId,
//             client_account_id: channelId,
//             extensiv_customer_id: isNaN(extensivCustomerId)
//               ? null
//               : extensivCustomerId,
//             next_page: keepGoing ? page + 1 : 1,
//             completed: !keepGoing,
//             last_synced_at: new Date().toISOString(),
//           },
//           { onConflict: "client_account_id" },
//         );

//         page++;
//         pagesProcessed++;

//         if (keepGoing && pagesProcessed < MAX_PAGES_PER_CHANNEL_RUN) {
//           await sleep(PAGE_DELAY_MS);
//         }
//       }

//       await sleep(CHANNEL_DELAY_MS);
//     }

//     await admin.from("sync_logs").insert({
//       account_id: accountId,
//       entity: "extensiv_products_n",
//       action: "manual_sync",
//       status: logs.length > 0 ? "partial" : "success",
//       details: { imported: totalImported, errors: logs },
//     });

//     return {
//       success: true,
//       imported: totalImported,
//       errors: logs.length,
//       logs,
//     } satisfies SyncResult;
//   } catch (error: any) {
//     console.error(
//       "[syncExtensivProductsAction] Error:",
//       error?.message || error,
//     );
//     return {
//       success: false,
//       imported: 0,
//       errors: 1,
//       logs: [{ error: error?.message || "Unexpected error" }],
//       message: error?.message,
//     } satisfies SyncResult;
//   }
// }
