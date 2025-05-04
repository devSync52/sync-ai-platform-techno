import './globals.css'
import { SupabaseProvider } from '@/components/supabase-provider'
import { Toaster } from 'sonner'

export const metadata = {
  title: 'SynC AI Platform',
  description:
    'AI-powered logistics and commerce intelligence. SynC Platform delivers smart insights and automation for modern fulfillment.',
  keywords: ['AI', 'SynC', 'Sellercloud', 'logistics', 'ecommerce', 'dashboard'],
  authors: [{ name: 'SynC AI Team' }],
  openGraph: {
    title: 'SynC AI Platform',
    description: 'Intelligence and automation for your logistics operation with true AI.',
    metadataBase: new URL('https://app.synccomusa.com'),
    siteName: 'SynC AI Platform',
    images: [
      {
        url: '/og-image.png',
        width: 1200,
        height: 630,
      },
    ],
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'SynC AI Platform',
    description: 'AI + Logistics + Intelligence = SynC IA Platform',
    images: ['/og-image.png'],
  },
  icons: {
    icon: '/favicon.png',
    apple: '/icon-180x180.png',
  },
}

export const viewport = {
  themeColor: '#3F2D90',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <link rel="manifest" href="/site.webmanifest" />
      </head>
      <body>
        <SupabaseProvider>
          {children}
        </SupabaseProvider>
        <Toaster position="top-right" richColors />
      </body>
    </html>
  )
}