import { useState } from "react"
import type { ContestRegistration } from "@/features/contests/types"
import { formatContestDateTime, getRegistrationDisplayName, getRegistrationSubtitle } from "@/features/contests/lib/contest-runtime"
import { getPaymentStatusLabel, getRegistrationStatusLabel } from "@/features/contests/lib/contest-status"
import { StaffBadge, StaffButton, StaffCard } from "@/pages/staff/components/StaffUI"

export function ContestCheckInResultCard({
  registration,
  onCheckIn,
  isPending,
}: {
  registration: ContestRegistration | null
  onCheckIn: (byocConfirmed?: boolean) => void
  isPending?: boolean
}) {
  const [byocConfirmed, setByocConfirmed] = useState(false)
  const isByoc = registration?.vehicleSource === "BYOC"
  const byocDeclaration = (registration?.metadata?.byoc_declaration ?? null) as {
    vehicle_name?: string | null
    vehicle_brand?: string | null
    vehicle_class?: string | null
    notes?: string | null
  } | null
  const canCheckIn = !isByoc || byocConfirmed

  return (
    <StaffCard className="space-y-4">
      <h3 className="text-base font-extrabold text-[#1c1b1b]">Kết quả tra cứu</h3>
      {registration ? (
        <>
          <div className="flex flex-wrap items-center gap-2">
            <p className="text-sm font-extrabold text-[#1c1b1b]">{getRegistrationDisplayName(registration)}</p>
            <StaffBadge variant={registration.status === "CHECKED_IN" ? "info" : registration.status === "CONFIRMED" ? "success" : registration.status === "CANCELLED" ? "error" : "warning"}>
              {getRegistrationStatusLabel(registration.status)}
            </StaffBadge>
            <StaffBadge variant={registration.paymentStatus === "MARKED_PAID" || registration.paymentStatus === "WAIVED" ? "success" : registration.paymentStatus === "PENDING_REVIEW" ? "info" : "warning"}>
              {getPaymentStatusLabel(registration.paymentStatus)}
            </StaffBadge>
            <StaffBadge variant={isByoc ? "warning" : "info"}>
              {isByoc ? "Xe cá nhân (BYOC)" : "Xe thuê"}
            </StaffBadge>
          </div>
          <div className="space-y-2 text-sm font-semibold text-[#4c4a49]">
            <p>Ngườ thi đấu: {getRegistrationSubtitle(registration) ?? `Mã đăng ký ${registration.id.slice(0, 8)}`}</p>
            <p>Mã điểm danh: {registration.checkInCode ?? "--"}</p>
            <p>Đã điểm danh lúc: {formatContestDateTime(registration.checkedInAt)}</p>
            <p>Trạng thái thanh toán: {getPaymentStatusLabel(registration.paymentStatus)}</p>
          </div>

          {isByoc ? (
            <div className="rounded-xl border border-amber-200 bg-amber-50 p-4 space-y-3">
              <h4 className="text-sm font-extrabold text-amber-900">Xác nhận xe cá nhân (BYOC)</h4>
              <div className="grid gap-2 text-sm text-amber-800">
                <p><span className="font-semibold">Tên xe:</span> {byocDeclaration?.vehicle_name ?? "--"}</p>
                <p><span className="font-semibold">Hãng:</span> {byocDeclaration?.vehicle_brand ?? "--"}</p>
                <p><span className="font-semibold">Class:</span> {byocDeclaration?.vehicle_class ?? "--"}</p>
                {byocDeclaration?.notes ? (
                  <p><span className="font-semibold">Ghi chú:</span> {byocDeclaration.notes}</p>
                ) : null}
              </div>
              <label className="flex items-start gap-2 text-sm text-amber-900 cursor-pointer">
                <input
                  type="checkbox"
                  checked={byocConfirmed}
                  onChange={(e) => setByocConfirmed(e.target.checked)}
                  className="mt-0.5"
                />
                <span>
                  Tôi xác nhận xe cá nhân đã kiểm tra đạt chuẩn thi đấu và đúng như khai báo.
                </span>
              </label>
            </div>
          ) : null}

          <StaffButton
            onClick={() => onCheckIn(isByoc ? byocConfirmed : undefined)}
            disabled={isPending || !canCheckIn}
          >
            {isPending ? "Đang điểm danh..." : "Xác nhận điểm danh"}
          </StaffButton>
          {isByoc && !byocConfirmed ? (
            <p className="text-xs text-amber-700">
              Vui lòng xác nhận xe cá nhân đạt chuẩn trước khi điểm danh.
            </p>
          ) : null}
        </>
      ) : (
        <p className="text-sm font-semibold text-[#6b7280]">Chưa có kết quả tra cứu.</p>
      )}
    </StaffCard>
  )
}
