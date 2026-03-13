import { notFound } from 'next/navigation'
import type { Metadata } from 'next'
import NavComponent from '@/components/ui/NavComponent'
import ProductDetail from '@/components/product/ProductDetail'
import { getProductBySlug, PRODUCTS } from '@/data/products'

// ─── Static params (for SSG) ──────────────────────────────────────────────────
export async function generateStaticParams() {
  return PRODUCTS.map((p) => ({ slug: p.slug }))
}

// ─── Dynamic metadata ─────────────────────────────────────────────────────────
export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>
}): Promise<Metadata> {
  const { slug } = await params
  const product = getProductBySlug(slug)
  if (!product) return { title: 'Producto no encontrado' }
  return {
    title: `${product.name} – I KE TACOS`,
    description: product.description,
  }
}

// ─── Page ─────────────────────────────────────────────────────────────────────
export default async function ProductPage({
  params,
}: {
  params: Promise<{ slug: string }>
}) {
  const { slug } = await params
  const product = getProductBySlug(slug)

  if (!product) notFound()

  return (
    <div className="min-h-screen bg-[#0A0A0A]">
      {/* Transparent nav over hero */}
      <div className="relative z-50">
        <NavComponent />
      </div>

      {/* Push content below fixed nav */}
      <div className="pt-16">
        <ProductDetail product={product} />
      </div>
    </div>
  )
}
