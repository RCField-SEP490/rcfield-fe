import { useParams, useSearchParams } from "react-router"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { ArrowLeft, Calendar } from "lucide-react"
import { Link } from "react-router"
import { toast } from "sonner"

import { contestsApi, contestQueryKeys } from "../api/contests.api"
import type { ContestClassPayload, ContestRewardPayload } from "../api/contests.api"
import { getContestErrorMessage } from "../lib/errors"
import { recordContestUiEvent } from "../lib/monitoring"
import { ContestGeneralTab } from "../components/ContestGeneralTab"
import { ContestBracketsTab } from "../components/ContestBracketsTab"
import { ContestRewardsTab } from "../components/ContestRewardsTab"
import { ContestMonitoringTab } from "../components/ContestMonitoringTab"
import { ContestCheckInDialog } from "../components/ContestCheckInDialog"
import { ParticipantManagementPanel } from "../components/ParticipantManagementPanel"
import { Button } from "@/shared/ui/button"
import { ProviderShell } from "@/pages/provider/components/ProviderShell"
import { ProviderPageHeader } from "@/pages/provider/components/ProviderPrimitives"
import type { ContestClass } from "../types"

type ContestTab = "general" | "players" | "brackets" | "rewards" | "monitoring"

function formatDateTime(dateStr: string) {
  try {
    const d = new Date(dateStr)
    if (isNaN(d.getTime())) return dateStr
    return d.toLocaleDateString("vi-VN", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    })
  } catch {
    return dateStr
  }
}

export function ProviderContestDetailPage() {
  const { contestId } = useParams<{ contestId: string }>()
  const queryClient = useQueryClient()
  const [searchParams] = useSearchParams()
  const tab = (searchParams.get("tab") || "general") as ContestTab

  // --- Data Queries ---
  const { data: contest, isLoading } = useQuery({
    queryKey: contestQueryKeys.detail(contestId),
    queryFn: () => contestsApi.getContestDetail(contestId!),
    enabled: !!contestId,
  })

  const { data: registrations = [] } = useQuery({
    queryKey: contestQueryKeys.registrations(contestId),
    queryFn: () => contestsApi.getContestRegistrations(contestId!),
    enabled: !!contestId,
  })

  const { data: rewardsEnvelope } = useQuery({
    queryKey: contestQueryKeys.rewards(contestId),
    queryFn: () => contestsApi.getContestRewards(contestId!),
    enabled: !!contestId,
  })

  const { data: bracketData } = useQuery({
    queryKey: contestQueryKeys.bracket(contestId),
    queryFn: () => contestsApi.getContestBracket(contestId!),
    enabled: !!contestId,
  })

  const { data: auditLogs = [] } = useQuery({
    queryKey: contestQueryKeys.auditLogs(contestId),
    queryFn: () => contestsApi.listAuditLogs(contestId!),
    enabled: !!contestId && tab === "monitoring",
  })

  const { data: metrics } = useQuery({
    queryKey: contestQueryKeys.metrics(contestId),
    queryFn: () => contestsApi.getMetrics(contestId!),
    enabled: !!contestId && tab === "monitoring",
  })

  // --- Derived Data ---
  const rewards = rewardsEnvelope?.data || []
  const contestClasses = bracketData?.classes || []
  const primaryClass = contestClasses[0]
  const selectedCafeId = contest?.participating_cafes?.[0]?.id || ""
  const rawBracketSize = Number(contest?.config?.bracket_size ?? 8)
  const isSupportedBracketSize = rawBracketSize === 4 || rawBracketSize === 8
  const bracketSize = isSupportedBracketSize ? rawBracketSize : 8
  const bracketSizeDisplay = isSupportedBracketSize
    ? `${bracketSize} tay đua`
    : `${rawBracketSize} tay đua (cần generator BE)`

  // --- Event Tracking Helper ---
  const recordEvent = (
    event: string,
    details: Parameters<typeof recordContestUiEvent>[1] = {},
  ) => recordContestUiEvent(event, { contestId, ...details })

  // --- Invalidation Helper ---
  const invalidate = (...keys: readonly (readonly string[])[]) => {
    keys.forEach((key) => queryClient.invalidateQueries({ queryKey: key }))
  }

  // --- Mutations ---
  const openContestMutation = useMutation({
    mutationFn: () => contestsApi.openContest(contestId!),
    onSuccess: () => {
      recordEvent("provider.contest.open.success")
      toast.success("Giải đấu đã được mở đăng ký!")
      invalidate(contestQueryKeys.detail(contestId))
    },
    onError: (err: unknown) => {
      const msg = getContestErrorMessage(err, "Lỗi mở đăng ký.")
      recordEvent("provider.contest.open.error", { metadata: { message: msg } })
      toast.error(msg)
    },
  })

  const cancelContestMutation = useMutation({
    mutationFn: () => contestsApi.cancelContest(contestId!),
    onSuccess: () => {
      recordEvent("provider.contest.cancel.success")
      toast.success("Giải đấu đã bị hủy bỏ.")
      invalidate(contestQueryKeys.detail(contestId))
    },
    onError: (err: unknown) => {
      const msg = getContestErrorMessage(err, "Lỗi hủy giải đấu.")
      recordEvent("provider.contest.cancel.error", { metadata: { message: msg } })
      toast.error(msg)
    },
  })

  const checkInMutation = useMutation({
    mutationFn: (args: { regId: string; cafeId: string }) =>
      contestsApi.checkInParticipant(args.regId, { cafe_id: args.cafeId }),
    onSuccess: (_, args) => {
      recordEvent("provider.registration.check_in.success", { registrationId: args.regId })
      toast.success("Check-in vận động viên thành công!")
      invalidate(
        contestQueryKeys.registrations(contestId),
        contestQueryKeys.metrics(contestId),
        contestQueryKeys.auditLogs(contestId),
      )
    },
    onError: (err: unknown) => {
      toast.error(getContestErrorMessage(err, "Check-in thất bại."))
    },
  })

  const cancelRegistrationMutation = useMutation({
    mutationFn: (args: { regId: string; reason: string }) =>
      contestsApi.cancelRegistration(args.regId, { reason: args.reason }),
    onSuccess: () => {
      toast.success("Đã hủy đăng ký vận động viên.")
      invalidate(
        contestQueryKeys.detail(contestId),
        contestQueryKeys.registrations(contestId),
        contestQueryKeys.bracket(contestId),
        contestQueryKeys.metrics(contestId),
        contestQueryKeys.auditLogs(contestId),
      )
    },
    onError: (err: unknown) => {
      toast.error(getContestErrorMessage(err, "Hủy đăng ký thất bại."))
    },
  })

  const approveRegistrationMutation = useMutation({
    mutationFn: (regId: string) => contestsApi.approveRegistration(regId),
    onSuccess: () => {
      toast.success("Đã phê duyệt đăng ký thành công!")
      invalidate(
        contestQueryKeys.detail(contestId),
        contestQueryKeys.registrations(contestId),
        contestQueryKeys.metrics(contestId),
        contestQueryKeys.auditLogs(contestId),
      )
    },
    onError: (err: unknown) => {
      toast.error(getContestErrorMessage(err, "Phê duyệt thất bại."))
    },
  })

  const rejectRegistrationMutation = useMutation({
    mutationFn: (args: { regId: string; reason: string }) =>
      contestsApi.rejectRegistration(args.regId, { reason: args.reason }),
    onSuccess: () => {
      toast.success("Đã từ chối đăng ký vận động viên.")
      invalidate(
        contestQueryKeys.detail(contestId),
        contestQueryKeys.registrations(contestId),
        contestQueryKeys.metrics(contestId),
        contestQueryKeys.auditLogs(contestId),
      )
    },
    onError: (err: unknown) => {
      toast.error(getContestErrorMessage(err, "Từ chối đăng ký thất bại."))
    },
  })

  const createClassMutation = useMutation({
    mutationFn: (body: ContestClassPayload) =>
      contestsApi.createContestClass(contestId!, body),
    onSuccess: () => {
      toast.success("Tạo nhóm đua (Class) thành công!")
      invalidate(
        contestQueryKeys.detail(contestId),
        contestQueryKeys.bracket(contestId),
        contestQueryKeys.classes(contestId),
      )
    },
    onError: (err: unknown) => {
      toast.error(getContestErrorMessage(err, "Lỗi tạo Class."))
    },
  })

  const createRewardMutation = useMutation({
    mutationFn: (body: ContestRewardPayload) =>
      contestsApi.createContestReward(contestId!, body),
    onSuccess: () => {
      toast.success("Thêm phần thưởng thành công!")
      invalidate(contestQueryKeys.rewards(contestId))
    },
    onError: (err: unknown) => {
      toast.error(getContestErrorMessage(err, "Lỗi thêm giải thưởng."))
    },
  })

  const publishLeaderboardMutation = useMutation({
    mutationFn: (contestClass?: ContestClass) =>
      contestsApi.publishLeaderboard(
        contestId!,
        contestClass
          ? { contest_class_id: contestClass.id, scope: "OVERALL" }
          : { scope: "OVERALL" },
      ),
    onSuccess: () => {
      toast.success("Công bố bảng xếp hạng thành công!")
      invalidate(contestQueryKeys.leaderboard(contestId))
    },
    onError: (err: unknown) => {
      toast.error(getContestErrorMessage(err, "Lỗi công bố bảng xếp hạng."))
    },
  })

  const issueRewardsMutation = useMutation({
    mutationFn: (contestClass?: ContestClass) =>
      contestsApi.issueRewards(
        contestId!,
        contestClass ? { contest_class_id: contestClass.id } : {},
      ),
    onSuccess: () => {
      toast.success("Phát thưởng thành công cho các tay đua đứng top!")
    },
    onError: (err: unknown) => {
      toast.error(getContestErrorMessage(err, "Lỗi phát thưởng."))
    },
  })

  const generateMatchesMutation = useMutation({
    mutationFn: (params: {
      format: "KNOCKOUT" | "MULTI_DRIVER_HEAT" | "TIME_ATTACK"
      drivers_per_match: number
      registration_ids: string[]
      seeding_mode: "MANUAL" | "RANDOM" | "CHECK_IN_ORDER" | "QUALIFYING_RANK"
      cafe_id: string | null
      track_config_id: string | null
    }) => contestsApi.generateMatches(contestId!, params),
    onSuccess: (generatedMatches) => {
      toast.success(
        `Đã tự động xếp ${generatedMatches.length} trận đấu thành công.`,
      )
      invalidate(
        contestQueryKeys.bracket(contestId),
        contestQueryKeys.metrics(contestId),
      )
    },
    onError: (err: unknown) => {
      toast.error(getContestErrorMessage(err, "Lỗi xếp lịch thi đấu."))
    },
  })

  // --- Match Result Handler ---
  const handleSaveMatchResult = async (
    matchId: string,
    winnerId: string,
    score: string,
  ) => {
    const match = bracketData?.matches.find((m) => m.id === matchId)
    if (!match) return
    const compAId = match.competitorARegistrationId
    const compBId = match.competitorBRegistrationId
    if (!compAId || !compBId) {
      toast.error("Trận đấu chưa đủ tay đua.")
      return
    }
    try {
      await contestsApi.submitMatchResults(matchId, {
        results: [
          { registration_id: winnerId, finish_position: 1, score: Number(score) || 0, is_winner: true },
          { registration_id: winnerId === compAId ? compBId : compAId, finish_position: 2, score: 0, is_winner: false },
        ],
        reason: "Ghi nhận kết quả từ bảng quản trị",
      })
      if (match.nextMatchId) {
        await contestsApi.advanceMatch(matchId, { next_match_id: match.nextMatchId, top_n: 1 })
      }
      invalidate(
        contestQueryKeys.bracket(contestId),
        contestQueryKeys.metrics(contestId),
      )
      toast.success("Đã ghi nhận kết quả và đẩy winner sang vòng tiếp theo!")
    } catch (err: unknown) {
      toast.error(getContestErrorMessage(err, "Lỗi ghi nhận kết quả."))
    }
  }

  // --- Manual Check-In Handler ---
  const handleManualCheckIn = (code: string, cafeId: string) => {
    const targetReg = registrations.find(
      (r) => r.check_in_code === code && r.status === "CONFIRMED",
    )
    if (!targetReg) {
      toast.error("Mã check-in không hợp lệ hoặc đã check-in trước đó!")
      return
    }
    checkInMutation.mutate({ regId: targetReg.id, cafeId })
  }

  // --- Render ---
  if (isLoading) {
    return (
      <ProviderShell>
        <div className="space-y-4 p-6">
          <div className="h-28 animate-pulse rounded-xl bg-[#f6f3f2]" />
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="h-44 animate-pulse rounded-xl bg-[#f6f3f2]" />
            ))}
          </div>
        </div>
      </ProviderShell>
    )
  }

  if (!contest) {
    return (
      <ProviderShell>
        <ProviderPageHeader
          title="Không tải được giải đấu"
          description="Giải đấu không tồn tại hoặc bạn không có quyền."
        />
        <div className="p-6">
          <Button
            asChild
            variant="outline"
            className="h-10 gap-2 rounded-lg border-[#c4c7c8] bg-[#f1edec] font-bold text-[#1c1b1b] hover:bg-[#e5e2e1]"
          >
            <Link to="/provider/contests">
              <ArrowLeft className="size-5" />
              Danh sách giải đấu
            </Link>
          </Button>
        </div>
      </ProviderShell>
    )
  }

  return (
    <ProviderShell>
      <ProviderPageHeader
        title={contest.name}
        description={`Khởi tranh: ${formatDateTime(contest.starts_at)}`}
      />

      <div className="space-y-4 p-4 md:p-6">
        {/* Back Button */}
        <div className="flex justify-start">
          <Button
            asChild
            variant="outline"
            className="h-10 gap-2 rounded-lg border-[#c4c7c8] bg-[#f1edec] font-bold text-[#1c1b1b] hover:bg-[#e5e2e1]"
          >
            <Link to="/provider/contests">
              <ArrowLeft className="size-5" />
              Danh sách
            </Link>
          </Button>
        </div>

        {/* Tab Content */}
        <div className="space-y-6">
          {tab === "general" && (
            <ContestGeneralTab
              contest={contest}
              bracketSizeDisplay={bracketSizeDisplay}
              onOpenContest={() => openContestMutation.mutate()}
              onCancelContest={() => cancelContestMutation.mutate()}
              isOpenPending={openContestMutation.isPending}
              isCancelPending={cancelContestMutation.isPending}
            />
          )}

          {tab === "players" && (
            <ParticipantManagementPanel
              contest={contest}
              registrations={registrations}
              defaultCafeId={selectedCafeId}
              actionPending={
                checkInMutation.isPending ||
                cancelRegistrationMutation.isPending ||
                approveRegistrationMutation.isPending ||
                rejectRegistrationMutation.isPending
              }
              onCheckIn={(regId, cafeId) =>
                checkInMutation.mutate({ regId, cafeId })
              }
              onCancel={(regId, reason) =>
                cancelRegistrationMutation.mutate({ regId, reason })
              }
              onApprove={(regId) => approveRegistrationMutation.mutate(regId)}
              onReject={(regId, reason) =>
                rejectRegistrationMutation.mutate({ regId, reason })
              }
            />
          )}

          {tab === "brackets" && (
            <ContestBracketsTab
              contest={contest}
              registrations={registrations}
              bracketData={bracketData}
              bracketSize={bracketSize}
              onSaveMatchResult={handleSaveMatchResult}
              onGenerateMatches={(params) => generateMatchesMutation.mutate(params)}
              onCreateClass={(data) => createClassMutation.mutate(data)}
              isGeneratePending={generateMatchesMutation.isPending}
              isCreateClassPending={createClassMutation.isPending}
            />
          )}

          {tab === "rewards" && (
            <ContestRewardsTab
              rewards={rewards}
              primaryClass={primaryClass}
              onPublishLeaderboard={(cc) => publishLeaderboardMutation.mutate(cc)}
              onIssueRewards={(cc) => issueRewardsMutation.mutate(cc)}
              onCreateReward={(data) => createRewardMutation.mutate(data)}
              isPublishPending={publishLeaderboardMutation.isPending}
              isIssuePending={issueRewardsMutation.isPending}
              isCreatePending={createRewardMutation.isPending}
            />
          )}

          {tab === "monitoring" && (
            <ContestMonitoringTab metrics={metrics} auditLogs={auditLogs} />
          )}
        </div>
      </div>
    </ProviderShell>
  )
}

export default ProviderContestDetailPage
