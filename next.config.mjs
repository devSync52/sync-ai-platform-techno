import path from 'path'
import { fileURLToPath } from 'url'
import { dirname } from 'path'
import withPWA from 'next-pwa'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

const baseConfig = {
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: true,
  },
  images: {
    domains: ['euzjrgnyzfgldubqglba.supabase.co'],
  },
  async headers() {
    return [
      {
        source: '/site.webmanifest',
        headers: [
          {
            key: 'Content-Type',
            value: 'application/manifest+json',
          },
        ],
      },
    ]
  },
  serverExternalPackages: ['@napi-rs/canvas'],
  webpack(config) {
    config.resolve.alias['@'] = path.resolve(__dirname, 'src')
    return config
  },
}

export default withPWA({
  dest: 'public',
  register: true,
  skipWaiting: true,
  disable: process.env.NODE_ENV === "development",
})(baseConfig)
