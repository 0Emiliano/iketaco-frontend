'use client'

import Link from 'next/link'
import { useEffect, useState } from 'react'
import { getCombos } from '@/data/products'
import type { Combo } from '@/types'

export default function PopularSection() {
  const [combos, setCombos] = useState<Combo[]>([])

  useEffect(() => {
    getCombos().then(setCombos).catch(console.error)
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
        {combos.map((combo, i) => (
          <div
            key={combo.id}
            className="flex items-center gap-4 rounded-2xl p-3 animate-slide-up"
            style={{
              background: '#1A1A1A',
              animationDelay: `${0.2 + i * 0.08}s`,
              boxShadow: '0 4px 24px rgba(0,0,0,0.4)',
              border: '1px solid rgba(255,255,255,0.04)',
            }}
          >
            {/* Imagen placeholder */}
            <div
              className="w-20 h-20 rounded-xl flex-shrink-0 flex items-center justify-center text-4xl"
              style={{ background: '#2A2A2A' }}
            >
              🌮
            </div>

            {/* Info */}
            <div className="flex-1 min-w-0">
              <h3 className="text-white font-extrabold text-base leading-tight">{combo.nombre}</h3>
              <p className="text-gray-400 text-sm mt-0.5 leading-snug line-clamp-2 font-medium">
                {combo.descripcion}
              </p>
              <p className="font-display text-xl mt-1.5" style={{ color: '#F28500' }}>
                ${combo.precio}
              </p>
            </div>
          </div>
        ))}
      </div>
    </section>
  )
}
