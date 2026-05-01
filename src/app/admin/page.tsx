'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import apiClient from '@/lib/api/client'

// Shapes reales del backend
interface DashboardData {
  servicioActivo: { id: number; estado: string; fecha_inicio: string } | null
  resumenHoy: {
    totalVentas: number
    totalOrdenes: number
    ticketPromedio: number
  }
  ordenesPorEstado: Record<string, number>
  alertasStock: number
}

interface Servicio {
  id: number
  estado: 'abierto' | 'cerrado'
  fecha_inicio: string
  fecha_fin: string | null
}

interface Orden {
  id: number
  numero: string
  estado: string
  tipo_servicio: string | null
  nombre_cliente: string | null
  telefono_cliente: string | null
  direccion_entrega: string | null
  latitud_entrega: number | string | null
  longitud_entrega: number | string | null
  subtotal: string
  total: string
  creado_en: string
  orden_detalles?: { id: number; cantidad: number; productos: { nombre: string } }[]
  orden_combos?: { id: number; cantidad: number; combos: { nombre: string } }[]
}

const ESTADO_CONFIG: Record<string, { label: string; color: string; bg: string }> = {
  pendiente: { label: 'Pendiente', color: '#9CA3AF', bg: 'rgba(156,163,175,0.1)' },
  en_preparacion: { label: 'En preparación', color: '#F28500', bg: 'rgba(242,133,0,0.15)' },
  lista: { label: 'Lista / Preparada', color: '#27AE60', bg: 'rgba(39,174,96,0.15)' },
  entregada: { label: 'Entregada', color: '#2980B9', bg: 'rgba(41,128,185,0.15)' },
  pagada: { label: 'Pagada', color: '#8B5CF6', bg: 'rgba(139,92,246,0.15)' },
  cancelada: { label: 'Cancelada', color: '#E74C3C', bg: 'rgba(231,76,60,0.15)' },
}

// ─── WhatsApp helpers ─────────────────────────────────────────────────────────

function toNum(v: number | string | null | undefined): number | null {
  if (v === null || v === undefined) return null
  const n = typeof v === 'number' ? v : parseFloat(String(v))
  return isNaN(n) ? null : n
}

function enviarRepartidorWhatsApp(orden: Orden) {
  const lat = toNum(orden.latitud_entrega)
  const lng = toNum(orden.longitud_entrega)

  const items = [
    ...(orden.orden_detalles ?? []).map((d) => `• ${d.cantidad}× ${d.productos?.nombre}`),
    ...(orden.orden_combos ?? []).map((c) => `• ${c.cantidad}× ${c.combos?.nombre}`),
  ]
    .filter(Boolean)
    .join('\n')

  const mapsLine =
    lat !== null && lng !== null
      ? `\nDestino: https://maps.google.com/maps/dir/?api=1&destination=${lat},${lng}`
      : ''

  const lineas: (string | null)[] = [
    `*NUEVA ENTREGA — ${orden.numero.replace(/ORD-\d{8}-/, 'ORD-')}*`,
    '',
    orden.nombre_cliente ? orden.nombre_cliente : null,
    orden.telefono_cliente ? orden.telefono_cliente : null,
    orden.direccion_entrega ? orden.direccion_entrega : null,
    items ? `\nPedido:\n${items}` : null,
    '',
    `Total: $${parseFloat(String(orden.total)).toFixed(2)}`,
  ]

  const msg = lineas.filter((l) => l !== null).join('\n') + mapsLine
  window.open(`https://wa.me/?text=${encodeURIComponent(msg)}`, '_blank', 'noopener')
}

type BtnTransicion = { estado: string; label: string; color: string }

// Transiciones comunes a todos los tipos de servicio
const TRANSICIONES_BASE: Record<string, BtnTransicion[]> = {
  pendiente: [
    { estado: 'en_preparacion', label: 'Iniciar preparación', color: '#F28500' },
    { estado: 'cancelada', label: 'Cancelar', color: '#E74C3C' },
  ],
  en_preparacion: [
    { estado: 'lista', label: 'Marcar lista / Cocinada', color: '#27AE60' },
    { estado: 'cancelada', label: 'Cancelar', color: '#E74C3C' },
  ],
  // 'lista' se resuelve dinámicamente según tipo_servicio (ver getTransicionesOrden)
  entregada: [],
  pagada: [],
  cancelada: [],
}

// Botones desde 'lista' según tipo de servicio
const LISTA_DOMICILIO: BtnTransicion[] = [
  { estado: 'entregada', label: 'Marcar entregada', color: '#2980B9' },
  { estado: 'cancelada', label: 'Cancelar', color: '#E74C3C' },
]
const LISTA_LOCAL: BtnTransicion[] = [
  { estado: 'pagada', label: 'Cobrar / Pagada', color: '#8B5CF6' },
  { estado: 'cancelada', label: 'Cancelar', color: '#E74C3C' },
]

function getTransicionesOrden(orden: Orden): BtnTransicion[] {
  if (orden.estado === 'lista') {
    return orden.tipo_servicio === 'domicilio' ? LISTA_DOMICILIO : LISTA_LOCAL
  }
  return TRANSICIONES_BASE[orden.estado] ?? []
}

type Tab = 'dashboard' | 'ordenes'

export default function AdminPage() {
  const router = useRouter()
  const [tab, setTab] = useState<Tab>('dashboard')
  const [dashboard, setDashboard] = useState<DashboardData | null>(null)
  const [servicio, setServicio] = useState<Servicio | null>(null)
  const [servicioError, setServicioError] = useState('')
  const [ordenes, setOrdenes] = useState<Orden[]>([])
  const [loading, setLoading] = useState(true)
  const [servicioLoading, setServicioLoading] = useState(false)
  const [cambiandoEstado, setCambiandoEstado] = useState<number | null>(null)
  const [usuario, setUsuario] = useState<{ email: string; rol: string } | null>(null)

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const raw = localStorage.getItem('usuario')
      if (!raw) {
        router.push('/login')
        return
      }
      const u = JSON.parse(raw)
      if (u.rol !== 'gerente') {
        router.push('/menu')
        return
      }
      setUsuario(u)
    }
  }, [router])

  const fetchDashboard = useCallback(async () => {
    try {
      const res = await apiClient.get('/reports/dashboard')
      setDashboard(res.data)
      // El dashboard incluye el servicio activo
      if (res.data?.servicioActivo) {
        setServicio(res.data.servicioActivo)
      }
    } catch {
      // silent
    }
  }, [])

  const fetchServicio = useCallback(async () => {
    try {
      const res = await apiClient.get('/services/active')
      setServicio(res.data)
    } catch (err: any) {
      if (err?.response?.status === 404) setServicio(null)
    }
  }, [])

  const fetchOrdenes = useCallback(async () => {
    try {
      const res = await apiClient.get('/orders')
      setOrdenes(res.data?.items ?? [])
    } catch {
      // silent
    }
  }, [])

  useEffect(() => {
    if (!usuario) return
    Promise.all([fetchDashboard(), fetchServicio(), fetchOrdenes()]).finally(() =>
      setLoading(false)
    )
  }, [usuario, fetchDashboard, fetchServicio, fetchOrdenes])

  const toggleServicio = async () => {
    setServicioError('')
    setServicioLoading(true)
    try {
      if (servicio?.estado === 'abierto') {
        await apiClient.post('/services/close')
        setServicio(null)
      } else {
        const res = await apiClient.post('/services/open')
        setServicio(res.data)
      }
      fetchDashboard()
    } catch (err: any) {
      setServicioError(err?.response?.data?.error ?? 'Error al cambiar servicio')
    } finally {
      setServicioLoading(false)
    }
  }

  const cambiarEstado = async (ordenId: number, nuevoEstado: string) => {
    setCambiandoEstado(ordenId)
    try {
      await apiClient.patch(`/orders/${ordenId}/status`, { estado: nuevoEstado })
      await fetchOrdenes()
      fetchDashboard()
    } catch {
      // silent — en producción se puede mostrar un toast
    } finally {
      setCambiandoEstado(null)
    }
  }

  const logout = () => {
    apiClient.post('/auth/logout').catch(() => {})
    localStorage.removeItem('accessToken')
    localStorage.removeItem('usuario')
    router.push('/login')
  }

  const formatFecha = (fecha: string) =>
    new Date(fecha).toLocaleDateString('es-MX', {
      day: 'numeric',
      month: 'short',
      hour: '2-digit',
      minute: '2-digit',
      timeZone: 'America/Hermosillo',
    })

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0A0A0A] flex items-center justify-center">
        <p className="text-gray-400 font-bold">Cargando panel...</p>
      </div>
    )
  }

  const servicioAbierto = servicio?.estado === 'abierto'

  return (
    <div className="min-h-screen bg-[#0A0A0A]">
      {/* Header */}
      <div
        className="fixed top-0 left-0 right-0 z-50 px-4 py-3 flex items-center justify-between"
        style={{ background: '#111', borderBottom: '1px solid rgba(255,255,255,0.08)' }}
      >
        <div className="flex items-center gap-3">
          <div>
            <h1 className="text-white font-extrabold text-lg leading-none">Panel Gerente</h1>
            <p className="text-gray-400 text-xs mt-0.5">{usuario?.email}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <div
            className="text-xs font-bold px-3 py-1 rounded-full"
            style={{
              background: servicioAbierto ? 'rgba(39,174,96,0.2)' : 'rgba(231,76,60,0.2)',
              color: servicioAbierto ? '#27AE60' : '#E74C3C',
            }}
          >
            {servicioAbierto ? '● Abierto' : '● Cerrado'}
          </div>
          <button
            onClick={logout}
            className="text-gray-400 hover:text-white text-xs font-bold px-3 py-1.5 rounded-lg transition"
            style={{ background: 'rgba(255,255,255,0.06)' }}
          >
            Salir
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div
        className="fixed top-[57px] left-0 right-0 z-40 px-4 flex gap-1 pb-2 pt-2"
        style={{ background: '#111', borderBottom: '1px solid rgba(255,255,255,0.06)' }}
      >
        {(['dashboard', 'ordenes'] as Tab[]).map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className="px-4 py-2 rounded-xl text-sm font-bold transition-all"
            style={{
              background: tab === t ? 'rgba(242,133,0,0.2)' : 'rgba(255,255,255,0.05)',
              color: tab === t ? '#F28500' : '#9CA3AF',
            }}
          >
            {t === 'dashboard' ? 'Dashboard' : 'Órdenes'}
          </button>
        ))}
      </div>

      <main className="pt-28 pb-24 px-4 max-w-4xl mx-auto">
        {/* ── DASHBOARD TAB ─────────────────────────────── */}
        {tab === 'dashboard' && (
          <div className="space-y-5 mt-2">
            {/* Service control */}
            <div
              className="rounded-2xl p-4"
              style={{ background: '#1A1A1A', border: '1px solid rgba(255,255,255,0.06)' }}
            >
              <h2 className="text-white font-extrabold text-base mb-2">Control de Servicio</h2>
              {servicioAbierto && servicio?.fecha_inicio && (
                <p className="text-gray-400 text-xs mb-3">
                  Abierto desde {formatFecha(servicio.fecha_inicio)}
                </p>
              )}
              {servicioError && (
                <p className="text-red-400 text-xs font-bold mb-2">{servicioError}</p>
              )}
              <button
                onClick={toggleServicio}
                disabled={servicioLoading}
                className="w-full py-3 rounded-xl text-white font-extrabold text-sm transition-all active:scale-95 disabled:opacity-50"
                style={{
                  background: servicioAbierto
                    ? 'linear-gradient(135deg, #E74C3C 0%, #C0392B 100%)'
                    : 'linear-gradient(135deg, #27AE60 0%, #1E8449 100%)',
                }}
              >
                {servicioLoading
                  ? 'Procesando...'
                  : servicioAbierto
                    ? 'Cerrar Servicio'
                    : 'Abrir Servicio'}
              </button>
            </div>

            {/* Stats del día */}
            {dashboard?.resumenHoy && (
              <>
                <div className="grid grid-cols-3 gap-3">
                  {[
                    {
                      label: 'Órdenes hoy',
                      value: dashboard.resumenHoy.totalOrdenes,
                      color: '#F28500',
                    },
                    {
                      label: 'Ticket prom.',
                      value: `$${dashboard.resumenHoy.ticketPromedio.toFixed(0)}`,
                      color: '#27AE60',
                    },
                    {
                      label: 'Ventas hoy',
                      value: `$${dashboard.resumenHoy.totalVentas.toFixed(0)}`,
                      color: '#2980B9',
                    },
                  ].map((s) => (
                    <div
                      key={s.label}
                      className="rounded-2xl p-3 text-center"
                      style={{ background: '#1A1A1A', border: '1px solid rgba(255,255,255,0.06)' }}
                    >
                      <p className="font-extrabold text-xl" style={{ color: s.color }}>
                        {s.value}
                      </p>
                      <p className="text-gray-400 text-xs mt-0.5 font-semibold">{s.label}</p>
                    </div>
                  ))}
                </div>

                {/* Estado de órdenes activas */}
                {dashboard.ordenesPorEstado &&
                  Object.keys(dashboard.ordenesPorEstado).length > 0 && (
                    <div
                      className="rounded-2xl p-4"
                      style={{ background: '#1A1A1A', border: '1px solid rgba(255,255,255,0.06)' }}
                    >
                      <h2 className="text-white font-extrabold text-base mb-3">Órdenes activas</h2>
                      <div className="flex flex-col gap-2">
                        {Object.entries(dashboard.ordenesPorEstado).map(([estado, count]) => {
                          const cfg = ESTADO_CONFIG[estado] ?? ESTADO_CONFIG['pendiente']
                          return (
                            <div key={estado} className="flex items-center justify-between">
                              <span
                                className="text-xs font-bold px-2 py-1 rounded-full"
                                style={{ background: cfg.bg, color: cfg.color }}
                              >
                                {cfg.label}
                              </span>
                              <span className="text-white font-extrabold">{count}</span>
                            </div>
                          )
                        })}
                      </div>
                    </div>
                  )}

                {/* Alertas de stock */}
                {dashboard.alertasStock > 0 && (
                  <div
                    className="rounded-2xl p-4 flex items-center gap-3"
                    style={{
                      background: 'rgba(231,76,60,0.1)',
                      border: '1px solid rgba(231,76,60,0.3)',
                    }}
                  >
                    <div>
                      <p className="text-white font-extrabold text-sm">Alerta de inventario</p>
                      <p className="text-red-300 text-xs mt-0.5">
                        {dashboard.alertasStock} ingrediente{dashboard.alertasStock > 1 ? 's' : ''}{' '}
                        con stock bajo
                      </p>
                    </div>
                  </div>
                )}
              </>
            )}

            {/* Quick links */}
            <div className="grid grid-cols-2 gap-3">
              {[
                {
                  label: 'Cocina',
                  sub: 'Panel de cocineros',
                  href: '/cocina',
                  color: '#E67E22',
                  bg: 'rgba(230,126,34,0.15)',
                  icon: (
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2z" />
                      <path d="M8 14s1.5 2 4 2 4-2 4-2" />
                      <line x1="9" y1="9" x2="9.01" y2="9" strokeWidth="3" />
                      <line x1="15" y1="9" x2="15.01" y2="9" strokeWidth="3" />
                    </svg>
                  ),
                },
                {
                  label: 'Cajero',
                  sub: 'Cobros y pagos',
                  href: '/cajero',
                  color: '#27AE60',
                  bg: 'rgba(39,174,96,0.15)',
                  icon: (
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <rect x="1" y="4" width="22" height="16" rx="2" ry="2" />
                      <line x1="1" y1="10" x2="23" y2="10" />
                    </svg>
                  ),
                },
                {
                  label: 'Mesero',
                  sub: 'Tomar pedidos',
                  href: '/mesero',
                  color: '#2980B9',
                  bg: 'rgba(41,128,185,0.15)',
                  icon: (
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z" />
                      <polyline points="14 2 14 8 20 8" />
                      <line x1="16" y1="13" x2="8" y2="13" />
                      <line x1="16" y1="17" x2="8" y2="17" />
                      <polyline points="10 9 9 9 8 9" />
                    </svg>
                  ),
                },
                {
                  label: 'Recetas',
                  sub: 'Ingredientes por producto',
                  href: '/admin/recipes',
                  color: '#8B5CF6',
                  bg: 'rgba(139,92,246,0.15)',
                  icon: (
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M4 19.5A2.5 2.5 0 016.5 17H20" />
                      <path d="M6.5 2H20v20H6.5A2.5 2.5 0 014 19.5v-15A2.5 2.5 0 016.5 2z" />
                    </svg>
                  ),
                },
                {
                  label: 'Consumo',
                  sub: 'Reporte de inventario',
                  href: '/admin/inventory-report',
                  color: '#F28500',
                  bg: 'rgba(242,133,0,0.15)',
                  icon: (
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <polyline points="22 12 18 12 15 21 9 3 6 12 2 12" />
                    </svg>
                  ),
                },
                {
                  label: 'Vista Cliente',
                  sub: 'Ver menú público',
                  href: '/menu',
                  color: '#9CA3AF',
                  bg: 'rgba(156,163,175,0.12)',
                  icon: (
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                      <circle cx="12" cy="12" r="3" />
                    </svg>
                  ),
                },
              ].map((l) => (
                <a
                  key={l.href}
                  href={l.href}
                  className="rounded-2xl p-4 flex items-center gap-3 transition-all active:scale-95"
                  style={{ background: '#1A1A1A', border: '1px solid rgba(255,255,255,0.06)' }}
                >
                  <div
                    className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
                    style={{ background: l.bg, color: l.color }}
                  >
                    {l.icon}
                  </div>
                  <div className="min-w-0">
                    <p className="text-white font-extrabold text-sm leading-tight">{l.label}</p>
                    <p className="text-gray-500 text-xs mt-0.5 leading-tight truncate">{l.sub}</p>
                  </div>
                </a>
              ))}
            </div>
          </div>
        )}

        {/* ── ÓRDENES TAB ───────────────────────────────── */}
        {tab === 'ordenes' && (
          <div className="mt-2">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-white font-extrabold text-lg">
                Órdenes activas{' '}
                <span className="text-gray-500 text-sm font-bold">({ordenes.length})</span>
              </h2>
              <button
                onClick={fetchOrdenes}
                className="text-gray-400 hover:text-white text-xs font-bold px-3 py-1.5 rounded-lg transition"
                style={{ background: 'rgba(255,255,255,0.06)' }}
              >
                Actualizar
              </button>
            </div>

            {ordenes.length === 0 ? (
              <div className="text-center py-20">
                <p className="text-gray-400 font-semibold">Sin órdenes activas</p>
              </div>
            ) : (
              <div className="flex flex-col gap-3">
                {ordenes.map((orden) => {
                  const cfg = ESTADO_CONFIG[orden.estado] ?? ESTADO_CONFIG['pendiente']
                  return (
                    <div
                      key={orden.id}
                      className="rounded-2xl p-4"
                      style={{ background: '#1A1A1A', border: '1px solid rgba(255,255,255,0.06)' }}
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
                          style={{ background: cfg.bg, color: cfg.color }}
                        >
                          {cfg.label}
                        </span>
                      </div>
                      {orden.nombre_cliente && (
                        <p className="text-gray-300 text-sm font-semibold mb-1">
                          {orden.nombre_cliente}
                        </p>
                      )}
                      {orden.tipo_servicio === 'domicilio' && orden.direccion_entrega && (
                        <p className="text-gray-500 text-xs mb-1">{orden.direccion_entrega}</p>
                      )}
                      <div className="flex items-center justify-between mt-2">
                        <span className="text-gray-500 text-xs">
                          {formatFecha(orden.creado_en)}
                        </span>
                        <span className="font-extrabold text-base" style={{ color: '#F28500' }}>
                          ${parseFloat(orden.total).toFixed(2)}
                        </span>
                      </div>
                      {/* Botones de cambio de estado */}
                      {getTransicionesOrden(orden).length > 0 && (
                        <div className="flex gap-2 mt-3">
                          {getTransicionesOrden(orden).map((t) => (
                            <button
                              key={t.estado}
                              onClick={() => cambiarEstado(orden.id, t.estado)}
                              disabled={cambiandoEstado === orden.id}
                              className="flex-1 py-2 rounded-xl text-xs font-extrabold transition active:scale-95 disabled:opacity-40"
                              style={{
                                background: `${t.color}22`,
                                color: t.color,
                                border: `1px solid ${t.color}55`,
                              }}
                            >
                              {cambiandoEstado === orden.id ? '...' : t.label}
                            </button>
                          ))}
                        </div>
                      )}

                      {orden.tipo_servicio === 'domicilio' && (
                        <button
                          onClick={() => enviarRepartidorWhatsApp(orden)}
                          className="mt-3 w-full py-2 rounded-xl text-sm font-extrabold transition active:scale-95 flex items-center justify-center gap-2"
                          style={{
                            background: 'rgba(37,211,102,0.12)',
                            color: '#25D366',
                            border: '1px solid rgba(37,211,102,0.25)',
                          }}
                        >
                          <svg
                            width="15"
                            height="15"
                            viewBox="0 0 24 24"
                            fill="currentColor"
                            aria-hidden="true"
                          >
                            <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347z" />
                            <path d="M11.999 2C6.477 2 2 6.477 2 12c0 1.99.583 3.842 1.585 5.396L2 22l4.73-1.558A9.943 9.943 0 0011.999 22C17.522 22 22 17.523 22 12c0-5.522-4.478-10-10.001-10zm0 18.182a8.14 8.14 0 01-4.142-1.13l-.297-.176-3.08 1.014.986-3.006-.193-.309A8.14 8.14 0 013.818 12c0-4.517 3.663-8.182 8.181-8.182C16.518 3.818 20.182 7.483 20.182 12c0 4.518-3.664 8.182-8.183 8.182z" />
                          </svg>
                          Enviar a repartidor por WhatsApp
                        </button>
                      )}
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        )}
      </main>
    </div>
  )
}
