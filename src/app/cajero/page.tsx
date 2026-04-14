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

interface OrdenPendiente {
  id: number
  numero: string
  estado: string
  total: number
  nombre_cliente: string | null
  creado_en: string
  restante: number
  pagada: boolean
}

interface Servicio {
  id: number
  estado: 'abierto' | 'cerrado'
  fecha_inicio: string
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

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
          🔍 Toca para ver completo
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
          {saving ? '…' : '✕ Rechazar'}
        </button>
        <button
          onClick={() => confirmar(true)}
          disabled={saving}
          className="flex-1 py-2.5 rounded-xl text-white text-sm font-extrabold transition-all active:scale-95 disabled:opacity-40"
          style={{ background: 'linear-gradient(135deg, #27AE60 0%, #1E8449 100%)' }}
        >
          {saving ? '…' : '✓ Aprobar'}
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
            {orden.estado === 'lista' ? '✅ Lista' : '🛵 Entregada'}
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

      {txDone ? (
        <div
          className="rounded-xl px-3 py-2.5"
          style={{ background: 'rgba(41,128,185,0.1)', border: '1px solid rgba(41,128,185,0.25)' }}
        >
          <p className="text-xs text-blue-300 font-semibold">
            📱 Pago por transferencia registrado. El cliente deberá subir su comprobante.
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
            {saving === 'efectivo' ? '…' : '💵 Efectivo'}
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
            {saving === 'transferencia' ? '…' : '📱 Transferencia'}
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
      const [txRes, pendRes, svcRes] = await Promise.allSettled([
        apiClient.get('/payments/pending-transfers', { headers }),
        apiClient.get('/payments/pendientes',         { headers }),
        apiClient.get('/services/active'),
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
          <span className="text-2xl">💳</span>
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
              <p className="text-2xl mb-2">✓</p>
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
              <p className="text-2xl mb-2">🧾</p>
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

      </main>
    </div>
  )
}
