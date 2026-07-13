import { useQuery } from "@tanstack/react-query"
import { Calendar, MapPin, Users, Award, ShieldAlert } from "lucide-react"
import { Link } from "react-router"

import { routePaths } from "@/app/router/route-paths"
import { contestApi, contestQueryKeys } from "@/features/contests/api/contest.api"
import { getContestStatusClass, getContestStatusLabel } from "@/features/contests/lib/contest-status"
import { Badge } from "@/shared/ui/badge"

export function PublicContestsPage() {
  const contestsQuery = useQuery({
    queryKey: contestQueryKeys.list({ public: true }),
    queryFn: () => contestApi.listContests({ limit: 100 }),
  })

  const contests = contestsQuery.data?.data ?? []

  // Helpers
  const formatDateTime = (value: string | null) => {
    if (!value) return "--"
    return new Date(value).toLocaleString("vi-VN", {
      dateStyle: "short",
      timeStyle: "short",
    })
  }

  const formatCurrency = (value: number) => {
    if (value === 0) return "Miễn phí"
    return new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND", maximumFractionDigits: 0 }).format(value)
  }

  // Get status gradient for the card header
  const getHeaderGradient = (status: string) => {
    switch (status) {
      case "OPEN":
        return "from-emerald-500 to-teal-600"
      case "RUNNING":
        return "from-orange-500 to-amber-600"
      case "COMPLETED":
        return "from-slate-600 to-slate-800"
      case "CANCELLED":
        return "from-red-500 to-rose-600"
      default:
        return "from-slate-400 to-slate-500"
    }
  }

  return (
    <main className="w-full bg-slate-50/50 py-10">
      <section className="mx-auto max-w-6xl px-4 sm:px-6">
        {/* Banner Section */}
        <div className="relative mb-10 overflow-hidden rounded-3xl bg-slate-900 px-6 py-12 shadow-xl shadow-slate-900/10 text-white sm:px-12 sm:py-16">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(249,115,22,0.25),transparent_50%)]" />
          <div className="absolute -bottom-16 -right-16 size-64 rounded-full bg-orange-600/10 blur-3xl" />
          <div className="relative max-w-2xl">
            <Badge className="mb-4 bg-orange-500 text-white hover:bg-orange-600 border-none font-bold text-xs uppercase px-3 py-1 tracking-wider">
              Hệ thống giải đấu
            </Badge>
            <h1 className="text-3xl font-extrabold tracking-tight sm:text-4xl md:text-5xl font-display">
              Đấu Trường RC Field
            </h1>
            <p className="mt-4 text-base font-medium text-slate-300 sm:text-lg max-w-xl leading-relaxed">
              Khám phá và đăng ký các giải đấu xe điều khiển kịch tính, giao lưu cùng cộng đồng racer chuyên nghiệp.
            </p>
          </div>
        </div>

        {/* Content Section */}
        {contestsQuery.isLoading ? (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {Array.from({ length: 3 }).map((_, index) => (
              <div key={index} className="h-96 animate-pulse rounded-2xl bg-muted" />
            ))}
          </div>
        ) : contests.length === 0 ? (
          <div className="rounded-3xl border-2 border-dashed border-slate-200 bg-white p-16 text-center shadow-sm">
            <div className="inline-flex size-14 items-center justify-center rounded-2xl bg-slate-50 text-slate-400">
              <ShieldAlert className="size-8" />
            </div>
            <h3 className="mt-4 text-lg font-bold text-slate-900">Chưa có giải đấu công khai</h3>
            <p className="mt-2 text-sm text-slate-500 max-w-sm mx-auto">
              Hiện tại các giải đấu đang được chuẩn bị. Vui lòng quay lại sau để cập nhật thông tin mới nhất.
            </p>
          </div>
        ) : (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {contests.map((contest) => {
              const statusClass = getContestStatusClass(contest.status)
              const statusLabel = getContestStatusLabel(contest.status)
              const headerGrad = getHeaderGradient(contest.status)

              return (
                <Link
                  key={contest.id}
                  to={routePaths.contestDetail.replace(":contestId", contest.id)}
                  className="group relative flex flex-col overflow-hidden rounded-2xl border border-slate-200/80 bg-white shadow-sm transition-all duration-300 hover:-translate-y-1 hover:border-orange-200 hover:shadow-md"
                >
                  {/* Decorative Gradient Header block */}
                  <div className={`h-24 bg-gradient-to-r ${headerGrad} p-4 text-white relative`}>
                    <div className="absolute inset-0 bg-black/10 opacity-30 group-hover:opacity-10 transition-opacity" />
                    <div className="relative flex items-center justify-between">
                      <span className="inline-flex items-center rounded-full bg-white/20 px-2.5 py-0.5 text-2xs font-bold uppercase tracking-wider backdrop-blur-sm">
                        {contest.contest_format?.name || "Standard"}
                      </span>
                      <span className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-2xs font-bold uppercase tracking-wider bg-white ${statusClass.split(" ")[1]} border-white`}>
                        {statusLabel}
                      </span>
                    </div>
                    <div className="absolute bottom-3 left-4 flex items-center gap-1.5 text-white/90">
                      <Award className="size-4 shrink-0" />
                      <span className="text-xs font-bold truncate max-w-[200px]">
                        {contest.contest_type?.name || "Tự do"}
                      </span>
                    </div>
                  </div>

                  {/* Body Content */}
                  <div className="flex flex-1 flex-col p-5">
                    <h3 className="text-lg font-bold text-slate-900 group-hover:text-orange-600 transition-colors line-clamp-1">
                      {contest.name}
                    </h3>
                    <p className="mt-2 text-xs font-medium text-slate-500 line-clamp-2 min-h-[2rem]">
                      {contest.description || "Không có mô tả chi tiết."}
                    </p>

                    <div className="mt-5 space-y-2.5 border-t border-slate-100 pt-4 text-xs font-semibold text-slate-600">
                      <div className="flex items-center gap-2">
                        <MapPin className="size-4 text-slate-400 shrink-0" />
                        <span className="truncate">{contest.host_branch?.cafe?.name || "Tất cả chi nhánh"}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Calendar className="size-4 text-slate-400 shrink-0" />
                        <span>Bắt đầu: {formatDateTime(contest.starts_at)}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Users className="size-4 text-slate-400 shrink-0" />
                        <span>Sức chứa: {contest.capacity} racer</span>
                      </div>
                    </div>

                    {/* Footer Info */}
                    <div className="mt-6 flex items-center justify-between border-t border-slate-100 pt-4">
                      <div className="text-2xs font-bold uppercase tracking-wide text-slate-400">Lệ phí tham gia</div>
                      <div className="text-base font-extrabold text-orange-600">
                        {formatCurrency(contest.entry_fee)}
                      </div>
                    </div>
                  </div>
                </Link>
              )
            })}
          </div>
        )}
      </section>
    </main>
  )
}
