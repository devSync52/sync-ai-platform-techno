'use client'

import { Eye, EyeOff } from 'lucide-react'
import { InputHTMLAttributes, ReactNode, useState } from 'react'

interface InputIconProps extends InputHTMLAttributes<HTMLInputElement> {
  icon: ReactNode
  toggleVisibility?: boolean
}

export default function InputIcon({
  icon,
  toggleVisibility = false,
  type,
  ...rest
}: InputIconProps) {
  const [visible, setVisible] = useState(false)

  const inputType = toggleVisibility
    ? visible
      ? 'text'
      : 'password'
    : type || 'text'

  return (
    <div className="relative">
      <span className="absolute left-3 top-2.5 text-gray-400">
        {icon}
      </span>
      <input
        {...rest}
        type={inputType}
        className="w-full pl-10 pr-10 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/50"
      />
      {toggleVisibility && (
        <button
          type="button"
          onClick={() => setVisible((prev) => !prev)}
          className="absolute right-3 top-2.5 text-gray-400 hover:text-gray-600"
        >
          {visible ? <EyeOff size={18} /> : <Eye size={18} />}
        </button>
      )}
    </div>
  )
}