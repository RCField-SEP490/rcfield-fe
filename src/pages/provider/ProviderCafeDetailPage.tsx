import { useParams } from "react-router"
import { BarChart3, Car, CheckCircle2, Settings, TrendingUp } from "lucide-react"

import { MetricCard, Panel, PanelTitle, ProviderHeader, ProviderTable, StatusBadge } from "@/pages/provider/components/ProviderPrimitives"
import { ProviderShell } from "@/pages/provider/components/ProviderShell"
import { branchDetailPath, branches, vehicles } from "@/pages/provider/data"

export function ProviderCafeDetailPage() {
  const { cafeId } = useParams()
  const branch = branches.find((item) => branchDetailPath(item.name).endsWith(`/${cafeId}`)) ?? branches[0]
  const branchVehicles = vehicles.filter((item) => item.branch === branch.name)

  return (
    <ProviderShell>
      <ProviderHeader title={branch.name} description={`${branch.area}. Theo dõi vận hành, đội xe, nhân sự và doanh thu tại chi nhánh.`} actionLabel="Cập nhật cơ sở" actionIcon={<Settings className="size-5" />} />

      <section className="grid grid-cols-1 gap-4 sm:grid-cols-4">
        <MetricCard label="Doanh thu tháng" value={branch.revenue} helper="+9.4% so với tháng trước" icon={<BarChart3 />} tone="success" />
        <MetricCard label="Tỷ lệ lấp đầy" value={`${branch.occupancy}%`} helper="Cao điểm 18:00 - 21:00" icon={<TrendingUp />} tone="success" />
        <MetricCard label="Đội xe" value={`${branch.vehicles} xe`} helper={`${branchVehicles.length} xe đang hiển thị mẫu`} icon={<Car />} tone="neutral" />
        <MetricCard label="Trạng thái" value={branch.status} helper="Cập nhật 5 phút trước" icon={<CheckCircle2 />} tone={branch.status.includes("Bảo") ? "warning" : "success"} />
      </section>

      <section className="mt-4 grid grid-cols-1 gap-4 xl:grid-cols-12">
        <Panel className="xl:col-span-7">
          <PanelTitle title="Lịch vận hành hôm nay" subtitle="Các khung giờ cần điều phối nhân sự và xe" />
          <ProviderTable
            columns={["Khung giờ", "Booking", "Xe cần chuẩn bị", "Nhân sự", "Trạng thái"]}
            rows={[
              ["09:00 - 12:00", "14", "18 xe", "5 người", <StatusBadge key="morning" status="Đang mở" />],
              ["13:00 - 17:00", "22", "26 xe", "7 người", <StatusBadge key="afternoon" status="Đang mở" />],
              ["18:00 - 22:00", "31", "34 xe", "9 người", <StatusBadge key="evening" status="Cần bổ sung" />],
            ]}
          />
        </Panel>

        <Panel className="xl:col-span-5">
          <PanelTitle title="Đội xe tại cơ sở" subtitle="Tình trạng các xe mẫu đang được gán" />
          <div className="space-y-3">
            {branchVehicles.length > 0 ? (
              branchVehicles.map((vehicle) => (
                <div key={vehicle.id} className="rounded-lg border border-[#e5e2e1] p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <div className="font-semibold text-[#1c1b1b]">{vehicle.name}</div>
                      <div className="mt-1 text-xs font-medium text-[#444748]">
                        {vehicle.id} · {vehicle.tier}
                      </div>
                    </div>
                    <StatusBadge status={vehicle.status} />
                  </div>
                  <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-[#e5e2e1]">
                    <div className="h-full rounded-full bg-[#1c1b1b]" style={{ width: vehicle.battery }} />
                  </div>
                  <div className="mt-2 text-xs font-semibold text-[#444748]">Pin {vehicle.battery}</div>
                </div>
              ))
            ) : (
              <div className="rounded-lg border border-dashed border-[#c4c7c8] p-5 text-sm font-medium text-[#444748]">Chưa có xe mẫu trong dữ liệu hiện tại.</div>
            )}
          </div>
        </Panel>
      </section>
    </ProviderShell>
  )
}
