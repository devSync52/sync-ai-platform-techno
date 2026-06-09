"use client";

import { useEffect } from "react";
import { useFieldArray, useForm } from "react-hook-form";
import { yupResolver } from "@hookform/resolvers/yup";
import * as yup from "yup";
import { useDispatch, useSelector } from "react-redux";
import { toast } from "react-hot-toast";
import { Plus, Trash, Upload } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogClose, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { FetchPricesAction, ImportPricesAction } from "@/services/actions/prices";

const priceSchema = yup.object({
    minPrice: yup.number().typeError("Enter minimum price").min(0, "Minimum price cannot be negative").required("Minimum price is required"),
    maxPrice: yup.number().typeError("Enter maximum price").moreThan(yup.ref("minPrice"), "Maximum price must be greater than minimum price").required("Maximum price is required"),
    serviceCharge: yup.number().typeError("Enter service charge").min(0, "Service charge cannot be negative").required("Service charge is required")
});

const schema = yup.object({
    priceList: yup.array().of(priceSchema).min(1, "Add at least one price band")
});

const emptyRow = { minPrice: "", maxPrice: "", serviceCharge: "" };

const parseCsv = (text) => {
    const lines = text.split(/\r?\n/).map((line) => line.trim()).filter(Boolean);
    if (!lines.length) return [];

    const firstLine = lines[0].toLowerCase();
    const hasHeader = firstLine.includes("minprice") || firstLine.includes("maxprice") || firstLine.includes("servicecharge");
    const dataLines = hasHeader ? lines.slice(1) : lines;

    return dataLines.map((line) => {
        const [minPrice, maxPrice, serviceCharge] = line.split(",").map((value) => value?.trim());
        return { minPrice, maxPrice, serviceCharge };
    }).filter((row) => row.minPrice !== undefined && row.maxPrice !== undefined);
};

const toPayload = (data) => ([
    {
        priceList: data.priceList.map((price) => ({
            minPrice: Number(price.minPrice),
            maxPrice: Number(price.maxPrice),
            serviceCharge: Number(price.serviceCharge)
        }))
    }
]);

export default function PriceImport({ open, handleClose }) {
    const dispatch = useDispatch();
    const { importing } = useSelector((state) => state.prices);

    const { register, handleSubmit, control, formState: { errors }, reset } = useForm({
        resolver: yupResolver(schema),
        defaultValues: { priceList: [emptyRow] }
    });
    const { fields, append, remove, replace } = useFieldArray({ control, name: "priceList" });

    useEffect(() => {
        if (open) reset({ priceList: [emptyRow] });
    }, [open, reset]);

    const handleCsvUpload = (event) => {
        const file = event.target.files?.[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = () => {
            const rows = parseCsv(String(reader.result || ""));
            if (!rows.length) {
                toast.error("No price rows found in CSV", { id: "price-import-file" });
                return;
            }
            replace(rows);
            toast.success(`${rows.length} price rows loaded`, { id: "price-import-file" });
        };
        reader.readAsText(file);
        event.target.value = "";
    };

    const onSubmit = (data) => {
        dispatch(ImportPricesAction(toPayload(data))).then((response) => {
            toast.success(response.data?.message || "Prices imported successfully", { id: "price-import" });
            dispatch(FetchPricesAction());
            handleClose();
        }).catch((error) => {
            toast.error(error?.response?.data?.message || "Unable to import prices", { id: "price-import" });
        });
    };

    return (
        <Dialog open={open} onOpenChange={handleClose}>
            <DialogContent className="max-w-[min(calc(100vw-2rem),760px)]! gap-0 overflow-hidden p-0">
                <DialogHeader className="border-b px-6 py-5">
                    <DialogTitle className="text-lg">Import price bands</DialogTitle>
                </DialogHeader>

                <form className="max-h-[calc(100vh-9rem)] overflow-y-auto px-6 py-5" onSubmit={handleSubmit(onSubmit)}>
                    <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                        <p className="text-sm text-slate-500">CSV columns: minPrice, maxPrice, serviceCharge</p>
                        <div className="flex gap-2">
                            <Button type="button" variant="outline" size="sm" onClick={() => append(emptyRow)}>
                                <Plus />
                                Add Row
                            </Button>
                            <label className="group/button inline-flex h-7 shrink-0 cursor-pointer items-center justify-center gap-1 rounded-lg border border-border bg-background px-2.5 text-[0.8rem] font-medium transition-all hover:bg-muted">
                                <Upload className="size-3.5" />
                                Upload CSV
                                <input type="file" accept=".csv,text/csv" className="hidden" onChange={handleCsvUpload} />
                            </label>
                        </div>
                    </div>

                    <div className="space-y-3">
                        {fields.map((field, index) => (
                            <div key={field.id} className="grid gap-3 rounded-lg border border-slate-200 bg-slate-50/70 p-3 sm:grid-cols-[1fr_1fr_1fr_auto]">
                                <label className="grid gap-1 text-xs font-medium text-slate-600">
                                    Min
                                    <Input type="number" min="0" step="0.01" {...register(`priceList.${index}.minPrice`)} />
                                    {errors.priceList?.[index]?.minPrice && <span className="text-xs text-destructive">{errors.priceList[index].minPrice.message}</span>}
                                </label>
                                <label className="grid gap-1 text-xs font-medium text-slate-600">
                                    Max
                                    <Input type="number" min="0" step="0.01" {...register(`priceList.${index}.maxPrice`)} />
                                    {errors.priceList?.[index]?.maxPrice && <span className="text-xs text-destructive">{errors.priceList[index].maxPrice.message}</span>}
                                </label>
                                <label className="grid gap-1 text-xs font-medium text-slate-600">
                                    Service Charge
                                    <Input type="number" min="0" step="0.01" {...register(`priceList.${index}.serviceCharge`)} />
                                    {errors.priceList?.[index]?.serviceCharge && <span className="text-xs text-destructive">{errors.priceList[index].serviceCharge.message}</span>}
                                </label>
                                <Button type="button" variant="outline" size="icon" className="self-end" onClick={() => remove(index)} disabled={fields.length == 1}>
                                    <Trash />
                                </Button>
                            </div>
                        ))}
                    </div>
                    {typeof errors.priceList?.message == "string" && <span className="mt-2 block text-xs text-destructive">{errors.priceList.message}</span>}

                    <DialogFooter className="-mx-6 -mb-5 mt-5 px-6">
                        <DialogClose >
                            <Button variant="outline" type="button" className="w-full sm:w-auto" onClick={handleClose}>
                                Cancel
                            </Button>
                        </DialogClose>
                        <Button type="submit" className="w-full sm:w-auto" disabled={importing}>
                            {importing ? "Importing..." : "Import Prices"}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}
