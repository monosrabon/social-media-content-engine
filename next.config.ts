import type { NextConfig } from 'next';

// Derive the hostname from NEXT_PUBLIC_APP_URL for production
// Falls back to localhost:3000 for local development
const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
const appHost = appUrl.replace(/^https?:\/\//, ''); // strip protocol

const nextConfig: NextConfig = {
  experimental: {
    serverActions: {
      allowedOrigins: [
        'localhost:3000',
        appHost, // e.g. "your-app.vercel.app" in production
      ],
    },
  },
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '*.supabase.co',
      },
      {
        protocol: 'https',
        hostname: 'avatars.githubusercontent.com',
      },
      {
        protocol: 'https',
        hostname: 'lh3.googleusercontent.com',
      },
    ],
  },
};

export default nextConfig;

