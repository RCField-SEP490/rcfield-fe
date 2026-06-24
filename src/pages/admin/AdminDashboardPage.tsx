import { Link } from "react-router"
import { Building2, DollarSign, Play, Users, ArrowRight } from "lucide-react"
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  BarChart,
  Bar,
  AreaChart,
  Area,
  CartesianGrid,
} from "recharts"

import { routePaths } from "@/app/router/route-paths"
import { AdminShell } from "@/pages/admin/components/AdminShell"
import {
  AdminHeader,
  AdminMetricCard,
  AdminPanel,
  AdminPanelTitle,
  AdminTable,
  CafeStatusBadge,
} from "@/pages/admin/components/AdminPrimitives"
import { useAdminDashboard } from "@/features/dashboard/hooks/useAdminDashboard"
import { Button } from "@/shared/ui/button"

export function AdminDashboardPage() {
  const { summary, isLoading } = useAdminDashboard()

  if (isLoading) {
    return (
      <AdminShell>
        <AdminHeader
          title="Tổng quan Hệ thống"
          description="Đang tải dữ liệu từ hệ thống..."
        />
        <div className="flex h-[400px] items-center justify-center">
          <div className="flex flex-col items-center gap-2">
            <div className="size-8 animate-spin rounded-full border-4 border-orange-500 border-t-transparent" />
            <p className="text-sm font-semibold text-[#747878]">Đang tải số liệu thống kê...</p>
          </div>
        </div>
      </AdminShell>
    )
  }

  const kpi = summary?.kpi
  const cafeGrowth = summary?.cafeGrowth || []
  const revenueByPlan = summary?.revenueByPlan || []
  const activeSessionsTrend = summary?.activeSessionsTrend || []
  const recentCafes = summary?.recentCafes || []

  // Columns for the recent onboarding table
  const columns = ["ID Cơ sở", "Tên cơ sở", "Chủ sở hữu", "Gói SaaS", "Trạng thái", "Ngày đăng ký"]
  
  const rows = recentCafes.map((cafe) => [
    <span key={cafe.id} className="font-mono text-xs text-[#747878]">{cafe.id}</span>,
    <div key={cafe.name} className="flex items-center gap-2">
      <div className="size-6 rounded-md bg-[#f6f3f2] flex items-center justify-center border border-[#e5e2e1]">
        <Building2 className="size-3 text-[#747878]" />
      </div>
      <span className="font-bold text-[#1c1b1b]">{cafe.name}</span>
    </div>,
    <div key={cafe.providerName}>
      <div className="font-bold text-[#1c1b1b]">{cafe.providerName}</div>
      <div className="text-[10px] text-[#747878] font-semibold">{cafe.email}</div>
    </div>,
    <span key={cafe.saasPlan} className="font-bold text-[#1c1b1b]">{cafe.saasPlan}</span>,
    <CafeStatusBadge key={cafe.status} status={cafe.status} />,
    <span key={cafe.createdDate} className="font-mono text-xs text-[#747878]">{cafe.createdDate}</span>,
  ])

  return (
    <AdminShell>
      <AdminHeader
        title="Tổng quan Hệ thống"
        description="Theo dõi hoạt động của nền tảng, đối tác và phân tích doanh thu."
      />

      {/* Metrics Section */}
      <section className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <AdminMetricCard
          label="Tổng số đối tác"
          value={kpi?.totalCafes.value || "0"}
          helper={kpi?.totalCafes.helper || ""}
          icon={<Building2 />}
          trend="up"
        />
        <AdminMetricCard
          label="Tổng người dùng"
          value={kpi?.totalUsers.value || "0"}
          helper={kpi?.totalUsers.helper || ""}
          icon={<Users />}
          trend="up"
        />
        <AdminMetricCard
          label="Doanh thu nền tảng (Tháng này)"
          value={kpi?.monthlyRevenue.value || "0 ₫"}
          helper={kpi?.monthlyRevenue.helper || ""}
          icon={<DollarSign />}
          trend="up"
        />
        <AdminMetricCard
          label="Phiên chơi đang hoạt động"
          value={kpi?.activeSessions.value || "0"}
          helper={kpi?.activeSessions.helper || ""}
          icon={<Play className="fill-current text-orange-500" />}
          trend="up"
        />
      </section>

      {/* Analytics Charts */}
      <section className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-12">
        {/* Cafe Growth Line Chart */}
        <AdminPanel className="lg:col-span-8">
          <AdminPanelTitle
            title="Sự tăng trưởng của Đối tác"
            subtitle="Số lượng cơ sở đăng ký mới trong 6 tháng qua"
          />
          <div className="h-[280px] w-full text-xs">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={cafeGrowth} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e2e1" vertical={false} />
                <XAxis dataKey="name" stroke="#747878" tickLine={false} axisLine={false} />
                <YAxis stroke="#747878" tickLine={false} axisLine={false} />
                <Tooltip
                  contentStyle={{ backgroundColor: "#ffffff", borderColor: "#e5e2e1", borderRadius: "8px", fontWeight: "bold" }}
                  labelStyle={{ color: "#747878" }}
                />
                <Line
                  type="monotone"
                  dataKey="value"
                  stroke="#ea580c"
                  strokeWidth={3}
                  activeDot={{ r: 6 }}
                  dot={{ r: 3, strokeWidth: 2, fill: "#ffffff" }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </AdminPanel>

        {/* SaaS Revenue Bar Chart */}
        <AdminPanel className="lg:col-span-4">
          <AdminPanelTitle
            title="Doanh thu theo Gói SaaS"
            subtitle="Phân bố tỷ lệ doanh thu thực tế từ đối tác"
          />
          <div className="h-[280px] w-full text-xs">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={revenueByPlan} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e2e1" vertical={false} />
                <XAxis dataKey="name" stroke="#747878" tickLine={false} axisLine={false} />
                <YAxis stroke="#747878" tickLine={false} axisLine={false} />
                <Tooltip
                  // eslint-disable-next-line @typescript-eslint/no-explicit-any
                  formatter={(value: any) => [`${Number(value || 0).toLocaleString()} ₫`, "Doanh thu"]}
                  contentStyle={{ backgroundColor: "#ffffff", borderColor: "#e5e2e1", borderRadius: "8px", fontWeight: "bold" }}
                />
                <Bar dataKey="revenue" fill="#f97316" radius={[4, 4, 0, 0]} maxBarSize={45} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </AdminPanel>
      </section>

      {/* Traffic Metrics and Onboarding Queue */}
      <section className="mt-6 grid grid-cols-1 gap-6 xl:grid-cols-12">
        {/* Active Sessions last 7 days */}
        <AdminPanel className="xl:col-span-4">
          <AdminPanelTitle
            title="Lượng truy cập Sân chơi"
            subtitle="Số phiên chơi thực tế trong 7 ngày qua"
          />
          <div className="h-[260px] w-full text-xs">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={activeSessionsTrend} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorSessions" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#ea580c" stopOpacity={0.2} />
                    <stop offset="95%" stopColor="#ea580c" stopOpacity={0.0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e2e1" vertical={false} />
                <XAxis dataKey="name" stroke="#747878" tickLine={false} axisLine={false} />
                <YAxis stroke="#747878" tickLine={false} axisLine={false} />
                <Tooltip contentStyle={{ backgroundColor: "#ffffff", borderColor: "#e5e2e1", borderRadius: "8px", fontWeight: "bold" }} />
                <Area type="monotone" dataKey="value" stroke="#ea580c" strokeWidth={2} fillOpacity={1} fill="url(#colorSessions)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </AdminPanel>

        {/* Recently Created Partners/Cafes Table */}
        <AdminPanel className="xl:col-span-8">
          <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <AdminPanelTitle
              title="Đối tác đăng ký gần đây"
              subtitle="Cần rà soát hồ sơ và thực hiện phê duyệt đối tác mới"
            />
            <Button
              asChild
              variant="outline"
              className="h-9 gap-1.5 rounded-lg border-[#c4c7c8] bg-[#f1edec]/50 hover:bg-[#e5e2e1] text-[#1c1b1b] font-bold text-xs"
            >
              <Link to={routePaths.adminCafes}>
                Duyệt tất cả
                <ArrowRight className="size-4" />
              </Link>
            </Button>
          </div>
          
          <AdminTable columns={columns} rows={rows} />
        </AdminPanel>
      </section>
    </AdminShell>
  )
}

