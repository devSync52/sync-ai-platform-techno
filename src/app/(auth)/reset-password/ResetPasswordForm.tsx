'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useSupabase } from '@/components/supabase-provider'
import InputIcon from '@/components/ui/inputIcon'
import { Lock, Loader2 } from 'lucide-react'

export default function ResetPasswordForm() {
  const supabase = useSupabase()
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)

  useEffect(() => {
    const hash = window.location.hash
    const params = new URLSearchParams(hash.replace('#', ''))
    const access_token = params.get('access_token')
    const refresh_token = params.get('refresh_token')

    if (access_token && refresh_token) {
      supabase.auth
        .setSession({ access_token, refresh_token })
        .then(() => setLoading(false))
        .catch(() => {
          setError('Failed to restore session.')
          setLoading(false)
        })
    } else {
      setError('Invalid recovery link.')
      setLoading(false)
    }
  }, [supabase])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    if (password !== confirmPassword) {
      setError('Passwords do not match.')
      return
    }

    setLoading(true)
    const { error: updateError } = await supabase.auth.updateUser({
      password,
    })

    if (updateError) {
      setError(updateError.message)
      setLoading(false)
      return
    }

    setSuccess(true)
    setTimeout(() => {
      router.push('/login')
    }, 3000)
  }

  if (loading) return <p className="text-center py-8">Validating recovery link...</p>

  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-4 py-8 bg-gradient-to-br from-primary to-primary text-gray-900">
      <div className="w-full max-w-md bg-white rounded-2xl shadow-2xl p-8 space-y-6">
        <h1 className="text-2xl font-bold text-center text-primary">Reset Password</h1>
        <p className="text-sm text-center text-gray-600">
          Enter your new password below.
        </p>

        {success ? (
          <div className="text-sm text-green-700 bg-green-100 border border-green-300 rounded-lg px-4 py-2 text-center font-medium">
            ✅ Password updated! Redirecting to login...
          </div>
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
              icon={<Lock size={18} />}
              toggleVisibility
              placeholder="Confirm new password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              required
            />
            {error && <p className="text-sm text-red-500 text-center">{error}</p>}
            <button
              type="submit"
              className="w-full bg-primary text-white font-semibold py-2 px-4 rounded-lg hover:bg-primary/90 flex items-center justify-center"
              disabled={loading}
            >
              {loading ? <Loader2 className="animate-spin" size={18} /> : 'Update Password'}
            </button>
          </form>
        )}
      </div>
    </div>
  )
}