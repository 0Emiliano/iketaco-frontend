'use client'

import { useRef, useState, useEffect } from 'react'
import type { Categoria } from '@/types'

interface CategoryFilterProps {
  categorias: Categoria[]
  activa: number | null
  onChange: (id: number | null) => void
}

export default function CategoryFilter({ categorias = [], activa, onChange }: CategoryFilterProps) {
  const scrollRef = useRef<HTMLDivElement>(null)
  const [showFade, setShowFade] = useState(false)

  useEffect(() => {
    const el = scrollRef.current
    if (!el) return
    const check = () => {
      const hasOverflow = el.scrollWidth > el.clientWidth
      const notAtEnd = el.scrollLeft < el.scrollWidth - el.clientWidth - 4
      setShowFade(hasOverflow && notAtEnd)
    }
    check()
    el.addEventListener('scroll', check, { passive: true })
    window.addEventListener('resize', check)
    return () => {
      el.removeEventListener('scroll', check)
      window.removeEventListener('resize', check)
    }
  }, [categorias])

  return (
    <div className="relative">
      <div ref={scrollRef} className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
        <button
          onClick={() => onChange(null)}
          className="flex-shrink-0 px-4 py-2 rounded-full font-extrabold text-sm transition-all active:scale-95"
          style={{
            background: activa === null ? '#F28500' : '#1A1A1A',
            color: activa === null ? 'white' : '#9CA3AF',
            boxShadow: activa === null ? '0 2px 12px rgba(242,133,0,0.4)' : 'none',
          }}
        >
          Todo
        </button>

        {categorias.map((cat) => (
          <button
            key={cat.id}
            onClick={() => onChange(cat.id)}
            className="flex-shrink-0 px-4 py-2 rounded-full font-extrabold text-sm transition-all active:scale-95"
            style={{
              background: activa === cat.id ? '#F28500' : '#1A1A1A',
              color: activa === cat.id ? 'white' : '#9CA3AF',
              boxShadow: activa === cat.id ? '0 2px 12px rgba(242,133,0,0.4)' : 'none',
            }}
          >
            {cat.nombre}
          </button>
        ))}
      </div>

      {/* Fade derecho: indica que hay más categorías */}
      <div
        className="absolute top-0 right-0 h-full w-12 pointer-events-none transition-opacity duration-300"
        style={{
          background: 'linear-gradient(to right, transparent, #0A0A0A)',
          opacity: showFade ? 1 : 0,
        }}
      />
    </div>
  )
}
