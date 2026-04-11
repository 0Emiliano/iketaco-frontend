'use client'

import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import { FormEvent, Suspense, useState } from 'react'
import apiClient from '@/lib/api/client'

function ResetPasswordForm() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const token = searchParams.get('token')

  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setError('')

    if (!token) {
      setError('El enlace de restablecimiento no es válido o ha expirado.')
      return
    }
    if (password.length < 6) {
      setError('La contraseña debe tener al menos 6 caracteres.')
      return
    }
    if (password !== confirmPassword) {
      setError('Las contraseñas no coinciden.')
      return
    }

    setLoading(true)
    try {
      await apiClient.post('/auth/reset-password', { token, password })
      setSuccess(true)
      setTimeout(() => router.push('/login'), 2500)
    } catch (err: any) {
      const serverMessage = err?.response?.data?.message || err?.response?.data?.error
      if (err?.response?.status === 400 || err?.response?.status === 401) {
        setError(serverMessage ?? 'El enlace no es válido o ha expirado. Solicita uno nuevo.')
      } else {
        setError(serverMessage ?? 'No se pudo restablecer la contraseña. Intenta de nuevo.')
      }
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="bg-[#131313] border border-white/10 rounded-3xl p-5 shadow-card">
      <div className="mb-6">
        <p className="text-xs uppercase tracking-[0.2em] text-orange-400 font-bold">Cuenta</p>
        <h1 className="text-3xl font-display mt-2 text-white">Nueva contraseña</h1>
        <p className="mt-2 text-sm text-slate-300">
          Elige una contraseña segura para tu cuenta.
        </p>
      </div>

      {!token ? (
        <div className="space-y-4">
          <div
            className="rounded-2xl p-4"
            style={{ background: 'rgba(231,76,60,0.1)', border: '1px solid rgba(231,76,60,0.3)' }}
          >
            <p className="text-sm font-bold text-red-300 mb-1">Enlace inválido</p>
            <p className="text-xs text-red-200">
              El enlace de restablecimiento no es válido o ha expirado.
              Solicita uno nuevo desde la página de recuperación.
            </p>
          </div>
          <Link
            href="/forgot-password"
            className="block w-full text-center rounded-xl bg-gradient-to-r from-[#F28500] via-[#E68510] to-[#D4700A] py-3 text-sm font-bold uppercase tracking-wide text-white shadow-btn transition hover:opacity-95"
          >
            Solicitar nuevo enlace
          </Link>
        </div>
      ) : success ? (
        <div className="space-y-4">
          <div
            className="rounded-2xl p-4"
            style={{ background: 'rgba(39,174,96,0.1)', border: '1px solid rgba(39,174,96,0.3)' }}
          >
            <p className="text-sm font-bold text-emerald-300 mb-1">¡Contraseña actualizada!</p>
            <p className="text-xs text-emerald-200">
              Tu contraseña fue restablecida correctamente. Redirigiendo al inicio de sesión...
            </p>
          </div>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1" htmlFor="password">
              Nueva contraseña
            </label>
            <input
              id="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              type={showPassword ? 'text' : 'password'}
              required
              className="w-full rounded-xl border border-white/20 bg-[#0A0A0A] px-3 py-3 text-sm text-white focus:border-orange-500 focus:outline-none"
              placeholder="Mínimo 6 caracteres"
            />
            <button
              type="button"
              onClick={() => setShowPassword((prev) => !prev)}
              className="mt-1 text-xs text-orange-300 hover:text-orange-100 font-semibold"
            >
              {showPassword ? 'Ocultar contraseña' : 'Ver contraseña'}
            </button>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1" htmlFor="confirmPassword">
              Confirmar contraseña
            </label>
            <input
              id="confirmPassword"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              type={showPassword ? 'text' : 'password'}
              required
              className="w-full rounded-xl border border-white/20 bg-[#0A0A0A] px-3 py-3 text-sm text-white focus:border-orange-500 focus:outline-none"
              placeholder="Repite tu contraseña"
            />
          </div>

          {error && <p className="text-xs text-red-300">{error}</p>}

          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-xl bg-gradient-to-r from-[#F28500] via-[#E68510] to-[#D4700A] py-3 text-sm font-bold uppercase tracking-wide text-white shadow-btn transition hover:opacity-95 disabled:opacity-50"
          >
            {loading ? 'Guardando...' : 'Restablecer contraseña'}
          </button>
        </form>
      )}

      <div className="mt-4 text-center text-xs text-slate-300">
        ¿Recordaste tu contraseña?{' '}
        <Link href="/login" className="text-orange-300 font-semibold hover:text-orange-100">
          Inicia sesión
        </Link>
      </div>
    </div>
  )
}

export default function ResetPasswordPage() {
  return (
    <div className="min-h-screen bg-[#0A0A0A] text-white flex flex-col">
      <header className="px-4 py-4 border-b border-white/10">
        <div className="max-w-lg mx-auto">
          <Link href="/login" className="text-xs text-white/70 hover:text-white transition">
            ← Volver a iniciar sesión
          </Link>
        </div>
      </header>

      <main className="flex-1 px-4 py-8 max-w-lg mx-auto w-full">
        <Suspense
          fallback={
            <div className="bg-[#131313] border border-white/10 rounded-3xl p-5">
              <div className="animate-pulse space-y-4">
                <div className="h-4 bg-white/10 rounded w-1/3" />
                <div className="h-8 bg-white/10 rounded w-2/3" />
                <div className="h-4 bg-white/10 rounded w-full" />
                <div className="h-12 bg-white/10 rounded-xl" />
                <div className="h-12 bg-white/10 rounded-xl" />
                <div className="h-12 bg-white/10 rounded-xl" />
              </div>
            </div>
          }
        >
          <ResetPasswordForm />
        </Suspense>
      </main>
    </div>
  )
}
