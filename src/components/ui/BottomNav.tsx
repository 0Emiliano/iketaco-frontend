'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useCart } from '@/context/CartContext'

const navItems = [
  {
    href: '/',
    label: 'Inicio',
    icon: (active: boolean) => (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
        <path
          d="M3 9.5L12 3L21 9.5V20C21 20.5523 20.5523 21 20 21H15V15H9V21H4C3.44772 21 3 20.5523 3 20V9.5Z"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          fill={active ? 'currentColor' : 'none'}
          fillOpacity={active ? 0.2 : 0}
        />
      </svg>
    ),
  },
  {
    href: '/menu',
    label: 'Menú',
    icon: (active: boolean) => (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
        <rect
          x="3"
          y="5"
          width="18"
          height="2"
          rx="1"
          fill={active ? 'currentColor' : 'none'}
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
        />
        <rect
          x="3"
          y="11"
          width="18"
          height="2"
          rx="1"
          fill={active ? 'currentColor' : 'none'}
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
        />
        <rect
          x="3"
          y="17"
          width="18"
          height="2"
          rx="1"
          fill={active ? 'currentColor' : 'none'}
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
        />
      </svg>
    ),
  },
  {
    href: '/mis-pedidos',
    label: 'Mis Pedidos',
    icon: (active: boolean) => (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
        <path
          d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          fill={active ? 'currentColor' : 'none'}
          fillOpacity={active ? 0.15 : 0}
        />
        <rect
          x="9"
          y="3"
          width="6"
          height="4"
          rx="1"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          fill={active ? 'currentColor' : 'none'}
          fillOpacity={active ? 0.2 : 0}
        />
        <path d="M9 12h6M9 16h4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
      </svg>
    ),
  },
]

export default function BottomNav() {
  const pathname = usePathname()
  const { totalItems } = useCart()

  if (
    pathname === '/confirmacion' ||
    pathname.startsWith('/login') ||
    pathname.startsWith('/register') ||
    pathname.startsWith('/cocina')
  )
    return null

  return (
    <nav
      className="fixed bottom-0 left-0 right-0 z-50 max-w-lg mx-auto"
      style={{
        background: 'linear-gradient(to top, #0D0D0D 0%, rgba(13,13,13,0.97) 100%)',
        borderTop: '1px solid rgba(255,255,255,0.06)',
        backdropFilter: 'blur(20px)',
        WebkitBackdropFilter: 'blur(20px)',
      }}
    >
      <div className="flex items-center justify-around px-2 pb-safe">
        {navItems.map((item) => {
          const isActive = item.href === '/' ? pathname === '/' : pathname.startsWith(item.href)

          return (
            <Link
              key={item.href}
              href={item.href}
              className="relative flex flex-col items-center gap-1 py-3 px-5 rounded-xl transition-all duration-200 active:scale-90"
              style={{ color: isActive ? '#F28500' : '#6B7280' }}
            >
              {isActive && (
                <span
                  className="absolute top-1.5 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full"
                  style={{ background: '#F28500' }}
                />
              )}

              <span className="relative">{item.icon(isActive)}</span>

              <span
                className="text-xs font-bold tracking-wide transition-all"
                style={{
                  fontFamily: 'var(--font-body)',
                  fontWeight: isActive ? 800 : 600,
                }}
              >
                {item.label}
              </span>
            </Link>
          )
        })}
      </div>
    </nav>
  )
}
