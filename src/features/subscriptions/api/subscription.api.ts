import { api } from "@/shared/lib/axios"
import type {
  ProviderSubscription,
  ProviderListItem,
  ProviderDetail,
  PaymentRequest,
  AdminPaymentRequestItem,
  PaymentRequestStatus,
  ProviderStatus,
  SubscriptionPlan,
} from "../types"

interface PaginatedResponse<T> {
  data: T[]
  total: number
}

export const subscriptionApi = {
  getSubscriptionStatus: async (): Promise<{ success: boolean; data: ProviderSubscription | null }> => {
    const res = await api.get<{ success: boolean; data: ProviderSubscription | null }>("/v1/provider/subscription")
    return res.data
  },

  submitPaymentRequest: async (body: {
    plan_id: string
    transfer_reference: string
    transfer_date: string
    transfer_amount: number
  }): Promise<{ success: boolean; data: PaymentRequest }> => {
    const res = await api.post<{ success: boolean; data: PaymentRequest }>("/v1/provider/payment-requests", body)
    return res.data
  },

  listMyPaymentRequests: async (page = 1, limit = 20): Promise<PaginatedResponse<PaymentRequest>> => {
    const res = await api.get<PaginatedResponse<PaymentRequest>>("/v1/provider/payment-requests", {
      params: { page, limit },
    })
    return res.data
  },

  registerProvider: async (body: {
    email: string
    password: string
    full_name: string
    phone?: string
    business_name: string
    business_description?: string
  }): Promise<{ success: boolean; data: { id: string; email: string } }> => {
    const res = await api.post<{ success: boolean; data: { id: string; email: string } }>(
      "/v1/auth/register-provider",
      body,
    )
    return res.data
  },

  listProviders: async (params?: {
    status?: ProviderStatus
    page?: number
    limit?: number
  }): Promise<PaginatedResponse<ProviderListItem>> => {
    const res = await api.get<PaginatedResponse<ProviderListItem>>("/v1/admin/providers", { params })
    return res.data
  },

  getProviderDetail: async (id: string): Promise<{ success: boolean; data: ProviderDetail }> => {
    const res = await api.get<{ success: boolean; data: ProviderDetail }>(`/v1/admin/providers/${id}`)
    return res.data
  },

  approveProvider: async (id: string): Promise<void> => {
    await api.post(`/v1/admin/providers/${id}/approve`)
  },

  rejectProvider: async (id: string, reason: string): Promise<void> => {
    await api.post(`/v1/admin/providers/${id}/reject`, { reason })
  },

  suspendProvider: async (id: string, reason: string): Promise<void> => {
    await api.post(`/v1/admin/providers/${id}/suspend`, { reason })
  },

  unsuspendProvider: async (id: string): Promise<void> => {
    await api.post(`/v1/admin/providers/${id}/unsuspend`)
  },

  listAllPaymentRequests: async (params?: {
    status?: PaymentRequestStatus
    page?: number
    limit?: number
  }): Promise<PaginatedResponse<AdminPaymentRequestItem>> => {
    const res = await api.get<PaginatedResponse<AdminPaymentRequestItem>>("/v1/admin/payment-requests", { params })
    return res.data
  },

  confirmPaymentRequest: async (id: string, notes?: string): Promise<void> => {
    await api.post(`/v1/admin/payment-requests/${id}/confirm`, { notes })
  },

  rejectPaymentRequest: async (id: string, reason: string): Promise<void> => {
    await api.post(`/v1/admin/payment-requests/${id}/reject`, { reason })
  },

  listSubscriptionPlans: async (): Promise<SubscriptionPlan[]> => {
    const res = await api.get<SubscriptionPlan[]>("/v1/admin/subscription-plans")
    return res.data
  },

  updateSubscriptionPlan: async (
    id: string,
    body: {
      branch_limit?: number
      ai_quota_per_month?: number
      channel_limit?: number
      price_per_month?: number
    },
  ): Promise<SubscriptionPlan> => {
    const res = await api.patch<SubscriptionPlan>(`/v1/admin/subscription-plans/${id}`, body)
    return res.data
  },
}
