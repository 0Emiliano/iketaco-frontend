'use client'

import { useState } from 'react'
import apiClient from '@/lib/api/client'

interface Props {
  ordenNumero: string
  total: string
  guestNombre: string
  onSkip: () => void
  onSuccess: () => void
}

export default function LazyRegistrationSheet({
  ordenNumero, total, guestNombre, onSkip, onSuccess,
}: Props) {
  const [email,    setEmail]    = useState('')
  const [password, setPassword] = useState('')
  const [loading,  setLoading]  = useState(false)
  const [error,    setError]    = useState('')

  const handleRegister = async () => {
    if (!email.trim() || password.length < 6) {
      setError('Ingresa un email válido y una contraseña de al menos 6 caracteres.')
      return
    }
    setError('')
    setLoading(true)
    try {
      const res = await apiClient.post('/auth/register', { email: email.trim(), password })
      const data = res.data
      if (data.accessToken) localStorage.setItem('accessToken', data.accessToken)
      if (data.usuario)     localStorage.setItem('usuario', JSON.stringify(data.usuario))
      onSuccess()
    } catch (err: any) {
      const msg = err?.response?.data?.error ?? err?.response?.data?.message
      setError(msg ?? 'No se pudo crear la cuenta. Intenta de nuevo.')
    } finally {
      setLoading(false)
    }
  }

  return (
    /* backdrop */
    <div
      className="fixed inset-0 z-50 flex items-end justify-center"
      style={{ background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(4px)' }}
    >
      {/* sheet */}
      <div
        className="w-full max-w-lg rounded-t-3xl px-5 pt-5 pb-10 flex flex-col gap-4"
        style={{ background: '#151515', border: '1px solid rgba(255,255,255,0.08)', animation: 'slideUp 0.25s ease both' }}
      >
        {/* handle */}
        <div className="w-10 h-1 rounded-full mx-auto" style={{ background: 'rgba(255,255,255,0.15)' }} />

        {/* order confirmation badge */}
        <div
          className="rounded-2xl px-4 py-3 flex items-center gap-3"
          style={{ background: 'rgba(39,174,96,0.1)', border: '1px solid rgba(39,174,96,0.3)' }}
        >
          <div
            className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 text-lg"
            style={{ background: 'rgba(39,174,96,0.2)' }}
          >
            ✓
          </div>
          <div>
            <p className="text-sm font-extrabold" style={{ color: '#27AE60' }}>
              Pedido registrado · {ordenNumero}
            </p>
            <p className="text-xs font-semibold mt-0.5" style={{ color: '#6FCF97' }}>
              Total: ${total}
            </p>
          </div>
        </div>

        {/* pitch */}
        <div>
          <h2 className="text-white font-extrabold text-lg leading-tight">
            {guestNombre ? `¡Listo, ${guestNombre.split(' ')[0]}!` : '¡Pedido enviado!'}
          </h2>
          <p className="text-gray-400 text-sm mt-1">
            Crea una cuenta para rastrear tus pedidos y guardar tu historial. Solo toma unos segundos.
          </p>
        </div>

        {/* fields */}
        <div className="flex flex-col gap-2.5">
          <div className="flex flex-col gap-1">
            <label className="text-xs font-semibold text-slate-300">Correo electrónico</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="tu@correo.com"
              className="w-full rounded-xl border bg-[var(--bg-primary)] px-3 py-2.5 text-sm text-white focus:outline-none transition"
              style={{ borderColor: 'rgba(255,255,255,0.15)' }}
              onFocus={(e)  => (e.currentTarget.style.borderColor = '#F28500')}
              onBlur={(e)   => (e.currentTarget.style.borderColor = 'rgba(255,255,255,0.15)')}
            />
          </div>
          <div className="flex flex-col gap-1">
            <label className="text-xs font-semibold text-slate-300">Contraseña</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Mínimo 6 caracteres"
              className="w-full rounded-xl border bg-[var(--bg-primary)] px-3 py-2.5 text-sm text-white focus:outline-none transition"
              style={{ borderColor: 'rgba(255,255,255,0.15)' }}
              onFocus={(e)  => (e.currentTarget.style.borderColor = '#F28500')}
              onBlur={(e)   => (e.currentTarget.style.borderColor = 'rgba(255,255,255,0.15)')}
            />
          </div>
        </div>

        {error && (
          <p className="text-xs text-red-400 font-semibold -mt-1">{error}</p>
        )}

        {/* actions */}
        <button
          onClick={handleRegister}
          disabled={loading}
          className="w-full py-3.5 rounded-2xl text-white font-extrabold text-sm transition-all active:scale-95 hover:opacity-90 disabled:opacity-50"
          style={{ background: 'linear-gradient(135deg, #F28500 0%, #D4700A 100%)', boxShadow: '0 4px 14px rgba(242,133,0,0.35)' }}
        >
          {loading ? 'Creando cuenta…' : 'Crear cuenta y guardar pedido'}
        </button>

        <button
          onClick={onSkip}
          className="w-full py-2.5 text-sm font-bold transition-opacity hover:opacity-70"
          style={{ color: '#6B7280' }}
        >
          Continuar sin cuenta
        </button>
      </div>

      <style>{`
        @keyframes slideUp {
          from { opacity: 0; transform: translateY(32px); }
          to   { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </div>
  )
}
