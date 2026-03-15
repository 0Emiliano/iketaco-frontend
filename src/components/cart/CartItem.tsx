'use client'

import type { CartItem as CartItemType } from '@/types'
import { useCart } from '@/context/CartContext'

interface CartItemProps {
  item: CartItemType
}

export default function CartItem({ item }: CartItemProps) {
  const { updateQuantity, removeItem } = useCart()
  const { producto, quantity } = item
  const lineTotal = (parseFloat(producto.precio_base) * quantity).toFixed(2)

  return (
    <div
      className="flex items-center gap-3 rounded-2xl p-3 animate-slide-up"
      style={{
        background: '#1A1A1A',
        border: '1px solid rgba(255,255,255,0.05)',
        boxShadow: '0 4px 20px rgba(0,0,0,0.3)',
      }}
    >
      {/* Imagen */}
      <div
        className="w-20 h-20 rounded-xl flex-shrink-0 overflow-hidden flex items-center justify-center text-3xl"
        style={{ background: '#2A2A2A' }}
      >
        {producto.imagen_url ? (
          <img
            src={producto.imagen_url}
            alt={producto.nombre}
            className="w-full h-full object-cover"
          />
        ) : (
          <span>🌮</span>
        )}
      </div>

      {/* Nombre + controles */}
      <div className="flex-1 min-w-0">
        <div className="flex items-start justify-between gap-2">
          <h3 className="text-white font-extrabold text-sm leading-tight">{producto.nombre}</h3>
          <button
            onClick={() => removeItem(producto.id)}
            className="text-gray-600 hover:text-red-400 transition-colors flex-shrink-0 mt-0.5 p-1 rounded-lg"
            style={{ background: 'rgba(255,255,255,0.04)' }}
            aria-label={`Eliminar ${producto.nombre}`}
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
              <path
                d="M18 6L6 18M6 6l12 12"
                stroke="currentColor"
                strokeWidth="2.5"
                strokeLinecap="round"
              />
            </svg>
          </button>
        </div>

        <div className="flex items-center gap-2 mt-2.5">
          <button
            onClick={() => updateQuantity(producto.id, quantity - 1)}
            className="w-8 h-8 rounded-lg flex items-center justify-center text-white font-black text-base transition-all active:scale-90"
            style={{ background: 'linear-gradient(135deg, #F28500, #D4700A)' }}
          >
            −
          </button>

          <span className="text-white font-extrabold text-base w-6 text-center tabular-nums">
            {quantity}
          </span>

          <button
            onClick={() => updateQuantity(producto.id, quantity + 1)}
            className="w-8 h-8 rounded-lg flex items-center justify-center text-white font-black text-base transition-all active:scale-90"
            style={{ background: 'linear-gradient(135deg, #F28500, #D4700A)' }}
          >
            +
          </button>

          <span className="ml-auto font-display text-xl" style={{ color: '#F28500' }}>
            ${lineTotal}
          </span>
        </div>
      </div>
    </div>
  )
}
