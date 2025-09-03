'use client'

import { useState } from 'react'
import { PropsWithChildren } from 'react'
import Sidebar from '@/components/sidebar'
import { Menu, Bot } from 'lucide-react'
import { usePathname } from 'next/navigation'
import Image from 'next/image'
import HeaderTopBar from '@/components/HeaderTopBar'
import AIChatWidget from '@/components/ai/AIChatWidget'

interface ProtectedLayoutClientProps extends PropsWithChildren {
  user: {
    name: string
    email: string
    role: string
    avatarLetter?: string
    avatarUrl?: string | null
  }
  hideLayout?: boolean
}

export default function ProtectedLayoutClient({
  children,
  user,
  hideLayout = false
}: ProtectedLayoutClientProps) {
  const [showSidebar, setShowSidebar] = useState(false)
  const pathname = usePathname()

  const pageTitle =
    pathname
      .split('/')
      .filter(Boolean)
      .map((part) => part.charAt(0).toUpperCase() + part.slice(1).replace(/-/g, ' '))
      .join(' › ') || 'Dashboard'

  // ⛔️ Quando hideLayout = true, retorna layout mínimo
  if (hideLayout) {
    return (
      <main className="min-h-screen bg-white overflow-auto">
        {children}
      </main>
    )
  }

  return (
    <div className="flex h-screen overflow-visible">
      {/* Sidebar Desktop */}
      <aside className="hidden lg:block w-64">
        <Sidebar />
      </aside>

      {/* Sidebar Mobile */}
      {showSidebar && (
        <div className="fixed inset-0 z-40 flex lg:hidden">
          <div className="w-64 bg-[#3f2d90] shadow-md">
            <Sidebar onLinkClick={() => setShowSidebar(false)} />
          </div>
          <div
            className="flex-1 bg-black/30"
            onClick={() => setShowSidebar(false)}
          />
        </div>
      )}

      {/* Conteúdo principal */}
      <div className="flex-1 flex flex-col overflow-y-auto bg-gray-50">
        {/* Topbar Mobile */}
        <div className="lg:hidden fixed top-0 left-0 right-0 z-40 h-16 bg-[#3f2d90] flex items-center justify-between px-4 shadow">
          <button
            onClick={() => setShowSidebar(true)}
            className="p-2 rounded-md hover:bg-white/20 transition"
          >
            <Menu size={24} className="text-white" />
          </button>

          <Image
            src="/sync-ai-platform-logo.svg"
            alt="Logo"
            width={160}
            height={50}
            priority
          />

          <button
            onClick={() => window.dispatchEvent(new Event('open-ai-widget'))}
            className="p-2 rounded-md hover:bg-white/20 transition"
            aria-label="Open Chat"
          >
            <Bot size={26} className="text-white" />
          </button>
        </div>

        {/* Topbar Desktop */}
        <div className="hidden lg:block">
          <HeaderTopBar title={pageTitle} user={user} />
        </div>

        <main className="flex-1 pt-[64px] lg:pt-0 relative z-10 overflow-visible">
          {children}
        </main>

        <AIChatWidget />
      </div>
    </div>
  )
}