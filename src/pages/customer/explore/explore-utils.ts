import type { Cafe, CafeSearchParams, Vehicle } from "@/shared/data/explore-data"

export type CafeViewMode = "grid" | "list"
export type SearchTarget = "cafes" | "vehicles"
export type VehicleWithCafe = Vehicle & { cafe: Cafe }

const DEFAULT_VALUE = "all"

export function normalizeFilterValue(value?: string | null) {
  return value && value.trim() !== "" ? value : DEFAULT_VALUE
}

export function flattenCafeVehicles(cafes: Cafe[]): VehicleWithCafe[] {
  return cafes.flatMap((cafe) => cafe.availableVehicles.map((vehicle) => ({ ...vehicle, cafe })))
}

export function filterCafes(cafes: Cafe[], params: CafeSearchParams): Cafe[] {
  return cafes.filter((cafe) => {
    const query = params.query?.trim().toLowerCase() ?? ""
    const city = normalizeFilterValue(params.city)
    const trackType = normalizeFilterValue(params.trackType)
    const priceRange = normalizeFilterValue(params.priceRange)
    const feature = normalizeFilterValue(params.feature)
    const vehicleType = normalizeFilterValue(params.vehicleType)

    const matchesQuery =
      query === "" ||
      cafe.name.toLowerCase().includes(query) ||
      cafe.address.toLowerCase().includes(query) ||
      cafe.district.toLowerCase().includes(query) ||
      cafe.city.toLowerCase().includes(query)

    const matchesCity = city === DEFAULT_VALUE || cafe.city === city
    const matchesTrack = trackType === DEFAULT_VALUE || cafe.trackTypes.some((type) => type.toLowerCase().includes(trackType.toLowerCase()))
    const matchesFeature = feature === DEFAULT_VALUE || cafe.features.includes(feature)
    const matchesVehicleType =
      vehicleType === DEFAULT_VALUE ||
      cafe.availableVehicles.some((vehicle) => vehicle.type.toLowerCase().includes(vehicleType.toLowerCase()) || vehicle.scale.includes(vehicleType))
    const matchesPrice = priceRange === DEFAULT_VALUE || cafe.availableVehicles.some((vehicle) => isVehicleInPriceRange(vehicle.pricePerHour, priceRange))

    return matchesQuery && matchesCity && matchesTrack && matchesFeature && matchesVehicleType && matchesPrice
  })
}

export function filterVehicles(vehicles: VehicleWithCafe[], params: CafeSearchParams): VehicleWithCafe[] {
  return vehicles.filter((vehicle) => {
    const query = params.query?.trim().toLowerCase() ?? ""
    const city = normalizeFilterValue(params.city)
    const trackType = normalizeFilterValue(params.trackType)
    const priceRange = normalizeFilterValue(params.priceRange)
    const feature = normalizeFilterValue(params.feature)
    const vehicleType = normalizeFilterValue(params.vehicleType)

    const matchesQuery =
      query === "" ||
      vehicle.name.toLowerCase().includes(query) ||
      vehicle.type.toLowerCase().includes(query) ||
      vehicle.specs.brand.toLowerCase().includes(query) ||
      vehicle.cafe.name.toLowerCase().includes(query)

    const matchesCity = city === DEFAULT_VALUE || vehicle.cafe.city === city
    const matchesTrack = trackType === DEFAULT_VALUE || vehicle.type.toLowerCase().includes(trackType.toLowerCase()) || vehicle.scale.includes(trackType)
    const matchesFeature = feature === DEFAULT_VALUE || vehicle.cafe.features.includes(feature)
    const matchesVehicleType = vehicleType === DEFAULT_VALUE || vehicle.type.toLowerCase().includes(vehicleType.toLowerCase()) || vehicle.scale.includes(vehicleType)
    const matchesPrice = priceRange === DEFAULT_VALUE || isVehicleInPriceRange(vehicle.pricePerHour, priceRange)

    return matchesQuery && matchesCity && matchesTrack && matchesFeature && matchesVehicleType && matchesPrice
  })
}

export function getActiveFilterCount(params: CafeSearchParams) {
  return [params.city, params.trackType, params.priceRange, params.feature, params.vehicleType, params.date].filter(
    (value) => value !== undefined && value !== "" && value !== DEFAULT_VALUE,
  ).length
}

export function buildBookingUrl(cafeId: string, vehicleId?: string) {
  const params = new URLSearchParams({ cafeId })
  if (vehicleId) params.set("vehicleId", vehicleId)
  return `/booking/create?${params.toString()}`
}

function isVehicleInPriceRange(price: number, range: string) {
  if (range === "under100") return price < 100000
  if (range === "100to200") return price >= 100000 && price <= 200000
  if (range === "over200") return price > 200000
  return true
}
