import type { ContestRegistration } from "@/features/contests/types"
import { formatContestDateTime, getRegistrationDisplayName, getRegistrationSubtitle } from "@/features/contests/lib/contest-runtime"
import { StaffBadge, StaffButton, StaffCard } from "@/pages/staff/components/StaffUI"

export function ContestCheckInResultCard({
  registration,
  onCheckIn,
  isPending,
}: {
  registration: ContestRegistration | null
  onCheckIn: () => void
  isPending?: boolean
}) {
  return (
    <StaffCard className="space-y-4">
      <h3 className="text-base font-extrabold text-[#1c1b1b]">Kết quả tra cứu</h3>
      {registration ? (
        <>
          <div className="flex flex-wrap items-center gap-2">
            <p className="text-sm font-extrabold text-[#1c1b1b]">{getRegistrationDisplayName(registration)}</p>
            <StaffBadge variant={registration.status === "CHECKED_IN" ? "info" : registration.status === "CONFIRMED" ? "success" : registration.status === "CANCELLED" ? "error" : "warning"}>
              {registration.status}
            </StaffBadge>
            <StaffBadge variant={registration.paymentStatus === "MARKED_PAID" || registration.paymentStatus === "WAIVED" ? "success" : registration.paymentStatus === "PENDING_REVIEW" ? "info" : "warning"}>
              {registration.paymentStatus}
            </StaffBadge>
          </div>
          <div className="space-y-2 text-sm font-semibold text-[#4c4a49]">
            <p>Người thi đấu: {getRegistrationSubtitle(registration) ?? `Registration ${registration.id.slice(0, 8)}`}</p>
            <p>Check-in code: {registration.checkInCode ?? "--"}</p>
            <p>Checked in at: {formatContestDateTime(registration.checkedInAt)}</p>
            <p>Payment status: {registration.paymentStatus}</p>
          </div>
          <StaffButton onClick={onCheckIn} disabled={isPending}>
            {isPending ? "Đang check-in..." : "Xác nhận check-in"}
          </StaffButton>
        </>
      ) : (
        <p className="text-sm font-semibold text-[#6b7280]">Chưa có kết quả tra cứu.</p>
      )}
    </StaffCard>
  )
}
