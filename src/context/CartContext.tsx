'use client'

import { createContext, useContext, useReducer, type ReactNode } from 'react'
import type { Producto, Combo, CartItem, CartAction } from '@/types'

interface CartState {
  items: CartItem[]
}

function cartReducer(state: CartState, action: CartAction): CartState {
  switch (action.type) {
    case 'ADD_PRODUCTO': {
      const existing = state.items.find(
        (i) => i.tipo === 'producto' && i.producto.id === action.producto.id
      )
      if (existing) {
        return {
          ...state,
          items: state.items.map((i) =>
            i.tipo === 'producto' && i.producto.id === action.producto.id
              ? { ...i, quantity: i.quantity + action.quantity }
              : i
          ),
        }
      }
      return {
        ...state,
        items: [
          ...state.items,
          { tipo: 'producto', producto: action.producto, quantity: action.quantity },
        ],
      }
    }

    case 'ADD_COMBO': {
      const existing = state.items.find((i) => i.tipo === 'combo' && i.combo.id === action.combo.id)
      if (existing) {
        return {
          ...state,
          items: state.items.map((i) =>
            i.tipo === 'combo' && i.combo.id === action.combo.id
              ? { ...i, quantity: i.quantity + action.quantity }
              : i
          ),
        }
      }
      return {
        ...state,
        items: [...state.items, { tipo: 'combo', combo: action.combo, quantity: action.quantity }],
      }
    }

    case 'REMOVE_ITEM':
      return {
        ...state,
        items: state.items.filter((i) => {
          if (action.itemTipo === 'producto') {
            return !(i.tipo === 'producto' && i.producto.id === action.itemId)
          }
          return !(i.tipo === 'combo' && i.combo.id === action.itemId)
        }),
      }

    case 'UPDATE_QUANTITY': {
      if (action.quantity <= 0) {
        return {
          ...state,
          items: state.items.filter((i) => {
            if (action.itemTipo === 'producto') {
              return !(i.tipo === 'producto' && i.producto.id === action.itemId)
            }
            return !(i.tipo === 'combo' && i.combo.id === action.itemId)
          }),
        }
      }
      return {
        ...state,
        items: state.items.map((i) => {
          if (
            action.itemTipo === 'producto' &&
            i.tipo === 'producto' &&
            i.producto.id === action.itemId
          ) {
            return { ...i, quantity: action.quantity }
          }
          if (action.itemTipo === 'combo' && i.tipo === 'combo' && i.combo.id === action.itemId) {
            return { ...i, quantity: action.quantity }
          }
          return i
        }),
      }
    }

    case 'CLEAR_CART':
      return { items: [] }

    default:
      return state
  }
}

interface CartContextValue {
  state: CartState
  totalItems: number
  subtotal: number
  total: number
  addProducto: (producto: Producto, quantity: number) => void
  addCombo: (combo: Combo, quantity: number) => void
  removeItem: (itemId: number, itemTipo: 'producto' | 'combo') => void
  updateQuantity: (itemId: number, itemTipo: 'producto' | 'combo', quantity: number) => void
  clearCart: () => void
  dispatch: React.Dispatch<CartAction>
}

const CartContext = createContext<CartContextValue | undefined>(undefined)

export function CartProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(cartReducer, { items: [] })

  const totalItems = state.items.reduce((sum, i) => sum + i.quantity, 0)

  const subtotal = state.items.reduce((sum, i) => {
    if (i.tipo === 'producto') {
      return sum + parseFloat(i.producto.precio_base) * i.quantity
    }
    return sum + parseFloat(i.combo.precio) * i.quantity
  }, 0)

  const total = subtotal

  const addProducto = (producto: Producto, quantity: number) =>
    dispatch({ type: 'ADD_PRODUCTO', producto, quantity })

  const addCombo = (combo: Combo, quantity: number) =>
    dispatch({ type: 'ADD_COMBO', combo, quantity })

  const removeItem = (itemId: number, itemTipo: 'producto' | 'combo') =>
    dispatch({ type: 'REMOVE_ITEM', itemId, itemTipo })

  const updateQuantity = (itemId: number, itemTipo: 'producto' | 'combo', quantity: number) =>
    dispatch({ type: 'UPDATE_QUANTITY', itemId, itemTipo, quantity })

  const clearCart = () => dispatch({ type: 'CLEAR_CART' })

  return (
    <CartContext.Provider
      value={{
        state,
        totalItems,
        subtotal,
        total,
        addProducto,
        addCombo,
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

export function useCart(): CartContextValue {
  const ctx = useContext(CartContext)
  if (!ctx) throw new Error('useCart debe usarse dentro de <CartProvider>')
  return ctx
}
