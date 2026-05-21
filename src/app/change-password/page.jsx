"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { yupResolver } from "@hookform/resolvers/yup";
import * as yup from "yup";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useDispatch, useSelector } from "react-redux";
import { Eye, EyeOff, KeyRound } from "lucide-react";
import { toast } from "react-hot-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { UserChangePasswordAction } from "@/services/actions/authorization";

const schema = yup.object({
    currentPassword: yup.string().required("Current password is required"),
    newPassword: yup
        .string()
        .min(8, "New password must be at least 8 characters")
        .notOneOf([yup.ref("currentPassword")], "New password must be different")
        .required("New password is required"),
    confirmPassword: yup
        .string()
        .oneOf([yup.ref("newPassword")], "Passwords must match")
        .required("Confirm password is required"),
});

export default function ChangePasswordPage() {
    const router = useRouter();
    const dispatch = useDispatch();
    const { user } = useSelector((state) => state.authorization);
    const [loading, setLoading] = useState(false);
    const [visibleFields, setVisibleFields] = useState({
        currentPassword: false,
        newPassword: false,
        confirmPassword: false,
    });

    const {
        register,
        handleSubmit,
        formState: { errors },
    } = useForm({
        resolver: yupResolver(schema),
    });

    const toggleVisibility = (field) => {
        setVisibleFields((current) => ({ ...current, [field]: !current[field] }));
    };

    const onSubmit = async ({ currentPassword, newPassword }) => {
        setLoading(true);

        try {
            const response = await UserChangePasswordAction({ currentPassword, newPassword }, dispatch, user);

            if (response.data.success) {
                toast.success(response.data.message || "Password changed successfully", { id: "change-password" });
                router.replace("/dashboard");
                return;
            }

            toast.error(response.data.message || "Unable to change password", { id: "change-password" });
        } catch (error) {
            toast.error(error?.response?.data?.message || error?.message || "Unable to change password", { id: "change-password" });
        } finally {
            setLoading(false);
        }
    };

    const renderPasswordField = (name, label, placeholder) => (
        <div className="w-full">
            <Label className="mb-2">{label}</Label>
            <div className="relative">
                <Input
                    type={visibleFields[name] ? "text" : "password"}
                    placeholder={placeholder}
                    {...register(name)}
                    className="py-5 pr-12 border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                />
                <button
                    type="button"
                    onClick={() => toggleVisibility(name)}
                    className="absolute inset-y-0 right-3 top-1/2 -translate-y-1/2 text-slate-500"
                    aria-label={visibleFields[name] ? `Hide ${label}` : `Show ${label}`}
                >
                    {visibleFields[name] ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
            </div>
            {errors[name] && <p className="text-sm text-red-600 mt-1">{errors[name].message}</p>}
        </div>
    );

    return (
        <div className="min-h-screen bg-[#0d0033] flex flex-col items-center justify-center p-4">
            <div className="w-125 max-w-full bg-[#f3f3f3] rounded-2xl shadow-2xl py-10 px-8">
                <div className="flex items-start justify-center pb-6">
                    <Image src="/assets/logo.png" alt="SynC AI" width={120} height={120} />
                </div>

                <div className="mb-8 text-center">
                    <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-primary text-white">
                        <KeyRound size={22} />
                    </div>
                    <h1 className="text-2xl font-bold text-[#171321]">Change Password</h1>
                    <p className="mt-2 text-sm font-medium text-slate-600">
                        Set a new password before continuing to your workspace.
                    </p>
                </div>

                <form className="grid grid-cols-1 gap-4 w-full" onSubmit={handleSubmit(onSubmit)}>
                    {renderPasswordField("currentPassword", "Current Password", "Current password")}
                    {renderPasswordField("newPassword", "New Password", "New password")}
                    {renderPasswordField("confirmPassword", "Confirm Password", "Confirm new password")}

                    <div className="pt-5">
                        <Button type="submit" disabled={loading} className="w-full bg-linear-to-r from-purple-700 to-violet-600 hover:opacity-90 transition-all text-white font-semibold py-5 rounded-lg shadow-lg cursor-pointer">
                            {loading ? "Changing Password..." : "Change Password"}
                        </Button>
                    </div>
                </form>
            </div>
        </div>
    );
}
