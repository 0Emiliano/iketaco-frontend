'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { GoogleMap, Marker, InfoWindow, useLoadScript } from '@react-google-maps/api'
import apiClient from '@/lib/api/client'
import RefreshDot from '@/components/ui/RefreshDot'

// ─── Types ────────────────────────────────────────────────────────────────────

interface Entrega {
  id: number
  numero: string
  estado: string
  nombre_cliente: string | null
  telefono_cliente: string | null
  direccion_entrega: string | null
  latitud_entrega: number | string | null
  longitud_entrega: number | string | null
  notas_orden: string | null
  total: number | string
  creado_en: string
  orden_detalles: { id: number; cantidad: number; productos: { nombre: string } }[]
  orden_combos:   { id: number; cantidad: number; combos:   { nombre: string } }[]
}

// ─── Config ───────────────────────────────────────────────────────────────────

const MAP_CENTER = { lat: 27.9213, lng: -110.8979 } // Guaymas, Sonora

const DARK_STYLE: google.maps.MapTypeStyle[] = [
  { elementType: 'geometry',            stylers: [{ color: '#1A1A1A' }] },
  { elementType: 'labels.text.stroke',  stylers: [{ color: '#0A0A0A' }] },
  { elementType: 'labels.text.fill',    stylers: [{ color: '#9CA3AF' }] },
  { featureType: 'road',                elementType: 'geometry',           stylers: [{ color: '#2D2D2D' }] },
  { featureType: 'road',                elementType: 'geometry.stroke',    stylers: [{ color: '#111' }] },
  { featureType: 'road',                elementType: 'labels.text.fill',   stylers: [{ color: '#D1D5DB' }] },
  { featureType: 'road.highway',        elementType: 'geometry',           stylers: [{ color: '#3D3D3D' }] },
  { featureType: 'road.highway',        elementType: 'geometry.stroke',    stylers: [{ color: '#1A1A1A' }] },
  { featureType: 'road.highway',        elementType: 'labels.text.fill',   stylers: [{ color: '#F28500' }] },
  { featureType: 'water',               elementType: 'geometry',           stylers: [{ color: '#111827' }] },
  { featureType: 'water',               elementType: 'labels.text.fill',   stylers: [{ color: '#4B5563' }] },
  { featureType: 'poi',                 elementType: 'geometry',           stylers: [{ color: '#222' }] },
  { featureType: 'poi',                 elementType: 'labels.text.fill',   stylers: [{ color: '#6B7280' }] },
  { featureType: 'poi.park',            elementType: 'geometry',           stylers: [{ color: '#1a2a1a' }] },
  { featureType: 'transit',             elementType: 'geometry',           stylers: [{ color: '#222' }] },
  { featureType: 'administrative',      elementType: 'geometry.stroke',    stylers: [{ color: '#333' }] },
  { featureType: 'administrative.land_parcel', elementType: 'labels.text.fill', stylers: [{ color: '#4B5563' }] },
]

const MAP_OPTIONS: google.maps.MapOptions = {
  styles: DARK_STYLE,
  disableDefaultUI: false,
  zoomControl: true,
  mapTypeControl: false,
  streetViewControl: false,
  fullscreenControl: true,
  backgroundColor: '#1A1A1A',
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function toNum(v: number | string | null): number | null {
  if (v === null || v === undefined) return null
  const n = typeof v === 'number' ? v : parseFloat(String(v))
  return isNaN(n) ? null : n
}

function formatFecha(fecha: string) {
  return new Date(fecha).toLocaleDateString('es-MX', {
    day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit',
    timeZone: 'America/Hermosillo',
  })
}

function getResumen(e: Entrega) {
  return [
    ...(e.orden_detalles ?? []).map((d) => `${d.cantidad}× ${d.productos?.nombre}`),
    ...(e.orden_combos   ?? []).map((c) => `${c.cantidad}× ${c.combos?.nombre}`),
  ].filter(Boolean).join(', ') || '—'
}

function openDirections(lat: number, lng: number) {
  window.open(`https://maps.google.com/maps/dir/?api=1&destination=${lat},${lng}`, '_blank', 'noopener')
}

function compartirWhatsApp(orden: Entrega) {
  const lat = toNum(orden.latitud_entrega)
  const lng = toNum(orden.longitud_entrega)

  const items = [
    ...(orden.orden_detalles ?? []).map((d) => `• ${d.cantidad}× ${d.productos?.nombre}`),
    ...(orden.orden_combos   ?? []).map((c) => `• ${c.cantidad}× ${c.combos?.nombre}`),
  ].filter(Boolean).join('\n')

  const mapsLine =
    lat !== null && lng !== null
      ? `\n🗺️ Destino: https://maps.google.com/maps/dir/?api=1&destination=${lat},${lng}`
      : ''

  const lineas: (string | null)[] = [
    `🛵 *ENTREGA — ${orden.numero.replace(/ORD-\d{8}-/, 'ORD-')}*`,
    '',
    orden.nombre_cliente    ? `👤 ${orden.nombre_cliente}`    : null,
    orden.telefono_cliente  ? `📞 ${orden.telefono_cliente}`  : null,
    orden.direccion_entrega ? `📍 ${orden.direccion_entrega}` : null,
    items ? `\n🛒 Pedido:\n${items}` : null,
    '',
    `💰 Total: $${parseFloat(String(orden.total)).toFixed(2)}`,
  ]

  const msg = lineas.filter((l) => l !== null).join('\n') + mapsLine
  window.open(`https://wa.me/?text=${encodeURIComponent(msg)}`, '_blank', 'noopener')
}

// ─── Delivery card ────────────────────────────────────────────────────────────

function EntregaCard({
  entrega,
  token,
  isSelected,
  onSelect,
  onStatusChange,
}: {
  entrega: Entrega
  token: string
  isSelected: boolean
  onSelect: () => void
  onStatusChange: () => void
}) {
  const [saving, setSaving]     = useState(false)
  const [localErr, setLocalErr] = useState('')

  const lat = toNum(entrega.latitud_entrega)
  const lng = toNum(entrega.longitud_entrega)
  const hasCoordenadas = lat !== null && lng !== null

  const handleEntregado = async () => {
    setSaving(true)
    setLocalErr('')
    try {
      await apiClient.patch(
        `/orders/${entrega.id}/status`,
        { estado: 'entregada' },
        { headers: { Authorization: `Bearer ${token}` } }
      )
      onStatusChange()
    } catch (err: any) {
      setLocalErr(err?.response?.data?.error ?? 'Error al actualizar')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div
      className="rounded-2xl p-4 flex flex-col gap-3 transition-all"
      style={{
        background: isSelected ? 'rgba(242,133,0,0.08)' : '#1A1A1A',
        border: isSelected ? '1.5px solid rgba(242,133,0,0.45)' : '1px solid rgba(255,255,255,0.07)',
      }}
    >
      {/* Header */}
      <div className="flex items-start justify-between gap-2">
        <div>
          <span className="text-xs font-black px-2 py-1 rounded-lg" style={{ background: '#F28500', color: 'white' }}>
            {entrega.numero.replace(/ORD-\d{8}-/, 'ORD-')}
          </span>
          {entrega.nombre_cliente && (
            <p className="text-sm font-bold text-white mt-1">{entrega.nombre_cliente}</p>
          )}
          {entrega.telefono_cliente && (
            <a
              href={`tel:${entrega.telefono_cliente}`}
              className="text-xs text-orange-400 font-semibold mt-0.5 flex items-center gap-1 hover:text-orange-200 transition"
            >
              📞 {entrega.telefono_cliente}
            </a>
          )}
        </div>
        <span className="font-extrabold text-lg flex-shrink-0" style={{ color: '#F28500' }}>
          ${parseFloat(String(entrega.total)).toFixed(2)}
        </span>
      </div>

      {/* Items */}
      <p className="text-gray-400 text-xs font-semibold line-clamp-2">{getResumen(entrega)}</p>

      {/* Address */}
      {entrega.direccion_entrega && (
        <div className="rounded-xl px-3 py-2" style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.06)' }}>
          <p className="text-xs text-gray-300 font-semibold">📍 {entrega.direccion_entrega}</p>
          {entrega.notas_orden && (
            <p className="text-xs text-yellow-400 font-semibold mt-1">📝 {entrega.notas_orden}</p>
          )}
        </div>
      )}

      <p className="text-xs text-gray-600">{formatFecha(entrega.creado_en)}</p>

      {localErr && <p className="text-xs text-red-400 font-semibold">{localErr}</p>}

      {/* Actions */}
      <div className="flex gap-2">
        {hasCoordenadas && (
          <button
            onClick={onSelect}
            className="flex-1 py-2 rounded-xl text-xs font-extrabold transition active:scale-95"
            style={{
              background: isSelected ? 'rgba(242,133,0,0.2)' : 'rgba(255,255,255,0.07)',
              color: isSelected ? '#F28500' : '#9CA3AF',
              border: isSelected ? '1px solid rgba(242,133,0,0.35)' : '1px solid rgba(255,255,255,0.08)',
            }}
          >
            📍 Ver en mapa
          </button>
        )}
        {hasCoordenadas && (
          <button
            onClick={() => openDirections(lat!, lng!)}
            className="flex-1 py-2 rounded-xl text-xs font-extrabold transition active:scale-95"
            style={{ background: 'rgba(41,128,185,0.12)', color: '#60A5FA', border: '1px solid rgba(41,128,185,0.25)' }}
          >
            🗺️ Cómo llegar
          </button>
        )}
        <button
          onClick={() => compartirWhatsApp(entrega)}
          className="flex-1 py-2 rounded-xl text-xs font-extrabold transition active:scale-95 flex items-center justify-center gap-1"
          style={{ background: 'rgba(37,211,102,0.12)', color: '#25D366', border: '1px solid rgba(37,211,102,0.25)' }}
        >
          <svg width="13" height="13" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
            <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347z"/>
            <path d="M11.999 2C6.477 2 2 6.477 2 12c0 1.99.583 3.842 1.585 5.396L2 22l4.73-1.558A9.943 9.943 0 0011.999 22C17.522 22 22 17.523 22 12c0-5.522-4.478-10-10.001-10zm0 18.182a8.14 8.14 0 01-4.142-1.13l-.297-.176-3.08 1.014.986-3.006-.193-.309A8.14 8.14 0 013.818 12c0-4.517 3.663-8.182 8.181-8.182C16.518 3.818 20.182 7.483 20.182 12c0 4.518-3.664 8.182-8.183 8.182z"/>
          </svg>
          Compartir
        </button>
        <button
          onClick={handleEntregado}
          disabled={saving}
          className="flex-1 py-2 rounded-xl text-white text-xs font-extrabold transition active:scale-95 disabled:opacity-40"
          style={{ background: 'linear-gradient(135deg, #27AE60 0%, #1E8449 100%)' }}
        >
          {saving ? '…' : '✓ Entregado'}
        </button>
      </div>
    </div>
  )
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function RepartidorPage() {
  const router = useRouter()

  const [token,      setToken]      = useState<string | null>(null)
  const [usuario,    setUsuario]    = useState<{ email: string; rol: string } | null>(null)
  const [entregas,   setEntregas]   = useState<Entrega[]>([])
  const [loading,    setLoading]    = useState(true)
  const [fetchError, setFetchError] = useState('')

  // Map state
  const [mapCenter,       setMapCenter]       = useState(MAP_CENTER)
  const [selectedEntrega, setSelectedEntrega] = useState<Entrega | null>(null)
  const mapRef = useRef<google.maps.Map | null>(null)

  const { isLoaded } = useLoadScript({
    googleMapsApiKey: process.env.NEXT_PUBLIC_GOOGLE_MAPS_KEY ?? '',
  })

  // ── Auth guard ──
  useEffect(() => {
    const raw = localStorage.getItem('usuario')
    const tk  = localStorage.getItem('accessToken')
    if (!raw || !tk) { router.push('/login'); return }
    try {
      const u = JSON.parse(raw)
      if (u.rol !== 'repartidor') { router.push('/login'); return }
      setUsuario(u)
      setToken(tk)
    } catch {
      router.push('/login')
    }
  }, [router])

  // ── Fetch deliveries ──
  const fetchEntregas = useCallback(async () => {
    if (!token) return
    setFetchError('')
    try {
      const res = await apiClient.get('/orders/my-deliveries', {
        headers: { Authorization: `Bearer ${token}` },
      })
      setEntregas(Array.isArray(res.data) ? res.data : res.data?.items ?? [])
    } catch (err: any) {
      if (err?.response?.status === 401) router.push('/login')
      else setFetchError('Error al cargar las entregas. Verifica tu conexión.')
    } finally {
      setLoading(false)
    }
  }, [token, router])

  useEffect(() => {
    if (token) {
      fetchEntregas()
      const interval = setInterval(fetchEntregas, 30000)
      return () => clearInterval(interval)
    }
  }, [token, fetchEntregas])

  // ── Center map on selected entrega ──
  const handleSelect = (entrega: Entrega) => {
    const lat = toNum(entrega.latitud_entrega)
    const lng = toNum(entrega.longitud_entrega)
    if (lat === null || lng === null) return
    setSelectedEntrega(entrega)
    setMapCenter({ lat, lng })
    if (mapRef.current) {
      mapRef.current.panTo({ lat, lng })
      mapRef.current.setZoom(16)
    }
    // Scroll to map
    document.getElementById('mapa-repartidor')?.scrollIntoView({ behavior: 'smooth' })
  }

  // ── Marker label (taco emoji via SVG canvas) ──
  const tacoIcon = (): google.maps.Symbol => ({
    path: google.maps.SymbolPath.CIRCLE,
    scale: 14,
    fillColor: '#F28500',
    fillOpacity: 1,
    strokeColor: '#0A0A0A',
    strokeWeight: 2,
  })

  const logout = () => {
    apiClient.post('/auth/logout').catch(() => {})
    localStorage.removeItem('accessToken')
    localStorage.removeItem('usuario')
    router.push('/login')
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0A0A0A] flex items-center justify-center">
        <p className="text-gray-400 font-bold">Cargando entregas…</p>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#0A0A0A] text-white">

      {/* ── Header ── */}
      <div
        className="fixed top-0 left-0 right-0 z-50 px-4 py-3 flex items-center justify-between"
        style={{ background: '#111', borderBottom: '1px solid rgba(255,255,255,0.08)' }}
      >
        <div className="flex items-center gap-3">
          <span className="text-2xl">🛵</span>
          <div>
            <h1 className="text-white font-extrabold text-lg leading-none">Mis Entregas</h1>
            <p className="text-gray-400 text-xs mt-0.5">{usuario?.email}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <span
            className="text-xs font-bold px-3 py-1 rounded-full"
            style={{ background: 'rgba(242,133,0,0.2)', color: '#F28500' }}
          >
            {entregas.length} {entregas.length === 1 ? 'entrega' : 'entregas'}
          </span>
          <RefreshDot intervalMs={30000} />
          <button
            onClick={logout}
            className="text-gray-400 hover:text-white text-xs font-bold px-3 py-1.5 rounded-lg transition"
            style={{ background: 'rgba(255,255,255,0.06)' }}
          >
            Salir
          </button>
        </div>
      </div>

      <main className="pt-16 pb-8 flex flex-col">

        {/* ── Google Map ── */}
        <div id="mapa-repartidor" style={{ height: '50vh', width: '100%', position: 'relative' }}>
          {isLoaded ? (
            <GoogleMap
              mapContainerStyle={{ width: '100%', height: '100%' }}
              center={mapCenter}
              zoom={13}
              options={MAP_OPTIONS}
              onLoad={(map) => { mapRef.current = map }}
            >
              {entregas.map((entrega) => {
                const lat = toNum(entrega.latitud_entrega)
                const lng = toNum(entrega.longitud_entrega)
                if (lat === null || lng === null) return null
                return (
                  <Marker
                    key={entrega.id}
                    position={{ lat, lng }}
                    icon={tacoIcon()}
                    title={entrega.numero}
                    onClick={() => setSelectedEntrega(entrega)}
                  />
                )
              })}

              {selectedEntrega && toNum(selectedEntrega.latitud_entrega) !== null && (
                <InfoWindow
                  position={{
                    lat: toNum(selectedEntrega.latitud_entrega)!,
                    lng: toNum(selectedEntrega.longitud_entrega)!,
                  }}
                  onCloseClick={() => setSelectedEntrega(null)}
                >
                  <div style={{ background: '#1A1A1A', color: 'white', padding: '8px 4px', minWidth: '180px', fontFamily: 'sans-serif' }}>
                    <p style={{ fontWeight: 900, fontSize: '13px', color: '#F28500', marginBottom: '4px' }}>
                      {selectedEntrega.numero.replace(/ORD-\d{8}-/, 'ORD-')}
                    </p>
                    {selectedEntrega.nombre_cliente && (
                      <p style={{ fontSize: '12px', color: '#D1D5DB', marginBottom: '2px' }}>
                        👤 {selectedEntrega.nombre_cliente}
                      </p>
                    )}
                    {selectedEntrega.direccion_entrega && (
                      <p style={{ fontSize: '11px', color: '#9CA3AF', marginBottom: '8px', lineHeight: '1.4' }}>
                        📍 {selectedEntrega.direccion_entrega}
                      </p>
                    )}
                    {toNum(selectedEntrega.latitud_entrega) !== null && (
                      <button
                        onClick={() => openDirections(toNum(selectedEntrega.latitud_entrega)!, toNum(selectedEntrega.longitud_entrega)!)}
                        style={{
                          background: '#F28500',
                          color: 'white',
                          border: 'none',
                          borderRadius: '8px',
                          padding: '6px 12px',
                          fontSize: '11px',
                          fontWeight: 800,
                          cursor: 'pointer',
                          width: '100%',
                        }}
                      >
                        🗺️ Cómo llegar
                      </button>
                    )}
                  </div>
                </InfoWindow>
              )}
            </GoogleMap>
          ) : (
            <div className="w-full h-full flex items-center justify-center" style={{ background: '#1A1A1A' }}>
              <p className="text-gray-400 text-sm font-bold">Cargando mapa…</p>
            </div>
          )}
        </div>

        {/* ── List ── */}
        <div className="px-4 pt-4 max-w-lg mx-auto w-full flex flex-col gap-3">

          {fetchError && (
            <div className="rounded-2xl px-4 py-3" style={{ background: 'rgba(231,76,60,0.1)', border: '1px solid rgba(231,76,60,0.3)' }}>
              <p className="text-sm text-red-300 font-semibold">{fetchError}</p>
            </div>
          )}

          {entregas.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <div className="w-20 h-20 rounded-full flex items-center justify-center text-4xl mb-4" style={{ background: '#1A1A1A' }}>
                🛵
              </div>
              <p className="text-white font-extrabold text-base mb-1">Sin entregas asignadas</p>
              <p className="text-gray-400 text-sm">Las nuevas entregas aparecerán aquí automáticamente</p>
            </div>
          ) : (
            <>
              <p className="text-xs text-gray-500 font-semibold">
                {entregas.length} entrega{entregas.length !== 1 ? 's' : ''} asignada{entregas.length !== 1 ? 's' : ''}
              </p>
              {entregas.map((entrega) => (
                <EntregaCard
                  key={entrega.id}
                  entrega={entrega}
                  token={token!}
                  isSelected={selectedEntrega?.id === entrega.id}
                  onSelect={() => handleSelect(entrega)}
                  onStatusChange={fetchEntregas}
                />
              ))}
            </>
          )}
        </div>
      </main>
    </div>
  )
}
