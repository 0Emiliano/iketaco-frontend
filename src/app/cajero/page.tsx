'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import apiClient from '@/lib/api/client'
import RefreshDot from '@/components/ui/RefreshDot'

// ─── Types ────────────────────────────────────────────────────────────────────

interface TransferenciaPendiente {
  id: number
  orden_id: number
  monto: number
  comprobante_url: string
  pagado_en: string
  ordenes: {
    id: number
    numero: string
    estado: string
    total: number
    nombre_cliente: string | null
  }
}

interface OrdenCompletada {
  id: number
  numero: string
  estado: string
  total: string | number
  nombre_cliente: string | null
  creado_en: string
  tipo_servicio?: string | null
}

interface OrdenPendiente {
  id: number
  numero: string
  estado: string
  total: number
  nombre_cliente: string | null
  creado_en: string
  restante: number
  pagada: boolean
  tipo_servicio?: string | null
  latitud_entrega?: number | string | null
  longitud_entrega?: number | string | null
  direccion_entrega?: string | null
  telefono_cliente?: string | null
  orden_detalles?: { id: number; cantidad: number; productos: { nombre: string } }[]
  orden_combos?:   { id: number; cantidad: number; combos:   { nombre: string } }[]
}

interface Servicio {
  id: number
  estado: 'abierto' | 'cerrado'
  fecha_inicio: string
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

function toNum(v: number | string | null | undefined): number | null {
  if (v === null || v === undefined) return null
  const n = typeof v === 'number' ? v : parseFloat(String(v))
  return isNaN(n) ? null : n
}

function enviarARepartidor(orden: OrdenPendiente) {
  const lat = toNum(orden.latitud_entrega)
  const lng = toNum(orden.longitud_entrega)

  const items = [
    ...(orden.orden_detalles ?? []).map((d) => `• ${d.cantidad}× ${d.productos?.nombre}`),
    ...(orden.orden_combos   ?? []).map((c) => `• ${c.cantidad}× ${c.combos?.nombre}`),
  ].filter(Boolean).join('\n')

  const mapsLine =
    lat !== null && lng !== null
      ? `\nDestino: https://maps.google.com/maps/dir/?api=1&destination=${lat},${lng}`
      : ''

  const lineas: (string | null)[] = [
    `*NUEVA ENTREGA — ${orden.numero.replace(/ORD-\d{8}-/, 'ORD-')}*`,
    '',
    orden.nombre_cliente    ? orden.nombre_cliente    : null,
    orden.telefono_cliente  ? orden.telefono_cliente  : null,
    orden.direccion_entrega ? orden.direccion_entrega : null,
    items ? `\nPedido:\n${items}` : null,
    '',
    `Total: $${parseFloat(String(orden.total)).toFixed(2)}`,
  ]

  const msg = lineas.filter((l) => l !== null).join('\n') + mapsLine
  window.open(`https://wa.me/?text=${encodeURIComponent(msg)}`, '_blank', 'noopener')
}

function fmt$(n: number | string) {
  return `$${parseFloat(String(n)).toFixed(2)}`
}

function formatFecha(fecha: string) {
  return new Date(fecha).toLocaleDateString('es-MX', {
    day: 'numeric', month: 'short',
    hour: '2-digit', minute: '2-digit',
    timeZone: 'America/Hermosillo',
  })
}

// ─── Section header ───────────────────────────────────────────────────────────

function SectionHeader({ title, count, color = '#F28500' }: { title: string; count: number; color?: string }) {
  return (
    <div className="flex items-center gap-2 mb-3">
      <h2 className="text-white font-extrabold text-base">{title}</h2>
      <span
        className="text-xs font-black px-2 py-0.5 rounded-full"
        style={{ background: `${color}22`, color }}
      >
        {count}
      </span>
    </div>
  )
}

// ─── Transfer card ────────────────────────────────────────────────────────────

function TransferenciaCard({
  pago,
  token,
  onAction,
}: {
  pago: TransferenciaPendiente
  token: string
  onAction: () => void
}) {
  const [saving, setSaving]     = useState(false)
  const [localErr, setLocalErr] = useState('')

  const confirmar = async (aprobado: boolean) => {
    setSaving(true)
    setLocalErr('')
    try {
      await apiClient.patch(
        `/payments/${pago.id}/confirm`,
        { aprobado },
        { headers: { Authorization: `Bearer ${token}` } }
      )
      onAction()
    } catch (err: any) {
      setLocalErr(err?.response?.data?.error ?? 'Error al procesar')
    } finally {
      setSaving(false)
    }
  }

  const numeroCorto = pago.ordenes.numero.replace(/ORD-\d{8}-/, 'ORD-')

  return (
    <div
      className="rounded-2xl p-4 flex flex-col gap-3"
      style={{ background: '#1A1A1A', border: '1px solid rgba(255,255,255,0.07)' }}
    >
      {/* Header */}
      <div className="flex items-start justify-between gap-2">
        <div>
          <span
            className="text-xs font-black px-2 py-1 rounded-lg"
            style={{ background: '#F28500', color: 'white' }}
          >
            {numeroCorto}
          </span>
          {pago.ordenes.nombre_cliente && (
            <p className="text-gray-300 text-sm font-semibold mt-1">
              {pago.ordenes.nombre_cliente}
            </p>
          )}
        </div>
        <span className="font-extrabold text-lg flex-shrink-0" style={{ color: '#F28500' }}>
          {fmt$(pago.ordenes.total)}
        </span>
      </div>

      {/* Comprobante thumbnail */}
      <a
        href={pago.comprobante_url}
        target="_blank"
        rel="noopener noreferrer"
        className="block rounded-xl overflow-hidden transition hover:opacity-90 active:scale-[0.98]"
        style={{ border: '1px solid rgba(255,255,255,0.08)', background: '#0A0A0A' }}
        aria-label="Ver comprobante completo"
      >
        <img
          src={pago.comprobante_url}
          alt="Comprobante de transferencia"
          className="w-full object-contain"
          style={{ maxHeight: '180px' }}
        />
        <p className="text-center text-xs text-gray-500 py-1.5 font-semibold">
          Toca para ver completo
        </p>
      </a>

      <p className="text-xs text-gray-500">{formatFecha(pago.pagado_en)}</p>

      {localErr && <p className="text-xs text-red-400 font-semibold">{localErr}</p>}

      {/* Action buttons */}
      <div className="flex gap-2">
        <button
          onClick={() => confirmar(false)}
          disabled={saving}
          className="flex-1 py-2.5 rounded-xl text-sm font-extrabold transition-all active:scale-95 disabled:opacity-40"
          style={{ background: 'rgba(231,76,60,0.12)', color: '#F87171', border: '1px solid rgba(231,76,60,0.25)' }}
        >
          {saving ? '…' : 'Rechazar'}
        </button>
        <button
          onClick={() => confirmar(true)}
          disabled={saving}
          className="flex-1 py-2.5 rounded-xl text-white text-sm font-extrabold transition-all active:scale-95 disabled:opacity-40"
          style={{ background: 'linear-gradient(135deg, #27AE60 0%, #1E8449 100%)' }}
        >
          {saving ? '…' : 'Aprobar'}
        </button>
      </div>
    </div>
  )
}

// ─── Pending-payment order card ───────────────────────────────────────────────

function OrdenCard({
  orden,
  token,
  onAction,
}: {
  orden: OrdenPendiente
  token: string
  onAction: () => void
}) {
  const [saving, setSaving]     = useState<'efectivo' | 'transferencia' | null>(null)
  const [localErr, setLocalErr] = useState('')
  const [txDone, setTxDone]     = useState(false)

  const pagar = async (metodoPagoId: number) => {
    const tipo = metodoPagoId === 1 ? 'efectivo' : 'transferencia'
    setSaving(tipo)
    setLocalErr('')
    try {
      await apiClient.post(
        '/payments',
        { ordenId: orden.id, metodoPagoId, monto: orden.restante },
        { headers: { Authorization: `Bearer ${token}` } }
      )
      if (tipo === 'efectivo') {
        onAction()
      } else {
        setTxDone(true)
      }
    } catch (err: any) {
      setLocalErr(err?.response?.data?.error ?? 'Error al registrar el pago')
    } finally {
      setSaving(null)
    }
  }

  const numeroCorto = orden.numero.replace(/ORD-\d{8}-/, 'ORD-')

  return (
    <div
      className="rounded-2xl p-4 flex flex-col gap-3"
      style={{ background: '#1A1A1A', border: '1px solid rgba(255,255,255,0.07)' }}
    >
      {/* Header */}
      <div className="flex items-start justify-between gap-2">
        <div>
          <span
            className="text-xs font-black px-2 py-1 rounded-lg"
            style={{ background: '#F28500', color: 'white' }}
          >
            {numeroCorto}
          </span>
          {orden.nombre_cliente && (
            <p className="text-gray-300 text-sm font-semibold mt-1">{orden.nombre_cliente}</p>
          )}
          <span
            className="inline-flex items-center mt-1 text-xs font-bold px-2 py-0.5 rounded-full"
            style={{
              background: orden.estado === 'lista' ? 'rgba(39,174,96,0.12)' : 'rgba(41,128,185,0.12)',
              color: orden.estado === 'lista' ? '#27AE60' : '#2980B9',
            }}
          >
            {orden.estado === 'lista' ? 'Lista' : 'Entregada'}
          </span>
        </div>
        <div className="text-right flex-shrink-0">
          <p className="font-extrabold text-lg" style={{ color: '#F28500' }}>
            {fmt$(orden.total)}
          </p>
          {orden.restante < orden.total && (
            <p className="text-xs text-gray-500 font-semibold">
              Restante: {fmt$(orden.restante)}
            </p>
          )}
        </div>
      </div>

      <p className="text-xs text-gray-500">{formatFecha(orden.creado_en)}</p>

      {localErr && <p className="text-xs text-red-400 font-semibold">{localErr}</p>}

      {orden.tipo_servicio === 'domicilio' && (
        <button
          onClick={() => enviarARepartidor(orden)}
          className="w-full py-2.5 rounded-xl text-sm font-extrabold transition-all active:scale-95 flex items-center justify-center gap-2"
          style={{ background: 'rgba(37,211,102,0.12)', color: '#25D366', border: '1px solid rgba(37,211,102,0.25)' }}
        >
          <svg width="15" height="15" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
            <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347z"/>
            <path d="M11.999 2C6.477 2 2 6.477 2 12c0 1.99.583 3.842 1.585 5.396L2 22l4.73-1.558A9.943 9.943 0 0011.999 22C17.522 22 22 17.523 22 12c0-5.522-4.478-10-10.001-10zm0 18.182a8.14 8.14 0 01-4.142-1.13l-.297-.176-3.08 1.014.986-3.006-.193-.309A8.14 8.14 0 013.818 12c0-4.517 3.663-8.182 8.181-8.182C16.518 3.818 20.182 7.483 20.182 12c0 4.518-3.664 8.182-8.183 8.182z"/>
          </svg>
          Enviar a repartidor por WhatsApp
        </button>
      )}

      {txDone ? (
        <div
          className="rounded-xl px-3 py-2.5"
          style={{ background: 'rgba(41,128,185,0.1)', border: '1px solid rgba(41,128,185,0.25)' }}
        >
          <p className="text-xs text-blue-300 font-semibold">
            Pago por transferencia registrado. El cliente deberá subir su comprobante.
          </p>
        </div>
      ) : (
        <div className="flex gap-2">
          <button
            onClick={() => pagar(1)}
            disabled={saving !== null}
            className="flex-1 py-2.5 rounded-xl text-white text-sm font-extrabold transition-all active:scale-95 disabled:opacity-40"
            style={{ background: 'linear-gradient(135deg, #27AE60 0%, #1E8449 100%)' }}
          >
            {saving === 'efectivo' ? '…' : 'Efectivo'}
          </button>
          <button
            onClick={() => pagar(3)}
            disabled={saving !== null}
            className="flex-1 py-2.5 rounded-xl text-sm font-extrabold transition-all active:scale-95 disabled:opacity-40"
            style={{
              background: 'rgba(41,128,185,0.12)',
              color: '#60A5FA',
              border: '1px solid rgba(41,128,185,0.3)',
            }}
          >
            {saving === 'transferencia' ? '…' : 'Transferencia'}
          </button>
        </div>
      )}
    </div>
  )
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function CajeroPage() {
  const router = useRouter()

  const [token,    setToken]    = useState<string | null>(null)
  const [usuario,  setUsuario]  = useState<{ email: string; rol: string } | null>(null)
  const [servicio, setServicio] = useState<Servicio | null>(null)
  const [loading,  setLoading]  = useState(true)

  const [transferencias,  setTransferencias]  = useState<TransferenciaPendiente[]>([])
  const [ordenesCobro,    setOrdenesCobro]    = useState<OrdenPendiente[]>([])
  const [ordenesHoy,      setOrdenesHoy]      = useState<OrdenCompletada[]>([])
  const [fetchError,      setFetchError]      = useState('')

  const [servicioLoading, setServicioLoading] = useState(false)
  const [servicioError,   setServicioError]   = useState('')

  // ── Auth guard ──
  useEffect(() => {
    const raw = localStorage.getItem('usuario')
    const tk  = localStorage.getItem('accessToken')
    if (!raw || !tk) { router.push('/login'); return }
    try {
      const u = JSON.parse(raw)
      if (u.rol !== 'cajero' && u.rol !== 'gerente') { router.push('/menu'); return }
      setUsuario(u)
      setToken(tk)
    } catch {
      router.push('/login')
    }
  }, [router])

  // ── Fetch all data ──
  const fetchAll = useCallback(async () => {
    if (!token) return
    setFetchError('')
    try {
      const headers = { Authorization: `Bearer ${token}` }
      const [txRes, pendRes, svcRes, ordRes] = await Promise.allSettled([
        apiClient.get('/payments/pending-transfers', { headers }),
        apiClient.get('/payments/pendientes',         { headers }),
        apiClient.get('/services/active'),
        apiClient.get('/orders',                      { headers }),
      ])

      if (txRes.status === 'fulfilled') {
        setTransferencias(Array.isArray(txRes.value.data) ? txRes.value.data : [])
      }

      if (pendRes.status === 'fulfilled') {
        const all: OrdenPendiente[] = Array.isArray(pendRes.value.data) ? pendRes.value.data : []
        // Filter: only lista/entregada, not fully paid
        setOrdenesCobro(
          all.filter((o) => ['lista', 'entregada'].includes(o.estado) && !o.pagada)
        )
      }

      if (svcRes.status === 'fulfilled') {
        setServicio(svcRes.value.data)
      } else {
        setServicio(null)
      }

      if (ordRes.status === 'fulfilled') {
        const allOrders: OrdenCompletada[] = ordRes.value.data?.items ?? []
        const hace8h = Date.now() - 8 * 60 * 60 * 1000
        setOrdenesHoy(
          allOrders.filter(
            (o) => o.estado === 'entregada' && new Date(o.creado_en).getTime() >= hace8h
          )
        )
      }
    } catch {
      setFetchError('Error al cargar datos. Verifica tu conexión.')
    } finally {
      setLoading(false)
    }
  }, [token])

  useEffect(() => {
    if (token) {
      fetchAll()
      const interval = setInterval(fetchAll, 20000)
      return () => clearInterval(interval)
    }
  }, [token, fetchAll])

  // ── Toggle servicio ──
  const toggleServicio = async () => {
    if (!token) return
    setServicioError('')
    setServicioLoading(true)
    try {
      const endpoint = servicio?.estado === 'abierto' ? '/services/close' : '/services/open'
      const res = await apiClient.post(endpoint, {}, {
        headers: { Authorization: `Bearer ${token}` },
      })
      setServicio(res.data)
    } catch (err: any) {
      setServicioError(err?.response?.data?.error ?? 'Error al cambiar el servicio')
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

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0A0A0A] flex items-center justify-center">
        <p className="text-gray-400 font-bold">Cargando panel…</p>
      </div>
    )
  }

  const isAbierto = servicio?.estado === 'abierto'

  return (
    <div className="min-h-screen bg-[#0A0A0A] text-white">

      {/* ── Top bar ── */}
      <div
        className="fixed top-0 left-0 right-0 z-50 px-4 py-3 flex items-center justify-between"
        style={{ background: '#111', borderBottom: '1px solid rgba(255,255,255,0.08)' }}
      >
        <div className="flex items-center gap-3">
          <div>
            <h1 className="text-white font-extrabold text-lg leading-none">Panel Cajero</h1>
            <p className="text-gray-400 text-xs mt-0.5">{usuario?.email}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <span
            className="text-xs font-bold px-3 py-1 rounded-full"
            style={{
              background: isAbierto ? 'rgba(39,174,96,0.2)'  : 'rgba(231,76,60,0.2)',
              color:       isAbierto ? '#27AE60'              : '#E74C3C',
            }}
          >
            {isAbierto ? '● Abierto' : '● Cerrado'}
          </span>
          <RefreshDot intervalMs={20000} />
          <button
            onClick={logout}
            className="text-gray-400 hover:text-white text-xs font-bold px-3 py-1.5 rounded-lg transition"
            style={{ background: 'rgba(255,255,255,0.06)' }}
          >
            Salir
          </button>
        </div>
      </div>

      <main className="pt-20 pb-10 px-4 max-w-lg mx-auto flex flex-col gap-5">

        {/* ── Servicio ── */}
        <div
          className="rounded-2xl p-4 mt-4"
          style={{ background: '#1A1A1A', border: '1px solid rgba(255,255,255,0.06)' }}
        >
          <h2 className="text-white font-extrabold text-sm mb-2">Control de servicio</h2>
          {servicioError && <p className="text-red-400 text-xs font-bold mb-2">{servicioError}</p>}
          <button
            onClick={toggleServicio}
            disabled={servicioLoading}
            className="w-full py-2.5 rounded-xl text-white font-extrabold text-sm transition-all active:scale-95 disabled:opacity-50"
            style={{
              background: isAbierto
                ? 'linear-gradient(135deg, #E74C3C 0%, #C0392B 100%)'
                : 'linear-gradient(135deg, #27AE60 0%, #1E8449 100%)',
            }}
          >
            {servicioLoading ? 'Procesando…' : isAbierto ? 'Cerrar Servicio' : 'Abrir Servicio'}
          </button>
        </div>

        {/* ── Global fetch error ── */}
        {fetchError && (
          <div
            className="rounded-2xl px-4 py-3"
            style={{ background: 'rgba(231,76,60,0.1)', border: '1px solid rgba(231,76,60,0.3)' }}
          >
            <p className="text-sm text-red-300 font-semibold">{fetchError}</p>
          </div>
        )}

        {/* ════════════════════════════════════════
            SECCIÓN A — Transferencias pendientes
        ════════════════════════════════════════ */}
        <section>
          <SectionHeader
            title="Transferencias pendientes"
            count={transferencias.length}
            color="#2980B9"
          />

          {transferencias.length === 0 ? (
            <div
              className="rounded-2xl py-8 text-center"
              style={{ background: '#1A1A1A', border: '1px solid rgba(255,255,255,0.06)' }}
            >
              <p className="text-gray-400 text-sm font-semibold">Sin transferencias pendientes</p>
            </div>
          ) : (
            <div className="flex flex-col gap-3">
              {transferencias.map((pago) => (
                <TransferenciaCard
                  key={pago.id}
                  pago={pago}
                  token={token!}
                  onAction={fetchAll}
                />
              ))}
            </div>
          )}
        </section>

        {/* ════════════════════════════════════════
            SECCIÓN B — Órdenes listas para cobro
        ════════════════════════════════════════ */}
        <section>
          <SectionHeader
            title="Órdenes listas para cobro"
            count={ordenesCobro.length}
            color="#F28500"
          />

          {ordenesCobro.length === 0 ? (
            <div
              className="rounded-2xl py-8 text-center"
              style={{ background: '#1A1A1A', border: '1px solid rgba(255,255,255,0.06)' }}
            >
              <p className="text-gray-400 text-sm font-semibold">Sin órdenes pendientes de cobro</p>
            </div>
          ) : (
            <div className="flex flex-col gap-3">
              {ordenesCobro.map((orden) => (
                <OrdenCard
                  key={orden.id}
                  orden={orden}
                  token={token!}
                  onAction={fetchAll}
                />
              ))}
            </div>
          )}
        </section>

        {/* ════════════════════════════════════════
            SECCIÓN C — Completadas hoy (últimas 8 h)
        ════════════════════════════════════════ */}
        {ordenesHoy.length > 0 && (
          <section style={{ opacity: 0.6 }}>
            <SectionHeader
              title="Completadas hoy"
              count={ordenesHoy.length}
              color="#9CA3AF"
            />
            <div className="flex flex-col gap-2">
              {ordenesHoy.map((orden) => (
                <div
                  key={orden.id}
                  className="rounded-2xl px-4 py-3 flex items-center justify-between gap-3"
                  style={{ background: '#1A1A1A', border: '1px solid rgba(255,255,255,0.06)' }}
                >
                  <div className="flex items-center gap-2 min-w-0">
                    <span
                      className="text-xs font-black px-2 py-1 rounded-lg flex-shrink-0"
                      style={{ background: 'rgba(255,255,255,0.08)', color: '#9CA3AF' }}
                    >
                      {orden.numero.replace(/ORD-\d{8}-/, 'ORD-')}
                    </span>
                    {orden.nombre_cliente && (
                      <span className="text-gray-400 text-xs font-semibold truncate">
                        {orden.nombre_cliente}
                      </span>
                    )}
                    {orden.tipo_servicio === 'domicilio' && (
                      <span
                        className="text-xs font-bold px-1.5 py-0.5 rounded-full flex-shrink-0"
                        style={{ background: 'rgba(41,128,185,0.12)', color: '#5DADE2' }}
                      >
                        domicilio
                      </span>
                    )}
                  </div>
                  <div className="text-right flex-shrink-0">
                    <p className="text-sm font-extrabold text-gray-300">
                      {fmt$(orden.total)}
                    </p>
                    <p className="text-xs text-gray-600">{formatFecha(orden.creado_en)}</p>
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}

      </main>
    </div>
  )
}
