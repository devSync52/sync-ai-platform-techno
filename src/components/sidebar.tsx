'use client'

import { usePathname, useRouter } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'
import { useSupabase } from '@/components/supabase-provider'
import { useSession } from '@/components/supabase-provider'

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
  Cog,
  UserCircle2,
  ShoppingBag
} from 'lucide-react'

import { useEffect, useState } from 'react'

type SidebarProps = {
  onLinkClick?: () => void
}

export default function Sidebar({ onLinkClick }: SidebarProps) {
  const pathname = usePathname()
  const router = useRouter()
  const supabase = useSupabase()
  const session = useSession()

  const [settingsOpen, setSettingsOpen] = useState(false)
  const [userRole, setUserRole] = useState<string | null>(null)

  // Buscar role do usuário
  useEffect(() => {
    const fetchUserRole = async () => {
      const { data, error } = await supabase
        .from('users')
        .select('role')
        .eq('id', session?.user.id)
        .single()

      if (error) {
        console.error('Error fetching user role:', error.message)
      } else {
        setUserRole(data?.role)
      }
    }

    if (session?.user) {
      fetchUserRole()
    }
  }, [session?.user])

  useEffect(() => {
    if (pathname.startsWith('/settings')) setSettingsOpen(true)
    else setSettingsOpen(false)
  }, [pathname])

  async function handleLogout() {
    await supabase.auth.signOut()
    router.push('/login')
  }

  const navItems = [
    { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { href: '/orders', label: 'Orders', icon: ShoppingBag },
    { href: '/channels', label: 'Customers', icon: Building2 },
    { href: '/bot-training', label: 'Bot training', icon: BotIcon },
    { href: '/ai-settings', label: 'AI Settings', icon: Cog },
    { href: '/products', label: 'Inventory', icon: BoxIcon },
    { href: '/staff', label: 'Staff', icon: User2Icon }
  ]

  // Ocultar itens se o user for client ou staff-user
  const filteredNavItems = navItems.filter((item) => {
    if (
      (userRole === 'client' || userRole === 'staff-user') &&
      (item.href === '/bot-training' || item.href === '/ai-settings' || item.href === '/staff' || item.href === '/channels')
    ) {
      return false
    }
    return true
  })

  const baseSettingsItems = [
    { href: '/settings/company', label: 'Company', icon: FormInputIcon },
    { href: '/settings/integrations', label: 'Integrations', icon: Plug },
    { href: '/settings/profile', label: 'My profile', icon: UserCircle2 }
  ]
  
  const filteredSettingsItems = baseSettingsItems.filter((item) => {
    // Esconde "Integrations" se for client ou staff-user
    if ((userRole === 'client' || userRole === 'staff-user') && item.href === '/settings/integrations') {
      return false
    }
    return true
  })

  return (
    <div className="flex flex-col h-full bg-[#3f2d90] text-white shadow-md">
      {/* LOGO TOP */}
      <div className="h-20 flex items-center justify-center border-b border-[#352682] px-4">
        <Image
          src="/sync-ai-plataform-logo.svg"
          alt="Logo"
          width={180}
          height={48}
          priority
        />
      </div>

      {/* NAVIGATION */}
      <nav className="flex-1 overflow-y-auto px-4 py-6 space-y-2">
        {filteredNavItems.map(({ href, label, icon: Icon }) => {
          const isActive = pathname === href
          return (
            <Link
              key={href}
              href={href}
              onClick={onLinkClick}
              className={`flex items-center gap-3 px-3 py-2 rounded-lg font-medium transition-all ${
                isActive
                  ? 'bg-white text-[#3f2d90] font-semibold'
                  : 'text-white hover:bg-[#352682]'
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
            className="w-full flex items-center justify-between gap-2 px-3 py-2 tracking-wider hover:bg-[#352682] transition text-white"
          >
            <span className="flex items-center gap-3">
              <Settings size={18} />
              <span>Settings</span>
            </span>
            <ChevronDown
              size={16}
              className={`transition-transform duration-200 ${
                settingsOpen ? 'rotate-180' : ''
              }`}
            />
          </button>

          <div
            className={`pl-8 mt-1 space-y-1 overflow-hidden transition-all duration-200 ease-in-out ${
              settingsOpen ? 'max-h-40' : 'max-h-0'
            }`}
          >
            {filteredSettingsItems.map(({ href, label, icon: Icon }) => {
              const isActive = pathname === href
              return (
                <Link
                  key={href}
                  href={href}
                  onClick={onLinkClick}
                  className={`flex items-center gap-3 px-3 py-2 rounded-lg font-medium transition-all ${
                    isActive
                      ? 'bg-white text-[#3f2d90] font-semibold'
                      : 'text-white hover:bg-[#352682]'
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

      {/* FOOTER */}
      <div className="border-t border-[#352682] p-4 flex items-center justify-between text-sm">
        <div className="flex items-center gap-3">
          <div className="h-8 w-8 rounded-full bg-gray-200 flex items-center justify-center text-xs font-bold text-gray-600 uppercase">
            {session?.user.email?.[0]}
          </div>
          <div className="flex flex-col leading-tight">
            <span className="text-white font-medium">{session?.user.email}</span>
            <span className="text-white text-xs">{userRole ?? '—'}</span>
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