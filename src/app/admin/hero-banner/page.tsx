'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'
import apiClient from '@/lib/api/client'
import { toast } from '@/lib/toast'
import type { Promocion } from '@/types'

interface BannerConfig {
  titulo: string
  subtitulo: string
  badge: string
  featuredPromoId: number | null
  imagenUrl: string | null
}

const DEFAULTS: BannerConfig = {
  titulo: '3 TACOS + BEBIDA',
  subtitulo: '¡Disfruta la mejor birria!',
  badge: 'Bienvenido',
  featuredPromoId: null,
  imagenUrl: null,
}

const LOCAL_KEY = 'heroBannerConfig'

function loadLocal(): BannerConfig {
  try {
    const raw = localStorage.getItem(LOCAL_KEY)
    if (raw) return { ...DEFAULTS, ...JSON.parse(raw) }
  } catch { /* ignore */ }
  return { ...DEFAULTS }
}

function saveLocal(cfg: BannerConfig) {
  try {
    localStorage.setItem(LOCAL_KEY, JSON.stringify(cfg))
  } catch { /* ignore */ }
}

// ─── Inline banner preview ────────────────────────────────────────────────────

function BannerPreview({ config, promo }: { config: BannerConfig; promo: Promocion | null }) {
  const titulo = promo ? promo.nombre.toUpperCase() : config.titulo.toUpperCase()
  const subtitulo = promo?.descripcion ?? config.subtitulo
  const badge = promo ? 'Promo del día' : config.badge
  const precio = promo?.combos?.precio

  return (
    <div className="relative w-full overflow-hidden rounded-3xl shadow-2xl" style={{ minHeight: 220 }}>
      {/* Background */}
      {config.imagenUrl ? (
        <>
          <div
            className="absolute inset-0 bg-cover bg-center"
            style={{ backgroundImage: `url(${config.imagenUrl})` }}
          />
          <div
            className="absolute inset-0"
            style={{ background: 'linear-gradient(165deg, rgba(58,24,0,0.72) 0%, rgba(18,8,0,0.85) 100%)' }}
          />
        </>
      ) : (
        <>
          <div
            className="absolute inset-0"
            style={{
              background: `
                radial-gradient(ellipse at 20% 35%, #9B4F00 0%, transparent 55%),
                radial-gradient(ellipse at 75% 65%, #6B3000 0%, transparent 50%),
                radial-gradient(ellipse at 55% 10%, #C06500 0%, transparent 45%),
                linear-gradient(165deg, #3A1800 0%, #120800 100%)
              `,
            }}
          />
          {[
            { size: 80, x: 65, y: 20, blur: 30, opacity: 0.18 },
            { size: 50, x: 80, y: 55, blur: 20, opacity: 0.12 },
            { size: 100, x: 5,  y: 60, blur: 40, opacity: 0.15 },
          ].map((b, i) => (
            <div
              key={i}
              className="absolute rounded-full"
              style={{
                width: b.size, height: b.size,
                background: '#F28500',
                left: `${b.x}%`, top: `${b.y}%`,
                filter: `blur(${b.blur}px)`,
                opacity: b.opacity,
              }}
            />
          ))}
        </>
      )}
      <div
        className="absolute inset-0"
        style={{ background: 'linear-gradient(to bottom, rgba(0,0,0,0) 30%, rgba(0,0,0,0.75) 100%)' }}
      />
      <div className="relative z-10 flex flex-col justify-between h-full p-5" style={{ minHeight: 220 }}>
        <div className="flex flex-col gap-1 mt-auto">
          <div className="flex items-center gap-2 flex-wrap">
            <span
              className="inline-block px-3 py-1 rounded-full text-xs font-extrabold uppercase tracking-widest"
              style={{ background: 'rgba(242,133,0,0.25)', color: '#F9A825', border: '1px solid rgba(242,133,0,0.4)' }}
            >
              {badge}
            </span>
            {precio && (
              <span
                className="inline-block px-3 py-1 rounded-full text-xs font-extrabold"
                style={{ background: 'rgba(39,174,96,0.2)', color: '#27AE60', border: '1px solid rgba(39,174,96,0.4)' }}
              >
                ${parseFloat(precio).toFixed(2)}
              </span>
            )}
          </div>
          <h2
            className="font-extrabold leading-tight"
            style={{ fontSize: 'clamp(1.5rem, 7vw, 2.25rem)', textShadow: '0 3px 16px rgba(0,0,0,0.8)', color: '#ffffff' }}
          >
            {titulo}
          </h2>
          <p className="text-white/70 text-sm font-extrabold">{subtitulo}</p>
        </div>
      </div>
    </div>
  )
}

// ─── Image Uploader ───────────────────────────────────────────────────────────

function ImageUploader({
  imagenUrl,
  onUpload,
  onRemove,
  backendDisponible,
}: {
  imagenUrl: string | null
  onUpload: (url: string) => void
  onRemove: () => void
  backendDisponible: boolean | null
}) {
  const [uploading, setUploading] = useState(false)
  const [dragOver, setDragOver] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleFile = async (file: File) => {
    const allowed = ['image/jpeg', 'image/png', 'image/webp']
    if (!allowed.includes(file.type)) {
      toast('Solo se permiten imágenes JPG, PNG o WebP')
      return
    }
    if (file.size > 5 * 1024 * 1024) {
      toast('La imagen no debe superar 5 MB')
      return
    }

    if (!backendDisponible) {
      // Preview only via local object URL — saves locally alongside other config
      const localUrl = URL.createObjectURL(file)
      onUpload(localUrl)
      toast('Vista previa local (conecta el backend para guardar en la nube)')
      return
    }

    setUploading(true)
    try {
      const formData = new FormData()
      formData.append('image', file)
      const res = await apiClient.patch('/admin/settings/banner/image', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      })
      onUpload(res.data.imagenUrl)
      toast('Imagen subida a la nube')
    } catch {
      toast('Error al subir imagen')
    } finally {
      setUploading(false)
    }
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    setDragOver(false)
    const file = e.dataTransfer.files[0]
    if (file) handleFile(file)
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) handleFile(file)
    // reset so the same file can be re-selected
    e.target.value = ''
  }

  return (
    <div>
      {imagenUrl ? (
        /* Current image preview */
        <div className="relative rounded-2xl overflow-hidden" style={{ height: 140 }}>
          <Image
            src={imagenUrl}
            alt="Banner background"
            fill
            className="object-cover"
            unoptimized
          />
          {/* Dark overlay */}
          <div className="absolute inset-0" style={{ background: 'rgba(0,0,0,0.35)' }} />
          {/* Actions */}
          <div className="absolute inset-0 flex items-center justify-center gap-3 z-10">
            <button
              onClick={() => fileInputRef.current?.click()}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-white text-xs font-extrabold transition-all active:scale-95"
              style={{ background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(8px)', border: '1px solid rgba(255,255,255,0.2)' }}
            >
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4" />
                <polyline points="17 8 12 3 7 8" />
                <line x1="12" y1="3" x2="12" y2="15" />
              </svg>
              Cambiar
            </button>
            <button
              onClick={onRemove}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-white text-xs font-extrabold transition-all active:scale-95"
              style={{ background: 'rgba(231,76,60,0.7)', backdropFilter: 'blur(8px)', border: '1px solid rgba(231,76,60,0.5)' }}
            >
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="3 6 5 6 21 6" />
                <path d="M19 6l-1 14a2 2 0 01-2 2H8a2 2 0 01-2-2L5 6" />
                <path d="M10 11v6M14 11v6" />
                <path d="M9 6V4h6v2" />
              </svg>
              Quitar
            </button>
          </div>
          <div className="absolute bottom-2 right-2 z-10">
            <span className="text-white/60 text-xs font-semibold px-2 py-0.5 rounded-lg" style={{ background: 'rgba(0,0,0,0.5)' }}>
              Fondo personalizado
            </span>
          </div>
        </div>
      ) : (
        /* Drop zone */
        <button
          type="button"
          onClick={() => !uploading && fileInputRef.current?.click()}
          onDragOver={(e) => { e.preventDefault(); setDragOver(true) }}
          onDragLeave={() => setDragOver(false)}
          onDrop={handleDrop}
          disabled={uploading}
          className="w-full rounded-2xl flex flex-col items-center justify-center gap-2 py-8 transition-all"
          style={{
            border: `2px dashed ${dragOver ? '#F28500' : 'rgba(255,255,255,0.14)'}`,
            background: dragOver ? 'rgba(242,133,0,0.06)' : 'rgba(255,255,255,0.02)',
            cursor: uploading ? 'not-allowed' : 'pointer',
          }}
        >
          {uploading ? (
            <>
              <svg className="animate-spin" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#F28500" strokeWidth="2" strokeLinecap="round">
                <circle cx="12" cy="12" r="10" strokeDasharray="32" strokeDashoffset="12" />
              </svg>
              <p className="text-xs font-semibold text-gray-400">Subiendo imagen...</p>
            </>
          ) : (
            <>
              <div
                className="w-11 h-11 rounded-2xl flex items-center justify-center"
                style={{ background: dragOver ? 'rgba(242,133,0,0.2)' : 'rgba(255,255,255,0.06)' }}
              >
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={dragOver ? '#F28500' : '#6B7280'} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
                  <circle cx="8.5" cy="8.5" r="1.5" />
                  <polyline points="21 15 16 10 5 21" />
                </svg>
              </div>
              <div className="text-center">
                <p className="text-sm font-semibold" style={{ color: dragOver ? '#F28500' : '#9CA3AF' }}>
                  {dragOver ? 'Suelta la imagen aquí' : 'Subir imagen de fondo'}
                </p>
                <p className="text-gray-600 text-xs mt-0.5">JPG, PNG o WebP · máx. 5 MB</p>
              </div>
            </>
          )}
        </button>
      )}

      <input
        ref={fileInputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp"
        className="hidden"
        onChange={handleInputChange}
      />
    </div>
  )
}

// ─── Página principal ─────────────────────────────────────────────────────────

export default function AdminHeroBannerPage() {
  const router = useRouter()

  const [promociones, setPromociones] = useState<Promocion[]>([])
  const [loading, setLoading] = useState(true)
  const [guardando, setGuardando] = useState(false)
  const [config, setConfig] = useState<BannerConfig>({ ...DEFAULTS })
  const [backendDisponible, setBackendDisponible] = useState<boolean | null>(null)

  useEffect(() => {
    const raw = localStorage.getItem('usuario')
    if (!raw) { router.push('/login'); return }
    const u = JSON.parse(raw)
    if (u.rol !== 'gerente') { router.push('/menu'); return }
  }, [router])

  const fetchData = useCallback(async () => {
    setLoading(true)
    try {
      const promoRes = await apiClient.get('/menu/promociones')
      setPromociones(promoRes.data ?? [])

      try {
        const cfgRes = await apiClient.get('/admin/settings/banner')
        setConfig({ ...DEFAULTS, ...cfgRes.data })
        setBackendDisponible(true)
      } catch (err: unknown) {
        const status = (err as { response?: { status?: number } })?.response?.status
        if (status === 404 || status === 405) {
          setConfig(loadLocal())
          setBackendDisponible(false)
        } else {
          setConfig(loadLocal())
          setBackendDisponible(false)
        }
      }
    } catch {
      // sin conexión
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { fetchData() }, [fetchData])

  const featuredPromo = promociones.find((p) => p.id === config.featuredPromoId) ?? promociones[0] ?? null

  const handleField = (field: keyof BannerConfig, value: string | number | null) => {
    setConfig((prev) => ({ ...prev, [field]: value }))
  }

  const handleImageUploaded = (url: string) => {
    setConfig((prev) => ({ ...prev, imagenUrl: url }))
  }

  const handleRemoveImage = async () => {
    setConfig((prev) => ({ ...prev, imagenUrl: null }))
    if (backendDisponible) {
      try {
        await apiClient.delete('/admin/settings/banner/image')
      } catch {
        // ignore — local state already cleared
      }
    }
  }

  const handleGuardar = async () => {
    setGuardando(true)
    try {
      if (backendDisponible) {
        await apiClient.patch('/admin/settings/banner', config)
        toast('Banner actualizado')
      } else {
        saveLocal(config)
        toast('Guardado localmente (backend no disponible)')
      }
    } catch {
      saveLocal(config)
      toast('Guardado localmente')
    } finally {
      setGuardando(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0A0A0A] flex items-center justify-center">
        <p className="text-gray-400 font-bold">Cargando...</p>
      </div>
    )
  }

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
          <h1 className="text-white font-extrabold text-lg leading-none">Hero Banner</h1>
          <p className="text-gray-400 text-xs mt-0.5">Edita lo que ven los clientes al inicio</p>
        </div>
        <button
          onClick={handleGuardar}
          disabled={guardando}
          className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-white text-sm font-extrabold transition-all active:scale-95 disabled:opacity-50 flex-shrink-0"
          style={{ background: 'linear-gradient(135deg, #F28500 0%, #D4700A 100%)' }}
        >
          {guardando ? (
            <svg className="animate-spin" width="14" height="14" viewBox="0 0 24 24" fill="none">
              <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" strokeDasharray="32" strokeDashoffset="12" strokeLinecap="round" />
            </svg>
          ) : (
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
              <path d="M19 21H5a2 2 0 01-2-2V5a2 2 0 012-2h11l5 5v11a2 2 0 01-2 2z" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
              <polyline points="17 21 17 13 7 13 7 21" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
              <polyline points="7 3 7 8 15 8" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          )}
          Guardar
        </button>
      </div>

      <main className="pt-20 pb-28 px-4 max-w-lg mx-auto space-y-5 mt-4">

        {/* Aviso backend */}
        {backendDisponible === false && (
          <div
            className="rounded-2xl p-3 flex items-start gap-2.5"
            style={{ background: 'rgba(249,168,37,0.1)', border: '1px solid rgba(249,168,37,0.3)' }}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" className="flex-shrink-0 mt-0.5" stroke="#F9A825" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" />
              <line x1="12" y1="9" x2="12" y2="13" /><line x1="12" y1="17" x2="12.01" y2="17" />
            </svg>
            <p className="text-xs font-semibold" style={{ color: '#F9A825' }}>
              El servidor no tiene soporte para configuración de banner. Los cambios se guardan localmente en este dispositivo.
            </p>
          </div>
        )}

        {/* Preview */}
        <div
          className="rounded-3xl p-4"
          style={{ background: '#1A1A1A', border: '1px solid rgba(255,255,255,0.06)' }}
        >
          <p className="text-xs font-bold uppercase tracking-widest mb-3" style={{ color: '#F28500' }}>
            Vista previa
          </p>
          <BannerPreview config={config} promo={featuredPromo} />
          <p className="text-gray-600 text-xs mt-2 text-center">
            {featuredPromo
              ? `Mostrando promo: "${featuredPromo.nombre}"`
              : 'Mostrando texto predeterminado (sin promo activa)'}
          </p>
        </div>

        {/* Imagen de fondo */}
        <div
          className="rounded-3xl p-4"
          style={{ background: '#1A1A1A', border: '1px solid rgba(255,255,255,0.06)' }}
        >
          <div className="mb-3">
            <p className="text-white font-extrabold text-sm">Imagen de fondo</p>
            <p className="text-gray-500 text-xs mt-0.5">
              Reemplaza el gradiente con una foto personalizada
            </p>
          </div>
          <ImageUploader
            imagenUrl={config.imagenUrl}
            onUpload={handleImageUploaded}
            onRemove={handleRemoveImage}
            backendDisponible={backendDisponible}
          />
          {config.imagenUrl && (
            <p className="text-gray-600 text-xs mt-2">
              Presiona <span className="text-gray-400 font-semibold">Guardar</span> para aplicar el cambio de texto también.
            </p>
          )}
        </div>

        {/* Promoción destacada */}
        <div
          className="rounded-3xl p-4"
          style={{ background: '#1A1A1A', border: '1px solid rgba(255,255,255,0.06)' }}
        >
          <div className="flex items-center justify-between mb-3">
            <div>
              <p className="text-white font-extrabold text-sm">Promoción del banner</p>
              <p className="text-gray-500 text-xs mt-0.5">La promo que se muestra en el hero</p>
            </div>
            {config.featuredPromoId && (
              <button
                onClick={() => handleField('featuredPromoId', null)}
                className="text-xs font-bold px-2.5 py-1 rounded-lg transition"
                style={{ background: 'rgba(231,76,60,0.12)', color: '#E74C3C' }}
              >
                Quitar
              </button>
            )}
          </div>

          {promociones.length === 0 ? (
            <div className="text-center py-6">
              <p className="text-gray-500 text-sm">No hay promociones activas</p>
              <Link
                href="/admin/promociones"
                className="inline-block mt-2 text-xs font-bold px-3 py-1.5 rounded-xl transition"
                style={{ background: 'rgba(242,133,0,0.15)', color: '#F28500' }}
              >
                Crear promoción
              </Link>
            </div>
          ) : (
            <div className="flex flex-col gap-2">
              {/* Opción automática */}
              <button
                onClick={() => handleField('featuredPromoId', null)}
                className="flex items-center gap-3 rounded-2xl px-3 py-2.5 text-left transition-all active:scale-[0.99]"
                style={{
                  background: config.featuredPromoId === null ? 'rgba(242,133,0,0.12)' : 'rgba(255,255,255,0.04)',
                  border: `1px solid ${config.featuredPromoId === null ? 'rgba(242,133,0,0.4)' : 'rgba(255,255,255,0.06)'}`,
                }}
              >
                <div
                  className="w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0 text-sm"
                  style={{
                    background: config.featuredPromoId === null ? 'rgba(242,133,0,0.2)' : 'rgba(255,255,255,0.06)',
                    color: config.featuredPromoId === null ? '#F28500' : '#6B7280',
                  }}
                >
                  ✦
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-white text-sm font-semibold">Automática</p>
                  <p className="text-gray-500 text-xs truncate">
                    Muestra la primera promo activa: {promociones[0]?.nombre ?? '—'}
                  </p>
                </div>
                {config.featuredPromoId === null && (
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#F28500" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="20 6 9 17 4 12" />
                  </svg>
                )}
              </button>

              {/* Lista de promos */}
              {promociones.filter(p => p.activo).map((promo) => {
                const selected = config.featuredPromoId === promo.id
                return (
                  <button
                    key={promo.id}
                    onClick={() => handleField('featuredPromoId', promo.id)}
                    className="flex items-center gap-3 rounded-2xl px-3 py-2.5 text-left transition-all active:scale-[0.99]"
                    style={{
                      background: selected ? 'rgba(242,133,0,0.12)' : 'rgba(255,255,255,0.04)',
                      border: `1px solid ${selected ? 'rgba(242,133,0,0.4)' : 'rgba(255,255,255,0.06)'}`,
                    }}
                  >
                    <div
                      className="w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0 text-xs font-extrabold"
                      style={{
                        background: promo.tipo_descuento === 'porcentaje'
                          ? 'rgba(242,133,0,0.15)'
                          : 'rgba(39,174,96,0.15)',
                        color: promo.tipo_descuento === 'porcentaje' ? '#F28500' : '#27AE60',
                      }}
                    >
                      {promo.tipo_descuento === 'porcentaje' ? '%' : '$'}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-white text-sm font-semibold truncate">{promo.nombre}</p>
                      <p className="text-gray-500 text-xs truncate">
                        {promo.descripcion ?? (promo.combos ? promo.combos.nombre : 'Sin descripción')}
                      </p>
                    </div>
                    {selected && (
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#F28500" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                        <polyline points="20 6 9 17 4 12" />
                      </svg>
                    )}
                  </button>
                )
              })}
            </div>
          )}
        </div>

        {/* Texto predeterminado */}
        <div
          className="rounded-3xl p-4"
          style={{ background: '#1A1A1A', border: '1px solid rgba(255,255,255,0.06)' }}
        >
          <p className="text-white font-extrabold text-sm mb-1">Texto predeterminado</p>
          <p className="text-gray-500 text-xs mb-4">Se muestra cuando no hay ninguna promoción activa</p>

          <div className="space-y-3">
            {/* Título */}
            <div>
              <label className="block text-xs font-semibold text-gray-300 mb-1">Título principal</label>
              <input
                type="text"
                value={config.titulo}
                onChange={(e) => handleField('titulo', e.target.value)}
                maxLength={60}
                className="w-full rounded-xl px-3 py-2.5 text-sm text-white focus:outline-none focus:ring-1 focus:ring-orange-500"
                style={{ background: '#0A0A0A', border: '1px solid rgba(255,255,255,0.12)' }}
                placeholder="Ej. 3 TACOS + BEBIDA"
              />
            </div>

            {/* Subtítulo */}
            <div>
              <label className="block text-xs font-semibold text-gray-300 mb-1">Subtítulo</label>
              <input
                type="text"
                value={config.subtitulo}
                onChange={(e) => handleField('subtitulo', e.target.value)}
                maxLength={80}
                className="w-full rounded-xl px-3 py-2.5 text-sm text-white focus:outline-none focus:ring-1 focus:ring-orange-500"
                style={{ background: '#0A0A0A', border: '1px solid rgba(255,255,255,0.12)' }}
                placeholder="Ej. ¡Disfruta la mejor birria!"
              />
            </div>

            {/* Badge */}
            <div>
              <label className="block text-xs font-semibold text-gray-300 mb-1">Etiqueta (badge)</label>
              <input
                type="text"
                value={config.badge}
                onChange={(e) => handleField('badge', e.target.value)}
                maxLength={30}
                className="w-full rounded-xl px-3 py-2.5 text-sm text-white focus:outline-none focus:ring-1 focus:ring-orange-500"
                style={{ background: '#0A0A0A', border: '1px solid rgba(255,255,255,0.12)' }}
                placeholder="Ej. Bienvenido"
              />
              <p className="text-gray-600 text-xs mt-1">
                Texto del chip naranja (cuando hay promo, se muestra &ldquo;Promo del día&rdquo; automáticamente)
              </p>
            </div>

            {/* Botón restablecer */}
            <button
              onClick={() => setConfig((prev) => ({
                ...prev,
                titulo: DEFAULTS.titulo,
                subtitulo: DEFAULTS.subtitulo,
                badge: DEFAULTS.badge,
              }))}
              className="text-xs font-bold text-gray-500 hover:text-gray-300 transition pt-1"
            >
              Restablecer valores por defecto
            </button>
          </div>
        </div>

        {/* Botón guardar (también al final) */}
        <button
          onClick={handleGuardar}
          disabled={guardando}
          className="w-full py-4 rounded-2xl text-white font-extrabold text-sm transition-all active:scale-95 disabled:opacity-50 flex items-center justify-center gap-2"
          style={{ background: 'linear-gradient(135deg, #F28500 0%, #D4700A 100%)', boxShadow: '0 4px 20px rgba(242,133,0,0.35)' }}
        >
          {guardando ? (
            <>
              <svg className="animate-spin" width="16" height="16" viewBox="0 0 24 24" fill="none">
                <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" strokeDasharray="32" strokeDashoffset="12" strokeLinecap="round" />
              </svg>
              Guardando...
            </>
          ) : 'Guardar cambios'}
        </button>
      </main>
    </div>
  )
}
