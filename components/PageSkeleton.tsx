// Generic skeleton shown while SSR pages are loading their server-side data.
// Renders instantly — no client JS needed.
export default function PageSkeleton({ rows = 4 }: { rows?: number }) {
  return (
    <div className="flex flex-col gap-4 max-w-3xl animate-pulse">
      {/* Header bar */}
      <div className="flex items-center gap-3 h-6">
        <div className="w-4 h-4 rounded bg-muted-foreground/20" />
        <div className="w-40 h-4 rounded bg-muted-foreground/20" />
        <div className="ml-auto w-8 h-8 rounded bg-muted-foreground/10" />
      </div>

      {/* Search / filter bar */}
      <div className="h-10 w-full sm:max-w-xs rounded-md bg-muted-foreground/10" />

      {/* Card skeleton */}
      <div className="rounded-xl border border-border bg-card overflow-hidden">
        {/* card header */}
        <div className="px-4 py-3 border-b border-border flex items-center gap-3">
          <div className="w-3 h-3 rounded-full bg-muted-foreground/20" />
          <div className="w-48 h-3.5 rounded bg-muted-foreground/20" />
        </div>

        {/* rows */}
        <div className="divide-y divide-border/50">
          {Array.from({ length: rows }).map((_, i) => (
            <div key={i} className="px-4 py-4 flex items-center gap-3">
              <div className="w-2.5 h-2.5 rounded-full bg-muted-foreground/20 shrink-0" />
              <div className="flex-1 flex flex-col gap-1.5">
                <div className="w-32 h-3 rounded bg-muted-foreground/20" />
                <div className="w-48 h-2.5 rounded bg-muted-foreground/15" />
              </div>
              <div className="w-24 h-7 rounded-full bg-muted-foreground/10 shrink-0" />
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
