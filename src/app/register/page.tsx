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
      <circle cx="12" cy="12" r="10" stroke="rgba(255,255,255,0.3)" strokeWidth="3" />
      <path d="M12 2a10 10 0 0110 10" stroke="white" strokeWidth="3" strokeLinecap="round" />
    </svg>
  )
}

// ─── Password strength ────────────────────────────────────────────────────────
function getStrength(pwd: string): { score: number; label: string; color: string } {
  if (pwd.length === 0) return { score: 0, label: '', color: '' }
  let score = 0
  if (pwd.length >= 8)  score++
  if (pwd.length >= 12) score++
  if (/[A-Z]/.test(pwd) && /[a-z]/.test(pwd)) score++
  if (/\d/.test(pwd))   score++
  if (/[^A-Za-z0-9]/.test(pwd)) score++

  if (score <= 1) return { score: 1, label: 'Débil',   color: '#EF4444' }
  if (score === 2) return { score: 2, label: 'Regular', color: '#F59E0B' }
  if (score === 3) return { score: 3, label: 'Buena',   color: '#3B82F6' }
  return             { score: 4, label: 'Fuerte',  color: '#22C55E' }
}

function StrengthBar({ password }: { password: string }) {
  const { score, label, color } = getStrength(password)
  if (!password) return null
  return (
    <div className="mt-2">
      <div className="flex gap-1">
        {[1, 2, 3, 4].map((n) => (
          <div
            key={n}
            className="flex-1 h-1 rounded-full transition-all duration-300"
            style={{ background: n <= score ? color : 'rgba(255,255,255,0.1)' }}
          />
        ))}
      </div>
      <p className="text-xs mt-1 font-semibold transition-colors duration-300" style={{ color }}>
        {label}
      </p>
    </div>
  )
}

const isValidEmail = (v: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v)

export default function RegisterPage() {
  const router = useRouter()
  const [email, setEmail]       = useState('')
  const [password, setPassword] = useState('')
  const [showPwd, setShowPwd]   = useState(false)
  const [loading, setLoading]   = useState(false)
  const [success, setSuccess]   = useState(false)
  const [error, setError]       = useState('')
  const [shakeKey, setShakeKey] = useState(0)

  // field-level errors
  const [emailErr, setEmailErr] = useState('')
  const [pwdErr, setPwdErr]     = useState('')

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
    if (password.length < 8)  { setPwdErr('Mínimo 8 caracteres'); hasErr = true }
    if (hasErr) { setShakeKey((k) => k + 1); return }

    setLoading(true)
    try {
      await apiClient.post('/auth/register', { email, password, rol: 'cliente' })
      const loginRes = await apiClient.post('/auth/login', { email, password })
      const { accessToken, usuario } = loginRes.data
      localStorage.setItem('accessToken', accessToken)
      localStorage.setItem('usuario', JSON.stringify(usuario))
      setSuccess(true)
      setTimeout(() => router.push('/menu'), 900)
    } catch (err: any) {
      if (err?.response?.status === 409) {
        triggerShake('Ya existe una cuenta con ese correo.')
      } else {
        const msg =
          err?.response?.data?.message ||
          err?.response?.data?.error ||
          'No se pudo crear la cuenta. Intenta de nuevo.'
        triggerShake(String(msg))
      }
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-[var(--bg-primary)] flex flex-col items-center justify-center px-4 py-12">

      {/* Ambient glow */}
      <div
        aria-hidden
        className="pointer-events-none fixed inset-0"
        style={{
          background:
            'radial-gradient(ellipse 60% 40% at 50% 0%, rgba(242,133,0,0.08) 0%, transparent 70%)',
        }}
      />

      {/* Back link */}
      <div className="w-full max-w-sm mb-6">
        <Link
          href="/"
          className="inline-flex items-center gap-1.5 text-xs text-gray-500 hover:text-gray-300 transition-colors"
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
          background: '#131313',
          border: '1px solid rgba(255,255,255,0.07)',
          boxShadow: '0 24px 64px rgba(0,0,0,0.6), 0 0 0 1px rgba(255,255,255,0.03)',
        }}
      >
        {/* Top accent line */}
        <div
          className="absolute top-0 left-8 right-8 h-px"
          style={{ background: 'linear-gradient(90deg, transparent, rgba(242,133,0,0.5), transparent)' }}
        />

        {/* Header */}
        <div className="mb-7">
          <p className="text-xs uppercase tracking-[0.22em] font-bold" style={{ color: '#F28500' }}>
            Cuenta nueva
          </p>
          <h1 className="font-display text-4xl text-white mt-1">Crea tu cuenta</h1>
          <p className="text-gray-500 text-sm mt-2">Regístrate gratis para hacer pedidos.</p>
        </div>

        {/* Success overlay */}
        {success && (
          <div
            className="animate-success-pop absolute inset-0 z-10 flex flex-col items-center justify-center gap-3 rounded-3xl"
            style={{ background: '#131313' }}
          >
            <div
              className="w-16 h-16 rounded-full flex items-center justify-center"
              style={{ background: 'rgba(39,174,96,0.15)', border: '1px solid rgba(39,174,96,0.3)' }}
            >
              <svg width="30" height="30" viewBox="0 0 24 24" fill="none" stroke="#27AE60" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="20 6 9 17 4 12" />
              </svg>
            </div>
            <p className="text-white font-extrabold text-lg">Cuenta creada</p>
            <p className="text-gray-400 text-sm">Redirigiendo al menú...</p>
          </div>
        )}

        <form onSubmit={handleSubmit} className="flex flex-col gap-4" noValidate>
          {/* Email */}
          <div>
            <label className="block text-xs font-semibold text-gray-400 mb-1.5" htmlFor="email">
              Correo electrónico
            </label>
            <input
              id="email"
              type="email"
              autoComplete="email"
              value={email}
              onChange={(e) => { setEmail(e.target.value); setEmailErr('') }}
              placeholder="tunombre@correo.com"
              className="w-full rounded-xl px-4 py-3 text-sm text-white placeholder-gray-600 focus:outline-none transition-all duration-200"
              style={{
                background: '#0C0C0C',
                border: `1px solid ${emailErr ? 'rgba(231,76,60,0.6)' : 'rgba(255,255,255,0.1)'}`,
                boxShadow: emailErr ? '0 0 0 3px rgba(231,76,60,0.08)' : undefined,
              }}
            />
            {emailErr && (
              <p className="text-red-400 text-xs mt-1 font-medium">{emailErr}</p>
            )}
          </div>

          {/* Password */}
          <div>
            <label className="block text-xs font-semibold text-gray-400 mb-1.5" htmlFor="password">
              Contraseña
            </label>
            <div className="relative">
              <input
                id="password"
                type={showPwd ? 'text' : 'password'}
                autoComplete="new-password"
                value={password}
                onChange={(e) => { setPassword(e.target.value); setPwdErr('') }}
                placeholder="Mínimo 8 caracteres"
                className="w-full rounded-xl px-4 py-3 pr-11 text-sm text-white placeholder-gray-600 focus:outline-none transition-all duration-200"
                style={{
                  background: '#0C0C0C',
                  border: `1px solid ${pwdErr ? 'rgba(231,76,60,0.6)' : 'rgba(255,255,255,0.1)'}`,
                  boxShadow: pwdErr ? '0 0 0 3px rgba(231,76,60,0.08)' : undefined,
                }}
              />
              <button
                type="button"
                onClick={() => setShowPwd((v) => !v)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-300 transition-colors"
                aria-label={showPwd ? 'Ocultar contraseña' : 'Ver contraseña'}
              >
                <EyeIcon open={showPwd} />
              </button>
            </div>
            {pwdErr && <p className="text-red-400 text-xs mt-1 font-medium">{pwdErr}</p>}
            <StrengthBar password={password} />
          </div>

          {/* Error banner */}
          {error && (
            <div
              key={shakeKey}
              className="animate-shake flex items-center gap-2.5 rounded-xl px-4 py-3"
              style={{ background: 'rgba(231,76,60,0.1)', border: '1px solid rgba(231,76,60,0.25)' }}
            >
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#E74C3C" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="flex-shrink-0">
                <circle cx="12" cy="12" r="10" /><line x1="12" y1="8" x2="12" y2="12" /><line x1="12" y1="16" x2="12.01" y2="16" />
              </svg>
              <p className="text-red-400 text-xs font-semibold">{error}</p>
            </div>
          )}

          {/* Submit */}
          <button
            type="submit"
            disabled={loading || success}
            className="w-full py-3.5 rounded-xl font-extrabold text-sm text-white flex items-center justify-center gap-2 transition-all active:scale-[0.98] disabled:opacity-60"
            style={{
              background: 'linear-gradient(135deg, #F28500 0%, #D4700A 100%)',
              boxShadow: '0 4px 20px rgba(242,133,0,0.35)',
            }}
          >
            {loading ? <><Spinner /> Creando cuenta…</> : 'Crear cuenta gratis'}
          </button>
        </form>

        {/* Footer link */}
        <p className="mt-5 text-center text-xs text-gray-500">
          ¿Ya tienes cuenta?{' '}
          <Link href="/login" className="font-bold hover:text-orange-400 transition-colors" style={{ color: '#F28500' }}>
            Inicia sesión
          </Link>
        </p>
      </div>
    </div>
  )
}
