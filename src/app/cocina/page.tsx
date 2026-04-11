'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { useRouter } from 'next/navigation'
import apiClient from '@/lib/api/client'
import RefreshDot from '@/components/ui/RefreshDot'

// ─── Types ────────────────────────────────────────────────────────────────────

interface OrdenCocina {
  id: number
  numero: string
  estado: string
  nombre_cliente: string | null
  notas_orden: string | null
  creado_en: string
  actualizado_en: string
  tiempo_estimado_minutos: number | null
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

// ─── Countdown hook ───────────────────────────────────────────────────────────

function useCountdown(targetMs: number | null): number | null {
  const [remaining, setRemaining] = useState<number | null>(null)

  useEffect(() => {
    if (targetMs === null) { setRemaining(null); return }
    const tick = () => setRemaining(Math.max(0, Math.floor((targetMs - Date.now()) / 1000)))
    tick()
    const id = setInterval(tick, 1000)
    return () => clearInterval(id)
  }, [targetMs])

  return remaining
}

// ─── Countdown display ────────────────────────────────────────────────────────

function CountdownBadge({ remaining }: { remaining: number }) {
  const mins = Math.floor(remaining / 60)
  const secs = remaining % 60
  const label = `${mins}:${String(secs).padStart(2, '0')}`
  const isOverdue  = remaining === 0
  const isUrgent   = remaining > 0 && remaining <= 120   // ≤ 2 min
  const isWarning  = remaining > 120 && remaining <= 300 // ≤ 5 min

  const color = isOverdue ? '#EF4444' : isUrgent ? '#F59E0B' : isWarning ? '#FBBF24' : '#27AE60'
  const bg    = isOverdue ? 'rgba(239,68,68,0.15)'
              : isUrgent  ? 'rgba(245,158,11,0.15)'
              : isWarning ? 'rgba(251,191,36,0.12)'
              :             'rgba(39,174,96,0.12)'
  const border = isOverdue ? 'rgba(239,68,68,0.4)'
               : isUrgent  ? 'rgba(245,158,11,0.35)'
               : isWarning ? 'rgba(251,191,36,0.3)'
               :             'rgba(39,174,96,0.3)'

  return (
    <span
      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-sm font-extrabold tabular-nums"
      style={{
        background: bg,
        border: `1px solid ${border}`,
        color,
        animation: isOverdue || isUrgent ? 'pulseBadge 1s ease-in-out infinite' : undefined,
      }}
    >
      <span style={{ fontSize: '0.7rem' }}>⏱</span>
      {isOverdue ? '¡Tiempo!' : label}
    </span>
  )
}

// ─── Timer section inside each comanda ───────────────────────────────────────

function TimerSection({
  orden,
  token,
  onTimeSet,
}: {
  orden: OrdenCocina
  token: string | null
  onTimeSet: (ordenId: number, targetMs: number, mins: number) => void
}) {
  const [inputVal, setInputVal]   = useState(
    orden.tiempo_estimado_minutos ? String(orden.tiempo_estimado_minutos) : ''
  )
  const [saving, setSaving]       = useState(false)
  const [flash, setFlash]         = useState(false)
  const [fieldError, setFieldError] = useState('')
  const inputRef = useRef<HTMLInputElement>(null)

  const handleSave = async () => {
    const mins = parseInt(inputVal, 10)
    if (isNaN(mins) || mins < 1 || mins > 480) {
      setFieldError('Ingresa entre 1 y 480 min')
      inputRef.current?.focus()
      return
    }
    setFieldError('')
    setSaving(true)
    try {
      await apiClient.patch(
        `/orders/${orden.id}/estimated-time`,
        { tiempoEstimadoMinutos: mins },
        { headers: { Authorization: `Bearer ${token}` } }
      )
      const target = Date.now() + mins * 60 * 1000
      onTimeSet(orden.id, target, mins)
      setFlash(true)
      setTimeout(() => setFlash(false), 2000)
    } catch (err: any) {
      const msg = err?.response?.data?.error ?? 'Error al guardar el tiempo'
      setFieldError(msg)
    } finally {
      setSaving(false)
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') handleSave()
  }

  return (
    <div
      className="rounded-xl px-3 py-2.5 mb-3 flex flex-col gap-2"
      style={{ background: 'rgba(242,133,0,0.06)', border: '1px solid rgba(242,133,0,0.15)' }}
    >
      <p className="text-xs font-extrabold uppercase tracking-wider" style={{ color: '#F28500' }}>
        ⏱ Tiempo estimado
      </p>

      <div className="flex items-center gap-2">
        {/* Input */}
        <div className="relative flex items-center">
          <input
            ref={inputRef}
            type="number"
            min={1}
            max={480}
            value={inputVal}
            onChange={(e) => { setInputVal(e.target.value); setFieldError('') }}
            onKeyDown={handleKeyDown}
            placeholder="min"
            className="w-20 rounded-xl border bg-[#0A0A0A] px-3 py-2 text-sm font-extrabold text-white text-center focus:outline-none transition"
            style={{ borderColor: fieldError ? 'rgba(239,68,68,0.6)' : 'rgba(242,133,0,0.35)' }}
            onFocus={(e) => (e.currentTarget.style.borderColor = '#F28500')}
            onBlur={(e) => (e.currentTarget.style.borderColor = fieldError ? 'rgba(239,68,68,0.6)' : 'rgba(242,133,0,0.35)')}
          />
          <span className="absolute right-2 text-xs text-gray-500 pointer-events-none">min</span>
        </div>

        {/* Save button */}
        <button
          onClick={handleSave}
          disabled={saving || !inputVal}
          className="px-3 py-2 rounded-xl text-xs font-extrabold text-white transition-all active:scale-95 disabled:opacity-40"
          style={{ background: 'linear-gradient(135deg, #F28500 0%, #D4700A 100%)' }}
        >
          {saving ? '…' : 'Guardar'}
        </button>

        {/* Flash */}
        {flash && (
          <span className="text-xs font-bold text-emerald-400" style={{ animation: 'fadeOut 2s forwards' }}>
            ✓ Guardado
          </span>
        )}
      </div>

      {fieldError && (
        <p className="text-xs text-red-400 font-semibold">{fieldError}</p>
      )}
    </div>
  )
}

// ─── Comanda card ─────────────────────────────────────────────────────────────

function ComandaCard({
  orden,
  token,
  onStatusChange,
}: {
  orden: OrdenCocina
  token: string | null
  onStatusChange: (ordenId: number, estado: string) => void
}) {
  // targetMs: timestamp when the countdown expires
  // Initialise from servidor data via actualizado_en + tiempo_estimado_minutos
  const [targetMs, setTargetMs] = useState<number | null>(() => {
    if (orden.tiempo_estimado_minutos && orden.actualizado_en) {
      return new Date(orden.actualizado_en).getTime() + orden.tiempo_estimado_minutos * 60 * 1000
    }
    return null
  })

  // If polling brings a new tiempo_estimado_minutos and we don't have a local target yet
  useEffect(() => {
    if (orden.tiempo_estimado_minutos && orden.actualizado_en && targetMs === null) {
      setTargetMs(
        new Date(orden.actualizado_en).getTime() + orden.tiempo_estimado_minutos * 60 * 1000
      )
    }
  }, [orden.tiempo_estimado_minutos, orden.actualizado_en]) // eslint-disable-line

  const remaining = useCountdown(targetMs)

  const tiempoTranscurrido = (fecha: string) => {
    const diff = Math.floor((Date.now() - new Date(fecha).getTime()) / 60000)
    if (diff < 1) return 'Ahora'
    if (diff === 1) return '1 min'
    return `${diff} min`
  }

  const isEnPreparacion = orden.estado === 'en_preparacion'

  return (
    <div
      className="rounded-2xl p-4"
      style={{
        background: isEnPreparacion ? '#1A1200' : '#1A1A1A',
        border: isEnPreparacion
          ? '1px solid rgba(242,133,0,0.4)'
          : '1px solid rgba(255,255,255,0.06)',
      }}
    >
      {/* ── Header ── */}
      <div className="flex items-center justify-between mb-3">
        <div>
          <span
            className="text-xs font-black px-2 py-1 rounded-lg"
            style={{ background: '#F28500', color: 'white' }}
          >
            {orden.numero.replace(/ORD-\d{8}-/, 'ORD-')}
          </span>
          {orden.nombre_cliente && (
            <span className="text-gray-400 text-xs ml-2 font-bold">{orden.nombre_cliente}</span>
          )}
        </div>
        <div className="flex items-center gap-2">
          <span
            className="text-xs font-bold px-2 py-1 rounded-full"
            style={{
              background: isEnPreparacion ? 'rgba(242,133,0,0.2)' : 'rgba(255,255,255,0.08)',
              color: isEnPreparacion ? '#F28500' : '#9CA3AF',
            }}
          >
            {isEnPreparacion ? '🔥 En preparación' : '⏳ Pendiente'}
          </span>
          <span className="text-gray-500 text-xs">{tiempoTranscurrido(orden.creado_en)}</span>
        </div>
      </div>

      {/* ── Items ── */}
      <div className="rounded-xl p-3 mb-3" style={{ background: 'rgba(0,0,0,0.3)' }}>
        {orden.orden_detalles.map((detalle) => (
          <div key={detalle.id} className="flex items-start gap-2 mb-1 last:mb-0">
            <span className="font-black text-sm min-w-[24px]" style={{ color: '#F28500' }}>
              {detalle.cantidad}x
            </span>
            <div>
              <span className="text-white font-bold text-sm">{detalle.productos.nombre}</span>
              {detalle.notas_item && (
                <p className="text-yellow-400 text-xs mt-0.5">⚠️ {detalle.notas_item}</p>
              )}
            </div>
          </div>
        ))}

        {orden.orden_combos.map((combo) => (
          <div key={combo.id} className="flex items-center gap-2 mb-1 last:mb-0">
            <span className="font-black text-sm min-w-[24px]" style={{ color: '#F28500' }}>
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

      {/* ── Countdown badge (when time is set) ── */}
      {remaining !== null && (
        <div className="flex items-center gap-2 mb-3">
          <CountdownBadge remaining={remaining} />
          {remaining === 0 && (
            <span className="text-xs font-bold text-red-400">Tiempo de entrega vencido</span>
          )}
        </div>
      )}

      {/* ── Timer input ── */}
      <TimerSection
        orden={orden}
        token={token}
        onTimeSet={(id, target) => setTargetMs(target)}
      />

      {/* ── Action buttons ── */}
      <div className="flex gap-2">
        {orden.estado === 'pendiente' && (
          <button
            onClick={() => onStatusChange(orden.id, 'en_preparacion')}
            className="flex-1 py-2.5 rounded-xl text-white font-extrabold text-sm transition-all active:scale-95"
            style={{ background: 'linear-gradient(135deg, #F28500 0%, #D4700A 100%)' }}
          >
            🔥 Iniciar preparación
          </button>
        )}
        {orden.estado === 'en_preparacion' && (
          <button
            onClick={() => onStatusChange(orden.id, 'lista')}
            className="flex-1 py-2.5 rounded-xl text-white font-extrabold text-sm transition-all active:scale-95"
            style={{ background: 'linear-gradient(135deg, #27AE60 0%, #1E8449 100%)' }}
          >
            ✅ Marcar como lista
          </button>
        )}
        <button
          onClick={() => onStatusChange(orden.id, 'cancelada')}
          className="py-2.5 px-3 rounded-xl text-gray-400 hover:text-red-400 font-extrabold text-sm transition-all"
          style={{ background: 'rgba(255,255,255,0.06)' }}
          aria-label="Cancelar orden"
        >
          ✕
        </button>
      </div>
    </div>
  )
}

// ─── Page ─────────────────────────────────────────────────────────────────────

const ESTADOS_COCINA = ['pendiente', 'en_preparacion']

export default function CocinaPage() {
  const router = useRouter()
  const [ordenes, setOrdenes] = useState<OrdenCocina[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError]     = useState('')

  const token = typeof window !== 'undefined' ? localStorage.getItem('accessToken') : null

  const fetchOrdenes = useCallback(async () => {
    if (!token) { router.push('/login'); return }
    try {
      const res = await apiClient.get('/orders', {
        headers: { Authorization: `Bearer ${token}` },
      })
      const activas = (res.data?.items ?? []).filter((o: OrdenCocina) =>
        ESTADOS_COCINA.includes(o.estado)
      )
      setOrdenes(activas)
      setError('')
    } catch (err: any) {
      if (err?.response?.status === 401) router.push('/login')
      else setError('No se pudieron cargar las comandas. Verifica tu conexión.')
    } finally {
      setLoading(false)
    }
  }, [token, router])

  useEffect(() => {
    fetchOrdenes()
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

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0A0A0A] flex items-center justify-center">
        <p className="text-gray-400 text-lg font-bold">Cargando comandas...</p>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#0A0A0A]">
      {/* ── Topbar ── */}
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
              <path d="M1 4v6h6M23 20v-6h-6" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
              <path d="M20.49 9A9 9 0 0 0 5.64 5.64L1 10m22 4l-4.64 4.36A9 9 0 0 1 3.51 15" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </button>
        </div>
      </div>

      <main className="pt-20 pb-8 px-4 max-w-4xl mx-auto">
        {/* ── Error state ── */}
        {error && (
          <div className="flex flex-col items-center justify-center min-h-[60vh] text-center">
            <div className="w-20 h-20 rounded-full flex items-center justify-center text-4xl mb-4" style={{ background: '#1A1A1A' }}>
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

        {/* ── Empty state ── */}
        {!error && ordenes.length === 0 && (
          <div className="flex flex-col items-center justify-center min-h-[60vh] text-center">
            <div className="w-24 h-24 rounded-full flex items-center justify-center text-5xl mb-4" style={{ background: '#1A1A1A' }}>
              ✅
            </div>
            <h2 className="text-white font-extrabold text-xl mb-2">Sin comandas pendientes</h2>
            <p className="text-gray-400 text-sm">Las nuevas órdenes aparecerán aquí automáticamente</p>
          </div>
        )}

        {/* ── Grid ── */}
        {!error && ordenes.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
            {ordenes.map((orden) => (
              <ComandaCard
                key={orden.id}
                orden={orden}
                token={token}
                onStatusChange={cambiarEstado}
              />
            ))}
          </div>
        )}
      </main>

      <style>{`
        @keyframes pulseBadge {
          0%, 100% { opacity: 1; }
          50%       { opacity: 0.55; }
        }
        @keyframes fadeOut {
          0%   { opacity: 1; }
          70%  { opacity: 1; }
          100% { opacity: 0; }
        }
      `}</style>
    </div>
  )
}
