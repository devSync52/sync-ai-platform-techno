import React, { useEffect } from 'react'
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

const schema = yup.object({
    appKey: yup.string().required('API Key is required'),
    appSecret: yup.string().required('API Secret is required'),
    isActive: yup.boolean(),
});

export default function ConfigurationComponent({ open, handleClose, carrier, details }) {
    const providerSlug = carrier?.slug || '';

    const dispatch = useDispatch();

    const { register, handleSubmit, control, formState: { errors }, reset } = useForm({
        resolver: yupResolver(schema), defaultValues: {
            appKey: '', appSecret: '',
            isActive: false
        }
    });

    useEffect(() => {
        if (details) {
            reset({
                appKey: details.appKey || '',
                appSecret: details.appSecret || '',
                isActive: details.isActive || false
            });
        }
    }, [details, reset]);


    const onSubmit = (data) => {
        const payload = {
            ...data,
            provider: providerSlug,
            isActive: data.isActive
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
            <DialogContent className="max-w-lg">
                <DialogHeader>
                    <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                        <div>
                            <DialogTitle>Configure {carrier?.name || 'Carrier'}</DialogTitle>
                            <DialogDescription>
                                Add API credentials and activate your {carrier?.name || 'carrier'} integration.
                            </DialogDescription>
                        </div>
                        <a href={carrier?.url || '#'} target="_blank" rel="noreferrer" className="text-sm font-medium text-primary underline-offset-4 hover:underline">
                            API Docs
                        </a>
                    </div>
                </DialogHeader>

                <form className="space-y-4 pt-4" onSubmit={handleSubmit(onSubmit)}>
                    {
                        providerSlug == "Veryk" ? (
                            <label className="grid gap-2 text-sm font-medium text-slate-700">
                                API ID
                                <Input
                                    {...register('appKey')}
                                    placeholder="Enter API ID..."
                                />
                                {errors.appKey && <span className="text-xs text-destructive">{errors.appKey.message}</span>}
                            </label>
                        ) : (
                            <label className="grid gap-2 text-sm font-medium text-slate-700">
                                API Key
                                <Input
                                    {...register('appKey')}
                                    placeholder="Enter API key..."
                                />
                                {errors.appKey && <span className="text-xs text-destructive">{errors.appKey.message}</span>}
                            </label>
                        )
                    }

                    <label className="grid gap-2 text-sm font-medium text-slate-700">
                        API Secret
                        <Input
                            {...register('appSecret')}
                            placeholder="Enter API secret..."
                        />
                        {errors.appSecret && <span className="text-xs text-destructive">{errors.appSecret.message}</span>}
                    </label>

                    <div className="flex items-center justify-between rounded-2xl bg-slate-100 px-4 py-3">
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

                    <DialogFooter>
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
