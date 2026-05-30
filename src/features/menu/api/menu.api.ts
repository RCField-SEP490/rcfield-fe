import { api } from "@/shared/lib/axios"
import type { ApiEnvelope, MenuItem, MenuListParams, MenuListResponse, MenuUpsertBody } from "../types"

function debugMenuApi(message: string, details?: unknown) {
  if (import.meta.env.DEV) {
    console.debug(`[MenuAPI] ${message}`, details ?? "")
  }
}

export const menuQueryKeys = {
  all: ["menu"] as const,
  list: (cafeId?: string, params?: MenuListParams) => [...menuQueryKeys.all, "list", cafeId, params ?? {}] as const,
}

export const menuApi = {
  listMenuItems: async (cafeId: string, params: MenuListParams = {}): Promise<MenuListResponse> => {
    debugMenuApi("GET /v1/cafes/:cafeId/menu", { cafeId, params })
    const response = await api.get<MenuListResponse>(`/v1/cafes/${cafeId}/menu`, { params })
    debugMenuApi("GET /v1/cafes/:cafeId/menu response", {
      cafeId,
      total: response.data.meta.total,
      count: response.data.data.length,
    })
    return response.data
  },

  createMenuItem: async (cafeId: string, body: MenuUpsertBody): Promise<MenuItem> => {
    debugMenuApi("POST /v1/cafes/:cafeId/menu", { cafeId, name: body.name, category: body.category })
    const response = await api.post<ApiEnvelope<MenuItem>>(`/v1/cafes/${cafeId}/menu`, body)
    return response.data.data
  },

  updateMenuItem: async (cafeId: string, itemId: string, body: Partial<MenuUpsertBody>): Promise<MenuItem> => {
    debugMenuApi("PATCH /v1/cafes/:cafeId/menu/:itemId", { cafeId, itemId, fields: Object.keys(body) })
    const response = await api.patch<ApiEnvelope<MenuItem>>(`/v1/cafes/${cafeId}/menu/${itemId}`, body)
    return response.data.data
  },

  deleteMenuItem: async (cafeId: string, itemId: string): Promise<void> => {
    debugMenuApi("DELETE /v1/cafes/:cafeId/menu/:itemId", { cafeId, itemId })
    await api.delete(`/v1/cafes/${cafeId}/menu/${itemId}`)
  },
}
