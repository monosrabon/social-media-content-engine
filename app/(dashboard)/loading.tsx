/**
 * Dashboard Loading State
 *
 * Shown as an instant skeleton while server components fetch their data.
 * Next.js automatically renders this file during page transitions.
 */

export default function DashboardLoading() {
  return (
    <div className="space-y-6 max-w-7xl animate-pulse">
      {/* Greeting skeleton */}
      <div className="flex items-center justify-between">
        <div className="space-y-2">
          <div className="h-7 w-56 bg-muted rounded-lg" />
          <div className="h-4 w-80 bg-muted/60 rounded-md" />
        </div>
        <div className="h-9 w-32 bg-muted rounded-lg" />
      </div>

      {/* KPI Cards skeleton — 4 cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div
            key={i}
            className="rounded-xl border border-border/50 bg-card p-5 space-y-3"
          >
            <div className="flex items-center justify-between">
              <div className="h-4 w-24 bg-muted rounded" />
              <div className="h-8 w-8 bg-muted rounded-lg" />
            </div>
            <div className="h-8 w-16 bg-muted rounded" />
            <div className="h-3 w-32 bg-muted/60 rounded" />
          </div>
        ))}
      </div>

      {/* Chart + Activity row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Chart skeleton */}
        <div className="lg:col-span-2 rounded-xl border border-border/50 bg-card p-5 space-y-4">
          <div className="flex items-center justify-between">
            <div className="h-5 w-40 bg-muted rounded" />
            <div className="h-4 w-24 bg-muted/60 rounded" />
          </div>
          <div className="h-52 bg-muted/30 rounded-lg" />
        </div>

        {/* Activity skeleton */}
        <div className="rounded-xl border border-border/50 bg-card p-5 space-y-4">
          <div className="h-5 w-32 bg-muted rounded" />
          <div className="space-y-3">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="flex items-start gap-3">
                <div className="h-7 w-7 bg-muted rounded-full flex-shrink-0 mt-0.5" />
                <div className="space-y-1.5 flex-1">
                  <div className="h-3.5 bg-muted rounded w-3/4" />
                  <div className="h-3 bg-muted/60 rounded w-1/2" />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Recent posts skeleton */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="h-5 w-28 bg-muted rounded" />
          <div className="h-4 w-16 bg-muted/60 rounded" />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div
              key={i}
              className="rounded-xl border border-border/50 bg-card p-4 space-y-3"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="space-y-1.5 flex-1">
                  <div className="h-4 bg-muted rounded w-3/4" />
                  <div className="h-3.5 bg-muted/60 rounded w-full" />
                  <div className="h-3.5 bg-muted/60 rounded w-2/3" />
                </div>
                <div className="h-6 w-20 bg-muted rounded-full flex-shrink-0" />
              </div>
              <div className="flex items-center gap-2">
                <div className="h-5 w-16 bg-muted rounded-full" />
                <div className="h-5 w-16 bg-muted rounded-full" />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
