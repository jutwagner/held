/** @type {import('next').NextConfig} */
const nextConfig = {
  // Use dev server but with proper native app configuration
  compress: true,
  poweredByHeader: false,
  generateEtags: true,
  images: {
    unoptimized: false, // Enable Next.js image optimization
    formats: ['image/webp', 'image/avif'],
    deviceSizes: [640, 750, 828, 1080, 1200, 1920, 2048, 3840],
    imageSizes: [16, 32, 48, 64, 96, 128, 256, 384],
    minimumCacheTTL: 60 * 60 * 24 * 30, // 30 days
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'firebasestorage.googleapis.com',
      },
      {
        protocol: 'https',
        hostname: 'lh3.googleusercontent.com',
      },
      {
        protocol: 'https',
        hostname: 'lh4.googleusercontent.com',
      },
      {
        protocol: 'https',
        hostname: 'lh5.googleusercontent.com',
      },
      {
        protocol: 'https',
        hostname: 'lh6.googleusercontent.com',
      },
      {
        protocol: 'https',
        hostname: 'images.unsplash.com',
      },
    ],
  },
  webpack: (config, { isServer }) => {
    // Fix Firebase module resolution issues
    if (!isServer) {
      config.resolve.fallback = {
        ...config.resolve.fallback,
        fs: false,
        net: false,
        tls: false,
      };
    }
    return config;
  },
  async rewrites() {
    const authDomain = process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN || process.env.FIREBASE_AUTH_DOMAIN;
    const proxyDomain =
      process.env.NEXT_PUBLIC_FIREBASE_AUTH_PROXY_DOMAIN ||
      process.env.FIREBASE_AUTH_PROXY_DOMAIN ||
      authDomain;

    if (!proxyDomain) {
      return [];
    }

    return [
      {
        source: '/__/firebase/init.json',
        destination: `https://${proxyDomain}/__/firebase/init.json`,
      },
      {
        source: '/__/auth/:path*',
        destination: `https://${proxyDomain}/__/auth/:path*`,
      },
    ];
  },
};

module.exports = nextConfig;
