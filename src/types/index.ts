// ─── Categorías ──────────────────────────────────────────────────────────────
export interface Categoria {
  id: number
  nombre: string
  descripcion: string | null
  activo: boolean
}

// ─── Productos ───────────────────────────────────────────────────────────────
export interface Producto {
  id: number
  nombre: string
  descripcion: string | null
  precio_base: string
  disponible: boolean
  imagen_url: string | null
  categorias: {
    id: number
    nombre: string
  }
}

// ─── Combos ──────────────────────────────────────────────────────────────────
export interface ComboItem {
  id: number
  cantidad: number
  productos: {
    id: number
    nombre: string
    precio_base: string
    imagen_url: string | null
  }
}

export interface Combo {
  id: number
  nombre: string
  descripcion: string | null
  precio: string
  disponible: boolean
  imagen_url: string | null
  combo_items: ComboItem[]
}

// ─── Promociones ─────────────────────────────────────────────────────────────
export interface Promocion {
  id: number
  nombre: string
  descripcion: string | null
  tipo_descuento: string
  valor: string
  solo_dia: string | null
  combos: {
    id: number
    nombre: string
    precio: string
    imagen_url: string | null
  } | null
}

// ─── Carrito ─────────────────────────────────────────────────────────────────
export interface CartItem {
  producto: Producto
  quantity: number
}

export type CartAction =
  | { type: 'ADD_ITEM'; producto: Producto; quantity: number }
  | { type: 'REMOVE_ITEM'; productoId: number }
  | { type: 'UPDATE_QUANTITY'; productoId: number; quantity: number }
  | { type: 'CLEAR_CART' }
