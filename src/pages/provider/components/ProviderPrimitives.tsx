import { Link } from "react-router"
import type { ReactNode } from "react"
import { ArrowRight, CalendarClock, Download, Search, TrendingDown, TrendingUp } from "lucide-react"

import { NotificationBell } from "@/features/notifications/components/NotificationBell"
import type { ProviderTone } from "@/pages/provider/data"
import { branchDetailPath, branches } from "@/pages/provider/data"
import { cn } from "@/shared/lib/utils"
import { Badge } from "@/shared/ui/badge"
import { Button } from "@/shared/ui/button"

export function ProviderHeader({
  title,
  description,
  actionLabel,
  actionIcon = <Download className="size-5" />,
}: {
  title: string
  description: string
  actionLabel: string
  actionIcon?: ReactNode
}) {
  return (
    <ProviderPageHeader
      title={title}
      description={description}
      actions={
        <>
          <Button variant="outline" className="h-10 gap-2 rounded-lg border-[#c4c7c8] bg-[#f1edec] text-[#1c1b1b] hover:bg-[#e5e2e1]">
            <CalendarClock className="size-5" />
            Tháng này
          </Button>
          <Button className="h-10 gap-2 rounded-lg bg-[#1c1b1b] text-white hover:bg-[#313030]">
            {actionIcon}
            {actionLabel}
          </Button>
        </>
      }
    />
  )
}
ProviderHeader.displayName = "ProviderHeader"

export function ProviderPageHeader({
  title,
  description,
  actions,
  flush: _flush = false,
}: {
  title: string
  description: string
  actions?: ReactNode
  flush?: boolean
}) {
  return (
    <header
      className={cn(
        "sticky top-0 z-40 flex w-full flex-col gap-4 border-b border-[#c4c7c8] bg-[#fcf8f8]/80 px-4 py-4 backdrop-blur-md md:flex-row md:items-center md:justify-between md:px-6"
      )}
    >
      <div className="min-w-0">
        <h2 className="text-[32px] font-bold leading-tight tracking-tight text-[#1c1b1b]">{title}</h2>
        <p className="mt-1 text-sm font-medium text-[#444748]">{description}</p>
      </div>
      <div className="flex flex-wrap items-center gap-3 md:justify-end">
        {actions}
        <NotificationBell />
        <div className="size-10 shrink-0 overflow-hidden rounded-full border border-[#c4c7c8] bg-white">
          <img
            alt="Avatar"
            className="h-full w-full object-cover"
            src="https://lh3.googleusercontent.com/aida-public/AB6AXuC9tptYWoLiFpiMQwQxABxTxNfHVkdFj8DLprZIx96_JpdoFqW-LfmzW0yrXvERuk4Bc0JSiStL-IAdqDFnASgvEZM3MNDRNoD_Xx8DC-albyTmvrJCFM67T8C629f0yFQp_e6Drwvt3XPxHv3xl2hUeMEECllu33L1YoGB6xxbAD-IxiTsP0lylibWcy-VD8eIUqheIU8nCJYDIrtCepHsMhCl8xzQb5tNkRrQIRjh_q1-wqh6z0gEe-UQ2cCpuk"
          />
        </div>
      </div>
    </header>
  )
}
ProviderPageHeader.displayName = "ProviderPageHeader"

export function MetricCard({ label, value, helper, icon, tone }: { label: string; value: string; helper: string; icon: ReactNode; tone: ProviderTone }) {
  return (
    <article className="flex min-h-44 flex-col justify-between rounded-xl border border-[#c4c7c8] bg-white p-6">
      <div className="mb-4 flex items-start justify-between gap-4">
        <span className="font-mono text-xs font-medium uppercase tracking-[0.05em] text-[#747878]">{label}</span>
        <span className="text-[#5d5f5f] [&_svg]:size-6">{icon}</span>
      </div>
      <div>
        <div className="text-3xl font-semibold leading-tight tracking-tight text-[#1c1b1b]">{value}</div>
        <div className={cn("mt-3 flex items-center gap-1.5 text-sm font-medium", toneText(tone))}>
          {tone === "danger" ? <TrendingDown className="size-4" /> : <TrendingUp className="size-4" />}
          <span>{helper}</span>
        </div>
      </div>
    </article>
  )
}

export function Panel({ children, className }: { children: ReactNode; className?: string }) {
  return <section className={cn("rounded-xl border border-[#c4c7c8] bg-white p-6", className)}>{children}</section>
}

export function PanelTitle({ title, subtitle, action }: { title: string; subtitle?: string; action?: ReactNode }) {
  return (
    <div className="mb-6 flex items-start justify-between gap-4">
      <div>
        <h3 className="text-2xl font-semibold leading-tight tracking-tight text-[#1c1b1b]">{title}</h3>
        {subtitle ? <p className="mt-1 text-sm font-medium text-[#444748]">{subtitle}</p> : null}
      </div>
      {action ? <span className="text-[#5d5f5f]">{action}</span> : null}
    </div>
  )
}

export function SearchBar() {
  return (
    <div className="mb-5 flex h-11 items-center gap-3 rounded-lg border border-[#c4c7c8] bg-[#f6f3f2] px-3 text-[#747878]">
      <Search className="size-5" />
      <span className="text-sm font-medium">Tìm kiếm hoặc lọc dữ liệu</span>
    </div>
  )
}

export function RevenueBars() {
  const bars = [
    ["T2", 40],
    ["T3", 55],
    ["T4", 45],
    ["T5", 60],
    ["T6", 75],
    ["T7", 95],
    ["CN", 85],
  ] as const

  return (
    <div className="relative min-h-[320px] overflow-hidden rounded-lg bg-[#fcf8f8] px-3 pb-10 pt-6 sm:px-6">
      <div className="absolute inset-x-4 bottom-12 top-6 flex flex-col justify-between text-xs font-medium text-[#747878]">
        {["40M", "30M", "20M", "10M", "0"].map((line) => (
          <div key={line} className="flex items-center gap-3 border-b border-[#e5e2e1]">
            <span className="w-9 text-right font-mono">{line}</span>
          </div>
        ))}
      </div>
      <div className="relative z-10 flex h-[260px] items-end justify-around gap-2 pl-10 sm:gap-4 sm:pl-12">
        {bars.map(([label, value]) => (
          <div key={label} className="group flex h-full flex-1 flex-col items-center justify-end gap-2">
            <div className="relative flex w-full max-w-11 items-end justify-center" style={{ height: `${value}%` }}>
              <div className={cn("h-full w-full rounded-t-lg transition-opacity group-hover:opacity-80", label === "T7" ? "bg-[#1c1b1b]" : label === "CN" ? "bg-[#5d5e66]" : "bg-[#c6c6c7]")} />
            </div>
            <span className={cn("font-mono text-xs font-medium", label === "T7" ? "text-[#1c1b1b]" : "text-[#747878]")}>{label}</span>
          </div>
        ))}
      </div>
    </div>
  )
}

export function BranchList({ compact = false }: { compact?: boolean }) {
  return (
    <div className="space-y-3">
      {branches.map((branch) => (
        <div key={branch.name} className="rounded-lg border border-[#e5e2e1] bg-white p-4 transition-colors hover:bg-[#fcf8f8]">
          <div className="mb-4 flex items-start justify-between gap-3">
            <div>
              <div className="font-semibold text-[#1c1b1b]">{branch.name}</div>
              <div className="mt-1 text-xs font-medium text-[#444748]">{branch.area}</div>
            </div>
            <StatusBadge status={branch.status} />
          </div>
          <div className="grid grid-cols-3 gap-3">
            <InlineMetric label="Doanh thu" value={branch.revenue} />
            <InlineMetric label="Lấp đầy" value={`${branch.occupancy}%`} align="right" />
            {!compact ? <InlineMetric label="Đội xe" value={`${branch.vehicles} xe`} align="right" /> : null}
          </div>
          {!compact ? (
            <Button asChild variant="ghost" className="mt-3 h-9 px-0 text-sm font-semibold text-[#1c1b1b] hover:bg-transparent">
              <Link to={branchDetailPath(branch.name)}>
                Xem chi tiết
                <ArrowRight className="ml-1 size-4" />
              </Link>
            </Button>
          ) : null}
          <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-[#e5e2e1]">
            <div className="h-full rounded-full bg-[#1c1b1b]" style={{ width: `${branch.occupancy}%` }} />
          </div>
        </div>
      ))}
    </div>
  )
}

export function ProviderTable({ columns, rows }: { columns: string[]; rows: Array<Array<ReactNode>> }) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[760px] border-separate border-spacing-0 text-left text-sm">
        <thead>
          <tr>
            {columns.map((column) => (
              <th key={column} className="border-b border-[#c4c7c8] px-3 py-3 font-mono text-xs font-medium uppercase tracking-[0.05em] text-[#747878]">
                {column}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, index) => (
            <tr key={index} className="hover:bg-[#fcf8f8]">
              {row.map((cell, cellIndex) => (
                <td key={cellIndex} className="border-b border-[#e5e2e1] px-3 py-3 font-medium text-[#1c1b1b]">
                  {cell}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

export function InlineMetric({ label, value, align }: { label: string; value: string; align?: "right" }) {
  return (
    <div className={cn(align === "right" && "text-right")}>
      <div className="mb-1 font-mono text-[10px] font-medium uppercase tracking-[0.05em] text-[#747878]">{label}</div>
      <div className="font-semibold text-[#1c1b1b]">{value}</div>
    </div>
  )
}

export function StatusBadge({ status }: { status: string }) {
  const tone: ProviderTone = status.match(/Bảo trì|Sắp hết|Chờ|thiếu|Tạm|Cần/i)
    ? "warning"
    : status.match(/Đang thuê|Đang kiểm|Đang làm/i)
      ? "info"
      : status.match(/Sự cố|hết/i)
        ? "danger"
        : "success"

  return <Badge className={cn("border font-medium", badgeTone(tone))}>{status}</Badge>
}

export function StateBadge({ state }: { state: string }) {
  const tone: ProviderTone = state === "PENDING" || state === "EXTENDING" ? "warning" : state === "CHECKING_OUT" ? "info" : "success"
  return <Badge className={cn("border font-medium", badgeTone(tone))}>{state}</Badge>
}

export function toneText(tone: ProviderTone) {
  return {
    success: "text-emerald-700",
    warning: "text-amber-700",
    danger: "text-red-600",
    info: "text-blue-700",
    neutral: "text-[#444748]",
  }[tone]
}

export function tonePill(tone: ProviderTone) {
  return {
    success: "bg-emerald-50 text-emerald-700",
    warning: "bg-amber-50 text-amber-700",
    danger: "bg-red-50 text-red-700",
    info: "bg-blue-50 text-blue-700",
    neutral: "bg-[#e5e2e1] text-[#444748]",
  }[tone]
}

export function badgeTone(tone: ProviderTone) {
  return {
    success: "border-emerald-200 bg-emerald-50 text-emerald-700",
    warning: "border-amber-200 bg-amber-50 text-amber-700",
    danger: "border-red-200 bg-red-50 text-red-700",
    info: "border-blue-200 bg-blue-50 text-blue-700",
    neutral: "border-[#c4c7c8] bg-[#f6f3f2] text-[#444748]",
  }[tone]
}
