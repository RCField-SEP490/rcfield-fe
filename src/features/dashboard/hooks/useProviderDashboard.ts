import { useQuery } from "@tanstack/react-query"
import { providerDashboardApi } from "../api/provider-dashboard.api"
import type { RevenuePeriod } from "../types/dashboard.types"

interface UseProviderDashboardParams {
  cafeId?: string | null
  period: RevenuePeriod
  from?: string
  to?: string
}

export function useProviderDashboard({ cafeId, period, from, to }: UseProviderDashboardParams) {
  const kpiQuery = useQuery({
    queryKey: ["provider-dashboard", "kpi", { cafeId, from, to }],
    queryFn: () => providerDashboardApi.getKpi({ from, to, cafeId }),
    staleTime: 15000,
  })

  const trendQuery = useQuery({
    queryKey: ["provider-dashboard", "trend", { period, cafeId, from, to }],
    queryFn: () => providerDashboardApi.getRevenueTrend({ period, from, to, cafeId }),
    staleTime: 15000,
  })

  const breakdownQuery = useQuery({
    queryKey: ["provider-dashboard", "breakdown", { cafeId, from, to }],
    queryFn: () => providerDashboardApi.getRevenueBreakdown({ from, to, cafeId }),
    staleTime: 15000,
  })

  const branchesQuery = useQuery({
    queryKey: ["provider-dashboard", "branches", { from, to }],
    queryFn: () => providerDashboardApi.getBranchPerformance({ from, to }),
    staleTime: 15000,
  })

  const recentQuery = useQuery({
    queryKey: ["provider-dashboard", "recent"],
    queryFn: () => providerDashboardApi.getRecentBookings({ limit: 8 }),
    staleTime: 10000,
  })

  return {
    kpi: kpiQuery.data,
    trend: trendQuery.data ?? [],
    breakdown: breakdownQuery.data ?? [],
    branches: branchesQuery.data ?? [],
    recent: recentQuery.data ?? [],
    isLoading:
      kpiQuery.isLoading ||
      trendQuery.isLoading ||
      breakdownQuery.isLoading ||
      branchesQuery.isLoading ||
      recentQuery.isLoading,
    refetch: () => {
      kpiQuery.refetch()
      trendQuery.refetch()
      breakdownQuery.refetch()
      branchesQuery.refetch()
      recentQuery.refetch()
    },
  }
}
export type UseProviderDashboardReturn = ReturnType<typeof useProviderDashboard>;
