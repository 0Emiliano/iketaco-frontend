import { getPromociones, getBannerConfig } from '@/data/products'
import type { Promocion } from '@/types'

export default async function HeroBanner() {
  let promo: Promocion | null = null
  let imagenUrl: string | null = null
  let defaultTitulo = '3 TACOS + BEBIDA'
  let defaultSubtitulo = '¡Disfruta la mejor birria!'
  let defaultBadge = 'Bienvenido'

  try {
    const [promos, config] = await Promise.all([getPromociones(), getBannerConfig()])
    promo = promos[0] ?? null
    if (config) {
      imagenUrl = config.imagenUrl
      if (config.titulo) defaultTitulo = config.titulo
      if (config.subtitulo) defaultSubtitulo = config.subtitulo
      if (config.badge) defaultBadge = config.badge
      if (config.featuredPromoId != null) {
        promo = promos.find((p) => p.id === config.featuredPromoId) ?? promo
      }
    }
  } catch {
    // fallback to defaults on any error
  }

  const titulo = promo ? promo.nombre.toUpperCase() : defaultTitulo
  const subtitulo = promo?.descripcion ?? defaultSubtitulo
  const badge = promo ? 'Promo del día' : defaultBadge
  const precio = promo?.combos?.precio

  return (
    <div className="relative w-full overflow-hidden rounded-3xl shadow-2xl" style={{ minHeight: '260px' }}>
      {/* Background: custom image or gradient */}
      {imagenUrl ? (
        <>
          <div
            className="absolute inset-0 bg-cover bg-center"
            style={{ backgroundImage: `url(${imagenUrl})` }}
          />
          <div
            className="absolute inset-0"
            style={{ background: 'linear-gradient(165deg, rgba(58,24,0,0.72) 0%, rgba(18,8,0,0.85) 100%)' }}
          />
        </>
      ) : (
        <>
          <div
            className="absolute inset-0"
            style={{
              background: `
                radial-gradient(ellipse at 20% 35%, #9B4F00 0%, transparent 55%),
                radial-gradient(ellipse at 75% 65%, #6B3000 0%, transparent 50%),
                radial-gradient(ellipse at 55% 10%, #C06500 0%, transparent 45%),
                linear-gradient(165deg, #3A1800 0%, #120800 100%)
              `,
            }}
          />
          {[
            { size: 80, x: 65, y: 20, blur: 30, opacity: 0.18 },
            { size: 50, x: 80, y: 55, blur: 20, opacity: 0.12 },
            { size: 100, x: 5, y: 60, blur: 40, opacity: 0.15 },
            { size: 40, x: 45, y: 75, blur: 15, opacity: 0.10 },
          ].map((blob, i) => (
            <div
              key={i}
              className="absolute rounded-full"
              style={{
                width: blob.size,
                height: blob.size,
                background: '#F28500',
                left: `${blob.x}%`,
                top: `${blob.y}%`,
                filter: `blur(${blob.blur}px)`,
                opacity: blob.opacity,
              }}
            />
          ))}
        </>
      )}

      {/* Bottom gradient fade */}
      <div
        className="absolute inset-0"
        style={{
          background: 'linear-gradient(to bottom, rgba(0,0,0,0) 30%, rgba(0,0,0,0.75) 100%)',
        }}
      />

      {/* Content */}
      <div className="relative z-10 flex flex-col justify-between h-full p-5" style={{ minHeight: '260px' }}>
        {/* Bottom: Promo text */}
        <div className="flex flex-col gap-1 mt-auto">
          <div className="flex items-center gap-2 flex-wrap">
            <span
              className="inline-block px-3 py-1 rounded-full text-xs font-extrabold uppercase tracking-widest"
              style={{ background: 'rgba(242,133,0,0.25)', color: '#F9A825', border: '1px solid rgba(242,133,0,0.4)' }}
            >
              {badge}
            </span>
            {precio && (
              <span
                className="inline-block px-3 py-1 rounded-full text-xs font-extrabold"
                style={{ background: 'rgba(39,174,96,0.2)', color: '#27AE60', border: '1px solid rgba(39,174,96,0.4)' }}
              >
                ${parseFloat(precio).toFixed(2)}
              </span>
            )}
          </div>

          <h2
            className="text-white font-display leading-tight"
            style={{
              fontSize: 'clamp(2rem, 8vw, 2.75rem)',
              textShadow: '0 3px 16px rgba(0,0,0,0.8)',
            }}
          >
            {titulo}
          </h2>

          <p className="text-white/70 text-sm font-extrabold">{subtitulo}</p>
        </div>
      </div>
    </div>
  )
}
