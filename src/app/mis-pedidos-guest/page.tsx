'use client'

import { useState, useEffect, useCallback, Suspense } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import NavComponent from '@/components/ui/NavComponent'
import apiClient from '@/lib/api/client'

// ─── Types ────────────────────────────────────────────────────────────────────

interface OrdenGuest {
  id: number
  numero: string
  estado: string
  total: string
  creado_en: string
  nombre_cliente: string | null
  orden_detalles: { cantidad: number; productos: { nombre: string } }[]
  orden_combos:   { cantidad: number; combos: { nombre: string } }[]
}

const ESTADO_CONFIG: Record<string, { label: string; color: string; bg: string }> = {
  pendiente:      { label: 'Pendiente',   color: '#9CA3AF', bg: 'rgba(156,163,175,0.1)' },
  en_preparacion: { label: 'Preparando',  color: '#F28500', bg: 'rgba(242,133,0,0.15)'  },
  lista:          { label: 'Lista',       color: '#27AE60', bg: 'rgba(39,174,96,0.15)'  },
  entregada:      { label: 'Entregada',   color: '#2980B9', bg: 'rgba(41,128,185,0.15)' },
  pagada:         { label: 'Pagada',      color: '#2980B9', bg: 'rgba(41,128,185,0.15)' },
  cancelada:      { label: 'Cancelada',   color: '#E74C3C', bg: 'rgba(231,76,60,0.15)'  },
}

// ─── Content ──────────────────────────────────────────────────────────────────

function MisPedidosGuestContent() {
  const searchParams = useSearchParams()
  const router       = useRouter()
  const emailParam   = searchParams.get('email') ?? ''

  // Tab: 'email' | 'numero'
  const [tab, setTab]               = useState<'email' | 'numero'>('email')

  // Email tab
  const [inputEmail, setInputEmail] = useState(emailParam)
  const [ordenes, setOrdenes]       = useState<OrdenGuest[]>([])
  const [loadingEmail, setLoadingEmail] = useState(false)
  const [buscado, setBuscado]       = useState(false)
  const [errorEmail, setErrorEmail] = useState('')

  // Number tab
  const [inputNumero, setInputNumero] = useState('')
  const [errorNumero, setErrorNumero] = useState('')

  const buscarOrdenes = useCallback(async (email: string) => {
    if (!email.trim()) return
    setLoadingEmail(true)
    setErrorEmail('')
    try {
      const res = await apiClient.get(`/orders/by-email/${encodeURIComponent(email.trim())}`)
      setOrdenes(res.data ?? [])
      setBuscado(true)
    } catch {
      setErrorEmail('No se pudieron cargar los pedidos. Intenta de nuevo.')
    } finally {
      setLoadingEmail(false)
    }
  }, [])

  useEffect(() => {
    if (emailParam) buscarOrdenes(emailParam)
  }, [emailParam, buscarOrdenes])

  const handleEmailSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!inputEmail.trim()) return
    router.push(`/mis-pedidos-guest?email=${encodeURIComponent(inputEmail.trim())}`)
  }

  const handleNumeroSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    const raw = inputNumero.trim().toUpperCase()
    if (!raw) { setErrorNumero('Ingresa el número de tu pedido'); return }
    setErrorNumero('')
    // Accept short form (e.g. "ORD-1234") or full form
    router.push(`/pedido/${encodeURIComponent(raw)}`)
  }

  const formatFecha = (fecha: string) =>
    new Date(fecha).toLocaleDateString('es-MX', {
      day: 'numeric', month: 'short',
      hour: '2-digit', minute: '2-digit',
      timeZone: 'America/Hermosillo',
    })

  const getResumen = (orden: OrdenGuest) => {
    const items = [
      ...(orden.orden_detalles ?? []).map((d) => `${d.cantidad}× ${d.productos.nombre}`),
      ...(orden.orden_combos   ?? []).map((c) => `${c.cantidad}× ${c.combos.nombre}`),
    ]
    return items.filter(Boolean).join(', ') || '—'
  }

  // ── Input styles ──
  const inputStyle: React.CSSProperties = {
    background: 'var(--bg-secondary)',
    border: '1px solid rgba(255,255,255,0.12)',
    color: 'var(--text-primary)',
  }

  return (
    <div className="min-h-screen bg-[var(--bg-primary)]">
      <NavComponent title="Mis Pedidos" />

      <main className="px-4 pt-20 pb-28 max-w-lg mx-auto w-full">

        {/* ── No email param: show search UI ── */}
        {!emailParam && (
          <div className="flex flex-col items-center justify-center min-h-[60vh]">

            {/* Icon */}
            <div
              className="w-20 h-20 rounded-full flex items-center justify-center mb-5"
              style={{ background: 'var(--bg-secondary)' }}
            >
              <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="#6B7280" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2"/>
                <rect x="9" y="3" width="6" height="4" rx="1"/>
                <path d="M9 12h6M9 16h4"/>
              </svg>
            </div>

            <h2
              className="font-display mb-2 text-center"
              style={{ fontSize: '1.75rem', color: 'var(--text-primary)' }}
            >
              BUSCAR PEDIDO
            </h2>
            <p className="text-sm font-medium text-center mb-6 max-w-xs" style={{ color: '#6B7280' }}>
              Consulta tus pedidos como invitado por email o pega el número de orden
            </p>

            {/* Tabs */}
            <div
              className="flex rounded-2xl p-1 gap-1 mb-5 w-full max-w-xs"
              style={{ background: 'var(--bg-secondary)' }}
            >
              {(['email', 'numero'] as const).map((t) => (
                <button
                  key={t}
                  onClick={() => setTab(t)}
                  className="flex-1 py-2 rounded-xl text-xs font-extrabold uppercase tracking-wide transition-all"
                  style={
                    tab === t
                      ? { background: '#F28500', color: '#ffffff' }
                      : { background: 'transparent', color: '#6B7280' }
                  }
                >
                  {t === 'email' ? 'Por email' : 'Por número'}
                </button>
              ))}
            </div>

            {/* ── Email form ── */}
            {tab === 'email' && (
              <form onSubmit={handleEmailSubmit} className="w-full max-w-xs flex flex-col gap-3">
                <input
                  type="email"
                  value={inputEmail}
                  onChange={(e) => setInputEmail(e.target.value)}
                  placeholder="tu@email.com"
                  required
                  className="w-full rounded-2xl px-4 py-3 text-sm focus:outline-none transition-all"
                  style={inputStyle}
                  onFocus={(e) => (e.currentTarget.style.borderColor = '#F28500')}
                  onBlur={(e)  => (e.currentTarget.style.borderColor = 'rgba(255,255,255,0.12)')}
                />
                <button
                  type="submit"
                  className="w-full py-3 rounded-2xl text-white font-extrabold text-sm transition-all active:scale-95"
                  style={{ background: 'linear-gradient(135deg, #F28500 0%, #D4700A 100%)' }}
                >
                  Buscar mis pedidos
                </button>
              </form>
            )}

            {/* ── Number form ── */}
            {tab === 'numero' && (
              <form onSubmit={handleNumeroSubmit} className="w-full max-w-xs flex flex-col gap-3">
                <div>
                  <input
                    type="text"
                    value={inputNumero}
                    onChange={(e) => { setInputNumero(e.target.value); setErrorNumero('') }}
                    placeholder="ORD-XXXXXXXX-XXXX"
                    autoCapitalize="characters"
                    spellCheck={false}
                    className="w-full rounded-2xl px-4 py-3 text-sm font-mono focus:outline-none transition-all"
                    style={{
                      ...inputStyle,
                      letterSpacing: '0.05em',
                      borderColor: errorNumero ? 'rgba(231,76,60,0.5)' : 'rgba(255,255,255,0.12)',
                    }}
                    onFocus={(e) => (e.currentTarget.style.borderColor = '#F28500')}
                    onBlur={(e)  => (e.currentTarget.style.borderColor = errorNumero ? 'rgba(231,76,60,0.5)' : 'rgba(255,255,255,0.12)')}
                  />
                  {errorNumero && (
                    <p className="text-red-400 text-xs mt-1 font-medium">{errorNumero}</p>
                  )}
                </div>
                <button
                  type="submit"
                  className="w-full py-3 rounded-2xl text-white font-extrabold text-sm transition-all active:scale-95"
                  style={{ background: 'linear-gradient(135deg, #F28500 0%, #D4700A 100%)' }}
                >
                  Ver estado del pedido
                </button>
                <p className="text-xs text-center" style={{ color: '#6B7280' }}>
                  Encuentra tu número en el correo de confirmación o en la pantalla al finalizar el pedido
                </p>
              </form>
            )}
          </div>
        )}

        {/* ── Results (email search) ── */}
        {emailParam && (
          <>
            <div className="flex items-center gap-2 mb-4">
              <button
                onClick={() => router.push('/mis-pedidos-guest')}
                className="p-1.5 rounded-xl transition-colors"
                style={{ background: 'rgba(255,255,255,0.06)', color: '#6B7280' }}
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                  <path d="M19 12H5M5 12l7 7M5 12l7-7" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </button>
              <p className="text-sm font-medium truncate" style={{ color: '#6B7280' }}>
                Pedidos de{' '}
                <span className="font-bold" style={{ color: 'var(--text-primary)' }}>
                  {emailParam}
                </span>
              </p>
            </div>

            {loadingEmail && (
              <div className="flex items-center justify-center py-16">
                <p className="font-semibold" style={{ color: '#6B7280' }}>Buscando pedidos...</p>
              </div>
            )}

            {errorEmail && (
              <p className="text-red-400 text-sm font-semibold text-center py-4">{errorEmail}</p>
            )}

            {!loadingEmail && buscado && ordenes.length === 0 && (
              <div className="flex flex-col items-center justify-center py-16 text-center">
                <p className="font-extrabold text-lg mb-2" style={{ color: 'var(--text-primary)' }}>
                  Sin pedidos
                </p>
                <p className="text-sm max-w-xs" style={{ color: '#6B7280' }}>
                  No encontramos pedidos asociados a este email como invitado.
                </p>
              </div>
            )}

            {!loadingEmail && ordenes.length > 0 && (
              <div className="flex flex-col gap-3">
                <h1
                  className="font-display"
                  style={{ fontSize: '1.5rem', color: 'var(--text-primary)' }}
                >
                  Mis Pedidos
                </h1>
                {ordenes.map((orden, index) => {
                  const estadoConfig = ESTADO_CONFIG[orden.estado] ?? ESTADO_CONFIG['pendiente']
                  return (
                    <Link
                      key={orden.id}
                      href={`/pedido/${orden.numero}`}
                      className="rounded-2xl p-4 block transition-all active:scale-[0.99]"
                      style={{
                        background: 'var(--bg-secondary)',
                        border: '1px solid var(--border-color)',
                        animationDelay: `${index * 0.06}s`,
                      }}
                    >
                      <div className="flex items-center justify-between mb-2">
                        <span
                          className="text-xs font-black px-2 py-1 rounded-lg"
                          style={{ background: '#F28500', color: 'white' }}
                        >
                          {orden.numero.replace(/ORD-\d{8}-/, 'ORD-')}
                        </span>
                        <span
                          className="text-xs font-bold px-2 py-1 rounded-full"
                          style={{ background: estadoConfig.bg, color: estadoConfig.color }}
                        >
                          {estadoConfig.label}
                        </span>
                      </div>

                      {orden.nombre_cliente && (
                        <p className="text-xs font-semibold mb-1" style={{ color: '#9CA3AF' }}>
                          {orden.nombre_cliente}
                        </p>
                      )}

                      <p
                        className="text-sm font-medium line-clamp-2 mb-2"
                        style={{ color: '#D1D5DB' }}
                      >
                        {getResumen(orden)}
                      </p>

                      <div
                        className="flex items-center justify-between pt-2"
                        style={{ borderTop: '1px solid var(--border-color)' }}
                      >
                        <span className="text-xs" style={{ color: '#6B7280' }}>
                          {formatFecha(orden.creado_en)}
                        </span>
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-bold" style={{ color: '#6B7280' }}>
                            Ver seguimiento →
                          </span>
                          <span className="font-display text-lg" style={{ color: '#F28500' }}>
                            ${parseFloat(orden.total).toFixed(2)}
                          </span>
                        </div>
                      </div>
                    </Link>
                  )
                })}
              </div>
            )}
          </>
        )}

        {/* Create account banner */}
        {(buscado || emailParam) && (
          <div
            className="mt-6 rounded-3xl p-4"
            style={{ background: 'rgba(242,133,0,0.07)', border: '1px solid rgba(242,133,0,0.2)' }}
          >
            <p className="font-extrabold text-sm mb-1" style={{ color: 'var(--text-primary)' }}>
              ¿Quieres guardar tu historial?
            </p>
            <p className="text-xs mb-3" style={{ color: '#6B7280' }}>
              Crea una cuenta con este email y todos tus pedidos aparecerán automáticamente.
            </p>
            <Link
              href="/register"
              className="w-full py-2.5 rounded-xl text-white font-extrabold text-sm text-center block transition-all active:scale-95"
              style={{ background: 'linear-gradient(135deg, #F28500 0%, #D4700A 100%)' }}
            >
              Crear cuenta
            </Link>
          </div>
        )}
      </main>
    </div>
  )
}

export default function MisPedidosGuestPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-[var(--bg-primary)]" />}>
      <MisPedidosGuestContent />
    </Suspense>
  )
}
