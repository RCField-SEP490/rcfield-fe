import { useMemo, useState } from "react"
import { useParams, useSearchParams } from "react-router"
import { useQuery } from "@tanstack/react-query"

import { contestApi, contestQueryKeys } from "@/features/contests/api/contest.api"
import { useContestRuntime } from "@/features/contests/hooks/useContestRuntime"
import type { ContestMatchStatus } from "@/features/contests/types"
import { ContestMatchBoard } from "@/pages/provider/contest-runtime/components/ContestMatchBoard"
import { ContestMatchDetailPanel } from "@/pages/provider/contest-runtime/components/ContestMatchDetailPanel"
import { StaffCard, StaffHeader } from "../components/StaffUI"

export default function StaffContestRuntimePage() {
  const { contestId } = useParams()
  const [searchParams, setSearchParams] = useSearchParams()
  const participantQuery = searchParams.get("participantQuery") ?? ""
  const matchStatus = searchParams.get("matchStatus") ?? ""
  const roundNo = searchParams.get("roundNo") ?? ""
  const runtime = useContestRuntime(contestId, {
    matches: {
      participant_query: participantQuery || undefined,
      status: (matchStatus || undefined) as ContestMatchStatus | undefined,
      round_no: roundNo ? Number(roundNo) : undefined,
    },
  })
  const contestQuery = useQuery({
    queryKey: contestQueryKeys.detail(contestId),
    queryFn: () => contestApi.getContest(contestId!),
    enabled: Boolean(contestId),
  })
  const [selectedMatchId, setSelectedMatchId] = useState<string | null>(null)
  const contest = contestQuery.data
  const matches = runtime.matchesQuery.data ?? []
  const selectedMatch = useMemo(
    () => matches.find((match) => match.id === selectedMatchId) ?? matches[0] ?? null,
    [matches, selectedMatchId],
  )

  if (!contest) {
    return (
      <div className="space-y-6">
        <StaffHeader title="Match runtime" subtitle="Không tìm thấy contest để vận hành match." />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <StaffHeader
        title={`${contest.name} · Match runtime`}
        subtitle="Nhân viên được phân công có thể xem match, đổi thứ tự participant, nhập kết quả và advance match."
      />

      <StaffCard className="grid gap-3 lg:grid-cols-3">
        <input
          value={participantQuery}
          onChange={(event) => updateRuntimeParams(searchParams, setSearchParams, { participantQuery: event.target.value })}
          placeholder="Tìm participant theo tên"
          className="h-10 rounded-lg border border-[#d9d5d4] px-3 text-sm"
        />
        <select
          value={matchStatus}
          onChange={(event) => updateRuntimeParams(searchParams, setSearchParams, { matchStatus: event.target.value })}
          className="h-10 rounded-lg border border-[#d9d5d4] px-3 text-sm"
        >
          <option value="">Tất cả match status</option>
          <option value="DRAFT">DRAFT</option>
          <option value="READY">READY</option>
          <option value="RUNNING">RUNNING</option>
          <option value="COMPLETED">COMPLETED</option>
          <option value="CANCELLED">CANCELLED</option>
        </select>
        <input
          value={roundNo}
          onChange={(event) => updateRuntimeParams(searchParams, setSearchParams, { roundNo: event.target.value.replace(/[^\d]/g, "") })}
          placeholder="Lọc theo round"
          className="h-10 rounded-lg border border-[#d9d5d4] px-3 text-sm"
        />
      </StaffCard>

      <div className="space-y-4">
        <ContestMatchBoard
          contest={contest}
          registrations={[]}
          matches={matches}
          selectedMatchId={selectedMatch?.id ?? null}
          onSelectMatch={setSelectedMatchId}
          runtime={runtime}
          showGenerate={false}
        />
        <ContestMatchDetailPanel match={selectedMatch} runtime={runtime} />
      </div>
    </div>
  )
}

function updateRuntimeParams(
  currentParams: URLSearchParams,
  setSearchParams: ReturnType<typeof useSearchParams>[1],
  updates: Record<string, string>,
) {
  const next = new URLSearchParams(currentParams)
  for (const [key, value] of Object.entries(updates)) {
    if (!value) next.delete(key)
    else next.set(key, value)
  }
  setSearchParams(next)
}
