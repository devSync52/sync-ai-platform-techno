'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useSupabase } from '@/components/supabase-provider'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'

export default function AcceptInvitePage() {
  const router = useRouter()
  const supabase = useSupabase()

  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [tokenData, setTokenData] = useState<{
    access_token: string
    refresh_token: string
  } | null>(null)

  const [error, setError] = useState<string | null>(null)

  // 🔍 Extrai os tokens da URL com hash
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const hash = window.location.hash
      const params = new URLSearchParams(hash.substring(1))
      const access_token = params.get('access_token')
      const refresh_token = params.get('refresh_token')

      if (access_token && refresh_token) {
        setTokenData({ access_token, refresh_token })
      } else {
        setError('Invalid or expired invitation link.')
      }
    }
  }, [])

  const handleSubmit = async () => {
    if (!password || !tokenData) return

    setLoading(true)

    const { error: sessionError } = await supabase.auth.setSession({
      access_token: tokenData.access_token,
      refresh_token: tokenData.refresh_token,
    })

    if (sessionError) {
      setError('Failed to authenticate session.')
      setLoading(false)
      return
    }

    // 👇 Atualiza a senha
    const { error: pwError } = await supabase.auth.updateUser({
      password,
    })

    if (pwError) {
      setError('Failed to set password.')
      setLoading(false)
      return
    }

    // ✅ Marca convite como aceito
    const { error: finalizeError } = await supabase.functions.invoke('finalize_invite', {
      body: { access_token: tokenData.access_token },
    })

    if (finalizeError) {
      setError('Failed to finalize invitation.')
      setLoading(false)
      return
    }

    router.push('/login')
  }

  if (error) return <div className="p-6 text-red-600">{error}</div>
  if (!tokenData) return <div className="p-6">⏳ Loading...</div>

  return (
    <div className="p-6 max-w-md mx-auto">
      <h1 className="text-xl font-bold mb-4">Set your password</h1>
      <Input
        type="password"
        placeholder="New password"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
      />
      <Button className="mt-4 w-full" onClick={handleSubmit} disabled={loading}>
        {loading ? 'Saving...' : 'Save and continue'}
      </Button>
    </div>
  )
}