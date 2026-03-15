'use client'

import type { Producto } from '@/types'
import ProductCard from './ProductCard'

interface ProductListProps {
  productos: Producto[]
  categoriaId: number | null
  search: string
}

export default function ProductList({ productos = [], categoriaId, search }: ProductListProps) {
  const filtered = productos.filter((p) => {
    const matchCategoria = categoriaId === null || p.categorias.id === categoriaId
    const matchSearch =
      search.trim() === '' || p.nombre.toLowerCase().includes(search.toLowerCase())
    return matchCategoria && matchSearch
  })

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
        <p className="text-gray-400 text-sm font-medium">
          {search ? `No encontramos "${search}"` : 'No hay productos en esta categoría'}
        </p>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-3">
      {filtered.map((producto, index) => (
        <ProductCard key={producto.id} producto={producto} index={index} />
      ))}
    </div>
  )
}
