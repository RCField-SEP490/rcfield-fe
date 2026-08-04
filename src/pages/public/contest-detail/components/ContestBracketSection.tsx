import { Swords, Timer, Trophy } from "lucide-react"

import {
  formatContestDateTime,
  formatDurationSeconds,
  formatMatchLabel,
  getMatchParticipantName,
  getQualifyingStandings,
  isQualifyingFinalFormat,
  splitMatchesByPhase,
} from "@/features/contests/lib/contest-runtime"
import { MatchStatusBadge } from "@/features/contests/components"
import { getContestStatusLabel } from "@/features/contests/lib/contest-status"
import type {
  ContestHighlightRound,
  ContestItem,
  ContestMatch,
  ContestMatchParticipant,
  ContestRegistration,
} from "@/features/contests/types"
import { DriverTitleChip } from "@/features/racing/components/DriverTitleChip"
import { Card } from "@/shared/ui/card"
import { EmptyState } from "@/shared/ui/empty-state"
import { CardListSkeleton } from "@/shared/ui/loading-state"

import { Info } from "./DetailPrimitives"

export function ContestRuntimeOverview({
  effectiveStatus,
  runtimeSummary,
  highlightRounds,
}: {
  effectiveStatus: ContestItem["status"]
  runtimeSummary: ContestItem["runtime_summary"]
  highlightRounds: ContestHighlightRound[]
}) {
  return (
    <>
      <Card className="rounded-3xl border border-slate-200/80 p-6 sm:p-8 shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h3 className="text-lg font-extrabold text-slate-900">
              Theo dõi các vòng đấu
            </h3>
            <p className="mt-1 text-sm text-slate-500">
              Public có thể xem bracket, danh sách người đi tiếp và lịch sử thi
              đấu khi giải đang diễn ra hoặc đã hoàn thành.
            </p>
          </div>
          <span className="rounded-full border border-orange-200 bg-orange-50 px-3 py-1 text-xs font-bold text-orange-700">
            {getContestStatusLabel(effectiveStatus)}
          </span>
        </div>
        <div className="mt-5 grid gap-3 sm:grid-cols-4">
          <Info
            label="Tổng số trận"
            value={String(runtimeSummary?.total_matches ?? 0)}
          />
          <Info
            label="Tổng số vòng"
            value={String(runtimeSummary?.total_rounds ?? 0)}
          />
          <Info
            label="Vòng hiện tại"
            value={
              runtimeSummary?.current_round_no
                ? `Vòng ${runtimeSummary.current_round_no}`
                : "--"
            }
          />
          <Info
            label="Đã hoàn thành"
            value={String(runtimeSummary?.completed_matches ?? 0)}
          />
        </div>
      </Card>

      <Card className="rounded-3xl border border-slate-200/80 p-6 shadow-sm">
        <div className="flex items-center gap-2">
          <Trophy className="size-5 text-orange-500" />
          <h3 className="text-lg font-extrabold text-slate-900">
            Người đã vào vòng trong
          </h3>
        </div>
        <div className="mt-5 space-y-4">
          {highlightRounds.length === 0 ? (
            <EmptyState
              title="Chưa có dữ liệu vòng đấu nổi bật để hiển thị."
              className="rounded-2xl border-slate-200 p-5"
            />
          ) : (
            highlightRounds.map((round) => (
              <div
                key={round.round_no}
                className="rounded-2xl border border-slate-200 bg-slate-50/60 p-4"
              >
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div>
                    <p className="text-sm font-extrabold text-slate-900">
                      {round.label || `Vòng ${round.round_no}`}
                    </p>
                    <p className="text-xs font-semibold text-slate-500">
                      {round.completed_match_count}/{round.match_count} trận đã
                      chốt kết quả
                    </p>
                  </div>
                  <span className="rounded-full bg-slate-900 px-3 py-1 text-[11px] font-bold text-white">
                    {round.winners.length} người đi tiếp
                  </span>
                </div>
                <div className="mt-4 grid gap-3 sm:grid-cols-2">
                  {round.winners.map((winner) => (
                    <div
                      key={`${round.round_no}-${winner.registration_id}`}
                      className="rounded-xl border border-orange-100 bg-white p-3"
                    >
                      <p className="font-bold text-slate-900">
                        {winner.participant_name ??
                          winner.participant_email ??
                          `Registration ${winner.registration_id.slice(0, 8)}`}
                      </p>
                      <p className="mt-1 text-xs text-slate-500">
                        Đi tiếp từ{" "}
                        {winner.source_match_name ?? "trận đã hoàn thành"}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            ))
          )}
        </div>
      </Card>
    </>
  )
}

export function ContestBracketBoard({
  matches,
  groupedMatches,
  existingRegistration,
  loading,
  format,
}: {
  matches: ContestMatch[]
  groupedMatches: Array<{ roundNo: number; matches: ContestMatch[] }>
  existingRegistration: ContestRegistration | null
  loading: boolean
  format?: string
}) {
  if (isQualifyingFinalFormat(format)) {
    return (
      <QualifyingFinalBracketBoard
        matches={matches}
        existingRegistration={existingRegistration}
        loading={loading}
      />
    )
  }

  return (
    <Card className="rounded-3xl border border-slate-200/80 p-6 sm:p-8 shadow-sm">
      <div className="flex items-center gap-2 text-slate-900">
        <Swords className="size-5 text-orange-500" />
        <h3 className="text-lg font-extrabold">Sơ đồ thi đấu</h3>
      </div>
      <p className="mt-2 text-sm text-slate-500">
        Hiển thị theo từng vòng, đồng thời tô nổi các trận có bạn tham gia nếu
        bạn đã đăng ký vào giải.
      </p>

      <div className="mt-5">
        {loading ? (
          <CardListSkeleton
            count={3}
            className="grid gap-4 space-y-0 lg:grid-cols-3"
            itemClassName="h-72 rounded-2xl"
          />
        ) : matches.length === 0 ? (
          <EmptyState
            title="Chưa có trận nào được công bố trên bracket của giải đấu này."
            className="rounded-2xl border-slate-200 p-6"
          />
        ) : (
          <BracketRoundColumns
            groups={groupedMatches}
            existingRegistration={existingRegistration}
          />
        )}
      </div>
    </Card>
  )
}

function QualifyingFinalBracketBoard({
  matches,
  existingRegistration,
  loading,
}: {
  matches: ContestMatch[]
  existingRegistration: ContestRegistration | null
  loading: boolean
}) {
  const { qualifying, final } = splitMatchesByPhase(matches)
  const standings = getQualifyingStandings(qualifying)
  const finalGroups = groupMatchesByRoundLocal(final)

  return (
    <>
      <Card className="rounded-3xl border border-slate-200/80 p-6 sm:p-8 shadow-sm">
        <div className="flex items-center gap-2 text-slate-900">
          <Timer className="size-5 text-orange-500" />
          <h3 className="text-lg font-extrabold">Vòng loại (Qualifying)</h3>
        </div>
        <p className="mt-2 text-sm text-slate-500">
          Mỗi VĐV chạy một lượt tính giờ, xếp hạng theo lap tốt nhất. Các VĐV
          đứng đầu bảng sẽ vào nhánh chung kết knockout.
        </p>

        <div className="mt-5">
          {loading ? (
            <CardListSkeleton
              count={2}
              className="grid gap-4 space-y-0 lg:grid-cols-2"
              itemClassName="h-40 rounded-2xl"
            />
          ) : standings.length === 0 ? (
            <EmptyState
              title="Chưa có kết quả vòng loại nào được công bố."
              className="rounded-2xl border-slate-200 p-6"
            />
          ) : (
            <div className="overflow-x-auto rounded-2xl border border-slate-200">
              <table className="w-full min-w-[520px] text-sm">
                <thead>
                  <tr className="border-b border-slate-200 bg-slate-50/60 text-left text-xs font-extrabold uppercase tracking-wider text-slate-400">
                    <th className="px-4 py-3">Hạng</th>
                    <th className="px-4 py-3">VĐV</th>
                    <th className="px-4 py-3">Lap tốt nhất</th>
                    <th className="px-4 py-3">Tổng thời gian</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {standings.map((standing, index) => {
                    const isMine =
                      standing.participant.registration?.is_my_registration ||
                      standing.registrationId === existingRegistration?.id
                    return (
                      <tr
                        key={standing.registrationId}
                        className={isMine ? "bg-orange-50/60" : undefined}
                      >
                        <td className="px-4 py-3 font-bold text-slate-900">
                          {index + 1}
                        </td>
                        <td className="px-4 py-3">
                          <span className="flex flex-wrap items-center gap-2 font-bold text-slate-900">
                            {getMatchParticipantName(standing.participant)}
                            <DriverTitleChip
                              label={
                                standing.participant.registration
                                  ?.driver_title_label
                              }
                            />
                          </span>
                        </td>
                        <td className="px-4 py-3 font-semibold text-slate-600">
                          {formatDurationSeconds(standing.bestLapSeconds)}
                        </td>
                        <td className="px-4 py-3 font-semibold text-slate-600">
                          {formatDurationSeconds(standing.totalTimeSeconds)}
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </Card>

      <Card className="rounded-3xl border border-slate-200/80 p-6 sm:p-8 shadow-sm">
        <div className="flex items-center gap-2 text-slate-900">
          <Swords className="size-5 text-orange-500" />
          <h3 className="text-lg font-extrabold">Chung kết (Final)</h3>
        </div>
        <p className="mt-2 text-sm text-slate-500">
          Nhánh knockout dành cho các VĐV vượt qua vòng loại, xếp seed theo hạng
          qualifying.
        </p>

        <div className="mt-5">
          {loading ? (
            <CardListSkeleton
              count={3}
              className="grid gap-4 space-y-0 lg:grid-cols-3"
              itemClassName="h-72 rounded-2xl"
            />
          ) : final.length === 0 ? (
            <EmptyState
              title="Chưa có nhánh chung kết. Ban tổ chức sẽ công bố sau khi vòng loại kết thúc."
              className="rounded-2xl border-slate-200 p-6"
            />
          ) : (
            <BracketRoundColumns
              groups={finalGroups}
              existingRegistration={existingRegistration}
            />
          )}
        </div>
      </Card>
    </>
  )
}

function groupMatchesByRoundLocal(matches: ContestMatch[]) {
  return matches.reduce<Array<{ roundNo: number; matches: ContestMatch[] }>>(
    (groups, match) => {
      const group = groups.find((item) => item.roundNo === match.round_no)
      if (group) {
        group.matches.push(match)
        return groups
      }
      groups.push({ roundNo: match.round_no, matches: [match] })
      return groups
    },
    [],
  )
}

function BracketRoundColumns({
  groups,
  existingRegistration,
}: {
  groups: Array<{ roundNo: number; matches: ContestMatch[] }>
  existingRegistration: ContestRegistration | null
}) {
  return (
    <div className="overflow-x-auto">
      <div className="flex min-w-max gap-4 pb-2">
        {groups.map((group) => (
          <section key={group.roundNo} className="w-[320px] shrink-0 space-y-3">
            <div>
              <p className="text-xs font-extrabold uppercase tracking-wider text-slate-400">
                Vòng {group.roundNo}
              </p>
            </div>
            {group.matches.map((match) => (
              <BracketMatchCard
                key={match.id}
                match={match}
                existingRegistration={existingRegistration}
              />
            ))}
          </section>
        ))}
      </div>
    </div>
  )
}

function BracketMatchCard({
  match,
  existingRegistration,
}: {
  match: ContestMatch
  existingRegistration: ContestRegistration | null
}) {
  const hasMyParticipant = match.participants.some(
    (participant) =>
      participant.registration?.is_my_registration ||
      participant.registration_id === existingRegistration?.id,
  )
  return (
    <article
      className={`rounded-2xl border p-4 ${
        hasMyParticipant
          ? "border-orange-200 bg-orange-50/60"
          : "border-slate-200 bg-white"
      }`}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-sm font-extrabold text-slate-900">
            {formatMatchLabel(match)}
          </p>
          <p className="mt-1 text-xs font-semibold text-slate-500">
            {formatContestDateTime(match.scheduled_at)}
          </p>
        </div>
        <MatchStatusBadge
          status={match.status}
          className="h-auto px-2.5 py-1 text-[11px] font-bold"
        />
      </div>
      <div className="mt-3 space-y-2">
        {match.participants.length > 0 ? (
          match.participants.map((participant) => (
            <BracketParticipantRow
              key={participant.id}
              participant={participant}
              highlight={
                participant.registration?.is_my_registration ||
                participant.registration_id === existingRegistration?.id
              }
            />
          ))
        ) : (
          <div className="rounded-xl border border-dashed border-slate-200 px-3 py-3 text-sm text-slate-500">
            Chưa chốt người thi đấu cho trận này.
          </div>
        )}
      </div>
    </article>
  )
}

function BracketParticipantRow({
  participant,
  highlight = false,
}: {
  participant: ContestMatchParticipant
  highlight?: boolean
}) {
  return (
    <div
      className={`rounded-xl border px-3 py-3 ${
        highlight
          ? "border-orange-200 bg-white"
          : "border-slate-200 bg-slate-50/60"
      }`}
    >
      <div className="flex flex-wrap items-center gap-2">
        <p className="text-sm font-bold text-slate-900">
          {getMatchParticipantName(participant)}
        </p>
        <DriverTitleChip label={participant.registration?.driver_title_label} />
        {participant.is_winner ? (
          <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-[10px] font-bold text-emerald-700">
            Winner
          </span>
        ) : null}
      </div>
      <p className="mt-1 text-xs font-semibold text-slate-500">
        {participant.status}
        {participant.finish_position
          ? ` · Về ${participant.finish_position}`
          : ""}
      </p>
    </div>
  )
}
