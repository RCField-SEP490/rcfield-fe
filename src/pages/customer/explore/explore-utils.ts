import type { Cafe, CafeSearchParams, Vehicle } from "@/shared/data/explore-data"

export type CafeViewMode = "grid" | "list"
export type SearchTarget = "cafes" | "vehicles"
export type VehicleWithCafe = Vehicle & { cafe: Cafe }
export type UserLocation = { lat: number; lng: number }
export type MapBounds = { north: number; south: number; east: number; west: number }

export function cafeInBounds(cafe: { latitude?: number | null; longitude?: number | null }, bounds: MapBounds): boolean {
  if (!cafe.latitude || !cafe.longitude) return false
  return (
    cafe.latitude <= bounds.north &&
    cafe.latitude >= bounds.south &&
    cafe.longitude <= bounds.east &&
    cafe.longitude >= bounds.west
  )
}

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
    const matchesTrack =
      trackType === DEFAULT_VALUE ||
      cafe.trackTypes.some((type) => type.toLowerCase().includes(trackType.toLowerCase())) ||
      cafe.trackTypeIds?.includes(trackType)
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
    const matchesTrack =
      trackType === DEFAULT_VALUE ||
      vehicle.type.toLowerCase().includes(trackType.toLowerCase()) ||
      vehicle.scale.includes(trackType) ||
      vehicle.cafe.trackTypeIds?.includes(trackType)
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

export function haversineKm(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371
  const dLat = ((lat2 - lat1) * Math.PI) / 180
  const dLon = ((lon2 - lon1) * Math.PI) / 180
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) * Math.cos((lat2 * Math.PI) / 180) * Math.sin(dLon / 2) ** 2
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
}

export function formatDistance(km: number): string {
  if (km < 1) return `${Math.round(km * 1000)} m`
  if (km < 10) return `${km.toFixed(1)} km`
  return `${Math.round(km).toLocaleString("vi-VN")} km`
}
