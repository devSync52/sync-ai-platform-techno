"use client";

import { useState, useEffect } from "react";
import { Controller, useForm } from "react-hook-form";
import { yupResolver } from "@hookform/resolvers/yup";
import * as yup from "yup";
import { toast } from "react-hot-toast";
import { Eye, EyeOff } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { InputOTP, InputOTPGroup, InputOTPSlot } from "@/components/ui/input-otp";
import Image from "next/image";
import Link from "next/link";
import axiosInstance from "@/config/axios";
import { useDispatch, useSelector } from "react-redux";
import { UserVerificationAction, UserResendActivationAction } from "@/services/actions/authorization";

const schema = yup.object({
    firstName: yup.string().required("First name is required"),
    lastName: yup.string().required("Last name is required"),
    email: yup.string().email("Enter a valid email").required("Email is required"),
    password: yup.string().required("Password is required"),
    confirmPassword: yup.string().oneOf([yup.ref("password"), null], "Passwords must match").required("Confirm password is required"),
    company: yup.object({
        name: yup.string().required("Company name is required"),
        addressLine1: yup.string().required("Company address is required"),
        city: yup.string().required("City is required"),
        state: yup.string().required("State is required"),
        country: yup.string().required("Country is required"),
        zipcode: yup.number().typeError("Zip code must be a number").required("Zip code is required"),
    }),
    code: yup.string().when("$isVerification", {
        is: true,
        then: (schema) => schema.length(6, "Verification code must be 6 digits").required("Verification code is required"),
        otherwise: (schema) => schema.notRequired()
    })
});

export default function RegisterPage() {
    const [isVerification, setIsVerification] = useState(false);
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);
    const [resendLoading, setResendLoading] = useState(false);
    const [resendCountdown, setResendCountdown] = useState(0);

    const dispatch = useDispatch()

    const { loading, message, error } = useSelector((state) => state.authorization);

    const { register, handleSubmit, formState: { errors }, setError, control, watch } = useForm({
        resolver: yupResolver(schema), context: {
            isVerification
        }
    });

    const onSubmit = (data) => {
        if (isVerification) {
            UserVerificationAction({ username: data.email, code: data.code }, dispatch);
        } else {
            axiosInstance.post("/users/register", data).then((response) => {
                if (response.data.success) {
                    setIsVerification(true);
                    setResendCountdown(60);
                } else {
                    toast.error(response.data.message || "Registration failed", { id: "register" });
                }
            }).catch((error) => {
                if (error.response && error.response.data) {
                    if (error.response.data.errors) {
                        error.response.data.errors.forEach(err => {
                            setError(err.path, { type: "server", message: err.msg });
                        });
                        return
                    }
                    toast.error(error.response.data.message, { id: "register" });
                }
            });
        }
    };

    useEffect(() => {
        if (!isVerification || resendCountdown <= 0) return;

        const interval = setInterval(() => {
            setResendCountdown((count) => Math.max(count - 1, 0));
        }, 1000);

        return () => clearInterval(interval);
    }, [isVerification, resendCountdown]);

    useEffect(() => {
        if (error && message && message.trim()) {
            toast.error(message || "Failed to resend code", { id: "register" });
        }
    }, [error, message])

    const resendActivationCode = async () => {
        const email = watch("email");
        if (!email) {
            toast.error("Email is required to resend verification code");
            return;
        }

        setResendLoading(true);

        try {
            const response = await UserResendActivationAction({ username: email }, dispatch);
            if (response.data.success) {
                toast.success(response.data.message || "Verification code resent", { id: "register" });
                setResendCountdown(60);
            } else {
                toast.error(response.data.message || "Failed to resend code", { id: "register" });
            }
        } catch (error) {
            console.error("Resend activation failed:", error.response?.data || error.message);
        } finally {
            setResendLoading(false);
        }
    };

    return isVerification ? (
        <div className="min-h-screen bg-[#0d0033] flex flex-col items-center justify-center p-4">
            <div className="w-125 max-w-full bg-[#f3f3f3] rounded-2xl shadow-2xl py-10 px-8">
                <p className="text-center text-2xl font-bold mb-1">Enter Verification Code</p>
                <div className="bg-primary w-25 h-1 mx-auto my-4"></div>
                <p className="text-center mb-10 font-semibold">Please enter the verification code that was sent to your email address <span className="text-primary">{watch("email") || 'Email not provided'}</span></p>
                <form className="grid grid-cols-1 gap-4 w-full mb-8" onSubmit={handleSubmit(onSubmit)}>
                    <div className="w-full">
                        <div className="space-y-2">
                            <Controller name="code" control={control} render={({ field }) => (
                                <InputOTP maxLength={6} {...field} className="justify-center">
                                    <InputOTPGroup className="justify-center w-full gap-3">
                                        <InputOTPSlot index={0} className="w-12.5 h-12.5 rounded-sm! border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:outline-none" />
                                        <InputOTPSlot index={1} className="w-12.5 h-12.5 rounded-sm! border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:outline-none" />
                                        <InputOTPSlot index={2} className="w-12.5 h-12.5 rounded-sm! border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:outline-none" />
                                        <InputOTPSlot index={3} className="w-12.5 h-12.5 rounded-sm! border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:outline-none" />
                                        <InputOTPSlot index={4} className="w-12.5 h-12.5 rounded-sm! border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:outline-none" />
                                        <InputOTPSlot index={5} className="w-12.5 h-12.5 rounded-sm! border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:outline-none" />
                                    </InputOTPGroup>
                                </InputOTP>
                            )} />
                        </div>
                    </div>

                    <div className="flex items-center justify-between gap-3 text-sm text-slate-700">
                        <p>Didn&apos;t receive the code?</p>
                        <button type="button" onClick={resendActivationCode} disabled={resendLoading || resendCountdown > 0} className="text-primary font-semibold hover:underline disabled:cursor-not-allowed disabled:opacity-60">
                            {resendLoading ? "Resending..." : resendCountdown > 0 ? `Resend in 00:${String(resendCountdown).padStart(2, '0')}` : "Resend code"}
                        </button>
                    </div>

                    <button type="submit" className="w-full bg-linear-to-r from-purple-700 to-violet-600 hover:opacity-90 transition-all text-white font-semibold py-3 rounded-lg shadow-lg cursor-pointer">
                        Verify Otp
                    </button>
                </form>
            </div>
        </div>
    ) : (
        <div className="min-h-screen bg-[#0d0033] flex flex-col items-center justify-center p-4">
            <div className="w-150 max-w-full bg-[#f3f3f3] rounded-2xl shadow-2xl py-10 px-8">
                <div className="flex items-start justify-center pb-6">
                    <Image src="/assets/logo.png" alt="robot" width={145} height={145} />
                </div>

                <form className="grid grid-cols-1 gap-4 w-full mb-8" onSubmit={handleSubmit(onSubmit)}>
                    <div className="w-full">
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 w-full">
                            <div>
                                <Label className="mb-2">First Name</Label>
                                <Input
                                    type="text"
                                    placeholder="First Name"
                                    {...register("firstName")}
                                    className="py-5 border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                                />
                                {errors.firstName && <p className="text-sm text-red-600 mt-1">{errors.firstName.message}</p>}
                            </div>
                            <div>
                                <Label className="mb-2">Last Name</Label>
                                <Input
                                    type="text"
                                    placeholder="Last Name"
                                    {...register("lastName")}
                                    className="py-5 border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                                />
                                {errors.lastName && <p className="text-sm text-red-600 mt-1">{errors.lastName.message}</p>}
                            </div>
                        </div>
                    </div>

                    <div className="w-full">
                        <Label className="mb-2">Email</Label>
                        <Input
                            type="email"
                            placeholder="Email"
                            {...register("email")}
                            className="py-5 border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                        />
                        {errors.email && <p className="text-sm text-red-600 mt-1">{errors.email.message}</p>}
                    </div>

                    <div className="w-full">
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 w-full">
                            <div className="w-full">
                                <Label className="mb-2">Password</Label>
                                <div className="relative">
                                    <Input
                                        type={showPassword ? "text" : "password"}
                                        placeholder="Password"
                                        {...register("password")}
                                        className="py-5 pr-12 border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                                    />
                                    <button
                                        type="button"
                                        onClick={() => setShowPassword((prev) => !prev)}
                                        className="absolute inset-y-0 right-3 top-1/2 -translate-y-1/2 text-slate-500"
                                    >
                                        {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                                    </button>
                                </div>
                                {errors.password && <p className="text-sm text-red-600 mt-1">{errors.password.message}</p>}
                            </div>
                            <div className="w-full">
                                <Label className="mb-2">Confirm Password</Label>
                                <div className="relative">
                                    <Input
                                        type={showConfirmPassword ? "text" : "password"}
                                        placeholder="Confirm Password"
                                        {...register("confirmPassword")}
                                        className="py-5 pr-12 border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                                    />
                                    <button
                                        type="button"
                                        onClick={() => setShowConfirmPassword((prev) => !prev)}
                                        className="absolute inset-y-0 right-3 top-1/2 -translate-y-1/2 text-slate-500"
                                    >
                                        {showConfirmPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                                    </button>
                                </div>
                                {errors.confirmPassword && <p className="text-sm text-red-600 mt-1">{errors.confirmPassword.message}</p>}
                            </div>
                        </div>
                    </div>

                    <div className="w-full">
                        <Label className="mb-2">Company Name</Label>
                        <Input
                            type="text"
                            placeholder="Company Name"
                            {...register("company.name")}
                            className="py-5 border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                        />
                        {errors.company?.name && <p className="text-sm text-red-600 mt-1">{errors.company.name.message}</p>}
                    </div>

                    <div className="w-full">
                        <Label className="mb-2">Company Address</Label>
                        <Input
                            type="text"
                            placeholder="Company Address"
                            {...register("company.addressLine1")}
                            className="py-5 border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                        />
                        {errors.company?.addressLine1 && <p className="text-sm text-red-600 mt-1">{errors.company.addressLine1.message}</p>}
                    </div>

                    <div className="w-full">
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 w-full">
                            <div>
                                <Label className="mb-2">City</Label>
                                <Input
                                    type="text"
                                    placeholder="City"
                                    {...register("company.city")}
                                    className="py-5 border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                                />
                                {errors.company?.city && <p className="text-sm text-red-600 mt-1">{errors.company.city.message}</p>}
                            </div>
                            <div>
                                <Label className="mb-2">State</Label>
                                <Input
                                    type="text"
                                    placeholder="State"
                                    {...register("company.state")}
                                    className="py-5 border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                                />
                                {errors.company?.state && <p className="text-sm text-red-600 mt-1">{errors.company.state.message}</p>}
                            </div>
                        </div>
                    </div>

                    <div className="w-full">
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 w-full">
                            <div>
                                <Label className="mb-2">Country</Label>
                                <Input
                                    type="text"
                                    placeholder="Country"
                                    {...register("company.country")}
                                    className="py-5 border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                                />
                                {errors.company?.country && <p className="text-sm text-red-600 mt-1">{errors.company.country.message}</p>}
                            </div>
                            <div>
                                <Label className="mb-2">Zip Code</Label>
                                <Input
                                    type="text"
                                    placeholder="700091"
                                    {...register("company.zipcode")}
                                    className="py-5 border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                                />
                                {errors.company?.zipcode && <p className="text-sm text-red-600 mt-1">{errors.company.zipcode.message}</p>}
                            </div>
                        </div>
                    </div>

                    <button className="w-full bg-linear-to-r from-purple-700 to-violet-600 hover:opacity-90 transition-all text-white font-semibold py-3 rounded-lg shadow-lg cursor-pointer" type="submit">
                        Signup to SynC AI
                    </button>
                </form>

                <div className="pt-5">
                    <div className="mb-5">
                        <p className="text-sm text-muted-foreground mt-2 text-center font-semibold">Or Continue With</p>
                    </div>
                    <div className="flex justify-center gap-2">
                        <Button variant="outline" className="py-5 px-4">
                            <Image src="/assets/google.svg" alt="robot" width={20} height={20} />
                            Sign With Google
                        </Button>
                        <Button variant="outline" className="py-5 px-4">
                            <Image src="/assets/facebook.svg" alt="robot" width={24} height={24} />
                            Sign With Facebook
                        </Button>
                    </div>
                </div>
            </div>
            <p className="text-md text-white mt-5">
                Already have an account? <Link href="/auth/login" className="text-blue-400 hover:underline">Sign In</Link>
            </p>
        </div>
    );
}
