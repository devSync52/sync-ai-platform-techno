'use client'

import { useEffect, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Bot, ChevronDown, Settings, LogOut, User, SlidersHorizontal } from 'lucide-react'
import Image from 'next/image'

interface HeaderProps {
  title?: string
  user: {
    name: string
    email: string
    role?: string
    avatarLetter?: string
  }
}

function formatRoleLabel(role: string): string {
  const map: Record<string, string> = {
    superadmin: 'Super Admin',
    admin: 'Admin',
    'staff-admin': 'Staff Admin',
    'staff-user': 'Staff User',
    client: 'Client',
  }
  return map[role] || role
}

function getRoleColors(role: string): { bg: string; text: string } {
  switch (role) {
    case 'superadmin':
      return { bg: 'bg-red-100', text: 'text-red-600' }
    case 'admin':
      return { bg: 'bg-primary/20', text: 'text-primary' }
    case 'staff-admin':
      return { bg: 'bg-blue-100', text: 'text-blue-700' }
    case 'staff-user':
      return { bg: 'bg-gray-200', text: 'text-gray-700' }
    case 'client':
      return { bg: 'bg-green-100', text: 'text-green-700' }
    default:
      return { bg: 'bg-gray-100', text: 'text-gray-700' }
  }
}

export default function HeaderTopBar({ title = '', user }: HeaderProps) {
  const [showDropdown, setShowDropdown] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)
  const router = useRouter()

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setShowDropdown(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const roleColors = getRoleColors(user.role || '')

  const handleLogout = async () => {
    await fetch('/auth/logout', { method: 'POST' })
    router.push('/login')
  }

  return (
    <div className="hidden lg:flex items-center justify-between h-20 px-6 bg-white border-b shadow-sm relative">
      {/* Logo + título */}
      <div className="flex items-center gap-4">
        <h1 className="text-2xl font-bold text-gray-900"></h1>
      </div>

      {/* Ações */}
      <div className="flex items-center gap-4 relative" ref={dropdownRef}>
        {/* Botão Chat */}
        <button
          onClick={() => window.dispatchEvent(new Event('open-ai-widget'))}
          className="flex items-center gap-2 bg-[#3f2d90] hover:bg-[#3f2d90]/90 text-white px-4 py-2 rounded-lg text-base shadow transition"
        >
          <Bot className="w-6 h-6" />
          SynC AI Assistant
        </button>

        {/* Engrenagem */}
        <button
          onClick={() => setShowDropdown((prev) => !prev)}
          className="text-gray-500 hover:text-gray-700"
        >
          <Settings className="w-6 h-6" />
        </button>

        {/* Dropdown */}
        {showDropdown && (
          <div className="absolute right-[-20px] top-[50px] w-64 border rounded-xl shadow-lg z-50 animate-fade-in bg-white">
            <div className="flex flex-col items-center p-4 border-b">
              <div className="w-14 h-14 rounded-full bg-gray-200 flex items-center justify-center text-2xl font-bold text-gray-600">
                {user.avatarLetter || (user.name ? user.name.charAt(0).toUpperCase() : '?')}
              </div>
              <p className="font-medium mt-2">{user.name}</p>
              <p className="text-xs text-gray-500">{user.email}</p>
              {user.role && (
                <span
                  className={`mt-1 px-2 py-0.5 text-xs rounded-full font-medium ${roleColors.bg} ${roleColors.text}`}
                >
                  {formatRoleLabel(user.role)}
                </span>
              )}
            </div>
            <ul className="text-sm py-2">
              <li
                onClick={() => router.push('/settings/profile')}
                className="px-4 py-2 flex items-center gap-2 hover:bg-gray-100 cursor-pointer"
              >
                <User className="w-4 h-4" /> My profile
              </li>
              <li
                onClick={() => router.push('/settings/company')}
                className="px-4 py-2 flex items-center gap-2 hover:bg-gray-100 cursor-pointer"
              >
                <SlidersHorizontal className="w-4 h-4" /> Settings
              </li>
              <li
                onClick={handleLogout}
                className="px-4 py-2 flex items-center gap-2 hover:bg-gray-100 cursor-pointer text-red-600"
              >
                <LogOut className="w-4 h-4" /> Log out
              </li>
            </ul>
          </div>
        )}
      </div>
    </div>
  )
}