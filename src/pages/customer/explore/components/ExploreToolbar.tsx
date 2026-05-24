import { Map, SlidersHorizontal, Sparkles } from "lucide-react"
import type { CafeViewMode, SearchTarget } from "../explore-utils"
import { Badge } from "@/shared/ui/badge"
import { Button } from "@/shared/ui/button"
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/shared/ui/sheet"
import { cn } from "@/shared/lib/utils"
import { ExploreFiltersPanel, type ExploreFiltersPanelProps } from "./ExploreFiltersPanel"
import { ExploreSearchBar } from "./ExploreSearchBar"
import { ViewModeToggle } from "./ViewModeToggle"

export type ExploreToolbarProps = ExploreFiltersPanelProps & {
  query: string
  onQueryChange: (value: string) => void
  searchTarget: SearchTarget
  onSearchTargetChange: (value: SearchTarget) => void
  viewMode: CafeViewMode
  onViewModeChange: (value: CafeViewMode) => void
  cafeCount: number
  vehicleCount: number
  isMapOpen: boolean
  onToggleMap: () => void
}

export function ExploreToolbar({
  query,
  onQueryChange,
  searchTarget,
  onSearchTargetChange,
  viewMode,
  onViewModeChange,
  cafeCount,
  vehicleCount,
  isMapOpen,
  onToggleMap,
  ...filters
}: ExploreToolbarProps) {
  return (
    <section className="relative overflow-hidden border-b border-slate-200 bg-slate-950 text-white">
      <div className="absolute inset-0" style={{ backgroundImage: "radial-gradient(circle at 15% 20%, rgba(249,115,22,.28), transparent 26%), radial-gradient(circle at 85% 10%, rgba(14,165,233,.22), transparent 24%), linear-gradient(135deg, #020617 0%, #111827 54%, #171717 100%)" }} />
      <div className="absolute inset-x-0 bottom-0 h-24 bg-gradient-to-t from-slate-50 to-transparent" />
      <div className="relative mx-auto w-full max-w-7xl px-4 pb-20 pt-10 md:px-6">
        <div className="mb-7 grid gap-6 lg:grid-cols-[1fr_auto] lg:items-end">
          <div className="space-y-4">
            <div className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-3 py-1 text-xs font-black uppercase tracking-[0.18em] text-orange-200 backdrop-blur-md">
              <Sparkles className="h-3.5 w-3.5" /> RCField Marketplace
            </div>
            <div className="space-y-3">
              <h1 className="max-w-3xl text-4xl font-black tracking-tight md:text-6xl">Chọn sân RC như đặt phòng khách sạn.</h1>
              <p className="max-w-2xl text-sm font-medium leading-6 text-slate-300 md:text-base">So sánh cơ sở, xem xe thuê, mở bản đồ gần bạn và đi thẳng tới 3 luồng booking: theo giờ, gói slot hoặc lịch cố định.</p>
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-3 rounded-3xl border border-white/15 bg-white/10 p-2 backdrop-blur-xl">
            <TargetButton active={searchTarget === "cafes"} onClick={() => onSearchTargetChange("cafes")} label={`Cơ sở (${cafeCount})`} />
            <TargetButton active={searchTarget === "vehicles"} onClick={() => onSearchTargetChange("vehicles")} label={`Xe thuê (${vehicleCount})`} />
            <Button type="button" variant="outline" onClick={onToggleMap} className={cn("h-10 rounded-full border-white/20 bg-white/10 px-4 font-black text-white hover:bg-white hover:text-slate-950", isMapOpen && "bg-orange-500 text-white hover:bg-orange-500 hover:text-white")}>
              <Map className="h-4 w-4" /> View map
            </Button>
            <ViewModeToggle value={viewMode} onChange={onViewModeChange} />
          </div>
        </div>

        <div className="flex flex-col gap-3 rounded-[1.75rem] border border-white/15 bg-white/15 p-3 backdrop-blur-xl md:flex-row">
          <ExploreSearchBar value={query} onChange={onQueryChange} />
          <Sheet>
            <SheetTrigger asChild>
              <Button type="button" variant="outline" className="h-12 rounded-2xl border-white/20 bg-white px-4 font-black text-slate-950 lg:hidden">
                <SlidersHorizontal className="h-4 w-4 text-orange-600" /> Bộ lọc
                {filters.activeFilterCount > 0 && <Badge className="bg-orange-600 text-white">{filters.activeFilterCount}</Badge>}
              </Button>
            </SheetTrigger>
            <SheetContent className="w-full overflow-y-auto bg-white p-4 sm:max-w-sm">
              <SheetHeader className="mb-4"><SheetTitle>Bộ lọc tìm kiếm</SheetTitle></SheetHeader>
              <ExploreFiltersPanel {...filters} />
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </section>
  )
}

function TargetButton({ active, onClick, label }: { active: boolean; onClick: () => void; label: string }) {
  return (
    <Button type="button" variant="outline" onClick={onClick} className={cn("h-10 rounded-full border-white/20 bg-white/10 px-4 font-black text-white hover:bg-white hover:text-slate-950", active && "border-white bg-white text-slate-950 hover:bg-white hover:text-slate-950")}>
      {label}
    </Button>
  )
}
