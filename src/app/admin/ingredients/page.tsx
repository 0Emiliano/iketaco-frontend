'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import apiClient from '@/lib/api/client'

// ─── Types ────────────────────────────────────────────────────────────────────

interface UnidadMedida {
  id:      number
  nombre:  string
  simbolo: string
}

interface Ingrediente {
  id:              number
  nombre:          string
  stock_actual:    number
  stock_minimo:    number
  stock_maximo:    number | null
  costo_unitario:  number | null
  proveedor:       string | null
  activo:          boolean
  unidades_medida: UnidadMedida
}

interface FormState {
  nombre:         string
  unidadMedidaId: number | ''
  stockActual:    string
  stockMinimo:    string
  stockMaximo:    string
  costoUnitario:  string
  proveedor:      string
}

const FORM_VACIO: FormState = {
  nombre: '', unidadMedidaId: '', stockActual: '0',
  stockMinimo: '0', stockMaximo: '', costoUnitario: '', proveedor: '',
}

// ─── Toast ────────────────────────────────────────────────────────────────────

function useToast() {
  const [toast, setToast] = useState<{ msg: string; tipo: 'ok' | 'err' } | null>(null)
  const show = (msg: string, tipo: 'ok' | 'err' = 'ok') => {
    setToast({ msg, tipo })
    setTimeout(() => setToast(null), 3000)
  }
  const node = toast && (
    <div
      className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 px-5 py-3 rounded-2xl
                 text-white font-extrabold text-sm shadow-xl whitespace-nowrap"
      style={{
        background: toast.tipo === 'ok'
          ? 'linear-gradient(135deg,#27AE60,#1E8449)'
          : 'linear-gradient(135deg,#E74C3C,#C0392B)',
      }}
    >
      {toast.msg}
    </div>
  )
  return { show, node }
}

// ─── Helpers ─────────────----------------------------------------------------------------

function fmt(n: number | null | undefined, dec = 2) {
  if (n === null || n === undefined) return '—'
  return n.toFixed(dec)
}

function toNum(s: string): number | undefined {
  const n = parseFloat(s)
  return isNaN(n) ? undefined : n
}

// ─── Panel lateral (crear / editar) ──────────────────────────────────────────

function Panel({
  modo,
  form,
  setForm,
  unidades,
  saving,
  error,
  onClose,
  onSubmit,
}: {
  modo:     'crear' | 'editar'
  form:     FormState
  setForm:  (f: FormState) => void
  unidades: UnidadMedida[]
  saving:   boolean
  error:    string
  onClose:  () => void
  onSubmit: () => void
}) {
  const set = (key: keyof FormState, val: string | number) =>
    setForm({ ...form, [key]: val })

  return (
    <div
      className="fixed inset-0 z-50 flex justify-end"
      style={{ background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(3px)' }}
      onClick={e => { if (e.target === e.currentTarget) onClose() }}
    >
      <div
        className="w-full max-w-md h-full overflow-y-auto flex flex-col"
        style={{
          background: '#111',
          borderLeft: '1px solid rgba(255,255,255,0.08)',
          animation: 'slideInRight 0.2s ease both',
        }}
      >
        {/* Header */}
        <div
          className="flex items-center justify-between px-5 py-4 flex-shrink-0"
          style={{ borderBottom: '1px solid rgba(255,255,255,0.07)' }}
        >
          <h2 className="text-white font-extrabold text-lg">
            {modo === 'crear' ? 'Nuevo ingrediente' : 'Editar ingrediente'}
          </h2>
          <button
            onClick={onClose}
            className="w-9 h-9 rounded-xl flex items-center justify-center
                       text-gray-400 hover:text-white transition"
            style={{ background: 'rgba(255,255,255,0.06)' }}
          >
            ✕
          </button>
        </div>

        {/* Campos */}
        <div className="flex-1 px-5 py-5 flex flex-col gap-4">

          <Field label="Nombre *" required>
            <input
              type="text"
              value={form.nombre}
              onChange={e => set('nombre', e.target.value)}
              placeholder="Ej: Carne de res"
              className={inputCls}
            />
          </Field>

          <Field label="Unidad de medida *" required>
            <select
              value={form.unidadMedidaId}
              onChange={e => set('unidadMedidaId', parseInt(e.target.value) || '')}
              className={inputCls}
            >
              <option value="">— Selecciona —</option>
              {unidades.map(u => (
                <option key={u.id} value={u.id}>{u.nombre} ({u.simbolo})</option>
              ))}
            </select>
          </Field>

          <div className="grid grid-cols-2 gap-3">
            <Field label="Stock actual" hidden={modo === 'editar'}>
              <input type="number" min="0" step="0.001" value={form.stockActual}
                onChange={e => set('stockActual', e.target.value)}
                placeholder="0" className={inputCls} />
            </Field>
            <Field label="Stock mínimo">
              <input type="number" min="0" step="0.001" value={form.stockMinimo}
                onChange={e => set('stockMinimo', e.target.value)}
                placeholder="0" className={inputCls} />
            </Field>
            <Field label="Stock máximo">
              <input type="number" min="0" step="0.001" value={form.stockMaximo}
                onChange={e => set('stockMaximo', e.target.value)}
                placeholder="Sin límite" className={inputCls} />
            </Field>
            <Field label="Costo unitario">
              <input type="number" min="0" step="0.01" value={form.costoUnitario}
                onChange={e => set('costoUnitario', e.target.value)}
                placeholder="0.00" className={inputCls} />
            </Field>
          </div>

          <Field label="Proveedor">
            <input type="text" value={form.proveedor}
              onChange={e => set('proveedor', e.target.value)}
              placeholder="Ej: Distribuidora XYZ" className={inputCls} />
          </Field>

          {error && (
            <p className="text-red-400 text-sm font-semibold">{error}</p>
          )}
        </div>

        {/* Footer */}
        <div
          className="px-5 py-4 flex gap-3 flex-shrink-0"
          style={{ borderTop: '1px solid rgba(255,255,255,0.07)' }}
        >
          <button
            onClick={onClose}
            className="flex-1 py-3 rounded-xl text-sm font-extrabold text-gray-400 transition"
            style={{ background: 'rgba(255,255,255,0.06)' }}
          >
            Cancelar
          </button>
          <button
            onClick={onSubmit}
            disabled={saving}
            className="flex-1 py-3 rounded-xl text-white text-sm font-extrabold
                       transition active:scale-95 disabled:opacity-50"
            style={{ background: 'linear-gradient(135deg,#F28500,#D4700A)' }}
          >
            {saving ? 'Guardando…' : modo === 'crear' ? 'Crear ingrediente' : 'Guardar cambios'}
          </button>
        </div>
      </div>

      <style>{`
        @keyframes slideInRight {
          from { opacity: 0; transform: translateX(24px); }
          to   { opacity: 1; transform: translateX(0); }
        }
      `}</style>
    </div>
  )
}

// ─── Componentes auxiliares ───────────────────────────────────────────────────

const inputCls =
  'w-full rounded-xl bg-[#0A0A0A] border border-white/15 px-3 py-2.5 ' +
  'text-white text-sm focus:outline-none focus:border-orange-500 transition'

function Field({
  label, children, required = false, hidden = false,
}: {
  label: string; children: React.ReactNode; required?: boolean; hidden?: boolean
}) {
  if (hidden) return null
  return (
    <div className="flex flex-col gap-1.5">
      <label className="text-xs font-semibold text-gray-400">
        {label}{required && <span className="text-orange-400 ml-0.5">*</span>}
      </label>
      {children}
    </div>
  )
}

// ─── Barra de stock ───────────────────────────────────────────────────────────

function StockBar({ actual, minimo, maximo }: { actual: number; minimo: number; maximo: number | null }) {
  if (!maximo || maximo <= 0) return null
  const pct = Math.min(100, Math.max(0, (actual / maximo) * 100))
  const bajo = actual <= minimo
  return (
    <div className="h-1 w-full rounded-full mt-1" style={{ background: 'rgba(255,255,255,0.08)' }}>
      <div
        className="h-full rounded-full transition-all"
        style={{
          width: `${pct}%`,
          background: bajo ? '#E74C3C' : pct < 40 ? '#F28500' : '#27AE60',
        }}
      />
    </div>
  )
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function IngredientsPage() {
  const router = useRouter()
  const toast  = useToast()

  // ── Auth ──────────────────────────────────────────────────────────────────
  const [usuario, setUsuario] = useState<{ email: string; rol: string } | null>(null)

  useEffect(() => {
    const raw = localStorage.getItem('usuario')
    if (!raw) { router.push('/login'); return }
    const u = JSON.parse(raw)
    if (u.rol !== 'gerente') { router.push('/admin'); return }
    setUsuario(u)
  }, [router])

  // ── Datos ─────────────────────────────────────────────────────────────────
  const [ingredientes, setIngredientes] = useState<Ingrediente[]>([])
  const [unidades,     setUnidades]     = useState<UnidadMedida[]>([])
  const [loading,      setLoading]      = useState(true)
  const [search,       setSearch]       = useState('')

  const fetchTodo = useCallback(async () => {
    try {
      const [iRes, uRes] = await Promise.all([
        apiClient.get('/inventory'),
        apiClient.get('/inventory/unidades'),
      ])
      setIngredientes((iRes.data ?? []).map((i: any) => ({
        ...i,
        stock_actual:   parseFloat(i.stock_actual),
        stock_minimo:   parseFloat(i.stock_minimo),
        stock_maximo:   i.stock_maximo != null ? parseFloat(i.stock_maximo) : null,
        costo_unitario: i.costo_unitario != null ? parseFloat(i.costo_unitario) : null,
      })))
      setUnidades(uRes.data ?? [])
    } catch {
      toast.show('Error al cargar ingredientes', 'err')
    } finally {
      setLoading(false)
    }
  }, []) // eslint-disable-line

  useEffect(() => { if (usuario) fetchTodo() }, [usuario, fetchTodo])

  // ── Panel crear / editar ──────────────────────────────────────────────────
  const [panel,   setPanel]   = useState<'cerrado' | 'crear' | 'editar'>('cerrado')
  const [editId,  setEditId]  = useState<number | null>(null)
  const [form,    setForm]    = useState<FormState>(FORM_VACIO)
  const [saving,  setSaving]  = useState(false)
  const [formErr, setFormErr] = useState('')

  const abrirCrear = () => {
    setForm(FORM_VACIO)
    setEditId(null)
    setFormErr('')
    setPanel('crear')
  }

  const abrirEditar = (ing: Ingrediente) => {
    setForm({
      nombre:         ing.nombre,
      unidadMedidaId: ing.unidades_medida.id,
      stockActual:    String(ing.stock_actual),
      stockMinimo:    String(ing.stock_minimo),
      stockMaximo:    ing.stock_maximo != null ? String(ing.stock_maximo) : '',
      costoUnitario:  ing.costo_unitario != null ? String(ing.costo_unitario) : '',
      proveedor:      ing.proveedor ?? '',
    })
    setEditId(ing.id)
    setFormErr('')
    setPanel('editar')
  }

  const cerrarPanel = () => { setPanel('cerrado'); setEditId(null) }

  const handleSubmit = async () => {
    if (!form.nombre.trim()) { setFormErr('El nombre es obligatorio'); return }
    if (!form.unidadMedidaId) { setFormErr('Selecciona una unidad de medida'); return }
    setFormErr('')
    setSaving(true)

    const payload: Record<string, unknown> = {
      nombre:         form.nombre.trim(),
      unidadMedidaId: Number(form.unidadMedidaId),
      stockMinimo:    toNum(form.stockMinimo) ?? 0,
      ...(form.stockMaximo  ? { stockMaximo:   toNum(form.stockMaximo)  } : {}),
      ...(form.costoUnitario ? { costoUnitario: toNum(form.costoUnitario) } : {}),
      ...(form.proveedor.trim() ? { proveedor: form.proveedor.trim() } : {}),
    }

    try {
      if (panel === 'crear') {
        payload.stockActual = toNum(form.stockActual) ?? 0
        const res = await apiClient.post('/inventory', payload)
        const nuevo: Ingrediente = {
          ...res.data,
          stock_actual:   parseFloat(res.data.stock_actual),
          stock_minimo:   parseFloat(res.data.stock_minimo),
          stock_maximo:   res.data.stock_maximo != null ? parseFloat(res.data.stock_maximo) : null,
          costo_unitario: res.data.costo_unitario != null ? parseFloat(res.data.costo_unitario) : null,
        }
        setIngredientes(prev => [nuevo, ...prev])
        toast.show('Ingrediente creado')
      } else {
        await apiClient.patch(`/inventory/${editId}`, payload)
        await fetchTodo()
        toast.show('Ingrediente actualizado')
      }
      cerrarPanel()
    } catch (err: any) {
      setFormErr(err?.response?.data?.error ?? 'Error al guardar')
    } finally {
      setSaving(false)
    }
  }

  // ── Desactivar ────────────────────────────────────────────────────────────
  const [confirmId, setConfirmId] = useState<number | null>(null)
  const [deleting,  setDeleting]  = useState(false)

  const handleDesactivar = async () => {
    if (!confirmId) return
    setDeleting(true)
    try {
      await apiClient.delete(`/inventory/${confirmId}`)
      setIngredientes(prev => prev.filter(i => i.id !== confirmId))
      toast.show('Ingrediente desactivado')
    } catch (err: any) {
      toast.show(err?.response?.data?.error ?? 'Error al desactivar', 'err')
    } finally {
      setDeleting(false)
      setConfirmId(null)
    }
  }

  // ── Filtro búsqueda ───────────────────────────────────────────────────────
  const filtrados = ingredientes.filter(i =>
    i.nombre.toLowerCase().includes(search.toLowerCase()) ||
    (i.proveedor ?? '').toLowerCase().includes(search.toLowerCase())
  )

  const alertas = ingredientes.filter(i => i.stock_actual <= i.stock_minimo).length

  if (!usuario) return null

  // ─── Render ───────────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-[#0A0A0A] text-white">

      {/* Header */}
      <div
        className="fixed top-0 left-0 right-0 z-40 px-4 py-3 flex items-center justify-between"
        style={{ background: '#111', borderBottom: '1px solid rgba(255,255,255,0.08)' }}
      >
        <div className="flex items-center gap-3">
          <button
            onClick={() => router.push('/admin')}
            className="p-2 rounded-xl transition hover:bg-white/10 text-gray-400 hover:text-white"
            aria-label="Volver"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
              <path d="M19 12H5M5 12L12 19M5 12L12 5" stroke="currentColor" strokeWidth="2.5"
                strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </button>
          <div>
            <h1 className="text-white font-extrabold text-lg leading-none">Ingredientes</h1>
            <p className="text-gray-400 text-xs mt-0.5">{filtrados.length} activos</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {alertas > 0 && (
            <span
              className="text-xs font-bold px-2.5 py-1 rounded-full"
              style={{ background: 'rgba(231,76,60,0.2)', color: '#F87171' }}
            >
              {alertas} bajo stock
            </span>
          )}
          <button
            onClick={abrirCrear}
            className="px-4 py-2 rounded-xl text-sm font-extrabold text-white
                       transition active:scale-95 flex items-center gap-1.5"
            style={{ background: 'linear-gradient(135deg,#F28500,#D4700A)' }}
          >
            <span className="text-base leading-none">+</span> Nuevo
          </button>
        </div>
      </div>

      <main className="pt-20 pb-10 px-4 max-w-3xl mx-auto flex flex-col gap-4">

        {/* Buscador */}
        <div className="relative mt-2">
          <svg
            className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500"
            width="16" height="16" viewBox="0 0 24 24" fill="none"
          >
            <circle cx="11" cy="11" r="8" stroke="currentColor" strokeWidth="2" />
            <path d="M21 21l-4.35-4.35" stroke="currentColor" strokeWidth="2"
              strokeLinecap="round" />
          </svg>
          <input
            type="text"
            placeholder="Buscar por nombre o proveedor…"
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full rounded-xl bg-[#1A1A1A] border border-white/10 pl-9 pr-4 py-2.5
                       text-white text-sm placeholder-gray-600
                       focus:outline-none focus:border-orange-500 transition"
          />
        </div>

        {/* Lista */}
        {loading ? (
          <div className="flex flex-col gap-3">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="h-24 rounded-2xl animate-pulse"
                style={{ background: '#1A1A1A' }} />
            ))}
          </div>
        ) : filtrados.length === 0 ? (
          <div
            className="rounded-2xl py-14 text-center"
            style={{ background: '#1A1A1A', border: '1px solid rgba(255,255,255,0.06)' }}
          >
            <p className="text-gray-400 text-sm font-semibold">
              {search ? `Sin resultados para "${search}"` : 'Sin ingredientes registrados'}
            </p>
          </div>
        ) : (
          <div className="flex flex-col gap-3">
            {filtrados.map(ing => {
              const bajoPocStock = ing.stock_actual <= ing.stock_minimo
              return (
                <div
                  key={ing.id}
                  className="rounded-2xl p-4"
                  style={{
                    background: bajoPocStock ? 'rgba(231,76,60,0.05)' : '#1A1A1A',
                    border: bajoPocStock
                      ? '1px solid rgba(231,76,60,0.25)'
                      : '1px solid rgba(255,255,255,0.06)',
                  }}
                >
                  {/* Fila principal */}
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-white font-extrabold text-sm leading-tight">
                          {ing.nombre}
                        </span>
                        <span
                          className="text-xs font-bold px-2 py-0.5 rounded-full flex-shrink-0"
                          style={{
                            background: 'rgba(255,255,255,0.07)',
                            color: '#9CA3AF',
                          }}
                        >
                          {ing.unidades_medida.simbolo}
                        </span>
                        {bajoPocStock && (
                          <span
                            className="text-xs font-bold px-2 py-0.5 rounded-full flex-shrink-0"
                            style={{ background: 'rgba(231,76,60,0.2)', color: '#F87171' }}
                          >
                            Bajo stock
                          </span>
                        )}
                      </div>

                      {/* Stock */}
                      <div className="mt-2 grid grid-cols-3 gap-2 text-xs">
                        <div>
                          <p className="text-gray-500">Stock actual</p>
                          <p
                            className="font-extrabold"
                            style={{ color: bajoPocStock ? '#F87171' : '#27AE60' }}
                          >
                            {fmt(ing.stock_actual, 3)} {ing.unidades_medida.simbolo}
                          </p>
                        </div>
                        <div>
                          <p className="text-gray-500">Mínimo</p>
                          <p className="text-gray-300 font-semibold">
                            {fmt(ing.stock_minimo, 3)} {ing.unidades_medida.simbolo}
                          </p>
                        </div>
                        <div>
                          <p className="text-gray-500">Costo unit.</p>
                          <p className="font-semibold" style={{ color: '#F28500' }}>
                            {ing.costo_unitario != null ? `$${fmt(ing.costo_unitario, 4)}` : '—'}
                          </p>
                        </div>
                      </div>

                      {/* Barra de stock */}
                      <StockBar
                        actual={ing.stock_actual}
                        minimo={ing.stock_minimo}
                        maximo={ing.stock_maximo}
                      />

                      {/* Proveedor */}
                      {ing.proveedor && (
                        <p className="text-gray-500 text-xs mt-2 truncate">
                          {ing.proveedor}
                        </p>
                      )}
                    </div>

                    {/* Acciones */}
                    <div className="flex flex-col gap-2 flex-shrink-0">
                      <button
                        onClick={() => abrirEditar(ing)}
                        className="px-3 py-1.5 rounded-xl text-xs font-extrabold transition
                                   active:scale-95"
                        style={{
                          background: 'rgba(242,133,0,0.12)',
                          color: '#F28500',
                          border: '1px solid rgba(242,133,0,0.25)',
                        }}
                      >
                        Editar
                      </button>
                      <button
                        onClick={() => setConfirmId(ing.id)}
                        className="px-3 py-1.5 rounded-xl text-xs font-extrabold transition
                                   active:scale-95"
                        style={{
                          background: 'rgba(231,76,60,0.1)',
                          color: '#F87171',
                          border: '1px solid rgba(231,76,60,0.2)',
                        }}
                      >
                        Desactivar
                      </button>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </main>

      {/* Panel crear / editar */}
      {panel !== 'cerrado' && (
        <Panel
          modo={panel}
          form={form}
          setForm={setForm}
          unidades={unidades}
          saving={saving}
          error={formErr}
          onClose={cerrarPanel}
          onSubmit={handleSubmit}
        />
      )}

      {/* Modal confirmación desactivar */}
      {confirmId !== null && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center px-4"
          style={{ background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(4px)' }}
          onClick={e => { if (e.target === e.currentTarget) setConfirmId(null) }}
        >
          <div
            className="w-full max-w-sm rounded-3xl p-6 flex flex-col gap-4"
            style={{
              background: '#1A1A1A',
              border: '1px solid rgba(255,255,255,0.08)',
              animation: 'fadeSlideUp 0.18s ease both',
            }}
          >
            <div>
              <p className="text-white font-extrabold text-lg mb-1">¿Desactivar ingrediente?</p>
              <p className="text-gray-400 text-sm">
                El ingrediente dejará de aparecer en el inventario y en las recetas.
                Esta acción se puede revertir desde la base de datos.
              </p>
            </div>
            <div className="flex gap-3">
              <button
                onClick={() => setConfirmId(null)}
                className="flex-1 py-2.5 rounded-xl text-sm font-extrabold text-gray-400"
                style={{ background: 'rgba(255,255,255,0.07)' }}
              >
                Cancelar
              </button>
              <button
                onClick={handleDesactivar}
                disabled={deleting}
                className="flex-1 py-2.5 rounded-xl text-white text-sm font-extrabold
                           transition active:scale-95 disabled:opacity-50"
                style={{ background: 'linear-gradient(135deg,#E74C3C,#C0392B)' }}
              >
                {deleting ? 'Desactivando…' : 'Desactivar'}
              </button>
            </div>
          </div>

          <style>{`
            @keyframes fadeSlideUp {
              from { opacity: 0; transform: translateY(12px); }
              to   { opacity: 1; transform: translateY(0); }
            }
          `}</style>
        </div>
      )}

      {toast.node}
    </div>
  )
}
