import { api } from "@/shared/lib/axios"

export interface ApiFeatureFlag {
  feature_key: string
  entity_type: string
  entity_id: string | null
  is_enabled: boolean
  config: Record<string, unknown>
  updated_at: string
}

export const adminFeatureFlagsApi = {
  list: async (): Promise<ApiFeatureFlag[]> => {
    const res = await api.get<{ success: boolean; data: ApiFeatureFlag[] }>(
      "/v1/admin/feature-flags",
    )
    return res.data.data
  },

  update: async (
    key: string,
    payload: { isEnabled?: boolean; config?: Record<string, unknown> },
  ): Promise<ApiFeatureFlag> => {
    const res = await api.patch<{ success: boolean; data: ApiFeatureFlag }>(
      `/v1/admin/feature-flags/${key}`,
      payload,
    )
    return res.data.data
  },
}
