import { api } from "@/shared/lib/axios"
import type {
  ContestCatalogFormat,
  ContestCatalogType,
  ContestItem,
  ContestListResponse,
  ContestRegistration,
  ContestTemplate,
  ContestUpsertBody,
} from "../types"

type ApiEnvelope<T> = {
  success: boolean
  data: T
  meta?: {
    total: number
    page: number
    limit: number
  }
}

export const contestQueryKeys = {
  all: ["contests"] as const,
  list: (params?: Record<string, unknown>) => [...contestQueryKeys.all, "list", params ?? {}] as const,
  detail: (contestId?: string) => [...contestQueryKeys.all, "detail", contestId] as const,
  registrations: (contestId?: string) => [...contestQueryKeys.all, "registrations", contestId] as const,
  myRegistrations: () => [...contestQueryKeys.all, "my-registrations"] as const,
  catalogTypes: () => ["contest-catalog", "types"] as const,
  catalogFormats: () => ["contest-catalog", "formats"] as const,
  catalogTemplates: (params?: Record<string, unknown>) => ["contest-catalog", "templates", params ?? {}] as const,
}

export const contestApi = {
  listContestTypes: async (): Promise<ContestCatalogType[]> => {
    const res = await api.get<ApiEnvelope<ContestCatalogType[]>>("/v1/contest-catalog/types")
    return res.data.data
  },

  listContestFormats: async (): Promise<ContestCatalogFormat[]> => {
    const res = await api.get<ApiEnvelope<ContestCatalogFormat[]>>("/v1/contest-catalog/formats")
    return res.data.data
  },

  listContestTemplates: async (params?: {
    contest_type_id?: string
    contest_format_id?: string
  }): Promise<ContestTemplate[]> => {
    const res = await api.get<ApiEnvelope<ContestTemplate[]>>("/v1/contest-catalog/templates", { params })
    return res.data.data
  },

  listContests: async (params?: Record<string, unknown>): Promise<ContestListResponse> => {
    const res = await api.get<ContestListResponse>("/v1/contests", { params })
    return res.data
  },

  listCafeContests: async (cafeId: string, params?: Record<string, unknown>): Promise<ContestListResponse> => {
    const res = await api.get<ContestListResponse>(`/v1/cafes/${cafeId}/contests`, { params })
    return res.data
  },

  getContest: async (contestId: string): Promise<ContestItem> => {
    const res = await api.get<ApiEnvelope<ContestItem>>(`/v1/contests/${contestId}`)
    return res.data.data
  },

  createContest: async (body: ContestUpsertBody): Promise<ContestItem> => {
    const res = await api.post<ApiEnvelope<ContestItem>>("/v1/contests", body)
    return res.data.data
  },

  updateContest: async (contestId: string, body: Partial<ContestUpsertBody>): Promise<ContestItem> => {
    const res = await api.patch<ApiEnvelope<ContestItem>>(`/v1/contests/${contestId}`, body)
    return res.data.data
  },

  openContest: async (contestId: string): Promise<ContestItem> => {
    const res = await api.post<ApiEnvelope<ContestItem>>(`/v1/contests/${contestId}/open`)
    return res.data.data
  },

  closeContest: async (contestId: string): Promise<ContestItem> => {
    const res = await api.post<ApiEnvelope<ContestItem>>(`/v1/contests/${contestId}/close`)
    return res.data.data
  },

  cancelContest: async (contestId: string): Promise<ContestItem> => {
    const res = await api.post<ApiEnvelope<ContestItem>>(`/v1/contests/${contestId}/cancel`)
    return res.data.data
  },

  registerContest: async (
    contestId: string,
    body: { booking_id: string; vehicle_id: string; vehicle_source?: "RENTAL" | "BYOC" },
  ): Promise<ContestRegistration> => {
    const res = await api.post<ApiEnvelope<ContestRegistration>>(`/v1/contests/${contestId}/register`, body)
    return res.data.data
  },

  listMyRegistrations: async (): Promise<ContestRegistration[]> => {
    const res = await api.get<ApiEnvelope<ContestRegistration[]>>("/v1/me/contest-registrations")
    return res.data.data
  },

  listContestRegistrations: async (contestId: string): Promise<ContestRegistration[]> => {
    const res = await api.get<ApiEnvelope<ContestRegistration[]>>(`/v1/contests/${contestId}/registrations`)
    return res.data.data
  },

  markEntryFeePaid: async (registrationId: string, note?: string): Promise<ContestRegistration> => {
    const res = await api.post<ApiEnvelope<ContestRegistration>>(
      `/v1/contest-registrations/${registrationId}/mark-entry-fee-paid`,
      { note },
    )
    return res.data.data
  },

  waiveEntryFee: async (registrationId: string, note?: string): Promise<ContestRegistration> => {
    const res = await api.post<ApiEnvelope<ContestRegistration>>(
      `/v1/contest-registrations/${registrationId}/waive-entry-fee`,
      { note },
    )
    return res.data.data
  },

  approveRegistration: async (registrationId: string, reason?: string): Promise<ContestRegistration> => {
    const res = await api.post<ApiEnvelope<ContestRegistration>>(
      `/v1/contest-registrations/${registrationId}/approve`,
      { reason },
    )
    return res.data.data
  },

  rejectRegistration: async (registrationId: string, reason?: string): Promise<ContestRegistration> => {
    const res = await api.post<ApiEnvelope<ContestRegistration>>(
      `/v1/contest-registrations/${registrationId}/reject`,
      { reason },
    )
    return res.data.data
  },
}
