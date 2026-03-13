import Link from 'next/link'
import type { Product } from '@/types'

const EMOJI_MAP: Record<string, string> = {
  'combo-ke-tacos': '🌮',
  'combo-queso': '🧀',
  'combo-dorado': '✨',
  'tacos-de-birria': '🔥',
  'quesbirrias': '🫓',
}

interface ProductCardProps {
  product: Product
  index?: number
}

export default function ProductCard({ product, index = 0 }: ProductCardProps) {
  return (
    <Link
      href={`/product/${product.slug}`}
      className="flex items-center gap-4 rounded-2xl p-3 transition-all duration-200 hover:scale-[1.01] active:scale-[0.98] group animate-slide-up"
      style={{
        background: '#1A1A1A',
        animationDelay: `${index * 0.07}s`,
        boxShadow: '0 4px 24px rgba(0,0,0,0.3)',
        border: '1px solid rgba(255,255,255,0.04)',
      }}
    >
      {/* Image / emoji placeholder */}
      <div
        className="w-24 h-24 rounded-xl flex-shrink-0 overflow-hidden relative flex items-center justify-center text-4xl shadow-md"
        style={{ background: product.imageGradient }}
      >
        <div
          className="absolute inset-0"
          style={{ background: 'linear-gradient(135deg, rgba(255,255,255,0.1) 0%, transparent 60%)' }}
        />
        <span className="relative z-10 select-none">
          {EMOJI_MAP[product.slug] ?? '🌮'}
        </span>
        {product.popular && (
          <span
            className="absolute top-1.5 left-1.5 text-xs font-black px-1.5 py-0.5 rounded-md"
            style={{ background: '#F28500', color: 'white', fontSize: '9px', letterSpacing: '0.05em' }}
          >
            POPULAR
          </span>
        )}
      </div>

      {/* Info */}
      <div className="flex-1 min-w-0">
        <h3 className="text-white font-extrabold text-base leading-tight">{product.name}</h3>
        <p className="text-gray-400 text-sm mt-1 leading-snug line-clamp-2 font-medium">
          {product.description}
        </p>
        <p className="font-display text-xl mt-2" style={{ color: '#F28500' }}>
          ${product.price}
        </p>
      </div>

      {/* Arrow */}
      <div className="text-gray-600 group-hover:text-[#F28500] transition-colors flex-shrink-0 pr-1">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
          <path d="M9 18l6-6-6-6" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </div>
    </Link>
  )
}
