import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'coin-images.coingecko.com',
      },
      {
        protocol: 'https',
        hostname: 'assets.coingecko.com',
      },
      {
        protocol: 'https',
        hostname: 'dd.dexscreener.com',
      },
      {
        protocol: 'https',
        hostname: 'cdn.dexscreener.com',
      },
    ],
  },
  async headers() {
    return [
      {
        // matching all API routes
        source: "/api/:path*",
        headers: [
          { key: "Access-Control-Allow-Credentials", value: "true" },
          { key: "Access-Control-Allow-Origin", value: "*" },
          { key: "Access-Control-Allow-Methods", value: "GET,DELETE,PATCH,POST,PUT,OPTIONS" },
          { key: "Access-Control-Allow-Headers", value: "X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version, Authorization, x-api-key" },
        ]
      },
      {
        // matching all routes for CORS
        source: "/:path*",
        headers: [
          { key: "Access-Control-Allow-Origin", value: "*" },
          { key: "Access-Control-Allow-Methods", value: "GET, POST, OPTIONS" },
          { key: "Access-Control-Allow-Headers", value: "Content-Type, Authorization, x-api-key" },
        ]
      }
    ]
  },
  async rewrites() {
    return [
      // Map root LangGraph paths to /api/terminal
      {
        source: '/assistants',
        destination: '/api/terminal/assistants',
      },
      {
        source: '/assistants/:path*',
        destination: '/api/terminal/assistants/:path*',
      },
      {
        source: '/threads',
        destination: '/api/terminal/threads',
      },
      {
        source: '/threads/:path*',
        destination: '/api/terminal/threads/:path*',
      },
      {
        source: '/runs',
        destination: '/api/terminal/runs',
      },
      {
        source: '/runs/:path*',
        destination: '/api/terminal/runs/:path*',
      },
      {
        source: '/stream',
        destination: '/api/terminal/stream',
      }
    ];
  }
};

export default nextConfig;
