import { useCallback, useEffect, useMemo, useRef, useState } from "react"
import { useQuery } from "@tanstack/react-query"
import { useNavigate } from "react-router"
import { getCafes } from "@/features/explore/api/explore.api"
import type { Cafe } from "@/shared/data/explore-data"
import { ExploreMapOverlay } from "./components/ExploreMapOverlay"
import { ExploreMapPanel } from "./components/ExploreMapPanel"
import { ExploreSearchHeader } from "./components/ExploreSearchHeader"
import { CafeGridCard } from "./components/CafeGridCard"
import { CafeQuickViewDialog } from "./components/CafeQuickViewDialog"
import { buildBookingUrl, cafeInBounds, filterCafes, haversineKm, type MapBounds, type UserLocation } from "./explore-utils"
import { useExploreFilters } from "./useExploreFilters"
import { Map } from "lucide-react"

export function ExplorePage() {
  const navigate = useNavigate()
  const filters = useExploreFilters()
  const [quickViewCafe, setQuickViewCafe] = useState<Cafe | null>(null)
  const [showMap, setShowMap] = useState(false)
  const [userLocation, setUserLocation] = useState<UserLocation | null>(null)
  const [hoveredCafeId, setHoveredCafeId] = useState<string | null>(null)
  const [mapBounds, setMapBounds] = useState<MapBounds | null>(null)
  const [searchOnMove, setSearchOnMove] = useState(true)
  const listRef = useRef<HTMLDivElement>(null)
  const boundsTimerRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined)

  const handleBoundsChange = useCallback((bounds: MapBounds) => {
    clearTimeout(boundsTimerRef.current)
    boundsTimerRef.current = setTimeout(() => setMapBounds(bounds), 150)
  }, [])

  const { data: cafes = [], isLoading, isError, refetch } = useQuery({
    queryKey: ["explore", "cafes", filters.params],
    queryFn: () => getCafes(filters.params),
  })

  // Scroll card list về đầu khi vùng map thay đổi
  useEffect(() => {
    if (searchOnMove) listRef.current?.scrollTo({ top: 0, behavior: "smooth" })
  }, [mapBounds, searchOnMove])

  const filteredCafes = useMemo(() => {
    let filtered = filterCafes(cafes, filters.params)
    if (searchOnMove && mapBounds) filtered = filtered.filter((c) => cafeInBounds(c, mapBounds))
    if (!userLocation) return filtered
    return [...filtered].sort((a, b) => {
      const hasA = a.latitude && a.longitude
      const hasB = b.latitude && b.longitude
      if (!hasA && !hasB) return 0
      if (!hasA) return 1
      if (!hasB) return -1
      return (
        haversineKm(userLocation.lat, userLocation.lng, a.latitude!, a.longitude!) -
        haversineKm(userLocation.lat, userLocation.lng, b.latitude!, b.longitude!)
      )
    })
  }, [cafes, filters.params, userLocation, mapBounds, searchOnMove])

  const handleBookNow = (cafeId: string, vehicleId?: string) => {
    navigate(buildBookingUrl(cafeId, vehicleId))
  }

  return (
    <div className="flex flex-1 flex-col overflow-hidden bg-background">
      <ExploreSearchHeader
        query={filters.query}
        onQueryChange={filters.setQuery}
        resultCount={filteredCafes.length}
        onShowMap={() => setShowMap(true)}
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

      <div className="flex flex-1 overflow-hidden">
        {/* LEFT — scrollable list */}
        <div ref={listRef} className="flex flex-1 flex-col overflow-y-auto">
          <div className="px-6 py-6 md:px-8">
            {/* Card grid */}
            <main className="min-w-0">
              {isLoading ? (
                <ExploreLoadingState />
              ) : isError ? (
                <div className="rounded-xl border bg-card p-12 text-center shadow-sm">
                  <h3 className="text-lg font-semibold">Không tải được dữ liệu cơ sở</h3>
                  <p className="mt-2 text-sm text-muted-foreground">Vui lòng thử lại sau hoặc kiểm tra kết nối API.</p>
                  <button
                    type="button"
                    onClick={() => void refetch()}
                    className="mt-4 rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground"
                  >
                    Tải lại
                  </button>
                </div>
              ) : filteredCafes.length === 0 ? (
                <div className="rounded-xl border bg-card p-12 text-center shadow-sm">
                  <h3 className="text-lg font-semibold">Không có cơ sở trong khu vực này</h3>
                  <p className="mt-2 text-sm text-muted-foreground">
                    {searchOnMove && mapBounds ? "Di chuyển hoặc thu nhỏ bản đồ để xem thêm cơ sở." : "Thử thay đổi bộ lọc hoặc từ khóa tìm kiếm."}
                  </p>
                </div>
              ) : (
                <div className="grid grid-cols-1 gap-x-5 gap-y-8 sm:grid-cols-2">
                  {filteredCafes.map((cafe) => {
                    const dist =
                      userLocation && cafe.latitude && cafe.longitude
                        ? haversineKm(userLocation.lat, userLocation.lng, cafe.latitude, cafe.longitude)
                        : undefined
                    return (
                      <CafeGridCard
                        key={cafe.id}
                        cafe={cafe}
                        distanceKm={dist}
                        onQuickView={setQuickViewCafe}
                        onBookNow={handleBookNow}
                        onHover={setHoveredCafeId}
                      />
                    )
                  })}
                </div>
              )}
            </main>
          </div>
        </div>

        {/* RIGHT — sticky inline map (desktop only) */}
        <div className="hidden h-full w-[42%] shrink-0 p-[30px] xl:w-[45%] lg:block">
          <ExploreMapPanel
            cafes={filteredCafes}
            onSelectCafe={setQuickViewCafe}
            userLocation={userLocation}
            onUserLocation={setUserLocation}
            hoveredCafeId={hoveredCafeId}
            onBoundsChange={handleBoundsChange}
            searchOnMove={searchOnMove}
            onSearchOnMoveChange={setSearchOnMove}
          />
        </div>
      </div>

      {/* Mobile: floating "Xem bản đồ" button */}
      <div className="fixed bottom-5 left-1/2 z-40 -translate-x-1/2 lg:hidden">
        <button
          type="button"
          onClick={() => setShowMap(true)}
          className="flex items-center gap-2 rounded-full bg-foreground px-5 py-3 text-sm font-semibold text-background shadow-xl hover:bg-foreground/90"
        >
          <Map className="h-4 w-4" /> Xem bản đồ
        </button>
      </div>

      {/* Mobile full-screen map overlay */}
      {showMap && (
        <ExploreMapOverlay
          cafes={filteredCafes}
          userLocation={userLocation}
          onUserLocation={setUserLocation}
          onSelectCafe={(cafe) => { setQuickViewCafe(cafe) }}
          onClose={() => setShowMap(false)}
        />
      )}

      <CafeQuickViewDialog cafe={quickViewCafe} onClose={() => setQuickViewCafe(null)} onBookNow={handleBookNow} />
    </div>
  )
}

function ExploreLoadingState() {
  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
      {Array.from({ length: 6 }).map((_, i) => (
        <div key={i} className="overflow-hidden rounded-xl border bg-card shadow-sm">
          <div className="aspect-[4/3] animate-pulse bg-muted" />
          <div className="space-y-2 p-3">
            <div className="h-4 w-2/3 animate-pulse rounded bg-muted" />
            <div className="h-3 w-1/2 animate-pulse rounded bg-muted" />
            <div className="h-8 w-full animate-pulse rounded bg-muted" />
          </div>
        </div>
      ))}
    </div>
  )
}
