'use client'

import { useEffect, useState } from 'react'
import { useSupabase } from '@/components/supabase-provider'
import { useSession } from '@/components/supabase-provider'
import { v4 as uuidv4 } from 'uuid'
import { History as HistoryIcon, Plus } from 'lucide-react'
import AIExpertChat from '@/components/ai/AIExpertChat'
import ChatHistoryList from '@/components/ai/ChatHistoryList'

export default function AIChatWidget() {
  const [open, setOpen] = useState(false)
  const [view, setView] = useState<'chat' | 'history'>('chat')
  const [accountId, setAccountId] = useState<string | null>(null)
  const [userType, setUserType] = useState<'owner' | 'client' | 'end_client' | null>(null)
  const [sessionId, setSessionId] = useState<string | null>(null)
  const [hasMessages, setHasMessages] = useState(false)
  const supabase = useSupabase()
  const session = useSession()
  const user = session?.user  

  // Carrega os dados do usuário (conta e role)
  useEffect(() => {
    const fetchUserData = async () => {
      if (!user) return
      const { data, error } = await supabase
        .from('users')
        .select('account_id, role')
        .eq('id', user.id)
        .single()
      if (error) {
        console.error('[AIChatWidget] ❌ Error fetching user data:', error.message)
        return
      }
      setAccountId(data?.account_id ?? null)
      const role = data?.role
      if (['admin', 'staff-admin', 'staff-user'].includes(role)) setUserType('owner')
      else if (role === 'client') setUserType('client')
      else if (role === 'customer') setUserType('end_client')
      else console.warn('[AIChatWidget] ⚠️ Unknown role:', role)
    }
    fetchUserData()
  }, [user, supabase])

  // Exibe o chat quando disparar o evento 'open-ai-widget'
  useEffect(() => {
    const handleOpen = () => setOpen(true)
    window.addEventListener('open-ai-widget', handleOpen)
    return () => window.removeEventListener('open-ai-widget', handleOpen)
  }, [])

  // Garante uma sessionId ao abrir o chat
  useEffect(() => {
    if (open && !sessionId) setSessionId(uuidv4())
  }, [open, sessionId])

  // Atualiza hasMessages sempre que trocar de sessão
  useEffect(() => {
    if (sessionId) {
      const api = (process.env.NEXT_PUBLIC_API_URL || '').replace(/\/$/, '')
      fetch(`${api}/chat/history?session_id=${sessionId}`)
        .then(res => res.json())
        .then(data => setHasMessages(Array.isArray(data) && data.length > 0))
        .catch(() => setHasMessages(false))
    } else {
      setHasMessages(false)
    }
  }, [sessionId])

  if (!user || !accountId || !userType) return null

  // Funções para histórico
  const openHistory = () => setView('history')
  const handleSelectSession = (sid: string) => {
    setSessionId(sid)
    setView('chat')
  }
  const handleNewSession = () => {
    setSessionId(uuidv4())
    setView('chat')
  }

  // Overlay fecha ao clicar fora (só área escura)
  return (
    <>
      {open && (
        <div
          className="fixed inset-0 z-50 flex"
          style={{ background: 'rgba(0,0,0,0.08)' }}
          onClick={() => setOpen(false)}
        >
          <div
            style={{ boxShadow: '0 -8px 24px rgba(0,0,0,0.18)' }}
            className={`
              relative ml-auto top-[98px] h-[calc(100%-98px)] w-full
              sm:top-0 sm:right-0 sm:h-full sm:w-[400px]
              bg-white sm:border-l rounded-t-2xl sm:rounded-none
              px-2 sm:px-0 transition-all duration-300 flex flex-col
            `}
            onClick={e => e.stopPropagation()} // Não fecha ao clicar dentro do chat
          >
            {/* Topbar */}
            <div className="flex items-center justify-between p-4 border-b bg-white sticky top-0 z-10">
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-semibold ml-2">SynC AI Expert</h2>
                
                
              </div>
              <div className="flex items-center gap-1">
              <button
                  onClick={openHistory}
                  className="text-gray-500 hover:text-primary transition p-1"
                  title="Chat history"
                >
                  <HistoryIcon className="w-5 h-5" />
                </button>
                
                  <button
                    onClick={handleNewSession}
                    className="flex items-center gap-1 px-2 py-1 text-sm h-7 bg-primary text-white rounded hover:bg-primary/90"
                    title="Start new conversation"
                  >
                    <Plus className="w-4 h-4" />
                    <span className="hidden sm:inline">New Chat</span>
                  </button>
                
                <button
                  onClick={() => setOpen(false)}
                  className="text-gray-500 hover:text-gray-800 text-xl font-extrabold ml-2"
                  title="Fechar chat"
                >
                  ×
                </button>
              </div>
            </div>
            <div className="flex-1 overflow-hidden flex flex-col">
              {view === 'history' ? (
                <ChatHistoryList
                  userId={user.id}
                  currentSessionId={sessionId ?? ''}
                  onSelectSession={handleSelectSession}
                  onNewSession={handleNewSession}
                  onClose={() => setView('chat')}
                />
              ) : (
                <AIExpertChat
              apiUrl={process.env.NEXT_PUBLIC_API_URL || ''}
  user_id={user.id}
  account_id={accountId}
  user_type={userType}
  session_id={sessionId || ''}
/>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  )
}
