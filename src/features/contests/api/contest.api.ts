import { api } from "@/shared/lib/axios"
import type {
  ContestAuditLogItem,
  ContestCorrectResultsBody,
  ContestCatalogFormat,
  ContestCatalogType,
  ContestItem,
  ContestLeaderboardPayload,
  ContestListResponse,
  ContestMatch,
  ContestMetrics,
  ContestRegistration,
  ContestSubmitResultsBody,
  ContestTemplate,
  ContestGenerateMatchesBody,
  ContestUpdateMatchParticipantsBody,
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
  matches: (contestId?: string) => [...contestQueryKeys.all, "matches", contestId] as const,
  metrics: (contestId?: string) => [...contestQueryKeys.all, "metrics", contestId] as const,
  auditLogs: (contestId?: string) => [...contestQueryKeys.all, "audit-logs", contestId] as const,
  leaderboard: (contestId?: string) => [...contestQueryKeys.all, "leaderboard", contestId] as const,
  lookup: (contestId?: string, checkInCode?: string) =>
    [...contestQueryKeys.all, "lookup", contestId, checkInCode] as const,
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

  listMatches: async (contestId: string): Promise<ContestMatch[]> => {
    const res = await api.get<ApiEnvelope<ContestMatch[]>>(`/v1/contests/${contestId}/matches`)
    return res.data.data
  },

  generateMatches: async (contestId: string, body: ContestGenerateMatchesBody): Promise<ContestMatch[]> => {
    const res = await api.post<ApiEnvelope<ContestMatch[]>>(`/v1/contests/${contestId}/matches/generate`, body)
    return res.data.data
  },

  updateMatchParticipants: async (
    matchId: string,
    body: ContestUpdateMatchParticipantsBody,
  ): Promise<ContestMatch[]> => {
    const res = await api.patch<ApiEnvelope<ContestMatch[]>>(`/v1/contest-matches/${matchId}/participants`, body)
    return res.data.data
  },

  submitMatchResults: async (
    matchId: string,
    body: ContestSubmitResultsBody,
  ): Promise<ContestMatch[]> => {
    const res = await api.post<ApiEnvelope<ContestMatch[]>>(`/v1/contest-matches/${matchId}/results`, body)
    return res.data.data
  },

  correctMatchResults: async (
    matchId: string,
    body: ContestCorrectResultsBody,
  ): Promise<ContestMatch[]> => {
    const res = await api.post<ApiEnvelope<ContestMatch[]>>(`/v1/contest-matches/${matchId}/results/correct`, body)
    return res.data.data
  },

  advanceMatch: async (matchId: string): Promise<ContestMatch[]> => {
    const res = await api.post<ApiEnvelope<ContestMatch[]>>(`/v1/contest-matches/${matchId}/advance`)
    return res.data.data
  },

  publishLeaderboard: async (contestId: string): Promise<ContestLeaderboardPayload> => {
    const res = await api.post<ApiEnvelope<ContestLeaderboardPayload>>(`/v1/contests/${contestId}/leaderboard/publish`)
    return res.data.data
  },

  listAuditLogs: async (contestId: string): Promise<ContestAuditLogItem[]> => {
    const res = await api.get<ApiEnvelope<ContestAuditLogItem[]>>(`/v1/contests/${contestId}/audit-logs`)
    return res.data.data
  },

  getMetrics: async (contestId: string): Promise<ContestMetrics> => {
    const res = await api.get<ApiEnvelope<ContestMetrics>>(`/v1/contests/${contestId}/metrics`)
    return res.data.data
  },

  lookupRegistration: async (contestId: string, checkInCode: string): Promise<ContestRegistration> => {
    const res = await api.get<ApiEnvelope<ContestRegistration>>(
      `/v1/contests/${contestId}/registrations/lookup`,
      { params: { check_in_code: checkInCode } },
    )
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

  checkInRegistration: async (
    registrationId: string,
    checkedInCafeId: string,
  ): Promise<ContestRegistration> => {
    const res = await api.post<ApiEnvelope<ContestRegistration>>(
      `/v1/contest-registrations/${registrationId}/check-in`,
      { checked_in_cafe_id: checkedInCafeId },
    )
    return res.data.data
  },

  cancelRegistration: async (registrationId: string): Promise<ContestRegistration> => {
    const res = await api.post<ApiEnvelope<ContestRegistration>>(
      `/v1/contest-registrations/${registrationId}/cancel`
    )
    return res.data.data
  },
}
