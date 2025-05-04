'use client'

import { useEffect, useState } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import { Loader2 } from 'lucide-react'
import { useSupabaseClient } from '@supabase/auth-helpers-react'

const supabase = useSupabaseClient()

export default function ResetPasswordPage() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [message, setMessage] = useState('')
  const [loading, setLoading] = useState(false)

  const access_token = searchParams.get('access_token')

  useEffect(() => {
    if (!access_token) {
      setMessage('Missing access token.')
    }
  }, [access_token])

  const handleReset = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setMessage('')

    if (password !== confirmPassword) {
      setMessage("Passwords don't match")
      setLoading(false)
      return
    }

    const { error } = await supabase.auth.updateUser({ password })

    if (error) {
      setMessage(error.message)
    } else {
      setMessage('Password successfully updated! Redirecting...')
      setTimeout(() => router.push('/login'), 2000)
    }

    setLoading(false)
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-white to-gray-100 px-4">
      <div className="max-w-md w-full bg-white rounded-xl shadow-xl p-8 space-y-6">
        <div className="flex justify-center mb-2">
          <div className="h-14 w-14 bg-black rounded-full" />
        </div>
        <h1 className="text-2xl font-bold text-center text-gray-800">Reset your password</h1>

        <form onSubmit={handleReset} className="space-y-4">
          <input
            type="password"
            placeholder="New password"
            className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-black"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
          <input
            type="password"
            placeholder="Confirm new password"
            className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-black"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            required
          />
          <button
            type="submit"
            className="w-full bg-black text-white font-semibold py-2 px-4 rounded-lg hover:bg-gray-900 flex items-center justify-center"
            disabled={loading || !access_token}
          >
            {loading ? <Loader2 className="animate-spin" size={18} /> : 'Reset Password'}
          </button>
          {message && <p className="text-sm text-center text-gray-600">{message}</p>}
        </form>
      </div>
    </div>
  )
}
