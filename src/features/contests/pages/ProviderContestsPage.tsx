import { useState } from "react"
import { useQuery } from "@tanstack/react-query"
import { Link, useNavigate } from "react-router"
import { Edit, Plus, Settings, Trophy } from "lucide-react"
import { contestsApi, contestQueryKeys } from "../api/contests.api"
import {
  ContestFilterChips,
  ContestSearchInput,
  ContestToolbar,
  type ContestFilterOption,
} from "../components/TournamentPrimitives"
import { useAuthStore } from "@/features/auth/stores/auth.store"
import { Button } from "@/shared/ui/button"
import { Badge } from "@/shared/ui/badge"

type ProviderContestFilter = "all" | "draft" | "active" | "past"

const providerContestFilters: readonly ContestFilterOption<ProviderContestFilter>[] =
  [
    { value: "all", label: "Tất cả" },
    { value: "draft", label: "Nháp" },
    { value: "active", label: "Đang hoạt động" },
    { value: "past", label: "Đã qua" },
  ]

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

export function ProviderContestsPage() {
  const navigate = useNavigate()
  const { user } = useAuthStore()
  const [search, setSearch] = useState("")
  const [activeFilter, setActiveFilter] = useState<ProviderContestFilter>("all")

  const { data: contestsEnvelope, isLoading } = useQuery({
    queryKey: contestQueryKeys.list(),
    queryFn: () => contestsApi.listContests(),
  })

  const contestsList = (contestsEnvelope?.data || []).filter(
    (contest) => contest.provider_id === user?.id,
  )

  const filteredContests = contestsList.filter((contest) => {
    const matchesSearch = contest.name
      .toLowerCase()
      .includes(search.toLowerCase())

    if (activeFilter === "draft")
      return matchesSearch && contest.status === "DRAFT"
    if (activeFilter === "active")
      return (
        matchesSearch &&
        (contest.status === "OPEN" ||
          contest.status === "RUNNING" ||
          contest.status === "CLOSED")
      )
    if (activeFilter === "past")
      return (
        matchesSearch &&
        (contest.status === "COMPLETED" || contest.status === "CANCELLED")
      )

    return matchesSearch
  })

  return (
    <div className="space-y-6 text-[#1c1b1b] p-6 max-w-7xl mx-auto">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-extrabold text-[#1c1b1b] tracking-tight flex items-center gap-2">
            <Trophy className="text-orange-600" /> Quản Lý Giải Đấu
          </h1>
          <p className="text-[#6f6c6a] text-sm mt-1">
            Thiết lập, mở đăng ký, tổ chức chia bảng đấu và công bố kết quả giải
            đua xe RC.
          </p>
        </div>
        <Button
          onClick={() => navigate("/provider/contests/new")}
          className="bg-orange-600 hover:bg-orange-700 text-white font-bold flex items-center gap-1.5 rounded-xl shadow-md"
        >
          <Plus size={18} /> Tạo giải đấu mới
        </Button>
      </div>

      {/* Toolbar Filters */}
      <ContestToolbar>
        <ContestSearchInput
          value={search}
          onChange={setSearch}
          className="md:w-80"
        />
        <ContestFilterChips
          options={providerContestFilters}
          value={activeFilter}
          onChange={setActiveFilter}
        />
      </ContestToolbar>

      {/* Contests List Grid */}
      {isLoading ? (
        <div className="text-center py-20 space-y-4">
          <div className="w-10 h-10 border-4 border-orange-500 border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-[#6f6c6a] text-sm">
            Đang tải danh sách giải đấu...
          </p>
        </div>
      ) : filteredContests.length === 0 ? (
        <div className="text-center py-20 bg-white rounded-2xl border border-dashed border-[#e5e2e1] shadow-sm">
          <Trophy size={48} className="mx-auto text-slate-350 mb-4" />
          <h3 className="text-xl font-bold text-[#6f6c6a] mb-1">
            Chưa có giải đấu nào
          </h3>
          <p className="text-[#6f6c6a] text-sm mb-4">
            Bắt đầu tổ chức giải đấu đầu tiên của bạn ngay bây giờ!
          </p>
          <Button
            onClick={() => navigate("/provider/contests/new")}
            className="bg-orange-600 hover:bg-orange-700 font-bold text-white"
          >
            Tạo giải đấu ngay
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {filteredContests.map((contest) => {
            const registered = contest.registration_summary?.active || 0
            const capacity = contest.capacity
            const percent = Math.min(
              Math.round((registered / capacity) * 100),
              100,
            )

            return (
              <div
                key={contest.id}
                className="bg-white border border-[#e5e2e1] rounded-2xl p-6 flex flex-col hover:border-orange-500/35 transition-all shadow-sm"
              >
                <div className="flex justify-between items-start gap-4 mb-4">
                  <div>
                    <h3 className="text-lg font-bold text-[#1c1b1b] line-clamp-1">
                      {contest.name}
                    </h3>
                    <p className="text-xs text-[#6f6c6a] mt-1 font-medium">
                      Thời gian: {formatDateTime(contest.starts_at)}
                    </p>
                  </div>
                  <Badge
                    className={`uppercase text-[9px] font-bold ${contest.status === "OPEN" ? "bg-green-50 text-green-700 border border-green-200" : contest.status === "RUNNING" ? "bg-red-50 text-red-700 border border-red-200" : "bg-[#f6f3f2] text-[#6f6c6a] border border-[#e5e2e1]"}`}
                  >
                    {contest.status}
                  </Badge>
                </div>

                <div className="grid grid-cols-2 gap-4 text-xs text-[#6f6c6a] mb-5">
                  <div className="space-y-1">
                    <span className="text-[10px] text-[#6f6c6a] uppercase block font-semibold">
                      Địa điểm tổ chức
                    </span>
                    <span className="font-bold text-[#1c1b1b] line-clamp-1">
                      {contest.participating_cafes
                        ?.map((c) => c.name)
                        .join(", ") || "Chưa thiết lập"}
                    </span>
                  </div>
                  <div className="space-y-1">
                    <span className="text-[10px] text-[#6f6c6a] uppercase block font-semibold">
                      Lệ phí giải
                    </span>
                    <span className="font-bold text-orange-600 font-mono">
                      {contest.entry_fee === 0
                        ? "MIỄN PHÍ"
                        : `${contest.entry_fee.toLocaleString()} đ`}
                    </span>
                  </div>
                </div>

                {/* Capacity progress */}
                <div className="space-y-1.5 mb-6 mt-auto">
                  <div className="flex justify-between text-xs font-semibold">
                    <span className="text-[#6f6c6a] uppercase text-[9px]">
                      Tay đua tham dự
                    </span>
                    <span className="text-[#1c1b1b]">
                      {registered}/{capacity}
                    </span>
                  </div>
                  <div className="h-2 w-full bg-[#f6f3f2] rounded-full overflow-hidden border border-[#e5e2e1]">
                    <div
                      className="h-full bg-gradient-to-r from-orange-500 to-amber-500 transition-all"
                      style={{ width: `${percent}%` }}
                    />
                  </div>
                </div>

                <div className="flex items-center justify-between gap-3 border-t border-[#e5e2e1] pt-4">
                  <Button
                    asChild
                    variant="outline"
                    className="border-[#e5e2e1] bg-[#fcf8f8] hover:bg-[#f6f3f2] text-[#1c1b1b] hover:text-[#1c1b1b]"
                  >
                    <Link to={`/provider/contests/${contest.id}`}>
                      <Settings size={14} className="mr-1.5 text-orange-600" />{" "}
                      Quản lý giải
                    </Link>
                  </Button>

                  {contest.status === "DRAFT" && (
                    <Button
                      asChild
                      variant="ghost"
                      className="text-orange-600 hover:text-orange-700 hover:bg-orange-50 font-bold"
                    >
                      <Link to={`/provider/contests/${contest.id}/edit`}>
                        <Edit size={14} className="mr-1.5" /> Chỉnh sửa
                      </Link>
                    </Button>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}

export default ProviderContestsPage
