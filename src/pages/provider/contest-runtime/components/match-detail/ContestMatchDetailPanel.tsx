import { useEffect, useMemo, useState } from "react"
import {
  contestCorrectResultsSchema,
  contestSubmitResultsSchema,
} from "@/features/contests/schemas/contest.schema"
import type {
  ContestMatch,
  ContestSubmitResultsBody,
} from "@/features/contests/types"
import {
  getErrorMessage,
  getMatchParticipantName,
} from "@/features/contests/lib/contest-runtime"
import { MatchStatusBadge } from "@/features/contests/components"
import {
  Panel,
  PanelTitle,
} from "@/pages/provider/components/ProviderPrimitives"
import { DriverTitleChip } from "@/features/racing/components/DriverTitleChip"
import { Badge } from "@/shared/ui/badge"
import { toast } from "sonner"
import { MatchAdvanceSection } from "./MatchAdvanceSection"
import { MatchParticipantReorderList } from "./MatchParticipantReorderList"
import { MatchSubmitResultsForm } from "./MatchSubmitResultsForm"
import type {
  ContestRuntimeHook,
  MatchParticipantDraft,
  MatchResultDraft,
} from "./match-detail-types"

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
  const [participants, setParticipants] = useState<MatchParticipantDraft[]>([])
  const [results, setResults] = useState<MatchResultDraft[]>([])
  const [reason, setReason] = useState("")
  const [forceCascade, setForceCascade] = useState(false)

  useEffect(() => {
    if (!match) return
    queueMicrotask(() => {
      setParticipants(
        match.participants.map((participant) => ({
          registration_id: participant.registration_id,
          slot_no: participant.slot_no,
          lane: participant.lane,
          grid_position: participant.grid_position,
          seed_no: participant.seed_no,
        })),
      )
      setResults(
        match.participants.map((participant) => ({
          registration_id: participant.registration_id,
          finish_position: participant.finish_position,
          score: participant.score,
          best_lap_seconds: participant.best_lap_seconds,
          total_time_seconds: participant.total_time_seconds,
          is_winner: participant.is_winner,
          result_note: participant.result_note,
          status: participant.status,
        })),
      )
      setReason("")
      setForceCascade(false)
    })
  }, [match])

  const participantMap = useMemo(
    () =>
      new Map(
        match?.participants.map((participant) => [
          participant.registration_id,
          participant,
        ]) ?? [],
      ),
    [match],
  )

  if (!match) {
    return (
      <Panel>
        <PanelTitle
          title="Chi tiết trận đấu"
          subtitle="Chọn một trận hoặc lượt thi đấu để xem chi tiết."
        />
        <p className="text-sm font-semibold text-[#747878]">
          Chưa có match nào được chọn.
        </p>
      </Panel>
    )
  }

  const readyForResultEntry =
    match.match_type === "TIME_ATTACK" ? match.participants.length >= 1 : match.participants.length >= 2

  const updateParticipantValue = (
    registrationId: string,
    field: "slot_no" | "lane" | "grid_position" | "seed_no",
    value: number | string | null,
  ) => {
    setParticipants((current) =>
      current.map((participant) =>
        participant.registration_id === registrationId
          ? { ...participant, [field]: value }
          : participant,
      ),
    )
  }

  const updateResultValue = (
    registrationId: string,
    field:
      | "finish_position"
      | "score"
      | "best_lap_seconds"
      | "total_time_seconds"
      | "is_winner"
      | "result_note"
      | "status",
    value: number | string | boolean | null,
  ) => {
    setResults((current) =>
      current.map((result) =>
        result.registration_id === registrationId
          ? { ...result, [field]: value }
          : result,
      ),
    )
  }

  const handleSaveParticipants = async () => {
    const slotNumbers = participants.map((participant) => participant.slot_no)
    if (new Set(slotNumbers).size !== slotNumbers.length) {
      toast.error("Mỗi participant phải có slot khác nhau")
      return
    }

    try {
      await runtime.updateParticipantsMutation.mutateAsync({
        matchId: match.id,
        body: { participants },
      })
      toast.success("Đã cập nhật thứ tự thi đấu")
    } catch (error) {
      toast.error("Không thể cập nhật participant", {
        description: getErrorMessage(error).message,
      })
    }
  }

  const buildResultPayload = (): ContestSubmitResultsBody => ({
    reason: reason.trim() || "Cập nhật kết quả thi đấu",
    results: results.map((result) => ({
      registration_id: result.registration_id,
      finish_position: result.finish_position,
      score: result.score,
      best_lap_seconds: result.best_lap_seconds,
      total_time_seconds: result.total_time_seconds,
      is_winner: result.is_winner,
      result_note: result.result_note,
      status: result.status,
    })),
  })

  const handleSubmitResults = async () => {
    const rawPayload = buildResultPayload()
    const winners = rawPayload.results.filter((item) => item.is_winner)
    const finishPositions = rawPayload.results
      .map((item) => item.finish_position)
      .filter((item): item is number => typeof item === "number")

    if (match.match_type !== "TIME_ATTACK" && winners.length !== 1) {
      toast.error("Match đối kháng cần chọn đúng 1 người thắng")
      return
    }
    if (new Set(finishPositions).size !== finishPositions.length) {
      toast.error("Finish position không được trùng nhau")
      return
    }

    const result = contestSubmitResultsSchema.safeParse(rawPayload)
    if (!result.success) {
      const firstError = result.error.issues[0]
      toast.error(`Lỗi validation: ${firstError.message}`)
      return
    }

    try {
      await runtime.submitResultsMutation.mutateAsync({
        matchId: match.id,
        body: result.data,
      })
      toast.success("Đã lưu kết quả")
    } catch (error) {
      toast.error("Không thể submit result", {
        description: getErrorMessage(error).message,
      })
    }
  }

  const handleCorrectResults = async () => {
    const rawPayload = {
      ...buildResultPayload(),
      force_cascade: forceCascade,
    }

    const result = contestCorrectResultsSchema.safeParse(rawPayload)
    if (!result.success) {
      const firstError = result.error.issues[0]
      toast.error(`Lỗi validation: ${firstError.message}`)
      return
    }

    try {
      await runtime.correctResultsMutation.mutateAsync({
        matchId: match.id,
        body: result.data,
      })
      toast.success("Đã sửa kết quả")
    } catch (error) {
      toast.error("Không thể correct result", {
        description: getErrorMessage(error).message,
      })
    }
  }

  const handleAdvance = async () => {
    const hasWinner = results.some((result) => result.is_winner)
    if (match.match_type !== "TIME_ATTACK" && !hasWinner) {
      toast.error("Cần chọn người thắng trước khi đẩy sang vòng sau")
      return
    }

    try {
      await runtime.advanceMatchMutation.mutateAsync(match.id)
      toast.success("Đã đẩy người thắng vào vòng sau")
    } catch (error) {
      toast.error("Không thể advance match", {
        description: getErrorMessage(error).message,
      })
    }
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
          {match.match_type}
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
          <section className="rounded-lg border border-[#e5e2e1] bg-[#fcf8f8] p-4">
            <h4 className="mb-2 text-sm font-extrabold text-[#1c1b1b]">
              Người thi đấu của trận này
            </h4>
            <div className="space-y-2">
              {match.participants.length > 0 ? (
                match.participants.map((participant) => (
                  <div
                    key={participant.registration_id}
                    className="rounded-lg border border-[#e5e2e1] bg-white px-3 py-2"
                  >
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="text-sm font-bold text-[#1c1b1b]">
                        {getMatchParticipantName(participant)}
                      </p>
                      <DriverTitleChip
                        label={participant.registration?.driver_title_label}
                        className="px-2 py-0 text-[10px]"
                      />
                    </div>
                    <p className="mt-1 text-xs font-semibold text-[#747878]">
                      Slot {participant.slot_no} · {participant.status}
                    </p>
                  </div>
                ))
              ) : (
                <p className="text-sm font-semibold text-[#747878]">
                  Chưa có người thi đấu nào cho trận này.
                </p>
              )}
            </div>
          </section>
        )}

        {!readyForResultEntry ? (
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
        ) : (
          <MatchSubmitResultsForm
            results={results}
            participantMap={participantMap}
            onUpdateResult={updateResultValue}
          />
        )}

        <MatchAdvanceSection
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
