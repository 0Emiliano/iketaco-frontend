'use client'

import type { Categoria } from '@/types'

interface CategoryFilterProps {
  categorias: Categoria[]
  activa: number | null
  onChange: (id: number | null) => void
}

export default function CategoryFilter({ categorias = [], activa, onChange }: CategoryFilterProps) {
  return (
    <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
      {/* Botón "Todo" */}
      <button
        onClick={() => onChange(null)}
        className="flex-shrink-0 px-4 py-2 rounded-full font-extrabold text-sm transition-all"
        style={{
          background: activa === null ? '#F28500' : '#1A1A1A',
          color: activa === null ? 'white' : '#9CA3AF',
        }}
      >
        Todo
      </button>

      {/* Botones por categoría */}
      {categorias.map((cat) => (
        <button
          key={cat.id}
          onClick={() => onChange(cat.id)}
          className="flex-shrink-0 px-4 py-2 rounded-full font-extrabold text-sm transition-all"
          style={{
            background: activa === cat.id ? '#F28500' : '#1A1A1A',
            color: activa === cat.id ? 'white' : '#9CA3AF',
          }}
        >
          {cat.nombre}
        </button>
      ))}
    </div>
  )
}
