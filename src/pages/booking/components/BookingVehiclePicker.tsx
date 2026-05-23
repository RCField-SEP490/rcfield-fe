import type { Vehicle } from "@/shared/data/explore-data"
import { cn } from "@/shared/lib/utils"
import { Badge } from "@/shared/ui/badge"

interface BookingVehiclePickerProps {
  vehicles: Vehicle[]
  selectedId?: string
  onSelect: (id: string) => void
}

/** Chọn xe thuê - gọn nhẹ, dạng danh sách ngang */
export function BookingVehiclePicker({ vehicles, selectedId, onSelect }: BookingVehiclePickerProps) {
  if (!vehicles.length) return null

  return (
    <div className="space-y-2">
      <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">Chọn xe thuê (tùy chọn)</p>
      <div className="grid grid-cols-3 gap-2">
        {vehicles.map((v) => {
          const isSelected = selectedId === v.id
          const isUnavailable = v.status !== "available"
          return (
            <button
              key={v.id}
              type="button"
              disabled={isUnavailable}
              onClick={() => onSelect(v.id)}
              className={cn(
                "rounded-xl border p-2 text-left transition-all duration-200",
                isSelected
                  ? "border-slate-900 bg-slate-900 text-white shadow-md shadow-slate-900/15"
                  : isUnavailable
                    ? "cursor-not-allowed border-slate-100 bg-slate-50 opacity-50 rounded-xl"
                    : "border-slate-200 bg-white hover:border-slate-300 hover:shadow-sm",
              )}
            >
              <div className="aspect-[4/3] overflow-hidden bg-slate-100">
                <img src={v.image} alt={v.name} className="h-full w-full object-cover" />
              </div>
              <div className="mt-1.5 space-y-0.5">
                <p className={cn("truncate text-xs font-semibold", isSelected ? "text-white" : "text-slate-900")}>
                  {v.name}
                </p>
                <p className={cn("text-[10px] font-medium", isSelected ? "text-white/70" : "text-slate-500")}>
                  {v.type} · {v.scale}
                </p>
                {isUnavailable && (
                  <Badge variant="outline" className="mt-1 border-red-200 bg-red-50 text-[10px] text-red-600">
                    Đang bận
                  </Badge>
                )}
              </div>
            </button>
          )
        })}
      </div>
    </div>
  )
}
