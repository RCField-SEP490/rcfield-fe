import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useNavigate } from "react-router";
import { Trophy, Calendar, Users, MapPin, Search, ArrowRight, QrCode } from "lucide-react";
import { contestsApi, contestQueryKeys } from "../api/contests.api";
import { useStaffOperations } from "@/pages/staff/context/StaffOperationContext";
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

export function StaffContestsPage() {
  const navigate = useNavigate();
  const { assignedCafeId } = useStaffOperations();
  const [search, setSearch] = useState("");
  const [onlyMyBranch, setOnlyMyBranch] = useState(true);

  const { data: contestsEnvelope, isLoading } = useQuery({
    queryKey: contestQueryKeys.list(),
    queryFn: () => contestsApi.listContests(),
  });

  const contestsList = contestsEnvelope?.data || [];

  const filteredContests = contestsList.filter((contest) => {
    const matchesSearch = contest.name.toLowerCase().includes(search.toLowerCase());
    
    if (onlyMyBranch && assignedCafeId) {
      const isParticipating = contest.participating_cafes?.some((c) => c.id === assignedCafeId);
      return matchesSearch && isParticipating;
    }
    
    return matchesSearch;
  });

  return (
    <div className="space-y-6 text-slate-100 p-6 max-w-7xl mx-auto">
      <div>
        <h1 className="text-3xl font-extrabold text-white tracking-tight flex items-center gap-2">
          <Trophy className="text-orange-500" /> Vận Hành Giải Đấu (Staff)
        </h1>
        <p className="text-slate-400 text-sm mt-1">
          Hỗ trợ check-in vận động viên tham dự sự kiện tại chi nhánh của bạn.
        </p>
      </div>

      {/* Toolbar */}
      <div className="flex flex-col md:flex-row gap-4 items-center justify-between bg-slate-900 border border-slate-800 p-4 rounded-xl shadow-md">
        <div className="relative w-full md:w-80">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
          <Input
            placeholder="Tìm kiếm giải đấu..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9 bg-slate-950 border-slate-800 text-slate-250 focus-visible:ring-orange-500"
          />
        </div>

        <div className="flex items-center gap-4 w-full md:w-auto">
          {assignedCafeId && (
            <label className="flex items-center gap-2 text-xs font-bold text-slate-350 cursor-pointer">
              <input
                type="checkbox"
                checked={onlyMyBranch}
                onChange={(e) => setOnlyMyBranch(e.target.checked)}
                className="rounded text-orange-655 focus:ring-orange-550 border-slate-800"
              />
              Chỉ hiện giải đấu tại chi nhánh hiện tại
            </label>
          )}
        </div>
      </div>

      {/* Contests Table */}
      {isLoading ? (
        <div className="text-center py-20">
          <div className="w-10 h-10 border-4 border-orange-500 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
          <p className="text-slate-400 text-sm">Đang tải danh sách giải đấu...</p>
        </div>
      ) : filteredContests.length === 0 ? (
        <div className="text-center py-20 bg-slate-900/30 rounded-2xl border border-dashed border-slate-800">
          <Trophy size={44} className="mx-auto text-slate-600 mb-3 animate-pulse" />
          <h3 className="text-lg font-bold text-slate-400">Không tìm thấy giải đấu nào</h3>
          <p className="text-slate-500 text-xs mt-1">
            Không có giải đấu nào phù hợp với bộ lọc hoặc từ khóa tìm kiếm của bạn.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredContests.map((contest) => {
            const registered = contest.registration_summary?.active || 0;
            const capacity = contest.capacity;

            return (
              <div
                key={contest.id}
                className="bg-slate-900/40 border border-slate-800/80 rounded-2xl p-5 flex flex-col hover:border-orange-500/25 transition-all shadow-md hover:shadow-lg"
              >
                <div className="flex justify-between items-start gap-4 mb-3">
                  <h3 className="font-bold text-slate-200 text-base line-clamp-1">{contest.name}</h3>
                  <Badge className={`uppercase text-[8px] font-bold shrink-0 ${contest.status === "OPEN" ? "bg-green-500/10 text-green-400 border border-green-500/20" : contest.status === "RUNNING" ? "bg-red-500/10 text-red-400 border border-red-500/20" : "bg-slate-800 text-slate-400 border border-slate-700"}`}>
                    {contest.status}
                  </Badge>
                </div>

                <div className="space-y-2 text-xs text-slate-400 mb-5">
                  <div className="flex items-center gap-1.5">
                    <Calendar size={13} className="text-orange-500/80" />
                    <span>Khai mạc: {formatDateTime(contest.starts_at)}</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <Users size={13} className="text-orange-500/80" />
                    <span>VĐV đăng ký: {registered} / {capacity}</span>
                  </div>
                  {contest.participating_cafes?.length > 0 && (
                    <div className="flex items-start gap-1.5">
                      <MapPin size={13} className="text-orange-500/80 shrink-0 mt-0.5" />
                      <span className="line-clamp-1">
                        Cơ sở: {contest.participating_cafes.map((c) => c.name).join(", ")}
                      </span>
                    </div>
                  )}
                </div>

                <div className="mt-auto border-t border-slate-850 pt-4 flex gap-3">
                  <Button
                    size="sm"
                    onClick={() => navigate(`/staff/contests/${contest.id}`)}
                    className="w-full bg-orange-600 hover:bg-orange-700 text-white font-bold flex items-center justify-center gap-1 text-xs"
                  >
                    <QrCode size={14} /> Điểm danh check-in <ArrowRight size={12} />
                  </Button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
export default StaffContestsPage;
