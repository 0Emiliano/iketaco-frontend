'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { FormEvent, useState } from 'react'
import apiClient from '@/lib/api/client'

export default function RegisterPage() {
  const router = useRouter()
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [successMessage, setSuccessMessage] = useState('')

  const isValidEmail = (value: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setError('')
    setSuccessMessage('')

    if (!name.trim()) {
      setError('Ingresa tu nombre. No puede estar vacío.')
      return
    }
    if (!isValidEmail(email)) {
      setError('Ingresa un correo electrónico válido.')
      return
    }
    if (password.length < 8) {
      setError('La contraseña debe tener al menos 8 caracteres.')
      return
    }

    setLoading(true)

    try {
      await apiClient.post('/auth/register', {
        email,
        password,
        rol: 'cliente',
      })

      setSuccessMessage('Registro exitoso. Redirigiendo a iniciar sesión...')
      setTimeout(() => {
        router.push('/login')
      }, 700)
    } catch (err: any) {
      console.error(err)
      const serverMessage = err?.response?.data?.message || err?.response?.data?.error
      if (serverMessage) {
        setError(String(serverMessage))
      } else if (err?.response?.status === 401) {
        setError('No autorizado. Revisa tus datos o usa otro correo.')
      } else {
        setError('No se pudo crear la cuenta. Intenta de nuevo con datos válidos.')
      }
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-[#0A0A0A] text-white flex flex-col">
      <header className="px-4 py-4 border-b border-white/10">
        <div className="max-w-lg mx-auto">
          <Link href="/" className="text-xs text-white/70 hover:text-white transition">
            ← Volver a inicio
          </Link>
        </div>
      </header>

      <main className="flex-1 px-4 py-8 max-w-lg mx-auto w-full">
        <div className="bg-[#131313] border border-white/10 rounded-3xl p-5 shadow-card">
          <div className="mb-6">
            <p className="text-xs uppercase tracking-[0.2em] text-orange-400 font-bold">Cuenta</p>
            <h1 className="text-3xl font-display mt-2 text-white">Regístrate</h1>
            <p className="mt-2 text-sm text-slate-300">
              Crea tu cuenta para hacer pedidos y ver el historial.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1" htmlFor="name">
                Nombre
              </label>
              <input
                id="name"
                value={name}
                onChange={(event) => setName(event.target.value)}
                type="text"
                required
                className="w-full rounded-xl border border-white/20 bg-[#0A0A0A] px-3 py-3 text-sm text-white focus:border-orange-500 focus:outline-none"
                placeholder="Tu nombre"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1" htmlFor="email">
                Correo electrónico
              </label>
              <input
                id="email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                type="email"
                required
                className="w-full rounded-xl border border-white/20 bg-[#0A0A0A] px-3 py-3 text-sm text-white focus:border-orange-500 focus:outline-none"
                placeholder="tunombre@correo.com"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1" htmlFor="password">
                Contraseña
              </label>
              <input
                id="password"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                type={showPassword ? 'text' : 'password'}
                required
                minLength={8}
                className="w-full rounded-xl border border-white/20 bg-[#0A0A0A] px-3 py-3 text-sm text-white focus:border-orange-500 focus:outline-none"
                placeholder="Mínimo 8 caracteres"
              />
              <button
                type="button"
                onClick={() => setShowPassword((prev) => !prev)}
                className="mt-1 text-xs text-orange-300 hover:text-orange-100 font-semibold"
              >
                {showPassword ? 'Ocultar contraseña' : 'Ver contraseña'}
              </button>
            </div>

            {error && <p className="text-xs text-red-300">{error}</p>}
            {successMessage && <p className="text-xs text-emerald-300">{successMessage}</p>}

            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-xl bg-gradient-to-r from-[#F28500] via-[#E68510] to-[#D4700A] py-3 text-sm font-bold uppercase tracking-wide text-white shadow-btn transition hover:opacity-95 disabled:opacity-50"
            >
              {loading ? 'Registrando...' : 'Crear cuenta'}
            </button>
          </form>

          <div className="mt-4 text-center text-xs text-slate-300">
            ¿Ya tienes cuenta?{' '}
            <Link href="/login" className="text-orange-300 font-semibold hover:text-orange-100">
              Inicia sesión
            </Link>
          </div>
        </div>

        <div className="mt-4 text-center text-slate-300 text-xs">
          <p className="text-white/70">Registro de usuairos nuevos.</p>
        </div>
      </main>
    </div>
  )
}
