"use client";

import { useEffect, useRef, useState } from "react";
import { usePathname } from "next/navigation";
import IconAsset from "@/components/IconAsset";
import Link from "next/link";
import { useDispatch, useSelector } from "react-redux";
import { UserLogoutAction } from "@/services/actions/authorization";
import { API_URL, PROJECT_URL } from "@/utils/constants";
import axiosInstance from "@/config/axios";

const navGroups = [
    {
        label: "OVERVIEW",
        items: [
            {
                label: "Dashboard",
                icon: "dashboard",
                href: PROJECT_URL.DASHBOARD,
            }
        ],
    },
    {
        label: "OPERATIONS",
        items: [
            {
                label: "Carrier Hub",
                href: PROJECT_URL.DASHBOARD_CARRIERS,
                icon: "link"
            },
            {
                label: "Orders",
                href: PROJECT_URL.DASHBOARD_ORDERS,
                icon: "package"
            },
            {
                label: "Generate Quote",
                href: PROJECT_URL.DASHBOARD_ORDERS_GENERATE,
                icon: "package"
            },
            {
                label: "Inventory",
                href: PROJECT_URL.DASHBOARD_INVENTORY,
                icon: "warehouse"
            },
            {
                label: "SLA & KPI",
                href: PROJECT_URL.DASHBOARD_SLA_KPI,
                icon: "chart"
            },
            {
                label: "Label Generator",
                href: PROJECT_URL.DASHBOARD_LABEL_GENERATOR,
                icon: "tag"
            },
        ],
    },
    {
        label: "CONFIGURATION",
        items: [
            {
                label: "Clients",
                href: PROJECT_URL.DASHBOARD_CLIENTS,
                icon: "users"
            },
            {
                label: "Warehouses",
                href: PROJECT_URL.DASHBOARD_WAREHOUSES,
                icon: "warehouse"
            },
            {
                label: "Address Book",
                href: PROJECT_URL.DASHBOARD_ADDRESSES,
                icon: "users"
            },
            {
                label: "SLA Rules",
                href: PROJECT_URL.DASHBOARD_SLA_RULES,
                icon: "timer"
            }
            // {
            //   label: "Bulk Import",
            //   href: PROJECT_URL.DASHBOARD_BULK_IMPORT,
            //   icon: "upload"
            // },
        ],
    },
    {
        label: "RECONCILIATION",
        items: [
            {
                label: "Discrepancies",
                href: PROJECT_URL.DASHBOARD_DISCREPANCIES,
                icon: "alert"
            },
            {
                label: "Claims",
                href: PROJECT_URL.DASHBOARD_CLAIMS,
                icon: "package"
            },
            {
                label: "Rate Intelligence",
                href: PROJECT_URL.DASHBOARD_RATE_INTELLIGENCE,
                icon: "chart"
            },
            // {
            //   label: "Rate Calculator",
            //   href: PROJECT_URL.DASHBOARD_RATE_CALCULATOR,
            //   icon: "receipt"
            // }
        ],
    },
    {
        label: "FINANCE",
        items: [
            {
                label: "Subscription",
                href: PROJECT_URL.DASHBOARD_SUBSCRIPTION,
                icon: "receipt"
            },
            {
                label: "Credit Wallet",
                href: PROJECT_URL.DASHBOARD_CREDIT_WALLET,
                icon: "wallet"
            },
            {
                label: "Price Chart",
                href: PROJECT_URL.DASHBOARD_PRICE_CHART,
                icon: "chart",
                superAdminOnly: true
            },
        ],
    },
    {
        label: "SYSTEM",
        items: [
            {
                label: "Plans",
                href: PROJECT_URL.DASHBOARD_PLANS,
                icon: "receipt",
                superAdminOnly: true
            },
            {
                label: "Notifications",
                href: PROJECT_URL.DASHBOARD_NOTIFICATIONS,
                icon: "notification",
                hidden: true
            },
            {
                label: "Settings",
                href: PROJECT_URL.DASHBOARD_SETTINGS,
                icon: "settings"
            },
        ],
    },
];

const getUserRole = (user) => {
    const details = user?.data?.user || user?.data || user;
    return details?.role || details?.userType || details?.profile?.role || details?.profile?.userType || details?.clientProfile?.role || null;
};
const isSuperAdmin = (user) => getUserRole(user) == "super_admin";
const getUserDetails = (user) => user?.data?.user || user?.data || user || {};
const getUserProfile = (user) => {
    const details = getUserDetails(user);
    return details.profile || details.clientProfile || details.userProfile || details;
};
const getDisplayName = (user) => {
    const details = getUserDetails(user);
    const profile = getUserProfile(user);
    const fullName = [profile?.firstName || details?.firstName, profile?.lastName || details?.lastName].filter(Boolean).join(" ");

    return details?.name || profile?.name || fullName || details?.username || "User";
};
const getDisplayEmail = (user) => {
    const details = getUserDetails(user);
    const profile = getUserProfile(user);

    return details?.email || profile?.email || details?.user?.email || "";
};
const getInitials = (name, email) => {
    const source = name && name != "User" ? name : email;
    const words = String(source || "U").split(/[\s@._-]+/).filter(Boolean);
    return words.slice(0, 2).map((word) => word.charAt(0).toUpperCase()).join("") || "U";
};
const formatMoney = (amount) => new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 2,
}).format(Number(amount || 0));

export default function Sidebar({ compressed, setCompressed }) {
    const pathname = usePathname();

    const [accountOpen, setAccountOpen] = useState(false);
    const [creditBalance, setCreditBalance] = useState(0);
    const accountRef = useRef(null);
    const { user } = useSelector((state) => state.authorization);
    const displayName = getDisplayName(user);
    const displayEmail = getDisplayEmail(user);
    const initials = getInitials(displayName, displayEmail);

    const dispatch = useDispatch()
    const visibleNavGroups = navGroups.map((group) => ({
        ...group,
        items: group.items.filter((item) => !item.hidden && (!item.superAdminOnly || isSuperAdmin(user)))
    })).filter((group) => group.items.length);

    useEffect(() => {
        if (!accountOpen) return;

        function handleOutsideClick(event) {
            if (accountRef.current && !accountRef.current.contains(event.target)) {
                setAccountOpen(false);
            }
        }

        document.addEventListener("mousedown", handleOutsideClick);
        document.addEventListener("touchstart", handleOutsideClick);

        return () => {
            document.removeEventListener("mousedown", handleOutsideClick);
            document.removeEventListener("touchstart", handleOutsideClick);
        };
    }, [accountOpen]);

    useEffect(() => {
        let active = true;

        const fetchCreditBalance = async () => {
            try {
                const response = await axiosInstance.get(API_URL.WALLET, {
                    params: { page: 1, limit: 1 },
                });
                if (active) {
                    setCreditBalance(response.data?.data?.summary?.balance || 0);
                }
            } catch {
                if (active) setCreditBalance(0);
            }
        };

        fetchCreditBalance();

        return () => {
            active = false;
        };
    }, []);

    const isActive = (href) => {
        if (href == PROJECT_URL.DASHBOARD && pathname == PROJECT_URL.DASHBOARD) return true;
        if (href != PROJECT_URL.DASHBOARD && pathname.startsWith(href)) return true;
        return false;
    };

    return (
        <aside className={`fixed lg:relative z-20 h-screen shrink-0 flex-col overflow-hidden border-r border-white/[0.07] bg-[radial-gradient(circle_at_15%_0%,rgba(139,58,246,0.20),transparent_28%),linear-gradient(180deg,#140925_0%,#0d0619_58%,#10071d_100%)] text-[#c8bdd8] shadow-[18px_0_55px_rgba(26,8,48,0.14)] transition-all duration-300 md:flex ${compressed ? "left-0 w-68 lg:w-22" : "left-[-100%] w-68 lg:left-0"}`}>
            <div className={`relative flex h-[76px] shrink-0 items-center gap-3 border-b border-white/[0.07] px-5 ${compressed ? "justify-start lg:justify-center lg:px-2" : ""}`}>
                <span className="pointer-events-none absolute inset-x-8 bottom-0 h-px bg-gradient-to-r from-transparent via-[#9d54ff]/60 to-transparent" />

                <button onClick={() => setCompressed(!compressed)} className="flex h-9 w-9 items-center justify-center rounded-xl border border-white/[0.07] bg-white/[0.035] text-[#aa9abc] transition-all duration-200 hover:border-[#8e48eb]/50 hover:bg-[#2a1742] hover:text-white" title={compressed ? "Expand" : "Compress"}>
                    <IconAsset name="sidebar" className="h-4 w-4" />
                </button>


                <div className={compressed ? 'flex gap-3 lg:hidden' : 'flex gap-3'}>
                    <div className="flex h-10 w-10 items-center justify-center rounded-xl border border-white/10 bg-white/[0.06] shadow-[0_8px_24px_rgba(120,35,235,.2)]">
                        <IconAsset name="bot" className="h-8 w-8 rounded-lg" />
                    </div>
                    <div className="flex-1">
                        <div className="text-sm font-bold leading-5 tracking-[-.01em] text-white">SynC AI</div>
                        <div className="text-[10px] font-medium leading-4 text-[#8e7ca3]">Courier Management</div>
                    </div>
                </div>

            </div>

            {/* <div className={compressed ? 'block lg:hidden' : 'block'}>
                <div className="px-3 py-3">
                    <div className="flex h-9 items-center gap-2 rounded-lg bg-white/5.5 px-3 text-xs text-[#736481]">
                        <IconAsset name="search" className="h-4 w-4" />
                        Search navigation...
                    </div>
                </div>
            </div> */}

            <nav className={`sidebar-scroll min-h-0 flex-1 space-y-5 overflow-y-auto px-3 pb-5 pt-4 ${compressed ? "lg:pt-5" : ""}`}>
                {
                    visibleNavGroups.map((group) => (
                        <div key={group.label}>
                            <div className={compressed ? 'block lg:hidden' : 'block'}>
                                <div className="mb-2.5 flex items-center justify-between px-2 text-[9px] font-bold tracking-[0.2em] text-[#8e76a9]">
                                    <span>{group.label}</span>
                                    <span className="h-px flex-1 bg-gradient-to-r from-white/10 to-transparent ml-3" />
                                </div>
                            </div>
                            <div className={compressed ? "space-y-1 lg:space-y-2" : "space-y-1.5"}>
                                {
                                    group.items.map((item) => {
                                        const active = isActive(item.href);
                                        return (
                                            <Link key={item.label} href={item.href || "#"} title={compressed ? item.label : ""} className={`group relative flex items-center gap-3 overflow-hidden rounded-xl border transition-all duration-200 ${compressed ? "h-10 px-3 text-sm lg:mx-auto lg:h-10 lg:w-10 lg:justify-center lg:px-0" : "h-10 px-2.5 text-[13px]"} ${active ? `border-[#8d45eb]/35 bg-gradient-to-r from-[#452171] to-[#2d174b] font-semibold text-white shadow-[0_9px_25px_rgba(103,25,193,0.22)]` : `border-transparent text-[#b5a9c5] hover:border-white/[0.06] hover:bg-white/[0.055] hover:text-white`}`}>
                                                {active && <span className="absolute inset-y-2 left-0 w-[3px] rounded-r-full bg-gradient-to-b from-[#c561ff] to-[#7c20ff] shadow-[0_0_12px_#9b3cff]" />}

                                                <span className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-lg transition ${active ? "bg-white/10 text-[#e1c9ff]" : "bg-white/[0.025] text-[#a899ba] group-hover:bg-white/[0.07] group-hover:text-[#d5b9fa]"}`}>
                                                    <IconAsset name={item.icon} className="h-4 w-4" />
                                                </span>
                                                <div className={compressed ? 'block lg:hidden' : 'block'}>
                                                    <span>
                                                        {item.label}
                                                    </span>
                                                </div>
                                                {/* {
                                                    compressed ? (
                                                        <div className="absolute left-full ml-2 hidden group-hover:block bg-[#1e1631] text-white px-3 py-2 rounded-lg text-xs whitespace-nowrap z-100 border border-[#2b1d51] top-1/2 -translate-y-1/2">
                                                            {item.label}
                                                        </div>
                                                    ) : (
                                                        <span>
                                                            {item.label}
                                                        </span>
                                                    )
                                                } */}
                                            </Link>
                                        );
                                    })
                                }
                            </div>
                        </div>
                    ))
                }
            </nav>

            <div className={`relative shrink-0 space-y-3 border-t border-white/[0.07] bg-[#0d0619]/90 p-3.5 backdrop-blur-xl ${compressed ? "items-center lg:flex lg:flex-col" : ""}`}>
                <div className={`flex items-center justify-between rounded-xl border border-[#8c3be8]/35 bg-gradient-to-r from-[#3c1265] to-[#270e45] px-3 py-2.5 text-xs text-purple-100 shadow-[0_8px_24px_rgba(58,12,100,.24)] ${compressed ? "lg:h-10 lg:w-10 lg:justify-center lg:px-0" : ""}`}>
                    <div className="flex items-center gap-2">
                        <span className="flex h-6 w-6 items-center justify-center rounded-lg bg-white/10 text-[#ddc4ff]"><IconAsset name="wallet" className="h-3.5 w-3.5" /></span>
                        <span className={compressed ? 'initial lg:hidden' : 'initial'}>Credits</span>
                    </div>
                    <div className={compressed ? 'block lg:hidden' : 'block'}>
                        <span className="font-semibold text-white">{formatMoney(creditBalance)}</span>
                    </div>
                </div>
                <div ref={accountRef} className="relative w-full">
                    <button onClick={() => setAccountOpen((open) => !open)} className={`mx-auto flex w-full items-center gap-3 rounded-xl border border-white/[0.08] bg-white/[0.035] px-2.5 py-2 text-left transition-all duration-200 hover:border-[#7e3cce]/45 hover:bg-white/[0.065] ${compressed ? "lg:h-11 lg:w-11 lg:justify-center lg:px-0 lg:py-0" : ""}`} title="Account menu">
                        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-[#8b3cf1] to-[#d224e9] text-xs font-bold text-white shadow-[0_6px_18px_rgba(180,34,229,.3)]">
                            {initials}
                        </div>
                        <div className={compressed ? 'block lg:hidden' : 'block'}>
                            <div className="min-w-0">
                                <div className="truncate text-sm font-semibold text-white">{displayName}</div>
                                <div className="truncate text-xs text-[#827391]">{displayEmail || getUserRole(user) || "Signed in"}</div>
                            </div>
                        </div>
                    </button>

                    {accountOpen && (
                        <div className={`absolute z-50 w-44 rounded-3xl border border-[#2b1d51] bg-[#110923] p-2 shadow-[0_24px_60px_rgba(0,0,0,0.16)] ${compressed ? "top-[-50px] lg:top-0 left-0 lg:left-full top-1/2 -translate-y-1/2 ml-2" : "left-0 bottom-full mb-2"}`}>
                            <Link href={PROJECT_URL.DASHBOARD_SETTINGS} className="flex w-full items-center gap-3 rounded-2xl px-3 py-2 text-sm text-white transition hover:bg-white/5" onClick={() => setAccountOpen(false)}>
                                <IconAsset name="settings" className="h-4 w-4" />
                                Settings
                            </Link>
                            <button className="flex w-full items-center gap-3 rounded-2xl px-3 py-2 text-sm text-red-400 transition hover:bg-white/5" onClick={() => UserLogoutAction(dispatch)}>
                                <IconAsset name="close" className="h-4 w-4" />
                                Sign out
                            </button>
                        </div>
                    )}
                </div>
            </div>
        </aside>
    );
}
