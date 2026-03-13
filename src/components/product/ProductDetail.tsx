'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import type { Product } from '@/types'
import { useCart } from '@/context/CartContext'
import QuantitySelector from './QuantitySelector'

const EMOJI_MAP: Record<string, string> = {
  'combo-ke-tacos': '🌮',
  'combo-queso': '🧀',
  'combo-dorado': '✨',
  'tacos-de-birria': '🔥',
  'quesbirrias': '🫓',
}

interface ProductDetailProps {
  product: Product
}

export default function ProductDetail({ product }: ProductDetailProps) {
  const [quantity, setQuantity] = useState(1)
  const [added, setAdded] = useState(false)
  const { addItem } = useCart()
  const router = useRouter()

  const total = product.price * quantity

  const handleAdd = () => {
    addItem(product, quantity)
    setAdded(true)
    setTimeout(() => {
      router.push('/cart')
    }, 700)
  }

  return (
    <div className="flex flex-col min-h-[calc(100vh-4rem)] bg-[#0A0A0A]">
      {/* Hero image area */}
      <div
        className="relative w-full overflow-hidden"
        style={{ height: '240px', background: product.imageGradient }}
      >
        {/* Decorative radial glows */}
        <div
          className="absolute inset-0"
          style={{
            background: `
              radial-gradient(circle at 35% 55%, rgba(242,133,0,0.5) 0%, transparent 50%),
              radial-gradient(circle at 70% 30%, rgba(242,133,0,0.25) 0%, transparent 40%)
            `,
          }}
        />

        {/* Emoji food icon centered */}
        <div className="absolute inset-0 flex items-center justify-center">
          <span style={{ fontSize: '6rem', filter: 'drop-shadow(0 8px 24px rgba(0,0,0,0.6))' }}>
            {EMOJI_MAP[product.slug] ?? '🌮'}
          </span>
        </div>

        {/* Bottom fade */}
        <div
          className="absolute inset-0"
          style={{ background: 'linear-gradient(to bottom, transparent 40%, #0A0A0A 100%)' }}
        />

        {/* Category pill */}
        <div className="absolute bottom-5 left-5">
          <span
            className="px-3 py-1 rounded-full text-xs font-extrabold uppercase tracking-widest"
            style={{ background: 'rgba(242,133,0,0.3)', color: '#F9A825', border: '1px solid rgba(242,133,0,0.5)' }}
          >
            {product.category}
          </span>
        </div>
      </div>

      {/* Content panel */}
      <div className="flex-1 flex flex-col px-5 pt-4 pb-36 animate-fade-in">
        {/* Product name */}
        <h1
          className="text-white font-display text-center"
          style={{ fontSize: '2.4rem', lineHeight: 1.0 }}
        >
          {product.name}
        </h1>

        {/* Description box */}
        <div
          className="mt-4 p-4 rounded-2xl"
          style={{ background: '#151515', border: '1px solid rgba(255,255,255,0.06)' }}
        >
          <p className="text-xs font-extrabold uppercase tracking-widest mb-2" style={{ color: '#F28500' }}>
            Descripción del producto
          </p>
          <p className="text-gray-300 text-sm font-medium leading-relaxed">
            {product.description}
          </p>
        </div>

        {/* Quantity row */}
        <div className="mt-6">
          <div className="flex items-center justify-between mb-3">
            <p
              className="text-white font-display"
              style={{ fontSize: '1.5rem' }}
            >
              Cantidad
            </p>
            <p className="text-gray-400 text-sm font-bold">
              Mín. 1
            </p>
          </div>
          <QuantitySelector
            quantity={quantity}
            onDecrement={() => setQuantity((q) => Math.max(1, q - 1))}
            onIncrement={() => setQuantity((q) => q + 1)}
          />
        </div>

        {/* Price per unit note */}
        <div className="mt-4 flex items-center justify-between">
          <span className="text-gray-500 text-sm font-medium">Precio unitario</span>
          <span className="text-gray-300 font-bold">${product.price}.00</span>
        </div>
      </div>

      {/* Fixed bottom bar */}
      <div
        className="fixed bottom-0 left-0 right-0 max-w-lg mx-auto px-5 py-4 z-40"
        style={{
          background: 'linear-gradient(to top, #0A0A0A 70%, rgba(10,10,10,0) 100%)',
          paddingBottom: 'max(16px, env(safe-area-inset-bottom))',
        }}
      >
        {/* Total display */}
        <div
          className="flex items-center justify-between mb-3 px-4 py-3 rounded-2xl"
          style={{ background: '#1A1A1A', border: '1px solid rgba(255,255,255,0.06)' }}
        >
          <div>
            <p className="text-gray-400 text-xs font-extrabold uppercase tracking-widest">Total</p>
            <p
              className="text-white font-display"
              style={{ fontSize: '1.75rem' }}
            >
              ${total.toFixed(2)}
            </p>
          </div>
          <div className="text-right">
            <p className="text-gray-500 text-xs font-medium">
              {quantity} {quantity === 1 ? 'unidad' : 'unidades'}
            </p>
            <p className="text-gray-400 text-xs">IVA incluido</p>
          </div>
        </div>

        {/* Add button */}
        <button
          onClick={handleAdd}
          disabled={added}
          className="w-full py-4 rounded-2xl text-white font-extrabold text-lg transition-all active:scale-95 disabled:opacity-75"
          style={{
            background: added
              ? 'linear-gradient(135deg, #16A34A, #15803D)'
              : 'linear-gradient(135deg, #F28500 0%, #D4700A 100%)',
            boxShadow: added
              ? '0 4px 15px rgba(22,163,74,0.4)'
              : '0 4px 15px rgba(242,133,0,0.4)',
            letterSpacing: '0.01em',
          }}
        >
          {added ? '✓ Agregado al carrito' : 'Agregar'}
        </button>
      </div>
    </div>
  )
}
