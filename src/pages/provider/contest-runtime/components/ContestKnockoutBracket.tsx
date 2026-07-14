import { useMemo } from "react"
import { DriverTitleChip } from "@/features/racing/components/DriverTitleChip"
import { formatMatchLabel, formatContestDateTime, getMatchParticipantName, groupMatchesByRound } from "@/features/contests/lib/contest-runtime"
import { getMatchStatusClass, getMatchStatusLabel } from "@/features/contests/lib/contest-status"
import type { ContestMatch } from "@/features/contests/types"
import { Panel, PanelTitle } from "@/pages/provider/components/ProviderPrimitives"
import { Badge } from "@/shared/ui/badge"

export function ContestKnockoutBracket({
  matches,
  selectedMatchId,
  onSelectMatch,
}: {
  matches: ContestMatch[]
  selectedMatchId: string | null
  onSelectMatch: (matchId: string) => void
}) {
  const groups = useMemo(() => groupMatchesByRound(matches), [matches])

  return (
    <Panel>
      <PanelTitle title="Sơ đồ nhánh đấu" subtitle="Theo dõi các vòng kiểu World Cup và chọn từng trận để nhập kết quả." />

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
                          <div key={index} className="rounded-lg border border-[#e5e2e1] bg-[#fcf8f8] px-3 py-2">
                            {participant ? (
                              <>
                                <div className="flex flex-wrap items-center gap-2">
                                  <p className="text-sm font-bold text-[#1c1b1b]">{getMatchParticipantName(participant)}</p>
                                  <DriverTitleChip label={participant.registration?.driver_title_label} className="px-2 py-0 text-[10px]" />
                                </div>
                                <p className="mt-1 text-xs font-semibold text-[#747878]">
                                  {participant.is_winner ? "Đang là người thắng" : participant.status}
                                </p>
                              </>
                            ) : (
                              <p className="text-sm font-semibold text-[#747878]">Chờ xác định người thi đấu</p>
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
