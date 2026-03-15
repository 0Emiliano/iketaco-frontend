'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import type { Producto } from '@/types'

interface ProductDetailProps {
  producto: Producto
}

export default function ProductDetail({ producto }: ProductDetailProps) {
  const [quantity, setQuantity] = useState(1)
  const router = useRouter()

  const total = (parseFloat(producto.precio_base) * quantity).toFixed(2)

  return (
    <div className="min-h-screen bg-[#0A0A0A] flex flex-col">
      {/* Hero imagen */}
      <div
        className="w-full h-56 flex items-center justify-center text-8xl"
        style={{ background: '#1A1A1A' }}
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

      {/* Contenido */}
      <div className="flex-1 px-4 pt-6 pb-32 max-w-lg mx-auto w-full">
        <h1 className="text-white font-extrabold text-2xl">{producto.nombre}</h1>
        <p className="text-gray-400 text-sm mt-2">{producto.descripcion}</p>
        <p className="font-display text-3xl mt-3" style={{ color: '#F28500' }}>
          ${producto.precio_base}
        </p>

        {/* Cantidad */}
        <div className="mt-8">
          <p className="text-white font-extrabold text-lg mb-4">Cantidad</p>
          <div className="flex items-center justify-center gap-8">
            <button
              onClick={() => setQuantity((q) => Math.max(1, q - 1))}
              className="w-14 h-14 rounded-full flex items-center justify-center text-2xl font-bold text-white"
              style={{ background: '#F28500' }}
            >
              −
            </button>
            <span className="text-white font-extrabold text-3xl w-8 text-center">{quantity}</span>
            <button
              onClick={() => setQuantity((q) => q + 1)}
              className="w-14 h-14 rounded-full flex items-center justify-center text-2xl font-bold text-white"
              style={{ background: '#F28500' }}
            >
              +
            </button>
          </div>
        </div>
      </div>

      {/* Botón agregar */}
      <div
        className="fixed bottom-0 left-0 right-0 px-4 pb-8 pt-4 max-w-lg mx-auto"
        style={{ background: 'linear-gradient(to top, #0A0A0A 80%, transparent)' }}
      >
        <div className="flex items-center justify-between mb-3">
          <span className="text-gray-400 font-bold">Total</span>
          <span className="text-white font-extrabold text-xl">${total}</span>
        </div>
        <button
          onClick={() => router.push('/cart')}
          className="w-full py-4 rounded-2xl text-white font-extrabold text-lg"
          style={{ background: 'linear-gradient(135deg, #F28500 0%, #D4700A 100%)' }}
        >
          Agregar — ${total}
        </button>
      </div>
    </div>
  )
}
