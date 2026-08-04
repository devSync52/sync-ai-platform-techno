"use client";

import { useState } from "react";
import { toast } from "react-hot-toast";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger } from "@/components/ui/select";
import axiosInstance from "@/config/axios";
import { API_URL } from "@/utils/constants";

const initial = { provider: "LOCAL", productSku: "", name: "", customerId: "", quantity: 0, availableQuantity: 0, price: 0, weight: 0, length: 0, width: 0, height: 0 };

export default function InventoryOperation({ open, onClose, onCreated }) {
    const [form, setForm] = useState(initial);
    const [submitting, setSubmitting] = useState(false);
    const set = (name, value) => setForm((current) => ({ ...current, [name]: value }));
    const submit = async (event) => {
        event.preventDefault(); setSubmitting(true);
        try {
            const payload = { ...form, provider: form.provider === "LOCAL" ? undefined : form.provider };
            const response = await axiosInstance.post(API_URL.INVENTORY, payload);
            toast.success(response.data?.message || "Inventory created", { id: "inventory-create" });
            setForm(initial); onCreated?.(); onClose();
        } catch (error) { toast.error(error?.response?.data?.message || "Unable to create inventory", { id: "inventory-create" }); }
        finally { setSubmitting(false); }
    };
    return <Dialog open={open} onOpenChange={onClose}><DialogContent className="max-w-[min(calc(100vw-2rem),760px)]!">
        <DialogHeader><DialogTitle>Create inventory</DialogTitle></DialogHeader>
        <form onSubmit={submit} className="space-y-4">
            <label className="grid gap-2 text-sm font-medium">Provider (optional)<Select value={form.provider} onValueChange={(value) => set("provider", value)}><SelectTrigger><span>{form.provider === "SYNC" ? "SynC WMS" : "Local database only"}</span></SelectTrigger><SelectContent><SelectItem value="LOCAL">No provider — local database</SelectItem><SelectItem value="SYNC">SynC WMS</SelectItem></SelectContent></Select></label>
            {form.provider === "SYNC" && <label className="grid gap-2 text-sm font-medium">WMS customer ID<Input value={form.customerId} onChange={(e) => set("customerId", e.target.value)} required /></label>}
            <div className="grid gap-4 sm:grid-cols-2"><label className="grid gap-2 text-sm font-medium">SKU<Input value={form.productSku} onChange={(e) => set("productSku", e.target.value)} required /></label><label className="grid gap-2 text-sm font-medium">Name<Input value={form.name} onChange={(e) => set("name", e.target.value)} required /></label></div>
            <div className="grid gap-4 sm:grid-cols-3"><label className="grid gap-2 text-sm font-medium">Quantity<Input type="number" min="0" value={form.quantity} onChange={(e) => set("quantity", e.target.value)} /></label><label className="grid gap-2 text-sm font-medium">Available quantity<Input type="number" min="0" value={form.availableQuantity} onChange={(e) => set("availableQuantity", e.target.value)} /></label><label className="grid gap-2 text-sm font-medium">Price<Input type="number" min="0" step="0.01" value={form.price} onChange={(e) => set("price", e.target.value)} /></label></div>
            <div className="grid gap-4 sm:grid-cols-4"><Input aria-label="Weight" type="number" min="0" placeholder="Weight" value={form.weight} onChange={(e) => set("weight", e.target.value)} /><Input aria-label="Length" type="number" min="0" placeholder="Length" value={form.length} onChange={(e) => set("length", e.target.value)} /><Input aria-label="Width" type="number" min="0" placeholder="Width" value={form.width} onChange={(e) => set("width", e.target.value)} /><Input aria-label="Height" type="number" min="0" placeholder="Height" value={form.height} onChange={(e) => set("height", e.target.value)} /></div>
            <div className="flex justify-end gap-3"><Button type="button" variant="outline" onClick={onClose}>Cancel</Button><Button type="submit" disabled={submitting}>{submitting ? "Creating..." : `Create ${form.provider === "SYNC" ? "with SynC" : "locally"}`}</Button></div>
        </form>
    </DialogContent></Dialog>;
}
