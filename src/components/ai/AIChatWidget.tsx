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

  if (!user || !accountId) return null

  return (
    <>
      {!open && (
        <button
          onClick={() => setOpen(true)}
          className="fixed top-6 right-6 z-50 flex items-center justify-center rounded-lg gap-2 bg-primary text-primary-foreground p-3 shadow-lg hover:bg-primary/90 transition"
        >
          <Bot className="w-5 h-5" /> Sync AI Assistant
        </button>
      )}
  
      {open && (
        <div className="fixed right-0 top-0 h-full w-[400px] bg-white border-l z-50 shadow-xl flex flex-col">
          {/* Header fixo */}
          <div className="flex items-center justify-between p-4 border-b">
            <h2 className="text-lg font-semibold">SynC AI Expert</h2>
            <button
              onClick={() => setOpen(false)}
              className="text-gray-500 hover:text-gray-800 transition"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
  
          {/* Chat ocupa todo o restante da tela com flex-1 */}
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