import { useEffect, useMemo, useState } from "react"
import {
  contestCorrectResultsSchema,
  contestSubmitResultsSchema,
} from "@/features/contests/schemas/contest.schema"
import type {
  ContestMatch,
  ContestMatchParticipant,
  ContestSubmitResultsBody,
} from "@/features/contests/types"
import {
  formatDurationSeconds,
  getErrorMessage,
  getMatchParticipantName,
  getMatchParticipantSubtitle,
} from "@/features/contests/lib/contest-runtime"
import { getMatchStatusClass } from "@/features/contests/lib/contest-status"
import {
  Panel,
  PanelTitle,
} from "@/pages/provider/components/ProviderPrimitives"
import { DriverTitleChip } from "@/features/racing/components/DriverTitleChip"
import { Badge } from "@/shared/ui/badge"
import { Button } from "@/shared/ui/button"
import { Input } from "@/shared/ui/input"
import { Label } from "@/shared/ui/label"
import { Textarea } from "@/shared/ui/textarea"
import { toast } from "sonner"
import type { useContestRuntime } from "@/features/contests/hooks/useContestRuntime"

type RuntimeHook = ReturnType<typeof useContestRuntime>

export function ContestMatchDetailPanel({
  match,
  runtime,
  isKnockoutRuntime = false,
  hasPendingBracketChanges = false,
}: {
  match: ContestMatch | null
  runtime: RuntimeHook
  isKnockoutRuntime?: boolean
  hasPendingBracketChanges?: boolean
}) {
  const [participants, setParticipants] = useState<
    Array<{
      registration_id: string
      slot_no: number
      lane: string | null
      grid_position: number | null
      seed_no: number | null
    }>
  >([])
  const [results, setResults] = useState<
    Array<{
      registration_id: string
      finish_position: number | null
      score: number | null
      best_lap_seconds: number | null
      total_time_seconds: number | null
      is_winner: boolean
      result_note: string | null
      status: ContestMatchParticipant["status"]
    }>
  >([])
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
        <Badge className={`border ${getMatchStatusClass(match.status)}`}>
          {match.status}
        </Badge>
        <Badge className="border border-[#c4c7c8] bg-[#f6f3f2] text-[#444748]">
          {match.match_type}
        </Badge>
      </div>

      <div className="space-y-4">
        {!isKnockoutRuntime ? (
        <section>
          <h4 className="mb-2 text-sm font-extrabold text-[#1c1b1b]">
            Thứ tự thi đấu
          </h4>
          <div className="space-y-3">
            {participants.map((participant) => {
              const snapshot = participantMap.get(participant.registration_id)
              return (
                <div
                  key={participant.registration_id}
                  className="rounded-lg border border-[#e5e2e1] bg-[#fcf8f8] p-3"
                >
                  <div className="mb-2 flex items-center justify-between gap-2">
                    <div>
                      <div className="flex flex-wrap items-center gap-2">
                        <p className="text-sm font-bold text-[#1c1b1b]">
                          {snapshot
                            ? getMatchParticipantName(snapshot)
                            : participant.registration_id.slice(0, 8)}
                        </p>
                        <DriverTitleChip
                          label={snapshot?.registration?.driver_title_label}
                          className="px-2 py-0 text-[10px]"
                        />
                      </div>
                      {snapshot ? (
                        <p className="text-xs font-medium text-[#747878]">
                          {getMatchParticipantSubtitle(snapshot) ??
                            "Chưa có email / check-in code"}
                        </p>
                      ) : null}
                    </div>
                    <p className="text-xs font-semibold text-[#747878]">
                      {snapshot?.registration?.status ?? "--"}
                    </p>
                  </div>
                  <div className="grid gap-3 md:grid-cols-4">
                    <Field label="Vị trí">
                      <Input
                        type="number"
                        value={participant.slot_no}
                        onChange={(event) =>
                          updateParticipantValue(
                            participant.registration_id,
                            "slot_no",
                            Number(event.target.value),
                          )
                        }
                      />
                    </Field>
                    <Field label="Làn">
                      <Input
                        value={participant.lane ?? ""}
                        onChange={(event) =>
                          updateParticipantValue(
                            participant.registration_id,
                            "lane",
                            event.target.value || null,
                          )
                        }
                      />
                    </Field>
                    <Field label="Ô xuất phát">
                      <Input
                        type="number"
                        value={participant.grid_position ?? ""}
                        onChange={(event) =>
                          updateParticipantValue(
                            participant.registration_id,
                            "grid_position",
                            event.target.value
                              ? Number(event.target.value)
                              : null,
                          )
                        }
                      />
                    </Field>
                  </div>
                </div>
              )
            })}
          </div>
          <div className="mt-3">
            <Button
              variant="outline"
              className="rounded-lg border-[#c4c7c8] bg-[#f6f3f2] text-[#1c1b1b] hover:bg-[#ebe7e7]"
              onClick={() => void handleSaveParticipants()}
            >
              Lưu thứ tự thi đấu
            </Button>
          </div>
        </section>
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
        <section>
          <h4 className="mb-2 text-sm font-extrabold text-[#1c1b1b]">
            Nhập kết quả
          </h4>
          <div className="space-y-3">
            {results.map((result) => (
              <div
                key={result.registration_id}
                className="rounded-lg border border-[#e5e2e1] p-3"
              >
                <div className="mb-3">
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="text-sm font-bold text-[#1c1b1b]">
                      {participantMap.get(result.registration_id)
                        ? getMatchParticipantName(
                            participantMap.get(result.registration_id),
                          )
                        : result.registration_id.slice(0, 8)}
                    </p>
                    <DriverTitleChip
                      label={
                        participantMap.get(result.registration_id)?.registration
                          ?.driver_title_label
                      }
                      className="px-2 py-0 text-[10px]"
                    />
                  </div>
                  <p className="text-xs font-medium text-[#747878]">
                    {participantMap.get(result.registration_id)
                      ? (getMatchParticipantSubtitle(
                          participantMap.get(result.registration_id),
                        ) ?? "Chưa có email / check-in code")
                      : "Chưa có thông tin bổ sung"}
                  </p>
                </div>
                <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
                  <Field label="Về đích">
                    <Input
                      type="number"
                      value={result.finish_position ?? ""}
                      onChange={(event) =>
                        updateResultValue(
                          result.registration_id,
                          "finish_position",
                          event.target.value
                            ? Number(event.target.value)
                            : null,
                        )
                      }
                    />
                  </Field>
                  <Field label="Điểm">
                    <Input
                      type="number"
                      value={result.score ?? ""}
                      onChange={(event) =>
                        updateResultValue(
                          result.registration_id,
                          "score",
                          event.target.value
                            ? Number(event.target.value)
                            : null,
                        )
                      }
                    />
                  </Field>
                  <Field label="Lap tốt nhất (giây)">
                    <Input
                      type="number"
                      step="0.001"
                      value={result.best_lap_seconds ?? ""}
                      onChange={(event) =>
                        updateResultValue(
                          result.registration_id,
                          "best_lap_seconds",
                          event.target.value
                            ? Number(event.target.value)
                            : null,
                        )
                      }
                    />
                  </Field>
                  <Field label="Tổng thời gian (giây)">
                    <Input
                      type="number"
                      step="0.001"
                      value={result.total_time_seconds ?? ""}
                      onChange={(event) =>
                        updateResultValue(
                          result.registration_id,
                          "total_time_seconds",
                          event.target.value
                            ? Number(event.target.value)
                            : null,
                        )
                      }
                    />
                  </Field>
                </div>
                <div className="mt-3 grid gap-3 md:grid-cols-[180px_minmax(0,1fr)]">
                  <Field label="Trạng thái người chơi">
                    <select
                      className="h-10 rounded-lg border border-[#c4c7c8] bg-white px-3 text-sm"
                      value={result.status}
                      onChange={(event) =>
                        updateResultValue(
                          result.registration_id,
                          "status",
                          event.target.value,
                        )
                      }
                    >
                      <option value="READY">READY</option>
                      <option value="STARTED">STARTED</option>
                      <option value="FINISHED">FINISHED</option>
                      <option value="DNS">DNS</option>
                      <option value="DNF">DNF</option>
                      <option value="DQ">DQ</option>
                    </select>
                  </Field>
                  <Field label="Ghi chú kết quả">
                    <Input
                      value={result.result_note ?? ""}
                      onChange={(event) =>
                        updateResultValue(
                          result.registration_id,
                          "result_note",
                          event.target.value || null,
                        )
                      }
                    />
                  </Field>
                </div>
                <label className="mt-3 flex items-center gap-2 text-sm font-semibold text-[#1c1b1b]">
                  <input
                    type="checkbox"
                    checked={result.is_winner}
                    onChange={(event) =>
                      updateResultValue(
                        result.registration_id,
                        "is_winner",
                        event.target.checked,
                      )
                    }
                  />
                  Đánh dấu người thắng
                </label>
                <div className="mt-2 text-xs font-semibold text-[#747878]">
                  Lap tốt nhất: {formatDurationSeconds(result.best_lap_seconds)}{" "}
                  · Tổng thời gian:{" "}
                  {formatDurationSeconds(result.total_time_seconds)}
                </div>
              </div>
            ))}
          </div>
        </section>
        )}

        <section className="space-y-3 rounded-lg border border-[#e5e2e1] bg-[#fcf8f8] p-4">
          <Field label="Lý do cập nhật">
            <Textarea
              rows={3}
              value={reason}
              onChange={(event) => setReason(event.target.value)}
            />
          </Field>
          <label className="flex items-center gap-2 text-sm font-semibold text-[#1c1b1b]">
            <input
              type="checkbox"
              checked={forceCascade}
              onChange={(event) => setForceCascade(event.target.checked)}
            />
            Cho phép làm mới nhánh kế tiếp khi sửa kết quả
          </label>
          <div className="flex flex-wrap gap-2">
            <Button
              className="rounded-lg bg-[#1c1b1b] text-white hover:bg-[#313030]"
              disabled={!readyForResultEntry || hasPendingBracketChanges}
              onClick={() => void handleSubmitResults()}
            >
              Lưu kết quả
            </Button>
            <Button
              variant="outline"
              className="rounded-lg border-amber-200 bg-amber-50 text-amber-700 hover:bg-amber-100"
              disabled={!readyForResultEntry || hasPendingBracketChanges}
              onClick={() => void handleCorrectResults()}
            >
              Sửa kết quả
            </Button>
            <Button
              variant="outline"
              className="rounded-lg border-blue-200 bg-blue-50 text-blue-700 hover:bg-blue-100"
              disabled={!readyForResultEntry || hasPendingBracketChanges}
              onClick={() => void handleAdvance()}
            >
              Đẩy người thắng vào vòng sau
            </Button>
          </div>
        </section>
      </div>
    </Panel>
  )
}

function Field({
  label,
  children,
}: {
  label: string
  children: React.ReactNode
}) {
  return (
    <div>
      <Label className="mb-2 block text-xs font-bold uppercase tracking-wider text-[#747878]">
        {label}
      </Label>
      {children}
    </div>
  )
}
