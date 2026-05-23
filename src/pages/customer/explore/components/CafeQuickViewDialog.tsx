import { MapPin, ShieldCheck, X } from "lucide-react"
import type { Cafe } from "@/shared/data/explore-data"
import { Badge } from "@/shared/ui/badge"
import { Button } from "@/shared/ui/button"
import { Dialog, DialogContent } from "@/shared/ui/dialog"
import { VehicleMiniList } from "./VehicleMiniList"

export function CafeQuickViewDialog({ cafe, onClose, onBookNow }: { cafe: Cafe | null; onClose: () => void; onBookNow: (cafeId: string, vehicleId?: string) => void }) {
  return (
    <Dialog open={!!cafe} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-h-[90svh] max-w-3xl overflow-hidden rounded-2xl border-slate-200 bg-white p-0">
        {cafe && (
          <>
            <div className="relative h-64 overflow-hidden bg-slate-100">
              <img src={cafe.image} alt={cafe.name} className="h-full w-full object-cover" />
              <div className="absolute inset-0 bg-gradient-to-t from-slate-950/90 via-slate-950/20 to-transparent" />
              <Button type="button" size="icon" variant="secondary" onClick={onClose} className="absolute right-4 top-4 rounded-full bg-white/90">
                <X className="h-4 w-4" />
              </Button>
              <div className="absolute bottom-5 left-5 right-5 text-white">
                <div className="mb-2 flex flex-wrap gap-2">
                  <Badge className="bg-white/90 font-black text-slate-950">{cafe.rating} sao · {cafe.reviewsCount} đánh giá</Badge>
                  {cafe.features.includes("Serious Inspection") && <Badge className="bg-emerald-600 font-black text-white"><ShieldCheck className="h-3 w-3" /> Serious Inspection</Badge>}
                </div>
                <h2 className="text-2xl font-black tracking-tight">{cafe.name}</h2>
                <p className="mt-1 flex items-center gap-1 text-sm font-bold text-slate-200"><MapPin className="h-4 w-4 text-orange-400" /> {cafe.address}</p>
              </div>
            </div>
            <div className="max-h-[calc(90svh-16rem)] overflow-y-auto p-5">
              <div className="grid gap-5 md:grid-cols-[1fr_260px]">
                <div className="space-y-4">
                  <div>
                    <p className="text-xs font-black uppercase tracking-wide text-slate-400">Giới thiệu</p>
                    <p className="mt-2 text-sm font-medium leading-6 text-slate-600">{cafe.description}</p>
                  </div>
                  <div>
                    <p className="text-xs font-black uppercase tracking-wide text-slate-400">Track & tiện ích</p>
                    <div className="mt-2 flex flex-wrap gap-2">
                      {[...cafe.trackTypes, ...cafe.features].map((item) => <Badge key={item} variant="secondary" className="bg-slate-100 font-bold text-slate-700">{item}</Badge>)}
                    </div>
                  </div>
                </div>
                <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                  <p className="text-xs font-black uppercase tracking-wide text-slate-400">Giá tham khảo</p>
                  <p className="mt-2 text-xl font-black text-slate-950">{cafe.priceRange}</p>
                  <Button type="button" onClick={() => onBookNow(cafe.id)} className="mt-4 h-10 w-full rounded-xl bg-orange-600 font-black text-white hover:bg-slate-950">Đặt sân này</Button>
                </div>
              </div>
              <div className="mt-6">
                <p className="mb-3 text-xs font-black uppercase tracking-wide text-slate-400">Xe thuê tại cơ sở</p>
                <VehicleMiniList cafeId={cafe.id} vehicles={cafe.availableVehicles} onBookNow={onBookNow} />
              </div>
            </div>
          </>
        )}
      </DialogContent>
    </Dialog>
  )
}
