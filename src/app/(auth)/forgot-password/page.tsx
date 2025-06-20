'use client'

import { useState } from 'react'
import { Mail, Loader2 } from 'lucide-react'
import { useSupabase } from '@/components/supabase-provider'
import Link from 'next/link'
import Image from 'next/image'
import InputIcon from '@/components/ui/inputIcon'

export default function ForgotPasswordPage() {
  const supabase = useSupabase()

  const [email, setEmail] = useState('')
  const [message, setMessage] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setMessage('')

    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${location.origin}/reset-password`,
    })

    if (error) {
      setMessage(`❌ ${error.message}`)
    } else {
      setMessage('✅ Check your email for the reset link.')
    }

    setLoading(false)
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-4 py-8 bg-gradient-to-br from-primary to-primary text-gray-900">
      <div className="mb-6">
        <Image src="/sync-ai-plataform-logo.svg" alt="Logo" width={250} height={80} priority />
      </div>

      <div className="w-full max-w-md bg-white rounded-2xl shadow-2xl p-8 space-y-6">
        <h1 className="text-2xl font-bold text-center text-primary">Forgot Password</h1>
        <p className="text-sm text-center text-gray-600">
          Enter your email to receive a password reset link.
        </p>

        {message && (
          <div className="text-sm text-center px-4 py-2 rounded-md font-medium 
            ${
              message.startsWith('✅')
                ? 'text-green-700 bg-green-100 border border-green-300'
                : 'text-red-700 bg-red-100 border border-red-300'
            }">
            {message}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <InputIcon
            icon={<Mail size={18} />}
            type="email"
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />

          <button
            type="submit"
            className="w-full bg-primary text-white font-semibold py-2 px-4 rounded-lg hover:bg-primary/90 flex items-center justify-center"
            disabled={loading}
          >
            {loading ? <Loader2 className="animate-spin" size={18} /> : 'Send Reset Link'}
          </button>
        </form>

        <p className="text-sm text-center text-gray-500">
          Remembered your password?{' '}
          <Link href="/login" className="text-primary font-bold hover:underline">
            Log in
          </Link>
        </p>
      </div>
    </div>
  )
}