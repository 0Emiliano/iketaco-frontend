'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import apiClient from '@/lib/api/client'

// ─── Types ────────────────────────────────────────────────────────────────────

interface ConsumoItem {
  ingredienteId:     number
  nombre:            string
  unidad:            string
  cantidadConsumida: number
  costoUnitario:     number | null
  costoTotal:        number | null
  totalMovimientos:  number
}

interface Resumen {
  periodo:               { inicio: string | null; fin: string | null }
  totalIngredientes:     number
  totalMovimientos:      number
  costoTotalConsumo:     number
  ingredientesSinCosto:  number
  costoParcial:          boolean
}

interface ReporteData {
  resumen:  Resumen
  consumos: ConsumoItem[]
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

function fmt$(n: number) {
  return `$${n.toFixed(2)}`
}

function fmtCantidad(n: number) {
  return n % 1 === 0 ? String(n) : n.toFixed(3).replace(/\.?0+$/, '')
}

function hoyISO() {
  return new Date().toLocaleDateString('en-CA', { timeZone: 'America/Hermosillo' })
}

function hace30DiasISO() {
  const d = new Date()
  d.setDate(d.getDate() - 30)
  return d.toLocaleDateString('en-CA', { timeZone: 'America/Hermosillo' })
}

// ─── Card de estadística ──────────────────────────────────────────────────────

function StatCard({
  label,
  value,
  color = '#F28500',
  sub,
}: {
  label: string
  value: string
  color?: string
  sub?: string
}) {
  return (
    <div
      className="rounded-2xl p-4 flex flex-col gap-1"
      style={{ background: '#1A1A1A', border: '1px solid rgba(255,255,255,0.06)' }}
    >
      <p className="text-gray-400 text-xs font-semibold uppercase tracking-wider">{label}</p>
      <p className="font-extrabold text-2xl" style={{ color }}>{value}</p>
      {sub && <p className="text-gray-500 text-xs font-medium">{sub}</p>}
    </div>
  )
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function InventoryReportPage() {
  const router = useRouter()

  // ── Auth ──────────────────────────────────────────────────────────────────
  const [usuario, setUsuario] = useState<{ email: string; rol: string } | null>(null)

  useEffect(() => {
    const raw = localStorage.getItem('usuario')
    if (!raw) { router.push('/login'); return }
    const u = JSON.parse(raw)
    if (u.rol !== 'gerente') { router.push('/admin'); return }
    setUsuario(u)
  }, [router])

  // ── Filtros ───────────────────────────────────────────────────────────────
  const [fechaInicio, setFechaInicio] = useState(hace30DiasISO())
  const [fechaFin,    setFechaFin]    = useState(hoyISO())

  // ── Reporte ───────────────────────────────────────────────────────────────
  const [reporte,  setReporte]  = useState<ReporteData | null>(null)
  const [loading,  setLoading]  = useState(false)
  const [error,    setError]    = useState('')

  const generarReporte = async () => {
    setLoading(true)
    setError('')
    try {
      const params = new URLSearchParams()
      if (fechaInicio) params.append('fechaInicio', fechaInicio)
      if (fechaFin)    params.append('fechaFin',    fechaFin)
      const res = await apiClient.get(`/reports/inventory?${params}`)
      setReporte(res.data)
    } catch (err: any) {
      setError(err?.response?.data?.error ?? 'Error al generar el reporte')
    } finally {
      setLoading(false)
    }
  }

  // Generar al montar
  useEffect(() => {
    if (usuario) generarReporte()
  }, [usuario]) // eslint-disable-line

  if (!usuario) return null

  // ── Derivados ─────────────────────────────────────────────────────────────
  const masConsumido = reporte?.consumos[0] ?? null
  const totalConsumo = reporte?.resumen.costoTotalConsumo ?? 0

  // ─── Render ───────────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-[#0A0A0A] text-white">

      {/* Header */}
      <div
        className="fixed top-0 left-0 right-0 z-50 px-4 py-3 flex items-center gap-3"
        style={{ background: '#111', borderBottom: '1px solid rgba(255,255,255,0.08)' }}
      >
        <button
          onClick={() => router.push('/admin')}
          className="p-2 rounded-xl transition hover:bg-white/10 text-gray-400 hover:text-white"
          aria-label="Volver"
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
            <path d="M19 12H5M5 12L12 19M5 12L12 5" stroke="currentColor" strokeWidth="2.5"
              strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </button>
        <div>
          <h1 className="text-white font-extrabold text-lg leading-none">Consumo de Inventario</h1>
          <p className="text-gray-400 text-xs mt-0.5">{usuario.email}</p>
        </div>
      </div>

      <main className="pt-20 pb-24 px-4 max-w-3xl mx-auto flex flex-col gap-5">

        {/* ── Filtros de fecha ── */}
        <div
          className="rounded-2xl p-4 mt-2"
          style={{ background: '#1A1A1A', border: '1px solid rgba(255,255,255,0.06)' }}
        >
          <h2 className="text-white font-extrabold text-sm mb-3">Período</h2>
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="flex-1 flex flex-col gap-1">
              <label className="text-xs font-semibold text-gray-400">Desde</label>
              <input
                type="date"
                value={fechaInicio}
                onChange={e => setFechaInicio(e.target.value)}
                className="w-full rounded-xl bg-[#0A0A0A] border border-white/15 px-3 py-2.5
                           text-white text-sm focus:outline-none focus:border-orange-500 transition"
                style={{ colorScheme: 'dark' }}
              />
            </div>
            <div className="flex-1 flex flex-col gap-1">
              <label className="text-xs font-semibold text-gray-400">Hasta</label>
              <input
                type="date"
                value={fechaFin}
                onChange={e => setFechaFin(e.target.value)}
                className="w-full rounded-xl bg-[#0A0A0A] border border-white/15 px-3 py-2.5
                           text-white text-sm focus:outline-none focus:border-orange-500 transition"
                style={{ colorScheme: 'dark' }}
              />
            </div>
            <div className="flex items-end">
              <button
                onClick={generarReporte}
                disabled={loading}
                className="w-full sm:w-auto px-6 py-2.5 rounded-xl text-white font-extrabold
                           text-sm transition active:scale-95 disabled:opacity-50 whitespace-nowrap"
                style={{ background: 'linear-gradient(135deg,#F28500,#D4700A)' }}
              >
                {loading ? 'Cargando…' : 'Generar reporte'}
              </button>
            </div>
          </div>
        </div>

        {/* ── Error ── */}
        {error && (
          <div
            className="rounded-2xl px-4 py-3"
            style={{ background: 'rgba(231,76,60,0.1)', border: '1px solid rgba(231,76,60,0.3)' }}
          >
            <p className="text-red-300 text-sm font-semibold">{error}</p>
          </div>
        )}

        {/* ── Skeleton ── */}
        {loading && !reporte && (
          <div className="flex flex-col gap-3">
            <div className="grid grid-cols-3 gap-3">
              {[1, 2, 3].map(i => (
                <div key={i} className="h-24 rounded-2xl animate-pulse"
                  style={{ background: '#1A1A1A' }} />
              ))}
            </div>
            <div className="h-64 rounded-2xl animate-pulse" style={{ background: '#1A1A1A' }} />
          </div>
        )}

        {/* ── Resultados ── */}
        {reporte && !loading && (
          <>
            {/* Aviso de costo parcial */}
            {(reporte.resumen.costoParcial || reporte.consumos.some(i => !i.costoUnitario)) && (
              <div
                className="rounded-xl p-3"
                style={{ background: 'rgba(243,156,18,0.1)', border: '1px solid rgba(243,156,18,0.3)' }}
              >
                <div className="flex items-center gap-2">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#F39C12" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="flex-shrink-0">
                    <path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z"/>
                    <line x1="12" y1="9" x2="12" y2="13"/>
                    <line x1="12" y1="17" x2="12.01" y2="17"/>
                  </svg>
                  <p className="text-yellow-300 text-sm font-bold">
                    Costo parcial — Algunos ingredientes no tienen costo configurado
                  </p>
                </div>
              </div>
            )}

            {/* Cards de resumen */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <StatCard
                label="Costo total estimado"
                value={fmt$(totalConsumo)}
                color="#F28500"
                sub={reporte.resumen.costoParcial ? 'Parcial' : 'Completo'}
              />
              <StatCard
                label="Ingredientes consumidos"
                value={String(reporte.resumen.totalIngredientes)}
                color="#27AE60"
                sub={`${reporte.resumen.totalMovimientos} movimientos`}
              />
              <StatCard
                label="Mayor consumo"
                value={masConsumido
                  ? `${fmtCantidad(masConsumido.cantidadConsumida)} ${masConsumido.unidad}`
                  : '—'}
                color="#2980B9"
                sub={masConsumido?.nombre ?? ''}
              />
            </div>

            {/* Tabla */}
            {reporte.consumos.length === 0 ? (
              <div
                className="rounded-2xl py-12 text-center"
                style={{ background: '#1A1A1A', border: '1px solid rgba(255,255,255,0.06)' }}
              >
                <p className="text-gray-400 text-sm font-semibold">
                  Sin movimientos de consumo en este período
                </p>
              </div>
            ) : (
              <div
                className="rounded-2xl overflow-hidden"
                style={{ border: '1px solid rgba(255,255,255,0.06)' }}
              >
                {/* Header tabla */}
                <div
                  className="grid gap-2 px-4 py-3 text-xs font-extrabold uppercase tracking-wider text-gray-400"
                  style={{
                    background: '#2C2C2C',
                    gridTemplateColumns: '1fr 100px 60px 100px 110px',
                  }}
                >
                  <span>Ingrediente</span>
                  <span className="text-right">Consumido</span>
                  <span className="text-right">Unidad</span>
                  <span className="text-right">Costo unit.</span>
                  <span className="text-right">Costo total</span>
                </div>

                {/* Filas */}
                {reporte.consumos.map((item, idx) => (
                  <div
                    key={item.ingredienteId}
                    className="grid gap-2 px-4 py-3 text-sm items-center"
                    style={{
                      background: idx % 2 === 0 ? '#1A1A1A' : '#151515',
                      gridTemplateColumns: '1fr 100px 60px 100px 110px',
                      borderTop: '1px solid rgba(255,255,255,0.04)',
                    }}
                  >
                    <span className="text-white font-semibold truncate">{item.nombre}</span>
                    <span className="text-gray-300 text-right tabular-nums">
                      {fmtCantidad(item.cantidadConsumida)}
                    </span>
                    <span className="text-gray-500 text-right">{item.unidad}</span>
                    <span className="text-right tabular-nums" style={{ color: item.costoUnitario ? '#9CA3AF' : '#F39C12' }}>
                      {item.costoUnitario ? fmt$(item.costoUnitario) : 'Sin costo'}
                    </span>
                    <span className="font-extrabold text-right tabular-nums" style={{ color: item.costoTotal ? '#F28500' : '#F39C12' }}>
                      {item.costoTotal ? fmt$(item.costoTotal) : '—'}
                    </span>
                  </div>
                ))}

                {/* Fila de totales */}
                <div
                  className="grid gap-2 px-4 py-3 text-sm items-center font-extrabold"
                  style={{
                    background: '#2C2C2C',
                    gridTemplateColumns: '1fr 100px 60px 100px 110px',
                    borderTop: '1px solid rgba(255,255,255,0.12)',
                  }}
                >
                  <span className="text-white uppercase tracking-wide text-xs">Total</span>
                  <span />
                  <span />
                  <span />
                  <span className="text-right tabular-nums" style={{ color: '#F28500' }}>
                    {fmt$(totalConsumo)}
                  </span>
                </div>
              </div>
            )}
          </>
        )}
      </main>
    </div>
  )
}
