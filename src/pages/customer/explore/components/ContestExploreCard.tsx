import { Calendar, Users, MapPin, Award, ArrowRight } from "lucide-react"
import { Link } from "react-router"
import type { ContestItem } from "@/features/contests/types"
import { formatCurrency } from "@/shared/lib/format"
import { getContestStatusClass } from "@/features/contests/lib/contest-status"
import { routePaths } from "@/app/router/route-paths"
import { Badge } from "@/shared/ui/badge"
import { cn } from "@/shared/lib/utils"

interface ContestExploreCardProps {
  contest: ContestItem
}

export function ContestExploreCard({ contest }: ContestExploreCardProps) {
  const statusClass = getContestStatusClass(contest.status)

  const formatDateTime = (isoString?: string | null) => {
    if (!isoString) return "--"
    try {
      const d = new Date(isoString)
      return d.toLocaleString("vi-VN", {
        hour: "2-digit",
        minute: "2-digit",
        day: "2-digit",
        month: "2-digit",
      })
    } catch {
      return isoString
    }
  }

  const getStatusLabel = (status: string) => {
    switch (status) {
      case "OPEN":
        return "Đang mở đăng ký"
      case "CLOSED":
        return "Đóng đăng ký"
      case "RUNNING":
        return "Đang diễn ra"
      case "COMPLETED":
        return "Đã kết thúc"
      case "CANCELLED":
        return "Đã hủy"
      default:
        return status
    }
  }

  // Fallback gradient/background if no banner image is provided
  const hasBanner = !!contest.banner_image_url

  return (
    <div className="group flex flex-col overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm transition-all hover:translate-y-[-2px] hover:shadow-md h-full">
      {/* Top Banner section */}
      <Link
        to={routePaths.contestDetail.replace(":contestId", contest.id)}
        className={cn(
          "relative aspect-[18/10] w-full overflow-hidden shrink-0 flex items-center justify-center",
          !hasBanner && "bg-gradient-to-br from-orange-500 to-red-600"
        )}
      >
        {hasBanner ? (
          <img
            src={contest.banner_image_url!}
            alt={contest.name}
            className="h-full w-full object-cover transition duration-500 group-hover:scale-[1.03]"
          />
        ) : (
          <div className="absolute inset-0 flex flex-col items-center justify-center p-6 text-white text-center">
            <Award className="h-10 w-10 text-white/90 mb-2 animate-bounce-slow" />
            <span className="text-xs font-black tracking-widest uppercase text-orange-200">RC TOURNAMENT</span>
          </div>
        )}

        {/* Status Badge */}
        <span className={cn(
          "absolute left-3 top-3 z-10 rounded border px-2 py-0.5 text-[10px] font-extrabold shadow-sm backdrop-blur-md",
          statusClass
        )}>
          {getStatusLabel(contest.status)}
        </span>
      </Link>

      {/* Info Section */}
      <div className="flex flex-1 flex-col justify-between p-5 space-y-4">
        <div className="space-y-2">
          {/* Format / Type tags */}
          <div className="flex flex-wrap gap-1.5">
            <Badge variant="outline" className="border-orange-100 bg-orange-50 text-[10px] font-bold text-orange-700">
              {contest.contest_type?.name || "Giải đấu"}
            </Badge>
            <Badge variant="secondary" className="bg-slate-100 text-[10px] font-bold text-slate-700">
              {contest.contest_format?.name || "Thể thức"}
            </Badge>
          </div>

          {/* Name & Desc */}
          <Link
            to={routePaths.contestDetail.replace(":contestId", contest.id)}
            className="block text-base font-extrabold text-slate-900 line-clamp-1 hover:text-orange-600 transition-colors"
          >
            {contest.name}
          </Link>
          <p className="text-xs font-medium text-slate-500 line-clamp-2 min-h-[32px]">
            {contest.description || "Tham gia ngay để tranh tài cùng các tay đua RC khác."}
          </p>

          <div className="pt-2 space-y-2 text-xs font-semibold text-slate-600">
            {/* Host Branch */}
            <div className="flex items-center gap-2">
              <MapPin className="h-3.5 w-3.5 shrink-0 text-red-500" />
              <span className="truncate">{contest.host_branch?.cafe?.name || "Tất cả chi nhánh"}</span>
            </div>

            {/* DateTime */}
            <div className="flex items-center gap-2">
              <Calendar className="h-3.5 w-3.5 shrink-0 text-slate-400" />
              <span>
                {formatDateTime(contest.starts_at)} - {formatDateTime(contest.ends_at)}
              </span>
            </div>

            {/* Capacity */}
            <div className="flex items-center gap-2">
              <Users className="h-3.5 w-3.5 shrink-0 text-slate-400" />
              <span>Sức chứa: {contest.capacity ? `${contest.capacity} tay đua` : "Không giới hạn"}</span>
            </div>
          </div>
        </div>

        {/* Footer Pricing / Call to Action */}
        <div className="pt-3 border-t border-slate-100 flex items-center justify-between gap-3">
          <div>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Lệ phí tham gia</p>
            <p className="text-sm font-black text-orange-600">
              {contest.entry_fee > 0 ? `${formatCurrency(contest.entry_fee)} VND` : "Miễn phí"}
            </p>
          </div>
          <Link
            to={routePaths.contestDetail.replace(":contestId", contest.id)}
            className="flex items-center gap-1 rounded-lg bg-slate-950 px-3.5 py-2 text-xs font-bold text-white shadow hover:bg-slate-800 transition"
          >
            Chi tiết
            <ArrowRight className="h-3 w-3" />
          </Link>
        </div>
      </div>
    </div>
  )
}
