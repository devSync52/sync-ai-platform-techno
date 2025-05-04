'use client'

import { useState } from 'react'
import { PropsWithChildren } from 'react'
import Sidebar from '@/components/sidebar'
import { Menu } from 'lucide-react'
import { SessionContextProvider } from '@supabase/auth-helpers-react'
import { createPagesBrowserClient } from '@supabase/auth-helpers-nextjs'
import AIChatWidget from '@/components/ai/AIChatWidget'
import { Toaster } from '@/components/ui/toaster'

export default function ProtectedLayout({ children }: PropsWithChildren) {
  const [supabaseClient] = useState(() => createPagesBrowserClient())
  const [showSidebar, setShowSidebar] = useState(false)

  return (
    <SessionContextProvider supabaseClient={supabaseClient}>
      <div className="flex h-screen overflow-hidden">
        {/* Desktop Sidebar */}
        <aside className="hidden lg:block w-64 bg-white shadow-md border-r border-gray-200">
          <Sidebar />
        </aside>

        {/* Mobile Sidebar */}
        {showSidebar && (
          <div className="fixed inset-0 z-40 flex lg:hidden">
            <div className="w-64 bg-white shadow-md border-r border-gray-200">
              <Sidebar />
            </div>
            <div
              className="flex-1 bg-black bg-opacity-30"
              onClick={() => setShowSidebar(false)}
            />
          </div>
        )}

        {/* Main Content */}
        <div className="flex-1 flex flex-col overflow-y-auto bg-gray-50">
          {/* Top bar (mobile only) */}
          <div className="lg:hidden px-4 py-3 flex items-center justify-between shadow-sm bg-white">
            <button onClick={() => setShowSidebar(true)}>
              <Menu size={24} />
            </button>
            <span className="text-sm font-semibold text-gray-700">SynC AI</span>
          </div>

          <main className="flex-1 p-4 sm:p-6">{children}</main>
        </div>
      </div>

      {/* Toasts + Chat */}
      <Toaster />
      <AIChatWidget />
    </SessionContextProvider>
  )
}