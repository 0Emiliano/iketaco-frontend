'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import apiClient from '@/lib/api/client'
import { toast } from '@/lib/toast'
import type { Categoria, Producto } from '@/types'

// ─── Tipos del formulario ─────────────────────────────────────────────────────
interface ProductoForm {
  nombre: string
  descripcion: string
  precioBase: string
  categoriaId: string
  disponible: boolean
}

const FORM_VACIO: ProductoForm = {
  nombre: '',
  descripcion: '',
  precioBase: '',
  categoriaId: '',
  disponible: true,
}

// ─── Errores de campo ─────────────────────────────────────────────────────────
type FormErrors = Partial<Record<keyof ProductoForm, string>>

function validar(form: ProductoForm): FormErrors {
  const errors: FormErrors = {}
  if (!form.nombre.trim()) errors.nombre = 'El nombre es obligatorio'
  if (!form.precioBase || isNaN(Number(form.precioBase)) || Number(form.precioBase) <= 0)
    errors.precioBase = 'Ingresa un precio válido mayor a 0'
  if (!form.categoriaId) errors.categoriaId = 'Selecciona una categoría'
  return errors
}

// ─── Componente principal ─────────────────────────────────────────────────────
export default function AdminMenuPage() {
  const router = useRouter()

  // datos
  const [productos, setProductos] = useState<Producto[]>([])
  const [categorias, setCategorias] = useState<Categoria[]>([])
  const [loading, setLoading] = useState(true)
  const [fetchError, setFetchError] = useState('')

  // producto seleccionado para editar
  const [seleccionado, setSeleccionado] = useState<Producto | null>(null)

  // formulario de texto
  const [form, setForm] = useState<ProductoForm>(FORM_VACIO)
  const [formErrors, setFormErrors] = useState<FormErrors>({})
  const [guardando, setGuardando] = useState(false)

  // imagen
  const [imagenFile, setImagenFile] = useState<File | null>(null)
  const [imagenPreview, setImagenPreview] = useState<string | null>(null)
  const [subiendoImagen, setSubiendoImagen] = useState(false)
  const [imagenError, setImagenError] = useState('')
  const fileInputRef = useRef<HTMLInputElement>(null)

  // busqueda / filtro
  const [search, setSearch] = useState('')

  // ─── Carga inicial ──────────────────────────────────────────────────────────
  useEffect(() => {
    const raw = localStorage.getItem('usuario')
    if (!raw) { router.push('/login'); return }
    const u = JSON.parse(raw)
    if (u.rol !== 'gerente') { router.push('/menu'); return }
  }, [router])

  const fetchData = useCallback(async () => {
    setLoading(true)
    setFetchError('')
    try {
      const [prodsRes, catsRes] = await Promise.all([
        apiClient.get('/menu/productos'),
        apiClient.get('/menu/categorias'),
      ])
      setProductos(prodsRes.data)
      setCategorias(catsRes.data)
    } catch {
      setFetchError('No se pudieron cargar los productos. Verifica tu conexión.')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { fetchData() }, [fetchData])

  // ─── Seleccionar producto para editar ───────────────────────────────────────
  const abrirEdicion = (producto: Producto) => {
    setSeleccionado(producto)
    setForm({
      nombre: producto.nombre,
      descripcion: producto.descripcion ?? '',
      precioBase: producto.precio_base,
      categoriaId: String(producto.categorias.id),
      disponible: producto.disponible,
    })
    setFormErrors({})
    setImagenFile(null)
    setImagenPreview(null)
    setImagenError('')
  }

  const cerrarEdicion = () => {
    setSeleccionado(null)
    setImagenFile(null)
    setImagenPreview(null)
    setImagenError('')
    setFormErrors({})
    // Revocar object URL si existía
    if (imagenPreview) URL.revokeObjectURL(imagenPreview)
  }

  // ─── Cambio de campo ────────────────────────────────────────────────────────
  const handleField = (field: keyof ProductoForm, value: string | boolean) => {
    setForm((prev) => ({ ...prev, [field]: value }))
    if (formErrors[field]) setFormErrors((prev) => ({ ...prev, [field]: undefined }))
  }

  // ─── Selección de imagen ────────────────────────────────────────────────────
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    const ALLOWED = ['image/jpeg', 'image/png', 'image/webp']
    if (!ALLOWED.includes(file.type)) {
      setImagenError('Solo se permiten imágenes JPG, PNG o WebP')
      return
    }
    if (file.size > 5 * 1024 * 1024) {
      setImagenError('La imagen no debe superar 5 MB')
      return
    }

    setImagenError('')
    // Revocar preview anterior
    if (imagenPreview) URL.revokeObjectURL(imagenPreview)
    setImagenFile(file)
    setImagenPreview(URL.createObjectURL(file))
  }

  // ─── Subir imagen ────────────────────────────────────────────────────────────
  const subirImagen = async () => {
    if (!imagenFile || !seleccionado) return

    setSubiendoImagen(true)
    setImagenError('')

    const formData = new FormData()
    formData.append('image', imagenFile)

    try {
      const res = await apiClient.patch(
        `/admin/menu/productos/${seleccionado.id}/image`,
        formData,
        { headers: { 'Content-Type': 'multipart/form-data' } }
      )
      const nuevaUrl: string = res.data.imagen_url
      // Actualizar lista local
      setProductos((prev) =>
        prev.map((p) => (p.id === seleccionado.id ? { ...p, imagen_url: nuevaUrl } : p))
      )
      setSeleccionado((prev) => prev ? { ...prev, imagen_url: nuevaUrl } : prev)
      setImagenFile(null)
      setImagenPreview(null)
      if (fileInputRef.current) fileInputRef.current.value = ''
      toast('Imagen actualizada correctamente')
    } catch (err: any) {
      const msg = err?.response?.data?.error ?? 'Error al subir la imagen'
      setImagenError(msg)
    } finally {
      setSubiendoImagen(false)
    }
  }

  // ─── Guardar campos de texto ─────────────────────────────────────────────────
  const handleGuardar = async () => {
    if (!seleccionado) return

    const errors = validar(form)
    if (Object.keys(errors).length > 0) {
      setFormErrors(errors)
      return
    }

    setGuardando(true)
    try {
      const res = await apiClient.patch(`/admin/menu/productos/${seleccionado.id}`, {
        nombre: form.nombre.trim(),
        descripcion: form.descripcion.trim() || undefined,
        precioBase: parseFloat(form.precioBase),
        categoriaId: parseInt(form.categoriaId),
        disponible: form.disponible,
      })
      const actualizado: Producto = res.data
      setProductos((prev) => prev.map((p) => (p.id === actualizado.id ? actualizado : p)))
      setSeleccionado(actualizado)
      toast('Producto actualizado correctamente')
    } catch (err: any) {
      const msg = err?.response?.data?.error ?? 'Error al guardar los cambios'
      toast(msg, 'error')
    } finally {
      setGuardando(false)
    }
  }

  // ─── Lista filtrada ──────────────────────────────────────────────────────────
  const productosFiltrados = productos.filter((p) =>
    p.nombre.toLowerCase().includes(search.toLowerCase())
  )

  // ─── Render ──────────────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-[#0A0A0A]">
      {/* Header */}
      <div
        className="fixed top-0 left-0 right-0 z-50 px-4 py-3 flex items-center gap-3"
        style={{ background: '#111', borderBottom: '1px solid rgba(255,255,255,0.08)' }}
      >
        <Link
          href="/admin"
          className="p-2 rounded-xl text-gray-400 hover:text-white transition-colors"
          style={{ background: 'rgba(255,255,255,0.06)' }}
          aria-label="Volver al panel"
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
            <path d="M19 12H5M5 12l7 7M5 12l7-7" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </Link>
        <div>
          <h1 className="text-white font-extrabold text-lg leading-none">Gestión de Productos</h1>
          <p className="text-gray-400 text-xs mt-0.5">{productos.length} productos</p>
        </div>
      </div>

      <main className="pt-20 pb-10 px-4 max-w-5xl mx-auto">
        {/* Error de carga */}
        {fetchError && (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <p className="text-white font-extrabold text-lg mb-2">😕 {fetchError}</p>
            <button
              onClick={fetchData}
              className="px-6 py-3 rounded-2xl text-white font-extrabold text-sm mt-3 transition-all active:scale-95"
              style={{ background: 'linear-gradient(135deg, #F28500 0%, #D4700A 100%)' }}
            >
              Reintentar
            </button>
          </div>
        )}

        {loading && (
          <div className="flex flex-col gap-3 mt-4 animate-pulse">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="h-16 rounded-2xl" style={{ background: '#1A1A1A' }} />
            ))}
          </div>
        )}

        {!loading && !fetchError && (
          <div className="flex flex-col lg:flex-row gap-5 mt-4">
            {/* ── Lista de productos ──────────────────────────────────────── */}
            <div className="flex-1 min-w-0">
              {/* Buscador */}
              <div className="relative mb-3">
                <svg className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" width="16" height="16" viewBox="0 0 24 24" fill="none">
                  <circle cx="11" cy="11" r="8" stroke="currentColor" strokeWidth="2" />
                  <path d="M21 21l-4.35-4.35" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                </svg>
                <input
                  type="text"
                  placeholder="Buscar producto..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="w-full rounded-2xl pl-9 pr-4 py-3 text-sm text-white focus:outline-none focus:ring-1 focus:ring-orange-500"
                  style={{ background: '#1A1A1A', border: '1px solid rgba(255,255,255,0.06)' }}
                />
              </div>

              {productosFiltrados.length === 0 ? (
                <div className="text-center py-16">
                  <p className="text-gray-400 font-semibold">Sin resultados para "{search}"</p>
                </div>
              ) : (
                <div className="flex flex-col gap-2">
                  {productosFiltrados.map((producto) => {
                    const activo = seleccionado?.id === producto.id
                    return (
                      <button
                        key={producto.id}
                        onClick={() => activo ? cerrarEdicion() : abrirEdicion(producto)}
                        className="w-full flex items-center gap-3 rounded-2xl p-3 text-left transition-all active:scale-[0.99]"
                        style={{
                          background: activo ? 'rgba(242,133,0,0.12)' : '#1A1A1A',
                          border: `1px solid ${activo ? 'rgba(242,133,0,0.4)' : 'rgba(255,255,255,0.06)'}`,
                        }}
                      >
                        {/* Imagen miniatura */}
                        <div
                          className="w-12 h-12 rounded-xl flex-shrink-0 flex items-center justify-center text-xl overflow-hidden"
                          style={{ background: '#2A2A2A' }}
                        >
                          {producto.imagen_url ? (
                            <img src={producto.imagen_url} alt={producto.nombre} className="w-full h-full object-cover" />
                          ) : (
                            <span>🌮</span>
                          )}
                        </div>

                        {/* Info */}
                        <div className="flex-1 min-w-0">
                          <p className="text-white font-extrabold text-sm truncate">{producto.nombre}</p>
                          <p className="text-gray-400 text-xs">{producto.categorias.nombre}</p>
                        </div>

                        {/* Precio + estado */}
                        <div className="text-right flex-shrink-0">
                          <p className="font-extrabold text-sm" style={{ color: '#F28500' }}>
                            ${parseFloat(producto.precio_base).toFixed(2)}
                          </p>
                          <span
                            className="text-xs font-bold"
                            style={{ color: producto.disponible ? '#27AE60' : '#9CA3AF' }}
                          >
                            {producto.disponible ? 'Activo' : 'Inactivo'}
                          </span>
                        </div>

                        {/* Chevron */}
                        <svg
                          width="14"
                          height="14"
                          viewBox="0 0 24 24"
                          fill="none"
                          className="text-gray-600 flex-shrink-0 transition-transform duration-200"
                          style={{ transform: activo ? 'rotate(90deg)' : 'rotate(0)' }}
                        >
                          <path d="M9 18l6-6-6-6" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
                        </svg>
                      </button>
                    )
                  })}
                </div>
              )}
            </div>

            {/* ── Panel de edición ────────────────────────────────────────── */}
            {seleccionado && (
              <div
                className="w-full lg:w-96 flex-shrink-0 rounded-3xl p-5 self-start lg:sticky lg:top-24"
                style={{ background: '#141414', border: '1px solid rgba(255,255,255,0.08)' }}
              >
                {/* Cabecera del panel */}
                <div className="flex items-center justify-between mb-5">
                  <div>
                    <p className="text-xs font-bold uppercase tracking-widest" style={{ color: '#F28500' }}>Editando</p>
                    <h2 className="text-white font-extrabold text-lg leading-tight truncate max-w-[220px]">
                      {seleccionado.nombre}
                    </h2>
                  </div>
                  <button
                    onClick={cerrarEdicion}
                    aria-label="Cerrar editor"
                    className="text-gray-400 hover:text-white transition-colors rounded-xl flex items-center justify-center"
                    style={{ background: 'rgba(255,255,255,0.06)', width: 36, height: 36 }}
                  >
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                      <path d="M18 6L6 18M6 6l12 12" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" />
                    </svg>
                  </button>
                </div>

                {/* ── Sección imagen ─────────────────────────────────────── */}
                <section className="mb-5">
                  <p className="text-xs font-extrabold uppercase tracking-widest text-gray-400 mb-3">Imagen</p>

                  {/* Preview */}
                  <div
                    className="relative w-full h-44 rounded-2xl overflow-hidden flex items-center justify-center mb-3"
                    style={{ background: '#2A2A2A', border: '1px solid rgba(255,255,255,0.06)' }}
                  >
                    {imagenPreview ? (
                      <>
                        <img src={imagenPreview} alt="Preview" className="w-full h-full object-cover" />
                        <div className="absolute inset-0 flex items-end p-2">
                          <span
                            className="text-xs font-bold px-2 py-1 rounded-lg"
                            style={{ background: 'rgba(0,0,0,0.7)', color: '#F28500' }}
                          >
                            Nueva imagen — sin guardar
                          </span>
                        </div>
                      </>
                    ) : seleccionado.imagen_url ? (
                      <img src={seleccionado.imagen_url} alt={seleccionado.nombre} className="w-full h-full object-cover" />
                    ) : (
                      <div className="flex flex-col items-center gap-2 text-gray-500">
                        <svg width="36" height="36" viewBox="0 0 24 24" fill="none">
                          <rect x="3" y="3" width="18" height="18" rx="3" stroke="currentColor" strokeWidth="1.5" />
                          <circle cx="8.5" cy="8.5" r="1.5" fill="currentColor" />
                          <path d="M21 15l-5-5L5 21" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                        </svg>
                        <span className="text-xs font-semibold">Sin imagen</span>
                      </div>
                    )}
                  </div>

                  {/* Input file oculto */}
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/jpeg,image/png,image/webp"
                    className="hidden"
                    id="file-input"
                    onChange={handleFileChange}
                  />

                  <div className="flex gap-2">
                    {/* Botón seleccionar archivo */}
                    <label
                      htmlFor="file-input"
                      className="flex-1 py-2.5 rounded-xl text-sm font-extrabold text-center cursor-pointer transition-all active:scale-95"
                      style={{ background: 'rgba(255,255,255,0.08)', color: '#9CA3AF' }}
                    >
                      {imagenFile ? `📎 ${imagenFile.name.slice(0, 18)}…` : 'Seleccionar imagen'}
                    </label>

                    {/* Botón subir */}
                    <button
                      onClick={subirImagen}
                      disabled={!imagenFile || subiendoImagen}
                      className="px-4 py-2.5 rounded-xl text-white text-sm font-extrabold transition-all active:scale-95 disabled:opacity-40 disabled:cursor-not-allowed"
                      style={{ background: 'linear-gradient(135deg, #F28500 0%, #D4700A 100%)' }}
                    >
                      {subiendoImagen ? (
                        <span className="flex items-center gap-1.5">
                          <svg className="animate-spin" width="14" height="14" viewBox="0 0 24 24" fill="none">
                            <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" strokeDasharray="32" strokeDashoffset="12" strokeLinecap="round" />
                          </svg>
                          Subiendo
                        </span>
                      ) : (
                        'Subir'
                      )}
                    </button>
                  </div>

                  {imagenFile && !imagenError && (
                    <p className="text-gray-500 text-xs mt-1.5 font-medium">
                      {(imagenFile.size / 1024).toFixed(0)} KB — {imagenFile.type.split('/')[1].toUpperCase()}
                    </p>
                  )}
                  {imagenError && (
                    <p className="text-red-400 text-xs font-bold mt-1.5">{imagenError}</p>
                  )}
                </section>

                <div className="h-px mb-5" style={{ background: 'rgba(255,255,255,0.06)' }} />

                {/* ── Sección datos ──────────────────────────────────────── */}
                <section>
                  <p className="text-xs font-extrabold uppercase tracking-widest text-gray-400 mb-3">Datos del producto</p>

                  <div className="space-y-3">
                    {/* Nombre */}
                    <div>
                      <label className="block text-xs font-semibold text-gray-300 mb-1" htmlFor="f-nombre">
                        Nombre
                      </label>
                      <input
                        id="f-nombre"
                        type="text"
                        value={form.nombre}
                        onChange={(e) => handleField('nombre', e.target.value)}
                        className="w-full rounded-xl px-3 py-2.5 text-sm text-white focus:outline-none focus:ring-1 focus:ring-orange-500 transition"
                        style={{
                          background: '#0A0A0A',
                          border: `1px solid ${formErrors.nombre ? 'rgba(231,76,60,0.6)' : 'rgba(255,255,255,0.12)'}`,
                        }}
                        placeholder="Nombre del producto"
                      />
                      {formErrors.nombre && (
                        <p className="text-red-400 text-xs mt-1 font-semibold">{formErrors.nombre}</p>
                      )}
                    </div>

                    {/* Descripción */}
                    <div>
                      <label className="block text-xs font-semibold text-gray-300 mb-1" htmlFor="f-desc">
                        Descripción <span className="text-gray-500">(opcional)</span>
                      </label>
                      <textarea
                        id="f-desc"
                        value={form.descripcion}
                        onChange={(e) => handleField('descripcion', e.target.value)}
                        rows={2}
                        className="w-full rounded-xl px-3 py-2.5 text-sm text-white resize-none focus:outline-none focus:ring-1 focus:ring-orange-500 transition"
                        style={{ background: '#0A0A0A', border: '1px solid rgba(255,255,255,0.12)' }}
                        placeholder="Descripción breve"
                      />
                    </div>

                    {/* Precio */}
                    <div>
                      <label className="block text-xs font-semibold text-gray-300 mb-1" htmlFor="f-precio">
                        Precio base (MXN)
                      </label>
                      <div className="relative">
                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm font-bold">$</span>
                        <input
                          id="f-precio"
                          type="number"
                          min="0.01"
                          step="0.50"
                          value={form.precioBase}
                          onChange={(e) => handleField('precioBase', e.target.value)}
                          className="w-full rounded-xl pl-7 pr-3 py-2.5 text-sm text-white focus:outline-none focus:ring-1 focus:ring-orange-500 transition"
                          style={{
                            background: '#0A0A0A',
                            border: `1px solid ${formErrors.precioBase ? 'rgba(231,76,60,0.6)' : 'rgba(255,255,255,0.12)'}`,
                          }}
                          placeholder="25.00"
                        />
                      </div>
                      {formErrors.precioBase && (
                        <p className="text-red-400 text-xs mt-1 font-semibold">{formErrors.precioBase}</p>
                      )}
                    </div>

                    {/* Categoría */}
                    <div>
                      <label className="block text-xs font-semibold text-gray-300 mb-1" htmlFor="f-cat">
                        Categoría
                      </label>
                      <select
                        id="f-cat"
                        value={form.categoriaId}
                        onChange={(e) => handleField('categoriaId', e.target.value)}
                        className="w-full rounded-xl px-3 py-2.5 text-sm text-white focus:outline-none focus:ring-1 focus:ring-orange-500 transition appearance-none"
                        style={{
                          background: '#0A0A0A',
                          border: `1px solid ${formErrors.categoriaId ? 'rgba(231,76,60,0.6)' : 'rgba(255,255,255,0.12)'}`,
                        }}
                      >
                        <option value="">Selecciona una categoría</option>
                        {categorias.map((c) => (
                          <option key={c.id} value={c.id}>{c.nombre}</option>
                        ))}
                      </select>
                      {formErrors.categoriaId && (
                        <p className="text-red-400 text-xs mt-1 font-semibold">{formErrors.categoriaId}</p>
                      )}
                    </div>

                    {/* Disponible */}
                    <div className="flex items-center justify-between py-1">
                      <div>
                        <p className="text-sm font-extrabold text-white">Disponible</p>
                        <p className="text-xs text-gray-500">Visible en el menú para clientes</p>
                      </div>
                      <button
                        type="button"
                        onClick={() => handleField('disponible', !form.disponible)}
                        role="switch"
                        aria-checked={form.disponible}
                        className="relative w-12 h-6 rounded-full transition-colors duration-200 flex-shrink-0"
                        style={{ background: form.disponible ? '#F28500' : 'rgba(255,255,255,0.12)' }}
                      >
                        <span
                          className="absolute top-0.5 w-5 h-5 rounded-full bg-white shadow transition-transform duration-200"
                          style={{ transform: form.disponible ? 'translateX(26px)' : 'translateX(2px)' }}
                        />
                      </button>
                    </div>
                  </div>

                  {/* Botón guardar */}
                  <button
                    onClick={handleGuardar}
                    disabled={guardando}
                    className="w-full mt-5 py-3.5 rounded-2xl text-white font-extrabold text-sm transition-all active:scale-95 disabled:opacity-50 flex items-center justify-center gap-2"
                    style={{ background: 'linear-gradient(135deg, #F28500 0%, #D4700A 100%)', boxShadow: '0 4px 16px rgba(242,133,0,0.35)' }}
                  >
                    {guardando ? (
                      <>
                        <svg className="animate-spin" width="16" height="16" viewBox="0 0 24 24" fill="none">
                          <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" strokeDasharray="32" strokeDashoffset="12" strokeLinecap="round" />
                        </svg>
                        Guardando...
                      </>
                    ) : (
                      'Guardar cambios'
                    )}
                  </button>
                </section>
              </div>
            )}
          </div>
        )}
      </main>
    </div>
  )
}
