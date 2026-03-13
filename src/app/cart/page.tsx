'use client'

import Link from 'next/link'
import NavComponent from '@/components/ui/NavComponent'
import CartItemComponent from '@/components/cart/CartItem'
import OrderSummary from '@/components/cart/OrderSummary'
import { useCart } from '@/context/CartContext'

export default function CartPage() {
  const { state } = useCart()
  const isEmpty = state.items.length === 0

  return (
    <div className="min-h-screen bg-[#0A0A0A]">
      <NavComponent title="Tu Pedido" />

      <main className="px-4 pt-20 pb-36 max-w-lg mx-auto w-full">
        {isEmpty ? (
          /* Empty state */
          <div className="flex flex-col items-center justify-center min-h-[60vh] text-center animate-fade-in">
            <div
              className="w-24 h-24 rounded-full flex items-center justify-center mb-5 text-5xl"
              style={{ background: '#1A1A1A', border: '1px solid rgba(255,255,255,0.06)' }}
            >
              🛒
            </div>
            <h2
              className="text-white font-display mb-2"
              style={{ fontSize: '2rem' }}
            >
              CARRITO VACÍO
            </h2>
            <p className="text-gray-400 font-medium mb-8">Agrega algo delicioso del menú 🌮</p>
            <Link
              href="/menu"
              className="px-8 py-4 rounded-2xl text-white font-extrabold text-lg shadow-btn transition-all active:scale-95 hover:opacity-90"
              style={{ background: 'linear-gradient(135deg, #F28500 0%, #D4700A 100%)' }}
            >
              Ver Menú
            </Link>
          </div>
        ) : (
          <div className="animate-fade-in">
            {/* Section title */}
            <h1
              className="text-white font-display mt-2 mb-4"
              style={{ fontSize: '1.75rem' }}
            >
              Mi Pedido
            </h1>

            {/* Cart items */}
            <div className="flex flex-col gap-3">
              {state.items.map((item, index) => (
                <div key={item.product.id} style={{ animationDelay: `${index * 0.07}s` }}>
                  <CartItemComponent item={item} />
                </div>
              ))}
            </div>

            {/* Order summary + CTA */}
            <OrderSummary />
          </div>
        )}
      </main>
    </div>
  )
}
