import { MapPin, Car } from "lucide-react"
import type { ExploreCafe, ExploreVehicle } from "@/shared/data/explore-data"
import { Button } from "@/shared/ui/button"
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/shared/ui/card"
import { Badge } from "@/shared/ui/badge"
import { Separator } from "@/shared/ui/separator"

interface VehicleCardProps {
  vehicle: ExploreVehicle & { cafe: ExploreCafe }
  onBookNow: (cafeId: string, vehicleId?: string) => void
}

export function VehicleCard({ vehicle, onBookNow }: VehicleCardProps) {
  return (
    <Card className="border-slate-200/80 bg-white hover:shadow-lg hover:border-orange-200 transition-all duration-300 rounded-2xl overflow-hidden flex flex-col justify-between group">
      
      {/* Vehicle image layout */}
      <div className="relative aspect-[16/10] overflow-hidden bg-slate-100">
        <img
          src={vehicle.image}
          alt={vehicle.name}
          className="object-cover w-full h-full group-hover:scale-105 transition-transform duration-500"
        />

        <div className="absolute top-3 left-3">
          <Badge className="bg-slate-950 text-white border-none font-extrabold text-[9px] backdrop-blur-sm py-0.5 px-2 shadow-sm">
            Tỷ lệ {vehicle.scale}
          </Badge>
        </div>

        <div className="absolute bottom-3 left-3 text-white z-10">
          <div className="flex items-center gap-1 text-[9px] font-extrabold bg-black/60 backdrop-blur-sm py-0.5 px-2 rounded-md">
            <MapPin className="h-3 w-3 text-orange-500 fill-current shrink-0" />
            <span>{vehicle.cafe.name}</span>
          </div>
        </div>
      </div>

      {/* Card Info details */}
      <CardHeader className="p-4 pb-2 space-y-1">
        <span className="text-[8px] font-black text-orange-600 uppercase tracking-widest block">
          🏁 {vehicle.type}
        </span>
        <CardTitle className="text-sm font-black text-slate-950 truncate group-hover:text-orange-600 transition-colors">
          {vehicle.name}
        </CardTitle>
        
        {/* Display specs tags */}
        <div className="grid grid-cols-2 gap-1.5 text-[9px] font-semibold text-slate-500 pt-1">
          <div>🔋 Pin: <span className="font-bold text-slate-700">{vehicle.specs.battery}</span></div>
          <div>🔌 Motor: <span className="font-bold text-slate-700">{vehicle.specs.motor}</span></div>
        </div>
      </CardHeader>

      <CardContent className="p-4 py-2 space-y-2">
        <Separator className="bg-slate-100" />
        <div className="flex items-center justify-between text-xs font-bold text-slate-700">
          <span className="text-slate-500 text-[10px]">Giá thuê theo giờ:</span>
          <span className="text-sm font-black text-slate-900">{vehicle.pricePerHour.toLocaleString("vi-VN")}đ / h</span>
        </div>
      </CardContent>

      <CardFooter className="p-4 pt-1 bg-slate-50/50">
        <Button
          onClick={() => onBookNow(vehicle.cafe.id, vehicle.id)}
          disabled={vehicle.status !== "available"}
          className={`w-full font-bold h-9 rounded-xl text-xs flex items-center justify-center gap-1.5 ${vehicle.status === "available" ? "bg-slate-950 hover:bg-orange-600 text-white" : "bg-slate-200 text-slate-400"}`}
        >
          <Car className="h-3.5 w-3.5" />
          {vehicle.status === "available" ? "Chọn xe & Đặt lịch" : vehicle.status === "rented" ? "Hết xe / Đang thuê" : "Đang bảo trì"}
        </Button>
      </CardFooter>

    </Card>
  )
}
