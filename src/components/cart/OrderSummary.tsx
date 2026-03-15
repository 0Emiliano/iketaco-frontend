'use client'

import { useRouter } from 'next/navigation'
import { useCart } from '@/context/CartContext'

export default function OrderSummary() {
  const { subtotal, total, clearCart } = useCart()
  const router = useRouter()

  const handleOrder = () => {
    clearCart()
    router.push('/confirmacion')
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
        className="w-full py-5 rounded-2xl text-white font-extrabold text-lg transition-all active:scale-95 hover:opacity-90"
        style={{
          background: 'linear-gradient(135deg, #F28500 0%, #D4700A 100%)',
          boxShadow: '0 6px 20px rgba(242,133,0,0.45)',
          letterSpacing: '0.01em',
        }}
      >
        Realizar Pedido — ${total.toFixed(2)}
      </button>
    </div>
  )
}
