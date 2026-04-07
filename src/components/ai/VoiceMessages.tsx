import { Loader2, Mic, MicOff, MoreHorizontal, X } from "lucide-react"
import { motion } from 'framer-motion'
import { useEffect, useMemo } from "react";
import { useSpeech } from "react-text-to-speech";

interface VoiceModeOverlayProps {
    open: boolean;
    phase: 'initial' | 'listening' | 'thinking' | 'streaming';
    onClose: () => void;
    onToggleMic: () => void;
    isListening: boolean;
    isSpeaking: boolean;
    isThinking: boolean;
    stopSpeaking: () => void;
    transcript: string;
    spokenText?: string;
    language?: string;
    onSpeakingChange?: (isSpeaking: boolean) => void;
}

export function VoiceModeOverlay({ open, phase, onClose, onToggleMic, isListening, isSpeaking, stopSpeaking, transcript, isThinking, spokenText = '', language = 'en-US', onSpeakingChange }: VoiceModeOverlayProps) {
    if (!open) return null

    const isInitial = useMemo(() => phase == 'initial', [phase])
    const isStreaming = useMemo(() => phase == 'streaming', [phase])
    const aiText = useMemo(() => spokenText.trim(), [spokenText])
    const shouldSpeak = useMemo(() => open && !!aiText, [aiText, open])

    const subtitle = useMemo(() => isInitial ? 'Tap the mic to start' : isListening ? 'Listening...' : isThinking ? 'Thinking...' : 'Speaking...', [isInitial, isListening, isThinking])
    const base = useMemo(() => isStreaming ? '#7c3aed' : isListening ? '#3b82f6' : '#94a3b8', [isStreaming, isListening])
    const soft = useMemo(() => isStreaming ? '#c4b5fd' : isListening ? '#bfdbfe' : '#cbd5e1', [isStreaming, isListening])

    const { Text, speechStatus, start, pause, stop } = useSpeech({ text: aiText, pitch: 1, rate: 1, volume: 1, lang: language, voiceURI: "", autoPlay: shouldSpeak, highlightText: true, showOnlyHighlightedText: false, highlightMode: "word", enableDirectives: false, });

    useEffect(() => {
        onSpeakingChange?.(speechStatus == 'started' || speechStatus == 'paused')
    }, [onSpeakingChange, speechStatus])

    useEffect(() => {
        if (!shouldSpeak && speechStatus != 'stopped') {
            stop()
        }
    }, [shouldSpeak, speechStatus, stop])

    const handleClose = () => {
        if (isSpeaking || speechStatus != 'stopped') {
            stop()
            stopSpeaking()
        }
        onClose()
    }

    const handleSpeechToggle = () => {
        if (!aiText) return

        if (speechStatus === 'started') {
            pause()
            return
        }

        start()
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
                        (isListening || isStreaming) && [0, 1, 2].map((i) => (
                            <motion.span
                                key={i}
                                className="absolute inset-0 rounded-full pointer-events-none"
                                style={{ border: `2px solid ${soft}` }}
                                animate={
                                    isStreaming ? {
                                        scale: [1, 1.05, 1],
                                        opacity: [0.4, 0.9, 0.4]
                                    } : {
                                        scale: [1, 1.18, 1.3],
                                        opacity: [0.6, 0.25, 0]
                                    }
                                }
                                transition={{
                                    duration: isStreaming ? 1.1 : 2.1,
                                    repeat: Infinity,
                                    delay: i * 0.22, ease: 'easeInOut'
                                }}
                            />
                        ))
                    }

                    <motion.div
                        className="absolute inset-3 rounded-full will-change-transform bg-[radial-gradient(circle_at_50%_42%,_#f5f5f5_8%,_#d1d5db_75%)] shadow-[0_12px_40px_rgba(0,0,0,0.12)] [transform:translateZ(0)]"
                        animate={
                            isStreaming
                                ? {
                                    scale: [1, 1.06, 1],
                                    filter: ['brightness(1)', 'brightness(1.1)', 'brightness(1)'],
                                }
                                : isListening
                                    ? { scale: [1, 1.03, 1] }
                                    : { scale: [1, 1.01, 1] }
                        }
                        transition={{
                            duration: 1.1,
                            repeat: Infinity,
                            ease: 'easeInOut',
                        }}
                    />

                </div>

                <div className="mt-8 flex flex-col items-center gap-3">
                    <div className="text-xs font-semibold uppercase tracking-[0.28em] text-gray-400">
                        SynC AI Expert
                    </div>

                    <div className="flex min-h-[28px] items-center justify-center">
                        {
                            isStreaming ? (
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
                        isSpeaking && aiText ? (
                            <button type="button" onClick={handleSpeechToggle} className="max-w-md rounded-2xl border border-gray-200 bg-gray-50 px-4 py-3 text-sm text-gray-700 shadow-sm transition hover:bg-gray-100" title={speechStatus == 'started' ? 'Pause speech' : 'Play speech'}>
                                <Text className="text-sm leading-6 text-gray-700 [&_mark]:rounded-sm [&_mark]:bg-amber-200 [&_mark]:px-0.5" />
                            </button>
                        ) : (
                            (isListening || isThinking) && (
                                <div className="text-sm text-gray-600">
                                    {transcript}
                                </div>
                            )
                        )
                    }

                </div>
            </div>

            <div className="absolute bottom-6 left-0 right-0 flex items-center justify-center gap-4">
                <button className="rounded-full bg-gray-100 p-4 hover:bg-gray-200" title="More">
                    <MoreHorizontal className="h-5 w-5" />
                </button>

                <button onClick={onToggleMic} className={`rounded-full p-4 hover:opacity-90 ${isListening ? 'bg-gray-100' : 'bg-red-500 text-white'}`} title={isListening ? 'Stop recording' : 'Start recording'}>
                    {isListening ? <Mic className="h-5 w-5" /> : <MicOff className="h-5 w-5" />}
                </button>

                <button className="rounded-full bg-gray-100 p-4 hover:bg-gray-200" title="Close" onClick={handleClose}>
                    <X className="h-5 w-5" />
                </button>
            </div>
        </div>
    )
}
