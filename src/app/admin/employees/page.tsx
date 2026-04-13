'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import NavComponent from '@/components/ui/NavComponent'
import apiClient from '@/lib/api/client'

// ─── Types ────────────────────────────────────────────────────────────────────

type Rol = 'gerente' | 'cajero' | 'cocinero' | 'repartidor' | 'cliente'

interface Empleado {
  id: number
  nombre: string
  apellido: string
  rol: string
}

interface Usuario {
  id: number
  email: string
  rol: Rol
  activo: boolean
  creado_en: string
  empleados: Empleado | null
}

// ─── Role config ──────────────────────────────────────────────────────────────

const ROL_CONFIG: Record<Rol, { label: string; color: string; bg: string; border: string }> = {
  gerente:     { label: 'Gerente',     color: '#F28500', bg: 'rgba(242,133,0,0.15)',   border: 'rgba(242,133,0,0.35)'   },
  cajero:      { label: 'Cajero',      color: '#2980B9', bg: 'rgba(41,128,185,0.15)',  border: 'rgba(41,128,185,0.35)'  },
  cocinero:    { label: 'Cocinero',    color: '#E74C3C', bg: 'rgba(231,76,60,0.15)',   border: 'rgba(231,76,60,0.35)'   },
  repartidor:  { label: 'Repartidor',  color: '#27AE60', bg: 'rgba(39,174,96,0.15)',   border: 'rgba(39,174,96,0.35)'   },
  cliente:     { label: 'Cliente',     color: '#6B7280', bg: 'rgba(107,114,128,0.15)', border: 'rgba(107,114,128,0.3)'  },
}

const ROLES: Rol[] = ['gerente', 'cajero', 'cocinero', 'repartidor', 'cliente']

// ─── Role badge ───────────────────────────────────────────────────────────────

function RolBadge({ rol }: { rol: Rol }) {
  const cfg = ROL_CONFIG[rol] ?? ROL_CONFIG.cliente
  return (
    <span
      className="inline-flex items-center px-2.5 py-1 rounded-lg text-xs font-extrabold"
      style={{ color: cfg.color, background: cfg.bg, border: `1px solid ${cfg.border}` }}
    >
      {cfg.label}
    </span>
  )
}

// ─── Role select (shared styled element) ─────────────────────────────────────

function RolSelect({
  value,
  onChange,
  id,
  exclude,
}: {
  value: string
  onChange: (v: string) => void
  id?: string
  exclude?: Rol[]
}) {
  return (
    <select
      id={id}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className="w-full rounded-xl border border-white/15 bg-[#0A0A0A] px-3 py-2.5 text-sm text-white focus:outline-none focus:border-orange-500 transition appearance-none"
      style={{ colorScheme: 'dark' }}
    >
      {ROLES.filter((r) => !exclude?.includes(r)).map((r) => (
        <option key={r} value={r}>{ROL_CONFIG[r].label}</option>
      ))}
    </select>
  )
}

// ─── Change-role modal ────────────────────────────────────────────────────────

function RolModal({
  usuario,
  saving,
  error,
  onConfirm,
  onClose,
}: {
  usuario: Usuario
  saving: boolean
  error: string
  onConfirm: (newRol: Rol) => void
  onClose: () => void
}) {
  const [nuevoRol, setNuevoRol] = useState<Rol>(usuario.rol)
  const unchanged = nuevoRol === usuario.rol
  const cfg = ROL_CONFIG[nuevoRol]

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center sm:items-center p-4"
      style={{ background: 'rgba(0,0,0,0.75)', backdropFilter: 'blur(4px)' }}
      onClick={(e) => { if (e.target === e.currentTarget) onClose() }}
    >
      <div
        className="w-full max-w-sm rounded-3xl overflow-hidden"
        style={{
          background: '#1A1A1A',
          border: '1px solid rgba(255,255,255,0.08)',
          animation: 'slideUp 0.22s cubic-bezier(0.16,1,0.3,1) both',
        }}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4" style={{ borderBottom: '1px solid rgba(255,255,255,0.07)' }}>
          <div>
            <p className="text-xs uppercase tracking-[0.2em] text-orange-400 font-bold mb-0.5">Cambiar rol</p>
            <p className="text-white font-extrabold truncate max-w-[200px]">{usuario.email}</p>
          </div>
          <button onClick={onClose} className="w-9 h-9 rounded-xl flex items-center justify-center text-gray-400 hover:text-white transition" style={{ background: 'rgba(255,255,255,0.06)' }} aria-label="Cerrar">
            ✕
          </button>
        </div>

        {/* Body */}
        <div className="px-5 py-4 flex flex-col gap-3">
          <div>
            <label className="block text-xs font-semibold text-slate-400 mb-1.5">Nuevo rol</label>
            <RolSelect value={nuevoRol} onChange={(v) => setNuevoRol(v as Rol)} />
          </div>

          {/* Preview badge */}
          <div className="flex items-center gap-2 px-3 py-2 rounded-xl" style={{ background: 'rgba(255,255,255,0.04)' }}>
            <span className="text-xs text-gray-400 font-semibold">Vista previa:</span>
            <RolBadge rol={nuevoRol} />
          </div>

          {error && <p className="text-xs text-red-400 font-semibold">{error}</p>}
        </div>

        {/* Footer */}
        <div className="flex gap-3 px-5 py-4" style={{ borderTop: '1px solid rgba(255,255,255,0.07)' }}>
          <button
            onClick={onClose}
            disabled={saving}
            className="flex-1 py-3 rounded-2xl text-sm font-extrabold transition active:scale-95 disabled:opacity-50"
            style={{ background: 'rgba(255,255,255,0.07)', color: '#9CA3AF' }}
          >
            Cancelar
          </button>
          <button
            onClick={() => onConfirm(nuevoRol)}
            disabled={saving || unchanged}
            className="flex-1 py-3 rounded-2xl text-sm font-extrabold text-white transition active:scale-95 disabled:opacity-40"
            style={{ background: `linear-gradient(135deg, ${cfg.color} 0%, ${cfg.color}CC 100%)` }}
          >
            {saving ? 'Guardando…' : 'Confirmar'}
          </button>
        </div>
      </div>
    </div>
  )
}

// ─── Register employee form ───────────────────────────────────────────────────

function RegisterForm({
  token,
  onSuccess,
  onClose,
}: {
  token: string
  onSuccess: () => void
  onClose: () => void
}) {
  const [email, setEmail]       = useState('')
  const [password, setPassword] = useState('')
  const [rol, setRol]           = useState<Rol>('cajero')
  const [showPwd, setShowPwd]   = useState(false)
  const [saving, setSaving]     = useState(false)
  const [error, setError]       = useState('')
  const [flash, setFlash]       = useState('')

  const isValidEmail = (v: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    if (!isValidEmail(email))    { setError('Ingresa un correo válido.'); return }
    if (password.length < 8)     { setError('La contraseña debe tener al menos 8 caracteres.'); return }

    setSaving(true)
    try {
      await apiClient.post(
        '/auth/register',
        { email, password, rol },
        { headers: { Authorization: `Bearer ${token}` } }
      )
      setFlash(`Empleado ${email} creado con rol ${ROL_CONFIG[rol].label}`)
      setEmail(''); setPassword(''); setRol('cajero')
      onSuccess()
      setTimeout(() => setFlash(''), 4000)
    } catch (err: any) {
      const msg = err?.response?.data?.message ?? err?.response?.data?.error
      if (err?.response?.status === 409) setError('Ya existe una cuenta con ese correo.')
      else setError(msg ?? 'No se pudo crear el empleado. Intenta de nuevo.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div
      className="rounded-2xl overflow-hidden mb-4"
      style={{
        background: '#1A1A1A',
        border: '1px solid rgba(242,133,0,0.25)',
        animation: 'fadeSlideDown 0.2s ease both',
      }}
    >
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3" style={{ borderBottom: '1px solid rgba(255,255,255,0.07)' }}>
        <div>
          <p className="text-xs uppercase tracking-[0.18em] text-orange-400 font-bold">Nuevo empleado</p>
          <p className="text-white font-extrabold text-sm mt-0.5">Registrar cuenta</p>
        </div>
        <button onClick={onClose} className="w-8 h-8 rounded-xl flex items-center justify-center text-gray-400 hover:text-white transition text-sm" style={{ background: 'rgba(255,255,255,0.06)' }}>✕</button>
      </div>

      <form onSubmit={handleSubmit} className="px-4 py-4 flex flex-col gap-3">
        {/* Email */}
        <div>
          <label className="block text-xs font-semibold text-slate-400 mb-1">Correo electrónico</label>
          <input
            type="email" value={email} onChange={(e) => setEmail(e.target.value)} required
            placeholder="empleado@correo.com"
            className="w-full rounded-xl border border-white/15 bg-[#0A0A0A] px-3 py-2.5 text-sm text-white focus:outline-none focus:border-orange-500 transition"
          />
        </div>

        {/* Password */}
        <div>
          <label className="block text-xs font-semibold text-slate-400 mb-1">Contraseña</label>
          <input
            type={showPwd ? 'text' : 'password'} value={password} onChange={(e) => setPassword(e.target.value)} required minLength={8}
            placeholder="Mínimo 8 caracteres"
            className="w-full rounded-xl border border-white/15 bg-[#0A0A0A] px-3 py-2.5 text-sm text-white focus:outline-none focus:border-orange-500 transition"
          />
          <button type="button" onClick={() => setShowPwd(p => !p)} className="mt-1 text-xs text-orange-300 hover:text-orange-100 font-semibold">
            {showPwd ? 'Ocultar' : 'Ver contraseña'}
          </button>
        </div>

        {/* Rol */}
        <div>
          <label className="block text-xs font-semibold text-slate-400 mb-1">Rol</label>
          <RolSelect value={rol} onChange={(v) => setRol(v as Rol)} />
        </div>

        {error && <p className="text-xs text-red-400 font-semibold">{error}</p>}
        {flash && <p className="text-xs text-emerald-400 font-semibold">✓ {flash}</p>}

        <button
          type="submit" disabled={saving}
          className="w-full py-3 rounded-xl text-sm font-extrabold text-white transition active:scale-95 disabled:opacity-50"
          style={{ background: 'linear-gradient(135deg, #F28500 0%, #D4700A 100%)' }}
        >
          {saving ? 'Registrando…' : 'Registrar empleado'}
        </button>
      </form>
    </div>
  )
}

// ─── User card ────────────────────────────────────────────────────────────────

function UserCard({
  usuario,
  currentUserId,
  saving,
  onRolClick,
  onToggleActivo,
}: {
  usuario: Usuario
  currentUserId: number | null
  saving: boolean
  onRolClick: (u: Usuario) => void
  onToggleActivo: (u: Usuario) => void
}) {
  const isSelf   = usuario.id === currentUserId
  const isActivo = usuario.activo
  const nombreCompleto = usuario.empleados
    ? `${usuario.empleados.nombre} ${usuario.empleados.apellido}`.trim()
    : null

  return (
    <div
      className="rounded-2xl p-4 flex flex-col gap-3 transition"
      style={{
        background: isActivo ? '#1A1A1A' : 'rgba(26,26,26,0.6)',
        border: isActivo ? '1px solid rgba(255,255,255,0.07)' : '1px solid rgba(255,255,255,0.04)',
        opacity: isActivo ? 1 : 0.75,
      }}
    >
      {/* Top row: email + badges */}
      <div className="flex items-start justify-between gap-2">
        <div className="flex-1 min-w-0">
          <p className="text-sm font-extrabold text-white truncate">{usuario.email}</p>
          {nombreCompleto && (
            <p className="text-xs text-gray-400 font-semibold mt-0.5">{nombreCompleto}</p>
          )}
          <p className="text-xs text-gray-600 mt-0.5">
            {new Date(usuario.creado_en).toLocaleDateString('es-MX', { day: 'numeric', month: 'short', year: 'numeric' })}
          </p>
        </div>
        <div className="flex flex-col items-end gap-1.5 flex-shrink-0">
          <RolBadge rol={usuario.rol} />
          <span
            className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-bold"
            style={isActivo
              ? { background: 'rgba(39,174,96,0.12)', color: '#27AE60', border: '1px solid rgba(39,174,96,0.25)' }
              : { background: 'rgba(107,114,128,0.12)', color: '#6B7280', border: '1px solid rgba(107,114,128,0.2)' }
            }
          >
            <span className="w-1.5 h-1.5 rounded-full" style={{ background: isActivo ? '#27AE60' : '#6B7280' }} />
            {isActivo ? 'Activo' : 'Inactivo'}
          </span>
        </div>
      </div>

      {/* Action buttons */}
      {!isSelf && (
        <div className="flex gap-2" style={{ borderTop: '1px solid rgba(255,255,255,0.05)', paddingTop: '0.625rem' }}>
          <button
            onClick={() => onRolClick(usuario)}
            disabled={saving}
            className="flex-1 py-2 rounded-xl text-xs font-extrabold transition active:scale-95 disabled:opacity-40"
            style={{ background: 'rgba(255,255,255,0.07)', color: '#D1D5DB', border: '1px solid rgba(255,255,255,0.08)' }}
          >
            ✏️ Cambiar rol
          </button>
          <button
            onClick={() => onToggleActivo(usuario)}
            disabled={saving}
            className="flex-1 py-2 rounded-xl text-xs font-extrabold transition active:scale-95 disabled:opacity-40"
            style={isActivo
              ? { background: 'rgba(231,76,60,0.1)', color: '#F87171', border: '1px solid rgba(231,76,60,0.25)' }
              : { background: 'rgba(39,174,96,0.1)', color: '#34D399', border: '1px solid rgba(39,174,96,0.25)' }
            }
          >
            {saving ? '…' : isActivo ? '🔒 Desactivar' : '✅ Activar'}
          </button>
        </div>
      )}

      {isSelf && (
        <p className="text-xs text-gray-600 font-semibold text-center pt-1" style={{ borderTop: '1px solid rgba(255,255,255,0.05)' }}>
          Tu cuenta — no se puede modificar desde aquí
        </p>
      )}
    </div>
  )
}

// ─── Page ─────────────────────────────────────────────────────────────────────

type FiltroActivo = 'todos' | 'activos' | 'inactivos'

export default function EmployeesPage() {
  const router = useRouter()

  const [usuarios,       setUsuarios]       = useState<Usuario[]>([])
  const [loading,        setLoading]        = useState(true)
  const [error,          setError]          = useState('')
  const [token,          setToken]          = useState<string | null>(null)
  const [currentUserId,  setCurrentUserId]  = useState<number | null>(null)

  // Filters
  const [filtroRol,    setFiltroRol]    = useState<string>('todos')
  const [filtroActivo, setFiltroActivo] = useState<FiltroActivo>('todos')

  // Role-change modal
  const [rolModal,      setRolModal]      = useState<Usuario | null>(null)
  const [modalSaving,   setModalSaving]   = useState(false)
  const [modalError,    setModalError]    = useState('')

  // Per-user saving (toggle activo)
  const [savingId, setSavingId] = useState<number | null>(null)

  // Register form
  const [showForm, setShowForm] = useState(false)

  // ── Auth guard ──
  useEffect(() => {
    const raw = localStorage.getItem('usuario')
    const tk  = localStorage.getItem('accessToken')
    if (!raw || !tk) { router.push('/login'); return }
    try {
      const u = JSON.parse(raw)
      if (u.rol !== 'gerente') { router.push('/admin'); return }
      setCurrentUserId(u.id ?? null)
      setToken(tk)
    } catch {
      router.push('/login')
    }
  }, [router])

  // ── Fetch ──
  const fetchUsuarios = useCallback(async () => {
    if (!token) return
    setError('')
    const params: Record<string, string> = {}
    if (filtroRol    !== 'todos')    params.rol    = filtroRol
    if (filtroActivo === 'activos')   params.activo = 'true'
    if (filtroActivo === 'inactivos') params.activo = 'false'

    try {
      const res = await apiClient.get('/users', {
        headers: { Authorization: `Bearer ${token}` },
        params,
      })
      setUsuarios(Array.isArray(res.data) ? res.data : [])
    } catch (err: any) {
      if (err?.response?.status === 401) router.push('/login')
      else if (err?.response?.status === 403) router.push('/admin')
      else setError('No se pudieron cargar los usuarios. Verifica tu conexión.')
    } finally {
      setLoading(false)
    }
  }, [token, filtroRol, filtroActivo, router])

  useEffect(() => {
    if (token) fetchUsuarios()
  }, [token, fetchUsuarios])

  // ── Cambiar rol ──
  const handleCambiarRol = async (nuevoRol: Rol) => {
    if (!rolModal || !token) return
    setModalError('')
    setModalSaving(true)
    try {
      await apiClient.patch(
        `/users/${rolModal.id}`,
        { rol: nuevoRol },
        { headers: { Authorization: `Bearer ${token}` } }
      )
      setRolModal(null)
      fetchUsuarios()
    } catch (err: any) {
      const msg = err?.response?.data?.error ?? err?.response?.data?.message
      setModalError(msg ?? 'Error al cambiar el rol.')
    } finally {
      setModalSaving(false)
    }
  }

  // ── Toggle activo ──
  const handleToggleActivo = async (usuario: Usuario) => {
    if (!token) return
    setSavingId(usuario.id)
    try {
      if (usuario.activo) {
        await apiClient.delete(`/users/${usuario.id}`, {
          headers: { Authorization: `Bearer ${token}` },
        })
      } else {
        await apiClient.patch(
          `/users/${usuario.id}`,
          { activo: true },
          { headers: { Authorization: `Bearer ${token}` } }
        )
      }
      fetchUsuarios()
    } catch (err: any) {
      const msg = err?.response?.data?.error ?? err?.response?.data?.message
      setError(msg ?? 'Error al actualizar el usuario.')
    } finally {
      setSavingId(null)
    }
  }

  // ── Counts for filter pills ──
  const totalActivos   = usuarios.filter(u => u.activo).length
  const totalInactivos = usuarios.filter(u => !u.activo).length

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0A0A0A] flex items-center justify-center">
        <p className="text-gray-400 text-sm font-bold">Cargando usuarios…</p>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#0A0A0A]">
      <NavComponent title="Empleados" />

      <main className="px-4 pt-20 pb-28 max-w-lg mx-auto w-full">

        {/* ── Page header ── */}
        <div className="flex items-center justify-between mt-2 mb-4">
          <div>
            <p className="text-xs uppercase tracking-[0.2em] text-orange-400 font-bold">Panel gerente</p>
            <h1 className="text-white font-display mt-1" style={{ fontSize: '1.75rem' }}>Usuarios</h1>
          </div>
          <button
            onClick={() => setShowForm(f => !f)}
            className="flex items-center gap-2 px-3 py-2.5 rounded-xl text-xs font-extrabold text-white transition active:scale-95"
            style={{ background: showForm ? 'rgba(255,255,255,0.08)' : 'linear-gradient(135deg, #F28500 0%, #D4700A 100%)' }}
          >
            <span style={{ fontSize: '1rem', lineHeight: 1 }}>{showForm ? '✕' : '＋'}</span>
            {showForm ? 'Cerrar' : 'Registrar empleado'}
          </button>
        </div>

        {/* ── Register form (collapsible) ── */}
        {showForm && token && (
          <RegisterForm
            token={token}
            onSuccess={fetchUsuarios}
            onClose={() => setShowForm(false)}
          />
        )}

        {/* ── Global error ── */}
        {error && (
          <div className="rounded-2xl px-4 py-3 mb-4" style={{ background: 'rgba(231,76,60,0.1)', border: '1px solid rgba(231,76,60,0.3)' }}>
            <p className="text-sm text-red-300 font-semibold">{error}</p>
          </div>
        )}

        {/* ── Filters ── */}
        <div className="flex flex-col gap-3 mb-4">
          {/* Activo toggle pills */}
          <div className="flex gap-2">
            {([
              { key: 'todos',     label: 'Todos',     count: usuarios.length },
              { key: 'activos',   label: 'Activos',   count: totalActivos   },
              { key: 'inactivos', label: 'Inactivos', count: totalInactivos },
            ] as { key: FiltroActivo; label: string; count: number }[]).map((opt) => {
              const isActive = filtroActivo === opt.key
              return (
                <button
                  key={opt.key}
                  onClick={() => setFiltroActivo(opt.key)}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-extrabold transition active:scale-95"
                  style={isActive
                    ? { background: 'rgba(242,133,0,0.2)', color: '#F28500', border: '1px solid rgba(242,133,0,0.4)' }
                    : { background: 'rgba(255,255,255,0.06)', color: '#6B7280', border: '1px solid rgba(255,255,255,0.07)' }
                  }
                >
                  {opt.label}
                  <span
                    className="px-1.5 py-0.5 rounded-md text-xs font-black"
                    style={{ background: isActive ? 'rgba(242,133,0,0.3)' : 'rgba(255,255,255,0.08)' }}
                  >
                    {opt.count}
                  </span>
                </button>
              )
            })}
          </div>

          {/* Role filter */}
          <div className="relative">
            <select
              value={filtroRol}
              onChange={(e) => setFiltroRol(e.target.value)}
              className="w-full rounded-xl border border-white/10 bg-[#111] px-3 py-2.5 text-sm text-white focus:outline-none focus:border-orange-500 transition appearance-none"
              style={{ colorScheme: 'dark' }}
            >
              <option value="todos">Todos los roles</option>
              {ROLES.map((r) => (
                <option key={r} value={r}>{ROL_CONFIG[r].label}</option>
              ))}
            </select>
            <svg className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" width="14" height="14" viewBox="0 0 24 24" fill="none">
              <path d="M6 9l6 6 6-6" stroke="#6B7280" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </div>
        </div>

        {/* ── User list ── */}
        {usuarios.length === 0 ? (
          <div className="flex flex-col items-center justify-center min-h-[40vh] text-center">
            <div className="w-20 h-20 rounded-full flex items-center justify-center text-4xl mb-4" style={{ background: '#1A1A1A' }}>
              👤
            </div>
            <p className="text-white font-extrabold text-base mb-1">Sin resultados</p>
            <p className="text-gray-400 text-sm">
              {filtroRol !== 'todos' || filtroActivo !== 'todos'
                ? 'No hay usuarios con los filtros seleccionados.'
                : 'No hay usuarios registrados.'}
            </p>
          </div>
        ) : (
          <div className="flex flex-col gap-3">
            <p className="text-xs text-gray-500 font-semibold">
              {usuarios.length} usuario{usuarios.length !== 1 ? 's' : ''}
              {filtroRol !== 'todos' && ` · ${ROL_CONFIG[filtroRol as Rol]?.label ?? filtroRol}`}
              {filtroActivo !== 'todos' && ` · ${filtroActivo}`}
            </p>
            {usuarios.map((u, i) => (
              <div key={u.id} style={{ animation: `fadeIn 0.2s ease ${i * 0.04}s both` }}>
                <UserCard
                  usuario={u}
                  currentUserId={currentUserId}
                  saving={savingId === u.id}
                  onRolClick={() => { setModalError(''); setRolModal(u) }}
                  onToggleActivo={handleToggleActivo}
                />
              </div>
            ))}
          </div>
        )}
      </main>

      {/* ── Role modal ── */}
      {rolModal && (
        <RolModal
          usuario={rolModal}
          saving={modalSaving}
          error={modalError}
          onConfirm={handleCambiarRol}
          onClose={() => setRolModal(null)}
        />
      )}

      <style>{`
        @keyframes slideUp {
          from { opacity: 0; transform: translateY(24px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(6px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        @keyframes fadeSlideDown {
          from { opacity: 0; transform: translateY(-8px); }
          to   { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </div>
  )
}
