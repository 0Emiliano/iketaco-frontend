'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import apiClient from '@/lib/api/client'

// ─── Types ────────────────────────────────────────────────────────────────────

interface TopProducto {
  id: string
  nombre: string
  cantidad: number
  total: number
}

interface PeriodoStats {
  inicio: string
  fin: string
  totalVentas: number
  totalOrdenes: number
  ticketPromedio: number
  topProductos: TopProducto[]
}

interface Variacion {
  absoluta: number
  porcentaje: number | null
}

interface TopProductoComparado {
  id: string
  nombre: string
  periodo1: { cantidad: number; total: number } | null
  periodo2: { cantidad: number; total: number } | null
  variacionCantidad: Variacion
  variacionTotal: Variacion
}

interface ReporteComparativo {
  periodo1: PeriodoStats
  periodo2: PeriodoStats
  variacion: {
    totalVentas: Variacion
    totalOrdenes: Variacion
    ticketPromedio: Variacion
  }
  topProductosComparado: TopProductoComparado[]
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function toISO(date: Date) {
  return date.toISOString().slice(0, 10)
}

function defaultRanges() {
  const today = new Date()
  const p1End = toISO(today)
  const p1Start = toISO(new Date(today.getTime() - 6 * 86400000))
  const p2End = toISO(new Date(today.getTime() - 7 * 86400000))
  const p2Start = toISO(new Date(today.getTime() - 13 * 86400000))
  return { p1Start, p1End, p2Start, p2End }
}

function formatDate(iso: string) {
  return new Date(iso + 'T12:00:00').toLocaleDateString('es-MX', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  })
}

function fmt$(n: number) {
  return `$${n.toLocaleString('es-MX', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
}

// ─── Variation chip ───────────────────────────────────────────────────────────

function VarChip({
  v,
  isMoney = false,
}: {
  v: Variacion
  isMoney?: boolean
}) {
  const { absoluta, porcentaje } = v
  const isPos   = absoluta > 0
  const isNeg   = absoluta < 0
  const isZero  = absoluta === 0

  const color  = isPos ? '#27AE60' : isNeg ? '#E74C3C' : '#9CA3AF'
  const bg     = isPos ? 'rgba(39,174,96,0.12)' : isNeg ? 'rgba(231,76,60,0.12)' : 'rgba(156,163,175,0.1)'
  const border = isPos ? 'rgba(39,174,96,0.3)'  : isNeg ? 'rgba(231,76,60,0.3)'  : 'rgba(156,163,175,0.2)'
  const arrow  = isPos ? '↑' : isNeg ? '↓' : '→'

  const pctLabel = porcentaje === null
    ? '—'
    : `${isPos ? '+' : ''}${porcentaje.toFixed(1)}%`

  const absLabel = isMoney
    ? `${isPos ? '+' : ''}${fmt$(absoluta)}`
    : `${isPos ? '+' : ''}${absoluta}`

  return (
    <span
      className="inline-flex items-center gap-1 px-2 py-1 rounded-lg text-xs font-extrabold whitespace-nowrap"
      style={{ background: bg, border: `1px solid ${border}`, color }}
    >
      <span>{arrow}</span>
      <span>{pctLabel}</span>
      {!isZero && (
        <span className="opacity-75 font-bold">({absLabel})</span>
      )}
    </span>
  )
}

// ─── Date range picker pair ───────────────────────────────────────────────────

function RangePicker({
  label,
  color,
  start,
  end,
  onStart,
  onEnd,
}: {
  label: string
  color: string
  start: string
  end: string
  onStart: (v: string) => void
  onEnd: (v: string) => void
}) {
  return (
    <div
      className="flex-1 rounded-2xl p-4 flex flex-col gap-3"
      style={{ background: '#1A1A1A', border: `1px solid ${color}33` }}
    >
      <p className="text-xs font-extrabold uppercase tracking-[0.18em]" style={{ color }}>
        {label}
      </p>
      <div className="flex flex-col gap-2">
        <div>
          <label className="text-xs text-slate-400 font-semibold mb-1 block">Desde</label>
          <input
            type="date"
            value={start}
            onChange={(e) => onStart(e.target.value)}
            max={end || undefined}
            className="w-full rounded-xl border border-white/10 bg-[#0A0A0A] px-3 py-2.5 text-sm text-white focus:outline-none focus:border-orange-500 transition"
            style={{ colorScheme: 'dark' }}
          />
        </div>
        <div>
          <label className="text-xs text-slate-400 font-semibold mb-1 block">Hasta</label>
          <input
            type="date"
            value={end}
            onChange={(e) => onEnd(e.target.value)}
            min={start || undefined}
            className="w-full rounded-xl border border-white/10 bg-[#0A0A0A] px-3 py-2.5 text-sm text-white focus:outline-none focus:border-orange-500 transition"
            style={{ colorScheme: 'dark' }}
          />
        </div>
      </div>
    </div>
  )
}

// ─── Metric row in summary table ──────────────────────────────────────────────

function MetricRow({
  icon,
  label,
  v1,
  v2,
  variacion,
  isMoney,
}: {
  icon: string
  label: string
  v1: string
  v2: string
  variacion: Variacion
  isMoney?: boolean
}) {
  return (
    <tr className="border-b border-white/5 last:border-0">
      <td className="py-3 pr-4">
        <div className="flex items-center gap-2">
          <span className="text-base">{icon}</span>
          <span className="text-sm font-bold text-slate-300">{label}</span>
        </div>
      </td>
      <td className="py-3 px-4 text-right">
        <span className="text-sm font-extrabold text-white tabular-nums">{v1}</span>
      </td>
      <td className="py-3 px-4 text-right">
        <span className="text-sm font-extrabold text-white tabular-nums">{v2}</span>
      </td>
      <td className="py-3 pl-4 text-right">
        <VarChip v={variacion} isMoney={isMoney} />
      </td>
    </tr>
  )
}

// ─── Page ─────────────────────────────────────────────────────────────────────

const defaults = defaultRanges()

export default function ReportsPage() {
  const router = useRouter()

  const [p1Start, setP1Start] = useState(defaults.p1Start)
  const [p1End,   setP1End]   = useState(defaults.p1End)
  const [p2Start, setP2Start] = useState(defaults.p2Start)
  const [p2End,   setP2End]   = useState(defaults.p2End)

  const [loading, setLoading] = useState(false)
  const [error,   setError]   = useState('')
  const [data,    setData]    = useState<ReporteComparativo | null>(null)

  const canCompare = p1Start && p1End && p2Start && p2End

  const handleCompare = async () => {
    setError('')
    setData(null)
    const token = localStorage.getItem('accessToken')
    if (!token) { router.push('/login'); return }

    setLoading(true)
    try {
      const res = await apiClient.get('/reports/sales/compare', {
        headers: { Authorization: `Bearer ${token}` },
        params: {
          periodo1Inicio: p1Start,
          periodo1Fin:    p1End,
          periodo2Inicio: p2Start,
          periodo2Fin:    p2End,
        },
      })
      setData(res.data)
    } catch (err: any) {
      if (err?.response?.status === 401) {
        router.push('/login')
      } else if (err?.response?.status === 403) {
        setError('No tienes permisos para ver reportes. Se requiere rol gerente.')
      } else {
        const msg = err?.response?.data?.error ?? err?.response?.data?.message
        setError(msg ?? 'Error al obtener el reporte. Verifica las fechas e intenta de nuevo.')
      }
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-[#0A0A0A] text-white">
      {/* ── Header ── */}
      <div
        className="fixed top-0 left-0 right-0 z-50 px-4 py-3 flex items-center gap-3"
        style={{ background: '#111', borderBottom: '1px solid rgba(255,255,255,0.08)' }}
      >
        <Link
          href="/admin"
          className="text-gray-400 hover:text-white transition p-2 rounded-lg"
          style={{ background: 'rgba(255,255,255,0.06)' }}
          aria-label="Volver al panel"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
            <path d="M19 12H5M12 19l-7-7 7-7" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </Link>
        <div>
          <h1 className="text-white font-extrabold text-lg leading-none">Reporte Comparativo</h1>
          <p className="text-gray-400 text-xs mt-0.5">Comparar períodos de ventas</p>
        </div>
      </div>

      <main className="pt-20 pb-12 px-4 max-w-4xl mx-auto">

        {/* ── Range pickers ── */}
        <section className="mt-6">
          <div className="flex flex-col sm:flex-row gap-3">
            <RangePicker
              label="Período 1"
              color="#F28500"
              start={p1Start}
              end={p1End}
              onStart={setP1Start}
              onEnd={setP1End}
            />
            <div className="flex items-center justify-center">
              <span className="text-2xl text-gray-600 font-black select-none">VS</span>
            </div>
            <RangePicker
              label="Período 2"
              color="#2980B9"
              start={p2Start}
              end={p2End}
              onStart={setP2Start}
              onEnd={setP2End}
            />
          </div>

          <button
            onClick={handleCompare}
            disabled={loading || !canCompare}
            className="mt-4 w-full py-4 rounded-2xl text-white font-extrabold text-base transition-all active:scale-95 hover:opacity-90 disabled:opacity-40"
            style={{
              background: 'linear-gradient(135deg, #F28500 0%, #D4700A 100%)',
              boxShadow: '0 6px 20px rgba(242,133,0,0.35)',
            }}
          >
            {loading ? (
              <span className="flex items-center justify-center gap-2">
                <svg className="animate-spin" width="16" height="16" viewBox="0 0 24 24" fill="none">
                  <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" strokeDasharray="31.4" strokeDashoffset="10" />
                </svg>
                Comparando…
              </span>
            ) : (
              '📊 Comparar períodos'
            )}
          </button>

          {error && (
            <div
              className="mt-3 rounded-2xl px-4 py-3"
              style={{ background: 'rgba(231,76,60,0.1)', border: '1px solid rgba(231,76,60,0.3)' }}
            >
              <p className="text-sm text-red-300 font-semibold">{error}</p>
            </div>
          )}
        </section>

        {/* ── Results ── */}
        {data && (
          <div
            className="mt-8 flex flex-col gap-6"
            style={{ animation: 'fadeIn 0.3s ease both' }}
          >
            {/* Period labels */}
            <div className="flex flex-col sm:flex-row gap-3">
              <div
                className="flex-1 rounded-2xl px-4 py-3 flex items-center gap-3"
                style={{ background: '#1A1A1A', border: '1px solid rgba(242,133,0,0.25)' }}
              >
                <span
                  className="w-3 h-3 rounded-full flex-shrink-0"
                  style={{ background: '#F28500' }}
                />
                <div>
                  <p className="text-xs font-extrabold uppercase tracking-wider text-orange-400">Período 1</p>
                  <p className="text-sm font-bold text-white mt-0.5">
                    {formatDate(data.periodo1.inicio)} — {formatDate(data.periodo1.fin)}
                  </p>
                </div>
              </div>
              <div
                className="flex-1 rounded-2xl px-4 py-3 flex items-center gap-3"
                style={{ background: '#1A1A1A', border: '1px solid rgba(41,128,185,0.25)' }}
              >
                <span
                  className="w-3 h-3 rounded-full flex-shrink-0"
                  style={{ background: '#2980B9' }}
                />
                <div>
                  <p className="text-xs font-extrabold uppercase tracking-wider" style={{ color: '#2980B9' }}>Período 2</p>
                  <p className="text-sm font-bold text-white mt-0.5">
                    {formatDate(data.periodo2.inicio)} — {formatDate(data.periodo2.fin)}
                  </p>
                </div>
              </div>
            </div>

            {/* ── Metrics summary table ── */}
            <div
              className="rounded-2xl overflow-hidden"
              style={{ background: '#1A1A1A', border: '1px solid rgba(255,255,255,0.07)' }}
            >
              <div className="px-5 py-4" style={{ borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
                <h2 className="text-white font-extrabold text-base">Métricas principales</h2>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full min-w-[480px]">
                  <thead>
                    <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
                      <th className="text-left px-5 py-3 text-xs font-extrabold uppercase tracking-wider text-gray-500">
                        Métrica
                      </th>
                      <th className="text-right px-4 py-3 text-xs font-extrabold uppercase tracking-wider" style={{ color: '#F28500' }}>
                        Período 1
                      </th>
                      <th className="text-right px-4 py-3 text-xs font-extrabold uppercase tracking-wider" style={{ color: '#2980B9' }}>
                        Período 2
                      </th>
                      <th className="text-right px-5 py-3 text-xs font-extrabold uppercase tracking-wider text-gray-500">
                        Variación
                      </th>
                    </tr>
                  </thead>
                  <tbody className="px-5">
                    <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                      <td className="py-3 pl-5 pr-4">
                        <div className="flex items-center gap-2">
                          <span>💰</span>
                          <span className="text-sm font-bold text-slate-300">Total ventas</span>
                        </div>
                      </td>
                      <td className="py-3 px-4 text-right">
                        <span className="text-sm font-extrabold text-white tabular-nums">
                          {fmt$(data.periodo1.totalVentas)}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-right">
                        <span className="text-sm font-extrabold text-white tabular-nums">
                          {fmt$(data.periodo2.totalVentas)}
                        </span>
                      </td>
                      <td className="py-3 pl-4 pr-5 text-right">
                        <VarChip v={data.variacion.totalVentas} isMoney />
                      </td>
                    </tr>
                    <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                      <td className="py-3 pl-5 pr-4">
                        <div className="flex items-center gap-2">
                          <span>🧾</span>
                          <span className="text-sm font-bold text-slate-300">Total órdenes</span>
                        </div>
                      </td>
                      <td className="py-3 px-4 text-right">
                        <span className="text-sm font-extrabold text-white tabular-nums">
                          {data.periodo1.totalOrdenes}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-right">
                        <span className="text-sm font-extrabold text-white tabular-nums">
                          {data.periodo2.totalOrdenes}
                        </span>
                      </td>
                      <td className="py-3 pl-4 pr-5 text-right">
                        <VarChip v={data.variacion.totalOrdenes} />
                      </td>
                    </tr>
                    <tr>
                      <td className="py-3 pl-5 pr-4">
                        <div className="flex items-center gap-2">
                          <span>🎯</span>
                          <span className="text-sm font-bold text-slate-300">Ticket promedio</span>
                        </div>
                      </td>
                      <td className="py-3 px-4 text-right">
                        <span className="text-sm font-extrabold text-white tabular-nums">
                          {fmt$(data.periodo1.ticketPromedio)}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-right">
                        <span className="text-sm font-extrabold text-white tabular-nums">
                          {fmt$(data.periodo2.ticketPromedio)}
                        </span>
                      </td>
                      <td className="py-3 pl-4 pr-5 text-right">
                        <VarChip v={data.variacion.ticketPromedio} isMoney />
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>

            {/* ── Top productos comparado ── */}
            {data.topProductosComparado.length > 0 && (
              <div
                className="rounded-2xl overflow-hidden"
                style={{ background: '#1A1A1A', border: '1px solid rgba(255,255,255,0.07)' }}
              >
                <div
                  className="px-5 py-4 flex items-center justify-between"
                  style={{ borderBottom: '1px solid rgba(255,255,255,0.06)' }}
                >
                  <h2 className="text-white font-extrabold text-base">Top productos</h2>
                  <span
                    className="text-xs font-bold px-2.5 py-1 rounded-full"
                    style={{ background: 'rgba(242,133,0,0.15)', color: '#F28500' }}
                  >
                    {data.topProductosComparado.length} productos
                  </span>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full min-w-[640px]">
                    <thead>
                      <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
                        <th className="text-left pl-5 pr-3 py-3 text-xs font-extrabold uppercase tracking-wider text-gray-500">
                          Producto
                        </th>
                        {/* P1 */}
                        <th className="text-right px-3 py-3 text-xs font-extrabold uppercase tracking-wider" style={{ color: '#F28500' }}>
                          P1 Uds.
                        </th>
                        <th className="text-right px-3 py-3 text-xs font-extrabold uppercase tracking-wider" style={{ color: '#F28500' }}>
                          P1 Total
                        </th>
                        {/* P2 */}
                        <th className="text-right px-3 py-3 text-xs font-extrabold uppercase tracking-wider" style={{ color: '#2980B9' }}>
                          P2 Uds.
                        </th>
                        <th className="text-right px-3 py-3 text-xs font-extrabold uppercase tracking-wider" style={{ color: '#2980B9' }}>
                          P2 Total
                        </th>
                        {/* Deltas */}
                        <th className="text-right pl-3 pr-5 py-3 text-xs font-extrabold uppercase tracking-wider text-gray-500">
                          Δ Uds.
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {data.topProductosComparado.map((prod, i) => (
                        <tr
                          key={prod.id}
                          className="transition-colors hover:bg-white/[0.02]"
                          style={{ borderBottom: i < data.topProductosComparado.length - 1 ? '1px solid rgba(255,255,255,0.04)' : undefined }}
                        >
                          {/* Name */}
                          <td className="py-3 pl-5 pr-3">
                            <div className="flex items-center gap-2">
                              <span
                                className="w-5 h-5 rounded-md flex items-center justify-center text-xs font-black flex-shrink-0"
                                style={{ background: 'rgba(242,133,0,0.15)', color: '#F28500' }}
                              >
                                {i + 1}
                              </span>
                              <span className="text-sm font-bold text-white truncate max-w-[140px]" title={prod.nombre}>
                                {prod.nombre}
                              </span>
                            </div>
                          </td>
                          {/* P1 */}
                          <td className="py-3 px-3 text-right">
                            <span className="text-sm tabular-nums" style={{ color: prod.periodo1 ? '#F3F4F6' : '#4B5563' }}>
                              {prod.periodo1?.cantidad ?? '—'}
                            </span>
                          </td>
                          <td className="py-3 px-3 text-right">
                            <span className="text-sm tabular-nums" style={{ color: prod.periodo1 ? '#F3F4F6' : '#4B5563' }}>
                              {prod.periodo1 ? fmt$(prod.periodo1.total) : '—'}
                            </span>
                          </td>
                          {/* P2 */}
                          <td className="py-3 px-3 text-right">
                            <span className="text-sm tabular-nums" style={{ color: prod.periodo2 ? '#F3F4F6' : '#4B5563' }}>
                              {prod.periodo2?.cantidad ?? '—'}
                            </span>
                          </td>
                          <td className="py-3 px-3 text-right">
                            <span className="text-sm tabular-nums" style={{ color: prod.periodo2 ? '#F3F4F6' : '#4B5563' }}>
                              {prod.periodo2 ? fmt$(prod.periodo2.total) : '—'}
                            </span>
                          </td>
                          {/* Delta */}
                          <td className="py-3 pl-3 pr-5 text-right">
                            <VarChip v={prod.variacionCantidad} />
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* ── Zero-data notice ── */}
            {data.topProductosComparado.length === 0 && (
              <div
                className="rounded-2xl px-5 py-8 text-center"
                style={{ background: '#1A1A1A', border: '1px solid rgba(255,255,255,0.07)' }}
              >
                <p className="text-3xl mb-3">📭</p>
                <p className="text-white font-extrabold">Sin ventas en los períodos seleccionados</p>
                <p className="text-gray-400 text-sm mt-1">
                  No se registraron órdenes completadas en ninguno de los dos rangos de fechas.
                </p>
              </div>
            )}
          </div>
        )}
      </main>

      <style>{`
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(8px); }
          to   { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </div>
  )
}
