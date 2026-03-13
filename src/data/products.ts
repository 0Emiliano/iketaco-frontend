import type { Product, Category, CategoryKey } from '@/types'

// ─── Categorías disponibles ──────────────────────────────────────────────────
export const CATEGORIES: Category[] = [
  { key: 'todo', label: 'Todo' },
  { key: 'tacos', label: 'Tacos' },
  { key: 'combos', label: 'Combos' },
  { key: 'quesabirrias', label: 'Quesabirrias' },
]

// ─── Menú completo ────────────────────────────────────────────────────────────
export const PRODUCTS: Product[] = [
  {
    id: '1',
    slug: 'tacos-de-birria',
    name: 'Tacos de Birria',
    description: '3 tacos de birria',
    price: 60,
    category: 'tacos',
    popular: false,
    imageGradient: 'linear-gradient(135deg, #7c3a00 0%, #4a2000 50%, #1a0a00 100%)',
  },
  {
    id: '2',
    slug: 'combo-ke-tacos',
    name: 'Combo Ke Tacos',
    description: '3 Tacos, 1 Quesabirria, 1 Bichi, 1 bebida',
    price: 160,
    category: 'combos',
    popular: true,
    imageGradient: 'linear-gradient(135deg, #8b4500 0%, #5c2d00 50%, #1a0a00 100%)',
  },
  {
    id: '3',
    slug: 'combo-queso',
    name: 'Combo Queso',
    description: '2 Quesabirrias, 1 Doriqueso, 1 Bichi, 1 bebida',
    price: 145,
    category: 'combos',
    popular: true,
    imageGradient: 'linear-gradient(135deg, #9a5200 0%, #6b3800 50%, #1a0a00 100%)',
  },
  {
    id: '4',
    slug: 'combo-dorado',
    name: 'Combo Dorado',
    description: '3 Tacos Dorados, 1 Bichi, 1 Bebida',
    price: 130,
    category: 'combos',
    popular: true,
    imageGradient: 'linear-gradient(135deg, #a06000 0%, #7a4500 50%, #1a0a00 100%)',
  },
  {
    id: '5',
    slug: 'quesbirrias',
    name: 'Quesbirrias',
    description: '3 Quesabirrias',
    price: 90,
    category: 'quesabirrias',
    popular: false,
    imageGradient: 'linear-gradient(135deg, #7a4000 0%, #512800 50%, #1a0a00 100%)',
  },
]

// ─── Helpers ──────────────────────────────────────────────────────────────────
export const getProductBySlug = (slug: string): Product | undefined =>
  PRODUCTS.find((p) => p.slug === slug)

export const getPopularProducts = (): Product[] =>
  PRODUCTS.filter((p) => p.popular)

export const getProductsByCategory = (category: CategoryKey): Product[] =>
  category === 'todo' ? PRODUCTS : PRODUCTS.filter((p) => p.category === category)
