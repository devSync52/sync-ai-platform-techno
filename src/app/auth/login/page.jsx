"use client";

import { useState, useEffect } from "react";
import { useForm, Controller } from "react-hook-form";
import { yupResolver } from "@hookform/resolvers/yup";
import * as yup from "yup";
import { Eye, EyeOff } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { InputOTP, InputOTPGroup, InputOTPSlot } from "@/components/ui/input-otp";
import Image from "next/image";
import Link from "next/link";
import { useDispatch, useSelector } from "react-redux";
import { UserLoginAction, UserVerificationAction, UserResendActivationAction } from "@/services/actions/authorization";
import { toast } from "react-hot-toast";
import { PROJECT_URL } from "@/utils/constants";

const schema = yup.object({
    username: yup.string().required("Username is required"),
    password: yup.string().required("Password is required"),
    code: yup.string().when("$isVerification", {
        is: true,
        then: (schema) => schema.length(6, "Verification code must be 6 digits").required("Verification code is required"),
        otherwise: (schema) => schema.notRequired()
    })
});

export default function LoginPage() {
    const [resendLoading, setResendLoading] = useState(false);
    const [resendCountdown, setResendCountdown] = useState(60);
    const [showPassword, setShowPassword] = useState(false);

    const dispatch = useDispatch();

    const { message, error, requiredVerify } = useSelector((state) => state.authorization);

    const { register, handleSubmit, formState: { errors }, getValues, control } = useForm({
        resolver: yupResolver(schema), context: {
            isVerification: requiredVerify
        }
    });

    useEffect(() => {
        if (!requiredVerify || resendCountdown <= 0) return;

        const interval = setInterval(() => {
            setResendCountdown((count) => Math.max(count - 1, 0));
        }, 1000);

        return () => clearInterval(interval);
    }, [requiredVerify, resendCountdown]);

    useEffect(() => {
        if (error && message && message.trim()) {
            toast.error(message || "Login failed", { id: "login" });
        }
    }, [error, message]);

    const onSubmit = (data) => {
        if (requiredVerify) {
            UserVerificationAction(data, dispatch);
        } else {
            UserLoginAction(data, dispatch);
        }
    };

    const resendActivationCode = async () => {
        const username = getValues("username");
        if (!username) {
            toast.error("Username is required to resend verification code");
            return;
        }

        setResendLoading(true);

        try {
            const response = await UserResendActivationAction({ username }, dispatch);
            if (response.data.success) {
                toast.success(response.data.message || "Verification code resent", { id: "login" });
                setResendCountdown(60);
            } else {
                toast.error(response.data.message || "Failed to resend code", { id: "login" });
            }
        } catch (error) {
            console.error("Resend activation failed:", error.response?.data || error.message);
        } finally {
            setResendLoading(false);
        }
    };

    return requiredVerify ? (
        <div className="min-h-screen bg-[#0d0033] flex flex-col items-center justify-center p-4">
            <div className="w-125 max-w-full bg-[#f3f3f3] rounded-2xl shadow-2xl py-10 px-8">
                <p className="text-center text-2xl font-bold mb-1">Enter Verification Code</p>
                <div className="bg-primary w-25 h-1 mx-auto my-4"></div>
                <p className="text-center mb-10 font-semibold">Please enter the verification code that was sent to your email address <span className="text-primary">{getValues("username") || 'Username not provided'}</span></p>
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
            <div className="w-125 max-w-full bg-[#f3f3f3] rounded-2xl shadow-2xl py-10 px-8">

                {/* Robot Icon */}
                <div className="flex items-start justify-center pb-6">
                    <Image
                        src={PROJECT_URL.LOGO}
                        alt="robot"
                        width={145} height={145}
                    />
                </div>

                <form className="grid grid-cols-1 gap-4 w-full mb-8" onSubmit={handleSubmit(onSubmit)}>
                    <div className="w-full">
                        <Label className="mb-2">Username</Label>
                        <Input
                            type="text"
                            placeholder="Username"
                            {...register("username")}
                            className="py-5 border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                        />
                        {errors.username && <p className="text-sm text-red-600 mt-1">{errors.username.message}</p>}
                    </div>
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
                        <div className="mt-2">
                            <p className="text-sm text-muted-foreground font-semibold">
                                Forgot your password? <a href="#" className="text-primary hover:underline">Reset it</a>
                            </p>
                        </div>
                    </div>
                    <div className="pt-5">
                    <button type="submit" className="w-full bg-linear-to-r from-purple-700 to-violet-600 hover:opacity-90 transition-all text-white font-semibold py-3 rounded-lg shadow-lg cursor-pointer">
                        Sign in to SynC AI
                    </button>
                    </div>
                </form>

                <div>
                    <div className="mb-5">
                        <p className="text-sm text-muted-foreground mt-2 text-center font-semibold">Or Continue With</p>
                    </div>
                    <div className="flex justify-center gap-2">
                        <Button variant="outline" className="py-5 px-4">
                            <Image
                                src={PROJECT_URL.GOOGLE_ICON}
                                alt="robot"
                                width={20} height={20}
                            />
                            Sign With Google
                        </Button>
                        <Button variant="outline" className="py-5 px-4">
                            <Image
                                src={PROJECT_URL.FACEBOOK_ICON}
                                alt="robot"
                                width={24} height={24}
                            />
                            Sign With Facebook
                        </Button>
                    </div>
                </div>
            </div>
            <p className="text-md text-white mt-5">
                Don&apos;t have an account yet?  <Link href={PROJECT_URL.REGISTER} className="text-blue-400 hover:underline">Create an account</Link>
            </p>
        </div>
    );
}
