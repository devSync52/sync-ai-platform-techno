'use client'

import { useEffect, useRef, useState } from 'react'
import { motion } from 'framer-motion'
import { Expand, Loader2, Mic, MicOff, MoreHorizontal, Settings2, VolumeX, X } from 'lucide-react'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { useSyncAgent, ChatMessage } from '@/hooks/useSyncAgent'
import { QuickPrompts } from './QuickPrompts'
import { ChatChart } from './charts/chatChart'

const isIOS = typeof navigator !== 'undefined' && /iP(hone|ad|od)/.test(navigator.userAgent)
let sharedAC: AudioContext | null = null

async function unlockAudioContext() {
  try {
    const AC: typeof AudioContext = (window as any).AudioContext || (window as any).webkitAudioContext
    if (!AC) return

    if (!sharedAC) {
      sharedAC = new AC({ latencyHint: 'interactive' })
    }

    if (sharedAC.state != 'running') {
      await sharedAC.resume()
    }

    const frames = Math.max(1, sharedAC.sampleRate / 20)
    const buf = sharedAC.createBuffer(1, frames, sharedAC.sampleRate)
    const src = sharedAC.createBufferSource()
    src.buffer = buf
    src.connect(sharedAC.destination)
    src.start(0)
  } catch { }
}

function BotMessageWithCopy({ content }: { content: string }) {
  const [isExpanded, setIsExpanded] = useState(false)

  return (
    <>
      <div className="flex items-start max-w-full">
        <div className="relative rounded-lg px-4 py-2 pr-12 text-sm whitespace-pre-wrap max-w-[85%] overflow-x-auto bg-gray-100 text-gray-900">
          <button type="button" onClick={() => setIsExpanded(true)} className="absolute right-2 top-2 inline-flex h-7 w-7 items-center justify-center rounded-md text-gray-500 transition hover:bg-white hover:text-gray-700" title="Expand message" aria-label="Expand message">
            <Expand className="h-4 w-4" />
          </button>
          <div className="chat_box" dangerouslySetInnerHTML={{ __html: content }} />
        </div>
      </div>
      {isExpanded && (
        <Dialog open={isExpanded} onOpenChange={setIsExpanded}>
          <DialogContent className="w-[calc(100%-1.5rem)] max-w-5xl max-h-[85vh] overflow-hidden bg-white">
            <DialogHeader>
              <DialogTitle>Full Response</DialogTitle>
            </DialogHeader>
            <div
              className="overflow-auto rounded-lg border border-gray-200 bg-gray-50 p-4 text-sm text-gray-900 chat_box"
              style={{ maxHeight: 'calc(85vh - 6rem)' }}
              dangerouslySetInnerHTML={{ __html: content }}
            />
          </DialogContent>
        </Dialog>
      )}
    </>
  )
}

type VoicePhase = 'initial' | 'listening' | 'thinking' | 'streaming'

interface VoiceModeOverlayProps {
  open: boolean
  phase: VoicePhase
  onClose: () => void
  onToggleMic: () => void
  listening: boolean
  isSpeaking: boolean
  stopSpeaking: () => void
}

function VoiceModeOverlay({ open, phase, onClose, onToggleMic, listening, isSpeaking, stopSpeaking, }: VoiceModeOverlayProps) {
  if (!open) return null

  const isInitial = phase == 'initial', isListening = phase == 'listening', isThinking = phase == 'thinking', isStreaming = phase == 'streaming'

  const subtitle = isInitial ? 'Tap the mic to start' : isListening ? 'Listening...' : isThinking ? 'Thinking...' : 'Speaking...'
  const base = isStreaming ? '#7c3aed' : isListening ? '#3b82f6' : '#94a3b8'
  const soft = isStreaming ? '#c4b5fd' : isListening ? '#bfdbfe' : '#cbd5e1'

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

      <div className="flex flex-col items-center justify-center" style={{ minHeight: '62vh' }}>
        <div className="relative h-56 w-56 overflow-visible" key={`phase-${phase}`}>
          {(isListening || isStreaming) && [0, 1, 2].map((i) => (
            <motion.span
              key={i}
              className="absolute inset-0 rounded-full pointer-events-none"
              style={{ border: `2px solid ${soft}` }}
              animate={
                isStreaming
                  ? { scale: [1, 1.05, 1], opacity: [0.4, 0.9, 0.4] }
                  : { scale: [1, 1.18, 1.3], opacity: [0.6, 0.25, 0] }
              }
              transition={{
                duration: isStreaming ? 1.1 : 2.1,
                repeat: Infinity,
                delay: i * 0.22,
                ease: 'easeInOut',
              }}
            />
          ))}

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
            {isStreaming ? (
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
            ) : null}
          </div>

          <div className="text-sm text-gray-600">
            {subtitle}
          </div>
        </div>
      </div>

      <div className="absolute bottom-6 left-0 right-0 flex items-center justify-center gap-4">
        <button className="rounded-full bg-gray-100 p-4 hover:bg-gray-200" title="More">
          <MoreHorizontal className="h-5 w-5" />
        </button>

        <button onClick={onToggleMic} className={`rounded-full p-4 hover:opacity-90 ${listening ? 'bg-red-500 text-white' : 'bg-gray-100'}`} title={listening ? 'Stop recording' : 'Start recording'}>
          {listening ? <MicOff className="h-5 w-5" /> : <Mic className="h-5 w-5" />}
        </button>

        <button className="rounded-full bg-gray-100 p-4 hover:bg-gray-200" title="Close" onClick={handleClose}>
          <X className="h-5 w-5" />
        </button>
      </div>
    </div>
  )
}

interface AIExpertChatProps {
  user_id: string
  account_id: string
  user_type: 'owner' | 'client' | 'end_client'
  session_id: string
  apiUrl: string
}

export default function AIExpertChat({ user_id, account_id, user_type, session_id, apiUrl, }: AIExpertChatProps) {
  const [input, setInput] = useState('')
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [listening, setListening] = useState(false)
  const [speechEnabled, setSpeechEnabled] = useState(true)
  const [voiceFirstMode, setVoiceFirstMode] = useState(true)
  const [showAudioConfig, setShowAudioConfig] = useState(false)
  const [isSpeaking, setIsSpeaking] = useState(false)
  const [language, setLanguage] = useState<'en' | 'pt' | 'es'>('en')
  const [showVoiceMode, setShowVoiceMode] = useState(false)
  const [voicePhase, setVoicePhase] = useState<VoicePhase>('initial')

  const { askQuestion, loading, thinking, partialResponse, getHistory } = useSyncAgent(apiUrl)

  const chatRef = useRef<HTMLDivElement>(null)
  const recognitionRef = useRef<any>(null)
  const audioRef = useRef<HTMLAudioElement | null>(null)
  const audioUrlRef = useRef<string | null>(null)
  const showVoiceModeRef = useRef(false)
  const isSpeakingRef = useRef(false)

  const langMap = {
    en: 'en-US',
    pt: 'pt-BR',
    es: 'es-ES',
  } as const

  const resetVoicePhase = () => setVoicePhase('initial')
  const resumeListeningAfterSpeech = () => {
    setIsSpeaking(false)

    if (!showVoiceModeRef.current) {
      setListening(false)
      resetVoicePhase()
      return
    }

    setListening(true)
    setVoicePhase('listening')

    window.setTimeout(() => {
      if (showVoiceModeRef.current && !isSpeakingRef.current) {
        startRecording()
      }
    }, 250)
  }

  const stopSpeaking = () => {
    const currentAudio: any = audioRef.current

    try {
      if (currentAudio && currentAudio._mode === 'webaudio' && currentAudio._node) {
        try {
          currentAudio._node.stop()
          currentAudio._node.disconnect()
        } catch { }
      } else if (audioRef.current instanceof HTMLAudioElement) {
        try {
          currentAudio?._cleanup?.()
        } catch { }
        audioRef.current.pause()
        audioRef.current.currentTime = 0
      }
    } catch { }

    if (audioUrlRef.current) {
      URL.revokeObjectURL(audioUrlRef.current)
      audioUrlRef.current = null
    }

    audioRef.current = null
    setIsSpeaking(false)
    resetVoicePhase()
  }

  const speak = async (text: string) => {
    if (!speechEnabled || !text) return

    stopSpeaking()
    setIsSpeaking(true)
    setVoicePhase('streaming')

    try {
      const res = await fetch('/api/tts', {
        method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({
          text,
          locale: langMap[language],
          mode: 'conversational',
        }),
      })

      if (!res.ok) {
        throw new Error('Failed to fetch audio.')
      }

      const mime = res.headers.get('content-type') || 'audio/mpeg'
      const bufferedResponse = res.clone()

      const playWithMediaSource = async () => {
        const mimeType = mime.split(';')[0].trim()
        if (
          isIOS ||
          !res.body ||
          typeof window === 'undefined' ||
          typeof MediaSource === 'undefined' ||
          !MediaSource.isTypeSupported(mimeType)
        ) {
          throw new Error('MediaSource streaming is not supported for this response.')
        }

        const mediaSource = new MediaSource()
        const url = URL.createObjectURL(mediaSource)
        audioUrlRef.current = url

        const audio = new Audio(url)
        audio.setAttribute('playsinline', 'true')
        audio.preload = 'auto'
        audioRef.current = audio

        let sourceBuffer: SourceBuffer | null = null
        let reader: ReadableStreamDefaultReader<Uint8Array> | null = null
        let finished = false
        const queue: Uint8Array[] = []

        const cleanup = () => {
          try {
            reader?.cancel()
          } catch { }

          if (sourceBuffer) {
            sourceBuffer.removeEventListener('updateend', onUpdateEnd)
            sourceBuffer.removeEventListener('error', onSourceError)
          }

          audio.removeEventListener('ended', onEnded)
          audio.removeEventListener('error', onAudioError)
          audio.removeEventListener('playing', onPlaying)
          audio.removeEventListener('waiting', onWaiting)
          mediaSource.removeEventListener('sourceopen', onSourceOpen)

          if (audioUrlRef.current) {
            URL.revokeObjectURL(audioUrlRef.current)
            audioUrlRef.current = null
          }

          audioRef.current = null
        }

        const finalizeStream = () => {
          if (
            finished &&
            queue.length === 0 &&
            sourceBuffer &&
            !sourceBuffer.updating &&
            mediaSource.readyState === 'open'
          ) {
            try {
              mediaSource.endOfStream()
            } catch { }
          }
        }

        const pumpQueue = () => {
          if (!sourceBuffer || sourceBuffer.updating || queue.length === 0) {
            finalizeStream()
            return
          }

          sourceBuffer.appendBuffer(queue.shift()!)
        }

        const onUpdateEnd = () => {
          pumpQueue()
          finalizeStream()
        }

        const onSourceError = () => {
          cleanup()
          setIsSpeaking(false)
          resetVoicePhase()
        }

        const onEnded = () => {
          cleanup()
          resumeListeningAfterSpeech()
        }

        const onAudioError = () => {
          cleanup()
          setIsSpeaking(false)
          resetVoicePhase()
        }

        const onPlaying = () => setVoicePhase('streaming')
        const onWaiting = () => setVoicePhase('streaming')

        const onSourceOpen = async () => {
          try {
            sourceBuffer = mediaSource.addSourceBuffer(mimeType)
            sourceBuffer.mode = 'sequence'
            sourceBuffer.addEventListener('updateend', onUpdateEnd)
            sourceBuffer.addEventListener('error', onSourceError)

            reader = res.body!.getReader()

            while (true) {
              const { done, value } = await reader.read()
              if (done) {
                finished = true
                finalizeStream()
                break
              }

              if (value?.length) {
                queue.push(value)
                pumpQueue()
              }
            }
          } catch (error) {
            console.error('MediaSource streaming error:', error)
            onAudioError()
          }
        }

        audio.addEventListener('ended', onEnded)
        audio.addEventListener('error', onAudioError)
        audio.addEventListener('playing', onPlaying)
        audio.addEventListener('waiting', onWaiting)
          ; (audio as any)._cleanup = cleanup
        mediaSource.addEventListener('sourceopen', onSourceOpen)

        await audio.play()
      }

      try {
        await playWithMediaSource()
        return
      } catch (streamError) {
        console.warn('Falling back to buffered playback:', streamError)
      }

      const blob = await bufferedResponse.blob()
      if (!blob.size) {
        throw new Error('Received empty audio response.')
      }

      const playWithWebAudio = async () => {
        await unlockAudioContext()
        const ac = sharedAC
        if (!ac) {
          throw new Error('AudioContext is unavailable.')
        }

        const arr = await blob.arrayBuffer()
        const audioBuffer = await ac.decodeAudioData(arr)
        const src = ac.createBufferSource()
        src.buffer = audioBuffer
        src.connect(ac.destination)

          ; (audioRef as any).current = {
            _mode: 'webaudio',
            _node: src,
            _ctx: ac,
          }

        src.onended = () => {
          audioRef.current = null
          resumeListeningAfterSpeech()
        }

        src.start(0)
      }

      const preferWebAudio = isIOS || !/audio\/(mpeg|mp4)/i.test(mime)
      if (preferWebAudio) {
        await playWithWebAudio()
        return
      }

      const url = URL.createObjectURL(blob)
      audioUrlRef.current = url
      const audio = new Audio(url)
      audio.setAttribute('playsinline', 'true')
      audio.preload = 'auto'
      audioRef.current = audio

      const cleanup = () => {
        audio.removeEventListener('ended', onEnded)
        audio.removeEventListener('error', onError)
        audio.removeEventListener('waiting', onWaiting)
        audio.removeEventListener('playing', onPlaying)
        audio.removeEventListener('timeupdate', onTimeUpdate)

        if (audioUrlRef.current) {
          URL.revokeObjectURL(audioUrlRef.current)
          audioUrlRef.current = null
        }

        audioRef.current = null
      }

      const onEnded = () => {
        cleanup()
        resumeListeningAfterSpeech()
      }

      const onError = () => {
        cleanup()
        setIsSpeaking(false)
        resetVoicePhase()
      }

      const onWaiting = () => setVoicePhase('streaming')
      const onPlaying = () => setVoicePhase('streaming')
      const onTimeUpdate = () => {
        if (audio.currentTime > 0.05) {
          setVoicePhase('streaming')
        }
      }

      audio.addEventListener('ended', onEnded)
      audio.addEventListener('error', onError)
      audio.addEventListener('waiting', onWaiting)
      audio.addEventListener('playing', onPlaying)
      audio.addEventListener('timeupdate', onTimeUpdate)

      try {
        await audio.play()
      } catch (playError) {
        cleanup()
        await playWithWebAudio()
      }
    } catch (err) {
      console.error('TTS error:', err)
      setIsSpeaking(false)
      resetVoicePhase()
    }
  }

  const processQuestion = async (question: string, opts?: { speakBack?: boolean }) => {
    if (!question.trim() || loading) return

    setVoicePhase('thinking')

    const userMsg: ChatMessage = { role: 'user', content: question }
    setMessages((msgs) => [...msgs, userMsg])

    let aiMessage = ''
    await askQuestion(question, { userId: user_id, accountId: account_id, sessionId: session_id, userType: user_type, }, (partial) => { aiMessage = partial })

    setMessages((msgs) => [...msgs, { role: 'assistant', content: aiMessage }])

    if (opts?.speakBack) {
      await speak(aiMessage)
      return
    }

    resetVoicePhase()
  }

  const startRecording = () => {
    if (isSpeakingRef.current) stopSpeaking()

    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition

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
      await processQuestion(transcript, { speakBack: true })
    }

    recognition.onerror = () => {
      recognitionRef.current = null
      setListening(false)
      resetVoicePhase()
    }

    recognition.onend = () => {
      recognitionRef.current = null
      setListening(false)
      setVoicePhase((current) => (current == 'listening' ? 'initial' : current))
    }

    recognition.start()
    recognitionRef.current = recognition
    setListening(true)
    setVoicePhase('listening')
  }

  const stopRecording = () => {
    try {
      recognitionRef.current?.stop()
    } catch { }

    setListening(false)
    setVoicePhase((current) => (current === 'listening' ? 'initial' : current))
  }

  const toggleMicInOverlay = () => {
    if (listening) {
      stopRecording()
      return
    }

    startRecording()
  }

  const sendMessage = async () => {
    if (!input.trim() || loading) return

    const toSend = input
    setInput('')
    await processQuestion(toSend, { speakBack: false })
  }

  const handleQuickPrompt = (prompt: string) => setInput(prompt)

  useEffect(() => {
    showVoiceModeRef.current = showVoiceMode
  }, [showVoiceMode])

  useEffect(() => {
    isSpeakingRef.current = isSpeaking
  }, [isSpeaking])

  useEffect(() => {
    if (session_id) {
      getHistory(session_id).then(setMessages)
    }

    return () => {
      try {
        recognitionRef.current?.stop()
      } catch { }

      stopSpeaking()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [session_id])

  useEffect(() => {
    chatRef.current?.scrollTo({ top: chatRef.current.scrollHeight, behavior: 'smooth' })
  }, [messages, partialResponse])

  return (
    <div className="relative flex flex-col h-full">
      <div className="absolute top-2 left-2 z-40">
        <button onClick={() => setShowAudioConfig((v) => !v)} className="border px-2 py-2 rounded bg-white shadow-sm hover:bg-gray-50" title="Audio settings">
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
                <select value={language} onChange={(e) => setLanguage(e.target.value as 'en' | 'pt' | 'es')} className="border rounded px-2 py-1">
                  <option value="en">English</option>
                  <option value="pt">Portuguese</option>
                  <option value="es">Spanish</option>
                </select>
              </label>
            </div>
          </div>
        )}
      </div>

      <VoiceModeOverlay
        open={showVoiceMode}
        phase={voicePhase}
        onClose={() => {
          if (listening) stopRecording()
          setShowVoiceMode(false)
          resetVoicePhase()
        }}
        onToggleMic={toggleMicInOverlay}
        listening={listening}
        isSpeaking={isSpeaking}
        stopSpeaking={stopSpeaking}
      />

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
              <span>Thinking...</span>
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

      <div className="border-t p-4 pb-[calc(env(safe-area-inset-bottom)+12px)] flex items-center gap-3">
        <button
          onClick={async () => {
            setShowVoiceMode(true)
            setVoicePhase('initial')
            await unlockAudioContext()
            startRecording()
          }}
          className="border rounded-full p-3 md:p-2.5 bg-white shadow-sm hover:bg-gray-50"
          title="Open Voice Mode"
        >
          <Mic className="h-6 w-6 md:h-5 md:w-5" />
        </button>

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
