'use client'

import Link from 'next/link'
import { useSearchParams } from 'next/navigation'
import { Suspense, useState } from 'react'

function ConfirmacionContent() {
  const params = useSearchParams()
  const numeroOrden = params.get('orden')
  const total = params.get('total')
  const esGuest = params.get('guest') === 'true'

  const [copied, setCopied] = useState(false)

  return (
    <div className="min-h-screen bg-[var(--bg-primary)] flex flex-col items-center justify-center px-4">
      <div
        className="w-24 h-24 rounded-full flex items-center justify-center mb-6"
        style={{ background: 'var(--bg-secondary)' }}
      >
      </div>

      <h1 className="text-white font-display text-center mb-2" style={{ fontSize: '2.5rem' }}>
        ¡PEDIDO ENVIADO!
      </h1>

      {numeroOrden && (
        <p className="text-gray-400 text-sm font-bold mb-1">
          Número de orden:{' '}
          <span style={{ color: '#F28500' }}>
            {numeroOrden.replace(/ORD-\d{8}-/, 'ORD-')}
          </span>
        </p>
      )}

      {total && (
        <p className="text-gray-400 text-sm font-bold mb-6">
          Total: <span className="text-white">${parseFloat(total).toFixed(2)}</span>
        </p>
      )}

      <p className="text-gray-400 text-sm font-medium text-center mb-8">
        Tu pedido está siendo preparado
      </p>

      {/* ── Guest: save order number section ── */}
      {esGuest && numeroOrden ? (
        <div
          className="mt-4 rounded-2xl p-4 w-full max-w-xs mb-4"
          style={{ background: '#1A1A1A', border: '1px solid rgba(255,255,255,0.08)' }}
        >
          <p className="text-white font-extrabold text-sm mb-1 text-center">
            Guarda tu número de orden
          </p>
          <p
            className="font-display text-xl text-center mb-3"
            style={{ color: '#F28500' }}
          >
            {numeroOrden}
          </p>
          <p className="text-gray-400 text-xs text-center mb-3">
            Úsalo para consultar el estado de tu pedido en cualquier momento
          </p>
          <button
            onClick={() => {
              navigator.clipboard.writeText(numeroOrden ?? '')
              setCopied(true)
              setTimeout(() => setCopied(false), 2000)
            }}
            className="w-full py-2 rounded-xl text-white font-extrabold text-sm mb-2 transition-all active:scale-95"
            style={{ background: copied ? '#27AE60' : 'rgba(255,255,255,0.08)' }}
          >
            {copied ? '✓ Copiado' : 'Copiar número'}
          </button>
          <Link
            href={`/pedido/${numeroOrden}`}
            className="w-full py-2 rounded-xl text-white font-extrabold text-sm text-center block transition-all active:scale-95"
            style={{ background: 'linear-gradient(135deg, #F28500 0%, #D4700A 100%)' }}
          >
            Seguir mi pedido →
          </Link>
        </div>
      ) : (
        <div className="flex flex-col gap-3 w-full max-w-xs">
          <Link
            href="/mis-pedidos"
            className="w-full py-4 rounded-2xl text-white font-extrabold text-lg text-center transition-all active:scale-95 hover:opacity-90"
            style={{ background: 'linear-gradient(135deg, #F28500 0%, #D4700A 100%)' }}
          >
            Ver mis pedidos
          </Link>
          <Link
            href="/menu"
            className="w-full py-4 rounded-2xl font-extrabold text-lg text-center transition-all active:scale-95"
            style={{ background: 'rgba(255,255,255,0.08)', color: '#F28500' }}
          >
            Volver al Menú
          </Link>
        </div>
      )}

      {esGuest && (
        <div className="mt-4 flex flex-col gap-2 w-full max-w-xs">
          <Link
            href="/menu"
            className="w-full py-3 rounded-2xl font-extrabold text-sm text-center transition-all active:scale-95"
            style={{ background: 'rgba(255,255,255,0.08)', color: '#F28500' }}
          >
            Volver al Menú
          </Link>
        </div>
      )}
    </div>
  )
}

export default function ConfirmacionPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-[var(--bg-primary)]" />}>
      <ConfirmacionContent />
    </Suspense>
  )
}
