import { Link } from "react-router"
import { useState, useEffect, useCallback, useMemo } from "react"
import type { ReactNode } from "react"
import {
  ArrowRight,
  BarChart3,
  Car,
  CheckCircle2,
  ClipboardList,
  Download,
  PlayCircle,
  Users,
  Wrench,
  Building2,
  Clock,
  Sparkles,
  PartyPopper,
  TrendingUp,
  TrendingDown,
  CalendarRange,
} from "lucide-react"
import {
  AreaChart,
  Area,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts"
import { useQuery } from "@tanstack/react-query"

import { routePaths } from "@/app/router/route-paths"
import { ProviderPageHeader } from "@/pages/provider/components/ProviderPrimitives"
import { ProviderShell } from "@/pages/provider/components/ProviderShell"
import type { ProviderTone } from "@/pages/provider/data"
import { tonePill } from "@/pages/provider/components/ProviderPrimitives"
import { cn } from "@/shared/lib/utils"
import { Button } from "@/shared/ui/button"
import { toast } from "sonner"
import { useProviderDashboard } from "@/features/dashboard/hooks/useProviderDashboard"
import { cafeApi } from "@/features/cafes/api/cafe.api"
import { vehicleApi } from "@/features/vehicles/api/vehicle.api"
import type { RevenuePeriod } from "@/features/dashboard/types/dashboard.types"

export function ProviderDashboardPage() {
  const [onboardingCompleted, setOnboardingCompleted] = useState(() => {
    return localStorage.getItem("onboarding_completed") === "true"
  })

  const [viewSetup, setViewSetup] = useState(() => {
    return localStorage.getItem("view_setup") === "true"
  })

  // Lấy dữ liệu danh sách chi nhánh của Provider để check onboarding thật
  const { data: cafesData, isLoading: isLoadingCafes } = useQuery({
    queryKey: ["provider-cafes-list-onboarding"],
    queryFn: () => cafeApi.listCafes({ scope: "managed" } as any),
    staleTime: 30000,
  })
  const cafes = cafesData?.data ?? []

  // Check các bước onboarding dựa trên dữ liệu thật
  const branchesCreated = cafes.length > 0
  const operationalHoursSet = cafes.some(
    (c) => c.operatingHours && Object.keys(c.operatingHours).length > 0
  )

  const firstCafeId = cafes[0]?.id
  const { data: vehiclesData, isLoading: isLoadingVehicles } = useQuery({
    queryKey: ["provider-vehicles-list-onboarding", firstCafeId],
    queryFn: () => (firstCafeId ? vehicleApi.listUnits(firstCafeId) : Promise.resolve([])),
    enabled: !!firstCafeId,
    staleTime: 30000,
  })
  const vehiclesAdded = (vehiclesData ?? []).length > 0

  const steps = {
    branchesCreated,
    vehiclesAdded,
    operationalHoursSet,
  }

  const completedCount = Object.values(steps).filter(Boolean).length
  const allStepsCompleted = completedCount === 3

  // Tự động kích hoạt dashboard khi người dùng hoàn thành 3 bước thật sự trên DB
  // nhưng chỉ tự động khi họ không ở chế độ chủ động xem lại setup
  useEffect(() => {
    if (allStepsCompleted && !onboardingCompleted && !viewSetup) {
      localStorage.setItem("onboarding_completed", "true")
      setOnboardingCompleted(true)
      toast.success("Chúc mừng! Bạn đã hoàn thành tất cả các bước thiết lập cơ bản. Kích hoạt Dashboard thành công!")
    }
  }, [allStepsCompleted, onboardingCompleted, viewSetup])

  const handleCompleteAll = () => {
    if (allStepsCompleted) {
      localStorage.setItem("onboarding_completed", "true")
      localStorage.removeItem("view_setup")
      setOnboardingCompleted(true)
      setViewSetup(false)
      toast.success("Chào mừng bạn đến với Dashboard quản trị!")
    } else {
      toast.error("Bạn cần hoàn thành cả 3 bước thiết lập cơ bản (Tạo chi nhánh, đăng ký xe và giờ hoạt động) để vào Dashboard.")
    }
  }

  const handleResetOnboarding = () => {
    localStorage.setItem("onboarding_completed", "false")
    localStorage.setItem("view_setup", "true")
    setOnboardingCompleted(false)
    setViewSetup(true)
    toast.info("Đang hiển thị lại hướng dẫn thiết lập cơ bản.")
  }

  const isLoadingOnboarding = isLoadingCafes || (branchesCreated && isLoadingVehicles)

  if (isLoadingOnboarding) {
    return (
      <ProviderShell>
        <div className="flex h-[60vh] items-center justify-center">
          <div className="text-center space-y-3">
            <div className="size-8 rounded-full border-4 border-orange-500 border-t-transparent animate-spin mx-auto" />
            <p className="text-sm font-bold text-slate-500">Đang kiểm tra trạng thái thiết lập...</p>
          </div>
        </div>
      </ProviderShell>
    )
  }

  const showOnboarding = !allStepsCompleted || viewSetup || !onboardingCompleted

  if (showOnboarding) {
    return (
      <ProviderShell>
        <div className="mb-6">
          <h2 className="text-3xl font-extrabold text-slate-900 tracking-tight">Thiết lập tài khoản</h2>
          <p className="text-xs font-semibold text-slate-500 mt-1">Hoàn thành các bước hướng dẫn dưới đây để kích hoạt đầy đủ tính năng</p>
        </div>

        <OnboardingChecklist
          steps={steps}
          onCompleteAll={handleCompleteAll}
        />
      </ProviderShell>
    )
  }

  return (
    <RealDashboard onResetOnboarding={handleResetOnboarding} />
  )
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function formatCurrency(amount: number): string {
  if (amount >= 1_000_000_000) return `${(amount / 1_000_000_000).toFixed(1)}T ₫`
  if (amount >= 1_000_000) return `${(amount / 1_000_000).toFixed(1)}M ₫`
  if (amount >= 1_000) return `${(amount / 1_000).toFixed(0)}K ₫`
  return `${amount.toLocaleString("vi-VN")} ₫`
}

function getDefaultDateRange(period: RevenuePeriod): { from: string; to: string } {
  const to = new Date()
  const from = new Date()
  
  // Thiết lập thời gian cố định trong ngày để tránh thay đổi mili giây kích hoạt API liên tục
  to.setHours(23, 59, 59, 999)
  
  if (period === "daily") {
    from.setDate(from.getDate() - 14)
  } else if (period === "weekly") {
    from.setDate(from.getDate() - 84)
  } else {
    from.setMonth(from.getMonth() - 12)
  }
  from.setHours(0, 0, 0, 0)
  
  return { from: from.toISOString(), to: to.toISOString() }
}

const CHART_COLORS = {
  slotFee: "#ea580c",
  rentalFee: "#3b82f6",
  securityDeposit: "#8b5cf6",
  fnbPreorder: "#10b981",
}

const PIE_COLORS = ["#ea580c", "#3b82f6", "#8b5cf6", "#10b981", "#f59e0b", "#ef4444"]

// ── KPI Card ─────────────────────────────────────────────────────────────────

function KpiCard({
  label,
  value,
  sub,
  icon,
  trend,
  trendText,
  accentColor = "orange",
}: {
  label: string
  value: string
  sub?: string
  icon: React.ReactNode
  trend?: "up" | "down" | "neutral"
  trendText?: string
  accentColor?: string
}) {
  const trendIcon =
    trend === "up" ? (
      <TrendingUp className="size-3.5 text-emerald-600" />
    ) : trend === "down" ? (
      <TrendingDown className="size-3.5 text-red-500" />
    ) : null
  const trendColor = trend === "up" ? "text-emerald-600" : trend === "down" ? "text-red-500" : "text-slate-500"

  return (
    <div className="group relative overflow-hidden rounded-xl border border-[#e5e2e1] bg-white p-5 shadow-sm transition-all hover:shadow-md hover:-translate-y-0.5">
      <div
        className="absolute top-0 right-0 size-24 rounded-full opacity-5 blur-2xl"
        style={{ background: accentColor === "orange" ? "#ea580c" : accentColor === "blue" ? "#3b82f6" : "#8b5cf6" }}
      />
      <div className="mb-3 flex items-center justify-between">
        <span className="text-xs font-bold uppercase tracking-wider text-[#747878]">{label}</span>
        <div
          className={cn(
            "flex size-8 items-center justify-center rounded-lg [&_svg]:size-4",
            accentColor === "orange"
              ? "bg-orange-50 text-orange-600"
              : accentColor === "blue"
                ? "bg-blue-50 text-blue-600"
                : accentColor === "purple"
                  ? "bg-purple-50 text-purple-600"
                  : "bg-emerald-50 text-emerald-600"
          )}
        >
          {icon}
        </div>
      </div>
      <div className="text-2xl font-extrabold tracking-tight text-[#1c1b1b]">{value}</div>
      {sub && <p className="mt-0.5 text-xs text-[#747878] font-medium">{sub}</p>}
      {trendText && (
        <div className="mt-2 flex items-center gap-1">
          {trendIcon}
          <span className={cn("text-xs font-semibold", trendColor)}>{trendText}</span>
        </div>
      )}
    </div>
  )
}

function SkeletonCard() {
  return (
    <div className="rounded-xl border border-[#e5e2e1] bg-white p-5 shadow-sm animate-pulse">
      <div className="mb-3 h-4 w-24 rounded bg-slate-100" />
      <div className="h-8 w-32 rounded bg-slate-100" />
      <div className="mt-2 h-3 w-20 rounded bg-slate-100" />
    </div>
  )
}

function BookingStatusBadge({ status }: { status: string }) {
  const map: Record<string, { label: string; cls: string }> = {
    CONFIRMED: { label: "Đã xác nhận", cls: "bg-blue-50 text-blue-700 border-blue-200" },
    COMPLETED: { label: "Hoàn thành", cls: "bg-emerald-50 text-emerald-700 border-emerald-200" },
    CANCELLED: { label: "Đã hủy", cls: "bg-red-50 text-red-700 border-red-200" },
    PENDING: { label: "Chờ TT", cls: "bg-amber-50 text-amber-700 border-amber-200" },
    NO_SHOW: { label: "Vắng mặt", cls: "bg-slate-50 text-slate-600 border-slate-200" },
  }
  const { label, cls } = map[status] ?? { label: status, cls: "bg-slate-50 text-slate-500 border-slate-200" }
  return <span className={cn("inline-flex items-center rounded-full border px-2 py-0.5 text-xs font-bold", cls)}>{label}</span>
}

function FleetStatusItem({
  label,
  value,
  icon,
  color,
}: {
  label: string
  value: number
  icon: React.ReactNode
  color: "emerald" | "blue" | "red"
}) {
  const colorMap = {
    emerald: "bg-emerald-50 text-emerald-700 border-emerald-100",
    blue: "bg-blue-50 text-blue-700 border-blue-100",
    red: "bg-red-50 text-red-700 border-red-100",
  }
  return (
    <div className={cn("flex items-center justify-between rounded-lg border p-3", colorMap[color])}>
      <div className="flex items-center gap-2.5">
        {icon}
        <span className="text-xs font-bold">{label}</span>
      </div>
      <span className="text-xl font-extrabold">{value}</span>
    </div>
  )
}

// ── Real Dashboard (hiển thị sau onboarding) ─────────────────────────────────

function RealDashboard({ onResetOnboarding }: { onResetOnboarding: () => void }) {
  const [period, setPeriod] = useState<RevenuePeriod>("daily")
  const [selectedCafeId, setSelectedCafeId] = useState<string | null>(null)
  const [customFrom, setCustomFrom] = useState("")
  const [customTo, setCustomTo] = useState("")
  const [hoveredSeries, setHoveredSeries] = useState<string | null>(null)
  const [hoveredPieType, setHoveredPieType] = useState<string | null>(null)

  // Sử dụng useMemo để tránh tính toán lại và thay đổi tham chiếu object ở mỗi lần render
  const defaultRange = useMemo(() => getDefaultDateRange(period), [period])
  const from = customFrom || defaultRange.from
  const to = customTo || defaultRange.to

  const { data: cafesData } = useQuery({
    queryKey: ["provider-cafes-list"],
    queryFn: () => cafeApi.listCafes({ scope: "managed" } as any),
    staleTime: 300_000,
  })
  const cafes = cafesData?.data ?? []

  const { kpi, trend, breakdown, branches, recent, isLoading } = useProviderDashboard({
    cafeId: selectedCafeId,
    period,
    from,
    to,
  })

  const handlePeriodChange = useCallback((p: RevenuePeriod) => {
    setPeriod(p)
    setCustomFrom("")
    setCustomTo("")
  }, [])

  return (
    <ProviderShell>
      <ProviderPageHeader
        title="Tổng quan hệ thống"
        description={`Dữ liệu cập nhật hôm nay, ${new Date().toLocaleDateString("vi-VN", { day: "numeric", month: "long", year: "numeric" })}`}
      />

      {/* Thanh bộ lọc */}
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <Building2 className="size-4 text-[#747878]" />
          <select
            value={selectedCafeId ?? ""}
            onChange={(e) => setSelectedCafeId(e.target.value || null)}
            className="rounded-lg border border-[#c4c7c8] bg-white px-3 py-1.5 text-sm font-semibold text-[#1c1b1b] focus:border-orange-400 focus:outline-none"
          >
            <option value="">Tất cả chi nhánh</option>
            {cafes.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <div className="flex rounded-lg border border-[#c4c7c8] bg-[#f1edec] p-0.5">
            {(["daily", "weekly", "monthly"] as RevenuePeriod[]).map((p) => (
              <button
                key={p}
                onClick={() => handlePeriodChange(p)}
                className={cn(
                  "rounded-md px-3 py-1.5 text-xs font-bold transition-all",
                  period === p && !customFrom ? "bg-white text-[#1c1b1b] shadow-sm" : "text-[#5d5f5f] hover:text-[#1c1b1b]"
                )}
              >
                {p === "daily" ? "14 ngày" : p === "weekly" ? "12 tuần" : "12 tháng"}
              </button>
            ))}
          </div>

          <div className="flex items-center gap-1.5 rounded-lg border border-[#c4c7c8] bg-white px-3 py-1">
            <CalendarRange className="size-3.5 text-[#747878]" />
            <input
              type="date"
              value={customFrom ? customFrom.substring(0, 10) : ""}
              onChange={(e) => setCustomFrom(e.target.value ? new Date(e.target.value).toISOString() : "")}
              className="text-xs font-semibold text-[#1c1b1b] focus:outline-none"
            />
            <span className="text-xs text-[#747878]">–</span>
            <input
              type="date"
              value={customTo ? customTo.substring(0, 10) : ""}
              onChange={(e) => setCustomTo(e.target.value ? new Date(e.target.value + "T23:59:59").toISOString() : "")}
              className="text-xs font-semibold text-[#1c1b1b] focus:outline-none"
            />
          </div>

          <Button
            variant="outline"
            onClick={onResetOnboarding}
            className="h-9 gap-1.5 rounded-lg border-orange-200 bg-orange-50/30 text-orange-700 hover:bg-orange-100/60 text-xs font-bold"
          >
            Xem Setup
          </Button>
          <Button variant="outline" className="h-9 gap-1.5 rounded-lg border-[#c4c7c8] text-xs font-bold">
            <Download className="size-3.5" />
            Xuất báo cáo
          </Button>
        </div>
      </div>

      {/* KPI Cards */}
      <section className="grid grid-cols-2 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {isLoading ? (
          Array.from({ length: 4 }).map((_, i) => <SkeletonCard key={i} />)
        ) : (
          <>
            <KpiCard
              label="Tổng doanh thu"
              value={kpi ? formatCurrency(kpi.totalRevenue) : "—"}
              sub="HELD & đã giải ngân"
              icon={<BarChart3 />}
              accentColor="orange"
              trend={kpi && kpi.totalRevenue > 0 ? "up" : "neutral"}
              trendText={kpi ? `${kpi.completedBookings} booking hoàn thành` : ""}
            />
            <KpiCard
              label="Tổng lượt đặt"
              value={kpi ? kpi.totalBookings.toLocaleString("vi-VN") : "—"}
              sub="Tất cả trạng thái"
              icon={<ClipboardList />}
              accentColor="blue"
              trend={kpi && kpi.cancellationRate < 0.1 ? "up" : "down"}
              trendText={kpi ? `${(kpi.cancellationRate * 100).toFixed(1)}% tỷ lệ hủy` : ""}
            />
            <KpiCard
              label="Tỷ lệ xe hoạt động"
              value={kpi ? `${(kpi.vehicleUtilizationRate * 100).toFixed(0)}%` : "—"}
              sub={kpi ? `${kpi.inUseVehicles}/${kpi.totalVehicles} xe` : ""}
              icon={<Car />}
              accentColor="purple"
              trend={kpi && kpi.vehicleUtilizationRate > 0.7 ? "up" : "down"}
              trendText={kpi ? `${kpi.maintenanceVehicles} xe bảo trì` : ""}
            />
            <KpiCard
              label="Khách hàng mới"
              value={kpi ? kpi.newCustomers.toLocaleString("vi-VN") : "—"}
              sub="Lần đầu đặt trong kỳ"
              icon={<Users />}
              accentColor="green"
              trend={kpi && kpi.newCustomers > 0 ? "up" : "neutral"}
              trendText=""
            />
          </>
        )}
      </section>

      {/* Charts row 1: Area + Pie */}
      <section className="mt-5 grid grid-cols-1 gap-5 xl:grid-cols-12">
        <div className="rounded-xl border border-[#e5e2e1] bg-white p-5 shadow-sm xl:col-span-8">
          <div className="mb-4">
            <h3 className="text-sm font-extrabold text-[#1c1b1b]">Xu hướng doanh thu</h3>
            <p className="text-xs text-[#747878] mt-0.5">Phân tích theo loại — phí sân, thuê xe, F&B</p>
          </div>
          {trend.length === 0 && !isLoading ? (
            <div className="flex h-56 items-center justify-center text-sm text-[#747878]">Chưa có dữ liệu trong kỳ này</div>
          ) : (
            <div className="h-56 w-full text-xs">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={trend} margin={{ top: 5, right: 5, left: -15, bottom: 0 }}>
                  <defs>
                    {Object.entries(CHART_COLORS).map(([key, color]) => (
                      <linearGradient key={key} id={`db-grad-${key}`} x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor={color} stopOpacity={0.2} />
                        <stop offset="95%" stopColor={color} stopOpacity={0.02} />
                      </linearGradient>
                    ))}
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0ede9" vertical={false} />
                  <XAxis dataKey="label" stroke="#b0b4b4" tickLine={false} axisLine={false} tick={{ fontSize: 10 }} />
                  <YAxis
                    stroke="#b0b4b4"
                    tickLine={false}
                    axisLine={false}
                    tickFormatter={(v) => formatCurrency(v)}
                    tick={{ fontSize: 10 }}
                  />
                  <Tooltip
                    formatter={(v: number, n: string) => [formatCurrency(v), n]}
                    contentStyle={{ borderRadius: "10px", border: "1px solid #e5e2e1", fontSize: 12 }}
                  />
                  <Legend
                    wrapperStyle={{ fontSize: 11, paddingTop: 8 }}
                    onMouseEnter={(o: any) => setHoveredSeries(o.dataKey)}
                    onMouseLeave={() => setHoveredSeries(null)}
                  />
                  <Area
                    type="monotone"
                    dataKey="slotFee"
                    name="Phí sân"
                    stackId="1"
                    stroke={CHART_COLORS.slotFee}
                    fill="url(#db-grad-slotFee)"
                    strokeWidth={hoveredSeries === "slotFee" ? 3.5 : 2}
                    strokeOpacity={hoveredSeries === null || hoveredSeries === "slotFee" ? 1 : 0.15}
                    fillOpacity={hoveredSeries === null || hoveredSeries === "slotFee" ? 1 : 0.15}
                    onMouseEnter={() => setHoveredSeries("slotFee")}
                    onMouseLeave={() => setHoveredSeries(null)}
                  />
                  <Area
                    type="monotone"
                    dataKey="rentalFee"
                    name="Thuê xe"
                    stackId="1"
                    stroke={CHART_COLORS.rentalFee}
                    fill="url(#db-grad-rentalFee)"
                    strokeWidth={hoveredSeries === "rentalFee" ? 3.5 : 2}
                    strokeOpacity={hoveredSeries === null || hoveredSeries === "rentalFee" ? 1 : 0.15}
                    fillOpacity={hoveredSeries === null || hoveredSeries === "rentalFee" ? 1 : 0.15}
                    onMouseEnter={() => setHoveredSeries("rentalFee")}
                    onMouseLeave={() => setHoveredSeries(null)}
                  />
                  <Area
                    type="monotone"
                    dataKey="fnbPreorder"
                    name="F&B"
                    stackId="1"
                    stroke={CHART_COLORS.fnbPreorder}
                    fill="url(#db-grad-fnbPreorder)"
                    strokeWidth={hoveredSeries === "fnbPreorder" ? 3.5 : 2}
                    strokeOpacity={hoveredSeries === null || hoveredSeries === "fnbPreorder" ? 1 : 0.15}
                    fillOpacity={hoveredSeries === null || hoveredSeries === "fnbPreorder" ? 1 : 0.15}
                    onMouseEnter={() => setHoveredSeries("fnbPreorder")}
                    onMouseLeave={() => setHoveredSeries(null)}
                  />
                  <Area
                    type="monotone"
                    dataKey="securityDeposit"
                    name="Đặt cọc"
                    stackId="1"
                    stroke={CHART_COLORS.securityDeposit}
                    fill="url(#db-grad-securityDeposit)"
                    strokeWidth={hoveredSeries === "securityDeposit" ? 3.5 : 2}
                    strokeOpacity={hoveredSeries === null || hoveredSeries === "securityDeposit" ? 1 : 0.15}
                    fillOpacity={hoveredSeries === null || hoveredSeries === "securityDeposit" ? 1 : 0.15}
                    onMouseEnter={() => setHoveredSeries("securityDeposit")}
                    onMouseLeave={() => setHoveredSeries(null)}
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>

        <div className="rounded-xl border border-[#e5e2e1] bg-white p-5 shadow-sm xl:col-span-4">
          <div className="mb-4">
            <h3 className="text-sm font-extrabold text-[#1c1b1b]">Phân bổ doanh thu</h3>
            <p className="text-xs text-[#747878] mt-0.5">Tỷ trọng từng nguồn thu</p>
          </div>
          {breakdown.length === 0 && !isLoading ? (
            <div className="flex h-40 items-center justify-center text-sm text-[#747878]">Chưa có dữ liệu</div>
          ) : (
            <div className="h-40 w-full text-xs">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={breakdown}
                    cx="50%"
                    cy="50%"
                    innerRadius={40}
                    outerRadius={60}
                    paddingAngle={3}
                    dataKey="amount"
                    nameKey="label"
                    onMouseEnter={(_, index) => {
                      setHoveredPieType(breakdown[index]?.type || null)
                    }}
                    onMouseLeave={() => setHoveredPieType(null)}
                  >
                    {breakdown.map((item, i) => (
                      <Cell
                        key={i}
                        fill={PIE_COLORS[i % PIE_COLORS.length]}
                        opacity={hoveredPieType === null || hoveredPieType === item.type ? 1 : 0.15}
                        style={{ cursor: "pointer", transition: "opacity 0.2s ease" }}
                      />
                    ))}
                  </Pie>
                  <Tooltip
                    formatter={(v: number) => formatCurrency(v)}
                    contentStyle={{ borderRadius: "10px", border: "1px solid #e5e2e1", fontSize: 12 }}
                  />
                  <Legend
                    wrapperStyle={{ fontSize: 10 }}
                    onMouseEnter={(o: any) => {
                      const match = breakdown.find((item) => item.label === o.value)
                      if (match) setHoveredPieType(match.type)
                    }}
                    onMouseLeave={() => setHoveredPieType(null)}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
          )}
          <div className="mt-2 space-y-1.5 border-t border-[#f0ede9] pt-3">
            {breakdown.map((item, i) => (
              <div
                key={item.type}
                className={cn(
                  "flex items-center justify-between text-xs p-1 rounded transition-colors cursor-pointer",
                  hoveredPieType === item.type ? "bg-slate-50 font-extrabold" : ""
                )}
                onMouseEnter={() => setHoveredPieType(item.type)}
                onMouseLeave={() => setHoveredPieType(null)}
              >
                <div className="flex items-center gap-2">
                  <span className="size-2 rounded-full" style={{ background: PIE_COLORS[i % PIE_COLORS.length] }} />
                  <span className={cn("font-semibold text-[#5d5f5f]", hoveredPieType === item.type && "text-[#1c1b1b]")}>
                    {item.label}
                  </span>
                </div>
                <span className="font-bold text-[#1c1b1b]">{formatCurrency(item.amount)}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Charts row 2: Branch bar + Fleet */}
      <section className="mt-5 grid grid-cols-1 gap-5 xl:grid-cols-12">
        <div className="rounded-xl border border-[#e5e2e1] bg-white p-5 shadow-sm xl:col-span-7">
          <div className="mb-4">
            <h3 className="text-sm font-extrabold text-[#1c1b1b]">Hiệu suất chi nhánh</h3>
            <p className="text-xs text-[#747878] mt-0.5">So sánh doanh thu theo cơ sở</p>
          </div>
          {branches.length === 0 && !isLoading ? (
            <div className="flex h-40 items-center justify-center text-sm text-[#747878]">Chưa có cơ sở nào</div>
          ) : (
            <div className="h-40 w-full text-xs">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={branches} layout="vertical" margin={{ top: 0, right: 40, left: 0, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0ede9" horizontal={false} />
                  <XAxis
                    type="number"
                    stroke="#b0b4b4"
                    tickLine={false}
                    axisLine={false}
                    tickFormatter={(v) => formatCurrency(v)}
                    tick={{ fontSize: 9 }}
                  />
                  <YAxis
                    type="category"
                    dataKey="cafeName"
                    stroke="#b0b4b4"
                    tickLine={false}
                    axisLine={false}
                    width={100}
                    tick={{ fontSize: 10, fontWeight: 700 }}
                  />
                  <Tooltip
                    formatter={(v: number) => formatCurrency(v)}
                    contentStyle={{ borderRadius: "10px", border: "1px solid #e5e2e1", fontSize: 12 }}
                  />
                  <Bar dataKey="totalRevenue" name="Doanh thu" fill="#ea580c" radius={[0, 4, 4, 0]} maxBarSize={22} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>

        <div className="rounded-xl border border-[#e5e2e1] bg-white p-5 shadow-sm xl:col-span-5">
          <div className="mb-4 flex items-center justify-between">
            <div>
              <h3 className="text-sm font-extrabold text-[#1c1b1b]">Tình trạng đội xe</h3>
              <p className="text-xs text-[#747878] mt-0.5">{kpi ? `Tổng ${kpi.totalVehicles} xe` : "Đang tải..."}</p>
            </div>
            <Button asChild variant="outline" className="h-8 gap-1.5 rounded-lg border-[#c4c7c8] text-xs font-bold">
              <Link to={routePaths.providerVehicles}>
                Quản lý <ArrowRight className="size-3" />
              </Link>
            </Button>
          </div>
          <div className="grid grid-cols-1 gap-3">
            <FleetStatusItem
              label="Sẵn sàng hoạt động"
              value={kpi?.availableVehicles ?? 0}
              icon={<CheckCircle2 className="size-4" />}
              color="emerald"
            />
            <FleetStatusItem
              label="Đang cho thuê"
              value={kpi?.inUseVehicles ?? 0}
              icon={<PlayCircle className="size-4" />}
              color="blue"
            />
            <FleetStatusItem
              label="Bảo trì / sửa chữa"
              value={kpi?.maintenanceVehicles ?? 0}
              icon={<Wrench className="size-4" />}
              color="red"
            />
          </div>
        </div>
      </section>

      {/* Recent Bookings */}
      <section className="mt-5">
        <div className="rounded-xl border border-[#e5e2e1] bg-white shadow-sm">
          <div className="flex items-center justify-between border-b border-[#f0ede9] px-5 py-4">
            <div>
              <h3 className="text-sm font-extrabold text-[#1c1b1b]">Booking gần đây</h3>
              <p className="text-xs text-[#747878] mt-0.5">8 booking mới nhất</p>
            </div>
            <Button asChild variant="outline" className="h-8 gap-1.5 rounded-lg border-[#c4c7c8] text-xs font-bold">
              <Link to={routePaths.providerBookings}>
                Xem tất cả <ArrowRight className="size-3" />
              </Link>
            </Button>
          </div>
          <div className="overflow-x-auto">
            {recent.length === 0 && !isLoading ? (
              <div className="py-10 text-center text-sm text-[#747878]">Chưa có booking nào</div>
            ) : (
              <table className="w-full min-w-[600px] text-sm">
                <thead>
                  <tr className="bg-[#fcf8f8]/60 text-xs font-bold uppercase tracking-wider text-[#747878]">
                    <th className="px-5 py-3 text-left">Chi nhánh</th>
                    <th className="px-5 py-3 text-left">Khách hàng</th>
                    <th className="px-5 py-3 text-left">Chế độ</th>
                    <th className="px-5 py-3 text-left">Thời gian</th>
                    <th className="px-5 py-3 text-left">Trạng thái</th>
                    <th className="px-5 py-3 text-right">Tổng tiền</th>
                  </tr>
                </thead>
                <tbody>
                  {recent.map((b) => (
                    <tr key={b.bookingId} className="border-t border-[#f0ede9] transition-colors hover:bg-[#fcf8f8]">
                      <td className="px-5 py-3 font-semibold text-[#1c1b1b]">{b.cafeName}</td>
                      <td className="px-5 py-3 text-[#5d5f5f]">{b.customerName}</td>
                      <td className="px-5 py-3">
                        <span
                          className={cn(
                            "rounded-full px-2 py-0.5 text-xs font-bold",
                            b.playMode === "RENTAL" ? "bg-orange-50 text-orange-700" : "bg-blue-50 text-blue-700"
                          )}
                        >
                          {b.playMode === "RENTAL" ? "Thuê xe" : "BYOC"}
                        </span>
                      </td>
                      <td className="px-5 py-3 text-xs text-[#747878]">
                        {new Date(b.slotStart).toLocaleString("vi-VN", { dateStyle: "short", timeStyle: "short" })}
                      </td>
                      <td className="px-5 py-3">
                        <BookingStatusBadge status={b.status} />
                      </td>
                      <td className="px-5 py-3 text-right font-extrabold text-[#1c1b1b]">
                        {formatCurrency(Number(b.totalCharged))}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>
      </section>
    </ProviderShell>
  )
}

function OnboardingChecklist({
  steps,
  onCompleteAll,
}: {
  steps: { branchesCreated: boolean; vehiclesAdded: boolean; operationalHoursSet: boolean }
  onCompleteAll: () => void
}) {
  const completedCount = Object.values(steps).filter(Boolean).length
  const progressPercent = Math.round((completedCount / 3) * 100)
  const allStepsCompleted = completedCount === 3

  return (
    <div className="w-full space-y-6 py-2">
      {/* Celebration & Welcome Banner */}
      <div className="relative overflow-hidden rounded-2xl border border-orange-100 bg-gradient-to-br from-orange-50/70 via-white to-orange-50/20 p-8 shadow-sm">
        <div className="absolute top-0 right-0 w-[300px] h-[300px] rounded-full bg-orange-200/20 blur-[80px] pointer-events-none" />
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-3">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-orange-100 text-orange-800 text-xs font-bold">
              <PartyPopper className="size-4 text-orange-600 animate-bounce" />
              🎉 Tài khoản đã được duyệt!
            </div>
            <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">Chào mừng đối tác RCField</h1>
            <p className="text-slate-600 max-w-xl text-sm leading-relaxed">
              Gói dùng thử <strong className="text-orange-700 font-extrabold">30 ngày</strong> đang chạy. Hãy hoàn thành các
              bước hướng dẫn thiết lập bên dưới để bắt đầu quản lý.
            </p>
          </div>

          <div className="flex flex-col items-center justify-center bg-white border border-slate-200/80 rounded-xl p-5 shadow-sm min-w-[160px] self-start md:self-center">
            <span className="text-3xl font-black text-slate-900">{progressPercent}%</span>
            <span className="text-xs font-bold text-slate-500 mt-1">TIẾN TRÌNH THIẾT LẬP</span>
            <div className="w-28 h-2 bg-slate-100 rounded-full mt-3 overflow-hidden">
              <div
                className="h-full bg-orange-500 transition-all duration-500 rounded-full animate-pulse"
                style={{ width: `${progressPercent}%` }}
              />
            </div>
          </div>
        </div>
      </div>

      <div className="space-y-2">
        <h3 className="text-base font-bold text-slate-800 px-1">Việc cần làm ngay:</h3>
      </div>

      {/* Steps List */}
      <div className="space-y-4">
        {/* Step 1: Cafe/Branch */}
        <div
          className={cn(
            "group relative flex items-start gap-5 p-6 rounded-xl border transition-all bg-white",
            steps.branchesCreated ? "border-emerald-100 bg-emerald-50/10" : "border-slate-200 hover:border-orange-200"
          )}
        >
          <div className="mt-1 flex items-center justify-center text-slate-300">
            {steps.branchesCreated ? (
              <CheckCircle2 className="size-7 text-emerald-600 fill-emerald-50" />
            ) : (
              <div className="size-7 rounded-full border-2 border-slate-300" />
            )}
          </div>

          <div className="flex-1 space-y-3">
            <div>
              <div className="flex items-center gap-2">
                <h3 className={cn("text-base font-extrabold text-[#1c1b1b]", steps.branchesCreated && "line-through text-slate-500/60")}>
                  Tạo chi nhánh đầu tiên
                </h3>
                <Building2 className="size-4.5 text-slate-400" />
              </div>
              <p className="text-[#444748] text-xs font-semibold mt-1 max-w-2xl">
                Cấu hình thông tin cơ sở RC Cafe của bạn để khách hàng có thể đặt lịch chơi và thuê xe.
              </p>
            </div>

            <div className="flex items-center gap-3">
              <Button
                asChild
                className={cn(
                  "h-9 rounded-lg px-4 text-xs font-bold transition-all",
                  steps.branchesCreated
                    ? "bg-slate-100 text-slate-700 hover:bg-slate-200"
                    : "bg-slate-950 text-white hover:bg-slate-900 shadow-sm"
                )}
              >
                <Link to={routePaths.providerCafes}>
                  {steps.branchesCreated ? "Quản lý cơ sở" : "Thiết lập cơ sở ngay"}
                  <ArrowRight className="size-3.5 ml-1.5" />
                </Link>
              </Button>
            </div>
          </div>
        </div>

        {/* Step 2: Add vehicles */}
        <div
          className={cn(
            "group relative flex items-start gap-5 p-6 rounded-xl border transition-all bg-white",
            steps.vehiclesAdded ? "border-emerald-100 bg-emerald-50/10" : "border-slate-200 hover:border-orange-200"
          )}
        >
          <div className="mt-1 flex items-center justify-center text-slate-300">
            {steps.vehiclesAdded ? (
              <CheckCircle2 className="size-7 text-emerald-600 fill-emerald-50" />
            ) : (
              <div className="size-7 rounded-full border-2 border-slate-300" />
            )}
          </div>

          <div className="flex-1 space-y-3">
            <div>
              <div className="flex items-center gap-2">
                <h3 className={cn("text-base font-extrabold text-[#1c1b1b]", steps.vehiclesAdded && "line-through text-slate-500/60")}>
                  Thêm xe vào fleet (đội xe)
                </h3>
                <Car className="size-4.5 text-slate-400" />
              </div>
              <p className="text-[#444748] text-xs font-semibold mt-1 max-w-2xl">
                Khai báo danh mục xe RC cho thuê có sẵn tại cơ sở để khách hàng chọn khi làm booking.
              </p>
            </div>

            <div className="flex items-center gap-3">
              <Button
                asChild
                disabled={!steps.branchesCreated}
                className={cn(
                  "h-9 rounded-lg px-4 text-xs font-bold transition-all",
                  steps.vehiclesAdded
                    ? "bg-slate-100 text-slate-700 hover:bg-slate-200"
                    : "bg-slate-950 text-white hover:bg-slate-900 shadow-sm"
                )}
              >
                {steps.branchesCreated ? (
                  <Link to={routePaths.providerVehicles}>
                    {steps.vehiclesAdded ? "Quản lý đội xe" : "Đăng ký xe mới"}
                    <ArrowRight className="size-3.5 ml-1.5" />
                  </Link>
                ) : (
                  <span>Đăng ký xe mới (Cần tạo cơ sở trước)</span>
                )}
              </Button>
            </div>
          </div>
        </div>

        {/* Step 3: Operating Hours */}
        <div
          className={cn(
            "group relative flex items-start gap-5 p-6 rounded-xl border transition-all bg-white",
            steps.operationalHoursSet ? "border-emerald-100 bg-emerald-50/10" : "border-slate-200 hover:border-orange-200"
          )}
        >
          <div className="mt-1 flex items-center justify-center text-slate-300">
            {steps.operationalHoursSet ? (
              <CheckCircle2 className="size-7 text-emerald-600 fill-emerald-50" />
            ) : (
              <div className="size-7 rounded-full border-2 border-slate-300" />
            )}
          </div>

          <div className="flex-1 space-y-3">
            <div>
              <div className="flex items-center gap-2">
                <h3
                  className={cn(
                    "text-base font-extrabold text-[#1c1b1b]",
                    steps.operationalHoursSet && "line-through text-slate-500/60"
                  )}
                >
                  Cài đặt giờ hoạt động
                </h3>
                <Clock className="size-4.5 text-slate-400" />
              </div>
              <p className="text-[#444748] text-xs font-semibold mt-1 max-w-2xl">
                Cài đặt khung giờ làm việc mở cửa và đóng cửa hàng ngày tại cơ sở của bạn.
              </p>
            </div>

            <div className="flex items-center gap-3">
              <Button
                asChild
                disabled={!steps.branchesCreated}
                className={cn(
                  "h-9 rounded-lg px-4 text-xs font-bold transition-all",
                  steps.operationalHoursSet
                    ? "bg-slate-100 text-slate-700 hover:bg-slate-200"
                    : "bg-slate-950 text-white hover:bg-slate-900 shadow-sm"
                )}
              >
                {steps.branchesCreated ? (
                  <Link to={routePaths.providerCafes}>
                    {steps.operationalHoursSet ? "Quản lý khung giờ" : "Thiết lập giờ mở cửa"}
                    <ArrowRight className="size-3.5 ml-1.5" />
                  </Link>
                ) : (
                  <span>Thiết lập giờ mở cửa (Cần tạo cơ sở trước)</span>
                )}
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Bypass Footer */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 p-5 rounded-xl border border-slate-200/80 bg-slate-50/50">
        <span className="text-xs text-slate-500 font-medium max-w-md">
          <strong>Mẹo:</strong> Sau khi cấu hình xong cả 3 bước thiết lập thực tế trên hệ thống, nút kích hoạt bên dưới sẽ sẵn sàng để bạn truy cập Dashboard.
        </span>
        <div className="flex gap-3">
          <Button
            onClick={onCompleteAll}
            disabled={!allStepsCompleted}
            className={cn(
              "h-10 px-5 text-xs font-bold gap-2 shadow-md rounded-lg transition-all",
              allStepsCompleted
                ? "bg-orange-600 text-white hover:bg-orange-700 cursor-pointer"
                : "bg-slate-200 text-slate-400 cursor-not-allowed"
            )}
          >
            Kích Hoạt Dashboard
            <Sparkles className="size-4 animate-pulse" />
          </Button>
        </div>
      </div>
    </div>
  )
}
