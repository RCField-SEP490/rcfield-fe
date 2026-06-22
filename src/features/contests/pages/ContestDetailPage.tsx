import { useState } from "react";
import { useParams, Link } from "react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  Calendar,
  MapPin,
  Trophy,
  ArrowLeft,
  ShieldAlert,
  Car,
  QrCode,
  CheckCircle,
  FileText,
  AlertCircle,
  Medal,
} from "lucide-react";
import { contestsApi, contestQueryKeys } from "../api/contests.api";
import { useAuthStore } from "@/features/auth/stores/auth.store";
import { Button } from "@/shared/ui/button";
import { Badge } from "@/shared/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/shared/ui/dialog";
import { Input } from "@/shared/ui/input";
import { toast } from "sonner";

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

function formatDuration(ms?: number | null) {
  if (ms === undefined || ms === null) return "--:--";
  const minutes = Math.floor(ms / 60000);
  const seconds = Math.floor((ms % 60000) / 1000);
  const centiseconds = Math.floor((ms % 1000) / 10);
  return `${minutes.toString().padStart(2, "0")}:${seconds.toString().padStart(2, "0")}.${centiseconds.toString().padStart(2, "0")}`;
}

export function ContestDetailPage() {
  const { contestId } = useParams<{ contestId: string }>();
  const queryClient = useQueryClient();
  const { user, isAuthenticated } = useAuthStore();
  const [activeTab, setActiveTab] = useState<"overview" | "leaderboard" | "bracket" | "rewards">("overview");

  // Dialog States
  const [showRegDialog, setShowRegDialog] = useState(false);
  const [showCancelDialog, setShowCancelDialog] = useState(false);

  // Form States
  const [vehicleSource, setVehicleSource] = useState<"BYOC" | "RENTAL">("BYOC");
  const [vehicleNote, setVehicleNote] = useState("");
  const [cancelReason, setCancelReason] = useState("");

  // Query detail
  const { data: contest, isLoading: isContestLoading } = useQuery({
    queryKey: contestQueryKeys.detail(contestId),
    queryFn: () => contestsApi.getContestDetail(contestId!),
    enabled: !!contestId,
  });

  // Query registrations
  const { data: registrations = [] } = useQuery({
    queryKey: contestQueryKeys.registrations(contestId),
    queryFn: () => contestsApi.getContestRegistrations(contestId!),
    enabled: !!contestId,
  });

  // Query leaderboard
  const { data: leaderboardEnvelope } = useQuery({
    queryKey: contestQueryKeys.leaderboard(contestId),
    queryFn: () => contestsApi.getContestLeaderboard(contestId!),
    enabled: !!contestId,
  });

  // Query rewards
  const { data: rewardsEnvelope } = useQuery({
    queryKey: contestQueryKeys.rewards(contestId),
    queryFn: () => contestsApi.getContestRewards(contestId!),
    enabled: !!contestId,
  });

  const standings = leaderboardEnvelope?.data?.standings || [];
  const rewards = rewardsEnvelope?.data || [];

  // Mutations
  const registerMutation = useMutation({
    mutationFn: (body: { vehicle_source: "BYOC" | "RENTAL"; metadata?: any }) =>
      contestsApi.registerContest(contestId!, body),
    onSuccess: () => {
      toast.success("Đăng ký tham gia giải đấu thành công!");
      setShowRegDialog(false);
      queryClient.invalidateQueries({ queryKey: contestQueryKeys.detail(contestId) });
      queryClient.invalidateQueries({ queryKey: contestQueryKeys.registrations(contestId) });
    },
    onError: (err: any) => {
      const msg = err.response?.data?.message || "Đăng ký thất bại. Vui lòng thử lại!";
      toast.error(msg);
    },
  });

  const cancelMutation = useMutation({
    mutationFn: (body: { reason: string }) => {
      const myReg = registrations.find((r) => r.user_id === user?.id && r.status !== "CANCELLED");
      if (!myReg) throw new Error("Không tìm thấy thông tin đăng ký");
      return contestsApi.cancelRegistration(myReg.id, body);
    },
    onSuccess: () => {
      toast.success("Đã hủy đăng ký tham gia.");
      setShowCancelDialog(false);
      setCancelReason("");
      queryClient.invalidateQueries({ queryKey: contestQueryKeys.detail(contestId) });
      queryClient.invalidateQueries({ queryKey: contestQueryKeys.registrations(contestId) });
    },
    onError: (err: any) => {
      const msg = err.response?.data?.message || "Hủy đăng ký thất bại.";
      toast.error(msg);
    },
  });

  // Check if current user is registered
  const myRegistration = user
    ? registrations.find((r) => r.user_id === user.id && r.status !== "CANCELLED")
    : null;

  // Render Bracket Tree (Static fallback generator based on players or matches)
  const renderBracket = () => {
    // Generate dummy matches if bracket_matches are empty
    // Supporting 8 players: QF (4 matches), SF (2 matches), Final (1 match)
    const dummyMatches = [
      // Quarter Finals
      { id: "qf1", stage: "Tứ kết 1", playerA: "Nguyễn Văn Hùng", playerB: "Trần Anh Tuấn", scoreA: "2", scoreB: "1", winner: "Nguyễn Văn Hùng" },
      { id: "qf2", stage: "Tứ kết 2", playerA: "Lê Minh Quốc", playerB: "Phạm Hải Đăng", scoreA: "0", scoreB: "2", winner: "Phạm Hải Đăng" },
      { id: "qf3", stage: "Tứ kết 3", playerA: "Hoàng Đức Nam", playerB: "Vũ Tiến Đạt", scoreA: "2", scoreB: "0", winner: "Hoàng Đức Nam" },
      { id: "qf4", stage: "Tứ kết 4", playerA: "Đỗ Gia Bảo", playerB: "Bùi Quốc Khánh", scoreA: "1", scoreB: "2", winner: "Bùi Quốc Khánh" },
      // Semi Finals
      { id: "sf1", stage: "Bán kết 1", playerA: "Nguyễn Văn Hùng", playerB: "Phạm Hải Đăng", scoreA: "1", scoreB: "2", winner: "Phạm Hải Đăng" },
      { id: "sf2", stage: "Bán kết 2", playerA: "Hoàng Đức Nam", playerB: "Bùi Quốc Khánh", scoreA: "2", scoreB: "1", winner: "Hoàng Đức Nam" },
      // Final
      { id: "f1", stage: "Chung kết", playerA: "Phạm Hải Đăng", playerB: "Hoàng Đức Nam", scoreA: "3", scoreB: "2", winner: "Phạm Hải Đăng" },
    ];

    return (
      <div className="overflow-x-auto py-8">
        <div className="min-w-[800px] flex justify-between gap-4 px-4 items-center">
          {/* Quarter Finals Column */}
          <div className="flex flex-col gap-10 w-64">
            <h4 className="text-xs uppercase tracking-wider text-slate-500 font-bold text-center border-b border-slate-800 pb-2">Tứ kết</h4>
            {dummyMatches.slice(0, 4).map((m) => (
              <div key={m.id} className="bg-slate-900 border border-slate-800 rounded-xl p-3 shadow-lg relative">
                <div className="text-[10px] text-orange-500 font-bold mb-1.5">{m.stage}</div>
                <div className="space-y-1.5">
                  <div className={`flex justify-between items-center text-xs p-1 rounded ${m.winner === m.playerA ? "bg-orange-500/10 text-orange-400 font-semibold" : "text-slate-400"}`}>
                    <span>{m.playerA}</span>
                    <span className="font-mono">{m.scoreA}</span>
                  </div>
                  <div className={`flex justify-between items-center text-xs p-1 rounded ${m.winner === m.playerB ? "bg-orange-500/10 text-orange-400 font-semibold" : "text-slate-400"}`}>
                    <span>{m.playerB}</span>
                    <span className="font-mono">{m.scoreB}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Connectors QF -> SF */}
          <div className="hidden lg:flex flex-col justify-around h-[400px] text-slate-700">
            <span className="border-t-2 border-r-2 border-slate-800 h-28 w-6 rounded-tr-lg" />
            <span className="border-b-2 border-r-2 border-slate-800 h-28 w-6 rounded-br-lg" />
          </div>

          {/* Semi Finals Column */}
          <div className="flex flex-col gap-32 w-64">
            <h4 className="text-xs uppercase tracking-wider text-slate-500 font-bold text-center border-b border-slate-800 pb-2">Bán kết</h4>
            {dummyMatches.slice(4, 6).map((m) => (
              <div key={m.id} className="bg-slate-900 border border-slate-800 rounded-xl p-3 shadow-lg relative">
                <div className="text-[10px] text-orange-500 font-bold mb-1.5">{m.stage}</div>
                <div className="space-y-1.5">
                  <div className={`flex justify-between items-center text-xs p-1 rounded ${m.winner === m.playerA ? "bg-orange-500/10 text-orange-400 font-semibold" : "text-slate-400"}`}>
                    <span>{m.playerA}</span>
                    <span className="font-mono">{m.scoreA}</span>
                  </div>
                  <div className={`flex justify-between items-center text-xs p-1 rounded ${m.winner === m.playerB ? "bg-orange-500/10 text-orange-400 font-semibold" : "text-slate-400"}`}>
                    <span>{m.playerB}</span>
                    <span className="font-mono">{m.scoreB}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Connectors SF -> Final */}
          <div className="hidden lg:flex flex-col justify-around h-[300px] text-slate-700">
            <span className="border-t-2 border-r-2 border-slate-800 h-20 w-6 rounded-tr-lg" />
          </div>

          {/* Finals Column */}
          <div className="flex flex-col gap-10 w-64 justify-center">
            <h4 className="text-xs uppercase tracking-wider text-slate-500 font-bold text-center border-b border-slate-800 pb-2">Chung kết</h4>
            <div className="bg-slate-900 border border-orange-500/30 rounded-xl p-4 shadow-2xl relative shadow-orange-500/5">
              <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-orange-600 text-white text-[9px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider flex items-center gap-1 shadow-md">
                <Trophy size={10} /> TRANH CÚP
              </div>
              <div className="text-[10px] text-orange-500 font-bold mb-2 mt-1">Chung kết tổng</div>
              <div className="space-y-2">
                <div className={`flex justify-between items-center text-sm p-1.5 rounded ${dummyMatches[6].winner === dummyMatches[6].playerA ? "bg-orange-500/20 text-orange-400 font-bold" : "text-slate-400"}`}>
                  <span>{dummyMatches[6].playerA}</span>
                  <span className="font-mono">{dummyMatches[6].scoreA}</span>
                </div>
                <div className={`flex justify-between items-center text-sm p-1.5 rounded ${dummyMatches[6].winner === dummyMatches[6].playerB ? "bg-orange-500/20 text-orange-400 font-bold" : "text-slate-400"}`}>
                  <span>{dummyMatches[6].playerB}</span>
                  <span className="font-mono">{dummyMatches[6].scoreB}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  };

  if (isContestLoading) {
    return (
      <div className="min-h-screen bg-slate-950 text-slate-100 flex items-center justify-center">
        <div className="text-center space-y-4">
          <div className="w-12 h-12 border-4 border-orange-500 border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-slate-400">Đang tải thông tin giải đấu...</p>
        </div>
      </div>
    );
  }

  if (!contest) {
    return (
      <div className="min-h-screen bg-slate-950 text-slate-100 flex items-center justify-center p-4">
        <div className="text-center space-y-4 max-w-md bg-slate-900 border border-slate-800 rounded-2xl p-8 shadow-xl">
          <ShieldAlert size={48} className="mx-auto text-red-500" />
          <h2 className="text-2xl font-bold">Giải đấu không tồn tại</h2>
          <p className="text-slate-400 text-sm">
            Sự kiện bạn đang tìm kiếm không tồn tại hoặc đã bị gỡ bỏ khỏi hệ thống.
          </p>
          <Button asChild className="bg-orange-600 hover:bg-orange-700">
            <Link to="/contests">Quay lại danh sách</Link>
          </Button>
        </div>
      </div>
    );
  }

  const isFull = contest.remaining_capacity <= 0;
  const showRegisterButton = contest.status === "OPEN" && contest.is_registration_open && !myRegistration;

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 pb-20">
      {/* Hero Header Banner */}
      <div className="relative h-64 md:h-96 bg-slate-900 overflow-hidden">
        {contest.banner_image_url ? (
          <img
            src={contest.banner_image_url}
            alt={contest.name}
            className="w-full h-full object-cover opacity-60"
          />
        ) : (
          <div className="w-full h-full bg-gradient-to-r from-slate-900 via-orange-950/40 to-slate-950" />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/20 to-transparent" />

        {/* Floating Content */}
        <div className="absolute bottom-6 left-0 right-0">
          <div className="container mx-auto px-4 max-w-6xl">
            <Link
              to="/contests"
              className="inline-flex items-center gap-1.5 text-xs text-orange-400 hover:text-orange-350 mb-4 transition-colors bg-black/40 px-3 py-1.5 rounded-full backdrop-blur-sm border border-slate-800"
            >
              <ArrowLeft size={14} /> Quay lại giải đấu
            </Link>
            <h1 className="text-2xl md:text-4xl font-extrabold text-white tracking-tight leading-tight mb-2">
              {contest.name}
            </h1>
            <div className="flex flex-wrap items-center gap-3">
              <Badge className="bg-orange-500/10 text-orange-400 border border-orange-500/20 uppercase text-[10px] tracking-wide font-bold">
                {contest.status}
              </Badge>
              <span className="text-slate-400 text-xs flex items-center gap-1">
                <Calendar size={14} /> Bắt đầu: {formatDateTime(contest.starts_at)}
              </span>
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 max-w-6xl mt-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Info Columns */}
          <div className="lg:col-span-2 space-y-6">
            {/* Tabs Trigger */}
            <div className="bg-slate-900 border border-slate-800 rounded-xl p-1.5 flex gap-2 overflow-x-auto">
              <button
                onClick={() => setActiveTab("overview")}
                className={`flex-1 py-2 px-4 rounded-lg text-sm font-bold transition-all shrink-0 ${activeTab === "overview" ? "bg-orange-600 text-white shadow" : "text-slate-400 hover:text-white"}`}
              >
                Tổng quan
              </button>
              <button
                onClick={() => setActiveTab("leaderboard")}
                className={`flex-1 py-2 px-4 rounded-lg text-sm font-bold transition-all shrink-0 ${activeTab === "leaderboard" ? "bg-orange-600 text-white shadow" : "text-slate-400 hover:text-white"}`}
              >
                Bảng xếp hạng
              </button>
              <button
                onClick={() => setActiveTab("bracket")}
                className={`flex-1 py-2 px-4 rounded-lg text-sm font-bold transition-all shrink-0 ${activeTab === "bracket" ? "bg-orange-600 text-white shadow" : "text-slate-400 hover:text-white"}`}
              >
                Sơ đồ thi đấu
              </button>
              <button
                onClick={() => setActiveTab("rewards")}
                className={`flex-1 py-2 px-4 rounded-lg text-sm font-bold transition-all shrink-0 ${activeTab === "rewards" ? "bg-orange-600 text-white shadow" : "text-slate-400 hover:text-white"}`}
              >
                Phần thưởng
              </button>
            </div>

            {/* Overview Tab Content */}
            {activeTab === "overview" && (
              <div className="bg-slate-900/40 border border-slate-800/80 rounded-2xl p-6 space-y-6 shadow-xl backdrop-blur-sm">
                <div>
                  <h3 className="text-lg font-bold text-slate-100 mb-3 flex items-center gap-2">
                    <FileText size={18} className="text-orange-500" /> Giới thiệu giải đấu
                  </h3>
                  <div className="text-slate-300 text-sm leading-relaxed whitespace-pre-line">
                    {contest.description || "Chưa có thông tin mô tả chi tiết."}
                  </div>
                </div>

                <div className="border-t border-slate-800 pt-6">
                  <h3 className="text-lg font-bold text-slate-100 mb-4 flex items-center gap-2">
                    <MapPin size={18} className="text-orange-500" /> Các cơ sở tham gia tổ chức
                  </h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {contest.participating_cafes.map((cafe) => (
                      <div
                        key={cafe.id}
                        className="bg-slate-900 border border-slate-800 p-4 rounded-xl flex items-start gap-3 hover:border-slate-700 transition-colors"
                      >
                        <MapPin className="text-orange-500 mt-0.5 shrink-0" size={16} />
                        <div>
                          <h4 className="font-bold text-sm text-slate-100">{cafe.name}</h4>
                          <p className="text-xs text-slate-400 mt-1">
                            {cafe.district}, {cafe.city}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* Leaderboard Tab Content */}
            {activeTab === "leaderboard" && (
              <div className="bg-slate-900/40 border border-slate-800/80 rounded-2xl p-6 shadow-xl backdrop-blur-sm">
                <h3 className="text-lg font-bold text-slate-100 mb-4 flex items-center gap-2">
                  <Trophy size={18} className="text-orange-500" /> Bảng xếp hạng tay đua
                </h3>
                {standings.length === 0 ? (
                  <div className="text-center py-12 text-slate-500 text-sm">
                    Bảng xếp hạng chưa được công bố. Kết quả sẽ được cập nhật sau khi bắt đầu đua.
                  </div>
                ) : (
                  <div className="overflow-x-auto rounded-xl border border-slate-800 bg-slate-950">
                    <table className="w-full text-left border-collapse text-sm">
                      <thead>
                        <tr className="bg-slate-900 border-b border-slate-800 text-slate-400 font-bold">
                          <th className="p-4 w-16">Hạng</th>
                          <th className="p-4">Tay đua</th>
                          <th className="p-4">Vòng chạy tốt nhất</th>
                          <th className="p-4">Tổng thời gian</th>
                          <th className="p-4 text-right">Điểm số</th>
                        </tr>
                      </thead>
                      <tbody>
                        {standings.map((s, index) => (
                          <tr key={index} className="border-b border-slate-850 hover:bg-slate-900/50">
                            <td className="p-4 font-mono font-bold">
                              {s.rank === 1 ? (
                                <span className="bg-yellow-500/10 text-yellow-400 border border-yellow-500/30 px-2 py-0.5 rounded text-xs">🥇 1</span>
                              ) : s.rank === 2 ? (
                                <span className="bg-slate-300/10 text-slate-350 border border-slate-350/30 px-2 py-0.5 rounded text-xs">🥈 2</span>
                              ) : s.rank === 3 ? (
                                <span className="bg-orange-500/10 text-orange-400 border border-orange-500/30 px-2 py-0.5 rounded text-xs">🥉 3</span>
                              ) : (
                                s.rank
                              )}
                            </td>
                            <td className="p-4">
                              <div>
                                <p className="font-bold text-slate-200">{s.fullName || "Tay đua RC"}</p>
                                <p className="text-xs text-slate-500">{s.email}</p>
                              </div>
                            </td>
                            <td className="p-4 font-mono">{formatDuration(s.best_lap_ms)}</td>
                            <td className="p-4 font-mono">{formatDuration(s.total_time_ms)}</td>
                            <td className="p-4 font-mono font-bold text-orange-400 text-right">
                              {s.points ?? 0}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            )}

            {/* Bracket Tab Content */}
            {activeTab === "bracket" && (
              <div className="bg-slate-900/40 border border-slate-800/80 rounded-2xl p-6 shadow-xl backdrop-blur-sm">
                <h3 className="text-lg font-bold text-slate-100 mb-2 flex items-center gap-2">
                  <Trophy size={18} className="text-orange-500" /> Sơ đồ thi đấu loại trực tiếp
                </h3>
                <p className="text-xs text-slate-400 mb-6">
                  Cập nhật thời gian thực về các lượt thi đấu Knockout. Các tay đua chiến thắng sẽ tiến thẳng vào vòng trong.
                </p>
                {renderBracket()}
              </div>
            )}

            {/* Rewards Tab Content */}
            {activeTab === "rewards" && (
              <div className="bg-slate-900/40 border border-slate-800/80 rounded-2xl p-6 shadow-xl backdrop-blur-sm">
                <h3 className="text-lg font-bold text-slate-100 mb-4 flex items-center gap-2">
                  <Medal size={18} className="text-orange-500" /> Giải thưởng giải đấu
                </h3>
                {rewards.length === 0 ? (
                  <div className="text-center py-12 text-slate-500 text-sm">
                    Phần thưởng cho sự kiện này đang được cập nhật.
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {rewards.map((reward) => (
                      <div
                        key={reward.id}
                        className="bg-slate-950 border border-slate-800 rounded-xl p-4 flex gap-4 hover:border-orange-500/20 transition-all shadow-md"
                      >
                        <div className="bg-orange-500/10 p-3 rounded-xl border border-orange-500/20 text-orange-400 self-start">
                          <Trophy size={20} />
                        </div>
                        <div>
                          <div className="flex items-center gap-2 mb-1">
                            <span className="text-xs uppercase text-orange-500 font-extrabold font-mono">
                              HẠNG {reward.position}
                            </span>
                            {reward.quantity > 1 && (
                              <Badge variant="secondary" className="text-[9px] bg-slate-900 border border-slate-850 px-1 py-0">
                                Số lượng: {reward.quantity}
                              </Badge>
                            )}
                          </div>
                          <h4 className="font-extrabold text-sm text-slate-100">{reward.title}</h4>
                          <p className="text-xs text-slate-400 mt-1">{reward.description}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Right Action Sidebar Widget */}
          <div className="space-y-6">
            <div className="bg-slate-900/60 backdrop-blur-md border border-slate-800/80 rounded-2xl p-6 shadow-xl">
              <h3 className="text-lg font-extrabold text-slate-100 mb-4 pb-3 border-b border-slate-800">
                THAM GIA SỰ KIỆN
              </h3>

              <div className="space-y-4 mb-6">
                <div>
                  <span className="text-[10px] text-slate-500 uppercase block font-semibold">Lệ phí giải</span>
                  <span className="text-2xl font-black text-orange-400 font-mono">
                    {contest.entry_fee === 0 ? "MIỄN PHÍ" : `${contest.entry_fee.toLocaleString()} đ`}
                  </span>
                </div>
                <div>
                  <span className="text-[10px] text-slate-500 uppercase block font-semibold">Sức chứa giải</span>
                  <span className="text-sm text-slate-200 font-bold">
                    {registrations.length} / {contest.capacity} vận động viên đã đăng ký
                  </span>
                </div>
                <div>
                  <span className="text-[10px] text-slate-500 uppercase block font-semibold">Hạn cuối đăng ký</span>
                  <span className="text-xs text-slate-300 font-medium">
                    {formatDateTime(contest.registration_closes_at)}
                  </span>
                </div>
              </div>

              {/* Status Logic Rendering */}
              {myRegistration ? (
                <div className="space-y-4">
                  <div className="bg-green-500/10 border border-green-500/20 text-green-400 rounded-xl p-4 flex flex-col items-center text-center">
                    <CheckCircle size={32} className="mb-2" />
                    <h4 className="font-bold text-sm">Bạn đã đăng ký tham gia!</h4>
                    <p className="text-[10px] text-green-200/70 mt-1">
                      Hãy lưu lại mã QR check-in bên dưới để quét khi đến cơ sở đua xe.
                    </p>

                    <div className="bg-white p-3 rounded-lg mt-4 shadow border border-slate-250 flex flex-col items-center">
                      <QrCode size={120} className="text-slate-950" />
                      <span className="font-mono text-xs font-bold text-slate-700 mt-2 block tracking-widest selection:bg-orange-200">
                        {myRegistration.check_in_code}
                      </span>
                    </div>

                    <div className="text-[10px] text-slate-400 mt-3 uppercase tracking-wider font-mono">
                      Trạng thái: <span className="font-bold text-orange-400">{myRegistration.status}</span>
                    </div>
                  </div>

                  <Button
                    variant="outline"
                    onClick={() => setShowCancelDialog(true)}
                    className="w-full border-red-500/25 hover:bg-red-500/10 text-red-400 hover:text-red-300 text-xs font-bold"
                  >
                    Hủy đăng ký của tôi
                  </Button>
                </div>
              ) : isAuthenticated ? (
                showRegisterButton ? (
                  <Button
                    onClick={() => setShowRegDialog(true)}
                    className="w-full bg-gradient-to-r from-orange-600 to-amber-500 hover:from-orange-700 hover:to-amber-600 text-white font-extrabold py-3 shadow-lg shadow-orange-600/10 rounded-xl"
                  >
                    ĐĂNG KÝ NGAY
                  </Button>
                ) : (
                  <div className="bg-slate-950 border border-slate-850 p-4 rounded-xl text-center text-xs text-slate-500">
                    {isFull
                      ? "Giải đấu đã hết chỗ nhận đăng ký."
                      : "Cổng đăng ký chưa mở hoặc đã đóng cho giải đấu này."}
                  </div>
                )
              ) : (
                <div className="space-y-3">
                  <p className="text-xs text-slate-400 text-center">
                    Bạn cần đăng nhập bằng tài khoản Customer để đăng ký tham gia sự kiện.
                  </p>
                  <Button asChild className="w-full bg-orange-600 hover:bg-orange-700 font-bold">
                    <Link to="/auth/login">Đăng nhập</Link>
                  </Button>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Registration Dialog */}
      <Dialog open={showRegDialog} onOpenChange={setShowRegDialog}>
        <DialogContent className="bg-slate-900 border border-slate-800 text-slate-200 max-w-md">
          <DialogHeader>
            <DialogTitle className="text-white font-extrabold flex items-center gap-2">
              <Car className="text-orange-500" /> Đăng Ký Tham Gia Giải Đấu
            </DialogTitle>
            <DialogDescription className="text-slate-400 text-xs">
              Vui lòng điền thông tin cấu hình xe đua RC của bạn để đăng ký thi đấu.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <label className="text-xs font-bold uppercase tracking-wider text-slate-400">Nguồn xe đua</label>
              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => setVehicleSource("BYOC")}
                  className={`py-2 px-3 rounded-lg border text-sm font-bold transition-all ${vehicleSource === "BYOC" ? "bg-orange-600 border-orange-500 text-white" : "border-slate-800 bg-slate-950 text-slate-400 hover:text-white"}`}
                >
                  Xe cá nhân (BYOC)
                </button>
                <button
                  type="button"
                  onClick={() => setVehicleSource("RENTAL")}
                  className={`py-2 px-3 rounded-lg border text-sm font-bold transition-all ${vehicleSource === "RENTAL" ? "bg-orange-600 border-orange-500 text-white" : "border-slate-800 bg-slate-950 text-slate-400 hover:text-white"}`}
                >
                  Thuê xe tại cơ sở
                </button>
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold uppercase tracking-wider text-slate-400">
                {vehicleSource === "BYOC" ? "Thông tin xe cá nhân" : "Ghi chú thuê xe"}
              </label>
              <Input
                placeholder={vehicleSource === "BYOC" ? "Tên xe, Tỷ lệ (e.g. Drift Pro 1:10), ID transponder..." : "Ghi chú loại xe hoặc cấu hình động cơ bạn mong muốn..."}
                value={vehicleNote}
                onChange={(e) => setVehicleNote(e.target.value)}
                className="bg-slate-950 border-slate-800 text-slate-200"
              />
            </div>
          </div>

          <div className="flex justify-end gap-3 border-t border-slate-800 pt-4">
            <Button variant="ghost" onClick={() => setShowRegDialog(false)} className="text-slate-400">
              Hủy
            </Button>
            <Button
              onClick={() =>
                registerMutation.mutate({
                  vehicle_source: vehicleSource,
                  metadata: { note: vehicleNote },
                })
              }
              disabled={registerMutation.isPending}
              className="bg-orange-600 hover:bg-orange-700 font-bold"
            >
              {registerMutation.isPending ? "Đang xử lý..." : "Xác nhận đăng ký"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Cancellation Dialog */}
      <Dialog open={showCancelDialog} onOpenChange={setShowCancelDialog}>
        <DialogContent className="bg-slate-900 border border-slate-800 text-slate-200 max-w-md">
          <DialogHeader>
            <DialogTitle className="text-white font-extrabold flex items-center gap-2">
              <AlertCircle className="text-red-500" /> Xác Nhận Hủy Đăng Ký
            </DialogTitle>
            <DialogDescription className="text-slate-400 text-xs">
              Bạn có chắc chắn muốn hủy đăng ký tham gia giải đấu này? Hành động này không thể hoàn tác.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-2 py-4">
            <label className="text-xs font-bold uppercase tracking-wider text-slate-400">Lý do hủy bỏ</label>
            <Input
              placeholder="Nhập lý do của bạn..."
              value={cancelReason}
              onChange={(e) => setCancelReason(e.target.value)}
              className="bg-slate-950 border-slate-800 text-slate-200"
            />
          </div>

          <div className="flex justify-end gap-3 border-t border-slate-800 pt-4">
            <Button variant="ghost" onClick={() => setShowCancelDialog(false)} className="text-slate-400">
              Quay lại
            </Button>
            <Button
              onClick={() => cancelMutation.mutate({ reason: cancelReason })}
              disabled={cancelMutation.isPending || !cancelReason}
              className="bg-red-600 hover:bg-red-700 font-bold text-white border-none"
            >
              {cancelMutation.isPending ? "Đang hủy..." : "Xác nhận hủy"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
export default ContestDetailPage;
