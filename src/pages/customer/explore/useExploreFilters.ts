import { useEffect, useMemo, useState } from "react"
import { useSearchParams } from "react-router"
import type { CafeSearchParams, SortOption } from "@/shared/data/explore-data"
import type { CafeViewMode, SearchTarget } from "./explore-utils"
import { getActiveFilterCount, normalizeFilterValue } from "./explore-utils"
import { PRICE_SLIDER_MAX, PRICE_SLIDER_MIN } from "./constants"

export function useExploreFilters() {
  const [searchParams] = useSearchParams()
  const [searchTarget, setSearchTarget] = useState<SearchTarget>("cafes")
  const [viewMode, setViewMode] = useState<CafeViewMode>("grid")
  const [query, setQuery] = useState(searchParams.get("query") ?? "")
  const [debouncedQuery, setDebouncedQuery] = useState(query)
  const [city, setCity] = useState(normalizeFilterValue(searchParams.get("city")))
  const [trackType, setTrackType] = useState(normalizeFilterValue(searchParams.get("trackType")))
  const [priceRange, setPriceRange] = useState(normalizeFilterValue(searchParams.get("priceRange")))
  const [feature, setFeature] = useState(normalizeFilterValue(searchParams.get("feature")))
  const [vehicleType, setVehicleType] = useState(normalizeFilterValue(searchParams.get("vehicleType")))
  const [date, setDate] = useState(searchParams.get("date") ?? "")
  const [sortBy, setSortBy] = useState<SortOption>("popularity")
  const [priceMin, setPriceMin] = useState(PRICE_SLIDER_MIN)
  const [priceMax, setPriceMax] = useState(PRICE_SLIDER_MAX)
  const [popularFilters, setPopularFilters] = useState<string[]>([])

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedQuery(query), 300)
    return () => clearTimeout(timer)
  }, [query])

  const params: CafeSearchParams = useMemo(
    () => ({
      query: debouncedQuery,
      city,
      trackType,
      priceRange,
      feature,
      vehicleType,
      date,
      sortBy,
      priceMin,
      priceMax,
      popularFilters,
    }),
    [debouncedQuery, city, trackType, priceRange, feature, vehicleType, date, sortBy, priceMin, priceMax, popularFilters],
  )

  const activeFilterCount = useMemo(() => getActiveFilterCount(params), [params])

  const clearFilters = () => {
    setQuery("")
    setDebouncedQuery("")
    setCity("all")
    setTrackType("all")
    setPriceRange("all")
    setFeature("all")
    setVehicleType("all")
    setDate("")
    setSortBy("popularity")
    setPriceMin(PRICE_SLIDER_MIN)
    setPriceMax(PRICE_SLIDER_MAX)
    setPopularFilters([])
  }

  const resetPriceSlider = () => {
    setPriceMin(PRICE_SLIDER_MIN)
    setPriceMax(PRICE_SLIDER_MAX)
  }

  const togglePopularFilter = (filter: string) => {
    setPopularFilters((prev) =>
      prev.includes(filter) ? prev.filter((f) => f !== filter) : [...prev, filter],
    )
  }

  return {
    activeFilterCount,
    clearFilters,
    params,
    searchTarget,
    setSearchTarget,
    viewMode,
    setViewMode,
    query,
    setQuery,
    city,
    setCity,
    trackType,
    setTrackType,
    priceRange,
    setPriceRange,
    feature,
    setFeature,
    vehicleType,
    setVehicleType,
    date,
    setDate,
    sortBy,
    setSortBy,
    priceMin,
    setPriceMin,
    priceMax,
    setPriceMax,
    popularFilters,
    setPopularFilters,
    togglePopularFilter,
    resetPriceSlider,
  }
}
