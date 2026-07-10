import { useCallback, useEffect, useMemo, useRef, useState } from "react"
import { useQuery } from "@tanstack/react-query"
import { useNavigate } from "react-router"
import { getCafes } from "@/features/explore/api/explore.api"
import { toast } from "sonner"
import type { Cafe } from "@/shared/data/explore-data"
import { ExploreMapOverlay } from "./components/ExploreMapOverlay"
import { ExploreSearchBar } from "./components/ExploreSearchBar"
import { ExploreLeftSidebar } from "./components/ExploreLeftSidebar"
import { ExploreResultsHeader } from "./components/ExploreResultsHeader"
import { CafeHorizontalCard } from "./components/CafeHorizontalCard"
import { CafeGridCard } from "./components/CafeGridCard"
import { CafeQuickViewDialog } from "./components/CafeQuickViewDialog"
import { buildBookingUrl, cafeInBounds, haversineKm, type MapBounds, type UserLocation } from "./explore-utils"
import { useExploreFilters } from "./useExploreFilters"
import { Map } from "lucide-react"
import { useAuthStore } from "@/features/auth/stores/auth.store"
import { favoriteApi } from "@/features/explore/api/favorite.api"

export function ExplorePage() {
  const navigate = useNavigate()
  const filters = useExploreFilters()
  const [quickViewCafe, setQuickViewCafe] = useState<Cafe | null>(null)
  const [showMap, setShowMap] = useState(false)
  const [userLocation, setUserLocation] = useState<UserLocation | null>(null)
  const [hoveredCafeId, setHoveredCafeId] = useState<string | null>(null)
  const [mapBounds, setMapBounds] = useState<MapBounds | null>(null)
  const [searchOnMove, setSearchOnMove] = useState(false)
  const [viewMode, setViewMode] = useState<"grid" | "list">(() => {
    return (localStorage.getItem("explore_view_mode") as "grid" | "list") || "list"
  })

  const handleViewModeChange = (mode: "grid" | "list") => {
    setViewMode(mode)
    localStorage.setItem("explore_view_mode", mode)
  }
  const listRef = useRef<HTMLDivElement>(null)
  const boundsTimerRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined)

  const isAuthenticated = useAuthStore((s) => s.isAuthenticated)
  const [favoriteIds, setFavoriteIds] = useState<string[]>(() => {
    try {
      const favsStr = localStorage.getItem("rcfield_favorite_cafes")
      if (favsStr) {
        const parsed = JSON.parse(favsStr)
        if (Array.isArray(parsed)) return parsed
      }
    } catch (e) {
      console.warn("Failed to load favorites from localStorage", e)
    }
    return []
  })

  useEffect(() => {
    const loadFavs = async () => {
      let localFavs: string[] = []
      try {
        const favsStr = localStorage.getItem("rcfield_favorite_cafes")
        if (favsStr) {
          const parsed = JSON.parse(favsStr)
          if (Array.isArray(parsed)) localFavs = parsed
        }
      } catch (e) {
        console.warn("Failed to parse local favorites", e)
      }

      if (isAuthenticated) {
        try {
          const isSynced = localStorage.getItem("rcfield_favorites_synced") === "true"
          if (!isSynced) {
            const mergedFavs = await favoriteApi.syncFavorites(localFavs)
            setFavoriteIds(mergedFavs)
            localStorage.setItem("rcfield_favorite_cafes", JSON.stringify(mergedFavs))
            localStorage.setItem("rcfield_favorites_synced", "true")
          } else {
            const dbFavs = await favoriteApi.getFavorites()
            setFavoriteIds(dbFavs)
            localStorage.setItem("rcfield_favorite_cafes", JSON.stringify(dbFavs))
          }
        } catch (e) {
          console.error("Failed to load favorites from backend", e)
          setFavoriteIds(localFavs)
        }
      } else {
        localStorage.removeItem("rcfield_favorites_synced")
        setFavoriteIds(localFavs)
      }
    }

    loadFavs()
  }, [isAuthenticated])

  const handleToggleFavorite = useCallback(
    async (cafeId: string) => {
      const isFav = favoriteIds.includes(cafeId)
      const updated = isFav ? favoriteIds.filter((id) => id !== cafeId) : [...favoriteIds, cafeId]

      setFavoriteIds(updated)
      try {
        localStorage.setItem("rcfield_favorite_cafes", JSON.stringify(updated))
        if (isFav) {
          toast.success("Đã xóa khỏi danh sách yêu thích")
          if (isAuthenticated) {
            await favoriteApi.removeFavorite(cafeId)
          }
        } else {
          toast.success("Đã thêm vào danh sách yêu thích")
          if (isAuthenticated) {
            await favoriteApi.addFavorite(cafeId)
          }
        }
      } catch (e) {
        console.error("Failed to toggle favorite:", e)
        setFavoriteIds(favoriteIds)
        try {
          localStorage.setItem("rcfield_favorite_cafes", JSON.stringify(favoriteIds))
        } catch (err) {
          console.error(err)
        }
      }
    },
    [favoriteIds, isAuthenticated],
  )

  const handleBoundsChange = useCallback((bounds: MapBounds) => {
    clearTimeout(boundsTimerRef.current)
    boundsTimerRef.current = setTimeout(() => setMapBounds(bounds), 150)
  }, [])

  const { data: cafes = [], isLoading, isError, refetch } = useQuery({
    queryKey: ["explore", "cafes", filters.params],
    queryFn: () => getCafes(filters.params),
  })

  useEffect(() => {
    if (searchOnMove) listRef.current?.scrollTo({ top: 0, behavior: "smooth" })
  }, [mapBounds, searchOnMove])

  const filteredCafes = useMemo(() => {
    let visible = cafes
    if (searchOnMove && mapBounds) visible = visible.filter((c) => cafeInBounds(c, mapBounds))

    // Favourites first, then by distance when available; server already handles query filters/sort.
    return [...visible].sort((a, b) => {
      const isFavA = favoriteIds.includes(a.id)
      const isFavB = favoriteIds.includes(b.id)

      if (isFavA && !isFavB) return -1
      if (!isFavA && isFavB) return 1

      if (userLocation) {
        const hasA = a.latitude && a.longitude
        const hasB = b.latitude && b.longitude
        if (!hasA && !hasB) return 0
        if (!hasA) return 1
        if (!hasB) return -1
        return (
          haversineKm(userLocation.lat, userLocation.lng, a.latitude!, a.longitude!) -
          haversineKm(userLocation.lat, userLocation.lng, b.latitude!, b.longitude!)
        )
      }
      return 0
    })
  }, [cafes, userLocation, mapBounds, searchOnMove, favoriteIds])

  const handleBookNow = (cafeId: string, vehicleId?: string) => {
    navigate(buildBookingUrl(cafeId, vehicleId))
  }

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      {/* Top search bar */}
      <ExploreSearchBar
        city={filters.city}
        onCityChange={filters.setCity}
        date={filters.date}
        onDateChange={filters.setDate}
        query={filters.query}
        onQueryChange={filters.setQuery}
      />

      <div className="mx-auto flex w-full max-w-[1200px] flex-1 gap-6 px-4 py-6 md:px-6">
        {/* LEFT — Sidebar with map + filters (desktop only) */}
        <div className="hidden w-[280px] shrink-0 lg:block">
          <div className="sticky top-[96px] max-h-[calc(100vh-7rem)] overflow-y-auto pr-2 scrollbar-thin scrollbar-thumb-slate-200 scrollbar-track-transparent">
            <ExploreLeftSidebar
              cafes={filteredCafes}
              onSelectCafe={setQuickViewCafe}
              userLocation={userLocation}
              onUserLocation={setUserLocation}
              hoveredCafeId={hoveredCafeId}
              onBoundsChange={handleBoundsChange}
              searchOnMove={searchOnMove}
              onSearchOnMoveChange={setSearchOnMove}
              priceMin={filters.priceMin}
              priceMax={filters.priceMax}
              onPriceMinChange={filters.setPriceMin}
              onPriceMaxChange={filters.setPriceMax}
              onResetPrice={filters.resetPriceSlider}
              popularFilters={filters.popularFilters}
              onTogglePopularFilter={filters.togglePopularFilter}
              activeFilterCount={filters.activeFilterCount}
              onClearAll={filters.clearFilters}
            />
          </div>
        </div>

        {/* CENTER — Results list */}
        <div ref={listRef} className="flex-1 min-w-0">
          {/* Results header */}
          <div className="sticky top-[68px] lg:top-[80px] z-20 bg-slate-50 pb-3 pt-2 mb-4 relative before:absolute before:bottom-full before:left-[-9999px] before:right-[-9999px] before:h-[200px] before:bg-slate-50 before:z-[-1]">
            <ExploreResultsHeader
              city={filters.city}
              resultCount={filteredCafes.length}
              sortBy={filters.sortBy}
              onSortByChange={filters.setSortBy}
              viewMode={viewMode}
              onViewModeChange={handleViewModeChange}
              trackType={filters.trackType}
              onTrackTypeChange={filters.setTrackType}
              feature={filters.feature}
              onFeatureChange={filters.setFeature}
              vehicleType={filters.vehicleType}
              onVehicleTypeChange={filters.setVehicleType}
              priceRange={filters.priceRange}
              onPriceRangeChange={filters.setPriceRange}
              query={filters.query}
              onQueryChange={filters.setQuery}
            />
          </div>

          {/* Card list */}
          <main className={viewMode === "grid" ? "grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3" : "space-y-4"}>
            {isLoading ? (
              <ExploreLoadingState viewMode={viewMode} />
            ) : isError ? (
              <div className="rounded-xl border bg-white p-12 text-center shadow-sm">
                <h3 className="text-lg font-semibold">Không tải được dữ liệu cơ sở</h3>
                <p className="mt-2 text-sm text-slate-500">Vui lòng thử lại sau hoặc kiểm tra kết nối API.</p>
                <button
                  type="button"
                  onClick={() => void refetch()}
                  className="mt-4 rounded-lg bg-orange-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-orange-700"
                >
                  Tải lại
                </button>
              </div>
            ) : filteredCafes.length === 0 ? (
              <div className="rounded-xl border bg-white p-12 text-center shadow-sm">
                <h3 className="text-lg font-semibold">Không có cơ sở trong khu vực này</h3>
                <p className="mt-2 text-sm text-slate-500">
                  {searchOnMove && mapBounds ? "Di chuyển hoặc thu nhỏ bản đồ để xem thêm cơ sở." : "Thử thay đổi bộ lọc hoặc từ khóa tìm kiếm."}
                </p>
              </div>
            ) : (
              filteredCafes.map((cafe) => {
                const dist =
                  userLocation && cafe.latitude && cafe.longitude
                    ? haversineKm(userLocation.lat, userLocation.lng, cafe.latitude, cafe.longitude)
                    : undefined
                return viewMode === "grid" ? (
                  <CafeGridCard
                    key={cafe.id}
                    cafe={cafe}
                    isFavorite={favoriteIds.includes(cafe.id)}
                    onToggleFavorite={handleToggleFavorite}
                    distanceKm={dist}
                    onQuickView={setQuickViewCafe}
                    onBookNow={handleBookNow}
                    onHover={setHoveredCafeId}
                  />
                ) : (
                  <CafeHorizontalCard
                    key={cafe.id}
                    cafe={cafe}
                    isFavorite={favoriteIds.includes(cafe.id)}
                    onToggleFavorite={handleToggleFavorite}
                    distanceKm={dist}
                    onQuickView={setQuickViewCafe}
                    onBookNow={handleBookNow}
                    onHover={setHoveredCafeId}
                  />
                )
              })
            )}
          </main>
        </div>
      </div>

      {/* Mobile: floating "Xem bản đồ" button */}
      <div className="fixed bottom-5 left-1/2 z-40 -translate-x-1/2 lg:hidden">
        <button
          type="button"
          onClick={() => setShowMap(true)}
          className="flex items-center gap-2 rounded-full bg-slate-900 px-5 py-3 text-sm font-semibold text-white shadow-xl hover:bg-slate-800"
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

function ExploreLoadingState({ viewMode }: { viewMode: "grid" | "list" }) {
  if (viewMode === "grid") {
    return (
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="flex flex-col overflow-hidden rounded-xl border bg-white shadow-sm h-full">
            <div className="aspect-[16/10] w-full animate-pulse bg-slate-100" />
            <div className="flex-1 space-y-3 p-4">
              <div className="h-5 w-2/3 animate-pulse rounded bg-slate-100" />
              <div className="h-4 w-1/3 animate-pulse rounded bg-slate-100" />
              <div className="h-4 w-1/2 animate-pulse rounded bg-slate-100" />
              <div className="pt-2 border-t border-slate-100 flex justify-between items-center">
                <div className="h-4 w-1/3 animate-pulse rounded bg-slate-100" />
                <div className="h-8 w-1/2 animate-pulse rounded bg-slate-100" />
              </div>
            </div>
          </div>
        ))}
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {Array.from({ length: 4 }).map((_, i) => (
        <div key={i} className="flex overflow-hidden rounded-xl border bg-white shadow-sm">
          <div className="h-[200px] w-[280px] shrink-0 animate-pulse bg-slate-100" />
          <div className="flex-1 space-y-3 p-4">
            <div className="h-5 w-2/3 animate-pulse rounded bg-slate-100" />
            <div className="h-4 w-1/3 animate-pulse rounded bg-slate-100" />
            <div className="h-4 w-1/2 animate-pulse rounded bg-slate-100" />
            <div className="flex gap-2">
              <div className="h-6 w-16 animate-pulse rounded bg-slate-100" />
              <div className="h-6 w-16 animate-pulse rounded bg-slate-100" />
            </div>
          </div>
          <div className="w-[180px] shrink-0 border-l p-4">
            <div className="h-6 w-full animate-pulse rounded bg-slate-100" />
            <div className="mt-2 h-8 w-full animate-pulse rounded bg-slate-100" />
            <div className="mt-auto h-10 w-full animate-pulse rounded bg-slate-100" />
          </div>
        </div>
      ))}
    </div>
  )
}
