import { useQuery } from "@tanstack/react-query"
import { adminDashboardApi } from "../api/admin-dashboard.api"

export function useAdminDashboard() {
  const query = useQuery({
    queryKey: ["admin-dashboard", "summary"],
    queryFn: () => adminDashboardApi.getSummary(),
    staleTime: 30000,
    // Tránh polling liên tục để tiết kiệm tài nguyên, cập nhật khi F5 hoặc chuyển màn
  })

  return {
    summary: query.data,
    isLoading: query.isLoading,
    isError: query.isError,
    refetch: query.refetch,
  }
}
export type UseAdminDashboardReturn = ReturnType<typeof useAdminDashboard>;
