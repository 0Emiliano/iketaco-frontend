'use client'

import { useState, useRef, useEffect, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import NavComponent from '@/components/ui/NavComponent'
import apiClient from '@/lib/api/client'

// ─── Constants ────────────────────────────────────────────────────────────────

const CLABE_DISPLAY  = '012 320 0123456789 01'
const CLABE_CLEAN    = '012320012345678901'
const BANCO          = 'BBVA'
const TITULAR        = 'I KE TACOS BIRRIA'

// ─── Helpers ─────────────────────────────────────────────────────────────────

function fmtBytes(bytes: number) {
  if (bytes < 1024)            return `${bytes} B`
  if (bytes < 1024 * 1024)     return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

// ─── Inner component (needs useSearchParams → must be inside Suspense) ────────

function TransferenciaContent() {
  const router       = useRouter()
  const searchParams = useSearchParams()
  const ordenId = searchParams.get('ordenId')
  const total   = searchParams.get('total')
  const pagoId  = searchParams.get('pagoId')

  const fmtTotal = total ? `$${parseFloat(total).toFixed(2)}` : '—'

  // Copy CLABE
  const [copied, setCopied] = useState(false)
  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(CLABE_CLEAN)
    } catch {
      const el = document.createElement('textarea')
      el.value = CLABE_CLEAN
      document.body.appendChild(el)
      el.select()
      document.execCommand('copy')
      document.body.removeChild(el)
    }
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  // File / upload state
  const fileInputRef               = useRef<HTMLInputElement>(null)
  const [file, setFile]            = useState<File | null>(null)
  const [preview, setPreview]      = useState<string | null>(null)
  const [uploading, setUploading]  = useState(false)
  const [uploadError, setUploadError] = useState('')
  const [uploaded, setUploaded]    = useState(false)

  // Revoke object URL on unmount / when file changes
  useEffect(() => {
    return () => { if (preview) URL.revokeObjectURL(preview) }
  }, [preview])

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selected = e.target.files?.[0]
    if (!selected) return
    if (preview) URL.revokeObjectURL(preview)
    setFile(selected)
    setPreview(URL.createObjectURL(selected))
    setUploadError('')
    // Reset input so the same file can be re-selected if needed
    e.target.value = ''
  }

  const clearFile = () => {
    if (preview) URL.revokeObjectURL(preview)
    setFile(null)
    setPreview(null)
    setUploadError('')
  }

  const handleUpload = async () => {
    if (!file || !pagoId) return
    const token = localStorage.getItem('accessToken')
    if (!token) { router.push('/login'); return }

    setUploading(true)
    setUploadError('')
    try {
      const formData = new FormData()
      formData.append('comprobante', file)
      await apiClient.post(`/payments/${pagoId}/comprobante`, formData, {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'multipart/form-data',
        },
      })
      setUploaded(true)
    } catch (err: any) {
      const msg = err?.response?.data?.error ?? err?.response?.data?.message
      setUploadError(msg ?? 'Error al subir el comprobante. Intenta de nuevo.')
    } finally {
      setUploading(false)
    }
  }

  return (
    <main className="px-4 pt-20 pb-28 max-w-lg mx-auto w-full flex flex-col gap-4 mt-2">

      {/* ── Card datos bancarios ── */}
      <div
        className="rounded-2xl p-5"
        style={{ background: '#1A1A1A', border: '1px solid rgba(255,255,255,0.07)' }}
      >
        <p className="text-xs uppercase tracking-[0.2em] text-orange-400 font-bold mb-1">
          Instrucciones
        </p>
        <h2 className="text-white font-extrabold text-xl mb-4">Datos bancarios</h2>

        <div className="flex flex-col gap-0">
          {[
            { label: 'Banco',    value: BANCO    },
            { label: 'Titular',  value: TITULAR  },
            { label: 'Monto',    value: fmtTotal, accent: true },
          ].map((row) => (
            <div
              key={row.label}
              className="flex items-center justify-between py-3"
              style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}
            >
              <span className="text-xs font-bold text-gray-500 uppercase tracking-wider w-20">
                {row.label}
              </span>
              <span
                className="text-sm font-extrabold"
                style={{ color: row.accent ? '#F28500' : '#F3F4F6' }}
              >
                {row.value}
              </span>
            </div>
          ))}

          {/* CLABE con botón copiar */}
          <div className="flex items-center justify-between py-3">
            <span className="text-xs font-bold text-gray-500 uppercase tracking-wider w-20">
              CLABE
            </span>
            <div className="flex items-center gap-2">
              <span className="text-sm font-extrabold text-white font-mono tracking-wider">
                {CLABE_DISPLAY}
              </span>
              <button
                onClick={handleCopy}
                className="px-2.5 py-1.5 rounded-xl text-xs font-extrabold transition-all active:scale-95 whitespace-nowrap"
                style={copied
                  ? { background: 'rgba(39,174,96,0.2)', color: '#27AE60', border: '1px solid rgba(39,174,96,0.35)' }
                  : { background: 'rgba(242,133,0,0.15)', color: '#F28500', border: '1px solid rgba(242,133,0,0.3)' }
                }
              >
                {copied ? '¡Copiado! ✓' : 'Copiar'}
              </button>
            </div>
          </div>
        </div>

        <div
          className="mt-4 rounded-xl px-4 py-3"
          style={{ background: 'rgba(242,133,0,0.07)', border: '1px solid rgba(242,133,0,0.18)' }}
        >
          <p className="text-xs text-orange-300 font-semibold leading-relaxed">
            ⚠️ Transfiere exactamente <strong>{fmtTotal}</strong> y sube el comprobante
            para que el cajero confirme tu pago.
          </p>
        </div>
      </div>

      {/* ── Card comprobante ── */}
      <div
        className="rounded-2xl p-5"
        style={{ background: '#1A1A1A', border: '1px solid rgba(255,255,255,0.07)' }}
      >
        <p className="text-xs uppercase tracking-[0.2em] text-orange-400 font-bold mb-1">
          Paso 2
        </p>
        <h2 className="text-white font-extrabold text-xl mb-4">Sube tu comprobante</h2>

        {uploaded ? (
          /* ── Success state ── */
          <div
            className="flex flex-col items-center gap-4 py-4 text-center"
            style={{ animation: 'fadeIn 0.3s ease both' }}
          >
            <div
              className="w-16 h-16 rounded-full flex items-center justify-center text-3xl"
              style={{ background: 'rgba(39,174,96,0.15)', border: '1px solid rgba(39,174,96,0.3)' }}
            >
              ✅
            </div>
            <div>
              <p className="text-white font-extrabold text-lg">¡Comprobante enviado!</p>
              <p className="text-gray-400 text-sm mt-1">
                El cajero revisará tu pago y confirmará tu pedido.
              </p>
            </div>
            <Link
              href="/mis-pedidos"
              className="w-full py-3 rounded-2xl text-white font-extrabold text-sm text-center transition active:scale-95"
              style={{
                background: 'linear-gradient(135deg, #F28500 0%, #D4700A 100%)',
                boxShadow: '0 4px 14px rgba(242,133,0,0.35)',
              }}
            >
              Ver mi pedido
            </Link>
          </div>
        ) : (
          /* ── Upload form ── */
          <div className="flex flex-col gap-4">
            {/* Hidden native input */}
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleFileSelect}
              className="hidden"
              aria-label="Seleccionar comprobante"
            />

            {/* Empty state — pick button */}
            {!file && (
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="w-full py-6 rounded-2xl border-2 border-dashed flex flex-col items-center gap-2 transition-all active:scale-[0.98]"
                style={{
                  borderColor: 'rgba(242,133,0,0.35)',
                  background: 'rgba(242,133,0,0.04)',
                }}
              >
                <span className="text-3xl">📎</span>
                <span className="text-sm font-extrabold text-white">Seleccionar imagen</span>
                <span className="text-xs text-gray-500">JPG, PNG o WebP · máx. 5 MB</span>
              </button>
            )}

            {/* File preview */}
            {file && preview && (
              <div className="flex flex-col gap-3" style={{ animation: 'fadeIn 0.2s ease both' }}>
                {/* Image preview */}
                <div
                  className="rounded-2xl overflow-hidden"
                  style={{ border: '1px solid rgba(255,255,255,0.08)', background: '#0A0A0A' }}
                >
                  <img
                    src={preview}
                    alt="Vista previa del comprobante"
                    className="w-full object-contain"
                    style={{ maxHeight: '280px' }}
                  />
                </div>

                {/* File info + remove */}
                <div className="flex items-center gap-3">
                  <div
                    className="w-9 h-9 rounded-xl flex items-center justify-center text-lg flex-shrink-0"
                    style={{ background: 'rgba(242,133,0,0.12)' }}
                  >
                    🖼
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-bold text-white truncate">{file.name}</p>
                    <p className="text-xs text-gray-500">{fmtBytes(file.size)}</p>
                  </div>
                  <button
                    type="button"
                    onClick={clearFile}
                    className="w-8 h-8 rounded-xl flex items-center justify-center text-gray-400 hover:text-red-400 transition flex-shrink-0"
                    style={{ background: 'rgba(255,255,255,0.06)' }}
                    aria-label="Quitar imagen"
                  >
                    ✕
                  </button>
                </div>

                {/* Change button */}
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="text-xs text-orange-300 hover:text-orange-100 font-semibold transition text-left"
                >
                  📎 Cambiar imagen
                </button>
              </div>
            )}

            {/* Error */}
            {uploadError && (
              <div
                className="rounded-xl px-4 py-3"
                style={{ background: 'rgba(231,76,60,0.1)', border: '1px solid rgba(231,76,60,0.3)' }}
              >
                <p className="text-xs text-red-300 font-semibold">{uploadError}</p>
              </div>
            )}

            {/* No pagoId warning */}
            {!pagoId && (
              <div
                className="rounded-xl px-4 py-3"
                style={{ background: 'rgba(245,158,11,0.1)', border: '1px solid rgba(245,158,11,0.25)' }}
              >
                <p className="text-xs text-yellow-300 font-semibold">
                  ⚠️ No se encontró el ID de pago. Regresa al carrito e intenta de nuevo.
                </p>
              </div>
            )}

            {/* Submit button */}
            <button
              type="button"
              onClick={handleUpload}
              disabled={!file || uploading || !pagoId}
              className="w-full py-4 rounded-2xl text-white font-extrabold text-base transition-all active:scale-95 disabled:opacity-40"
              style={{
                background: 'linear-gradient(135deg, #F28500 0%, #D4700A 100%)',
                boxShadow: file && pagoId ? '0 6px 20px rgba(242,133,0,0.35)' : 'none',
              }}
            >
              {uploading ? (
                <span className="flex items-center justify-center gap-2">
                  <svg className="animate-spin" width="16" height="16" viewBox="0 0 24 24" fill="none">
                    <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3"
                      strokeDasharray="31.4" strokeDashoffset="10" />
                  </svg>
                  Subiendo…
                </span>
              ) : (
                'Enviar comprobante'
              )}
            </button>
          </div>
        )}
      </div>

      {/* ── Footnote ── */}
      {ordenId && (
        <p className="text-center text-xs text-gray-600 pb-2">
          Pedido #{ordenId}
        </p>
      )}
    </main>
  )
}

// ─── Page wrapper ─────────────────────────────────────────────────────────────

export default function TransferenciaPage() {
  return (
    <div className="min-h-screen bg-[#0A0A0A] text-white">
      <NavComponent title="Pago por Transferencia" />
      <Suspense
        fallback={
          <div className="flex items-center justify-center min-h-[60vh]">
            <p className="text-gray-400 text-sm font-bold">Cargando…</p>
          </div>
        }
      >
        <TransferenciaContent />
      </Suspense>

      <style>{`
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(6px); }
          to   { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </div>
  )
}
