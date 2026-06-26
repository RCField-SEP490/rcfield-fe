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

type RewardType = "TROPHY" | "VOUCHER" | "MERCHANDISE" | "POINTS"

interface ContestRewardCreatorDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  isPending: boolean
  contestClassId?: string
  onCreate: (data: {
    contest_class_id?: string
    title: string
    description: string
    reward_type: RewardType
    position: number
    quantity: number
    metadata?: { voucher_code: string }
  }) => void
}

export function ContestRewardCreatorDialog({
  open,
  onOpenChange,
  isPending,
  contestClassId,
  onCreate,
}: ContestRewardCreatorDialogProps) {
  const [title, setTitle] = useState("")
  const [desc, setDesc] = useState("")
  const [type, setType] = useState<RewardType>("TROPHY")
  const [position, setPosition] = useState(1)
  const [qty, setQty] = useState(1)
  const [code, setCode] = useState("")

  const handleCreate = () => {
    onCreate({
      contest_class_id: contestClassId,
      title,
      description: desc,
      reward_type: type,
      position,
      quantity: qty,
      metadata: code ? { voucher_code: code } : undefined,
    })
    setTitle("")
    setDesc("")
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="border-[#e5e2e1] bg-white text-[#1c1b1b] max-w-xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-1.5 font-extrabold text-[#1c1b1b]">
            <Plus className="text-orange-600" /> Thêm phần thưởng giải đấu
          </DialogTitle>
          <DialogDescription className="text-[#6f6c6a] text-xs">
            Thiết lập phần thưởng tương ứng với thứ hạng đạt được.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="space-y-1.5">
            <label className="text-xs font-bold uppercase tracking-wider text-[#6f6c6a]">
              Tiêu đề phần thưởng *
            </label>
            <Input
              placeholder="e.g. Cúp Vô Địch + 500k Voucher"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="border-[#e5e2e1] bg-[#f6f3f2] text-[#1c1b1b]"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-bold uppercase tracking-wider text-[#6f6c6a]">
              Mô tả quà tặng
            </label>
            <Input
              placeholder="Mô tả cụ thể vật phẩm hoặc cách thức nhận quà..."
              value={desc}
              onChange={(e) => setDesc(e.target.value)}
              className="border-[#e5e2e1] bg-[#f6f3f2] text-[#1c1b1b]"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-xs font-bold uppercase tracking-wider text-[#6f6c6a]">
                Loại quà tặng
              </label>
              <select
                value={type}
                onChange={(e) => setType(e.target.value as RewardType)}
                className="h-10 w-full rounded-lg border border-[#e5e2e1] bg-[#f6f3f2] px-3 text-sm font-semibold text-[#1c1b1b] outline-none focus:border-orange-500"
              >
                <option value="TROPHY">Cúp & Huy chương</option>
                <option value="VOUCHER">Voucher Giảm giá</option>
                <option value="MERCHANDISE">Quà lưu niệm / Xe RC</option>
                <option value="POINTS">Điểm tích lũy</option>
              </select>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold uppercase tracking-wider text-[#6f6c6a]">
                Dành cho Hạng mấy *
              </label>
              <Input
                type="number"
                min={1}
                value={position}
                onChange={(e) => setPosition(Number(e.target.value))}
                className="border-[#e5e2e1] bg-[#f6f3f2] text-[#1c1b1b]"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-xs font-bold uppercase tracking-wider text-[#6f6c6a]">
                Số lượng quà phát *
              </label>
              <Input
                type="number"
                min={1}
                value={qty}
                onChange={(e) => setQty(Number(e.target.value))}
                className="border-[#e5e2e1] bg-[#f6f3f2] text-[#1c1b1b]"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold uppercase tracking-wider text-[#6f6c6a]">
                Mã Voucher (nếu có)
              </label>
              <Input
                placeholder="e.g. CHAMPION2026"
                value={code}
                onChange={(e) => setCode(e.target.value)}
                className="border-[#e5e2e1] bg-[#f6f3f2] text-[#1c1b1b] font-mono uppercase"
              />
            </div>
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
              disabled={!title || isPending}
              className="bg-orange-600 hover:bg-orange-700 font-bold text-white"
            >
              {isPending ? "Đang lưu..." : "Xác nhận lưu"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
