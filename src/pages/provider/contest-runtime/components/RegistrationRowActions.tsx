import type { ContestRegistration } from "@/features/contests/types"
import { Button } from "@/shared/ui/button"

export type RegistrationActionKind =
  | "markPaid"
  | "waive"
  | "approve"
  | "reject"
  | "cancel"

function getRegistrationActions(registration: ContestRegistration) {
  const editablePaymentStatuses: ContestRegistration["paymentStatus"][] = [
    "PENDING_PAYMENT",
    "PENDING_REVIEW",
  ]
  const canEditBeforeCheckIn =
    registration.status === "PENDING" || registration.status === "CONFIRMED"

  return {
    canMarkPaid:
      canEditBeforeCheckIn &&
      editablePaymentStatuses.includes(registration.paymentStatus),
    canWaive:
      canEditBeforeCheckIn &&
      editablePaymentStatuses.includes(registration.paymentStatus),
    canApprove: registration.status === "PENDING",
    canReject: registration.status === "PENDING",
    canCancel: registration.status === "PENDING" || registration.status === "CONFIRMED",
  }
}

export function RegistrationRowActions({
  registration,
  onAction,
  onCheckIn,
  checkInBlockedReason,
}: {
  registration: ContestRegistration
  onAction: (kind: RegistrationActionKind, registration: ContestRegistration) => void
  onCheckIn?: (registration: ContestRegistration) => void
  /** Lý do giải chưa cho điểm danh; có giá trị nghĩa là khoá nút kèm giải thích. */
  checkInBlockedReason?: string
}) {
  const actions = getRegistrationActions(registration)

  return (
    <div className="flex flex-wrap gap-2 xl:max-w-[440px] xl:justify-end">
      <TinyAction
        label="Đánh dấu đã thu"
        disabled={!actions.canMarkPaid}
        onClick={() => onAction("markPaid", registration)}
      />
      <TinyAction
        label="Miễn phí"
        disabled={!actions.canWaive}
        onClick={() => onAction("waive", registration)}
      />
      <Button
        className="h-8 rounded-lg bg-emerald-600 px-3 text-xs text-white hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-50"
        disabled={!actions.canApprove}
        onClick={() => onAction("approve", registration)}
      >
        Duyệt
      </Button>
      <Button
        variant="outline"
        className="h-8 rounded-lg border-red-200 bg-red-50 px-3 text-xs text-red-700 hover:bg-red-100 disabled:cursor-not-allowed disabled:opacity-50"
        disabled={!actions.canReject}
        onClick={() => onAction("reject", registration)}
      >
        Từ chối
      </Button>
      <Button
        variant="outline"
        className="h-8 rounded-lg border-[#c4c7c8] bg-white px-3 text-xs text-[#1c1b1b] hover:bg-[#f6f3f2] disabled:cursor-not-allowed disabled:opacity-50"
        disabled={!actions.canCancel}
        onClick={() => onAction("cancel", registration)}
      >
        Hủy đăng ký
      </Button>
      {onCheckIn ? (
        <Button
          variant="outline"
          className="h-8 rounded-lg border-blue-200 bg-blue-50 px-3 text-xs font-bold text-blue-700 hover:bg-blue-100 disabled:cursor-not-allowed disabled:opacity-50"
          disabled={registration.status !== "CONFIRMED" || Boolean(checkInBlockedReason)}
          title={checkInBlockedReason}
          onClick={() => onCheckIn(registration)}
        >
          Điểm danh
        </Button>
      ) : null}
    </div>
  )
}

function TinyAction({
  label,
  onClick,
  disabled,
}: {
  label: string
  onClick: () => void
  disabled?: boolean
}) {
  return (
    <Button
      variant="outline"
      className="h-8 rounded-lg border-[#c4c7c8] bg-white px-3 text-xs text-[#1c1b1b] hover:bg-[#f6f3f2] disabled:cursor-not-allowed disabled:opacity-50"
      disabled={disabled}
      onClick={onClick}
    >
      {label}
    </Button>
  )
}
