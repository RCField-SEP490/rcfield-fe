import { Link } from "react-router"
import { BatteryCharging, Car, MoreVertical, PlayCircle, Plus, Wrench } from "lucide-react"

import { routePaths } from "@/app/router/route-paths"
import { MetricCard, Panel, ProviderHeader, ProviderTable, StatusBadge } from "@/pages/provider/components/ProviderPrimitives"
import { ProviderShell } from "@/pages/provider/components/ProviderShell"
import { vehicles } from "@/pages/provider/data"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/shared/ui/dropdown-menu"

export function ProviderVehiclesPage() {
  return (
    <ProviderShell>
      <ProviderHeader
        title="Quản lý xe"
        description="Giám sát tình trạng xe, pin, bảo trì và phân bổ theo cơ sở."
        actionLabel="Thêm xe"
        actionIcon={<Plus className="size-5" />}
      />
      <section className="grid grid-cols-1 gap-4 sm:grid-cols-4">
        <MetricCard label="Tổng xe" value="120" helper="94 sẵn sàng" icon={<Car />} tone="neutral" />
        <MetricCard label="Đang thuê" value="14" helper="12 phiên active" icon={<PlayCircle />} tone="info" />
        <MetricCard label="Bảo trì" value="12" helper="3 hóa đơn chờ duyệt" icon={<Wrench />} tone="danger" />
        <MetricCard label="Pin thấp" value="7" helper="Cần sạc trước ca tối" icon={<BatteryCharging />} tone="warning" />
      </section>
      <Panel className="mt-4">
        <ProviderTable
          columns={["Mã xe", "Tên xe", "Cơ sở", "Dòng xe", "Pin", "Trạng thái", ""]}
          rows={vehicles.map((item) => [
            item.id,
            item.name,
            item.branch,
            item.tier,
            item.battery,
            <StatusBadge key={`${item.id}-status`} status={item.status} />,
            <DropdownMenu key={`${item.id}-actions`}>
              <DropdownMenuTrigger asChild>
                <button
                  type="button"
                  className="inline-flex size-8 items-center justify-center rounded text-[#747878] transition-colors hover:bg-[#f1edec] hover:text-[#1c1b1b]"
                  aria-label={`Mở menu xe ${item.name}`}
                  title="Mở menu xe"
                >
                  <MoreVertical className="size-5" />
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-44 rounded-lg border-[#c4c7c8] bg-white p-1">
                <DropdownMenuItem asChild className="cursor-pointer rounded-md px-2 py-2 text-sm font-medium">
                  <Link to={routePaths.providerVehicleDetail.replace(":vehicleId", item.id)}>Xem chi tiết xe</Link>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>,
          ])}
        />
      </Panel>
    </ProviderShell>
  )
}
