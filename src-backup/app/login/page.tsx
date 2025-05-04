'use client'

import { useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { useSupabaseClient } from '@supabase/auth-helpers-react'
import { Loader2 } from 'lucide-react'
import Link from 'next/link'

export default function LoginPage() {
  const supabase = useSupabaseClient() // ✅ Aqui dentro está certo!
  const router = useRouter()
  const searchParams = useSearchParams()
  const showCheckEmail = searchParams.get('checkEmail') === 'true'

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError('')

    const { error } = await supabase.auth.signInWithPassword({ email, password })

    if (error) {
      setError(error.message)
    } else {
      router.refresh()
    }

    setLoading(false)
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-white to-gray-100 px-4">
      <div className="max-w-md w-full bg-white rounded-xl shadow-xl p-8 space-y-6">
        <div className="flex justify-center mb-2">
          
        </div>
        <h1 className="text-2xl font-bold text-center text-gray-800">Welcome back 👋</h1>
        <p className="text-sm text-center text-gray-500">Sign in to your SynC AI Platform account</p>

        {showCheckEmail && (
          <p className="text-green-600 text-sm text-center">
            📩 Check your email to confirm your account.
          </p>
        )}

        <form onSubmit={handleLogin} className="space-y-4">
          <input
            type="email"
            placeholder="Email"
            className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-black"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
          <input
            type="password"
            placeholder="Password"
            className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-black"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
          {error && <p className="text-sm text-red-500">{error}</p>}
          <button
            type="submit"
            className="w-full bg-black text-white font-semibold py-2 px-4 rounded-lg hover:bg-gray-900 flex items-center justify-center"
            disabled={loading}
          >
            {loading ? <Loader2 className="animate-spin" size={18} /> : 'Sign In'}
          </button>
        </form>

        <div className="text-sm flex flex-col items-center gap-2">
          <Link href="/forgot-password" className="text-blue-600 hover:underline">
            Forgot password?
          </Link>

          <p>
            Don’t have an account?{' '}
            <Link href="/register" className="text-blue-600 hover:underline font-medium">
              Sign up
            </Link>
          </p>
        </div>
      </div>
    </div>
  )
}