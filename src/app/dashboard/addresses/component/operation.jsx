"use client";

import { useEffect, useMemo, useState } from "react";
import { Controller, useForm, useWatch } from "react-hook-form";
import { yupResolver } from "@hookform/resolvers/yup";
import * as yup from "yup";
import { useDispatch, useSelector } from "react-redux";
import { toast } from "react-hot-toast";
import { Button } from "@/components/ui/button";
import { Dialog, DialogClose, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger } from "@/components/ui/select";
import axiosInstance from "@/config/axios";
import { FetchRegionsAction } from "@/services/actions/general";

const addressTypes = ["commercial", "residential"];

const defaultValues = {
  region: "",
  postalcode: "",
  name: "",
  company: "",
  province: "",
  city: "",
  address: "",
  address2: "",
  mobile_phone: "",
  type: "commercial",
};

const schema = yup.object({
  region: yup.string().required("Region is required"),
  postalcode: yup.string().required("Postal code is required"),
  name: yup.string().required("Name is required"),
  company: yup.string().required("Company is required"),
  province: yup.string().required("Province is required"),
  city: yup.string().required("City is required"),
  address: yup.string().required("Address is required"),
  address2: yup.string().optional(),
  phone: yup.string().required("Mobile phone is required"),
  type: yup.string().oneOf(addressTypes).required("Type is required"),
});

export default function AddressOperation({ open, handleClose, details, onSaved }) {
  const [submitting, setSubmitting] = useState(false);
  const dispatch = useDispatch();
  const { regions, loading: loadingRegions } = useSelector((state) => state.general);

  const { register, handleSubmit, control, formState: { errors }, reset, setValue } = useForm({
    resolver: yupResolver(schema),
    defaultValues,
  });

  const selectedRegion = useWatch({ control, name: "region" });
  const selectedRegionName = useMemo(() => regions.find((region) => region.id == selectedRegion)?.name || "", [regions, selectedRegion]);
  const provinces = useMemo(() => regions.find((region) => region.id == selectedRegion)?.provinces || [], [regions, selectedRegion]);

  useEffect(() => {
    if (!open) return;
    dispatch(FetchRegionsAction());
  }, [dispatch, open]);

  useEffect(() => {
    if (!open) return;

    reset(details ? {
      region: details?.regionId,
      postalcode: details.postalcode || details.postalCode || "",
      name: details.name || "",
      company: details.company || "",
      province: details?.provinceId,
      city: details.city || "",
      address: details.addressLine1 || "",
      address2: details.addressLine2 || "",
      phone: details.phone || details.mobilePhone || details.phone || "",
      type: details.type || "commercial",
    } : defaultValues);
  }, [details, open, reset]);

  const onSubmit = (data) => {
    setSubmitting(true);

    const addressId = details?.id;
    const request = addressId ? axiosInstance.put(`/addresses/${addressId}`, data) : axiosInstance.post("/addresses", data);

    request.then((response) => {
      if (response.data?.success) {
        toast.success(response.data.message || "Address saved successfully", { id: "address-operation" });
        onSaved();
        handleClose();
      } else {
        toast.error(response.data?.message || "Unable to save address", { id: "address-operation" });
      }
    }).catch((error) => {
      toast.error(error?.response?.data?.message || "Unable to save address", { id: "address-operation" });
    }).finally(() => {
      setSubmitting(false);
    });
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-[min(calc(100vw-2rem),760px)]! gap-0 overflow-hidden p-0">
        <DialogHeader className="border-b px-6 py-5">
          <DialogTitle className="text-lg">{details ? "Update address" : "Create address"}</DialogTitle>
        </DialogHeader>

        <form className="max-h-[calc(100vh-9rem)] overflow-y-auto px-6 py-5" onSubmit={handleSubmit(onSubmit)}>
          <div className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <label className="grid gap-2 text-sm font-medium text-slate-700">
                Name
                <Input {...register("name")} placeholder="Enter contact name..." />
                {errors.name && <span className="text-xs text-destructive">{errors.name.message}</span>}
              </label>

              <label className="grid gap-2 text-sm font-medium text-slate-700">
                Company
                <Input {...register("company")} placeholder="Enter company..." />
                {errors.company && <span className="text-xs text-destructive">{errors.company.message}</span>}
              </label>
            </div>

            <div className="grid gap-4 sm:grid-cols-3">
              <label className="grid gap-2 text-sm font-medium text-slate-700">
                Region
                <Controller control={control} name="region" render={({ field }) => (
                  <Select disabled={loadingRegions || !regions.length} value={field.value || ""} onValueChange={(value) => {
                    field.onChange(value);
                    setValue("province", "");
                  }}>
                    <SelectTrigger className="w-full min-w-0">
                      <span className={`min-w-0 flex-1 truncate text-left ${selectedRegionName ? "" : "text-muted-foreground"}`}>
                        {selectedRegionName || (loadingRegions || !regions.length ? "Loading regions..." : "Select region")}
                      </span>
                    </SelectTrigger>
                    <SelectContent>
                      {regions.map((region) => (
                        <SelectItem key={region.id} value={region.id}>
                          {region.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )} />
                {errors.region && <span className="text-xs text-destructive">{errors.region.message}</span>}
              </label>

              <label className="grid gap-2 text-sm font-medium text-slate-700">
                Province
                <Controller control={control} name="province" render={({ field }) => (
                  <Select value={field.value || ""} onValueChange={field.onChange} disabled={!selectedRegion}>
                    <SelectTrigger className="w-full min-w-0">
                      <span className={`min-w-0 flex-1 truncate text-left ${field.value ? "" : "text-muted-foreground"}`}>
                        {provinces.find((province) => province.id == field.value)?.name || (selectedRegion ? "Select province" : "Select region first")}
                      </span>
                    </SelectTrigger>
                    <SelectContent>
                      {provinces.map((province) => (
                        <SelectItem key={province.id} value={province.id}>
                          {province.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )} />
                {errors.province && <span className="text-xs text-destructive">{errors.province.message}</span>}
              </label>

              <label className="grid gap-2 text-sm font-medium text-slate-700">
                Type
                <Controller control={control} name="type" render={({ field }) => (
                  <Select value={field.value || "commercial"} onValueChange={field.onChange}>
                    <SelectTrigger className="w-full min-w-0">
                      <span className="min-w-0 flex-1 truncate text-left capitalize">{field.value || "commercial"}</span>
                    </SelectTrigger>
                    <SelectContent>
                      {addressTypes.map((type) => (
                        <SelectItem key={type} value={type}>
                          <span className="capitalize">{type}</span>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )} />
                {errors.type && <span className="text-xs text-destructive">{errors.type.message}</span>}
              </label>
            </div>

            <div className="grid gap-4 sm:grid-cols-[1fr_180px]">
              <label className="grid gap-2 text-sm font-medium text-slate-700">
                City
                <Input {...register("city")} placeholder="Enter city..." />
                {errors.city && <span className="text-xs text-destructive">{errors.city.message}</span>}
              </label>

              <label className="grid gap-2 text-sm font-medium text-slate-700">
                Postal Code
                <Input {...register("postalcode")} placeholder="Enter postal code..." />
                {errors.postalcode && <span className="text-xs text-destructive">{errors.postalcode.message}</span>}
              </label>
            </div>

            <label className="grid gap-2 text-sm font-medium text-slate-700">
              Address
              <Input {...register("address")} placeholder="Enter street address..." />
              {errors.address && <span className="text-xs text-destructive">{errors.address.message}</span>}
            </label>

            <div className="grid gap-4 sm:grid-cols-2">
              <label className="grid gap-2 text-sm font-medium text-slate-700">
                Address Line 2
                <Input {...register("address2")} placeholder="Apartment, suite, unit..." />
              </label>

              <label className="grid gap-2 text-sm font-medium text-slate-700">
                Mobile Phone
                <Input {...register("phone")} placeholder="Enter mobile phone..." />
                {errors.phone && <span className="text-xs text-destructive">{errors.phone.message}</span>}
              </label>
            </div>
          </div>

          <DialogFooter className="-mx-6 -mb-5 mt-5 px-6">
            <DialogClose asChild>
              <Button variant="outline" type="button" className="w-full sm:w-auto" onClick={handleClose}>
                Cancel
              </Button>
            </DialogClose>
            <Button type="submit" className="w-full sm:w-auto" disabled={submitting}>
              {submitting ? "Saving..." : details ? "Update Address" : "Create Address"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
