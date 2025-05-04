'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Loader2, Mail, Lock } from 'lucide-react'
import { useSupabaseClient } from '@supabase/auth-helpers-react'
import Image from 'next/image'
import InputIcon from '@/components/ui/inputIcon'
import Head from 'next/head'
import Link from 'next/link'

export default function RegisterPage() {
  const supabase = useSupabaseClient()
  const router = useRouter()

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const hasMinLength = password.length >= 8
  const hasUppercase = /[A-Z]/.test(password)
  const hasSpecialChar = /[!@#$%^&*(),.?":{}|<>]/.test(password)

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    if (password !== confirmPassword) {
      setError('❌ Passwords do not match.')
      setLoading(false)
      return
    }

    if (!hasMinLength || !hasUppercase || !hasSpecialChar) {
      setError('❌ Password does not meet the security requirements.')
      setLoading(false)
      return
    }

    const { error: signUpError } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: `${location.origin}/onboarding`
      }
    })

    if (signUpError) {
      setError(`❌ ${signUpError.message}`)
    } else {
      router.push('/login?checkEmail=true')
    }

    setLoading(false)
  }

  return (
    <>
      <Head>
        <title>Register | SynC AI</title>
      </Head>

      <div className="min-h-screen flex flex-col items-center justify-center px-4 py-8 bg-gradient-to-br from-primary to-primary text-gray-900">
        <div className="mb-6">
          <Image src="/sync-ai-plataform-logo.svg" alt="SynC AI Logo" width={250} height={80} priority />
        </div>

        <div className="w-full max-w-md bg-white rounded-2xl shadow-2xl p-8 space-y-6">
          <h1 className="text-2xl font-bold text-center text-primary">Sign Up</h1>
          <p className="text-sm text-center text-gray-600">Create your account to get started</p>

          <form onSubmit={handleRegister} className="space-y-4">
            <InputIcon
              icon={<Mail size={18} />}
              type="email"
              placeholder="Email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />

            <InputIcon
              icon={<Lock size={18} />}
              toggleVisibility
              placeholder="Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />

            {password && (
              <ul className="text-xs text-gray-600 list-disc list-inside space-y-1">
                <li className={hasMinLength ? 'text-green-600' : ''}>At least 8 characters</li>
                <li className={hasUppercase ? 'text-green-600' : ''}>One uppercase letter</li>
                <li className={hasSpecialChar ? 'text-green-600' : ''}>One special character</li>
              </ul>
            )}

            <InputIcon
              icon={<Lock size={18} />}
              toggleVisibility
              placeholder="Confirm Password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              required
            />

            {error && (
              <div className="text-sm text-red-600 bg-red-100 border border-red-300 rounded-lg px-4 py-2 text-center font-medium">
                {error}
              </div>
            )}

            <button
              type="submit"
              className="w-full bg-primary text-white font-semibold py-2 px-4 rounded-lg hover:bg-primary/90 flex items-center justify-center"
              disabled={loading}
            >
              {loading ? <Loader2 className="animate-spin" size={18} /> : 'Create Account'}
            </button>
          </form>

          <p className="text-sm text-center text-gray-500">
            Already have an account?{' '}
            <Link href="/login" className="text-primary font-bold hover:underline">
              Log in
            </Link>
          </p>
        </div>
      </div>
    </>
  )
}