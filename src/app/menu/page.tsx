'use client'

import { useState, useEffect, useCallback } from 'react'
import NavComponent from '@/components/ui/NavComponent'
import SearchBar from '@/components/menu/SearchBar'
import CategoryFilter from '@/components/menu/CategoryFilter'
import ProductList from '@/components/menu/ProductList'
import ComboList from '@/components/menu/ComboList'
import MenuSkeleton from '@/components/menu/MenuSkeleton'
import { getCategorias, getProductos, getCombos } from '@/data/products'
import type { Categoria, Producto, Combo } from '@/types'

const CATEGORIA_COMBOS_ID = 3

export default function MenuPage() {
  const [search, setSearch] = useState('')
  const [categorias, setCategorias] = useState<Categoria[]>([])
  const [productos, setProductos] = useState<Producto[]>([])
  const [combos, setCombos] = useState<Combo[]>([])
  const [activaCategoriaId, setActivaCategoriaId] = useState<number | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(false)

  const fetchData = useCallback(async () => {
    setLoading(true)
    setError(false)
    try {
      const [cats, prods, combosData] = await Promise.all([
        getCategorias(),
        getProductos(),
        getCombos(),
      ])
      setCategorias(cats)
      setProductos(prods)
      setCombos(combosData)
    } catch {
      setError(true)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchData()
  }, [fetchData])

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

        {!loading && !error && (
          <div className="mb-5 animate-slide-up" style={{ animationDelay: '0.1s' }}>
            <CategoryFilter
              categorias={categorias}
              activa={activaCategoriaId}
              onChange={setActivaCategoriaId}
            />
          </div>
        )}

        {loading && <MenuSkeleton />}

        {error && (
          <div className="flex flex-col items-center justify-center py-16 text-center animate-fade-in">
            <div
              className="w-20 h-20 rounded-full flex items-center justify-center text-4xl mb-4"
              style={{ background: '#1A1A1A' }}
            >
              😕
            </div>
            <p className="text-white font-extrabold text-lg mb-1">No pudimos cargar el menú</p>
            <p className="text-gray-400 text-sm font-medium mb-5">
              Revisa tu conexión e intenta de nuevo
            </p>
            <button
              onClick={fetchData}
              className="px-6 py-3 rounded-2xl text-white font-extrabold text-sm transition-all active:scale-95"
              style={{ background: 'linear-gradient(135deg, #F28500 0%, #D4700A 100%)' }}
            >
              Reintentar
            </button>
          </div>
        )}

        {!loading && !error && (
          mostrandoCombos
            ? <ComboList combos={combos} search={search} />
            : <ProductList productos={productos} categoriaId={activaCategoriaId} search={search} />
        )}
      </main>
    </div>
  )
}
