import type { ContestMatch, ContestMatchParticipant } from "@/features/contests/types"
import type { MatchResultDraft } from "./match-detail-types"
import { MatchSubmitResultsForm } from "./MatchSubmitResultsForm"

type EditableResultField =
  | "finish_position"
  | "score"
  | "best_lap_seconds"
  | "total_time_seconds"
  | "is_winner"
  | "result_note"
  | "status"

export function MatchResultEntry({
  match,
  results,
  participantMap,
  isKnockoutRuntime,
  hasPendingBracketChanges,
  onUpdateResult,
}: {
  match: ContestMatch
  results: MatchResultDraft[]
  participantMap: Map<string, ContestMatchParticipant>
  isKnockoutRuntime: boolean
  hasPendingBracketChanges: boolean
  onUpdateResult: (
    registrationId: string,
    field: EditableResultField,
    value: number | string | boolean | null,
  ) => void
}) {
  const readyForResultEntry =
    match.match_type === "TIME_ATTACK"
      ? match.participants.length >= 1
      : match.participants.length >= 2

  if (!readyForResultEntry) {
    return (
      <section className="rounded-lg border border-dashed border-[#c4c7c8] bg-[#fcf8f8] p-5">
        <h4 className="text-sm font-extrabold text-[#1c1b1b]">
          Chưa mở nhập kết quả
        </h4>
        <p className="mt-2 text-sm font-semibold text-[#747878]">
          {isKnockoutRuntime
            ? "Hãy kéo thả đủ 2 người vào trận này từ sơ đồ nhánh đấu rồi lưu sơ đồ trước."
            : "Trận này chưa có đủ người thi đấu để nhập kết quả."}
        </p>
        {hasPendingBracketChanges ? (
          <p className="mt-2 text-xs font-bold uppercase tracking-wider text-orange-700">
            Bạn còn thay đổi sơ đồ chưa lưu.
          </p>
        ) : null}
      </section>
    )
  }

  return (
    <MatchSubmitResultsForm
      results={results}
      participantMap={participantMap}
      onUpdateResult={onUpdateResult}
    />
  )
}
