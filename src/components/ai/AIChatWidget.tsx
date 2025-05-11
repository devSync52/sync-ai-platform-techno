'use client'

import { useEffect, useState } from 'react'
import { Bot, X } from 'lucide-react'
import { useUser, useSupabaseClient } from '@supabase/auth-helpers-react'
import AIExpertChat from '@/components/ai/AIExpertChat'

export default function AIChatWidget() {
  const [open, setOpen] = useState(false)
  const [accountId, setAccountId] = useState<string | null>(null)

  const supabase = useSupabaseClient()
  const user = useUser()

  useEffect(() => {
    const fetchAccountId = async () => {
      if (!user) return
      const { data } = await supabase
        .from('users')
        .select('account_id')
        .eq('id', user.id)
        .single()

      setAccountId(data?.account_id ?? null)
    }

    fetchAccountId()
  }, [user, supabase])

  useEffect(() => {
    const handleOpen = () => setOpen(true)
    window.addEventListener('open-ai-widget', handleOpen)
    return () => window.removeEventListener('open-ai-widget', handleOpen)
  }, [])

  if (!user || !accountId) return null

  return (
    <>
      {!open && (
        <button
          onClick={() => setOpen(true)}
          className="hidden lg:flex fixed top-6 right-6 z-50 items-center justify-center rounded-lg gap-2 bg-primary text-primary-foreground p-3 shadow-lg hover:bg-primary/90 transition"
        >
          <Bot className="w-5 h-5" /> Sync AI Assistant
        </button>
      )}
  
  {open && (
  <div
  style={{
    boxShadow: '0 -8px 24px rgba(0, 0, 0, 0.2)',
  }}
  className={`
    fixed z-50 top-[98px] h-[calc(100%-98px)] w-full 
    sm:top-0 sm:right-0 sm:h-full sm:w-[400px]
    bg-white sm:border-l rounded-t-2xl sm:rounded-none
    px-2 sm:px-0 transition-all duration-300
    flex flex-col
  `}
  >
    {/* Header fixo */}
    <div className="flex items-center justify-between p-4 border-b">
      <h2 className="text-lg font-semibold">SynC AI Expert</h2>
      <button
        onClick={() => setOpen(false)}
        className="text-gray-500 hover:text-gray-800 transition text-xl font-extrabold"
      >
        ×
      </button>
    </div>

    {/* Chat ocupa todo o restante da tela */}
    <div className="flex-1 overflow-hidden flex flex-col">
      <AIExpertChat
        user_id={user.id}
        account_id={accountId}
        model="gpt-3.5-turbo"
      />
    </div>
  </div>
)}
    </>
  )
}