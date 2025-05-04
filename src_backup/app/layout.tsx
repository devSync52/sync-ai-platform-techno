// src/app/layout.tsx
import './globals.css'
import { SupabaseProvider } from '@/components/supabase-provider'
import { Toaster } from '@/components/ui/toaster'

export const metadata = {
  title: 'Sync AI',
  description: 'Description here',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <SupabaseProvider>
          {children}
        </SupabaseProvider>
        <Toaster />
      </body>
    </html>
  )
}