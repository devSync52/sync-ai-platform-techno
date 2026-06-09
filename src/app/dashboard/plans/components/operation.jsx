"use client";

import { useEffect } from "react";
import { Controller, useFieldArray, useForm } from "react-hook-form";
import { yupResolver } from "@hookform/resolvers/yup";
import * as yup from "yup";
import { useDispatch, useSelector } from "react-redux";
import { toast } from "react-hot-toast";
import { Plus, Trash } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogClose, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { CreatePlanAction, FetchPlansAction, UpdatePlanAction } from "@/services/actions/plans";

const schema = yup.object({
    name: yup.string().required("Plan name is required"),
    description: yup.string().required("Description is required"),
    features: yup.array().of(yup.object({
        value: yup.string().required("Feature is required")
    })).min(1, "Add at least one feature"),
    highlighted: yup.boolean(),
    monthlyAmount: yup.number().typeError("Enter monthly amount").min(0, "Amount cannot be negative").required("Monthly amount is required"),
    yearlyAmount: yup.number().typeError("Enter yearly amount").min(0, "Amount cannot be negative").required("Yearly amount is required"),
    currency: yup.string().required("Currency is required")
});

const getAmount = (details, interval) => details?.prices?.find((price) => price.interval == interval)?.amount ?? 0;

const toFormValues = (details) => ({
    name: details?.name || "",
    description: details?.description || "",
    features: Array.isArray(details?.features) && details.features.length ? details.features.map((feature) => ({ value: feature })) : [{ value: "" }],
    highlighted: Boolean(details?.highlighted),
    monthlyAmount: getAmount(details, "month"),
    yearlyAmount: getAmount(details, "year"),
    currency: "usd"
});

const toPayload = (data) => ({
    name: data.name.trim(),
    description: data.description.trim(),
    features: data.features.map((feature) => feature.value.trim()).filter(Boolean),
    highlighted: Boolean(data.highlighted),
    priceList: [
        {
            amount: Number(data.monthlyAmount),
            currency: "usd",
            interval: "month"
        },
        {
            amount: Number(data.yearlyAmount),
            currency: "usd",
            interval: "year"
        }
    ]
});

export default function PlanOperation({ open, details, handleClose }) {
    const dispatch = useDispatch();
    const { saving } = useSelector((state) => state.plans);
    const isEdit = Boolean(details?.id);

    const { register, handleSubmit, control, formState: { errors }, reset } = useForm({
        resolver: yupResolver(schema),
        defaultValues: toFormValues(details)
    });
    const { fields, append, remove } = useFieldArray({
        control,
        name: "features"
    });

    useEffect(() => {
        reset(toFormValues(details));
    }, [details, open, reset]);

    const onSubmit = (data) => {
        const action = isEdit ? UpdatePlanAction(details.id, toPayload(data)) : CreatePlanAction(toPayload(data));

        dispatch(action).then((response) => {
            toast.success(response.data?.message || `Plan ${isEdit ? "updated" : "created"} successfully`, { id: "plan-operation" });
            dispatch(FetchPlansAction());
            handleClose();
        }).catch((error) => {
            toast.error(error?.response?.data?.message || `Unable to ${isEdit ? "update" : "create"} plan`, { id: "plan-operation" });
        });
    };

    return (
        <Dialog open={open} onOpenChange={handleClose}>
            <DialogContent className="max-w-[min(calc(100vw-2rem),720px)]! gap-0 overflow-hidden p-0">
                <DialogHeader className="border-b px-6 py-5">
                    <DialogTitle className="text-lg">{isEdit ? "Update plan" : "Create plan"}</DialogTitle>
                </DialogHeader>

                <form className="max-h-[calc(100vh-9rem)] overflow-y-auto px-6 py-5" onSubmit={handleSubmit(onSubmit)}>
                    <div className="space-y-4">
                        <div className="grid gap-4 sm:grid-cols-2">
                            <label className="grid gap-2 text-sm font-medium text-slate-700">
                                Name
                                <Input {...register("name")} placeholder="Enterprise" />
                                {errors.name && <span className="text-xs text-destructive">{errors.name.message}</span>}
                            </label>

                            <label className="grid gap-2 text-sm font-medium text-slate-700">
                                Currency
                                <Input {...register("currency")} readOnly className="bg-slate-100 text-slate-600" />
                                {errors.currency && <span className="text-xs text-destructive">{errors.currency.message}</span>}
                            </label>
                        </div>

                        <label className="grid gap-2 text-sm font-medium text-slate-700">
                            Description
                            <Input {...register("description")} placeholder="For large operations" />
                            {errors.description && <span className="text-xs text-destructive">{errors.description.message}</span>}
                        </label>

                        <div className="grid gap-4 sm:grid-cols-2">
                            <label className="grid gap-2 text-sm font-medium text-slate-700">
                                Monthly Amount
                                <Input type="number" min="0" step="0.01" {...register("monthlyAmount")} placeholder="0" />
                                {errors.monthlyAmount && <span className="text-xs text-destructive">{errors.monthlyAmount.message}</span>}
                            </label>

                            <label className="grid gap-2 text-sm font-medium text-slate-700">
                                Yearly Amount
                                <Input type="number" min="0" step="0.01" {...register("yearlyAmount")} placeholder="0" />
                                {errors.yearlyAmount && <span className="text-xs text-destructive">{errors.yearlyAmount.message}</span>}
                            </label>
                        </div>

                        <div className="grid gap-2 text-sm font-medium text-slate-700">
                            <div className="flex items-center justify-between gap-3">
                                <span>Features</span>
                                <Button type="button" variant="outline" size="sm" onClick={() => append({ value: "" })}>
                                    <Plus />
                                    Add Feature
                                </Button>
                            </div>
                            <div className="space-y-2">
                                {fields.map((field, index) => (
                                    <div key={field.id} className="flex gap-2">
                                        <div className="flex-1">
                                            <Input {...register(`features.${index}.value`)} placeholder="Unlimited shipments" />
                                            {errors.features?.[index]?.value && (
                                                <span className="mt-1 block text-xs text-destructive">{errors.features[index].value.message}</span>
                                            )}
                                        </div>
                                        <Button type="button" variant="outline" size="icon" onClick={() => remove(index)} disabled={fields.length == 1}>
                                            <Trash />
                                        </Button>
                                    </div>
                                ))}
                            </div>
                            {typeof errors.features?.message == "string" && <span className="text-xs text-destructive">{errors.features.message}</span>}
                        </div>

                        <div className="flex items-center justify-between rounded-lg bg-slate-100 px-4 py-3">
                            <div>
                                <p className="text-sm font-medium text-slate-900">Highlighted Plan</p>
                                <p className="text-sm text-slate-500">Promote this plan in subscription selection.</p>
                            </div>
                            <Controller control={control} name="highlighted" render={({ field }) => (
                                <Switch checked={field.value} onCheckedChange={field.onChange} />
                            )} />
                        </div>
                    </div>

                    <DialogFooter className="-mx-6 -mb-5 mt-5 px-6">
                        <DialogClose >
                            <Button variant="outline" type="button" className="w-full sm:w-auto" onClick={handleClose}>
                                Cancel
                            </Button>
                        </DialogClose>
                        <Button type="submit" className="w-full sm:w-auto" disabled={saving}>
                            {saving ? "Saving..." : isEdit ? "Update Plan" : "Create Plan"}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}
