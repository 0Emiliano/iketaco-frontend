'use client'

import type { Category, CategoryKey } from '@/types'

interface CategoryFilterProps {
  categories: Category[]
  active: CategoryKey
  onChange: (key: CategoryKey) => void
}

export default function CategoryFilter({ categories, active, onChange }: CategoryFilterProps) {
  return (
    <div className="flex gap-2 overflow-x-auto scrollbar-hide pb-1">
      {categories.map((cat) => {
        const isActive = cat.key === active
        return (
          <button
            key={cat.key}
            onClick={() => onChange(cat.key)}
            className="flex-shrink-0 px-4 py-2 rounded-full text-sm font-extrabold transition-all duration-200 active:scale-95"
            style={
              isActive
                ? {
                    background: 'linear-gradient(135deg, #F28500 0%, #D4700A 100%)',
                    color: '#FFFFFF',
                    boxShadow: '0 4px 12px rgba(242,133,0,0.4)',
                  }
                : {
                    background: '#1E1E1E',
                    color: '#9CA3AF',
                    border: '1px solid rgba(255,255,255,0.07)',
                  }
            }
          >
            {cat.label}
          </button>
        )
      })}
    </div>
  )
}
