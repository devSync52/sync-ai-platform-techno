import path from 'path'
import { fileURLToPath } from 'url'
import { dirname } from 'path'
import withPWA from 'next-pwa'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

const baseConfig = {
  experimental: {
    turbo: false,
  },
  webpack(config) {
    config.resolve.alias['@'] = path.resolve(__dirname, 'src')
    return config
  },
}

export default withPWA({
  dest: 'public',
  register: true,
  skipWaiting: true,
  disable: process.env.NODE_ENV === 'development',
})(baseConfig)