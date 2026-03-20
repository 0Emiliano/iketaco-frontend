'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useCart } from '@/context/CartContext'
import apiClient from '@/lib/api/client'

export default function OrderSummary() {
  const { state, subtotal, total, clearCart } = useCart()
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleOrder = async () => {
    setError('')

    // Verificar que hay token
    const token = localStorage.getItem('accessToken')
    if (!token) {
      router.push('/login')
      return
    }

    setLoading(true)

    try {
      // Construir el body separando productos y combos
      const productos = state.items
        .filter((i) => i.tipo === 'producto')
        .map((i) => ({
          productoId: i.tipo === 'producto' ? i.producto.id : 0,
          cantidad: i.quantity,
        }))

      const combos = state.items
        .filter((i) => i.tipo === 'combo')
        .map((i) => ({
          comboId: i.tipo === 'combo' ? i.combo.id : 0,
          cantidad: i.quantity,
        }))

      const response = await apiClient.post(
        '/orders',
        { productos, combos },
        { headers: { Authorization: `Bearer ${token}` } }
      )

      const orden = response.data

      clearCart()
      router.push(`/confirmacion?orden=${orden.numero}&total=${orden.total}`)
    } catch (err: any) {
      const mensaje = err?.response?.data?.error
      if (err?.response?.status === 401) {
        router.push('/login')
      } else {
        setError(mensaje ?? 'No se pudo realizar el pedido. Intenta de nuevo.')
      }
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="mt-6 animate-slide-up" style={{ animationDelay: '0.2s' }}>
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

      {error && <p className="text-red-400 text-sm font-semibold text-center mb-4">{error}</p>}

      <div className="text-center mb-5">
        <a
          href="/menu"
          className="text-sm font-bold underline underline-offset-4 transition-opacity hover:opacity-70"
          style={{ color: '#F28500' }}
        >
          + Agregar más Productos
        </a>
        <p className="text-gray-500 text-xs font-medium mt-1">¿Olvidaste algo?</p>
      </div>

      <button
        onClick={handleOrder}
        disabled={loading}
        className="w-full py-5 rounded-2xl text-white font-extrabold text-lg transition-all active:scale-95 hover:opacity-90 disabled:opacity-50"
        style={{
          background: 'linear-gradient(135deg, #F28500 0%, #D4700A 100%)',
          boxShadow: '0 6px 20px rgba(242,133,0,0.45)',
          letterSpacing: '0.01em',
        }}
      >
        {loading ? 'Enviando pedido...' : `Realizar Pedido — $${total.toFixed(2)}`}
      </button>
    </div>
  )
}
