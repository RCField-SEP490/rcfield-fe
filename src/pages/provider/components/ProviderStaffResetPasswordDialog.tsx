import { useState, useEffect } from "react"
import { ShieldAlert, Copy, Check, Key } from "lucide-react"
import { toast } from "sonner"

import type { StaffUser } from "@/features/staff/types"
import { Button } from "@/shared/ui/button"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/shared/ui/dialog"

type ProviderStaffResetPasswordDialogProps = {
  open: boolean
  staff: StaffUser | null
  onOpenChange: (open: boolean) => void
  onConfirm: () => Promise<string>
}

export function ProviderStaffResetPasswordDialog({
  open,
  staff,
  onOpenChange,
  onConfirm,
}: ProviderStaffResetPasswordDialogProps) {
  const [isResetting, setIsResetting] = useState(false)
  const [tempPassword, setTempPassword] = useState<string | null>(null)
  const [copied, setCopied] = useState(false)

  // Reset local state when dialog closes
  useEffect(() => {
    if (!open) {
      setTempPassword(null)
      setIsResetting(false)
      setCopied(false)
    }
  }, [open])

  if (!staff) return null

  const handleReset = async () => {
    setIsResetting(true)
    try {
      const password = await onConfirm()
      setTempPassword(password)
    } catch {
      toast.error("Không thể đặt lại mật khẩu. Vui lòng thử lại sau.")
    } finally {
      setIsResetting(false)
    }
  }

  const copyToClipboard = async () => {
    if (!tempPassword) return
    try {
      await navigator.clipboard.writeText(tempPassword)
      setCopied(true)
      toast.success("Đã sao chép mật khẩu tạm!")
      setTimeout(() => setCopied(false), 2000)
    } catch {
      toast.error("Không thể sao chép mật khẩu.")
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg rounded-2xl bg-white p-6 shadow-2xl border-none">
        {tempPassword ? (
          // Stage 2: Display Temporary Password
          <div className="space-y-4">
            <DialogHeader className="text-center">
              <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-orange-100 text-orange-600 mb-3 animate-bounce">
                <Key className="h-6 w-6" />
              </div>
              <DialogTitle className="text-xl font-bold text-slate-900">Mật khẩu đã đặt lại!</DialogTitle>
              <DialogDescription className="text-sm font-medium text-slate-500 mt-1">
                Đây là mật khẩu tạm thời mới của <strong>{staff.fullName}</strong>. Mật khẩu này chỉ được hiển thị <strong>DUY NHẤT MỘT LẦN</strong>.
              </DialogDescription>
            </DialogHeader>

            <div className="mt-4 flex flex-col items-center justify-center rounded-xl border-2 border-dashed border-orange-200 bg-orange-50/30 p-5 font-mono">
              <span className="text-xs font-bold text-slate-500 mb-2">MẬT KHẨU TẠM THỜI</span>
              <span className="text-2xl font-black tracking-wider text-orange-600 select-all">
                {tempPassword}
              </span>
            </div>

            <div className="mt-4 flex flex-col gap-2">
              <Button
                type="button"
                onClick={copyToClipboard}
                className="w-full flex items-center justify-center gap-2 bg-slate-950 text-white font-bold h-10 hover:bg-slate-900 transition-colors"
              >
                {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                {copied ? "Đã sao chép!" : "Sao chép mật khẩu tạm"}
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
                className="w-full h-10 font-bold border-slate-200 text-slate-700 hover:bg-slate-50"
              >
                Đóng
              </Button>
            </div>
          </div>
        ) : (
          // Stage 1: Confirmation Warning
          <div className="space-y-4">
            <DialogHeader>
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-red-100 text-red-600 mb-3">
                <ShieldAlert className="h-6 w-6" />
              </div>
              <DialogTitle className="text-lg font-bold text-slate-900">
                Đặt lại mật khẩu nhân viên?
              </DialogTitle>
              <DialogDescription className="text-sm font-medium text-slate-500 mt-1">
                Bạn có chắc chắn muốn đặt lại mật khẩu cho nhân viên <strong>{staff.fullName}</strong> ({staff.email})? Mật khẩu cũ sẽ lập tức bị hủy bỏ và không thể khôi phục.
              </DialogDescription>
            </DialogHeader>

            <DialogFooter className="mt-6 flex gap-2 sm:justify-end">
              <Button
                type="button"
                variant="outline"
                disabled={isResetting}
                onClick={() => onOpenChange(false)}
                className="h-10 border-slate-200 text-slate-700 font-bold hover:bg-slate-50"
              >
                Hủy bỏ
              </Button>
              <Button
                type="button"
                disabled={isResetting}
                onClick={handleReset}
                className="h-10 bg-red-600 text-white font-bold hover:bg-red-700"
              >
                {isResetting ? "Đang xử lý..." : "Xác nhận đặt lại"}
              </Button>
            </DialogFooter>
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}
