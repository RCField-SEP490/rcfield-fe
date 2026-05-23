import { Link } from "react-router"
import type { ReactNode } from "react"
import { ArrowRight, BarChart3, Car, CheckCircle2, ClipboardList, Download, MoreVertical, PlayCircle, Users, Wrench } from "lucide-react"

import { routePaths } from "@/app/router/route-paths"
import { BranchList, MetricCard, Panel, PanelTitle, RevenueBars, tonePill } from "@/pages/provider/components/ProviderPrimitives"
import { ProviderShell } from "@/pages/provider/components/ProviderShell"
import type { ProviderTone } from "@/pages/provider/data"
import { cn } from "@/shared/lib/utils"
import { Button } from "@/shared/ui/button"

export function ProviderDashboardPage() {
  return (
    <ProviderShell>
      <ProviderHeaderBlock />

      <section className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <MetricCard label="Tổng doanh thu" value="124.5M ₫" helper="+12.5% so với tuần trước" icon={<BarChart3 />} tone="success" />
        <MetricCard label="Tổng lượt đặt" value="842" helper="+8.2% so với tuần trước" icon={<ClipboardList />} tone="success" />
        <MetricCard label="Tỷ lệ hoạt động xe" value="88%" helper="-2.1% do 12 xe bảo trì" icon={<Car />} tone="danger" />
        <MetricCard label="Khách hàng mới" value="156" helper="+15.3% so với tuần trước" icon={<Users />} tone="success" />
      </section>

      <section className="mt-4 grid grid-cols-1 gap-4 xl:grid-cols-12">
        <Panel className="xl:col-span-8">
          <PanelTitle title="Biểu đồ doanh thu" subtitle="Theo tuần / triệu VNĐ" />
          <RevenueBars />
        </Panel>

        <Panel className="xl:col-span-4">
          <PanelTitle title="Hiệu suất cơ sở" action={<MoreVertical className="size-5" />} />
          <BranchList compact />
        </Panel>
      </section>

      <Panel className="mt-4">
        <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <PanelTitle title="Tình trạng đội xe toàn hệ thống" subtitle="Tổng cộng 120 xe đang quản lý" />
          <Button asChild variant="outline" className="h-10 w-fit gap-2 rounded-lg border-[#c4c7c8] bg-[#f1edec] text-[#1c1b1b] hover:bg-[#e5e2e1]">
            <Link to={routePaths.providerVehicles}>
              Quản lý chi tiết
              <ArrowRight className="size-4" />
            </Link>
          </Button>
        </div>
        <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
          <FleetStatus label="Sẵn sàng hoạt động" value="94 xe" icon={<CheckCircle2 />} tone="success" />
          <FleetStatus label="Đang cho thuê" value="14 xe" icon={<PlayCircle />} tone="info" />
          <FleetStatus label="Bảo trì / sửa chữa" value="12 xe" icon={<Wrench />} tone="danger" note="Cần duyệt 3 hóa đơn sửa chữa" />
        </div>
      </Panel>
    </ProviderShell>
  )
}

function ProviderHeaderBlock() {
  return (
    <div className="mb-8 flex flex-col items-start justify-between gap-4 md:flex-row md:items-center">
      <div>
        <h2 className="text-4xl font-bold leading-[1.1] tracking-tight text-[#1c1b1b] md:text-5xl">Tổng quan hệ thống</h2>
        <p className="mt-2 text-base font-medium text-[#444748]">Dữ liệu cập nhật hôm nay, 24 Thg 10 2024</p>
      </div>
      <div className="flex gap-3">
        <Button variant="outline" className="h-10 rounded-lg border-[#c4c7c8] bg-[#f1edec] text-[#1c1b1b] hover:bg-[#e5e2e1]">
          Tháng này
        </Button>
        <Button className="h-10 gap-2 rounded-lg bg-[#1c1b1b] text-white hover:bg-[#313030]">
          <Download className="size-5" />
          Xuất báo cáo
        </Button>
      </div>
    </div>
  )
}

function FleetStatus({ label, value, icon, tone, note }: { label: string; value: string; icon: ReactNode; tone: ProviderTone; note?: string }) {
  return (
    <div className="rounded-lg border border-[#e5e2e1] bg-[#fcf8f8] p-4">
      <div className="mb-4 flex items-center gap-3">
        <div className={cn("flex size-9 items-center justify-center rounded-full [&_svg]:size-5", tonePill(tone))}>{icon}</div>
        <span className="text-sm font-semibold text-[#1c1b1b]">{label}</span>
      </div>
      <div className="text-3xl font-semibold tracking-tight text-[#1c1b1b]">{value}</div>
      {note ? <div className="mt-2 text-xs font-semibold text-red-600">{note}</div> : null}
    </div>
  )
}
