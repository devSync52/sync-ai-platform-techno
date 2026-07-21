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
        <aside className={`fixed lg:relative z-10 shrink-0 min-h-0 flex-col bg-[#110923] text-[#b9aecb] transition-all duration-300 md:flex ${compressed ? "w-64 lg:w-20 left-0" : "w-64 left-[-100%] lg:left-0"}`}>
            <div className={`flex h-16 items-center gap-3 border-b border-white/10 px-5 ${compressed ? "justify-start lg:justify-center lg:px-2" : ""}`}>

                <button onClick={() => setCompressed(!compressed)} className="flex items-center justify-center rounded-lg transition-all duration-200 text-[#9b8cb8] hover:scale-105 hover:text-white hover:bg-[#1e1631] h-8 w-8" title={compressed ? "Expand" : "Compress"}>
                    <IconAsset name="sidebar" className="h-4 w-4" />
                </button>


                <div className={compressed ? 'flex gap-3 lg:hidden' : 'flex gap-3'}>
                    <IconAsset name="bot" className="h-8 w-8 rounded-lg" />
                    <div className="flex-1">
                        <div className="text-sm font-semibold leading-4 text-white">SynC AI</div>
                        <div className="text-[10px] leading-4 text-[#837596]">Courier Management</div>
                    </div>
                </div>

            </div>

            <div className={compressed ? 'block lg:hidden' : 'block'}>
                <div className="px-3 py-3">
                    <div className="flex h-9 items-center gap-2 rounded-lg bg-white/5.5 px-3 text-xs text-[#736481]">
                        <IconAsset name="search" className="h-4 w-4" />
                        Search navigation...
                    </div>
                </div>
            </div>

            <nav className={`h-[calc(100vh_-_252px)] min-h-0 space-y-3 overflow-y-auto px-2 sidebar-scroll ${compressed ? "lg:pt-4" : ""}`}>
                {
                    visibleNavGroups.map((group) => (
                        <div key={group.label}>
                            <div className={compressed ? 'block lg:hidden' : 'block'}>
                                <div className="mb-2 flex items-center justify-between px-3 text-[10px] font-bold tracking-[0.16em] text-[#7d708e]">
                                    <span>{group.label}</span>
                                    <IconAsset name="chevron" className="h-3 w-3" />
                                </div>
                            </div>
                            <div className={compressed ? "space-y-1 lg:space-y-2" : "space-y-1"}>
                                {
                                    group.items.map((item) => {
                                        const active = isActive(item.href);
                                        return (
                                            <Link key={item.label} href={item.href || "#"} title={compressed ? item.label : ""} className={`flex items-center gap-3 rounded-lg transition-all duration-200 border-l-3 group relative ${compressed ? "text-sm h-8.5 lg:h-9 lg:w-9 lg:justify-center px-3 py-2 lg:px-0 lg:py-1.5 lg:mx-auto" : "h-8.5 px-3 py-2 text-sm"} ${active ? `border-l-[#7b00f5] bg-[#2b1d51] text-white shadow-[0_10px_24px_rgba(103,0,231,0.18)]` : `border-l-transparent text-[#aea2c0] hover:translate-x-0.5 hover:bg-[#1e1631] hover:text-[#c9bfd9]`}`}>

                                                <IconAsset name={item.icon} className={compressed ? "h-4 w-4 lg:h-5 lg:w-5" : "h-4 w-4"} />
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

            <div className={`space-y-4 p-3 ${compressed ? "items-center lg:flex flex-col" : ""}`}>
                <div className="flex items-center justify-between rounded-lg border border-purple-500/30 bg-[#310958] px-3 py-2 text-xs text-purple-100">
                    <div className="flex items-center gap-2">
                        <IconAsset name="wallet" className="h-3.5 w-3.5" />
                        <span className={compressed ? 'initial lg:hidden' : 'initial'}>Credits</span>
                    </div>
                    <div className={compressed ? 'block lg:hidden' : 'block'}>
                        <span className="font-semibold text-white">{formatMoney(creditBalance)}</span>
                    </div>
                </div>
                <div ref={accountRef} className="relative w-full">
                    <button onClick={() => setAccountOpen((open) => !open)} className={`flex items-center gap-3 rounded-xl border border-white/10 bg-[#12061f] px-3 py-2 text-left transition-all duration-200 mx-auto w-full lg:w-auto ${compressed ? "lg:justify-center lg:px-0 lg:py-0" : "w-full"}`} title="Account menu">
                        <div className="flex h-8 w-9 items-center justify-center rounded-full bg-linear-to-br from-purple-500 to-fuchsia-600 text-xs font-bold text-white">
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
