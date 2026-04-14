'use client'

import Link from 'next/link'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useCart } from '@/context/CartContext'
import apiClient from '@/lib/api/client'
import usePlacesAutocomplete, { getGeocode, getLatLng } from 'use-places-autocomplete'
import type { TipoServicio, OrdenRequest } from '@/types'

// ─── Selector card (shared for tipo-servicio and metodo-pago) ────────────────

function SelectorCard({
  selected,
  icon,
  label,
  description,
  onClick,
}: {
  selected: boolean
  icon: string
  label: string
  description: string
  onClick: () => void
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="flex-1 flex flex-col items-center gap-1.5 py-3 px-2 rounded-2xl text-center transition-all active:scale-95"
      style={{
        background: selected ? 'rgba(242,133,0,0.15)' : 'rgba(255,255,255,0.04)',
        border: selected ? '1.5px solid rgba(242,133,0,0.6)' : '1.5px solid rgba(255,255,255,0.08)',
      }}
    >
      <span className="text-2xl">{icon}</span>
      <span className="text-sm font-extrabold" style={{ color: selected ? '#F28500' : '#E5E7EB' }}>
        {label}
      </span>
      <span className="text-xs font-medium" style={{ color: selected ? '#F2A040' : '#6B7280' }}>
        {description}
      </span>
    </button>
  )
}

// ─── Field ────────────────────────────────────────────────────────────────────

function Field({
  id, label, value, onChange, placeholder, type = 'text', maxLength, error,
}: {
  id: string; label: string; value: string; onChange: (v: string) => void
  placeholder: string; type?: string; maxLength?: number; error?: string
}) {
  return (
    <div className="flex flex-col gap-1">
      <label htmlFor={id} className="text-xs font-semibold text-slate-300">{label}</label>
      <input
        id={id} type={type} value={value} onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder} maxLength={maxLength}
        className="w-full rounded-xl border bg-[#0A0A0A] px-3 py-2.5 text-sm text-white focus:outline-none transition"
        style={{ borderColor: error ? 'rgba(239,68,68,0.6)' : 'rgba(255,255,255,0.15)' }}
        onFocus={(e)  => (e.currentTarget.style.borderColor = '#F28500')}
        onBlur={(e)   => (e.currentTarget.style.borderColor = error ? 'rgba(239,68,68,0.6)' : 'rgba(255,255,255,0.15)')}
      />
      {error && <p className="text-xs text-red-400">{error}</p>}
    </div>
  )
}

// ─── Payment method type ──────────────────────────────────────────────────────

type MetodoPago = 'efectivo' | 'transferencia'

// ─── Main component ───────────────────────────────────────────────────────────

export default function OrderSummary() {
  const { state, subtotal, total, clearCart } = useCart()
  const router = useRouter()

  const [loading,  setLoading]  = useState(false)
  const [error,    setError]    = useState('')
  const [sinLogin, setSinLogin] = useState(false)

  // Tipo de servicio
  const [tipoServicio,   setTipoServicio]   = useState<TipoServicio>('mostrador')
  const [telefono,       setTelefono]       = useState('')
  const [errorDireccion, setErrorDireccion] = useState('')
  const [errorTelefono,  setErrorTelefono]  = useState('')
  const [coordEntrega,   setCoordEntrega]   = useState<{ lat: number; lng: number } | null>(null)
  const esDomicilio = tipoServicio === 'domicilio'

  // Método de pago
  const [metodoPago, setMetodoPago] = useState<MetodoPago>('efectivo')

  // ── Google Places Autocomplete ──────────────────────────────────────────────
  const {
    ready,
    value: addressValue,
    setValue: setAddressValue,
    suggestions: { status: suggestStatus, data: suggestions },
    clearSuggestions,
  } = usePlacesAutocomplete({
    requestOptions: { componentRestrictions: { country: 'mx' } },
    debounce: 300,
    // Don't init until the component mounts (window.google must be available)
    initOnMount: typeof window !== 'undefined' && typeof window.google !== 'undefined',
  })

  const handleSelectAddress = async (description: string) => {
    setAddressValue(description, false) // false = don't re-fetch suggestions
    clearSuggestions()
    setCoordEntrega(null)
    try {
      const results = await getGeocode({ address: description })
      const { lat, lng } = await getLatLng(results[0])
      setCoordEntrega({ lat, lng })
    } catch { /* coordinates are optional — delivery still works with text address */ }
  }

  // Pre-check login on mount
  useEffect(() => {
    if (!localStorage.getItem('accessToken')) setSinLogin(true)
  }, [])

  // Reset delivery fields when switching service type
  useEffect(() => {
    setErrorDireccion('')
    setErrorTelefono('')
    setAddressValue('', false)
    setCoordEntrega(null)
  }, [tipoServicio, setAddressValue])

  const validateDelivery = (): boolean => {
    let valid = true
    if (esDomicilio) {
      if (addressValue.trim().length < 5) {
        setErrorDireccion('La dirección debe tener al menos 5 caracteres.')
        valid = false
      } else {
        setErrorDireccion('')
      }
      if (telefono.trim().length < 7) {
        setErrorTelefono('Ingresa un teléfono válido (mínimo 7 dígitos).')
        valid = false
      } else {
        setErrorTelefono('')
      }
    }
    return valid
  }

  const handleOrder = async () => {
    setError('')
    const token = localStorage.getItem('accessToken')
    if (!token) { setSinLogin(true); return }
    setSinLogin(false)
    if (!validateDelivery()) return

    setLoading(true)
    try {
      // Build order body
      const productos = state.items
        .filter((i) => i.tipo === 'producto')
        .map((i) => ({ productoId: i.tipo === 'producto' ? i.producto.id : 0, cantidad: i.quantity }))
      const combos = state.items
        .filter((i) => i.tipo === 'combo')
        .map((i) => ({ comboId: i.tipo === 'combo' ? i.combo.id : 0, cantidad: i.quantity }))

      const body: OrdenRequest = {
        tipoServicio, productos, combos,
        ...(esDomicilio && {
          direccionEntrega: addressValue.trim(),
          telefonoCliente:  telefono.trim(),
          ...(coordEntrega && {
            latitudEntrega:  coordEntrega.lat,
            longitudEntrega: coordEntrega.lng,
          }),
        }),
      }

      // 1. Create order
      const ordenRes = await apiClient.post('/orders', body, {
        headers: { Authorization: `Bearer ${token}` },
      })
      const orden = ordenRes.data

      // 2a. Efectivo → confirmacion (cajero handles payment)
      if (metodoPago === 'efectivo') {
        clearCart()
        router.push(`/confirmacion?orden=${orden.numero}&total=${orden.total}`)
        return
      }

      // 2b. Transferencia → create payment record → upload page
      const pagoRes = await apiClient.post('/payments', {
        ordenId:      orden.id,
        metodoPagoId: 3,           // Transferencia Bancaria
        monto:        parseFloat(orden.total),
      }, {
        headers: { Authorization: `Bearer ${token}` },
      })
      const pago = pagoRes.data?.pago ?? pagoRes.data

      clearCart()
      router.push(
        `/transferencia?ordenId=${orden.id}&total=${orden.total}&pagoId=${pago.id}`
      )
    } catch (err: any) {
      const mensaje = err?.response?.data?.error ?? err?.response?.data?.message
      if (err?.response?.status === 401) {
        router.push('/login')
      } else {
        setError(mensaje ?? 'No se pudo realizar el pedido. Intenta de nuevo.')
      }
    } finally {
      setLoading(false)
    }
  }

  // ── Labels for the submit button ──
  const btnLabel = () => {
    if (loading) return 'Enviando pedido…'
    const prefix = esDomicilio ? '🛵 Pedir a domicilio' : '🏪 Realizar Pedido'
    const suffix = `$${total.toFixed(2)}`
    if (metodoPago === 'transferencia') return `📱 Pagar por transferencia — ${suffix}`
    return `${prefix} — ${suffix}`
  }

  return (
    <div className="mt-6 animate-slide-up" style={{ animationDelay: '0.2s' }}>

      {/* ── Resumen de totales ── */}
      <div
        className="rounded-2xl p-4 mb-4"
        style={{ background: '#151515', border: '1px solid rgba(255,255,255,0.06)' }}
      >
        <h2 className="text-white font-display mb-4" style={{ fontSize: '1.4rem' }}>
          Resumen del Pedido
        </h2>
        <div className="flex flex-col gap-3">
          <div className="flex items-center justify-between">
            <span className="text-gray-400 text-sm font-semibold">Subtotal</span>
            <span className="text-white font-bold">${subtotal.toFixed(2)}</span>
          </div>
          <div className="h-px" style={{ background: 'rgba(255,255,255,0.07)' }} />
          <div className="flex items-center justify-between">
            <span className="text-white font-extrabold text-base">Total</span>
            <span className="font-display text-2xl" style={{ color: '#F28500' }}>
              ${total.toFixed(2)}
            </span>
          </div>
        </div>
      </div>

      {/* ── Tipo de servicio ── */}
      <div
        className="rounded-2xl p-4 mb-4"
        style={{ background: '#151515', border: '1px solid rgba(255,255,255,0.06)' }}
      >
        <h3 className="text-white font-extrabold text-sm mb-3">Tipo de servicio</h3>
        <div className="flex gap-2">
          <SelectorCard
            selected={tipoServicio === 'mostrador'} icon="🏪"
            label="Mostrador" description="Recoge en caja"
            onClick={() => setTipoServicio('mostrador')}
          />
          <SelectorCard
            selected={tipoServicio === 'domicilio'} icon="🛵"
            label="Domicilio" description="Envío a domicilio"
            onClick={() => setTipoServicio('domicilio')}
          />
        </div>

        {/* Delivery fields */}
        {esDomicilio && (
          <div className="mt-4 flex flex-col gap-3" style={{ animation: 'fadeSlideDown 0.2s ease both' }}>

            {/* Address autocomplete */}
            <div className="flex flex-col gap-1 relative">
              <label htmlFor="direccion" className="text-xs font-semibold text-slate-300">
                Dirección de entrega *
              </label>
              <input
                id="direccion"
                type="text"
                value={addressValue}
                onChange={(e) => {
                  setAddressValue(e.target.value)
                  setCoordEntrega(null) // reset coords if user types manually
                }}
                placeholder={ready ? 'Calle, número, colonia…' : 'Cargando…'}
                disabled={!ready}
                autoComplete="off"
                maxLength={300}
                className="w-full rounded-xl border bg-[#0A0A0A] px-3 py-2.5 text-sm text-white focus:outline-none transition disabled:opacity-50"
                style={{ borderColor: errorDireccion ? 'rgba(239,68,68,0.6)' : 'rgba(255,255,255,0.15)' }}
                onFocus={(e) => (e.currentTarget.style.borderColor = '#F28500')}
                onBlur={(e) => (e.currentTarget.style.borderColor = errorDireccion ? 'rgba(239,68,68,0.6)' : 'rgba(255,255,255,0.15)')}
              />

              {/* Suggestions dropdown */}
              {suggestStatus === 'OK' && suggestions.length > 0 && (
                <ul
                  className="absolute left-0 right-0 z-50 rounded-2xl overflow-hidden"
                  style={{
                    top: 'calc(100% + 4px)',
                    background: '#2A2A2A',
                    border: '1px solid rgba(255,255,255,0.1)',
                    boxShadow: '0 8px 24px rgba(0,0,0,0.5)',
                  }}
                >
                  {suggestions.map(({ place_id, description }) => (
                    <li
                      key={place_id}
                      onMouseDown={(e) => e.preventDefault()} // prevent blur before click
                      onClick={() => handleSelectAddress(description)}
                      className="flex items-start gap-2.5 px-4 py-3 cursor-pointer transition-colors"
                      style={{
                        color: '#E5E7EB',
                        borderBottom: '1px solid rgba(255,255,255,0.05)',
                      }}
                      onMouseEnter={(e) => (e.currentTarget.style.background = 'rgba(242,133,0,0.1)')}
                      onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
                    >
                      <span className="mt-0.5 text-sm">📍</span>
                      <span className="text-sm font-medium leading-snug">{description}</span>
                    </li>
                  ))}
                </ul>
              )}

              {errorDireccion && (
                <p className="text-xs text-red-400 font-medium">{errorDireccion}</p>
              )}
              {coordEntrega && !errorDireccion && (
                <p className="text-xs font-semibold" style={{ color: '#27AE60' }}>
                  ✓ Ubicación confirmada en el mapa
                </p>
              )}
            </div>

            <Field
              id="telefono" label="Teléfono de contacto *"
              value={telefono} onChange={setTelefono}
              placeholder="Ej. 6621234567" type="tel" maxLength={20}
              error={errorTelefono}
            />
          </div>
        )}
      </div>

      {/* ── Método de pago ── */}
      <div
        className="rounded-2xl p-4 mb-4"
        style={{ background: '#151515', border: '1px solid rgba(255,255,255,0.06)' }}
      >
        <h3 className="text-white font-extrabold text-sm mb-3">Método de pago</h3>
        <div className="flex gap-2">
          <SelectorCard
            selected={metodoPago === 'efectivo'} icon="💵"
            label="Efectivo" description="Paga en caja"
            onClick={() => setMetodoPago('efectivo')}
          />
          <SelectorCard
            selected={metodoPago === 'transferencia'} icon="📱"
            label="Transferencia" description="SPEI / QR"
            onClick={() => setMetodoPago('transferencia')}
          />
        </div>

        {/* Transfer info hint */}
        {metodoPago === 'transferencia' && (
          <div
            className="mt-3 rounded-xl px-3 py-2.5"
            style={{
              background: 'rgba(242,133,0,0.07)',
              border: '1px solid rgba(242,133,0,0.2)',
              animation: 'fadeSlideDown 0.2s ease both',
            }}
          >
            <p className="text-xs text-orange-300 font-semibold">
              📋 Te mostraremos los datos bancarios para que realices la transferencia y subas tu comprobante.
            </p>
          </div>
        )}
      </div>

      {/* ── Error global ── */}
      {error && <p className="text-red-400 text-sm font-semibold text-center mb-4">{error}</p>}

      {/* ── Agregar más ── */}
      <div className="text-center mb-5">
        <Link
          href="/menu"
          className="text-sm font-bold underline underline-offset-4 transition-opacity hover:opacity-70"
          style={{ color: '#F28500' }}
        >
          + Agregar más Productos
        </Link>
        <p className="text-gray-500 text-xs font-medium mt-1">¿Olvidaste algo?</p>
      </div>

      {/* ── Aviso sin login ── */}
      {sinLogin && (
        <div
          className="rounded-2xl p-4 mb-4 text-center"
          style={{ background: 'rgba(242,133,0,0.1)', border: '1px solid rgba(242,133,0,0.3)' }}
        >
          <p className="text-white font-extrabold text-base mb-1">Necesitas iniciar sesión</p>
          <p className="text-gray-400 text-sm mb-3">Para realizar tu pedido necesitas una cuenta</p>
          <div className="flex gap-2">
            <Link
              href="/login"
              className="flex-1 py-2.5 rounded-xl text-white font-extrabold text-sm text-center"
              style={{ background: 'linear-gradient(135deg, #F28500 0%, #D4700A 100%)' }}
            >
              Iniciar sesión
            </Link>
            <Link
              href="/register"
              className="flex-1 py-2.5 rounded-xl font-extrabold text-sm text-center"
              style={{ background: 'rgba(255,255,255,0.08)', color: '#F28500' }}
            >
              Registrarse
            </Link>
          </div>
        </div>
      )}

      {/* ── Botón principal ── */}
      <button
        onClick={handleOrder}
        disabled={loading}
        className="w-full py-5 rounded-2xl text-white font-extrabold text-lg transition-all active:scale-95 hover:opacity-90 disabled:opacity-50"
        style={{
          background: metodoPago === 'transferencia'
            ? 'linear-gradient(135deg, #2980B9 0%, #1A5276 100%)'
            : 'linear-gradient(135deg, #F28500 0%, #D4700A 100%)',
          boxShadow: metodoPago === 'transferencia'
            ? '0 6px 20px rgba(41,128,185,0.4)'
            : '0 6px 20px rgba(242,133,0,0.45)',
          letterSpacing: '0.01em',
        }}
      >
        {btnLabel()}
      </button>

      <style>{`
        @keyframes fadeSlideDown {
          from { opacity: 0; transform: translateY(-6px); }
          to   { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </div>
  )
}
