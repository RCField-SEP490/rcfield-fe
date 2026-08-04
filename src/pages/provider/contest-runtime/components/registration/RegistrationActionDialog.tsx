import { Button } from "@/shared/ui/button"
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/shared/ui/dialog"
import { Label } from "@/shared/ui/label"
import { Textarea } from "@/shared/ui/textarea"
import type { RegistrationActionKind } from "../RegistrationRowActions"

const REJECT_REASON_MIN = 5

type ActionCopy = {
  title: string
  description: string
  reasonLabel: string
  placeholder: string
  /** Lý do có được gửi tới VĐV không — nếu có thì bắt buộc phải viết. */
  reasonRequired: boolean
  confirmLabel: string
  destructive: boolean
}

const ACTION_COPY: Record<RegistrationActionKind, ActionCopy> = {
  markPaid: {
    title: "Đánh dấu đã thu tiền mặt",
    description:
      "Dùng khi bạn đã nhận tiền trực tiếp tại quán và cần ghi nhận lại trên hệ thống.",
    reasonLabel: "Ghi chú thu tiền",
    placeholder: "Ví dụ: thu tại quầy lúc 19:30, người thu: Trí",
    reasonRequired: false,
    confirmLabel: "Xác nhận đã thu",
    destructive: false,
  },
  waive: {
    title: "Miễn lệ phí tham gia",
    description: "Người chơi vào giải mà không phải đóng lệ phí.",
    reasonLabel: "Lý do miễn phí",
    placeholder: "Ví dụ: khách mời của giải",
    reasonRequired: false,
    confirmLabel: "Miễn lệ phí",
    destructive: false,
  },
  approve: {
    title: "Duyệt xe vào giải",
    description:
      "Xác nhận xe cá nhân đạt chuẩn thi đấu. Người chơi sẽ nhận email kèm mã điểm danh.",
    reasonLabel: "Ghi chú duyệt",
    placeholder: "Ví dụ: xe đúng class, không có chi tiết sắc nhọn",
    reasonRequired: false,
    confirmLabel: "Duyệt xe",
    destructive: false,
  },
  reject: {
    title: "Từ chối đăng ký",
    description:
      "Người chơi bị loại khỏi giải và nhận được thông báo kèm đúng lý do bạn viết ở đây.",
    reasonLabel: "Lý do từ chối",
    placeholder: "Ví dụ: xe không đúng class quy định của giải",
    reasonRequired: true,
    confirmLabel: "Từ chối đăng ký",
    destructive: true,
  },
  cancel: {
    title: "Huỷ đăng ký",
    description: "Gỡ người chơi khỏi danh sách và trả lại suất cho giải.",
    reasonLabel: "Lý do huỷ",
    placeholder: "Ví dụ: người chơi báo bận, xin rút",
    reasonRequired: false,
    confirmLabel: "Huỷ đăng ký",
    destructive: true,
  },
}

export function RegistrationActionDialog({
  kind,
  open,
  onOpenChange,
  reason,
  onReasonChange,
  onConfirm,
}: {
  kind: RegistrationActionKind | null
  open: boolean
  onOpenChange: (open: boolean) => void
  reason: string
  onReasonChange: (value: string) => void
  onConfirm: () => Promise<void>
}) {
  const copy = kind ? ACTION_COPY[kind] : null
  const trimmedReason = reason.trim()
  const reasonTooShort =
    Boolean(copy?.reasonRequired) && trimmedReason.length < REJECT_REASON_MIN
  const showReasonError = reasonTooShort && trimmedReason.length > 0

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{copy?.title ?? "Cập nhật đăng ký"}</DialogTitle>
        </DialogHeader>

        {copy ? (
          <p className="text-sm font-semibold text-[#5d5f5f]">
            {copy.description}
          </p>
        ) : null}

        <div className="space-y-2">
          <Label className="text-sm font-bold text-[#1c1b1b]">
            {copy?.reasonLabel ?? "Ghi chú / lý do"}
            {copy?.reasonRequired ? (
              <span className="ml-1 text-red-600">*</span>
            ) : (
              <span className="ml-1 font-semibold text-[#747878]">
                (không bắt buộc)
              </span>
            )}
          </Label>
          <Textarea
            rows={4}
            value={reason}
            placeholder={copy?.placeholder}
            onChange={(event) => onReasonChange(event.target.value)}
          />
          {showReasonError ? (
            <p className="text-xs font-semibold text-red-600">
              Lý do cần tối thiểu {REJECT_REASON_MIN} ký tự.
            </p>
          ) : null}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Quay lại
          </Button>
          <Button
            disabled={reasonTooShort}
            className={
              copy?.destructive
                ? "bg-red-600 text-white hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-50"
                : "disabled:cursor-not-allowed disabled:opacity-50"
            }
            onClick={() => void onConfirm()}
          >
            {copy?.confirmLabel ?? "Xác nhận"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
