'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import type { Combo } from '@/types'
import { useCart } from '@/context/CartContext'

interface ComboListProps {
  combos: Combo[]
  search: string
}

export default function ComboList({ combos = [], search }: ComboListProps) {
  const { addCombo } = useCart()
  const router = useRouter()
  const [cantidades, setCantidades] = useState<Record<number, number>>({})

  const getCantidad = (id: number) => cantidades[id] ?? 1

  const setCantidad = (id: number, val: number) =>
    setCantidades((prev) => ({ ...prev, [id]: Math.max(1, val) }))

  const handleAgregar = (combo: Combo) => {
    addCombo(combo, getCantidad(combo.id))
    router.push('/cart')
  }

  const filtered = combos.filter(
    (c) => search.trim() === '' || c.nombre.toLowerCase().includes(search.toLowerCase())
  )

  if (filtered.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-center animate-fade-in">
        <div
          className="w-20 h-20 rounded-full flex items-center justify-center text-4xl mb-4"
          style={{ background: '#1A1A1A' }}
        >
          🌮
        </div>
        <p className="text-white font-extrabold text-lg mb-1">Sin resultados</p>
        <p className="text-gray-400 text-sm font-medium">No hay combos disponibles</p>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-3">
      {filtered.map((combo, index) => (
        <div
          key={combo.id}
          className="rounded-2xl p-3 animate-slide-up"
          style={{
            background: '#1A1A1A',
            animationDelay: `${index * 0.07}s`,
            boxShadow: '0 4px 24px rgba(0,0,0,0.3)',
            border: '1px solid rgba(255,255,255,0.04)',
          }}
        >
          <div className="flex items-center gap-4">
            {/* Imagen */}
            <div
              className="w-24 h-24 rounded-xl flex-shrink-0 flex items-center justify-center text-4xl"
              style={{ background: '#2A2A2A' }}
            >
              {combo.imagen_url ? (
                <img
                  src={combo.imagen_url}
                  alt={combo.nombre}
                  className="w-full h-full object-cover rounded-xl"
                />
              ) : (
                <span>🌮</span>
              )}
            </div>

            {/* Info */}
            <div className="flex-1 min-w-0">
              <h3 className="text-white font-extrabold text-base leading-tight">{combo.nombre}</h3>
              <p className="text-gray-400 text-sm mt-1 leading-snug line-clamp-2 font-medium">
                {combo.descripcion}
              </p>
              <p className="font-display text-xl mt-1" style={{ color: '#F28500' }}>
                ${combo.precio}
              </p>
            </div>
          </div>

          {/* Cantidad + Agregar */}
          <div
            className="flex items-center justify-between mt-3 pt-3"
            style={{ borderTop: '1px solid rgba(255,255,255,0.06)' }}
          >
            <div className="flex items-center gap-3">
              <button
                onClick={() => setCantidad(combo.id, getCantidad(combo.id) - 1)}
                className="w-8 h-8 rounded-lg flex items-center justify-center text-white font-black"
                style={{ background: 'linear-gradient(135deg, #F28500, #D4700A)' }}
              >
                −
              </button>
              <span className="text-white font-extrabold text-base w-4 text-center">
                {getCantidad(combo.id)}
              </span>
              <button
                onClick={() => setCantidad(combo.id, getCantidad(combo.id) + 1)}
                className="w-8 h-8 rounded-lg flex items-center justify-center text-white font-black"
                style={{ background: 'linear-gradient(135deg, #F28500, #D4700A)' }}
              >
                +
              </button>
            </div>

            <button
              onClick={() => handleAgregar(combo)}
              className="px-4 py-2 rounded-xl text-white font-extrabold text-sm"
              style={{ background: 'linear-gradient(135deg, #F28500 0%, #D4700A 100%)' }}
            >
              Agregar — ${(parseFloat(combo.precio) * getCantidad(combo.id)).toFixed(2)}
            </button>
          </div>
        </div>
      ))}
    </div>
  )
}
