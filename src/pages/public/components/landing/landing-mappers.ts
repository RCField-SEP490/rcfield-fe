import { routePaths } from "@/app/router/route-paths"
import { buildCafeDetailPath } from "@/pages/customer/cafe-detail/cafe-detail-utils"
import type { Cafe } from "@/shared/data/explore-data"
import { CAFE_PLACEHOLDER_IMAGE } from "@/features/cafes/lib/cafe.mappers"
import type {
  FeaturedVenueViewModel,
  HeroVenueCardViewModel,
} from "./landing-types"

export function mapCafeToHeroVenue(cafe: Cafe): HeroVenueCardViewModel {
  return {
    id: cafe.id,
    name: cafe.name,
    cityLabel: cafe.city || cafe.district || "Chưa cập nhật địa điểm",
    image: hasRealImage(cafe.image) ? cafe.image : null,
    hasRealImage: hasRealImage(cafe.image),
    ratingLabel: cafe.rating > 0 ? cafe.rating.toFixed(1) : null,
    availabilityLabel: cafe.slotFeeRate ? "Đang mở đặt lịch" : "Xem chi tiết sân",
    bookingHref: `${routePaths.bookingCreate}?cafe_id=${cafe.id}`,
    detailHref: buildCafeDetailPath(cafe),
  }
}

export function mapCafeToFeaturedVenue(cafe: Cafe): FeaturedVenueViewModel {
  const heroVenue = mapCafeToHeroVenue(cafe)

  return {
    ...heroVenue,
    districtLabel: [cafe.district, cafe.city].filter(Boolean).join(", ") || "Chưa cập nhật khu vực",
    trackLabel: cafe.trackTypes[0] ?? "RC Track",
  }
}

export function rankLandingCafes(cafes: Cafe[]) {
  return [...cafes].sort((left, right) => {
    const imageScore = Number(hasRealImage(right.image)) - Number(hasRealImage(left.image))
    if (imageScore !== 0) return imageScore

    const ratingScore = right.rating - left.rating
    if (ratingScore !== 0) return ratingScore

    return right.reviewsCount - left.reviewsCount
  })
}

function hasRealImage(image?: string | null) {
  return !!image && image !== CAFE_PLACEHOLDER_IMAGE
}
