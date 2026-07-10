import { cafeApi } from "@/features/cafes/api/cafe.api"
import { mapCafesToExploreCafes, toCafeListParams } from "@/features/cafes/lib/cafe.mappers"
import { promotionApi } from "@/features/promotions/api/promotion.api"
import type { ActivePromotion } from "@/features/promotions/api/promotion.api"
import type { Cafe, CafeSearchParams } from "@/shared/data/explore-data"

export async function getCafes(params: CafeSearchParams = {}): Promise<Cafe[]> {
  const response = await cafeApi.listCafes(toCafeListParams(params))
  const cafes = mapCafesToExploreCafes(response.data)

  // Batch fetch promotions cho tất cả cafes (parallel)
  const cafesWithPromos = await Promise.all(
    cafes.map(async (cafe) => {
      try {
        const promotions = await fetchCafePromotions(cafe.id)
        return { ...cafe, promotions }
      } catch {
        return cafe
      }
    }),
  )

  return cafesWithPromos
}

async function fetchCafePromotions(cafeId: string): Promise<ActivePromotion[]> {
  try {
    return await promotionApi.listActive(cafeId)
  } catch {
    return []
  }
}
