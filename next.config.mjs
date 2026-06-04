/** @type {import('next').NextConfig} */
const nextConfig = {
  /* config options here */
  reactStrictMode: false,
  env: {
    NEXT_PUBLIC_API_URL: 'https://middleware-aws-api.teexponent.com',
    NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY: 'pk_test_51TeE0lAZKhDI7yL5aB8igSLeJCEtgTk9G8Fg58153HHO78s3vUdtCdSAIm4dj0yjrGQvtTg2pAmi9hsLmWF0plTc00A5JoGz3y',
    NEXT_STRIPE_SECRET_KEY: 'pk_test_51TeE0lAZKhDI7yL5aB8igSLeJCEtgTk9G8Fg58153HHO78s3vUdtCdSAIm4dj0yjrGQvtTg2pAmi9hsLmWF0plTc00A5JoGz3y'
  }
};

export default nextConfig;
