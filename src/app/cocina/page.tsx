'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import apiClient from '@/lib/api/client'
import RefreshDot from '@/components/ui/RefreshDot'

interface OrdenCocina {
  id: number
  numero: string
  estado: string
  nombre_cliente: string | null
  notas_orden: string | null
  creado_en: string
  orden_detalles: {
    id: number
    cantidad: number
    notas_item: string | null
    productos: { id: number; nombre: string }
  }[]
  orden_combos: {
    id: number
    cantidad: number
    combos: { id: number; nombre: string }
  }[]
}

const ESTADOS_COCINA = ['pendiente', 'en_preparacion']

export default function CocinaPage() {
  const router = useRouter()
  const [ordenes, setOrdenes] = useState<OrdenCocina[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const token = typeof window !== 'undefined' ? localStorage.getItem('accessToken') : null

  const fetchOrdenes = useCallback(async () => {
    if (!token) {
      router.push('/login')
      return
    }

    try {
      const res = await apiClient.get('/orders', {
        headers: { Authorization: `Bearer ${token}` },
      })
      // Solo mostrar pendientes y en preparación
      const activas = (res.data?.items ?? []).filter((o: OrdenCocina) => ESTADOS_COCINA.includes(o.estado))
      setOrdenes(activas)
    } catch (err: any) {
      if (err?.response?.status === 401) {
        router.push('/login')
      } else {
        setError('No se pudieron cargar las comandas. Verifica tu conexión.')
      }
    } finally {
      setLoading(false)
    }
  }, [token, router])

  useEffect(() => {
    fetchOrdenes()
    // Refrescar cada 15 segundos automáticamente
    const interval = setInterval(fetchOrdenes, 15000)
    return () => clearInterval(interval)
  }, [fetchOrdenes])

  const cambiarEstado = async (ordenId: number, nuevoEstado: string) => {
    try {
      await apiClient.patch(
        `/orders/${ordenId}/status`,
        { estado: nuevoEstado },
        { headers: { Authorization: `Bearer ${token}` } }
      )
      fetchOrdenes()
    } catch {
      setError('Error al actualizar el estado')
    }
  }

  const tiempoTranscurrido = (fecha: string) => {
    const diff = Math.floor((Date.now() - new Date(fecha).getTime()) / 60000)
    if (diff < 1) return 'Ahora'
    if (diff === 1) return '1 min'
    return `${diff} min`
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0A0A0A] flex items-center justify-center">
        <p className="text-gray-400 text-lg font-bold">Cargando comandas...</p>
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
          <span className="text-2xl">🍳</span>
          <div>
            <h1 className="text-white font-extrabold text-lg leading-none">Sistema Cocina</h1>
            <p className="text-gray-400 text-xs mt-0.5">I KE TACOS BIRRIA</p>
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
            aria-label="Actualizar comandas"
            className="text-gray-400 hover:text-white transition-colors p-2 rounded-lg"
            style={{ background: 'rgba(255,255,255,0.06)' }}
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
        </div>
      </div>

      <main className="pt-20 pb-8 px-4 max-w-4xl mx-auto">
        {error && (
          <div className="flex flex-col items-center justify-center min-h-[60vh] text-center">
            <div
              className="w-20 h-20 rounded-full flex items-center justify-center text-4xl mb-4"
              style={{ background: '#1A1A1A' }}
            >
              😕
            </div>
            <p className="text-white font-extrabold text-lg mb-1">Sin conexión</p>
            <p className="text-gray-400 text-sm mb-5">{error}</p>
            <button
              onClick={fetchOrdenes}
              className="px-6 py-3 rounded-2xl text-white font-extrabold text-sm transition-all active:scale-95"
              style={{ background: 'linear-gradient(135deg, #F28500 0%, #D4700A 100%)' }}
            >
              Reintentar
            </button>
          </div>
        )}

        {!error && ordenes.length === 0 && (
          <div className="flex flex-col items-center justify-center min-h-[60vh] text-center">
            <div
              className="w-24 h-24 rounded-full flex items-center justify-center text-5xl mb-4"
              style={{ background: '#1A1A1A' }}
            >
              ✅
            </div>
            <h2 className="text-white font-extrabold text-xl mb-2">Sin comandas pendientes</h2>
            <p className="text-gray-400 text-sm">
              Las nuevas órdenes aparecerán aquí automáticamente
            </p>
          </div>
        )}

        {!error && ordenes.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
            {ordenes.map((orden) => (
              <div
                key={orden.id}
                className="rounded-2xl p-4"
                style={{
                  background: orden.estado === 'en_preparacion' ? '#1A1200' : '#1A1A1A',
                  border:
                    orden.estado === 'en_preparacion'
                      ? '1px solid rgba(242,133,0,0.4)'
                      : '1px solid rgba(255,255,255,0.06)',
                }}
              >
                {/* Header de la comanda */}
                <div className="flex items-center justify-between mb-3">
                  <div>
                    <span
                      className="text-xs font-black px-2 py-1 rounded-lg"
                      style={{ background: '#F28500', color: 'white' }}
                    >
                      {orden.numero.replace(/ORD-\d{8}-/, 'ORD-')}
                    </span>
                    {orden.nombre_cliente && (
                      <span className="text-gray-400 text-xs ml-2 font-bold">
                        {orden.nombre_cliente}
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    <span
                      className="text-xs font-bold px-2 py-1 rounded-full"
                      style={{
                        background:
                          orden.estado === 'en_preparacion'
                            ? 'rgba(242,133,0,0.2)'
                            : 'rgba(255,255,255,0.08)',
                        color: orden.estado === 'en_preparacion' ? '#F28500' : '#9CA3AF',
                      }}
                    >
                      {orden.estado === 'en_preparacion' ? '🔥 En preparación' : '⏳ Pendiente'}
                    </span>
                    <span className="text-gray-500 text-xs">
                      {tiempoTranscurrido(orden.creado_en)}
                    </span>
                  </div>
                </div>

                {/* Items de la comanda */}
                <div className="rounded-xl p-3 mb-3" style={{ background: 'rgba(0,0,0,0.3)' }}>
                  {orden.orden_detalles.map((detalle) => (
                    <div key={detalle.id} className="flex items-start gap-2 mb-1 last:mb-0">
                      <span
                        className="font-black text-sm min-w-[24px]"
                        style={{ color: '#F28500' }}
                      >
                        {detalle.cantidad}x
                      </span>
                      <div>
                        <span className="text-white font-bold text-sm">
                          {detalle.productos.nombre}
                        </span>
                        {detalle.notas_item && (
                          <p className="text-yellow-400 text-xs mt-0.5">⚠️ {detalle.notas_item}</p>
                        )}
                      </div>
                    </div>
                  ))}

                  {orden.orden_combos.map((combo) => (
                    <div key={combo.id} className="flex items-center gap-2 mb-1 last:mb-0">
                      <span
                        className="font-black text-sm min-w-[24px]"
                        style={{ color: '#F28500' }}
                      >
                        {combo.cantidad}x
                      </span>
                      <span className="text-white font-bold text-sm">{combo.combos.nombre}</span>
                      <span
                        className="text-xs px-1.5 py-0.5 rounded"
                        style={{ background: 'rgba(242,133,0,0.2)', color: '#F28500' }}
                      >
                        combo
                      </span>
                    </div>
                  ))}

                  {orden.notas_orden && (
                    <p
                      className="text-yellow-400 text-xs mt-2 pt-2 font-bold"
                      style={{ borderTop: '1px solid rgba(255,255,255,0.06)' }}
                    >
                      📝 {orden.notas_orden}
                    </p>
                  )}
                </div>

                {/* Botones de acción */}
                <div className="flex gap-2">
                  {orden.estado === 'pendiente' && (
                    <button
                      onClick={() => cambiarEstado(orden.id, 'en_preparacion')}
                      className="flex-1 py-2.5 rounded-xl text-white font-extrabold text-sm transition-all active:scale-95"
                      style={{ background: 'linear-gradient(135deg, #F28500 0%, #D4700A 100%)' }}
                    >
                      🔥 Iniciar preparación
                    </button>
                  )}

                  {orden.estado === 'en_preparacion' && (
                    <button
                      onClick={() => cambiarEstado(orden.id, 'lista')}
                      className="flex-1 py-2.5 rounded-xl text-white font-extrabold text-sm transition-all active:scale-95"
                      style={{ background: 'linear-gradient(135deg, #27AE60 0%, #1E8449 100%)' }}
                    >
                      ✅ Marcar como lista
                    </button>
                  )}

                  <button
                    onClick={() => cambiarEstado(orden.id, 'cancelada')}
                    className="py-2.5 px-3 rounded-xl text-gray-400 hover:text-red-400 font-extrabold text-sm transition-all"
                    style={{ background: 'rgba(255,255,255,0.06)' }}
                  >
                    ✕
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  )
}
