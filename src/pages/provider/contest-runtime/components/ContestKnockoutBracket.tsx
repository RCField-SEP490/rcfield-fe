import { useMemo, useState } from "react"
import { GripVertical, Trophy } from "lucide-react"
import { DriverTitleChip } from "@/features/racing/components/DriverTitleChip"
import { formatMatchLabel, formatContestDateTime, getMatchParticipantName, groupMatchesByRound } from "@/features/contests/lib/contest-runtime"
import { getMatchStatusClass, getMatchStatusLabel } from "@/features/contests/lib/contest-status"
import type { ContestMatch, ContestMatchParticipant } from "@/features/contests/types"
import { Panel, PanelTitle } from "@/pages/provider/components/ProviderPrimitives"
import { Badge } from "@/shared/ui/badge"
import { Button } from "@/shared/ui/button"
import { ContestBracketAdvanceModal, type AdvanceModalPayload, type AdvanceSubmitData } from "./ContestBracketAdvanceModal"

export function ContestKnockoutBracket({
  matches,
  selectedMatchId,
  onSelectMatch,
  onStageAdvance,
  onUndo,
  onCommit,
  canUndo,
  hasChanges,
}: {
  matches: ContestMatch[]
  selectedMatchId: string | null
  onSelectMatch: (matchId: string) => void
  onStageAdvance: (
    sourceMatchId: string,
    targetMatchId: string,
    registrationId: string,
    submitResult?: AdvanceSubmitData["submitResult"],
  ) => void
  onUndo: () => void
  onCommit: () => void
  canUndo: boolean
  hasChanges: boolean
}) {
  const groups = useMemo(() => groupMatchesByRound(matches), [matches])
  const [draggingPayload, setDraggingPayload] = useState<{
    sourceMatchId: string
    registrationId: string
  } | null>(null)
  const [dropTargetId, setDropTargetId] = useState<string | null>(null)
  const [advanceModalPayload, setAdvanceModalPayload] = useState<AdvanceModalPayload | null>(null)

  const handleDrop = (targetMatch: ContestMatch, payloadRaw: string) => {
    setDropTargetId(null)
    setDraggingPayload(null)
    if (!payloadRaw) return

    try {
      const parsed = JSON.parse(payloadRaw) as {
        sourceMatchId: string
        registrationId: string
      }
      const sourceMatch = matches.find((m) => m.id === parsed.sourceMatchId)
      if (!sourceMatch) return

      const participant = sourceMatch.participants.find(
        (p) => p.registration_id === parsed.registrationId,
      )
      if (!participant) return

      if (targetMatch.round_no <= sourceMatch.round_no) {
        return
      }

      // Open popup modal for user confirmation & optional quick result entry
      setAdvanceModalPayload({
        sourceMatch,
        targetMatch,
        participant,
      })
    } catch {
      return
    }
  }

  const handleModalConfirm = (data: AdvanceSubmitData) => {
    onStageAdvance(
      data.sourceMatchId,
      data.targetMatchId,
      data.registrationId,
      data.submitResult,
    )
  }

  return (
    <Panel>
      <PanelTitle
        title="Sơ đồ nhánh đấu"
        subtitle="Kéo giữ tay đua từ trận hiện tại thả sang trận vòng sâu hơn (sẽ hiển thị popup xác nhận). Nhấp vào trận để nhập kết quả thủ công."
        action={
          <div className="flex flex-wrap items-center gap-2">
            <Button
              type="button"
              variant="outline"
              className="rounded-lg text-xs font-bold"
              disabled={!canUndo}
              onClick={onUndo}
            >
              Hoàn tác
            </Button>
            <Button
              type="button"
              className="rounded-lg bg-[#1c1b1b] text-white hover:bg-[#313030] text-xs font-bold"
              disabled={!hasChanges}
              onClick={onCommit}
            >
              Lưu sơ đồ
            </Button>
          </div>
        }
      />

      {groups.length === 0 ? (
        <div className="rounded-lg border border-dashed border-[#c4c7c8] p-8 text-center text-sm font-semibold text-[#747878]">
          Chưa có nhánh đấu nào được tạo.
        </div>
      ) : (
        <div className="overflow-x-auto">
          <div className="flex min-w-max gap-4 pb-2">
            {groups.map((group) => (
              <section key={group.roundNo} className="w-[320px] shrink-0 space-y-3">
                <div className="flex items-center justify-between">
                  <p className="text-xs font-extrabold uppercase tracking-wider text-[#747878]">
                    Vòng {group.roundNo}
                  </p>
                  <span className="text-[10px] font-bold text-[#b0b4b4]">
                    {group.matches.length} trận
                  </span>
                </div>
                {group.matches.map((match) => (
                  <div
                    key={match.id}
                    onClick={() => onSelectMatch(match.id)}
                    className={`group relative w-full rounded-xl border p-4 text-left transition-all duration-150 cursor-pointer ${
                      selectedMatchId === match.id
                        ? "border-orange-300 bg-orange-50/60 shadow-sm"
                        : "border-[#e5e2e1] bg-white hover:bg-[#fcf8f8]"
                    }`}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <p className="text-sm font-extrabold text-[#1c1b1b]">
                          {formatMatchLabel(match)}
                        </p>
                        <p className="mt-0.5 text-xs font-semibold text-[#747878]">
                          {formatContestDateTime(match.scheduled_at)}
                        </p>
                      </div>
                      <Badge className={`border text-[10px] font-bold ${getMatchStatusClass(match.status)}`}>
                        {getMatchStatusLabel(match.status)}
                      </Badge>
                    </div>

                    <div className="mt-3 space-y-2">
                      {[0, 1].map((index) => {
                        const participant = match.participants[index]
                        const isDropTarget = dropTargetId === `${match.id}-${index}`

                        return (
                          <div
                            key={index}
                            className={`rounded-lg border px-3 py-2 transition-colors ${
                              isDropTarget
                                ? "border-orange-400 bg-orange-100/70 ring-2 ring-orange-400/30"
                                : "border-[#e5e2e1] bg-[#fcf8f8]"
                            }`}
                            onDragOver={(event) => {
                              event.preventDefault()
                              event.dataTransfer.dropEffect = "move"
                              setDropTargetId(`${match.id}-${index}`)
                            }}
                            onDragLeave={() => setDropTargetId(null)}
                            onDrop={(event) => {
                              event.preventDefault()
                              event.stopPropagation()
                              const payload = event.dataTransfer.getData("text/plain")
                              handleDrop(match, payload)
                            }}
                          >
                            {participant ? (
                              <ParticipantRow
                                participant={participant}
                                match={match}
                                isDragging={
                                  draggingPayload?.sourceMatchId === match.id &&
                                  draggingPayload?.registrationId === participant.registration_id
                                }
                                onDragStart={() =>
                                  setDraggingPayload({
                                    sourceMatchId: match.id,
                                    registrationId: participant.registration_id,
                                  })
                                }
                                onDragEnd={() => setDraggingPayload(null)}
                              />
                            ) : (
                              <p className="text-xs font-semibold text-[#747878] italic">
                                Drop người thi đấu vào đây
                              </p>
                            )}
                          </div>
                        )
                      })}
                    </div>
                  </div>
                ))}
              </section>
            ))}
          </div>
        </div>
      )}

      {/* Popup Modal hiển thị khi kéo thả tay đua */}
      <ContestBracketAdvanceModal
        isOpen={Boolean(advanceModalPayload)}
        onClose={() => setAdvanceModalPayload(null)}
        payload={advanceModalPayload}
        onConfirm={handleModalConfirm}
      />
    </Panel>
  )
}

function ParticipantRow({
  participant,
  match,
  isDragging,
  onDragStart,
  onDragEnd,
}: {
  participant: ContestMatchParticipant
  match: ContestMatch
  isDragging: boolean
  onDragStart: () => void
  onDragEnd: () => void
}) {
  const canDrag = Boolean(participant.registration_id)

  return (
    <div
      className={`flex flex-wrap items-center gap-2 transition-opacity ${
        isDragging ? "opacity-40" : "opacity-100"
      } ${canDrag ? "cursor-grab active:cursor-grabbing" : ""}`}
      draggable={canDrag}
      onDragStart={(event) => {
        if (!canDrag) {
          event.preventDefault()
          return
        }
        event.dataTransfer.setData(
          "text/plain",
          JSON.stringify({
            sourceMatchId: match.id,
            registrationId: participant.registration_id,
          }),
        )
        onDragStart()
      }}
      onDragEnd={onDragEnd}
    >
      {canDrag ? (
        <GripVertical className="size-4 shrink-0 text-[#747878] hover:text-orange-600 transition-colors" />
      ) : null}
      <p className={`text-xs font-extrabold ${participant.is_winner ? "text-emerald-700" : "text-[#1c1b1b]"}`}>
        {getMatchParticipantName(participant)}
      </p>
      <DriverTitleChip label={participant.registration?.driver_title_label} className="px-1.5 py-0 text-[9px]" />
      {participant.is_winner ? (
        <Badge variant="outline" className="border-emerald-200 bg-emerald-50 text-emerald-700 text-[9px] font-bold gap-1 px-1.5">
          <Trophy className="size-2.5" />
          Winner
        </Badge>
      ) : null}
    </div>
  )
}
