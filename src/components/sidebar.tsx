"use client";

import { usePathname, useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { useSupabase } from "@/components/supabase-provider";
import { useSession } from "@/components/supabase-provider";
import { v4 as uuidv4 } from 'uuid'
import { LayoutDashboard, Users, FileText, Settings, LogOut, Building2, Plug, ChevronDown, BoxIcon, FormInputIcon, BotIcon, User2Icon, Cog, UserCircle2, ShoppingBag, TicketPlus, Wallet, BarChart3, } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { useSyncAgent } from "@/hooks/useSyncAgent";

type SidebarProps = {
  onLinkClick?: () => void;
};

export default function Sidebar({ onLinkClick }: SidebarProps) {
  const pathname = usePathname();
  const router = useRouter();
  const supabase = useSupabase();
  const session = useSession();

  const user = session?.user

  const [settingsOpen, setSettingsOpen] = useState(false);
  const [ordersOpen, setOrdersOpen] = useState(false);
  const [billingOpen, setBillingOpen] = useState(false);
  const [userRole, setUserRole] = useState<string | null>(null);
  const [accountLogo, setAccountLogo] = useState<string | null>(null);

  const [accountId, setAccountId] = useState<string | null>(null)
  const [userType, setUserType] = useState<'owner' | 'client' | 'end_client' | null>(null)
  const [sessionId, setSessionId] = useState<string | null>(null)
  const initialAskHandledRef = useRef(false)
  const currentAudioRef = useRef<HTMLAudioElement | null>(null)
  const currentTtsAbortRef = useRef<AbortController | null>(null)

  useEffect(() => {
    const fetchUserRole = async () => {
      const { data, error } = await supabase.from("users").select("role, account_id").eq("id", session?.user?.id ?? "").single();

      if (error) {
        console.error("Error fetching user role:", error.message);
        return
      }

      setUserRole(data?.role);

      // Fetch account logo (white-label) based on the user's account_id
      if (data?.account_id) {
        setAccountId(data?.account_id ?? null)

        if (['superadmin', 'admin', 'staff-admin', 'staff-user'].includes(data?.role)) setUserType('owner')
        if (data?.role === 'client') setUserType('client')
        if (data?.role === 'customer') setUserType('end_client')

        const { data: accountData, error: accountError } = await supabase.from("accounts").select("logo, logo_main").eq("id", data.account_id).single();

        if (accountError) {
          console.error("Error fetching account logo:", accountError.message);
        } else {
          const resolvedLogo =
            (accountData as any)?.logo_main ?? (accountData as any)?.logo ?? null;
          setAccountLogo(resolvedLogo);
        }
      } else {
        setAccountLogo(null);
      }
    };

    if (session?.user) {
      fetchUserRole();
    }
  }, [session?.user, supabase]);

  useEffect(() => {
    if (pathname.startsWith("/settings")) setSettingsOpen(true);
    else setSettingsOpen(false);

    if (pathname.startsWith("/orders")) setOrdersOpen(true);
    else setOrdersOpen(false);

    if (pathname.startsWith("/billing")) setBillingOpen(true);
    else setBillingOpen(false);

  }, [pathname]);

  async function handleLogout() {
    await supabase.auth.signOut();
    router.push("/login");
  }

  const { askQuestion } = useSyncAgent(process.env.NEXT_PUBLIC_API_URL || '')

  const navItems = [
    { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard, page: 'dashboard' },
    { href: "/users", label: "Users", icon: Users, page: 'users' },
    { href: "/plans", label: "Plans", icon: FileText, page: 'plans' },
    { href: "/features", label: "Features", icon: BarChart3, page: 'features' },
    { href: "/billing/invoices", label: "Invoices", icon: Wallet, page: 'billing/invoices' },
    {
      label: "Orders",
      icon: ShoppingBag,
      items: [
        { href: "/orders", label: "Manage Orders", page: 'orders' },
        { href: "/orders/create-order", label: "Create Orders" },
        { href: "/orders/quotes", label: "Quotations" },
      ],
    },
    {
      label: "Billing",
      icon: Wallet,
      items: [
        { href: "/billing/clients", label: "Clients", page: 'clients' },
        { href: "/billing/invoices", label: "Invoices" },
        { href: "/billing/warehouses", label: "Warehouses" },
        { href: "/billing/products", label: "Products" },
        { href: "/billing/pricing", label: "Pricing" },
      ],
    },
    { href: "/channels", label: "Customers", icon: Building2 },
    { href: "/bot-training", label: "Bot training", icon: BotIcon },
    { href: "/ai-settings", label: "AI Settings", icon: Cog },
    { href: "/products", label: "Inventory", icon: BoxIcon, page: 'inventory' },
    { href: "/staff", label: "Staff", icon: User2Icon },
    { href: "/support", label: "Support", icon: TicketPlus },
  ];

  const resolvePageFromPath = (targetPath: string) => {
    const normalizedPath = targetPath.split('?')[0].replace(/\/$/, '') || '/'

    for (const item of navItems) {
      if (item.items) {
        const matchedChild = item.items.find((child) => {
          const childPath = (child.href || '').replace(/\/$/, '') || '/'
          return childPath === normalizedPath
        })
        if (matchedChild) {
          return matchedChild.page || matchedChild.href || ''
        }
        continue
      }

      const itemPath = (item.href || '').replace(/\/$/, '') || '/'
      if (itemPath === normalizedPath) {
        return item.page || item.href || ''
      }
    }

    return ''
  }

  const stopSpeaking = () => {
    if (currentAudioRef.current) {
      currentAudioRef.current.pause()
      currentAudioRef.current = null
    }
  }

  const handleAskAgent = async (targetPath: string = '', initial = false, newSessionId?: string) => {
    if (!accountId) {
      console.error("Missing required parameters to ask the AI agent.")
      return
    }
    const activeSessionId = newSessionId || sessionId
    if (!activeSessionId) return
    const page = resolvePageFromPath(targetPath || pathname) || targetPath || pathname || ''

    let aiMessage = ''
    const speak = async (message: string) => {
      if (!message.trim()) return

      try {
        const res = await fetch('/api/tts', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            text: message,
            locale: 'en-US',
            mode: 'conversational',
          }),
        })

        if (!res.ok) {
          throw new Error('Failed to fetch Murf audio.')
        }

        const blob = await res.blob()
        if (!blob.size) {
          throw new Error('Received empty Murf audio response.')
        }

        if (currentAudioRef.current) {
          currentAudioRef.current.pause()
          currentAudioRef.current = null
        }

        const url = URL.createObjectURL(blob)
        const audio = new Audio(url)
        audio.preload = 'auto'
        currentAudioRef.current = audio

        await new Promise<void>((resolve, reject) => {
          const cleanup = () => {
            audio.removeEventListener('ended', onEnded)
            audio.removeEventListener('error', onError)
            URL.revokeObjectURL(url)
            currentAudioRef.current = null
          }

          const onEnded = () => {
            cleanup()
            resolve()
          }

          const onError = () => {
            cleanup()
            reject(new Error('Murf audio playback failed.'))
          }

          audio.addEventListener('ended', onEnded)
          audio.addEventListener('error', onError)
          audio.play().catch((error) => {
            cleanup()
            reject(error)
          })
        })
      } catch (error) {
        console.warn('Murf speech playback failed:', error)
      }
    }

    const others = {
      page_context: {
        page, greeting: initial,
        timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
      }
    };

    await askQuestion('', { userId: user?.id || '', accountId, sessionId: activeSessionId, userType: userType || 'owner' }, (partial) => { aiMessage = partial }, others)
    if (aiMessage) window.dispatchEvent(new CustomEvent('sidebar-agent-message', { detail: { message: aiMessage, sessionId: activeSessionId } }))
    await speak(aiMessage)
  }

  const filteredNavItems = navItems.filter((item) => {
    // Customer users should only see Dashboard + Orders module
    if (userRole === "client") {
      return item.href === "/dashboard" || item.label === "Orders";
    }

    if (userRole === "superadmin") {
      return (item.href == "/dashboard" || item.href == "/users" || item.href == "/plans" || item.href == "/features" || item.href == "/billing/invoices");
    }

    // Keep the root "Invoices" entry exclusive to superadmin.
    if (item.href === "/billing/invoices") {
      return false;
    }

    const clientExclusions = ["/bot-training", "/ai-settings", "/channels"];
    const staffExclusions = [
      "/bot-training",
      "/ai-settings",
      "/staff",
      "/channels",
    ];

    if (item.href === "/users" || item.href === "/plans" || item.href === "/features") {
      return false;
    }

    if (userRole === "staff-client") {
      // staff-client can see only: Orders (Quotations), Inventory, Support
      if (item.label === "Orders") return true;
      if (item.href === "/products") return true;
      if (item.href === "/support") return true;
      return false;
    }

    if (userRole === "staff-user") {
      if (
        (item.href && staffExclusions.includes(item.href)) ||
        (item.label === "Orders" &&
          item.items &&
          item.items.some((subItem) =>
            staffExclusions.includes(subItem.href || ""),
          ))
      ) {
        if (item.label === "Orders") {
          return true;
        }
        return false;
      }
    }
    return true;
  });

  const baseSettingsItems = [
    { href: "/settings/company", label: "Company", icon: FormInputIcon },
    { href: "/settings/integrations", label: "Integrations", icon: Plug },
    { href: "/settings/profile", label: "My profile", icon: UserCircle2 },
  ];

  const filteredSettingsItems = baseSettingsItems.filter((item) => {
    if (userRole === "superadmin") {
      return false;
    }

    // Customer users should not see settings in sidebar
    if (userRole === "client") {
      return false;
    }

    // staff-client: only "My profile"
    if (userRole === "staff-client") {
      return item.href === "/settings/profile";
    }

    // Hide "Integrations" for client and staff-user
    if (
      (userRole === "client" || userRole === "staff-user") &&
      item.href === "/settings/integrations"
    ) {
      return false;
    }

    return true;
  });

  const handleChange = (targetPath: string = '') => {
    if (onLinkClick) onLinkClick();
    stopSpeaking()
    const newSessionId = uuidv4()
    setSessionId(newSessionId)
    window.dispatchEvent(new Event('open-ai-widget'))
    handleAskAgent(targetPath, false, newSessionId)
  }

  useEffect(() => {
    const handler = () => stopSpeaking()
    window.addEventListener('close-ai-widget', handler)
    window.addEventListener('open-ai-widget', handler)
    return () => {
      window.removeEventListener('close-ai-widget', handler)
      window.removeEventListener('open-ai-widget', handler)
    }
  }, [])

  useEffect(() => {
    if (!accountId || !userType || initialAskHandledRef.current) return
    const page = resolvePageFromPath(pathname)
    if (!page) return
    initialAskHandledRef.current = true
    const newSessionId = uuidv4()
    setSessionId(newSessionId)
    handleAskAgent(pathname, true, newSessionId)
  }, [accountId, userType])

  return (
    <div className="flex flex-col h-full bg-primary text-white shadow-md">
      {/* LOGO TOP */}
      <div className="h-20 flex items-center justify-center border-b border-[#0000001c] px-4">
        <Image
          src={accountLogo || "/sync-ai-platform-logo.svg"}
          alt="Logo" width={215} height={48} priority unoptimized
          style={{ width: "auto", height: "auto" }}
        />
      </div>

      {/* NAVIGATION */}
      <nav className="flex-1 overflow-y-auto px-4 py-6 space-y-2">
        {
          filteredNavItems.map((item) => {
            if (item.items) {
              const isGroupOpen = item.label == "Orders" ? ordersOpen : item.label == "Billing" ? billingOpen : false;
              return (
                <div key={item.label}>
                  <button className="w-full flex items-center justify-between gap-2 px-3 py-2 tracking-wider hover:bg-[#0000001c] transition text-white" onClick={() => {
                    if (item.label === "Orders") setOrdersOpen((prev) => !prev);
                    else if (item.label === "Billing")
                      setBillingOpen((prev) => !prev);
                  }}>
                    <span className="flex items-center gap-3">
                      <item.icon size={18} />
                      <span>{item.label}</span>
                    </span>
                    <ChevronDown size={16} className={`transition-transform duration-200 ${isGroupOpen ? "rotate-180" : ""}`} />
                  </button>
                  <div className={`pl-8 mt-1 space-y-1 overflow-hidden transition-all duration-200 ease-in-out ${isGroupOpen ? "max-h-72" : "max-h-0"}`}>
                    {
                      item.items.filter(({ label }) => {
                        if (userRole == "staff-client" && item.label == "Orders") {
                          return label == "Quotations";
                        }
                        return true;
                      }).map(({ href, label }) => {
                        const isActive = pathname == href;
                        return (
                          <Link key={href} href={href} onClick={() => handleChange(href)} className={`flex items-center gap-3 px-3 py-2 rounded-lg font-medium transition-all ${isActive ? "bg-white text-primary font-semibold" : "text-white hover:bg-[#0000001c]"}`}>
                            <span>{label}</span>
                          </Link>
                        );
                      })
                    }
                  </div>
                </div>
              );
            } else {
              return (
                <Link key={item.href} href={item.href!} onClick={() => handleChange(item.href!)} className={`flex items-center gap-3 px-3 py-2 rounded-lg font-medium transition-all ${pathname == item.href ? "bg-white text-primary font-semibold" : "text-white hover:bg-[#0000001c]"}`}>
                  <item.icon size={18} />
                  <span>{item.label}</span>
                </Link>
              );
            }
          })
        }

        {/* SETTINGS DROPDOWN */}
        {
          filteredSettingsItems.length > 0 && (
            <div>
              <button onClick={() => setSettingsOpen((prev) => !prev)} className="w-full flex items-center justify-between gap-2 px-3 py-2 tracking-wider hover:bg-[#0000001c] transition text-white">
                <span className="flex items-center gap-3">
                  <Settings size={18} />
                  <span>Settings</span>
                </span>
                <ChevronDown size={16} className={`transition-transform duration-200 ${settingsOpen ? "rotate-180" : ""}`} />
              </button>

              <div className={`pl-8 mt-1 space-y-1 overflow-hidden transition-all duration-200 ease-in-out ${settingsOpen ? "max-h-40" : "max-h-0"}`}>
                {
                  filteredSettingsItems.map(({ href, label, icon: Icon }) => (
                    <Link key={href} href={href} onClick={onLinkClick} className={`flex items-center gap-3 px-3 py-2 rounded-lg font-medium transition-all ${pathname == href ? "bg-white text-primary font-semibold" : "text-white hover:bg-[#0000001c]"}`}>
                      <Icon size={16} />
                      <span>{label}</span>
                    </Link>
                  ))
                }
              </div>
            </div>
          )
        }
      </nav>

      {/* FOOTER */}
      <div className="border-t border-[#0000001c] p-4 flex items-center justify-between text-sm">
        <div className="flex items-center gap-3">
          <div className="h-8 w-8 rounded-full bg-gray-200 flex items-center justify-center text-xs font-bold text-gray-600 uppercase">
            {session?.user.email?.[0]}
          </div>
          <div className="flex flex-col leading-tight">
            <span className="text-white font-medium">
              {session?.user.email}
            </span>
            <span className="text-white text-xs">{userRole ?? "—"}</span>
          </div>
        </div>
        <button onClick={handleLogout} title="Sign out" className="text-red-500 hover:text-red-700 transition">
          <LogOut size={18} />
        </button>
      </div>
    </div>
  );
}
