import { useMemo, useState } from "react"
import { useParams, useSearchParams } from "react-router"
import { useQuery } from "@tanstack/react-query"

import {
  contestApi,
  contestQueryKeys,
} from "@/features/contests/api/contest.api"
import { useContestRuntime } from "@/features/contests/hooks/useContestRuntime"
import { getMatchStatusLabel } from "@/features/contests/lib/contest-status"
import type { ContestMatchStatus } from "@/features/contests/types"
import { ContestMatchBoard } from "@/pages/provider/contest-runtime/components/ContestMatchBoard"
import { ContestMatchDetailPanel } from "@/pages/provider/contest-runtime/components/match-detail/ContestMatchDetailPanel"
import { StaffSearchInput } from "../components/StaffSearchInput"
import { StaffSelect } from "../components/StaffSelect"
import { StaffCard, StaffHeader } from "../components/StaffUI"

const matchStatusOptions = [
  { value: "DRAFT", label: getMatchStatusLabel("DRAFT") },
  { value: "READY", label: getMatchStatusLabel("READY") },
  { value: "RUNNING", label: getMatchStatusLabel("RUNNING") },
  { value: "COMPLETED", label: getMatchStatusLabel("COMPLETED") },
  { value: "CANCELLED", label: getMatchStatusLabel("CANCELLED") },
]

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
  const matches = useMemo(
    () => runtime.matchesQuery.data ?? [],
    [runtime.matchesQuery.data],
  )
  const selectedMatch = useMemo(
    () =>
      matches.find((match) => match.id === selectedMatchId) ??
      matches[0] ??
      null,
    [matches, selectedMatchId],
  )

  if (!contest) {
    return (
      <div className="space-y-6">
        <StaffHeader
          title="Vận hành lượt đấu"
          subtitle="Không tìm thấy giải đấu để vận hành lượt đấu."
        />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <StaffHeader
        title={`${contest.name} · Vận hành lượt đấu`}
        subtitle="Nhân viên được phân công có thể xem lượt đấu, đổi thứ tự người chơi, nhập kết quả và chuyển sang lượt tiếp theo."
      />

      <StaffCard className="grid gap-3 lg:grid-cols-3">
        <StaffSearchInput
          value={participantQuery}
          onChange={(value) =>
            updateRuntimeParams(searchParams, setSearchParams, {
              participantQuery: value,
            })
          }
          placeholder="Tìm người chơi theo tên"
        />
        <StaffSelect
          value={matchStatus}
          onChange={(value) =>
            updateRuntimeParams(searchParams, setSearchParams, {
              matchStatus: value,
            })
          }
          options={matchStatusOptions}
          placeholder="Tất cả trạng thái lượt đấu"
        />
        <StaffSearchInput
          value={roundNo}
          onChange={(value) =>
            updateRuntimeParams(searchParams, setSearchParams, {
              roundNo: value.replace(/[^\d]/g, ""),
            })
          }
          placeholder="Lọc theo vòng"
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
