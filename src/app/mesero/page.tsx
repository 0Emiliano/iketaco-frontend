'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import apiClient from '@/lib/api/client'
import RefreshDot from '@/components/ui/RefreshDot'

interface Orden {
  id: number
  numero: string
  estado: string
  nombre_cliente: string | null
  notas_orden: string | null
  subtotal: string
  total: string
  creado_en: string
  orden_detalles: {
    id: number
    cantidad: number
    notas_item: string | null
    productos: { nombre: string }
  }[]
  orden_combos: {
    id: number
    cantidad: number
    combos: { nombre: string }
  }[]
}

const ESTADO_CONFIG: Record<string, { label: string; color: string; bg: string }> = {
  pendiente: { label: '⏳ Pendiente', color: '#9CA3AF', bg: 'rgba(156,163,175,0.1)' },
  en_preparacion: { label: '🔥 Preparando', color: '#F28500', bg: 'rgba(242,133,0,0.15)' },
  lista: { label: '✅ Lista', color: '#27AE60', bg: 'rgba(39,174,96,0.15)' },
  entregada: { label: '🛵 Entregada', color: '#2980B9', bg: 'rgba(41,128,185,0.15)' },
  cancelada: { label: '❌ Cancelada', color: '#E74C3C', bg: 'rgba(231,76,60,0.15)' },
}

const ESTADOS_ACTIVOS = ['pendiente', 'en_preparacion', 'lista']

export default function MeseroPage() {
  const router = useRouter()
  const [ordenes, setOrdenes] = useState<Orden[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [usuario, setUsuario] = useState<{ email: string; rol: string } | null>(null)

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const raw = localStorage.getItem('usuario')
      if (!raw) { router.push('/login'); return }
      const u = JSON.parse(raw)
      if (!['mesero', 'gerente', 'cajero'].includes(u.rol)) { router.push('/menu'); return }
      setUsuario(u)
    }
  }, [router])

  const fetchOrdenes = useCallback(async () => {
    try {
      const res = await apiClient.get('/orders')
      const activas = (res.data?.items ?? []).filter((o: Orden) => ESTADOS_ACTIVOS.includes(o.estado))
      setOrdenes(activas)
      setError('')
    } catch (err: any) {
      if (err?.response?.status === 401) router.push('/login')
      else setError('Error al cargar las órdenes')
    } finally {
      setLoading(false)
    }
  }, [router])

  useEffect(() => {
    if (!usuario) return
    fetchOrdenes()
    const interval = setInterval(fetchOrdenes, 15000)
    return () => clearInterval(interval)
  }, [usuario, fetchOrdenes])

  const cambiarEstado = async (ordenId: number, nuevoEstado: string) => {
    try {
      await apiClient.patch(`/orders/${ordenId}/status`, { estado: nuevoEstado })
      fetchOrdenes()
    } catch {
      setError('Error al actualizar el estado')
    }
  }

  const getResumen = (orden: Orden) => {
    return [
      ...orden.orden_detalles.map((d) => `${d.cantidad}x ${d.productos.nombre}`),
      ...orden.orden_combos.map((c) => `${c.cantidad}x ${c.combos.nombre}`),
    ].join(', ')
  }

  const tiempoTranscurrido = (fecha: string) => {
    const diff = Math.floor((Date.now() - new Date(fecha).getTime()) / 60000)
    if (diff < 1) return 'Ahora'
    if (diff === 1) return '1 min'
    return `${diff} min`
  }

  const logout = () => {
    apiClient.post('/auth/logout').catch(() => {})
    localStorage.removeItem('accessToken')
    localStorage.removeItem('usuario')
    router.push('/login')
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0A0A0A] flex items-center justify-center">
        <p className="text-gray-400 font-bold">Cargando órdenes...</p>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#0A0A0A]">
      {/* Header */}
      <div
        className="fixed top-0 left-0 right-0 z-50 px-4 py-3 flex items-center justify-between"
        style={{ background: '#111', borderBottom: '1px solid rgba(255,255,255,0.08)' }}
      >
        <div className="flex items-center gap-3">
          <span className="text-2xl">🛵</span>
          <div>
            <h1 className="text-white font-extrabold text-lg leading-none">Panel Mesero</h1>
            <p className="text-gray-400 text-xs mt-0.5">{usuario?.email}</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <span
            className="text-xs font-bold px-3 py-1 rounded-full"
            style={{ background: 'rgba(242,133,0,0.2)', color: '#F28500' }}
          >
            {ordenes.length} activas
          </span>
          <RefreshDot intervalMs={15000} />
          <button
            onClick={fetchOrdenes}
            className="text-gray-400 hover:text-white p-2 rounded-lg transition"
            style={{ background: 'rgba(255,255,255,0.06)' }}
            aria-label="Actualizar"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
              <path
                d="M1 4v6h6M23 20v-6h-6"
                stroke="currentColor"
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
              <path
                d="M20.49 9A9 9 0 0 0 5.64 5.64L1 10m22 4l-4.64 4.36A9 9 0 0 1 3.51 15"
                stroke="currentColor"
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </button>
          <button
            onClick={logout}
            className="text-gray-400 hover:text-white text-xs font-bold px-3 py-1.5 rounded-lg transition"
            style={{ background: 'rgba(255,255,255,0.06)' }}
          >
            Salir
          </button>
        </div>
      </div>

      <main className="pt-20 pb-10 px-4 max-w-4xl mx-auto">
        {error && <p className="text-red-400 text-sm font-bold text-center my-4">{error}</p>}

        {ordenes.length === 0 ? (
          <div className="flex flex-col items-center justify-center min-h-[60vh] text-center">
            <div
              className="w-24 h-24 rounded-full flex items-center justify-center text-5xl mb-4"
              style={{ background: '#1A1A1A' }}
            >
              ✅
            </div>
            <h2 className="text-white font-extrabold text-xl mb-2">Sin órdenes activas</h2>
            <p className="text-gray-400 text-sm">Las nuevas órdenes aparecerán aquí</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
            {ordenes.map((orden) => {
              const cfg = ESTADO_CONFIG[orden.estado] ?? ESTADO_CONFIG['pendiente']
              return (
                <div
                  key={orden.id}
                  className="rounded-2xl p-4"
                  style={{
                    background: orden.estado === 'lista' ? '#001A0A' : '#1A1A1A',
                    border:
                      orden.estado === 'lista'
                        ? '1px solid rgba(39,174,96,0.4)'
                        : '1px solid rgba(255,255,255,0.06)',
                  }}
                >
                  {/* Header */}
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <span
                        className="text-xs font-black px-2 py-1 rounded-lg"
                        style={{ background: '#F28500', color: 'white' }}
                      >
                        {orden.numero.replace(/ORD-\d{8}-/, 'ORD-')}
                      </span>
                      {orden.nombre_cliente && (
                        <span className="text-gray-400 text-xs font-bold">
                          {orden.nombre_cliente}
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-2">
                      <span
                        className="text-xs font-bold px-2 py-1 rounded-full"
                        style={{ background: cfg.bg, color: cfg.color }}
                      >
                        {cfg.label}
                      </span>
                      <span className="text-gray-500 text-xs">
                        {tiempoTranscurrido(orden.creado_en)}
                      </span>
                    </div>
                  </div>

                  {/* Items */}
                  <div
                    className="rounded-xl p-3 mb-3 text-sm text-gray-300 font-medium"
                    style={{ background: 'rgba(0,0,0,0.3)' }}
                  >
                    {getResumen(orden)}
                    {orden.notas_orden && (
                      <p className="text-yellow-400 text-xs mt-2 font-bold">
                        📝 {orden.notas_orden}
                      </p>
                    )}
                  </div>

                  {/* Price + action */}
                  <div className="flex items-center justify-between">
                    <span className="font-extrabold text-lg" style={{ color: '#F28500' }}>
                      ${parseFloat(orden.total).toFixed(2)}
                    </span>
                    <div className="flex gap-2">
                      {orden.estado === 'lista' && (
                        <button
                          onClick={() => cambiarEstado(orden.id, 'entregada')}
                          className="py-2 px-4 rounded-xl text-white font-extrabold text-sm transition-all active:scale-95"
                          style={{
                            background: 'linear-gradient(135deg, #2980B9 0%, #1A6A9A 100%)',
                          }}
                        >
                          Entregar
                        </button>
                      )}
                      {orden.estado === 'pendiente' && (
                        <button
                          onClick={() => cambiarEstado(orden.id, 'cancelada')}
                          className="py-2 px-3 rounded-xl text-gray-400 hover:text-red-400 font-extrabold text-sm transition-all"
                          style={{ background: 'rgba(255,255,255,0.06)' }}
                        >
                          Cancelar
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </main>
    </div>
  )
}
