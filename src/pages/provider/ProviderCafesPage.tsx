import { useQuery } from "@tanstack/react-query"
import { AlertTriangle, Building2, Plus, TrendingUp } from "lucide-react"

import { cafeApi, cafeQueryKeys } from "@/features/cafes/api/cafe.api"
import { BranchList, MetricCard, Panel, PanelTitle, ProviderHeader } from "@/pages/provider/components/ProviderPrimitives"
import { ProviderShell } from "@/pages/provider/components/ProviderShell"

export function ProviderCafesPage() {
  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: cafeQueryKeys.list({ page: 1, limit: 100 }),
    queryFn: () => cafeApi.listCafes({ page: 1, limit: 100 }),
  })
  const cafes = data?.data ?? []
  const activeCount = cafes.filter((cafe) => cafe.status === "ACTIVE").length
  const pendingCount = cafes.filter((cafe) => cafe.status === "PENDING").length
  const suspendedCount = cafes.filter((cafe) => cafe.status === "SUSPENDED").length

  return (
    <ProviderShell>
      <ProviderHeader title="Quản lý cơ sở" description="Theo dõi trạng thái vận hành, doanh thu và tỷ lệ lấp đầy từng chi nhánh." actionLabel="Thêm cơ sở" actionIcon={<Plus className="size-5" />} />
      <section className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <MetricCard label="Cơ sở hoạt động" value={`${activeCount}/${cafes.length}`} helper={`${pendingCount} chờ duyệt`} icon={<Building2 />} tone="success" />
        <MetricCard label="Tỷ lệ lấp đầy TB" value="--" helper="Chưa có API vận hành" icon={<TrendingUp />} tone="neutral" />
        <MetricCard label="Cảnh báo vận hành" value={`${suspendedCount}`} helper="Cơ sở đang tạm ngưng" icon={<AlertTriangle />} tone={suspendedCount > 0 ? "warning" : "success"} />
      </section>
      <Panel className="mt-4">
        <PanelTitle title="Danh sách cơ sở" subtitle="Sắp xếp theo doanh thu tháng hiện tại" />
        {isLoading ? (
          <div className="space-y-3">
            {Array.from({ length: 3 }).map((_, index) => (
              <div key={index} className="h-32 animate-pulse rounded-lg bg-[#f6f3f2]" />
            ))}
          </div>
        ) : isError ? (
          <button type="button" onClick={() => void refetch()} className="rounded-lg border border-[#c4c7c8] px-4 py-2 text-sm font-semibold text-[#1c1b1b]">
            Tải lại danh sách cơ sở
          </button>
        ) : (
          <BranchList cafes={cafes} />
        )}
      </Panel>
    </ProviderShell>
  )
}
