"use client";

import { useEffect, useRef, useState } from "react";
import { usePathname } from "next/navigation";
import IconAsset from "@/components/IconAsset";
import Link from "next/link";

const navGroups = [
  {
    label: "OVERVIEW",
    items: [
      {
        label: "Dashboard",
        icon: "dashboard",
        href: "/dashboard",
      }
    ],
  },
  {
    label: "OPERATIONS",
    items: [
      {
        label: "Carrier Hub",
        href: "/dashboard/carriers",
        icon: "link"
      },
      {
        label: "SLA & KPI",
        href: "/dashboard/sla-kpi",
        icon: "chart"
      },
      {
        label: "Label Generator",
        href: "/dashboard/label-generator",
        icon: "tag"
      },
    ],
  },
  {
    label: "CONFIGURATION",
    items: [
      {
        label: "Clients",
        href: "/dashboard/clients",
        icon: "users"
      },
      {
        label: "Warehouses",
        href: "/dashboard/warehouses",
        icon: "warehouse"
      },
      {
        label: "SLA Rules",
        href: "/dashboard/sla-rules",
        icon: "timer"
      },
      {
        label: "Bulk Import",
        href: "/dashboard/bulk-import",
        icon: "upload"
      },
    ],
  },
  {
    label: "RECONCILIATION",
    items: [
      {
        label: "Conciliation",
        href: "/dashboard/conciliation",
        icon: "file"
      },
      {
        label: "Discrepancies",
        href: "/dashboard/discrepancies",
        icon: "alert"
      },
      {
        label: "Claims",
        href: "/dashboard/claims",
        icon: "package"
      },
      {
        label: "Rate Intelligence",
        href: "/dashboard/rate-intelligence",
        icon: "chart"
      },
      {
        label: "Rate Calculator",
        href: "/dashboard/rate-calculator",
        icon: "receipt"
      },
    ],
  },
  {
    label: "FINANCE",
    items: [
      {
        label: "Credit Wallet",
        href: "/dashboard/credit-wallet",
        icon: "wallet"
      }
    ],
  },
  {
    label: "SYSTEM",
    items: [
      {
        label: "Notifications",
        href: "/dashboard/notifications",
        icon: "notification"
      },
      {
        label: "Settings",
        href: "/dashboard/settings",
        icon: "settings"
      },
    ],
  },
];

export default function Sidebar() {
  const pathname = usePathname();
  const [compressed, setCompressed] = useState(false);
  const [accountOpen, setAccountOpen] = useState(false);
  const accountRef = useRef(null);

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

  const isActive = (href) => {
    if (href == "/dashboard" && pathname == "/dashboard") return true;
    if (href != "/dashboard" && pathname.startsWith(href)) return true;
    return false;
  };

  return (
    <aside className={`hidden shrink-0 min-h-0 flex-col bg-[#110923] text-[#b9aecb] transition-all duration-300 md:flex ${compressed ? "w-20" : "w-64"}`}>
      <div className={`flex h-16 items-center gap-3 border-b border-white/10 px-5 ${compressed ? "justify-center px-2" : ""}`}>

        <button onClick={() => setCompressed(!compressed)} className="flex items-center justify-center rounded-lg transition-all duration-200 text-[#9b8cb8] hover:text-white hover:bg-[#1e1631] h-8 w-8" title={compressed ? "Expand" : "Compress"}>
          <IconAsset name="sidebar" className="h-4 w-4" />
        </button>

        {!compressed && (
          <>
            <IconAsset name="bot" className="h-8 w-8 rounded-lg" />
            <div className="flex-1">
              <div className="text-sm font-semibold leading-4 text-white">SynC AI</div>
              <div className="text-[10px] leading-4 text-[#837596]">Courier Management</div>
            </div>
          </>
        )}
      </div>

      {
        !compressed && (
          <div className="px-3 py-3">
            <div className="flex h-9 items-center gap-2 rounded-lg bg-white/5.5 px-3 text-xs text-[#736481]">
              <IconAsset name="search" className="h-4 w-4" />
              Search navigation...
            </div>
          </div>
        )
      }

      <nav className={`flex-1 min-h-0 space-y-3 overflow-y-auto px-2 sidebar-scroll ${compressed ? "pt-4" : ""}`}>
        {
          navGroups.map((group) => (
            <div key={group.label}>
              {!compressed && (
                <div className="mb-2 flex items-center justify-between px-3 text-[10px] font-bold tracking-[0.16em] text-[#7d708e]">
                  <span>{group.label}</span>
                  <IconAsset name="chevron" className="h-3 w-3" />
                </div>
              )}
              <div className={compressed ? "space-y-2" : "space-y-1"}>
                {
                  group.items.map((item) => {
                    const active = isActive(item.href);
                    return (
                      <Link key={item.label} href={item.href || "#"} title={compressed ? item.label : ""} className={`flex items-center gap-3 rounded-lg transition-all duration-200 border-l-3 group relative ${compressed ? "h-9 w-9 justify-center px-0 py-1.5 mx-auto" : "h-8.5 px-3 py-2 text-sm"} ${active ? `border-l-[#7b00f5] bg-[#2b1d51] text-white` : `border-l-transparent text-[#aea2c0] hover:bg-[#1e1631] hover:text-[#c9bfd9]`}`}>
                        <IconAsset name={item.icon} className={compressed ? "h-5 w-5" : "h-4 w-4"} />
                        {
                          compressed ? (
                            <div className="absolute left-full ml-2 hidden group-hover:block bg-[#1e1631] text-white px-3 py-2 rounded-lg text-xs whitespace-nowrap z-100 border border-[#2b1d51] top-1/2 -translate-y-1/2">
                              {item.label}
                            </div>
                          ) : (
                            <span>
                              {item.label}
                            </span>
                          )
                        }
                      </Link>
                    );
                  })
                }
              </div>
            </div>
          ))
        }
      </nav>

      <div className={`space-y-4 p-3 ${compressed ? "items-center flex flex-col" : ""}`}>
        <div className="flex items-center justify-between rounded-lg border border-purple-500/30 bg-[#310958] px-3 py-2 text-xs text-purple-100">
          <div className="flex items-center gap-2">
            <IconAsset name="wallet" className="h-3.5 w-3.5" />
            {!compressed && <span>Credits</span>}
          </div>
          {!compressed && <span className="font-semibold text-white">$0.00</span>}
        </div>
        <div ref={accountRef} className="relative w-full">
          <button onClick={() => setAccountOpen((open) => !open)} className={`flex items-center gap-3 rounded-xl border border-white/10 bg-[#12061f] px-3 py-2 text-left transition-all duration-200 ${compressed ? "justify-center px-0 py-0" : "w-full"}`} title="Account menu">
            <div className="flex h-8 w-9 items-center justify-center rounded-full bg-linear-to-br from-purple-500 to-fuchsia-600 text-xs font-bold text-white">
              S
            </div>
            {!compressed && (
              <div className="min-w-0">
                <div className="truncate text-sm font-semibold text-white">Soumallya Dey</div>
                <div className="truncate text-xs text-[#827391]">soumallya.dey@technoexpnent.co.in</div>
              </div>
            )}
          </button>

          {accountOpen && (
            <div className={`absolute z-50 w-44 rounded-3xl border border-[#2b1d51] bg-[#110923] p-2 shadow-[0_24px_60px_rgba(0,0,0,0.16)] ${compressed ? "left-full top-1/2 -translate-y-1/2 ml-2" : "left-0 bottom-full mb-2"}`}>
              <button className="flex w-full items-center gap-3 rounded-2xl px-3 py-2 text-sm text-white transition hover:bg-white/5">
                <IconAsset name="settings" className="h-4 w-4" />
                Settings
              </button>
              <button className="flex w-full items-center gap-3 rounded-2xl px-3 py-2 text-sm text-red-400 transition hover:bg-white/5">
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
