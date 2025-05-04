'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Loader2 } from 'lucide-react'
import { useSupabaseClient } from '@supabase/auth-helpers-react'

const supabase = useSupabaseClient()

export default function RegisterPage() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const hasMinLength = password.length >= 8
  const hasUppercase = /[A-Z]/.test(password)
  const hasSpecialChar = /[!@#$%^&*(),.?":{}|<>]/.test(password)

  async function handleRegister(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError('')

    if (password !== confirmPassword) {
      setError('Passwords do not match.')
      setLoading(false)
      return
    }

    if (!hasMinLength || !hasUppercase || !hasSpecialChar) {
      setError('Password does not meet the security requirements.')
      setLoading(false)
      return
    }

    const { error: signUpError } = await supabase.auth.signUp({
      email,
      password
    })

    if (signUpError) {
      setError(signUpError.message)
      setLoading(false)
      return
    }

    router.push('/login?checkEmail=true')
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-white to-gray-100 px-4">
      <div className="max-w-md w-full bg-white rounded-xl shadow-xl p-8 space-y-6">
        <div className="flex justify-center mb-2">
          <div className="h-14 w-14 bg-black rounded-full" />
        </div>
        <h1 className="text-2xl font-bold text-center text-gray-800">Sign Up</h1>
        <p className="text-sm text-center text-gray-500">Create your account to get started</p>

        <form onSubmit={handleRegister} className="space-y-4">
          <input
            type="email"
            placeholder="Email"
            className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-black"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />

          <input
            type="password"
            placeholder="Password"
            className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-black"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />

          {password.length > 0 && (
            <ul className="text-xs text-gray-600 list-disc list-inside">
              <li className={hasMinLength ? 'text-green-600' : ''}>At least 8 characters</li>
              <li className={hasUppercase ? 'text-green-600' : ''}>At least one uppercase letter</li>
              <li className={hasSpecialChar ? 'text-green-600' : ''}>At least one special character</li>
            </ul>
          )}

          <input
            type="password"
            placeholder="Confirm Password"
            className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-black"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            required
          />

          {error && <p className="text-sm text-red-500 text-center">{error}</p>}

          <button
            type="submit"
            className="w-full bg-black text-white font-semibold py-2 px-4 rounded-lg hover:bg-gray-900 flex items-center justify-center"
            disabled={loading}
          >
            {loading ? <Loader2 className="animate-spin" size={18} /> : 'Sign Up'}
          </button>
        </form>
      </div>
    </div>
  )
}