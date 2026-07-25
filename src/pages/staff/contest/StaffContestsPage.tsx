import { useMemo } from "react"
import { useQuery } from "@tanstack/react-query"
import { Flag, QrCode } from "lucide-react"
import { Link, useSearchParams } from "react-router"
import { routePaths } from "@/app/router/route-paths"
import { contestApi, contestQueryKeys } from "@/features/contests/api/contest.api"
import {
  getContestStatusClass,
  getContestStatusLabel,
} from "@/features/contests/lib/contest-status"
import type { ContestStatus } from "@/features/contests/types"
import { useStaffOperations } from "../context/StaffOperationContext"
import { StaffSearchInput } from "../components/StaffSearchInput"
import { StaffSelect } from "../components/StaffSelect"
import { StaffBadge, StaffCard, StaffHeader } from "../components/StaffUI"

const statusOptions = [
  { value: "OPEN", label: "Đang mở đăng ký" },
  { value: "CLOSED", label: "Đã đóng đăng ký" },
  { value: "RUNNING", label: "Đang diễn ra" },
]

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
    queryKey: contestQueryKeys.list({
      cafeId: assignedCafeId,
      staff: true,
      query,
      status,
      contest_format_id: formatId,
    }),
    queryFn: () =>
      contestApi.listCafeContests(assignedCafeId!, {
        limit: 100,
        query: query || undefined,
        status: (status || undefined) as ContestStatus | undefined,
        contest_format_id: formatId || undefined,
      }),
    enabled: Boolean(assignedCafeId),
  })

  const contests = useMemo(
    () =>
      (contestsQuery.data?.data ?? []).filter((contest) =>
        ["OPEN", "CLOSED", "RUNNING"].includes(contest.status),
      ),
    [contestsQuery.data],
  )

  const formatOptions = useMemo(
    () =>
      (formatsQuery.data ?? []).map((format) => ({
        value: format.id,
        label: format.name,
      })),
    [formatsQuery.data],
  )

  return (
    <div className="space-y-6">
      <StaffHeader
        title="Danh sách giải đấu"
        subtitle="Chọn giải đấu thuộc cơ sở hiện tại để tra cứu người đăng ký và thực hiện điểm danh."
      />

      <div className="grid gap-3 rounded-xl border border-[#e5e2e1] bg-white p-4 lg:grid-cols-3">
        <StaffSearchInput
          value={query}
          onChange={(value) =>
            updateContestFilters(searchParams, setSearchParams, { query: value })
          }
          placeholder="Tìm theo tên giải đấu"
        />
        <StaffSelect
          value={status}
          onChange={(value) =>
            updateContestFilters(searchParams, setSearchParams, {
              status: value,
            })
          }
          options={statusOptions}
          placeholder="Tất cả trạng thái"
        />
        <StaffSelect
          value={formatId}
          onChange={(value) =>
            updateContestFilters(searchParams, setSearchParams, {
              contest_format_id: value,
            })
          }
          options={formatOptions}
          placeholder="Tất cả thể thức"
        />
      </div>

      {contestsQuery.isLoading ? (
        <div className="space-y-3">
          {Array.from({ length: 3 }).map((_, index) => (
            <div
              key={index}
              className="h-28 animate-pulse rounded-xl bg-[#f5f3f2]"
            />
          ))}
        </div>
      ) : contests.length === 0 ? (
        <StaffCard className="py-10 text-center">
          <Flag className="mx-auto size-8 text-[#c4c7c8]" />
          <p className="mt-3 text-sm font-bold text-[#4c4a49]">
            Không có giải đấu phù hợp.
          </p>
        </StaffCard>
      ) : (
        <div className="grid gap-4 lg:grid-cols-2">
          {contests.map((contest) => (
            <StaffContestCard key={contest.id} contest={contest} />
          ))}
        </div>
      )}
    </div>
  )
}

function StaffContestCard({
  contest,
}: {
  contest: import("@/features/contests/types").ContestItem
}) {
  return (
    <StaffCard className="space-y-4">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h3 className="text-lg font-extrabold text-[#1c1b1b]">
            {contest.name}
          </h3>
          <p className="mt-1 text-sm font-semibold text-[#6b7280]">
            {contest.contest_format?.name ?? "--"} ·{" "}
            {contest.host_branch?.cafe?.name ?? "--"}
          </p>
        </div>
        <span
          className={`inline-flex rounded-full border px-2.5 py-1 text-xs font-bold ${getContestStatusClass(contest.status)}`}
        >
          {getContestStatusLabel(contest.status)}
        </span>
      </div>
      <div className="flex flex-wrap gap-2">
        <StaffBadge variant="neutral">
          Chi nhánh tham gia: {contest.participating_branches.length}
        </StaffBadge>
        <StaffBadge variant="orange">
          Lệ phí tham gia: {contest.entry_fee.toLocaleString("vi-VN")}đ
        </StaffBadge>
      </div>
      <div className="flex flex-wrap gap-2">
        <Link
          to={routePaths.staffContestCheckIn.replace(
            ":contestId",
            contest.id,
          )}
          className="inline-flex items-center gap-2 rounded-lg bg-[#ea580c] px-4 py-2 text-sm font-bold text-white hover:bg-[#d94e0b]"
        >
          <QrCode className="size-4" />
          Mở điểm danh
        </Link>
        <Link
          to={routePaths.staffContestRuntime.replace(
            ":contestId",
            contest.id,
          )}
          className="inline-flex items-center gap-2 rounded-lg border border-blue-200 bg-blue-50 px-4 py-2 text-sm font-bold text-blue-700 hover:bg-blue-100"
        >
          <Flag className="size-4" />
          Vận hành lượt đấu
        </Link>
      </div>
    </StaffCard>
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
