import { MapPin } from "lucide-react"
import type { ExploreCafe } from "@/shared/data/explore-data"
import { Button } from "@/shared/ui/button"
import { Badge } from "@/shared/ui/badge"

interface CafeCardHorizontalProps {
  cafe: ExploreCafe
  isHovered: boolean
  onQuickView: (cafe: ExploreCafe) => void
  onBookNow: (cafeId: string, vehicleId?: string) => void
}

export function CafeCardHorizontal({
  cafe,
  isHovered,
  onQuickView,
  onBookNow
}: CafeCardHorizontalProps) {
  return (
    <div
      className={`p-4 bg-white rounded-2xl border transition-all duration-300 grid grid-cols-1 sm:grid-cols-12 gap-4 ${
        isHovered
          ? "border-orange-500 shadow-md shadow-orange-500/5 bg-slate-50/20"
          : "border-slate-200/80 shadow-sm"
      }`}
    >
      {/* Aspect Image col (4 cols on sm up) */}
      <div className="sm:col-span-4 relative rounded-xl overflow-hidden aspect-[4/3] bg-slate-100">
        <img src={cafe.image} alt={cafe.name} className="object-cover w-full h-full" />
        <div className="absolute top-2 left-2">
          <Badge className="bg-white/95 text-slate-900 border-none font-extrabold text-[9px] py-0.5 px-1.5 shadow-sm">
            ★ {cafe.rating}
          </Badge>
        </div>
      </div>

      {/* Details info col (8 cols on sm up) */}
      <div className="sm:col-span-8 flex flex-col justify-between space-y-3">
        <div className="space-y-1">
          <div className="flex items-center justify-between gap-2">
            <span className="text-[8px] font-black text-orange-600 uppercase tracking-widest bg-orange-50 px-1.5 py-0.5 rounded">
              {cafe.trackTypes.join(" • ")}
            </span>
            <span className="text-[10px] font-extrabold text-slate-900">{cafe.priceRange}</span>
          </div>

          <h3 className="text-sm font-black text-slate-950 truncate">{cafe.name}</h3>

          <p className="text-[11px] font-semibold text-slate-500 flex items-start gap-1">
            <MapPin className="h-3.5 w-3.5 text-orange-500 shrink-0 mt-0.5 fill-current" />
            <span className="truncate">{cafe.address}</span>
          </p>

          <p className="text-[10px] font-semibold text-slate-600 line-clamp-1 leading-normal">
            {cafe.description}
          </p>
        </div>

        {/* Small Horizontal list of rental cars inside Horizontal Card */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
          <span className="text-[8px] font-black text-slate-400 uppercase tracking-wider shrink-0 mr-1">
            Thuê xe:
          </span>
          {cafe.availableVehicles.map((vehicle) => (
            <div
              key={vehicle.id}
              className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-slate-100 text-[8px] font-bold text-slate-700 border border-slate-200/50 max-w-[120px] truncate shrink-0"
            >
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 shrink-0" />
              <span className="truncate">{vehicle.name.split(" ")[0]}</span>
            </div>
          ))}
        </div>

        <div className="flex items-center gap-2 pt-1 border-t border-slate-100">
          <Button
            size="sm"
            onClick={() => onQuickView(cafe)}
            variant="outline"
            className="h-8 rounded-lg text-[10px] font-black px-3 py-1 text-slate-700 bg-white"
          >
            Chi tiết
          </Button>
          <Button
            size="sm"
            onClick={() => onBookNow(cafe.id)}
            className="h-8 rounded-lg text-[10px] font-black px-3 py-1 bg-slate-950 hover:bg-orange-600 text-white flex-grow sm:flex-initial"
          >
            Đặt sân ngay
          </Button>
        </div>
      </div>
    </div>
  )
}
