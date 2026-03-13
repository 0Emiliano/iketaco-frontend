'use client'

import type { CartItem as CartItemType } from '@/types'
import { useCart } from '@/context/CartContext'

const EMOJI_MAP: Record<string, string> = {
  'combo-ke-tacos': '🌮',
  'combo-queso': '🧀',
  'combo-dorado': '✨',
  'tacos-de-birria': '🔥',
  'quesbirrias': '🫓',
}

interface CartItemProps {
  item: CartItemType
}

export default function CartItem({ item }: CartItemProps) {
  const { updateQuantity, removeItem } = useCart()
  const { product, quantity } = item
  const lineTotal = product.price * quantity

  return (
    <div
      className="flex items-center gap-3 rounded-2xl p-3 animate-slide-up"
      style={{
        background: '#1A1A1A',
        border: '1px solid rgba(255,255,255,0.05)',
        boxShadow: '0 4px 20px rgba(0,0,0,0.3)',
      }}
    >
      {/* Image / emoji */}
      <div
        className="w-20 h-20 rounded-xl flex-shrink-0 overflow-hidden relative flex items-center justify-center text-3xl shadow-md"
        style={{ background: product.imageGradient }}
      >
        <div
          className="absolute inset-0"
          style={{ background: 'linear-gradient(135deg, rgba(255,255,255,0.1) 0%, transparent 60%)' }}
        />
        <span className="relative z-10">{EMOJI_MAP[product.slug] ?? '🌮'}</span>
      </div>

      {/* Name + controls */}
      <div className="flex-1 min-w-0">
        <div className="flex items-start justify-between gap-2">
          <h3 className="text-white font-extrabold text-sm leading-tight">{product.name}</h3>
          {/* Remove */}
          <button
            onClick={() => removeItem(product.id)}
            className="text-gray-600 hover:text-red-400 transition-colors flex-shrink-0 mt-0.5 p-1 rounded-lg"
            style={{ background: 'rgba(255,255,255,0.04)' }}
            aria-label={`Eliminar ${product.name}`}
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
              <path d="M18 6L6 18M6 6l12 12" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" />
            </svg>
          </button>
        </div>

        {/* Qty + price row */}
        <div className="flex items-center gap-2 mt-2.5">
          {/* Minus */}
          <button
            onClick={() => updateQuantity(product.id, quantity - 1)}
            className="w-8 h-8 rounded-lg flex items-center justify-center text-white font-black text-base transition-all active:scale-90"
            style={{ background: 'linear-gradient(135deg, #F28500, #D4700A)' }}
            aria-label="Reducir"
          >
            −
          </button>

          <span className="text-white font-extrabold text-base w-6 text-center tabular-nums">
            {quantity}
          </span>

          {/* Plus */}
          <button
            onClick={() => updateQuantity(product.id, quantity + 1)}
            className="w-8 h-8 rounded-lg flex items-center justify-center text-white font-black text-base transition-all active:scale-90"
            style={{ background: 'linear-gradient(135deg, #F28500, #D4700A)' }}
            aria-label="Aumentar"
          >
            +
          </button>

          {/* Line total */}
          <span
            className="ml-auto font-display text-xl"
            style={{ color: '#F28500' }}
          >
            ${lineTotal.toFixed(2)}
          </span>
        </div>
      </div>
    </div>
  )
}
