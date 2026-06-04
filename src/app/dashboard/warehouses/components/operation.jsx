"use client";

import React, { useEffect, useMemo, useState } from 'react'
import { Controller, useForm, useWatch } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';
import { Button } from '@/components/ui/button';
import { Dialog, DialogClose, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger } from '@/components/ui/select';
import axiosInstance from '@/config/axios';
import { FetchRegionsAction } from '@/services/actions/general';
import { FetchWarehousesAction } from '@/services/actions/warehouses';
import { toast } from 'react-hot-toast';
import { useDispatch, useSelector } from 'react-redux';
import { API_URL } from '@/utils/constants';

const schema = yup.object({
    name: yup.string().required('Warehouse is required'),
    region: yup.string().required('Region is required'),
    province: yup.string().required('Province is required'),
    address: yup.object({
        city: yup.string().required('City is required'),
        district: yup.string().required('District is required'),
        address1: yup.string().required('Address is required'),
        address2: yup.string().optional(),
        address3: yup.string().optional(),
        postalCode: yup.string().required('Postal code is required'),
    }).required('Provide valid address for create'),
});

export default function WareHouseOperation({ open, handleClose, details }) {
    const [submitting, setSubmitting] = useState(false);

    const { regions, loading: loadingRegions } = useSelector((state) => state.general);
    const dispatch = useDispatch();

    const { register, handleSubmit, control, formState: { errors }, reset, setValue } = useForm({ resolver: yupResolver(schema) });

    const selectedRegion = useWatch({ control, name: 'region' });

    const provinces = useMemo(() => regions.find((region) => region.id == selectedRegion)?.provinces || [], [regions, selectedRegion]);
    const selectedRegionName = useMemo(() => regions.find((region) => region.id == selectedRegion)?.name || '', [regions, selectedRegion]);

    useEffect(() => {
        if (!open) return;
        dispatch(FetchRegionsAction());
    }, [dispatch, open]);

    useEffect(() => {
        if (details) {
            reset({
                name: details.name || '',
                region: details.region?.id || details.regionId || details.region || '',
                province: details.province?.id || details.provinceId || details.province || '',
                address: {
                    city: details.address?.city || '',
                    district: details.address?.district || '',
                    address1: details.address?.address || '',
                    address2: details.address?.address2 || '',
                    address3: details.address?.address3 || '',
                    postalCode: details.address?.postalcode || '',
                },
            });
        } else {
            reset();
        }
    }, [details, reset, open]);

    const onSubmit = (data) => {
        setSubmitting(true);
        const request = details?.id ? axiosInstance.put(API_URL.WAREHOUSE_BY_ID(details.id), data) : axiosInstance.post(API_URL.WAREHOUSES, data);
        request.then((response) => {
            if (response.data?.success) {
                toast.success(response.data.message || 'Warehouse saved successfully', { id: 'warehouse-operation' });
                dispatch(FetchWarehousesAction());
                handleClose();
            } else {
                toast.error(response.data?.message || 'Unable to save warehouse', { id: 'warehouse-operation' });
            }
        }).catch((error) => {
            toast.error(error?.response?.data?.message || 'Unable to save warehouse', { id: 'warehouse-operation' });
        }).finally(() => {
            setSubmitting(false);
        });
    };

    return (
        <Dialog open={open} onOpenChange={handleClose}>
            <DialogContent className="!max-w-[min(calc(100vw-2rem),760px)] gap-0 overflow-hidden p-0">
                <DialogHeader className="border-b px-6 py-5">
                    <div className="flex flex-col gap-3 pr-8 sm:flex-row sm:items-start sm:justify-between">
                        <div>
                            <DialogTitle className="text-lg">{details ? 'Update warehouse' : 'Create warehouse'}</DialogTitle>
                        </div>
                    </div>
                </DialogHeader>

                <form className="max-h-[calc(100vh-9rem)] overflow-y-auto px-6 py-5" onSubmit={handleSubmit(onSubmit)}>
                    <div className="space-y-4">
                        <label className="grid gap-2 text-sm font-medium text-slate-700">
                            Warehouse Name
                            <Input
                                {...register('name')}
                                placeholder="Enter warehouse name..."
                            />
                            {errors.name && <span className="text-xs text-destructive">{errors.name.message}</span>}
                        </label>

                        <div className="grid gap-4 sm:grid-cols-2">
                            <label className="grid gap-2 text-sm font-medium text-slate-700">
                                Region
                                <Controller control={control} name="region" render={({ field }) => (
                                    <Select disabled={loadingRegions || !regions.length} value={field.value || ''} onValueChange={(value) => {
                                        field.onChange(value);
                                        setValue('province', '');
                                    }}>
                                        <SelectTrigger className="w-full min-w-0">
                                            <span className={`min-w-0 flex-1 truncate text-left ${selectedRegionName ? '' : 'text-muted-foreground'}`}>
                                                {selectedRegionName || (loadingRegions || !regions.length ? 'Loading regions...' : 'Select region')}
                                            </span>
                                        </SelectTrigger>
                                        <SelectContent>
                                            {
                                                regions.map((region) => (
                                                    <SelectItem key={region.id} value={region.id}>
                                                        {region.name}
                                                    </SelectItem>
                                                ))
                                            }
                                        </SelectContent>
                                    </Select>
                                )}
                                />
                                {errors.region && <span className="text-xs text-destructive">{errors.region.message}</span>}
                            </label>

                            <label className="grid gap-2 text-sm font-medium text-slate-700">
                                Province
                                <Controller control={control} name="province" render={({ field }) => (
                                    <Select value={field.value || ''} onValueChange={field.onChange} disabled={!selectedRegion}>
                                        <SelectTrigger className="w-full min-w-0">
                                            <span className={`min-w-0 flex-1 truncate text-left ${field.value ? '' : 'text-muted-foreground'}`}>
                                                {provinces.find((province) => province.id == field.value)?.name || (selectedRegion ? 'Select province' : 'Select region first')}
                                            </span>
                                        </SelectTrigger>
                                        <SelectContent>
                                            {
                                                provinces.map((province) => (
                                                    <SelectItem key={province.id} value={province.id}>
                                                        {province.name}
                                                    </SelectItem>
                                                ))
                                            }
                                        </SelectContent>
                                    </Select>
                                )}
                                />
                                {errors.province && <span className="text-xs text-destructive">{errors.province.message}</span>}
                            </label>
                        </div>

                        <div className="grid gap-4 sm:grid-cols-2">
                            <label className="grid gap-2 text-sm font-medium text-slate-700">
                                City
                                <Input
                                    {...register('address.city')}
                                    placeholder="Enter city..."
                                />
                                {errors.address?.city && <span className="text-xs text-destructive">{errors.address.city.message}</span>}
                            </label>

                            <label className="grid gap-2 text-sm font-medium text-slate-700">
                                District
                                <Input
                                    {...register('address.district')}
                                    placeholder="Enter district..."
                                />
                                {errors.address?.district && <span className="text-xs text-destructive">{errors.address.district.message}</span>}
                            </label>
                        </div>

                        <label className="grid gap-2 text-sm font-medium text-slate-700">
                            Address Line 1
                            <Input
                                {...register('address.address1')}
                                placeholder="Enter address..."
                            />
                            {errors.address?.address1 && <span className="text-xs text-destructive">{errors.address.address1.message}</span>}
                        </label>

                        <div className="grid gap-4 sm:grid-cols-2">
                            <label className="grid gap-2 text-sm font-medium text-slate-700">
                                Address Line 2
                                <Input
                                    {...register('address.address2')}
                                    placeholder="Apartment, suite, unit..."
                                />
                            </label>

                            <label className="grid gap-2 text-sm font-medium text-slate-700">
                                Address Line 3
                                <Input
                                    {...register('address.address3')}
                                    placeholder="Landmark or area..."
                                />
                            </label>
                        </div>

                        <label className="grid gap-2 text-sm font-medium text-slate-700">
                            Postal Code
                            <Input
                                {...register('address.postalCode')}
                                placeholder="Enter postal code..."
                            />
                            {errors.address?.postalCode && <span className="text-xs text-destructive">{errors.address.postalCode.message}</span>}
                        </label>
                    </div>

                    <DialogFooter className="-mx-6 -mb-5 mt-5 px-6">
                        <DialogClose asChild>
                            <Button variant="outline" type="button" className="w-full sm:w-auto" onClick={handleClose}>
                                Cancel
                            </Button>
                        </DialogClose>
                        <Button type="submit" className="w-full sm:w-auto" disabled={submitting}>
                            {submitting ? 'Saving...' : details ? 'Update Warehouse' : 'Create Warehouse'}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    )
}
