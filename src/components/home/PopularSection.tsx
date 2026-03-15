'use client'

import Link from 'next/link'
import { useEffect, useState } from 'react'
import { getProductos } from '@/data/products'
import type { Producto } from '@/types'

// IDs de los productos más populares según el menú real
const POPULARES_IDS = [4, 3, 2] // Quesabirria, Doriqueso, Taco Dorado

export default function PopularSection() {
  const [populares, setPopulares] = useState<Producto[]>([])

  useEffect(() => {
    getProductos()
      .then((productos) => {
        const filtrados = productos.filter((p) => POPULARES_IDS.includes(p.id))
        setPopulares(filtrados)
      })
      .catch(console.error)
  }, [])

  return (
    <section className="mt-6 animate-slide-up" style={{ animationDelay: '0.15s' }}>
      <div className="flex items-center justify-between mb-3">
        <h2 className="text-white font-display tracking-wide" style={{ fontSize: '1.5rem' }}>
          Más Populares
        </h2>
        <Link
          href="/menu"
          className="text-xs font-extrabold uppercase tracking-widest transition-opacity hover:opacity-80"
          style={{ color: '#F28500' }}
        >
          Ver todos →
        </Link>
      </div>

      <div className="flex flex-col gap-3">
        {populares.map((producto, i) => (
          <Link
            key={producto.id}
            href={`/product/${producto.id}`}
            className="flex items-center gap-4 rounded-2xl p-3 transition-all duration-200 hover:scale-[1.01] active:scale-[0.98] group animate-slide-up"
            style={{
              background: '#1A1A1A',
              animationDelay: `${0.2 + i * 0.08}s`,
              boxShadow: '0 4px 24px rgba(0,0,0,0.4)',
              border: '1px solid rgba(255,255,255,0.04)',
            }}
          >
            {/* Imagen */}
            <div
              className="w-20 h-20 rounded-xl flex-shrink-0 flex items-center justify-center text-4xl"
              style={{ background: '#2A2A2A' }}
            >
              {producto.imagen_url ? (
                <img
                  src={producto.imagen_url}
                  alt={producto.nombre}
                  className="w-full h-full object-cover rounded-xl"
                />
              ) : (
                <span>🌮</span>
              )}
            </div>

            {/* Info */}
            <div className="flex-1 min-w-0">
              <h3 className="text-white font-extrabold text-base leading-tight">
                {producto.nombre}
              </h3>
              <p className="text-gray-400 text-sm mt-0.5 leading-snug line-clamp-2 font-medium">
                {producto.descripcion}
              </p>
              <p className="font-display text-xl mt-1.5" style={{ color: '#F28500' }}>
                ${producto.precio_base}
              </p>
            </div>

            {/* Arrow */}
            <div className="text-gray-600 group-hover:text-[#F28500] transition-colors flex-shrink-0">
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
        ))}
      </div>
    </section>
  )
}
