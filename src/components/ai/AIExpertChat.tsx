'use client'

import { useState, useEffect, useRef } from 'react'
import { motion } from 'framer-motion'
import { useSyncAgent, ChatMessage } from '@/hooks/useSyncAgent'
import {
  Loader2,
  Mic,
  MicOff,
  Settings2,
  X,
  VolumeX,
  MoreHorizontal,
} from 'lucide-react'
import { QuickPrompts } from './QuickPrompts'
import { ChatChart } from './charts/chatChart'

// ---- iOS audio unlock helpers ----
const isIOS = typeof navigator !== 'undefined' && /iP(hone|ad|od)/.test(navigator.userAgent)
let sharedAC: AudioContext | null = null

async function unlockAudioContext() {
  try {
    const AC: typeof AudioContext = (window as any).AudioContext || (window as any).webkitAudioContext
    if (!AC) return
    if (!sharedAC) {
      sharedAC = new AC({ latencyHint: 'interactive' })
    }
    if (sharedAC.state !== 'running') await sharedAC.resume()
    // Play a tiny silent buffer to unlock playback
    const frames = Math.max(1, sharedAC.sampleRate / 20)
    const buf = sharedAC.createBuffer(1, frames, sharedAC.sampleRate)
    const src = sharedAC.createBufferSource()
    src.buffer = buf
    src.connect(sharedAC.destination)
    src.start(0)
  } catch {}
}

function BotMessageWithCopy({ content }: { content: string }) {
  return (
    <div className="flex items-center">
      <div className="rounded-lg px-4 py-2 text-sm whitespace-pre-wrap max-w-[85%] bg-gray-100 text-gray-900">
        {content}
      </div>
    </div>
  )
}

type VoicePhase = 'idle' | 'listening' | 'thinking' | 'preparing' | 'speaking'

/** ---------------- Voice Overlay (animações ricas + fases) ---------------- */
function VoiceModeOverlay({
  open,
  phase,
  onClose,
  onToggleMic,
  listening,
  isSpeaking,
  stopSpeaking,
}: {
  open: boolean
  phase: VoicePhase
  onClose: () => void
  onToggleMic: () => void
  listening: boolean
  isSpeaking: boolean
  stopSpeaking: () => void
}) {
  if (!open) return null

  const isListening = phase === 'listening'
  const isThinking  = phase === 'thinking'
  const isPreparing = phase === 'preparing'
  const isSpeakingP = phase === 'speaking'

  const subtitle =
    isListening ? 'Listening…'
    : isThinking ? 'Thinking…'
    : isPreparing ? 'Preparing voice…'
    : 'Speaking…'

  const base = isSpeakingP ? '#7c3aed' : isListening ? '#3b82f6' : '#94a3b8'
  const soft = isSpeakingP ? '#c4b5fd' : isListening ? '#bfdbfe' : '#cbd5e1'

  return (
    <div className="absolute inset-0 z-50 bg-white">
      {/* Top bar */}
      <div className="flex items-center justify-end gap-3 p-3">
        <button
          onClick={() => {
            if (isSpeaking) stopSpeaking()
            onClose()
          }}
          className="rounded-full bg-gray-100 p-2 hover:bg-gray-200"
          title="Close"
        >
          <X className="h-4 w-4" />
        </button>
      </div>

      {/* Centro */}
      <div className="flex flex-col items-center justify-center" style={{ minHeight: '62vh' }}>
        {/* Wrapper MAIOR e com overflow visível (evita corte) */}
        <div className="relative h-56 w-56 overflow-visible" key={`phase-${phase}`}>
          {/* Ondas concêntricas — apenas listening/preparing */}
          {(isListening || isPreparing) && [0, 1, 2].map((i) => (
            <motion.span
              key={i}
              className="absolute inset-0 rounded-full pointer-events-none"
              style={{ border: `2px solid ${soft}` }}
              animate={
                isPreparing
                  ? { scale: [1, 1.05, 1], opacity: [0.4, 0.9, 0.4] }
                  : { scale: [1, 1.18, 1.3], opacity: [0.6, 0.25, 0] }
              }
              transition={{
                duration: isPreparing ? 1.1 : 2.1,
                repeat: Infinity,
                delay: i * 0.22,
                ease: 'easeInOut',
              }}
            />
          ))}

          {/* Núcleo com inset (folga) + aceleração GPU (iOS) */}
          <motion.div
            className="absolute inset-3 rounded-full will-change-transform"
            style={{
              transform: 'translateZ(0)',
              background: `radial-gradient(circle at 50% 42%, ${soft} 8%, ${base} 75%)`,
              boxShadow: '0 12px 40px rgba(0,0,0,0.12)',
            }}
            animate={
              isSpeakingP
                ? { scale: [1, 1.06, 1], filter: ['brightness(1)', 'brightness(1.1)', 'brightness(1)'] }
                : isListening
                ? { scale: [1, 1.03, 1] }
                : { scale: [1, 1.01, 1] }
            }
            transition={{ duration: 1.1, repeat: Infinity, ease: 'easeInOut' }}
          />

          {/* Equalizer — apenas speaking */}
          {isSpeakingP && (
            <div className="absolute -bottom-10 left-1/2 -translate-x-1/2 flex items-end gap-1 pointer-events-none">
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
          )}
        </div>

        <div className="mt-8 text-sm text-gray-600 flex items-center gap-2">
          {(isThinking || isPreparing) && <Loader2 className="h-4 w-4 animate-spin" />}
          <span>{subtitle}</span>
        </div>
      </div>

      {/* Footer actions */}
      <div className="absolute bottom-6 left-0 right-0 flex items-center justify-center gap-4">
        <button className="rounded-full bg-gray-100 p-4 hover:bg-gray-200" title="More">
          <MoreHorizontal className="h-5 w-5" />
        </button>

        <button
          onClick={onToggleMic}
          className={`rounded-full p-4 hover:opacity-90 ${
            listening ? 'bg-red-500 text-white' : 'bg-gray-100'
          }`}
          title={listening ? 'Stop recording' : 'Start recording'}
        >
          {listening ? <MicOff className="h-5 w-5" /> : <Mic className="h-5 w-5" />}
        </button>

        <button
          onClick={() => {
            if (isSpeaking) stopSpeaking()
            onClose()
          }}
          className="rounded-full bg-gray-100 p-4 hover:bg-gray-200"
          title="Close"
        >
          <X className="h-5 w-5" />
        </button>
      </div>
    </div>
  )
}

/** --------------------------------------------------------------------------- */

export default function AIExpertChat({
  user_id,
  account_id,
  user_type,
  session_id,
  apiUrl,
}: {
  user_id: string
  account_id: string
  user_type: 'owner' | 'client' | 'end_client'
  session_id: string
  apiUrl: string
}) {
  const [input, setInput] = useState('')
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [listening, setListening] = useState(false)

  const [speechEnabled, setSpeechEnabled] = useState(true)
  const [voiceFirstMode, setVoiceFirstMode] = useState(true) // comportamento, não desabilita input
  const [showAudioConfig, setShowAudioConfig] = useState(false)
  const [isSpeaking, setIsSpeaking] = useState(false)
  const [language, setLanguage] = useState<'en' | 'pt' | 'es'>('en')

  // Voice overlay + fase
  const [showVoiceMode, setShowVoiceMode] = useState(false)
  const [voicePhase, setVoicePhase] = useState<VoicePhase>('idle')

  const { askQuestion, loading, thinking, partialResponse, getHistory } = useSyncAgent(apiUrl)

  const chatRef = useRef<HTMLDivElement>(null)
  const recognitionRef = useRef<any>(null)
  const audioRef = useRef<HTMLAudioElement | null>(null)

  const langMap = {
    en: 'en-US',
    pt: 'pt-BR',
    es: 'es-ES',
  } as const

  // --------- TTS ----------
  const stopSpeaking = () => {
    const ar: any = audioRef.current
    try {
      if (ar && ar._mode === 'webaudio' && ar._node) {
        try { ar._node.stop(); ar._node.disconnect() } catch {}
        if (ar._ctx && ar._ctx.state !== 'closed') {
          // keep context alive for next unlock, just disconnect node
        }
      } else if (audioRef.current instanceof HTMLAudioElement) {
        audioRef.current.pause()
        audioRef.current.currentTime = 0
      }
    } catch {}
    setIsSpeaking(false)
    setVoicePhase('idle')
  }

  const speak = async (text: string) => {
    if (!speechEnabled || !text) return
    // barge-in
    stopSpeaking()
    setIsSpeaking(true)
    setVoicePhase('preparing')

    try {
      const res = await fetch('/api/tts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text, language }),
      })
      if (!res.ok) throw new Error('Failed to fetch audio.')

      const blob = await res.blob()
      const mime = res.headers.get('content-type') || blob.type || 'audio/mpeg'
      const preferWebAudio = isIOS || !/audio\/(mpeg|mp4)/i.test(mime)

      if (preferWebAudio) {
        // ---- WebAudio path (safe for iOS / WKWebView) ----
        await unlockAudioContext()
        const ac = sharedAC!
        const arr = await blob.arrayBuffer()
        const audioBuffer = await ac.decodeAudioData(arr)
        const src = ac.createBufferSource()
        src.buffer = audioBuffer
        src.connect(ac.destination)
        ;(audioRef as any).current = { _mode: 'webaudio', _node: src, _ctx: ac }
        setVoicePhase('speaking')
        src.onended = () => {
          setIsSpeaking(false)
          setVoicePhase('idle')
        }
        src.start(0)
        return
      }

      // ---- HTMLAudio path ----
      const url = URL.createObjectURL(blob)
      const audio = new Audio(url)
      audio.setAttribute('playsinline', 'true')
      audio.preload = 'auto'
      audioRef.current = audio

      let fired = false
      const toSpeaking = () => { if (!fired) { fired = true; setVoicePhase('speaking') } }
      const onTimeUpdate = () => { if (audio.currentTime > 0.05) toSpeaking() }
      const onPlaying = toSpeaking
      const onWaiting = () => setVoicePhase('preparing')
      const onEnded = () => { cleanup(); setIsSpeaking(false); setVoicePhase('idle') }
      const onError = () => { cleanup(); setIsSpeaking(false); setVoicePhase('idle') }
      const cleanup = () => {
        audio.removeEventListener('timeupdate', onTimeUpdate)
        audio.removeEventListener('playing', onPlaying)
        audio.removeEventListener('waiting', onWaiting)
        audio.removeEventListener('ended', onEnded)
        audio.removeEventListener('error', onError)
        URL.revokeObjectURL(url)
      }

      audio.addEventListener('timeupdate', onTimeUpdate)
      audio.addEventListener('playing', onPlaying)
      audio.addEventListener('waiting', onWaiting)
      audio.addEventListener('ended', onEnded)
      audio.addEventListener('error', onError)

      await audio.play()
    } catch (err) {
      console.error('🛑 TTS error:', err)
      setIsSpeaking(false)
      setVoicePhase('idle')
    }
  }

  // --------- LLM ----------
  const processQuestion = async (question: string, opts?: { speakBack?: boolean }) => {
    if (!question.trim() || loading) return

    setVoicePhase('thinking')

    const userMsg: ChatMessage = { role: 'user', content: question }
    setMessages((msgs) => [...msgs, userMsg])

    let aiMessage = ''
    await askQuestion(
      question,
      { userId: user_id, accountId: account_id, sessionId: session_id, userType: user_type },
      (partial) => { aiMessage = partial }
    )

    setMessages((msgs) => [...msgs, { role: 'assistant', content: aiMessage }])

    if (opts?.speakBack) {
      await speak(aiMessage)
    } else {
      setVoicePhase('idle')
    }
  }

  // --------- ASR (SpeechRecognition) ----------
  const startRecording = () => {
    if (isSpeaking) stopSpeaking()

    const SpeechRecognition =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition
    if (!SpeechRecognition) {
      alert('Speech recognition is not supported in this browser.')
      return
    }

    const recognition = new SpeechRecognition()
    recognition.lang = langMap[language] || navigator.language
    recognition.interimResults = false
    recognition.maxAlternatives = 1

    recognition.onresult = async (event: any) => {
      const transcript = event.results[0][0].transcript
      setListening(false)
      setVoicePhase('thinking')
      // Origem voz → fala resposta
      await processQuestion(transcript, { speakBack: true })
    }
    recognition.onerror = () => {
      setListening(false)
      setVoicePhase('idle')
    }
    recognition.onend = () => {
      setListening(false)
      if (voicePhase === 'listening') setVoicePhase('idle')
    }

    recognition.start()
    recognitionRef.current = recognition
    setListening(true)
    setVoicePhase('listening')
  }

  const stopRecording = () => {
    try {
      recognitionRef.current?.stop()
    } catch {}
    setListening(false)
  }

  const toggleMicInOverlay = () => {
    if (listening) stopRecording()
    else startRecording()
  }

  const sendMessage = async () => {
    if (!input.trim() || loading) return
    const toSend = input
    setInput('')
    // Origem texto → NÃO fala resposta
    await processQuestion(toSend, { speakBack: false })
  }

  const handleQuickPrompt = (prompt: string) => setInput(prompt)

  useEffect(() => {
    if (session_id) {
      getHistory(session_id).then(setMessages)
    }
    return () => {
      try {
        recognitionRef.current?.stop()
      } catch {}
      stopSpeaking()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [session_id])

  useEffect(() => {
    chatRef.current?.scrollTo({ top: chatRef.current.scrollHeight, behavior: 'smooth' })
  }, [messages, partialResponse])

  return (
    <div className="relative flex flex-col h-full">
      {/* Toolbar de áudio no topo-esquerdo, dentro do painel */}
      <div className="absolute top-2 left-2 z-40">
        <button
          onClick={() => setShowAudioConfig((v) => !v)}
          className="border px-2 py-2 rounded bg-white shadow-sm hover:bg-gray-50"
          title="Audio settings"
        >
          <Settings2 className="h-4 w-4" />
        </button>

        {showAudioConfig && (
          <div className="mt-2 w-64 bg-white border rounded-lg p-3 shadow-md">
            <div className="text-sm font-semibold mb-2">Audio Settings</div>
            <div className="space-y-3 text-sm">
              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={speechEnabled}
                  onChange={() => setSpeechEnabled((v) => !v)}
                />
                Enable voice response
              </label>

              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={voiceFirstMode}
                  onChange={() => setVoiceFirstMode((v) => !v)}
                />
                Voice-first (send & reply by voice)
              </label>

              <label className="flex flex-col gap-1">
                Language
                <select
                  value={language}
                  onChange={(e) => setLanguage(e.target.value as 'en' | 'pt' | 'es')}
                  className="border rounded px-2 py-1"
                >
                  <option value="en">English</option>
                  <option value="pt">Portuguese</option>
                  <option value="es">Spanish</option>
                </select>
              </label>
            </div>
          </div>
        )}
      </div>

      {/* Overlay do Voice Mode */}
      <VoiceModeOverlay
        open={showVoiceMode}
        phase={voicePhase}
        onClose={() => {
          if (listening) stopRecording()
          setShowVoiceMode(false)
          setVoicePhase('idle')
        }}
        onToggleMic={toggleMicInOverlay}
        listening={listening}
        isSpeaking={isSpeaking}
        stopSpeaking={stopSpeaking}
      />

      {/* Histórico */}
      <div className="flex-1 overflow-y-auto px-6 py-8 space-y-4" ref={chatRef}>
        {messages.map((msg, i) => (
          <div
            key={i}
            className={`flex flex-col ${msg.role === 'user' ? 'items-end' : 'items-start'}`}
          >
            {msg.role === 'assistant' ? (
              msg.metadata?.type === 'chart' ? (
                <ChatChart metadata={msg.metadata} />
              ) : (
                <BotMessageWithCopy content={msg.content} />
              )
            ) : (
              <div className="rounded-lg px-4 py-2 text-sm whitespace-pre-wrap max-w-[85%] bg-primary text-white">
                {msg.content}
              </div>
            )}
          </div>
        ))}

        {thinking && !partialResponse && (
          <div className="flex flex-col items-start">
            <div className="rounded-lg px-4 py-2 text-sm bg-gray-100 text-gray-900 max-w-[85%] flex items-center gap-2">
              <Loader2 className="w-4 h-4 animate-spin" />
              <span>Thinking…</span>
            </div>
          </div>
        )}

        {thinking && partialResponse && (
          <div className="flex flex-col items-start">
            <div className="rounded-lg px-4 py-2 text-sm bg-gray-100 text-gray-900 max-w-[85%] flex items-center gap-2">
              <span>{partialResponse}</span>
              <Loader2 className="w-4 h-4 animate-spin" />
            </div>
          </div>
        )}
      </div>

      {isSpeaking && !showVoiceMode && (
        <div className="flex justify-center mb-2">
          <button
            onClick={stopSpeaking}
            className="p-2 bg-red-100 border border-red-300 rounded-full text-red-500 hover:bg-red-200 transition"
            title="Stop voice"
          >
            <VolumeX className="w-5 h-5" />
          </button>
        </div>
      )}

      <QuickPrompts onPrompt={handleQuickPrompt} isClient={user_type === 'client'} />

      {/* Barra inferior */}
      <div className="border-t p-4 pb-[calc(env(safe-area-inset-bottom)+12px)] flex items-center gap-3">
        {/* Mic abre overlay e já começa a escutar */}
        <button
          onClick={async () => {
            setShowVoiceMode(true)
            setVoicePhase('listening')
            await unlockAudioContext()
            startRecording()
          }}
          className="border rounded-full p-3 md:p-2.5 bg-white shadow-sm hover:bg-gray-50"
          title="Open Voice Mode"
        >
          <Mic className="h-6 w-6 md:h-5 md:w-5" />
        </button>

        {/* Input multiline */}
        <textarea
          className="flex-1 border px-3 py-2 rounded text-sm resize-none leading-5 min-h-[40px] max-h-36"
          placeholder="Ask your question... (Shift+Enter for new line)"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
              e.preventDefault()
              sendMessage()
            }
          }}
          rows={2}
          disabled={loading}
        />

        <button
          onClick={sendMessage}
          className="bg-primary text-white px-4 py-2 rounded text-sm disabled:opacity-60"
          disabled={loading}
        >
          {loading ? <Loader2 className="animate-spin h-4 w-4" /> : 'Ask'}
        </button>
      </div>
    </div>
  )
}