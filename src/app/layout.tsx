import type { Metadata, Viewport } from 'next'
import { Bebas_Neue, Nunito } from 'next/font/google'
import './globals.css'
import { CartProvider } from '@/context/CartContext'
import { ThemeProvider } from '@/context/ThemeContext'
import BottomNav from '@/components/ui/BottomNav'
import Toaster from '@/components/ui/Toaster'
import PageTransition from '@/components/ui/PageTransition'

// ─── Google Fonts ─────────────────────────────────────────────────────────────
const bebasNeue = Bebas_Neue({
  weight: '400',
  subsets: ['latin'],
  variable: '--font-display',
  display: 'swap',
})

const nunito = Nunito({
  weight: ['400', '600', '700', '800', '900'],
  subsets: ['latin'],
  variable: '--font-body',
  display: 'swap',
})

// ─── Metadata ─────────────────────────────────────────────────────────────────
export const metadata: Metadata = {
  title: 'I KE TACOS – Birria y más',
  description: 'La mejor birria de la ciudad. Tacos, combos y quesabirrias para todos.',
  icons: { icon: '/favicon.ico' },
}

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  themeColor: '#F28500',
}

// ─── Root Layout ──────────────────────────────────────────────────────────────
export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es" data-theme="light" className={`${bebasNeue.variable} ${nunito.variable}`}>
      <head />
      <body>
        <ThemeProvider>
          <CartProvider>
            <div className="min-h-screen font-body" style={{ backgroundColor: 'var(--bg-primary)', color: 'var(--text-primary)' }}>
              <PageTransition>{children}</PageTransition>
              <BottomNav />
              <Toaster />
            </div>
          </CartProvider>
        </ThemeProvider>
      </body>
    </html>
  )
}
