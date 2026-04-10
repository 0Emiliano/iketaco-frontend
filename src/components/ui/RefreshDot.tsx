'use client'

import { useState, useEffect } from 'react'

interface RefreshDotProps {
  intervalMs: number // el mismo intervalo de polling de la página
}

export default function RefreshDot({ intervalMs }: RefreshDotProps) {
  const [progress, setProgress] = useState(0) // 0-100

  useEffect(() => {
    const start = Date.now()
    const tick = setInterval(() => {
      const elapsed = (Date.now() - start) % intervalMs
      setProgress(Math.round((elapsed / intervalMs) * 100))
    }, 500)
    return () => clearInterval(tick)
  }, [intervalMs])

  return (
    <div
      className="flex items-center gap-1.5"
      title={`Se actualiza cada ${intervalMs / 1000}s`}
    >
      <span className="text-gray-500 text-xs font-semibold">auto</span>
      <div className="w-12 h-1 rounded-full overflow-hidden" style={{ background: 'rgba(255,255,255,0.08)' }}>
        <div
          className="h-full rounded-full transition-all duration-500"
          style={{
            width: `${progress}%`,
            background: progress > 80 ? '#27AE60' : '#F28500',
          }}
        />
      </div>
    </div>
  )
}
