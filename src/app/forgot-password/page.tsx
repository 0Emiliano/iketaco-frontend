'use client'

import Link from 'next/link'
import { FormEvent, useState } from 'react'
import apiClient from '@/lib/api/client'

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
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
    <div className="min-h-screen bg-[#0A0A0A] text-white flex flex-col">
      <header className="px-4 py-4 border-b border-white/10">
        <div className="max-w-lg mx-auto">
          <Link href="/login" className="text-xs text-white/70 hover:text-white transition">
            ← Volver a iniciar sesión
          </Link>
        </div>
      </header>

      <main className="flex-1 px-4 py-8 max-w-lg mx-auto w-full">
        <div className="bg-[#131313] border border-white/10 rounded-3xl p-5 shadow-card">
          <div className="mb-6">
            <p className="text-xs uppercase tracking-[0.2em] text-orange-400 font-bold">Cuenta</p>
            <h1 className="text-3xl font-display mt-2 text-white">¿Olvidaste tu contraseña?</h1>
            <p className="mt-2 text-sm text-slate-300">
              Ingresa tu correo y te enviaremos un enlace para restablecerla.
            </p>
          </div>

          {success ? (
            <div className="space-y-4">
              <div
                className="rounded-2xl p-4"
                style={{ background: 'rgba(39,174,96,0.1)', border: '1px solid rgba(39,174,96,0.3)' }}
              >
                <p className="text-sm font-bold text-emerald-300 mb-1">¡Correo enviado!</p>
                <p className="text-xs text-emerald-200">
                  Si el correo existe en nuestro sistema, recibirás un enlace para restablecer tu contraseña.
                  Revisa también tu carpeta de spam.
                </p>
              </div>
              <Link
                href="/login"
                className="block w-full text-center rounded-xl bg-gradient-to-r from-[#F28500] via-[#E68510] to-[#D4700A] py-3 text-sm font-bold uppercase tracking-wide text-white shadow-btn transition hover:opacity-95"
              >
                Volver a iniciar sesión
              </Link>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1" htmlFor="email">
                  Correo electrónico
                </label>
                <input
                  id="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  type="email"
                  required
                  className="w-full rounded-xl border border-white/20 bg-[#0A0A0A] px-3 py-3 text-sm text-white focus:border-orange-500 focus:outline-none"
                  placeholder="tunombre@correo.com"
                />
              </div>

              {error && <p className="text-xs text-red-300">{error}</p>}

              <button
                type="submit"
                disabled={loading}
                className="w-full rounded-xl bg-gradient-to-r from-[#F28500] via-[#E68510] to-[#D4700A] py-3 text-sm font-bold uppercase tracking-wide text-white shadow-btn transition hover:opacity-95 disabled:opacity-50"
              >
                {loading ? 'Enviando...' : 'Enviar enlace'}
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
      </main>
    </div>
  )
}
