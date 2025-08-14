import { useState, useEffect, useRef } from 'react'
import { useSyncAgent, ChatMessage } from '@/hooks/useSyncAgent'
import { Loader2, Mic, MicOff, Settings2, X, Volume2, VolumeX } from 'lucide-react'
import { QuickPrompts } from './QuickPrompts'
import { ChatChart } from './charts/chatChart'

function BotMessageWithCopy({ content }: { content: string }) {
  return (
    <div className="flex items-center">
      <div className="rounded-lg px-4 py-2 text-sm whitespace-pre-wrap max-w-[85%] bg-gray-100 text-gray-900">
        {content}
      </div>
    </div>
  )
}

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
  const [showAudioConfig, setShowAudioConfig] = useState(false)
  const [isSpeaking, setIsSpeaking] = useState(false)
  const [language, setLanguage] = useState<'en' | 'pt' | 'es'>('en')

  const { askQuestion, loading, thinking, partialResponse, getHistory } = useSyncAgent(apiUrl)

  const chatRef = useRef<HTMLDivElement>(null)
  const recognitionRef = useRef<any>(null)

  const langMap = {
    en: 'en-US',
    pt: 'pt-BR',
    es: 'es-ES',
  }

  // Speech-to-Text
  const toggleListening = () => {
    if (listening) {
      recognitionRef.current?.stop()
      setListening(false)
    } else {
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

      recognition.onresult = (event: any) => {
        const transcript = event.results[0][0].transcript
        setInput(transcript)
        setListening(false)
      }

      recognition.onerror = () => setListening(false)
      recognition.onend = () => setListening(false)

      recognition.start()
      recognitionRef.current = recognition
      setListening(true)
    }
  }

  // Text-to-Speech
  const speak = async (text: string) => {
    if (!speechEnabled || !text) return
    setIsSpeaking(true)
    try {
      const response = await fetch('/api/tts', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ text }),
      })

      if (!response.ok) throw new Error('Failed to fetch audio.')

      const blob = await response.blob()
      const audio = new Audio(URL.createObjectURL(blob))
      audio.onended = () => setIsSpeaking(false)
      audio.onerror = () => setIsSpeaking(false)
      audio.play()
    } catch (err) {
      console.error('🛑 ElevenLabs error:', err)
      setIsSpeaking(false)
    }
  }

  const stopSpeaking = () => {
    speechSynthesis.cancel()
    setIsSpeaking(false)
  }

  const handleQuickPrompt = (prompt: string) => setInput(prompt)

  useEffect(() => {
    if (session_id) {
      getHistory(session_id).then(setMessages)
    }
  }, [session_id, getHistory])

  useEffect(() => {
    chatRef.current?.scrollTo({ top: chatRef.current.scrollHeight, behavior: 'smooth' })
  }, [messages, partialResponse])

  const sendMessage = async () => {
    if (!input.trim() || loading) return
    const userMsg: ChatMessage = { role: 'user', content: input }
    setMessages((msgs) => [...msgs, userMsg])
    setInput('')

    let aiMessage = ''
    await askQuestion(
      input,
      { userId: user_id, accountId: account_id, sessionId: session_id, userType: user_type },
      (partial) => {
        aiMessage = partial
      }
    )
    setMessages((msgs) => [...msgs, { role: 'assistant', content: aiMessage }])
    speak(aiMessage)
  }

  return (
    <div className="flex flex-col h-full">
      <div className="flex-1 overflow-y-auto px-6 py-4 space-y-4" ref={chatRef}>
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

      {isSpeaking && (
        <div className="flex justify-center mb-2">
          <button
            onClick={stopSpeaking}
            className="px-6 py-2 border rounded-full text-sm text-primary border-primary"
          >
            ⏹ Stop Response
          </button>
        </div>
      )}

      <QuickPrompts onPrompt={handleQuickPrompt} isClient={user_type === 'client'} />

      <div className="border-t p-4 flex items-center gap-2">
        <button
          onClick={toggleListening}
          className={`border px-2 py-2 rounded ${listening ? 'bg-red-500 text-white' : ''}`}
          title={listening ? 'Stop voice input' : 'Start voice input'}
        >
          {listening ? <MicOff className="h-4 w-4" /> : <Mic className="h-4 w-4" />}
        </button>
        <button
          onClick={() => setShowAudioConfig(true)}
          className="border px-2 py-2 rounded"
          title="Audio settings"
        >
          <Settings2 className="h-4 w-4"/>
          
        </button>
        <input
          className="flex-1 border px-3 py-2 rounded text-sm"
          placeholder="Ask your question..."
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') sendMessage()
          }}
          disabled={loading}
        />

        <button
          onClick={sendMessage}
          className="bg-primary text-white px-4 py-2 rounded text-sm"
          disabled={loading}
        >
          {loading ? <Loader2 className="animate-spin h-4 w-4" /> : 'Ask'}
        </button>
      </div>

      {showAudioConfig && (
        <div className="fixed bottom-4 left-1/2 transform -translate-x-1/2 bg-white border rounded-lg p-4 shadow-md z-50">
          <div className="flex justify-between items-center mb-2">
            <h2 className="text-sm font-semibold">Audio Settings</h2>
            <button onClick={() => setShowAudioConfig(false)}>
              <X className="h-4 w-4" />
            </button>
          </div>
          <div className="space-y-2">
            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={speechEnabled}
                onChange={() => setSpeechEnabled(!speechEnabled)}
              />
              Enable voice response
            </label>
            <label className="flex flex-col gap-1 text-sm">
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
  )
}