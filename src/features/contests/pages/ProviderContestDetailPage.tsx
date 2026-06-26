import { useMemo, useState, useEffect } from "react";
import { useParams, Link } from "react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  Trophy,
  Calendar,
  MapPin,
  Settings,
  ArrowLeft,
  Play,
  XCircle,
  QrCode,
  Plus,
  Medal,
  Award,
  BarChart3,
  Activity,
  CheckSquare,
  Square,
} from "lucide-react";
import { contestsApi, contestQueryKeys } from "../api/contests.api";
import type { ContestClassPayload, ContestRewardPayload } from "../api/contests.api";
import { ParticipantManagementPanel } from "../components/ParticipantManagementPanel";
import { getContestErrorMessage } from "../lib/errors";
import { recordContestUiEvent } from "../lib/monitoring";
import { enrichBracketMatches, getRoundLabel, groupMatchesByRound, registrationName } from "../lib/tournament";
import { Button } from "@/shared/ui/button";
import { Input } from "@/shared/ui/input";
import { Badge } from "@/shared/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/shared/ui/dialog";
import { toast } from "sonner";
import type { BracketMatch, ContestClass } from "../types";
import { trackConfigApi } from "@/features/cafes/api/cafe.api";

function formatDateTime(dateStr: string) {
  try {
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return dateStr;
    return d.toLocaleDateString("vi-VN", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  } catch {
    return dateStr;
  }
}

export function ProviderContestDetailPage() {
  const { contestId } = useParams<{ contestId: string }>();
  const queryClient = useQueryClient();
  
  const [activeSubTab, setActiveSubTab] = useState<"general" | "players" | "brackets" | "rewards" | "monitoring">("general");

  // Manual Check-In Simulator State
  const [showScanDialog, setShowScanDialog] = useState(false);
  const [manualCode, setManualCode] = useState("");
  const [targetCafeId, setTargetCafeId] = useState("");

  // Staff Scoping & Match Filtering State
  const [matchFilterCafeId, setMatchFilterCafeId] = useState<string>("all");
  const [matchFilterStatus, setMatchFilterStatus] = useState<string>("all");

  // Dynamic Match Generator State
  const [showGenerateDialog, setShowGenerateDialog] = useState(false);
  const [generateFormat, setGenerateFormat] = useState<"KNOCKOUT" | "MULTI_DRIVER_HEAT" | "TIME_ATTACK">("KNOCKOUT");
  const [generateDriversPerMatch, setGenerateDriversPerMatch] = useState<number>(2);
  const [generateCafeId, setGenerateCafeId] = useState<string>("");
  const [generateTrackConfigId, setGenerateTrackConfigId] = useState<string>("");
  const [generateSeedingMode, setGenerateSeedingMode] = useState<"MANUAL" | "RANDOM" | "CHECK_IN_ORDER" | "QUALIFYING_RANK">("MANUAL");
  const [trackConfigs, setTrackConfigs] = useState<any[]>([]);
  const [loadingTrackConfigs, setLoadingTrackConfigs] = useState(false);
  const [selectedRegIdsForGeneration, setSelectedRegIdsForGeneration] = useState<string[]>([]);

  // Bracket Match Editor State
  const [showMatchDialog, setShowMatchDialog] = useState(false);
  const [selectedMatch, setSelectedMatch] = useState<BracketMatch | null>(null);
  const [matchWinnerId, setMatchWinnerId] = useState("");
  const [matchScore, setMatchScore] = useState("");

  // Reward Creator State
  const [showRewardDialog, setShowRewardDialog] = useState(false);
  const [rewardTitle, setRewardTitle] = useState("");
  const [rewardDesc, setRewardDesc] = useState("");
  const [rewardType, setRewardType] = useState<"TROPHY" | "VOUCHER" | "MERCHANDISE" | "POINTS">("TROPHY");
  const [rewardPosition, setRewardPosition] = useState(1);
  const [rewardQty, setRewardQty] = useState(1);
  const [rewardCode, setRewardCode] = useState("");

  // Class/Round Creation State
  const [showClassDialog, setShowClassDialog] = useState(false);
  const [classCode, setClassCode] = useState("");
  const [classNameField, setClassNameField] = useState("");
  const [classCap, setClassCap] = useState(16);

  // Queries
  const { data: contest, isLoading: isContestLoading } = useQuery({
    queryKey: contestQueryKeys.detail(contestId),
    queryFn: () => contestsApi.getContestDetail(contestId!),
    enabled: !!contestId,
  });

  const { data: registrations = [] } = useQuery({
    queryKey: contestQueryKeys.registrations(contestId),
    queryFn: () => contestsApi.getContestRegistrations(contestId!),
    enabled: !!contestId,
  });

  const { data: rewardsEnvelope } = useQuery({
    queryKey: contestQueryKeys.rewards(contestId),
    queryFn: () => contestsApi.getContestRewards(contestId!),
    enabled: !!contestId,
  });

  const { data: bracketData } = useQuery({
    queryKey: contestQueryKeys.bracket(contestId),
    queryFn: () => contestsApi.getContestBracket(contestId!),
    enabled: !!contestId,
  });

  const { data: auditLogs = [] } = useQuery({
    queryKey: contestQueryKeys.auditLogs(contestId),
    queryFn: () => contestsApi.listAuditLogs(contestId!),
    enabled: !!contestId && activeSubTab === "monitoring",
  });

  const { data: metrics } = useQuery({
    queryKey: contestQueryKeys.metrics(contestId),
    queryFn: () => contestsApi.getMetrics(contestId!),
    enabled: !!contestId && activeSubTab === "monitoring",
  });

  const rewards = rewardsEnvelope?.data || [];
  const contestClasses = bracketData?.classes || [];
  const primaryClass = contestClasses[0];
  const selectedCafeId = targetCafeId || contest?.participating_cafes?.[0]?.id || "";
  const rawBracketSize = Number(contest?.config?.bracket_size ?? 8);
  const isSupportedBracketSize = rawBracketSize === 4 || rawBracketSize === 8;
  const bracketSize = isSupportedBracketSize ? rawBracketSize : 8;
  const bracketSizeDisplay = isSupportedBracketSize
    ? `${bracketSize} tay đua`
    : `${rawBracketSize} tay đua (cần generator BE)`;
  const bracketMatches = useMemo(
    () => enrichBracketMatches(bracketData?.matches || [], registrations),
    [bracketData?.matches, registrations]
  );

  const filteredBracketMatches = useMemo(() => {
    return bracketMatches.filter((match) => {
      // 1. Cafe filter
      const matchCafeId = (match as any).cafeId || (match as any).cafe_id;
      if (matchFilterCafeId !== "all" && matchCafeId !== matchFilterCafeId) {
        return false;
      }
      // 2. Status filter
      if (matchFilterStatus !== "all" && match.status !== matchFilterStatus) {
        return false;
      }
      return true;
    });
  }, [bracketMatches, matchFilterCafeId, matchFilterStatus]);

  const bracketGroups = useMemo(
    () => groupMatchesByRound(filteredBracketMatches, bracketData?.rounds || []),
    [filteredBracketMatches, bracketData?.rounds]
  );

  useEffect(() => {
    if (generateCafeId) {
      setLoadingTrackConfigs(true);
      trackConfigApi
        .listTrackConfigs(generateCafeId)
        .then((configs) => {
          setTrackConfigs(configs || []);
          setGenerateTrackConfigId(configs?.[0]?.id || "");
        })
        .catch((err) => {
          console.error("Lỗi lấy cấu hình track:", err);
          setTrackConfigs([]);
          setGenerateTrackConfigId("");
        })
        .finally(() => {
          setLoadingTrackConfigs(false);
        });
    } else {
      setTrackConfigs([]);
      setGenerateTrackConfigId("");
    }
  }, [generateCafeId]);

  useEffect(() => {
    if (showGenerateDialog) {
      const checkedIn = registrations.filter((r) => r.status === "CHECKED_IN").map((r) => r.id);
      setSelectedRegIdsForGeneration(checkedIn);
      if (contest?.participating_cafes && contest.participating_cafes.length > 0) {
        setGenerateCafeId(contest.participating_cafes[0].id || "");
      }
    }
  }, [showGenerateDialog, registrations, contest]);
  const recordProviderContestEvent = (
    event: string,
    details: Parameters<typeof recordContestUiEvent>[1] = {},
  ) => recordContestUiEvent(event, { contestId, ...details });

  // Mutations
  const openContestMutation = useMutation({
    mutationFn: () => contestsApi.openContest(contestId!),
    onSuccess: () => {
      recordProviderContestEvent("provider.contest.open.success");
      toast.success("Giải đấu đã được mở đăng ký!");
      queryClient.invalidateQueries({ queryKey: contestQueryKeys.detail(contestId) });
    },
    onError: (err: unknown) => {
      const message = getContestErrorMessage(err, "Lỗi mở đăng ký.");
      recordProviderContestEvent("provider.contest.open.error", { metadata: { message } });
      toast.error(message);
    },
  });

  const cancelContestMutation = useMutation({
    mutationFn: () => contestsApi.cancelContest(contestId!),
    onSuccess: () => {
      recordProviderContestEvent("provider.contest.cancel.success");
      toast.success("Giải đấu đã bị hủy bỏ.");
      queryClient.invalidateQueries({ queryKey: contestQueryKeys.detail(contestId) });
    },
    onError: (err: unknown) => {
      const message = getContestErrorMessage(err, "Lỗi hủy giải đấu.");
      recordProviderContestEvent("provider.contest.cancel.error", { metadata: { message } });
      toast.error(message);
    },
  });

  const checkInMutation = useMutation({
    mutationFn: (args: { regId: string; cafeId: string }) =>
      contestsApi.checkInParticipant(args.regId, { cafe_id: args.cafeId }),
    onSuccess: (_, args) => {
      recordProviderContestEvent("provider.registration.check_in.success", {
        registrationId: args.regId,
        metadata: { cafeId: args.cafeId },
      });
      toast.success("Check-in vận động viên thành công!");
      queryClient.invalidateQueries({ queryKey: contestQueryKeys.registrations(contestId) });
      queryClient.invalidateQueries({ queryKey: contestQueryKeys.metrics(contestId) });
      queryClient.invalidateQueries({ queryKey: contestQueryKeys.auditLogs(contestId) });
    },
    onError: (err: unknown, args) => {
      const message = getContestErrorMessage(err, "Check-in thất bại.");
      recordProviderContestEvent("provider.registration.check_in.error", {
        registrationId: args.regId,
        metadata: { cafeId: args.cafeId, message },
      });
      toast.error(message);
    },
  });

  const cancelRegistrationMutation = useMutation({
    mutationFn: (args: { regId: string; reason: string }) =>
      contestsApi.cancelRegistration(args.regId, { reason: args.reason }),
    onSuccess: (_, args) => {
      recordProviderContestEvent("provider.registration.cancel.success", {
        registrationId: args.regId,
      });
      toast.success("Đã hủy đăng ký vận động viên.");
      queryClient.invalidateQueries({ queryKey: contestQueryKeys.detail(contestId) });
      queryClient.invalidateQueries({ queryKey: contestQueryKeys.registrations(contestId) });
      queryClient.invalidateQueries({ queryKey: contestQueryKeys.bracket(contestId) });
      queryClient.invalidateQueries({ queryKey: contestQueryKeys.metrics(contestId) });
      queryClient.invalidateQueries({ queryKey: contestQueryKeys.auditLogs(contestId) });
    },
    onError: (err: unknown, args) => {
      const message = getContestErrorMessage(err, "Hủy đăng ký thất bại.");
      recordProviderContestEvent("provider.registration.cancel.error", {
        registrationId: args.regId,
        metadata: { message },
      });
      toast.error(message);
    },
  });

  const approveRegistrationMutation = useMutation({
    mutationFn: (regId: string) => contestsApi.approveRegistration(regId),
    onSuccess: (_, regId) => {
      recordProviderContestEvent("provider.registration.approve.success", {
        registrationId: regId,
      });
      toast.success("Đã phê duyệt đăng ký thành công!");
      queryClient.invalidateQueries({ queryKey: contestQueryKeys.detail(contestId) });
      queryClient.invalidateQueries({ queryKey: contestQueryKeys.registrations(contestId) });
      queryClient.invalidateQueries({ queryKey: contestQueryKeys.metrics(contestId) });
      queryClient.invalidateQueries({ queryKey: contestQueryKeys.auditLogs(contestId) });
    },
    onError: (err: unknown, regId) => {
      const message = getContestErrorMessage(err, "Phê duyệt thất bại.");
      recordProviderContestEvent("provider.registration.approve.error", {
        registrationId: regId,
        metadata: { message },
      });
      toast.error(message);
    },
  });

  const rejectRegistrationMutation = useMutation({
    mutationFn: (args: { regId: string; reason: string }) =>
      contestsApi.rejectRegistration(args.regId, { reason: args.reason }),
    onSuccess: (_, args) => {
      recordProviderContestEvent("provider.registration.reject.success", {
        registrationId: args.regId,
      });
      toast.success("Đã từ chối đăng ký vận động viên.");
      queryClient.invalidateQueries({ queryKey: contestQueryKeys.detail(contestId) });
      queryClient.invalidateQueries({ queryKey: contestQueryKeys.registrations(contestId) });
      queryClient.invalidateQueries({ queryKey: contestQueryKeys.metrics(contestId) });
      queryClient.invalidateQueries({ queryKey: contestQueryKeys.auditLogs(contestId) });
    },
    onError: (err: unknown, args) => {
      const message = getContestErrorMessage(err, "Từ chối đăng ký thất bại.");
      recordProviderContestEvent("provider.registration.reject.error", {
        registrationId: args.regId,
        metadata: { message },
      });
      toast.error(message);
    },
  });

  const createClassMutation = useMutation({
    mutationFn: (body: ContestClassPayload) => contestsApi.createContestClass(contestId!, body),
    onSuccess: (_, body) => {
      recordProviderContestEvent("provider.class.create.success", { metadata: { code: body.code } });
      toast.success("Tạo nhóm đua (Class) thành công!");
      setShowClassDialog(false);
      setClassCode("");
      setClassNameField("");
      queryClient.invalidateQueries({ queryKey: contestQueryKeys.detail(contestId) });
      queryClient.invalidateQueries({ queryKey: contestQueryKeys.bracket(contestId) });
      queryClient.invalidateQueries({ queryKey: contestQueryKeys.classes(contestId) });
    },
    onError: (err: unknown, body) => {
      const message = getContestErrorMessage(err, "Lỗi tạo Class.");
      recordProviderContestEvent("provider.class.create.error", { metadata: { code: body.code, message } });
      toast.error(message);
    },
  });

  const createRewardMutation = useMutation({
    mutationFn: (body: ContestRewardPayload) => contestsApi.createContestReward(contestId!, body),
    onSuccess: (_, body) => {
      recordProviderContestEvent("provider.reward.create.success", {
        metadata: { position: body.position, rewardType: body.reward_type },
      });
      toast.success("Thêm phần thưởng thành công!");
      setShowRewardDialog(false);
      setRewardTitle("");
      setRewardDesc("");
      queryClient.invalidateQueries({ queryKey: contestQueryKeys.rewards(contestId) });
    },
    onError: (err: unknown, body) => {
      const message = getContestErrorMessage(err, "Lỗi thêm giải thưởng.");
      recordProviderContestEvent("provider.reward.create.error", {
        metadata: { position: body.position, rewardType: body.reward_type, message },
      });
      toast.error(message);
    },
  });

  const publishLeaderboardMutation = useMutation({
    mutationFn: (contestClass?: ContestClass) =>
      contestsApi.publishLeaderboard(
        contestId!,
        contestClass ? { contest_class_id: contestClass.id, scope: "OVERALL" } : { scope: "OVERALL" }
      ),
    onSuccess: () => {
      recordProviderContestEvent("provider.leaderboard.publish.success", {
        metadata: { contestClassId: primaryClass?.id },
      });
      toast.success("Công bố bảng xếp hạng thành công!");
      queryClient.invalidateQueries({ queryKey: contestQueryKeys.leaderboard(contestId) });
    },
    onError: (err: unknown) => {
      const message = getContestErrorMessage(err, "Lỗi công bố bảng xếp hạng.");
      recordProviderContestEvent("provider.leaderboard.publish.error", { metadata: { message } });
      toast.error(message);
    },
  });

  const issueRewardsMutation = useMutation({
    mutationFn: (contestClass?: ContestClass) =>
      contestsApi.issueRewards(contestId!, contestClass ? { contest_class_id: contestClass.id } : {}),
    onSuccess: () => {
      recordProviderContestEvent("provider.reward.issue.success", {
        metadata: { contestClassId: primaryClass?.id },
      });
      toast.success("Phát thưởng thành công cho các tay đua đứng top!");
    },
    onError: (err: unknown) => {
      const message = getContestErrorMessage(err, "Lỗi phát thưởng.");
      recordProviderContestEvent("provider.reward.issue.error", { metadata: { message } });
      toast.error(message);
    },
  });

  const generateMatchesMutation = useMutation({
    mutationFn: async () => {
      if (selectedRegIdsForGeneration.length === 0) {
        throw new Error("Vui lòng chọn ít nhất 1 vận động viên để xếp lịch.");
      }
      return contestsApi.generateMatches(contestId!, {
        format: generateFormat,
        drivers_per_match: generateDriversPerMatch,
        registration_ids: selectedRegIdsForGeneration,
        seeding_mode: generateSeedingMode,
        cafe_id: generateCafeId || null,
        track_config_id: generateTrackConfigId || null,
      });
    },
    onSuccess: (generatedMatches) => {
      recordProviderContestEvent("provider.bracket.generate.success", {
        metadata: { matchCount: generatedMatches.length },
      });
      toast.success(`Đã tự động xếp ${generatedMatches.length} trận đấu thành công.`);
      setShowGenerateDialog(false);
      queryClient.invalidateQueries({ queryKey: contestQueryKeys.bracket(contestId) });
      queryClient.invalidateQueries({ queryKey: contestQueryKeys.metrics(contestId) });
    },
    onError: (err: unknown) => {
      const message = getContestErrorMessage(err, "Lỗi xếp lịch thi đấu.");
      recordProviderContestEvent("provider.bracket.generate.error", {
        metadata: { message },
      });
      toast.error(message);
    },
  });

  // Simulated Manual QR code check-in submit
  const handleManualCheckInSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!manualCode) return;
    const targetReg = registrations.find(
      (r) => r.check_in_code === manualCode && r.status === "CONFIRMED"
    );

    if (!targetReg) {
      toast.error("Mã check-in không hợp lệ hoặc vận động viên đã check-in trước đó!");
      return;
    }

    checkInMutation.mutate({ regId: targetReg.id, cafeId: selectedCafeId });
    setShowScanDialog(false);
    setManualCode("");
  };

  const handleMatchClick = (match?: BracketMatch) => {
    if (!match) return;
    setSelectedMatch(match);
    setMatchWinnerId(match.winnerRegistrationId || "");
    setMatchScore(typeof match.metadata?.score === "string" ? match.metadata.score : "");
    setShowMatchDialog(true);
  };

  const renderBracketCompetitor = (match: BracketMatch, slot: "A" | "B") => {
    const registration = slot === "A" ? match.competitorA : match.competitorB;
    const registrationId = slot === "A" ? match.competitorARegistrationId : match.competitorBRegistrationId;
    const isWinner = Boolean(registrationId && match.winnerRegistrationId === registrationId);
    return (
      <div className={`flex justify-between items-center text-sm p-1.5 rounded ${isWinner ? "bg-orange-500/20 text-orange-400 font-bold" : "text-slate-400"}`}>
        <span className="truncate max-w-[160px]">{registrationName(registration)}</span>
        <span className="font-mono">{isWinner ? "W" : ""}</span>
      </div>
    );
  };

  const handleSaveMatchResult = async () => {
    if (!selectedMatch || !matchWinnerId) return;
    try {
      const compAId = selectedMatch.competitorARegistrationId;
      const compBId = selectedMatch.competitorBRegistrationId;
      if (!compAId || !compBId) {
        toast.error("Trận đấu chưa đủ tay đua tham gia để ghi nhận kết quả.");
        return;
      }

      const scoreNum = Number(matchScore) || 0;

      // 1. Submit match results to backend
      await contestsApi.submitMatchResults(selectedMatch.id, {
        results: [
          {
            registration_id: matchWinnerId,
            finish_position: 1,
            score: scoreNum,
            is_winner: true,
          },
          {
            registration_id: matchWinnerId === compAId ? compBId : compAId,
            finish_position: 2,
            score: 0,
            is_winner: false,
          },
        ],
        reason: "Ghi nhận kết quả trực tiếp từ bảng quản trị giải đấu",
      });

      // 2. If nextMatchId exists, advance the winner to the next round
      if (selectedMatch.nextMatchId) {
        await contestsApi.advanceMatch(selectedMatch.id, {
          next_match_id: selectedMatch.nextMatchId,
          top_n: 1,
        });
      }

      recordProviderContestEvent("provider.bracket.match_result.success", {
        matchId: selectedMatch.id,
        metadata: { winnerRegistrationId: matchWinnerId },
      });
      setShowMatchDialog(false);
      queryClient.invalidateQueries({ queryKey: contestQueryKeys.bracket(contestId) });
      queryClient.invalidateQueries({ queryKey: contestQueryKeys.metrics(contestId) });
      toast.success("Đã ghi nhận kết quả và đẩy winner sang vòng tiếp theo thành công!");
    } catch (err: unknown) {
      const message = getContestErrorMessage(err, "Lỗi ghi nhận kết quả trận đấu.");
      recordProviderContestEvent("provider.bracket.match_result.error", {
        matchId: selectedMatch.id,
        metadata: { winnerRegistrationId: matchWinnerId, message },
      });
      toast.error(message);
    }
  };

  if (isContestLoading) {
    return (
      <div className="min-h-screen bg-slate-950 text-slate-100 flex items-center justify-center">
        <div className="text-center space-y-4">
          <div className="w-10 h-10 border-4 border-orange-500 border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-slate-400 text-sm">Đang tải cấu hình chi tiết giải đấu...</p>
        </div>
      </div>
    );
  }

  if (!contest) return null;

  return (
    <div className="space-y-6 text-slate-100 p-6 max-w-7xl mx-auto">
      {/* Header Primitive */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div className="flex items-center gap-3">
          <Button asChild variant="ghost" className="text-slate-400 hover:text-white rounded-xl">
            <Link to="/provider/contests">
              <ArrowLeft size={16} />
            </Link>
          </Button>
          <div>
            <h1 className="text-2xl font-extrabold text-white line-clamp-1">{contest.name}</h1>
            <p className="text-xs text-slate-400 mt-1 flex items-center gap-2">
              <Calendar size={13} /> Khởi tranh: {formatDateTime(contest.starts_at)}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {contest.status === "DRAFT" && (
            <Button
              onClick={() => openContestMutation.mutate()}
              disabled={openContestMutation.isPending}
              className="bg-green-600 hover:bg-green-700 text-white font-bold"
            >
              <Play size={16} className="mr-1.5" /> Mở Đăng Ký
            </Button>
          )}

          {contest.status !== "CANCELLED" && contest.status !== "COMPLETED" && (
            <Button
              onClick={() => {
                if (confirm("Bạn có chắc chắn muốn hủy giải đấu này?")) {
                  cancelContestMutation.mutate();
                }
              }}
              disabled={cancelContestMutation.isPending}
              variant="outline"
              className="border-red-500/30 text-red-400 hover:bg-red-500/10 font-bold"
            >
              <XCircle size={16} className="mr-1.5" /> Hủy giải đấu
            </Button>
          )}
        </div>
      </div>

      {/* Primary Sub-Tabs Navigation */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-1.5 flex gap-2 overflow-x-auto">
        <button
          onClick={() => setActiveSubTab("general")}
          className={`py-2 px-4 rounded-lg text-xs font-bold transition-all shrink-0 ${activeSubTab === "general" ? "bg-orange-600 text-white" : "text-slate-400 hover:text-white"}`}
        >
          Tổng quan & Thiết lập
        </button>
        <button
          onClick={() => setActiveSubTab("players")}
          className={`py-2 px-4 rounded-lg text-xs font-bold transition-all shrink-0 ${activeSubTab === "players" ? "bg-orange-600 text-white" : "text-slate-400 hover:text-white"}`}
        >
          Quản lý Vận động viên ({registrations.length})
        </button>
        <button
          onClick={() => setActiveSubTab("brackets")}
          className={`py-2 px-4 rounded-lg text-xs font-bold transition-all shrink-0 ${activeSubTab === "brackets" ? "bg-orange-600 text-white" : "text-slate-400 hover:text-white"}`}
        >
          Nhánh đấu & Kết quả Knockout
        </button>
        <button
          onClick={() => setActiveSubTab("rewards")}
          className={`py-2 px-4 rounded-lg text-xs font-bold transition-all shrink-0 ${activeSubTab === "rewards" ? "bg-orange-600 text-white" : "text-slate-400 hover:text-white"}`}
        >
          Xếp hạng & Phần thưởng
        </button>
        <button
          onClick={() => setActiveSubTab("monitoring")}
          className={`py-2 px-4 rounded-lg text-xs font-bold transition-all shrink-0 ${activeSubTab === "monitoring" ? "bg-orange-600 text-white" : "text-slate-400 hover:text-white"}`}
        >
          Giám sát & Lịch sử vận hành
        </button>
      </div>

      {/* Tab: General Settings Overview */}
      {activeSubTab === "general" && (
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-6 shadow-xl">
          <div className="flex justify-between items-center pb-4 border-b border-slate-800">
            <h3 className="font-bold text-slate-100 flex items-center gap-1.5">
              <Settings size={18} className="text-orange-500" /> Thông tin tổng quan giải đấu
            </h3>
            {contest.status === "DRAFT" && (
              <Button asChild size="sm" variant="outline" className="border-slate-800 text-slate-300">
                <Link to={`/provider/contests/${contest.id}/edit`}>Chỉnh sửa cài đặt</Link>
              </Button>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-sm">
            <div className="space-y-1">
              <span className="text-[10px] text-slate-500 uppercase block font-semibold">Trạng thái giải đấu</span>
              <Badge className="bg-orange-500/10 text-orange-400 border border-orange-500/20">{contest.status}</Badge>
            </div>
            <div className="space-y-1">
              <span className="text-[10px] text-slate-500 uppercase block font-semibold">Lệ phí giải đấu</span>
              <span className="font-bold text-slate-200">{contest.entry_fee.toLocaleString()} đ</span>
            </div>
            <div className="space-y-1">
              <span className="text-[10px] text-slate-500 uppercase block font-semibold">Giới hạn vận động viên</span>
              <span className="font-bold text-slate-200">{contest.capacity} người</span>
            </div>
            <div className="space-y-1">
              <span className="text-[10px] text-slate-500 uppercase block font-semibold">Nhánh Knockout tối đa</span>
              <span className="font-bold text-slate-200">{bracketSizeDisplay}</span>
            </div>
            <div className="space-y-1">
              <span className="text-[10px] text-slate-500 uppercase block font-semibold">Thời gian khai mạc</span>
              <span className="font-bold text-slate-200">{formatDateTime(contest.starts_at)}</span>
            </div>
            <div className="space-y-1">
              <span className="text-[10px] text-slate-500 uppercase block font-semibold">Hạn đóng đăng ký</span>
              <span className="font-bold text-slate-200">{formatDateTime(contest.registration_closes_at)}</span>
            </div>
          </div>

          <div className="border-t border-slate-800 pt-6">
            <h4 className="font-bold text-xs text-slate-400 uppercase tracking-wider mb-3">Các cơ sở đăng cai tổ chức</h4>
            <div className="flex flex-wrap gap-3">
              {contest.participating_cafes.map((c) => (
                <div key={c.id} className="bg-slate-950 border border-slate-850 px-4 py-2 rounded-xl flex items-center gap-2">
                  <MapPin size={14} className="text-orange-500" />
                  <span className="text-xs font-bold text-slate-250">{c.name} ({c.city})</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Tab: Registrations & Check-In */}
      {activeSubTab === "players" && (
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
          onCheckIn={(registrationId, cafeId) => checkInMutation.mutate({ regId: registrationId, cafeId })}
          onCancel={(registrationId, reason) =>
            cancelRegistrationMutation.mutate({ regId: registrationId, reason })
          }
          onApprove={(registrationId) => approveRegistrationMutation.mutate(registrationId)}
          onReject={(registrationId, reason) =>
            rejectRegistrationMutation.mutate({ regId: registrationId, reason })
          }
        />
      )}

      {/* Tab: Knockout Brackets & Matches */}
      {activeSubTab === "brackets" && (
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-6 shadow-xl">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-slate-800 pb-4">
            <div>
              <h3 className="font-bold text-slate-100 flex items-center gap-2">
                <Trophy size={18} className="text-orange-500" /> Sơ đồ & Kết quả loại trực tiếp (Single Elimination)
              </h3>
              <p className="text-[10px] text-slate-400 mt-0.5">
                Bảng đấu loại trực tiếp được lưu trên hệ thống. Click vào trận đấu để ghi nhận kết quả thắng thua!
              </p>
            </div>
            <div className="flex items-center gap-2">
              <Button
                onClick={() => setShowGenerateDialog(true)}
                disabled={generateMatchesMutation.isPending}
                className="bg-orange-600 hover:bg-orange-700 text-white font-bold"
              >
                <Plus size={14} className="mr-1" /> Xếp lịch thi đấu
              </Button>
              <Button
                onClick={() => setShowClassDialog(true)}
                variant="outline"
                className="border-slate-800 text-slate-350 hover:bg-slate-950 font-bold"
              >
                <Plus size={14} className="mr-1" /> Tạo nhóm (Class)
              </Button>
            </div>
          </div>

          {/* Staff Scoping UI/Filter Bar */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 bg-slate-950 p-4 rounded-xl border border-slate-850 text-xs">
            <div className="flex flex-col gap-1.5">
              <label className="text-slate-450 font-bold flex items-center gap-1">
                <MapPin size={12} className="text-orange-500" /> Bộ lọc chi nhánh (Cafe)
              </label>
              <select
                value={matchFilterCafeId}
                onChange={(e) => setMatchFilterCafeId(e.target.value)}
                className="bg-slate-900 border border-slate-850 text-slate-100 rounded-lg p-2 font-semibold outline-none focus:border-orange-500"
              >
                <option value="all">Tất cả chi nhánh</option>
                {contest?.participating_cafes?.map((cafe: any) => (
                  <option key={cafe.id} value={cafe.id}>
                    {cafe.name}
                  </option>
                ))}
              </select>
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="text-slate-450 font-bold flex items-center gap-1">
                <Activity size={12} className="text-orange-500" /> Bộ lọc trạng thái trận đấu
              </label>
              <select
                value={matchFilterStatus}
                onChange={(e) => setMatchFilterStatus(e.target.value)}
                className="bg-slate-900 border border-slate-850 text-slate-100 rounded-lg p-2 font-semibold outline-none focus:border-orange-500"
              >
                <option value="all">Tất cả trạng thái</option>
                <option value="SCHEDULED">Chưa thi đấu (SCHEDULED)</option>
                <option value="COMPLETED">Đã kết thúc (COMPLETED)</option>
                <option value="CANCELLED">Đã hủy (CANCELLED)</option>
              </select>
            </div>
          </div>

          {/* Interactive Bracket Board */}
          <div className="overflow-x-auto py-6">
            {bracketGroups.length === 0 ? (
              <div className="text-center text-sm text-slate-500 py-8 border border-dashed border-slate-800 rounded-xl">
                Chưa có bracket. Hãy tạo Class, check-in đủ {bracketSize} người chơi rồi bấm dựng bracket {bracketSize} người.
              </div>
            ) : (
              <div className="min-w-[760px] flex items-stretch gap-5 px-4">
                {bracketGroups.map((group) => (
                  <div key={group.round?.id ?? group.matches[0]?.id} className="flex min-w-64 flex-1 flex-col justify-center gap-3">
                    <div className="text-center font-bold text-xs text-slate-500 uppercase tracking-widest border-b border-slate-800 pb-1.5">
                      {getRoundLabel(group.round)}
                    </div>
                    {group.matches.map((match) => (
                      <button
                        key={match.id}
                        type="button"
                        onClick={() => handleMatchClick(match)}
                        className="bg-slate-950 border border-slate-850 hover:border-orange-500/40 rounded-xl p-3 cursor-pointer transition-all hover:shadow-lg hover:shadow-orange-500/5 text-left"
                      >
                        <div className="flex justify-between items-center gap-3 text-[10px] text-slate-500 font-bold mb-2">
                          <span>Trận {match.matchNo}</span>
                          <span className="text-orange-500">
                            {match.metadata?.score ? `Điểm: ${match.metadata.score}` : match.status}
                          </span>
                        </div>
                        <div className="space-y-1.5">
                          {renderBracketCompetitor(match, "A")}
                          {renderBracketCompetitor(match, "B")}
                        </div>
                      </button>
                    ))}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Tab: Standings & Rewards Claim */}
      {activeSubTab === "rewards" && (
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-6 shadow-xl">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-slate-800 pb-4">
            <div>
              <h3 className="font-bold text-slate-100 flex items-center gap-2">
                <Medal size={18} className="text-orange-500" /> Quản lý giải thưởng & Công bố BXH
              </h3>
              <p className="text-[10px] text-slate-400 mt-0.5">
                Thiết lập quà tặng cho vị trí Nhất, Nhì, Ba, thực hiện công bố bảng xếp hạng hoặc phát thưởng.
              </p>
            </div>
            <div className="flex items-center gap-2">
              <Button
                onClick={() => {
                  if (confirm("Xác nhận công bố kết quả bảng xếp hạng chung cuộc lên trang chủ giải đấu?")) {
                    publishLeaderboardMutation.mutate(primaryClass);
                  }
                }}
                disabled={publishLeaderboardMutation.isPending}
                className="bg-orange-600 hover:bg-orange-700 text-white font-bold"
              >
                Công bố BXH
              </Button>
              <Button
                onClick={() => {
                  if (confirm("Xác nhận phát hành voucher quà tặng & cúp điện tử cho các tay đua trong bảng xếp hạng?")) {
                    issueRewardsMutation.mutate(primaryClass);
                  }
                }}
                disabled={issueRewardsMutation.isPending}
                variant="outline"
                className="border-green-500/30 text-green-400 hover:bg-green-500/10 font-bold"
              >
                Phát thưởng
              </Button>
              <Button
                onClick={() => setShowRewardDialog(true)}
                className="bg-slate-950 border border-slate-850 hover:bg-slate-900 text-slate-300 font-bold flex items-center gap-1"
              >
                <Plus size={14} /> Thêm quà
              </Button>
            </div>
          </div>

          {/* Rewards List */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {rewards.map((reward) => (
              <div
                key={reward.id}
                className="bg-slate-950 border border-slate-850 rounded-xl p-4 flex gap-4 hover:border-orange-500/20 transition-all shadow-md"
              >
                <div className="bg-orange-500/10 p-3 rounded-xl border border-orange-500/20 text-orange-400 self-start">
                  <Award size={20} />
                </div>
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-xs uppercase text-orange-500 font-extrabold font-mono">
                      HẠNG {reward.position}
                    </span>
                    <Badge variant="secondary" className="text-[9px] bg-slate-900 border border-slate-850 px-1 py-0">
                      Số lượng: {reward.quantity}
                    </Badge>
                  </div>
                  <h4 className="font-extrabold text-sm text-slate-100">{reward.title}</h4>
                  <p className="text-xs text-slate-400 mt-1">{reward.description}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {activeSubTab === "monitoring" && (
        <div className="space-y-6 animate-fadeIn">
          {/* Operational Metrics Section */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-6 shadow-xl">
            <h3 className="font-bold text-slate-100 flex items-center gap-1.5 border-b border-slate-800 pb-3">
              <BarChart3 size={18} className="text-orange-500" /> Thống kê vận hành (Real-time Metrics)
            </h3>
            
            <div className="space-y-4">
              <div>
                <h4 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-2">Thống kê Vận động viên</h4>
                <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                  <div className="bg-slate-950 border border-slate-850 p-4 rounded-xl flex flex-col justify-between">
                    <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Tổng Đăng ký</span>
                    <span className="text-2xl font-extrabold text-orange-500 mt-2">{metrics?.registration_stats?.total ?? 0}</span>
                  </div>
                  <div className="bg-slate-950 border border-slate-850 p-4 rounded-xl flex flex-col justify-between">
                    <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Đang chờ duyệt</span>
                    <span className="text-2xl font-extrabold text-amber-500 mt-2">{metrics?.registration_stats?.pending ?? 0}</span>
                  </div>
                  <div className="bg-slate-950 border border-slate-850 p-4 rounded-xl flex flex-col justify-between">
                    <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Đã xác nhận</span>
                    <span className="text-2xl font-extrabold text-green-500 mt-2">{metrics?.registration_stats?.confirmed ?? 0}</span>
                  </div>
                  <div className="bg-slate-950 border border-slate-850 p-4 rounded-xl flex flex-col justify-between">
                    <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Đã Check-in</span>
                    <span className="text-2xl font-extrabold text-blue-500 mt-2">{metrics?.registration_stats?.checkedIn ?? 0}</span>
                  </div>
                  <div className="bg-slate-950 border border-slate-850 p-4 rounded-xl flex flex-col justify-between">
                    <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Đã Hủy bỏ</span>
                    <span className="text-2xl font-extrabold text-red-500 mt-2">{metrics?.registration_stats?.cancelled ?? 0}</span>
                  </div>
                </div>
              </div>

              <div className="pt-2">
                <h4 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-2">Thống kê trận đấu Knockout</h4>
                <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                  <div className="bg-slate-950 border border-slate-850 p-4 rounded-xl flex flex-col justify-between">
                    <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Tổng trận đấu</span>
                    <span className="text-2xl font-extrabold text-slate-200 mt-2">{metrics?.match_stats?.total ?? 0}</span>
                  </div>
                  <div className="bg-slate-950 border border-slate-850 p-4 rounded-xl flex flex-col justify-between">
                    <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Nháp (Draft)</span>
                    <span className="text-2xl font-extrabold text-slate-400 mt-2">{metrics?.match_stats?.draft ?? 0}</span>
                  </div>
                  <div className="bg-slate-950 border border-slate-850 p-4 rounded-xl flex flex-col justify-between">
                    <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Sẵn sàng (Ready)</span>
                    <span className="text-2xl font-extrabold text-yellow-500 mt-2">{metrics?.match_stats?.ready ?? 0}</span>
                  </div>
                  <div className="bg-slate-950 border border-slate-850 p-4 rounded-xl flex flex-col justify-between">
                    <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Hoàn thành</span>
                    <span className="text-2xl font-extrabold text-green-500 mt-2">{metrics?.match_stats?.completed ?? 0}</span>
                  </div>
                  <div className="bg-slate-950 border border-slate-850 p-4 rounded-xl flex flex-col justify-between">
                    <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Bị hủy</span>
                    <span className="text-2xl font-extrabold text-red-500 mt-2">{metrics?.match_stats?.cancelled ?? 0}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Audit Logs Section */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-6 shadow-xl">
            <h3 className="font-bold text-slate-100 flex items-center gap-1.5 border-b border-slate-800 pb-3">
              <Activity size={18} className="text-orange-500" /> Lịch sử thay đổi hệ thống (Audit Logs)
            </h3>

            {auditLogs.length === 0 ? (
              <div className="text-center text-sm text-slate-500 py-8">
                Không tìm thấy nhật ký thay đổi nào cho giải đấu này.
              </div>
            ) : (
              <div className="relative pl-6 border-l-2 border-slate-800 space-y-6 ml-2">
                {auditLogs.map((log) => {
                  let eventLabel = log.eventType;
                  if (log.eventType === "registration.created") eventLabel = "Đăng ký tham gia giải đấu";
                  else if (log.eventType === "registration.confirmed") eventLabel = "Phê duyệt đăng ký tham gia";
                  else if (log.eventType === "registration.checked_in") eventLabel = "Check-in vận động viên thành công";
                  else if (log.eventType === "registration.cancelled") eventLabel = "Hủy đăng ký vận động viên";
                  else if (log.eventType === "match.schedule_generated") eventLabel = "Tạo sơ đồ nhánh đấu Knockout";
                  else if (log.eventType === "match.participants_updated") eventLabel = "Cập nhật tay đua tham gia trận đấu";
                  else if (log.eventType === "match.result_submitted") eventLabel = "Ghi nhận kết quả trận đấu Knockout";
                  else if (log.eventType === "match.advanced") eventLabel = "Vận động viên chiến thắng đi tiếp";
                  else if (log.eventType === "leaderboard.published") eventLabel = "Công bố bảng xếp hạng chung cuộc";
                  else if (log.eventType === "reward.created") eventLabel = "Thiết lập giải thưởng giải đấu";
                  else if (log.eventType === "reward.issued") eventLabel = "Phát quà / cúp cho các tay đua";

                  const isRegistration = log.eventType.startsWith("registration");
                  const isMatch = log.eventType.startsWith("match");
                  const isReward = log.eventType.startsWith("reward");

                  return (
                    <div key={log.id} className="relative">
                      {/* Timeline dot */}
                      <span className={`absolute -left-[31px] top-1.5 w-4 h-4 rounded-full border-2 bg-slate-900 ${
                        isRegistration ? "border-blue-500" : isMatch ? "border-orange-500" : isReward ? "border-green-500" : "border-slate-500"
                      }`} />

                      <div className="bg-slate-950 border border-slate-850 p-4 rounded-xl space-y-2 hover:border-slate-800 transition-all">
                        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
                          <div className="flex items-center gap-2">
                            <span className="text-xs font-extrabold text-slate-100">{eventLabel}</span>
                            <Badge variant="secondary" className="text-[9px] bg-slate-900 border border-slate-850 font-bold uppercase tracking-wider text-slate-400">
                              {log.eventType}
                            </Badge>
                          </div>
                          <span className="text-[10px] text-slate-500">{formatDateTime(log.createdAt)}</span>
                        </div>

                        <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-slate-400">
                          <div>
                            Tác nhân: <span className="font-bold text-slate-300">{log.actorRole || "N/A"}</span>
                          </div>
                          {log.reason && (
                            <div>
                              Lý do: <span className="text-red-400 font-semibold">"{log.reason}"</span>
                            </div>
                          )}
                        </div>

                        {log.metadata && Object.keys(log.metadata).length > 0 && (
                          <div className="text-[10px] bg-[#121315] border border-slate-850 p-2.5 rounded-lg text-slate-400 font-mono overflow-x-auto">
                            <span className="text-[9px] text-slate-500 uppercase font-bold tracking-wider block mb-1">Dữ liệu sự kiện:</span>
                            {JSON.stringify(log.metadata, null, 2)}
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Scanner Simulator Dialog */}
      <Dialog open={showScanDialog} onOpenChange={setShowScanDialog}>
        <DialogContent className="bg-slate-900 border border-slate-800 text-slate-200 max-w-md">
          <DialogHeader>
            <DialogTitle className="text-white font-extrabold flex items-center gap-1.5">
              <QrCode className="text-orange-500" /> Quét Check-in Thủ Công
            </DialogTitle>
            <DialogDescription className="text-slate-400 text-xs">
              Nhập mã check-in (ví dụ: QR code hoặc chuỗi UUID hiển thị trên thiết bị của khách hàng) để ghi nhận check-in.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleManualCheckInSubmit} className="space-y-4 py-4">
            <div className="space-y-1.5">
              <label className="text-xs font-bold uppercase tracking-wider text-slate-400">Chọn chi nhánh check-in</label>
              <select
                value={selectedCafeId}
                onChange={(e) => setTargetCafeId(e.target.value)}
                className="bg-slate-950 border border-slate-850 rounded-lg py-2 px-3 text-sm text-slate-200 focus:outline-none w-full"
              >
                {contest.participating_cafes.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold uppercase tracking-wider text-slate-400">Mã check-in</label>
              <Input
                placeholder="Nhập mã check-in..."
                value={manualCode}
                onChange={(e) => setManualCode(e.target.value)}
                className="bg-slate-950 border-slate-850 text-slate-200 font-mono tracking-widest text-center"
                required
              />
            </div>

            <div className="flex justify-end gap-3 pt-2">
              <Button type="button" variant="ghost" onClick={() => setShowScanDialog(false)} className="text-slate-400">
                Hủy
              </Button>
              <Button type="submit" className="bg-orange-600 hover:bg-orange-700 font-bold">
                Xác nhận Check-in
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Match Result Editor Dialog */}
      <Dialog open={showMatchDialog} onOpenChange={setShowMatchDialog}>
        <DialogContent className="bg-slate-900 border border-slate-800 text-slate-200 max-w-md">
          <DialogHeader>
            <DialogTitle className="text-white font-extrabold flex items-center gap-1.5">
              <Trophy className="text-orange-500" /> Nhập kết quả trận đấu Knockout
            </DialogTitle>
            <DialogDescription className="text-slate-400 text-xs">
              Chọn tay đua chiến thắng để tự động đưa họ vào vòng tiếp theo của sơ đồ nhánh đấu.
            </DialogDescription>
          </DialogHeader>

          {selectedMatch && (
            <div className="space-y-4 py-4">
              <div className="space-y-1.5">
                <label className="text-xs font-bold uppercase tracking-wider text-slate-400">Chọn tay đua chiến thắng *</label>
                <select
                  value={matchWinnerId}
                  onChange={(e) => setMatchWinnerId(e.target.value)}
                  className="bg-slate-950 border border-slate-850 rounded-lg py-2 px-3 text-sm text-slate-200 focus:outline-none w-full"
                >
                  <option value="">Chọn người thắng...</option>
                  {selectedMatch.competitorA && (
                    <option value={selectedMatch.competitorA.id}>
                      {selectedMatch.competitorA.user?.fullName}
                    </option>
                  )}
                  {selectedMatch.competitorB && (
                    <option value={selectedMatch.competitorB.id}>
                      {selectedMatch.competitorB.user?.fullName}
                    </option>
                  )}
                </select>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold uppercase tracking-wider text-slate-400">Tỷ số / Ghi chú (e.g. 2 - 1)</label>
                <Input
                  placeholder="e.g. 2 - 1"
                  value={matchScore}
                  onChange={(e) => setMatchScore(e.target.value)}
                  className="bg-slate-950 border-slate-850 text-slate-200 font-mono text-center"
                />
              </div>

              <div className="flex justify-end gap-3 pt-2">
                <Button type="button" variant="ghost" onClick={() => setShowMatchDialog(false)} className="text-slate-400">
                  Hủy
                </Button>
                <Button
                  type="button"
                  onClick={handleSaveMatchResult}
                  disabled={!matchWinnerId}
                  className="bg-orange-600 hover:bg-orange-700 font-bold"
                >
                  Ghi nhận kết quả
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Generate Matches Dialog */}
      <Dialog open={showGenerateDialog} onOpenChange={setShowGenerateDialog}>
        <DialogContent className="bg-slate-900 border border-slate-800 text-slate-200 max-w-lg max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-white font-extrabold flex items-center gap-1.5">
              <Play className="text-orange-500" size={18} /> Tự động xếp lịch & trận đấu
            </DialogTitle>
            <DialogDescription className="text-slate-400 text-xs">
              Cấu hình các thông số và chọn vận động viên để xếp lịch thi đấu tự động.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4 text-xs font-semibold">
            {/* Format & Drivers Grid */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-slate-400 font-bold uppercase tracking-wider">Thể thức thi đấu</label>
                <select
                  value={generateFormat}
                  onChange={(e: any) => {
                    const fmt = e.target.value;
                    setGenerateFormat(fmt);
                    if (fmt === "KNOCKOUT") {
                      setGenerateDriversPerMatch(2);
                    }
                  }}
                  className="bg-slate-950 border border-slate-850 rounded-lg py-2 px-3 text-slate-205 focus:outline-none w-full font-bold"
                >
                  <option value="KNOCKOUT">Knockout (Đấu loại trực tiếp)</option>
                  <option value="MULTI_DRIVER_HEAT">Multi-driver Heat (Chạy nhóm/lượt)</option>
                  <option value="TIME_ATTACK">Time Attack (Đua tính giờ)</option>
                </select>
              </div>

              <div className="space-y-1.5">
                <label className="text-slate-400 font-bold uppercase tracking-wider">Số xe mỗi trận/lượt</label>
                <select
                  value={generateDriversPerMatch}
                  onChange={(e) => setGenerateDriversPerMatch(Number(e.target.value))}
                  disabled={generateFormat === "KNOCKOUT"}
                  className="bg-slate-950 border border-slate-855 rounded-lg py-2 px-3 text-slate-205 focus:outline-none w-full disabled:opacity-50 font-bold"
                >
                  <option value={2}>2 xe / trận</option>
                  <option value={4}>4 xe / trận</option>
                  <option value={6}>6 xe / trận</option>
                  <option value={8}>8 xe / trận</option>
                </select>
              </div>
            </div>

            {/* Branch & Track Grid */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-slate-400 font-bold uppercase tracking-wider">Địa điểm thi đấu</label>
                <select
                  value={generateCafeId}
                  onChange={(e) => setGenerateCafeId(e.target.value)}
                  className="bg-slate-950 border border-slate-850 rounded-lg py-2 px-3 text-slate-202 focus:outline-none w-full font-bold"
                >
                  <option value="">Chọn chi nhánh...</option>
                  {contest?.participating_cafes?.map((cafe: any) => (
                    <option key={cafe.id} value={cafe.id}>
                      {cafe.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-1.5">
                <label className="text-slate-400 font-bold uppercase tracking-wider flex items-center gap-1">
                  Cấu hình sa bàn
                  {loadingTrackConfigs && <span className="w-2.5 h-2.5 border-2 border-orange-500 border-t-transparent rounded-full animate-spin" />}
                </label>
                <select
                  value={generateTrackConfigId}
                  onChange={(e) => setGenerateTrackConfigId(e.target.value)}
                  disabled={!generateCafeId || loadingTrackConfigs}
                  className="bg-slate-950 border border-slate-850 rounded-lg py-2 px-3 text-slate-202 focus:outline-none w-full disabled:opacity-50 font-bold"
                >
                  <option value="">{trackConfigs.length === 0 ? "Không tìm thấy sa bàn" : "Chọn sa bàn..."}</option>
                  {trackConfigs.map((config) => {
                    const typeObj = config.trackType || config.track_type;
                    const typeLabel = typeof typeObj === "object" && typeObj
                      ? (typeObj.name || typeObj.code || "N/A")
                      : (typeObj || "N/A");
                    return (
                      <option key={config.id} value={config.id}>
                        {config.name} ({typeLabel})
                      </option>
                    );
                  })}
                </select>
              </div>
            </div>

            {/* Seeding Mode */}
            <div className="space-y-1.5">
              <label className="text-slate-400 font-bold uppercase tracking-wider">Cách xếp hạt giống / Bốc thăm</label>
              <select
                value={generateSeedingMode}
                onChange={(e: any) => setGenerateSeedingMode(e.target.value)}
                className="bg-slate-950 border border-slate-850 rounded-lg py-2 px-3 text-slate-202 focus:outline-none w-full font-bold"
              >
                <option value="MANUAL">Thủ công (Manual)</option>
                <option value="RANDOM">Ngẫu nhiên (Random)</option>
                <option value="CHECK_IN_ORDER">Theo thứ tự Check-in</option>
                <option value="QUALIFYING_RANK">Theo thứ tự Vòng loại (Qualifying Rank)</option>
              </select>
            </div>

            {/* Checked-in Participants List Checklist */}
            <div className="space-y-2 border-t border-slate-850 pt-4">
              <div className="flex justify-between items-center text-slate-350">
                <span className="font-bold">Danh sách đã check-in ({registrations.filter(r => r.status === "CHECKED_IN").length})</span>
                <span className="text-orange-500 font-mono text-[10px] bg-orange-500/10 px-2 py-0.5 rounded-full">
                  Đang chọn: {selectedRegIdsForGeneration.length} VĐV
                </span>
              </div>

              <div className="flex gap-2 mb-2">
                <button
                  type="button"
                  onClick={() => {
                    const checkedInIds = registrations.filter(r => r.status === "CHECKED_IN").map(r => r.id);
                    setSelectedRegIdsForGeneration(checkedInIds);
                  }}
                  className="bg-slate-950 border border-slate-850 hover:bg-slate-850 hover:text-white text-slate-400 px-2 py-1 rounded text-[10px] font-bold"
                >
                  Chọn tất cả
                </button>
                <button
                  type="button"
                  onClick={() => setSelectedRegIdsForGeneration([])}
                  className="bg-slate-950 border border-slate-850 hover:bg-slate-850 hover:text-white text-slate-400 px-2 py-1 rounded text-[10px] font-bold"
                >
                  Bỏ chọn tất cả
                </button>
              </div>

              <div className="bg-slate-950 border border-slate-850 rounded-xl p-3 max-h-48 overflow-y-auto space-y-1.5">
                {registrations.filter(r => r.status === "CHECKED_IN").length === 0 ? (
                  <div className="text-center text-slate-500 py-6 font-medium text-slate-600">Chưa có vận động viên nào check-in.</div>
                ) : (
                  registrations
                    .filter(r => r.status === "CHECKED_IN")
                    .map((reg) => {
                      const isSelected = selectedRegIdsForGeneration.includes(reg.id);
                      return (
                        <div
                          key={reg.id}
                          onClick={() => {
                            if (isSelected) {
                              setSelectedRegIdsForGeneration(selectedRegIdsForGeneration.filter(id => id !== reg.id));
                            } else {
                              setSelectedRegIdsForGeneration([...selectedRegIdsForGeneration, reg.id]);
                            }
                          }}
                          className={`flex items-center gap-3 p-2 rounded-lg cursor-pointer transition-all ${
                            isSelected ? "bg-orange-500/10 text-orange-400" : "hover:bg-slate-900 text-slate-400"
                          }`}
                        >
                          {isSelected ? (
                            <CheckSquare size={16} className="text-orange-500 shrink-0" />
                          ) : (
                            <Square size={16} className="text-slate-650 shrink-0" />
                          )}
                          <div className="flex-1 min-w-0">
                            <p className="font-bold truncate text-[11px] text-slate-200">
                              {reg.user?.fullName || "VĐV Vô danh"}
                            </p>
                            <p className="text-[9px] text-slate-500 font-bold uppercase tracking-wider">
                              ID: {reg.id.substring(0, 8)} • Xe: {reg.vehicle?.name || reg.customer_vehicle?.name || "Tự túc"}
                            </p>
                          </div>
                        </div>
                      );
                    })
                )}
              </div>
            </div>

            <div className="flex justify-end gap-3 pt-4 border-t border-slate-850">
              <Button
                type="button"
                variant="ghost"
                onClick={() => setShowGenerateDialog(false)}
                className="text-slate-400 text-xs font-bold"
              >
                Hủy bỏ
              </Button>
              <Button
                type="button"
                onClick={() => generateMatchesMutation.mutate()}
                disabled={generateMatchesMutation.isPending || selectedRegIdsForGeneration.length === 0}
                className="bg-orange-600 hover:bg-orange-700 text-white text-xs font-extrabold flex items-center gap-1.5"
              >
                {generateMatchesMutation.isPending && <span className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />}
                Xếp lịch ngay
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Class Creator Dialog */}
      <Dialog open={showClassDialog} onOpenChange={setShowClassDialog}>
        <DialogContent className="bg-slate-900 border border-slate-800 text-slate-200 max-w-md">
          <DialogHeader>
            <DialogTitle className="text-white font-extrabold flex items-center gap-1.5">
              <Plus className="text-orange-500" /> Tạo phân hạng đua (Contest Class)
            </DialogTitle>
            <DialogDescription className="text-slate-400 text-xs">
              Tạo phân hạng mới để chia nhỏ các tay đua theo loại xe hoặc cấp độ kỹ năng.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-1.5">
              <label className="text-xs font-bold uppercase tracking-wider text-slate-400">Mã phân hạng (Class Code) *</label>
              <Input
                placeholder="e.g. DRIFT_A"
                value={classCode}
                onChange={(e) => setClassCode(e.target.value)}
                className="bg-slate-950 border-slate-850 text-slate-200 font-mono uppercase"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold uppercase tracking-wider text-slate-400">Tên phân hạng (Class Name) *</label>
              <Input
                placeholder="e.g. Drift Pro Hạng A"
                value={classNameField}
                onChange={(e) => setClassNameField(e.target.value)}
                className="bg-slate-950 border-slate-850 text-slate-200"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold uppercase tracking-wider text-slate-400">Sức chứa phân hạng (Capacity) *</label>
              <Input
                type="number"
                min={2}
                value={classCap}
                onChange={(e) => setClassCap(Number(e.target.value))}
                className="bg-slate-950 border-slate-850 text-slate-200"
              />
            </div>

            <div className="flex justify-end gap-3 pt-2">
              <Button type="button" variant="ghost" onClick={() => setShowClassDialog(false)} className="text-slate-400">
                Hủy
              </Button>
              <Button
                type="button"
                onClick={() =>
                  createClassMutation.mutate({
                    code: classCode,
                    name: classNameField,
                    capacity: classCap,
                    display_order: 1,
                  })
                }
                disabled={!classCode || !classNameField || createClassMutation.isPending}
                className="bg-orange-600 hover:bg-orange-700 font-bold"
              >
                {createClassMutation.isPending ? "Đang tạo..." : "Xác nhận tạo"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Reward Creator Dialog */}
      <Dialog open={showRewardDialog} onOpenChange={setShowRewardDialog}>
        <DialogContent className="bg-slate-900 border border-slate-800 text-slate-200 max-w-md">
          <DialogHeader>
            <DialogTitle className="text-white font-extrabold flex items-center gap-1.5">
              <Plus className="text-orange-500" /> Thêm phần thưởng giải đấu
            </DialogTitle>
            <DialogDescription className="text-slate-400 text-xs">
              Thiết lập phần thưởng tương ứng với thứ hạng đạt được.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-1.5">
              <label className="text-xs font-bold uppercase tracking-wider text-slate-400">Tiêu đề phần thưởng *</label>
              <Input
                placeholder="e.g. Cúp Vô Địch + 500k Voucher"
                value={rewardTitle}
                onChange={(e) => setRewardTitle(e.target.value)}
                className="bg-slate-950 border-slate-850 text-slate-200"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold uppercase tracking-wider text-slate-400">Mô tả quà tặng</label>
              <Input
                placeholder="Mô tả cụ thể vật phẩm hoặc cách thức nhận quà..."
                value={rewardDesc}
                onChange={(e) => setRewardDesc(e.target.value)}
                className="bg-slate-950 border-slate-850 text-slate-200"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-xs font-bold uppercase tracking-wider text-slate-400">Loại quà tặng</label>
                <select
                  value={rewardType}
                  onChange={(e) => setRewardType(e.target.value as typeof rewardType)}
                  className="bg-slate-950 border border-slate-855 rounded-lg py-2 px-3 text-sm text-slate-200 focus:outline-none w-full h-[40px]"
                >
                  <option value="TROPHY">Cúp & Huy chương</option>
                  <option value="VOUCHER">Voucher Giảm giá</option>
                  <option value="MERCHANDISE">Quà lưu niệm / Xe RC</option>
                  <option value="POINTS">Điểm tích lũy</option>
                </select>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold uppercase tracking-wider text-slate-400">Dành cho Hạng mấy *</label>
                <Input
                  type="number"
                  min={1}
                  value={rewardPosition}
                  onChange={(e) => setRewardPosition(Number(e.target.value))}
                  className="bg-slate-950 border-slate-850 text-slate-200"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-xs font-bold uppercase tracking-wider text-slate-400">Số lượng quà phát *</label>
                <Input
                  type="number"
                  min={1}
                  value={rewardQty}
                  onChange={(e) => setRewardQty(Number(e.target.value))}
                  className="bg-slate-950 border-slate-850 text-slate-200"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold uppercase tracking-wider text-slate-400">Mã Voucher (nếu có)</label>
                <Input
                  placeholder="e.g. CHAMPION2026"
                  value={rewardCode}
                  onChange={(e) => setRewardCode(e.target.value)}
                  className="bg-slate-950 border-slate-850 text-slate-200 font-mono uppercase"
                />
              </div>
            </div>

            <div className="flex justify-end gap-3 pt-2">
              <Button type="button" variant="ghost" onClick={() => setShowRewardDialog(false)} className="text-slate-400">
                Hủy
              </Button>
              <Button
                type="button"
                onClick={() =>
                  createRewardMutation.mutate({
                    contest_class_id: primaryClass?.id,
                    title: rewardTitle,
                    description: rewardDesc,
                    reward_type: rewardType,
                    position: rewardPosition,
                    quantity: rewardQty,
                    metadata: rewardCode ? { voucher_code: rewardCode } : undefined,
                  })
                }
                disabled={!rewardTitle || createRewardMutation.isPending}
                className="bg-orange-600 hover:bg-orange-700 font-bold"
              >
                {createRewardMutation.isPending ? "Đang lưu..." : "Xác nhận lưu"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
export default ProviderContestDetailPage;
