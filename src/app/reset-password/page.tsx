'use client'

import { useEffect, useState } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import { Loader2, Lock } from 'lucide-react'
import { useSupabaseClient } from '@supabase/auth-helpers-react'
import Image from 'next/image'
import InputIcon from '@/components/ui/inputIcon'
import Link from 'next/link'
import Head from 'next/head'

export default function ResetPasswordPage() {
  const supabase = useSupabaseClient()
  const searchParams = useSearchParams()
  const router = useRouter()

  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [message, setMessage] = useState('')
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)

  const access_token = searchParams.get('access_token')

  useEffect(() => {
    const fragment = window.location.hash.substring(1)
    const params = new URLSearchParams(fragment)
    const token = params.get('access_token')
    const refresh_token = params.get('refresh_token')
  
    if (token && refresh_token) {
      supabase.auth.setSession({
        access_token: token,
        refresh_token: refresh_token,
      })
    }
  }, [])

  const handleReset = async (e: React.FormEvent) => {
    e.preventDefault()
    setMessage('')
    setLoading(true)
    setSuccess(false)

    if (!access_token) {
      setMessage('❌ Missing access token.')
      setLoading(false)
      return
    }

    if (password.length < 8) {
      setMessage('❌ Password must be at least 8 characters.')
      setLoading(false)
      return
    }

    if (password !== confirmPassword) {
      setMessage("❌ Passwords don't match.")
      setLoading(false)
      return
    }

    const { error } = await supabase.auth.updateUser({ password })

    if (error) {
      setMessage(`❌ ${error.message}`)
    } else {
      setSuccess(true)
      setMessage('✅ Password successfully updated! Redirecting...')
      setTimeout(() => router.push('/login'), 2500)
    }

    setLoading(false)
  }

  return (
    <>
      <Head>
        <title>Reset Password | SynC AI</title>
      </Head>

      <div className="min-h-screen flex flex-col items-center justify-center px-4 py-8 bg-gradient-to-br from-primary to-primary text-gray-900">
        <div className="mb-6">
          <Image src="/sync-ai-plataform-logo.svg" alt="SynC AI Logo" width={250} height={80} priority />
        </div>

        <div className="w-full max-w-md bg-white rounded-2xl shadow-2xl p-8 space-y-6">
          <h1 className="text-2xl font-bold text-center text-primary">Reset your password</h1>

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

          {!access_token ? (
            <div className="text-center text-sm">
              <Link href="/login" className="text-primary font-semibold hover:underline">
                ← Return to login
              </Link>
            </div>
          ) : (
            <form onSubmit={handleReset} className="space-y-4">
              <InputIcon
                icon={<Lock size={18} />}
                toggleVisibility
                placeholder="New password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
              <InputIcon
                icon={<Lock size={18} />}
                toggleVisibility
                placeholder="Confirm new password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
              />
              <button
                type="submit"
                className="w-full bg-primary text-white font-semibold py-2 px-4 rounded-lg hover:bg-primary/90 flex items-center justify-center"
                disabled={loading || !access_token}
              >
                {loading ? <Loader2 className="animate-spin" size={18} /> : 'Reset Password'}
              </button>
            </form>
          )}
        </div>
      </div>
    </>
  )
}