import { Navigation, Star, Heart } from "lucide-react"
import { Link } from "react-router"
import type { Cafe } from "@/shared/data/explore-data"
import { buildCafeDetailPath } from "@/pages/customer/cafe-detail/cafe-detail-utils"
import { formatCurrency } from "@/shared/lib/format"
import { formatDistance } from "../explore-utils"
import { Button } from "@/shared/ui/button"
import { cn } from "@/shared/lib/utils"

export function CafeGridCard({
  cafe,
  isFavorite,
  onToggleFavorite,
  distanceKm,
  onQuickView,
  onBookNow,
  onHover,
}: {
  cafe: Cafe
  isFavorite: boolean
  onToggleFavorite: (cafeId: string) => void
  distanceKm?: number
  onQuickView: (cafe: Cafe) => void
  onBookNow: (cafeId: string) => void
  onHover: (cafeId: string | null) => void
}) {
  const cheapest =
    cafe.availableVehicles.length > 0
      ? Math.min(...cafe.availableVehicles.map((v) => v.pricePerHour))
      : 0
  const priceLabel = cheapest > 0 ? formatCurrency(cheapest) : cafe.priceRange

  return (
    <div
      className="group cursor-pointer"
      onMouseEnter={() => onHover(cafe.id)}
      onMouseLeave={() => onHover(null)}
    >
      {/* Image — bo góc to, không có card wrapper */}
      <Link
        to={buildCafeDetailPath(cafe)}
        className="relative block aspect-[4/3] overflow-hidden rounded-2xl bg-muted"
      >
        <img
          src={cafe.image}
          alt={cafe.name}
          className="h-full w-full object-cover transition duration-500 group-hover:scale-[1.03]"
        />

        {/* Favorite button */}
        <button
          type="button"
          onClick={(e) => {
            e.preventDefault()
            e.stopPropagation()
            onToggleFavorite(cafe.id)
          }}
          className="absolute left-3 top-3 z-10 flex h-7 w-7 items-center justify-center rounded-full bg-background/90 text-slate-600 shadow-sm backdrop-blur-sm transition-all hover:scale-110 active:scale-95"
        >
          <Heart className={cn("h-3.5 w-3.5", isFavorite ? "fill-red-500 text-red-500" : "text-slate-600 hover:text-red-500")} />
        </button>

        {/* Rating badge */}
        {cafe.rating > 0 && (
          <div className="absolute right-3 top-3">
            <span className="inline-flex items-center gap-1 rounded-full bg-background/90 px-2.5 py-1 text-xs font-semibold shadow-sm backdrop-blur-sm">
              <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />
              {cafe.rating}
            </span>
          </div>
        )}

        {/* Distance badge */}
        {distanceKm !== undefined && (
          <div className="absolute bottom-3 left-3">
            <span className="inline-flex items-center gap-1 rounded-full bg-background/90 px-2.5 py-1 text-xs font-medium text-emerald-700 shadow-sm backdrop-blur-sm">
              <Navigation className="h-3 w-3" />
              {formatDistance(distanceKm)}
            </span>
          </div>
        )}

        {/* Action buttons — chỉ hiện khi hover */}
        <div className="absolute inset-x-3 bottom-3 flex translate-y-1 items-center justify-end gap-2 opacity-0 transition-all duration-200 group-hover:translate-y-0 group-hover:opacity-100">
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="h-8 bg-background/90 px-3 text-xs backdrop-blur-sm"
            onClick={(e) => { e.preventDefault(); onQuickView(cafe) }}
          >
            Xem nhanh
          </Button>
          <Button
            type="button"
            size="sm"
            className="h-8 px-3 text-xs"
            onClick={(e) => { e.preventDefault(); onBookNow(cafe.id) }}
          >
            Đặt ngay
          </Button>
        </div>
      </Link>

      {/* Text info — không có border, chỉ là text trên nền trang */}
      <div className="pt-3">
        <div className="flex items-start justify-between gap-3">
          <Link
            to={buildCafeDetailPath(cafe)}
            className="line-clamp-1 flex-1 font-semibold leading-snug hover:underline"
          >
            {cafe.name}
          </Link>
          {cafe.rating > 0 && (
            <span className="flex shrink-0 items-center gap-1 text-sm font-semibold">
              <Star className="h-3.5 w-3.5 fill-foreground" />
              {cafe.rating}
            </span>
          )}
        </div>

        <p className="mt-0.5 truncate text-sm text-muted-foreground">
          {cafe.district}, {cafe.city}
        </p>

        {cafe.trackTypes.length > 0 && (
          <p className="mt-0.5 truncate text-sm text-muted-foreground">
            {cafe.trackTypes.slice(0, 2).join(" · ")}
          </p>
        )}

        <p className="mt-2 text-sm">
          <span className="font-semibold">{priceLabel}</span>
          {cheapest > 0 && <span className="text-muted-foreground"> /giờ</span>}
        </p>
      </div>
    </div>
  )
}
