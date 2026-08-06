import { useMemo, useState, type ReactNode } from "react"
import { useQuery } from "@tanstack/react-query"
import { AlertTriangle, Building2, Plus, TrendingUp } from "lucide-react"
import { useNavigate } from "react-router"

import { routePaths } from "@/app/router/route-paths"
import { providerDashboardApi } from "@/features/dashboard/api/provider-dashboard.api"
import { cafeApi, cafeQueryKeys } from "@/features/cafes/api/cafe.api"
import { BranchList, formatOccupancyRate, Panel, PanelTitle, ProviderPageHeader } from "@/pages/provider/components/ProviderPrimitives"
import { ProviderShell } from "@/pages/provider/components/ProviderShell"
import { cn } from "@/shared/lib/utils"
import { Button } from "@/shared/ui/button"

type Tone = "success" | "warning" | "danger" | "neutral"
type OccupancyPeriod = "last7Days" | "currentMonth"

function getLastSevenDaysRange(now = new Date()) {
  const from = new Date(now)
  from.setDate(from.getDate() - 7)
  return { from: from.toISOString(), to: now.toISOString() }
}

function formatHours(minutes: number) {
  return new Intl.NumberFormat("vi-VN", { maximumFractionDigits: 1 }).format(minutes / 60)
}

function CafeStatCard({ label, value, helper, detail, icon, tone }: { label: string; value: string; helper: string; detail?: string; icon: ReactNode; tone: Tone }) {
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
      {detail ? <p className="mt-1 text-[11px] font-medium text-[#747878]">{detail}</p> : null}
    </article>
  )
}

export function ProviderCafesPage() {
  const navigate = useNavigate()
  const listParams = { page: 1, limit: 100, scope: "managed" as const }
  const [occupancyPeriod, setOccupancyPeriod] = useState<OccupancyPeriod>("currentMonth")
  const operationQueryParams = useMemo(
    () => (occupancyPeriod === "last7Days" ? getLastSevenDaysRange() : {}),
    [occupancyPeriod],
  )
  const occupancyPeriodLabel = occupancyPeriod === "last7Days" ? "7 ngày gần nhất" : "tháng này"

  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: cafeQueryKeys.list(listParams),
    queryFn: async () => {
      const firstPage = await cafeApi.listCafes(listParams)
      const pageCount = Math.ceil(firstPage.meta.total / listParams.limit)
      if (pageCount <= 1) return firstPage

      const remainingPages = await Promise.all(
        Array.from({ length: pageCount - 1 }, (_, index) =>
          cafeApi.listCafes({ ...listParams, page: index + 2 }),
        ),
      )
      return {
        ...firstPage,
        data: [firstPage.data, ...remainingPages.map((page) => page.data)].flat(),
      }
    },
  })
  const {
    data: branchOperations = [],
    isLoading: isLoadingOperations,
    isError: isOperationsError,
  } = useQuery({
    queryKey: ["provider-dashboard", "branch-operations", occupancyPeriod, operationQueryParams],
    queryFn: () => providerDashboardApi.getBranchOperations(operationQueryParams),
    staleTime: 15_000,
  })
  const cafes = useMemo(() => data?.data ?? [], [data?.data])

  const activeCount = cafes.filter((c) => c.status === "ACTIVE").length
  const pendingCount = cafes.filter((c) => c.status === "PENDING").length
  const operationsByCafe = useMemo(
    () => new Map(branchOperations.map((operation) => [operation.cafeId, operation])),
    [branchOperations],
  )
  const sortedCafes = useMemo(
    () =>
      [...cafes].sort(
        (a, b) =>
          (operationsByCafe.get(b.id)?.totalRevenue ?? 0) -
            (operationsByCafe.get(a.id)?.totalRevenue ?? 0) ||
          a.name.localeCompare(b.name, "vi"),
      ),
    [cafes, operationsByCafe],
  )
  const totalBookableSlotMinutes = branchOperations.reduce(
    (total, operation) => total + operation.bookableSlotMinutes,
    0,
  )
  const totalOccupiedSlotMinutes = branchOperations.reduce(
    (total, operation) => total + operation.occupiedSlotMinutes,
    0,
  )
  const averageOccupancyRate =
    totalBookableSlotMinutes > 0
      ? Math.min(1, totalOccupiedSlotMinutes / totalBookableSlotMinutes)
      : null
  const maintenanceVehicleCount = branchOperations.reduce(
    (total, operation) => total + operation.maintenanceVehicles,
    0,
  )
  const overdueSessionCount = branchOperations.reduce(
    (total, operation) => total + operation.overdueSessionCount,
    0,
  )
  const suspendedCount = branchOperations.filter(
    (operation) => operation.cafeStatus === "SUSPENDED",
  ).length
  const operationalAlertCount = branchOperations.reduce(
    (total, operation) => total + operation.operationalAlertCount,
    0,
  )
  const cafesLoaded = !isLoading && !isError
  const operationsLoaded = !isLoadingOperations && !isOperationsError
  const occupancyValue =
    operationsLoaded && averageOccupancyRate !== null
      ? formatOccupancyRate(averageOccupancyRate)
      : "--"
  const totalBookingCount = branchOperations.reduce(
    (total, operation) => total + operation.bookingCount,
    0,
  )
  const occupancyHelper =
    totalBookingCount > 0
      ? `${totalBookingCount} lượt đặt · ${formatHours(totalOccupiedSlotMinutes)} giờ đã sử dụng`
      : `Chưa có lượt đặt trong ${occupancyPeriodLabel}`
  const alertHelper = [
    suspendedCount > 0 ? `${suspendedCount} cơ sở tạm ngưng` : null,
    maintenanceVehicleCount > 0 ? `${maintenanceVehicleCount} xe bảo trì` : null,
    overdueSessionCount > 0 ? `${overdueSessionCount} phiên quá giờ` : null,
  ]
    .filter(Boolean)
    .join(" · ")

  return (
    <ProviderShell>
      <ProviderPageHeader
        title="Quản lý cơ sở"
        description="Tạo, cập nhật và kiểm soát trạng thái các cơ sở xe RC thuộc provider của bạn."
        actions={
          <div className="flex rounded-lg border border-[#c4c7c8] bg-white p-1" aria-label="Khoảng thời gian tỷ lệ lấp đầy">
            <Button
              type="button"
              size="sm"
              variant="ghost"
              className={cn("h-8 rounded-md px-3 text-xs font-bold", occupancyPeriod === "last7Days" && "bg-[#1c1b1b] text-white hover:bg-[#313030] hover:text-white")}
              aria-pressed={occupancyPeriod === "last7Days"}
              onClick={() => setOccupancyPeriod("last7Days")}
            >
              7 ngày
            </Button>
            <Button
              type="button"
              size="sm"
              variant="ghost"
              className={cn("h-8 rounded-md px-3 text-xs font-bold", occupancyPeriod === "currentMonth" && "bg-[#1c1b1b] text-white hover:bg-[#313030] hover:text-white")}
              aria-pressed={occupancyPeriod === "currentMonth"}
              onClick={() => setOccupancyPeriod("currentMonth")}
            >
              Tháng này
            </Button>
          </div>
        }
      />

      <section className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <CafeStatCard
          label="Cơ sở hoạt động"
          value={cafesLoaded ? `${activeCount}/${cafes.length}` : "--"}
          helper={
            isLoading
              ? "Đang tải trạng thái cơ sở"
              : isError
                ? "Không thể tải trạng thái cơ sở"
                : cafes.length === 0
                  ? "Chưa có cơ sở"
                  : pendingCount > 0
                    ? `${pendingCount} cơ sở đang chờ duyệt`
                    : "Tất cả đã được kích hoạt"
          }
          icon={<Building2 />}
          tone={isError ? "danger" : "success"}
        />
        <CafeStatCard
          label="Tỷ lệ lấp đầy TB"
          value={occupancyValue}
          helper={
            isLoadingOperations
              ? "Đang tải dữ liệu vận hành"
              : isOperationsError
                ? "Không thể tải dữ liệu vận hành"
                : averageOccupancyRate === null
                  ? "Chưa có sức chứa slot khả dụng"
                  : occupancyHelper
          }
          detail={operationsLoaded && averageOccupancyRate !== null ? `Theo tổng sức chứa slot ${occupancyPeriodLabel}` : undefined}
          icon={<TrendingUp />}
          tone={isOperationsError ? "danger" : "neutral"}
        />
        <CafeStatCard
          label="Cảnh báo vận hành"
          value={operationsLoaded ? String(operationalAlertCount) : "--"}
          helper={
            isLoadingOperations
              ? "Đang tải cảnh báo vận hành"
              : isOperationsError
                ? "Không thể tải cảnh báo vận hành"
                : alertHelper || "Không có cảnh báo"
          }
          icon={<AlertTriangle />}
          tone={isOperationsError ? "danger" : operationalAlertCount > 0 ? "warning" : "success"}
        />
      </section>

      <Panel className="mt-4">
        <PanelTitle
          title="Danh sách cơ sở"
          subtitle={isOperationsError ? "Không thể tải số liệu vận hành để sắp xếp" : `Sắp xếp theo doanh thu ${occupancyPeriodLabel}`}
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
          <BranchList cafes={sortedCafes} operationsByCafe={operationsByCafe} />
        )}
      </Panel>
    </ProviderShell>
  )
}
