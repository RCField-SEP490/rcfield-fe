import { ArrowRight, Calendar, Trophy, Users } from "lucide-react"
import { Link } from "react-router"

import { routePaths } from "@/app/router/route-paths"
import {
  getContestRegistrationAvailability,
  getEffectiveContestStatus,
  getRegistrationAvailabilityLabel,
} from "@/features/contests/lib/contest-status"
import type { ContestItem } from "@/features/contests/types"
import { cn } from "@/shared/lib/utils"

interface ContestDiscoveryRailProps {
  contests: ContestItem[]
  className?: string
}

export function ContestDiscoveryRail({ contests, className }: ContestDiscoveryRailProps) {
  if (contests.length === 0) return null

  const featured = contests[0]
  const featuredAvailability = getContestRegistrationAvailability(featured)
  const featuredStatus = getEffectiveContestStatus(featured)
  const capacityRemaining = featured.public_stats?.capacity_remaining

  const featuredDetailPath = routePaths.contestDetail.replace(":contestId", featured.id)

  return (
    <section
      className={cn(
        "mb-5 overflow-hidden rounded-2xl border border-border bg-card shadow-sm",
        className,
      )}
    >
      <div className="grid md:grid-cols-[1.15fr_0.85fr]">
        <Link
          to={featuredDetailPath}
          className="group relative min-h-[190px] overflow-hidden text-left"
        >
          {featured.banner_image_url ? (
            <img
              src={featured.banner_image_url}
              alt={featured.name}
              className="absolute inset-0 h-full w-full object-cover transition duration-500 group-hover:scale-[1.03]"
            />
          ) : (
            <div className="contest-hero-gradient absolute inset-0" />
          )}
          <div className="absolute inset-0 bg-gradient-to-r from-black/85 via-black/40 to-black/10" />
          <div className="relative flex min-h-[190px] flex-col justify-between p-5 text-white">
            <div className="flex flex-wrap gap-2">
              <span className="inline-flex items-center gap-1.5 rounded-full border border-white/20 bg-white/15 px-3 py-1 text-[11px] font-black backdrop-blur">
                <Trophy className="size-3.5 text-brand-amber" />
                Góc giải đấu
              </span>
              <span
                className={cn(
                  "rounded-full border border-white/20 px-3 py-1 text-[11px] font-black backdrop-blur",
                  featuredStatus === "RUNNING"
                    ? "bg-red-500/90 text-white live-pulse-dot pl-5"
                    : "bg-white/90 text-foreground",
                )}
              >
                {getRegistrationAvailabilityLabel(featuredAvailability)}
              </span>
            </div>
            <div>
              <p className="text-[11px] font-black uppercase tracking-[0.2em] text-brand-amber">
                {featured.contest_format?.name ?? "RC Contest"}
              </p>
              <h3 className="mt-2 line-clamp-2 max-w-xl text-2xl font-black leading-tight">
                {featured.name}
              </h3>
              <div className="mt-4 flex flex-wrap gap-3 text-xs font-bold text-slate-100">
                <span className="inline-flex items-center gap-1.5">
                  <Calendar className="size-3.5" />
                  {formatRailDate(featured.starts_at)}
                </span>
                <span className="inline-flex items-center gap-1.5">
                  <Users className="size-3.5" />
                  {capacityRemaining === null || capacityRemaining === undefined
                    ? `${featured.public_stats?.registration_count ?? 0} đăng ký`
                    : `Còn ${capacityRemaining} chỗ`}
                </span>
              </div>
            </div>
          </div>
        </Link>

        <div className="flex flex-col justify-between gap-4 p-5">
          <div>
            <p className="text-xs font-black uppercase tracking-[0.18em] text-primary">
              Thi đấu cùng cộng đồng
            </p>
            <p className="mt-2 text-sm font-semibold leading-6 text-muted-foreground">
              Xem giải đang mở đăng ký, bracket live và leaderboard đã công bố ngay trong RCField.
            </p>
          </div>

          <div className="space-y-2">
            {contests.slice(1).map((contest) => {
              const itemAvailability = getContestRegistrationAvailability(contest)
              return (
                <Link
                  key={contest.id}
                  to={routePaths.contestDetail.replace(":contestId", contest.id)}
                  className="flex w-full items-center justify-between gap-3 rounded-xl border border-border bg-muted px-3 py-2 text-left transition hover:border-primary/30 hover:bg-primary/5"
                >
                  <span className="min-w-0">
                    <span className="block truncate text-xs font-black text-foreground">
                      {contest.name}
                    </span>
                    <span className="text-[11px] font-bold text-muted-foreground">
                      {getRegistrationAvailabilityLabel(itemAvailability)}
                    </span>
                  </span>
                  <ArrowRight className="size-4 shrink-0 text-primary" />
                </Link>
              )
            })}
          </div>

          <Link
            to={routePaths.contests}
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-foreground px-4 py-3 text-sm font-black text-background transition hover:bg-primary"
          >
            Xem tất cả giải đấu
            <ArrowRight className="size-4" />
          </Link>
        </div>
      </div>
      {featuredStatus === "RUNNING" ? (
        <div className="border-t border-primary/10 bg-primary/5 px-5 py-3 text-xs font-bold text-primary">
          Có giải đang diễn ra. Vào chi tiết để xem bracket live và người đã vào vòng trong.
        </div>
      ) : null}
    </section>
  )
}

function formatRailDate(value: string | null) {
  if (!value) return "Đang cập nhật"
  return new Date(value).toLocaleString("vi-VN", {
    day: "2-digit",
    month: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  })
}
