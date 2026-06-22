import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { useNavigate } from "react-router";
import {
  Calendar,
  MapPin,
  Search,
  Bell,
  Trophy,
  Clock,
  ArrowRight,
  Sparkles,
  X,
} from "lucide-react";
import { contestsApi, contestQueryKeys } from "../api/contests.api";
import { trackTypeApi, trackTypeQueryKeys } from "@/features/cafes/api/cafe.api";
import { Input } from "@/shared/ui/input";
import { Button } from "@/shared/ui/button";
import { Badge } from "@/shared/ui/badge";
import { Card } from "@/shared/ui/card";
import { Tabs, TabsList, TabsTrigger } from "@/shared/ui/tabs";

interface TrackTypeOption {
  id: string;
  name: string;
}

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

export function ContestListPage() {
  const navigate = useNavigate();
  const [search, setSearch] = useState("");
  const [selectedStatus, setSelectedStatus] = useState<string>("all");
  const [selectedTrackType, setSelectedTrackType] = useState<string>("all");
  const [dismissedAnnouncements, setDismissedAnnouncements] = useState<Record<string, boolean>>(() => {
    const dismissed: Record<string, boolean> = {};
    if (typeof localStorage === "undefined") return dismissed;
    Object.keys(localStorage).forEach((key) => {
      if (key.startsWith("contest_popup_dismissed:")) {
        const id = key.replace("contest_popup_dismissed:", "");
        dismissed[id] = true;
      }
    });
    return dismissed;
  });

  // Query contests
  const contestListParams = { upcoming: true, status: "OPEN", notify_within_hours: 72 };
  const { data: contestsEnvelope, isLoading } = useQuery({
    queryKey: contestQueryKeys.list(contestListParams),
    queryFn: () => contestsApi.listContests(contestListParams),
  });

  // Query track types
  const { data: trackTypes = [] } = useQuery({
    queryKey: trackTypeQueryKeys.all,
    queryFn: () => trackTypeApi.listAll(),
  });

  const contestsList = contestsEnvelope?.data || [];

  const dismissAnnouncement = (id: string) => {
    localStorage.setItem(`contest_popup_dismissed:${id}`, "true");
    setDismissedAnnouncements((prev) => ({ ...prev, [id]: true }));
  };

  // Active highlighted contest banner logic
  const alertContest = contestsList.find(
    (c) => c.should_notify && !dismissedAnnouncements[c.id] && c.status === "OPEN"
  );

  // Filter list
  const filteredContests = contestsList.filter((contest) => {
    // Search filter
    const matchesSearch = contest.name.toLowerCase().includes(search.toLowerCase());

    // Status filter
    const matchesStatus =
      selectedStatus === "all" || contest.status.toLowerCase() === selectedStatus.toLowerCase();

    // Track type filter
    const matchesTrack =
      selectedTrackType === "all" || contest.track_type_id === selectedTrackType;

    return matchesSearch && matchesStatus && matchesTrack;
  });

  // Calculate dynamic countdown for banner
  const [timeLeft, setTimeLeft] = useState("");
  useEffect(() => {
    if (!alertContest) return;
    const timer = setInterval(() => {
      const now = new Date().getTime();
      const target = new Date(
        alertContest.is_registration_open ? alertContest.registration_closes_at : alertContest.registration_opens_at
      ).getTime();
      const difference = target - now;

      if (difference <= 0) {
        setTimeLeft("Đang diễn ra");
        clearInterval(timer);
      } else {
        const days = Math.floor(difference / (1000 * 60 * 60 * 24));
        const hours = Math.floor((difference % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
        const minutes = Math.floor((difference % (1000 * 60 * 60)) / (1000 * 60));
        const seconds = Math.floor((difference % (1000 * 60)) / 1000);
        setTimeLeft(`${days} ngày ${hours}h ${minutes}m ${seconds}s`);
      }
    }, 1000);

    return () => clearInterval(timer);
  }, [alertContest]);

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 pb-20">
      {/* Alert Top Banner */}
      {alertContest && (
        <div className="bg-gradient-to-r from-orange-600 via-red-600 to-orange-700 py-3 px-4 shadow-xl relative animate-fade-in border-b border-orange-500 z-40">
          <div className="container mx-auto flex flex-col md:flex-row items-center justify-between gap-4 pr-10">
            <div className="flex items-center gap-3">
              <span className="bg-white/20 p-2 rounded-full text-white animate-pulse">
                <Bell size={18} />
              </span>
              <div>
                <p className="font-bold text-white text-sm md:text-base flex items-center gap-2">
                  <Sparkles size={16} className="text-yellow-300 animate-spin" />
                  Sự kiện sắp diễn ra: {alertContest.name}
                </p>
                <p className="text-xs text-orange-100">
                  Hãy đăng ký ngay trước khi hết chỗ! Đăng ký đóng vào{" "}
                  {formatDateTime(alertContest.registration_closes_at)}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <div className="text-right">
                <span className="text-xs uppercase text-orange-200 block">Thời gian đếm ngược</span>
                <span className="font-mono font-bold text-white text-sm bg-black/40 px-3 py-1 rounded border border-orange-500/50">
                  {timeLeft || "Đang tính..."}
                </span>
              </div>
              <Button
                size="sm"
                onClick={() => navigate(`/contests/${alertContest.id}`)}
                className="bg-white text-orange-700 hover:bg-orange-100 font-bold border-none"
              >
                Chi tiết <ArrowRight size={14} className="ml-1" />
              </Button>
            </div>
          </div>
          <button
            onClick={() => dismissAnnouncement(alertContest.id)}
            className="absolute right-4 top-1/2 -translate-y-1/2 text-orange-200 hover:text-white transition-colors"
          >
            <X size={18} />
          </button>
        </div>
      )}

      {/* Hero Section */}
      <div className="relative overflow-hidden bg-gradient-to-br from-slate-900 via-slate-800 to-orange-950/70 border-b border-slate-800/80 py-20 px-4">
        {/* Background grid */}
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_80%_80%_at_50%_-20%,rgba(249,115,22,0.15),rgba(255,255,255,0))]" />
        
        <div className="container mx-auto text-center relative z-10 max-w-3xl">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-orange-500/30 bg-orange-500/10 text-orange-400 text-xs font-semibold uppercase tracking-wider mb-6 animate-pulse">
            <Trophy size={14} /> Hệ thống Giải đấu RC chuyên nghiệp
          </div>
          <h1 className="text-4xl md:text-6xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-orange-400 via-amber-400 to-orange-500 tracking-tight leading-none mb-6">
            BẢNG VÀNG TRANH TÀI
          </h1>
          <p className="text-slate-300 md:text-lg mb-8 leading-relaxed max-w-2xl mx-auto">
            Khám phá các giải đua xe RC đỉnh cao, đăng ký tham gia thử thách kỹ năng và tranh tài giành giải thưởng lớn cùng cộng đồng tay đua chuyên nghiệp tại RCField.
          </p>
        </div>
      </div>

      <div className="container mx-auto px-4 mt-10 max-w-7xl">
        {/* Filter Toolbar */}
        <div className="bg-slate-900/60 backdrop-blur-md border border-slate-800/60 p-4 rounded-2xl flex flex-col lg:flex-row gap-4 items-center justify-between shadow-lg mb-10">
          <div className="relative w-full lg:w-96">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
            <Input
              placeholder="Tìm kiếm giải đấu..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-10 bg-slate-950 border-slate-800 focus-visible:ring-orange-500 text-slate-200"
            />
          </div>

          <div className="flex flex-wrap items-center gap-4 w-full lg:w-auto">
            {/* Status Tabs */}
            <Tabs
              value={selectedStatus}
              onValueChange={setSelectedStatus}
              className="w-full sm:w-auto"
            >
              <TabsList className="bg-slate-950 border border-slate-800 p-1">
                <TabsTrigger value="all" className="data-[state=active]:bg-orange-600 data-[state=active]:text-white">Tất cả</TabsTrigger>
                <TabsTrigger value="open" className="data-[state=active]:bg-orange-600 data-[state=active]:text-white">Mở đăng ký</TabsTrigger>
                <TabsTrigger value="running" className="data-[state=active]:bg-orange-600 data-[state=active]:text-white">Đang đấu</TabsTrigger>
                <TabsTrigger value="completed" className="data-[state=active]:bg-orange-600 data-[state=active]:text-white">Kết thúc</TabsTrigger>
              </TabsList>
            </Tabs>

            {/* Track type selector */}
            <select
              value={selectedTrackType}
              onChange={(e) => setSelectedTrackType(e.target.value)}
              className="bg-slate-950 border border-slate-800 rounded-lg py-1.5 px-3 text-sm text-slate-200 focus:outline-none focus:ring-1 focus:ring-orange-500 cursor-pointer min-w-[150px] w-full sm:w-auto"
            >
              <option value="all">Mọi loại đường đua</option>
              {(trackTypes as TrackTypeOption[]).map((type) => (
                <option key={type.id} value={type.id}>
                  {type.name}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Content list */}
        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3].map((i) => (
              <Card key={i} className="bg-slate-900 border-slate-800/80 h-96 animate-pulse">
                <div className="bg-slate-800 h-48 w-full rounded-t-xl" />
                <div className="p-6 space-y-4">
                  <div className="h-4 bg-slate-800 w-1/3 rounded" />
                  <div className="h-6 bg-slate-800 w-3/4 rounded" />
                  <div className="h-4 bg-slate-800 w-1/2 rounded" />
                </div>
              </Card>
            ))}
          </div>
        ) : filteredContests.length === 0 ? (
          <div className="text-center py-20 bg-slate-900/20 rounded-2xl border border-dashed border-slate-850">
            <Trophy size={48} className="mx-auto text-slate-600 mb-4" />
            <h3 className="text-xl font-bold text-slate-400 mb-2">Không tìm thấy giải đấu</h3>
            <p className="text-slate-500">
              Hãy thử thay đổi điều kiện lọc hoặc từ khóa tìm kiếm của bạn.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {filteredContests.map((contest) => {
              const capTotal = contest.capacity;
              const capRegistered = contest.registration_summary?.active || 0;
              const percent = Math.min(Math.round((capRegistered / capTotal) * 100), 100);

              return (
                <div
                  key={contest.id}
                  className="group relative flex flex-col bg-slate-900/40 backdrop-blur-sm border border-slate-800/80 rounded-2xl overflow-hidden hover:border-orange-500/40 transition-all duration-300 hover:shadow-2xl hover:shadow-orange-500/5 hover:-translate-y-1.5"
                >
                  {/* Banner cover */}
                  <div className="relative h-48 overflow-hidden bg-slate-800">
                    {contest.banner_image_url ? (
                      <img
                        src={contest.banner_image_url}
                        alt={contest.name}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                      />
                    ) : (
                      <div className="w-full h-full bg-gradient-to-br from-orange-650/40 via-slate-800 to-slate-900 flex items-center justify-center">
                        <Trophy size={36} className="text-orange-500/50" />
                      </div>
                    )}
                    <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-transparent to-transparent" />
                    
                    {/* Status badge */}
                    <div className="absolute top-4 right-4">
                      {contest.status === "OPEN" && (
                        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-green-500/10 text-green-400 border border-green-500/30 shadow-lg shadow-green-500/10">
                          <span className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
                          Mở Đăng Ký
                        </span>
                      )}
                      {contest.status === "RUNNING" && (
                        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-red-500/10 text-red-400 border border-red-500/30 shadow-lg shadow-red-500/10">
                          <span className="w-2 h-2 rounded-full bg-red-400 animate-pulse" />
                          Đang Diễn Ra
                        </span>
                      )}
                      {contest.status === "CLOSED" && (
                        <span className="px-3 py-1 rounded-full text-xs font-bold bg-blue-500/10 text-blue-400 border border-blue-500/30">
                          Đóng Đăng Ký
                        </span>
                      )}
                      {contest.status === "COMPLETED" && (
                        <span className="px-3 py-1 rounded-full text-xs font-bold bg-slate-500/10 text-slate-400 border border-slate-500/30">
                          Đã Kết Thúc
                        </span>
                      )}
                      {contest.status === "CANCELLED" && (
                        <span className="px-3 py-1 rounded-full text-xs font-bold bg-red-500/10 text-red-500 border border-red-500/20">
                          Đã Hủy
                        </span>
                      )}
                      {contest.status === "DRAFT" && (
                        <span className="px-3 py-1 rounded-full text-xs font-bold bg-slate-700/25 text-slate-400 border border-slate-700/30">
                          Nháp
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Body Content */}
                  <div className="p-6 flex flex-col flex-1">
                    <div className="mb-2">
                      <Badge variant="secondary" className="bg-orange-500/10 text-orange-400 border border-orange-500/20 text-[10px] font-bold tracking-wide uppercase px-2 py-0.5">
                        {(trackTypes as TrackTypeOption[]).find((t) => t.id === contest.track_type_id)?.name || "Đường đua RC"}
                      </Badge>
                    </div>

                    <h3 className="text-xl font-bold text-slate-100 mb-3 group-hover:text-orange-400 transition-colors line-clamp-1">
                      {contest.name}
                    </h3>

                    {/* Timeline */}
                    <div className="space-y-2 mb-4 text-xs text-slate-400">
                      <div className="flex items-center gap-2">
                        <Calendar size={14} className="text-orange-500/80" />
                        <span>Khai mạc: {formatDateTime(contest.starts_at)}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Clock size={14} className="text-orange-500/80" />
                        <span>Hạn đăng ký: {formatDateTime(contest.registration_closes_at)}</span>
                      </div>
                    </div>

                    {/* Participating cafes */}
                    {contest.participating_cafes?.length > 0 && (
                      <div className="flex items-start gap-1.5 text-xs text-slate-400 mb-5">
                        <MapPin size={14} className="text-orange-500/80 shrink-0 mt-0.5" />
                        <span className="line-clamp-1">
                          Địa điểm: {contest.participating_cafes.map((c) => c.name).join(", ")}
                        </span>
                      </div>
                    )}

                    {/* Capacity Indicator */}
                    <div className="mt-auto space-y-1.5 mb-6">
                      <div className="flex justify-between text-xs font-medium">
                        <span className="text-slate-400">Số lượng tay đua</span>
                        <span className="text-slate-200">{capRegistered}/{capTotal}</span>
                      </div>
                      <div className="h-1.5 w-full bg-slate-800 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-gradient-to-r from-orange-500 to-amber-400 transition-all duration-300"
                          style={{ width: `${percent}%` }}
                        />
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex items-center justify-between gap-3 border-t border-slate-850 pt-4">
                      <div>
                        <span className="text-[10px] text-slate-500 uppercase block">Lệ phí tham gia</span>
                        <span className="text-sm font-extrabold text-orange-400 font-mono">
                          {contest.entry_fee === 0 ? "MIỄN PHÍ" : `${contest.entry_fee.toLocaleString()} đ`}
                        </span>
                      </div>
                      <Button
                        size="sm"
                        onClick={() => navigate(`/contests/${contest.id}`)}
                        className="bg-orange-600 hover:bg-orange-700 text-white font-bold transition-all px-4 rounded-xl border border-orange-500/20 group-hover:shadow-lg group-hover:shadow-orange-600/15"
                      >
                        Chi tiết
                      </Button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
export default ContestListPage;
