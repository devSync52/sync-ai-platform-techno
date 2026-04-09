import { ChatMessage } from '@/hooks/useSyncAgent';
import { Loader2, Mic } from 'lucide-react';
import { Dispatch, SetStateAction, useCallback, useEffect, useRef, useState } from 'react';
import QuickPrompts from './QuickPrompts';
import { ChatChart } from './charts/chatChart';
import { VoiceModeOverlay } from './VoiceMessages';
import SpeechRecognition, { useSpeechRecognition } from 'react-speech-recognition';
import ChatMessageComponent from './ChatMessage';

interface AIChatMessagesType {
    currentSessionId: string;
    messages: ChatMessage[];
    setMessages: Dispatch<SetStateAction<ChatMessage[]>>;
    closeQuickPrompt: () => void;
    audioConfig: boolean;
    quickPrompt: boolean;
    accountId: string;
    userType: string;
    userId: string;
    isLoading: boolean;
    setIsLoading: Dispatch<SetStateAction<boolean>>;
    isSpeaking: boolean;
    setIsSpeaking: Dispatch<SetStateAction<boolean>>;
    isPlaying: boolean;
    setIsPlaying: Dispatch<SetStateAction<boolean>>;
    isExpanded: boolean;
}

type VoicePhase = 'initial' | 'listening' | 'thinking' | 'streaming'

export default function AIChatMessages({ currentSessionId, messages, setMessages, accountId, userType, userId, audioConfig, quickPrompt, closeQuickPrompt, isLoading, setIsLoading, isSpeaking, setIsSpeaking, isPlaying, setIsPlaying, isExpanded }: AIChatMessagesType) {

    const { transcript, listening, resetTranscript } = useSpeechRecognition();

    if (!SpeechRecognition.browserSupportsSpeechRecognition()) {
        return <span>Browser doesn't support speech recognition.</span>;
    }

    const [viewOperation, setViewOperation] = useState({ voice: false })
    const [audioConfigSettings, setAudioConfigSettings] = useState({ speechEnabled: false, voiceFirst: false })

    const [voicePhase, setVoicePhase] = useState<VoicePhase>('initial')
    const [input, setInput] = useState('')
    const [currentSpeakingAnswer, setCurrentSpeakingAnswer] = useState('')

    const toggleViewOperation = (field: keyof typeof viewOperation) => setViewOperation((prev) => ({ ...prev, [field]: !viewOperation[field] }))

    const languageList = { en: 'en-US', pt: 'pt-BR', es: 'es-ES', } as const
    const chatRef = useRef<HTMLDivElement>(null)

    const silenceTimer = useRef<ReturnType<typeof setTimeout> | null>(null)

    const [language, setLanguage] = useState<keyof typeof languageList>('en')

    useEffect(() => {
        chatRef.current?.scrollTo({
            top: chatRef.current.scrollHeight,
            behavior: 'smooth'
        })
    }, [messages])

    const clearSilenceTimeout = useCallback(() => {
        if (silenceTimer.current) {
            clearTimeout(silenceTimer.current)
            silenceTimer.current = null
        }
    }, [])

    const stopVoiceListening = useCallback(async () => {
        await SpeechRecognition.stopListening()
        resetTranscript()
        setVoicePhase('initial')
        clearSilenceTimeout()
    }, [clearSilenceTimeout, resetTranscript])

    const handleStopSpeaking = useCallback(() => {
        setIsPlaying(false)
        setIsSpeaking(false)
        setCurrentSpeakingAnswer('')
    }, [setIsPlaying, setIsSpeaking])

    const processQuestion = useCallback(async (question: string, voice: boolean = false) => {
        if (!question.trim() || isLoading) return

        handleStopSpeaking()

        if (listening) {
            await stopVoiceListening()
        }

        setIsLoading(true)

        const userMsg: ChatMessage = { role: 'user', content: question }
        setMessages((msgs) => [...msgs, userMsg])

        const payloadBody = {
            question, account_id: accountId, user_id: userId,
            session_id: currentSessionId, user_type: userType,
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

        if (voice) {
            setCurrentSpeakingAnswer(result)
            setVoicePhase('streaming')
            setIsSpeaking(true)
        } else {
            setCurrentSpeakingAnswer('')
            setIsSpeaking(false)
            setVoicePhase('initial')
        }

        setMessages((msgs) => [...msgs, { role: 'assistant', content: result }])
        setIsLoading(false)
    }, [accountId, currentSessionId, handleStopSpeaking, isLoading, listening, setMessages, stopVoiceListening, userId, userType])

    const handleQuickPrompt = async (prompt: string) => {
        closeQuickPrompt()
        await processQuestion(prompt, false)
    }

    const sendMessage = async () => {
        if (!input.trim() || isLoading) return
        const toSend = input
        setInput('')
        await processQuestion(toSend, false)
    }

    const onToggleMic = async () => {
        if (listening) {
            await stopVoiceListening()
        } else {
            clearSilenceTimeout()
            await SpeechRecognition.startListening({ language: languageList[language] || navigator.language, continuous: true })
            setVoicePhase('listening')
        }
    }

    const handleToggleVoice = async () => {
        toggleViewOperation('voice')
        if (listening) {
            await stopVoiceListening()
        } else {
            await onToggleMic()
        }
    }

    const handleVoiceClose = async () => {
        toggleViewOperation('voice')
        if (listening) {
            await stopVoiceListening()
        }
        setIsSpeaking(false)
        setVoicePhase('initial')
    }

    useEffect(() => {
        if (listening) {
            if (silenceTimer.current) {
                clearTimeout(silenceTimer.current);
            }

            if (transcript.trim() == "stop" || transcript.trim().toLowerCase() == "end chat") {
                stopVoiceListening()
            } else if (transcript && transcript.length > 0) {
                silenceTimer.current = setTimeout(() => {
                    processQuestion(transcript, true)
                    if (silenceTimer.current) {
                        clearTimeout(silenceTimer.current);
                    }
                }, 2000);
            } else {
                silenceTimer.current = setTimeout(() => {
                    stopVoiceListening()
                    if (silenceTimer.current) {
                        clearTimeout(silenceTimer.current);
                    }
                }, 120000);
            }
        }
    }, [transcript, listening])

    useEffect(() => {
        return () => {
            clearSilenceTimeout()
        }
    }, [])

    return (
        <div className="relative flex flex-col h-full">
            <div className="absolute top-1 right-2 z-[999]">
                {
                    audioConfig && (
                        <div className="mt-2 w-64 bg-white border rounded-lg p-3 shadow-md">
                            <div className="text-sm font-semibold mb-2">Audio Settings</div>
                            <div className="space-y-3 text-sm">
                                <label className="flex items-center gap-2">
                                    <input
                                        type="checkbox"
                                        checked={audioConfigSettings.speechEnabled}
                                        onChange={() => setAudioConfigSettings((v) => ({ ...v, speechEnabled: !v.speechEnabled }))}
                                    />
                                    Enable voice response
                                </label>

                                <label className="flex items-center gap-2">
                                    <input
                                        type="checkbox"
                                        checked={audioConfigSettings.voiceFirst}
                                        onChange={() => setAudioConfigSettings((v) => ({ ...v, voiceFirst: !v.voiceFirst }))}
                                    />
                                    Voice-first (send & reply by voice)
                                </label>

                                <label className="flex flex-col gap-1">
                                    Language
                                    <select value={language} onChange={(e) => setLanguage(e.target.value as keyof typeof languageList)} className="border rounded px-2 py-1">
                                        <option value="en">English</option>
                                        <option value="pt">Portuguese</option>
                                        <option value="es">Spanish</option>
                                    </select>
                                </label>
                            </div>
                        </div>
                    )
                }
            </div>
            {
                viewOperation.voice ? (
                    <VoiceModeOverlay
                        open={viewOperation.voice} phase={voicePhase} isExpanded={isExpanded}
                        onClose={handleVoiceClose} onToggleMic={onToggleMic} setIsSpeaking={setIsSpeaking}
                        isListening={listening} isSpeaking={isSpeaking} isThinking={isLoading}
                        stopSpeaking={handleStopSpeaking} spokenText={currentSpeakingAnswer}
                        transcript={isSpeaking ? currentSpeakingAnswer : transcript}
                        language={languageList[language]} onSpeakingChange={(speaking) => {
                            setIsSpeaking(speaking)
                            if (!speaking && voicePhase == 'streaming') {
                                setCurrentSpeakingAnswer('')
                                setVoicePhase('initial')
                            }
                        }}
                    />
                ) : (
                    <>
                        <div className="absolute top-0 left-0 z-40 h-[413px]">
                            {
                                quickPrompt && (
                                    <div className="w-[100%] bg-white border-b p-2 h-full">
                                        <QuickPrompts
                                            onPrompt={handleQuickPrompt} isClient={false}
                                            closeQuickPrompt={closeQuickPrompt}
                                        />
                                    </div>
                                )
                            }
                        </div>
                        <div className="flex-1 overflow-y-auto px-6 py-8 space-y-4" ref={chatRef}>
                            {
                                messages.map((msg, i) => (
                                    <div key={i} className={`flex flex-col ${msg.role == 'user' ? 'items-end' : 'items-start'}`}>
                                        {
                                            msg.role == 'assistant' ? (
                                                msg.metadata?.type == 'chart' ? (
                                                    <ChatChart metadata={msg.metadata} />
                                                ) : (
                                                    <ChatMessageComponent
                                                        instantPlayStartPlay={msg.instantPlayStartPlay || false}
                                                        content={msg.content} isPlaying={isPlaying} setIsPlaying={setIsPlaying}
                                                    />
                                                )
                                            ) : (
                                                <div className="rounded-lg px-4 py-2 text-sm whitespace-pre-wrap max-w-[85%] bg-primary text-white">
                                                    {msg.content}
                                                </div>
                                            )
                                        }
                                    </div>
                                ))
                            }

                            {
                                isLoading && (
                                    <div className="flex flex-col items-start">
                                        <div className="rounded-lg px-4 py-2 text-sm bg-gray-100 text-gray-900 max-w-[85%] flex items-center gap-2">
                                            <Loader2 className="w-4 h-4 animate-spin" />
                                            <span>Thinking...</span>
                                        </div>
                                    </div>
                                )
                            }
                        </div>

                        <div className="border-t p-4 pb-[calc(env(safe-area-inset-bottom)+12px)] flex items-center gap-3">
                            <button disabled={isLoading} className="border rounded-full p-3 md:p-2.5 bg-white shadow-sm hover:bg-gray-50" title="Open Voice Mode" onClick={() => handleToggleVoice()}>
                                <Mic className="h-6 w-6 md:h-5 md:w-5" />
                            </button>

                            <textarea
                                className="flex-1 border px-3 py-2 rounded text-sm resize-none leading-5 min-h-[40px] max-h-36"
                                placeholder="Ask your question... (Shift+Enter for new line)"
                                value={input} onChange={(e) => setInput(e.target.value)} rows={2} disabled={isLoading}
                                onKeyDown={(e) => {
                                    if (e.key == 'Enter' && !e.shiftKey) {
                                        e.preventDefault()
                                        sendMessage()
                                    }
                                }}
                            />

                            <button onClick={sendMessage} className="bg-primary text-white px-4 py-2 rounded text-sm disabled:opacity-60" disabled={isLoading}>
                                {isLoading ? <Loader2 className="animate-spin h-4 w-4" /> : 'Ask'}
                            </button>
                        </div>
                    </>
                )
            }
        </div>
    )
}
