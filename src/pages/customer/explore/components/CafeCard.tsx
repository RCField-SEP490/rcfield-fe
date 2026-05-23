import { Eye, MapPin, ShieldCheck, Star } from "lucide-react"
import type { Cafe } from "@/shared/data/explore-data"
import { Badge } from "@/shared/ui/badge"
import { Button } from "@/shared/ui/button"
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/shared/ui/card"
import { VehicleMiniList } from "./VehicleMiniList"

export function CafeCard({ cafe, onQuickView, onBookNow }: { cafe: Cafe; onQuickView: (cafe: Cafe) => void; onBookNow: (cafeId: string, vehicleId?: string) => void }) {
  return (
    <Card className="overflow-hidden rounded-2xl border-slate-200 bg-white shadow-sm transition hover:-translate-y-0.5 hover:border-orange-200 hover:shadow-lg">
      <div className="relative aspect-[16/10] overflow-hidden bg-slate-100">
        <img src={cafe.image} alt={cafe.name} className="h-full w-full object-cover transition duration-500 hover:scale-105" />
        <div className="absolute left-3 top-3 flex gap-2">
          <Badge className="bg-white/95 font-black text-slate-950 shadow-sm"><Star className="h-3 w-3 fill-orange-500 text-orange-500" /> {cafe.rating}</Badge>
          {cafe.features.includes("Serious Inspection") && <Badge className="bg-emerald-600 font-black text-white"><ShieldCheck className="h-3 w-3" /> Serious</Badge>}
        </div>
      </div>

      <CardHeader className="space-y-3 p-4">
        <div className="flex flex-wrap gap-1.5">
          {cafe.trackTypes.map((type) => <Badge key={type} variant="secondary" className="bg-orange-50 text-[10px] font-black text-orange-700">{type}</Badge>)}
        </div>
        <div>
          <CardTitle className="line-clamp-1 text-lg font-black text-slate-950">{cafe.name}</CardTitle>
          <p className="mt-1 flex items-center gap-1 text-xs font-bold text-slate-500"><MapPin className="h-3.5 w-3.5 text-orange-600" /> {cafe.district}, {cafe.city}</p>
        </div>
        <p className="line-clamp-2 min-h-10 text-sm font-medium leading-5 text-slate-500">{cafe.description}</p>
      </CardHeader>

      <CardContent className="space-y-3 p-4 pt-0">
        <div className="flex items-center justify-between text-xs font-black text-slate-500">
          <span>{cafe.availableVehicles.length} xe thuê</span>
          <span className="text-slate-950">{cafe.priceRange}</span>
        </div>
        <VehicleMiniList cafeId={cafe.id} vehicles={cafe.availableVehicles} onBookNow={onBookNow} />
      </CardContent>

      <CardFooter className="grid grid-cols-2 gap-2 border-t border-slate-100 bg-slate-50 p-4">
        <Button type="button" variant="outline" onClick={() => onQuickView(cafe)} className="h-10 rounded-xl bg-white font-black"><Eye className="h-4 w-4" /> Chi tiết</Button>
        <Button type="button" onClick={() => onBookNow(cafe.id)} className="h-10 rounded-xl bg-slate-950 font-black text-white hover:bg-orange-600">Đặt sân</Button>
      </CardFooter>
    </Card>
  )
}
