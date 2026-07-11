import { useMemo } from "react"
import { useQuery } from "@tanstack/react-query"
import { Flag, QrCode } from "lucide-react"
import { Link } from "react-router"
import { routePaths } from "@/app/router/route-paths"
import { contestApi, contestQueryKeys } from "@/features/contests/api/contest.api"
import { getContestStatusClass } from "@/features/contests/lib/contest-status"
import { useStaffOperations } from "../context/StaffOperationContext"
import { StaffBadge, StaffCard, StaffHeader } from "../components/StaffUI"

export default function StaffContestsPage() {
  const { assignedCafeId } = useStaffOperations()

  const contestsQuery = useQuery({
    queryKey: contestQueryKeys.list({ cafeId: assignedCafeId, staff: true }),
    queryFn: () => contestApi.listCafeContests(assignedCafeId!, { limit: 100 }),
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
              <Link
                to={routePaths.staffContestCheckIn.replace(":contestId", contest.id)}
                className="inline-flex items-center gap-2 rounded-lg bg-[#ea580c] px-4 py-2 text-sm font-bold text-white hover:bg-[#d94e0b]"
              >
                <QrCode className="size-4" />
                Mở check-in
              </Link>
            </StaffCard>
          ))}
        </div>
      )}
    </div>
  )
}
