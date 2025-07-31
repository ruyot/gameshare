/** @type {import('next').NextConfig} */
const nextConfig = {
  // This is not actually a Next.js app, but Vercel expects this file
  // The actual server is Express.js with WebSocket signaling
  reactStrictMode: false,
  swcMinify: false,
  // Disable Next.js features we don't need
  experimental: {
    appDir: false,
  },
  // Don't build anything
  distDir: false,
  // Disable static optimization
  trailingSlash: false,
  // Disable image optimization
  images: {
    unoptimized: true,
  },
}

module.exports = nextConfig 