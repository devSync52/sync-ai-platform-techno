"use client"

import { ExpandIcon, HistoryIcon, Plus, X } from 'lucide-react';
import { usePathname } from 'next/navigation';
import { useEffect, useState } from 'react'
import { v4 as uuid } from 'uuid'
import { useSession, useSupabase } from '../supabase-provider';
import ChatHistoryList from './ChatHistoryList';
import { ChatMessage } from '@/hooks/useSyncAgent';
import AIChatMessages from './AIChatMessages';

type Session = {
    session_id: string
    last_activity: string
    last_question: string
}

export default function ChatWidget() {

    const supabase = useSupabase(), session = useSession(), pathname = usePathname()

    const user = session?.user

    const [viewOperation, setViewOperation] = useState({ open: false, expanded: false, history: false })
    const [sessionId, setSessionId] = useState<string>('')

    const [accountId, setAccountId] = useState<string | null>(null)
    const [userType, setUserType] = useState<'owner' | 'client' | 'end_client' | null>(null)

    const [messages, setMessages] = useState<ChatMessage[]>([])
    const [sessions, setSessions] = useState<Session[]>([])

    const toggleViewOperation = (field: keyof typeof viewOperation) => setViewOperation((prev) => ({ ...prev, [field]: !viewOperation[field] }))

    const fetchChatHistoryList = () => {
        toggleViewOperation('history')
        fetch(`${process.env.NEXT_PUBLIC_API_URL}/chat/sessions?user_id=${user?.id}`).then(res => res.json()).then(data => {
            setSessions(data)
        }).catch((error) => {
            console.log(error)
        })
    }

    const fetchHistory = (sessionId: string = '') => {
        fetch(`${process.env.NEXT_PUBLIC_API_URL}/chat/history?session_id=${sessionId}`).then(res => res.json()).then(data => {
            setMessages(data)
        }).catch((error) => {
            console.log(error)
        })
    }

    useEffect(() => {
        const fetchUserData = async () => {
            if (!user) return
            const { data, error } = await supabase.from('users').select('account_id, role').eq('id', user.id).single()
            if (error) {
                console.error('[AIChatWidget] ❌ Error fetching user data:', error.message)
                return
            }
            setAccountId(data?.account_id ?? null)
            const role = data?.role
            if (['superadmin', 'admin', 'staff-admin', 'staff-user'].includes(role)) {
                setUserType('owner')
            } else {
                setUserType(role == 'client' ? 'client' : 'end_client')
            }
        }
        fetchUserData()
    }, [user, supabase])

    useEffect(() => {
        if (pathname) {
            setViewOperation({ open: true, expanded: false, history: false })
            window.dispatchEvent(new Event('open-ai-widget'))
            if (sessionStorage.getItem('sessionId')) {
                setSessionId(sessionStorage.getItem('sessionId') as string)
                fetchHistory(sessionStorage.getItem('sessionId') as string)
            } else {
                const sessionId = uuid()
                sessionStorage.setItem('sessionId', sessionId)
                setSessionId(sessionId)
                fetchHistory(sessionId)
            }
        }
    }, [pathname])

    useEffect(() => {
        const handleOpen = () => toggleViewOperation('open')
        window.addEventListener('toggle-ai-widget', handleOpen)
        return () => window.removeEventListener('toggle-ai-widget', handleOpen)
    }, [])

    const handleNewSession = () => {
        setViewOperation({ open: true, expanded: false, history: false })
        window.dispatchEvent(new Event('new-ai-session'))
        const sessionId = uuid()
        sessionStorage.setItem('sessionId', sessionId)
        setSessionId(sessionId)
        fetchHistory(sessionId)
    }

    const stopSpeaking = () => {
        if ('speechSynthesis' in window) {
            window.speechSynthesis.cancel()
        }
    }

    const handleClose = () => {
        setViewOperation({ open: false, expanded: false, history: false })
        window.dispatchEvent(new Event('close-ai-widget'))
        stopSpeaking()
    }

    const handleSelectSession = (sid: string) => {
        sessionStorage.setItem('sessionId', sid)
        toggleViewOperation('history')
        setSessionId(sid)
        fetchHistory(sid)
    }

    return viewOperation.open ? (
        <div className={`fixed bottom-[100px] z-50 flex rounded-[16px] rounded-br-none right-[30px] ${viewOperation.expanded ? 'w-[calc(100%_-_60px)]' : 'w-full sm:w-[400px] shadow-lg shadow-blue-400'}`} onClick={() => toggleViewOperation('open')}>
            <div className={`w-full overflow-hidden rounded-t-2xl sm:rounded-none px-2 sm:px-0 transition-all duration-300 flex flex-col`} onClick={e => e.stopPropagation()}>
                <div className="flex items-center justify-between p-4 border-b bg-gradient-to-r from-indigo-600 to-purple-700 sticky top-0 z-10 rounded-t-[16px]">
                    <div className="flex items-center gap-2">
                        <h2 className="text-lg font-semibold ml-2 text-white">SynC AI Expert</h2>
                    </div>
                    <div className="flex items-center gap-1">
                        <button onClick={fetchChatHistoryList} className="text-white hover:text-white transition p-1" title="Chat history">
                            <HistoryIcon className="w-5 h-5" />
                        </button>
                        <button onClick={handleNewSession} className="flex items-center gap-1 px-2 py-1 text-sm h-7 bg-primary text-white rounded hover:bg-primary/90" title="Start new conversation">
                            <Plus className="w-4 h-4" />
                            <span className="hidden sm:inline">New Chat</span>
                        </button>
                        <button onClick={() => toggleViewOperation('expanded')} className="text-white hover:text-white text-xl font-extrabold ml-2" title="Expand chat">
                            <ExpandIcon className="w-4 h-4" />
                        </button>
                        <button onClick={handleClose} className="text-white hover:text-white text-xl font-extrabold ml-2" title="Fechar chat">
                            <X className="w-4 h-4" />
                        </button>
                    </div>
                </div>
                {
                    (accountId && userType && user) && (
                        <div className={`overflow-hidden flex flex-col rounded-b-[16px] bg-white ${viewOperation.expanded ? 'h-[calc(100vh_-_200px)]' : 'h-[500px]'}`}>
                            {
                                viewOperation.history ? (
                                    <ChatHistoryList
                                        sessions={sessions}
                                        currentSessionId={sessionId ?? ''}
                                        onSelectSession={handleSelectSession}
                                        onClose={() => toggleViewOperation('history')}
                                    />
                                ) : (
                                    <AIChatMessages
                                        currentSessionId={sessionId ?? ''} userId={user.id}
                                        accountId={accountId} userType={userType} stopSpeaking={stopSpeaking}
                                        messages={messages} setMessages={setMessages}
                                    />
                                )
                            }
                        </div>
                    )
                }
            </div>
        </div>
    ) : ''
}
