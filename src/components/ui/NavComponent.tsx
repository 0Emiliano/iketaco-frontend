'use client'

import Link from 'next/link'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useCart } from '@/context/CartContext'
import BullLogo from './BullLogo'
import ThemeToggle from './ThemeToggle'
import apiClient from '@/lib/api/client'
import { useTheme } from '@/context/ThemeContext'

interface NavComponentProps {
  title?: string
}

const STAFF_DASHBOARD: Record<string, string> = {
  gerente: '/admin',
  cajero: '/cajero',
  cocinero: '/cocina',
  mesero: '/mesero',
}

export default function NavComponent({ title = 'I KE TACOS' }: NavComponentProps) {
  const { totalItems } = useCart()
  const { theme } = useTheme()
  const router = useRouter()
  const [usuario, setUsuario] = useState<{ email: string; rol: string } | null>(null)
  const [menuOpen, setMenuOpen] = useState(false)

  const btnBg      = theme === 'dark' ? 'rgba(0,0,0,0.28)' : 'rgba(255,255,255,0.28)'
  const btnBgHover = theme === 'dark' ? 'rgba(0,0,0,0.40)' : 'rgba(255,255,255,0.45)'
  const cartBg     = theme === 'dark' ? 'rgba(0,0,0,0.18)' : 'rgba(255,255,255,0.22)'

  useEffect(() => {
    try {
      const raw = localStorage.getItem('usuario')
      if (raw) setUsuario(JSON.parse(raw))
    } catch { /* ignore */ }
  }, [])

  const handleLogout = async () => {
    try { await apiClient.post('/auth/logout') } catch { /* ignore */ }
    localStorage.removeItem('accessToken')
    localStorage.removeItem('usuario')
    setUsuario(null)
    setMenuOpen(false)
    router.push('/')
  }

  const initials = usuario?.email?.charAt(0).toUpperCase() ?? '?'

  return (
    <header
      className="fixed top-0 left-0 right-0 z-50"
      style={{ backdropFilter: 'blur(20px)', WebkitBackdropFilter: 'blur(20px)' }}
    >
      <div
        className="flex items-center justify-between px-4 py-3 max-w-lg mx-auto"
        style={{ background: 'linear-gradient(135deg, #F28500 0%, #D4700A 100%)' }}
      >
        {/* Logo */}
        <Link href="/" className="flex items-center gap-2 group">
          <BullLogo size={52} />
          <span
            className="text-white font-display tracking-wider text-xl leading-none self-center whitespace-nowrap"
            style={{ letterSpacing: '0.06em' }}
          >
            {title}
          </span>
        </Link>

        <div className="flex items-center gap-2">
          {/* Theme toggle */}
          <ThemeToggle background={btnBg} />
          {/* Auth */}
          {usuario ? (
            <div className="relative">
              <button
                onClick={() => setMenuOpen((v) => !v)}
                aria-label="Menú de usuario"
                className="flex items-center gap-1.5 rounded-xl px-2 py-1.5 transition"
                style={{ background: btnBg }}
                onMouseEnter={(e) => (e.currentTarget.style.background = btnBgHover)}
                onMouseLeave={(e) => (e.currentTarget.style.background = btnBg)}
              >
                <span
                  className="w-6 h-6 rounded-full flex items-center justify-center text-xs font-black flex-shrink-0"
                  style={{ background: '#0A0A0A', color: '#F28500' }}
                >
                  {initials}
                </span>
                <span className="text-white text-xs font-bold hidden sm:block max-w-[72px] truncate">
                  {usuario.email.split('@')[0]}
                </span>
                <svg
                  width="10"
                  height="10"
                  viewBox="0 0 24 24"
                  fill="none"
                  className="text-white/70 flex-shrink-0 transition-transform duration-200"
                  style={{ transform: menuOpen ? 'rotate(180deg)' : 'rotate(0)' }}
                >
                  <path d="M6 9l6 6 6-6" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </button>

              {menuOpen && (
                <>
                  <div className="fixed inset-0 z-40" onClick={() => setMenuOpen(false)} />
                  <div
                    className="absolute right-0 top-full mt-2 w-48 rounded-2xl overflow-hidden z-50"
                    style={{
                      background: 'var(--nav-dropdown-bg)',
                      border: '1px solid var(--border-color)',
                      boxShadow: '0 8px 32px rgba(0,0,0,0.2)',
                    }}
                  >
                    <div className="px-4 py-3" style={{ borderBottom: '1px solid var(--border-color)' }}>
                      <p className="text-xs font-extrabold truncate" style={{ color: 'var(--text-primary)' }}>{usuario.email}</p>
                      <p className="text-xs capitalize mt-0.5" style={{ color: 'var(--text-secondary)' }}>{usuario.rol}</p>
                    </div>
                    {STAFF_DASHBOARD[usuario.rol] && (
                      <Link
                        href={STAFF_DASHBOARD[usuario.rol]}
                        onClick={() => setMenuOpen(false)}
                        className="flex items-center gap-2 px-4 py-3 text-sm font-bold transition-colors hover:bg-black/5"
                        style={{ color: 'var(--text-primary)' }}
                      >
                        Mi panel
                      </Link>
                    )}
                    <Link
                      href="/mis-pedidos"
                      onClick={() => setMenuOpen(false)}
                      className="flex items-center gap-2 px-4 py-3 text-sm font-bold transition-colors hover:bg-black/5"
                      style={{ color: 'var(--text-primary)' }}
                    >
                      Mis pedidos
                    </Link>
                    <button
                      onClick={handleLogout}
                      className="w-full flex items-center gap-2 px-4 py-3 text-sm font-bold text-red-500 hover:bg-black/5 transition-colors"
                      style={{ borderTop: '1px solid var(--border-color)' }}
                    >
                      Cerrar sesión
                    </button>
                  </div>
                </>
              )}
            </div>
          ) : (
            <Link
              href="/login"
              className="rounded-xl px-3 py-2 text-xs font-bold uppercase tracking-wide text-white transition"
              style={{ background: btnBg }}
              onMouseEnter={(e) => (e.currentTarget.style.background = btnBgHover)}
              onMouseLeave={(e) => (e.currentTarget.style.background = btnBg)}
            >
              Iniciar sesión
            </Link>
          )}

          {/* Cart */}
          <Link
            href="/cart"
            className="relative p-2.5 rounded-xl transition-colors"
            style={{ background: cartBg }}
            onMouseEnter={(e) => (e.currentTarget.style.background = btnBgHover)}
            onMouseLeave={(e) => (e.currentTarget.style.background = cartBg)}
            aria-label={`Carrito — ${totalItems} producto${totalItems !== 1 ? 's' : ''}`}
          >
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" className="text-white">
              <path
                d="M6 2L3 6v14a2 2 0 002 2h14a2 2 0 002-2V6l-3-4z"
                stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
                fill="rgba(255,255,255,0.15)"
              />
              <line x1="3" y1="6" x2="21" y2="6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
              <path d="M16 10a4 4 0 01-8 0" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
            </svg>
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
      </div>
    </header>
  )
}
