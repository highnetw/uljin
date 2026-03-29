import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import PinGuard from '@/components/PinGuard'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: '울진 모임',
  description: '울진 친목 모임',
  manifest: '/manifest.json',
  themeColor: '#3b82f6',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: '울진 모임',
  },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="ko">
      <head>
        <link rel="apple-touch-icon" href="/icons/icon-192x192.png" />
      </head>
      <body className={inter.className}>
        <PinGuard>
          <main className="max-w-lg mx-auto min-h-screen bg-white">
            {children}
          </main>
        </PinGuard>
      </body>
    </html>
  )
}