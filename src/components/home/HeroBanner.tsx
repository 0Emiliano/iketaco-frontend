import LogoIcon from '@/components/ui/LogoIcon'

export default function HeroBanner() {
  return (
    <div className="relative w-full overflow-hidden rounded-3xl shadow-2xl" style={{ minHeight: '260px' }}>
      {/* Rich dark-brown background */}
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

      {/* Floating orange blobs */}
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

      {/* Bottom gradient fade */}
      <div
        className="absolute inset-0"
        style={{
          background: 'linear-gradient(to bottom, rgba(0,0,0,0) 30%, rgba(0,0,0,0.75) 100%)',
        }}
      />

      {/* Content */}
      <div className="relative z-10 flex flex-col justify-between h-full p-5" style={{ minHeight: '260px' }}>
        {/* Top: Logo badge */}
        <div className="flex items-center gap-2.5 self-start">
          <div
            className="w-12 h-12 rounded-2xl flex items-center justify-center shadow-xl"
            style={{ background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(8px)' }}
          >
            <LogoIcon size={36} />
          </div>
          <div>
            <p
              className="text-white leading-none tracking-wider font-display"
              style={{ fontSize: '1.5rem' }}
            >
              I KE TACOS
            </p>
            <p className="text-xs font-extrabold tracking-widest uppercase" style={{ color: '#F28500' }}>
              BIRRIA · AUTHENTIC
            </p>
          </div>
        </div>

        {/* Bottom: Promo text */}
        <div className="flex flex-col gap-1 mt-auto">
          <span
            className="inline-block px-3 py-1 rounded-full text-xs font-extrabold uppercase tracking-widest self-start"
            style={{ background: 'rgba(242,133,0,0.25)', color: '#F9A825', border: '1px solid rgba(242,133,0,0.4)' }}
          >
            🔥 Promo del día
          </span>
          <h2
            className="text-white font-display leading-tight"
            style={{
              fontSize: 'clamp(2rem, 8vw, 2.75rem)',
              textShadow: '0 3px 16px rgba(0,0,0,0.8)',
            }}
          >
            3 TACOS + BEBIDA
          </h2>
          <p className="text-white/70 text-sm font-extrabold">
            ¡Disfruta la mejor birria!
          </p>
        </div>
      </div>
    </div>
  )
}
