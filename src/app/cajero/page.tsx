'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import apiClient from '@/lib/api/client'

interface MetodoPago {
  id: number
  nombre: string
}

interface Orden {
  id: number
  numero: string
  estado: string
  nombre_cliente: string | null
  subtotal: string
  total: string
  creado_en: string
}

interface Servicio {
  id: number
  estado: 'abierto' | 'cerrado'
  fecha_inicio: string
}

export default function CajeroPage() {
  const router = useRouter()
  const [ordenesPendientes, setOrdenesPendientes] = useState<Orden[]>([])
  const [metodos, setMetodos] = useState<MetodoPago[]>([])
  const [servicio, setServicio] = useState<Servicio | null>(null)
  const [loading, setLoading] = useState(true)
  const [servicioLoading, setServicioLoading] = useState(false)
  const [servicioError, setServicioError] = useState('')
  const [usuario, setUsuario] = useState<{ email: string; rol: string } | null>(null)

  // Payment modal state
  const [pagoOrden, setPagoOrden] = useState<Orden | null>(null)
  const [metodoPagoId, setMetodoPagoId] = useState<number | ''>('')
  const [referencia, setReferencia] = useState('')
  const [pagoLoading, setPagoLoading] = useState(false)
  const [pagoError, setPagoError] = useState('')
  const [pagoExito, setPagoExito] = useState('')

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const raw = localStorage.getItem('usuario')
      if (!raw) { router.push('/login'); return }
      const u = JSON.parse(raw)
      if (u.rol !== 'cajero' && u.rol !== 'gerente') { router.push('/menu'); return }
      setUsuario(u)
    }
  }, [router])

  const fetchPendientes = useCallback(async () => {
    try {
      const res = await apiClient.get('/payments/pendientes')
      setOrdenesPendientes(res.data)
    } catch {
      // silent
    }
  }, [])

  const fetchMetodos = useCallback(async () => {
    try {
      const res = await apiClient.get('/payments/metodos')
      setMetodos(res.data)
    } catch {
      // silent
    }
  }, [])

  const fetchServicio = useCallback(async () => {
    try {
      const res = await apiClient.get('/services/active')
      setServicio(res.data)
    } catch (err: any) {
      if (err?.response?.status === 404) setServicio(null)
    }
  }, [])

  useEffect(() => {
    if (!usuario) return
    Promise.all([fetchPendientes(), fetchMetodos(), fetchServicio()]).finally(() =>
      setLoading(false)
    )
    const interval = setInterval(fetchPendientes, 20000)
    return () => clearInterval(interval)
  }, [usuario, fetchPendientes, fetchMetodos, fetchServicio])

  const toggleServicio = async () => {
    setServicioError('')
    setServicioLoading(true)
    try {
      if (servicio?.estado === 'abierto') {
        const res = await apiClient.post('/services/close')
        setServicio(res.data)
      } else {
        const res = await apiClient.post('/services/open')
        setServicio(res.data)
      }
    } catch (err: any) {
      setServicioError(err?.response?.data?.error ?? 'Error al cambiar servicio')
    } finally {
      setServicioLoading(false)
    }
  }

  const abrirModalPago = (orden: Orden) => {
    setPagoOrden(orden)
    setMetodoPagoId('')
    setReferencia('')
    setPagoError('')
    setPagoExito('')
  }

  const procesarPago = async () => {
    if (!pagoOrden || !metodoPagoId) return
    setPagoError('')
    setPagoLoading(true)
    try {
      await apiClient.post('/payments', {
        ordenId: pagoOrden.id,
        metodoPagoId: Number(metodoPagoId),
        monto: parseFloat(pagoOrden.total),
        ...(referencia ? { referencia } : {}),
      })
      setPagoExito('Pago registrado correctamente')
      await fetchPendientes()
      setTimeout(() => {
        setPagoOrden(null)
        setPagoExito('')
      }, 1500)
    } catch (err: any) {
      setPagoError(err?.response?.data?.error ?? 'Error al procesar el pago')
    } finally {
      setPagoLoading(false)
    }
  }

  const logout = () => {
    apiClient.post('/auth/logout').catch(() => {})
    localStorage.removeItem('accessToken')
    localStorage.removeItem('usuario')
    router.push('/login')
  }

  const formatFecha = (fecha: string) =>
    new Date(fecha).toLocaleDateString('es-MX', {
      day: 'numeric',
      month: 'short',
      hour: '2-digit',
      minute: '2-digit',
      timeZone: 'America/Hermosillo',
    })

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0A0A0A] flex items-center justify-center">
        <p className="text-gray-400 font-bold">Cargando panel...</p>
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
          <span className="text-2xl">💳</span>
          <div>
            <h1 className="text-white font-extrabold text-lg leading-none">Panel Cajero</h1>
            <p className="text-gray-400 text-xs mt-0.5">{usuario?.email}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <div
            className="text-xs font-bold px-3 py-1 rounded-full"
            style={{
              background: servicio?.estado === 'abierto' ? 'rgba(39,174,96,0.2)' : 'rgba(231,76,60,0.2)',
              color: servicio?.estado === 'abierto' ? '#27AE60' : '#E74C3C',
            }}
          >
            {servicio?.estado === 'abierto' ? '● Abierto' : '● Cerrado'}
          </div>
          <button
            onClick={logout}
            className="text-gray-400 hover:text-white text-xs font-bold px-3 py-1.5 rounded-lg transition"
            style={{ background: 'rgba(255,255,255,0.06)' }}
          >
            Salir
          </button>
        </div>
      </div>

      <main className="pt-20 pb-10 px-4 max-w-lg mx-auto">
        {/* Service control */}
        <div
          className="rounded-2xl p-4 mt-4 mb-5"
          style={{ background: '#1A1A1A', border: '1px solid rgba(255,255,255,0.06)' }}
        >
          <h2 className="text-white font-extrabold text-sm mb-2">Control de Servicio</h2>
          {servicioError && <p className="text-red-400 text-xs font-bold mb-2">{servicioError}</p>}
          <button
            onClick={toggleServicio}
            disabled={servicioLoading}
            className="w-full py-2.5 rounded-xl text-white font-extrabold text-sm transition-all active:scale-95 disabled:opacity-50"
            style={{
              background:
                servicio?.estado === 'abierto'
                  ? 'linear-gradient(135deg, #E74C3C 0%, #C0392B 100%)'
                  : 'linear-gradient(135deg, #27AE60 0%, #1E8449 100%)',
            }}
          >
            {servicioLoading
              ? 'Procesando...'
              : servicio?.estado === 'abierto'
              ? 'Cerrar Servicio'
              : 'Abrir Servicio'}
          </button>
        </div>

        {/* Pending orders */}
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-white font-extrabold text-lg">
            Pendientes de cobro{' '}
            <span className="text-gray-500 text-sm font-bold">({ordenesPendientes.length})</span>
          </h2>
          <button
            onClick={fetchPendientes}
            className="text-gray-400 hover:text-white text-xs font-bold px-3 py-1.5 rounded-lg transition"
            style={{ background: 'rgba(255,255,255,0.06)' }}
          >
            Actualizar
          </button>
        </div>

        {ordenesPendientes.length === 0 ? (
          <div className="text-center py-16">
            <p className="text-4xl mb-3">✅</p>
            <p className="text-gray-400 font-semibold">Sin órdenes pendientes de cobro</p>
          </div>
        ) : (
          <div className="flex flex-col gap-3">
            {ordenesPendientes.map((orden) => (
              <div
                key={orden.id}
                className="rounded-2xl p-4"
                style={{ background: '#1A1A1A', border: '1px solid rgba(255,255,255,0.06)' }}
              >
                <div className="flex items-center justify-between mb-2">
                  <span
                    className="text-xs font-black px-2 py-1 rounded-lg"
                    style={{ background: '#F28500', color: 'white' }}
                  >
                    {orden.numero.replace(/ORD-\d{8}-/, 'ORD-')}
                  </span>
                  <span
                    className="text-xs font-bold px-2 py-1 rounded-full"
                    style={{ background: 'rgba(39,174,96,0.15)', color: '#27AE60' }}
                  >
                    Lista para cobrar
                  </span>
                </div>
                {orden.nombre_cliente && (
                  <p className="text-gray-300 text-sm font-semibold mb-1">{orden.nombre_cliente}</p>
                )}
                <div className="flex items-center justify-between mt-3">
                  <span className="text-gray-500 text-xs">{formatFecha(orden.creado_en)}</span>
                  <div className="flex items-center gap-3">
                    <span className="font-extrabold text-lg" style={{ color: '#F28500' }}>
                      ${parseFloat(orden.total).toFixed(2)}
                    </span>
                    <button
                      onClick={() => abrirModalPago(orden)}
                      className="py-2 px-4 rounded-xl text-white font-extrabold text-sm transition-all active:scale-95"
                      style={{ background: 'linear-gradient(135deg, #27AE60 0%, #1E8449 100%)' }}
                    >
                      Cobrar
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>

      {/* Payment modal */}
      {pagoOrden && (
        <div
          className="fixed inset-0 z-50 flex items-end justify-center px-4 pb-6"
          style={{ background: 'rgba(0,0,0,0.7)' }}
          onClick={(e) => { if (e.target === e.currentTarget) setPagoOrden(null) }}
        >
          <div
            className="w-full max-w-lg rounded-3xl p-5"
            style={{ background: '#1A1A1A', border: '1px solid rgba(255,255,255,0.1)' }}
          >
            <div className="flex items-start justify-between mb-1">
              <h2 className="text-white font-extrabold text-xl">Registrar Pago</h2>
              <button
                onClick={() => setPagoOrden(null)}
                aria-label="Cerrar modal"
                className="text-gray-400 hover:text-white transition-colors rounded-xl flex items-center justify-center"
                style={{ background: 'rgba(255,255,255,0.06)', width: 36, height: 36, minWidth: 36 }}
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                  <path d="M18 6L6 18M6 6l12 12" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" />
                </svg>
              </button>
            </div>
            <p className="text-gray-400 text-sm mb-4">
              {pagoOrden.numero.replace(/ORD-\d{8}-/, 'ORD-')} —{' '}
              <span style={{ color: '#F28500' }}>${parseFloat(pagoOrden.total).toFixed(2)}</span>
            </p>

            <div className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-gray-300 mb-1">
                  Método de pago
                </label>
                <select
                  value={metodoPagoId}
                  onChange={(e) => setMetodoPagoId(Number(e.target.value))}
                  className="w-full rounded-xl border border-white/20 bg-[#0A0A0A] px-3 py-3 text-sm text-white focus:border-orange-500 focus:outline-none"
                >
                  <option value="">Selecciona un método</option>
                  {metodos.map((m) => (
                    <option key={m.id} value={m.id}>
                      {m.nombre}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-300 mb-1">
                  Referencia / Folio (opcional)
                </label>
                <input
                  value={referencia}
                  onChange={(e) => setReferencia(e.target.value)}
                  type="text"
                  placeholder="Número de transacción..."
                  className="w-full rounded-xl border border-white/20 bg-[#0A0A0A] px-3 py-3 text-sm text-white focus:border-orange-500 focus:outline-none"
                />
              </div>
            </div>

            {pagoError && <p className="text-red-400 text-sm font-bold mt-3">{pagoError}</p>}
            {pagoExito && <p className="text-green-400 text-sm font-bold mt-3">{pagoExito}</p>}

            <div className="flex gap-3 mt-4">
              <button
                onClick={() => setPagoOrden(null)}
                className="flex-1 py-3 rounded-xl font-extrabold text-sm transition-all"
                style={{ background: 'rgba(255,255,255,0.06)', color: '#9CA3AF' }}
              >
                Cancelar
              </button>
              <button
                onClick={procesarPago}
                disabled={!metodoPagoId || pagoLoading}
                className="flex-1 py-3 rounded-xl text-white font-extrabold text-sm transition-all active:scale-95 disabled:opacity-50"
                style={{ background: 'linear-gradient(135deg, #27AE60 0%, #1E8449 100%)' }}
              >
                {pagoLoading ? 'Procesando...' : 'Confirmar Pago'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
