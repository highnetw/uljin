import type { NextConfig } from 'next'
const withPWA = require('next-pwa')({
  dest: 'public',
  disable: process.env.NODE_ENV === 'development',
})

const nextConfig: NextConfig = {
  images: {
    domains: ['umvefycoasglvvujmfmb.supabase.co'],
  },
}

module.exports = withPWA(nextConfig)