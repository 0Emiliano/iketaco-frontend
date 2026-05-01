'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import apiClient from '@/lib/api/client'

// ─── Types ────────────────────────────────────────────────────────────────────

interface Producto {
  id: number
  nombre: string
  disponible: boolean
}

interface RecetaItem {
  id: number
  ingrediente_id: number
  cantidad: number            // local (editable)
  cantidadOriginal: number   // para detectar cambios
  ingredientes: {
    nombre: string
    unidades_medida: { simbolo: string }
  }
}

interface Ingrediente {
  id: number
  nombre: string
  unidades_medida: { simbolo: string }
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

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function RecipesPage() {
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

  // ── Datos base ─────────────────────────────────────────────────────────────
  const [productos,     setProductos]     = useState<Producto[]>([])
  const [ingredientes,  setIngredientes]  = useState<Ingrediente[]>([])
  const [loadingBase,   setLoadingBase]   = useState(true)

  useEffect(() => {
    if (!usuario) return
    Promise.all([
      apiClient.get('/menu/productos'),
      apiClient.get('/inventory'),
    ]).then(([pRes, iRes]) => {
      setProductos(pRes.data ?? [])
      setIngredientes(iRes.data ?? [])
    }).catch(() => {
      toast.show('Error al cargar datos iniciales', 'err')
    }).finally(() => setLoadingBase(false))
  }, [usuario]) // eslint-disable-line

  // ── Producto seleccionado + receta ─────────────────────────────────────────
  const [productoId,    setProductoId]    = useState<number | null>(null)
  const [receta,        setReceta]        = useState<RecetaItem[]>([])
  const [loadingReceta, setLoadingReceta] = useState(false)
  const [saving,        setSaving]        = useState(false)

  const fetchReceta = useCallback(async (id: number) => {
    setLoadingReceta(true)
    try {
      const res = await apiClient.get(`/inventory/recetas/${id}`)
      const items: RecetaItem[] = (res.data ?? []).map((r: any) => ({
        id:               r.id,
        ingrediente_id:   r.ingrediente_id,
        cantidad:         parseFloat(r.cantidad),
        cantidadOriginal: parseFloat(r.cantidad),
        ingredientes:     r.ingredientes,
      }))
      setReceta(items)
    } catch {
      toast.show('Error al cargar la receta', 'err')
    } finally {
      setLoadingReceta(false)
    }
  }, []) // eslint-disable-line

  const handleSelectProducto = (id: number) => {
    setProductoId(id)
    setReceta([])
    setNuevoIngredienteId(null)
    setNuevaCantidad('')
    fetchReceta(id)
  }

  // ── Editar cantidad en la receta ───────────────────────────────────────────
  const setCantidad = (ingredienteId: number, valor: number) => {
    setReceta(prev =>
      prev.map(r => r.ingrediente_id === ingredienteId ? { ...r, cantidad: valor } : r)
    )
  }

  // ── Guardar cambios (PATCH por cada fila modificada) ──────────────────────
  const handleGuardar = async () => {
    if (!productoId) return
    const modificados = receta.filter(r => r.cantidad !== r.cantidadOriginal && r.cantidad > 0)
    if (modificados.length === 0) {
      toast.show('Sin cambios que guardar')
      return
    }
    setSaving(true)
    try {
      await Promise.all(
        modificados.map(r =>
          apiClient.patch(
            `/inventory/recetas/${productoId}/${r.ingrediente_id}`,
            { cantidad: r.cantidad }
          )
        )
      )
      setReceta(prev => prev.map(r => ({ ...r, cantidadOriginal: r.cantidad })))
      toast.show('Receta guardada correctamente')
    } catch (err: any) {
      toast.show(err?.response?.data?.error ?? 'Error al guardar', 'err')
    } finally {
      setSaving(false)
    }
  }

  // ── Eliminar ingrediente de la receta ─────────────────────────────────────
  const handleEliminar = async (ingredienteId: number) => {
    if (!productoId) return
    try {
      await apiClient.delete(`/inventory/recetas/${productoId}/${ingredienteId}`)
      setReceta(prev => prev.filter(r => r.ingrediente_id !== ingredienteId))
      toast.show('Ingrediente eliminado')
    } catch (err: any) {
      toast.show(err?.response?.data?.error ?? 'Error al eliminar', 'err')
    }
  }

  // ── Agregar ingrediente ───────────────────────────────────────────────────
  const [nuevoIngredienteId, setNuevoIngredienteId] = useState<number | null>(null)
  const [nuevaCantidad,      setNuevaCantidad]      = useState('')
  const [agregando,          setAgregando]          = useState(false)

  const ingredientesDisponibles = ingredientes.filter(
    i => !receta.some(r => r.ingrediente_id === i.id)
  )

  const handleAgregar = async () => {
    if (!productoId || !nuevoIngredienteId) return
    const cant = parseFloat(nuevaCantidad)
    if (isNaN(cant) || cant <= 0) {
      toast.show('Cantidad inválida', 'err')
      return
    }
    setAgregando(true)
    try {
      await apiClient.post('/inventory/recetas', {
        productoId,
        ingredienteId: nuevoIngredienteId,
        cantidad: cant,
      })
      // Refrescar receta completa
      await fetchReceta(productoId)
      setNuevoIngredienteId(null)
      setNuevaCantidad('')
      toast.show('Ingrediente agregado')
    } catch (err: any) {
      toast.show(err?.response?.data?.error ?? 'Error al agregar', 'err')
    } finally {
      setAgregando(false)
    }
  }

  // ── Detectar si hay cambios sin guardar ───────────────────────────────────
  const hayModificaciones = receta.some(
    r => r.cantidad !== r.cantidadOriginal && r.cantidad > 0
  )

  const productoSeleccionado = productos.find(p => p.id === productoId)

  if (!usuario) return null

  // ─── Render ───────────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-[#0A0A0A] text-white">

      {/* Header */}
      <div
        className="fixed top-0 left-0 right-0 z-50 px-4 py-3 flex items-center justify-between"
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
            <h1 className="text-white font-extrabold text-lg leading-none">Gestionar Recetas</h1>
            <p className="text-gray-400 text-xs mt-0.5">{usuario.email}</p>
          </div>
        </div>
        {hayModificaciones && (
          <button
            onClick={handleGuardar}
            disabled={saving}
            className="px-4 py-2 rounded-xl text-sm font-extrabold text-white
                       transition active:scale-95 disabled:opacity-50"
            style={{ background: 'linear-gradient(135deg,#F28500,#D4700A)' }}
          >
            {saving ? 'Guardando…' : 'Guardar'}
          </button>
        )}
      </div>

      <main className="pt-20 pb-10 px-4 max-w-2xl mx-auto flex flex-col gap-5">

        {/* ── Sección 1: Selector de producto ── */}
        <div
          className="rounded-2xl p-4 mt-2"
          style={{ background: '#1A1A1A', border: '1px solid rgba(255,255,255,0.06)' }}
        >
          <h2 className="text-white font-extrabold text-sm mb-3">Seleccionar producto</h2>
          {loadingBase ? (
            <div className="h-11 rounded-xl animate-pulse" style={{ background: '#2A2A2A' }} />
          ) : (
            <select
              value={productoId ?? ''}
              onChange={e => {
                const v = parseInt(e.target.value)
                if (!isNaN(v)) handleSelectProducto(v)
              }}
              className="w-full rounded-xl bg-[#0A0A0A] border border-white/15 px-3 py-2.5
                         text-white text-sm focus:outline-none focus:border-orange-500 transition"
            >
              <option value="">— Elige un producto —</option>
              {productos.map(p => (
                <option key={p.id} value={p.id}>{p.nombre}</option>
              ))}
            </select>
          )}
        </div>

        {/* ── Sección 2: Receta actual ── */}
        {productoId && (
          <div
            className="rounded-2xl p-4"
            style={{ background: '#1A1A1A', border: '1px solid rgba(255,255,255,0.06)' }}
          >
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-white font-extrabold text-sm">
                Receta de{' '}
                <span style={{ color: '#F28500' }}>{productoSeleccionado?.nombre}</span>
              </h2>
              {receta.length > 0 && (
                <span
                  className="text-xs font-bold px-2 py-0.5 rounded-full"
                  style={{ background: 'rgba(242,133,0,0.15)', color: '#F28500' }}
                >
                  {receta.length} ingrediente{receta.length !== 1 ? 's' : ''}
                </span>
              )}
            </div>

            {loadingReceta ? (
              <div className="flex flex-col gap-2">
                {[1, 2, 3].map(i => (
                  <div key={i} className="h-14 rounded-2xl animate-pulse"
                    style={{ background: '#2A2A2A' }} />
                ))}
              </div>
            ) : receta.length === 0 ? (
              <div className="py-8 text-center">
                <p className="text-gray-400 text-sm font-semibold">Sin ingredientes en la receta</p>
                <p className="text-gray-600 text-xs mt-1">Agrega ingredientes en la sección de abajo</p>
              </div>
            ) : (
              <div className="flex flex-col gap-2">
                {receta.map(r => {
                  const modificado = r.cantidad !== r.cantidadOriginal
                  return (
                    <div
                      key={r.ingrediente_id}
                      className="flex items-center gap-3 rounded-2xl px-4 py-3 transition"
                      style={{
                        background: modificado ? 'rgba(242,133,0,0.07)' : '#111',
                        border: modificado
                          ? '1px solid rgba(242,133,0,0.3)'
                          : '1px solid rgba(255,255,255,0.06)',
                      }}
                    >
                      <span className="text-white font-bold flex-1 text-sm leading-tight">
                        {r.ingredientes.nombre}
                      </span>
                      <input
                        type="number"
                        step="0.001"
                        min="0.001"
                        value={r.cantidad}
                        onChange={e => setCantidad(r.ingrediente_id, parseFloat(e.target.value) || 0)}
                        className="w-24 rounded-xl bg-[#0A0A0A] border border-white/20
                                   px-3 py-1.5 text-white text-sm text-right
                                   focus:outline-none focus:border-orange-500 transition"
                      />
                      <span className="text-gray-400 text-sm w-8 text-left">
                        {r.ingredientes.unidades_medida.simbolo}
                      </span>
                      <button
                        onClick={() => handleEliminar(r.ingrediente_id)}
                        className="text-red-400 hover:text-red-300 transition p-1 rounded-lg
                                   hover:bg-red-400/10 flex-shrink-0"
                        aria-label={`Eliminar ${r.ingredientes.nombre}`}
                      >
                        ✕
                      </button>
                    </div>
                  )
                })}
              </div>
            )}

            {/* Botón guardar en mobile (cuando hay cambios) */}
            {hayModificaciones && (
              <button
                onClick={handleGuardar}
                disabled={saving}
                className="w-full mt-4 py-3 rounded-xl text-white font-extrabold text-sm
                           transition active:scale-95 disabled:opacity-50"
                style={{ background: 'linear-gradient(135deg,#F28500,#D4700A)' }}
              >
                {saving ? 'Guardando…' : 'Guardar cambios'}
              </button>
            )}
          </div>
        )}

        {/* ── Sección 3: Agregar ingrediente ── */}
        {productoId && !loadingReceta && (
          <div
            className="rounded-2xl p-4"
            style={{ background: '#1A1A1A', border: '1px solid rgba(255,255,255,0.06)' }}
          >
            <h2 className="text-white font-extrabold text-sm mb-3">Agregar ingrediente</h2>

            {ingredientesDisponibles.length === 0 ? (
              <p className="text-gray-500 text-sm text-center py-4">
                Todos los ingredientes ya están en la receta
              </p>
            ) : (
              <div className="flex flex-col gap-3">
                {/* Selector de ingrediente */}
                <select
                  value={nuevoIngredienteId ?? ''}
                  onChange={e => {
                    const v = parseInt(e.target.value)
                    setNuevoIngredienteId(isNaN(v) ? null : v)
                  }}
                  className="w-full rounded-xl bg-[#0A0A0A] border border-white/15 px-3 py-2.5
                             text-white text-sm focus:outline-none focus:border-orange-500 transition"
                >
                  <option value="">— Elige un ingrediente —</option>
                  {ingredientesDisponibles.map(i => (
                    <option key={i.id} value={i.id}>
                      {i.nombre} ({i.unidades_medida.simbolo})
                    </option>
                  ))}
                </select>

                {/* Cantidad + botón agregar */}
                <div className="flex gap-2">
                  <input
                    type="number"
                    step="0.001"
                    min="0.001"
                    value={nuevaCantidad}
                    onChange={e => setNuevaCantidad(e.target.value)}
                    placeholder="Cantidad"
                    className="flex-1 rounded-xl bg-[#0A0A0A] border border-white/15 px-3 py-2.5
                               text-white text-sm focus:outline-none focus:border-orange-500 transition"
                  />
                  <button
                    onClick={handleAgregar}
                    disabled={agregando || !nuevoIngredienteId || !nuevaCantidad}
                    className="px-5 py-2.5 rounded-xl text-white font-extrabold text-sm
                               transition active:scale-95 disabled:opacity-40 flex-shrink-0"
                    style={{ background: 'linear-gradient(135deg,#F28500,#D4700A)' }}
                  >
                    {agregando ? '…' : 'Agregar'}
                  </button>
                </div>

                {/* Símbolo del ingrediente seleccionado */}
                {nuevoIngredienteId && (
                  <p className="text-gray-500 text-xs">
                    Unidad:{' '}
                    <span className="text-gray-300 font-semibold">
                      {ingredientesDisponibles.find(i => i.id === nuevoIngredienteId)
                        ?.unidades_medida.simbolo ?? '—'}
                    </span>
                  </p>
                )}
              </div>
            )}
          </div>
        )}
      </main>

      {toast.node}
    </div>
  )
}
