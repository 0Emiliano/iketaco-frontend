export default function MenuSkeleton() {
  return (
    <div className="flex flex-col gap-3 animate-pulse">
      {[...Array(5)].map((_, i) => (
        <div
          key={i}
          className="flex items-center gap-4 rounded-2xl p-3"
          style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border-color)' }}
        >
          {/* Image placeholder */}
          <div
            className="w-24 h-24 rounded-xl flex-shrink-0"
            style={{ background: 'var(--bg-card-hover)' }}
          />
          {/* Text placeholders */}
          <div className="flex-1 flex flex-col gap-2">
            <div className="h-4 rounded-lg w-3/4" style={{ background: 'var(--bg-card-hover)' }} />
            <div className="h-3 rounded-lg w-full" style={{ background: 'var(--bg-secondary)' }} />
            <div className="h-3 rounded-lg w-2/3" style={{ background: 'var(--bg-secondary)' }} />
            <div className="h-5 rounded-lg w-1/3 mt-1" style={{ background: 'var(--bg-card-hover)' }} />
          </div>
        </div>
      ))}
    </div>
  )
}
