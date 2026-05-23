import { SlidersHorizontal } from "lucide-react"
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
  ...filters
}: ExploreToolbarProps) {
  return (
    <section className="border-b border-slate-200 bg-white">
      <div className="mx-auto w-full max-w-7xl px-4 py-8 md:px-6">
        <div className="mb-6 flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div className="space-y-2">
            <p className="text-xs font-black uppercase tracking-[0.18em] text-orange-600">Khám phá cơ sở</p>
            <h1 className="text-3xl font-black tracking-tight text-slate-950 md:text-4xl">Tìm RC Cafe phù hợp lịch chơi của bạn</h1>
            <p className="max-w-2xl text-sm font-medium leading-6 text-slate-500">Lọc theo khu vực, loại track, tiện ích và đội xe. Có thể chuyển giữa dạng lưới và danh sách mà không mất filter.</p>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <TargetButton active={searchTarget === "cafes"} onClick={() => onSearchTargetChange("cafes")} label={`Cơ sở (${cafeCount})`} />
            <TargetButton active={searchTarget === "vehicles"} onClick={() => onSearchTargetChange("vehicles")} label={`Xe thuê (${vehicleCount})`} />
            <ViewModeToggle value={viewMode} onChange={onViewModeChange} />
          </div>
        </div>

        <div className="flex flex-col gap-3 md:flex-row">
          <ExploreSearchBar value={query} onChange={onQueryChange} />
          <Sheet>
            <SheetTrigger asChild>
              <Button type="button" variant="outline" className="h-12 rounded-xl bg-white px-4 font-black md:hidden">
                <SlidersHorizontal className="h-4 w-4 text-orange-600" /> Bộ lọc
                {filters.activeFilterCount > 0 && <Badge className="bg-orange-600 text-white">{filters.activeFilterCount}</Badge>}
              </Button>
            </SheetTrigger>
            <SheetContent className="w-full overflow-y-auto bg-white p-4 sm:max-w-sm">
              <SheetHeader className="mb-4">
                <SheetTitle>Bộ lọc tìm kiếm</SheetTitle>
              </SheetHeader>
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
    <Button type="button" variant="outline" onClick={onClick} className={cn("h-10 rounded-full bg-white px-4 font-black", active && "border-slate-950 bg-slate-950 text-white hover:bg-slate-950 hover:text-white")}>
      {label}
    </Button>
  )
}
