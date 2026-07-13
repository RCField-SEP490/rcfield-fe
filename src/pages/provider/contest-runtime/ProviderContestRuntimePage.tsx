import { useEffect, useMemo, useState } from "react"
import { BarChart3, CalendarCheck2, Flag, PlayCircle } from "lucide-react"
import { useNavigate, useParams, useSearchParams } from "react-router"
import { toast } from "sonner"
import { routePaths } from "@/app/router/route-paths"
import { useContestEventDay } from "@/features/contests/hooks/useContestEventDay"
import { useContestRuntime } from "@/features/contests/hooks/useContestRuntime"
import { getPublishedLeaderboard, getErrorMessage } from "@/features/contests/lib/contest-runtime"
import { getContestStatusClass } from "@/features/contests/lib/contest-status"
import type {
  ContestEntryFeePaymentStatus,
  ContestMatchStatus,
  ContestRegistrationStatus,
  ContestRuntimeTab,
} from "@/features/contests/types"
import { ContestAuditPanel } from "./components/ContestAuditPanel"
import { ContestEventDayPanel } from "./components/ContestEventDayPanel"
import { ContestLeaderboardPanel } from "./components/ContestLeaderboardPanel"
import { ContestMatchBoard } from "./components/ContestMatchBoard"
import { ContestMatchDetailPanel } from "./components/ContestMatchDetailPanel"
import { ContestRuntimeOverview } from "./components/ContestRuntimeOverview"
import { ContestRuntimeTabs } from "./components/ContestRuntimeTabs"
import { MetricCard, ProviderPageHeader } from "@/pages/provider/components/ProviderPrimitives"
import { ProviderShell } from "@/pages/provider/components/ProviderShell"
import { Badge } from "@/shared/ui/badge"
import { Button } from "@/shared/ui/button"

export function ProviderContestRuntimePage() {
  const navigate = useNavigate()
  const { contestId } = useParams()
  const [searchParams, setSearchParams] = useSearchParams()
  const activeTab = (searchParams.get("tab") as ContestRuntimeTab | null) ?? "overview"
  const registrationStatus = searchParams.get("registrationStatus") ?? ""
  const paymentStatus = searchParams.get("paymentStatus") ?? ""
  const registrationQuery = searchParams.get("registrationQuery") ?? ""
  const matchStatus = searchParams.get("matchStatus") ?? ""
  const participantQuery = searchParams.get("participantQuery") ?? ""
  const roundNo = searchParams.get("roundNo") ?? ""
  const runtime = useContestRuntime(contestId, {
    registrations: {
      status: (registrationStatus || undefined) as ContestRegistrationStatus | undefined,
      payment_status: (paymentStatus || undefined) as ContestEntryFeePaymentStatus | undefined,
      query: registrationQuery || undefined,
    },
    matches: {
      status: (matchStatus || undefined) as ContestMatchStatus | undefined,
      participant_query: participantQuery || undefined,
      round_no: roundNo ? Number(roundNo) : undefined,
    },
  })
  const eventDay = useContestEventDay(contestId)
  const [selectedMatchId, setSelectedMatchId] = useState<string | null>(null)
  const [selectedCafeId, setSelectedCafeId] = useState("")

  const contest = runtime.contestQuery.data
  const registrations = runtime.registrationsQuery.data ?? []
  const matches = runtime.matchesQuery.data ?? []
  const metrics = runtime.metricsQuery.data
  const auditLogs = runtime.auditLogsQuery.data ?? []
  const leaderboard = getPublishedLeaderboard(contest)
  const selectedMatch = useMemo(
    () => matches.find((match) => match.id === selectedMatchId) ?? null,
    [matches, selectedMatchId],
  )

  useEffect(() => {
    if (contest && !selectedCafeId) {
      setSelectedCafeId(contest.host_branch?.cafe_id ?? contest.participating_branches[0]?.cafe_id ?? "")
    }
  }, [contest, selectedCafeId])

  useEffect(() => {
    if (!selectedMatchId && matches.length > 0) {
      setSelectedMatchId(matches[0].id)
    }
  }, [matches, selectedMatchId])

  const handlePublishLeaderboard = async () => {
    try {
      await runtime.publishLeaderboardMutation.mutateAsync()
      toast.success("Đã publish leaderboard")
    } catch (error) {
      toast.error("Không thể publish leaderboard", { description: getErrorMessage(error).message })
    }
  }

  if (runtime.contestQuery.isLoading) {
    return (
      <ProviderShell>
        <ProviderPageHeader title="Contest runtime" description="Đang tải dữ liệu contest runtime..." />
        <div className="mt-4 space-y-4">
          {Array.from({ length: 4 }).map((_, index) => (
            <div key={index} className="h-32 animate-pulse rounded-xl bg-[#f6f3f2]" />
          ))}
        </div>
      </ProviderShell>
    )
  }

  if (!contest) {
    return (
      <ProviderShell>
        <ProviderPageHeader title="Contest runtime" description="Không tìm thấy contest để vận hành." />
      </ProviderShell>
    )
  }

  return (
    <ProviderShell>
      <ProviderPageHeader
        title={contest.name}
        description="Workspace riêng cho event-day, match runtime, leaderboard và audit của contest."
        actions={
          <>
            <Badge className={`border ${getContestStatusClass(contest.status)}`}>{contest.status}</Badge>
            <Button
              type="button"
              variant="outline"
              className="h-10 gap-2 rounded-lg border-[#c4c7c8] bg-[#f6f3f2] text-[#1c1b1b] hover:bg-[#ebe7e7]"
              onClick={() => navigate(routePaths.providerContestEdit.replace(":contestId", contest.id))}
            >
              Chỉnh sửa contest
            </Button>
            <Button
              type="button"
              variant="outline"
              className="h-10 gap-2 rounded-lg border-[#c4c7c8] bg-[#f6f3f2] text-[#1c1b1b] hover:bg-[#ebe7e7]"
              onClick={() => updateRuntimeSearchParams(searchParams, setSearchParams, { tab: "matches" })}
            >
              <PlayCircle className="size-4" />
              Generate matches
            </Button>
            <Button
              type="button"
              className="h-10 gap-2 rounded-lg bg-[#1c1b1b] text-white hover:bg-[#313030]"
              onClick={() => void handlePublishLeaderboard()}
            >
              <BarChart3 className="size-4" />
              Publish leaderboard
            </Button>
          </>
        }
      />

      <section className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-4">
        <MetricCard
          label="Registrations"
          value={String(metrics?.registration_counts.total ?? registrations.length)}
          helper={`${metrics?.registration_counts.confirmed ?? 0} confirmed / ${metrics?.registration_counts.checked_in ?? 0} checked-in`}
          icon={<Flag />}
          tone="info"
        />
        <MetricCard
          label="Match runtime"
          value={String(metrics?.match_counts.total ?? matches.length)}
          helper={`${metrics?.match_counts.completed ?? 0} completed`}
          icon={<PlayCircle />}
          tone="success"
        />
        <MetricCard
          label="Leaderboard"
          value={metrics?.leaderboard.published ? "Published" : "Draft"}
          helper={metrics?.leaderboard.published_at ? new Date(metrics.leaderboard.published_at).toLocaleString("vi-VN") : "Chưa publish"}
          icon={<BarChart3 />}
          tone={metrics?.leaderboard.published ? "success" : "warning"}
        />
        <MetricCard
          label="Host branch"
          value={contest.host_branch?.cafe?.name ?? "--"}
          helper={contest.contest_format?.name ?? "Contest format"}
          icon={<CalendarCheck2 />}
          tone="neutral"
        />
      </section>

      <ContestRuntimeTabs activeTab={activeTab} onChange={(tab) => updateRuntimeSearchParams(searchParams, setSearchParams, { tab })} />

      <div className="mt-4 space-y-4">
        {activeTab === "overview" ? (
          <ContestRuntimeOverview contest={contest} registrations={registrations} matches={matches} metrics={metrics} />
        ) : null}

        {activeTab === "event-day" ? (
          <>
            <section className="grid gap-3 rounded-xl border border-[#e5e2e1] bg-white p-4 lg:grid-cols-3">
              <input
                value={registrationQuery}
                onChange={(event) => updateRuntimeSearchParams(searchParams, setSearchParams, { registrationQuery: event.target.value })}
                placeholder="Tìm theo tên, email, check-in code"
                className="h-10 rounded-lg border border-[#c4c7c8] px-3 text-sm"
              />
              <select
                value={registrationStatus}
                onChange={(event) => updateRuntimeSearchParams(searchParams, setSearchParams, { registrationStatus: event.target.value })}
                className="h-10 rounded-lg border border-[#c4c7c8] px-3 text-sm"
              >
                <option value="">Tất cả registration status</option>
                <option value="PENDING">PENDING</option>
                <option value="CONFIRMED">CONFIRMED</option>
                <option value="CHECKED_IN">CHECKED_IN</option>
                <option value="CANCELLED">CANCELLED</option>
              </select>
              <select
                value={paymentStatus}
                onChange={(event) => updateRuntimeSearchParams(searchParams, setSearchParams, { paymentStatus: event.target.value })}
                className="h-10 rounded-lg border border-[#c4c7c8] px-3 text-sm"
              >
                <option value="">Tất cả payment status</option>
                <option value="PENDING_PAYMENT">PENDING_PAYMENT</option>
                <option value="PENDING_REVIEW">PENDING_REVIEW</option>
                <option value="WAIVED">WAIVED</option>
                <option value="MARKED_PAID">MARKED_PAID</option>
                <option value="NOT_REQUIRED">NOT_REQUIRED</option>
              </select>
            </section>
            <ContestEventDayPanel
              contest={contest}
              registrations={registrations}
              selectedCafeId={selectedCafeId}
              onChangeSelectedCafeId={setSelectedCafeId}
              eventDay={eventDay}
            />
          </>
        ) : null}

        {activeTab === "matches" ? (
          <div className="space-y-4">
            <section className="grid gap-3 rounded-xl border border-[#e5e2e1] bg-white p-4 lg:grid-cols-3">
              <input
                value={participantQuery}
                onChange={(event) => updateRuntimeSearchParams(searchParams, setSearchParams, { participantQuery: event.target.value })}
                placeholder="Tìm theo tên participant"
                className="h-10 rounded-lg border border-[#c4c7c8] px-3 text-sm"
              />
              <select
                value={matchStatus}
                onChange={(event) => updateRuntimeSearchParams(searchParams, setSearchParams, { matchStatus: event.target.value })}
                className="h-10 rounded-lg border border-[#c4c7c8] px-3 text-sm"
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
                onChange={(event) => updateRuntimeSearchParams(searchParams, setSearchParams, { roundNo: event.target.value.replace(/[^\d]/g, "") })}
                placeholder="Lọc theo round"
                className="h-10 rounded-lg border border-[#c4c7c8] px-3 text-sm"
              />
            </section>
            <ContestMatchBoard
              contest={contest}
              registrations={registrations}
              matches={matches}
              selectedMatchId={selectedMatchId}
              onSelectMatch={setSelectedMatchId}
              runtime={runtime}
            />
            <ContestMatchDetailPanel match={selectedMatch} runtime={runtime} />
          </div>
        ) : null}

        {activeTab === "leaderboard" ? (
          <ContestLeaderboardPanel contest={contest} leaderboard={leaderboard} metrics={metrics} runtime={runtime} />
        ) : null}

        {activeTab === "audit" ? <ContestAuditPanel logs={auditLogs} /> : null}
      </div>
    </ProviderShell>
  )
}

function updateRuntimeSearchParams(
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
