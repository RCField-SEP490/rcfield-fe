import type { Cafe } from "@/shared/data/explore-data"
import type { CafeViewMode, SearchTarget, VehicleWithCafe } from "../explore-utils"
import { Button } from "@/shared/ui/button"
import { CafeCard } from "./CafeCard"
import { CafeListItem } from "./CafeListItem"
import { VehicleSearchResult } from "./VehicleSearchResult"

export function ExploreResults({
  cafes,
  vehicles,
  viewMode,
  searchTarget,
  onQuickView,
  onBookNow,
  onClearFilters,
}: {
  cafes: Cafe[]
  vehicles: VehicleWithCafe[]
  viewMode: CafeViewMode
  searchTarget: SearchTarget
  onQuickView: (cafe: Cafe) => void
  onBookNow: (cafeId: string, vehicleId?: string) => void
  onClearFilters: () => void
}) {
  if (searchTarget === "vehicles") {
    if (vehicles.length === 0) return <EmptyResults onClearFilters={onClearFilters} />
    return (
      <div className="space-y-4">
        {vehicles.map((vehicle) => <VehicleSearchResult key={vehicle.id} vehicle={vehicle} onBookNow={onBookNow} />)}
      </div>
    )
  }

  if (cafes.length === 0) return <EmptyResults onClearFilters={onClearFilters} />

  if (viewMode === "list") {
    return (
      <div className="space-y-4">
        {cafes.map((cafe) => <CafeListItem key={cafe.id} cafe={cafe} onQuickView={onQuickView} onBookNow={onBookNow} />)}
      </div>
    )
  }

  return (
    <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
      {cafes.map((cafe) => <CafeCard key={cafe.id} cafe={cafe} onQuickView={onQuickView} onBookNow={onBookNow} />)}
    </div>
  )
}

function EmptyResults({ onClearFilters }: { onClearFilters: () => void }) {
  return (
    <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-10 text-center">
      <h2 className="text-xl font-black text-slate-950">Không tìm thấy kết quả phù hợp</h2>
      <p className="mx-auto mt-2 max-w-md text-sm font-medium leading-6 text-slate-500">Thử xóa bớt bộ lọc hoặc tìm theo thành phố, tên cơ sở, loại track khác.</p>
      <Button type="button" onClick={onClearFilters} className="mt-5 rounded-xl bg-slate-950 font-black text-white hover:bg-orange-600">Xóa bộ lọc</Button>
    </div>
  )
}
