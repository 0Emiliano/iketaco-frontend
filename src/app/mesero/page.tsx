'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import SearchBar from '@/components/menu/SearchBar'
import CategoryFilter from '@/components/menu/CategoryFilter'
import apiClient from '@/lib/api/client'
import { getCategorias, getProductos, getCombos } from '@/data/products'
import type { Categoria, Producto, Combo } from '@/types'

// ─── Types ────────────────────────────────────────────────────────────────────

interface MeseroItem {
  tipo: 'producto' | 'combo'
  id: number
  nombre: string
  precio: number
  cantidad: number
}

const CATEGORIA_COMBOS_ID = 3

// ─── Inline product card ──────────────────────────────────────────────────────

function MeseroProductCard({
  producto,
  index,
  onAgregar,
}: {
  producto: Producto
  index: number
  onAgregar: (p: Producto) => void
}) {
  return (
    <div
      className="flex items-center gap-3 rounded-2xl p-3 animate-slide-up"
      style={{
        background: '#1A1A1A',
        border: '1px solid rgba(255,255,255,0.04)',
        animationDelay: `${index * 0.05}s`,
      }}
    >
      {/* Imagen */}
      <div
        className="w-16 h-16 rounded-xl flex-shrink-0 overflow-hidden flex items-center justify-center text-3xl"
        style={{ background: '#2A2A2A' }}
      >
        {producto.imagen_url && (
          <img src={producto.imagen_url} alt={producto.nombre} className="w-full h-full object-cover" />
        )}
      </div>

      {/* Info */}
      <div className="flex-1 min-w-0">
        <p className="text-white font-extrabold text-sm leading-tight line-clamp-1">{producto.nombre}</p>
        <p className="font-display text-base mt-0.5" style={{ color: '#F28500' }}>
          ${producto.precio_base}
        </p>
      </div>

      {/* Botón + */}
      <button
        onClick={() => onAgregar(producto)}
        className="w-9 h-9 rounded-xl flex-shrink-0 flex items-center justify-center text-white font-black text-lg transition active:scale-90"
        style={{ background: 'linear-gradient(135deg, #F28500 0%, #D4700A 100%)' }}
        aria-label={`Agregar ${producto.nombre}`}
      >
        +
      </button>
    </div>
  )
}

// ─── Inline combo card ────────────────────────────────────────────────────────

function MeseroComboCard({
  combo,
  index,
  onAgregar,
}: {
  combo: Combo
  index: number
  onAgregar: (c: Combo) => void
}) {
  return (
    <div
      className="flex items-center gap-3 rounded-2xl p-3 animate-slide-up"
      style={{
        background: '#1A1A1A',
        border: '1px solid rgba(255,255,255,0.04)',
        animationDelay: `${index * 0.05}s`,
      }}
    >
      {/* Imagen */}
      <div
        className="w-16 h-16 rounded-xl flex-shrink-0 overflow-hidden flex items-center justify-center text-3xl"
        style={{ background: '#2A2A2A' }}
      >
        {combo.imagen_url && (
          <img src={combo.imagen_url} alt={combo.nombre} className="w-full h-full object-cover" />
        )}
      </div>

      {/* Info */}
      <div className="flex-1 min-w-0">
        <p className="text-white font-extrabold text-sm leading-tight line-clamp-1">{combo.nombre}</p>
        <p className="font-display text-base mt-0.5" style={{ color: '#F28500' }}>
          ${combo.precio}
        </p>
      </div>

      {/* Botón + */}
      <button
        onClick={() => onAgregar(combo)}
        className="w-9 h-9 rounded-xl flex-shrink-0 flex items-center justify-center text-white font-black text-lg transition active:scale-90"
        style={{ background: 'linear-gradient(135deg, #F28500 0%, #D4700A 100%)' }}
        aria-label={`Agregar ${combo.nombre}`}
      >
        +
      </button>
    </div>
  )
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function MeseroPage() {
  const router = useRouter()

  // ── Auth ──────────────────────────────────────────────────────────────────
  const [token,   setToken]   = useState<string | null>(null)
  const [usuario, setUsuario] = useState<{ email: string; rol: string } | null>(null)

  useEffect(() => {
    const raw = localStorage.getItem('usuario')
    const tk  = localStorage.getItem('accessToken')
    if (!raw || !tk) { router.push('/login'); return }
    try {
      const u = JSON.parse(raw)
      if (u.rol !== 'mesero' && u.rol !== 'gerente') { router.push('/login'); return }
      setUsuario(u)
      setToken(tk)
    } catch {
      router.push('/login')
    }
  }, [router])

  // ── Menú data ─────────────────────────────────────────────────────────────
  const [search,           setSearch]           = useState('')
  const [categorias,       setCategorias]       = useState<Categoria[]>([])
  const [productos,        setProductos]        = useState<Producto[]>([])
  const [combos,           setCombos]           = useState<Combo[]>([])
  const [activaCategoriaId, setActivaCategoriaId] = useState<number | null>(null)
  const [menuLoading,      setMenuLoading]      = useState(true)
  const [menuError,        setMenuError]        = useState(false)

  const fetchMenu = useCallback(async () => {
    setMenuLoading(true)
    setMenuError(false)
    try {
      const [cats, prods, combosData] = await Promise.all([
        getCategorias(),
        getProductos(),
        getCombos(),
      ])
      setCategorias(cats)
      setProductos(prods)
      setCombos(combosData)
    } catch {
      setMenuError(true)
    } finally {
      setMenuLoading(false)
    }
  }, [])

  useEffect(() => {
    if (usuario) fetchMenu()
  }, [usuario, fetchMenu])

  // ── Carrito local ─────────────────────────────────────────────────────────
  const [items,         setItems]         = useState<MeseroItem[]>([])
  const [nombreCliente, setNombreCliente] = useState('')
  const [enviando,      setEnviando]      = useState(false)
  const [errorOrden,    setErrorOrden]    = useState('')

  const agregarProducto = (producto: Producto) => {
    setItems((prev) => {
      const existe = prev.find((i) => i.tipo === 'producto' && i.id === producto.id)
      if (existe) {
        return prev.map((i) =>
          i.tipo === 'producto' && i.id === producto.id
            ? { ...i, cantidad: i.cantidad + 1 }
            : i
        )
      }
      return [
        ...prev,
        {
          tipo:     'producto',
          id:       producto.id,
          nombre:   producto.nombre,
          precio:   parseFloat(producto.precio_base),
          cantidad: 1,
        },
      ]
    })
  }

  const agregarCombo = (combo: Combo) => {
    setItems((prev) => {
      const existe = prev.find((i) => i.tipo === 'combo' && i.id === combo.id)
      if (existe) {
        return prev.map((i) =>
          i.tipo === 'combo' && i.id === combo.id
            ? { ...i, cantidad: i.cantidad + 1 }
            : i
        )
      }
      return [
        ...prev,
        {
          tipo:     'combo',
          id:       combo.id,
          nombre:   combo.nombre,
          precio:   parseFloat(combo.precio),
          cantidad: 1,
        },
      ]
    })
  }

  const cambiarCantidad = (tipo: 'producto' | 'combo', id: number, delta: number) => {
    setItems((prev) =>
      prev
        .map((i) => (i.tipo === tipo && i.id === id ? { ...i, cantidad: i.cantidad + delta } : i))
        .filter((i) => i.cantidad > 0)
    )
  }

  const eliminarItem = (tipo: 'producto' | 'combo', id: number) => {
    setItems((prev) => prev.filter((i) => !(i.tipo === tipo && i.id === id)))
  }

  const limpiarOrden = () => {
    setItems([])
    setNombreCliente('')
    setErrorOrden('')
  }

  const totalOrden = items.reduce((sum, i) => sum + i.precio * i.cantidad, 0)
  const totalItems = items.reduce((sum, i) => sum + i.cantidad, 0)

  // ── Toast ─────────────────────────────────────────────────────────────────
  const [toast, setToast] = useState<string | null>(null)

  const mostrarToast = (msg: string) => {
    setToast(msg)
    setTimeout(() => setToast(null), 3000)
  }

  // ── Enviar orden ──────────────────────────────────────────────────────────
  const enviarOrden = async () => {
    if (items.length === 0) return
    setEnviando(true)
    setErrorOrden('')
    try {
      const body = {
        tipoServicio:  'mostrador',
        nombreCliente: nombreCliente.trim() || null,
        productos: items
          .filter((i) => i.tipo === 'producto')
          .map((i) => ({ productoId: i.id, cantidad: i.cantidad })),
        combos: items
          .filter((i) => i.tipo === 'combo')
          .map((i) => ({ comboId: i.id, cantidad: i.cantidad })),
      }
      const res = await apiClient.post('/orders', body, {
        headers: { Authorization: `Bearer ${token}` },
      })
      const numero: string = res.data?.numero ?? res.data?.orden?.numero ?? ''
      limpiarOrden()
      mostrarToast(`¡Orden enviada! ${numero}`)
      setActivaMobile('menu')
    } catch (err: any) {
      const msg = err?.response?.data?.error ?? err?.response?.data?.message ?? 'Error al enviar la orden'
      setErrorOrden(msg)
    } finally {
      setEnviando(false)
    }
  }

  // ── Mobile tabs ───────────────────────────────────────────────────────────
  const [activaMobile, setActivaMobile] = useState<'menu' | 'orden'>('menu')

  // ── Filtros del menú ──────────────────────────────────────────────────────
  const mostrandoCombos = activaCategoriaId === CATEGORIA_COMBOS_ID

  const productosFiltrados = productos.filter((p) => {
    const matchCat = activaCategoriaId === null || p.categorias.id === activaCategoriaId
    const matchSearch = search.trim() === '' || p.nombre.toLowerCase().includes(search.toLowerCase())
    return matchCat && matchSearch
  })

  const combosFiltrados = combos.filter(
    (c) => search.trim() === '' || c.nombre.toLowerCase().includes(search.toLowerCase())
  )

  // ─────────────────────────────────────────────────────────────────────────
  if (!usuario) return null

  // ─── Panel izquierdo: menú ────────────────────────────────────────────────
  const panelMenu = (
    <div className="flex flex-col gap-3">
      <SearchBar value={search} onChange={setSearch} />

      {!menuLoading && !menuError && (
        <CategoryFilter
          categorias={categorias}
          activa={activaCategoriaId}
          onChange={setActivaCategoriaId}
        />
      )}

      {menuLoading && (
        <div className="flex flex-col gap-3">
          {[...Array(5)].map((_, i) => (
            <div
              key={i}
              className="rounded-2xl h-[76px] animate-pulse"
              style={{ background: '#1A1A1A' }}
            />
          ))}
        </div>
      )}

      {menuError && (
        <div className="flex flex-col items-center py-10 text-center gap-3">
          <p className="text-white font-extrabold">No se pudo cargar el menú</p>
          <button
            onClick={fetchMenu}
            className="px-5 py-2.5 rounded-xl text-white font-extrabold text-sm active:scale-95 transition"
            style={{ background: 'linear-gradient(135deg, #F28500 0%, #D4700A 100%)' }}
          >
            Reintentar
          </button>
        </div>
      )}

      {!menuLoading && !menuError && (
        <div className="flex flex-col gap-2">
          {mostrandoCombos ? (
            combosFiltrados.length === 0 ? (
              <p className="text-gray-500 text-sm text-center py-8">Sin combos disponibles</p>
            ) : (
              combosFiltrados.map((combo, i) => (
                <MeseroComboCard key={combo.id} combo={combo} index={i} onAgregar={agregarCombo} />
              ))
            )
          ) : productosFiltrados.length === 0 ? (
            <p className="text-gray-500 text-sm text-center py-8">
              {search ? `Sin resultados para "${search}"` : 'Sin productos en esta categoría'}
            </p>
          ) : (
            productosFiltrados.map((prod, i) => (
              <MeseroProductCard key={prod.id} producto={prod} index={i} onAgregar={agregarProducto} />
            ))
          )}
        </div>
      )}
    </div>
  )

  // ─── Panel derecho: orden actual ──────────────────────────────────────────
  const panelOrden = (
    <div
      className="rounded-2xl p-4 flex flex-col gap-4"
      style={{ background: '#131313', border: '1px solid rgba(255,255,255,0.07)' }}
    >
      {/* Nombre del cliente */}
      <div>
        <label className="block text-xs font-bold text-gray-400 mb-1">
          Nombre del cliente (opcional)
        </label>
        <input
          type="text"
          value={nombreCliente}
          onChange={(e) => setNombreCliente(e.target.value)}
          placeholder="Ej: Mesa 3, Juan, Para llevar..."
          className="w-full rounded-xl border border-white/10 bg-[#0A0A0A] px-3 py-2.5 text-sm text-white placeholder-gray-600 focus:border-orange-500 focus:outline-none transition"
        />
      </div>

      {/* Lista de items */}
      {items.length === 0 ? (
        <div className="flex flex-col items-center py-8 text-center gap-2">
          <p className="text-gray-500 text-sm font-semibold">La orden está vacía</p>
          <p className="text-gray-600 text-xs">Toca el + en cualquier producto del menú</p>
        </div>
      ) : (
        <div className="flex flex-col gap-2">
          {items.map((item) => (
            <div
              key={`${item.tipo}-${item.id}`}
              className="flex items-center gap-2 rounded-xl px-3 py-2"
              style={{ background: 'rgba(255,255,255,0.04)' }}
            >
              {/* Nombre */}
              <p className="flex-1 text-white text-sm font-semibold leading-tight line-clamp-1">
                {item.nombre}
              </p>

              {/* Precio unitario */}
              <span className="text-gray-500 text-xs font-semibold flex-shrink-0">
                ${item.precio.toFixed(2)}
              </span>

              {/* Controles cantidad */}
              <div className="flex items-center gap-1 flex-shrink-0">
                <button
                  onClick={() => cambiarCantidad(item.tipo, item.id, -1)}
                  className="w-6 h-6 rounded-lg flex items-center justify-center text-white font-black text-sm transition active:scale-90"
                  style={{ background: 'rgba(242,133,0,0.25)' }}
                >
                  −
                </button>
                <span className="text-white font-extrabold text-sm w-5 text-center">
                  {item.cantidad}
                </span>
                <button
                  onClick={() => cambiarCantidad(item.tipo, item.id, 1)}
                  className="w-6 h-6 rounded-lg flex items-center justify-center text-white font-black text-sm transition active:scale-90"
                  style={{ background: 'rgba(242,133,0,0.25)' }}
                >
                  +
                </button>
              </div>

              {/* Subtotal */}
              <span className="text-xs font-extrabold flex-shrink-0" style={{ color: '#F28500', minWidth: '52px', textAlign: 'right' }}>
                ${(item.precio * item.cantidad).toFixed(2)}
              </span>

              {/* Eliminar */}
              <button
                onClick={() => eliminarItem(item.tipo, item.id)}
                className="text-gray-600 hover:text-red-400 transition flex-shrink-0 ml-1"
                aria-label="Eliminar"
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
                  <path d="M18 6L6 18M6 6l12 12" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" />
                </svg>
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Total */}
      {items.length > 0 && (
        <div
          className="flex items-center justify-between px-3 py-2.5 rounded-xl"
          style={{ background: 'rgba(242,133,0,0.08)', border: '1px solid rgba(242,133,0,0.2)' }}
        >
          <span className="text-gray-300 text-sm font-bold">Total</span>
          <span className="font-extrabold text-xl" style={{ color: '#F28500' }}>
            ${totalOrden.toFixed(2)}
          </span>
        </div>
      )}

      {/* Error */}
      {errorOrden && (
        <p className="text-xs text-red-400 font-semibold">{errorOrden}</p>
      )}

      {/* Acciones */}
      <div className="flex flex-col gap-2">
        <button
          onClick={enviarOrden}
          disabled={enviando || items.length === 0}
          className="w-full py-3 rounded-xl text-white font-extrabold text-sm uppercase tracking-wide transition active:scale-95 disabled:opacity-40"
          style={{ background: 'linear-gradient(135deg, #F28500 0%, #D4700A 100%)' }}
        >
          {enviando ? 'Enviando…' : 'Enviar a cocina'}
        </button>

        {items.length > 0 && (
          <button
            onClick={limpiarOrden}
            disabled={enviando}
            className="w-full py-2.5 rounded-xl font-extrabold text-sm transition active:scale-95 disabled:opacity-40"
            style={{
              background: 'transparent',
              color: '#E74C3C',
              border: '1px solid rgba(231,76,60,0.35)',
            }}
          >
            Limpiar orden
          </button>
        )}
      </div>
    </div>
  )

  // ─── Render ───────────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-[#0A0A0A] text-white">

      {/* ── Header ── */}
      <div
        className="fixed top-0 left-0 right-0 z-50 px-4 py-3 flex items-center justify-between"
        style={{ background: '#111', borderBottom: '1px solid rgba(255,255,255,0.08)' }}
      >
        <div className="flex items-center gap-3">
          <div>
            <h1 className="text-white font-extrabold text-base leading-none">Tomar orden</h1>
            <p className="text-gray-500 text-xs mt-0.5">{usuario.email}</p>
          </div>
        </div>
        <button
          onClick={() => {
            apiClient.post('/auth/logout').catch(() => {})
            localStorage.removeItem('accessToken')
            localStorage.removeItem('usuario')
            router.push('/login')
          }}
          className="text-gray-400 hover:text-white text-xs font-bold px-3 py-1.5 rounded-lg transition"
          style={{ background: 'rgba(255,255,255,0.06)' }}
        >
          Salir
        </button>
      </div>

      {/* ── Mobile tabs ── */}
      <div
        className="lg:hidden fixed top-[52px] left-0 right-0 z-40 flex"
        style={{ background: '#111', borderBottom: '1px solid rgba(255,255,255,0.06)' }}
      >
        {(['menu', 'orden'] as const).map((tab) => (
          <button
            key={tab}
            onClick={() => setActivaMobile(tab)}
            className="flex-1 py-2.5 text-sm font-extrabold transition-all"
            style={{
              color: activaMobile === tab ? '#F28500' : '#6B7280',
              borderBottom: activaMobile === tab ? '2px solid #F28500' : '2px solid transparent',
            }}
          >
            {tab === 'menu'
              ? 'Menú'
              : `Orden${totalItems > 0 ? ` (${totalItems})` : ''}`}
          </button>
        ))}
      </div>

      {/* ── Main ── */}
      <main className="pt-[52px] lg:pt-[52px]">

        {/* Desktop: dos columnas */}
        <div className="hidden lg:flex h-[calc(100vh-52px)] overflow-hidden">
          {/* Menú */}
          <div className="flex-[3] overflow-y-auto px-5 py-5 scrollbar-hide">
            {panelMenu}
          </div>

          {/* Divisor */}
          <div style={{ width: '1px', background: 'rgba(255,255,255,0.06)', flexShrink: 0 }} />

          {/* Orden */}
          <div className="flex-[2] overflow-y-auto px-5 py-5 scrollbar-hide">
            {panelOrden}
          </div>
        </div>

        {/* Mobile: tabs */}
        <div className="lg:hidden pt-10 px-4 pb-8">
          {activaMobile === 'menu' ? panelMenu : panelOrden}
        </div>
      </main>

      {/* ── Toast ── */}
      {toast && (
        <div
          className="fixed bottom-8 left-1/2 -translate-x-1/2 z-50 px-5 py-3 rounded-2xl text-white font-extrabold text-sm shadow-lg whitespace-nowrap"
          style={{ background: 'linear-gradient(135deg, #27AE60 0%, #1E8449 100%)' }}
        >
          {toast}
        </div>
      )}
    </div>
  )
}
