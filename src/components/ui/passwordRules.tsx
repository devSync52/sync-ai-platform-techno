'use client'

interface PasswordRulesProps {
  password: string
}

export function PasswordRules({ password }: PasswordRulesProps) {
  const hasMinLength = password.length >= 8
  const hasUppercase = /[A-Z]/.test(password)
  const hasSpecialChar = /[!@#$%^&*(),.?":{}|<>]/.test(password)

  return (
    <ul className="text-xs text-gray-600 list-disc list-inside space-y-1">
      <li className={hasMinLength ? 'text-green-600' : ''}>At least 8 characters</li>
      <li className={hasUppercase ? 'text-green-600' : ''}>One uppercase letter</li>
      <li className={hasSpecialChar ? 'text-green-600' : ''}>One special character</li>
    </ul>
  )
}