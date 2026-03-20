'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import NavComponent from '@/components/ui/NavComponent'
import apiClient from '@/lib/api/client'

interface OrdenHistorial {
  id: number
  numero: string
  estado: string
  subtotal: string
  total: string
  creado_en: string
  nombre_cliente: string | null
  orden_detalles: {
    id: number
    cantidad: number
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

export default function MisPedidosPage() {
  const router = useRouter()
  const [ordenes, setOrdenes] = useState<OrdenHistorial[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [noLogueado, setNoLogueado] = useState(false)

  useEffect(() => {
    const token = localStorage.getItem('accessToken')
    if (!token) {
      setNoLogueado(true)
      setLoading(false)
      return
    }

    apiClient
      .get('/orders/my', {
        headers: { Authorization: `Bearer ${token}` },
      })
      .then((res) => setOrdenes(res.data))
      .catch((err) => {
        if (err?.response?.status === 401) {
          router.push('/login')
        } else {
          setError('Error al cargar tus pedidos')
        }
      })
      .finally(() => setLoading(false))
  }, [router])

  const formatFecha = (fecha: string) => {
    return new Date(fecha).toLocaleDateString('es-MX', {
      day: 'numeric',
      month: 'short',
      hour: '2-digit',
      minute: '2-digit',
      timeZone: 'America/Hermosillo',
    })
  }

  const getResumen = (orden: OrdenHistorial) => {
    const items = [
      ...orden.orden_detalles.map((d) => `${d.cantidad}x ${d.productos.nombre}`),
      ...orden.orden_combos.map((c) => `${c.cantidad}x ${c.combos.nombre}`),
    ]
    return items.join(', ')
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0A0A0A] flex items-center justify-center">
        <p className="text-gray-400">Cargando pedidos...</p>
      </div>
    )
  }

  if (noLogueado) {
    return (
      <div className="min-h-screen bg-[#0A0A0A]">
        <NavComponent title="Mis Pedidos" />
        <main className="px-4 pt-20 pb-28 max-w-lg mx-auto w-full">
          <div className="flex flex-col items-center justify-center min-h-[60vh] text-center">
            <div
              className="w-24 h-24 rounded-full flex items-center justify-center text-5xl mb-5"
              style={{ background: '#1A1A1A' }}
            >
              🔒
            </div>
            <h2 className="text-white font-display mb-2" style={{ fontSize: '2rem' }}>
              INICIA SESIÓN
            </h2>
            <p className="text-gray-400 font-medium mb-8 text-sm">
              Para ver tus pedidos necesitas una cuenta
            </p>
            <div className="flex flex-col gap-3 w-full max-w-xs">
              <Link
                href="/login"
                className="w-full py-4 rounded-2xl text-white font-extrabold text-lg text-center transition-all active:scale-95"
                style={{ background: 'linear-gradient(135deg, #F28500 0%, #D4700A 100%)' }}
              >
                Iniciar sesión
              </Link>
              <Link
                href="/register"
                className="w-full py-4 rounded-2xl font-extrabold text-lg text-center transition-all active:scale-95"
                style={{ background: 'rgba(255,255,255,0.08)', color: '#F28500' }}
              >
                Crear cuenta
              </Link>
            </div>
          </div>
        </main>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#0A0A0A]">
      <NavComponent title="Mis Pedidos" />

      <main className="px-4 pt-20 pb-28 max-w-lg mx-auto w-full">
        {error && <p className="text-red-400 text-sm font-bold text-center mb-4">{error}</p>}

        {ordenes.length === 0 ? (
          <div className="flex flex-col items-center justify-center min-h-[60vh] text-center">
            <div
              className="w-24 h-24 rounded-full flex items-center justify-center text-5xl mb-5"
              style={{ background: '#1A1A1A' }}
            >
              🧾
            </div>
            <h2 className="text-white font-display mb-2" style={{ fontSize: '2rem' }}>
              SIN PEDIDOS
            </h2>
            <p className="text-gray-400 font-medium mb-8">Aún no has realizado ningún pedido</p>
            <Link
              href="/menu"
              className="px-8 py-4 rounded-2xl text-white font-extrabold text-lg transition-all active:scale-95 hover:opacity-90"
              style={{ background: 'linear-gradient(135deg, #F28500 0%, #D4700A 100%)' }}
            >
              Ver Menú
            </Link>
          </div>
        ) : (
          <div className="flex flex-col gap-3 mt-2">
            <h1 className="text-white font-display" style={{ fontSize: '1.75rem' }}>
              Mis Pedidos
            </h1>

            {ordenes.map((orden, index) => {
              const estadoConfig = ESTADO_CONFIG[orden.estado] ?? ESTADO_CONFIG['pendiente']
              return (
                <div
                  key={orden.id}
                  className="rounded-2xl p-4 animate-slide-up"
                  style={{
                    background: '#1A1A1A',
                    border: '1px solid rgba(255,255,255,0.06)',
                    animationDelay: `${index * 0.07}s`,
                  }}
                >
                  {/* Header */}
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

                  {/* Items */}
                  <p className="text-gray-300 text-sm font-medium line-clamp-2 mb-2">
                    {getResumen(orden)}
                  </p>

                  {/* Footer */}
                  <div
                    className="flex items-center justify-between pt-2"
                    style={{ borderTop: '1px solid rgba(255,255,255,0.06)' }}
                  >
                    <span className="text-gray-500 text-xs">{formatFecha(orden.creado_en)}</span>
                    <span className="font-display text-lg" style={{ color: '#F28500' }}>
                      ${parseFloat(orden.total).toFixed(2)}
                    </span>
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
