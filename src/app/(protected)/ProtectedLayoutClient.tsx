'use client'

import { useState } from 'react'
import { PropsWithChildren } from 'react'
import Sidebar from '@/components/sidebar'
import { Menu, Bot } from 'lucide-react'
import { usePathname } from 'next/navigation'
import Image from 'next/image'
import HeaderTopBar from '@/components/HeaderTopBar'
import { useCurrentUserData } from '@/hooks/useCurrentUserData'

export default function ProtectedLayoutClient({ children }: PropsWithChildren) {
  const [showSidebar, setShowSidebar] = useState(false)
  const pathname = usePathname()
  const user = useCurrentUserData()

  const hideSidebar = pathname === '/onboarding'

  const pageTitle =
    pathname
      .split('/')
      .filter(Boolean)
      .map((part) => part.charAt(0).toUpperCase() + part.slice(1).replace(/-/g, ' '))
      .join(' › ') || 'Dashboard'

  return (
    <div className="flex h-screen overflow-visible">
      {!hideSidebar && (
        <aside className="hidden lg:block w-64">
          <Sidebar />
        </aside>
      )}

      {!hideSidebar && showSidebar && (
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

      <div className="flex-1 flex flex-col overflow-y-auto bg-gray-50">
        {!hideSidebar && (
          <div className="lg:hidden fixed top-0 left-0 right-0 z-40 h-16 bg-[#3f2d90] flex items-center justify-between px-4 shadow">
            <button
              onClick={() => setShowSidebar(true)}
              className="p-2 rounded-md hover:bg-white/20 transition"
            >
              <Menu size={24} className="text-white" />
            </button>

            <Image
              src="/sync-ai-plataform-logo.svg"
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
        )}

        {!hideSidebar && (
          <div className="hidden lg:block">
            <HeaderTopBar
              title={pageTitle}
              user={{
                name: user?.name ?? '—',
                email: user?.email ?? '',
                role: user?.role ?? 'client',
              }}
            />
          </div>
        )}

        <main
          className={`flex-1 ${
            !hideSidebar ? 'pt-[64px] lg:pt-0' : ''
          } relative z-10 overflow-visible`}
        >
          {children}
        </main>
      </div>
    </div>
  )
}