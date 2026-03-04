import type { Metadata } from 'next'
import { Open_Sans, Pacifico } from 'next/font/google'
import './globals.css'
import { SmoothScroll } from '@/components/SmoothScroll'
import { cn } from '@/lib/utils'
import { CinematicToastProvider } from '@/components/notifications/CinematicToastProvider'
import { PageTransitionLoader } from '@/components/PageTransitionLoader'
import { GlobalCelebrationProvider } from '@/components/GlobalCelebrationProvider'

const openSans = Open_Sans({
  subsets: ['latin'],
  variable: '--font-open-sans',
  display: 'swap',
})

const pacifico = Pacifico({
  weight: '400',
  subsets: ['latin'],
  variable: '--font-pacifico',
  display: 'swap',
})

export const metadata: Metadata = {
  title: 'ILLA Sorvetes | Premium & Divertido',
  description: 'Sorvetes artesanais com uma experiência leve, divertida e premium.',
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="pt-BR">
      <head>
        {/* PERF: Preconnect to known external domains to reduce connection setup time */}
        <link rel="dns-prefetch" href="https://fonts.googleapis.com" />
        <link rel="dns-prefetch" href="https://fonts.gstatic.com" />
        <link rel="preconnect" href="https://fonts.googleapis.com" crossOrigin="anonymous" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />

        {/* PERF: Preload hero first frame — starts downloading before JS even parses */}
        <link
          rel="preload"
          href="/hero/mobile/frames/hero-1-mobile_002.webp"
          as="image"
          type="image/webp"
          media="(max-width: 768px)"
        />
        <link
          rel="preload"
          href="/hero/desktop/frames/hero-1-desktop_002.webp"
          as="image"
          type="image/webp"
          media="(min-width: 769px)"
        />
      </head>
      <body
        className={cn(
          openSans.variable,
          pacifico.variable,
          'antialiased font-sans bg-white text-dark'
        )}
      >
        <PageTransitionLoader />
        <SmoothScroll>
          <CinematicToastProvider>
            <GlobalCelebrationProvider>
              {children}
            </GlobalCelebrationProvider>
          </CinematicToastProvider>
        </SmoothScroll>
      </body>
    </html>
  )
}
