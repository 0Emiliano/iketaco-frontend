'use client'

import { useState } from 'react'
import NavComponent from '@/components/ui/NavComponent'
import SearchBar from '@/components/menu/SearchBar'
import CategoryFilter from '@/components/menu/CategoryFilter'
import ProductList from '@/components/menu/ProductList'
import { PRODUCTS, CATEGORIES } from '@/data/products'
import type { CategoryKey } from '@/types'

export default function MenuPage() {
  const [search, setSearch] = useState('')
  const [activeCategory, setActiveCategory] = useState<CategoryKey>('todo')

  return (
    <div className="min-h-screen bg-[#0A0A0A]">
      <NavComponent title="Menú" />

      <main className="px-4 pt-20 pb-28 max-w-lg mx-auto w-full">
        {/* Header */}
        <div className="mt-2 mb-4 animate-fade-in">
          <h1
            className="text-white font-display"
            style={{ fontSize: '2rem', lineHeight: 1.1 }}
          >
            ¿Qué vas a pedir hoy?
          </h1>
          <p className="text-gray-400 text-sm font-medium mt-1">Elige tu combo favorito</p>
        </div>

        {/* Search */}
        <div className="mb-4 animate-slide-up" style={{ animationDelay: '0.05s' }}>
          <SearchBar value={search} onChange={setSearch} />
        </div>

        {/* Category filter */}
        <div className="mb-5 animate-slide-up" style={{ animationDelay: '0.1s' }}>
          <CategoryFilter
            categories={CATEGORIES}
            active={activeCategory}
            onChange={setActiveCategory}
          />
        </div>

        {/* Product list */}
        <ProductList
          products={PRODUCTS}
          category={activeCategory}
          search={search}
        />
      </main>
    </div>
  )
}
