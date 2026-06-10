'use client'

import Link from 'next/link'
import { FormEvent, useState } from 'react'
import apiClient from '@/lib/api/client'

// ─── Spinner ──────────────────────────────────────────────────────────────────
function Spinner() {
  return (
    <svg className="animate-spin-smooth" width="18" height="18" viewBox="0 0 24 24" fill="none">
      <circle cx="12" cy="12" r="10" stroke="rgba(255,255,255,0.4)" strokeWidth="3" />
      <path d="M12 2a10 10 0 0110 10" stroke="white" strokeWidth="3" strokeLinecap="round" />
    </svg>
  )
}

export default function ForgotPasswordPage() {
  const [email, setEmail]     = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError]     = useState('')
  const [success, setSuccess] = useState(false)

  const isValidEmail = (value: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setError('')

    if (!isValidEmail(email)) {
      setError('Ingresa un correo electrónico válido.')
      return
    }

    setLoading(true)
    try {
      await apiClient.post('/auth/forgot-password', { email })
      setSuccess(true)
    } catch (err: any) {
      const serverMessage = err?.response?.data?.message || err?.response?.data?.error
      setError(serverMessage ?? 'No se pudo procesar la solicitud. Intenta de nuevo.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div
      className="min-h-screen flex flex-col items-center justify-center px-4 py-12"
      style={{ background: '#FBF9F6' }}
    >
      {/* Ambient warm glow */}
      <div
        aria-hidden
        className="pointer-events-none fixed inset-0"
        style={{
          background:
            'radial-gradient(ellipse 70% 40% at 50% 0%, rgba(242,133,0,0.06) 0%, transparent 70%)',
        }}
      />

      {/* Back link */}
      <div className="w-full max-w-sm mb-6">
        <Link
          href="/login"
          className="inline-flex items-center gap-1.5 text-xs font-semibold transition-colors"
          style={{ color: '#9C8E82' }}
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M19 12H5M5 12l7 7M5 12l7-7" />
          </svg>
          Volver a iniciar sesión
        </Link>
      </div>

      {/* Card */}
      <div
        className="w-full max-w-sm rounded-3xl p-7 relative overflow-hidden"
        style={{
          background: '#FFFFFF',
          border: '1px solid rgba(0,0,0,0.07)',
          boxShadow: '0 8px 40px rgba(0,0,0,0.08), 0 2px 8px rgba(0,0,0,0.04)',
        }}
      >
        {/* Top accent line */}
        <div
          className="absolute top-0 left-8 right-8 h-0.5 rounded-b-full"
          style={{ background: 'linear-gradient(90deg, transparent, #F28500, transparent)' }}
        />

        {/* Header */}
        <div className="mb-7">
          <p className="text-xs uppercase tracking-[0.22em] font-bold" style={{ color: '#F28500' }}>
            Cuenta
          </p>
          <h1 className="font-display text-4xl mt-1 leading-tight" style={{ color: '#1A1208' }}>
            ¿Olvidaste tu contraseña?
          </h1>
          <p className="text-sm mt-2" style={{ color: '#8C7B6E' }}>
            Ingresa tu correo y te enviaremos un enlace para restablecerla.
          </p>
        </div>

        {success ? (
          <div className="flex flex-col gap-4">
            <div
              className="rounded-2xl p-4"
              style={{ background: 'rgba(39,174,96,0.07)', border: '1px solid rgba(39,174,96,0.2)' }}
            >
              <div className="flex items-center gap-2 mb-1.5">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#27AE60" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="20 6 9 17 4 12" />
                </svg>
                <p className="text-sm font-extrabold" style={{ color: '#1E8449' }}>¡Correo enviado!</p>
              </div>
              <p className="text-xs leading-relaxed" style={{ color: '#2E7D32' }}>
                Si el correo existe en nuestro sistema, recibirás un enlace para restablecer tu contraseña. Revisa también tu carpeta de spam.
              </p>
            </div>
            <Link
              href="/login"
              className="w-full py-3.5 rounded-xl font-extrabold text-sm text-white text-center block transition-all active:scale-[0.98]"
              style={{
                background: 'linear-gradient(135deg, #F28500 0%, #D4700A 100%)',
                boxShadow: '0 4px 16px rgba(242,133,0,0.3)',
              }}
            >
              Volver a iniciar sesión
            </Link>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="flex flex-col gap-4" noValidate>
            <div>
              <label className="block text-xs font-semibold mb-1.5" style={{ color: '#6B5E52' }} htmlFor="email">
                Correo electrónico
              </label>
              <input
                id="email"
                value={email}
                onChange={(e) => { setEmail(e.target.value); setError('') }}
                type="email"
                required
                placeholder="tunombre@correo.com"
                className="w-full rounded-xl px-4 py-3 text-sm focus:outline-none transition-all duration-200"
                style={{
                  background: '#F7F4F1',
                  border: '1px solid rgba(0,0,0,0.1)',
                  color: '#1A1208',
                }}
                onFocus={(e) => {
                  e.currentTarget.style.border = '1px solid rgba(242,133,0,0.5)'
                  e.currentTarget.style.boxShadow = '0 0 0 3px rgba(242,133,0,0.1)'
                }}
                onBlur={(e) => {
                  e.currentTarget.style.border = '1px solid rgba(0,0,0,0.1)'
                  e.currentTarget.style.boxShadow = 'none'
                }}
              />
            </div>

            {error && (
              <div
                className="flex items-center gap-2.5 rounded-xl px-4 py-3"
                style={{ background: 'rgba(231,76,60,0.06)', border: '1px solid rgba(231,76,60,0.2)' }}
              >
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#E74C3C" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="flex-shrink-0">
                  <circle cx="12" cy="12" r="10" /><line x1="12" y1="8" x2="12" y2="12" /><line x1="12" y1="16" x2="12.01" y2="16" />
                </svg>
                <p className="text-xs font-semibold" style={{ color: '#C0392B' }}>{error}</p>
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3.5 rounded-xl font-extrabold text-sm text-white flex items-center justify-center gap-2 transition-all active:scale-[0.98] disabled:opacity-60"
              style={{
                background: 'linear-gradient(135deg, #F28500 0%, #D4700A 100%)',
                boxShadow: '0 4px 16px rgba(242,133,0,0.3)',
              }}
            >
              {loading ? <><Spinner /> Enviando...</> : 'Enviar enlace'}
            </button>
          </form>
        )}

        <p className="mt-5 text-center text-xs" style={{ color: '#9C8E82' }}>
          ¿Recordaste tu contraseña?{' '}
          <Link href="/login" className="font-bold" style={{ color: '#F28500' }}>
            Inicia sesión
          </Link>
        </p>
      </div>
    </div>
  )
}
