import { useMemo } from "react"
import { useQuery } from "@tanstack/react-query"
import { Flag, QrCode } from "lucide-react"
import { Link, useSearchParams } from "react-router"
import { routePaths } from "@/app/router/route-paths"
import { contestApi, contestQueryKeys } from "@/features/contests/api/contest.api"
import { getContestStatusClass } from "@/features/contests/lib/contest-status"
import type { ContestStatus } from "@/features/contests/types"
import { useStaffOperations } from "../context/StaffOperationContext"
import { StaffBadge, StaffCard, StaffHeader } from "../components/StaffUI"

export default function StaffContestsPage() {
  const { assignedCafeId } = useStaffOperations()
  const [searchParams, setSearchParams] = useSearchParams()
  const query = searchParams.get("query") ?? ""
  const status = searchParams.get("status") ?? ""
  const formatId = searchParams.get("contest_format_id") ?? ""
  const formatsQuery = useQuery({
    queryKey: contestQueryKeys.catalogFormats(),
    queryFn: contestApi.listContestFormats,
  })

  const contestsQuery = useQuery({
    queryKey: contestQueryKeys.list({ cafeId: assignedCafeId, staff: true, query, status, contest_format_id: formatId }),
    queryFn: () => contestApi.listCafeContests(assignedCafeId!, { limit: 100, query: query || undefined, status: (status || undefined) as ContestStatus | undefined, contest_format_id: formatId || undefined }),
    enabled: Boolean(assignedCafeId),
  })

  const contests = useMemo(
    () =>
      (contestsQuery.data?.data ?? []).filter((contest) =>
        ["OPEN", "CLOSED", "RUNNING"].includes(contest.status),
      ),
    [contestsQuery.data],
  )

  return (
    <div className="space-y-6">
      <StaffHeader
        title="Contest event-day"
        subtitle="Chọn contest thuộc branch hiện tại để tra cứu registration và thực hiện check-in."
      />

      <div className="grid gap-3 rounded-xl border border-[#e5e2e1] bg-white p-4 lg:grid-cols-3">
        <input
          value={query}
          onChange={(event) => updateContestFilters(searchParams, setSearchParams, { query: event.target.value })}
          placeholder="Tìm theo tên contest"
          className="h-10 rounded-lg border border-[#d9d5d4] px-3 text-sm"
        />
        <select
          value={status}
          onChange={(event) => updateContestFilters(searchParams, setSearchParams, { status: event.target.value })}
          className="h-10 rounded-lg border border-[#d9d5d4] px-3 text-sm"
        >
          <option value="">Tất cả trạng thái</option>
          <option value="OPEN">OPEN</option>
          <option value="CLOSED">CLOSED</option>
          <option value="RUNNING">RUNNING</option>
        </select>
        <select
          value={formatId}
          onChange={(event) => updateContestFilters(searchParams, setSearchParams, { contest_format_id: event.target.value })}
          className="h-10 rounded-lg border border-[#d9d5d4] px-3 text-sm"
        >
          <option value="">Tất cả format</option>
          {(formatsQuery.data ?? []).map((format) => (
            <option key={format.id} value={format.id}>
              {format.name}
            </option>
          ))}
        </select>
      </div>

      {contestsQuery.isLoading ? (
        <div className="space-y-3">
          {Array.from({ length: 3 }).map((_, index) => (
            <div key={index} className="h-28 animate-pulse rounded-xl bg-[#f5f3f2]" />
          ))}
        </div>
      ) : contests.length === 0 ? (
        <StaffCard className="py-10 text-center">
          <Flag className="mx-auto size-8 text-[#c4c7c8]" />
          <p className="mt-3 text-sm font-bold text-[#4c4a49]">Không có contest phù hợp cho event-day.</p>
        </StaffCard>
      ) : (
        <div className="grid gap-4 lg:grid-cols-2">
          {contests.map((contest) => (
            <StaffCard key={contest.id} className="space-y-4">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <h3 className="text-lg font-extrabold text-[#1c1b1b]">{contest.name}</h3>
                  <p className="mt-1 text-sm font-semibold text-[#6b7280]">
                    {contest.contest_format?.name ?? "--"} · {contest.host_branch?.cafe?.name ?? "--"}
                  </p>
                </div>
                <span className={`inline-flex rounded-full border px-2.5 py-1 text-xs font-bold ${getContestStatusClass(contest.status)}`}>
                  {contest.status}
                </span>
              </div>
              <div className="flex flex-wrap gap-2">
                <StaffBadge variant="neutral">Branches: {contest.participating_branches.length}</StaffBadge>
                <StaffBadge variant="orange">Entry fee: {contest.entry_fee.toLocaleString("vi-VN")}đ</StaffBadge>
              </div>
              <div className="flex flex-wrap gap-2">
                <Link
                  to={routePaths.staffContestCheckIn.replace(":contestId", contest.id)}
                  className="inline-flex items-center gap-2 rounded-lg bg-[#ea580c] px-4 py-2 text-sm font-bold text-white hover:bg-[#d94e0b]"
                >
                  <QrCode className="size-4" />
                  Mở check-in
                </Link>
                <Link
                  to={routePaths.staffContestRuntime.replace(":contestId", contest.id)}
                  className="inline-flex items-center gap-2 rounded-lg border border-blue-200 bg-blue-50 px-4 py-2 text-sm font-bold text-blue-700 hover:bg-blue-100"
                >
                  <Flag className="size-4" />
                  Match runtime
                </Link>
              </div>
            </StaffCard>
          ))}
        </div>
      )}
    </div>
  )
}

function updateContestFilters(
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
