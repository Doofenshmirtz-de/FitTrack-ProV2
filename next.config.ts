import type { NextConfig } from "next";
import _withPWA from "next-pwa";
const withPWA = _withPWA as (options: { dest: string; disable?: boolean; runtimeCaching?: unknown[] }) => (config: NextConfig) => NextConfig;
import createNextIntlPlugin from "next-intl/plugin";

const withNextIntl = createNextIntlPlugin('./i18n/request.ts');

const config: NextConfig = {
  reactStrictMode: true,
  images: {
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
      // CSP Headers for all routes
      {
        source: '/:path*',
        headers: [
          {
            key: 'Content-Security-Policy',
            value: "default-src 'self'; script-src 'self' 'unsafe-eval' 'unsafe-inline'; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; img-src 'self' https://*.supabase.co https://world.openfoodfacts.org data: blob:; connect-src 'self' https://*.supabase.co wss://*.supabase.co https://world.openfoodfacts.org https://generativelanguage.googleapis.com; font-src 'self' https://fonts.gstatic.com; frame-ancestors 'none'; base-uri 'self'; form-action 'self';"
          },
          {
            key: 'X-Frame-Options',
            value: 'DENY'
          },
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff'
          },
          {
            key: 'Referrer-Policy',
            value: 'strict-origin-when-cross-origin'
          },
          {
            key: 'Permissions-Policy',
            value: 'camera=(self), microphone=(self)'
          }
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

// Combine plugins: next-intl -> pwa
const withPlugins = withNextIntl(withPWAConfig(config));

export default withPlugins;
