import type { Metadata } from 'next'
import { Open_Sans, Pacifico } from 'next/font/google'
import './globals.css'
import { SmoothScroll } from '@/components/SmoothScroll'
import { cn } from '@/lib/utils'
import { CinematicToastProvider } from '@/components/notifications/CinematicToastProvider'
import { PageTransitionLoader } from '@/components/PageTransitionLoader'

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
            {children}
          </CinematicToastProvider>
        </SmoothScroll>
      </body>
    </html>
  )
}
