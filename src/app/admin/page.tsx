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
  nombre_cliente: string | null
  subtotal: string
  total: string
  creado_en: string
}

const ESTADO_CONFIG: Record<string, { label: string; color: string; bg: string }> = {
  pendiente:      { label: 'Pendiente',     color: '#9CA3AF', bg: 'rgba(156,163,175,0.1)' },
  en_preparacion: { label: 'En preparación',color: '#F28500', bg: 'rgba(242,133,0,0.15)' },
  lista:          { label: 'Lista',          color: '#27AE60', bg: 'rgba(39,174,96,0.15)' },
  entregada:      { label: 'Entregada',     color: '#2980B9', bg: 'rgba(41,128,185,0.15)' },
  cancelada:      { label: 'Cancelada',     color: '#E74C3C', bg: 'rgba(231,76,60,0.15)' },
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
  const [usuario, setUsuario] = useState<{ email: string; rol: string } | null>(null)

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const raw = localStorage.getItem('usuario')
      if (!raw) { router.push('/login'); return }
      const u = JSON.parse(raw)
      if (u.rol !== 'gerente') { router.push('/menu'); return }
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
          <span className="text-2xl">👔</span>
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

      <main className="pt-28 pb-10 px-4 max-w-4xl mx-auto">
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
                    { label: 'Órdenes hoy',   value: dashboard.resumenHoy.totalOrdenes,               color: '#F28500' },
                    { label: 'Ticket prom.',   value: `$${dashboard.resumenHoy.ticketPromedio.toFixed(0)}`, color: '#27AE60' },
                    { label: 'Ventas hoy',     value: `$${dashboard.resumenHoy.totalVentas.toFixed(0)}`,    color: '#2980B9' },
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
                {dashboard.ordenesPorEstado && Object.keys(dashboard.ordenesPorEstado).length > 0 && (
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
                    style={{ background: 'rgba(231,76,60,0.1)', border: '1px solid rgba(231,76,60,0.3)' }}
                  >
                    <span className="text-2xl">⚠️</span>
                    <div>
                      <p className="text-white font-extrabold text-sm">Alerta de inventario</p>
                      <p className="text-red-300 text-xs mt-0.5">
                        {dashboard.alertasStock} ingrediente{dashboard.alertasStock > 1 ? 's' : ''} con stock bajo
                      </p>
                    </div>
                  </div>
                )}
              </>
            )}

            {/* Quick links */}
            <div className="grid grid-cols-2 gap-3">
              {[
                { label: 'Cocina', icon: '🍳', href: '/cocina' },
                { label: 'Cajero', icon: '💳', href: '/cajero' },
              ].map((l) => (
                <a
                  key={l.href}
                  href={l.href}
                  className="rounded-2xl p-4 flex items-center gap-3 transition-all active:scale-95"
                  style={{ background: '#1A1A1A', border: '1px solid rgba(255,255,255,0.06)' }}
                >
                  <span className="text-2xl">{l.icon}</span>
                  <span className="text-white font-extrabold text-sm">{l.label}</span>
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
                      <div className="flex items-center justify-between mt-2">
                        <span className="text-gray-500 text-xs">{formatFecha(orden.creado_en)}</span>
                        <span className="font-extrabold text-base" style={{ color: '#F28500' }}>
                          ${parseFloat(orden.total).toFixed(2)}
                        </span>
                      </div>
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
