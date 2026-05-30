import { api } from "@/shared/lib/axios"
import type { BackendCafe, CafeImage, CafeListParams, CafeListResponse, CafeStatus, ApiEnvelope } from "../types"

export const cafeQueryKeys = {
  all: ["cafes"] as const,
  list: (params?: CafeListParams) => [...cafeQueryKeys.all, "list", params ?? {}] as const,
  detail: (id?: string) => [...cafeQueryKeys.all, "detail", id] as const,
  images: (cafeId?: string) => [...cafeQueryKeys.all, "images", cafeId] as const,
}

export const cafeApi = {
  listCafes: async (params: CafeListParams = {}): Promise<CafeListResponse> => {
    const res = await api.get<CafeListResponse>("/v1/cafes", { params })
    return res.data
  },

  getCafe: async (cafeId: string): Promise<BackendCafe> => {
    const res = await api.get<ApiEnvelope<BackendCafe>>(`/v1/cafes/${cafeId}`)
    return res.data.data
  },

  updateCafeStatus: async (cafeId: string, status: CafeStatus): Promise<BackendCafe> => {
    const res = await api.patch<ApiEnvelope<BackendCafe>>(`/v1/cafes/${cafeId}/status`, { status })
    return res.data.data
  },

  listCafeImages: async (cafeId: string): Promise<CafeImage[]> => {
    const res = await api.get<ApiEnvelope<CafeImage[]>>(`/v1/cafes/${cafeId}/images`)
    return res.data.data
  },

  uploadCafeImages: async (cafeId: string, files: File[], sortOrder = 0): Promise<CafeImage[]> => {
    const formData = new FormData()
    files.forEach((file) => formData.append("files", file))
    formData.append("sort_order", String(sortOrder))

    const res = await api.post<ApiEnvelope<CafeImage[]>>(`/v1/cafes/${cafeId}/images`, formData, {
      headers: { "Content-Type": "multipart/form-data" },
    })
    return res.data.data
  },

  deleteCafeImage: async (imageId: string): Promise<void> => {
    await api.delete(`/v1/cafe-images/${imageId}`)
  },
}
