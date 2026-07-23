import { useEffect, useMemo, useState } from "react"
import { BarChart3, CalendarCheck2, Flag, PlayCircle, MoreHorizontal, CircleDollarSign } from "lucide-react"
import { Navigate, useNavigate, useParams, useSearchParams } from "react-router"
import { toast } from "sonner"
import { routePaths } from "@/app/router/route-paths"
import { useContestWorkspace } from "@/features/contests/hooks/useContestWorkspace"
import {
  getErrorMessage,
  getMatchPhase,
  getPublishedLeaderboard,
  splitMatchesByPhase,
} from "@/features/contests/lib/contest-runtime"
import {
  getContestFormatLabel,
  getContestStatusClass,
  getContestStatusLabel,
} from "@/features/contests/lib/contest-status"
import type {
  ContestEntryFeePaymentStatus,
  ContestMatch,
  ContestMatchParticipant,
  ContestMatchStatus,
  ContestRegistrationStatus,
  ContestUpdateMatchParticipantsBody,
  ContestAuditLogsQuery,
} from "@/features/contests/types"
import { ProviderPageHeader, MetricCard } from "@/pages/provider/components/ProviderPrimitives"
import { ProviderShell } from "@/pages/provider/components/ProviderShell"
import { Badge } from "@/shared/ui/badge"
import { Button } from "@/shared/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/shared/ui/dropdown-menu"
import { ContestAuditPanel } from "./components/ContestAuditPanel"
import { ContestDisciplinePanel } from "./components/ContestDisciplinePanel"
import { ContestEventDayPanel } from "./components/ContestEventDayPanel"
import { ContestKnockoutBracket } from "./components/ContestKnockoutBracket"
import { ContestLeaderboardPanel } from "./components/ContestLeaderboardPanel"
import { ContestMatchBoard } from "./components/ContestMatchBoard"
import { ContestMatchDetailPanel } from "./components/match-detail/ContestMatchDetailPanel"
import { ContestRegistrationPanel } from "./components/ContestRegistrationPanel"
import { ContestRuntimeOverview } from "./components/ContestRuntimeOverview"
import {
  defaultContestWorkspaceSection,
  getContestWorkspacePath,
  type ContestWorkspaceSectionKey,
} from "./contest-workspace"

const sectionSummaries: Record<ContestWorkspaceSectionKey, string> = {
  overview: "Tổng quan điều hành, trạng thái giải và các chỉ số sẵn sàng.",
  registrations:
    "Quản lý người chơi, duyệt đăng ký và xử lý lệ phí thủ công.",
  operations:
    "Điểm danh, tra cứu mã check-in và xử lý vận hành tại hiện trường.",
  bracket:
    "Điều phối nhánh đấu, kéo người đi tiếp và nhập kết quả theo match.",
  leaderboard: "Theo dõi bản nháp, công bố và đồng bộ bảng xếp hạng.",
  audit: "Xem lại toàn bộ nhật ký thao tác phát sinh trong contest.",
  discipline:
    "Phân công staff, disqualify người chơi và xử lý ban contest.",
}

export function ProviderContestWorkspacePage({
  section = defaultContestWorkspaceSection,
}: {
  section?: ContestWorkspaceSectionKey
}) {
  const navigate = useNavigate()
  const { contestId } = useParams()
  const [searchParams, setSearchParams] = useSearchParams()
  const registrationStatus = searchParams.get("registrationStatus") ?? ""
  const paymentStatus = searchParams.get("paymentStatus") ?? ""
  const registrationQuery = searchParams.get("registrationQuery") ?? ""
  const matchStatus = searchParams.get("matchStatus") ?? ""
  const participantQuery = searchParams.get("participantQuery") ?? ""
  const roundNo = searchParams.get("roundNo") ?? ""
  const auditPage = Math.max(1, Number(searchParams.get("auditPage") || "1"))
  const auditLimit = [10, 20, 50, 100].includes(Number(searchParams.get("auditLimit")))
    ? Number(searchParams.get("auditLimit"))
    : 20

  const needsRegistrations =
    section === "overview" ||
    section === "registrations" ||
    section === "operations" ||
    section === "bracket" ||
    section === "discipline"
  const needsMatches = section === "overview" || section === "bracket"
  const needsMetrics = section === "overview" || section === "leaderboard"
  const needsAuditLogs = section === "audit"
  const needsGovernance = section === "discipline"

  const workspace = useContestWorkspace(contestId, {
    registrations: {
      status: (registrationStatus || undefined) as
        | ContestRegistrationStatus
        | undefined,
      payment_status: (paymentStatus || undefined) as
        | ContestEntryFeePaymentStatus
        | undefined,
      query: registrationQuery || undefined,
    },
    matches: {
      status: (matchStatus || undefined) as ContestMatchStatus | undefined,
      participant_query: participantQuery || undefined,
      round_no: roundNo ? Number(roundNo) : undefined,
    },
    auditLogs: {
      page: auditPage,
      limit: auditLimit,
    } as ContestAuditLogsQuery,
    enabled: {
      registrations: needsRegistrations,
      matches: needsMatches,
      metrics: needsMetrics,
      auditLogs: needsAuditLogs,
      staffAssignments: needsGovernance,
      bans: needsGovernance,
      staffOptions: needsGovernance,
    },
  })

  const [selectedMatchId, setSelectedMatchId] = useState<string | null>(null)
  const [selectedCafeId, setSelectedCafeId] = useState("")
  const [stagedParticipantsByMatch, setStagedParticipantsByMatch] = useState<
    Record<string, ContestUpdateMatchParticipantsBody["participants"]>
  >({})
  const [stagedHistory, setStagedHistory] = useState<
    Array<Record<string, ContestUpdateMatchParticipantsBody["participants"]>>
  >([])

  const contest = workspace.runtime.contestQuery.data
  const registrations = workspace.runtime.registrationsQuery.data ?? []
  const apiMatches = useMemo(
    () => workspace.runtime.matchesQuery.data ?? [],
    [workspace.runtime.matchesQuery.data],
  )
  const matches = useMemo(
    () => applyStagedParticipants(apiMatches, stagedParticipantsByMatch),
    [apiMatches, stagedParticipantsByMatch],
  )
  const metrics = workspace.runtime.metricsQuery.data
  const auditLogsResponse = workspace.runtime.auditLogsQuery.data
  const auditLogs = auditLogsResponse?.data ?? []
  const auditMeta = auditLogsResponse?.meta
  const leaderboard = getPublishedLeaderboard(contest)
  const selectedMatch = useMemo(
    () => matches.find((match) => match.id === selectedMatchId) ?? null,
    [matches, selectedMatchId],
  )
  const runtimeFormat = String(
    contest?.config?.runtime_format ??
      contest?.config?.format ??
      contest?.contest_format?.code ??
      "KNOCKOUT",
  )
  const isKnockoutRuntime = runtimeFormat === "KNOCKOUT"
  const isQualifyingFinalRuntime = runtimeFormat === "QUALIFYING_FINAL"
  const { final: finalPhaseMatches } = useMemo(
    () => splitMatchesByPhase(matches),
    [matches],
  )
  const selectedMatchIsKnockout =
    isKnockoutRuntime ||
    (isQualifyingFinalRuntime &&
      selectedMatch !== null &&
      getMatchPhase(selectedMatch) === "FINAL")
  const hasStagedBracketChanges =
    Object.keys(stagedParticipantsByMatch).length > 0

  useEffect(() => {
    if (contest && !selectedCafeId) {
      queueMicrotask(() => {
        setSelectedCafeId(
          contest.host_branch?.cafe_id ??
            contest.participating_branches[0]?.cafe_id ??
            "",
        )
      })
    }
  }, [contest, selectedCafeId])

  useEffect(() => {
    if (!selectedMatchId && matches.length > 0) {
      queueMicrotask(() => setSelectedMatchId(matches[0].id))
    }
  }, [matches, selectedMatchId])

  useEffect(() => {
    queueMicrotask(() => {
      setStagedParticipantsByMatch({})
      setStagedHistory([])
    })
  }, [contestId])

  const handleAuditPageChange = (nextPage: number) => {
    updateWorkspaceSearchParams(searchParams, setSearchParams, {
      auditPage: String(nextPage),
      auditLimit: String(auditLimit),
    })
  }

  const handlePublishLeaderboard = async () => {
    try {
      await workspace.runtime.publishLeaderboardMutation.mutateAsync()
      toast.success("Đã công bố bảng xếp hạng")
    } catch (error) {
      toast.error("Không thể công bố bảng xếp hạng", {
        description: getErrorMessage(error).message,
      })
    }
  }

  const handleSyncRaceRecords = async () => {
    try {
      const result = await workspace.runtime.syncRaceRecordsMutation.mutateAsync()
      toast.success("Đã đồng bộ thành tích toàn hệ thống", {
        description: `${result.synced_count} record mới, ${result.superseded_count} record bị thay thế.`,
      })
    } catch (error) {
      toast.error("Không thể đồng bộ thành tích", {
        description: getErrorMessage(error).message,
      })
    }
  }

  const stageParticipantAdvance = (
    sourceMatchId: string,
    targetMatchId: string,
    registrationId: string,
  ) => {
    const sourceMatch = matches.find((match) => match.id === sourceMatchId)
    const targetMatch = matches.find((match) => match.id === targetMatchId)
    if (!sourceMatch || !targetMatch) return
    const participant = sourceMatch.participants.find(
      (item) => item.registration_id === registrationId,
    )
    if (!participant) return
    if (targetMatch.round_no <= sourceMatch.round_no) {
      toast.error("Chỉ được đưa người đi tiếp sang vòng sâu hơn")
      return
    }
    if (targetMatch.status === "COMPLETED") {
      toast.error("Không thể chỉnh trận đã hoàn tất")
      return
    }

    setStagedParticipantsByMatch((current) => {
      setStagedHistory((history) => [...history, current])
      const currentTarget =
        current[targetMatchId] ??
        targetMatch.participants.map((item) => ({
          registration_id: item.registration_id,
          slot_no: item.slot_no,
          lane: item.lane,
          grid_position: item.grid_position,
          seed_no: item.seed_no,
        }))

      const deduped = currentTarget.filter(
        (item) => item.registration_id !== registrationId,
      )
      if (deduped.length >= 2) {
        toast.error("Trận knockout chỉ nhận tối đa 2 người")
        return current
      }

      const nextSlotNo = deduped.length + 1
      return {
        ...current,
        [targetMatchId]: [
          ...deduped,
          {
            registration_id: registrationId,
            slot_no: nextSlotNo,
            lane: `L${nextSlotNo}`,
            grid_position: null,
            seed_no: participant.seed_no,
          },
        ],
      }
    })
  }

  const undoStagedBracket = () => {
    setStagedHistory((history) => {
      const previous = history.at(-1)
      if (!previous) return history
      setStagedParticipantsByMatch(previous)
      return history.slice(0, -1)
    })
  }

  const commitStagedBracket = async () => {
    const entries = Object.entries(stagedParticipantsByMatch)
    if (entries.length === 0) return
    try {
      for (const [matchId, participants] of entries) {
        await workspace.runtime.updateParticipantsMutation.mutateAsync({
          matchId,
          body: { participants },
        })
      }
      setStagedParticipantsByMatch({})
      setStagedHistory([])
      toast.success("Đã lưu nhánh đấu")
    } catch (error) {
      toast.error("Không thể lưu nhánh đấu", {
        description: getErrorMessage(error).message,
      })
    }
  }

  if (!contestId) {
    return <Navigate replace to={routePaths.providerContests} />
  }

  if (workspace.runtime.contestQuery.isLoading) {
    return (
      <ProviderShell>
        <ProviderPageHeader
          title="Contest workspace"
          description="Đang tải dữ liệu contest..."
        />
        <div className="space-y-4">
          {Array.from({ length: 4 }).map((_, index) => (
            <div
              key={index}
              className="h-32 animate-pulse rounded-xl bg-[#f6f3f2]"
            />
          ))}
        </div>
      </ProviderShell>
    )
  }

  if (!contest) {
    return (
      <ProviderShell>
        <ProviderPageHeader
          title="Contest workspace"
          description="Không tìm thấy contest để vận hành."
        />
      </ProviderShell>
    )
  }

  return (
    <ProviderShell contentClassName="max-w-none">
      <ProviderPageHeader
        title={
          <div className="flex flex-wrap items-center gap-2 sm:gap-2.5">
            <span
              className="max-w-[15rem] md:max-w-[20rem] truncate text-xl font-extrabold tracking-tight text-[#1c1b1b] md:text-2xl"
              title={contest.name}
            >
              {contest.name}
            </span>
            <Badge className={`border text-[10px] font-bold px-2 py-0.5 ${getContestStatusClass(contest.status)}`}>
              {getContestStatusLabel(contest.status)}
            </Badge>
            <Badge
              variant="outline"
              className="border-[#c4c7c8]/80 bg-white/50 px-2 py-0.5 text-[10px] font-bold text-[#444748]"
            >
              Format: {getContestFormatLabel(runtimeFormat)}
            </Badge>
            <Badge
              variant="outline"
              className="border-[#c4c7c8]/80 bg-white/50 px-2 py-0.5 text-[10px] font-bold text-[#444748]"
            >
              Thời gian: {formatShortDate(contest.starts_at)} - {formatShortDate(contest.ends_at)}
            </Badge>
            <Badge
              variant="outline"
              className="border-[#c4c7c8]/80 bg-white/50 px-2 py-0.5 text-[10px] font-bold text-[#444748]"
            >
              Đăng ký: {metrics?.registration_counts.total ?? (workspace.runtime.registrationsQuery.isSuccess ? registrations.length : "--")} người
            </Badge>
          </div>
        }
        h2Title={contest.name}
        description={
          <p className="text-[11px] font-semibold text-[#5d5f5f]">
            {sectionSummaries[section]}
          </p>
        }
        titleClassName="w-full"
        contentClassName="sm:items-center"
        actions={
          <div className="flex items-center gap-2">
            <Button
              type="button"
              variant="outline"
              className="h-8 gap-1.5 rounded-lg border-[#c4c7c8] bg-white px-3 text-xs font-bold text-[#1c1b1b] hover:bg-[#f6f3f2]"
              onClick={() =>
                navigate(getContestWorkspacePath(contest.id, "bracket"))
              }
            >
              <PlayCircle className="size-3.5" />
              Mở nhánh đấu
            </Button>
            <Button
              type="button"
              className="h-8 gap-1.5 rounded-lg bg-[#1c1b1b] px-3 text-xs font-bold text-white hover:bg-[#313030]"
              onClick={() => void handlePublishLeaderboard()}
            >
              <BarChart3 className="size-3.5" />
              Công bố bảng xếp hạng
            </Button>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  type="button"
                  variant="outline"
                  size="icon"
                  className="h-8 w-8 border-[#c4c7c8] bg-white text-[#1c1b1b] hover:bg-[#f6f3f2] rounded-lg"
                >
                  <MoreHorizontal className="size-4" />
                  <span className="sr-only">Thao tác khác</span>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-52 rounded-xl p-1.5 border border-[#c4c7c8] bg-white shadow-md z-50">
                <DropdownMenuItem
                  className="cursor-pointer rounded-lg px-2.5 py-1.5 text-xs font-semibold text-[#1c1b1b] hover:bg-[#f6f3f2] transition-colors"
                  onClick={() =>
                    navigate(routePaths.providerContestEdit.replace(":contestId", contest.id))
                  }
                >
                  Chỉnh sửa giải đấu
                </DropdownMenuItem>
                <DropdownMenuItem
                  disabled={!metrics?.leaderboard.published}
                  className="cursor-pointer rounded-lg px-2.5 py-1.5 text-xs font-semibold text-orange-700 hover:bg-orange-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  onClick={() => void handleSyncRaceRecords()}
                >
                  Đồng bộ toàn hệ thống
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        }
      />

      {section === "overview" ? (
        <section className="mb-4 grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-5">
          <MetricCard
            label="Đăng ký"
            value={String(metrics?.registration_counts.total ?? registrations.length)}
            helper={`${metrics?.registration_counts.confirmed ?? 0} đã duyệt / ${metrics?.registration_counts.checked_in ?? 0} đã check-in`}
            icon={<Flag />}
            tone="info"
            compact
          />
          <MetricCard
            label="Thi đấu"
            value={String(metrics?.match_counts.total ?? matches.length)}
            helper={`${metrics?.match_counts.completed ?? 0} đã hoàn tất`}
            icon={<PlayCircle />}
            tone="success"
            compact
          />
          <MetricCard
            label="Bảng xếp hạng"
            value={metrics?.leaderboard.published ? "Đã công bố" : "Bản nháp"}
            helper={
              metrics?.leaderboard.published_at
                ? new Date(metrics.leaderboard.published_at).toLocaleString("vi-VN")
                : "Chưa công bố"
            }
            icon={<BarChart3 />}
            tone={metrics?.leaderboard.published ? "success" : "warning"}
            compact
          />
          <MetricCard
            label="Đồng bộ toàn hệ thống"
            value={metrics?.global_sync.synced ? "Đã đồng bộ" : "Chưa đồng bộ"}
            helper={
              metrics?.global_sync.synced_at
                ? new Date(metrics.global_sync.synced_at).toLocaleString("vi-VN")
                : "Chưa đồng bộ thành tích"
            }
            icon={<CalendarCheck2 />}
            tone={metrics?.global_sync.synced ? "success" : "neutral"}
            compact
          />
          <MetricCard
            label="Doanh thu lệ phí"
            value={formatVnd(metrics?.revenue?.paid_revenue ?? 0)}
            helper={`Dự kiến ${formatVnd(metrics?.revenue?.expected_revenue ?? 0)} · Chờ ${formatVnd(metrics?.revenue?.pending_revenue ?? 0)}`}
            icon={<CircleDollarSign />}
            tone="success"
            compact
          />
        </section>
      ) : (
        <section className="mb-3 flex flex-wrap items-center gap-2">
          <Badge className="border border-[#c4c7c8] bg-white px-2.5 py-1 text-xs text-[#444748]">
            {sectionSummaries[section]}
          </Badge>
        </section>
      )}

      {section === "overview" ? (
        <ContestRuntimeOverview
          contest={contest}
          registrations={registrations}
          matches={matches}
          metrics={metrics}
        />
      ) : null}

      {section === "registrations" ? (
        <ContestRegistrationPanel
          registrations={registrations}
          workspace={workspace}
        />
      ) : null}

      {section === "operations" ? (
        <ContestEventDayPanel
          contest={contest}
          registrations={registrations}
          selectedCafeId={selectedCafeId}
          onChangeSelectedCafeId={setSelectedCafeId}
          eventDay={workspace.eventDay}
        />
      ) : null}

      {section === "bracket" ? (
        <div className="space-y-4">
          <section className="grid gap-3 rounded-xl border border-[#e5e2e1] bg-white p-4 lg:grid-cols-3">
            <input
              value={participantQuery}
              onChange={(event) =>
                updateWorkspaceSearchParams(searchParams, setSearchParams, {
                  participantQuery: event.target.value,
                })
              }
              placeholder="Tìm theo tên người thi đấu"
              className="h-10 rounded-lg border border-[#c4c7c8] px-3 text-sm"
            />
            <select
              value={matchStatus}
              onChange={(event) =>
                updateWorkspaceSearchParams(searchParams, setSearchParams, {
                  matchStatus: event.target.value,
                })
              }
              className="h-10 rounded-lg border border-[#c4c7c8] px-3 text-sm"
            >
              <option value="">Tất cả trạng thái trận</option>
              <option value="DRAFT">DRAFT</option>
              <option value="READY">READY</option>
              <option value="RUNNING">RUNNING</option>
              <option value="COMPLETED">COMPLETED</option>
              <option value="CANCELLED">CANCELLED</option>
            </select>
            <input
              value={roundNo}
              onChange={(event) =>
                updateWorkspaceSearchParams(searchParams, setSearchParams, {
                  roundNo: event.target.value.replace(/[^\d]/g, ""),
                })
              }
              placeholder="Lọc theo vòng"
              className="h-10 rounded-lg border border-[#c4c7c8] px-3 text-sm"
            />
          </section>

          {isKnockoutRuntime ? (
            <div className="space-y-4">
              <ContestMatchBoard
                contest={contest}
                registrations={registrations}
                matches={matches}
                selectedMatchId={selectedMatchId}
                onSelectMatch={setSelectedMatchId}
                runtime={workspace.runtime}
                showGenerate
              />
              <ContestKnockoutBracket
                matches={matches}
                selectedMatchId={selectedMatchId}
                onSelectMatch={setSelectedMatchId}
                canUndo={stagedHistory.length > 0}
                hasChanges={hasStagedBracketChanges}
                onUndo={undoStagedBracket}
                onCommit={commitStagedBracket}
                onStageAdvance={stageParticipantAdvance}
              />
            </div>
          ) : isQualifyingFinalRuntime ? (
            <div className="space-y-4">
              <ContestMatchBoard
                contest={contest}
                registrations={registrations}
                matches={matches}
                selectedMatchId={selectedMatchId}
                onSelectMatch={setSelectedMatchId}
                runtime={workspace.runtime}
                showGenerate
              />
              <ContestKnockoutBracket
                matches={finalPhaseMatches}
                selectedMatchId={selectedMatchId}
                onSelectMatch={setSelectedMatchId}
                canUndo={stagedHistory.length > 0}
                hasChanges={hasStagedBracketChanges}
                onUndo={undoStagedBracket}
                onCommit={commitStagedBracket}
                onStageAdvance={stageParticipantAdvance}
              />
            </div>
          ) : (
            <ContestMatchBoard
              contest={contest}
              registrations={registrations}
              matches={matches}
              selectedMatchId={selectedMatchId}
              onSelectMatch={setSelectedMatchId}
              runtime={workspace.runtime}
            />
          )}

          <ContestMatchDetailPanel
            match={selectedMatch}
            runtime={workspace.runtime}
            isKnockoutRuntime={selectedMatchIsKnockout}
            hasPendingBracketChanges={hasStagedBracketChanges}
          />
        </div>
      ) : null}

      {section === "leaderboard" ? (
        <ContestLeaderboardPanel
          contest={contest}
          leaderboard={leaderboard}
          metrics={metrics}
          runtime={workspace.runtime}
        />
      ) : null}

      {section === "audit" ? (
        <ContestAuditPanel
          logs={auditLogs}
          page={auditPage}
          limit={auditLimit}
          total={auditMeta?.total ?? auditLogs.length}
          onPageChange={handleAuditPageChange}
        />
      ) : null}

      {section === "discipline" ? (
        <ContestDisciplinePanel
          registrations={registrations}
          workspace={workspace}
        />
      ) : null}
    </ProviderShell>
  )
}



function formatShortDate(value: string | null) {
  if (!value) return "--"
  return new Date(value).toLocaleString("vi-VN", {
    dateStyle: "short",
    timeStyle: "short",
  })
}

function applyStagedParticipants(
  matches: ContestMatch[],
  staged: Record<string, ContestUpdateMatchParticipantsBody["participants"]>,
) {
  if (Object.keys(staged).length === 0) return matches
  return matches.map((match) => {
    const nextParticipants = staged[match.id]
    if (!nextParticipants) return match
    const currentByRegistration = new Map(
      match.participants.map((participant) => [
        participant.registration_id,
        participant,
      ]),
    )
    return {
      ...match,
      participants: nextParticipants.map((item) => {
        const current = currentByRegistration.get(item.registration_id)
        if (!current) {
          return {
            id: `staged-${match.id}-${item.registration_id}`,
            registration_id: item.registration_id,
            slot_no: item.slot_no,
            lane: item.lane ?? null,
            grid_position: item.grid_position ?? null,
            seed_no: item.seed_no ?? null,
            status: "READY" as ContestMatchParticipant["status"],
            score: null,
            finish_position: null,
            best_lap_seconds: null,
            total_time_seconds: null,
            is_winner: false,
            result_note: null,
            metadata: { staged: true },
            registration: null,
          }
        }
        return {
          ...current,
          slot_no: item.slot_no,
          lane: item.lane ?? null,
          grid_position: item.grid_position ?? null,
          seed_no: item.seed_no ?? null,
        }
      }),
    }
  })
}

function formatVnd(value: number) {
  return new Intl.NumberFormat("vi-VN", {
    style: "currency",
    currency: "VND",
    maximumFractionDigits: 0,
  }).format(value)
}

function updateWorkspaceSearchParams(
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
