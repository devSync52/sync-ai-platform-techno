"use client"

import { Bot, ExpandIcon, HistoryIcon, List, Plus, Settings2, X } from 'lucide-react';
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

    const [viewOperation, setViewOperation] = useState({ open: false, expanded: false, history: false, audioConfig: false, quickPrompt: false })
    const [sessionId, setSessionId] = useState<string>('')

    const [accountId, setAccountId] = useState<string | null>(null)
    const [userType, setUserType] = useState<'owner' | 'client' | 'end_client' | null>(null)

    const [isInitial, setIsInitial] = useState(true)
    const [isLoading, setIsLoading] = useState(false)
    const [isPlaying, setIsPlaying] = useState(false)
    const [isSpeaking, setIsSpeaking] = useState(false)

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

    const fetchPageGreeting = async (sessionId: string) => {
        try {
            setIsLoading(true)
            setIsPlaying(true)

            const payloadBody = {
                question: '', account_id: accountId, user_id: user?.id,
                session_id: sessionId, user_type: userType, page_context: {
                    page: pathname, greeting: isInitial,
                    timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
                }
            }

            const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/chat`, {
                method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payloadBody),
            })

            if (!response.ok) throw new Error('API Error')

            const reader = response.body?.getReader()
            if (!reader) throw new Error('No stream reader')

            let result = ''
            const decoder = new TextDecoder('utf-8')
            while (true) {
                const { done, value } = await reader.read()
                if (done) break
                const chunk = decoder.decode(value, { stream: true })
                result += chunk
            }

            setMessages((msgs) => [...msgs, { role: 'assistant', content: result, instantPlayStartPlay: true }])
        } catch (error) {
            console.log(error)
        } finally {
            setIsLoading(false)
            setIsInitial(false)
        }
    }

    useEffect(() => {
        if (pathname && userType && accountId && user) {
            setViewOperation({ open: true, expanded: false, history: false, audioConfig: false, quickPrompt: false })
            const routeGreetingKey = `ai-route-greeted:${pathname}`
            const sessionId = sessionStorage.getItem('sessionId') || uuid()
            setSessionId(sessionId)
            fetchHistory(sessionId)
            if (!sessionStorage.getItem(routeGreetingKey)) {
                fetchPageGreeting(sessionId)
                sessionStorage.setItem(routeGreetingKey, 'true')
            }
        }
    }, [pathname, userType, accountId, user])

    const handleNewSession = () => {
        setViewOperation({ open: true, expanded: false, history: false, audioConfig: false, quickPrompt: false })
        window.dispatchEvent(new Event('new-ai-session'))
        const sessionId = uuid()
        sessionStorage.setItem('sessionId', sessionId)
        setSessionId(sessionId)
        fetchHistory(sessionId)
    }

    const handleClose = () => {
        setViewOperation(prev => ({
            open: !prev.open, expanded: false,
            history: false, audioConfig: false,
            quickPrompt: false
        }))
    }

    const handleSelectSession = (sid: string) => {
        sessionStorage.setItem('sessionId', sid)
        toggleViewOperation('history')
        setSessionId(sid)
        fetchHistory(sid)
    }

    return (
        <div>
            <button onClick={handleClose} className="flex items-center gap-2 bg-primary hover:bg-primary/80 text-white rounded-full text-base shadow transition w-[60px] h-[60px] justify-center fixed bottom-4 right-4 z-50">
                {viewOperation.open ? <X className="w-6 h-6" /> : <Bot className="w-6 h-6" />}
            </button>
            {
                viewOperation.open && (
                    <div className={`fixed bottom-[100px] z-50 flex rounded-[16px] right-[0px] sm:right-[30px] ${viewOperation.expanded ? 'w-[calc(100%_-_60px)]' : 'w-full sm:w-[400px] shadow-lg shadow-grey-400'}`} onClick={() => toggleViewOperation('open')}>
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
                                    <button onClick={() => toggleViewOperation('audioConfig')} className="text-white hover:text-white text-xl font-extrabold ml-2" title="Audio settings">
                                        <Settings2 className="h-4 w-4" />
                                    </button>
                                    <button className="text-white hover:text-white text-xl font-extrabold ml-2" title="Quick Prompts" onClick={() => toggleViewOperation('quickPrompt')}>
                                        <List className="h-5 w-5" />
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
                                                    currentSessionId={sessionId ?? ''} userId={user.id} quickPrompt={viewOperation.quickPrompt}
                                                    accountId={accountId} userType={userType}
                                                    closeQuickPrompt={() => setViewOperation(prev => ({ ...prev, quickPrompt: false }))}
                                                    messages={messages} setMessages={setMessages} audioConfig={viewOperation.audioConfig}
                                                    isLoading={isLoading} setIsLoading={setIsLoading} isSpeaking={isSpeaking}
                                                    setIsSpeaking={setIsSpeaking} isPlaying={isPlaying} setIsPlaying={setIsPlaying}
                                                />
                                            )
                                        }
                                    </div>
                                )
                            }
                        </div>
                    </div>
                )
            }
        </div>
    )
}
