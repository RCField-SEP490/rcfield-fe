import { MapPin } from "lucide-react"
import type { ExploreCafe, ExploreVehicle } from "@/shared/data/explore-data"
import { Button } from "@/shared/ui/button"
import { formatCurrency } from "@/shared/lib/format"

interface VehicleCardHorizontalProps {
  vehicle: ExploreVehicle & { cafe: ExploreCafe }
  onBookNow: (cafeId: string, vehicleId?: string) => void
}

export function VehicleCardHorizontal({ vehicle, onBookNow }: VehicleCardHorizontalProps) {
  return (
    <div className="p-4 bg-white rounded-2xl border border-slate-200/80 shadow-sm grid grid-cols-1 sm:grid-cols-12 gap-4">
      
      {/* Image (3 cols) */}
      <div className="sm:col-span-3 rounded-xl overflow-hidden aspect-[4/3] bg-slate-100 relative">
        <img src={vehicle.image} alt={vehicle.name} className="object-cover w-full h-full" />
        <span className="absolute top-2 left-2 px-1.5 py-0.5 rounded bg-black/75 text-[8px] font-black text-white">
          Tỷ lệ {vehicle.scale}
        </span>
      </div>

      {/* Details (9 cols) */}
      <div className="sm:col-span-9 flex flex-col justify-between space-y-2">
        <div className="space-y-1">
          <div className="flex items-center justify-between text-[8px] font-black text-orange-600 uppercase tracking-widest">
            <span>{vehicle.type}</span>
            <span className="text-xs font-black text-slate-900">{formatCurrency(vehicle.pricePerHour)} / giờ</span>
          </div>

          <h3 className="text-sm font-black text-slate-950 truncate">{vehicle.name}</h3>

          <p className="text-[10px] font-semibold text-slate-500 flex items-center gap-1">
            <MapPin className="h-3.5 w-3.5 text-orange-500 fill-current shrink-0" />
            <span>Thuộc cơ sở: {vehicle.cafe.name}</span>
          </p>

          <div className="grid grid-cols-3 gap-1 text-[9px] font-bold text-slate-500 pt-1">
            <div>🔋 {vehicle.specs.battery}</div>
            <div>🔌 {vehicle.specs.motor}</div>
            <div className="truncate">🏷️ {vehicle.specs.brand}</div>
          </div>
        </div>

        <div className="flex gap-2 border-t border-slate-100 pt-2">
          <Button
            size="sm"
            onClick={() => onBookNow(vehicle.cafe.id, vehicle.id)}
            disabled={vehicle.status !== "available"}
            className={`h-8 rounded-lg text-[10px] font-black px-4 ${vehicle.status === "available" ? "bg-slate-950 hover:bg-orange-600 text-white" : "bg-slate-200 text-slate-400"}`}
          >
            {vehicle.status === "available" ? "Chọn xe & Đặt lịch" : "Đang bận"}
          </Button>
        </div>
      </div>

    </div>
  )
}
