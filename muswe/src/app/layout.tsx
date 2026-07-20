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
  metadataBase: new URL(process.env.NEXT_PUBLIC_APP_URL || 'https://muswedaily.com'),
  title: {
    default: 'Muswe — Kerudung Motif Premium Indonesia',
    template: '%s | Muswe',
  },
  description:
    'Temukan koleksi busana muslim wanita premium, modern, dan elegan hanya di Muswe.',
  keywords: ['muswe', 'kerudung motif', 'hijab premium', 'busana muslim wanita', 'fashion muslim', 'hijab elegan', 'scarf motif'],
  authors: [{ name: 'Muswe' }],
  creator: 'Muswe',
  publisher: 'Muswe',
  openGraph: {
    type: 'website',
    locale: 'id_ID',
    url: 'https://muswedaily.com',
    title: 'Muswe — Kerudung Motif Premium Indonesia',
    description: 'Temukan koleksi busana muslim wanita premium, modern, dan elegan hanya di Muswe.',
    siteName: 'Muswe',
    images: [
      {
        url: 'https://cdn.muswedaily.com/og-image.jpg', // Nanti Anda bisa mengganti URL gambar ini dengan gambar banner asli Muswe
        width: 1200,
        height: 630,
        alt: 'Muswe Premium Scarf',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Muswe — Kerudung Motif Premium Indonesia',
    description: 'Temukan koleksi busana muslim wanita premium, modern, dan elegan hanya di Muswe.',
    images: ['https://cdn.muswedaily.com/og-image.jpg'],
  },
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
