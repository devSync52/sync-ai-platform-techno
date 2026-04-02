'use client'

import { useEffect, useState } from 'react'
import { useSupabase } from '@/components/supabase-provider'
import { useSession } from '@/components/supabase-provider'
import { v4 as uuidv4 } from 'uuid'
import { ExpandIcon, History as HistoryIcon, Plus, X } from 'lucide-react'
import AIExpertChat from '@/components/ai/AIExpertChat'
import ChatHistoryList from '@/components/ai/ChatHistoryList'

export default function AIChatWidget() {
  const [open, setOpen] = useState(false)
  const [openExpanded, setOpenExpanded] = useState(false)
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
      if (['superadmin', 'admin', 'staff-admin', 'staff-user'].includes(role)) setUserType('owner')
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
      fetch(`${api}/chat/history?session_id=${sessionId}`).then(res => res.json()).then(data => setHasMessages(Array.isArray(data) && data.length > 0)).catch(() => setHasMessages(false))
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
  return open ? (
    <div className={openExpanded ? 'fixed bottom-[100px] right-[30px] w-[calc(100%_-_60px)] z-50 flex rounded-t-[16px]' : 'fixed w-full bottom-[100px] right-[30px] sm:w-[400px] z-50 flex rounded-t-[16px]'} style={{ boxShadow: '0 -8px 24px rgba(0,0,0,0.18)' }}
      onClick={() => setOpen(false)}>
      <div className={`w-full overflow-hidden rounded-t-[16px] rounded-t-2xl sm:rounded-none px-2 sm:px-0 transition-all duration-300 flex flex-col`} onClick={e => e.stopPropagation()}>
        {/* Topbar */}
        <div className="flex items-center justify-between p-4 border-b bg-gradient-to-r from-indigo-600 to-purple-700 sticky top-0 z-10 rounded-t-[16px] ">
          <div className="flex items-center gap-2">
            <h2 className="text-lg font-semibold ml-2 text-white">SynC AI Expert</h2>
          </div>
          <div className="flex items-center gap-1">
            <button onClick={openHistory} className="text-white hover:text-white transition p-1" title="Chat history">
              <HistoryIcon className="w-5 h-5" />
            </button>
            <button onClick={handleNewSession} className="flex items-center gap-1 px-2 py-1 text-sm h-7 bg-primary text-white rounded hover:bg-primary/90" title="Start new conversation">
              <Plus className="w-4 h-4" />
              <span className="hidden sm:inline">New Chat</span>
            </button>
            <button onClick={() => setOpenExpanded(!openExpanded)} className="text-white hover:text-white text-xl font-extrabold ml-2" title="Expand chat">
              <ExpandIcon className="w-4 h-4" />
            </button>
            <button onClick={() => { setOpen(false); window.dispatchEvent(new Event('close-ai-widget')) }} className="text-white hover:text-white text-xl font-extrabold ml-2" title="Fechar chat">
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
        <div className={openExpanded ? 'overflow-hidden flex flex-col h-[calc(100vh_-_200px)] rounded-b-[16px] bg-white' : 'overflow-hidden flex flex-col h-[500px] rounded-b-[16px] bg-white'}>
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
  ) : ''
}
