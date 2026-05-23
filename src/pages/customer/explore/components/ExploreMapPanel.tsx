import { MapPin } from "lucide-react"
import type { Cafe } from "@/shared/data/explore-data"
import { Badge } from "@/shared/ui/badge"
import { Button } from "@/shared/ui/button"
import { Card, CardContent } from "@/shared/ui/card"

export function ExploreMapPanel({ cafes, active, onSelectCafe }: { cafes: Cafe[]; active: boolean; onClose: () => void; onSelectCafe: (cafe: Cafe) => void; compact?: boolean }) {
  if (!active) return null

  return (
    <Card className="overflow-hidden rounded-xl shadow-sm">
      <CardContent className="p-0">
        <div className="relative h-56 overflow-hidden bg-slate-900">
          <div className="absolute inset-0 opacity-80" style={{ backgroundImage: "radial-gradient(circle at 25% 20%, rgba(59,130,246,.35), transparent 26%), radial-gradient(circle at 80% 70%, rgba(249,115,22,.28), transparent 24%), linear-gradient(135deg, #0f172a 0%, #1f2937 100%)" }} />
          <svg className="absolute inset-0 h-full w-full text-white/15" aria-hidden="true">
            <path d="M20 65 C140 115 220 30 360 105 S520 150 650 70" fill="none" stroke="currentColor" strokeWidth="14" strokeLinecap="round" />
            <path d="M30 190 C150 120 260 170 350 100 S520 55 650 140" fill="none" stroke="currentColor" strokeWidth="8" strokeLinecap="round" />
          </svg>
          <div className="absolute left-3 top-3">
            <Badge className="gap-1 bg-background text-foreground shadow"><MapPin className="h-3 w-3" /> {cafes.length} cơ sở quanh bạn</Badge>
          </div>
          {cafes.map((cafe) => (
            <button key={cafe.id} type="button" onClick={() => onSelectCafe(cafe)} className="absolute -translate-x-1/2 -translate-y-1/2" style={{ left: `${cafe.coordinates.x}%`, top: `${cafe.coordinates.y}%` }}>
              <span className="flex h-7 w-7 items-center justify-center rounded-full border-2 border-background bg-primary text-primary-foreground shadow-lg"><MapPin className="h-3.5 w-3.5 fill-current" /></span>
            </button>
          ))}
        </div>
        <div className="space-y-2 p-3">
          <div className="flex items-center justify-between">
            <p className="text-sm font-semibold">Xem trên bản đồ</p>
            <Button type="button" variant="outline" size="sm">Mở rộng</Button>
          </div>
          {cafes.slice(0, 3).map((cafe) => (
            <button key={cafe.id} type="button" onClick={() => onSelectCafe(cafe)} className="flex w-full items-center justify-between rounded-lg border p-2 text-left hover:bg-muted">
              <span className="min-w-0">
                <span className="block truncate text-sm font-medium">{cafe.name}</span>
                <span className="text-xs text-muted-foreground">{cafe.district}, {cafe.city}</span>
              </span>
              <Badge variant="secondary" className="shrink-0">{cafe.rating}</Badge>
            </button>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}
