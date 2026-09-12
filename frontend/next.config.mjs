/** @type {import('next').NextConfig} */
const nextConfig = {
  // Remove Tailwind — using vanilla CSS
  images: {
    remotePatterns: [
      { protocol: 'https', hostname: '**' },
    ],
  },
  env: {
    NEXT_PUBLIC_API_URL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api/v1',
    NEXT_PUBLIC_APP_NAME: 'Salon Pro',
  },
};

export default nextConfig;
