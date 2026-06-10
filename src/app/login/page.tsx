'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { FormEvent, useState } from 'react'
import apiClient from '@/lib/api/client'

// ─── Eye icon ─────────────────────────────────────────────────────────────────
function EyeIcon({ open }: { open: boolean }) {
  return open ? (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M17.94 17.94A10.07 10.07 0 0112 20c-7 0-11-8-11-8a18.45 18.45 0 015.06-5.94" />
      <path d="M9.9 4.24A9.12 9.12 0 0112 4c7 0 11 8 11 8a18.5 18.5 0 01-2.16 3.19" />
      <line x1="1" y1="1" x2="23" y2="23" />
    </svg>
  ) : (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
      <circle cx="12" cy="12" r="3" />
    </svg>
  )
}

// ─── Spinner ──────────────────────────────────────────────────────────────────
function Spinner() {
  return (
    <svg className="animate-spin-smooth" width="18" height="18" viewBox="0 0 24 24" fill="none">
      <circle cx="12" cy="12" r="10" stroke="rgba(255,255,255,0.4)" strokeWidth="3" />
      <path d="M12 2a10 10 0 0110 10" stroke="white" strokeWidth="3" strokeLinecap="round" />
    </svg>
  )
}

const REDIRECT: Record<string, string> = {
  gerente: '/admin', cajero: '/cajero', cocinero: '/cocina',
  mesero: '/mesero', repartidor: '/repartidor',
}

const isValidEmail = (v: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v)

export default function LoginPage() {
  const router = useRouter()
  const [email, setEmail]           = useState('')
  const [password, setPassword]     = useState('')
  const [showPwd, setShowPwd]       = useState(false)
  const [loading, setLoading]       = useState(false)
  const [success, setSuccess]       = useState(false)
  const [error, setError]           = useState('')
  const [shakeKey, setShakeKey]     = useState(0)

  const [emailErr, setEmailErr]     = useState('')
  const [pwdErr, setPwdErr]         = useState('')

  const triggerShake = (msg: string) => {
    setError(msg)
    setShakeKey((k) => k + 1)
  }

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    setError('')
    setEmailErr('')
    setPwdErr('')

    let hasErr = false
    if (!isValidEmail(email)) { setEmailErr('Correo inválido'); hasErr = true }
    if (password.length < 6)  { setPwdErr('Mínimo 6 caracteres'); hasErr = true }
    if (hasErr) { setShakeKey((k) => k + 1); return }

    setLoading(true)
    try {
      const { data } = await apiClient.post('/auth/login', { email, password })
      const { accessToken, usuario } = data
      localStorage.setItem('accessToken', accessToken)
      localStorage.setItem('usuario', JSON.stringify(usuario))
      setSuccess(true)
      setTimeout(() => router.push(REDIRECT[usuario.rol] ?? '/menu'), 900)
    } catch (err: any) {
      const msg =
        err?.response?.data?.message ||
        err?.response?.data?.error ||
        (err?.response?.status === 401
          ? 'Credenciales incorrectas.'
          : 'No se pudo iniciar sesión. Intenta de nuevo.')
      triggerShake(String(msg))
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
          href="/"
          className="inline-flex items-center gap-1.5 text-xs font-semibold transition-colors"
          style={{ color: '#9C8E82' }}
          onMouseEnter={(e) => (e.currentTarget.style.color = '#F28500')}
          onMouseLeave={(e) => (e.currentTarget.style.color = '#9C8E82')}
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M19 12H5M5 12l7 7M5 12l7-7" />
          </svg>
          Volver al inicio
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
            Bienvenido
          </p>
          <h1 className="font-display text-4xl mt-1" style={{ color: '#1A1208' }}>
            Inicia sesión
          </h1>
          <p className="text-sm mt-2" style={{ color: '#8C7B6E' }}>
            Accede a tu cuenta para continuar.
          </p>
        </div>

        {/* Success overlay */}
        {success && (
          <div
            className="animate-success-pop absolute inset-0 z-10 flex flex-col items-center justify-center gap-3 rounded-3xl"
            style={{ background: '#FFFFFF' }}
          >
            <div
              className="w-16 h-16 rounded-full flex items-center justify-center"
              style={{ background: 'rgba(39,174,96,0.1)', border: '1px solid rgba(39,174,96,0.25)' }}
            >
              <svg width="30" height="30" viewBox="0 0 24 24" fill="none" stroke="#27AE60" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="20 6 9 17 4 12" />
              </svg>
            </div>
            <p className="font-extrabold text-lg" style={{ color: '#1A1208' }}>Sesión iniciada</p>
            <p className="text-sm" style={{ color: '#8C7B6E' }}>Redirigiendo...</p>
          </div>
        )}

        <form onSubmit={handleSubmit} className="flex flex-col gap-4" noValidate>
          {/* Email */}
          <div>
            <label className="block text-xs font-semibold mb-1.5" style={{ color: '#6B5E52' }} htmlFor="email">
              Correo electrónico
            </label>
            <input
              id="email"
              type="email"
              autoComplete="email"
              value={email}
              onChange={(e) => { setEmail(e.target.value); setEmailErr('') }}
              placeholder="tunombre@correo.com"
              className="w-full rounded-xl px-4 py-3 text-sm focus:outline-none transition-all duration-200"
              style={{
                background: emailErr ? '#FFF5F5' : '#F7F4F1',
                border: `1px solid ${emailErr ? 'rgba(231,76,60,0.4)' : 'rgba(0,0,0,0.1)'}`,
                color: '#1A1208',
                boxShadow: emailErr ? '0 0 0 3px rgba(231,76,60,0.06)' : undefined,
              }}
              onFocus={(e) => {
                if (!emailErr) e.currentTarget.style.border = '1px solid rgba(242,133,0,0.5)'
                e.currentTarget.style.boxShadow = emailErr ? '0 0 0 3px rgba(231,76,60,0.06)' : '0 0 0 3px rgba(242,133,0,0.1)'
              }}
              onBlur={(e) => {
                e.currentTarget.style.border = `1px solid ${emailErr ? 'rgba(231,76,60,0.4)' : 'rgba(0,0,0,0.1)'}`
                e.currentTarget.style.boxShadow = emailErr ? '0 0 0 3px rgba(231,76,60,0.06)' : 'none'
              }}
            />
            {emailErr && <p className="text-red-500 text-xs mt-1 font-medium">{emailErr}</p>}
          </div>

          {/* Password */}
          <div>
            <label className="block text-xs font-semibold mb-1.5" style={{ color: '#6B5E52' }} htmlFor="password">
              Contraseña
            </label>
            <div className="relative">
              <input
                id="password"
                type={showPwd ? 'text' : 'password'}
                autoComplete="current-password"
                value={password}
                onChange={(e) => { setPassword(e.target.value); setPwdErr('') }}
                placeholder="••••••••"
                className="w-full rounded-xl px-4 py-3 pr-11 text-sm focus:outline-none transition-all duration-200"
                style={{
                  background: pwdErr ? '#FFF5F5' : '#F7F4F1',
                  border: `1px solid ${pwdErr ? 'rgba(231,76,60,0.4)' : 'rgba(0,0,0,0.1)'}`,
                  color: '#1A1208',
                  boxShadow: pwdErr ? '0 0 0 3px rgba(231,76,60,0.06)' : undefined,
                }}
                onFocus={(e) => {
                  if (!pwdErr) e.currentTarget.style.border = '1px solid rgba(242,133,0,0.5)'
                  e.currentTarget.style.boxShadow = pwdErr ? '0 0 0 3px rgba(231,76,60,0.06)' : '0 0 0 3px rgba(242,133,0,0.1)'
                }}
                onBlur={(e) => {
                  e.currentTarget.style.border = `1px solid ${pwdErr ? 'rgba(231,76,60,0.4)' : 'rgba(0,0,0,0.1)'}`
                  e.currentTarget.style.boxShadow = pwdErr ? '0 0 0 3px rgba(231,76,60,0.06)' : 'none'
                }}
              />
              <button
                type="button"
                onClick={() => setShowPwd((v) => !v)}
                className="absolute right-3 top-1/2 -translate-y-1/2 transition-colors"
                style={{ color: '#9C8E82' }}
                aria-label={showPwd ? 'Ocultar contraseña' : 'Ver contraseña'}
              >
                <EyeIcon open={showPwd} />
              </button>
            </div>
            {pwdErr && <p className="text-red-500 text-xs mt-1 font-medium">{pwdErr}</p>}
            <div className="mt-1.5 text-right">
              <Link
                href="/forgot-password"
                className="text-xs font-semibold transition-colors"
                style={{ color: '#9C8E82' }}
              >
                ¿Olvidaste tu contraseña?
              </Link>
            </div>
          </div>

          {/* Error banner */}
          {error && (
            <div
              key={shakeKey}
              className="animate-shake flex items-center gap-2.5 rounded-xl px-4 py-3"
              style={{ background: 'rgba(231,76,60,0.06)', border: '1px solid rgba(231,76,60,0.2)' }}
            >
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#E74C3C" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="flex-shrink-0">
                <circle cx="12" cy="12" r="10" /><line x1="12" y1="8" x2="12" y2="12" /><line x1="12" y1="16" x2="12.01" y2="16" />
              </svg>
              <p className="text-xs font-semibold" style={{ color: '#C0392B' }}>{error}</p>
            </div>
          )}

          {/* Submit */}
          <button
            type="submit"
            disabled={loading || success}
            className="w-full py-3.5 rounded-xl font-extrabold text-sm text-white flex items-center justify-center gap-2 transition-all active:scale-[0.98] disabled:opacity-60"
            style={{
              background: 'linear-gradient(135deg, #F28500 0%, #D4700A 100%)',
              boxShadow: '0 4px 16px rgba(242,133,0,0.3)',
            }}
          >
            {loading ? <><Spinner /> Iniciando sesión…</> : 'Iniciar sesión'}
          </button>
        </form>

        {/* Footer link */}
        <p className="mt-5 text-center text-xs" style={{ color: '#9C8E82' }}>
          ¿Aún no tienes cuenta?{' '}
          <Link href="/register" className="font-bold transition-colors" style={{ color: '#F28500' }}>
            Regístrate gratis
          </Link>
        </p>
      </div>
    </div>
  )
}
