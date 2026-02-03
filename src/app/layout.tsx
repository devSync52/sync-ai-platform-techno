import './globals.css'
import '@/styles/daypicker-custom.css'
import { Toaster } from 'sonner'

export const metadata = {
  metadataBase: new URL('https://app.syncaiplatform.com'),
  title: 'SynC AI Platform',
  description: 'AI-powered logistics and commerce intelligence.',
  openGraph: {
    title: 'SynC AI Platform',
    description: 'AI + Logistics + Intelligence = SynC AI Platform',
    url: 'https://app.syncaiplatform.com',
    siteName: 'SynC AI Platform',
    images: [
      {
        url: '/og-image.png',
        width: 1200,
        height: 630,
        alt: 'SynC AI',
      },
    ],
    locale: 'en_US',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'SynC AI Platform',
    description: 'AI + Logistics + Intelligence = SynC AI Platform',
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

          {children}

        <Toaster position="top-right" richColors />
      </body>
    </html>
  )
}