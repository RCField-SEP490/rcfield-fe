import type { ContestRegistration } from "@/features/contests/types"
import { Search } from "lucide-react"
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

/**
 * Một dải số thay cho tám thẻ.
 *
 * Bốn con số đếm người là thứ provider liếc mỗi lần mở màn; bốn con số tiền chỉ
 * để đối chiếu cuối buổi nên rút thành một dòng chữ bên phải thay vì bốn thẻ
 * to ngang hàng, khiến phần quan trọng bị chìm.
 */
export function RegistrationSummary({
  summary,
}: {
  summary: {
    total: number
    pending: number
    confirmed: number
    checkedIn: number
    revenue: {
      expected: number
      paid: number
      pending: number
      waived: number
    }
  }
}) {
  const counts = [
    { label: "Tổng đăng ký", value: summary.total },
    { label: "Chờ duyệt", value: summary.pending },
    { label: "Đã xác nhận", value: summary.confirmed },
    { label: "Đã điểm danh", value: summary.checkedIn },
  ]

  return (
    <div className="flex flex-col gap-4 rounded-xl border border-[#e5e2e1] bg-white px-5 py-4 xl:flex-row xl:items-center xl:justify-between">
      <div className="flex flex-wrap gap-x-8 gap-y-3">
        {counts.map((item) => (
          <div key={item.label}>
            <p className="text-2xl font-extrabold leading-none text-[#1c1b1b]">
              {item.value}
            </p>
            <p className="mt-1 text-[10px] font-extrabold uppercase tracking-wider text-[#747878]">
              {item.label}
            </p>
          </div>
        ))}
      </div>

      <div className="text-xs font-semibold text-[#5d5f5f] xl:text-right">
        <p>
          Đã thu{" "}
          <span className="font-extrabold text-emerald-700">
            {formatCurrency(summary.revenue.paid)}
          </span>
          {summary.revenue.pending > 0 ? (
            <>
              {"  ·  Chờ thu "}
              <span className="font-extrabold text-amber-700">
                {formatCurrency(summary.revenue.pending)}
              </span>
            </>
          ) : null}
          {summary.revenue.waived > 0 ? (
            <>
              {"  ·  Miễn "}
              <span className="font-extrabold text-[#1c1b1b]">
                {formatCurrency(summary.revenue.waived)}
              </span>
            </>
          ) : null}
        </p>
        <p className="mt-0.5 text-[#747878]">
          Dự kiến thu {formatCurrency(summary.revenue.expected)}
        </p>
      </div>
    </div>
  )
}

function formatCurrency(value: number) {
  return new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND", maximumFractionDigits: 0 }).format(value)
}
