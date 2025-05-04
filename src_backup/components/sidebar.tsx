'use client'

import {
  LayoutDashboard,
  Users,
  Settings,
  LogOut,
  Building2,
  Plug,
  ChevronDown,
  BoxIcon,
  FormInputIcon,
  BotIcon,
  User2Icon,
  Cog
} 
from 'lucide-react'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { useSupabaseClient, useUser } from '@supabase/auth-helpers-react'
import Image from 'next/image'
import { useState, useEffect } from 'react'

export default function Sidebar() {
  const pathname = usePathname()
  const router = useRouter()
  const supabase = useSupabaseClient()
  const user = useUser()

  const [settingsOpen, setSettingsOpen] = useState(false)

  const navItems = [
    { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { href: '/inventory', label: 'Inventory', icon: BoxIcon },
    { href: '/channels', label: 'Channels', icon: Building2 },
    { href: '/users', label: 'Staff', icon: User2Icon },
    { href: '/bot-training', label: 'Bot training', icon: BotIcon },
    { href: '/ai-settings', label: 'AI Settings', icon: Cog },
    { href: '/Customers', label: 'Customers', icon: Users }
  ]

  const settingsItems = [
    { href: '/settings/company', label: 'Company', icon: FormInputIcon },
    { href: '/settings/integrations', label: 'Integrations', icon: Plug }
  ]

  // Abre automaticamente se estiver em uma rota de settings
  useEffect(() => {
    if (pathname.startsWith('/settings')) {
      setSettingsOpen(true)
    }
  }, [pathname])

  async function handleLogout() {
    await supabase.auth.signOut()
    router.push('/login')
  }

  return (
    <div className="flex flex-col h-full bg-[#3f2d90] text-white shadow-md">
      {/* LOGO */}
      <div className="h-22 flex items-center justify-center border-b border-[#352682] px-8">
        <div className="flex items-center gap-2">
          <Image src="/sync-ai-plataform-logo.svg" alt="Logo" width={215} height={82} />
        </div>
      </div>

      {/* NAVIGATION */}
      <nav className="flex-1 overflow-y-auto px-4 py-6 space-y-2 ">
        {navItems.map(({ href, label, icon: Icon }) => {
          const isActive = pathname === href
          return (
            <Link
              key={href}
              href={href}
              className={`flex items-center gap-3 px-3 py-2 rounded-lg text-white font-medium transition-all
                ${isActive
                  ? 'bg-[#352682] text-black font-semibold'
                  : 'hover:bg-[#352682]'
                }`}
            >
              <Icon size={18} />
              <span>{label}</span>
            </Link>
          )
        })}

        {/* SETTINGS DROPDOWN */}
        <div>
          <button
            onClick={() => setSettingsOpen((prev) => !prev)}
            className="w-full flex items-center justify-between gap-2 px-3 py-2 tracking-wider hover:bg-[#352682] transition"
          >
            <span className="flex items-center gap-3">
              <Settings size={18} />
              <span>Settings</span>
            </span>
            <ChevronDown
              size={16}
              className={`transition-transform duration-200 ${settingsOpen ? 'rotate-180' : ''}`}
            />
          </button>

          <div
            className={`pl-8 mt-1 space-y-1 overflow-hidden transition-all duration-200 ease-in-out
              ${settingsOpen ? 'max-h-40' : 'max-h-0'}`
            }
          >
            {settingsItems.map(({ href, label, icon: Icon }) => {
              const isActive = pathname === href
              return (
                <Link
                  key={href}
                  href={href}
                  className={`flex items-center gap-3 px-3 py-2 rounded-lg text-white font-medium transition-all
                    ${isActive
                      ? 'bg-[#352682] text-black font-semibold'
                      : 'hover:bg-[#352682]'
                    }`}
                >
                  <Icon size={16} />
                  <span>{label}</span>
                </Link>
              )
            })}
          </div>
        </div>
      </nav>

      {/* FOOTER / USER + LOGOUT */}
      <div className="border-t border-[#352682] p-4 flex items-center justify-between text-sm">
        <div className="flex items-center gap-3">
          <div className="h-8 w-8 rounded-full bg-gray-200 flex items-center justify-center text-xs font-bold text-gray-600 uppercase">
            {user?.email?.[0]}
          </div>
          <div className="flex flex-col leading-tight">
            <span className="text-white font-medium">{user?.email}</span>
            <span className="text-white text-xs">Admin</span>
          </div>
        </div>
        <button
          onClick={handleLogout}
          title="Sign out"
          className="text-red-500 hover:text-red-700 transition"
        >
          <LogOut size={18} />
        </button>
      </div>
    </div>
  )
}