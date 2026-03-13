'use client'

interface QuantitySelectorProps {
  quantity: number
  onDecrement: () => void
  onIncrement: () => void
  min?: number
}

export default function QuantitySelector({
  quantity,
  onDecrement,
  onIncrement,
  min = 1,
}: QuantitySelectorProps) {
  return (
    <div
      className="flex items-center justify-between p-1 rounded-2xl"
      style={{ background: '#1A1A1A', border: '1px solid rgba(255,255,255,0.06)' }}
    >
      {/* Minus */}
      <button
        onClick={onDecrement}
        disabled={quantity <= min}
        className="w-12 h-12 rounded-xl flex items-center justify-center text-white font-black text-2xl transition-all active:scale-90 disabled:opacity-30"
        style={{ background: quantity <= min ? '#2A2A2A' : 'linear-gradient(135deg, #F28500, #D4700A)' }}
        aria-label="Reducir cantidad"
      >
        −
      </button>

      {/* Count */}
      <span
        className="text-white font-display text-3xl tabular-nums"
        style={{ minWidth: '2.5rem', textAlign: 'center' }}
      >
        {quantity}
      </span>

      {/* Plus */}
      <button
        onClick={onIncrement}
        className="w-12 h-12 rounded-xl flex items-center justify-center text-white font-black text-2xl transition-all active:scale-90"
        style={{ background: 'linear-gradient(135deg, #F28500, #D4700A)' }}
        aria-label="Aumentar cantidad"
      >
        +
      </button>
    </div>
  )
}
