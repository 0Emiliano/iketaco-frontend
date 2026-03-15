import apiClient from '@/lib/api/client'
import type { Categoria, Producto, Combo, Promocion } from '@/types'

export const getCategorias = async (): Promise<Categoria[]> => {
  const res = await apiClient.get('/menu/categorias')
  return res.data
}

export const getProductos = async (): Promise<Producto[]> => {
  const res = await apiClient.get('/menu/productos')
  return res.data
}

export const getProductoById = async (id: number): Promise<Producto> => {
  const res = await apiClient.get(`/menu/productos/${id}`)
  return res.data
}

export const getProductosByCategoria = async (categoriaId: number): Promise<Producto[]> => {
  const res = await apiClient.get(`/menu/categorias/${categoriaId}/productos`)
  return res.data
}

export const getCombos = async (): Promise<Combo[]> => {
  const res = await apiClient.get('/menu/combos')
  return res.data
}

export const getPromociones = async (): Promise<Promocion[]> => {
  const res = await apiClient.get('/menu/promociones')
  return res.data
}
