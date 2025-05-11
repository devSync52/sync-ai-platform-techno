'use client'

import { useState } from 'react'
import { PropsWithChildren } from 'react'
import Sidebar from '@/components/sidebar'
import { Menu, Bot } from 'lucide-react'
import AIChatWidget from '@/components/ai/AIChatWidget'
import { Toaster } from '@/components/ui/toaster'
import Image from 'next/image'
import { usePathname } from 'next/navigation'

export default function ProtectedLayout({ children }: PropsWithChildren) {
  const [showSidebar, setShowSidebar] = useState(false)
  const pathname = usePathname()
  const hideSidebar = pathname === '/onboarding'

  return (
    <div className="flex h-screen overflow-visible">
      {/* Sidebar Desktop */}
      {!hideSidebar && (
        <aside className="hidden lg:block w-64">
          <Sidebar />
        </aside>
      )}

      {/* Sidebar Mobile */}
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

      {/* Conteúdo */}
      <div className="flex-1 flex flex-col overflow-y-auto bg-gray-50">
        {/* Topo Mobile */}
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

            {/* Ícone do Chat - Mobile */}
            <button
              onClick={() => {
                window.dispatchEvent(new Event('open-ai-widget'))
              }}
              className="p-2 rounded-md hover:bg-white/20 transition"
              aria-label="Abrir Chat"
            >
              <Bot size={22} className="text-white" />
            </button>
          </div>
        )}

        <main className={`flex-1 ${!hideSidebar ? 'pt-[64px] lg:pt-0' : ''} p-4 sm:p-6 relative z-10 overflow-visible`}>
          {children}
        </main>
      </div>

      {/* Toasts e Widget */}
      <Toaster />
      <AIChatWidget />
    </div>
  )
}