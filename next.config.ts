import type { NextConfig } from 'next'

const nextConfig: NextConfig = {
  turbopack: {},
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'umvefycoasglvvujmfmb.supabase.co',
      },
    ],
  },
}

export default nextConfig