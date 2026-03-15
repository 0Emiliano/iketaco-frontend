'use client'

import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import { notFound } from 'next/navigation'
import NavComponent from '@/components/ui/NavComponent'
import ProductDetail from '@/components/product/ProductDetail'
import { getProductoById } from '@/data/products'
import type { Producto } from '@/types'

export default function ProductPage() {
  const params = useParams()
  const id = parseInt(params['slug'] as string)
  const [producto, setProducto] = useState<Producto | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (isNaN(id)) {
      setLoading(false)
      return
    }
    getProductoById(id)
      .then(setProducto)
      .catch(() => setProducto(null))
      .finally(() => setLoading(false))
  }, [id])

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0A0A0A] flex items-center justify-center">
        <p className="text-gray-400">Cargando...</p>
      </div>
    )
  }

  if (!producto) return notFound()

  return (
    <div className="min-h-screen bg-[#0A0A0A]">
      <div className="relative z-50">
        <NavComponent />
      </div>
      <div className="pt-16">
        <ProductDetail producto={producto} />
      </div>
    </div>
  )
}
