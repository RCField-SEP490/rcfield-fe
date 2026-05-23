import { Eye, MapPin, ShieldCheck, Star, Zap } from "lucide-react"
import { Link } from "react-router"
import type { Cafe } from "@/shared/data/explore-data"
import { Badge } from "@/shared/ui/badge"
import { Button } from "@/shared/ui/button"
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/shared/ui/card"
import { buildCafeDetailPath } from "@/pages/customer/cafe-detail/cafe-detail-utils"
import { VehicleMiniList } from "./VehicleMiniList"

export function CafeCard({ cafe, onBookNow }: { cafe: Cafe; onQuickView: (cafe: Cafe) => void; onBookNow: (cafeId: string, vehicleId?: string) => void }) {
  return (
    <Card className="group flex h-full flex-col overflow-hidden rounded-[1.75rem] border-white/70 bg-white shadow-xl shadow-slate-200/60 transition hover:-translate-y-1 hover:shadow-2xl hover:shadow-slate-300/60">
      <Link to={buildCafeDetailPath(cafe)} className="block">
        <div className="relative aspect-[16/10] overflow-hidden bg-slate-100">
          <img src={cafe.image} alt={cafe.name} className="h-full w-full object-cover object-center transition duration-700 group-hover:scale-110" />
          <div className="absolute inset-0 bg-gradient-to-t from-slate-950/80 via-transparent to-transparent" />
          <div className="absolute left-3 top-3 flex flex-wrap gap-2">
            <Badge className="bg-white/95 font-black text-slate-950 shadow-sm"><Star className="h-3 w-3 fill-orange-500 text-orange-500" /> {cafe.rating}</Badge>
            {cafe.features.includes("Serious Inspection") && <Badge className="bg-emerald-500/95 font-black text-white"><ShieldCheck className="h-3 w-3" /> Serious</Badge>}
          </div>
          <div className="absolute bottom-3 left-3 right-3 flex items-end justify-between gap-3 text-white">
            <div>
              <p className="flex items-center gap-1 text-xs font-bold text-slate-200"><MapPin className="h-3.5 w-3.5 text-orange-400" /> {cafe.district}, {cafe.city}</p>
              <h2 className="mt-1 line-clamp-1 text-xl font-black">{cafe.name}</h2>
            </div>
            <Badge className="shrink-0 bg-orange-500 font-black text-white"><Zap className="h-3 w-3" /> Live</Badge>
          </div>
        </div>
      </Link>

      <CardHeader className="space-y-3 p-4">
        <div className="flex flex-wrap gap-1.5">
          {cafe.trackTypes.map((type) => <Badge key={type} variant="secondary" className="bg-orange-50 text-[10px] font-black text-orange-700">{type}</Badge>)}
        </div>
        <p className="line-clamp-2 min-h-10 text-sm font-medium leading-5 text-slate-500">{cafe.description}</p>
        <CardTitle className="flex items-center justify-between gap-3 text-sm font-black text-slate-950">
          <span>{cafe.availableVehicles.length} xe thuê</span>
          <span className="shrink-0 whitespace-nowrap rounded-full bg-slate-100 px-3 py-1 text-xs">{cafe.priceRange}</span>
        </CardTitle>
      </CardHeader>

      <CardContent className="flex-1 space-y-3 p-4 pt-0">
        <VehicleMiniList cafeId={cafe.id} vehicles={cafe.availableVehicles} onBookNow={onBookNow} />
      </CardContent>

      <CardFooter className="mt-auto grid grid-cols-2 gap-2 border-t border-slate-100 bg-slate-50/80 p-4">
        <Button asChild type="button" variant="outline" className="h-11 rounded-2xl bg-white font-black"><Link to={buildCafeDetailPath(cafe)}><Eye className="h-4 w-4" /> Chi tiết</Link></Button>
        <Button type="button" onClick={() => onBookNow(cafe.id)} className="h-11 rounded-2xl bg-slate-950 font-black text-white hover:bg-orange-600">Đặt nhanh</Button>
      </CardFooter>
    </Card>
  )
}
