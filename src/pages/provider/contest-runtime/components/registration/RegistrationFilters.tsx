import type { ContestRegistration } from "@/features/contests/types"
import {
  AlertTriangle,
  BadgeCheck,
  CircleDollarSign,
  Search,
  TicketSlash,
} from "lucide-react"
import { Input } from "@/shared/ui/input"

export function RegistrationFilters({
  search,
  onSearchChange,
  statusFilter,
  onStatusFilterChange,
  paymentFilter,
  onPaymentFilterChange,
}: {
  search: string
  onSearchChange: (value: string) => void
  statusFilter: "ALL" | ContestRegistration["status"]
  onStatusFilterChange: (value: "ALL" | ContestRegistration["status"]) => void
  paymentFilter: "ALL" | ContestRegistration["paymentStatus"]
  onPaymentFilterChange: (value: "ALL" | ContestRegistration["paymentStatus"]) => void
}) {
  return (
    <div className="mb-4 grid gap-3 xl:grid-cols-[minmax(0,1.4fr)_220px_220px]">
      <div className="relative">
        <Search className="absolute left-3 top-3.5 size-4 text-[#747878]" />
        <Input
          value={search}
          onChange={(event) => onSearchChange(event.target.value)}
          placeholder="Tìm theo tên, email, mã check-in hoặc registration id"
          className="pl-9"
        />
      </div>
      <select
        className="h-10 rounded-lg border border-[#c4c7c8] bg-white px-3 text-sm"
        value={statusFilter}
        onChange={(event) =>
          onStatusFilterChange(event.target.value as typeof statusFilter)
        }
      >
        <option value="ALL">Tất cả trạng thái</option>
        <option value="PENDING">PENDING</option>
        <option value="CONFIRMED">CONFIRMED</option>
        <option value="CHECKED_IN">CHECKED_IN</option>
        <option value="CANCELLED">CANCELLED</option>
      </select>
      <select
        className="h-10 rounded-lg border border-[#c4c7c8] bg-white px-3 text-sm"
        value={paymentFilter}
        onChange={(event) =>
          onPaymentFilterChange(event.target.value as typeof paymentFilter)
        }
      >
        <option value="ALL">Tất cả thanh toán</option>
        <option value="NOT_REQUIRED">NOT_REQUIRED</option>
        <option value="PENDING_PAYMENT">PENDING_PAYMENT</option>
        <option value="PENDING_REVIEW">PENDING_REVIEW</option>
        <option value="WAIVED">WAIVED</option>
        <option value="MARKED_PAID">MARKED_PAID</option>
      </select>
    </div>
  )
}

export function RegistrationSummary({
  summary,
}: {
  summary: {
    total: number
    pending: number
    confirmed: number
    checkedIn: number
  }
}) {
  return (
    <div className="grid gap-4 lg:grid-cols-4">
      <SummaryCard
        label="Tổng đăng ký"
        value={String(summary.total)}
        icon={<BadgeCheck className="size-4" />}
      />
      <SummaryCard
        label="Chờ duyệt"
        value={String(summary.pending)}
        icon={<AlertTriangle className="size-4" />}
      />
      <SummaryCard
        label="Đã xác nhận"
        value={String(summary.confirmed)}
        icon={<CircleDollarSign className="size-4" />}
      />
      <SummaryCard
        label="Đã check-in"
        value={String(summary.checkedIn)}
        icon={<TicketSlash className="size-4" />}
      />
    </div>
  )
}

function SummaryCard({
  label,
  value,
  icon,
}: {
  label: string
  value: string
  icon: React.ReactNode
}) {
  return (
    <div className="rounded-xl border border-[#c4c7c8] bg-white p-4 shadow-sm">
      <div className="mb-3 flex items-center justify-between gap-2">
        <span className="text-xs font-extrabold uppercase tracking-wider text-[#747878]">
          {label}
        </span>
        <span className="text-[#5d5f5f]">{icon}</span>
      </div>
      <div className="text-2xl font-extrabold text-[#1c1b1b]">{value}</div>
    </div>
  )
}
