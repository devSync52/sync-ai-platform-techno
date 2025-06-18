'use client'

import { useEffect, useState } from 'react'
import { useSupabaseClient, useUser } from '@supabase/auth-helpers-react'
import { Card, CardContent } from '@/components/ui/card'
import { toast } from 'sonner'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Loader2 } from 'lucide-react'

export default function ProfileSettingsPage() {
  const supabase = useSupabaseClient()
  const user = useUser()

  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [phone, setPhone] = useState('')
  const [avatar, setAvatar] = useState('')
  const [password, setPassword] = useState('')

  useEffect(() => {
    if (!user) return

    setEmail(user.email || '')

    const fetchUserProfile = async () => {
      const { data, error } = await supabase
        .from('users')
        .select('*')
        .eq('id', user.id)
        .single()

      if (error || !data) return

      setName(data.name || '')
      setPhone(data.phone || '')
      setLoading(false)
    }

    fetchUserProfile()
  }, [supabase, user])

  const handleSave = async () => {
    if (!user) return
    setSaving(true)

    const { error } = await supabase
      .from('users')
      .update({ name, phone, avatar_url: avatar })
      .eq('id', user.id)

    if (error) {
      toast.error('Failed to update profile.')
      setSaving(false)
      return
    }

    if (password) {
      const { error: passError } = await supabase.auth.updateUser({ password })
      if (passError) {
        toast.error('Failed to update password.')
        setSaving(false)
        return
      }
    }

    toast.success('Profile updated!')
    setSaving(false)
  }

  return (
    <div className="max-w-2xl mx-auto p-6">
      <h1 className="text-xl sm:text-3xl font-bold text-primary mb-4 sm:mb-6">Profile Settings</h1>

      <Card className="border shadow-md rounded-2xl">
        <CardContent className="pt-6 space-y-6">
          <div>
            <label className="text-sm text-gray-700">Name</label>
            <Input value={name} onChange={(e) => setName(e.target.value)} />
          </div>
          <div>
            <label className="text-sm text-gray-700">Email</label>
            <Input value={email} disabled />
          </div>
          <div>
            <label className="text-sm text-gray-700">Phone</label>
            <Input value={phone} onChange={(e) => setPhone(e.target.value)} />
          </div>
          <div>
            <label className="text-sm text-gray-700">Photo URL</label>
            <Input value={avatar} onChange={(e) => setAvatar(e.target.value)} />
          </div>
          <div>
            <label className="text-sm text-gray-700">New Password</label>
            <Input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </div>

          <div className="pt-4 border-t">
            <Button
              onClick={handleSave}
              disabled={saving}
              className="px-6 bg-[#3f2d90] hover:bg-[#3f2d90]/90 text-white"
            >
              {saving ? <Loader2 className="animate-spin mr-2" size={18} /> : null}
              Save Profile
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}