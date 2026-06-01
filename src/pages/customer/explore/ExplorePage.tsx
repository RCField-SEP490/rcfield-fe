import { useMemo, useState } from "react"
import { useQuery } from "@tanstack/react-query"
import { useNavigate } from "react-router"
import { getCafes } from "@/features/explore/api/explore.api"
import type { Cafe } from "@/shared/data/explore-data"
import { ExploreFiltersSidebar } from "./components/ExploreFiltersSidebar"
import { ExploreMapPanel } from "./components/ExploreMapPanel"
import { ExploreSearchHeader } from "./components/ExploreSearchHeader"
import { CafeListItem } from "./components/CafeListItem"
import { CafeQuickViewDialog } from "./components/CafeQuickViewDialog"
import { buildBookingUrl, filterCafes } from "./explore-utils"
import { useExploreFilters } from "./useExploreFilters"

export function ExplorePage() {
  const navigate = useNavigate()
  const filters = useExploreFilters()
  const [quickViewCafe, setQuickViewCafe] = useState<Cafe | null>(null)
  const [showMobileMap, setShowMobileMap] = useState(false)

  const { data: cafes = [], isLoading, isError, refetch } = useQuery({
    queryKey: ["explore", "cafes", filters.params],
    queryFn: () => getCafes(filters.params),
  })

  const filteredCafes = useMemo(() => filterCafes(cafes, filters.params), [cafes, filters.params])

  const handleBookNow = (cafeId: string, vehicleId?: string) => {
    navigate(buildBookingUrl(cafeId, vehicleId))
  }

  return (
    <div className="min-h-screen bg-muted/30">
      <ExploreSearchHeader
        query={filters.query}
        onQueryChange={filters.setQuery}
        resultCount={filteredCafes.length}
        onShowMap={() => setShowMobileMap((current) => !current)}
        city={filters.city}
        onCityChange={filters.setCity}
        trackType={filters.trackType}
        onTrackTypeChange={filters.setTrackType}
        priceRange={filters.priceRange}
        onPriceRangeChange={filters.setPriceRange}
        feature={filters.feature}
        onFeatureChange={filters.setFeature}
        vehicleType={filters.vehicleType}
        onVehicleTypeChange={filters.setVehicleType}
        date={filters.date}
        onDateChange={filters.setDate}
        activeFilterCount={filters.activeFilterCount}
        onClear={filters.clearFilters}
      />

      <div className="mx-auto grid w-full gap-5 px-4 py-5 md:px-6 lg:grid-cols-[250px_minmax(0,1fr)] xl:grid-cols-[250px_minmax(0,1fr)_320px]">
        <aside className="hidden lg:block">
          <div className="sticky top-20">
            <ExploreFiltersSidebar
              city={filters.city}
              onCityChange={filters.setCity}
              trackType={filters.trackType}
              onTrackTypeChange={filters.setTrackType}
              priceRange={filters.priceRange}
              onPriceRangeChange={filters.setPriceRange}
              feature={filters.feature}
              onFeatureChange={filters.setFeature}
              vehicleType={filters.vehicleType}
              onVehicleTypeChange={filters.setVehicleType}
              date={filters.date}
              onDateChange={filters.setDate}
              activeFilterCount={filters.activeFilterCount}
              onClear={filters.clearFilters}
            />
          </div>
        </aside>

        <main className="min-w-0 space-y-3">
          {showMobileMap && (
            <div className="xl:hidden">
              <ExploreMapPanel cafes={filteredCafes} active onClose={() => setShowMobileMap(false)} onSelectCafe={setQuickViewCafe} />
            </div>
          )}
          {isLoading ? (
            <ExploreLoadingState />
          ) : isError ? (
            <div className="rounded-xl border bg-card p-12 text-center shadow-sm">
              <h3 className="text-lg font-semibold">Không tải được dữ liệu cơ sở</h3>
              <p className="mt-2 text-sm text-muted-foreground">Vui lòng thử lại sau hoặc kiểm tra kết nối API.</p>
              <button type="button" onClick={() => void refetch()} className="mt-4 rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground">
                Tải lại
              </button>
            </div>
          ) : filteredCafes.length === 0 ? (
            <div className="rounded-xl border bg-card p-12 text-center shadow-sm">
              <h3 className="text-lg font-semibold">Không tìm thấy kết quả</h3>
              <p className="mt-2 text-sm text-muted-foreground">Thử thay đổi bộ lọc hoặc từ khóa tìm kiếm.</p>
            </div>
          ) : (
            filteredCafes.map((cafe) => (
              <CafeListItem key={cafe.id} cafe={cafe} onQuickView={setQuickViewCafe} onBookNow={handleBookNow} />
            ))
          )}
        </main>

        <aside className="hidden xl:block">
          <div className="sticky top-20">
            <ExploreMapPanel cafes={filteredCafes} active onClose={() => undefined} onSelectCafe={setQuickViewCafe} />
          </div>
        </aside>
      </div>

      <CafeQuickViewDialog cafe={quickViewCafe} onClose={() => setQuickViewCafe(null)} onBookNow={handleBookNow} />
    </div>
  )
}

function ExploreLoadingState() {
  return (
    <div className="space-y-3">
      {Array.from({ length: 4 }).map((_, index) => (
        <div key={index} className="grid gap-4 rounded-xl border bg-card p-3 shadow-sm sm:grid-cols-[220px_1fr] lg:grid-cols-[230px_1fr_160px]">
          <div className="h-44 animate-pulse rounded-lg bg-muted sm:h-full" />
          <div className="space-y-3 py-2">
            <div className="h-5 w-2/3 animate-pulse rounded bg-muted" />
            <div className="h-4 w-full animate-pulse rounded bg-muted" />
            <div className="h-4 w-5/6 animate-pulse rounded bg-muted" />
            <div className="flex gap-2">
              <div className="h-6 w-20 animate-pulse rounded bg-muted" />
              <div className="h-6 w-24 animate-pulse rounded bg-muted" />
            </div>
          </div>
          <div className="h-28 animate-pulse rounded-lg bg-muted lg:h-full" />
        </div>
      ))}
    </div>
  )
}
