import type { ReactNode } from "react"
import { useQuery } from "@tanstack/react-query"
import { AlertTriangle, Building2, Plus, TrendingUp } from "lucide-react"
import { useNavigate } from "react-router"

import { routePaths } from "@/app/router/route-paths"
import { providerDashboardApi } from "@/features/dashboard/api/provider-dashboard.api"
import { cafeApi, cafeQueryKeys } from "@/features/cafes/api/cafe.api"
import { BranchList, Panel, PanelTitle, ProviderPageHeader } from "@/pages/provider/components/ProviderPrimitives"
import { ProviderShell } from "@/pages/provider/components/ProviderShell"
import { cn } from "@/shared/lib/utils"
import { Button } from "@/shared/ui/button"

type Tone = "success" | "warning" | "danger" | "neutral"

function CafeStatCard({ label, value, helper, icon, tone }: { label: string; value: string; helper: string; icon: ReactNode; tone: Tone }) {
  const iconCls = {
    success: "bg-[#f6f3f2] text-[#1c1b1b]",
    warning: "bg-amber-50 text-amber-600",
    danger:  "bg-red-50 text-red-600",
    neutral: "bg-[#f6f3f2] text-[#747878]",
  }[tone]
  const helperCls = { success: "text-[#747878]", warning: "text-amber-600", danger: "text-red-600", neutral: "text-[#747878]" }[tone]

  return (
    <article className="rounded-xl border border-[#c4c7c8] bg-white p-5 shadow-sm">
      <div className="flex items-start justify-between gap-3">
        <p className="text-[11px] font-bold uppercase tracking-wider text-[#747878]">{label}</p>
        <span className={cn("flex size-8 shrink-0 items-center justify-center rounded-lg [&>svg]:size-4", iconCls)}>{icon}</span>
      </div>
      <p className="mt-3 text-[26px] font-extrabold leading-none tracking-tight text-[#1c1b1b]">{value}</p>
      <p className={cn("mt-2 text-xs font-semibold", helperCls)}>{helper}</p>
    </article>
  )
}

export function ProviderCafesPage() {
  const navigate = useNavigate()
  const listParams = { page: 1, limit: 100, scope: "managed" as const }

  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: cafeQueryKeys.list(listParams),
    queryFn: () => cafeApi.listCafes(listParams),
  })
  const cafes = data?.data ?? []

  const { data: kpi } = useQuery({
    queryKey: ["provider-dashboard-kpi", null],
    queryFn: () => providerDashboardApi.getKpi({}),
  })
  const activeCount = cafes.filter((c) => c.status === "ACTIVE").length
  const pendingCount = cafes.filter((c) => c.status === "PENDING").length
  const suspendedCount = cafes.filter((c) => c.status === "SUSPENDED").length

  return (
    <ProviderShell>
      <ProviderPageHeader
        title="Quản lý cơ sở"
        description="Tạo, cập nhật và kiểm soát trạng thái các cơ sở xe RC thuộc provider của bạn."
      />

      <section className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <CafeStatCard
          label="Cơ sở hoạt động"
          value={`${activeCount}/${cafes.length}`}
          helper={pendingCount > 0 ? `${pendingCount} cơ sở đang chờ duyệt` : "Tất cả đã được kích hoạt"}
          icon={<Building2 />}
          tone="success"
        />
        <CafeStatCard
          label="Tỷ lệ hoàn thành đơn TB"
          value={kpi ? `${kpi.totalBookings > 0 ? ((kpi.completedBookings / kpi.totalBookings) * 100).toFixed(0) : 0}%` : "--"}
          helper={kpi ? `${kpi.completedBookings}/${kpi.totalBookings} lượt hoàn tất` : "Đang tải..."}
          icon={<TrendingUp />}
          tone="neutral"
        />
        <CafeStatCard
          label="Cảnh báo vận hành"
          value={String(suspendedCount)}
          helper={suspendedCount > 0 ? `${suspendedCount} cơ sở tạm ngưng` : "Không có cảnh báo"}
          icon={<AlertTriangle />}
          tone={suspendedCount > 0 ? "warning" : "success"}
        />
      </section>

      <Panel className="mt-4">
        <PanelTitle
          title="Danh sách cơ sở"
          subtitle="Sắp xếp theo doanh thu tháng hiện tại"
          action={
            <Button
              type="button"
              onClick={() => navigate(routePaths.providerCafeCreate)}
              className="h-9 gap-2 rounded-lg bg-[#1c1b1b] px-4 text-sm text-white hover:bg-[#313030] font-bold"
            >
              <Plus className="size-4" />
              Thêm cơ sở
            </Button>
          }
        />
        {isLoading ? (
          <div className="space-y-3">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="h-[72px] animate-pulse rounded-xl bg-[#f6f3f2]" />
            ))}
          </div>
        ) : isError ? (
          <div className="flex flex-col items-center gap-3 py-8 text-center">
            <AlertTriangle className="size-8 text-[#c4c7c8]" />
            <p className="text-sm font-medium text-[#747878]">Không thể tải danh sách cơ sở</p>
            <button
              type="button"
              onClick={() => void refetch()}
              className="rounded-lg border border-[#c4c7c8] px-4 py-2 text-sm font-bold text-[#1c1b1b] hover:bg-[#f6f3f2] transition-colors"
            >
              Thử lại
            </button>
          </div>
        ) : (
          <BranchList cafes={cafes} />
        )}
      </Panel>
    </ProviderShell>
  )
}
