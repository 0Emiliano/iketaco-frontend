'use client'

import { useState, useEffect } from 'react'
import type { ToastEvent } from '@/lib/toast'

interface ToastItem extends ToastEvent {
  visible: boolean
}

const ICONS: Record<string, string> = {
  success: '✓',
  error: '✕',
  info: 'i',
}

const COLORS: Record<string, { bg: string; border: string; color: string }> = {
  success: { bg: 'rgba(39,174,96,0.15)', border: 'rgba(39,174,96,0.4)', color: '#27AE60' },
  error:   { bg: 'rgba(231,76,60,0.15)',  border: 'rgba(231,76,60,0.4)',  color: '#E74C3C' },
  info:    { bg: 'rgba(242,133,0,0.15)',  border: 'rgba(242,133,0,0.4)',  color: '#F28500' },
}

export default function Toaster() {
  const [toasts, setToasts] = useState<ToastItem[]>([])

  useEffect(() => {
    const handler = (e: Event) => {
      const { message, type, id } = (e as CustomEvent<ToastEvent>).detail
      setToasts((prev) => [...prev, { message, type, id, visible: true }])

      // Start fade-out after 2.5s
      setTimeout(() => {
        setToasts((prev) => prev.map((t) => (t.id === id ? { ...t, visible: false } : t)))
      }, 2500)

      // Remove from DOM after transition
      setTimeout(() => {
        setToasts((prev) => prev.filter((t) => t.id !== id))
      }, 3000)
    }

    window.addEventListener('app:toast', handler)
    return () => window.removeEventListener('app:toast', handler)
  }, [])

  if (toasts.length === 0) return null

  return (
    <div
      className="fixed top-20 left-0 right-0 z-[100] flex flex-col items-center gap-2 px-4 pointer-events-none"
      aria-live="polite"
      aria-atomic="false"
    >
      {toasts.map((t) => {
        const c = COLORS[t.type]
        return (
          <div
            key={t.id}
            role="status"
            className="flex items-center gap-3 px-4 py-3 rounded-2xl text-sm font-bold max-w-sm w-full transition-all duration-500"
            style={{
              background: c.bg,
              border: `1px solid ${c.border}`,
              color: c.color,
              backdropFilter: 'blur(12px)',
              opacity: t.visible ? 1 : 0,
              transform: t.visible ? 'translateY(0)' : 'translateY(-8px)',
              boxShadow: '0 4px 24px rgba(0,0,0,0.4)',
            }}
          >
            <span
              className="w-5 h-5 rounded-full flex items-center justify-center text-xs font-black flex-shrink-0"
              style={{ background: c.color, color: '#0A0A0A' }}
            >
              {ICONS[t.type]}
            </span>
            <span className="text-white font-semibold">{t.message}</span>
          </div>
        )
      })}
    </div>
  )
}
