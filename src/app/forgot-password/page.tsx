'use client'

import { useState } from 'react'
import { useSupabaseClient } from '@supabase/auth-helpers-react'
import { Loader2, Mail } from 'lucide-react'
import Image from 'next/image'
import Link from 'next/link'
import InputIcon from '@/components/ui/inputIcon'
import Head from 'next/head'

export default function ForgotPasswordPage() {
  const supabase = useSupabaseClient()
  const [email, setEmail] = useState('')
  const [message, setMessage] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleReset(e: React.FormEvent) {
    e.preventDefault()
    setMessage('')
    setLoading(true)

    if (!email.match(/^[^\s@]+@[^\s@]+\.[^\s@]+$/)) {
      setMessage('❌ Please enter a valid email.')
      setLoading(false)
      return
    }

    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${location.origin}/reset-password`,
    })

    if (error) {
      setMessage(`❌ ${error.message}`)
    } else {
      setMessage('✅ Check your email to reset your password.')
    }

    setLoading(false)
  }

  return (
    <>
      <Head>
        <title>Forgot Password | SynC AI</title>
      </Head>

      <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-primary to-primary px-4 py-8">
        <div className="mb-6">
          <Image src="/sync-ai-plataform-logo.svg" alt="SynC AI Logo" width={250} height={80} priority />
        </div>

        <div className="w-full max-w-md bg-white rounded-2xl shadow-2xl p-8 space-y-6">
          <h1 className="text-2xl font-bold text-center text-primary">Forgot Password</h1>
          <p className="text-sm text-center text-gray-600">We’ll send you a link to reset it</p>

          {message && (
            <div className="text-sm text-center px-4 py-2 rounded-md font-medium"
              style={{
                color: message.startsWith('✅') ? '#166534' : '#b91c1c',
                backgroundColor: message.startsWith('✅') ? '#dcfce7' : '#fee2e2',
                border: `1px solid ${message.startsWith('✅') ? '#bbf7d0' : '#fecaca'}`
              }}>
              {message}
            </div>
          )}

          <form onSubmit={handleReset} className="space-y-4">
            <InputIcon
              icon={<Mail size={18} />}
              type="email"
              placeholder="Your email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />

            <button
              type="submit"
              className="w-full bg-primary text-white font-semibold py-2 px-4 rounded-lg hover:bg-primary/90 flex items-center justify-center"
              disabled={loading || !email}
            >
              {loading ? <Loader2 className="animate-spin" size={18} /> : 'Send Reset Link'}
            </button>
          </form>

          <div className="text-sm text-center">
            <Link href="/login" className="text-primary hover:underline font-bold">
              ← Back to login
            </Link>
          </div>
        </div>
      </div>
    </>
  )
}