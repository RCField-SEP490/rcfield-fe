import { useQuery } from "@tanstack/react-query"
import { Calendar, MapPin, Users, Award, ShieldAlert, Trophy } from "lucide-react"
import { Link } from "react-router"

import { routePaths } from "@/app/router/route-paths"
import { contestApi, contestQueryKeys } from "@/features/contests/api/contest.api"
import {
  getContestStatusClass,
  getContestRegistrationAvailability,
  getEffectiveContestStatus,
  getRegistrationAvailabilityLabel,
} from "@/features/contests/lib/contest-status"
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

  return (
    <main className="w-full bg-[#f7f4f2] py-8">
      <section className="mx-auto max-w-6xl px-4 sm:px-6">
        <div className="mb-8 rounded-2xl border border-[#e5e2e1] bg-white px-5 py-6 shadow-sm sm:px-7">
          <div className="flex flex-col gap-5 md:flex-row md:items-end md:justify-between">
            <div className="max-w-2xl">
              <Badge className="mb-3 border-orange-200 bg-orange-50 text-orange-700 hover:bg-orange-50">
                <Trophy className="mr-1.5 size-3.5" />
              Hệ thống giải đấu
            </Badge>
              <h1 className="text-2xl font-black text-[#1f2424] sm:text-3xl">
              Đấu Trường RC Field
            </h1>
              <p className="mt-3 max-w-xl text-sm font-medium leading-6 text-[#5d5f5f]">
                Chọn giải phù hợp, xem bracket và leaderboard công khai, rồi đăng ký thi đấu tại chi nhánh gần bạn.
            </p>
          </div>
            <div className="grid grid-cols-3 gap-2 text-center">
              <SummaryStat label="Giải" value={String(contests.length)} />
              <SummaryStat
                label="Đang mở"
                value={String(contests.filter((item) => getContestRegistrationAvailability(item) === "AVAILABLE").length)}
              />
              <SummaryStat
                label="Live"
                value={String(contests.filter((item) => getEffectiveContestStatus(item) === "RUNNING").length)}
              />
            </div>
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
              const effectiveStatus = getEffectiveContestStatus(contest)
              const registrationAvailability = getContestRegistrationAvailability(contest)
              const statusClass = getContestStatusClass(effectiveStatus)
              const statusLabel = getRegistrationAvailabilityLabel(registrationAvailability)
              const hasBanner = Boolean(contest.banner_image_url)

              return (
                <Link
                  key={contest.id}
                  to={routePaths.contestDetail.replace(":contestId", contest.id)}
                  className="group relative flex flex-col overflow-hidden rounded-2xl border border-[#e5e2e1] bg-white shadow-sm transition-all duration-300 hover:-translate-y-1 hover:border-orange-200 hover:shadow-md"
                >
                  <div className="relative h-32 overflow-hidden bg-[#1f2424]">
                    {hasBanner ? (
                      <img
                        src={contest.banner_image_url!}
                        alt={contest.name}
                        className="h-full w-full object-cover transition duration-500 group-hover:scale-[1.04]"
                      />
                    ) : (
                      <div className="h-full w-full bg-[linear-gradient(135deg,#1f2424,#3f3027_54%,#c45a1a)]" />
                    )}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-black/10 to-transparent" />
                    <div className="absolute left-4 right-4 top-4 flex items-center justify-between gap-2">
                      <span className="inline-flex items-center rounded-full bg-white/90 px-2.5 py-1 text-[10px] font-black uppercase text-[#3b3f40] shadow-sm">
                        {contest.contest_format?.name || "Standard"}
                      </span>
                      <span className={`inline-flex items-center rounded-full border px-2.5 py-1 text-[10px] font-black shadow-sm ${statusClass}`}>
                        {statusLabel}
                      </span>
                    </div>
                    <div className="absolute bottom-4 left-4 right-4 flex items-center gap-1.5 text-white">
                      <Award className="size-4 shrink-0" />
                      <span className="truncate text-xs font-black">
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
                    <div className="mt-4 rounded-full bg-[#1f2424] px-4 py-2.5 text-center text-xs font-black text-white transition group-hover:bg-orange-600">
                      {registrationAvailability === "AVAILABLE"
                        ? "Xem chi tiết và đăng ký"
                        : registrationAvailability === "NOT_OPEN_YET"
                          ? "Xem lịch mở đăng ký"
                        : effectiveStatus === "RUNNING"
                          ? "Xem bracket live"
                          : effectiveStatus === "COMPLETED"
                            ? "Xem leaderboard"
                            : "Xem chi tiết"}
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

function SummaryStat({ label, value }: { label: string; value: string }) {
  return (
    <div className="min-w-20 rounded-xl border border-[#e5e2e1] bg-[#f7f4f2] px-3 py-2">
      <p className="text-base font-black text-[#1f2424]">{value}</p>
      <p className="text-[10px] font-bold uppercase tracking-wide text-[#747878]">{label}</p>
    </div>
  )
}
