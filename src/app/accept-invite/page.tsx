'use client'

import { useEffect, useState, useTransition } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { acceptInviteAction } from '@/actions/acceptInviteAction'
import { toast } from 'sonner'

export default function AcceptInvitePage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const token = searchParams.get('token')

  const [email, setEmail] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)

  const [isPending, startTransition] = useTransition()

  useEffect(() => {
    async function fetchInvitation() {
      if (!token) {
        setError('Invalid or missing token.')
        setLoading(false)
        return
      }

      try {
        const res = await fetch(`/api/validate-invite?token=${token}`)
        const data = await res.json()

        if (data.success) {
          setEmail(data.email)
        } else {
          setError(data.message)
        }
      } catch (err) {
        console.error('Error validating invite:', err)
        setError('Unexpected error.')
      } finally {
        setLoading(false)
      }
    }

    fetchInvitation()
  }, [token])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!token || !password) {
      toast.error('Missing fields.')
      return
    }

    startTransition(async () => {
      const result = await acceptInviteAction({ token, password })

      if (result.success) {
        toast.success('Account created successfully!')
        router.push('/dashboard')
      } else {
        toast.error(result.message)
      }
    })
  }

  if (loading) {
    return <div className="flex justify-center items-center h-screen">Loading...</div>
  }

  if (error) {
    return <div className="flex justify-center items-center h-screen text-red-600">{error}</div>
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 p-6">
      <div className="bg-white shadow-md rounded-lg p-8 w-full max-w-md">
        <h1 className="text-2xl font-bold mb-6 text-center">Accept Invitation</h1>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-gray-700 text-sm font-semibold mb-2">Email</label>
            <input
              type="email"
              value={email || ''}
              disabled
              className="w-full px-4 py-2 border rounded-lg bg-gray-100 cursor-not-allowed text-sm"
            />
          </div>

          <div>
            <label className="block text-gray-700 text-sm font-semibold mb-2">Password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Create your password"
              className="w-full px-4 py-2 border rounded-lg text-sm"
              required
              minLength={6}
            />
          </div>

          <button
            type="submit"
            disabled={isPending}
            className="w-full py-2 px-4 bg-primary hover:bg-primary/80 text-white rounded-lg text-sm"
          >
            {isPending ? 'Creating...' : 'Create Account'}
          </button>
        </form>
      </div>
    </div>
  )
}