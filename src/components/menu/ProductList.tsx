'use client'

import type { Product, CategoryKey } from '@/types'
import ProductCard from './ProductCard'

interface ProductListProps {
  products: Product[]
  category: CategoryKey
  search: string
}

export default function ProductList({ products, category, search }: ProductListProps) {
  const filtered = products.filter((p) => {
    const matchCategory = category === 'todo' || p.category === category
    const matchSearch = search.trim() === '' || p.name.toLowerCase().includes(search.toLowerCase())
    return matchCategory && matchSearch
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
      {filtered.map((product, index) => (
        <ProductCard key={product.id} product={product} index={index} />
      ))}
    </div>
  )
}
