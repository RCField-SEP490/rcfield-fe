import { Eye, MapPin, ShieldCheck, Star } from "lucide-react"
import type { Cafe } from "@/shared/data/explore-data"
import { Badge } from "@/shared/ui/badge"
import { Button } from "@/shared/ui/button"
import { VehicleMiniList } from "./VehicleMiniList"

export function CafeListItem({ cafe, onQuickView, onBookNow }: { cafe: Cafe; onQuickView: (cafe: Cafe) => void; onBookNow: (cafeId: string, vehicleId?: string) => void }) {
  return (
    <article className="grid gap-4 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm transition hover:border-orange-200 hover:shadow-md md:grid-cols-[260px_1fr]">
      <div className="relative aspect-[16/10] overflow-hidden rounded-xl bg-slate-100 md:aspect-auto">
        <img src={cafe.image} alt={cafe.name} className="h-full w-full object-cover" />
        <Badge className="absolute left-3 top-3 bg-white/95 font-black text-slate-950"><Star className="h-3 w-3 fill-orange-500 text-orange-500" /> {cafe.rating}</Badge>
      </div>
      <div className="flex min-w-0 flex-col justify-between gap-4">
        <div className="space-y-3">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div className="min-w-0">
              <h2 className="truncate text-xl font-black text-slate-950">{cafe.name}</h2>
              <p className="mt-1 flex items-center gap-1 text-sm font-bold text-slate-500"><MapPin className="h-4 w-4 text-orange-600" /> {cafe.address}</p>
            </div>
            <p className="shrink-0 rounded-full bg-slate-100 px-3 py-1 text-xs font-black text-slate-700">{cafe.priceRange}</p>
          </div>
          <p className="line-clamp-2 text-sm font-medium leading-6 text-slate-600">{cafe.description}</p>
          <div className="flex flex-wrap gap-1.5">
            {cafe.trackTypes.map((type) => <Badge key={type} variant="secondary" className="bg-orange-50 font-black text-orange-700">{type}</Badge>)}
            {cafe.features.includes("Serious Inspection") && <Badge className="bg-emerald-50 font-black text-emerald-700"><ShieldCheck className="h-3 w-3" /> Serious Inspection</Badge>}
          </div>
        </div>
        <div className="space-y-3">
          <VehicleMiniList cafeId={cafe.id} vehicles={cafe.availableVehicles} onBookNow={onBookNow} />
          <div className="flex flex-col gap-2 sm:flex-row">
            <Button type="button" variant="outline" onClick={() => onQuickView(cafe)} className="h-10 rounded-xl bg-white font-black"><Eye className="h-4 w-4" /> Chi tiết</Button>
            <Button type="button" onClick={() => onBookNow(cafe.id)} className="h-10 rounded-xl bg-slate-950 font-black text-white hover:bg-orange-600">Đặt sân ngay</Button>
          </div>
        </div>
      </div>
    </article>
  )
}
