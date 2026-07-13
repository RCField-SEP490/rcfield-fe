import { useEffect, useMemo, useState } from "react"
import { contestCorrectResultsSchema, contestSubmitResultsSchema } from "@/features/contests/schemas/contest.schema"
import type { ContestMatch, ContestMatchParticipant, ContestSubmitResultsBody } from "@/features/contests/types"
import { formatDurationMs, getErrorMessage } from "@/features/contests/lib/contest-runtime"
import { getMatchStatusClass } from "@/features/contests/lib/contest-status"
import { Panel, PanelTitle } from "@/pages/provider/components/ProviderPrimitives"
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
}: {
  match: ContestMatch | null
  runtime: RuntimeHook
}) {
  const [participants, setParticipants] = useState<Array<{
    registration_id: string
    slot_no: number
    lane: string | null
    grid_position: number | null
    seed_no: number | null
  }>>([])
  const [results, setResults] = useState<Array<{
    registration_id: string
    finish_position: number | null
    score: number | null
    best_lap_ms: number | null
    total_time_ms: number | null
    is_winner: boolean
    result_note: string | null
    status: ContestMatchParticipant["status"]
  }>>([])
  const [reason, setReason] = useState("")
  const [forceCascade, setForceCascade] = useState(false)

  useEffect(() => {
    if (!match) return
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
        best_lap_ms: participant.best_lap_ms,
        total_time_ms: participant.total_time_ms,
        is_winner: participant.is_winner,
        result_note: participant.result_note,
        status: participant.status,
      })),
    )
    setReason("")
    setForceCascade(false)
  }, [match])

  const participantMap = useMemo(
    () =>
      new Map(
        match?.participants.map((participant) => [participant.registration_id, participant]) ?? [],
      ),
    [match],
  )

  if (!match) {
    return (
      <Panel>
        <PanelTitle title="Match detail" subtitle="Chọn một match từ board để xem chi tiết." />
        <p className="text-sm font-semibold text-[#747878]">Chưa có match nào được chọn.</p>
      </Panel>
    )
  }

  const updateParticipantValue = (
    registrationId: string,
    field: "slot_no" | "lane" | "grid_position" | "seed_no",
    value: number | string | null,
  ) => {
    setParticipants((current) =>
      current.map((participant) =>
        participant.registration_id === registrationId ? { ...participant, [field]: value } : participant,
      ),
    )
  }

  const updateResultValue = (
    registrationId: string,
    field:
      | "finish_position"
      | "score"
      | "best_lap_ms"
      | "total_time_ms"
      | "is_winner"
      | "result_note"
      | "status",
    value: number | string | boolean | null,
  ) => {
    setResults((current) =>
      current.map((result) =>
        result.registration_id === registrationId ? { ...result, [field]: value } : result,
      ),
    )
  }

  const handleSaveParticipants = async () => {
    try {
      await runtime.updateParticipantsMutation.mutateAsync({
        matchId: match.id,
        body: { participants },
      })
      toast.success("Đã cập nhật participant ordering")
    } catch (error) {
      toast.error("Không thể cập nhật participant", { description: getErrorMessage(error).message })
    }
  }

  const buildResultPayload = (): ContestSubmitResultsBody => ({
    reason: reason.trim() || "Contest runtime result submission",
    results: results.map((result) => ({
      registration_id: result.registration_id,
      finish_position: result.finish_position,
      score: result.score,
      best_lap_ms: result.best_lap_ms,
      total_time_ms: result.total_time_ms,
      is_winner: result.is_winner,
      result_note: result.result_note,
      status: result.status,
    })),
  })

  const handleSubmitResults = async () => {
    const rawPayload = buildResultPayload()
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
      toast.success("Đã submit result")
    } catch (error) {
      toast.error("Không thể submit result", { description: getErrorMessage(error).message })
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
      await runtime.correctResultsMutation.mutateAsync({ matchId: match.id, body: result.data })
      toast.success("Đã correct result")
    } catch (error) {
      toast.error("Không thể correct result", { description: getErrorMessage(error).message })
    }
  }

  const handleAdvance = async () => {
    try {
      await runtime.advanceMatchMutation.mutateAsync(match.id)
      toast.success("Đã advance match")
    } catch (error) {
      toast.error("Không thể advance match", { description: getErrorMessage(error).message })
    }
  }

  return (
    <Panel>
      <PanelTitle
        title={match.name ?? `Round ${match.round_no} · Match ${match.match_no}`}
        subtitle="Participant ordering, result entry và correction."
      />

      <div className="mb-4 flex flex-wrap items-center gap-2">
        <Badge className={`border ${getMatchStatusClass(match.status)}`}>{match.status}</Badge>
        <Badge className="border border-[#c4c7c8] bg-[#f6f3f2] text-[#444748]">{match.match_type}</Badge>
      </div>

      <div className="space-y-4">
        <section>
          <h4 className="mb-2 text-sm font-extrabold text-[#1c1b1b]">Participant ordering</h4>
          <div className="space-y-3">
            {participants.map((participant) => {
              const snapshot = participantMap.get(participant.registration_id)
              return (
                <div key={participant.registration_id} className="rounded-lg border border-[#e5e2e1] bg-[#fcf8f8] p-3">
                  <div className="mb-2 flex items-center justify-between gap-2">
                    <p className="text-sm font-bold text-[#1c1b1b]">{participant.registration_id.slice(0, 8)}</p>
                    <p className="text-xs font-semibold text-[#747878]">{snapshot?.registration?.status ?? "--"}</p>
                  </div>
                  <div className="grid gap-3 md:grid-cols-4">
                    <Field label="Slot">
                      <Input
                        type="number"
                        value={participant.slot_no}
                        onChange={(event) => updateParticipantValue(participant.registration_id, "slot_no", Number(event.target.value))}
                      />
                    </Field>
                    <Field label="Lane">
                      <Input
                        value={participant.lane ?? ""}
                        onChange={(event) => updateParticipantValue(participant.registration_id, "lane", event.target.value || null)}
                      />
                    </Field>
                    <Field label="Grid">
                      <Input
                        type="number"
                        value={participant.grid_position ?? ""}
                        onChange={(event) => updateParticipantValue(participant.registration_id, "grid_position", event.target.value ? Number(event.target.value) : null)}
                      />
                    </Field>
                    <Field label="Seed">
                      <Input
                        type="number"
                        value={participant.seed_no ?? ""}
                        onChange={(event) => updateParticipantValue(participant.registration_id, "seed_no", event.target.value ? Number(event.target.value) : null)}
                      />
                    </Field>
                  </div>
                </div>
              )
            })}
          </div>
          <div className="mt-3">
            <Button variant="outline" className="rounded-lg border-[#c4c7c8] bg-[#f6f3f2] text-[#1c1b1b] hover:bg-[#ebe7e7]" onClick={() => void handleSaveParticipants()}>
              Lưu participant ordering
            </Button>
          </div>
        </section>

        <section>
          <h4 className="mb-2 text-sm font-extrabold text-[#1c1b1b]">Result entry</h4>
          <div className="space-y-3">
            {results.map((result) => (
              <div key={result.registration_id} className="rounded-lg border border-[#e5e2e1] p-3">
                <p className="mb-3 text-sm font-bold text-[#1c1b1b]">{result.registration_id.slice(0, 8)}</p>
                <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
                  <Field label="Finish">
                    <Input
                      type="number"
                      value={result.finish_position ?? ""}
                      onChange={(event) => updateResultValue(result.registration_id, "finish_position", event.target.value ? Number(event.target.value) : null)}
                    />
                  </Field>
                  <Field label="Score">
                    <Input
                      type="number"
                      value={result.score ?? ""}
                      onChange={(event) => updateResultValue(result.registration_id, "score", event.target.value ? Number(event.target.value) : null)}
                    />
                  </Field>
                  <Field label="Best lap ms">
                    <Input
                      type="number"
                      value={result.best_lap_ms ?? ""}
                      onChange={(event) => updateResultValue(result.registration_id, "best_lap_ms", event.target.value ? Number(event.target.value) : null)}
                    />
                  </Field>
                  <Field label="Total time ms">
                    <Input
                      type="number"
                      value={result.total_time_ms ?? ""}
                      onChange={(event) => updateResultValue(result.registration_id, "total_time_ms", event.target.value ? Number(event.target.value) : null)}
                    />
                  </Field>
                </div>
                <div className="mt-3 grid gap-3 md:grid-cols-[180px_minmax(0,1fr)]">
                  <Field label="Participant status">
                    <select
                      className="h-10 rounded-lg border border-[#c4c7c8] bg-white px-3 text-sm"
                      value={result.status}
                      onChange={(event) => updateResultValue(result.registration_id, "status", event.target.value)}
                    >
                      <option value="READY">READY</option>
                      <option value="STARTED">STARTED</option>
                      <option value="FINISHED">FINISHED</option>
                      <option value="DNS">DNS</option>
                      <option value="DNF">DNF</option>
                      <option value="DQ">DQ</option>
                    </select>
                  </Field>
                  <Field label="Result note">
                    <Input
                      value={result.result_note ?? ""}
                      onChange={(event) => updateResultValue(result.registration_id, "result_note", event.target.value || null)}
                    />
                  </Field>
                </div>
                <label className="mt-3 flex items-center gap-2 text-sm font-semibold text-[#1c1b1b]">
                  <input
                    type="checkbox"
                    checked={result.is_winner}
                    onChange={(event) => updateResultValue(result.registration_id, "is_winner", event.target.checked)}
                  />
                  Mark as winner
                </label>
                <div className="mt-2 text-xs font-semibold text-[#747878]">
                  Best lap: {formatDurationMs(result.best_lap_ms)} · Total time: {formatDurationMs(result.total_time_ms)}
                </div>
              </div>
            ))}
          </div>
        </section>

        <section className="space-y-3 rounded-lg border border-[#e5e2e1] bg-[#fcf8f8] p-4">
          <Field label="Reason">
            <Textarea rows={3} value={reason} onChange={(event) => setReason(event.target.value)} />
          </Field>
          <label className="flex items-center gap-2 text-sm font-semibold text-[#1c1b1b]">
            <input type="checkbox" checked={forceCascade} onChange={(event) => setForceCascade(event.target.checked)} />
            Force cascade khi correction có downstream match
          </label>
          <div className="flex flex-wrap gap-2">
            <Button className="rounded-lg bg-[#1c1b1b] text-white hover:bg-[#313030]" onClick={() => void handleSubmitResults()}>
              Submit result
            </Button>
            <Button variant="outline" className="rounded-lg border-amber-200 bg-amber-50 text-amber-700 hover:bg-amber-100" onClick={() => void handleCorrectResults()}>
              Correct result
            </Button>
            <Button variant="outline" className="rounded-lg border-blue-200 bg-blue-50 text-blue-700 hover:bg-blue-100" onClick={() => void handleAdvance()}>
              Advance
            </Button>
          </div>
        </section>
      </div>
    </Panel>
  )
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <Label className="mb-2 block text-xs font-bold uppercase tracking-wider text-[#747878]">{label}</Label>
      {children}
    </div>
  )
}
