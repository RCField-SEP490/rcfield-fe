import type { Cafe } from "@/shared/data/explore-data"
import { mockCafes } from "@/shared/data/explore-data"

export function getCafeBySlug(slug?: string): Cafe | undefined {
  return mockCafes.find((cafe) => cafe.slug === slug)
}

export function buildCafeDetailPath(cafe: Cafe) {
  return `/cafes/${cafe.slug}`
}

export function buildCafeBookingPath(cafeId: string, mode = "hourly") {
  const params = new URLSearchParams({ cafeId, mode })
  return `/booking/create?${params.toString()}`
}
