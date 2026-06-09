"use client";

import React, { useEffect, useState } from 'react'
import { Controller, useForm } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';
import { RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogClose, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import axiosInstance from '@/config/axios';
import { FetchClientsAction } from '@/services/actions/clients';
import { toast } from 'react-hot-toast';
import { useDispatch } from 'react-redux';
import { API_URL } from '@/utils/constants';

const schema = yup.object({
    firstName: yup.string().required('First name is required'),
    lastName: yup.string().required('Last name is required'),
    email: yup.string().email('Enter a valid email').required('Email is required'),
    phone: yup.string().required('Phone is required'),
    countryCode: yup.string().required('Country code is required'),
    notes: yup.string().optional(),
    isActive: yup.boolean(),
    password: yup.string().required('Password is required').min(8, 'Password must be at least 8 characters'),
});

const generatePassword = () => {
    const lower = 'abcdefghijklmnopqrstuvwxyz';
    const upper = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
    const numbers = '0123456789';
    const symbols = '!@#$%&*';
    const all = lower + upper + numbers + symbols;
    const required = [
        lower[Math.floor(Math.random() * lower.length)],
        upper[Math.floor(Math.random() * upper.length)],
        numbers[Math.floor(Math.random() * numbers.length)],
        symbols[Math.floor(Math.random() * symbols.length)],
    ];

    while (required.length < 12) {
        required.push(all[Math.floor(Math.random() * all.length)]);
    }

    return required.sort(() => Math.random() - 0.5).join('');
};

export default function ClientOperation({ open, handleClose }) {
    const [submitting, setSubmitting] = useState(false);
    const dispatch = useDispatch();

    const { register, handleSubmit, control, formState: { errors }, reset, setValue } = useForm({
        resolver: yupResolver(schema),
        defaultValues: {
            firstName: '',
            lastName: '',
            email: '',
            phone: '',
            countryCode: '+91',
            notes: '',
            isActive: true,
            password: ''
        }
    });

    useEffect(() => {
        reset({
            firstName: '', lastName: '', email: '', phone: '',
            countryCode: '+91', notes: '', isActive: true,
            password: generatePassword()
        });
    }, [reset, open]);

    const handleGeneratePassword = () => {
        setValue('password', generatePassword(), { shouldDirty: true, shouldValidate: true });
    };

    const onSubmit = (data) => {
        setSubmitting(true);
        axiosInstance.post(API_URL.CLIENTS, data).then((response) => {
            if (response.data?.success) {
                toast.success(response.data.message || 'Client saved successfully', { id: 'client-operation' });
                dispatch(FetchClientsAction());
                handleClose();
            } else {
                toast.error(response.data?.message || 'Unable to save client', { id: 'client-operation' });
            }
        }).catch((error) => {
            toast.error(error?.response?.data?.message || 'Unable to save client', { id: 'client-operation' });
        }).finally(() => {
            setSubmitting(false);
        });
    };

    return (
        <Dialog open={open} onOpenChange={handleClose}>
            <DialogContent className="max-w-[min(calc(100vw-2rem),640px)]! gap-0 overflow-hidden p-0">
                <DialogHeader className="border-b px-6 py-5">
                    <DialogTitle className="text-lg">Create client</DialogTitle>
                </DialogHeader>

                <form className="max-h-[calc(100vh-9rem)] overflow-y-auto px-6 py-5" onSubmit={handleSubmit(onSubmit)}>
                    <div className="space-y-4">
                        <div className="grid gap-4 sm:grid-cols-2">
                            <label className="grid gap-2 text-sm font-medium text-slate-700">
                                First Name
                                <Input {...register('firstName')} placeholder="Enter first name..." />
                                {errors.firstName && <span className="text-xs text-destructive">{errors.firstName.message}</span>}
                            </label>

                            <label className="grid gap-2 text-sm font-medium text-slate-700">
                                Last Name
                                <Input {...register('lastName')} placeholder="Enter last name..." />
                                {errors.lastName && <span className="text-xs text-destructive">{errors.lastName.message}</span>}
                            </label>
                        </div>

                        <label className="grid gap-2 text-sm font-medium text-slate-700">
                            Email
                            <Input type="email" {...register('email')} placeholder="Enter email..." />
                            {errors.email && <span className="text-xs text-destructive">{errors.email.message}</span>}
                        </label>

                        <div className="grid gap-4 sm:grid-cols-[140px_1fr]">
                            <label className="grid gap-2 text-sm font-medium text-slate-700">
                                Country Code
                                <Input {...register('countryCode')} placeholder="+91" />
                                {errors.countryCode && <span className="text-xs text-destructive">{errors.countryCode.message}</span>}
                            </label>

                            <label className="grid gap-2 text-sm font-medium text-slate-700">
                                Phone
                                <Input {...register('phone')} placeholder="Enter phone..." />
                                {errors.phone && <span className="text-xs text-destructive">{errors.phone.message}</span>}
                            </label>
                        </div>

                        <label className="grid gap-2 text-sm font-medium text-slate-700">
                            Password
                            <div className="flex gap-2">
                                <Input {...register('password')} placeholder="Enter password..." />
                                <Button type="button" variant="outline" onClick={handleGeneratePassword}>
                                    <RefreshCw />
                                    Generate
                                </Button>
                            </div>
                            {errors.password && <span className="text-xs text-destructive">{errors.password.message}</span>}
                        </label>

                        <label className="grid gap-2 text-sm font-medium text-slate-700">
                            Notes
                            <textarea
                                {...register('notes')}
                                className="min-h-24 rounded-lg border border-input bg-transparent px-3 py-2 text-sm outline-none transition-colors placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
                                placeholder="Enter notes..."
                            />
                        </label>

                        <div className="flex items-center justify-between rounded-lg bg-slate-100 px-4 py-3">
                            <div>
                                <p className="text-sm font-medium text-slate-900">Active Client</p>
                                <p className="text-sm text-slate-500">Allow this client to use the platform.</p>
                            </div>
                            <Controller control={control} name="isActive" render={({ field }) => (
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
                        <Button type="submit" className="w-full sm:w-auto" disabled={submitting}>
                            {submitting ? 'Saving...' : 'Create Client'}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    )
}
