import { useMemo } from "react"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { AlertTriangle, CheckCircle2, Flag, Pencil, Play, Plus, Square, Trash2, Users } from "lucide-react"
import { Link, useNavigate, useSearchParams } from "react-router"
import { toast } from "sonner"

import { routePaths } from "@/app/router/route-paths"
import { contestApi, contestQueryKeys } from "@/features/contests/api/contest.api"
import { getContestStatusClass } from "@/features/contests/lib/contest-status"
import type { ContestItem, ContestStatus } from "@/features/contests/types"
import { Panel, PanelTitle, ProviderPageHeader } from "@/pages/provider/components/ProviderPrimitives"
import { getContestWorkspacePath } from "@/pages/provider/contest-runtime/contest-workspace"
import { ProviderShell } from "@/pages/provider/components/ProviderShell"
import { Badge } from "@/shared/ui/badge"
import { Button } from "@/shared/ui/button"

export function ProviderContestsPage() {
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const [searchParams, setSearchParams] = useSearchParams()
  const query = searchParams.get("query") ?? ""
  const status = searchParams.get("status") ?? ""
  const formatId = searchParams.get("contest_format_id") ?? ""
  const formatsQuery = useQuery({
    queryKey: contestQueryKeys.catalogFormats(),
    queryFn: contestApi.listContestFormats,
  })

  const contestsQuery = useQuery({
    queryKey: contestQueryKeys.list({ scope: "managed", query, status, contest_format_id: formatId }),
    queryFn: () => contestApi.listContests({ scope: "managed", limit: 100, query: query || undefined, status: (status || undefined) as ContestStatus | undefined, contest_format_id: formatId || undefined }),
  })
  const laneCountsQuery = useQuery({
    queryKey: contestQueryKeys.list({ scope: "managed", query, contest_format_id: formatId, lanes: true }),
    queryFn: () => contestApi.listContests({ scope: "managed", limit: 100, query: query || undefined, contest_format_id: formatId || undefined }),
    enabled: Boolean(status),
  })

  const updateStatusMutation = useMutation({
    mutationFn: async ({ id, action }: { id: string; action: "open" | "close" | "cancel" }) => {
      if (action === "open") return contestApi.openContest(id)
      if (action === "close") return contestApi.closeContest(id)
      return contestApi.cancelContest(id)
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: contestQueryKeys.all })
    },
  })

  const contests = useMemo(
    () => contestsQuery.data?.data ?? [],
    [contestsQuery.data?.data],
  )
  const laneCountContests = useMemo(
    () => (status ? laneCountsQuery.data?.data ?? [] : contests),
    [status, laneCountsQuery.data?.data, contests],
  )
  const statusCounts = useMemo(() => {
    const counts: Record<string, number> = { ALL: laneCountContests.length }
    for (const contest of laneCountContests) {
      counts[contest.status] = (counts[contest.status] ?? 0) + 1
    }
    return counts
  }, [laneCountContests])

  const handleStatusAction = async (id: string, action: "open" | "close" | "cancel") => {
    try {
      await updateStatusMutation.mutateAsync({ id, action })
      toast.success("Đã cập nhật trạng thái contest")
    } catch (error) {
      toast.error("Không thể cập nhật trạng thái contest", {
        description: getErrorMessage(error),
      })
    }
  }

  return (
    <ProviderShell>
      <ProviderPageHeader
        title="Contest"
        description="Tạo và vận hành các giải đấu theo catalog loại giải, format và template lấy trực tiếp từ hệ thống."
        actions={
          <Button
            type="button"
            onClick={() => navigate(routePaths.providerContestCreate)}
            className="h-10 gap-2 rounded-lg bg-[#1c1b1b] px-4 text-white hover:bg-[#313030] font-bold"
          >
            <Plus className="size-4" />
            Tạo contest
          </Button>
        }
      />

      <Panel className="mt-4">
        <PanelTitle
          title="Danh sách contest"
          subtitle="Danh sách này dùng dữ liệu thật từ BE, không có mock hoặc danh mục hardcode ở FE."
        />
        <div className="mb-4 grid gap-3 lg:grid-cols-3">
          <input
            value={query}
            onChange={(event) => updateContestFilters(searchParams, setSearchParams, { query: event.target.value })}
            placeholder="Tìm theo tên contest"
            className="h-10 rounded-lg border border-[#c4c7c8] px-3 text-sm"
          />
          <select
            value={status}
            onChange={(event) => updateContestFilters(searchParams, setSearchParams, { status: event.target.value })}
            className="h-10 rounded-lg border border-[#c4c7c8] px-3 text-sm"
          >
            <option value="">Tất cả trạng thái</option>
            <option value="DRAFT">DRAFT</option>
            <option value="OPEN">OPEN</option>
            <option value="CLOSED">CLOSED</option>
            <option value="RUNNING">RUNNING</option>
            <option value="COMPLETED">COMPLETED</option>
            <option value="CANCELLED">CANCELLED</option>
          </select>
          <select
            value={formatId}
            onChange={(event) => updateContestFilters(searchParams, setSearchParams, { contest_format_id: event.target.value })}
            className="h-10 rounded-lg border border-[#c4c7c8] px-3 text-sm"
          >
            <option value="">Tất cả format</option>
            {(formatsQuery.data ?? []).map((format) => (
              <option key={format.id} value={format.id}>
                {format.name}
              </option>
            ))}
          </select>
        </div>
        <div className="mb-5 grid gap-2 sm:grid-cols-2 lg:grid-cols-6">
          {contestStatusLanes.map((lane) => {
            const isActive = status === lane.value || (!status && lane.value === "")
            return (
              <button
                key={lane.label}
                type="button"
                onClick={() => updateContestFilters(searchParams, setSearchParams, { status: lane.value })}
                className={`rounded-xl border px-3 py-3 text-left transition ${
                  isActive
                    ? "border-[#1f2424] bg-[#1f2424] text-white shadow-sm"
                    : "border-[#e5e2e1] bg-[#f7f4f2] text-[#1f2424] hover:border-orange-200 hover:bg-orange-50"
                }`}
              >
                <div className="flex items-center justify-between gap-2">
                  <span className="text-xs font-black uppercase">{lane.label}</span>
                  <span className={`rounded-full px-2 py-0.5 text-xs font-black ${isActive ? "bg-white/15 text-white" : "bg-white text-[#5d5f5f]"}`}>
                    {statusCounts[lane.value || "ALL"] ?? 0}
                  </span>
                </div>
                <p className={`mt-1 text-xs font-semibold ${isActive ? "text-white/75" : "text-[#747878]"}`}>
                  {lane.hint}
                </p>
              </button>
            )
          })}
        </div>

        {contestsQuery.isLoading ? (
          <div className="space-y-3">
            {Array.from({ length: 4 }).map((_, index) => (
              <div key={index} className="h-24 animate-pulse rounded-xl bg-[#f6f3f2]" />
            ))}
          </div>
        ) : contestsQuery.isError ? (
          <p className="rounded-xl border border-dashed border-[#c4c7c8] p-8 text-center text-sm font-semibold text-[#747878]">
            Không tải được danh sách contest.
          </p>
        ) : contests.length === 0 ? (
          <div className="rounded-xl border border-dashed border-[#c4c7c8] p-10 text-center">
            <Flag className="mx-auto size-8 text-[#c4c7c8]" />
            <p className="mt-3 text-sm font-semibold text-[#747878]">Chưa có contest nào.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {contests.map((contest) => (
              <article key={contest.id} className="rounded-xl border border-[#e5e2e1] bg-white p-5 shadow-sm">
                <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <Link
                        to={routePaths.providerContestEdit.replace(":contestId", contest.id)}
                        className="text-lg font-extrabold text-[#1c1b1b] hover:text-[#c2410c]"
                      >
                        {contest.name}
                      </Link>
                      <Badge className={`border ${getContestStatusClass(contest.status)}`}>{contest.status}</Badge>
                    </div>
                    <p className="mt-2 text-sm font-medium text-[#5d5f5f]">
                      {contest.description || "Chưa có mô tả contest."}
                    </p>
                    <div className="mt-3 flex flex-wrap gap-x-5 gap-y-2 text-xs font-semibold text-[#747878]">
                      <span>Loại: {contest.contest_type?.name ?? "--"}</span>
                      <span>Format: {contest.contest_format?.name ?? "--"}</span>
                      <span>Template: {contest.contest_template?.name ?? "--"}</span>
                      <span>Entry fee: {formatCurrency(contest.entry_fee)}</span>
                      <span>Chi nhánh: {contest.participating_branches.length}</span>
                    </div>
                    <ContestHealthBadges contest={contest} />
                  </div>

                  <div className="flex flex-wrap gap-2">
                    <Button
                      type="button"
                      variant="outline"
                      className="h-9 gap-2 rounded-lg border-[#c4c7c8] bg-[#f6f3f2] text-[#1c1b1b] hover:bg-[#ebe7e7]"
                      onClick={() => navigate(routePaths.providerContestEdit.replace(":contestId", contest.id))}
                    >
                      <Pencil className="size-4" />
                      Sửa
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      className="h-9 gap-2 rounded-lg border-blue-200 bg-blue-50 text-blue-700 hover:bg-blue-100"
                      onClick={() => navigate(getContestWorkspacePath(contest.id, "overview"))}
                    >
                      <Flag className="size-4" />
                      Vận hành
                    </Button>
                    {contest.status === "DRAFT" ? (
                      <Button
                        type="button"
                        className="h-9 gap-2 rounded-lg bg-emerald-600 text-white hover:bg-emerald-700"
                        onClick={() => void handleStatusAction(contest.id, "open")}
                      >
                        <Play className="size-4" />
                        Mở
                      </Button>
                    ) : null}
                    {contest.status === "OPEN" ? (
                      <Button
                        type="button"
                        className="h-9 gap-2 rounded-lg bg-amber-600 text-white hover:bg-amber-700"
                        onClick={() => void handleStatusAction(contest.id, "close")}
                      >
                        <Square className="size-4" />
                        Đóng đăng ký
                      </Button>
                    ) : null}
                    {!["COMPLETED", "CANCELLED"].includes(contest.status) ? (
                      <Button
                        type="button"
                        variant="outline"
                        className="h-9 gap-2 rounded-lg border-red-200 bg-red-50 text-red-700 hover:bg-red-100"
                        onClick={() => void handleStatusAction(contest.id, "cancel")}
                      >
                        <Trash2 className="size-4" />
                        Hủy
                      </Button>
                    ) : null}
                  </div>
                </div>
              </article>
            ))}
          </div>
        )}
      </Panel>
    </ProviderShell>
  )
}

const contestStatusLanes = [
  { label: "Tất cả", value: "", hint: "Toàn bộ contest" },
  { label: "Draft", value: "DRAFT", hint: "Chuẩn bị cấu hình" },
  { label: "Open", value: "OPEN", hint: "Đang nhận đăng ký" },
  { label: "Running", value: "RUNNING", hint: "Vận hành bracket" },
  { label: "Completed", value: "COMPLETED", hint: "Leaderboard/kết quả" },
  { label: "Cancelled", value: "CANCELLED", hint: "Đã hủy" },
] as const

function ContestHealthBadges({ contest }: { contest: ContestItem }) {
  const stats = contest.public_stats
  const registrationCount = stats?.registration_count ?? 0
  const confirmedCount = stats?.confirmed_count ?? 0
  const checkedInCount = stats?.checked_in_count ?? 0
  const capacityRemaining = stats?.capacity_remaining
  const staffCount = contest.staff_assignments?.length ?? 0
  const runtimeSummary = contest.runtime_summary
  const totalRounds = runtimeSummary?.total_rounds ?? 0
  const hasLiveMatches = Boolean(runtimeSummary?.has_live_matches)
  const leaderboardPublished = Boolean(contest.published_leaderboard)

  const badges = [
    {
      key: "registrations",
      icon: <Users className="size-3.5" />,
      label:
        capacityRemaining === null || capacityRemaining === undefined
          ? `${registrationCount} đăng ký`
          : `${registrationCount} đăng ký · còn ${capacityRemaining}`,
      tone: registrationCount > 0 ? "ok" : "warn",
    },
    {
      key: "approval",
      icon: confirmedCount > 0 ? <CheckCircle2 className="size-3.5" /> : <AlertTriangle className="size-3.5" />,
      label: `${confirmedCount} duyệt · ${checkedInCount} check-in`,
      tone: confirmedCount > 0 ? "ok" : "warn",
    },
    {
      key: "staff",
      icon: staffCount > 0 ? <CheckCircle2 className="size-3.5" /> : <AlertTriangle className="size-3.5" />,
      label: staffCount > 0 ? `${staffCount} staff` : "Chưa phân công staff",
      tone: staffCount > 0 ? "ok" : "warn",
    },
    {
      key: "runtime",
      icon: totalRounds > 0 ? <CheckCircle2 className="size-3.5" /> : <Flag className="size-3.5" />,
      label: hasLiveMatches ? "Có trận live" : totalRounds > 0 ? `${totalRounds} vòng đấu` : "Chưa tạo bracket",
      tone: hasLiveMatches ? "live" : totalRounds > 0 ? "ok" : "neutral",
    },
    {
      key: "leaderboard",
      icon: leaderboardPublished ? <CheckCircle2 className="size-3.5" /> : <AlertTriangle className="size-3.5" />,
      label: leaderboardPublished ? "Đã publish leaderboard" : "Chưa publish leaderboard",
      tone: leaderboardPublished ? "ok" : "neutral",
    },
  ] as const

  return (
    <div className="mt-4 flex flex-wrap gap-2">
      {badges.map((badge) => (
        <span
          key={badge.key}
          className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[11px] font-bold ${getHealthBadgeClass(badge.tone)}`}
        >
          {badge.icon}
          {badge.label}
        </span>
      ))}
    </div>
  )
}

function getHealthBadgeClass(tone: "ok" | "warn" | "neutral" | "live") {
  switch (tone) {
    case "ok":
      return "border-emerald-200 bg-emerald-50 text-emerald-700"
    case "warn":
      return "border-amber-200 bg-amber-50 text-amber-800"
    case "live":
      return "border-blue-200 bg-blue-50 text-blue-700"
    default:
      return "border-[#e5e2e1] bg-[#f6f3f2] text-[#5d5f5f]"
  }
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

function formatCurrency(value: number) {
  return new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND", maximumFractionDigits: 0 }).format(value)
}

function getErrorMessage(error: unknown) {
  const maybe = error as { response?: { data?: { message?: string } } }
  return maybe.response?.data?.message ?? "Vui lòng thử lại."
}
