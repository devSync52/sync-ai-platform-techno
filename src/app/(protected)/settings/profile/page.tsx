'use client'

import { useEffect, useState } from 'react'
import { useSupabase, useSession } from '@/components/supabase-provider'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Loader2, User, MapPin, Shield } from 'lucide-react'
import { toast } from 'sonner'
import { PasswordRules } from '@/components/ui/passwordRules'
import { GenderSelect } from '@/components/ui/genderSelect'
import PhoneInput from 'react-phone-input-2'
import 'react-phone-input-2/lib/style.css'

export default function ProfileSettingsPage() {
  const supabase = useSupabase()
  const session = useSession()
  const user = session?.user

  const [activeTab, setActiveTab] = useState<'personal' | 'address' | 'security'>('personal')

  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [phone, setPhone] = useState('')
  const [gender, setGender] = useState('')
  const [avatar, setAvatar] = useState('')
  const [preview, setPreview] = useState('')  

  const [zip, setZip] = useState('')
  const [address, setAddress] = useState({
    address_line_1: '',
    city: '',
    state: '',
    country: ''
  })

  const [currentPassword, setCurrentPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const hasMinLength = newPassword.length >= 8
  const hasUppercase = /[A-Z]/.test(newPassword)
  const hasSpecialChar = /[!@#$%^&*(),.?":{}|<>]/.test(newPassword)

  useEffect(() => {
    if (!user) return
    setEmail(user.email || '')

    const load = async () => {
      const { data: u } = await supabase.from('users').select('name, phone').eq('id', user.id).single()
      const { data: d } = await supabase.from('user_details').select('*').eq('id', user.id).single()

      if (u) {
        setName(u.name || '')
        setPhone(u.phone || '')
      }

      if (d) {
        setGender(d.gender || '')
        setZip(d.postal_code || '')
        setAvatar(d.avatar_url || '')
        setAddress({
          address_line_1: d.address_line_1 || '',
          city: d.city || '',
          state: d.state || '',
          country: d.country || ''
        })
      }
    }

    load()
  }, [user])

  const handleSave = async () => {
    if (!user) return
    const { error: e1 } = await supabase.from('users').update({ name, phone }).eq('id', user.id)
    const { error: e2 } = await supabase.from('user_details').upsert({
      id: user.id,
      gender,
      postal_code: zip,
      ...address
    }, { onConflict: 'id' })

    if (newPassword) {
      if (newPassword !== confirmPassword) return toast.error('Passwords do not match')
      if (!hasMinLength || !hasUppercase || !hasSpecialChar) return toast.error('Weak password')
      const { error: e3 } = await supabase.auth.updateUser({ password: newPassword })
      if (e3) return toast.error('Failed to update password')
    }

    if (e1 || e2) return toast.error('Failed to save')
    toast.success('Profile saved')
  }

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file || !user) return
  
    const fileExt = file.name.split('.').pop()
    const fileName = `${user.id}-${Date.now()}.${fileExt}`
    const filePath = `users/${user.id}/${fileName}`
  
    const { error: uploadError } = await supabase.storage
      .from('avatars')
      .upload(filePath, file, { upsert: true })
  
    if (uploadError) {
      toast.error('Failed to upload avatar.')
      return
    }
  
    const { data } = supabase.storage.from('avatars').getPublicUrl(filePath)
    const publicUrl = data?.publicUrl
  
    if (!publicUrl) {
      toast.error('Could not get avatar URL.')
      return
    }
  
    const { error: updateError } = await supabase
      .from('user_details')
      .upsert({ id: user.id, avatar_url: publicUrl }, { onConflict: 'id' })
  
    if (updateError) {
      toast.error('Failed to update avatar in database.')
      return
    }
  
    setAvatar(publicUrl)
    setPreview(URL.createObjectURL(file))
    toast.success('Avatar updated successfully!')
  }

  return (
    <div className="flex flex-col md:flex-row min-h-screen">
      <aside className="w-full md:w-56 bg-white border-r shadow-sm py-6 px-4">
        <h2 className="text-xl font-bold mb-4">Profile</h2>
        <nav className="space-y-2">
          <button onClick={() => setActiveTab('personal')} className={`flex gap-2 items-center w-full px-3 py-2 rounded-md ${activeTab === 'personal' ? 'bg-accent text-accent-foreground' : 'hover:bg-accent/50 text-muted-foreground'}`}>
            <User className="w-4 h-4" /> Personal Data
          </button>
          <button onClick={() => setActiveTab('address')} className={`flex gap-2 items-center w-full px-3 py-2 rounded-md ${activeTab === 'address' ? 'bg-accent text-accent-foreground' : 'hover:bg-accent/50 text-muted-foreground'}`}>
            <MapPin className="w-4 h-4" /> Address
          </button>
          <button onClick={() => setActiveTab('security')} className={`flex gap-2 items-center w-full px-3 py-2 rounded-md ${activeTab === 'security' ? 'bg-accent text-accent-foreground' : 'hover:bg-accent/50 text-muted-foreground'}`}>
            <Shield className="w-4 h-4" /> Security
          </button>
        </nav>
      </aside>
  
      <main className="flex-1 p-6 space-y-6">
      {activeTab === 'personal' && (
        
        <div className="flex justify-start">
        <div className="w-full max-w-xl bg-white border rounded-xl p-6 shadow-sm space-y-6">
          <h1 className="text-xl font-semibold">Personal data</h1>
          <div className="space-y-4">
            <div className="relative">
              <img
                src={preview || avatar || '/default-avatar.png'}
                alt="Avatar"
                className="w-24 h-24 rounded-full object-cover border-2 border-gray-300"
              />
              <label htmlFor="avatar-upload" className="absolute bottom-0 right-0 bg-white p-1 rounded-full shadow cursor-pointer">
                
                <input
                  type="file"
                  id="avatar-upload"
                  accept="image/*"
                  onChange={handleAvatarUpload}
                  className="hidden"
                />
              </label>
            </div>

            <div className="flex gap-2">
              <button
                type="button"
                className="px-4 py-1 text-sm bg-primary text-white rounded hover:bg-primary/90"
                onClick={() => document.getElementById('avatar-upload')?.click()}
              >
                Upload New
              </button>
              <button
                type="button"
                className="px-4 py-1 text-sm bg-gray-200 text-gray-800 rounded hover:bg-gray-300"
                onClick={() => {
                  setAvatar('')
                  setPreview('')
                }}
              >
                Delete Avatar
              </button>
            </div>
          </div>

          <div className="mb-3">
            <label className="text-sm text-gray-700 mb-1 block">Name</label>
            <Input value={name} onChange={e => setName(e.target.value)} />
          </div>
          <div className="mb-3">
            <label className="text-sm text-gray-700 mb-1 block">Email</label>
            <Input value={email} disabled />
          </div>
          <div className="mb-3">
            <label className="text-sm text-gray-700 mb-1 block">Phone</label>
            <PhoneInput
  country={'us'}
  value={phone}
  onChange={(value) => setPhone(value)}
  inputClass="!w-full !h-10 !text-sm"
  containerClass="w-full"
  inputProps={{
    name: 'phone',
    required: true,
    autoFocus: false
  }}
/>
          </div>
          <div className="mb-3">
            <label className="text-sm text-gray-700 mb-1 block">Gender</label>
            <GenderSelect value={gender} onChange={setGender} />
          </div>
        </div>
        </div>
      )}

  
        {activeTab === 'address' && (
  <div className="flex justify-start">
  <div className="w-full max-w-xl bg-white border rounded-xl p-6 shadow-sm space-y-6">
    <h1 className="text-xl font-semibold">Address</h1>
    <div className="space-y-4">
            
              <label className="text-sm text-gray-700 mb-1 block">ZIP</label>
              <Input value={zip} onChange={e => setZip(e.target.value)} />
            </div>
            <div className="mb-3">
              <label className="text-sm text-gray-700 mb-1 block">Address</label>
              <Input value={address.address_line_1} onChange={e => setAddress({ ...address, address_line_1: e.target.value })} />
            </div>
            <div className="mb-3">
              <label className="text-sm text-gray-700 mb-1 block">City</label>
              <Input value={address.city} onChange={e => setAddress({ ...address, city: e.target.value })} />
            </div>
            <div className="mb-3">
              <label className="text-sm text-gray-700 mb-1 block">State</label>
              <Input value={address.state} onChange={e => setAddress({ ...address, state: e.target.value })} />
            </div>
            <div className="mb-3">
              <label className="text-sm text-gray-700 mb-1 block">Country</label>
              <Input value={address.country} onChange={e => setAddress({ ...address, country: e.target.value })} />
            </div>
          </div></div>
        )}
  
  {activeTab === 'security' && (
  <div className="flex justify-start">
    <div className="w-full max-w-xl bg-white border rounded-xl p-6 shadow-sm space-y-6">
      <h1 className="text-xl font-semibold">Security</h1>
      <div className="space-y-4">
        <div>
          <label className="text-sm text-gray-700 mb-1 block">Current Password</label>
          <Input type="password" value={currentPassword} onChange={e => setCurrentPassword(e.target.value)} />
        </div>
        <div>
          <label className="text-sm text-gray-700 mb-1 block">New Password</label>
          <Input type="password" value={newPassword} onChange={e => setNewPassword(e.target.value)} />
        </div>
        <div>
          <label className="text-sm text-gray-700 mb-1 block">Confirm Password</label>
          <Input type="password" value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)} />
        </div>
        <PasswordRules password={newPassword} />
      </div>
    </div>
  </div>
)}

  
        <Button onClick={handleSave} className="mt-4">
          <Loader2 className="w-4 h-4 mr-2 animate-spin hidden" /> Save Changes
        </Button>
      </main>
    </div>
  )
}
