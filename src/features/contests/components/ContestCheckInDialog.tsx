import { useState } from "react"
import { QrCode } from "lucide-react"

import { Button } from "@/shared/ui/button"
import { Input } from "@/shared/ui/input"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/shared/ui/dialog"
import type { Contest } from "../types"

interface ContestCheckInDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  contest: Contest
  selectedCafeId: string
  onSubmit: (code: string, cafeId: string) => void
}

export function ContestCheckInDialog({
  open,
  onOpenChange,
  contest,
  selectedCafeId,
  onSubmit,
}: ContestCheckInDialogProps) {
  const [manualCode, setManualCode] = useState("")
  const [cafeId, setCafeId] = useState(selectedCafeId)

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!manualCode) return
    onSubmit(manualCode, cafeId || selectedCafeId)
    setManualCode("")
    onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="border-[#e5e2e1] bg-white text-[#1c1b1b] max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-1.5 font-extrabold text-[#1c1b1b]">
            <QrCode className="text-orange-600" /> Quét Check-in Thủ Công
          </DialogTitle>
          <DialogDescription className="text-[#6f6c6a] text-xs">
            Nhập mã check-in (QR code hoặc UUID) để ghi nhận check-in vận động
            viên.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 py-4">
          <div className="space-y-1.5">
            <label className="text-xs font-bold uppercase tracking-wider text-[#6f6c6a]">
              Chọn chi nhánh check-in
            </label>
            <select
              value={cafeId || selectedCafeId}
              onChange={(e) => setCafeId(e.target.value)}
              className="h-10 w-full rounded-lg border border-[#e5e2e1] bg-[#f6f3f2] px-3 text-sm font-semibold text-[#1c1b1b] outline-none focus:border-orange-500"
            >
              {contest.participating_cafes.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-bold uppercase tracking-wider text-[#6f6c6a]">
              Mã check-in
            </label>
            <Input
              placeholder="Nhập mã check-in..."
              value={manualCode}
              onChange={(e) => setManualCode(e.target.value)}
              className="border-[#e5e2e1] bg-[#f6f3f2] text-[#1c1b1b] font-mono tracking-widest text-center"
              required
            />
          </div>

          <div className="flex justify-end gap-3 pt-2">
            <Button
              type="button"
              variant="ghost"
              onClick={() => onOpenChange(false)}
              className="text-[#6f6c6a]"
            >
              Hủy
            </Button>
            <Button
              type="submit"
              className="bg-orange-600 hover:bg-orange-700 font-bold text-white"
            >
              Xác nhận Check-in
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
