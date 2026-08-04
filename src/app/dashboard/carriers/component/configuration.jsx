import React, { useEffect, useMemo, useState } from 'react'
import { Controller, useForm } from "react-hook-form";
import { yupResolver } from "@hookform/resolvers/yup";
import * as yup from "yup";
import { Button } from '@/components/ui/button';
import { Dialog, DialogClose, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import axiosInstance from '@/config/axios';
import { toast } from 'react-hot-toast';
import { FetchIntegrationsAction } from '@/services/actions/integrations';
import { useDispatch } from 'react-redux';
import { API_URL } from '@/utils/constants';
import { ExternalLink, Eye, EyeOff } from 'lucide-react';
import CarrierBrand from '@/components/carrier-brand';

const defaultValues = {
    appKey: '',
    appSecret: '',
    companyName: '',
    emailId: '',
    username: '',
    password: '',
    isActive: false
};

export default function ConfigurationComponent({ open, handleClose, carrier, details }) {
    const [showSecret, setShowSecret] = useState(false);
    const providerSlug = carrier?.slug || '', isSellerCloud = providerSlug == 'SELLERCLOUD', isExtensive = providerSlug == 'EXTENSIVE', isSync = providerSlug == 'SYNC';
    const needsCarrierAccount = providerSlug == 'FedEx' || providerSlug == 'UPS';

    const dispatch = useDispatch();

    const schema = useMemo(() => yup.object({
        ...(isSellerCloud ? { companyName: yup.string().required('Company name is required') } : {}),
        ...(needsCarrierAccount ? { companyName: yup.string().required('Carrier account number is required') } : {}),
        ...(isExtensive ? { username: yup.string().email('Enter a valid email').required('Email ID is required') } : {}),
        appKey: yup.string().required(isSync ? 'OMS API key is required' : providerSlug == 'Veryk' ? 'API ID is required' : 'API Key is required'),
        appSecret: yup.string().required(isSync ? 'WMS API key is required' : 'API Secret is required'),
        isActive: yup.boolean(),
    }), [isExtensive, isSellerCloud, isSync, needsCarrierAccount, providerSlug]);

    const { register, handleSubmit, control, formState: { errors }, reset } = useForm({
        resolver: yupResolver(schema), defaultValues
    });

    useEffect(() => {
        if (details) {
            reset({
                appKey: details.appKey || '',
                appSecret: details.appSecret || '',
                companyName: details.companyName || '',
                username: details.username || '',
                isActive: details.isActive || false
            });
        } else {
            reset(defaultValues);
        }
    }, [details, reset]);


    const onSubmit = (data) => {
        const payload = {
            companyName: data.companyName, appKey: data.appKey,
            appSecret: data.appSecret, username: data.username,
            provider: providerSlug, isActive: data.isActive
        };

        if (details) {
            axiosInstance.put(API_URL.INTEGRATIONS, payload).then((response) => {
                if (response.data.success) {
                    toast.success(response.data.message, { id: 'integration' })
                    handleClose()
                    dispatch(FetchIntegrationsAction());
                } else {
                    toast.error(response.data.message, { id: 'integration' })
                }
            }).catch((error) => {
                if (error?.response?.data) {
                    toast.error(error.response.data.message, { id: 'integration' })
                }
            });
        } else {
            axiosInstance.post(API_URL.INTEGRATIONS, payload).then((response) => {
                if (response.data.success) {
                    toast.success(response.data.message, { id: 'integration' })
                    handleClose()
                    dispatch(FetchIntegrationsAction());
                } else {
                    toast.error(response.data.message, { id: 'integration' })
                }
            }).catch((error) => {
                if (error?.response?.data) {
                    toast.error(error.response.data.message, { id: 'integration' })
                }
            });
        }
    };

    return (
        <Dialog open={open} onOpenChange={handleClose}>
            <DialogContent className="max-w-[min(calc(100vw-2rem),760px)]! gap-0 overflow-hidden p-0">
                <DialogHeader className="border-b bg-slate-50 px-6 py-5">
                    <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                        <div className="flex flex-wrap items-start gap-4">
                            <CarrierBrand name={carrier?.name} showName={false} logoClassName="h-12 w-12 rounded-xl p-1.5" />
                            <div>
                                <DialogTitle className="text-xl">Configure {carrier?.name || 'Carrier'}</DialogTitle>
                                <DialogDescription className="mt-2 max-w-xl">
                                    Add credentials, verify the provider endpoint, and activate this integration for carrier operations.
                                </DialogDescription>
                            </div>
                        </div>
                        <a href={carrier?.url || '#'} target="_blank" rel="noreferrer" className="inline-flex shrink-0 items-center gap-2 whitespace-nowrap rounded-lg border bg-white px-3 py-2 text-sm font-medium text-primary shadow-sm transition hover:bg-slate-100">
                            API Docs
                            <ExternalLink size={14} />
                        </a>
                    </div>
                </DialogHeader>

                <form className="px-6 py-5" onSubmit={handleSubmit(onSubmit)}>
                    <div className="space-y-4">
                        {
                            (isSellerCloud || needsCarrierAccount) && (
                                <label className="grid gap-2 text-sm font-medium text-slate-700">
                                    {needsCarrierAccount ? "Carrier Account Number" : "Company Name"}
                                    <Input
                                        {...register('companyName')}
                                        placeholder={needsCarrierAccount ? "Enter carrier account number..." : "Enter company name..."}
                                    />
                                    {errors.companyName && <span className="text-xs text-destructive">{errors.companyName.message}</span>}
                                </label>
                            )
                        }
                        {
                            isExtensive && (
                                <label className="grid gap-2 text-sm font-medium text-slate-700">
                                    Email ID
                                    <Input
                                        type="email" {...register('username')}
                                        placeholder="Enter email ID..."
                                    />
                                    {errors.username && <span className="text-xs text-destructive">{errors.username.message}</span>}
                                </label>
                            )
                        }
                        <div className="grid gap-4 sm:grid-cols-2">
                            <label className="grid gap-2 text-sm font-medium text-slate-700">
                                {isSync ? "OMS API Key" : providerSlug == "Veryk" ? "API ID" : "API Key"}
                                <Input
                                    {...register('appKey')}
                                    placeholder={isSync ? "Enter OMS API key..." : isSellerCloud ? "Enter username..." : providerSlug == "Veryk" ? "Enter API ID..." : "Enter API key..."}
                                />
                                {errors.appKey && <span className="text-xs text-destructive">{errors.appKey.message}</span>}
                            </label>

                            <label className="grid gap-2 text-sm font-medium text-slate-700">
                                {isSync ? "WMS API Key" : "API Secret"}
                                <div className="relative">
                                    <Input
                                        type={showSecret ? "text" : "password"} {...register('appSecret')}
                                        className="pr-10"
                                        placeholder={isSync ? "Enter WMS API key..." : isSellerCloud ? "Enter password..." : "Enter API secret..."}
                                    />
                                    <button
                                        type="button"
                                        onClick={() => setShowSecret((current) => !current)}
                                        className="absolute inset-y-0 right-0 flex w-10 items-center justify-center text-slate-500 hover:text-slate-800"
                                        aria-label={showSecret ? "Hide API secret" : "Show API secret"}
                                        aria-pressed={showSecret}
                                    >
                                        {showSecret ? <EyeOff size={18} /> : <Eye size={18} />}
                                    </button>
                                </div>
                                {errors.appSecret && <span className="text-xs text-destructive">{errors.appSecret.message}</span>}
                            </label>
                        </div>

                        <div className="flex items-center justify-between rounded-xl border border-slate-200 bg-white px-4 py-3 shadow-sm">
                            <div>
                                <p className="text-sm font-medium text-slate-900">Activate Integration</p>
                                <p className="text-sm text-slate-500">Enable this carrier for operations.</p>
                            </div>
                            <Controller control={control} name="isActive" render={({ field }) => (
                                <Switch
                                    checked={field.value}
                                    onCheckedChange={field.onChange}
                                />
                            )}
                            />
                        </div>
                    </div>

                    <DialogFooter className="-mx-6 -mb-5 mt-5 px-6">
                        <DialogClose >
                            <Button variant="outline" type="button" className="w-full sm:w-auto" onClick={handleClose}>
                                Cancel
                            </Button>
                        </DialogClose>
                        <Button type="submit" className="w-full sm:w-auto">
                            {details ? "Update Credentials" : "Save Credentials"}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    )
}
