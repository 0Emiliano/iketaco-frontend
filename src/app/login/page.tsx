'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { FormEvent, useState } from 'react'
import apiClient from '@/lib/api/client'

export default function LoginPage() {
  const router = useRouter()
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

    if (!isValidEmail(email)) {
      setError('Ingresa un correo electrónico válido.')
      return
    }
    if (password.length < 6) {
      setError('La contraseña debe tener al menos 6 caracteres.')
      return
    }

    setLoading(true)

    try {
      const response = await apiClient.post('/auth/login', {
        email,
        password,
      })

      const { accessToken, usuario } = response.data

      localStorage.setItem('accessToken', accessToken)
      localStorage.setItem('usuario', JSON.stringify(usuario))

      setSuccessMessage('¡Sesión iniciada correctamente! Redirigiendo...')
      setTimeout(() => {
        switch (usuario.rol) {
          case 'gerente':
            router.push('/admin')
            break
          case 'cajero':
            router.push('/cajero')
            break
          case 'cocinero':
            router.push('/cocina')
            break
          case 'mesero':
            router.push('/mesero')
            break
          case 'repartidor':
            router.push('/entregas')
            break
          default:
            router.push('/menu')
        }
      }, 500)
    } catch (err: any) {
      console.error(err)
      const serverMessage = err?.response?.data?.message || err?.response?.data?.error
      if (serverMessage) {
        setError(String(serverMessage))
      } else if (err?.response?.status === 401) {
        setError('Credenciales incorrectas. Revisa tu correo y contraseña.')
      } else {
        setError('No se pudo iniciar sesión. Revisa tus credenciales e intenta de nuevo.')
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
            <h1 className="text-3xl font-display mt-2 text-white">Inicia sesión</h1>
            <p className="mt-2 text-sm text-slate-300">
              Accede a tu cuenta para continuar con tu pedido.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
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
                className="w-full rounded-xl border border-white/20 bg-[#0A0A0A] px-3 py-3 text-sm text-white focus:border-orange-500 focus:outline-none"
                placeholder="••••••••"
              />
              <button
                type="button"
                onClick={() => setShowPassword((prev) => !prev)}
                className="mt-1 text-xs text-orange-300 hover:text-orange-100 font-semibold"
              >
                {showPassword ? 'Ocultar contraseña' : 'Ver contraseña'}
              </button>
              <div className="mt-1 text-right">
                <Link href="/forgot-password" className="text-xs text-slate-400 hover:text-orange-300 transition">
                  ¿Olvidaste tu contraseña?
                </Link>
              </div>
            </div>

            {error && <p className="text-xs text-red-300">{error}</p>}
            {successMessage && <p className="text-xs text-emerald-300">{successMessage}</p>}

            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-xl bg-gradient-to-r from-[#F28500] via-[#E68510] to-[#D4700A] py-3 text-sm font-bold uppercase tracking-wide text-white shadow-btn transition hover:opacity-95 disabled:opacity-50"
            >
              {loading ? 'Iniciando...' : 'Iniciar sesión'}
            </button>
          </form>

          <div className="mt-4 text-center text-xs text-slate-300">
            ¿Aún no tienes cuenta?{' '}
            <Link href="/register" className="text-orange-300 font-semibold hover:text-orange-100">
              Regístrate
            </Link>
          </div>
        </div>

        <div className="mt-4 text-center text-slate-300 text-xs">
          <p className="text-white/70">Inicio de sesión.</p>
        </div>
      </main>
    </div>
  )
}
