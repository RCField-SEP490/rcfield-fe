import { useMemo, useState } from "react";
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
import { ContestBracketPanel } from "../components/TournamentPrimitives";
import { getContestErrorMessage } from "../lib/errors";
import { recordContestUiEvent } from "../lib/monitoring";
import { enrichBracketMatches } from "../lib/tournament";
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

  // Query only the current user's registration. Full registration lists are provider-only.
  const { data: myRegistrations = [] } = useQuery({
    queryKey: contestQueryKeys.myRegistrations(contestId),
    queryFn: () => contestsApi.getMyContestRegistrations(contestId!),
    enabled: !!contestId && isAuthenticated,
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

  const { data: bracketData } = useQuery({
    queryKey: contestQueryKeys.bracket(contestId),
    queryFn: () => contestsApi.getContestBracket(contestId!),
    enabled: !!contestId,
  });

  const standings = leaderboardEnvelope?.data?.standings || [];
  const rewards = rewardsEnvelope?.data || [];
  const publicBracketMatches = useMemo(
    () => enrichBracketMatches(bracketData?.matches || [], bracketData?.registrations || []),
    [bracketData?.matches, bracketData?.registrations]
  );

  // Mutations
  const registerMutation = useMutation({
    mutationFn: (body: { vehicle_source: "BYOC"; metadata?: { note?: string } }) =>
      contestsApi.registerContest(contestId!, body),
    onSuccess: () => {
      recordContestUiEvent("customer.registration.create.success", { contestId });
      toast.success("Đăng ký tham gia giải đấu thành công!");
      setShowRegDialog(false);
      queryClient.invalidateQueries({ queryKey: contestQueryKeys.detail(contestId) });
      queryClient.invalidateQueries({ queryKey: contestQueryKeys.myRegistrations(contestId) });
    },
    onError: (err: unknown) => {
      const message = getContestErrorMessage(err, "Đăng ký thất bại. Vui lòng thử lại!");
      recordContestUiEvent("customer.registration.create.error", { contestId, metadata: { message } });
      toast.error(message);
    },
  });

  const cancelMutation = useMutation({
    mutationFn: (body: { reason: string }) => {
      const myReg = myRegistrations.find((r) => r.status !== "CANCELLED");
      if (!myReg) throw new Error("Không tìm thấy thông tin đăng ký");
      return contestsApi.cancelRegistration(myReg.id, body);
    },
    onSuccess: () => {
      recordContestUiEvent("customer.registration.cancel.success", { contestId });
      toast.success("Đã hủy đăng ký tham gia.");
      setShowCancelDialog(false);
      setCancelReason("");
      queryClient.invalidateQueries({ queryKey: contestQueryKeys.detail(contestId) });
      queryClient.invalidateQueries({ queryKey: contestQueryKeys.myRegistrations(contestId) });
    },
    onError: (err: unknown) => {
      const message = getContestErrorMessage(err, "Hủy đăng ký thất bại.");
      recordContestUiEvent("customer.registration.cancel.error", { contestId, metadata: { message } });
      toast.error(message);
    },
  });

  // Check if current user is registered
  const myRegistration = user
    ? myRegistrations.find((r) => r.status !== "CANCELLED")
    : null;

  if (isContestLoading) {
    return (
      <div className="min-h-screen bg-[#fcf8f8] text-[#1c1b1b] flex items-center justify-center">
        <div className="text-center space-y-4">
          <div className="w-12 h-12 border-4 border-orange-500 border-t-transparent rounded-full animate-spin mx-auto animate-spin" />
          <p className="text-[#6f6c6a]">Đang tải thông tin giải đấu...</p>
        </div>
      </div>
    );
  }

  if (!contest) {
    return (
      <div className="min-h-screen bg-[#fcf8f8] text-[#1c1b1b] flex items-center justify-center p-4">
        <div className="text-center space-y-4 max-w-md bg-white border border-[#e5e2e1] rounded-2xl p-8 shadow-sm">
          <ShieldAlert size={48} className="mx-auto text-red-500" />
          <h2 className="text-2xl font-bold">Giải đấu không tồn tại</h2>
          <p className="text-[#6f6c6a] text-sm">
            Sự kiện bạn đang tìm kiếm không tồn tại hoặc đã bị gỡ bỏ khỏi hệ thống.
          </p>
          <Button asChild className="bg-orange-600 hover:bg-orange-700 text-white font-bold">
            <Link to="/contests">Quay lại danh sách</Link>
          </Button>
        </div>
      </div>
    );
  }

  const isFull = contest.remaining_capacity <= 0;
  const showRegisterButton = contest.status === "OPEN" && contest.is_registration_open && !myRegistration;

  return (
    <div className="min-h-screen bg-[#fcf8f8] text-[#1c1b1b] pb-20">
      {/* Hero Header Banner */}
      <div className="relative h-64 md:h-96 bg-[#f6f3f2] overflow-hidden border-b border-[#e5e2e1]">
        {contest.banner_image_url ? (
          <img
            src={contest.banner_image_url}
            alt={contest.name}
            className="w-full h-full object-cover opacity-80"
          />
        ) : (
          <div className="w-full h-full bg-gradient-to-r from-[#f6f3f2] via-orange-50 to-[#fcf8f8]" />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-[#fcf8f8] via-[#fcf8f8]/10 to-transparent" />

        {/* Floating Content */}
        <div className="absolute bottom-6 left-0 right-0">
          <div className="container mx-auto px-4 max-w-6xl">
            <Link
              to="/contests"
              className="inline-flex items-center gap-1.5 text-xs text-orange-600 hover:text-orange-700 mb-4 transition-colors bg-white/80 px-3 py-1.5 rounded-full backdrop-blur-sm border border-[#e5e2e1]"
            >
              <ArrowLeft size={14} /> Quay lại giải đấu
            </Link>
            <h1 className="text-2xl md:text-4xl font-extrabold text-[#1c1b1b] tracking-tight leading-tight mb-2">
              {contest.name}
            </h1>
            <div className="flex flex-wrap items-center gap-3">
              <Badge className="bg-orange-50 text-orange-600 border border-orange-200 uppercase text-[10px] tracking-wide font-bold">
                {contest.status}
              </Badge>
              <span className="text-[#6f6c6a] text-xs flex items-center gap-1">
                <Calendar size={14} className="text-orange-600" /> Bắt đầu: {formatDateTime(contest.starts_at)}
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
            <div className="bg-[#f6f3f2] border border-[#e5e2e1] rounded-xl p-1.5 flex gap-2 overflow-x-auto shadow-sm">
              <button
                onClick={() => setActiveTab("overview")}
                className={`flex-1 py-2 px-4 rounded-lg text-sm font-bold transition-all shrink-0 ${activeTab === "overview" ? "bg-orange-600 text-white shadow" : "text-[#6f6c6a] hover:text-[#1c1b1b]"}`}
              >
                Tổng quan
              </button>
              <button
                onClick={() => setActiveTab("leaderboard")}
                className={`flex-1 py-2 px-4 rounded-lg text-sm font-bold transition-all shrink-0 ${activeTab === "leaderboard" ? "bg-orange-600 text-white shadow" : "text-[#6f6c6a] hover:text-[#1c1b1b]"}`}
              >
                Bảng xếp hạng
              </button>
              <button
                onClick={() => setActiveTab("bracket")}
                className={`flex-1 py-2 px-4 rounded-lg text-sm font-bold transition-all shrink-0 ${activeTab === "bracket" ? "bg-orange-600 text-white shadow" : "text-[#6f6c6a] hover:text-[#1c1b1b]"}`}
              >
                Sơ đồ thi đấu
              </button>
              <button
                onClick={() => setActiveTab("rewards")}
                className={`flex-1 py-2 px-4 rounded-lg text-sm font-bold transition-all shrink-0 ${activeTab === "rewards" ? "bg-orange-600 text-white shadow" : "text-[#6f6c6a] hover:text-[#1c1b1b]"}`}
              >
                Phần thưởng
              </button>
            </div>

            {/* Overview Tab Content */}
            {activeTab === "overview" && (
              <div className="bg-white border border-[#e5e2e1] rounded-2xl p-6 space-y-6 shadow-sm">
                <div>
                  <h3 className="text-lg font-bold text-[#1c1b1b] mb-3 flex items-center gap-2">
                    <FileText size={18} className="text-orange-600" /> Giới thiệu giải đấu
                  </h3>
                  <div className="text-[#6f6c6a] text-sm leading-relaxed whitespace-pre-line">
                    {contest.description || "Chưa có thông tin mô tả chi tiết."}
                  </div>
                </div>

                <div className="border-t border-[#e5e2e1] pt-6">
                  <h3 className="text-lg font-bold text-[#1c1b1b] mb-4 flex items-center gap-2">
                    <MapPin size={18} className="text-orange-600" /> Các cơ sở tham gia tổ chức
                  </h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {contest.participating_cafes.map((cafe) => (
                      <div
                        key={cafe.id}
                        className="bg-[#fcf8f8] border border-[#e5e2e1] p-4 rounded-xl flex items-start gap-3 hover:border-orange-500/35 transition-colors"
                      >
                        <MapPin className="text-orange-600 mt-0.5 shrink-0" size={16} />
                        <div>
                          <h4 className="font-bold text-sm text-[#1c1b1b]">{cafe.name}</h4>
                          <p className="text-xs text-[#6f6c6a] mt-1">
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
              <div className="bg-white border border-[#e5e2e1] rounded-2xl p-6 shadow-sm">
                <h3 className="text-lg font-bold text-[#1c1b1b] mb-4 flex items-center gap-2">
                  <Trophy size={18} className="text-orange-600" /> Bảng xếp hạng tay đua
                </h3>
                {standings.length === 0 ? (
                  <div className="text-center py-12 text-[#6f6c6a] text-sm">
                    Bảng xếp hạng chưa được công bố. Kết quả sẽ được cập nhật sau khi bắt đầu đua.
                  </div>
                ) : (
                  <div className="overflow-x-auto rounded-xl border border-[#e5e2e1] bg-[#fcf8f8]">
                    <table className="w-full text-left border-collapse text-sm">
                      <thead>
                        <tr className="bg-[#f6f3f2] border-b border-[#e5e2e1] text-[#6f6c6a] font-bold">
                          <th className="p-4 w-16">Hạng</th>
                          <th className="p-4">Tay đua</th>
                          <th className="p-4">Vòng chạy tốt nhất</th>
                          <th className="p-4">Tổng thời gian</th>
                          <th className="p-4 text-right">Điểm số</th>
                        </tr>
                      </thead>
                      <tbody>
                        {standings.map((s, index) => (
                          <tr key={index} className="border-b border-[#e5e2e1] hover:bg-white transition-colors">
                            <td className="p-4 font-mono font-bold">
                              {s.rank === 1 ? (
                                <span className="bg-yellow-500/10 text-yellow-700 border border-yellow-500/30 px-2 py-0.5 rounded text-xs">🥇 1</span>
                              ) : s.rank === 2 ? (
                                <span className="bg-slate-300/10 text-[#6f6c6a] border border-[#e5e2e1] px-2 py-0.5 rounded text-xs">🥈 2</span>
                              ) : s.rank === 3 ? (
                                <span className="bg-orange-500/10 text-orange-700 border border-orange-500/30 px-2 py-0.5 rounded text-xs">🥉 3</span>
                              ) : (
                                s.rank
                              )}
                            </td>
                            <td className="p-4">
                              <div>
                                <p className="font-bold text-[#1c1b1b]">{s.fullName || "Tay đua RC"}</p>
                                <p className="text-xs text-[#6f6c6a]">{s.email}</p>
                              </div>
                            </td>
                            <td className="p-4 font-mono text-[#1c1b1b]">{formatDuration(s.best_lap_ms)}</td>
                            <td className="p-4 font-mono text-[#1c1b1b]">{formatDuration(s.total_time_ms)}</td>
                            <td className="p-4 font-mono font-bold text-orange-600 text-right">
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
              <ContestBracketPanel
                rounds={bracketData?.rounds || []}
                matches={publicBracketMatches}
              />
            )}

            {/* Rewards Tab Content */}
            {activeTab === "rewards" && (
              <div className="bg-white border border-[#e5e2e1] rounded-2xl p-6 shadow-sm">
                <h3 className="text-lg font-bold text-[#1c1b1b] mb-4 flex items-center gap-2">
                  <Medal size={18} className="text-orange-600" /> Giải thưởng giải đấu
                </h3>
                {rewards.length === 0 ? (
                  <div className="text-center py-12 text-[#6f6c6a] text-sm">
                    Phần thưởng cho sự kiện này đang được cập nhật.
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {rewards.map((reward) => (
                      <div
                        key={reward.id}
                        className="bg-[#fcf8f8] border border-[#e5e2e1] rounded-xl p-4 flex gap-4 hover:border-orange-500/35 transition-all shadow-sm"
                      >
                        <div className="bg-orange-50 p-3 rounded-xl border border-orange-200 text-orange-600 self-start">
                          <Trophy size={20} />
                        </div>
                        <div>
                          <h4 className="font-bold text-sm text-[#1c1b1b]">{reward.title}</h4>
                          <p className="text-xs text-[#6f6c6a] mt-1">{reward.description}</p>
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
            <div className="bg-white border border-[#e5e2e1] rounded-2xl p-6 shadow-sm">
              <h3 className="text-lg font-extrabold text-[#1c1b1b] mb-4 pb-3 border-b border-[#e5e2e1]">
                THAM GIA SỰ KIỆN
              </h3>

              <div className="space-y-4 mb-6">
                <div>
                  <span className="text-[10px] text-[#6f6c6a] uppercase block font-semibold">Lệ phí giải</span>
                  <span className="text-2xl font-black text-orange-600 font-mono">
                    {contest.entry_fee === 0 ? "MIỄN PHÍ" : `${contest.entry_fee.toLocaleString()} đ`}
                  </span>
                </div>
                <div>
                  <span className="text-[10px] text-[#6f6c6a] uppercase block font-semibold">Sức chứa giải</span>
                  <span className="text-sm text-[#1c1b1b] font-bold">
                    {contest.registration_summary?.active ?? 0} / {contest.capacity} vận động viên đã đăng ký
                  </span>
                </div>
                <div>
                  <span className="text-[10px] text-[#6f6c6a] uppercase block font-semibold">Hạn cuối đăng ký</span>
                  <span className="text-xs text-[#1c1b1b] font-medium">
                    {formatDateTime(contest.registration_closes_at)}
                  </span>
                </div>
              </div>

              {/* Status Logic Rendering */}
              {myRegistration ? (
                <div className="space-y-4">
                  <div className="bg-green-50 border border-green-200 text-green-700 rounded-xl p-4 flex flex-col items-center text-center">
                    <CheckCircle size={32} className="mb-2 text-green-600" />
                    <h4 className="font-bold text-sm">Bạn đã đăng ký tham gia!</h4>
                    <p className="text-[10px] text-green-600/80 mt-1">
                      Hãy lưu lại mã QR check-in bên dưới để quét khi đến cơ sở đua xe.
                    </p>

                    <div className="bg-white p-3 rounded-lg mt-4 shadow border border-[#e5e2e1] flex flex-col items-center">
                      <QrCode size={120} className="text-[#1c1b1b]" />
                      <span className="font-mono text-xs font-bold text-[#1c1b1b] mt-2 block tracking-widest selection:bg-orange-200">
                        {myRegistration.check_in_code}
                      </span>
                    </div>

                    <div className="text-[10px] text-[#6f6c6a] mt-3 uppercase tracking-wider font-mono">
                      Trạng thái: <span className="font-bold text-orange-600">{myRegistration.status}</span>
                    </div>
                  </div>

                  <Button
                    variant="outline"
                    onClick={() => setShowCancelDialog(true)}
                    className="w-full border-red-200 hover:bg-red-50 text-red-600 hover:text-red-700 text-xs font-bold bg-white"
                  >
                    Hủy đăng ký của tôi
                  </Button>
                </div>
              ) : isAuthenticated ? (
                showRegisterButton ? (
                  <Button
                    onClick={() => setShowRegDialog(true)}
                    className="w-full bg-orange-600 hover:bg-orange-700 text-white font-extrabold py-3 shadow-md rounded-xl"
                  >
                    ĐĂNG KÝ NGAY
                  </Button>
                ) : (
                  <div className="bg-[#f6f3f2] border border-[#e5e2e1] p-4 rounded-xl text-center text-xs text-[#6f6c6a]">
                    {isFull
                      ? "Giải đấu đã hết chỗ nhận đăng ký."
                      : "Cổng đăng ký chưa mở hoặc đã đóng cho giải đấu này."}
                  </div>
                )
              ) : (
                <div className="space-y-3">
                  <p className="text-xs text-[#6f6c6a] text-center">
                    Bạn cần đăng nhập bằng tài khoản Customer để đăng ký tham gia sự kiện.
                  </p>
                  <Button asChild className="w-full bg-orange-600 hover:bg-orange-700 font-bold text-white">
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
        <DialogContent className="bg-white border border-[#e5e2e1] text-[#1c1b1b] max-w-md">
          <DialogHeader>
            <DialogTitle className="text-[#1c1b1b] font-extrabold flex items-center gap-2">
              <Car className="text-orange-600" /> Đăng Ký Tham Gia Giải Đấu
            </DialogTitle>
            <DialogDescription className="text-[#6f6c6a] text-xs">
              Vui lòng điền thông tin cấu hình xe đua RC của bạn để đăng ký thi đấu.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <label className="text-xs font-bold uppercase tracking-wider text-[#6f6c6a]">Nguồn xe đua</label>
              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => setVehicleSource("BYOC")}
                  className={`py-2 px-3 rounded-lg border text-sm font-bold transition-all ${vehicleSource === "BYOC" ? "bg-orange-600 border-orange-600 text-white" : "border-[#e5e2e1] bg-[#f6f3f2] text-[#6f6c6a] hover:text-[#1c1b1b]"}`}
                >
                  Xe cá nhân (BYOC)
                </button>
                <button
                  type="button"
                  disabled
                  title="Thuê xe cần chọn xe cụ thể và sẽ được mở ở bước tiếp theo"
                  className="py-2 px-3 rounded-lg border text-sm font-bold transition-all border-[#e5e2e1] bg-[#f6f3f2] text-slate-350 cursor-not-allowed opacity-55"
                >
                  Thuê xe tại cơ sở
                </button>
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold uppercase tracking-wider text-[#6f6c6a]">
                {vehicleSource === "BYOC" ? "Thông tin xe cá nhân" : "Ghi chú thuê xe"}
              </label>
              <Input
                placeholder={vehicleSource === "BYOC" ? "Tên xe, Tỷ lệ (e.g. Drift Pro 1:10), ID transponder..." : "Ghi chú loại xe hoặc cấu hình động cơ bạn mong muốn..."}
                value={vehicleNote}
                onChange={(e) => setVehicleNote(e.target.value)}
                className="bg-white border-[#e5e2e1] text-[#1c1b1b] focus:border-orange-500"
              />
            </div>
          </div>

          <div className="flex justify-end gap-3 border-t border-[#e5e2e1] pt-4">
            <Button variant="ghost" onClick={() => setShowRegDialog(false)} className="text-[#6f6c6a] hover:bg-[#f6f3f2]">
              Hủy
            </Button>
            <Button
              onClick={() =>
                registerMutation.mutate({
                  vehicle_source: "BYOC",
                  metadata: { note: vehicleNote },
                })
              }
              disabled={registerMutation.isPending}
              className="bg-orange-600 hover:bg-orange-700 text-white font-bold"
            >
              {registerMutation.isPending ? "Đang xử lý..." : "Xác nhận đăng ký"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Cancellation Dialog */}
      <Dialog open={showCancelDialog} onOpenChange={setShowCancelDialog}>
        <DialogContent className="bg-white border border-[#e5e2e1] text-[#1c1b1b] max-w-md">
          <DialogHeader>
            <DialogTitle className="text-[#1c1b1b] font-extrabold flex items-center gap-2">
              <AlertCircle className="text-red-600" /> Xác Nhận Hủy Đăng Ký
            </DialogTitle>
            <DialogDescription className="text-[#6f6c6a] text-xs">
              Bạn có chắc chắn muốn hủy đăng ký tham gia giải đấu này? Hành động này không thể hoàn tác.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-2 py-4">
            <label className="text-xs font-bold uppercase tracking-wider text-[#6f6c6a]">Lý do hủy bỏ</label>
            <Input
              placeholder="Nhập lý do của bạn..."
              value={cancelReason}
              onChange={(e) => setCancelReason(e.target.value)}
              className="bg-white border-[#e5e2e1] text-[#1c1b1b] focus:border-orange-500"
            />
          </div>

          <div className="flex justify-end gap-3 border-t border-[#e5e2e1] pt-4">
            <Button variant="ghost" onClick={() => setShowCancelDialog(false)} className="text-[#6f6c6a] hover:bg-[#f6f3f2]">
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
