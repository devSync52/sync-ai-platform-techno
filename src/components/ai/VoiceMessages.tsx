import { Loader2, Mic, MicOff, MoreHorizontal, X } from "lucide-react"
import { motion } from 'framer-motion'
import { Dispatch, SetStateAction, useEffect, useMemo, useRef } from "react";
import { useSpeech } from "react-text-to-speech";

interface VoiceModeOverlayProps {
    open: boolean;
    phase: 'initial' | 'listening' | 'thinking' | 'streaming';
    onClose: () => void;
    onToggleMic: () => void;
    isListening: boolean;
    isSpeaking: boolean;
    isThinking: boolean;
    setIsSpeaking: Dispatch<SetStateAction<boolean>>
    stopSpeaking: () => void;
    transcript: string;
    spokenText?: string;
    language?: string;
    onSpeakingChange?: (isSpeaking: boolean) => void;
}

function stripHtmlForSpeech(value: string) {
    return value
        .replace(/<br\s*\/?>/gi, '\n')
        .replace(/<\/(p|div|li|h[1-6])>/gi, '\n')
        .replace(/<li>/gi, '- ')
        .replace(/<[^>]+>/g, ' ')
        .replace(/&nbsp;/gi, ' ')
        .replace(/&amp;/gi, '&')
        .replace(/&lt;/gi, '<')
        .replace(/&gt;/gi, '>')
        .replace(/\r/g, '')
        .replace(/\n{3,}/g, '\n\n')
        .replace(/[ \t]{2,}/g, ' ')
        .trim()
}

export function VoiceModeOverlay({ open, phase, onClose, onToggleMic, isListening, isSpeaking, setIsSpeaking, transcript, isThinking, spokenText = '', language = 'en-US' }: VoiceModeOverlayProps) {
    if (!open) return null

    const plainSpokenText = useMemo(() => stripHtmlForSpeech(spokenText), [spokenText])
    const subtitle = useMemo(() => isSpeaking ? 'Speaking...' : isListening ? 'Listening...' : isThinking ? 'Thinking...' : 'Tap the mic to start', [isSpeaking, isListening, isThinking])
    const base = useMemo(() => isSpeaking ? '#7c3aed' : isListening ? '#3b82f6' : '#94a3b8', [isSpeaking, isListening])
    const soft = useMemo(() => isSpeaking ? '#c4b5fd' : isListening ? '#bfdbfe' : '#cbd5e1', [isSpeaking, isListening])
    const transcriptContainerRef = useRef<HTMLDivElement>(null)

    const { Text, speechStatus, stop } = useSpeech({ text: plainSpokenText, pitch: 1, rate: 1, volume: 1, lang: language, voiceURI: "", autoPlay: true, highlightText: true, showOnlyHighlightedText: false, highlightMode: "word", enableDirectives: false, });
    const previousSpeechStatusRef = useRef(speechStatus)

    useEffect(() => {
        if (isListening) {
            stop()
        }
    }, [isListening])

    useEffect(() => {
        const previousSpeechStatus = previousSpeechStatusRef.current
        const speechJustFinished = speechStatus == 'stopped' && (previousSpeechStatus == 'started' || previousSpeechStatus == 'paused') && isSpeaking

        if (speechJustFinished) {
            console.log('Speech finished');
            setIsSpeaking(false)
            onToggleMic()
        }

        previousSpeechStatusRef.current = speechStatus
    }, [speechStatus, isSpeaking])

    useEffect(() => {
        const container = transcriptContainerRef.current
        if (!container || !isSpeaking) return

        const scrollHighlightedTextIntoView = () => {
            const activeMark = container.querySelector('mark')
            if (!(activeMark instanceof HTMLElement)) return

            activeMark.scrollIntoView({
                block: 'nearest',
                inline: 'nearest',
                behavior: 'smooth',
            })
        }

        scrollHighlightedTextIntoView()

        const observer = new MutationObserver(scrollHighlightedTextIntoView)
        observer.observe(container, {
            childList: true,
            subtree: true,
            characterData: true,
            attributes: true,
            attributeFilter: ['style', 'class'],
        })

        return () => observer.disconnect()
    }, [isSpeaking, plainSpokenText])

    const handleClose = () => {
        if (isSpeaking) {
            stop()
        }
        onClose()
    }

    const handleToggleMic = () => {
        if (isSpeaking) {
            stop()
        }
        onToggleMic()
    }

    const handleSpeechToggle = () => {
        // 
    }

    return (
        <div className="absolute inset-0 z-50 bg-white">
            <div className="flex items-center justify-end gap-3 p-3">
                <button className="rounded-full bg-gray-100 p-2 hover:bg-gray-200" title="Close" onClick={handleClose}>
                    <X className="h-4 w-4" />
                </button>
            </div>

            <div className="flex flex-col items-center justify-center">
                <div className="relative h-56 w-56 overflow-visible" key={`phase-${phase}`}>
                    {
                        (isListening || isSpeaking) && [0, 1, 2].map((i) => (
                            <motion.span
                                key={i}
                                className="absolute inset-0 rounded-full pointer-events-none"
                                style={{ border: `2px solid ${soft}` }}
                                animate={
                                    isSpeaking ? {
                                        scale: [1, 1.05, 1],
                                        opacity: [0.4, 0.9, 0.4]
                                    } : {
                                        scale: [1, 1.18, 1.3],
                                        opacity: [0.6, 0.25, 0]
                                    }
                                }
                                transition={{
                                    duration: isSpeaking ? 1.1 : 2.1,
                                    repeat: Infinity,
                                    delay: i * 0.22, ease: 'easeInOut'
                                }}
                            />
                        ))
                    }

                    <motion.div
                        className="absolute inset-3 rounded-full will-change-transform bg-[radial-gradient(circle_at_50%_42%,_#f5f5f5_8%,_#d1d5db_75%)] shadow-[0_12px_40px_rgba(0,0,0,0.12)] [transform:translateZ(0)]"
                        animate={
                            isSpeaking ? {
                                scale: [1, 1.06, 1],
                                filter: ['brightness(1)', 'brightness(1.1)', 'brightness(1)'],
                            } : isListening ? {
                                scale: [1, 1.03, 1]
                            } : {
                                scale: [1, 1.01, 1]
                            }
                        }
                        transition={{
                            duration: 1.1,
                            repeat: Infinity,
                            ease: 'easeInOut',
                        }}
                    />

                </div>

                <div className="mt-8 flex flex-col items-center gap-3 relative">
                    <div className="text-xs font-semibold uppercase tracking-[0.28em] text-gray-400">
                        SynC AI Expert
                    </div>

                    <div className="flex min-h-[28px] items-center justify-center">
                        {
                            isSpeaking ? (
                                <div className="flex items-end gap-1.5">
                                    {[6, 10, 16, 10, 6].map((h, idx) => (
                                        <motion.span
                                            key={idx}
                                            className="w-1.5 rounded-sm"
                                            style={{ background: base, height: h }}
                                            animate={{ height: [6, 18, 8, 16, 6] }}
                                            transition={{ duration: 0.9 + idx * 0.06, repeat: Infinity, ease: 'easeInOut' }}
                                        />
                                    ))}
                                </div>
                            ) : isThinking ? (
                                <Loader2 className="h-4 w-4 animate-spin text-gray-500" />
                            ) : null
                        }
                    </div>

                    <div className="text-sm text-gray-600">
                        {subtitle}
                    </div>

                    {

                        isSpeaking ? (
                            <div ref={transcriptContainerRef} className="text-sm text-gray-600 absolute bottom-22 border border-gray-200 bg-gray-50 px-4 py-3 rounded-2xl w-[370px] h-[59px] overflow-auto scrollbar-hidden z-10">
                                <Text className="text-sm leading-6 text-gray-700 [&_mark]:rounded-sm [&_mark]:bg-amber-200 [&_mark]:px-0.5" />
                            </div>
                        ) : (isListening || isThinking) ? (
                            <div className={(isListening || isThinking) ? "text-sm text-gray-600 absolute bottom-22 border border-gray-200 bg-gray-50 px-4 py-3 rounded-2xl w-[370px] h-[59px] overflow-auto z-10 block" : "text-sm text-gray-600 absolute bottom-22 border border-gray-200 bg-gray-50 px-4 py-3 rounded-2xl w-[370px] h-[59px] overflow-auto z-10 hidden"}>
                                {transcript}
                            </div>
                        ) : ''

                    }

                    {/* <div className="text-sm text-gray-600 absolute bottom-20 border border-gray-200 bg-gray-50 px-4 py-3 rounded-2xl w-[370px] h-[59px] overflow-auto">
                        sdfd sfsd f sdf sdf sdf sdf sdf sdf sdf sdf sdf sdf sdf sdfd sfsd f sdf sdf sdf sdf sdf sdf sdf sdf sdf sdf sdf sdfd sfsd f sdf sdf sdf sdf sdf sdf sdf sdf sdf sdf sdf
                    </div> */}

                </div>
            </div>

            <div className="absolute bottom-6 left-0 right-0 flex items-center justify-center gap-4">
                <button className="rounded-full bg-gray-100 p-4 hover:bg-gray-200" title="More">
                    <MoreHorizontal className="h-5 w-5" />
                </button>

                <button onClick={handleToggleMic} className={`rounded-full p-4 hover:opacity-90 ${isListening ? 'bg-gray-100' : 'bg-red-500 text-white'}`} title={isListening ? 'Stop recording' : 'Start recording'}>
                    {isListening ? <Mic className="h-5 w-5" /> : <MicOff className="h-5 w-5" />}
                </button>

                <button className="rounded-full bg-gray-100 p-4 hover:bg-gray-200" title="Close" onClick={handleClose}>
                    <X className="h-5 w-5" />
                </button>
            </div>
        </div>
    )
}
