'use client'

import { useCallback, useRef } from 'react'
import { GoogleMap, Marker, useLoadScript } from '@react-google-maps/api'

interface DeliveryMapProps {
  lat: number
  lng: number
  onChange: (coords: { lat: number; lng: number }) => void
}

const MAP_OPTIONS: google.maps.MapOptions = {
  disableDefaultUI: true,
  zoomControl: true,
  clickableIcons: false,
  styles: [
    { elementType: 'geometry',        stylers: [{ color: '#1a1a1a' }] },
    { elementType: 'labels.text.fill', stylers: [{ color: '#9ca3af' }] },
    { elementType: 'labels.text.stroke', stylers: [{ color: '#111' }] },
    { featureType: 'road',            elementType: 'geometry', stylers: [{ color: '#2a2a2a' }] },
    { featureType: 'road',            elementType: 'geometry.stroke', stylers: [{ color: '#111' }] },
    { featureType: 'road.highway',    elementType: 'geometry', stylers: [{ color: '#333' }] },
    { featureType: 'water',           elementType: 'geometry', stylers: [{ color: '#0d1117' }] },
    { featureType: 'poi',             stylers: [{ visibility: 'off' }] },
    { featureType: 'transit',         stylers: [{ visibility: 'off' }] },
  ],
}

export default function DeliveryMap({ lat, lng, onChange }: DeliveryMapProps) {
  const { isLoaded } = useLoadScript({
    googleMapsApiKey: process.env.NEXT_PUBLIC_GOOGLE_MAPS_KEY ?? '',
  })

  const markerRef = useRef<google.maps.Marker | null>(null)

  const onMarkerLoad = useCallback((marker: google.maps.Marker) => {
    markerRef.current = marker
  }, [])

  const onDragEnd = useCallback(() => {
    const pos = markerRef.current?.getPosition()
    if (pos) onChange({ lat: pos.lat(), lng: pos.lng() })
  }, [onChange])

  if (!isLoaded) {
    return (
      <div
        className="w-full rounded-2xl flex items-center justify-center"
        style={{ height: 200, background: '#111', border: '1px solid rgba(255,255,255,0.08)' }}
      >
        <span className="text-gray-500 text-sm font-semibold">Cargando mapa…</span>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-2">
      <div
        className="w-full overflow-hidden rounded-2xl"
        style={{ height: 200, border: '1px solid rgba(242,133,0,0.35)' }}
      >
        <GoogleMap
          mapContainerStyle={{ width: '100%', height: '100%' }}
          center={{ lat, lng }}
          zoom={17}
          options={MAP_OPTIONS}
        >
          <Marker
            position={{ lat, lng }}
            draggable
            onLoad={onMarkerLoad}
            onDragEnd={onDragEnd}
            icon={{
              path: 'M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z',
              fillColor: '#F28500',
              fillOpacity: 1,
              strokeColor: '#fff',
              strokeWeight: 1.5,
              scale: 1.6,
              anchor: new google.maps.Point(12, 22),
            }}
          />
        </GoogleMap>
      </div>
      <p className="text-xs font-semibold text-center" style={{ color: '#9CA3AF' }}>
        Arrastra el marcador para ajustar la ubicación exacta
      </p>
    </div>
  )
}
