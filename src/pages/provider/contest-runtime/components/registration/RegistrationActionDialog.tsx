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
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{dialogTitle(kind)}</DialogTitle>
        </DialogHeader>
        <div className="space-y-2">
          <Label className="text-sm font-bold text-[#1c1b1b]">
            Ghi chú / lý do
          </Label>
          <Textarea
            rows={4}
            value={reason}
            onChange={(event) => onReasonChange(event.target.value)}
          />
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Hủy
          </Button>
          <Button onClick={() => void onConfirm()}>Xác nhận</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

function dialogTitle(kind: RegistrationActionKind | null) {
  switch (kind) {
    case "markPaid":
      return "Đánh dấu đã thu lệ phí"
    case "waive":
      return "Miễn lệ phí tham gia"
    case "approve":
      return "Duyệt người chơi vào giải"
    case "reject":
      return "Từ chối đăng ký"
    case "cancel":
      return "Hủy đăng ký"
    default:
      return "Cập nhật đăng ký"
  }
}
