'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useSupabaseClient } from '@supabase/auth-helpers-react'
import { Loader2, Lock } from 'lucide-react'
import InputIcon from '@/components/ui/inputIcon'
import Image from 'next/image'
import Head from 'next/head'

export default function AcceptInvitePage() {
  const supabase = useSupabaseClient()
  const router = useRouter()

  const [accessToken, setAccessToken] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [message, setMessage] = useState('')
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)
  const [sessionReady, setSessionReady] = useState(false)

  useEffect(() => {
    if (!supabase) return
  
    const hash = window.location.hash
    const params = new URLSearchParams(hash.replace('#', ''))
    const access_token = params.get('access_token')
    const refresh_token = params.get('refresh_token')
  
    if (access_token && refresh_token) {
      setAccessToken(access_token)
      supabase.auth
        .setSession({ access_token, refresh_token })
        .then(({ error }) => {
          if (error) {
            console.error('Error setting session:', error)
            setMessage('❌ Failed to validate session.')
          } else {
            setSessionReady(true)
          }
        })
    } else {
      setMessage('❌ Missing or invalid link.')
    }
  }, [supabase])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setMessage('')
    setLoading(true)
    setSuccess(false)

    if (password.length < 8) {
      setMessage('❌ Password must be at least 8 characters.')
      setLoading(false)
      return
    }

    if (!/[A-Z]/.test(password)) {
      setMessage('❌ Password must contain at least one uppercase letter.')
      setLoading(false)
      return
    }

    if (!/[0-9]/.test(password)) {
      setMessage('❌ Password must contain at least one number.')
      setLoading(false)
      return
    }

    if (!/[!@#$%^&*(),.?":{}|<>]/.test(password)) {
      setMessage('❌ Password must contain at least one special character.')
      setLoading(false)
      return
    }

    if (password !== confirmPassword) {
      setMessage("❌ Passwords don't match.")
      setLoading(false)
      return
    }

    const { error: updateError } = await supabase.auth.updateUser({ password })

    if (updateError) {
      setMessage(`❌ ${updateError.message}`)
      setLoading(false)
      return
    }

    const { error: finalizeError } = await supabase.functions.invoke('finalize_invite', {
      body: { access_token: accessToken }
    })

    if (finalizeError) {
      setMessage('❌ Failed to finalize invitation.')
      setLoading(false)
      return
    }

    setSuccess(true)
    setMessage('✅ Account activated! Redirecting to login...')
    setTimeout(() => router.push('/login'), 2500)
    setLoading(false)
  }

  return (
    <>
      <Head>
        <title>Accept Invite | SynC AI</title>
      </Head>

      <div className="min-h-screen flex flex-col items-center justify-center px-4 py-8 bg-gradient-to-br from-primary to-primary text-gray-900">
        <div className="mb-6">
          <Image
            src="/sync-ai-plataform-logo.svg"
            alt="SynC AI Logo"
            width={250}
            height={81}
            priority
          />
        </div>

        <div className="w-full max-w-md bg-white rounded-2xl shadow-2xl p-8 space-y-6">
          <h1 className="text-2xl font-bold text-center text-primary">
            Welcome! Set your password
          </h1>

          {message && (
            <div
              className={`text-sm text-center px-4 py-2 rounded-md font-medium ${
                success
                  ? 'text-green-700 bg-green-100 border border-green-300'
                  : 'text-red-700 bg-red-100 border border-red-300'
              }`}
            >
              {message}
            </div>
          )}

          {!sessionReady ? (
            <p className="text-center text-sm">Validating your link...</p>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              <InputIcon
                icon={<Lock size={18} />}
                toggleVisibility
                placeholder="New password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
              <InputIcon
                icon={<Lock size={19} />}
                toggleVisibility
                placeholder="Confirm new password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
              />
              <button
                type="submit"
                className="w-full bg-primary text-white font-semibold py-2 px-4 rounded-lg hover:bg-primary/90 flex items-center justify-center"
                disabled={loading}
              >
                {loading ? <Loader2 className="animate-spin" size={18} /> : 'Activate Account'}
              </button>
            </form>
          )}
        </div>
      </div>
    </>
  )
}