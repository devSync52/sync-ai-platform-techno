"use client";

import { useEffect, useState } from "react";
import { useCurrentUser } from "@/hooks/useCurrentUser";
import { Database } from "@/types/supabase";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { computeMultiBoxFromItems } from "@/lib/shipping/multibox";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

type PackageItem = {
  sku: string;
  itemIdentifier?: { id?: string | number | null; sku?: string | null };
  itemId?: string | number | null;
  item_id?: string | number | null;
  source?: string | null;
  raw?: any;
  product_name?: string;
  quantity: number;
  length: number;
  width: number;
  height: number;
  weight_lbs: number;
  stackable?: boolean;
  hazardous?: boolean;
  freight_class?: string;
  price?: number;
  subtotal?: number;
};

type Json = any;

const containsHtml = (value?: string | null) => {
  if (!value) return false;
  return /<\/?[a-z][\s\S]*>/i.test(value);
};

const sanitizeHtmlForPreview = (value?: string | null) => {
  if (!value) return "";
  return value
    .replace(/<script[\s\S]*?>[\s\S]*?<\/script>/gi, "")
    .replace(/<style[\s\S]*?>[\s\S]*?<\/style>/gi, "")
    .replace(/\son\w+="[^"]*"/gi, "")
    .replace(/\son\w+='[^']*'/gi, "")
    .replace(/\s(href|src)=["']javascript:[^"']*["']/gi, "");
};

interface Step4PackageDetailsProps {
  draftId: string;
  initialItems: Json;
  onNext: () => void;
  onBack: () => void;
  onItemsChange?: (items: PackageItem[]) => void;
  /** Optional override for the primary CTA label (Orders flow uses "Save Order") */
  nextLabel?: string;
  /** Optional initial warehouse id (billing/public id) already selected in Step 2 */
  initialWarehouseId?: string | null;
}

function ProductSearchModal({
  show,
  onClose,
  onAddProduct,
  clientId,
  warehouseId,
  shipFromName,
  draftId,
}: {
  show: boolean;
  onClose: () => void;
  onAddProduct: (product: PackageItem) => void;
  clientId: string;
  warehouseId?: string;
  shipFromName?: string;
  draftId?: string;
}) {
  const [searchTerm, setSearchTerm] = useState("");
  const [results, setResults] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize] = useState(10);
  const [totalItems, setTotalItems] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [searchError, setSearchError] = useState<string | null>(null);

  const serviceParam =
    typeof window !== "undefined"
      ? new URLSearchParams(window.location.search).get("service")?.toLowerCase()
      : null;

  const fetchProducts = async (page = 1) => {
    if (!clientId) return;

    setLoading(true);
    setSearchError(null);

    try {
      const params = new URLSearchParams({
        clientId,
        warehouseId: warehouseId || "",
        shipFromName: shipFromName || "",
        draftId: draftId || "",
        term: searchTerm || "",
        page: String(page),
        pageSize: String(pageSize),
      });

      if (typeof window !== "undefined") {
        const svc = new URLSearchParams(window.location.search).get("service");
        if (svc) params.set("service", svc);
      }

      const res = await fetch(`/api/products/search?${params.toString()}`, {
        credentials: "include",
      });

      const json = await res.json().catch(async () => {
        try {
          return await res.text();
        } catch {
          return {};
        }
      });

      if (!res.ok) {
        const errorMessage =
          (json as any)?.error ||
          (json as any)?.message ||
          (typeof json === "string" && json.length ? json : null) ||
          `Search failed (${res.status})`;

        console.error("[Step4][ProductSearch] SSR search failed", {
          status: res.status,
          json,
          params: params.toString(),
        });

        toast.error(errorMessage);
        setSearchError(errorMessage);
        setResults([]);
        setTotalItems(0);
        setTotalPages(1);
        return;
      }

      setResults(json?.products || []);
      const nextPage = Number(json?.pagination?.page || page);
      const nextPageSize = Number(json?.pagination?.pageSize || pageSize);
      const nextTotal = Number(
        json?.pagination?.total || (json?.products || []).length || 0,
      );
      const nextTotalPages = Number(
        json?.pagination?.totalPages ||
          Math.max(1, Math.ceil(nextTotal / nextPageSize)),
      );
      setCurrentPage(nextPage);
      setTotalItems(nextTotal);
      setTotalPages(Math.max(1, nextTotalPages));
      setSearchError(null);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = async () => {
    await fetchProducts(1);
  };

  useEffect(() => {
    if (!show) return;
    if (!warehouseId) return;
    if (!clientId) return;
    fetchProducts(1);
  }, [show, clientId, warehouseId, shipFromName]);

    const handleAdd = (product: any) => {
      const length = Number(product.pkg_length_in ?? 0);
      const width = Number(product.pkg_width_in ?? 0);
      const height = Number(product.pkg_height_in ?? 0);
      const weight = Number(product.pkg_weight_lb ?? 0);
    const productPrice = Number(
      product.price ??
        product.site_price ??
        product.store_price ??
        product.sale_price ??
        product.list_price ??
        0,
    );

    const raw = product?.raw || {};
    const itemIdRaw =
      raw?.ItemId ??
      raw?.ReadOnly?.ItemId ??
      raw?.ItemID ??
      raw?.itemId ??
      raw?.item_id ??
      product?.id ??
      null;
    const itemId =
      typeof itemIdRaw === "string" && /^\d+$/.test(itemIdRaw)
        ? Number(itemIdRaw)
        : itemIdRaw;

    const packageItem: PackageItem = {
      sku: product.sku,
      itemIdentifier: { id: itemId, sku: product.sku ?? null },
      itemId,
      item_id: itemId,
      source: product?.source ?? null,
      raw,
      product_name: product.description || "",
      quantity: 1,
      length,
      width,
      height,
      weight_lbs: weight,
      stackable: false,
      hazardous: false,
      freight_class: "",
      price: Number.isFinite(productPrice) ? productPrice : 0,
      subtotal: Number.isFinite(productPrice) ? productPrice : 0,
    };
    onAddProduct(packageItem);
    // Keep modal open so multiple products can be added without reopening.
  };

  if (!show) return null;

  const warehouseMissing = !warehouseId;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white md:rounded-md rounded-none p-4 md:p-6 w-full md:w-[90vw] max-w-3xl h-[100dvh] md:h-auto md:max-h-[80vh] overflow-auto">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-semibold">Search Products</h3>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 font-bold text-xl leading-none"
          >
            ×
          </button>
        </div>
        <div className="mb-4 flex flex-col gap-2 sm:flex-row sm:items-center">
          <Input
            type="text"
            placeholder="Search by SKU or Name"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                handleSearch();
              }
            }}
          />
        <Button
          className="w-full sm:w-auto"
          onClick={handleSearch}
          disabled={loading || warehouseMissing}
        >
            {warehouseMissing
              ? "Select a warehouse first"
              : loading
                ? "Searching..."
                : "Search"}
          </Button>
        </div>
        {searchError ? (
          <div className="mb-3 rounded-md border border-amber-300 bg-amber-50 px-3 py-2 text-sm text-amber-800">
            {searchError}
          </div>
        ) : null}
        <div>
          {warehouseMissing && (
            <p className="text-sm text-amber-700 mb-2">
              Warehouse not selected yet. Go back to Step 2 and select a Ship
              From warehouse.
            </p>
          )}
          {results.length === 0 && !loading && (
            <p className="text-muted-foreground">No products found.</p>
          )}
          <ul className="divide-y divide-gray-200 max-h-64 overflow-auto">
            {results.map((product, idx) => (
              <li key={idx} className="py-2 flex justify-between items-center">
                <div>
                  <div className="font-semibold max-w-[36rem] text-sm">
                    {containsHtml(product.description) ? (
                      <div
                        className="max-h-16 overflow-hidden leading-5 [&_table]:w-full [&_td]:align-top"
                        dangerouslySetInnerHTML={{
                          __html: sanitizeHtmlForPreview(product.description),
                        }}
                      />
                    ) : (
                      <p>{product.description || product.sku}</p>
                    )}
                  </div>
                  <p className="text-sm text-gray-500">SKU: {product.sku}</p>
                  <p className="text-sm text-gray-500">
                    Available:{" "}
                    {Number(product.available ?? 0).toLocaleString("en-US")}
                    {product.on_hand != null
                      ? ` · On hand: ${Number(product.on_hand ?? 0).toLocaleString("en-US")}`
                      : ""}
                    {product.allocated != null
                      ? ` · Allocated: ${Number(product.allocated ?? 0).toLocaleString("en-US")}`
                      : ""}
                  </p>
                </div>
                <Button
                  variant="secondary"
                  className="w-full sm:w-auto"
                  onClick={() => handleAdd(product)}
                  disabled={
                    (() => {
                      const isExtensiv =
                        serviceParam === "extensiv" ||
                        String(product?.source ?? "").toLowerCase() ===
                          "extensiv";
                      return isExtensiv
                        ? false
                        : Number(product.available ?? 0) <= 0;
                    })()
                  }
                >
                  Add to package
                </Button>
              </li>
            ))}
          </ul>

          {!warehouseMissing && (
            <div className="mt-3 flex items-center justify-between gap-2 text-sm">
              <p className="text-gray-500">
                Showing{" "}
                {results.length === 0 ? 0 : (currentPage - 1) * pageSize + 1} to{" "}
                {Math.min(currentPage * pageSize, totalItems)} of {totalItems}
              </p>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => fetchProducts(currentPage - 1)}
                  disabled={loading || currentPage <= 1}
                >
                  Previous
                </Button>
                <span className="text-gray-600">
                  Page {currentPage} / {totalPages}
                </span>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => fetchProducts(currentPage + 1)}
                  disabled={loading || currentPage >= totalPages}
                >
                  Next
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default function Step4PackageDetails({
  draftId,
  initialItems,
  onNext,
  onBack,
  onItemsChange,
  nextLabel = "Next",
  initialWarehouseId = null,
}: Step4PackageDetailsProps) {
  const [items, setItems] = useState<PackageItem[]>([]);
  const [showProductSearchModal, setShowProductSearchModal] = useState(false);
  const [clientId, setClientId] = useState<string>("");
  const [warehouseId, setWarehouseId] = useState<string>(initialWarehouseId || "");
  const [shipFromName, setShipFromName] = useState<string>("");
  const [isCalculating, setIsCalculating] = useState(false);

  const currentUser = useCurrentUser();

  const getDraft = async () => {
    const res = await fetch(`/api/quotes/drafts/${draftId}`, {
      credentials: "include",
    });
    const json = await res.json().catch(() => ({}));
    if (!res.ok) {
      throw new Error(json?.error || json?.message || "Failed to load draft");
    }
    return (json?.draft ?? json?.data?.draft ?? null) as any;
  };

  const patchDraft = async (patch: any) => {
    const res = await fetch(`/api/quotes/drafts/${draftId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify(patch),
    });

    const json = await res.json().catch(() => ({}));
    if (!res.ok) {
      throw new Error(json?.error || json?.message || "Failed to update draft");
    }

    return (json?.draft ?? json?.data?.draft ?? null) as any;
  };

  useEffect(() => {
    async function fetchClientId() {
      if (!currentUser?.account_id) return;

      try {
        const draft = await getDraft();

        if (!draft?.client) {
          console.error(
            "❌ Failed to fetch client ID: missing client on draft",
          );
          return;
        }

        setClientId(String(draft.client));

      const wh =
        (draft as any)?.ship_from?.warehouse_id ??
        (draft as any)?.ship_from?.warehouseId ??
        (draft as any)?.ship_from?.sellercloud_warehouse_id ??
        "";
        const shipName = (draft as any)?.ship_from?.name ?? "";

        setWarehouseId(String(wh || ""));
        setShipFromName(String(shipName || ""));

        console.log("[Step4] Draft context loaded", {
          draftId,
          clientId: String(draft.client),
          warehouseId: String(wh || ""),
          shipFromName: String(shipName || ""),
          shipFrom: (draft as any)?.ship_from ?? null,
        });

        if ((draft as any)?.items) {
          setItems((draft as any).items);
        }
      } catch (e) {
        console.error("❌ Failed to load draft context:", e);
      }
    }

    fetchClientId();
  }, [draftId, currentUser]);

  // Keep warehouseId in sync if parent provides one and we don't have it yet.
  useEffect(() => {
    if (initialWarehouseId && !warehouseId) {
      setWarehouseId(String(initialWarehouseId));
    }
  }, [initialWarehouseId, warehouseId]);

  const handleItemChange = (
    index: number,
    field: keyof PackageItem,
    value: any,
  ) => {
    const updated = [...items];
    const currentItem = updated[index];
    const updatedItem = { ...currentItem, [field]: value };

    if (field === "quantity" || field === "price") {
      const priceRaw = field === "price" ? value : currentItem.price;
      const qtyRaw = field === "quantity" ? value : currentItem.quantity;

      const price = Number(priceRaw ?? 0);
      const quantity = Number(qtyRaw ?? 1);

      updatedItem.subtotal =
        (Number.isFinite(price) ? price : 0) *
        (Number.isFinite(quantity) ? quantity : 1);
    }

    updated[index] = updatedItem;
    setItems(updated);
  };

  const handleAddProductFromSearch = (product: PackageItem) => {
    const qtyToAdd = Number(product.quantity ?? 1) > 0 ? Number(product.quantity ?? 1) : 1;
    const price = Number.isFinite(product.price) ? Number(product.price) : 0;

    const key = (it: PackageItem) =>
      (it.itemIdentifier?.id ?? it.itemId ?? it.item_id ?? null) ??
      (it.sku ? String(it.sku).toLowerCase() : null);

    const existingIdx = items.findIndex(
      (it) => key(it) === key(product),
    );

    if (existingIdx >= 0) {
      const updated = [...items];
      const current = updated[existingIdx];
      const nextQty = Math.max(1, Number(current.quantity ?? 1) + qtyToAdd);
      updated[existingIdx] = {
        ...current,
        quantity: nextQty,
        price,
        subtotal: price * nextQty,
      };
      setItems(updated);
    } else {
      const enriched = {
        ...product,
        quantity: qtyToAdd,
        price,
        subtotal: price * qtyToAdd,
      };
      setItems([...items, enriched]);
    }
  };

  const handleRemoveItem = (index: number) => {
    const updated = [...items];
    updated.splice(index, 1);
    setItems(updated);
  };

  useEffect(() => {
    onItemsChange?.(items);
  }, [items, onItemsChange]);

  const handleSaveAndNext = async () => {
    setIsCalculating(true);
    try {
      const itemsForCalc = items.map((item) => ({
        length: item.length,
        width: item.width,
        height: item.height,
        weight_lbs: item.weight_lbs,
        quantity: item.quantity,
      }));

      const { totalWeight, totalVolume, box } = computeMultiBoxFromItems(
        itemsForCalc as any,
        {
          maxWeightPerBox: 145,
          maxLengthPlusGirth: 165,
        },
      );

      const maxLength =
        items.length > 0 ? Math.max(...items.map((i) => i.length || 0)) : 0;
      const maxWidth =
        items.length > 0 ? Math.max(...items.map((i) => i.width || 0)) : 0;
      const maxHeight =
        items.length > 0 ? Math.max(...items.map((i) => i.height || 0)) : 0;

      console.log("[MULTIBOX][Step4] Preview box from items:", {
        totalWeight,
        totalVolume,
        box,
      });

      const optimizedPackages = [
        {
          sku: "mixed",
          length: Number(box.length.toFixed(2)),
          width: Number(box.width.toFixed(2)),
          height: Number(box.height.toFixed(2)),
          weight: Number(box.weightPerBox.toFixed(2)),
          quantity: box.boxCount,
          package_type: true,
        },
      ];

      const preferences = {
        // Totais da carga
        weight: Number(totalWeight.toFixed(2)),
        volume: Number(totalVolume.toFixed(2)),

        // Dimensões máximas de item (para referência)
        max_length: Number(maxLength.toFixed(2)),
        max_width: Number(maxWidth.toFixed(2)),
        max_height: Number(maxHeight.toFixed(2)),

        // Dimensões da caixa calculada (multi-box)
        length: Number(box.length.toFixed(2)),
        width: Number(box.width.toFixed(2)),
        height: Number(box.height.toFixed(2)),
        box_count: box.boxCount,

        // Pacote "ótimo" para consumo no passo 5
        optimized_packages: optimizedPackages,

        // Outros campos existentes
        residential: false,
        confirmation: "",
        package_type: "",
        service_class: "",
      };

      try {
        await patchDraft({
          items,
          preferences,
          // Always clear previous quote results when package details change
          quote_results: null,
        });
      } catch (e) {
        console.error("❌ Failed to save quote items:", e);
        return;
      }

      onNext();
    } finally {
      setIsCalculating(false);
    }
  };

  return (
    <div className="space-y-4 p-3 md:p-4 bg-white min-h-[60vh] pb-[env(safe-area-inset-bottom)]">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <h2 className="text-lg font-semibold sm:text-xl">Package Details</h2>
        <Button
          size="sm"
          className="w-full sm:w-auto"
          onClick={() => {
            if (!warehouseId) {
              alert(
                "Please select a Ship From warehouse in Step 2 before searching products.",
              );
              return;
            }
            setShowProductSearchModal(true);
          }}
        >
          + Search Product
        </Button>
      </div>

      {items.length === 0 && (
        <p className="text-muted-foreground italic">
          No package items added yet. Click “+ Search Product” to start.
        </p>
      )}

      {items.map((item, index) => (
        <div key={index} className="border rounded-md p-3 md:p-4 space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
            <div>
              <Label>SKU</Label>
              <Input
                value={item.sku}
                disabled
                onChange={(e) => handleItemChange(index, "sku", e.target.value)}
              />
            </div>
            <div>
              <Label>Product Name</Label>
              <div className="min-h-10 rounded-md border bg-muted/20 px-3 py-2 text-sm leading-5">
                {containsHtml(item.product_name) ? (
                  <div
                    className="max-h-16 overflow-hidden [&_table]:w-full [&_td]:align-top"
                    dangerouslySetInnerHTML={{
                      __html: sanitizeHtmlForPreview(item.product_name),
                    }}
                  />
                ) : (
                  <span>{item.product_name || "-"}</span>
                )}
              </div>
            </div>
            <div>
              <Label>Quantity</Label>
              <Input
                type="number"
                value={item.quantity}
                onChange={(e) => {
                  const v = parseInt(e.target.value, 10);
                  handleItemChange(
                    index,
                    "quantity",
                    Number.isFinite(v) ? Math.max(1, v) : 1,
                  );
                }}
                min={1}
              />
            </div>
            <div>
              <Label>Price</Label>
              <Input
                type="number"
                step="0.01"
                value={item.price ?? ""}
                disabled
              />
            </div>
            <div>
              <Label>Subtotal</Label>
              <Input
                type="text"
                value={(item.subtotal || 0).toLocaleString("en-US", {
                  style: "currency",
                  currency: "USD",
                })}
                disabled
              />
            </div>
          </div>

          <div className="flex justify-end">
            <Button
              variant="destructive"
              size="sm"
              onClick={() => handleRemoveItem(index)}
            >
              Remove
            </Button>
          </div>
        </div>
      ))}

      <div className="text-right font-semibold text-base sm:text-lg">
        Total:{" "}
        {items
          .reduce((acc, item) => acc + (item.subtotal || 0), 0)
          .toLocaleString("en-US", { style: "currency", currency: "USD" })}
      </div>

      {/* Desktop actions */}
      <div className="hidden md:flex justify-between">
        <Button variant="outline" onClick={onBack}>
          ← Back
        </Button>
        <div className="space-x-2">
          {/* <Button
            variant="secondary"
            onClick={() => {
              if (!warehouseId) {
                alert('Please select a Ship From warehouse in Step 2 before searching products.')
                return
              }
              setShowProductSearchModal(true)
            }}
          >
            + Search Product
          </Button> */}
          <Button
            onClick={handleSaveAndNext}
            disabled={items.length === 0 || isCalculating}
          >
            {isCalculating ? "Saving order..." : nextLabel}
          </Button>
        </div>
      </div>
      {/* Mobile sticky actions */}
      <div className="md:hidden sticky bottom-[env(safe-area-inset-bottom)] -mx-3 mt-4 border-t bg-background/95 backdrop-blur px-3 py-3 flex gap-2">
        <Button variant="outline" className="w-1/3" onClick={onBack}>
          ← Back
        </Button>
        <Button
          variant="secondary"
          className="w-1/3"
          onClick={() => {
            if (!warehouseId) {
              alert(
                "Please select a Ship From warehouse in Step 2 before searching products.",
              );
              return;
            }
            setShowProductSearchModal(true);
          }}
        >
          + Product
        </Button>
        <Button
          className="w-1/3"
          onClick={handleSaveAndNext}
          disabled={items.length === 0 || isCalculating}
        >
          {isCalculating ? "Calculating…" : nextLabel}
        </Button>
      </div>

      <ProductSearchModal
        show={showProductSearchModal}
        onClose={() => setShowProductSearchModal(false)}
        onAddProduct={handleAddProductFromSearch}
        clientId={clientId}
        warehouseId={warehouseId}
        shipFromName={shipFromName}
        draftId={draftId}
      />
    </div>
  );
}
