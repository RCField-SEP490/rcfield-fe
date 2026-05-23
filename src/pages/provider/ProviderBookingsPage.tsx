import { AlertTriangle, CalendarClock, CreditCard, Plus } from "lucide-react"

import { MetricCard, Panel, ProviderHeader, ProviderTable, StateBadge } from "@/pages/provider/components/ProviderPrimitives"
import { ProviderShell } from "@/pages/provider/components/ProviderShell"
import { bookings } from "@/pages/provider/data"

export function ProviderBookingsPage() {
  return (
    <ProviderShell>
      <ProviderHeader title="Danh sách đặt lịch" description="Quản lý đặt lịch theo trạng thái thanh toán, khung giờ và cơ sở." actionLabel="Tạo đặt lịch" actionIcon={<Plus className="size-5" />} />
      <section className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <MetricCard label="Hôm nay" value="48" helper="32 confirmed, 12 pending" icon={<CalendarClock />} tone="info" />
        <MetricCard label="Doanh thu dự kiến" value="18.6M ₫" helper="Đã cọc 11.2M ₫" icon={<CreditCard />} tone="success" />
        <MetricCard label="No-show risk" value="3" helper="Sắp quá 30 phút" icon={<AlertTriangle />} tone="warning" />
      </section>
      <Panel className="mt-4">
        <ProviderTable columns={["Mã", "Khách hàng", "Cơ sở", "Thời gian", "Số tiền", "Trạng thái"]} rows={bookings.map((item) => [item.id, item.customer, item.branch, item.time, item.amount, <StateBadge key={item.id} state={item.status} />])} />
      </Panel>
    </ProviderShell>
  )
}
