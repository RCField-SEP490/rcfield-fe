import { MapPin, Star, Wifi, ShieldCheck, Navigation } from "lucide-react"
import { Link } from "react-router"
import type { Cafe } from "@/shared/data/explore-data"
import { buildCafeDetailPath } from "@/pages/customer/cafe-detail/cafe-detail-utils"
import { formatCurrency } from "@/shared/lib/format"
import { formatDistance } from "../explore-utils"
import { Badge } from "@/shared/ui/badge"
import { Button } from "@/shared/ui/button"
import { Card, CardContent } from "@/shared/ui/card"

export function CafeListItem({ cafe, distanceKm, onQuickView, onBookNow }: { cafe: Cafe; distanceKm?: number; onQuickView: (cafe: Cafe) => void; onBookNow: (cafeId: string, vehicleId?: string) => void }) {
  const cheapest = cafe.availableVehicles.length > 0 ? Math.min(...cafe.availableVehicles.map((v) => v.pricePerHour)) : 0
  const availCount = cafe.availableVehicles.filter((v) => v.status === "available").length
  const priceLabel = cheapest > 0 ? formatCurrency(cheapest) : cafe.priceRange

  return (
    <Card className="overflow-hidden rounded-xl shadow-sm transition hover:border-primary/30 hover:shadow-md">
      <CardContent className="grid gap-4 p-3 sm:grid-cols-[220px_1fr] lg:grid-cols-[230px_1fr_160px]">
        <Link to={buildCafeDetailPath(cafe)} className="relative h-44 overflow-hidden rounded-lg bg-muted sm:h-full">
          <img src={cafe.image} alt={cafe.name} className="h-full w-full object-cover transition duration-300 hover:scale-105" />
          {cafe.rating > 0 && (
            <Badge className="absolute left-2 top-2 gap-1 bg-background/95 text-foreground shadow-sm"><Star className="h-3 w-3 fill-yellow-500 text-yellow-500" /> {cafe.rating}</Badge>
          )}
        </Link>

        <div className="min-w-0 space-y-3">
          <div>
            <Link to={buildCafeDetailPath(cafe)} className="line-clamp-1 text-lg font-semibold tracking-tight text-foreground hover:text-primary">{cafe.name}</Link>
            <p className="mt-1 flex items-center gap-1 text-sm text-muted-foreground">
              <MapPin className="h-4 w-4 shrink-0" />
              <span className="line-clamp-1">{cafe.address}</span>
              {distanceKm !== undefined && (
                <span className="ml-1 inline-flex shrink-0 items-center gap-0.5 rounded-full bg-emerald-50 px-2 py-0.5 text-xs font-medium text-emerald-700">
                  <Navigation className="h-2.5 w-2.5" />{formatDistance(distanceKm)}
                </span>
              )}
            </p>
          </div>
          <p className="line-clamp-2 text-sm leading-6 text-muted-foreground">{cafe.description}</p>
          <div className="flex flex-wrap gap-1.5">
            {cafe.trackTypes.map((track) => <Badge key={track} variant="secondary" className="rounded-md">{track}</Badge>)}
            {cafe.features.includes("Serious Inspection") && <Badge variant="outline" className="rounded-md gap-1"><ShieldCheck className="h-3 w-3" /> Kiểm xe</Badge>}
            {cafe.features.includes("Hệ thống Đèn đêm") && <Badge variant="outline" className="rounded-md gap-1"><Wifi className="h-3 w-3" /> Đèn đêm</Badge>}
          </div>
          <div className="flex flex-wrap items-center gap-3 text-sm text-muted-foreground">
            {cafe.availableVehicles.length > 0 && <span>{cafe.availableVehicles.length} xe thuê</span>}
            {availCount > 0 && <span className="font-medium text-emerald-600">{availCount} xe sẵn sàng</span>}
            {cafe.reviewsCount > 0 && <span>{cafe.reviewsCount} đánh giá</span>}
            {cafe.availableVehicles.length === 0 && cafe.reviewsCount === 0 && (
              <span className="italic">Chưa có thông tin xe & đánh giá</span>
            )}
          </div>
        </div>

        <div className="flex flex-row items-center justify-between gap-3 border-t pt-3 sm:col-span-2 lg:col-span-1 lg:flex-col lg:items-end lg:border-l lg:border-t-0 lg:pl-4 lg:pt-0">
          <div className="text-left lg:text-right">
            <p className="text-xs text-muted-foreground">Từ</p>
            <p className="text-xl font-semibold text-foreground">{priceLabel}</p>
            <p className="text-xs text-muted-foreground">{cheapest > 0 ? "/giờ" : ""}</p>
          </div>
          <div className="flex gap-2 lg:w-full lg:flex-col">
            <Button type="button" variant="outline" onClick={() => onQuickView(cafe)} className="lg:w-full">Xem nhanh</Button>
            <Button type="button" onClick={() => onBookNow(cafe.id)} className="lg:w-full">Đặt nhanh</Button>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
