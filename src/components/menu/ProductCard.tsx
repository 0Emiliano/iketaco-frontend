'use client'

import Link from 'next/link'
import type { Producto } from '@/types'

interface ProductCardProps {
  producto: Producto
  index?: number
}

export default function ProductCard({ producto, index = 0 }: ProductCardProps) {
  return (
    <Link
      href={`/product/${producto.id}`}
      className="flex items-center gap-4 rounded-2xl p-3 transition-all duration-200 hover:scale-[1.01] active:scale-[0.98] group animate-slide-up"
      style={{
        background: '#1A1A1A',
        animationDelay: `${index * 0.07}s`,
        boxShadow: '0 4px 24px rgba(0,0,0,0.3)',
        border: '1px solid rgba(255,255,255,0.04)',
      }}
    >
      {/* Imagen */}
      <div
        className="w-24 h-24 rounded-xl flex-shrink-0 overflow-hidden relative flex items-center justify-center text-4xl shadow-md"
        style={{ background: '#2A2A2A' }}
      >
        {producto.imagen_url ? (
          <img
            src={producto.imagen_url}
            alt={producto.nombre}
            className="w-full h-full object-cover"
          />
        ) : (
          <span className="relative z-10 select-none">🌮</span>
        )}
      </div>

      {/* Info */}
      <div className="flex-1 min-w-0">
        <h3 className="text-white font-extrabold text-base leading-tight">{producto.nombre}</h3>
        <p className="text-gray-400 text-sm mt-1 leading-snug line-clamp-2 font-medium">
          {producto.descripcion}
        </p>
        <p className="font-display text-xl mt-2" style={{ color: '#F28500' }}>
          ${producto.precio_base}
        </p>
      </div>

      {/* Arrow */}
      <div className="text-gray-600 group-hover:text-[#F28500] transition-colors flex-shrink-0 pr-1">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
          <path
            d="M9 18l6-6-6-6"
            stroke="currentColor"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </div>
    </Link>
  )
}
