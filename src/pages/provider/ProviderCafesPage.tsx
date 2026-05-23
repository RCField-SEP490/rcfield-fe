import { AlertTriangle, Building2, Plus, TrendingUp } from "lucide-react"

import { BranchList, MetricCard, Panel, PanelTitle, ProviderHeader } from "@/pages/provider/components/ProviderPrimitives"
import { ProviderShell } from "@/pages/provider/components/ProviderShell"

export function ProviderCafesPage() {
  return (
    <ProviderShell>
      <ProviderHeader title="Quản lý cơ sở" description="Theo dõi trạng thái vận hành, doanh thu và tỷ lệ lấp đầy từng chi nhánh." actionLabel="Thêm cơ sở" actionIcon={<Plus className="size-5" />} />
      <section className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <MetricCard label="Cơ sở hoạt động" value="3/3" helper="Không có cơ sở tạm dừng" icon={<Building2 />} tone="success" />
        <MetricCard label="Tỷ lệ lấp đầy TB" value="81%" helper="+6% so với tháng trước" icon={<TrendingUp />} tone="success" />
        <MetricCard label="Cảnh báo vận hành" value="2" helper="1 bảo trì, 1 thiếu nhân sự" icon={<AlertTriangle />} tone="warning" />
      </section>
      <Panel className="mt-4">
        <PanelTitle title="Danh sách cơ sở" subtitle="Sắp xếp theo doanh thu tháng hiện tại" />
        <BranchList />
      </Panel>
    </ProviderShell>
  )
}
