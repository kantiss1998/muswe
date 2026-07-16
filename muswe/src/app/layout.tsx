import '@/lib/env'
import type { Metadata } from 'next'
import { Providers } from '@/shared/providers'
import { Analytics } from '@vercel/analytics/react'
import { SpeedInsights } from '@vercel/speed-insights/next'
import localFont from 'next/font/local'
import './globals.css'

const neueMontreal = localFont({
  src: [
    {
      path: '../fonts/NeueMontreal-Light.otf',
      weight: '300',
      style: 'normal',
    },
    {
      path: '../fonts/NeueMontreal-Regular.otf',
      weight: '400',
      style: 'normal',
    },
    {
      path: '../fonts/NeueMontreal-Medium.otf',
      weight: '500',
      style: 'normal',
    },
    {
      path: '../fonts/NeueMontreal-Bold.otf',
      weight: '700',
      style: 'normal',
    },
  ],
  variable: '--font-sans',
  display: 'swap',
})

const edensor = localFont({
  src: '../fonts/Edensor.otf',
  variable: '--font-heading',
  display: 'swap',
})

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_BASE_URL || 'https://www.muswe.com'),
  title: 'Muswe — Kerudung Motif Premium Indonesia',
  description:
    'Temukan koleksi busana muslim wanita premium, modern, dan elegan hanya di Muswe.',
  icons: {
    icon: '/logo/Regular.png',
  },
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>): React.JSX.Element {
  return (
    <html lang="id" className={`${neueMontreal.variable} ${edensor.variable} h-full antialiased`} suppressHydrationWarning>
      <body
        className="min-h-full flex flex-col font-sans bg-neutral-50 text-neutral-900 selection:bg-neutral-900 selection:text-white"
        suppressHydrationWarning
      >
        <Providers>{children}</Providers>

        {/* Phase 1: Vercel Web Analytics & Speed Insights */}
        <Analytics />
        <SpeedInsights />

        {/* TODO: Phase 2 & 3 - Google Analytics (GA4) & Google Tag Manager (GTM)
            Menunggu User membuat akun dan memberikan Measurement ID (G-XXXX) serta GTM ID (GTM-XXXX).
            Instalasi dilakukan menggunakan paket resmi @next/third-parties.
        */}
      </body>
    </html>
  )
}
