'use client'

import { useState, useEffect } from 'react'
import NavComponent from '@/components/ui/NavComponent'
import SearchBar from '@/components/menu/SearchBar'
import CategoryFilter from '@/components/menu/CategoryFilter'
import ProductList from '@/components/menu/ProductList'
import ComboList from '@/components/menu/ComboList'
import { getCategorias, getProductos, getCombos } from '@/data/products'
import type { Categoria, Producto, Combo } from '@/types'

const CATEGORIA_COMBOS_ID = 3 // ID de la categoría Combos en la BD

export default function MenuPage() {
  const [search, setSearch] = useState('')
  const [categorias, setCategorias] = useState<Categoria[]>([])
  const [productos, setProductos] = useState<Producto[]>([])
  const [combos, setCombos] = useState<Combo[]>([])
  const [activaCategoriaId, setActivaCategoriaId] = useState<number | null>(null)

  useEffect(() => {
    getCategorias().then(setCategorias).catch(console.error)
    getProductos().then(setProductos).catch(console.error)
    getCombos().then(setCombos).catch(console.error)
  }, [])

  const mostrandoCombos = activaCategoriaId === CATEGORIA_COMBOS_ID

  return (
    <div className="min-h-screen bg-[#0A0A0A]">
      <NavComponent title="Menú" />

      <main className="px-4 pt-20 pb-28 max-w-lg mx-auto w-full">
        <div className="mt-2 mb-4 animate-fade-in">
          <h1 className="text-white font-display" style={{ fontSize: '2rem', lineHeight: 1.1 }}>
            ¿Qué vas a pedir hoy?
          </h1>
          <p className="text-gray-400 text-sm font-medium mt-1">Elige tu combo favorito</p>
        </div>

        <div className="mb-4 animate-slide-up" style={{ animationDelay: '0.05s' }}>
          <SearchBar value={search} onChange={setSearch} />
        </div>

        <div className="mb-5 animate-slide-up" style={{ animationDelay: '0.1s' }}>
          <CategoryFilter
            categorias={categorias}
            activa={activaCategoriaId}
            onChange={setActivaCategoriaId}
          />
        </div>

        {mostrandoCombos ? (
          <ComboList combos={combos} search={search} />
        ) : (
          <ProductList productos={productos} categoriaId={activaCategoriaId} search={search} />
        )}
      </main>
    </div>
  )
}
