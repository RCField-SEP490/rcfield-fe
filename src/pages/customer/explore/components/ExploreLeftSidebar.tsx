import { useMemo, useState } from "react"
import { useQuery } from "@tanstack/react-query"
import { ChevronDown, ChevronUp, MapPin, RotateCcw } from "lucide-react"
import { trackTypeApi, trackTypeQueryKeys, amenityApi, amenityQueryKeys } from "@/features/cafes/api/cafe.api"
import { PRICE_SLIDER_MAX, PRICE_SLIDER_MIN, PRICE_SLIDER_STEP } from "../constants"
import { ExploreMapPanel } from "./ExploreMapPanel"
import type { Cafe } from "@/shared/data/explore-data"
import type { UserLocation, MapBounds } from "../explore-utils"

interface ExploreLeftSidebarProps {
  // Map
  cafes: Cafe[]
  onSelectCafe: (cafe: Cafe) => void
  userLocation: UserLocation | null;
  onUserLocation: (loc: UserLocation | null) => void;
  hoveredCafeId: string | null
  onBoundsChange: (bounds: MapBounds) => void
  searchOnMove: boolean
  onSearchOnMoveChange: (v: boolean) => void
  // Price slider
  priceMin: number
  priceMax: number
  onPriceMinChange: (v: number) => void
  onPriceMaxChange: (v: number) => void
  onResetPrice: () => void
  // Popular filters
  popularFilters: string[]
  onTogglePopularFilter: (filter: string) => void
  // General
  activeFilterCount: number
  onClearAll: () => void
}

export function ExploreLeftSidebar({
  cafes,
  onSelectCafe,
  userLocation,
  onUserLocation,
  hoveredCafeId,
  onBoundsChange,
  searchOnMove,
  onSearchOnMoveChange,
  priceMin,
  priceMax,
  onPriceMinChange,
  onPriceMaxChange,
  onResetPrice,
  popularFilters,
  onTogglePopularFilter,
  activeFilterCount,
  onClearAll,
}: ExploreLeftSidebarProps) {
  const [showAllPopular, setShowAllPopular] = useState(false)

  // Fetch track types & amenities from API (NOT hardcoded)
  const { data: trackTypes = [] } = useQuery({
    queryKey: trackTypeQueryKeys.all,
    queryFn: () => trackTypeApi.listAll(),
  })

  const { data: amenities = [] } = useQuery({
    queryKey: amenityQueryKeys.all,
    queryFn: () => amenityApi.listAll(),
  })

  // Build popular filter tags dynamically from track types + amenities
  const popularOptions = useMemo(() => {
    const trackTags = trackTypes
      .filter((t) => t.isActive)
      .map((t) => ({
        id: t.id,
        label: t.name,
        icon: "🏁",
      }))

    const amenityTags = amenities.map((a) => ({
      id: a.title,
      label: a.title,
      icon: a.icon || "✨",
    }))

    return [...trackTags, ...amenityTags]
  }, [trackTypes, amenities])

  const visibleOptions = showAllPopular ? popularOptions : popularOptions.slice(0, 5)
  const isPriceModified = priceMin > PRICE_SLIDER_MIN || priceMax < PRICE_SLIDER_MAX


  return (
    <aside className="flex w-full flex-col gap-4 py-2">
      {/* Map mini */}
      <div className="relative overflow-hidden rounded-xl border border-slate-200 bg-slate-100">
        <div className="h-[180px]">
          <ExploreMapPanel
            cafes={cafes}
            onSelectCafe={onSelectCafe}
            userLocation={userLocation}
            onUserLocation={onUserLocation}
            hoveredCafeId={hoveredCafeId}
            onBoundsChange={onBoundsChange}
            searchOnMove={searchOnMove}
            onSearchOnMoveChange={onSearchOnMoveChange}
          />
        </div>
        <button
          type="button"
          onClick={() => {/* Parent handles full map */}}
          className="absolute inset-x-0 bottom-0 flex items-center justify-center gap-1.5 bg-orange-600/95 px-3 py-2 text-xs font-bold text-white backdrop-blur-sm transition hover:bg-orange-700/95"
        >
          <MapPin className="h-3.5 w-3.5" />
          Explore on Map
        </button>
      </div>

      {/* Price range */}
      <div className="rounded-xl border border-slate-200 bg-white p-4">
        <div className="flex items-center justify-between">
          <h4 className="text-sm font-bold text-slate-900">Khoảng giá</h4>
          {isPriceModified && (
            <button
              type="button"
              onClick={onResetPrice}
              className="text-xs font-semibold text-orange-600 hover:text-orange-700"
            >
              Đặt lại
            </button>
          )}
        </div>
        <p className="mt-1 text-xs text-slate-500">Giá mỗi slot</p>

        {/* Dual range slider */}
        <div className="relative mt-4 h-1.5">
          <div className="absolute inset-0 rounded-full bg-slate-200" />
          <div
            className="absolute h-full rounded-full bg-orange-600"
            style={{
              left: `${(priceMin / PRICE_SLIDER_MAX) * 100}%`,
              right: `${100 - (priceMax / PRICE_SLIDER_MAX) * 100}%`,
            }}
          />
          <input
            type="range"
            min={PRICE_SLIDER_MIN}
            max={PRICE_SLIDER_MAX}
            step={PRICE_SLIDER_STEP}
            value={priceMin}
            onChange={(e) => {
              const val = Number(e.target.value)
              if (val < priceMax) onPriceMinChange(val)
            }}
            className="pointer-events-none absolute inset-0 w-full appearance-none bg-transparent [&::-webkit-slider-thumb]:pointer-events-auto [&::-webkit-slider-thumb]:h-4 [&::-webkit-slider-thumb]:w-4 [&::-webkit-slider-thumb]:cursor-pointer [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:border-2 [&::-webkit-slider-thumb]:border-orange-600 [&::-webkit-slider-thumb]:bg-white [&::-webkit-slider-thumb]:shadow-sm"
          />
          <input
            type="range"
            min={PRICE_SLIDER_MIN}
            max={PRICE_SLIDER_MAX}
            step={PRICE_SLIDER_STEP}
            value={priceMax}
            onChange={(e) => {
              const val = Number(e.target.value)
              if (val > priceMin) onPriceMaxChange(val)
            }}
            className="pointer-events-none absolute inset-0 w-full appearance-none bg-transparent [&::-webkit-slider-thumb]:pointer-events-auto [&::-webkit-slider-thumb]:h-4 [&::-webkit-slider-thumb]:w-4 [&::-webkit-slider-thumb]:cursor-pointer [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:border-2 [&::-webkit-slider-thumb]:border-orange-600 [&::-webkit-slider-thumb]:bg-white [&::-webkit-slider-thumb]:shadow-sm"
          />
        </div>

        {/* Price inputs */}
        <div className="mt-4 flex items-center gap-2">
          <div className="flex flex-1 items-center rounded-lg border border-slate-200 px-2 py-1.5">
            <input
              type="number"
              value={priceMin}
              onChange={(e) => {
                const val = Number(e.target.value)
                if (val >= PRICE_SLIDER_MIN && val < priceMax) onPriceMinChange(val)
              }}
              className="w-full bg-transparent text-xs font-medium text-slate-700 outline-none"
            />
            <span className="ml-1 text-xs text-slate-400">VND</span>
          </div>
          <span className="text-xs text-slate-400">–</span>
          <div className="flex flex-1 items-center rounded-lg border border-slate-200 px-2 py-1.5">
            <input
              type="number"
              value={priceMax}
              onChange={(e) => {
                const val = Number(e.target.value)
                if (val <= PRICE_SLIDER_MAX && val > priceMin) onPriceMaxChange(val)
              }}
              className="w-full bg-transparent text-xs font-medium text-slate-700 outline-none"
            />
            <span className="ml-1 text-xs text-slate-400">VND</span>
          </div>
        </div>
      </div>

      {/* Popular filters */}
      <div className="rounded-xl border border-slate-200 bg-white p-4">
        <div className="flex items-center justify-between">
          <h4 className="text-sm font-bold text-slate-900">Lọc phổ biến</h4>
          <button
            type="button"
            onClick={() => setShowAllPopular(!showAllPopular)}
            className="text-slate-400 hover:text-slate-600"
          >
            {showAllPopular ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
          </button>
        </div>

        <div className="mt-3 space-y-2">
          {visibleOptions.length === 0 && (
            <p className="text-xs text-slate-400">Đang tải bộ lọc...</p>
          )}
          {visibleOptions.map((opt) => {
            const isSelected = popularFilters.includes(opt.id)
            return (
              <label
                key={opt.id}
                className="flex cursor-pointer items-center gap-2.5 rounded-lg px-1 py-1 transition hover:bg-slate-50"
              >
                <input
                  type="checkbox"
                  checked={isSelected}
                  onChange={() => onTogglePopularFilter(opt.id)}
                  className="h-4 w-4 rounded border-slate-300 text-orange-600 focus:ring-orange-200 accent-orange-600"
                />
                <span className="text-sm leading-none">{opt.icon}</span>
                <span className="text-sm font-medium text-slate-700">{opt.label}</span>
              </label>
            )
          })}
        </div>

        {popularOptions.length > 5 && (
          <button
            type="button"
            onClick={() => setShowAllPopular(!showAllPopular)}
            className="mt-2 text-xs font-semibold text-orange-600 hover:text-orange-700"
          >
            {showAllPopular ? "Thu gọn" : `Xem Tất cả (${popularOptions.length})`}
          </button>
        )}
      </div>

      {/* Clear all */}
      {activeFilterCount > 0 && (
        <button
          type="button"
          onClick={onClearAll}
          className="flex items-center justify-center gap-1.5 rounded-xl border border-dashed border-slate-300 py-2.5 text-sm font-semibold text-slate-500 transition hover:border-red-300 hover:text-red-500"
        >
          <RotateCcw className="h-3.5 w-3.5" />
          Xóa tất cả bộ lọc ({activeFilterCount})
        </button>
      )}
    </aside>
  )
}
