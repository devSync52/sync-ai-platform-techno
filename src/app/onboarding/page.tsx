'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useUser } from '@supabase/auth-helpers-react'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { useOnboarding } from '@/app/hooks/useOnboarding'

export default function OnboardingPage() {
  const user = useUser()
  const router = useRouter()
  const [name, setName] = useState('')
  const [taxId, setTaxId] = useState('')

  const { submit, loading, error } = useOnboarding(user?.id || null)

  useEffect(() => {
    if (!user) {
      router.push('/login')
    }
  }, [user, router])

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    submit(name, taxId)
  }

  return (
    <div className="max-w-md mx-auto mt-10 p-6 border rounded-xl bg-white shadow-lg space-y-4">
      <h1 className="text-2xl font-semibold text-center">Welcome to SynC</h1>
      <p className="text-sm text-muted-foreground text-center">Let's start by creating your companya</p>

      <form onSubmit={handleSubmit} className="space-y-4">
        <Input
          placeholder="Nome da empresa"
          value={name}
          onChange={(e) => setName(e.target.value)}
          required
        />
        <Input
          placeholder="Tax ID"
          value={taxId}
          onChange={(e) => setTaxId(e.target.value)}
          required
        />
        <Button type="submit" className="w-full" disabled={loading}>
          {loading ? 'Salvando...' : 'Continuar'}
        </Button>
        {error && <p className="text-sm text-red-500 text-center">{error}</p>}
      </form>
    </div>
  )
}