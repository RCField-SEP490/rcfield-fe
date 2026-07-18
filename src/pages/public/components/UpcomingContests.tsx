import { useQuery } from "@tanstack/react-query"
import { Calendar, MapPin, Users, Trophy, ArrowRight } from "lucide-react"
import { Link } from "react-router"
import { motion } from "framer-motion"
import { routePaths } from "@/app/router/route-paths"
import { contestApi, contestQueryKeys } from "@/features/contests/api/contest.api"
import { ContestAvailabilityBadge } from "@/features/contests/components"
import { CardListSkeleton } from "@/shared/ui/loading-state"

export function UpcomingContests() {
  const { data: contestsResponse, isLoading } = useQuery({
    queryKey: contestQueryKeys.list({ public: true, limit: 3 }),
    queryFn: () => contestApi.listContests({ limit: 10 }),
  })

  const contests = contestsResponse?.data ?? []

  // Filter only OPEN or RUNNING contests
  const upcomingContests = contests
    .filter((c) => c.status === "OPEN" || c.status === "RUNNING")
    .slice(0, 3)

  const formatDateTime = (value: string | null) => {
    if (!value) return "--"
    return new Date(value).toLocaleString("vi-VN", {
      dateStyle: "short",
      timeStyle: "short",
    })
  }

  const formatCurrency = (value: number) => {
    if (value === 0) return "Miễn phí"
    return new Intl.NumberFormat("vi-VN", {
      style: "currency",
      currency: "VND",
      maximumFractionDigits: 0,
    }).format(value)
  }

  if (!isLoading && upcomingContests.length === 0) {
    return null // Hide if there are no upcoming contests
  }

  return (
    <section className="bg-slate-900 py-24 text-white relative overflow-hidden">
      {/* Ambient backgrounds */}
      <div className="absolute -top-40 -left-40 size-96 bg-orange-600/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute -bottom-40 -right-40 size-96 bg-amber-600/10 rounded-full blur-3xl pointer-events-none" />

      <div className="mx-auto max-w-7xl px-4 md:px-6 relative">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-end md:justify-between mb-12">
          <div>
            <p className="mb-3 text-xs font-black uppercase tracking-[0.2em] text-orange-500">
              Hệ thống tranh tài
            </p>
            <h2 className="text-3xl font-black tracking-tight text-white md:text-4xl">
              Giải đấu sắp diễn ra
            </h2>
            <p className="mt-2 text-sm font-medium text-slate-400 max-w-xl">
              Đăng ký tranh tài cùng các đối thủ xứng tầm, tích lũy điểm hệ số để nâng hạng và danh hiệu trên BXH.
            </p>
          </div>
          <Link
            to={routePaths.contests}
            className="group mt-4 inline-flex items-center gap-1 text-sm font-bold text-orange-500 hover:text-orange-400 md:mt-0 transition-colors"
          >
            Xem tất cả giải đấu
            <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
          </Link>
        </div>

        {/* List */}
        {isLoading ? (
          <CardListSkeleton
            count={3}
            className="grid gap-6 space-y-0 sm:grid-cols-2 lg:grid-cols-3"
            itemClassName="h-80 rounded-3xl bg-slate-800"
          />
        ) : (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {upcomingContests.map((contest, index) => {
              return (
                <motion.div
                  key={contest.id}
                  initial={{ opacity: 0, y: 25 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: index * 0.1, duration: 0.5 }}
                  whileHover={{ y: -5 }}
                  className="group flex flex-col justify-between overflow-hidden rounded-3xl border border-slate-800 bg-slate-950 p-6 shadow-xl"
                >
                  <div className="space-y-4">
                    {/* Format + Status Badges */}
                    <div className="flex items-center justify-between">
                      <span className="rounded-lg bg-orange-500/10 border border-orange-500/20 px-2.5 py-0.5 text-2xs font-extrabold uppercase tracking-wider text-orange-400">
                        {contest.contest_format?.name || "GP Series"}
                      </span>
                      <ContestAvailabilityBadge
                        contest={contest}
                        className="rounded-full border-emerald-500/20 bg-emerald-500/10 px-2.5 py-0.5 text-2xs font-extrabold uppercase tracking-wider text-emerald-400"
                      />
                    </div>

                    {/* Title */}
                    <div>
                      <Link
                        to={routePaths.contestDetail.replace(":contestId", contest.id)}
                        className="text-lg font-black text-white hover:text-orange-500 transition-colors leading-snug line-clamp-1 block"
                      >
                        {contest.name}
                      </Link>
                      <p className="mt-1.5 text-xs text-slate-400 line-clamp-2 min-h-[2rem]">
                        {contest.description || "Giải đấu kịch tính được tổ chức định kỳ."}
                      </p>
                    </div>

                    {/* Details Info */}
                    <div className="pt-4 border-t border-slate-900 space-y-2 text-xs font-semibold text-slate-400">
                      <div className="flex items-center gap-2">
                        <MapPin className="h-4 w-4 text-red-500 shrink-0" />
                        <span className="truncate">{contest.host_branch?.cafe?.name || "Toàn quốc"}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Calendar className="h-4 w-4 text-amber-500 shrink-0" />
                        <span>Bắt đầu: {formatDateTime(contest.starts_at)}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Users className="h-4 w-4 text-emerald-500 shrink-0" />
                        <span>Giới hạn: {contest.capacity} racer</span>
                      </div>
                    </div>
                  </div>

                  {/* Pricing / Booking button */}
                  <div className="mt-6 pt-4 border-t border-slate-900 flex items-center justify-between">
                    <div>
                      <span className="text-3xs font-extrabold uppercase tracking-wider text-slate-500 block">
                        Lệ phí
                      </span>
                      <span className="text-base font-black text-orange-500">
                        {formatCurrency(contest.entry_fee)}
                      </span>
                    </div>

                    <Link
                      to={routePaths.contestDetail.replace(":contestId", contest.id)}
                      className="inline-flex h-9 items-center gap-1 rounded-xl bg-orange-600 px-4 text-xs font-bold text-white hover:bg-orange-500 active:scale-95 transition-all"
                    >
                      <Trophy className="h-3.5 w-3.5" />
                      Chi tiết
                    </Link>
                  </div>
                </motion.div>
              )
            })}
          </div>
        )}
      </div>
    </section>
  )
}
