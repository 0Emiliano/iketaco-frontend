'use client'

import type { CartItem as CartItemType } from '@/types'
import { useCart } from '@/context/CartContext'

interface CartItemProps {
  item: CartItemType
}

export default function CartItem({ item }: CartItemProps) {
  const { updateQuantity, removeItem } = useCart()

  const isProducto = item.tipo === 'producto'
  const id = isProducto ? item.producto.id : item.combo.id
  const nombre = isProducto ? item.producto.nombre : item.combo.nombre
  const precio = isProducto ? item.producto.precio_base : item.combo.precio
  const imagen = isProducto ? item.producto.imagen_url : item.combo.imagen_url
  const tipo = item.tipo
  const lineTotal = (parseFloat(precio) * item.quantity).toFixed(2)

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
        {imagen ? (
          <img src={imagen} alt={nombre} className="w-full h-full object-cover" />
        ) : (
          <span>🌮</span>
        )}
      </div>

      {/* Nombre + controles */}
      <div className="flex-1 min-w-0">
        <div className="flex items-start justify-between gap-2">
          <div>
            <h3 className="text-white font-extrabold text-sm leading-tight">{nombre}</h3>
            {!isProducto && (
              <span
                className="text-xs font-bold px-2 py-0.5 rounded-full mt-0.5 inline-block"
                style={{ background: 'rgba(242,133,0,0.2)', color: '#F28500' }}
              >
                Combo
              </span>
            )}
          </div>
          <button
            onClick={() => removeItem(id, tipo)}
            aria-label={`Eliminar ${nombre} del carrito`}
            className="text-gray-500 hover:text-red-400 transition-colors flex-shrink-0 rounded-xl flex items-center justify-center"
            style={{ background: 'rgba(255,255,255,0.06)', width: 36, height: 36, minWidth: 36 }}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
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
            onClick={() => updateQuantity(id, tipo, item.quantity - 1)}
            className="w-8 h-8 rounded-lg flex items-center justify-center text-white font-black text-base transition-all active:scale-90"
            style={{ background: 'linear-gradient(135deg, #F28500, #D4700A)' }}
          >
            −
          </button>
          <span className="text-white font-extrabold text-base w-6 text-center tabular-nums">
            {item.quantity}
          </span>
          <button
            onClick={() => updateQuantity(id, tipo, item.quantity + 1)}
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
