import type { ContestRegistration } from "@/features/contests/types"
import { Button } from "@/shared/ui/button"

export type RegistrationActionKind =
  | "markPaid"
  | "waive"
  | "approve"
  | "reject"
  | "cancel"
  | "confirmRefund"

function getRegistrationActions(registration: ContestRegistration) {
  const editablePaymentStatuses: ContestRegistration["paymentStatus"][] = [
    "PENDING_PAYMENT",
    "PENDING_REVIEW",
  ]
  const canEditBeforeCheckIn =
    registration.status === "PENDING" || registration.status === "CONFIRMED"
  const metadata = (registration.metadata ?? {}) as {
    refund_needed?: boolean
    refund_txn_id?: string
  }
  const canConfirmRefund =
    registration.status === "CANCELLED" &&
    metadata.refund_needed === true &&
    typeof metadata.refund_txn_id === "string"

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
    canConfirmRefund,
  }
}

export function RegistrationRowActions({
  registration,
  onAction,
}: {
  registration: ContestRegistration
  onAction: (kind: RegistrationActionKind, registration: ContestRegistration) => void
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
        className="h-8 rounded-lg border-emerald-200 bg-emerald-50 px-3 text-xs text-emerald-700 hover:bg-emerald-100 disabled:cursor-not-allowed disabled:opacity-50"
        disabled={!actions.canConfirmRefund}
        onClick={() => onAction("confirmRefund", registration)}
      >
        Xác nhận hoàn tiền
      </Button>
      <Button
        variant="outline"
        className="h-8 rounded-lg border-[#c4c7c8] bg-white px-3 text-xs text-[#1c1b1b] hover:bg-[#f6f3f2] disabled:cursor-not-allowed disabled:opacity-50"
        disabled={!actions.canCancel}
        onClick={() => onAction("cancel", registration)}
      >
        Hủy đăng ký
      </Button>
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
