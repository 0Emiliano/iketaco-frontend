'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import apiClient from '@/lib/api/client'

// ─── Types: comparativo ───────────────────────────────────────────────────────

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

// ─── Types: inventario ────────────────────────────────────────────────────────

interface ConsumoIngrediente {
  ingredienteId: number
  nombre: string
  unidad: string
  cantidadConsumida: number
  costoUnitario: number | null
  costoTotal: number | null
  totalMovimientos: number
}

interface ReporteInventario {
  resumen: {
    periodo: { inicio: string | null; fin: string | null }
    totalIngredientes: number
    totalMovimientos: number
    costoTotalConsumo: number
    ingredientesSinCosto: number
    costoParcial: boolean
  }
  consumos: ConsumoIngrediente[]
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function toISO(date: Date) {
  return date.toISOString().slice(0, 10)
}

function defaultRanges() {
  const today  = new Date()
  const p1End   = toISO(today)
  const p1Start = toISO(new Date(today.getTime() - 6 * 86400000))
  const p2End   = toISO(new Date(today.getTime() - 7 * 86400000))
  const p2Start = toISO(new Date(today.getTime() - 13 * 86400000))
  return { p1Start, p1End, p2Start, p2End }
}

function formatDate(iso: string) {
  return new Date(iso + 'T12:00:00').toLocaleDateString('es-MX', {
    day: 'numeric', month: 'short', year: 'numeric',
  })
}

function fmt$(n: number) {
  return `$${n.toLocaleString('es-MX', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
}

function fmtQty(n: number) {
  return n % 1 === 0 ? String(n) : n.toFixed(3).replace(/\.?0+$/, '')
}

// ─── Spinner ──────────────────────────────────────────────────────────────────

function Spinner() {
  return (
    <svg className="animate-spin" width="16" height="16" viewBox="0 0 24 24" fill="none">
      <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3"
        strokeDasharray="31.4" strokeDashoffset="10" />
    </svg>
  )
}

// ─── Variation chip ───────────────────────────────────────────────────────────

function VarChip({ v, isMoney = false }: { v: Variacion; isMoney?: boolean }) {
  const { absoluta, porcentaje } = v
  const isPos  = absoluta > 0
  const isNeg  = absoluta < 0
  const isZero = absoluta === 0

  const color  = isPos ? '#27AE60' : isNeg ? '#E74C3C' : '#9CA3AF'
  const bg     = isPos ? 'rgba(39,174,96,0.12)'  : isNeg ? 'rgba(231,76,60,0.12)'  : 'rgba(156,163,175,0.1)'
  const border = isPos ? 'rgba(39,174,96,0.3)'   : isNeg ? 'rgba(231,76,60,0.3)'   : 'rgba(156,163,175,0.2)'
  const arrow  = isPos ? '↑' : isNeg ? '↓' : '→'
  const pctLabel = porcentaje === null ? '—' : `${isPos ? '+' : ''}${porcentaje.toFixed(1)}%`
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
      {!isZero && <span className="opacity-75 font-bold">({absLabel})</span>}
    </span>
  )
}

// ─── Shared single date-range picker ─────────────────────────────────────────

function SingleRangePicker({
  start, end, onStart, onEnd,
}: { start: string; end: string; onStart: (v: string) => void; onEnd: (v: string) => void }) {
  return (
    <div className="flex flex-col sm:flex-row gap-3">
      <div className="flex-1">
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
      <div className="flex-1">
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
  )
}

// ─── Comparativo: range picker pair ──────────────────────────────────────────

function RangePicker({
  label, color, start, end, onStart, onEnd,
}: { label: string; color: string; start: string; end: string; onStart: (v: string) => void; onEnd: (v: string) => void }) {
  return (
    <div
      className="flex-1 rounded-2xl p-4 flex flex-col gap-3"
      style={{ background: '#1A1A1A', border: `1px solid ${color}33` }}
    >
      <p className="text-xs font-extrabold uppercase tracking-[0.18em]" style={{ color }}>{label}</p>
      <div className="flex flex-col gap-2">
        <div>
          <label className="text-xs text-slate-400 font-semibold mb-1 block">Desde</label>
          <input type="date" value={start} onChange={(e) => onStart(e.target.value)}
            max={end || undefined}
            className="w-full rounded-xl border border-white/10 bg-[#0A0A0A] px-3 py-2.5 text-sm text-white focus:outline-none focus:border-orange-500 transition"
            style={{ colorScheme: 'dark' }} />
        </div>
        <div>
          <label className="text-xs text-slate-400 font-semibold mb-1 block">Hasta</label>
          <input type="date" value={end} onChange={(e) => onEnd(e.target.value)}
            min={start || undefined}
            className="w-full rounded-xl border border-white/10 bg-[#0A0A0A] px-3 py-2.5 text-sm text-white focus:outline-none focus:border-orange-500 transition"
            style={{ colorScheme: 'dark' }} />
        </div>
      </div>
    </div>
  )
}

// ─── Section divider ──────────────────────────────────────────────────────────

function SectionDivider({ icon, title, subtitle }: { icon: string; title: string; subtitle: string }) {
  return (
    <div className="flex items-center gap-4 mt-10 mb-1">
      <div
        className="w-10 h-10 rounded-2xl flex items-center justify-center text-xl flex-shrink-0"
        style={{ background: 'rgba(242,133,0,0.12)', border: '1px solid rgba(242,133,0,0.2)' }}
      >
        {icon}
      </div>
      <div>
        <h2 className="text-white font-extrabold text-lg leading-tight">{title}</h2>
        <p className="text-gray-500 text-xs mt-0.5">{subtitle}</p>
      </div>
      <div className="flex-1 h-px" style={{ background: 'rgba(255,255,255,0.06)' }} />
    </div>
  )
}

// ─── Page ─────────────────────────────────────────────────────────────────────

const defaults = defaultRanges()

export default function ReportsPage() {
  const router = useRouter()

  // ── Comparativo state ──
  const [p1Start, setP1Start] = useState(defaults.p1Start)
  const [p1End,   setP1End]   = useState(defaults.p1End)
  const [p2Start, setP2Start] = useState(defaults.p2Start)
  const [p2End,   setP2End]   = useState(defaults.p2End)
  const [cmpLoading, setCmpLoading] = useState(false)
  const [cmpError,   setCmpError]   = useState('')
  const [cmpData,    setCmpData]    = useState<ReporteComparativo | null>(null)

  // ── Inventario state ──
  const [invStart,   setInvStart]   = useState(defaults.p1Start)
  const [invEnd,     setInvEnd]     = useState(defaults.p1End)
  const [invLoading, setInvLoading] = useState(false)
  const [invError,   setInvError]   = useState('')
  const [invData,    setInvData]    = useState<ReporteInventario | null>(null)

  // ── Shared auth error helper ──
  const handleApiError = (err: any, setErr: (s: string) => void) => {
    if (err?.response?.status === 401) { router.push('/login'); return }
    if (err?.response?.status === 403) { setErr('Se requiere rol gerente para ver reportes.'); return }
    const msg = err?.response?.data?.error ?? err?.response?.data?.message
    setErr(msg ?? 'Error al obtener el reporte. Verifica las fechas e intenta de nuevo.')
  }

  const getToken = () => {
    const t = localStorage.getItem('accessToken')
    if (!t) { router.push('/login') }
    return t
  }

  // ── Comparativo fetch ──
  const handleCompare = async () => {
    setCmpError(''); setCmpData(null)
    const token = getToken(); if (!token) return
    setCmpLoading(true)
    try {
      const res = await apiClient.get('/reports/sales/compare', {
        headers: { Authorization: `Bearer ${token}` },
        params: { periodo1Inicio: p1Start, periodo1Fin: p1End, periodo2Inicio: p2Start, periodo2Fin: p2End },
      })
      setCmpData(res.data)
    } catch (err: any) {
      handleApiError(err, setCmpError)
    } finally {
      setCmpLoading(false)
    }
  }

  // ── Inventario fetch ──
  const handleInventario = async () => {
    setInvError(''); setInvData(null)
    const token = getToken(); if (!token) return
    setInvLoading(true)
    try {
      const params: Record<string, string> = {}
      if (invStart) params.fechaInicio = invStart
      if (invEnd)   params.fechaFin    = invEnd
      const res = await apiClient.get('/reports/inventory', {
        headers: { Authorization: `Bearer ${token}` },
        params,
      })
      setInvData(res.data)
    } catch (err: any) {
      handleApiError(err, setInvError)
    } finally {
      setInvLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-[#0A0A0A] text-white">

      {/* ── Header ── */}
      <div
        className="fixed top-0 left-0 right-0 z-50 px-4 py-3 flex items-center gap-3"
        style={{ background: '#111', borderBottom: '1px solid rgba(255,255,255,0.08)' }}
      >
        <Link href="/admin"
          className="text-gray-400 hover:text-white transition p-2 rounded-lg"
          style={{ background: 'rgba(255,255,255,0.06)' }}
          aria-label="Volver al panel"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
            <path d="M19 12H5M12 19l-7-7 7-7" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </Link>
        <div>
          <h1 className="text-white font-extrabold text-lg leading-none">Reportes</h1>
          <p className="text-gray-400 text-xs mt-0.5">Ventas e inventario</p>
        </div>
      </div>

      <main className="pt-20 pb-16 px-4 max-w-4xl mx-auto">

        {/* ════════════════════════════════════════════════════
            SECCIÓN 1 — COMPARATIVO DE VENTAS
        ════════════════════════════════════════════════════ */}
        <SectionDivider icon="📊" title="Comparativo de ventas" subtitle="Compara dos períodos de tiempo" />

        <section className="mt-4">
          <div className="flex flex-col sm:flex-row gap-3">
            <RangePicker label="Período 1" color="#F28500" start={p1Start} end={p1End} onStart={setP1Start} onEnd={setP1End} />
            <div className="flex items-center justify-center">
              <span className="text-2xl text-gray-600 font-black select-none">VS</span>
            </div>
            <RangePicker label="Período 2" color="#2980B9" start={p2Start} end={p2End} onStart={setP2Start} onEnd={setP2End} />
          </div>

          <button
            onClick={handleCompare}
            disabled={cmpLoading || !p1Start || !p1End || !p2Start || !p2End}
            className="mt-4 w-full py-4 rounded-2xl text-white font-extrabold text-base transition-all active:scale-95 hover:opacity-90 disabled:opacity-40"
            style={{ background: 'linear-gradient(135deg, #F28500 0%, #D4700A 100%)', boxShadow: '0 6px 20px rgba(242,133,0,0.35)' }}
          >
            {cmpLoading
              ? <span className="flex items-center justify-center gap-2"><Spinner /> Comparando…</span>
              : '📊 Comparar períodos'}
          </button>

          {cmpError && (
            <div className="mt-3 rounded-2xl px-4 py-3" style={{ background: 'rgba(231,76,60,0.1)', border: '1px solid rgba(231,76,60,0.3)' }}>
              <p className="text-sm text-red-300 font-semibold">{cmpError}</p>
            </div>
          )}
        </section>

        {/* ── Comparativo results ── */}
        {cmpData && (
          <div className="mt-6 flex flex-col gap-5" style={{ animation: 'fadeIn 0.3s ease both' }}>

            {/* Period labels */}
            <div className="flex flex-col sm:flex-row gap-3">
              {[
                { data: cmpData.periodo1, label: 'Período 1', color: '#F28500', border: 'rgba(242,133,0,0.25)' },
                { data: cmpData.periodo2, label: 'Período 2', color: '#2980B9', border: 'rgba(41,128,185,0.25)' },
              ].map((p) => (
                <div key={p.label} className="flex-1 rounded-2xl px-4 py-3 flex items-center gap-3"
                  style={{ background: '#1A1A1A', border: `1px solid ${p.border}` }}>
                  <span className="w-3 h-3 rounded-full flex-shrink-0" style={{ background: p.color }} />
                  <div>
                    <p className="text-xs font-extrabold uppercase tracking-wider" style={{ color: p.color }}>{p.label}</p>
                    <p className="text-sm font-bold text-white mt-0.5">
                      {formatDate(p.data.inicio)} — {formatDate(p.data.fin)}
                    </p>
                  </div>
                </div>
              ))}
            </div>

            {/* Metrics table */}
            <div className="rounded-2xl overflow-hidden" style={{ background: '#1A1A1A', border: '1px solid rgba(255,255,255,0.07)' }}>
              <div className="px-5 py-4" style={{ borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
                <h3 className="text-white font-extrabold text-base">Métricas principales</h3>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full min-w-[480px]">
                  <thead>
                    <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
                      <th className="text-left px-5 py-3 text-xs font-extrabold uppercase tracking-wider text-gray-500">Métrica</th>
                      <th className="text-right px-4 py-3 text-xs font-extrabold uppercase tracking-wider" style={{ color: '#F28500' }}>Período 1</th>
                      <th className="text-right px-4 py-3 text-xs font-extrabold uppercase tracking-wider" style={{ color: '#2980B9' }}>Período 2</th>
                      <th className="text-right px-5 py-3 text-xs font-extrabold uppercase tracking-wider text-gray-500">Variación</th>
                    </tr>
                  </thead>
                  <tbody>
                    {[
                      { icon: '💰', label: 'Total ventas',    v1: fmt$(cmpData.periodo1.totalVentas),    v2: fmt$(cmpData.periodo2.totalVentas),    var: cmpData.variacion.totalVentas,    money: true  },
                      { icon: '🧾', label: 'Total órdenes',   v1: String(cmpData.periodo1.totalOrdenes), v2: String(cmpData.periodo2.totalOrdenes), var: cmpData.variacion.totalOrdenes,   money: false },
                      { icon: '🎯', label: 'Ticket promedio', v1: fmt$(cmpData.periodo1.ticketPromedio), v2: fmt$(cmpData.periodo2.ticketPromedio), var: cmpData.variacion.ticketPromedio, money: true  },
                    ].map((row, i, arr) => (
                      <tr key={row.label} style={{ borderBottom: i < arr.length - 1 ? '1px solid rgba(255,255,255,0.05)' : undefined }}>
                        <td className="py-3 pl-5 pr-4">
                          <div className="flex items-center gap-2">
                            <span>{row.icon}</span>
                            <span className="text-sm font-bold text-slate-300">{row.label}</span>
                          </div>
                        </td>
                        <td className="py-3 px-4 text-right"><span className="text-sm font-extrabold text-white tabular-nums">{row.v1}</span></td>
                        <td className="py-3 px-4 text-right"><span className="text-sm font-extrabold text-white tabular-nums">{row.v2}</span></td>
                        <td className="py-3 pl-4 pr-5 text-right"><VarChip v={row.var} isMoney={row.money} /></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Top productos */}
            {cmpData.topProductosComparado.length > 0 ? (
              <div className="rounded-2xl overflow-hidden" style={{ background: '#1A1A1A', border: '1px solid rgba(255,255,255,0.07)' }}>
                <div className="px-5 py-4 flex items-center justify-between" style={{ borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
                  <h3 className="text-white font-extrabold text-base">Top productos</h3>
                  <span className="text-xs font-bold px-2.5 py-1 rounded-full" style={{ background: 'rgba(242,133,0,0.15)', color: '#F28500' }}>
                    {cmpData.topProductosComparado.length} productos
                  </span>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full min-w-[640px]">
                    <thead>
                      <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
                        <th className="text-left pl-5 pr-3 py-3 text-xs font-extrabold uppercase tracking-wider text-gray-500">Producto</th>
                        <th className="text-right px-3 py-3 text-xs font-extrabold uppercase tracking-wider" style={{ color: '#F28500' }}>P1 Uds.</th>
                        <th className="text-right px-3 py-3 text-xs font-extrabold uppercase tracking-wider" style={{ color: '#F28500' }}>P1 Total</th>
                        <th className="text-right px-3 py-3 text-xs font-extrabold uppercase tracking-wider" style={{ color: '#2980B9' }}>P2 Uds.</th>
                        <th className="text-right px-3 py-3 text-xs font-extrabold uppercase tracking-wider" style={{ color: '#2980B9' }}>P2 Total</th>
                        <th className="text-right pl-3 pr-5 py-3 text-xs font-extrabold uppercase tracking-wider text-gray-500">Δ Uds.</th>
                      </tr>
                    </thead>
                    <tbody>
                      {cmpData.topProductosComparado.map((prod, i) => (
                        <tr key={prod.id} className="transition-colors hover:bg-white/[0.02]"
                          style={{ borderBottom: i < cmpData.topProductosComparado.length - 1 ? '1px solid rgba(255,255,255,0.04)' : undefined }}>
                          <td className="py-3 pl-5 pr-3">
                            <div className="flex items-center gap-2">
                              <span className="w-5 h-5 rounded-md flex items-center justify-center text-xs font-black flex-shrink-0"
                                style={{ background: 'rgba(242,133,0,0.15)', color: '#F28500' }}>{i + 1}</span>
                              <span className="text-sm font-bold text-white truncate max-w-[140px]" title={prod.nombre}>{prod.nombre}</span>
                            </div>
                          </td>
                          <td className="py-3 px-3 text-right"><span className="text-sm tabular-nums" style={{ color: prod.periodo1 ? '#F3F4F6' : '#4B5563' }}>{prod.periodo1?.cantidad ?? '—'}</span></td>
                          <td className="py-3 px-3 text-right"><span className="text-sm tabular-nums" style={{ color: prod.periodo1 ? '#F3F4F6' : '#4B5563' }}>{prod.periodo1 ? fmt$(prod.periodo1.total) : '—'}</span></td>
                          <td className="py-3 px-3 text-right"><span className="text-sm tabular-nums" style={{ color: prod.periodo2 ? '#F3F4F6' : '#4B5563' }}>{prod.periodo2?.cantidad ?? '—'}</span></td>
                          <td className="py-3 px-3 text-right"><span className="text-sm tabular-nums" style={{ color: prod.periodo2 ? '#F3F4F6' : '#4B5563' }}>{prod.periodo2 ? fmt$(prod.periodo2.total) : '—'}</span></td>
                          <td className="py-3 pl-3 pr-5 text-right"><VarChip v={prod.variacionCantidad} /></td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            ) : (
              <div className="rounded-2xl px-5 py-8 text-center" style={{ background: '#1A1A1A', border: '1px solid rgba(255,255,255,0.07)' }}>
                <p className="text-3xl mb-3">📭</p>
                <p className="text-white font-extrabold">Sin ventas en los períodos seleccionados</p>
                <p className="text-gray-400 text-sm mt-1">No se registraron órdenes completadas en ninguno de los dos rangos de fechas.</p>
              </div>
            )}
          </div>
        )}

        {/* ════════════════════════════════════════════════════
            SECCIÓN 2 — REPORTE DE INVENTARIO
        ════════════════════════════════════════════════════ */}
        <SectionDivider icon="📦" title="Reporte de inventario" subtitle="Consumo de ingredientes por período" />

        <section className="mt-4">
          <div
            className="rounded-2xl p-4"
            style={{ background: '#1A1A1A', border: '1px solid rgba(255,255,255,0.07)' }}
          >
            <SingleRangePicker start={invStart} end={invEnd} onStart={setInvStart} onEnd={setInvEnd} />
            <p className="text-xs text-gray-500 mt-2">
              Ambas fechas son opcionales. Sin fechas muestra todo el historial de consumo.
            </p>
          </div>

          <button
            onClick={handleInventario}
            disabled={invLoading}
            className="mt-3 w-full py-4 rounded-2xl text-white font-extrabold text-base transition-all active:scale-95 hover:opacity-90 disabled:opacity-40"
            style={{ background: 'linear-gradient(135deg, #27AE60 0%, #1E8449 100%)', boxShadow: '0 6px 20px rgba(39,174,96,0.3)' }}
          >
            {invLoading
              ? <span className="flex items-center justify-center gap-2"><Spinner /> Generando reporte…</span>
              : '📦 Generar reporte de inventario'}
          </button>

          {invError && (
            <div className="mt-3 rounded-2xl px-4 py-3" style={{ background: 'rgba(231,76,60,0.1)', border: '1px solid rgba(231,76,60,0.3)' }}>
              <p className="text-sm text-red-300 font-semibold">{invError}</p>
            </div>
          )}
        </section>

        {/* ── Inventario results ── */}
        {invData && (
          <div className="mt-6 flex flex-col gap-5" style={{ animation: 'fadeIn 0.3s ease both' }}>

            {/* Resumen cards */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {[
                { icon: '🧂', label: 'Ingredientes',  value: String(invData.resumen.totalIngredientes), color: '#27AE60' },
                { icon: '📋', label: 'Movimientos',   value: String(invData.resumen.totalMovimientos),  color: '#2980B9' },
                { icon: '💸', label: 'Costo total',   value: fmt$(invData.resumen.costoTotalConsumo),   color: '#F28500' },
                { icon: '⚠️',  label: 'Sin costo',    value: String(invData.resumen.ingredientesSinCosto), color: invData.resumen.ingredientesSinCosto > 0 ? '#F59E0B' : '#9CA3AF' },
              ].map((card) => (
                <div key={card.label}
                  className="rounded-2xl p-4 flex flex-col gap-1"
                  style={{ background: '#1A1A1A', border: '1px solid rgba(255,255,255,0.07)' }}
                >
                  <span className="text-xl">{card.icon}</span>
                  <p className="text-xs font-bold text-gray-400 mt-1">{card.label}</p>
                  <p className="text-lg font-extrabold tabular-nums" style={{ color: card.color }}>{card.value}</p>
                </div>
              ))}
            </div>

            {/* Periodo banner */}
            {(invData.resumen.periodo.inicio || invData.resumen.periodo.fin) && (
              <div className="rounded-2xl px-4 py-3 flex items-center gap-3"
                style={{ background: '#1A1A1A', border: '1px solid rgba(39,174,96,0.2)' }}>
                <span className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ background: '#27AE60' }} />
                <p className="text-sm text-gray-300 font-bold">
                  {invData.resumen.periodo.inicio && invData.resumen.periodo.fin
                    ? <>{formatDate(invData.resumen.periodo.inicio)} — {formatDate(invData.resumen.periodo.fin)}</>
                    : invData.resumen.periodo.inicio
                      ? <>Desde {formatDate(invData.resumen.periodo.inicio)}</>
                      : <>Hasta {formatDate(invData.resumen.periodo.fin!)}</>}
                </p>
              </div>
            )}

            {/* Costo parcial warning */}
            {invData.resumen.costoParcial && (
              <div className="rounded-2xl px-4 py-3 flex items-start gap-3"
                style={{ background: 'rgba(245,158,11,0.08)', border: '1px solid rgba(245,158,11,0.25)' }}>
                <span className="text-base mt-0.5">⚠️</span>
                <p className="text-sm text-yellow-300 font-semibold">
                  Costo parcial: {invData.resumen.ingredientesSinCosto} ingrediente{invData.resumen.ingredientesSinCosto !== 1 ? 's' : ''} sin
                  precio unitario configurado. El costo total mostrado es aproximado.
                </p>
              </div>
            )}

            {/* Consumos table */}
            {invData.consumos.length > 0 ? (
              <div className="rounded-2xl overflow-hidden" style={{ background: '#1A1A1A', border: '1px solid rgba(255,255,255,0.07)' }}>
                <div className="px-5 py-4 flex items-center justify-between" style={{ borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
                  <h3 className="text-white font-extrabold text-base">Consumo por ingrediente</h3>
                  <span className="text-xs font-bold px-2.5 py-1 rounded-full"
                    style={{ background: 'rgba(39,174,96,0.15)', color: '#27AE60' }}>
                    {invData.consumos.length} ingredientes
                  </span>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full min-w-[560px]">
                    <thead>
                      <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
                        <th className="text-left pl-5 pr-3 py-3 text-xs font-extrabold uppercase tracking-wider text-gray-500">#</th>
                        <th className="text-left px-3 py-3 text-xs font-extrabold uppercase tracking-wider text-gray-500">Ingrediente</th>
                        <th className="text-right px-3 py-3 text-xs font-extrabold uppercase tracking-wider text-gray-500">Cantidad</th>
                        <th className="text-right px-3 py-3 text-xs font-extrabold uppercase tracking-wider text-gray-500">Unidad</th>
                        <th className="text-right px-3 py-3 text-xs font-extrabold uppercase tracking-wider text-gray-500">Costo u.</th>
                        <th className="text-right pl-3 pr-5 py-3 text-xs font-extrabold uppercase tracking-wider" style={{ color: '#27AE60' }}>Costo total</th>
                      </tr>
                    </thead>
                    <tbody>
                      {invData.consumos.map((item, i) => {
                        const sinCosto = item.costoTotal === null
                        return (
                          <tr key={item.ingredienteId}
                            className="transition-colors hover:bg-white/[0.02]"
                            style={{ borderBottom: i < invData.consumos.length - 1 ? '1px solid rgba(255,255,255,0.04)' : undefined }}
                          >
                            {/* Rank */}
                            <td className="py-3 pl-5 pr-3">
                              <span className="w-5 h-5 rounded-md flex items-center justify-center text-xs font-black"
                                style={{ background: 'rgba(39,174,96,0.12)', color: '#27AE60' }}>
                                {i + 1}
                              </span>
                            </td>
                            {/* Name */}
                            <td className="py-3 px-3">
                              <p className="text-sm font-bold text-white">{item.nombre}</p>
                              <p className="text-xs text-gray-500 mt-0.5">{item.totalMovimientos} movimiento{item.totalMovimientos !== 1 ? 's' : ''}</p>
                            </td>
                            {/* Qty */}
                            <td className="py-3 px-3 text-right">
                              <span className="text-sm font-extrabold text-white tabular-nums">
                                {fmtQty(item.cantidadConsumida)}
                              </span>
                            </td>
                            {/* Unit */}
                            <td className="py-3 px-3 text-right">
                              <span className="text-xs font-bold px-2 py-1 rounded-lg"
                                style={{ background: 'rgba(255,255,255,0.07)', color: '#9CA3AF' }}>
                                {item.unidad}
                              </span>
                            </td>
                            {/* Unit cost */}
                            <td className="py-3 px-3 text-right">
                              <span className="text-sm tabular-nums" style={{ color: sinCosto ? '#4B5563' : '#D1D5DB' }}>
                                {item.costoUnitario !== null ? fmt$(item.costoUnitario) : '—'}
                              </span>
                            </td>
                            {/* Total cost */}
                            <td className="py-3 pl-3 pr-5 text-right">
                              {sinCosto ? (
                                <span className="text-xs font-bold px-2 py-1 rounded-lg"
                                  style={{ background: 'rgba(245,158,11,0.1)', border: '1px solid rgba(245,158,11,0.2)', color: '#F59E0B' }}>
                                  Sin costo
                                </span>
                              ) : (
                                <span className="text-sm font-extrabold tabular-nums" style={{ color: '#27AE60' }}>
                                  {fmt$(item.costoTotal!)}
                                </span>
                              )}
                            </td>
                          </tr>
                        )
                      })}
                    </tbody>
                    {/* Totals footer */}
                    <tfoot>
                      <tr style={{ borderTop: '2px solid rgba(255,255,255,0.08)' }}>
                        <td colSpan={2} className="py-3 pl-5 pr-3">
                          <span className="text-xs font-extrabold uppercase tracking-wider text-gray-400">Total</span>
                        </td>
                        <td colSpan={3} />
                        <td className="py-3 pl-3 pr-5 text-right">
                          <div>
                            <span className="text-base font-extrabold tabular-nums" style={{ color: '#27AE60' }}>
                              {fmt$(invData.resumen.costoTotalConsumo)}
                            </span>
                            {invData.resumen.costoParcial && (
                              <span className="text-xs text-yellow-400 font-bold ml-1">*</span>
                            )}
                          </div>
                        </td>
                      </tr>
                    </tfoot>
                  </table>
                </div>
              </div>
            ) : (
              <div className="rounded-2xl px-5 py-8 text-center" style={{ background: '#1A1A1A', border: '1px solid rgba(255,255,255,0.07)' }}>
                <p className="text-3xl mb-3">📦</p>
                <p className="text-white font-extrabold">Sin movimientos de inventario</p>
                <p className="text-gray-400 text-sm mt-1">No se registró consumo de ingredientes en el período seleccionado.</p>
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
