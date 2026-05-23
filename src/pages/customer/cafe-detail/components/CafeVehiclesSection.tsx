import { Link } from "react-router"
import { BatteryCharging, Car, Gauge } from "lucide-react"
import type { Cafe } from "@/shared/data/explore-data"
import { formatCurrency } from "@/shared/lib/format"
import { Badge } from "@/shared/ui/badge"
import { Button } from "@/shared/ui/button"
import { Card, CardContent } from "@/shared/ui/card"
import { buildCafeBookingPath } from "../cafe-detail-utils"

export function CafeVehiclesSection({ cafe }: { cafe: Cafe }) {
  return (
    <section className="space-y-3">
      <div className="flex items-end justify-between gap-3">
        <div>
          <h2 className="text-lg font-bold text-slate-950">Chọn xe thuê</h2>
          <p className="mt-1 text-sm text-slate-500">Xe có thể chọn ở checkout, hiển thị trước để khách biết cấu hình và giá.</p>
        </div>
        <Button asChild variant="outline" size="sm" className="hidden shrink-0 sm:inline-flex">
          <Link to={buildCafeBookingPath(cafe.id, "hourly")}>Đặt với xe thuê</Link>
        </Button>
      </div>

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
        {cafe.availableVehicles.map((vehicle) => (
          <Card key={vehicle.id} className="overflow-hidden rounded-xl border-slate-200 shadow-sm">
            <div className="aspect-[4/3] overflow-hidden bg-slate-100">
              <img src={vehicle.image} alt={vehicle.name} className="h-full w-full object-cover" />
            </div>
            <CardContent className="space-y-3 p-3">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <h3 className="truncate text-sm font-bold text-slate-950">{vehicle.name}</h3>
                  <p className="mt-0.5 text-xs text-slate-500">{vehicle.type} · {vehicle.scale}</p>
                </div>
                <Badge variant={vehicle.status === "available" ? "secondary" : "outline"} className="shrink-0 rounded-full text-[10px]">
                  {vehicle.status === "available" ? "Sẵn sàng" : "Đang bận"}
                </Badge>
              </div>

              <div className="grid grid-cols-3 gap-2 text-[11px] text-slate-500">
                <Spec icon={BatteryCharging} label={vehicle.specs.battery} />
                <Spec icon={Gauge} label={vehicle.specs.motor} />
                <Spec icon={Car} label={vehicle.specs.brand} />
              </div>

              <div className="flex items-center justify-between gap-3 border-t pt-3">
                <div>
                  <p className="text-xs text-slate-500">Từ</p>
                  <p className="text-sm font-bold text-slate-950">{formatCurrency(vehicle.pricePerHour)}/giờ</p>
                </div>
                <Button asChild size="sm" variant="outline" className="h-8 rounded-lg px-3 text-xs">
                  <Link to={buildCafeBookingPath(cafe.id, "hourly")}>Chọn xe</Link>
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </section>
  )
}

function Spec({ icon: Icon, label }: { icon: typeof BatteryCharging; label: string }) {
  return (
    <span className="flex min-w-0 items-center gap-1.5">
      <Icon className="h-3.5 w-3.5 shrink-0 text-slate-400" />
      <span className="truncate">{label}</span>
    </span>
  )
}
