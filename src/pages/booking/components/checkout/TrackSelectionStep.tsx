import { CheckCircle2, ImageOff } from "lucide-react"
import { useTrackConfigs } from "@/features/cafes/hooks/useTrackConfigs"
import type { TrackConfig } from "@/features/cafes/types"
import { cn } from "@/shared/lib/utils"

interface TrackSelectionStepProps {
  cafeId: string
  selectedTrackConfigId: string | null
  onSelect: (config: TrackConfig) => void
}

export function TrackSelectionStep({ cafeId, selectedTrackConfigId, onSelect }: TrackSelectionStepProps) {
  const { data: configs = [], isLoading } = useTrackConfigs(cafeId)

  if (isLoading) {
    return (
      <div className="space-y-3">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="h-28 animate-pulse rounded-xl bg-muted" />
        ))}
      </div>
    )
  }

  if (configs.length === 0) {
    return (
      <div className="rounded-xl border border-dashed p-8 text-center">
        <ImageOff className="mx-auto mb-2 size-8 text-muted-foreground" />
        <p className="text-sm font-medium text-muted-foreground">Cơ sở chưa cấu hình loại sân</p>
        <p className="mt-1 text-xs text-muted-foreground">Vui lòng liên hệ cơ sở để biết thêm thông tin.</p>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-lg font-bold tracking-tight">Chọn loại sân</h2>
        <p className="text-sm text-muted-foreground">Chọn loại sân bạn muốn chơi trước khi tiếp tục</p>
      </div>
      <div className="grid gap-3 sm:grid-cols-2">
        {configs.map((config) => (
          <TrackConfigCard
            key={config.id}
            config={config}
            isSelected={selectedTrackConfigId === config.id}
            onSelect={() => onSelect(config)}
          />
        ))}
      </div>
    </div>
  )
}

function TrackConfigCard({
  config,
  isSelected,
  onSelect,
}: {
  config: TrackConfig
  isSelected: boolean
  onSelect: () => void
}) {
  const [imageIdx, setImageIdx] = useState(0)

  return (
    <button
      type="button"
      onClick={onSelect}
      className={cn(
        "relative flex flex-col overflow-hidden rounded-xl border-2 text-left transition-all",
        isSelected
          ? "border-orange-500 shadow-[0_0_0_3px_rgba(249,115,22,0.15)]"
          : "border-border hover:border-orange-300 hover:shadow-sm",
      )}
    >
      {/* Image carousel */}
      <div className="relative aspect-video w-full overflow-hidden bg-muted">
        {config.images.length > 0 ? (
          <>
            <img
              src={config.images[imageIdx]}
              alt={`${config.track_type?.name} ảnh ${imageIdx + 1}`}
              className="h-full w-full object-cover"
            />
            {config.images.length > 1 && (
              <div className="absolute bottom-2 left-1/2 flex -translate-x-1/2 gap-1">
                {config.images.slice(0, 5).map((_, i) => (
                  <button
                    key={i}
                    type="button"
                    onClick={(e) => { e.stopPropagation(); setImageIdx(i) }}
                    className={cn(
                      "h-1.5 w-1.5 rounded-full transition-colors",
                      i === imageIdx ? "bg-white" : "bg-white/50",
                    )}
                  />
                ))}
              </div>
            )}
          </>
        ) : (
          <div className="flex h-full items-center justify-center">
            <ImageOff className="size-8 text-muted-foreground/40" />
          </div>
        )}
        {isSelected && (
          <div className="absolute right-2 top-2 rounded-full bg-orange-500 p-0.5">
            <CheckCircle2 className="size-4 text-white" />
          </div>
        )}
      </div>

      <div className="p-3">
        <p className="font-bold text-[#1c1b1b]">{config.track_type?.name ?? "Loại sân"}</p>
        <p className="mt-0.5 text-xs text-muted-foreground">BYOC: tối đa {config.byoc_capacity} xe</p>
        {config.description && (
          <p className="mt-1 line-clamp-2 text-xs text-muted-foreground">{config.description}</p>
        )}
      </div>
    </button>
  )
}

// useState must be imported since TrackConfigCard uses it
import { useState } from "react"
