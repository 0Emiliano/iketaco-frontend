import Link from 'next/link'
import NavComponent from '@/components/ui/NavComponent'
import HeroBanner from '@/components/home/HeroBanner'
import PopularSection from '@/components/home/PopularSection'

export default function HomePage() {
  return (
    <div className="min-h-screen bg-[#0A0A0A] flex flex-col">
      <NavComponent />

      <main className="flex-1 flex flex-col px-4 pt-20 pb-24 max-w-lg mx-auto w-full">
        <div className="animate-fade-in">
          <HeroBanner />
        </div>

        <PopularSection />

        <div className="mt-6 animate-slide-up" style={{ animationDelay: '0.4s' }}>
          <Link
            href="/menu"
            className="flex items-center justify-center gap-2 w-full py-5 rounded-2xl text-white font-extrabold text-lg shadow-btn transition-all active:scale-95 hover:opacity-90"
            style={{
              background: 'linear-gradient(135deg, #F28500 0%, #D4700A 100%)',
              letterSpacing: '0.02em',
            }}
          >
            <span>Ver Menú Completo</span>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
              <path
                d="M5 12h14M12 5l7 7-7 7"
                stroke="currentColor"
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </Link>
        </div>
      </main>
    </div>
  )
}
