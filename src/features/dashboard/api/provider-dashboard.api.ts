import { api } from "@/shared/lib/axios"
import type {
  ProviderKpi,
  RevenueTrendItem,
  RevenueBreakdownItem,
  BranchPerformanceItem,
  RecentBookingItem,
  RevenuePeriod,
} from "../types/dashboard.types"

export const providerDashboardApi = {
  getKpi: async (params: { from?: string; to?: string; cafeId?: string | null }): Promise<ProviderKpi> => {
    const res = await api.get<{ success: boolean; data: ProviderKpi }>("/v1/provider/dashboard/kpi", {
      params: {
        from: params.from || undefined,
        to: params.to || undefined,
        cafeId: params.cafeId || undefined,
      },
    })
    return res.data.data
  },

  getRevenueTrend: async (params: {
    period: RevenuePeriod
    from?: string
    to?: string
    cafeId?: string | null
  }): Promise<RevenueTrendItem[]> => {
    const res = await api.get<{ success: boolean; data: RevenueTrendItem[] }>("/v1/provider/dashboard/revenue-trend", {
      params: {
        period: params.period,
        from: params.from || undefined,
        to: params.to || undefined,
        cafeId: params.cafeId || undefined,
      },
    })
    return res.data.data
  },

  getRevenueBreakdown: async (params: {
    from?: string
    to?: string
    cafeId?: string | null
  }): Promise<RevenueBreakdownItem[]> => {
    const res = await api.get<{ success: boolean; data: RevenueBreakdownItem[] }>("/v1/provider/dashboard/revenue-breakdown", {
      params: {
        from: params.from || undefined,
        to: params.to || undefined,
        cafeId: params.cafeId || undefined,
      },
    })
    return res.data.data
  },

  getBranchPerformance: async (params: { from?: string; to?: string }): Promise<BranchPerformanceItem[]> => {
    const res = await api.get<{ success: boolean; data: BranchPerformanceItem[] }>("/v1/provider/dashboard/branch-performance", {
      params: {
        from: params.from || undefined,
        to: params.to || undefined,
      },
    })
    return res.data.data
  },

  getRecentBookings: async (params: { limit?: number }): Promise<RecentBookingItem[]> => {
    const res = await api.get<{ success: boolean; data: RecentBookingItem[] }>("/v1/provider/dashboard/recent-bookings", {
      params: {
        limit: params.limit || undefined,
      },
    })
    return res.data.data
  },
}
