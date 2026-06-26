import { useState, useEffect } from "react"
import { Trophy } from "lucide-react"

import { Button } from "@/shared/ui/button"
import { Input } from "@/shared/ui/input"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/shared/ui/dialog"
import type { BracketMatch } from "../types"

interface ContestMatchEditorDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  match: BracketMatch | null
  onSave: (matchId: string, winnerId: string, score: string) => void
}

export function ContestMatchEditorDialog({
  open,
  onOpenChange,
  match,
  onSave,
}: ContestMatchEditorDialogProps) {
  const [winnerId, setWinnerId] = useState("")
  const [score, setScore] = useState("")

  useEffect(() => {
    if (match) {
      setWinnerId(match.winnerRegistrationId || "")
      setScore(
        typeof match.metadata?.score === "string" ? match.metadata.score : "",
      )
    }
  }, [match])

  const handleSave = () => {
    if (!match || !winnerId) return
    onSave(match.id, winnerId, score)
    onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="border-[#e5e2e1] bg-white text-[#1c1b1b] max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-1.5 font-extrabold text-[#1c1b1b]">
            <Trophy className="text-orange-600" /> Nhập kết quả trận đấu
            Knockout
          </DialogTitle>
          <DialogDescription className="text-[#6f6c6a] text-xs">
            Chọn tay đua chiến thắng để tự động đưa họ vào vòng tiếp theo.
          </DialogDescription>
        </DialogHeader>

        {match && (
          <div className="space-y-4 py-4">
            <div className="space-y-1.5">
              <label className="text-xs font-bold uppercase tracking-wider text-[#6f6c6a]">
                Chọn tay đua chiến thắng *
              </label>
              <select
                value={winnerId}
                onChange={(e) => setWinnerId(e.target.value)}
                className="h-10 w-full rounded-lg border border-[#e5e2e1] bg-[#f6f3f2] px-3 text-sm font-semibold text-[#1c1b1b] outline-none focus:border-orange-500"
              >
                <option value="">Chọn người thắng...</option>
                {match.competitorA && (
                  <option value={match.competitorA.id}>
                    {match.competitorA.user?.fullName}
                  </option>
                )}
                {match.competitorB && (
                  <option value={match.competitorB.id}>
                    {match.competitorB.user?.fullName}
                  </option>
                )}
              </select>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold uppercase tracking-wider text-[#6f6c6a]">
                Tỷ số / Ghi chú (e.g. 2 - 1)
              </label>
              <Input
                placeholder="e.g. 2 - 1"
                value={score}
                onChange={(e) => setScore(e.target.value)}
                className="border-[#e5e2e1] bg-[#f6f3f2] text-[#1c1b1b] font-mono text-center"
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
                onClick={handleSave}
                disabled={!winnerId}
                className="bg-orange-600 hover:bg-orange-700 font-bold text-white"
              >
                Ghi nhận kết quả
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}
