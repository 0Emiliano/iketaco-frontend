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
  tipo_descuento: 'porcentaje' | 'monto_fijo'
  valor: string
  combo_id: number | null
  solo_dia: string | null
  fecha_inicio: string | null
  fecha_fin: string | null
  activo: boolean
  combos: {
    id: number
    nombre: string
    precio: string
    imagen_url: string | null
  } | null
}

// ─── Órdenes ─────────────────────────────────────────────────────────────────
export type TipoServicio = 'mostrador' | 'domicilio' | 'evento'

export interface OrdenProductoItem {
  productoId: number
  cantidad: number
  notas?: string
}

export interface OrdenComboItem {
  comboId: number
  cantidad: number
}

export interface OrdenRequest {
  tipoServicio: TipoServicio
  direccionEntrega?: string
  telefonoCliente?: string
  nombreCliente?: string
  notas?: string
  productos: OrdenProductoItem[]
  combos: OrdenComboItem[]
}

// ─── Carrito ─────────────────────────────────────────────────────────────────
export interface CartItemProducto {
  tipo: 'producto'
  producto: Producto
  quantity: number
}

export interface CartItemCombo {
  tipo: 'combo'
  combo: Combo
  quantity: number
}

export type CartItem = CartItemProducto | CartItemCombo

export type CartAction =
  | { type: 'ADD_PRODUCTO'; producto: Producto; quantity: number }
  | { type: 'ADD_COMBO'; combo: Combo; quantity: number }
  | { type: 'REMOVE_ITEM'; itemId: number; itemTipo: 'producto' | 'combo' }
  | { type: 'UPDATE_QUANTITY'; itemId: number; itemTipo: 'producto' | 'combo'; quantity: number }
  | { type: 'CLEAR_CART' }
