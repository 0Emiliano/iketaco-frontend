import Link from 'next/link'
import NavComponent from '@/components/ui/NavComponent'

export default function ConfirmacionPage() {
  return (
    <div className="min-h-screen bg-[#0A0A0A] flex flex-col">
      <NavComponent />

      <main className="flex-1 flex flex-col items-center justify-center px-6 pt-20 pb-24 max-w-lg mx-auto w-full text-center">
        {/* Success circle */}
        <div
          className="w-28 h-28 rounded-full flex items-center justify-center mb-6 animate-scale-in"
          style={{
            background: 'linear-gradient(135deg, #F28500, #D4700A)',
            boxShadow: '0 0 60px rgba(242,133,0,0.35)',
          }}
        >
          <svg width="56" height="56" viewBox="0 0 24 24" fill="none">
            <path
              d="M5 13l4 4L19 7"
              stroke="white"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </div>

        {/* Title */}
        <h1
          className="text-white font-display mb-3 animate-slide-up"
          style={{ fontSize: '2.5rem', animationDelay: '0.1s' }}
        >
          ¡PEDIDO REALIZADO!
        </h1>

        {/* Message */}
        <p className="text-gray-400 text-base font-medium leading-relaxed mb-2 animate-slide-up" style={{ animationDelay: '0.2s' }}>
          Tu pedido está siendo preparado con el mejor sabor de birria. 🌮
        </p>
        <p className="text-gray-500 text-sm font-medium animate-slide-up" style={{ animationDelay: '0.25s' }}>
          Te avisaremos cuando esté listo.
        </p>

        {/* Estimated time pill */}
        <div
          className="flex items-center gap-2 px-5 py-3 rounded-full mt-6 mb-8 animate-slide-up"
          style={{
            background: 'rgba(242,133,0,0.12)',
            border: '1px solid rgba(242,133,0,0.3)',
            animationDelay: '0.3s',
          }}
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
            <circle cx="12" cy="12" r="10" stroke="#F28500" strokeWidth="2" />
            <path d="M12 6v6l4 2" stroke="#F28500" strokeWidth="2" strokeLinecap="round" />
          </svg>
          <span className="text-sm font-bold" style={{ color: '#F28500' }}>
            Tiempo estimado: 15–20 min
          </span>
        </div>

        {/* Back to home CTA */}
        <div className="w-full animate-slide-up" style={{ animationDelay: '0.35s' }}>
          <Link
            href="/"
            className="flex items-center justify-center gap-2 w-full py-5 rounded-2xl text-white font-extrabold text-lg transition-all active:scale-95 hover:opacity-90"
            style={{
              background: 'linear-gradient(135deg, #F28500 0%, #D4700A 100%)',
              boxShadow: '0 4px 20px rgba(242,133,0,0.4)',
            }}
          >
            Volver al Inicio
          </Link>

          <Link
            href="/menu"
            className="block mt-3 py-4 rounded-2xl text-center font-extrabold text-base transition-all active:scale-95"
            style={{
              background: '#1A1A1A',
              color: '#9CA3AF',
              border: '1px solid rgba(255,255,255,0.06)',
            }}
          >
            Hacer otro pedido
          </Link>
        </div>
      </main>
    </div>
  )
}
