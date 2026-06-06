import { api } from "@/shared/lib/axios"
import type {
  StaffListParams,
  StaffListResponse,
  StaffCreateBody,
  StaffCreateResponse,
  StaffUpdateBody,
  StaffAssignBody,
  StaffStatusBody,
  StaffResetPasswordResponse,
  StaffUser
} from "../types"

function debugStaffApi(message: string, details?: unknown) {
  if (import.meta.env.DEV) {
    console.debug(`[StaffAPI] ${message}`, details ?? "")
  }
}

export const staffQueryKeys = {
  all: ["provider-staff"] as const,
  list: (params?: StaffListParams) => [...staffQueryKeys.all, "list", params ?? {}] as const,
  detail: (id?: string) => [...staffQueryKeys.all, "detail", id] as const,
}

export const staffApi = {
  listStaff: async (params: StaffListParams = {}): Promise<StaffListResponse> => {
    debugStaffApi("GET /v1/provider/staff", params)
    const response = await api.get<StaffListResponse>("/v1/provider/staff", { params })
    return response.data
  },

  getStaff: async (staffId: string): Promise<StaffUser> => {
    debugStaffApi(`GET /v1/provider/staff/${staffId}`)
    const response = await api.get<{ data: StaffUser }>(`/v1/provider/staff/${staffId}`)
    return response.data.data
  },

  createStaff: async (body: StaffCreateBody): Promise<StaffCreateResponse["data"]> => {
    debugStaffApi("POST /v1/provider/staff", body)
    const response = await api.post<StaffCreateResponse>("/v1/provider/staff", body)
    return response.data.data
  },

  updateStaff: async (staffId: string, body: StaffUpdateBody): Promise<void> => {
    debugStaffApi(`PATCH /v1/provider/staff/${staffId}`, body)
    await api.patch(`/v1/provider/staff/${staffId}`, body)
  },

  assignStaffCafe: async (staffId: string, body: StaffAssignBody): Promise<void> => {
    debugStaffApi(`PATCH /v1/provider/staff/${staffId}/assignment`, body)
    await api.patch(`/v1/provider/staff/${staffId}/assignment`, body)
  },

  updateStaffStatus: async (staffId: string, body: StaffStatusBody): Promise<void> => {
    debugStaffApi(`PATCH /v1/provider/staff/${staffId}/status`, body)
    await api.patch(`/v1/provider/staff/${staffId}/status`, body)
  },

  resetStaffPassword: async (staffId: string): Promise<StaffResetPasswordResponse["data"]> => {
    debugStaffApi(`POST /v1/provider/staff/${staffId}/reset-password`)
    const response = await api.post<StaffResetPasswordResponse>(`/v1/provider/staff/${staffId}/reset-password`)
    return response.data.data
  },
}
