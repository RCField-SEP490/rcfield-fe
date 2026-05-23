import { MapPin, Navigation, RadioTower, Route } from "lucide-react"
import type { Cafe } from "@/shared/data/explore-data"
import { Button } from "@/shared/ui/button"
import { Badge } from "@/shared/ui/badge"
import { cn } from "@/shared/lib/utils"

export function ExploreMapPanel({ cafes, active, onClose, onSelectCafe, compact }: { cafes: Cafe[]; active: boolean; onClose: () => void; onSelectCafe: (cafe: Cafe) => void; compact?: boolean }) {
  if (!active) return null

  if (compact) {
    return (
      <div className="h-full border-0">
        <div className="relative h-full overflow-hidden bg-slate-900">
          <div className="absolute inset-0 opacity-70" style={{ backgroundImage: "radial-gradient(circle at 20% 20%, rgba(249,115,22,.24), transparent 28%), radial-gradient(circle at 80% 30%, rgba(14,165,233,.22), transparent 24%), linear-gradient(135deg, #0f172a 0%, #111827 45%, #171717 100%)" }} />
          <svg className="absolute inset-0 h-full w-full text-white/15" aria-hidden="true">
            <path d="M20 80 C160 140 230 40 380 110 S560 180 620 80" fill="none" stroke="currentColor" strokeWidth="18" strokeLinecap="round" />
            <path d="M60 340 C180 250 260 280 350 210 S520 120 650 210" fill="none" stroke="currentColor" strokeWidth="10" strokeLinecap="round" />
          </svg>
          <div className="absolute left-3 top-3 flex items-center gap-1.5 bg-black/60 px-2 py-1 text-[10px] font-medium text-white">
            <svg className="h-3 w-3 text-orange-400" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z"/></svg>
            {cafes.length} cơ sở
          </div>
          {cafes.map((cafe, index) => (
            <button
              key={cafe.id}
              type="button"
              onClick={() => onSelectCafe(cafe)}
              className="absolute -translate-x-1/2 -translate-y-1/2"
              style={{ left: `${cafe.coordinates.x}%`, top: `${cafe.coordinates.y}%` }}
            >
              <span className="flex h-6 w-6 items-center justify-center border border-white bg-orange-500 text-white shadow-lg">
                <svg className="h-3 w-3 fill-current" viewBox="0 0 24 24"><path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7z"/></svg>
              </span>
            </button>
          ))}
        </div>
      </div>
    )
  }

  return (
    <section className="border border-white/70 bg-white/85 p-4 shadow-2xl shadow-slate-300/40 backdrop-blur-xl lg:sticky lg:top-24">
      <div className="mb-4 flex items-start justify-between gap-4">
        <div>
          <p className="text-xs font-black uppercase tracking-[0.18em] text-orange-600">View map</p>
          <h2 className="text-xl font-black text-slate-950">Sân chơi gần bạn</h2>
          <p className="mt-1 text-xs font-bold leading-5 text-slate-500">Bản đồ demo đã tách pin theo tọa độ mock. Khi gắn API chỉ thay lat/lng và provider map.</p>
        </div>
        <Button type="button" variant="ghost" onClick={onClose} className="rounded-full font-black text-slate-500">Ẩn</Button>
      </div>

      <div className="relative h-[420px] overflow-hidden border border-slate-200 bg-slate-900">
        <div className="absolute inset-0 opacity-70" style={{ backgroundImage: "radial-gradient(circle at 20% 20%, rgba(249,115,22,.24), transparent 28%), radial-gradient(circle at 80% 30%, rgba(14,165,233,.22), transparent 24%), linear-gradient(135deg, #0f172a 0%, #111827 45%, #171717 100%)" }} />
        <svg className="absolute inset-0 h-full w-full text-white/15" aria-hidden="true">
          <path d="M20 80 C160 140 230 40 380 110 S560 180 620 80" fill="none" stroke="currentColor" strokeWidth="18" strokeLinecap="round" />
          <path d="M60 340 C180 250 260 280 350 210 S520 120 650 210" fill="none" stroke="currentColor" strokeWidth="10" strokeLinecap="round" />
          <path d="M220 0 C190 120 240 230 180 420" fill="none" stroke="currentColor" strokeWidth="7" strokeLinecap="round" />
        </svg>

        <div className="absolute left-4 top-4 flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-3 py-2 text-xs font-black text-white backdrop-blur-md">
          <Navigation className="h-4 w-4 text-orange-400" /> Vị trí hiện tại · 5km
        </div>

        {cafes.map((cafe, index) => (
          <button
            key={cafe.id}
            type="button"
            onClick={() => onSelectCafe(cafe)}
            className="absolute -translate-x-1/2 -translate-y-1/2 text-left"
            style={{ left: `${cafe.coordinates.x}%`, top: `${cafe.coordinates.y}%` }}
          >
            <span className="relative flex h-11 w-11 items-center justify-center rounded-full border-2 border-white bg-orange-500 text-white shadow-xl shadow-orange-950/40">
              <span className="absolute -inset-2 rounded-full bg-orange-500/25 animate-ping" />
              <MapPin className="relative h-5 w-5 fill-current" />
            </span>
            <span className={cn("absolute left-10 top-0 min-w-36 rounded-2xl border border-white/10 bg-slate-950/85 p-2 text-white shadow-xl backdrop-blur-md", index > 2 && "-left-36")}>
              <span className="block text-xs font-black">{cafe.name}</span>
              <span className="mt-1 flex items-center gap-1 text-[10px] font-bold text-slate-300"><Route className="h-3 w-3 text-orange-400" /> {(2.4 + index * 1.3).toFixed(1)} km · {cafe.rating} sao</span>
            </span>
          </button>
        ))}
      </div>

      <div className="mt-4 grid gap-2">
        {cafes.slice(0, 3).map((cafe, index) => (
          <button key={cafe.id} type="button" onClick={() => onSelectCafe(cafe)} className="flex items-center justify-between rounded-2xl border border-slate-200 bg-white p-3 text-left transition hover:border-orange-300">
            <div>
              <p className="text-sm font-black text-slate-950">{cafe.name}</p>
              <p className="mt-0.5 text-xs font-bold text-slate-500">{cafe.district} · {(2.4 + index * 1.3).toFixed(1)} km</p>
            </div>
            <Badge className="bg-orange-50 font-black text-orange-700"><RadioTower className="h-3 w-3" /> gần</Badge>
          </button>
        ))}
      </div>
    </section>
  )
}
