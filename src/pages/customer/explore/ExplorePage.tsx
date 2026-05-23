import { useEffect, useMemo, useState } from "react"
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
  const [cafes, setCafes] = useState<Cafe[]>([])
  const [quickViewCafe, setQuickViewCafe] = useState<Cafe | null>(null)
  const [showMobileMap, setShowMobileMap] = useState(false)

  useEffect(() => {
    let mounted = true
    getCafes(filters.params).then((items) => {
      if (mounted) setCafes(items)
    })
    return () => {
      mounted = false
    }
  }, [filters.params])

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

      <div className="mx-auto grid w-full max-w-7xl gap-5 px-4 py-5 md:px-6 lg:grid-cols-[250px_minmax(0,1fr)] xl:grid-cols-[250px_minmax(0,1fr)_320px]">
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
          {filteredCafes.length === 0 ? (
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
