import type { NextConfig } from "next";
import withPWA from "next-pwa";

const config: NextConfig = {
  reactStrictMode: true,
  experimental: {
    ppr: true,
  },
  images: {
    domains: ['*.supabase.co', 'world.openfoodfacts.org'],
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '**.supabase.co',
      },
      {
        protocol: 'https',
        hostname: 'world.openfoodfacts.org',
      },
    ],
  },
  async headers() {
    return [
      {
        source: '/api/health/sync',
        headers: [
          { key: 'Access-Control-Allow-Origin', value: '*' },
          { key: 'Access-Control-Allow-Methods', value: 'POST, OPTIONS' },
          { key: 'Access-Control-Allow-Headers', value: 'Content-Type, Authorization' },
        ],
      },
    ];
  },
};

// PWA Configuration
const withPWAConfig = withPWA({
  dest: 'public',
  disable: process.env.NODE_ENV === 'development',
  runtimeCaching: [
    {
      urlPattern: /^https:\/\/world\.openfoodfacts\.org\/.*/i,
      handler: 'StaleWhileRevalidate',
      options: { cacheName: 'food-api', expiration: { maxAgeSeconds: 86400 } }
    },
    {
      urlPattern: /\/_next\/static\/.*/i,
      handler: 'CacheFirst',
    },
    {
      urlPattern: /\/api\/(food|workout|nutrition|health)\/.*/i,
      handler: 'NetworkFirst',
      options: { cacheName: 'app-api', expiration: { maxAgeSeconds: 300 } }
    },
  ],
});

export default withPWAConfig(config);
