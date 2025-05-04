'use client'

import { useState } from 'react'
import { Loader2 } from 'lucide-react'
import { useSupabaseClient } from '@supabase/auth-helpers-react'

const supabase = useSupabaseClient()

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('')
  const [status, setStatus] = useState<'idle' | 'sending' | 'sent' | 'error'>('idle')
  const [message, setMessage] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setStatus('sending')
    setMessage('')

    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/reset-password`
    })

    if (error) {
      setMessage(error.message)
      setStatus('error')
    } else {
      setStatus('sent')
      setMessage('Password reset link sent! Check your email.')
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-white to-gray-100 px-4">
      <div className="max-w-md w-full bg-white rounded-xl shadow-xl p-8 space-y-6">
        <div className="flex justify-center mb-2">
          <div className="h-14 w-14 bg-black rounded-full" />
        </div>
        <h1 className="text-2xl font-bold text-center text-gray-800">Forgot your password?</h1>
        <p className="text-sm text-center text-gray-500">We will send you a link to reset it.</p>

        <form onSubmit={handleSubmit} className="space-y-4">
          <input
            type="email"
            placeholder="Enter your email"
            className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-black"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
          <button
            type="submit"
            className="w-full bg-black text-white font-semibold py-2 px-4 rounded-lg hover:bg-gray-900 flex items-center justify-center"
            disabled={status === 'sending'}
          >
            {status === 'sending' ? <Loader2 className="animate-spin" size={18} /> : 'Send reset link'}
          </button>
          {message && <p className={`text-sm ${status === 'error' ? 'text-red-500' : 'text-green-600'}`}>{message}</p>}
        </form>
      </div>
    </div>
  )
}
