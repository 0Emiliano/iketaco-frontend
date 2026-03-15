'use client'

import { createContext, useContext, useReducer, type ReactNode } from 'react'
import type { Producto, CartItem, CartAction } from '@/types'

// ─── State ────────────────────────────────────────────────────────────────────
interface CartState {
  items: CartItem[]
}

// ─── Reducer ──────────────────────────────────────────────────────────────────
function cartReducer(state: CartState, action: CartAction): CartState {
  switch (action.type) {
    case 'ADD_ITEM': {
      const existing = state.items.find((i) => i.producto.id === action.producto.id)
      if (existing) {
        return {
          ...state,
          items: state.items.map((i) =>
            i.producto.id === action.producto.id
              ? { ...i, quantity: i.quantity + action.quantity }
              : i
          ),
        }
      }
      return {
        ...state,
        items: [...state.items, { producto: action.producto, quantity: action.quantity }],
      }
    }

    case 'REMOVE_ITEM':
      return {
        ...state,
        items: state.items.filter((i) => i.producto.id !== action.productoId),
      }

    case 'UPDATE_QUANTITY': {
      if (action.quantity <= 0) {
        return {
          ...state,
          items: state.items.filter((i) => i.producto.id !== action.productoId),
        }
      }
      return {
        ...state,
        items: state.items.map((i) =>
          i.producto.id === action.productoId ? { ...i, quantity: action.quantity } : i
        ),
      }
    }

    case 'CLEAR_CART':
      return { items: [] }

    default:
      return state
  }
}

// ─── Context ──────────────────────────────────────────────────────────────────
interface CartContextValue {
  state: CartState
  totalItems: number
  subtotal: number
  total: number
  addItem: (producto: Producto, quantity: number) => void
  removeItem: (productoId: number) => void
  updateQuantity: (productoId: number, quantity: number) => void
  clearCart: () => void
  dispatch: React.Dispatch<CartAction>
}

const CartContext = createContext<CartContextValue | undefined>(undefined)

// ─── Provider ─────────────────────────────────────────────────────────────────
export function CartProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(cartReducer, { items: [] })

  const totalItems = state.items.reduce((sum, i) => sum + i.quantity, 0)
  const subtotal = state.items.reduce(
    (sum, i) => sum + parseFloat(i.producto.precio_base) * i.quantity,
    0
  )
  const total = subtotal

  const addItem = (producto: Producto, quantity: number) =>
    dispatch({ type: 'ADD_ITEM', producto, quantity })

  const removeItem = (productoId: number) => dispatch({ type: 'REMOVE_ITEM', productoId })

  const updateQuantity = (productoId: number, quantity: number) =>
    dispatch({ type: 'UPDATE_QUANTITY', productoId, quantity })

  const clearCart = () => dispatch({ type: 'CLEAR_CART' })

  return (
    <CartContext.Provider
      value={{
        state,
        totalItems,
        subtotal,
        total,
        addItem,
        removeItem,
        updateQuantity,
        clearCart,
        dispatch,
      }}
    >
      {children}
    </CartContext.Provider>
  )
}

// ─── Hook ─────────────────────────────────────────────────────────────────────
export function useCart(): CartContextValue {
  const ctx = useContext(CartContext)
  if (!ctx) throw new Error('useCart debe usarse dentro de <CartProvider>')
  return ctx
}
