"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "react-hot-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger } from "@/components/ui/select";
import AddressAutocomplete from "@/components/AddressAutocomplete";
import axiosInstance from "@/config/axios";
import { API_URL, PROJECT_URL } from "@/utils/constants";
import { Building2, Loader2, MapPin, Package, Plus, ShoppingCart, Sparkles, Trash, Truck } from "lucide-react";

export default function CreateOrderForm() {
    const router = useRouter();
    const [provider, setProvider] = useState("SYNC");
    const [submitting, setSubmitting] = useState(false);
    const [warehouses, setWarehouses] = useState([]);
    const [warehousesLoading, setWarehousesLoading] = useState(false);
    const [warehousesError, setWarehousesError] = useState("");
    const [products, setProducts] = useState([]);
    const [productsLoading, setProductsLoading] = useState(false);
    const [productsError, setProductsError] = useState("");
    const [orderLines, setOrderLines] = useState([{ sku: "", quantity: 1 }]);
    const [form, setForm] = useState({
        initiation: "", destination: "", referenceNumber: "", customerName: "",
        warehouseId: "", sku: "", quantity: 1, weight: 1, length: 1, width: 1, height: 1,
        shipAddress1: "", shipCity: "", shipState: "", shipPostalCode: "", shipCountry: "US"
    });
    const set = (name, value) => setForm((current) => ({ ...current, [name]: value }));
    const selectedWarehouse = useMemo(() => warehouses.find((warehouse) => String(warehouse.id ?? warehouse.ID) === String(form.warehouseId)), [form.warehouseId, warehouses]);
    const productSku = (product) => String(product?.sku ?? product?.SKU ?? product?.productSku ?? product?.code ?? "");
    const productLabel = (product) => product?.name ?? product?.Name ?? product?.title ?? product?.description ?? productSku(product);
    const updateLine = (index, values) => setOrderLines((current) => current.map((line, lineIndex) => lineIndex === index ? { ...line, ...values } : line));
    const addLine = () => setOrderLines((current) => [...current, { sku: "", quantity: 1 }]);
    const removeLine = (index) => setOrderLines((current) => current.length === 1 ? current : current.filter((_, lineIndex) => lineIndex !== index));

    useEffect(() => {
        if (provider !== "SYNC") return;
        let active = true;
        setWarehousesLoading(true);
        setProductsLoading(true);
        setWarehousesError("");
        setProductsError("");
        axiosInstance.get(API_URL.SYNC_OMS_WAREHOUSES).then((response) => {
            if (!active) return;
            setWarehouses(Array.isArray(response.data?.data) ? response.data.data : []);
        }).catch((error) => {
            if (!active) return;
            setWarehouses([]);
            setWarehousesError(error?.response?.data?.message || "Unable to load SynC warehouses");
        }).finally(() => active && setWarehousesLoading(false));
        axiosInstance.get(API_URL.SYNC_OMS_PRODUCTS, { params: { take: 100, skip: 0 } }).then((response) => {
            if (!active) return;
            setProducts(Array.isArray(response.data?.data) ? response.data.data : []);
        }).catch((error) => {
            if (!active) return;
            setProducts([]);
            setProductsError(error?.response?.data?.message || "Unable to load SynC products");
        }).finally(() => active && setProductsLoading(false));
        return () => { active = false; };
    }, [provider]);

    const submit = async (event) => {
        event.preventDefault();
        setSubmitting(true);
        try {
            if (provider === "SYNC") {
                await axiosInstance.post(API_URL.SYNC_ACTION("oms-order-create"), {
                    channel: "MIDDLEWARE",
                    externalOrderId: form.referenceNumber || `MW-${Date.now()}`,
                    orderNumber: form.referenceNumber || undefined,
                    warehouseId: form.warehouseId || undefined,
                    buyer: { name: form.customerName },
                    shipName: form.customerName,
                    shipAddress1: form.shipAddress1,
                    shipCity: form.shipCity,
                    shipState: form.shipState,
                    shipPostalCode: form.shipPostalCode,
                    shipCountry: form.shipCountry,
                    allowUnmappedLines: true,
                    lines: orderLines.map((line) => ({ sku: line.sku, quantity: Number(line.quantity) }))
                });
                toast.success("Order created in SynC OMS", { id: "create-order" });
            } else {
                await axiosInstance.post(API_URL.ORDER_QUOTE, {
                    provider: "Veryk",
                    initiation: form.initiation,
                    destination: form.destination,
                    option: { reference_number: form.referenceNumber },
                    packageList: { type: "parcel", packages: [{ name: form.sku || "Package", weight: Number(form.weight), dimension: { length: Number(form.length), width: Number(form.width), height: Number(form.height) } }] }
                });
                toast.success("Order submitted through VeryK", { id: "create-order" });
            }
            router.push(PROJECT_URL.DASHBOARD_ORDERS);
        } catch (error) {
            toast.error(error?.response?.data?.message || "Unable to create order", { id: "create-order" });
        } finally { setSubmitting(false); }
    };

    return <form onSubmit={submit} className="space-y-6">
        <section className="overflow-hidden rounded-2xl border border-[#2d2047] bg-[#140821] text-white shadow-xl shadow-purple-950/10">
            <div className="grid gap-6 p-5 lg:grid-cols-[1fr_320px] lg:items-end lg:p-7">
                <div><div className="mb-4 inline-flex items-center gap-2 rounded-lg border border-white/10 bg-white/10 px-3 py-2 text-xs font-bold uppercase tracking-[0.16em] text-purple-100"><ShoppingCart className="size-4" />Order workspace</div><h2 className="text-2xl font-bold">Create a shipment order</h2><p className="mt-2 max-w-2xl text-sm leading-6 text-[#cdbfe2]">Choose the provider first, then complete the customer, fulfillment, destination, and package information.</p></div>
                <label className="grid gap-2 text-sm font-semibold text-purple-100">Order provider<Select value={provider} onValueChange={(value) => { setProvider(value); set("warehouseId", ""); }}><SelectTrigger className="border-white/20 bg-white text-slate-950"><span className="inline-flex items-center gap-2">{provider === "SYNC" ? <Sparkles className="size-4 text-violet-600" /> : <Truck className="size-4 text-amber-600" />}{provider === "SYNC" ? "SynC OMS" : "VeryK"}</span></SelectTrigger><SelectContent><SelectItem value="SYNC">SynC OMS</SelectItem><SelectItem value="Veryk">VeryK</SelectItem></SelectContent></Select></label>
            </div>
        </section>

        <section className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm lg:p-6">
            <div className="mb-5 flex items-center gap-3"><div className="rounded-xl bg-blue-50 p-2 text-blue-700"><Building2 className="size-5" /></div><div><h3 className="font-semibold text-gray-950">Customer and reference</h3><p className="text-sm text-gray-500">Identify who placed this order and its external reference.</p></div></div>
            <div className="grid gap-4 sm:grid-cols-2"><label className="grid gap-2 text-sm font-medium">Customer name<Input value={form.customerName} onChange={(e) => set("customerName", e.target.value)} placeholder="Customer or recipient name" required /></label><label className="grid gap-2 text-sm font-medium">Reference number<Input value={form.referenceNumber} onChange={(e) => set("referenceNumber", e.target.value)} placeholder="PO, marketplace, or internal reference" /></label></div>
        </section>

        <div className="space-y-6">
            {provider === "SYNC" ? <>
                <section className="rounded-2xl border border-violet-200 bg-white p-5 shadow-sm lg:p-6">
                    <div className="mb-5 flex items-center gap-3"><div className="rounded-xl bg-violet-50 p-2 text-violet-700"><Sparkles className="size-5" /></div><div><h3 className="font-semibold text-violet-950">SynC fulfillment</h3><p className="text-sm text-violet-700">The order is created directly in OMS using the selected fulfillment warehouse.</p></div></div>
                    <div className="mt-4">
                        <label className="grid gap-2 text-sm font-medium">Fulfillment warehouse
                            <Select value={form.warehouseId} onValueChange={(value) => set("warehouseId", value)} disabled={warehousesLoading || !warehouses.length}>
                                <SelectTrigger className="w-full"><span className="truncate">{warehousesLoading ? "Loading warehouses..." : selectedWarehouse ? `${selectedWarehouse.name || selectedWarehouse.Name}${selectedWarehouse.code || selectedWarehouse.Code ? ` (${selectedWarehouse.code || selectedWarehouse.Code})` : ""}` : "Select a SynC warehouse"}</span></SelectTrigger>
                                <SelectContent>{warehouses.map((warehouse) => { const id = String(warehouse.id ?? warehouse.ID); return <SelectItem key={id} value={id}>{warehouse.name || warehouse.Name || id}{warehouse.code || warehouse.Code ? ` (${warehouse.code || warehouse.Code})` : ""}</SelectItem>; })}</SelectContent>
                            </Select>
                            {warehousesError && <span className="text-xs text-destructive">{warehousesError}. Configure and activate SynC in Carrier Hub.</span>}
                            {!warehousesLoading && !warehousesError && !warehouses.length && <span className="text-xs text-muted-foreground">No SynC warehouses are available.</span>}
                        </label>
                    </div>
                </section>
                <section className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm lg:p-6">
                    <div className="mb-5 flex items-center justify-between gap-3"><div className="flex items-center gap-3"><div className="rounded-xl bg-amber-50 p-2 text-amber-700"><Package className="size-5" /></div><div><h3 className="font-semibold">Order products</h3><p className="text-sm text-gray-500">Add one or more OMS products with the required quantity.</p></div></div><Button type="button" variant="outline" onClick={addLine} disabled={productsLoading}><Plus />Add product</Button></div>
                    <div className="space-y-3">{orderLines.map((line, index) => <div key={index} className="grid gap-3 rounded-xl border bg-slate-50 p-4 sm:grid-cols-[1fr_150px_auto] sm:items-end">
                        <label className="grid gap-2 text-sm font-medium">Product
                            <Select value={line.sku} onValueChange={(value) => updateLine(index, { sku: value })} disabled={productsLoading || !products.length}><SelectTrigger className="w-full min-w-0 bg-white"><span className="min-w-0 flex-1 truncate text-left">{productsLoading ? "Loading products..." : line.sku ? `${productLabel(products.find((product) => productSku(product) === line.sku)) || line.sku} (${line.sku})` : "Select an OMS product"}</span></SelectTrigger><SelectContent align="start" alignItemWithTrigger={false} className="w-[min(42rem,calc(100vw-2rem))] max-w-[calc(100vw-2rem)] min-w-72 p-1">{products.map((product) => { const sku = productSku(product); return sku ? <SelectItem className="min-h-9 py-2" key={product.id || sku} value={sku}><span className="whitespace-normal break-words pr-2 leading-5">{productLabel(product)} <span className="font-medium text-muted-foreground">({sku})</span></span></SelectItem> : null; })}</SelectContent></Select>
                        </label>
                        <label className="grid gap-2 text-sm font-medium">Quantity<Input type="number" min="1" value={line.quantity} onChange={(event) => updateLine(index, { quantity: event.target.value })} /></label>
                        <Button type="button" variant="outline" size="icon" onClick={() => removeLine(index)} disabled={orderLines.length === 1}><Trash /></Button>
                    </div>)}</div>
                    {productsError && <p className="mt-3 text-xs text-destructive">{productsError}. Check the SynC integration and product catalogue.</p>}
                    {!productsLoading && !productsError && !products.length && <p className="mt-3 text-xs text-muted-foreground">No products are available in SynC OMS.</p>}
                </section>
                <section className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm lg:p-6"><div className="mb-5 flex items-center gap-3"><div className="rounded-xl bg-emerald-50 p-2 text-emerald-700"><MapPin className="size-5" /></div><div><h3 className="font-semibold">Destination</h3><p className="text-sm text-gray-500">Shipping address supplied to OMS.</p></div></div><label className="grid gap-2 text-sm font-medium">Address line 1<Input value={form.shipAddress1} onChange={(e) => set("shipAddress1", e.target.value)} placeholder="Street address" /></label><div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-4"><Input placeholder="City" value={form.shipCity} onChange={(e) => set("shipCity", e.target.value)} /><Input placeholder="State" value={form.shipState} onChange={(e) => set("shipState", e.target.value)} /><Input placeholder="Postal code" value={form.shipPostalCode} onChange={(e) => set("shipPostalCode", e.target.value)} /><Input placeholder="Country" value={form.shipCountry} onChange={(e) => set("shipCountry", e.target.value)} /></div></section>
            </> : <>
                <section className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm lg:p-6"><div className="mb-5 flex items-center gap-3"><div className="rounded-xl bg-emerald-50 p-2 text-emerald-700"><MapPin className="size-5" /></div><div><h3 className="font-semibold">Pickup and delivery</h3><p className="text-sm text-gray-500">Use saved address records, matching the quote and label workflows.</p></div></div><div className="grid gap-4 sm:grid-cols-2"><AddressAutocomplete label="Pickup address" value={form.initiation} onChange={(value) => set("initiation", value)} /><AddressAutocomplete label="Delivery address" value={form.destination} onChange={(value) => set("destination", value)} /></div></section>
                <section className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm lg:p-6"><div className="mb-5 flex items-center gap-3"><div className="rounded-xl bg-amber-50 p-2 text-amber-700"><Package className="size-5" /></div><div><h3 className="font-semibold">Package details</h3><p className="text-sm text-gray-500">Enter the package identity, weight, and dimensions.</p></div></div><label className="grid gap-2 text-sm font-medium">Package name<Input value={form.sku} onChange={(e) => set("sku", e.target.value)} placeholder="Package or product name" /></label><div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-4"><Input type="number" min="0" placeholder="Weight" value={form.weight} onChange={(e) => set("weight", e.target.value)} /><Input type="number" min="0" placeholder="Length" value={form.length} onChange={(e) => set("length", e.target.value)} /><Input type="number" min="0" placeholder="Width" value={form.width} onChange={(e) => set("width", e.target.value)} /><Input type="number" min="0" placeholder="Height" value={form.height} onChange={(e) => set("height", e.target.value)} /></div></section>
            </>}
        </div>
        <div className="sticky bottom-4 flex justify-end rounded-2xl border border-gray-200 bg-white/95 p-4 shadow-lg backdrop-blur"><Button size="lg" type="submit" disabled={submitting || (provider === "SYNC" && (warehousesLoading || productsLoading || !form.warehouseId || !orderLines.length || orderLines.some((line) => !line.sku || Number(line.quantity) < 1)))}>{submitting && <Loader2 className="size-4 animate-spin" />}{submitting ? "Creating order..." : `Create order with ${provider === "SYNC" ? "SynC" : "VeryK"}`}</Button></div>
    </form>;
}
