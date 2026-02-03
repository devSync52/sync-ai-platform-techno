'use client'

import { useState } from 'react'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import EditAvatarModal from '@/components/modals/EditAvatarModal'

export default function UserProfileForm() {
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [editAvatarOpen, setEditAvatarOpen] = useState(false)

  return (
    <form className="space-y-6">
      <div>
        <h2 className="text-xl font-semibold text-gray-900 mb-4">User Profile</h2>
        <div className="flex items-center gap-4">
          <img
            src="/default-avatar.png"
            alt="Avatar"
            className="w-16 h-16 rounded-full object-cover"
          />
          <Button type="button" variant="outline" onClick={() => setEditAvatarOpen(true)}>
            Edit Photo
          </Button>
        </div>
      </div>

      <div>
        <Label htmlFor="name">Name</Label>
        <Input id="name" value={name} onChange={(e) => setName(e.target.value)} />
      </div>

      <div>
        <Label htmlFor="email">Email</Label>
        <Input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} />
      </div>

      <Button type="submit" className="bg-[#3f2d90] text-white hover:bg-[#3f2d90]/90">
        Save Changes
      </Button>

      <EditAvatarModal
        open={editAvatarOpen}
        onClose={() => setEditAvatarOpen(false)}
        title="Edit Avatar"
      />
    </form>
  )
}
