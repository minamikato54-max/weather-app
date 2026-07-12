export function LoadingSkeleton() {
  return (
    <div className="w-full max-w-xl animate-pulse space-y-4 rounded-2xl bg-white/60 p-6 dark:bg-black/30">
      <div className="h-6 w-1/3 rounded bg-black/10 dark:bg-white/10" />
      <div className="h-16 w-1/2 rounded bg-black/10 dark:bg-white/10" />
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="h-16 rounded bg-black/10 dark:bg-white/10" />
        ))}
      </div>
    </div>
  )
}
