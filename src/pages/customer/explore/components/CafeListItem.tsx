import { MapPin, Star } from "lucide-react"
import { Link } from "react-router"
import type { Cafe } from "@/shared/data/explore-data"
import { buildCafeDetailPath } from "@/pages/customer/cafe-detail/cafe-detail-utils"
import { formatCurrency } from "@/shared/lib/format"

export function CafeListItem({ cafe, onQuickView, onBookNow }: { cafe: Cafe; onQuickView: (cafe: Cafe) => void; onBookNow: (cafeId: string, vehicleId?: string) => void }) {
  const cheapest = cafe.availableVehicles.length > 0
    ? Math.min(...cafe.availableVehicles.map((v) => v.pricePerHour))
    : 0
  const availCount = cafe.availableVehicles.filter((v) => v.status === "available").length

  return (
    <div className="flex gap-3 border-b border-slate-100 px-0 py-3 transition hover:bg-slate-50">
      {/* Image */}
      <Link to={buildCafeDetailPath(cafe)} className="relative h-[120px] w-[180px] shrink-0 overflow-hidden border border-slate-200 bg-slate-100">
        <img src={cafe.image} alt={cafe.name} className="h-full w-full object-cover transition duration-300 hover:scale-105" />
        <span className="absolute bottom-1 left-1 bg-black/70 px-1.5 py-0.5 text-[10px] font-semibold text-white">
          ★ {cafe.rating}
        </span>
      </Link>

      {/* Info */}
      <div className="flex min-w-0 flex-1 gap-3">
        <div className="min-w-0 flex-1">
          <Link to={buildCafeDetailPath(cafe)} className="text-sm font-bold text-slate-900 hover:text-orange-600 line-clamp-1">
            {cafe.name}
          </Link>
          <p className="mt-0.5 flex items-center gap-1 text-[11px] text-slate-500">
            <MapPin className="h-3 w-3 shrink-0" />
            <span className="truncate">{cafe.address}</span>
          </p>
          <div className="mt-1.5 flex flex-wrap gap-1">
            {cafe.trackTypes.map((t) => (
              <span key={t} className="border border-slate-200 px-1.5 py-0.5 text-[10px] font-medium text-slate-600">{t}</span>
            ))}
          </div>
          <div className="mt-1.5 flex flex-wrap gap-1">
            {cafe.features.slice(0, 3).map((f) => (
              <span key={f} className="text-[10px] text-slate-400">• {f}</span>
            ))}
          </div>
          <div className="mt-2 flex items-center gap-3 text-[11px] text-slate-500">
            <span>{cafe.availableVehicles.length} xe</span>
            <span className="text-emerald-600">{availCount} sẵn sàng</span>
          </div>
        </div>

        {/* Price & CTA */}
        <div className="flex shrink-0 flex-col items-end justify-between">
          <div className="text-right">
            <p className="text-xs font-bold text-slate-900">{formatCurrency(cheapest)}</p>
            <p className="text-[10px] text-slate-400">/giờ</p>
          </div>
          <div className="flex gap-1">
            <button
              onClick={() => onQuickView(cafe)}
              className="border border-slate-200 px-2.5 py-1.5 text-[11px] font-semibold text-slate-600 hover:bg-slate-100"
            >
              Xem
            </button>
            <button
              onClick={() => onBookNow(cafe.id)}
              className="bg-slate-900 px-3 py-1.5 text-[11px] font-semibold text-white hover:bg-orange-600"
            >
              Đặt
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
