'use client'

import Link from 'next/link'
import { useSearchParams } from 'next/navigation'
import { Suspense } from 'react'

function ConfirmacionContent() {
  const params = useSearchParams()
  const orden = params.get('orden')
  const total = params.get('total')

  return (
    <div className="min-h-screen bg-[#0A0A0A] flex flex-col items-center justify-center px-4">
      <div
        className="w-24 h-24 rounded-full flex items-center justify-center text-5xl mb-6"
        style={{ background: '#1A1A1A' }}
      >
        ✅
      </div>

      <h1 className="text-white font-display text-center mb-2" style={{ fontSize: '2.5rem' }}>
        ¡PEDIDO ENVIADO!
      </h1>

      {orden && (
        <p className="text-gray-400 text-sm font-bold mb-1">
          Número de orden:{' '}
          <span style={{ color: '#F28500' }}>
            {orden ? orden.replace(/ORD-\d{8}-/, 'ORD-') : ''}
          </span>
        </p>
      )}

      {total && (
        <p className="text-gray-400 text-sm font-bold mb-6">
          Total: <span className="text-white">${parseFloat(total).toFixed(2)}</span>
        </p>
      )}

      <p className="text-gray-400 text-sm font-medium text-center mb-8">
        Tu pedido está siendo preparado 🌮
      </p>

      <Link
        href="/menu"
        className="px-8 py-4 rounded-2xl text-white font-extrabold text-lg transition-all active:scale-95 hover:opacity-90"
        style={{ background: 'linear-gradient(135deg, #F28500 0%, #D4700A 100%)' }}
      >
        Volver al Menú
      </Link>
    </div>
  )
}

export default function ConfirmacionPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-[#0A0A0A]" />}>
      <ConfirmacionContent />
    </Suspense>
  )
}
