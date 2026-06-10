'use client'

import { useState, useEffect, useCallback } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import apiClient from '@/lib/api/client'

// ─── Types ────────────────────────────────────────────────────────────────────

interface HistorialEstado {
  estado: string
  registrado_en: string
}

interface Pago {
  id: number
  metodo_pago_id: number
  monto: string
  comprobante_url: string | null
  confirmado: boolean | null
}

interface OrdenTracking {
  id: number
  numero: string
  estado: string
  tipo_servicio: string
  nombre_cliente: string | null
  subtotal: string
  total: string
  creado_en: string
  actualizado_en: string
  notas_orden: string | null
  direccion_entrega: string | null
  orden_detalles: {
    cantidad: number
    precio_unitario?: string
    productos: { nombre: string; precio_base: string }
  }[]
  orden_combos: {
    cantidad: number
    precio_unitario?: string
    combos: { nombre: string; precio: string }
  }[]
  pagos: Pago[]
  orden_estados_historial: HistorialEstado[]
}

// ─── Constants ────────────────────────────────────────────────────────────────

const ESTADO_CONFIG: Record<string, { label: string; color: string; bg: string }> = {
  pendiente:      { label: 'Pendiente',   color: '#9CA3AF', bg: 'rgba(156,163,175,0.12)' },
  en_preparacion: { label: 'Preparando',  color: '#F28500', bg: 'rgba(242,133,0,0.15)'   },
  lista:          { label: 'Lista',       color: '#27AE60', bg: 'rgba(39,174,96,0.15)'   },
  entregada:      { label: 'Entregada',   color: '#2980B9', bg: 'rgba(41,128,185,0.15)'  },
  pagada:         { label: 'Pagada',      color: '#2980B9', bg: 'rgba(41,128,185,0.15)'  },
  cancelada:      { label: 'Cancelada',   color: '#E74C3C', bg: 'rgba(231,76,60,0.15)'   },
}

// Timeline: estados en orden según tipo de servicio
const TIMELINE_DOMICILIO = ['pendiente', 'en_preparacion', 'lista', 'entregada']
const TIMELINE_DEFAULT   = ['pendiente', 'en_preparacion', 'lista', 'pagada']

// ─── Timeline component ───────────────────────────────────────────────────────

function Timeline({
  historial,
  estadoActual,
  tipServicio,
}: {
  historial: HistorialEstado[]
  estadoActual: string
  tipServicio: string
}) {
  const steps = tipServicio === 'domicilio' ? TIMELINE_DOMICILIO : TIMELINE_DEFAULT
  const estadosAlcanzados = new Set(historial.map((h) => h.estado))

  return (
    <div className="flex flex-col gap-0">
      {steps.map((step, i) => {
        const alcanzado = estadosAlcanzados.has(step)
        const esActual  = estadoActual === step
        const config    = ESTADO_CONFIG[step] ?? ESTADO_CONFIG['pendiente']
        const registro  = historial.find((h) => h.estado === step)
        const isLast    = i === steps.length - 1

        return (
          <div key={step} className="flex items-stretch gap-3">
            {/* Left: dot + line */}
            <div className="flex flex-col items-center" style={{ width: 24 }}>
              <div
                className="w-5 h-5 rounded-full flex-shrink-0 flex items-center justify-center z-10"
                style={{
                  background: alcanzado ? config.color : 'rgba(255,255,255,0.08)',
                  border: esActual ? `2px solid ${config.color}` : 'none',
                  boxShadow: esActual ? `0 0 10px ${config.color}55` : 'none',
                }}
              >
                {alcanzado && (
                  <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="20 6 9 17 4 12" />
                  </svg>
                )}
              </div>
              {!isLast && (
                <div
                  className="w-0.5 flex-1 my-1"
                  style={{ background: alcanzado ? config.color : 'rgba(255,255,255,0.08)', minHeight: 24 }}
                />
              )}
            </div>

            {/* Right: label + time */}
            <div className="pb-4 flex-1 flex items-start justify-between">
              <p
                className="text-sm font-extrabold leading-5"
                style={{ color: alcanzado ? config.color : '#4B5563' }}
              >
                {config.label}
              </p>
              {registro && (
                <p className="text-xs font-medium ml-2 flex-shrink-0" style={{ color: '#6B7280' }}>
                  {new Date(registro.registrado_en).toLocaleTimeString('es-MX', {
                    hour: '2-digit', minute: '2-digit', timeZone: 'America/Hermosillo',
                  })}
                </p>
              )}
            </div>
          </div>
        )
      })}
    </div>
  )
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function PedidoTrackingPage() {
  const { numero } = useParams<{ numero: string }>()
  const router = useRouter()

  const [orden, setOrden]       = useState<OrdenTracking | null>(null)
  const [loading, setLoading]   = useState(true)
  const [notFound, setNotFound] = useState(false)

  const fetchOrden = useCallback(async () => {
    try {
      const res = await apiClient.get(`/orders/track/${numero}`)
      setOrden(res.data)
      setNotFound(false)
    } catch (err: unknown) {
      const status = (err as { response?: { status?: number } })?.response?.status
      if (status === 404) setNotFound(true)
    } finally {
      setLoading(false)
    }
  }, [numero])

  useEffect(() => {
    fetchOrden()
    const interval = setInterval(fetchOrden, 30000)
    return () => clearInterval(interval)
  }, [fetchOrden])

  // ── Loading ──
  if (loading) {
    return (
      <div className="min-h-screen bg-[#0A0A0A] flex items-center justify-center">
        <p className="text-gray-400 font-bold">Cargando pedido...</p>
      </div>
    )
  }

  // ── Not found ──
  if (notFound || !orden) {
    return (
      <div className="min-h-screen bg-[#0A0A0A] flex flex-col items-center justify-center px-4 gap-4">
        <p className="text-white font-extrabold text-xl text-center">Pedido no encontrado</p>
        <p className="text-gray-400 text-sm text-center">Verifica el número e intenta de nuevo</p>
        <Link
          href="/menu"
          className="px-6 py-3 rounded-2xl text-white font-extrabold text-sm transition-all active:scale-95"
          style={{ background: 'linear-gradient(135deg, #F28500 0%, #D4700A 100%)' }}
        >
          Ir al menú
        </Link>
      </div>
    )
  }

  const estadoConfig   = ESTADO_CONFIG[orden.estado] ?? ESTADO_CONFIG['pendiente']
  const pagoTransf     = orden.pagos.find((p) => p.metodo_pago_id === 3)
  const necesitaPago   = pagoTransf && !pagoTransf.comprobante_url && pagoTransf.confirmado === null
  const ordenTerminada = ['entregada', 'pagada', 'cancelada'].includes(orden.estado)

  const getResumen = () => {
    const items = [
      ...(orden.orden_detalles ?? []).map((d) => `${d.cantidad}× ${d.productos.nombre}`),
      ...(orden.orden_combos   ?? []).map((c) => `${c.cantidad}× ${c.combos.nombre}`),
    ]
    return items.filter(Boolean)
  }

  return (
    <div className="min-h-screen bg-[#0A0A0A]">
      {/* Minimal header */}
      <div
        className="fixed top-0 left-0 right-0 z-50 px-4 py-3 flex items-center gap-3"
        style={{ background: '#111', borderBottom: '1px solid rgba(255,255,255,0.08)' }}
      >
        <button
          onClick={() => router.back()}
          className="p-2 rounded-xl text-gray-400 hover:text-white transition-colors"
          style={{ background: 'rgba(255,255,255,0.06)' }}
          aria-label="Volver"
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
            <path d="M19 12H5M5 12l7 7M5 12l7-7" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </button>
        <div className="flex-1 min-w-0">
          <h1 className="text-white font-extrabold text-base leading-none truncate">
            {orden.numero.replace(/ORD-\d{8}-/, 'ORD-')}
          </h1>
          <p className="text-gray-500 text-xs mt-0.5">Seguimiento de pedido</p>
        </div>
        {/* Auto-refresh indicator */}
        {!ordenTerminada && (
          <div className="flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
            <span className="text-gray-500 text-xs">En vivo</span>
          </div>
        )}
      </div>

      <main className="pt-20 pb-10 px-4 max-w-lg mx-auto space-y-4 mt-4">

        {/* Estado actual */}
        <div
          className="rounded-3xl p-4 flex items-center justify-between"
          style={{ background: '#1A1A1A', border: `1px solid ${estadoConfig.color}44` }}
        >
          <div>
            <p className="text-gray-400 text-xs font-semibold mb-1">Estado actual</p>
            <span
              className="text-lg font-extrabold"
              style={{ color: estadoConfig.color }}
            >
              {estadoConfig.label}
            </span>
          </div>
          <div
            className="w-12 h-12 rounded-2xl flex items-center justify-center"
            style={{ background: estadoConfig.bg }}
          >
            {orden.estado === 'pendiente'      && <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={estadoConfig.color} strokeWidth="2" strokeLinecap="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>}
            {orden.estado === 'en_preparacion' && <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={estadoConfig.color} strokeWidth="2" strokeLinecap="round"><path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"/></svg>}
            {orden.estado === 'lista'          && <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={estadoConfig.color} strokeWidth="2" strokeLinecap="round"><polyline points="20 6 9 17 4 12"/></svg>}
            {(orden.estado === 'entregada' || orden.estado === 'pagada') && <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={estadoConfig.color} strokeWidth="2" strokeLinecap="round"><path d="M22 11.08V12a10 10 0 11-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>}
            {orden.estado === 'cancelada'      && <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={estadoConfig.color} strokeWidth="2" strokeLinecap="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>}
          </div>
        </div>

        {/* Timeline */}
        {orden.estado !== 'cancelada' && (
          <div
            className="rounded-3xl p-4"
            style={{ background: '#1A1A1A', border: '1px solid rgba(255,255,255,0.06)' }}
          >
            <p className="text-xs font-bold uppercase tracking-widest mb-4" style={{ color: '#F28500' }}>
              Progreso
            </p>
            <Timeline
              historial={orden.orden_estados_historial}
              estadoActual={orden.estado}
              tipServicio={orden.tipo_servicio}
            />
          </div>
        )}

        {/* Items */}
        <div
          className="rounded-3xl p-4"
          style={{ background: '#1A1A1A', border: '1px solid rgba(255,255,255,0.06)' }}
        >
          <p className="text-xs font-bold uppercase tracking-widest mb-3" style={{ color: '#F28500' }}>
            Tu pedido
          </p>
          <div className="flex flex-col gap-2">
            {getResumen().map((item, i) => (
              <p key={i} className="text-gray-300 text-sm font-medium">{item}</p>
            ))}
          </div>
          <div className="h-px my-3" style={{ background: 'rgba(255,255,255,0.07)' }} />
          <div className="flex items-center justify-between">
            <span className="text-gray-400 text-sm font-semibold">Total</span>
            <span className="font-extrabold text-xl" style={{ color: '#F28500' }}>
              ${parseFloat(orden.total).toFixed(2)}
            </span>
          </div>
        </div>

        {/* Pago pendiente de transferencia */}
        {necesitaPago && (
          <div
            className="rounded-3xl p-4"
            style={{ background: 'rgba(41,128,185,0.08)', border: '1px solid rgba(41,128,185,0.3)' }}
          >
            <p className="text-blue-300 font-extrabold text-sm mb-1">Pago por transferencia requerido</p>
            <p className="text-gray-400 text-xs mb-3">
              Realiza la transferencia y sube tu comprobante para confirmar el pedido.
            </p>
            <p className="text-white font-extrabold text-base mb-3">
              Monto: ${parseFloat(pagoTransf!.monto).toFixed(2)}
            </p>
            <Link
              href={`/transferencia?ordenId=${orden.id}&total=${pagoTransf!.monto}&pagoId=${pagoTransf!.id}`}
              className="w-full py-3 rounded-2xl text-white font-extrabold text-sm text-center block transition-all active:scale-95"
              style={{ background: 'linear-gradient(135deg, #2980B9 0%, #1A5276 100%)' }}
            >
              Ir a pagar por transferencia
            </Link>
          </div>
        )}

        {/* Delivery address */}
        {orden.tipo_servicio === 'domicilio' && orden.direccion_entrega && (
          <div
            className="rounded-3xl p-4"
            style={{ background: '#1A1A1A', border: '1px solid rgba(255,255,255,0.06)' }}
          >
            <p className="text-xs font-bold uppercase tracking-widest mb-2" style={{ color: '#5DADE2' }}>
              Dirección de entrega
            </p>
            <p className="text-gray-300 text-sm">{orden.direccion_entrega}</p>
          </div>
        )}

        {/* Actions */}
        <div className="flex flex-col gap-2 pt-2">
          <Link
            href="/menu"
            className="w-full py-3 rounded-2xl font-extrabold text-sm text-center transition-all active:scale-95"
            style={{ background: 'rgba(255,255,255,0.06)', color: '#F28500' }}
          >
            Volver al menú
          </Link>
        </div>
      </main>
    </div>
  )
}
