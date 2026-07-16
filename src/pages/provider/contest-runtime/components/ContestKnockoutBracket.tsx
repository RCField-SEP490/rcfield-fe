import { useMemo } from "react"
import { DriverTitleChip } from "@/features/racing/components/DriverTitleChip"
import { formatMatchLabel, formatContestDateTime, getMatchParticipantName, groupMatchesByRound } from "@/features/contests/lib/contest-runtime"
import { getMatchStatusClass, getMatchStatusLabel } from "@/features/contests/lib/contest-status"
import type { ContestMatch } from "@/features/contests/types"
import { Panel, PanelTitle } from "@/pages/provider/components/ProviderPrimitives"
import { Badge } from "@/shared/ui/badge"
import { Button } from "@/shared/ui/button"

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
  ) => void
  onUndo: () => void
  onCommit: () => void
  canUndo: boolean
  hasChanges: boolean
}) {
  const groups = useMemo(() => groupMatchesByRound(matches), [matches])

  return (
    <Panel>
      <PanelTitle
        title="Sơ đồ nhánh đấu"
        subtitle="Kéo người đi tiếp sang trận kế tiếp, bấm lưu sơ đồ rồi mới nhập kết quả cho trận đã đủ người."
        action={
          <div className="flex flex-wrap items-center gap-2">
            <Button
              type="button"
              variant="outline"
              className="rounded-lg"
              disabled={!canUndo}
              onClick={onUndo}
            >
              Back
            </Button>
            <Button
              type="button"
              className="rounded-lg bg-[#1c1b1b] text-white hover:bg-[#313030]"
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
                <div>
                  <p className="text-xs font-extrabold uppercase tracking-wider text-[#747878]">Vòng {group.roundNo}</p>
                </div>
                {group.matches.map((match) => (
                  <button
                    key={match.id}
                    type="button"
                    onClick={() => onSelectMatch(match.id)}
                    className={`w-full rounded-xl border p-4 text-left transition-colors ${
                      selectedMatchId === match.id
                        ? "border-orange-200 bg-orange-50"
                        : "border-[#e5e2e1] bg-white hover:bg-[#fcf8f8]"
                    }`}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <p className="text-sm font-extrabold text-[#1c1b1b]">{formatMatchLabel(match)}</p>
                        <p className="mt-1 text-xs font-semibold text-[#747878]">
                          {formatContestDateTime(match.scheduled_at)}
                        </p>
                      </div>
                      <Badge className={`border ${getMatchStatusClass(match.status)}`}>{getMatchStatusLabel(match.status)}</Badge>
                    </div>

                    <div className="mt-3 space-y-2">
                      {[0, 1].map((index) => {
                        const participant = match.participants[index]
                        return (
                          <div
                            key={index}
                            className="rounded-lg border border-[#e5e2e1] bg-[#fcf8f8] px-3 py-2"
                            onDragOver={(event) => event.preventDefault()}
                            onDrop={(event) => {
                              const payload = event.dataTransfer.getData("text/plain")
                              if (!payload) return
                              try {
                                const parsed = JSON.parse(payload) as {
                                  sourceMatchId: string
                                  registrationId: string
                                }
                                onStageAdvance(
                                  parsed.sourceMatchId,
                                  match.id,
                                  parsed.registrationId,
                                )
                              } catch {
                                return
                              }
                            }}
                          >
                            {participant ? (
                              <>
                                <div className="flex flex-wrap items-center gap-2">
                                  <p
                                    className="text-sm font-bold text-[#1c1b1b]"
                                    draggable={Boolean(match.next_match_id)}
                                    onDragStart={(event) => {
                                      event.dataTransfer.setData(
                                        "text/plain",
                                        JSON.stringify({
                                          sourceMatchId: match.id,
                                          registrationId:
                                            participant.registration_id,
                                        }),
                                      )
                                    }}
                                  >
                                    {getMatchParticipantName(participant)}
                                  </p>
                                  <DriverTitleChip label={participant.registration?.driver_title_label} className="px-2 py-0 text-[10px]" />
                                </div>
                                <p className="mt-1 text-xs font-semibold text-[#747878]">
                                  {participant.is_winner ? "Đang là người thắng" : participant.status}
                                </p>
                              </>
                            ) : (
                              <p className="text-sm font-semibold text-[#747878]">Thả người thi đấu vào đây</p>
                            )}
                          </div>
                        )
                      })}
                    </div>
                  </button>
                ))}
              </section>
            ))}
          </div>
        </div>
      )}
    </Panel>
  )
}
