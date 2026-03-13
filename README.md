# 🌮 I KE TACOS — Frontend

App móvil de pedidos de birria construida con **Next.js 15 + TypeScript + Tailwind CSS**.

---

## ⚡ Inicio rápido

```bash
# 1. Instalar dependencias
npm install

# 2. Crear variables de entorno
cp .env.example .env.local

# 3. Correr en desarrollo
npm run dev
```

Abre [http://localhost:3000](http://localhost:3000) en tu navegador.

---

## 📱 Pantallas (del PDF de prototipo)

| Ruta | Pantalla |
|------|----------|
| `/` | **Home** — Banner promo + Más Populares |
| `/menu` | **Menú** — Búsqueda + filtros por categoría |
| `/product/[slug]` | **Detalle** — Descripción, cantidad, precio total |
| `/cart` | **Carrito** — Items, resumen, IVA, realizar pedido |
| `/confirmacion` | **Confirmación** — Pedido recibido ✓ |

---

## 🗂️ Estructura del proyecto

```
src/
├── app/                    # Rutas Next.js (App Router)
│   ├── layout.tsx          # Root layout (fuentes, CartProvider, BottomNav)
│   ├── page.tsx            # Home
│   ├── menu/
│   ├── product/[slug]/
│   ├── cart/
│   └── confirmacion/
├── components/
│   ├── ui/                 # NavComponent, BottomNav, LogoIcon
│   ├── home/               # HeroBanner, PopularSection
│   ├── menu/               # SearchBar, CategoryFilter, ProductCard, ProductList
│   ├── product/            # ProductDetail, QuantitySelector
│   └── cart/               # CartItem, OrderSummary
├── context/
│   └── CartContext.tsx     # Estado global del carrito (useReducer)
├── data/
│   └── products.ts         # Datos del menú (mock — listo para conectar a API)
├── lib/api/
│   └── client.ts           # Cliente Axios (interceptor JWT)
└── types/
    └── index.ts            # Product, CartItem, CartState, CategoryKey...
```

---

## 🎨 Diseño

- **Paleta:** Negro profundo `#0A0A0A` + Naranja `#F28500`
- **Tipografía:** [Bebas Neue](https://fonts.google.com/specimen/Bebas+Neue) (display) + [Nunito](https://fonts.google.com/specimen/Nunito) (cuerpo)
- **Mobile-first** — ancho máx. 480px, bottom nav fija
- **Modo oscuro** nativo

---

## 🔌 Conectar backend

Edita `.env.local`:

```env
NEXT_PUBLIC_API_BASE_URL=http://localhost:3001/api
```

El cliente Axios en `src/lib/api/client.ts` ya tiene interceptor para JWT.

---

## 🛠️ Tecnologías

| Tech | Versión |
|------|---------|
| Next.js | 15.1 |
| React | 19 |
| TypeScript | 5 |
| Tailwind CSS | 3.4 |
| Axios | 1.7 |

---

## 📦 Scripts

```bash
npm run dev      # Desarrollo con HMR
npm run build    # Build de producción
npm run start    # Servir build
npm run lint     # ESLint
```
