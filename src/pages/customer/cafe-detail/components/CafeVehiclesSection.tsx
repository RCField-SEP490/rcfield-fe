import { BatteryCharging, Car, Gauge, Check } from "lucide-react"
import type { Cafe } from "@/shared/data/explore-data"
import { formatCurrency } from "@/shared/lib/format"
import { Badge } from "@/shared/ui/badge"
import { Button } from "@/shared/ui/button"
import { Card, CardContent } from "@/shared/ui/card"
import { cn } from "@/shared/lib/utils"

type CafeVehiclesSectionProps = {
  cafe: Cafe
  selectedVehicleId?: string
  onSelectVehicle: (id: string | undefined) => void
}

export function CafeVehiclesSection({ cafe, selectedVehicleId, onSelectVehicle }: CafeVehiclesSectionProps) {
  return (
    <section className="space-y-3">
      <div>
        <h2 className="text-lg font-bold text-slate-950">Chọn xe thuê</h2>
        <p className="mt-1 text-sm text-slate-500">
          Click trực tiếp vào xe bên dưới để chọn thuê nhanh. Xe đã chọn sẽ được cộng vào hóa đơn checkout tự động.
        </p>
      </div>

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
        {cafe.availableVehicles.map((vehicle) => {
          const isSelected = vehicle.id === selectedVehicleId
          
          return (
            <Card 
              key={vehicle.id} 
              onClick={() => onSelectVehicle(isSelected ? undefined : vehicle.id)}
              className={cn(
                "flex h-full flex-col overflow-hidden rounded-xl border-slate-200 shadow-sm transition-all duration-300 cursor-pointer hover:shadow-md",
                isSelected && "ring-2 ring-orange-500 border-transparent bg-orange-50/10 shadow-[0_8px_30px_rgba(249,115,22,0.08)]"
              )}
            >
              <div className="aspect-[4/3] overflow-hidden bg-slate-100 relative">
                <img src={vehicle.image} alt={vehicle.name} className="h-full w-full object-cover object-center" />
                {isSelected && (
                  <div className="absolute top-2 right-2 bg-orange-500 text-white rounded-full p-1 shadow-md">
                    <Check className="h-3 w-3" />
                  </div>
                )}
              </div>
              <CardContent className="flex flex-1 flex-col space-y-3 p-3">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <h3 className="truncate text-sm font-bold text-slate-950">{vehicle.name}</h3>
                    <p className="mt-0.5 text-xs text-slate-500">{vehicle.type} · {vehicle.scale}</p>
                  </div>
                  <Badge 
                    variant={isSelected ? "default" : (vehicle.status === "available" ? "secondary" : "outline")} 
                    className={cn("shrink-0 rounded-full text-[10px]", isSelected && "bg-orange-500 text-white hover:bg-orange-500")}
                  >
                    {isSelected ? "Đã chọn" : (vehicle.status === "available" ? "Sẵn sàng" : "Đang bận")}
                  </Badge>
                </div>

                <div className="grid grid-cols-3 gap-2 text-[11px] text-slate-500">
                  <Spec icon={BatteryCharging} label={vehicle.specs.battery} />
                  <Spec icon={Gauge} label={vehicle.specs.motor} />
                  <Spec icon={Car} label={vehicle.specs.brand} />
                </div>

                <div className="mt-auto flex items-center justify-between gap-3 border-t pt-3">
                  <div>
                    <p className="text-xs text-slate-500">Từ</p>
                    <p className="text-sm font-bold text-slate-950">{formatCurrency(vehicle.pricePerHour)}/giờ</p>
                  </div>
                  <Button 
                    type="button"
                    size="sm" 
                    variant={isSelected ? "default" : "outline"} 
                    className={cn(
                      "h-8 rounded-lg px-3 text-xs font-semibold transition-all",
                      isSelected ? "bg-orange-500 hover:bg-orange-600 text-white" : "hover:text-orange-500"
                    )}
                  >
                    {isSelected ? (
                      <span className="flex items-center gap-1">
                        <Check className="h-3.5 w-3.5" /> Đã chọn
                      </span>
                    ) : "Chọn xe"}
                  </Button>
                </div>
              </CardContent>
            </Card>
          )
        })}
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
