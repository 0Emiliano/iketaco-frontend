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
      <div className="min-h-screen bg-[#0A0A0A] animate-pulse">
        {/* Image placeholder */}
        <div className="w-full h-56" style={{ background: '#1A1A1A' }} />
        <div className="px-4 pt-6 pb-32 max-w-lg mx-auto">
          <div className="h-7 rounded-xl w-2/3 mb-3" style={{ background: '#2A2A2A' }} />
          <div className="h-4 rounded-lg w-full mb-2" style={{ background: '#222' }} />
          <div className="h-4 rounded-lg w-4/5" style={{ background: '#222' }} />
          <div className="h-9 rounded-xl w-1/3 mt-4" style={{ background: '#2A2A2A' }} />
        </div>
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
