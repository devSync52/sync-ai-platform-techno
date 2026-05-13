/** @type {import('next').NextConfig} */
const nextConfig = {
  /* config options here */
  reactStrictMode: false,
  env: {
    NEXT_PUBLIC_API_URL: 'https://middleware-aws-api.teexponent.com'
  }
};

export default nextConfig;
