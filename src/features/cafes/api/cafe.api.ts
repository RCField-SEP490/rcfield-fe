import { api } from "@/shared/lib/axios"
import type { BackendCafe, CafeImage, CafeListParams, CafeListResponse, CafeStatus, CafeUpsertBody, ApiEnvelope } from "../types"

function debugCafeApi(message: string, details?: unknown) {
  if (import.meta.env.DEV) {
    console.debug(`[CafeAPI] ${message}`, details ?? "")
  }
}

export const cafeQueryKeys = {
  all: ["cafes"] as const,
  list: (params?: CafeListParams) => [...cafeQueryKeys.all, "list", params ?? {}] as const,
  detail: (id?: string) => [...cafeQueryKeys.all, "detail", id] as const,
  images: (cafeId?: string) => [...cafeQueryKeys.all, "images", cafeId] as const,
}

export const cafeApi = {
  listCafes: async (params: CafeListParams = {}): Promise<CafeListResponse> => {
    debugCafeApi("GET /v1/cafes", params)
    const res = await api.get<CafeListResponse>("/v1/cafes", { params })
    debugCafeApi("GET /v1/cafes response", { total: res.data.meta?.total, count: res.data.data.length })
    return res.data
  },

  getCafe: async (cafeId: string): Promise<BackendCafe> => {
    debugCafeApi("GET /v1/cafes/:id", { cafeId })
    const res = await api.get<ApiEnvelope<BackendCafe>>(`/v1/cafes/${cafeId}`)
    return res.data.data
  },

  createCafe: async (body: CafeUpsertBody): Promise<BackendCafe> => {
    debugCafeApi("POST /v1/cafes", { name: body.name, city: body.city, track_types: body.track_types })
    const res = await api.post<ApiEnvelope<BackendCafe>>("/v1/cafes", body)
    debugCafeApi("POST /v1/cafes response", { cafeId: res.data.data.id, status: res.data.data.status })
    return res.data.data
  },

  updateCafe: async (cafeId: string, body: Partial<CafeUpsertBody>): Promise<BackendCafe> => {
    debugCafeApi("PATCH /v1/cafes/:id", { cafeId, fields: Object.keys(body) })
    const res = await api.patch<ApiEnvelope<BackendCafe>>(`/v1/cafes/${cafeId}`, body)
    debugCafeApi("PATCH /v1/cafes/:id response", { cafeId: res.data.data.id, status: res.data.data.status })
    return res.data.data
  },

  updateCafeStatus: async (cafeId: string, status: CafeStatus): Promise<BackendCafe> => {
    debugCafeApi("PATCH /v1/cafes/:id/status", { cafeId, status })
    const res = await api.patch<ApiEnvelope<BackendCafe>>(`/v1/cafes/${cafeId}/status`, { status })
    return res.data.data
  },

  listCafeImages: async (cafeId: string): Promise<CafeImage[]> => {
    debugCafeApi("GET /v1/cafes/:id/images", { cafeId })
    const res = await api.get<ApiEnvelope<CafeImage[]>>(`/v1/cafes/${cafeId}/images`)
    return res.data.data
  },

  uploadCafeImages: async (cafeId: string, files: File[], sortOrder = 0): Promise<CafeImage[]> => {
    debugCafeApi("POST /v1/cafes/:id/images", { cafeId, count: files.length, sortOrder })
    const formData = new FormData()
    files.forEach((file) => formData.append("files", file))
    formData.append("sort_order", String(sortOrder))

    const res = await api.post<ApiEnvelope<CafeImage[]>>(`/v1/cafes/${cafeId}/images`, formData, {
      headers: { "Content-Type": "multipart/form-data" },
    })
    return res.data.data
  },

  deleteCafeImage: async (imageId: string): Promise<void> => {
    debugCafeApi("DELETE /v1/cafe-images/:id", { imageId })
    await api.delete(`/v1/cafe-images/${imageId}`)
  },
}
