import Link from 'next/link'

export default function NotFound() {
  return (
    <div className="min-h-screen bg-[#0A0A0A] flex flex-col items-center justify-center px-6 text-center">
      <p
        className="text-[#F28500] text-9xl font-black leading-none"
        style={{ fontFamily: 'Impact, "Arial Black", sans-serif' }}
      >
        404
      </p>
      <h1 className="text-white text-2xl font-black mt-4 mb-2">Página no encontrada</h1>
      <p className="text-gray-400 mb-8">Esta página no existe o fue movida.</p>
      <Link
        href="/"
        className="px-8 py-4 rounded-full text-white font-black text-lg shadow-btn"
        style={{ background: 'linear-gradient(135deg, #F28500 0%, #D4700A 100%)' }}
      >
        Ir al Inicio
      </Link>
    </div>
  )
}
