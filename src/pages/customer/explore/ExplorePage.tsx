import { useEffect, useMemo, useState } from "react"
import { useNavigate } from "react-router"
import { getCafes } from "@/features/explore/api/explore.api"
import type { Cafe } from "@/shared/data/explore-data"
import { ExploreFiltersPanel } from "./components/ExploreFiltersPanel"
import { ExploreResults } from "./components/ExploreResults"
import { ExploreToolbar } from "./components/ExploreToolbar"
import { CafeQuickViewDialog } from "./components/CafeQuickViewDialog"
import { buildBookingUrl, filterCafes, filterVehicles, flattenCafeVehicles } from "./explore-utils"
import { useExploreFilters } from "./useExploreFilters"

export function ExplorePage() {
  const navigate = useNavigate()
  const filters = useExploreFilters()
  const [cafes, setCafes] = useState<Cafe[]>([])
  const [quickViewCafe, setQuickViewCafe] = useState<Cafe | null>(null)

  useEffect(() => {
    let isMounted = true
    getCafes(filters.params).then((items) => {
      if (isMounted) setCafes(items)
    })
    return () => {
      isMounted = false
    }
  }, [filters.params])

  const vehicles = useMemo(() => flattenCafeVehicles(cafes), [cafes])
  const filteredCafes = useMemo(() => filterCafes(cafes, filters.params), [cafes, filters.params])
  const filteredVehicles = useMemo(() => filterVehicles(vehicles, filters.params), [vehicles, filters.params])

  const handleBookNow = (cafeId: string, vehicleId?: string) => {
    navigate(buildBookingUrl(cafeId, vehicleId))
  }

  return (
    <div className="bg-slate-50">
      <ExploreToolbar
        query={filters.query}
        onQueryChange={filters.setQuery}
        searchTarget={filters.searchTarget}
        onSearchTargetChange={filters.setSearchTarget}
        viewMode={filters.viewMode}
        onViewModeChange={filters.setViewMode}
        cafeCount={filteredCafes.length}
        vehicleCount={filteredVehicles.length}
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

      <div className="mx-auto grid w-full max-w-7xl gap-6 px-4 py-8 md:px-6 lg:grid-cols-[280px_1fr]">
        <div className="hidden lg:block">
          <div className="sticky top-24">
            <ExploreFiltersPanel
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
        </div>

        <ExploreResults
          cafes={filteredCafes}
          vehicles={filteredVehicles}
          viewMode={filters.viewMode}
          searchTarget={filters.searchTarget}
          onQuickView={setQuickViewCafe}
          onBookNow={handleBookNow}
          onClearFilters={filters.clearFilters}
        />
      </div>

      <CafeQuickViewDialog cafe={quickViewCafe} onClose={() => setQuickViewCafe(null)} onBookNow={handleBookNow} />
    </div>
  )
}
