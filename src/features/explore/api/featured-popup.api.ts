import { api } from "@/shared/lib/axios"

export type FeaturedPopupItem = {
  id: string
  title: string
  subtitle: string | null
  image_url: string | null
  cta_label: string
  cta_url: string | null
  contest_id: string | null
  placement: "EXPLORE"
  audience_scope: "ALL"
  starts_at: string
  ends_at: string
  is_active: boolean
  priority: number
  created_at: string
  updated_at: string
}

export const featuredPopupQueryKeys = {
  all: ["featured-popup"] as const,
  active: () => [...featuredPopupQueryKeys.all, "active"] as const,
}

export const featuredPopupApi = {
  getActive: async (): Promise<FeaturedPopupItem | null> => {
    const res = await api.get<{ success: boolean; data: FeaturedPopupItem | null }>(
      "/v1/explore/featured-popup",
    )
    return res.data.data ?? null
  },
}
