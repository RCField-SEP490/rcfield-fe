import { MatchStatusBadge } from "@/features/contests/components"
import { getMatchTypeLabel } from "@/features/contests/lib/contest-status"
import type { ContestMatch } from "@/features/contests/types"
import {
  Panel,
  PanelTitle,
} from "@/pages/provider/components/ProviderPrimitives"
import { Badge } from "@/shared/ui/badge"
import { MatchActions } from "./MatchActions"
import { MatchParticipantReorderList } from "./MatchParticipantReorderList"
import { MatchParticipantView } from "./MatchParticipantView"
import { MatchResultEntry } from "./MatchResultEntry"
import type { ContestRuntimeHook } from "./match-detail-types"
import { useMatchDetailState } from "./useMatchDetailState"

export function ContestMatchDetailPanel({
  match,
  runtime,
  isKnockoutRuntime = false,
  hasPendingBracketChanges = false,
}: {
  match: ContestMatch | null
  runtime: ContestRuntimeHook
  isKnockoutRuntime?: boolean
  hasPendingBracketChanges?: boolean
}) {
  const {
    participants,
    results,
    reason,
    forceCascade,
    participantMap,
    readyForResultEntry,
    setReason,
    setForceCascade,
    updateParticipantValue,
    updateResultValue,
    handleSaveParticipants,
    handleSubmitResults,
    handleCorrectResults,
    handleAdvance,
  } = useMatchDetailState(match, runtime)

  if (!match) {
    return (
      <Panel>
        <PanelTitle
          title="Chi tiết trận đấu"
          subtitle="Chọn một trận hoặc lượt thi đấu để xem chi tiết."
        />
        <p className="text-sm font-semibold text-[#747878]">
          Chưa có lượt đấu nào được chọn.
        </p>
      </Panel>
    )
  }

  return (
    <Panel>
      <PanelTitle
        title={match.name ?? `Vòng ${match.round_no} · Trận ${match.match_no}`}
        subtitle={
          isKnockoutRuntime
            ? "Kéo thả người vào sơ đồ bên trái, lưu sơ đồ, rồi mới nhập kết quả."
            : "Sắp thứ tự thi đấu, nhập kết quả và chỉnh sửa khi cần."
        }
      />

      <div className="mb-4 flex flex-wrap items-center gap-2">
        <MatchStatusBadge status={match.status} />
        <Badge className="border border-[#c4c7c8] bg-[#f6f3f2] text-[#444748]">
          {getMatchTypeLabel(match.match_type)}
        </Badge>
      </div>

      <div className="space-y-4">
        {!isKnockoutRuntime ? (
          <MatchParticipantReorderList
            participants={participants}
            participantMap={participantMap}
            onUpdateParticipant={updateParticipantValue}
            onSave={handleSaveParticipants}
          />
        ) : (
          <MatchParticipantView match={match} />
        )}

        <MatchResultEntry
          match={match}
          results={results}
          participantMap={participantMap}
          isKnockoutRuntime={isKnockoutRuntime}
          hasPendingBracketChanges={hasPendingBracketChanges}
          onUpdateResult={updateResultValue}
        />

        <MatchActions
          reason={reason}
          onReasonChange={setReason}
          forceCascade={forceCascade}
          onForceCascadeChange={setForceCascade}
          readyForResultEntry={readyForResultEntry}
          hasPendingBracketChanges={hasPendingBracketChanges}
          onSubmitResults={handleSubmitResults}
          onCorrectResults={handleCorrectResults}
          onAdvance={handleAdvance}
        />
      </div>
    </Panel>
  )
}
