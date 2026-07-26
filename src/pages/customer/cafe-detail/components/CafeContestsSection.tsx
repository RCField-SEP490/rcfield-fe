import { useQuery } from "@tanstack/react-query"
import { CalendarClock, ChevronRight, Trophy } from "lucide-react"
import { Link } from "react-router"

import { routePaths } from "@/app/router/route-paths"
import { contestApi, contestQueryKeys } from "@/features/contests/api/contest.api"
import { formatContestDateTime } from "@/features/contests/lib/contest-runtime"
import type { ContestItem } from "@/features/contests/types"
import { formatCurrency } from "@/shared/lib/format"

// Chỉ render khi quán có contest đang mở đăng ký — không có thì ẩn hoàn toàn.
export function CafeContestsSection({ cafeId }: { cafeId: string }) {
  const { data } = useQuery({
    queryKey: contestQueryKeys.list({ cafe_id: cafeId, status: "OPEN", limit: 6 }),
    queryFn: () => contestApi.listCafeContests(cafeId, { status: "OPEN", limit: 6 }),
    staleTime: 60_000,
  })

  const contests = data?.data ?? []
  if (contests.length === 0) return null

  return (
    <section className="space-y-3 rounded-2xl border border-orange-100 bg-gradient-to-br from-orange-50/80 via-white to-white p-4 shadow-sm md:p-5">
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <span className="flex size-9 items-center justify-center rounded-xl bg-orange-500 text-white shadow-sm">
            <Trophy className="size-4.5" />
          </span>
          <div>
            <h2 className="text-base font-bold text-slate-900">
              Giải đấu đang mở đăng ký
            </h2>
            <p className="text-xs text-slate-500">
              Quán đang tổ chức {contests.length} giải — chưa có xe vẫn tham gia
              được, chọn &quot;Thuê xe tại quầy&quot; khi đăng ký.
            </p>
          </div>
        </div>
        <Link
          to={routePaths.contests}
          className="hidden shrink-0 text-xs font-bold text-orange-600 hover:text-orange-700 sm:block"
        >
          Xem tất cả giải
        </Link>
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        {contests.map((contest) => (
          <CafeContestCard key={contest.id} contest={contest} />
        ))}
      </div>
    </section>
  )
}

function CafeContestCard({ contest }: { contest: ContestItem }) {
  return (
    <Link
      to={routePaths.contestDetail.replace(":contestId", contest.id)}
      className="group flex items-center gap-3 rounded-xl border border-slate-200 bg-white p-3 transition hover:border-orange-300 hover:shadow-md"
    >
      {contest.banner_image_url ? (
        <img
          src={contest.banner_image_url}
          alt={contest.name}
          className="size-16 shrink-0 rounded-lg object-cover"
        />
      ) : (
        <span className="flex size-16 shrink-0 items-center justify-center rounded-lg bg-orange-100 text-orange-500">
          <Trophy className="size-6" />
        </span>
      )}

      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-extrabold text-slate-900 group-hover:text-orange-600">
          {contest.name}
        </p>
        <p className="mt-0.5 flex items-center gap-1 text-[11px] text-slate-500">
          <CalendarClock className="size-3 shrink-0" />
          <span className="truncate">
            {formatContestDateTime(contest.starts_at)}
          </span>
        </p>
        <p className="mt-0.5 text-[11px] font-semibold text-slate-600">
          {contest.contest_format?.name ?? "Thi đấu"} ·{" "}
          {contest.track_type?.name ?? "Track"} · Lệ phí{" "}
          <span className="text-orange-600">
            {contest.entry_fee > 0 ? formatCurrency(contest.entry_fee) : "Miễn phí"}
          </span>
        </p>
      </div>

      <span className="flex shrink-0 items-center gap-1 rounded-full bg-slate-900 px-3 py-1.5 text-[11px] font-bold text-white transition group-hover:bg-orange-600">
        Đăng ký
        <ChevronRight className="size-3.5" />
      </span>
    </Link>
  )
}
