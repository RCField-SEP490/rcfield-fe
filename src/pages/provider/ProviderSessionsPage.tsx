import { AlertTriangle, CalendarClock, PlayCircle, ShieldCheck } from "lucide-react"

import { MetricCard, Panel, PanelTitle, ProviderPageHeader, ProviderTable, StateBadge } from "@/pages/provider/components/ProviderPrimitives"
import { ProviderShell } from "@/pages/provider/components/ProviderShell"
import { sessions } from "@/pages/provider/data"
import { Button } from "@/shared/ui/button"

export function ProviderSessionsPage() {
  return (
    <ProviderShell>
      <ProviderPageHeader title="Theo dõi phiên đang diễn ra" description="Tách biệt booking và session: check-in, active, gia hạn, checkout và đối soát." />
      <section className="grid grid-cols-1 gap-4 sm:grid-cols-4">
        <MetricCard label="Active" value="12" helper="Đang chạy trên sân" icon={<PlayCircle />} tone="success" />
        <MetricCard label="Extending" value="2" helper="Chờ khách phản hồi" icon={<CalendarClock />} tone="warning" />
        <MetricCard label="Checking out" value="4" helper="Đang xác nhận ảnh" icon={<ShieldCheck />} tone="info" />
        <MetricCard label="Sự cố" value="1" helper="Có bằng chứng hư hỏng" icon={<AlertTriangle />} tone="danger" />
      </section>
      <Panel className="mt-4">
        <PanelTitle
          title="Live board phiên chạy"
          subtitle="Check-in, gia hạn, checkout và đối soát theo từng session."
          action={
            <Button className="h-10 gap-2 rounded-lg bg-[#1c1b1b] text-white hover:bg-[#313030]">
              <PlayCircle className="size-4" />
              Mở live board
            </Button>
          }
        />
        <ProviderTable columns={["Session", "Booking", "Xe", "Nhân viên", "Thời lượng", "Trạng thái"]} rows={sessions.map((item) => [item.id, item.booking, item.vehicle, item.staff, item.timer, <StateBadge key={item.id} state={item.state} />])} />
      </Panel>
    </ProviderShell>
  )
}
