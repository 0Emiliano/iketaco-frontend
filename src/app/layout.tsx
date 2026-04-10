import type { Metadata, Viewport } from 'next'
import { Bebas_Neue, Nunito } from 'next/font/google'
import './globals.css'
import { CartProvider } from '@/context/CartContext'
import BottomNav from '@/components/ui/BottomNav'
import Toaster from '@/components/ui/Toaster'

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
    <html lang="es" className={`${bebasNeue.variable} ${nunito.variable}`}>
      <body>
        <CartProvider>
          <div className="min-h-screen bg-[#0A0A0A] font-body">
            {children}
            <BottomNav />
            <Toaster />
          </div>
        </CartProvider>
      </body>
    </html>
  )
}
