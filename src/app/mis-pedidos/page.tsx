'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import NavComponent from '@/components/ui/NavComponent'
import apiClient from '@/lib/api/client'

// ─── Types ────────────────────────────────────────────────────────────────────

interface OrdenDetalle {
  id: number
  cantidad: number
  producto_id: number
  productos: { nombre: string }
}

interface OrdenCombo {
  id: number
  cantidad: number
  combo_id: number
  combos: { nombre: string }
}

interface OrdenHistorial {
  id: number
  numero: string
  estado: string
  subtotal: string
  total: string
  creado_en: string
  nombre_cliente: string | null
  orden_detalles: OrdenDetalle[]
  orden_combos: OrdenCombo[]
}

type EditItem =
  | { tipo: 'producto'; productoId: number; nombre: string; cantidad: number }
  | { tipo: 'combo'; comboId: number; nombre: string; cantidad: number }

// ─── Constants ────────────────────────────────────────────────────────────────

const ESTADO_CONFIG: Record<string, { label: string; color: string; bg: string }> = {
  pendiente:      { label: '⏳ Pendiente',  color: '#9CA3AF', bg: 'rgba(156,163,175,0.1)' },
  en_preparacion: { label: '🔥 Preparando', color: '#F28500', bg: 'rgba(242,133,0,0.15)'  },
  lista:          { label: '✅ Lista',       color: '#27AE60', bg: 'rgba(39,174,96,0.15)'  },
  entregada:      { label: '🛵 Entregada',  color: '#2980B9', bg: 'rgba(41,128,185,0.15)' },
  cancelada:      { label: '❌ Cancelada',  color: '#E74C3C', bg: 'rgba(231,76,60,0.15)'  },
}

// ─── Quantity stepper ─────────────────────────────────────────────────────────

function Stepper({
  value,
  onChange,
  min = 0,
  max = 99,
}: {
  value: number
  onChange: (v: number) => void
  min?: number
  max?: number
}) {
  return (
    <div className="flex items-center gap-1">
      <button
        type="button"
        onClick={() => onChange(Math.max(min, value - 1))}
        disabled={value <= min}
        className="w-8 h-8 rounded-xl flex items-center justify-center text-base font-black transition active:scale-90 disabled:opacity-30"
        style={{ background: 'rgba(255,255,255,0.08)', color: '#F28500' }}
        aria-label="Disminuir"
      >
        −
      </button>
      <span
        className="w-8 text-center text-sm font-extrabold text-white tabular-nums"
      >
        {value}
      </span>
      <button
        type="button"
        onClick={() => onChange(Math.min(max, value + 1))}
        disabled={value >= max}
        className="w-8 h-8 rounded-xl flex items-center justify-center text-base font-black transition active:scale-90 disabled:opacity-30"
        style={{ background: 'rgba(255,255,255,0.08)', color: '#F28500' }}
        aria-label="Aumentar"
      >
        +
      </button>
    </div>
  )
}

// ─── Edit modal ───────────────────────────────────────────────────────────────

function EditModal({
  orden,
  items,
  setItems,
  saving,
  error,
  onClose,
  onConfirm,
}: {
  orden: OrdenHistorial
  items: EditItem[]
  setItems: (items: EditItem[]) => void
  saving: boolean
  error: string
  onClose: () => void
  onConfirm: () => void
}) {
  const updateCantidad = (index: number, cantidad: number) => {
    const next = [...items]
    next[index] = { ...next[index], cantidad } as EditItem
    setItems(next)
  }

  const activeItems = items.filter((i) => i.cantidad > 0)
  const hasChanges = items.some((item, i) => {
    const orig =
      item.tipo === 'producto'
        ? orden.orden_detalles.find((d) => d.producto_id === item.productoId)?.cantidad
        : orden.orden_combos.find((c) => c.combo_id === item.comboId)?.cantidad
    return item.cantidad !== (orig ?? 0)
  })

  return (
    /* Backdrop */
    <div
      className="fixed inset-0 z-50 flex items-end justify-center sm:items-center p-4"
      style={{ background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(4px)' }}
      onClick={(e) => { if (e.target === e.currentTarget) onClose() }}
    >
      {/* Sheet */}
      <div
        className="w-full max-w-lg rounded-3xl overflow-hidden"
        style={{
          background: '#1A1A1A',
          border: '1px solid rgba(255,255,255,0.08)',
          animation: 'slideUp 0.22s cubic-bezier(0.16,1,0.3,1) both',
        }}
      >
        {/* Header */}
        <div
          className="flex items-center justify-between px-5 py-4"
          style={{ borderBottom: '1px solid rgba(255,255,255,0.07)' }}
        >
          <div>
            <p className="text-xs uppercase tracking-[0.2em] text-orange-400 font-bold mb-0.5">
              Modificar pedido
            </p>
            <h2 className="text-white font-display text-xl">
              {orden.numero.replace(/ORD-\d{8}-/, 'ORD-')}
            </h2>
          </div>
          <button
            onClick={onClose}
            className="w-9 h-9 rounded-xl flex items-center justify-center text-lg text-gray-400 hover:text-white transition"
            style={{ background: 'rgba(255,255,255,0.06)' }}
            aria-label="Cerrar"
          >
            ✕
          </button>
        </div>

        {/* Items list */}
        <div className="px-5 py-4 flex flex-col gap-3 max-h-[55vh] overflow-y-auto">
          {items.map((item, index) => {
            const nombre = item.tipo === 'producto' ? item.nombre : item.nombre
            const isRemoved = item.cantidad === 0
            return (
              <div
                key={index}
                className="flex items-center justify-between gap-3 rounded-2xl px-4 py-3 transition"
                style={{
                  background: isRemoved
                    ? 'rgba(231,76,60,0.06)'
                    : 'rgba(255,255,255,0.04)',
                  border: isRemoved
                    ? '1px solid rgba(231,76,60,0.2)'
                    : '1px solid rgba(255,255,255,0.06)',
                  opacity: isRemoved ? 0.55 : 1,
                }}
              >
                <div className="flex-1 min-w-0">
                  <p
                    className="text-sm font-bold truncate"
                    style={{ color: isRemoved ? '#9CA3AF' : '#F3F4F6' }}
                  >
                    {nombre}
                  </p>
                  <p className="text-xs font-medium mt-0.5" style={{ color: '#6B7280' }}>
                    {item.tipo === 'producto' ? 'Producto' : 'Combo'}
                    {isRemoved && (
                      <span className="ml-2 text-red-400 font-bold">· Se eliminará</span>
                    )}
                  </p>
                </div>
                <Stepper
                  value={item.cantidad}
                  onChange={(v) => updateCantidad(index, v)}
                  min={0}
                />
              </div>
            )
          })}
        </div>

        {/* Warning if all items removed */}
        {activeItems.length === 0 && (
          <div className="mx-5 mb-3 rounded-2xl px-4 py-3" style={{ background: 'rgba(231,76,60,0.1)', border: '1px solid rgba(231,76,60,0.25)' }}>
            <p className="text-xs text-red-300 font-semibold text-center">
              Debes mantener al menos un ítem en el pedido
            </p>
          </div>
        )}

        {/* Error */}
        {error && (
          <p className="text-xs text-red-400 font-semibold text-center px-5 mb-3">{error}</p>
        )}

        {/* Footer */}
        <div
          className="flex gap-3 px-5 py-4"
          style={{ borderTop: '1px solid rgba(255,255,255,0.07)' }}
        >
          <button
            onClick={onClose}
            disabled={saving}
            className="flex-1 py-3 rounded-2xl text-sm font-extrabold transition active:scale-95 disabled:opacity-50"
            style={{ background: 'rgba(255,255,255,0.07)', color: '#9CA3AF' }}
          >
            Cancelar
          </button>
          <button
            onClick={onConfirm}
            disabled={saving || activeItems.length === 0 || !hasChanges}
            className="flex-1 py-3 rounded-2xl text-sm font-extrabold text-white transition active:scale-95 disabled:opacity-40"
            style={{
              background: 'linear-gradient(135deg, #F28500 0%, #D4700A 100%)',
              boxShadow: '0 4px 14px rgba(242,133,0,0.35)',
            }}
          >
            {saving ? 'Guardando...' : 'Confirmar cambios'}
          </button>
        </div>
      </div>

      <style>{`
        @keyframes slideUp {
          from { opacity: 0; transform: translateY(24px); }
          to   { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </div>
  )
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function MisPedidosPage() {
  const router = useRouter()

  const [ordenes, setOrdenes]       = useState<OrdenHistorial[]>([])
  const [loading, setLoading]       = useState(true)
  const [error, setError]           = useState('')
  const [noLogueado, setNoLogueado] = useState(false)

  // Modal state
  const [modalOrden, setModalOrden]   = useState<OrdenHistorial | null>(null)
  const [editItems, setEditItems]     = useState<EditItem[]>([])
  const [saving, setSaving]           = useState(false)
  const [modalError, setModalError]   = useState('')

  const fetchOrdenes = useCallback(() => {
    const token = localStorage.getItem('accessToken')
    if (!token) {
      setNoLogueado(true)
      setLoading(false)
      return
    }
    apiClient
      .get('/orders/mis-pedidos', { headers: { Authorization: `Bearer ${token}` } })
      .then((res) => setOrdenes(res.data?.items ?? []))
      .catch((err) => {
        if (err?.response?.status === 401) router.push('/login')
        else setError('Error al cargar tus pedidos')
      })
      .finally(() => setLoading(false))
  }, [router])

  useEffect(() => { fetchOrdenes() }, [fetchOrdenes])

  // ── Open modal ──
  const openModal = (orden: OrdenHistorial) => {
    const items: EditItem[] = [
      ...(orden.orden_detalles ?? []).map((d) => ({
        tipo: 'producto' as const,
        productoId: d.producto_id,
        nombre: d.productos?.nombre ?? 'Producto',
        cantidad: d.cantidad,
      })),
      ...(orden.orden_combos ?? []).map((c) => ({
        tipo: 'combo' as const,
        comboId: c.combo_id,
        nombre: c.combos?.nombre ?? 'Combo',
        cantidad: c.cantidad,
      })),
    ]
    setModalOrden(orden)
    setEditItems(items)
    setModalError('')
  }

  // ── Confirm PATCH ──
  const handleConfirm = async () => {
    if (!modalOrden) return
    setModalError('')

    const productos = editItems
      .filter((i): i is Extract<EditItem, { tipo: 'producto' }> => i.tipo === 'producto')
      .map((i) => ({ productoId: i.productoId, cantidad: i.cantidad }))

    const combos = editItems
      .filter((i): i is Extract<EditItem, { tipo: 'combo' }> => i.tipo === 'combo')
      .map((i) => ({ comboId: i.comboId, cantidad: i.cantidad }))

    const token = localStorage.getItem('accessToken')
    setSaving(true)
    try {
      const res = await apiClient.patch(
        `/orders/${modalOrden.id}/items`,
        { productos, combos },
        { headers: { Authorization: `Bearer ${token}` } }
      )
      // Patch the local list with the updated order
      setOrdenes((prev) =>
        prev.map((o) => (o.id === modalOrden.id ? { ...o, ...res.data } : o))
      )
      setModalOrden(null)
    } catch (err: any) {
      const msg = err?.response?.data?.error ?? err?.response?.data?.message
      setModalError(msg ?? 'No se pudo actualizar el pedido. Intenta de nuevo.')
    } finally {
      setSaving(false)
    }
  }

  // ── Helpers ──
  const formatFecha = (fecha: string) =>
    new Date(fecha).toLocaleDateString('es-MX', {
      day: 'numeric',
      month: 'short',
      hour: '2-digit',
      minute: '2-digit',
      timeZone: 'America/Hermosillo',
    })

  const getResumen = (orden: OrdenHistorial) => {
    const items = [
      ...(orden.orden_detalles ?? []).map((d) => `${d.cantidad}× ${d.productos?.nombre ?? ''}`),
      ...(orden.orden_combos ?? []).map((c) => `${c.cantidad}× ${c.combos?.nombre ?? ''}`),
    ]
    return items.filter(Boolean).join(', ') || '—'
  }

  // ── Loading ──
  if (loading) {
    return (
      <div className="min-h-screen bg-[#0A0A0A] flex items-center justify-center">
        <p className="text-gray-400">Cargando pedidos...</p>
      </div>
    )
  }

  // ── No login ──
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

  // ── Main render ──
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
              const esPendiente = orden.estado === 'pendiente'

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

                  {/* Items summary */}
                  <p className="text-gray-300 text-sm font-medium line-clamp-2 mb-3">
                    {getResumen(orden)}
                  </p>

                  {/* Footer: date + total + modify button */}
                  <div
                    className="flex items-center justify-between pt-2"
                    style={{ borderTop: '1px solid rgba(255,255,255,0.06)' }}
                  >
                    <span className="text-gray-500 text-xs">{formatFecha(orden.creado_en)}</span>

                    <div className="flex items-center gap-2">
                      {esPendiente && (
                        <button
                          onClick={() => openModal(orden)}
                          className="px-3 py-1.5 rounded-xl text-xs font-extrabold transition active:scale-95 hover:opacity-90"
                          style={{
                            background: 'rgba(242,133,0,0.15)',
                            border: '1px solid rgba(242,133,0,0.35)',
                            color: '#F28500',
                          }}
                        >
                          ✏️ Modificar
                        </button>
                      )}
                      <span className="font-display text-lg" style={{ color: '#F28500' }}>
                        ${parseFloat(orden.total).toFixed(2)}
                      </span>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </main>

      {/* ── Edit modal ── */}
      {modalOrden && (
        <EditModal
          orden={modalOrden}
          items={editItems}
          setItems={setEditItems}
          saving={saving}
          error={modalError}
          onClose={() => setModalOrden(null)}
          onConfirm={handleConfirm}
        />
      )}
    </div>
  )
}
