import { Link } from "react-router"
import {
  AlertTriangle,
  BatteryWarning,
  CheckCircle2,
  Download,
  MoreVertical,
  Plus,
  Wrench,
  Zap,
} from "lucide-react"

import { routePaths } from "@/app/router/route-paths"
import { ProviderPageHeader } from "@/pages/provider/components/ProviderPrimitives"
import { ProviderShell } from "@/pages/provider/components/ProviderShell"
import { vehicles } from "@/pages/provider/data"
import { cn } from "@/shared/lib/utils"
import { Button } from "@/shared/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/shared/ui/dropdown-menu"

type FleetTone = "critical" | "service" | "optimal"

const fleetHealth = [
  {
    vehicleId: "VH-207",
    state: "NGUY KỊCH",
    cycles: "142 / 150",
    temperature: "85°C",
    progress: 95,
    tone: "critical" as const,
    note: "Cảnh báo quá nhiệt động cơ liên tục trong 3 phiên gần nhất.",
  },
  {
    vehicleId: "VH-118",
    state: "CẦN BẢO DƯỠNG",
    cycles: "120 / 150",
    temperature: "68°C",
    progress: 80,
    tone: "service" as const,
    note: "Đạt ngưỡng 120 chu kỳ sạc. Cần thay pin định kỳ.",
  },
  {
    vehicleId: "VH-102",
    state: "TỐI ƯU",
    cycles: "45 / 150",
    temperature: "42°C",
    progress: 30,
    tone: "optimal" as const,
    note: "Xe vận hành ổn định, pin và nhiệt độ trong vùng an toàn.",
  },
  {
    vehicleId: "VH-311",
    state: "TỐI ƯU",
    cycles: "12 / 150",
    temperature: "38°C",
    progress: 10,
    tone: "optimal" as const,
    note: "Xe sẵn sàng cho ca tiếp theo.",
  },
]

const maintenanceQueue = [
  {
    vehicleId: "VH-207",
    priority: "ƯU TIÊN 1",
    description: "Cảnh báo quá nhiệt động cơ liên tục trong 3 phiên gần nhất.",
    icon: <Zap className="size-5" />,
    tone: "critical" as const,
  },
  {
    vehicleId: "VH-118",
    priority: "HÔM NAY",
    description: "Đạt ngưỡng 120 chu kỳ sạc. Cần thay pin định kỳ.",
    icon: <BatteryWarning className="size-5" />,
    tone: "service" as const,
  },
  {
    vehicleId: "VH-311",
    priority: "TUẦN TỚI",
    description: "Dự kiến thay lốp dựa trên tổng thời gian chạy.",
    icon: <Wrench className="size-5" />,
    tone: "optimal" as const,
  },
]

export function ProviderVehiclesPage() {
  return (
    <ProviderShell>
      <ProviderPageHeader
        title="Giám sát đội xe"
        description="Theo dõi sức khỏe, chu kỳ pin và nhiệt độ thời gian thực."
        actions={
          <>
            <Button variant="outline" className="h-10 gap-2 rounded-lg border-[#c4c7c8] bg-white text-[#1c1b1b] hover:bg-[#f1edec]">
              <Download className="size-4" />
              Xuất báo cáo
            </Button>
            <Button className="h-10 gap-2 rounded-lg bg-[#1c1b1b] text-white hover:bg-[#313030]">
              <Plus className="size-4" />
              Thêm xe
            </Button>
          </>
        }
      />

      <section className="grid grid-cols-2 gap-4 md:grid-cols-4">
        <KpiCard label="Tổng số xe" value="24" />
        <KpiCard label="Hoạt động" value="18" marker="neutral" />
        <KpiCard label="Cần bảo dưỡng" value="4" marker="service" />
        <KpiCard label="Nguy kịch" value="2" marker="critical" urgent />
      </section>

      <div className="mt-16 grid grid-cols-1 gap-4 lg:grid-cols-12">
        <section className="flex flex-col gap-4 lg:col-span-8">
          <h3 className="text-2xl font-semibold leading-tight text-[#1c1b1b]">Chi tiết trạng thái</h3>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            {fleetHealth.map((item) => (
              <FleetHealthCard key={item.vehicleId} item={item} />
            ))}
          </div>
        </section>

        <aside className="flex flex-col gap-4 lg:col-span-4">
          <h3 className="text-2xl font-semibold leading-tight text-[#1c1b1b]">Hàng đợi dự đoán</h3>
          <div className="flex min-h-[400px] flex-col overflow-hidden rounded-xl border border-[#c4c7c8] bg-[#f6f3f2] shadow-sm">
            <div className="border-b border-[#c4c7c8] bg-[#e5e2e1] p-4">
              <p className="text-sm font-medium text-[#444748]">Lịch trình bảo dưỡng tự động dựa trên phân tích dữ liệu.</p>
            </div>
            <div className="flex-1 space-y-2 overflow-y-auto p-2">
              {maintenanceQueue.map((item) => (
                <QueueItem key={item.vehicleId} item={item} />
              ))}
            </div>
          </div>
        </aside>
      </div>
    </ProviderShell>
  )
}

function KpiCard({ label, value, marker, urgent = false }: { label: string; value: string; marker?: FleetTone | "neutral"; urgent?: boolean }) {
  return (
    <article
      className={cn(
        "rounded-xl border p-6 shadow-sm",
        urgent ? "border-[#ba1a1a] bg-[#ffdad6] text-[#93000a]" : "border-[#c4c7c8] bg-white text-[#1c1b1b]"
      )}
    >
      <p className={cn("mb-2 flex items-center gap-2 font-mono text-xs font-medium uppercase tracking-[0.05em]", urgent ? "text-[#93000a]" : "text-[#747878]")}>
        {marker ? <span className={cn("size-2 rounded-full", markerDot(marker))} /> : null}
        {label}
      </p>
      <p className="text-4xl font-bold leading-none">{value}</p>
    </article>
  )
}

function FleetHealthCard({ item }: { item: (typeof fleetHealth)[number] }) {
  const vehicle = vehicles.find((vehicleItem) => vehicleItem.id === item.vehicleId) ?? vehicles[0]
  const Icon = item.tone === "critical" ? AlertTriangle : item.tone === "service" ? Wrench : CheckCircle2

  return (
    <article className={cn("relative overflow-hidden rounded-xl border bg-white p-5 shadow-sm", cardBorder(item.tone))}>
      <div className={cn("absolute left-0 top-0 h-full w-1", markerDot(item.tone))} />
      <div className="mb-4 flex items-start justify-between gap-3">
        <div className="min-w-0">
          <h4 className="text-xl font-semibold leading-tight text-[#1c1b1b]">Mã xe: {vehicle.id}</h4>
          <p className="mt-1 truncate text-sm font-medium text-[#444748]">{vehicle.name}</p>
          <p className={cn("mt-2 font-mono text-xs font-semibold uppercase tracking-[0.05em]", toneText(item.tone))}>{item.state}</p>
        </div>
        <div className="flex items-start gap-2">
          <Icon className={cn("size-5", toneText(item.tone))} />
          <VehicleActions vehicleId={vehicle.id} vehicleName={vehicle.name} />
        </div>
      </div>

      <div className="space-y-3">
        <HealthRow label="Chu kỳ pin" value={item.cycles} />
        <HealthRow label="Nhiệt độ động cơ" value={item.temperature} danger={item.tone === "critical"} />
        <div className="h-1.5 w-full overflow-hidden rounded-full bg-[#e5e2e1]">
          <div className={cn("h-full rounded-full", markerDot(item.tone))} style={{ width: `${item.progress}%` }} />
        </div>
        <p className="line-clamp-2 text-xs font-medium text-[#444748]">{item.note}</p>
      </div>
    </article>
  )
}

function QueueItem({ item }: { item: (typeof maintenanceQueue)[number] }) {
  const vehicle = vehicles.find((vehicleItem) => vehicleItem.id === item.vehicleId) ?? vehicles[0]

  return (
    <Link
      to={routePaths.providerVehicleDetail.replace(":vehicleId", vehicle.id)}
      className={cn(
        "flex gap-3 rounded-lg border border-[#c4c7c8] bg-white p-3 transition-colors hover:bg-[#fcf8f8]",
        item.tone === "optimal" && "opacity-75"
      )}
    >
      <div className={cn("flex size-10 shrink-0 items-center justify-center rounded-full", queueIconTone(item.tone))}>{item.icon}</div>
      <div className="min-w-0 flex-1">
        <div className="mb-1 flex items-center justify-between gap-3">
          <span className="font-mono text-xs font-bold text-[#1c1b1b]">{vehicle.id}</span>
          <span className={cn("shrink-0 font-mono text-[10px] font-bold uppercase tracking-[0.05em]", toneText(item.tone))}>{item.priority}</span>
        </div>
        <p className="line-clamp-2 text-[13px] font-medium leading-5 text-[#444748]">{item.description}</p>
      </div>
    </Link>
  )
}

function VehicleActions({ vehicleId, vehicleName }: { vehicleId: string; vehicleName: string }) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          type="button"
          className="inline-flex size-8 items-center justify-center rounded text-[#747878] transition-colors hover:bg-[#f1edec] hover:text-[#1c1b1b]"
          aria-label={`Mở menu xe ${vehicleName}`}
          title="Mở menu xe"
        >
          <MoreVertical className="size-5" />
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-44 rounded-lg border-[#c4c7c8] bg-white p-1">
        <DropdownMenuItem asChild className="cursor-pointer rounded-md px-2 py-2 text-sm font-medium">
          <Link to={routePaths.providerVehicleDetail.replace(":vehicleId", vehicleId)}>Xem chi tiết xe</Link>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

function HealthRow({ label, value, danger = false }: { label: string; value: string; danger?: boolean }) {
  return (
    <div className="flex items-center justify-between gap-4 border-b border-[#c4c7c8] pb-2">
      <span className="text-sm font-medium text-[#444748]">{label}</span>
      <span className={cn("font-mono text-xs font-bold", danger ? "text-[#ba1a1a]" : "text-[#1c1b1b]")}>{value}</span>
    </div>
  )
}

function markerDot(tone: FleetTone | "neutral") {
  return {
    critical: "bg-[#ba1a1a]",
    service: "bg-[#5d5e66]",
    optimal: "bg-[#1c1b1b]",
    neutral: "bg-[#1c1b1b]",
  }[tone]
}

function toneText(tone: FleetTone) {
  return {
    critical: "text-[#ba1a1a]",
    service: "text-[#5d5e66]",
    optimal: "text-[#444748]",
  }[tone]
}

function cardBorder(tone: FleetTone) {
  return tone === "critical" ? "border-[#ba1a1a]" : "border-[#c4c7c8]"
}

function queueIconTone(tone: FleetTone) {
  return {
    critical: "bg-[#ffdad6] text-[#ba1a1a]",
    service: "bg-[#e5e2e1] text-[#5d5e66]",
    optimal: "bg-[#e5e2e1] text-[#444748]",
  }[tone]
}
