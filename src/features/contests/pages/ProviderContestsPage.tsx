import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Link, useNavigate } from "react-router";
import {
  Trophy,
  Plus,
  Search,
  Settings,
  Edit,
} from "lucide-react";
import { contestsApi, contestQueryKeys } from "../api/contests.api";
import { Button } from "@/shared/ui/button";
import { Badge } from "@/shared/ui/badge";
import { Input } from "@/shared/ui/input";

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

export function ProviderContestsPage() {
  const navigate = useNavigate();
  const [search, setSearch] = useState("");
  const [activeFilter, setActiveFilter] = useState<"all" | "draft" | "active" | "past">("all");

  const { data: contestsEnvelope, isLoading } = useQuery({
    queryKey: contestQueryKeys.list(),
    queryFn: () => contestsApi.listContests(),
  });

  const contestsList = contestsEnvelope?.data || [];

  const filteredContests = contestsList.filter((contest) => {
    const matchesSearch = contest.name.toLowerCase().includes(search.toLowerCase());
    
    if (activeFilter === "draft") return matchesSearch && contest.status === "DRAFT";
    if (activeFilter === "active") return matchesSearch && (contest.status === "OPEN" || contest.status === "RUNNING" || contest.status === "CLOSED");
    if (activeFilter === "past") return matchesSearch && (contest.status === "COMPLETED" || contest.status === "CANCELLED");
    
    return matchesSearch;
  });

  return (
    <div className="space-y-6 text-slate-100 p-6 max-w-7xl mx-auto">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-extrabold text-white tracking-tight flex items-center gap-2">
            <Trophy className="text-orange-500" /> Quản Lý Giải Đấu
          </h1>
          <p className="text-slate-400 text-sm mt-1">
            Thiết lập, mở đăng ký, tổ chức chia bảng đấu và công bố kết quả giải đua xe RC.
          </p>
        </div>
        <Button
          onClick={() => navigate("/provider/contests/new")}
          className="bg-orange-600 hover:bg-orange-700 text-white font-bold flex items-center gap-1.5 rounded-xl shadow-lg shadow-orange-600/15"
        >
          <Plus size={18} /> Tạo giải đấu mới
        </Button>
      </div>

      {/* Toolbar Filters */}
      <div className="flex flex-col md:flex-row gap-4 items-center justify-between bg-slate-900 border border-slate-800 p-4 rounded-xl shadow-md">
        <div className="relative w-full md:w-80">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
          <Input
            placeholder="Tìm kiếm giải đấu..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9 bg-slate-950 border-slate-800 text-slate-200 focus-visible:ring-orange-500"
          />
        </div>

        <div className="flex gap-2 overflow-x-auto w-full md:w-auto">
          {(["all", "draft", "active", "past"] as const).map((filter) => (
            <button
              key={filter}
              onClick={() => setActiveFilter(filter)}
              className={`py-1.5 px-4 rounded-lg text-xs font-bold capitalize transition-all shrink-0 ${activeFilter === filter ? "bg-orange-600 text-white" : "bg-slate-950 border border-slate-800 text-slate-400 hover:text-white"}`}
            >
              {filter === "all" ? "Tất cả" : filter === "draft" ? "Nháp" : filter === "active" ? "Đang hoạt động" : "Đã qua"}
            </button>
          ))}
        </div>
      </div>

      {/* Contests List Grid */}
      {isLoading ? (
        <div className="text-center py-20 space-y-4">
          <div className="w-10 h-10 border-4 border-orange-500 border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-slate-400 text-sm">Đang tải danh sách giải đấu...</p>
        </div>
      ) : filteredContests.length === 0 ? (
        <div className="text-center py-20 bg-slate-900/30 rounded-2xl border border-dashed border-slate-800">
          <Trophy size={48} className="mx-auto text-slate-600 mb-4 animate-pulse" />
          <h3 className="text-xl font-bold text-slate-400 mb-1">Chưa có giải đấu nào</h3>
          <p className="text-slate-500 text-sm mb-4">
            Bắt đầu tổ chức giải đấu đầu tiên của bạn ngay bây giờ!
          </p>
          <Button onClick={() => navigate("/provider/contests/new")} className="bg-orange-600 hover:bg-orange-700 font-bold">
            Tạo giải đấu ngay
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {filteredContests.map((contest) => {
            const registered = contest.registration_summary?.active || 0;
            const capacity = contest.capacity;
            const percent = Math.min(Math.round((registered / capacity) * 100), 100);

            return (
              <div
                key={contest.id}
                className="bg-slate-900/50 border border-slate-800 rounded-2xl p-6 flex flex-col hover:border-orange-500/30 transition-all shadow-lg hover:shadow-orange-500/5"
              >
                <div className="flex justify-between items-start gap-4 mb-4">
                  <div>
                    <h3 className="text-lg font-bold text-slate-100 line-clamp-1">{contest.name}</h3>
                    <p className="text-xs text-slate-500 mt-1 font-medium">
                      Thời gian: {formatDateTime(contest.starts_at)}
                    </p>
                  </div>
                  <Badge className={`uppercase text-[9px] font-bold ${contest.status === "OPEN" ? "bg-green-500/10 text-green-400 border border-green-500/20" : contest.status === "RUNNING" ? "bg-red-500/10 text-red-400 border border-red-500/20" : "bg-slate-800 text-slate-400 border border-slate-700"}`}>
                    {contest.status}
                  </Badge>
                </div>

                <div className="grid grid-cols-2 gap-4 text-xs text-slate-400 mb-5">
                  <div className="space-y-1">
                    <span className="text-[10px] text-slate-500 uppercase block font-semibold">Địa điểm tổ chức</span>
                    <span className="font-bold text-slate-300 line-clamp-1">
                      {contest.participating_cafes?.map((c) => c.name).join(", ") || "Chưa thiết lập"}
                    </span>
                  </div>
                  <div className="space-y-1">
                    <span className="text-[10px] text-slate-500 uppercase block font-semibold">Lệ phí giải</span>
                    <span className="font-bold text-orange-400 font-mono">
                      {contest.entry_fee === 0 ? "MIỄN PHÍ" : `${contest.entry_fee.toLocaleString()} đ`}
                    </span>
                  </div>
                </div>

                {/* Capacity progress */}
                <div className="space-y-1.5 mb-6 mt-auto">
                  <div className="flex justify-between text-xs font-semibold">
                    <span className="text-slate-500 uppercase text-[9px]">Tay đua tham dự</span>
                    <span className="text-slate-300">{registered}/{capacity}</span>
                  </div>
                  <div className="h-2 w-full bg-slate-950 rounded-full overflow-hidden border border-slate-800">
                    <div
                      className="h-full bg-gradient-to-r from-orange-500 to-amber-500 transition-all"
                      style={{ width: `${percent}%` }}
                    />
                  </div>
                </div>

                <div className="flex items-center justify-between gap-3 border-t border-slate-850 pt-4">
                  <Button
                    asChild
                    variant="outline"
                    className="border-slate-800 bg-slate-950 hover:bg-slate-900 text-slate-300 hover:text-white"
                  >
                    <Link to={`/provider/contests/${contest.id}`}>
                      <Settings size={14} className="mr-1.5" /> Quản lý giải
                    </Link>
                  </Button>
                  
                  {contest.status === "DRAFT" && (
                    <Button
                      asChild
                      variant="ghost"
                      className="text-orange-400 hover:text-orange-350 hover:bg-orange-500/5 font-bold"
                    >
                      <Link to={`/provider/contests/${contest.id}/edit`}>
                        <Edit size={14} className="mr-1.5" /> Chỉnh sửa
                      </Link>
                    </Button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
export default ProviderContestsPage;
