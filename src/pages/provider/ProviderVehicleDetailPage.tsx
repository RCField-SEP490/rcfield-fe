import { Link, useParams } from "react-router"
import { ArrowLeft, Ban, BatteryCharging, CircleDot, Clock3, Filter, Radio, Thermometer, Wrench } from "lucide-react"

import { routePaths } from "@/app/router/route-paths"
import { ProviderPageHeader } from "@/pages/provider/components/ProviderPrimitives"
import { ProviderShell } from "@/pages/provider/components/ProviderShell"
import { vehicles } from "@/pages/provider/data"
import { Button } from "@/shared/ui/button"

const specs = [
  ["Class", "1/5 Monster"],
  ["Power", "8S LiPo"],
  ["Chassis", "Composite"],
  ["Purchased", "Oct 2023"],
]

const logs = [
  {
    title: "Suspension Rebuild",
    date: "Oct 12, 2023",
    detail: "Replaced shock oil, new O-rings installed, checked A-arms for stress fractures.",
    meta: ["Tech: JR", "1.5h"],
  },
  {
    title: "Drivetrain Inspection",
    date: "Sep 28, 2023",
    detail: "Cleaned and re-greased front/rear diffs. Pinion gear showing minor wear.",
    meta: ["Tech: AL", "45m"],
  },
  {
    title: "Tire Replacement",
    date: "Sep 05, 2023",
    detail: "Swapped all 4 Sledgehammers and re-glued beads on set B.",
    meta: ["Tech: JR", "20m"],
  },
]

export function ProviderVehicleDetailPage() {
  const { vehicleId } = useParams()
  const vehicle = vehicles.find((item) => item.id === vehicleId) ?? vehicles[0]

  return (
    <ProviderShell>
      <ProviderPageHeader
        title={`${vehicle.name} ${vehicle.id}`}
        description={`Last synced: 2 minutes ago - ID: VHC-8921-XMX - ${vehicle.branch}`}
        actions={
          <>
            <Button asChild variant="outline" className="h-10 gap-2 rounded-lg border-[#c4c7c8] bg-[#fcf8f8] text-[#1c1b1b] hover:bg-[#e5e2e1]">
              <Link to={routePaths.providerVehicles}>
                <ArrowLeft className="size-4" />
                Về đội xe
              </Link>
            </Button>
            <Button variant="outline" className="h-10 gap-2 rounded-lg border-[#c4c7c8] bg-[#fcf8f8] text-[#1c1b1b] hover:bg-[#e5e2e1]">
              <Ban className="size-4" />
              Ngưng hoạt động
            </Button>
            <Button className="h-10 gap-2 rounded-lg bg-[#1c1b1b] text-white hover:bg-[#313030]">
              <Wrench className="size-4" />
              Lên lịch bảo trì
            </Button>
          </>
        }
      />

      <div className="mb-6 flex items-center gap-3">
        <span className="inline-flex items-center gap-2 rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 text-xs font-bold text-emerald-700">
          <span className="size-2 rounded-full bg-emerald-500" />
          Operational
        </span>
        <span className="font-mono text-xs font-medium uppercase tracking-[0.05em] text-[#747878]">{vehicle.tier}</span>
      </div>

      <section className="grid grid-cols-1 gap-4 md:grid-cols-12">
        <div className="rounded-xl border border-[#c4c7c8] bg-white p-4 shadow-sm md:col-span-4">
          <div className="relative overflow-hidden rounded-lg border border-[#c4c7c8] bg-[#f6f3f2]">
            <img
              alt={vehicle.name}
              className="h-56 w-full object-cover"
              src="https://images.unsplash.com/photo-1614200179396-2bdb77ebf81b?auto=format&fit=crop&w=900&q=80"
            />
          </div>
          <div className="mt-4 grid grid-cols-2 gap-2">
            {specs.map(([label, value]) => (
              <div key={label} className="rounded border border-[#c4c7c8] bg-[#fcf8f8] p-3">
                <div className="mb-1 font-mono text-[10px] font-medium uppercase tracking-[0.05em] text-[#747878]">{label}</div>
                <div className="font-semibold text-[#1c1b1b]">{value}</div>
              </div>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 md:col-span-8">
          <MetricPanel icon={<BatteryCharging />} label="Battery Cycles" badge="Pack A / B" value="142" suffix="/ 300 expected" progress={47} helper="Condition: Good" />
          <MetricPanel icon={<CircleDot />} label="Tire Wear Index" badge="Sledgehammer" value="68%" suffix="remaining" progress={68} helper="Est. Replacement: ~45 Sessions" />
          <MetricPanel icon={<Clock3 />} label="Total Runtime" value="124" suffix="hrs" helper="This Month: 18 hrs" />
          <div className="rounded-xl border border-[#c4c7c8] bg-white p-5 shadow-sm">
            <div className="mb-4 flex items-start justify-between">
              <div className="flex items-center gap-2">
                <span className="rounded-lg bg-[#f6f3f2] p-2 text-[#5d5f5f] [&_svg]:size-5">
                  <Radio />
                </span>
                <h3 className="text-sm font-semibold text-[#1c1b1b]">Telemetry Link</h3>
              </div>
              <span className="relative flex size-3">
                <span className="absolute inline-flex size-full animate-ping rounded-full bg-emerald-400 opacity-75" />
                <span className="relative inline-flex size-3 rounded-full bg-emerald-500" />
              </span>
            </div>
            <div className="mt-10 grid grid-cols-2 gap-2">
              <SmallSpec label="Signal" value="-45 dBm" />
              <SmallSpec label="Firmware" value="v2.4.1" />
            </div>
          </div>
        </div>
      </section>

      <section className="mt-16 grid grid-cols-1 gap-4 lg:grid-cols-3">
        <div className="rounded-xl border border-[#c4c7c8] bg-white p-6 shadow-sm lg:col-span-2">
          <div className="mb-6 flex items-center justify-between gap-4">
            <h3 className="text-xl font-bold text-[#1c1b1b]">Motor Temperature History</h3>
            <select className="rounded-md border border-[#c4c7c8] bg-[#fcf8f8] px-2 py-1 text-sm text-[#1c1b1b] outline-none">
              <option>Last 7 Sessions</option>
              <option>Last 30 Sessions</option>
            </select>
          </div>
          <TemperatureChart />
          <div className="mt-8 flex items-center justify-between rounded-lg bg-[#f1edec] px-4 py-3">
            <div className="flex items-center gap-2 text-sm font-medium text-[#1c1b1b]">
              <Thermometer className="size-4 text-[#ba1a1a]" />
              Peak temp reached 165°F in Session S18.
            </div>
            <button className="text-xs font-bold text-[#1c1b1b] underline">View Session</button>
          </div>
        </div>

        <div className="flex max-h-[460px] flex-col overflow-hidden rounded-xl border border-[#c4c7c8] bg-white shadow-sm">
          <div className="flex items-center justify-between border-b border-[#c4c7c8] p-5">
            <h3 className="text-xl font-bold text-[#1c1b1b]">Maintenance Logs</h3>
            <button className="rounded p-1 text-[#747878] hover:bg-[#f1edec]" aria-label="Lọc log">
              <Filter className="size-4" />
            </button>
          </div>
          <div className="flex-1 overflow-y-auto p-2">
            {logs.map((log) => (
              <div key={log.title} className="rounded-lg border-l-2 border-transparent p-3 transition-colors hover:border-[#5d5f5f] hover:bg-[#f6f3f2]">
                <div className="mb-1 flex items-start justify-between gap-3">
                  <span className="text-sm font-semibold text-[#1c1b1b]">{log.title}</span>
                  <span className="font-mono text-[10px] text-[#747878]">{log.date}</span>
                </div>
                <p className="line-clamp-2 text-xs text-[#444748]">{log.detail}</p>
                <div className="mt-2 flex gap-2">
                  {log.meta.map((item) => (
                    <span key={item} className="rounded border border-[#c4c7c8] bg-[#fcf8f8] px-2 py-0.5 font-mono text-[10px] text-[#444748]">
                      {item}
                    </span>
                  ))}
                </div>
              </div>
            ))}
          </div>
          <div className="border-t border-[#c4c7c8] p-3">
            <button className="w-full rounded py-2 text-center text-sm font-medium text-[#5d5f5f] hover:bg-[#f6f3f2]">View Full History</button>
          </div>
        </div>
      </section>
    </ProviderShell>
  )
}

function MetricPanel({ icon, label, badge, value, suffix, progress, helper }: { icon: React.ReactNode; label: string; badge?: string; value: string; suffix: string; progress?: number; helper: string }) {
  return (
    <div className="flex min-h-48 flex-col justify-between rounded-xl border border-[#c4c7c8] bg-white p-5 shadow-sm">
      <div className="mb-4 flex items-start justify-between">
        <div className="flex items-center gap-2">
          <span className="rounded-lg bg-[#f6f3f2] p-2 text-[#5d5f5f] [&_svg]:size-5">{icon}</span>
          <h3 className="text-sm font-semibold text-[#1c1b1b]">{label}</h3>
        </div>
        {badge ? <span className="rounded bg-[#f1edec] px-2 py-1 font-mono text-xs text-[#444748]">{badge}</span> : null}
      </div>
      <div className="flex items-baseline gap-2">
        <span className="text-4xl font-bold text-[#1c1b1b]">{value}</span>
        <span className="text-sm text-[#444748]">{suffix}</span>
      </div>
      {progress ? (
        <div className="mt-4 h-1.5 w-full rounded-full bg-[#e5e2e1]">
          <div className="h-1.5 rounded-full bg-[#5d5f5f]" style={{ width: `${progress}%` }} />
        </div>
      ) : null}
      <p className="mt-2 text-xs text-[#444748]">{helper}</p>
    </div>
  )
}

function SmallSpec({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded border border-[#c4c7c8] bg-[#fcf8f8] p-3">
      <p className="mb-1 font-mono text-[10px] uppercase tracking-[0.05em] text-[#747878]">{label}</p>
      <p className="text-sm font-semibold text-[#1c1b1b]">{value}</p>
    </div>
  )
}

function TemperatureChart() {
  const points = [
    [0, 80],
    [15, 75],
    [30, 60],
    [45, 65],
    [60, 45],
    [75, 50],
    [90, 35],
    [100, 40],
  ]

  return (
    <div className="relative min-h-[270px] overflow-hidden border-b border-l border-[#c4c7c8]/60 pb-2 pl-10 pr-2">
      <div className="absolute left-2 inset-y-0 flex flex-col justify-between py-2 text-right font-mono text-[10px] leading-none text-[#747878]">
        <span>180°</span>
        <span>150°</span>
        <span>120°</span>
        <span>90°</span>
      </div>
      <div className="absolute inset-y-0 left-10 right-0 flex flex-col justify-between py-2">
        {[0, 1, 2, 3].map((line) => (
          <div key={line} className="border-t border-[#c4c7c8]/30" />
        ))}
      </div>
      <svg className="absolute inset-y-0 left-10 right-0 h-full w-[calc(100%-2.5rem)] px-2 pb-2" preserveAspectRatio="none" viewBox="0 0 100 100">
        <rect fill="#ecfdf5" height="60" opacity="0.5" width="100" x="0" y="40" />
        <rect fill="#fff1f2" height="40" opacity="0.45" width="100" x="0" y="0" />
        <polyline fill="none" points={points.map(([x, y]) => `${x},${y}`).join(" ")} stroke="#5d5f5f" strokeWidth="2" />
        {points.slice(1, -1).map(([x, y], index) => (
          <circle key={`${x}-${y}`} cx={x} cy={y} fill={index === 5 ? "#ba1a1a" : "#5d5f5f"} r={index === 5 ? "3" : "2"} />
        ))}
      </svg>
      <div className="absolute bottom-0 left-10 right-0 flex justify-between px-2 font-mono text-[10px] text-[#747878]">
        {["S12", "S13", "S14", "S15", "S16", "S17", "S18"].map((label) => (
          <span key={label}>{label}</span>
        ))}
      </div>
    </div>
  )
}
