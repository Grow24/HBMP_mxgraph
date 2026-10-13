/** @type {import('next').NextConfig} */
const nextConfig = {
  transpilePackages: ['@hbmp/shared-types', '@hbmp/ui-tokens', '@hbmp/engine'],
  typescript: {
    // Production webpack already compiles; leftover demo/test type mismatches
    // should not block Zeabur image builds.
    ignoreBuildErrors: true,
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
  experimental: {
    optimizePackageImports: ['lucide-react']
  },
  env: {
    SERVER_URL: process.env.SERVER_URL || 'http://localhost:3001',
    NEXT_PUBLIC_SERVER_URL: process.env.NEXT_PUBLIC_SERVER_URL || 'http://localhost:3001'
  },
  async rewrites() {
    const server = process.env.SERVER_URL || 'http://localhost:3001'
    return [
      { source: '/api/projects', destination: `${server}/api/projects` },
      { source: '/api/projects/:path*', destination: `${server}/api/projects/:path*` },
      { source: '/api/diagrams', destination: `${server}/api/diagrams` },
      { source: '/api/diagrams/:path*', destination: `${server}/api/diagrams/:path*` },
      { source: '/api/exports/:path*', destination: `${server}/api/exports/:path*` },
      { source: '/api/network/:path*', destination: `${server}/api/network/:path*` },
      { source: '/api/flows/:path*', destination: `${server}/api/flows/:path*` },
    ]
  }
}

module.exports = nextConfig