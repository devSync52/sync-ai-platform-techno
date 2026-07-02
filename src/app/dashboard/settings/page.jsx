"use client";

import React, { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useDispatch, useSelector } from "react-redux";
import { toast } from "react-hot-toast";
import {
  Bell,
  Building2,
  CheckCircle2,
  Globe,
  KeyRound,
  PackageCheck,
  Route,
  Save,
  Settings,
  ShieldCheck,
  Truck,
  User,
  Wallet,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectGroup, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { FetchIntegrationsAction } from "@/services/actions/integrations";
import { PROJECT_URL } from "@/utils/constants";
import CarrierBrand from "@/components/carrier-brand";

const fallbackUser = {
  firstName: "Soumallya",
  lastName: "Dey",
  email: "soumallya.dey@technoexpnent.co.in",
  role: "Administrator",
};

const notificationSettings = [
  {
    key: "labelFailures",
    title: "Label failures",
    description: "Alert operations when a carrier rejects a label request.",
  },
  {
    key: "walletThreshold",
    title: "Low credit wallet",
    description: "Notify finance when available credits drop below the threshold.",
  },
  {
    key: "slaBreaches",
    title: "SLA breach risk",
    description: "Surface late shipments and at-risk lanes before escalation.",
  },
];

const automationSettings = [
  {
    key: "autoCarrierSelection",
    title: "Auto carrier selection",
    description: "Prefer the best active carrier based on price, SLA, and warehouse.",
  },
  {
    key: "autoClaimDrafts",
    title: "Claim draft creation",
    description: "Create claim drafts when reconciliation detects charge variance.",
  },
  {
    key: "aiSummaries",
    title: "SynC AI summaries",
    description: "Show AI explanations on discrepancies, KPIs, and claims.",
  },
];

const defaultPreferences = {
  defaultCarrier: "best-rate",
  labelFormat: "4x6",
  billingMode: "prepaid",
  walletThreshold: "10",
  verykCustomerCareEmail: "support@veryk.com",
  labelFailures: true,
  walletThresholdAlerts: true,
  slaBreaches: true,
  autoCarrierSelection: true,
  autoClaimDrafts: false,
  aiSummaries: true,
};

function getUserName(user) {
  const profile = user?.profile || user || fallbackUser;
  const name = [profile.firstName, profile.lastName].filter(Boolean).join(" ");

  return profile.name || profile.fullName || name || fallbackUser.firstName;
}

function getUserEmail(user) {
  const profile = user?.profile || user || fallbackUser;

  return profile.email || fallbackUser.email;
}

function getUserRole(user) {
  const profile = user?.profile || user || fallbackUser;

  return profile.role || profile.userType || fallbackUser.role;
}

function SettingToggle({ checked, description, onCheckedChange, title }) {
  return (
    <div className="flex items-start justify-between gap-4 rounded-xl border border-gray-200 bg-white px-4 py-3">
      <div>
        <h3 className="font-semibold text-gray-950">{title}</h3>
        <p className="mt-1 text-sm text-gray-500">{description}</p>
      </div>
      <Switch checked={checked} onCheckedChange={onCheckedChange} />
    </div>
  );
}

function StatusPill({ active }) {
  return (
    <span className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold ${active ? "bg-green-50 text-green-700" : "bg-slate-100 text-slate-600"}`}>
      {active ? "Connected" : "Inactive"}
    </span>
  );
}

export default function SettingsPage() {
  const dispatch = useDispatch();
  const [preferences, setPreferences] = useState(defaultPreferences);
  const { user, loading: userLoading } = useSelector((state) => state.authorization);
  const { data: integrations, loading: integrationsLoading } = useSelector((state) => state.integrations);

  useEffect(() => {
    dispatch(FetchIntegrationsAction());
  }, [dispatch]);

  const connectedCarriers = useMemo(
    () => (integrations || []).filter((integration) => integration.isActive),
    [integrations]
  );

  const userName = getUserName(user);
  const userEmail = getUserEmail(user);
  const userRole = getUserRole(user);
  const userInitials = userName
    .split(" ")
    .map((part) => part[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  const updatePreference = (key, value) => {
    setPreferences((current) => ({ ...current, [key]: value }));
  };

  const handleSavePreferences = () => {
    toast.success("Settings preferences saved locally", { id: "settings-save" });
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
        <div className="space-y-2">
          <h1 className="text-2xl font-bold text-primary">Settings</h1>
          <p>Manage account access, carrier behavior, alerts, and platform defaults.</p>
        </div>
        <Button size="lg" onClick={handleSavePreferences}>
          <Save />
          Save Preferences
        </Button>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <div className="interactive-card motion-fade-up rounded-2xl border border-gray-200 bg-white/95 p-5 backdrop-blur">
          <div className="mb-5 flex items-center gap-3 text-[#4B5A8A]">
            <User className="h-5 w-5" />
            <span className="text-[18px] font-medium">Account</span>
          </div>
          <h2 className="text-3xl font-bold text-black">{userLoading ? "Loading" : "Active"}</h2>
        </div>

        <div className="interactive-card motion-fade-up rounded-2xl border border-gray-200 bg-white/95 p-5 backdrop-blur" style={{ animationDelay: "70ms" }}>
          <div className="mb-5 flex items-center gap-3 text-[#4B5A8A]">
            <Truck className="h-5 w-5" />
            <span className="text-[18px] font-medium">Carriers</span>
          </div>
          <h2 className="text-4xl font-bold text-violet-600">{connectedCarriers.length}</h2>
        </div>

        <div className="interactive-card motion-fade-up rounded-2xl border border-gray-200 bg-white/95 p-5 backdrop-blur" style={{ animationDelay: "140ms" }}>
          <div className="mb-5 flex items-center gap-3 text-[#4B5A8A]">
            <PackageCheck className="h-5 w-5" />
            <span className="text-[18px] font-medium">Label Format</span>
          </div>
          <h2 className="text-4xl font-bold text-black">{preferences.labelFormat}</h2>
        </div>

        <div className="interactive-card motion-fade-up rounded-2xl border border-gray-200 bg-white/95 p-5 backdrop-blur" style={{ animationDelay: "210ms" }}>
          <div className="mb-5 flex items-center gap-3 text-[#4B5A8A]">
            <Wallet className="h-5 w-5" />
            <span className="text-[18px] font-medium">Wallet Alert</span>
          </div>
          <h2 className="text-4xl font-bold text-amber-500">${preferences.walletThreshold}</h2>
        </div>
      </div>

      <Tabs defaultValue="profile">
        <TabsList className="grid h-auto w-full grid-cols-2 gap-2 bg-[#efedf8] p-1 md:w-fit md:grid-cols-4">
          <TabsTrigger value="profile" className="h-10 px-3">
            <User />
            Profile
          </TabsTrigger>
          <TabsTrigger value="shipping" className="h-10 px-3">
            <Route />
            Shipping
          </TabsTrigger>
          <TabsTrigger value="integrations" className="h-10 px-3">
            <Globe />
            Integrations
          </TabsTrigger>
          <TabsTrigger value="security" className="h-10 px-3">
            <ShieldCheck />
            Security
          </TabsTrigger>
        </TabsList>

        <TabsContent value="profile" className="mt-5">
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-[minmax(0,1fr)_360px]">
            <Card className="motion-scale-in bg-white/95 p-6 backdrop-blur">
              <div className="flex items-center gap-3">
                <User className="h-5 w-5 text-violet-600" />
                <h2 className="text-xl font-semibold text-gray-950">Account Profile</h2>
              </div>

              <div className="mt-2 flex items-center gap-4 rounded-2xl bg-gray-50 p-5">
                <div className="flex h-14 w-14 items-center justify-center rounded-full bg-linear-to-br from-violet-600 to-fuchsia-600 text-lg font-bold text-white">
                  {userInitials || "S"}
                </div>
                <div className="min-w-0">
                  <h3 className="truncate text-xl font-semibold text-gray-950">{userName}</h3>
                  <p className="truncate text-sm font-medium text-gray-500">{userEmail}</p>
                  <span className="mt-2 inline-flex rounded-full bg-violet-50 px-3 py-1 text-xs font-semibold text-violet-700">
                    {userRole}
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
                <div>
                  <Label className="mb-2 block text-sm font-semibold text-gray-700">Name</Label>
                  <Input value={userName} readOnly />
                </div>
                <div>
                  <Label className="mb-2 block text-sm font-semibold text-gray-700">Email</Label>
                  <Input value={userEmail} readOnly />
                </div>
                <div>
                  <Label className="mb-2 block text-sm font-semibold text-gray-700">Role</Label>
                  <Input value={userRole} readOnly />
                </div>
                <div>
                  <Label className="mb-2 block text-sm font-semibold text-gray-700">Workspace</Label>
                  <Input value="SynC AI Courier Management" readOnly />
                </div>
              </div>
            </Card>

            <Card className="motion-scale-in bg-white/95 p-6 backdrop-blur">
              <div className="flex items-center gap-3">
                <Building2 className="h-5 w-5 text-violet-600" />
                <h2 className="text-xl font-semibold text-gray-950">Workspace Links</h2>
              </div>
              <div className="space-y-3">
                <Link href={PROJECT_URL.DASHBOARD_CLIENTS} className="flex items-center justify-between rounded-xl border border-gray-200 px-4 py-3 font-medium transition hover:bg-gray-50">
                  Client Management
                  <CheckCircle2 className="h-4 w-4 text-green-600" />
                </Link>
                <Link href={PROJECT_URL.DASHBOARD_WAREHOUSES} className="flex items-center justify-between rounded-xl border border-gray-200 px-4 py-3 font-medium transition hover:bg-gray-50">
                  Warehouses
                  <CheckCircle2 className="h-4 w-4 text-green-600" />
                </Link>
                <Link href={PROJECT_URL.DASHBOARD_CREDIT_WALLET} className="flex items-center justify-between rounded-xl border border-gray-200 px-4 py-3 font-medium transition hover:bg-gray-50">
                  Credit Wallet
                  <Wallet className="h-4 w-4 text-amber-500" />
                </Link>
              </div>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="shipping" className="mt-5">
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
            <Card className="motion-scale-in bg-white/95 p-6 backdrop-blur">
              <div className="flex items-center gap-3">
                <PackageCheck className="h-5 w-5 text-violet-600" />
                <h2 className="text-xl font-semibold text-gray-950">Shipment Defaults</h2>
              </div>

              <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
                <div>
                  <Label className="mb-2 block text-sm font-semibold text-gray-700">Default Carrier Logic</Label>
                  <Select value={preferences.defaultCarrier} onValueChange={(value) => updatePreference("defaultCarrier", value)}>
                    <SelectTrigger className="w-full py-6">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectGroup>
                        <SelectItem value="best-rate">Best rate</SelectItem>
                        <SelectItem value="fastest-sla">Fastest SLA</SelectItem>
                        <SelectItem value="manual">Manual selection</SelectItem>
                      </SelectGroup>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label className="mb-2 block text-sm font-semibold text-gray-700">Label Format</Label>
                  <Select value={preferences.labelFormat} onValueChange={(value) => updatePreference("labelFormat", value)}>
                    <SelectTrigger className="w-full py-6">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectGroup>
                        <SelectItem value="4x6">4x6 thermal</SelectItem>
                        <SelectItem value="a4">A4 sheet</SelectItem>
                        <SelectItem value="letter">US letter</SelectItem>
                      </SelectGroup>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label className="mb-2 block text-sm font-semibold text-gray-700">Billing Mode</Label>
                  <Select value={preferences.billingMode} onValueChange={(value) => updatePreference("billingMode", value)}>
                    <SelectTrigger className="w-full py-6">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectGroup>
                        <SelectItem value="prepaid">Credit wallet prepaid</SelectItem>
                        <SelectItem value="carrier-account">Carrier account billing</SelectItem>
                        <SelectItem value="client-account">Client account billing</SelectItem>
                      </SelectGroup>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label className="mb-2 block text-sm font-semibold text-gray-700">Low Wallet Threshold</Label>
                  <Input value={preferences.walletThreshold} onChange={(event) => updatePreference("walletThreshold", event.target.value)} />
                </div>
                <div className="md:col-span-2">
                  <Label className="mb-2 block text-sm font-semibold text-gray-700">Veryk Customer Care Email</Label>
                  <Input
                    type="email"
                    value={preferences.verykCustomerCareEmail}
                    onChange={(event) => updatePreference("verykCustomerCareEmail", event.target.value)}
                    placeholder="support@veryk.com"
                  />
                  <p className="mt-2 text-sm text-gray-500">
                    Used when operations needs to contact Veryk support for labels, rates, or reconciliation issues.
                  </p>
                </div>
              </div>
            </Card>

            <Card className="motion-scale-in bg-white/95 p-6 backdrop-blur">
              <div className="flex items-center gap-3">
                <Settings className="h-5 w-5 text-violet-600" />
                <h2 className="text-xl font-semibold text-gray-950">Automation</h2>
              </div>
              <div className="space-y-3">
                {automationSettings.map((setting) => (
                  <SettingToggle
                    key={setting.key}
                    title={setting.title}
                    description={setting.description}
                    checked={preferences[setting.key]}
                    onCheckedChange={(checked) => updatePreference(setting.key, checked)}
                  />
                ))}
              </div>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="integrations" className="mt-5">
          <Card className="motion-scale-in bg-white/95 p-6 backdrop-blur">
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

        <TabsContent value="security" className="mt-5">
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
            <Card className="motion-scale-in bg-white/95 p-6 backdrop-blur">
              <div className="flex items-center gap-3">
                <Bell className="h-5 w-5 text-violet-600" />
                <h2 className="text-xl font-semibold text-gray-950">Notifications</h2>
              </div>
              <div className="space-y-3">
                {notificationSettings.map((setting) => (
                  <SettingToggle
                    key={setting.key}
                    title={setting.title}
                    description={setting.description}
                    checked={setting.key == "walletThreshold" ? preferences.walletThresholdAlerts : preferences[setting.key]}
                    onCheckedChange={(checked) => updatePreference(setting.key == "walletThreshold" ? "walletThresholdAlerts" : setting.key, checked)}
                  />
                ))}
              </div>
            </Card>

            <Card className="motion-scale-in bg-white/95 p-6 backdrop-blur">
              <div className="flex items-center gap-3">
                <KeyRound className="h-5 w-5 text-violet-600" />
                <h2 className="text-xl font-semibold text-gray-950">Access Control</h2>
              </div>
              <div className="space-y-4">
                <div className="rounded-xl border border-gray-200 bg-gray-50 p-4">
                  <div className="text-sm font-semibold text-gray-500">Authentication</div>
                  <div className="mt-2 text-lg font-bold text-gray-950">Token secured session</div>
                  <p className="mt-1 text-sm text-gray-500">Session access is managed through the platform login flow.</p>
                </div>
                <div className="rounded-xl border border-gray-200 bg-gray-50 p-4">
                  <div className="text-sm font-semibold text-gray-500">Operational Scope</div>
                  <div className="mt-2 text-lg font-bold text-gray-950">Carrier, warehouse, wallet, and reconciliation modules</div>
                  <p className="mt-1 text-sm text-gray-500">Use module pages to configure API credentials, SLA rules, and account data.</p>
                </div>
              </div>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
