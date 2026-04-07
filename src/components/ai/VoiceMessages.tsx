import { Loader2, Mic, MicOff, MoreHorizontal, X } from "lucide-react"
import { motion } from 'framer-motion'
import { useMemo } from "react";

interface VoiceModeOverlayProps {
    open: boolean;
    phase: 'initial' | 'listening' | 'thinking' | 'streaming';
    onClose: () => void;
    onToggleMic: () => void;
    listening: boolean;
    isSpeaking: boolean;
    stopSpeaking: () => void;
    transcript: string;
}

export function VoiceModeOverlay({ open, phase, onClose, onToggleMic, listening, isSpeaking, stopSpeaking, transcript }: VoiceModeOverlayProps) {
    if (!open) return null

    const isInitial = useMemo(() => phase == 'initial', [phase])
    const isListening = useMemo(() => phase == 'listening', [phase])
    const isThinking = useMemo(() => phase == 'thinking', [phase])
    const isStreaming = useMemo(() => phase == 'streaming', [phase])

    const subtitle = useMemo(() => isInitial ? 'Tap the mic to start' : isListening ? 'Listening...' : isThinking ? 'Thinking...' : 'Speaking...', [isInitial, isListening, isThinking])
    const base = useMemo(() => isStreaming ? '#7c3aed' : isListening ? '#3b82f6' : '#94a3b8', [isStreaming, isListening])
    const soft = useMemo(() => isStreaming ? '#c4b5fd' : isListening ? '#bfdbfe' : '#cbd5e1', [isStreaming, isListening])

    const handleClose = () => {
        if (isSpeaking) stopSpeaking()
        onClose()
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
                        transcript && (
                            <div className="text-sm text-gray-600">
                                {transcript}
                            </div>
                        )
                    }

                </div>
            </div>

            <div className="absolute bottom-6 left-0 right-0 flex items-center justify-center gap-4">
                <button className="rounded-full bg-gray-100 p-4 hover:bg-gray-200" title="More">
                    <MoreHorizontal className="h-5 w-5" />
                </button>

                <button onClick={onToggleMic} className={`rounded-full p-4 hover:opacity-90 ${listening ? 'bg-gray-100' : 'bg-red-500 text-white'}`} title={listening ? 'Stop recording' : 'Start recording'}>
                    {listening ? <Mic className="h-5 w-5" /> : <MicOff className="h-5 w-5" />}
                </button>

                <button className="rounded-full bg-gray-100 p-4 hover:bg-gray-200" title="Close" onClick={handleClose}>
                    <X className="h-5 w-5" />
                </button>
            </div>
        </div>
    )
}