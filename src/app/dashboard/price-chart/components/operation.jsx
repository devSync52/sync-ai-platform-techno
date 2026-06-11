"use client";

import { useEffect } from "react";
import { Controller, useForm } from "react-hook-form";
import { yupResolver } from "@hookform/resolvers/yup";
import * as yup from "yup";
import { useDispatch, useSelector } from "react-redux";
import { toast } from "react-hot-toast";
import { Button } from "@/components/ui/button";
import { Dialog, DialogClose, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { CreatePriceAction, FetchPricesAction, UpdatePriceAction } from "@/services/actions/prices";

const schema = yup.object({
    minPrice: yup.number().typeError("Enter minimum price").min(0, "Minimum price cannot be negative").required("Minimum price is required"),
    maxPrice: yup.number().typeError("Enter maximum price").moreThan(yup.ref("minPrice"), "Maximum price must be greater than minimum price").required("Maximum price is required"),
    serviceCharge: yup.number().typeError("Enter service charge").min(0, "Service charge cannot be negative").required("Service charge is required"),
    serviceChargeType: yup.string().oneOf(["percentage", "flat"]).required("Service charge type is required"),
    status: yup.string().oneOf(["active", "deactive"])
});

const getPriceId = (details) => details?.id || details?._id || details?.priceId;
const getServiceChargeType = (details) => details?.serviceChargeType || details?.chargeType || "flat";

const toFormValues = (details) => ({
    minPrice: details?.minPrice ?? "",
    maxPrice: details?.maxPrice ?? "",
    serviceCharge: details?.serviceCharge ?? "",
    serviceChargeType: getServiceChargeType(details),
    status: details?.status || "active"
});

const toPayload = (data, isEdit) => {
    const payload = {
        minPrice: Number(data.minPrice),
        maxPrice: Number(data.maxPrice),
        serviceCharge: Number(data.serviceCharge),
        serviceChargeType: data.serviceChargeType || "flat"
    };

    if (isEdit) {
        payload.status = data.status || "active";
    }

    return payload;
};

export default function PriceOperation({ open, details, handleClose }) {
    const dispatch = useDispatch();
    const { saving } = useSelector((state) => state.prices);
    const isEdit = Boolean(getPriceId(details));

    const { register, handleSubmit, control, formState: { errors }, reset } = useForm({
        resolver: yupResolver(schema),
        defaultValues: toFormValues(details)
    });

    useEffect(() => {
        reset(toFormValues(details));
    }, [details, open, reset]);

    const onSubmit = (data) => {
        const action = isEdit
            ? UpdatePriceAction(getPriceId(details), toPayload(data, true))
            : CreatePriceAction(toPayload(data, false));

        dispatch(action).then((response) => {
            toast.success(response.data?.message || `Price ${isEdit ? "updated" : "created"} successfully`, { id: "price-operation" });
            dispatch(FetchPricesAction());
            handleClose();
        }).catch((error) => {
            toast.error(error?.response?.data?.message || `Unable to ${isEdit ? "update" : "create"} price`, { id: "price-operation" });
        });
    };

    return (
        <Dialog open={open} onOpenChange={handleClose}>
            <DialogContent className="max-w-[min(calc(100vw-2rem),560px)]! gap-0 overflow-hidden p-0">
                <DialogHeader className="border-b px-6 py-5">
                    <DialogTitle className="text-lg">{isEdit ? "Update price band" : "Create price band"}</DialogTitle>
                </DialogHeader>

                <form className="px-6 py-5" onSubmit={handleSubmit(onSubmit)}>
                    <div className="space-y-4">
                        <div className="grid gap-4 sm:grid-cols-2">
                            <label className="grid gap-2 text-sm font-medium text-slate-700">
                                Minimum Price
                                <Input type="number" min="0" step="0.01" {...register("minPrice")} placeholder="0.00" />
                                {errors.minPrice && <span className="text-xs text-destructive">{errors.minPrice.message}</span>}
                            </label>

                            <label className="grid gap-2 text-sm font-medium text-slate-700">
                                Maximum Price
                                <Input type="number" min="0" step="0.01" {...register("maxPrice")} placeholder="99.99" />
                                {errors.maxPrice && <span className="text-xs text-destructive">{errors.maxPrice.message}</span>}
                            </label>
                        </div>

                        <div className="grid gap-4 sm:grid-cols-[1fr_180px]">
                            <label className="grid gap-2 text-sm font-medium text-slate-700">
                                Service Charge
                                <Input type="number" min="0" step="0.01" {...register("serviceCharge")} placeholder="4.50" />
                                {errors.serviceCharge && <span className="text-xs text-destructive">{errors.serviceCharge.message}</span>}
                            </label>

                            <label className="grid gap-2 text-sm font-medium text-slate-700">
                                Charge Type
                                <Controller
                                    control={control}
                                    name="serviceChargeType"
                                    render={({ field }) => (
                                        <Select value={field.value} onValueChange={field.onChange}>
                                            <SelectTrigger className="w-full min-w-0">
                                                <SelectValue placeholder="Select type" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="flat">Flat</SelectItem>
                                                <SelectItem value="percentage">Percentage</SelectItem>
                                            </SelectContent>
                                        </Select>
                                    )}
                                />
                                {errors.serviceChargeType && <span className="text-xs text-destructive">{errors.serviceChargeType.message}</span>}
                            </label>
                        </div>

                        {isEdit && (
                            <div className="flex items-center justify-between rounded-lg bg-slate-100 px-4 py-3">
                                <div>
                                    <p className="text-sm font-medium text-slate-900">Active Status</p>
                                    <p className="text-sm text-slate-500">Turn this price band on or off.</p>
                                </div>
                                <Controller
                                    control={control}
                                    name="status"
                                    render={({ field }) => (
                                        <Switch
                                            checked={field.value == "active"}
                                            onCheckedChange={(checked) => field.onChange(checked ? "active" : "deactive")}
                                        />
                                    )}
                                />
                            </div>
                        )}
                    </div>

                    <DialogFooter className="-mx-6 -mb-5 mt-5 px-6">
                        <DialogClose >
                            <Button variant="outline" type="button" className="w-full sm:w-auto" onClick={handleClose}>
                                Cancel
                            </Button>
                        </DialogClose>
                        <Button type="submit" className="w-full sm:w-auto" disabled={saving}>
                            {saving ? "Saving..." : isEdit ? "Update Price" : "Create Price"}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}
