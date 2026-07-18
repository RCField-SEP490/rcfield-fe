import { Button } from "@/shared/ui/button"
import { ConfirmDialog } from "@/shared/ui/confirm-dialog"
import { Textarea } from "@/shared/ui/textarea"
import { MatchDetailField } from "./MatchDetailField"

export function MatchAdvanceSection({
  reason,
  onReasonChange,
  forceCascade,
  onForceCascadeChange,
  readyForResultEntry,
  hasPendingBracketChanges,
  onSubmitResults,
  onCorrectResults,
  onAdvance,
}: {
  reason: string
  onReasonChange: (value: string) => void
  forceCascade: boolean
  onForceCascadeChange: (value: boolean) => void
  readyForResultEntry: boolean
  hasPendingBracketChanges: boolean
  onSubmitResults: () => Promise<void>
  onCorrectResults: () => Promise<void>
  onAdvance: () => Promise<void>
}) {
  const actionsDisabled = !readyForResultEntry || hasPendingBracketChanges

  return (
    <section className="space-y-3 rounded-lg border border-[#e5e2e1] bg-[#fcf8f8] p-4">
      <MatchDetailField label="Lý do cập nhật">
        <Textarea
          rows={3}
          value={reason}
          onChange={(event) => onReasonChange(event.target.value)}
        />
      </MatchDetailField>
      <label className="flex items-center gap-2 text-sm font-semibold text-[#1c1b1b]">
        <input
          type="checkbox"
          checked={forceCascade}
          onChange={(event) => onForceCascadeChange(event.target.checked)}
        />
        Cho phép làm mới nhánh kế tiếp khi sửa kết quả
      </label>
      <div className="flex flex-wrap gap-2">
        <Button
          className="rounded-lg bg-[#1c1b1b] text-white hover:bg-[#313030]"
          disabled={actionsDisabled}
          onClick={() => void onSubmitResults()}
        >
          Lưu kết quả
        </Button>
        <ConfirmDialog
          trigger={
            <Button
              variant="outline"
              className="rounded-lg border-amber-200 bg-amber-50 text-amber-700 hover:bg-amber-100"
              disabled={actionsDisabled}
            >
              Sửa kết quả
            </Button>
          }
          title="Xác nhận sửa kết quả"
          description="Kết quả đã lưu sẽ bị ghi đè. Nếu bật làm mới nhánh kế tiếp, các trận vòng sau sẽ được cập nhật lại theo kết quả mới."
          confirmLabel="Sửa kết quả"
          destructive
          onConfirm={onCorrectResults}
        />
        <Button
          variant="outline"
          className="rounded-lg border-blue-200 bg-blue-50 text-blue-700 hover:bg-blue-100"
          disabled={actionsDisabled}
          onClick={() => void onAdvance()}
        >
          Đẩy người thắng vào vòng sau
        </Button>
      </div>
    </section>
  )
}
