import Link from 'next/link'
import { getPopularProducts } from '@/data/products'

const EMOJI_MAP: Record<string, string> = {
  'combo-ke-tacos': '🌮',
  'combo-queso': '🧀',
  'combo-dorado': '✨',
  'tacos-de-birria': '🔥',
  'quesbirrias': '🫓',
}

export default function PopularSection() {
  const popular = getPopularProducts()

  return (
    <section className="mt-6 animate-slide-up" style={{ animationDelay: '0.15s' }}>
      <div className="flex items-center justify-between mb-3">
        <h2
          className="text-white font-display tracking-wide"
          style={{ fontSize: '1.5rem' }}
        >
          Más Populares
        </h2>
        <Link
          href="/menu"
          className="text-xs font-extrabold uppercase tracking-widest transition-opacity hover:opacity-80"
          style={{ color: '#F28500' }}
        >
          Ver todos →
        </Link>
      </div>

      <div className="flex flex-col gap-3">
        {popular.map((product, i) => (
          <Link
            key={product.id}
            href={`/product/${product.slug}`}
            className="flex items-center gap-4 rounded-2xl p-3 transition-all duration-200 hover:scale-[1.01] active:scale-[0.98] group animate-slide-up"
            style={{
              background: '#1A1A1A',
              animationDelay: `${0.2 + i * 0.08}s`,
              boxShadow: '0 4px 24px rgba(0,0,0,0.4)',
              border: '1px solid rgba(255,255,255,0.04)',
            }}
          >
            {/* Image placeholder */}
            <div
              className="w-20 h-20 rounded-xl flex-shrink-0 flex items-center justify-center text-4xl relative overflow-hidden"
              style={{ background: product.imageGradient }}
            >
              <div
                className="absolute inset-0"
                style={{ background: 'linear-gradient(135deg, rgba(255,255,255,0.08) 0%, transparent 60%)' }}
              />
              <span className="relative z-10 select-none">
                {EMOJI_MAP[product.slug] ?? '🌮'}
              </span>
            </div>

            {/* Info */}
            <div className="flex-1 min-w-0">
              <h3 className="text-white font-extrabold text-base leading-tight">{product.name}</h3>
              <p className="text-gray-400 text-sm mt-0.5 leading-snug line-clamp-2 font-medium">
                {product.description}
              </p>
              <p className="font-display text-xl mt-1.5" style={{ color: '#F28500' }}>
                ${product.price}
              </p>
            </div>

            {/* Arrow */}
            <div className="text-gray-600 group-hover:text-[#F28500] transition-colors flex-shrink-0">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                <path d="M9 18l6-6-6-6" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </div>
          </Link>
        ))}
      </div>
    </section>
  )
}
