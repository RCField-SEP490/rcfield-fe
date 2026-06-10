import type { Cafe, Vehicle } from "@/shared/data/explore-data"
import type { BackendCafe, CafeImage, CafeListParams, TrackType } from "../types"
import { sanitizeImageUrl, getCatalogImageUrl } from "@/shared/lib/utils"

export const CAFE_PLACEHOLDER_IMAGE =
  "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='1200' height='800' viewBox='0 0 1200 800'%3E%3Crect width='1200' height='800' fill='%23f1f5f9'/%3E%3Cpath d='M216 520c76-132 174-198 294-198 80 0 145 29 195 86 34-22 73-33 117-33 72 0 131 28 178 85 31 37 52 81 64 132H136c18-26 45-50 80-72z' fill='%23cbd5e1'/%3E%3Ccircle cx='442' cy='250' r='82' fill='%23fb923c'/%3E%3Ctext x='600' y='670' text-anchor='middle' font-family='Arial, sans-serif' font-size='54' font-weight='700' fill='%23334155'%3ERCField Cafe%3C/text%3E%3C/svg%3E"

export function mapCafeToExploreCafe(cafe: BackendCafe, images: CafeImage[] = []): Cafe {
  const imageUrls = buildImageUrls(cafe, images)
  const slotFeeRate = toNumber(cafe.slotFeeRate)

  return {
    id: cafe.id,
    providerId: cafe.providerId,
    name: cafe.name,
    slug: cafe.slug,
    rating: 0,
    reviewsCount: 0,
    phone: cafe.phone,
    status: cafe.status,
    address: cafe.address,
    district: cafe.district,
    city: cafe.city,
    image: imageUrls[0] ?? CAFE_PLACEHOLDER_IMAGE,
    images: imageUrls,
    priceRange: slotFeeRate > 0 ? `${formatCompactCurrency(slotFeeRate)}/slot` : "Chưa cập nhật",
    slotDurationMinutes: cafe.slotDurationMinutes,
    slotFeeRate,
    maxConcurrentBookings: cafe.maxConcurrentBookings,
    minBookingNoticeMinutes: cafe.minBookingNoticeMinutes,
    byocCapacity: cafe.byocCapacity,
    trackTypes: cafe.trackTypes.map(formatTrackType),
    trackTypeIds: cafe.trackTypes.map((t) => t.id),
    features: [],
    operatingHours: cafe.operatingHours,
    description: cafe.description ?? "Cơ sở chưa cập nhật mô tả.",
    coordinates: buildMapCoordinates(cafe.latitude, cafe.longitude),
    latitude: toNumber(cafe.latitude) || null,
    longitude: toNumber(cafe.longitude) || null,
    availableVehicles: [],
  }
}

export function mapCafesToExploreCafes(cafes: BackendCafe[]): Cafe[] {
  return cafes.map((cafe) => mapCafeToExploreCafe(cafe))
}

export function toCafeListParams(params: {
  city?: string
  trackType?: string
  page?: number
  limit?: number
}): CafeListParams {
  return {
    page: params.page ?? 1,
    limit: params.limit ?? 100,
    city: isActiveFilter(params.city) ? params.city : undefined,
    track_type: mapTrackTypeParam(params.trackType),
  }
}

export function formatTrackType(trackType: TrackType | string) {
  if (trackType && typeof trackType === "object" && "name" in trackType) {
    return trackType.name
  }
  if (typeof trackType === "string") {
    return trackType
      .toLowerCase()
      .split("_")
      .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
      .join(" ")
  }
  return ""
}

export function getCafeImageUrls(cafe: BackendCafe, images: CafeImage[] = []) {
  return buildImageUrls(cafe, images)
}

export function getCafeSlotFeeRate(cafe: BackendCafe) {
  return toNumber(cafe.slotFeeRate)
}

function buildImageUrls(cafe: BackendCafe, images: CafeImage[]) {
  const sortedImages = [...images].sort((a, b) => a.sortOrder - b.sortOrder)
  const mapped = [
    ...sortedImages.map((image) => sanitizeImageUrl(image.url)),
    sanitizeImageUrl(cafe.coverImageUrl),
    CAFE_PLACEHOLDER_IMAGE,
  ].filter(Boolean) as string[]
  return Array.from(new Set(mapped))
}

function buildMapCoordinates(latitude: BackendCafe["latitude"], longitude: BackendCafe["longitude"]) {
  const lat = toNumber(latitude)
  const lng = toNumber(longitude)

  if (!lat || !lng) return { x: 50, y: 50 }

  return {
    x: clamp(((lng + 180) / 360) * 100, 8, 92),
    y: clamp(((90 - lat) / 180) * 100, 8, 92),
  }
}

function mapTrackTypeParam(trackType?: string): string | undefined {
  if (!isActiveFilter(trackType)) return undefined
  return trackType
}

function isActiveFilter(value?: string | null) {
  return !!value && value !== "all"
}

function toNumber(value: number | string | null | undefined) {
  const parsed = Number(value)
  return Number.isFinite(parsed) ? parsed : 0
}

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value))
}

function formatCompactCurrency(value: number) {
  if (value >= 1_000_000) return `${Math.round(value / 100_000) / 10}tr`
  if (value >= 1_000) return `${Math.round(value / 1_000)}k`
  return String(value)
}

export function mapCatalogToExploreVehicle(catalog: any): Vehicle {
  const brandName = catalog.name ? catalog.name.split(" ")[0] : "Tamiya"
  let specBattery = "2S LiPo"
  let specMotor = "Brushed 540"
  let specScale = "1/10"

  if (catalog.tier === "PREMIUM") {
    specBattery = "3S LiPo"
    specMotor = "Brushless 3300KV"
    specScale = "1/10"
  } else if (catalog.tier === "RESTRICTED") {
    specBattery = "4S LiPo"
    specMotor = "Brushless 2200KV"
    specScale = "1/8"
  } else if (catalog.tier === "STANDARD") {
    specBattery = "2S LiPo"
    specMotor = "Brushless 2500KV"
    specScale = "1/10"
  }

  const compatibleTrack = (Array.isArray(catalog.compatibleTrackTypes) && catalog.compatibleTrackTypes.length > 0)
    ? formatTrackType(catalog.compatibleTrackTypes[0])
    : "Drift"

  const countVal = catalog.total_units ?? catalog._count?.units ?? 0

  return {
    id: catalog.id,
    name: catalog.name || "Xe địa hình RC",
    scale: specScale,
    type: compatibleTrack,
    image: getCatalogImageUrl(catalog) || "https://images.unsplash.com/photo-1594787318286-3d835c1d207f?q=80&w=600&auto=format&fit=crop",
    pricePerHour: catalog.hourlyRate || 0,
    securityDeposit: catalog.securityDeposit || 0,
    status: countVal > 0 ? "available" : "maintenance",
    specs: {
      battery: specBattery,
      motor: specMotor,
      brand: brandName,
    },
  }
}
