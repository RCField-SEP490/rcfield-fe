import { useState } from "react"
import { Plus } from "lucide-react"

import { Button } from "@/shared/ui/button"
import { Input } from "@/shared/ui/input"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/shared/ui/dialog"

interface ContestClassCreatorDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  isPending: boolean
  onCreate: (data: {
    code: string
    name: string
    capacity: number
    display_order: number
  }) => void
}

export function ContestClassCreatorDialog({
  open,
  onOpenChange,
  isPending,
  onCreate,
}: ContestClassCreatorDialogProps) {
  const [code, setCode] = useState("")
  const [name, setName] = useState("")
  const [capacity, setCapacity] = useState(16)

  const handleCreate = () => {
    onCreate({ code, name, capacity, display_order: 1 })
    setCode("")
    setName("")
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="border-[#e5e2e1] bg-white text-[#1c1b1b] max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-1.5 font-extrabold text-[#1c1b1b]">
            <Plus className="text-orange-600" /> Tạo phân hạng đua (Contest
            Class)
          </DialogTitle>
          <DialogDescription className="text-[#6f6c6a] text-xs">
            Tạo phân hạng mới để chia nhỏ các tay đua theo loại xe hoặc cấp độ
            kỹ năng.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="space-y-1.5">
            <label className="text-xs font-bold uppercase tracking-wider text-[#6f6c6a]">
              Mã phân hạng (Class Code) *
            </label>
            <Input
              placeholder="e.g. DRIFT_A"
              value={code}
              onChange={(e) => setCode(e.target.value)}
              className="border-[#e5e2e1] bg-[#f6f3f2] text-[#1c1b1b] font-mono uppercase"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-bold uppercase tracking-wider text-[#6f6c6a]">
              Tên phân hạng (Class Name) *
            </label>
            <Input
              placeholder="e.g. Drift Pro Hạng A"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="border-[#e5e2e1] bg-[#f6f3f2] text-[#1c1b1b]"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-bold uppercase tracking-wider text-[#6f6c6a]">
              Sức chứa phân hạng (Capacity) *
            </label>
            <Input
              type="number"
              min={2}
              value={capacity}
              onChange={(e) => setCapacity(Number(e.target.value))}
              className="border-[#e5e2e1] bg-[#f6f3f2] text-[#1c1b1b]"
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
              type="button"
              onClick={handleCreate}
              disabled={!code || !name || isPending}
              className="bg-orange-600 hover:bg-orange-700 font-bold text-white"
            >
              {isPending ? "Đang tạo..." : "Xác nhận tạo"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
