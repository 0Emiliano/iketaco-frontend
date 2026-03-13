// ─── Categorías ─────────────────────────────────────────────────────────────
export type CategoryKey = 'todo' | 'tacos' | 'combos' | 'quesabirrias'

export interface Category {
  key: CategoryKey
  label: string
}

// ─── Producto ────────────────────────────────────────────────────────────────
export interface Product {
  id: string
  slug: string
  name: string
  description: string
  price: number
  /** Category that this product belongs to (not 'todo') */
  category: Exclude<CategoryKey, 'todo'>
  imageGradient?: string // CSS gradient string used as placeholder image
  popular?: boolean
}

// ─── Carrito ─────────────────────────────────────────────────────────────────
export interface CartItem {
  product: Product
  quantity: number
}

export interface CartState {
  items: CartItem[]
}

export type CartAction =
  | { type: 'ADD_ITEM'; product: Product; quantity: number }
  | { type: 'REMOVE_ITEM'; productId: string }
  | { type: 'UPDATE_QUANTITY'; productId: string; quantity: number }
  | { type: 'CLEAR_CART' }

// ─── API (para integración futura) ───────────────────────────────────────────
export interface ApiProduct {
  id_product: number
  name: string
  description: string
  price: number
  slug: string
  category: string
}

export interface ApiResponse<T> {
  data: T
  status: number
}
