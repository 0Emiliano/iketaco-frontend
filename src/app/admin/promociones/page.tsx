'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import apiClient from '@/lib/api/client'
import { toast } from '@/lib/toast'
import type { Promocion, Combo } from '@/types'

// ─── Constantes ───────────────────────────────────────────────────────────────
const DIAS = [
  { value: 'lunes',     label: 'Lunes' },
  { value: 'martes',    label: 'Martes' },
  { value: 'miercoles', label: 'Miércoles' },
  { value: 'jueves',    label: 'Jueves' },
  { value: 'viernes',   label: 'Viernes' },
  { value: 'sabado',    label: 'Sábado' },
  { value: 'domingo',   label: 'Domingo' },
]

// ─── Tipos del formulario ─────────────────────────────────────────────────────
interface PromoForm {
  nombre: string
  descripcion: string
  tipoDescuento: 'porcentaje' | 'monto_fijo'
  valor: string
  comboId: string
  soloDia: string
  fechaInicio: string
  fechaFin: string
  activo: boolean
}

const FORM_VACIO: PromoForm = {
  nombre: '',
  descripcion: '',
  tipoDescuento: 'porcentaje',
  valor: '',
  comboId: '',
  soloDia: '',
  fechaInicio: '',
  fechaFin: '',
  activo: true,
}

type FormErrors = Partial<Record<keyof PromoForm, string>>

function validar(form: PromoForm): FormErrors {
  const errors: FormErrors = {}
  if (!form.nombre.trim()) errors.nombre = 'El nombre es obligatorio'
  if (!form.valor || isNaN(Number(form.valor)) || Number(form.valor) <= 0)
    errors.valor = 'Ingresa un valor mayor a 0'
  if (form.tipoDescuento === 'porcentaje' && Number(form.valor) > 100)
    errors.valor = 'El porcentaje no puede superar 100'
  if (form.fechaInicio && form.fechaFin && form.fechaInicio > form.fechaFin)
    errors.fechaFin = 'La fecha de fin debe ser mayor a la de inicio'
  return errors
}

// ─── Helpers visuales ─────────────────────────────────────────────────────────
function badgeTipo(tipo: 'porcentaje' | 'monto_fijo', valor: string) {
  return tipo === 'porcentaje'
    ? `${parseFloat(valor).toFixed(0)}%`
    : `$${parseFloat(valor).toFixed(2)}`
}

function labelDia(dia: string | null) {
  if (!dia) return null
  return DIAS.find((d) => d.value === dia)?.label ?? dia
}

// ─── Componente principal ─────────────────────────────────────────────────────
export default function AdminPromocionesPage() {
  const router = useRouter()

  const [promociones, setPromociones] = useState<Promocion[]>([])
  const [combos, setCombos] = useState<Combo[]>([])
  const [loading, setLoading] = useState(true)
  const [fetchError, setFetchError] = useState('')

  const [seleccionada, setSeleccionada] = useState<Promocion | null>(null)
  const [modo, setModo] = useState<'editar' | 'nuevo'>('editar')

  const [form, setForm] = useState<PromoForm>(FORM_VACIO)
  const [formErrors, setFormErrors] = useState<FormErrors>({})
  const [guardando, setGuardando] = useState(false)
  const [toggling, setToggling] = useState(false)

  const [search, setSearch] = useState('')

  // ─── Auth guard ─────────────────────────────────────────────────────────────
  useEffect(() => {
    const raw = localStorage.getItem('usuario')
    if (!raw) { router.push('/login'); return }
    const u = JSON.parse(raw)
    if (u.rol !== 'gerente') { router.push('/menu'); return }
  }, [router])

  // ─── Carga inicial ──────────────────────────────────────────────────────────
  const fetchData = useCallback(async () => {
    setLoading(true)
    setFetchError('')
    try {
      const [promoRes, comboRes] = await Promise.all([
        apiClient.get('/admin/menu/promociones'),
        apiClient.get('/admin/menu/combos-all'),
      ])
      setPromociones(promoRes.data)
      setCombos(comboRes.data)
    } catch {
      setFetchError('No se pudieron cargar las promociones.')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { fetchData() }, [fetchData])

  // ─── Panel: abrir / cerrar ──────────────────────────────────────────────────
  const promoAForm = (p: Promocion): PromoForm => ({
    nombre: p.nombre,
    descripcion: p.descripcion ?? '',
    tipoDescuento: p.tipo_descuento,
    valor: p.valor,
    comboId: p.combo_id ? String(p.combo_id) : '',
    soloDia: p.solo_dia ?? '',
    fechaInicio: p.fecha_inicio ? p.fecha_inicio.substring(0, 10) : '',
    fechaFin: p.fecha_fin ? p.fecha_fin.substring(0, 10) : '',
    activo: p.activo,
  })

  const abrirEdicion = (p: Promocion) => {
    setModo('editar')
    setSeleccionada(p)
    setForm(promoAForm(p))
    setFormErrors({})
  }

  const abrirNuevo = () => {
    setModo('nuevo')
    setSeleccionada(null)
    setForm(FORM_VACIO)
    setFormErrors({})
  }

  const cerrarPanel = () => {
    setSeleccionada(null)
    setModo('editar')
    setFormErrors({})
  }

  // ─── Cambio de campo ────────────────────────────────────────────────────────
  const handleField = <K extends keyof PromoForm>(field: K, value: PromoForm[K]) => {
    setForm((prev) => ({ ...prev, [field]: value }))
    if (formErrors[field]) setFormErrors((prev) => ({ ...prev, [field]: undefined }))
  }

  // ─── Guardar ────────────────────────────────────────────────────────────────
  const handleGuardar = async () => {
    const errors = validar(form)
    if (Object.keys(errors).length > 0) { setFormErrors(errors); return }

    setGuardando(true)
    try {
      const payload = {
        nombre: form.nombre.trim(),
        descripcion: form.descripcion.trim() || null,
        tipoDescuento: form.tipoDescuento,
        valor: parseFloat(form.valor),
        comboId: form.comboId ? parseInt(form.comboId) : null,
        soloDia: form.soloDia || null,
        fechaInicio: form.fechaInicio || null,
        fechaFin: form.fechaFin || null,
        activo: form.activo,
      }

      if (modo === 'nuevo') {
        const res = await apiClient.post('/admin/menu/promociones', payload)
        const creada: Promocion = res.data
        setPromociones((prev) => [creada, ...prev])
        setModo('editar')
        setSeleccionada(creada)
        toast('Promoción creada correctamente')
      } else {
        if (!seleccionada) return
        const res = await apiClient.patch(`/admin/menu/promociones/${seleccionada.id}`, payload)
        const actualizada: Promocion = res.data
        setPromociones((prev) => prev.map((p) => (p.id === actualizada.id ? actualizada : p)))
        setSeleccionada(actualizada)
        toast('Promoción actualizada correctamente')
      }
    } catch (err: any) {
      toast(err?.response?.data?.error ?? 'Error al guardar', 'error')
    } finally {
      setGuardando(false)
    }
  }

  // ─── Toggle activo ───────────────────────────────────────────────────────────
  const toggleActivo = async () => {
    if (!seleccionada) return
    setToggling(true)
    try {
      const res = await apiClient.patch(`/admin/menu/promociones/${seleccionada.id}`, {
        activo: !seleccionada.activo,
      })
      const actualizada: Promocion = res.data
      setPromociones((prev) => prev.map((p) => (p.id === actualizada.id ? actualizada : p)))
      setSeleccionada(actualizada)
      setForm((prev) => ({ ...prev, activo: actualizada.activo }))
      toast(actualizada.activo ? 'Promoción activada' : 'Promoción desactivada')
    } catch (err: any) {
      toast(err?.response?.data?.error ?? 'Error al cambiar estado', 'error')
    } finally {
      setToggling(false)
    }
  }

  // ─── Lista filtrada ──────────────────────────────────────────────────────────
  const filtradas = promociones.filter((p) =>
    p.nombre.toLowerCase().includes(search.toLowerCase())
  )

  const panelAbierto = seleccionada !== null || modo === 'nuevo'

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
        <div className="flex-1 min-w-0">
          <h1 className="text-white font-extrabold text-lg leading-none">Promociones</h1>
          <p className="text-gray-400 text-xs mt-0.5">{promociones.length} en total</p>
        </div>
        <button
          onClick={abrirNuevo}
          className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-white text-sm font-extrabold transition-all active:scale-95 flex-shrink-0"
          style={{ background: 'linear-gradient(135deg, #F28500 0%, #D4700A 100%)' }}
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
            <path d="M12 5v14M5 12h14" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" />
          </svg>
          Nueva
        </button>
      </div>

      <main className="pt-20 pb-24 px-4 max-w-5xl mx-auto">
        {/* Error */}
        {fetchError && (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <p className="text-white font-extrabold text-lg mb-2">{fetchError}</p>
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
            {[...Array(5)].map((_, i) => (
              <div key={i} className="h-16 rounded-2xl" style={{ background: '#1A1A1A' }} />
            ))}
          </div>
        )}

        {!loading && !fetchError && (
          <div className="flex flex-col lg:flex-row gap-5 mt-4">
            {/* ── Lista ─────────────────────────────────────────────────────── */}
            <div className="flex-1 min-w-0">
              {/* Buscador */}
              <div className="relative mb-3">
                <svg className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" width="16" height="16" viewBox="0 0 24 24" fill="none">
                  <circle cx="11" cy="11" r="8" stroke="currentColor" strokeWidth="2" />
                  <path d="M21 21l-4.35-4.35" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                </svg>
                <input
                  type="text"
                  placeholder="Buscar promoción..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="w-full rounded-2xl pl-9 pr-4 py-3 text-sm text-white focus:outline-none focus:ring-1 focus:ring-orange-500"
                  style={{ background: '#1A1A1A', border: '1px solid rgba(255,255,255,0.06)' }}
                />
              </div>

              {filtradas.length === 0 ? (
                <div className="text-center py-16">
                  <p className="text-gray-400 font-semibold">
                    {search ? `Sin resultados para "${search}"` : 'No hay promociones aún'}
                  </p>
                </div>
              ) : (
                <div className="flex flex-col gap-2">
                  {filtradas.map((promo) => {
                    const activo = seleccionada?.id === promo.id
                    const dia = labelDia(promo.solo_dia)
                    return (
                      <button
                        key={promo.id}
                        onClick={() => activo ? cerrarPanel() : abrirEdicion(promo)}
                        className="w-full flex items-center gap-3 rounded-2xl p-3 text-left transition-all active:scale-[0.99]"
                        style={{
                          background: activo ? 'rgba(242,133,0,0.12)' : '#1A1A1A',
                          border: `1px solid ${activo ? 'rgba(242,133,0,0.4)' : 'rgba(255,255,255,0.06)'}`,
                          opacity: promo.activo ? 1 : 0.5,
                        }}
                      >
                        {/* Ícono de tipo */}
                        <div
                          className="w-12 h-12 rounded-xl flex-shrink-0 flex items-center justify-center text-lg font-extrabold"
                          style={{
                            background: promo.tipo_descuento === 'porcentaje'
                              ? 'rgba(242,133,0,0.15)'
                              : 'rgba(39,174,96,0.15)',
                            color: promo.tipo_descuento === 'porcentaje' ? '#F28500' : '#27AE60',
                          }}
                        >
                          {promo.tipo_descuento === 'porcentaje' ? '%' : '$'}
                        </div>

                        {/* Info */}
                        <div className="flex-1 min-w-0">
                          <p className="text-white font-extrabold text-sm truncate">{promo.nombre}</p>
                          <p className="text-gray-400 text-xs truncate">
                            {dia ? `Solo ${dia}` : 'Todos los días'}
                            {promo.combos ? ` · ${promo.combos.nombre}` : ''}
                          </p>
                        </div>

                        {/* Valor + badge */}
                        <div className="text-right flex-shrink-0 flex flex-col items-end gap-1">
                          <p className="font-extrabold text-sm" style={{ color: '#F28500' }}>
                            {badgeTipo(promo.tipo_descuento, promo.valor)}
                          </p>
                          <span
                            className="text-xs font-bold px-1.5 py-0.5 rounded-full"
                            style={
                              promo.activo
                                ? { background: 'rgba(39,174,96,0.15)', color: '#27AE60' }
                                : { background: 'rgba(156,163,175,0.15)', color: '#9CA3AF' }
                            }
                          >
                            {promo.activo ? 'Activa' : 'Inactiva'}
                          </span>
                        </div>

                        {/* Chevron */}
                        <svg
                          width="14" height="14" viewBox="0 0 24 24" fill="none"
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

            {/* ── Panel de edición / creación ─────────────────────────────── */}
            {panelAbierto && (
              <div
                className="w-full lg:w-96 flex-shrink-0 rounded-3xl p-5 self-start lg:sticky lg:top-24"
                style={{ background: '#141414', border: '1px solid rgba(255,255,255,0.08)' }}
              >
                {/* Cabecera */}
                <div className="flex items-center justify-between mb-5">
                  <div>
                    <p className="text-xs font-bold uppercase tracking-widest" style={{ color: '#F28500' }}>
                      {modo === 'nuevo' ? 'Nueva promoción' : 'Editando'}
                    </p>
                    <h2 className="text-white font-extrabold text-lg leading-tight truncate max-w-[220px]">
                      {modo === 'nuevo' ? 'Agregar promoción' : seleccionada!.nombre}
                    </h2>
                  </div>
                  <button
                    onClick={cerrarPanel}
                    aria-label="Cerrar panel"
                    className="text-gray-400 hover:text-white transition-colors rounded-xl flex items-center justify-center"
                    style={{ background: 'rgba(255,255,255,0.06)', width: 36, height: 36 }}
                  >
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                      <path d="M18 6L6 18M6 6l12 12" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" />
                    </svg>
                  </button>
                </div>

                <div className="space-y-3">
                  {/* Nombre */}
                  <div>
                    <label className="block text-xs font-semibold text-gray-300 mb-1">Nombre</label>
                    <input
                      type="text"
                      value={form.nombre}
                      onChange={(e) => handleField('nombre', e.target.value)}
                      className="w-full rounded-xl px-3 py-2.5 text-sm text-white focus:outline-none focus:ring-1 focus:ring-orange-500"
                      style={{
                        background: '#0A0A0A',
                        border: `1px solid ${formErrors.nombre ? 'rgba(231,76,60,0.6)' : 'rgba(255,255,255,0.12)'}`,
                      }}
                      placeholder="Ej. Martes de tacos 2x1"
                    />
                    {formErrors.nombre && <p className="text-red-400 text-xs mt-1 font-semibold">{formErrors.nombre}</p>}
                  </div>

                  {/* Descripción */}
                  <div>
                    <label className="block text-xs font-semibold text-gray-300 mb-1">
                      Descripción <span className="text-gray-500">(opcional)</span>
                    </label>
                    <textarea
                      value={form.descripcion}
                      onChange={(e) => handleField('descripcion', e.target.value)}
                      rows={2}
                      className="w-full rounded-xl px-3 py-2.5 text-sm text-white resize-none focus:outline-none focus:ring-1 focus:ring-orange-500"
                      style={{ background: '#0A0A0A', border: '1px solid rgba(255,255,255,0.12)' }}
                      placeholder="Descripción visible al cliente"
                    />
                  </div>

                  {/* Tipo de descuento */}
                  <div>
                    <label className="block text-xs font-semibold text-gray-300 mb-1">Tipo de descuento</label>
                    <div className="flex gap-2">
                      {(['porcentaje', 'monto_fijo'] as const).map((tipo) => (
                        <button
                          key={tipo}
                          type="button"
                          onClick={() => handleField('tipoDescuento', tipo)}
                          className="flex-1 py-2.5 rounded-xl text-sm font-extrabold transition-all"
                          style={
                            form.tipoDescuento === tipo
                              ? { background: 'linear-gradient(135deg, #F28500 0%, #D4700A 100%)', color: '#fff' }
                              : { background: 'rgba(255,255,255,0.06)', color: '#9CA3AF' }
                          }
                        >
                          {tipo === 'porcentaje' ? '% Porcentaje' : '$ Monto fijo'}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Valor */}
                  <div>
                    <label className="block text-xs font-semibold text-gray-300 mb-1">
                      {form.tipoDescuento === 'porcentaje' ? 'Porcentaje (%)' : 'Monto fijo (MXN)'}
                    </label>
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm font-bold">
                        {form.tipoDescuento === 'porcentaje' ? '%' : '$'}
                      </span>
                      <input
                        type="number"
                        min="0.01"
                        max={form.tipoDescuento === 'porcentaje' ? 100 : 9999.99}
                        step="0.01"
                        value={form.valor}
                        onChange={(e) => handleField('valor', e.target.value)}
                        className="w-full rounded-xl pl-7 pr-3 py-2.5 text-sm text-white focus:outline-none focus:ring-1 focus:ring-orange-500"
                        style={{
                          background: '#0A0A0A',
                          border: `1px solid ${formErrors.valor ? 'rgba(231,76,60,0.6)' : 'rgba(255,255,255,0.12)'}`,
                        }}
                        placeholder={form.tipoDescuento === 'porcentaje' ? '10' : '20.00'}
                      />
                    </div>
                    {formErrors.valor && <p className="text-red-400 text-xs mt-1 font-semibold">{formErrors.valor}</p>}
                  </div>

                  {/* Separador */}
                  <div className="h-px" style={{ background: 'rgba(255,255,255,0.06)' }} />

                  {/* Combo vinculado */}
                  <div>
                    <label className="block text-xs font-semibold text-gray-300 mb-1">
                      Combo vinculado <span className="text-gray-500">(opcional)</span>
                    </label>
                    <select
                      value={form.comboId}
                      onChange={(e) => handleField('comboId', e.target.value)}
                      className="w-full rounded-xl px-3 py-2.5 text-sm text-white focus:outline-none focus:ring-1 focus:ring-orange-500 appearance-none"
                      style={{ background: '#0A0A0A', border: '1px solid rgba(255,255,255,0.12)' }}
                    >
                      <option value="">Sin combo específico</option>
                      {combos.map((c) => (
                        <option key={c.id} value={c.id}>{c.nombre}</option>
                      ))}
                    </select>
                  </div>

                  {/* Solo día */}
                  <div>
                    <label className="block text-xs font-semibold text-gray-300 mb-1">
                      Día específico <span className="text-gray-500">(opcional)</span>
                    </label>
                    <select
                      value={form.soloDia}
                      onChange={(e) => handleField('soloDia', e.target.value)}
                      className="w-full rounded-xl px-3 py-2.5 text-sm text-white focus:outline-none focus:ring-1 focus:ring-orange-500 appearance-none"
                      style={{ background: '#0A0A0A', border: '1px solid rgba(255,255,255,0.12)' }}
                    >
                      <option value="">Todos los días</option>
                      {DIAS.map((d) => (
                        <option key={d.value} value={d.value}>{d.label}</option>
                      ))}
                    </select>
                  </div>

                  {/* Fechas */}
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="block text-xs font-semibold text-gray-300 mb-1">Inicio</label>
                      <input
                        type="date"
                        value={form.fechaInicio}
                        onChange={(e) => handleField('fechaInicio', e.target.value)}
                        className="w-full rounded-xl px-3 py-2.5 text-sm text-white focus:outline-none focus:ring-1 focus:ring-orange-500"
                        style={{ background: '#0A0A0A', border: '1px solid rgba(255,255,255,0.12)', colorScheme: 'dark' }}
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-gray-300 mb-1">Fin</label>
                      <input
                        type="date"
                        value={form.fechaFin}
                        onChange={(e) => handleField('fechaFin', e.target.value)}
                        className="w-full rounded-xl px-3 py-2.5 text-sm text-white focus:outline-none focus:ring-1 focus:ring-orange-500"
                        style={{
                          background: '#0A0A0A',
                          border: `1px solid ${formErrors.fechaFin ? 'rgba(231,76,60,0.6)' : 'rgba(255,255,255,0.12)'}`,
                          colorScheme: 'dark',
                        }}
                      />
                      {formErrors.fechaFin && (
                        <p className="text-red-400 text-xs mt-1 font-semibold">{formErrors.fechaFin}</p>
                      )}
                    </div>
                  </div>

                  {/* Activo toggle */}
                  <div className="flex items-center justify-between py-1">
                    <div>
                      <p className="text-sm font-extrabold text-white">Activa</p>
                      <p className="text-xs text-gray-500">Visible en el menú para clientes</p>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleField('activo', !form.activo)}
                      role="switch"
                      aria-checked={form.activo}
                      className="relative w-12 h-6 rounded-full transition-colors duration-200 flex-shrink-0"
                      style={{ background: form.activo ? '#F28500' : 'rgba(255,255,255,0.12)' }}
                    >
                      <span
                        className="absolute top-0.5 w-5 h-5 rounded-full bg-white shadow transition-transform duration-200"
                        style={{ transform: form.activo ? 'translateX(26px)' : 'translateX(2px)' }}
                      />
                    </button>
                  </div>
                </div>

                {/* Guardar */}
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
                  ) : modo === 'nuevo' ? 'Crear promoción' : 'Guardar cambios'}
                </button>

                {/* Toggle activo — solo en edición */}
                {modo === 'editar' && seleccionada && (
                  <button
                    onClick={toggleActivo}
                    disabled={toggling}
                    className="w-full mt-2 py-3 rounded-2xl font-extrabold text-sm transition-all active:scale-95 disabled:opacity-50"
                    style={
                      seleccionada.activo
                        ? { background: 'rgba(231,76,60,0.12)', color: '#E74C3C', border: '1px solid rgba(231,76,60,0.3)' }
                        : { background: 'rgba(39,174,96,0.12)', color: '#27AE60', border: '1px solid rgba(39,174,96,0.3)' }
                    }
                  >
                    {toggling
                      ? 'Actualizando...'
                      : seleccionada.activo
                      ? 'Desactivar promoción'
                      : 'Activar promoción'}
                  </button>
                )}
              </div>
            )}
          </div>
        )}
      </main>
    </div>
  )
}
