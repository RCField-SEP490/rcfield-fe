import { useState } from "react"
import { ChevronLeft, ChevronRight } from "lucide-react"
import { useTrackConfigs } from "@/features/cafes/hooks/useTrackConfigs"
import type { TrackConfig } from "@/features/cafes/types"

export function TrackConfigList({ cafeId }: { cafeId: string }) {
  const { data: configs = [], isLoading } = useTrackConfigs(cafeId)

  if (isLoading) {
    return (
      <div className="flex gap-3 overflow-hidden">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="h-56 w-48 shrink-0 animate-pulse rounded-xl bg-slate-100" />
        ))}
      </div>
    )
  }

  if (configs.length === 0) return null

  return (
    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
      {configs.map((config) => (
        <TrackCard key={config.id} config={config} />
      ))}
    </div>
  )
}

function TrackCard({ config }: { config: TrackConfig }) {
  const [imageIdx, setImageIdx] = useState(0)

  const prev = (e: React.MouseEvent) => {
    e.stopPropagation()
    setImageIdx((i) => Math.max(0, i - 1))
  }
  const next = (e: React.MouseEvent) => {
    e.stopPropagation()
    setImageIdx((i) => Math.min(config.images.length - 1, i + 1))
  }

  return (
    <article className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
      <div className="relative aspect-video w-full overflow-hidden bg-slate-100">
        {config.images.length > 0 ? (
          <>
            <img
              src={config.images[imageIdx]}
              alt={`${config.track_type?.name} ${imageIdx + 1}`}
              className="h-full w-full object-cover"
            />
            {config.images.length > 1 && (
              <>
                <button
                  type="button"
                  onClick={prev}
                  disabled={imageIdx === 0}
                  className="absolute left-2 top-1/2 -translate-y-1/2 rounded-full bg-black/40 p-1 text-white disabled:opacity-0"
                >
                  <ChevronLeft className="size-3.5" />
                </button>
                <button
                  type="button"
                  onClick={next}
                  disabled={imageIdx === config.images.length - 1}
                  className="absolute right-2 top-1/2 -translate-y-1/2 rounded-full bg-black/40 p-1 text-white disabled:opacity-0"
                >
                  <ChevronRight className="size-3.5" />
                </button>
                <div className="absolute bottom-2 left-1/2 flex -translate-x-1/2 gap-1">
                  {config.images.slice(0, 5).map((_, i) => (
                    <span
                      key={i}
                      className={`h-1.5 w-1.5 rounded-full transition-colors ${i === imageIdx ? "bg-white" : "bg-white/50"}`}
                    />
                  ))}
                </div>
              </>
            )}
          </>
        ) : (
          <div className="flex h-full items-center justify-center text-slate-300 text-xs">Chưa có ảnh</div>
        )}
      </div>
      <div className="p-3">
        <p className="text-sm font-bold text-slate-900">{config.track_type?.name ?? "Loại sân"}</p>
        <p className="mt-0.5 text-xs text-slate-500">BYOC: tối đa {config.byoc_capacity} xe</p>
        {config.description && (
          <p className="mt-1.5 line-clamp-2 text-xs leading-5 text-slate-600">{config.description}</p>
        )}
      </div>
    </article>
  )
}
