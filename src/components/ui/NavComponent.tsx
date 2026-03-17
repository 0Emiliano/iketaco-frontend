'use client'

import Link from 'next/link'
import { useCart } from '@/context/CartContext'
import LogoIcon from './LogoIcon'

interface NavComponentProps {
  title?: string
}

export default function NavComponent({ title = 'I KE TACOS' }: NavComponentProps) {
  const { totalItems } = useCart()

  return (
    <header
      className="fixed top-0 left-0 right-0 z-50"
      style={{ backdropFilter: 'blur(20px)', WebkitBackdropFilter: 'blur(20px)' }}
    >
      <div
        className="flex items-center justify-between px-4 py-3 max-w-lg mx-auto"
        style={{ background: 'linear-gradient(135deg, #F28500 0%, #D4700A 100%)' }}
      >
        {/* Logo + Brand */}
        <Link href="/" className="flex items-center gap-2.5 group">
          <div
            className="w-10 h-10 rounded-xl flex items-center justify-center shadow-lg group-hover:scale-105 transition-transform"
            style={{ background: 'rgba(0,0,0,0.35)' }}
          >
            <LogoIcon size={30} />
          </div>
          <span
            className="text-white font-display tracking-wider text-xl"
            style={{ letterSpacing: '0.06em' }}
          >
            {title}
          </span>
        </Link>

        <Link
          href="/login"
          className="items-center rounded-xl px-3 py-2 text-xs font-bold uppercase tracking-wide text-white transition hover:bg-black/20"
          style={{ background: 'rgba(0,0,0,0.25)' }}
        >
          Iniciar sesión
        </Link>

        {/* Cart Icon */}
        <Link
          href="/cart"
          className="relative p-2.5 rounded-xl hover:bg-black/20 transition-colors"
          style={{ background: 'rgba(0,0,0,0.15)' }}
          aria-label={`Carrito - ${totalItems} productos`}
        >
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" className="text-white">
            <path
              d="M6 2L3 6v14a2 2 0 002 2h14a2 2 0 002-2V6l-3-4z"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              fill="rgba(255,255,255,0.15)"
            />
            <line
              x1="3"
              y1="6"
              x2="21"
              y2="6"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
            />
            <path
              d="M16 10a4 4 0 01-8 0"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
            />
          </svg>

          {/* Badge */}
          {totalItems > 0 && (
            <span
              className="absolute -top-1 -right-1 text-white text-xs font-black w-5 h-5 rounded-full flex items-center justify-center animate-scale-in"
              style={{ background: '#0A0A0A', fontSize: '10px' }}
            >
              {totalItems > 9 ? '9+' : totalItems}
            </span>
          )}
        </Link>
      </div>
    </header>
  )
}
