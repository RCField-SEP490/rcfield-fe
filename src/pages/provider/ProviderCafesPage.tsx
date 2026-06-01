import { useQuery } from "@tanstack/react-query"
import { AlertTriangle, Building2, CalendarClock, Plus, TrendingUp } from "lucide-react"
import { useNavigate } from "react-router"

import { routePaths } from "@/app/router/route-paths"
import { cafeApi, cafeQueryKeys } from "@/features/cafes/api/cafe.api"
import { BranchList, MetricCard, Panel, PanelTitle, ProviderPageHeader } from "@/pages/provider/components/ProviderPrimitives"
import { ProviderShell } from "@/pages/provider/components/ProviderShell"
import { Button } from "@/shared/ui/button"

export function ProviderCafesPage() {
  const navigate = useNavigate()
  const listParams = { page: 1, limit: 100, scope: "managed" as const }

  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: cafeQueryKeys.list(listParams),
    queryFn: () => cafeApi.listCafes(listParams),
  })
  const cafes = data?.data ?? []
  const activeCount = cafes.filter((cafe) => cafe.status === "ACTIVE").length
  const pendingCount = cafes.filter((cafe) => cafe.status === "PENDING").length
  const suspendedCount = cafes.filter((cafe) => cafe.status === "SUSPENDED").length

  return (
    <ProviderShell>
      <ProviderPageHeader
        title="Quản lý cơ sở"
        description="Tạo, cập nhật và kiểm soát trạng thái các cơ sở xe RC thuộc provider của bạn."
      />
      <section className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <MetricCard label="Cơ sở hoạt động" value={`${activeCount}/${cafes.length}`} helper={`${pendingCount} chờ duyệt`} icon={<Building2 />} tone="success" />
        <MetricCard label="Tỷ lệ lấp đầy TB" value="--" helper="Chưa có API vận hành" icon={<TrendingUp />} tone="neutral" />
        <MetricCard label="Cảnh báo vận hành" value={`${suspendedCount}`} helper="Cơ sở đang tạm ngưng" icon={<AlertTriangle />} tone={suspendedCount > 0 ? "warning" : "success"} />
      </section>
      <Panel className="mt-4">
        <PanelTitle
          title="Danh sách cơ sở"
          subtitle="Sắp xếp theo doanh thu tháng hiện tại"
          action={
            <div className="flex flex-wrap items-center justify-end gap-3">
              <Button variant="outline" className="h-10 gap-2 rounded-lg border-[#c4c7c8] bg-[#f1edec] text-[#1c1b1b] hover:bg-[#e5e2e1]">
                <CalendarClock className="size-5" />
                Tháng này
              </Button>
              <Button type="button" onClick={() => navigate(routePaths.providerCafeCreate)} className="h-10 gap-2 rounded-lg bg-[#1c1b1b] text-white hover:bg-[#313030]">
                <Plus className="size-5" />
                Thêm cơ sở
              </Button>
            </div>
          }
        />
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
