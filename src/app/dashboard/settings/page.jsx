"use client";

import React, { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useDispatch, useSelector } from "react-redux";
import { toast } from "react-hot-toast";
import { BadgeCheck, Building2, CheckCircle2, Eye, EyeOff, Globe, KeyRound, Loader2, LockKeyhole, PackageCheck, Route, Save, ShieldCheck, Truck, User, Wallet, } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import CarrierBrand from "@/components/carrier-brand";
import { FetchIntegrationsAction } from "@/services/actions/integrations";
import { UserChangePasswordAction, UserUpdateProfileAction } from "@/services/actions/authorization";
import { FetchSettingsAction, UpdateShippingSettingsAction } from "@/services/actions/settings";
import { PROJECT_URL } from "@/utils/constants";

const defaultShippingSettings = {
    walletThreshold: 10,
    verykCustomerCareEmail: "support@veryk.com",
};

function PasswordInput({ name, value, visible, setPasswordForm, setVisiblePasswords }) {
    return (
        <div className="relative">
            <Input
                type={visible ? "text" : "password"}
                value={value}
                onChange={(event) => setPasswordForm((current) => ({ ...current, [name]: event.target.value }))}
                className="pr-10"
                required
            />
            <button
                type="button"
                onClick={() => setVisiblePasswords((current) => ({ ...current, [name]: !current[name] }))}
                className="absolute inset-y-0 right-0 flex w-10 items-center justify-center text-gray-500 hover:text-gray-800"
                aria-label={visible ? "Hide password" : "Show password"}
                aria-pressed={visible}
            >
                {visible ? <EyeOff size={18} /> : <Eye size={18} />}
            </button>
        </div>
    );
}

function getUserDetails(user) {
    return user?.data?.user || user?.data || user || {};
}

function getUserProfile(user) {
    const details = getUserDetails(user);
    return details.profile || details.clientProfile || details.userProfile || details;
}

function getUserRole(user) {
    const details = getUserDetails(user);
    const profile = getUserProfile(user);
    return details?.role || profile?.role || details?.userType || profile?.userType || "user";
}

function getInitials(name, email) {
    const source = name || email || "User";
    return String(source)
        .split(/[\s@._-]+/)
        .filter(Boolean)
        .slice(0, 2)
        .map((part) => part.charAt(0).toUpperCase())
        .join("") || "U";
}

function getUserSnapshot(user) {
    const details = getUserDetails(user);
    const profile = getUserProfile(user);
    const company = details.company || {};
    const firstName = profile?.firstName || details?.firstName || "";
    const lastName = profile?.lastName || details?.lastName || "";

    return {
        firstName,
        lastName,
        name: [firstName, lastName].filter(Boolean).join(" ") || details?.name || profile?.name || "User",
        email: details?.email || profile?.email || "",
        phone: details?.phone || profile?.phone || "",
        countryCode: details?.countryCode || profile?.countryCode || "",
        role: getUserRole(user),
        company: {
            name: company?.name || "",
            addressLine1: company?.addressLine1 || "",
            addressLine2: company?.addressLine2 || "",
            city: company?.city || "",
            state: company?.state || "",
            country: company?.country || "",
            zipcode: company?.zipcode || "",
        }
    };
}

function settingValue(settings, draft, key) {
    return draft[key] ?? settings?.[key] ?? defaultShippingSettings[key];
}

function StatusPill({ active }) {
    return (
        <span className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold ${active ? "bg-emerald-50 text-emerald-700" : "bg-slate-100 text-slate-600"}`}>
            {active ? "Connected" : "Inactive"}
        </span>
    );
}

function MetricCard({ icon: Icon, label, value, tone = "text-gray-950" }) {
    return (
        <div className="rounded-lg border border-violet-100 bg-white p-5 shadow-sm">
            <div className="mb-4 flex h-10 w-10 items-center justify-center rounded-lg bg-violet-50 text-violet-700">
                <Icon className="h-5 w-5" />
            </div>
            <div className={`text-2xl font-bold ${tone}`}>{value}</div>
            <div className="mt-1 text-sm font-medium text-gray-500">{label}</div>
        </div>
    );
}

export default function SettingsPage() {
    const dispatch = useDispatch();
    const [profileDraft, setProfileDraft] = useState({});
    const [shippingDraft, setShippingDraft] = useState({});
    const [savingProfile, setSavingProfile] = useState(false);
    const [passwordForm, setPasswordForm] = useState({
        currentPassword: "",
        newPassword: "",
        confirmPassword: "",
    });
    const [changingPassword, setChangingPassword] = useState(false);
    const [visiblePasswords, setVisiblePasswords] = useState({
        currentPassword: false,
        newPassword: false,
        confirmPassword: false,
    });

    const { user, loading: userLoading } = useSelector((state) => state.authorization);
    const { data: integrations, loading: integrationsLoading } = useSelector((state) => state.integrations);
    const { data: settings, loading: settingsLoading, saving: savingSettings } = useSelector((state) => state.settings);

    const userSnapshot = useMemo(() => getUserSnapshot(user), [user]);
    const isSuperAdmin = userSnapshot.role === "super_admin";
    const connectedCarriers = useMemo(() => (integrations || []).filter((integration) => integration.isActive), [integrations]);
    const userInitials = getInitials(userSnapshot.name, userSnapshot.email);

    useEffect(() => {
        dispatch(FetchIntegrationsAction());
        dispatch(FetchSettingsAction());
    }, [dispatch]);

    const profileValue = (key) => profileDraft[key] ?? userSnapshot[key] ?? "";
    const companyValue = (key) => profileDraft.company?.[key] ?? userSnapshot.company?.[key] ?? "";
    const updateProfileField = (key, value) => setProfileDraft((current) => ({ ...current, [key]: value }));
    const updateCompanyField = (key, value) => setProfileDraft((current) => ({
        ...current,
        company: { ...(current.company || {}), [key]: value }
    }));
    const updateShippingField = (key, value) => setShippingDraft((current) => ({ ...current, [key]: value }));
    const getShippingValue = (key) => settingValue(settings, shippingDraft, key);

    const handleSaveProfile = async (event) => {
        event.preventDefault();
        setSavingProfile(true);
        try {
            await UserUpdateProfileAction({
                firstName: profileValue("firstName"),
                lastName: profileValue("lastName"),
                phone: profileValue("phone"),
                countryCode: profileValue("countryCode"),
                company: {
                    name: companyValue("name"),
                    addressLine1: companyValue("addressLine1"),
                    addressLine2: companyValue("addressLine2"),
                    city: companyValue("city"),
                    state: companyValue("state"),
                    country: companyValue("country"),
                    zipcode: companyValue("zipcode"),
                }
            }, dispatch);
            setProfileDraft({});
            toast.success("Profile updated successfully", { id: "profile-save" });
        } catch (error) {
            toast.error(error?.response?.data?.message || "Unable to update profile", { id: "profile-save" });
        } finally {
            setSavingProfile(false);
        }
    };

    const handleSaveShipping = async (event) => {
        event.preventDefault();
        try {
            await dispatch(UpdateShippingSettingsAction({
                walletThreshold: Number(getShippingValue("walletThreshold") || 0),
                verykCustomerCareEmail: getShippingValue("verykCustomerCareEmail"),
            }));
            setShippingDraft({});
            toast.success("Shipping settings saved", { id: "shipping-save" });
        } catch (error) {
            toast.error(error?.response?.data?.message || "Unable to save shipping settings", { id: "shipping-save" });
        }
    };

    const handleChangePassword = async (event) => {
        event.preventDefault();

        if (passwordForm.newPassword !== passwordForm.confirmPassword) {
            toast.error("New password and confirmation do not match", { id: "change-password" });
            return;
        }

        setChangingPassword(true);
        try {
            await UserChangePasswordAction({
                currentPassword: passwordForm.currentPassword,
                newPassword: passwordForm.newPassword,
            }, dispatch, user);
            setPasswordForm({ currentPassword: "", newPassword: "", confirmPassword: "" });
            toast.success("Password updated successfully", { id: "change-password" });
        } catch (error) {
            toast.error(error?.response?.data?.message || "Unable to change password", { id: "change-password" });
        } finally {
            setChangingPassword(false);
        }
    };

    return (
        <div className="space-y-6 py-6 px-4 xl:px-6">
            <section className="overflow-hidden rounded-xl border border-violet-100 bg-white shadow-sm">
                <div className="grid gap-6 bg-[radial-gradient(circle_at_top_left,#7c3aed_0,#2d1558_42%,#12071f_100%)] p-6 text-white lg:grid-cols-[minmax(0,1fr)_380px]">
                    <div className="space-y-5">
                        <div className="inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] text-violet-100">
                            <ShieldCheck className="h-3.5 w-3.5" />
                            Workspace Control
                        </div>
                        <div>
                            <h1 className="text-3xl font-bold">Settings</h1>
                            <p className="mt-2 max-w-2xl text-sm leading-6 text-violet-100">
                                Manage profile details, shipping controls, carrier connections, and account security from one focused workspace.
                            </p>
                        </div>
                        <div className="grid max-w-2xl grid-cols-1 gap-3 sm:grid-cols-3">
                            <div className="rounded-lg border border-white/15 bg-white/10 p-3">
                                <div className="text-xs text-violet-100">Account</div>
                                <div className="mt-1 font-semibold">{userLoading ? "Loading" : "Active"}</div>
                            </div>
                            <div className="rounded-lg border border-white/15 bg-white/10 p-3">
                                <div className="text-xs text-violet-100">Role</div>
                                <div className="mt-1 font-semibold capitalize">{userSnapshot.role}</div>
                            </div>
                            <div className="rounded-lg border border-white/15 bg-white/10 p-3">
                                <div className="text-xs text-violet-100">Security</div>
                                <div className="mt-1 font-semibold">Protected</div>
                            </div>
                        </div>
                    </div>

                    <div className="rounded-lg border border-white/20 bg-white/10 p-4 backdrop-blur">
                        <div className="flex items-center gap-4">
                            <div className="flex h-14 w-14 items-center justify-center rounded-lg bg-white text-lg font-bold text-[#2b1850]">
                                {userInitials}
                            </div>
                            <div className="min-w-0">
                                <div className="truncate text-lg font-semibold">{userSnapshot.name}</div>
                                <div className="truncate text-sm text-violet-100">{userSnapshot.email || "No email available"}</div>
                            </div>
                        </div>
                        <div className="mt-4 grid grid-cols-2 gap-3 text-sm">
                            <Link href={PROJECT_URL.DASHBOARD_CARRIERS} className="rounded-lg bg-white/10 p-3 transition hover:bg-white/15">
                                <div className="text-violet-100">Carriers</div>
                                <div className="mt-1 font-semibold">{connectedCarriers.length} active</div>
                            </Link>
                            <Link href={PROJECT_URL.DASHBOARD_CREDIT_WALLET} className="rounded-lg bg-white/10 p-3 transition hover:bg-white/15">
                                <div className="text-violet-100">Wallet</div>
                                <div className="mt-1 font-semibold">Credits</div>
                            </Link>
                        </div>
                    </div>
                </div>
            </section>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
                <MetricCard icon={BadgeCheck} label="Account Status" value={userLoading ? "Loading" : "Active"} tone="text-emerald-700" />
                <MetricCard icon={Truck} label="Connected Carriers" value={connectedCarriers.length} tone="text-violet-700" />
                <MetricCard icon={PackageCheck} label="Shipping Controls" value={isSuperAdmin ? "Enabled" : "Admin"} />
                <MetricCard icon={ShieldCheck} label="Security" value="Protected" tone="text-emerald-700" />
            </div>

            <Tabs defaultValue="profile" className="gap-5">
                <TabsList className={`grid h-auto w-full grid-cols-1 gap-2 rounded-lg bg-[#efedf8] p-1 md:w-fit ${isSuperAdmin ? "md:grid-cols-4" : "md:grid-cols-3"}`}>
                    <TabsTrigger value="profile" className="h-10 px-4">
                        <User />
                        Profile
                    </TabsTrigger>
                    {isSuperAdmin && (
                        <TabsTrigger value="shipping" className="h-10 px-4">
                            <Route />
                            Shipping Details
                        </TabsTrigger>
                    )}
                    <TabsTrigger value="integrations" className="h-10 px-4">
                        <Globe />
                        Integrations
                    </TabsTrigger>
                    <TabsTrigger value="security" className="h-10 px-4">
                        <ShieldCheck />
                        Security
                    </TabsTrigger>
                </TabsList>

                <TabsContent value="profile">
                    <div className="grid grid-cols-1 gap-6 lg:grid-cols-[minmax(0,1fr)_360px]">
                        <Card className="bg-white p-6 shadow-sm">
                            <div className="flex items-center gap-3">
                                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-violet-50 text-violet-700">
                                    <User className="h-5 w-5" />
                                </div>
                                <div>
                                    <h2 className="text-xl font-semibold text-gray-950">Account Profile</h2>
                                    <p className="text-sm text-gray-500">Update personal and company details for this workspace.</p>
                                </div>
                            </div>

                            <form className="grid grid-cols-1 gap-5 md:grid-cols-2" onSubmit={handleSaveProfile}>
                                <div>
                                    <Label className="mb-2 block text-sm font-semibold text-gray-700">First Name</Label>
                                    <Input value={profileValue("firstName")} onChange={(event) => updateProfileField("firstName", event.target.value)} required />
                                </div>
                                <div>
                                    <Label className="mb-2 block text-sm font-semibold text-gray-700">Last Name</Label>
                                    <Input value={profileValue("lastName")} onChange={(event) => updateProfileField("lastName", event.target.value)} required />
                                </div>
                                <div>
                                    <Label className="mb-2 block text-sm font-semibold text-gray-700">Email</Label>
                                    <Input value={userSnapshot.email} readOnly />
                                </div>
                                <div>
                                    <Label className="mb-2 block text-sm font-semibold text-gray-700">Phone</Label>
                                    <Input value={profileValue("phone")} onChange={(event) => updateProfileField("phone", event.target.value)} />
                                </div>
                                <div>
                                    <Label className="mb-2 block text-sm font-semibold text-gray-700">Country Code</Label>
                                    <Input value={profileValue("countryCode")} onChange={(event) => updateProfileField("countryCode", event.target.value)} placeholder="+1" />
                                </div>
                                <div>
                                    <Label className="mb-2 block text-sm font-semibold text-gray-700">Company</Label>
                                    <Input value={companyValue("name")} onChange={(event) => updateCompanyField("name", event.target.value)} />
                                </div>
                                <div className="md:col-span-2">
                                    <Label className="mb-2 block text-sm font-semibold text-gray-700">Company Address</Label>
                                    <Input value={companyValue("addressLine1")} onChange={(event) => updateCompanyField("addressLine1", event.target.value)} />
                                </div>
                                <div>
                                    <Label className="mb-2 block text-sm font-semibold text-gray-700">City</Label>
                                    <Input value={companyValue("city")} onChange={(event) => updateCompanyField("city", event.target.value)} />
                                </div>
                                <div>
                                    <Label className="mb-2 block text-sm font-semibold text-gray-700">State</Label>
                                    <Input value={companyValue("state")} onChange={(event) => updateCompanyField("state", event.target.value)} />
                                </div>
                                <div>
                                    <Label className="mb-2 block text-sm font-semibold text-gray-700">Country</Label>
                                    <Input value={companyValue("country")} onChange={(event) => updateCompanyField("country", event.target.value)} />
                                </div>
                                <div>
                                    <Label className="mb-2 block text-sm font-semibold text-gray-700">Zipcode</Label>
                                    <Input value={companyValue("zipcode")} onChange={(event) => updateCompanyField("zipcode", event.target.value)} />
                                </div>
                                <div className="md:col-span-2">
                                    <Button type="submit" disabled={savingProfile}>
                                        {savingProfile ? <Loader2 className="animate-spin" /> : <Save />}
                                        Save Profile
                                    </Button>
                                </div>
                            </form>
                        </Card>

                        <Card className="bg-white p-3 xl:p-6 shadow-sm">
                            <div className="flex items-center gap-3">
                                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-violet-50 text-violet-700">
                                    <Building2 className="h-5 w-5" />
                                </div>
                                <h2 className="text-xl font-semibold text-gray-950">Workspace Links</h2>
                            </div>
                            <div className="space-y-3">
                                <Link href={PROJECT_URL.DASHBOARD_CLIENTS} className="flex items-center justify-between rounded-lg border border-gray-200 px-4 py-3 font-medium transition hover:bg-gray-50">
                                    Client Management
                                    <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                                </Link>
                                <Link href={PROJECT_URL.DASHBOARD_WAREHOUSES} className="flex items-center justify-between rounded-lg border border-gray-200 px-4 py-3 font-medium transition hover:bg-gray-50">
                                    Warehouses
                                    <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                                </Link>
                                <Link href={PROJECT_URL.DASHBOARD_CREDIT_WALLET} className="flex items-center justify-between rounded-lg border border-gray-200 px-4 py-3 font-medium transition hover:bg-gray-50">
                                    Credit Wallet
                                    <Wallet className="h-4 w-4 text-amber-500" />
                                </Link>
                            </div>
                        </Card>
                    </div>
                </TabsContent>

                {isSuperAdmin && (
                    <TabsContent value="shipping">
                        <div className="grid grid-cols-1 gap-6 lg:grid-cols-[minmax(0,1fr)_360px]">
                            <Card className="bg-white p-6 shadow-sm">
                                <div className="flex items-center gap-3">
                                    <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-violet-50 text-violet-700">
                                        <PackageCheck className="h-5 w-5" />
                                    </div>
                                    <div>
                                        <h2 className="text-xl font-semibold text-gray-950">Shipping Details</h2>
                                        <p className="text-sm text-gray-500">Saved on the database and used by SLA and label workflows.</p>
                                    </div>
                                </div>

                                <form className="grid grid-cols-1 gap-5 md:grid-cols-2" onSubmit={handleSaveShipping}>
                                    <div>
                                        <Label className="mb-2 block text-sm font-semibold text-gray-700">Low Wallet Threshold</Label>
                                        <Input type="number" min="0" value={getShippingValue("walletThreshold")} onChange={(event) => updateShippingField("walletThreshold", event.target.value)} />
                                    </div>
                                    <div>
                                        <Label className="mb-2 block text-sm font-semibold text-gray-700">Veryk Customer Care Email</Label>
                                        <Input type="email" value={getShippingValue("verykCustomerCareEmail")} onChange={(event) => updateShippingField("verykCustomerCareEmail", event.target.value)} />
                                    </div>
                                    <div className="md:col-span-2">
                                        <Button type="submit" disabled={savingSettings || settingsLoading}>
                                            {savingSettings ? <Loader2 className="animate-spin" /> : <Save />}
                                            Save Shipping Details
                                        </Button>
                                    </div>
                                </form>
                            </Card>

                            <Card className="bg-white p-6 shadow-sm">
                                <div className="flex items-center gap-3">
                                    <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-violet-50 text-violet-700">
                                        <Route className="h-5 w-5" />
                                    </div>
                                    <div>
                                        <h2 className="text-xl font-semibold text-gray-950">Saved Controls</h2>
                                        <p className="text-sm text-gray-500">These values are used by wallet and carrier support workflows.</p>
                                    </div>
                                </div>
                                <div className="space-y-3 text-sm">
                                    <div className="rounded-lg border border-gray-200 bg-gray-50 p-4">
                                        <div className="font-semibold text-gray-950">Low wallet alert</div>
                                        <div className="mt-1 text-gray-500">${getShippingValue("walletThreshold")} threshold</div>
                                    </div>
                                    <div className="rounded-lg border border-gray-200 bg-gray-50 p-4">
                                        <div className="font-semibold text-gray-950">Veryk support</div>
                                        <div className="mt-1 break-all text-gray-500">{getShippingValue("verykCustomerCareEmail")}</div>
                                    </div>
                                </div>
                            </Card>
                        </div>
                    </TabsContent>
                )}

                <TabsContent value="integrations">
                    <Card className="bg-white p-6 shadow-sm">
                        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                            <div className="flex items-center gap-3">
                                <Globe className="h-5 w-5 text-violet-600" />
                                <h2 className="text-xl font-semibold text-gray-950">Carrier API Connections</h2>
                            </div>
                            <Link href={PROJECT_URL.DASHBOARD_CARRIERS} className="inline-flex h-10 items-center justify-center gap-1.5 rounded-lg border border-border bg-background px-3 text-sm font-medium transition-all hover:bg-muted">
                                <Truck />
                                Manage Carriers
                            </Link>
                        </div>

                        <div className="overflow-x-auto">
                            <table className="w-full text-sm">
                                <thead className="text-muted-foreground">
                                    <tr className="border-b text-left">
                                        <th className="py-3 pr-3">Provider</th>
                                        <th className="py-3 pr-3">Status</th>
                                        <th className="py-3 pr-3">Mode</th>
                                        <th className="py-3 pr-3">Reference</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {integrationsLoading && (
                                        <tr>
                                            <td className="py-6 text-center text-muted-foreground" colSpan={4}>Loading integrations...</td>
                                        </tr>
                                    )}
                                    {!integrationsLoading && !integrations?.length && (
                                        <tr>
                                            <td className="py-6 text-center text-muted-foreground" colSpan={4}>No carrier connections configured.</td>
                                        </tr>
                                    )}
                                    {!integrationsLoading && integrations?.map((integration) => (
                                        <tr key={integration.id || integration.provider} className="border-b last:border-0">
                                            <td className="py-3 pr-3 font-semibold"><CarrierBrand name={integration.provider || "-"} /></td>
                                            <td className="py-3 pr-3"><StatusPill active={integration.isActive} /></td>
                                            <td className="py-3 pr-3">{integration.environment || integration.mode || "Production"}</td>
                                            <td className="py-3 pr-3">{integration.accountNumber || integration.clientId || "-"}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </Card>
                </TabsContent>

                <TabsContent value="security">
                    <div className="grid grid-cols-1 gap-6 lg:grid-cols-[minmax(0,1fr)_420px]">
                        <Card className="bg-white p-6 shadow-sm">
                            <div className="flex items-center gap-3">
                                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-violet-50 text-violet-700">
                                    <KeyRound className="h-5 w-5" />
                                </div>
                                <div>
                                    <h2 className="text-xl font-semibold text-gray-950">Change Password</h2>
                                    <p className="text-sm text-gray-500">Use a strong password with uppercase, lowercase, number, and symbol.</p>
                                </div>
                            </div>

                            <form className="grid grid-cols-1 gap-5 md:grid-cols-2" onSubmit={handleChangePassword}>
                                <div className="md:col-span-2">
                                    <Label className="mb-2 block text-sm font-semibold text-gray-700">Current Password</Label>
                                    <PasswordInput name="currentPassword" value={passwordForm.currentPassword} visible={visiblePasswords.currentPassword} setPasswordForm={setPasswordForm} setVisiblePasswords={setVisiblePasswords} />
                                </div>
                                <div>
                                    <Label className="mb-2 block text-sm font-semibold text-gray-700">New Password</Label>
                                    <PasswordInput name="newPassword" value={passwordForm.newPassword} visible={visiblePasswords.newPassword} setPasswordForm={setPasswordForm} setVisiblePasswords={setVisiblePasswords} />
                                </div>
                                <div>
                                    <Label className="mb-2 block text-sm font-semibold text-gray-700">Confirm Password</Label>
                                    <PasswordInput name="confirmPassword" value={passwordForm.confirmPassword} visible={visiblePasswords.confirmPassword} setPasswordForm={setPasswordForm} setVisiblePasswords={setVisiblePasswords} />
                                </div>
                                <div className="md:col-span-2">
                                    <Button type="submit" disabled={changingPassword}>
                                        {changingPassword ? <Loader2 className="animate-spin" /> : <LockKeyhole />}
                                        Update Password
                                    </Button>
                                </div>
                            </form>
                        </Card>

                        <Card className="bg-white p-6 shadow-sm">
                            <div className="flex items-center gap-3">
                                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-emerald-50 text-emerald-700">
                                    <ShieldCheck className="h-5 w-5" />
                                </div>
                                <h2 className="text-xl font-semibold text-gray-950">Access Control</h2>
                            </div>
                            <div className="space-y-4">
                                <div className="rounded-lg border border-gray-200 bg-gray-50 p-4">
                                    <div className="text-sm font-semibold text-gray-500">Authentication</div>
                                    <div className="mt-2 text-lg font-bold text-gray-950">Token secured session</div>
                                    <p className="mt-1 text-sm text-gray-500">Session access is managed through the platform login flow.</p>
                                </div>
                                <div className="rounded-lg border border-gray-200 bg-gray-50 p-4">
                                    <div className="text-sm font-semibold text-gray-500">Operational Scope</div>
                                    <div className="mt-2 text-lg font-bold text-gray-950">Carrier, wallet, warehouse, quote, and label modules</div>
                                    <p className="mt-1 text-sm text-gray-500">Module access follows your account role and workspace permissions.</p>
                                </div>
                            </div>
                        </Card>
                    </div>
                </TabsContent>
            </Tabs>
        </div>
    );
}
