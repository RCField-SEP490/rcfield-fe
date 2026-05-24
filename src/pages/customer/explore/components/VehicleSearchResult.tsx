import { Car } from "lucide-react"
import type { VehicleWithCafe } from "../explore-utils"
import { Button } from "@/shared/ui/button"
import { formatCurrency } from "@/shared/lib/format"

export function VehicleSearchResult({ vehicle, onBookNow }: { vehicle: VehicleWithCafe; onBookNow: (cafeId: string, vehicleId?: string) => void }) {
  return (
    <article className="grid gap-4 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm md:grid-cols-[220px_1fr]">
      <div className="aspect-[16/10] overflow-hidden rounded-xl bg-slate-100">
        <img src={vehicle.image} alt={vehicle.name} className="h-full w-full object-cover" />
      </div>
      <div className="flex flex-col justify-between gap-4">
        <div>
          <p className="text-xs font-black uppercase tracking-wide text-orange-600">{vehicle.type} · {vehicle.scale}</p>
          <h2 className="mt-1 text-xl font-black text-slate-950">{vehicle.name}</h2>
          <p className="mt-1 text-sm font-bold text-slate-500">Tại {vehicle.cafe.name}, {vehicle.cafe.city}</p>
          <div className="mt-3 grid gap-2 text-xs font-bold text-slate-500 sm:grid-cols-3">
            <span>Pin: {vehicle.specs.battery}</span>
            <span>Motor: {vehicle.specs.motor}</span>
            <span>Hãng: {vehicle.specs.brand}</span>
          </div>
        </div>
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-lg font-black text-slate-950">{formatCurrency(vehicle.pricePerHour)}/giờ</p>
          <Button type="button" disabled={vehicle.status !== "available"} onClick={() => onBookNow(vehicle.cafe.id, vehicle.id)} className="h-10 rounded-xl bg-slate-950 font-black text-white hover:bg-orange-600">
            <Car className="h-4 w-4" /> {vehicle.status === "available" ? "Chọn xe & đặt lịch" : "Xe chưa sẵn sàng"}
          </Button>
        </div>
      </div>
    </article>
  )
}
