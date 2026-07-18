import { useMemo, type ReactNode } from "react"
import { useQuery } from "@tanstack/react-query"
import { ArrowRight, Calendar, MapPin, Users, Award, ShieldAlert, Trophy } from "lucide-react"
import { Link } from "react-router"

import { routePaths } from "@/app/router/route-paths"
import { contestApi, contestQueryKeys } from "@/features/contests/api/contest.api"
import { ContestAvailabilityBadge } from "@/features/contests/components"
import {
  getContestCtaLabel,
  getContestRegistrationAvailability,
  getEffectiveContestStatus,
  type ContestRegistrationAvailability,
} from "@/features/contests/lib/contest-status"
import type { ContestItem } from "@/features/contests/types"
import { Badge } from "@/shared/ui/badge"
import { EmptyState } from "@/shared/ui/empty-state"
import { CardListSkeleton } from "@/shared/ui/loading-state"

export function PublicContestsPage() {
  const contestsQuery = useQuery({
    queryKey: contestQueryKeys.list({ public: true }),
    queryFn: () => contestApi.listContests({ limit: 100 }),
  })

  const contests = useMemo(
    () => contestsQuery.data?.data ?? [],
    [contestsQuery.data?.data],
  )
  const rankedContests = useMemo(() => rankContestsForDiscovery(contests), [contests])
  const featuredContest = rankedContests[0] ?? null
  const secondaryContests = rankedContests.slice(1)

  return (
    <main className="w-full bg-[#f7f4f2] py-8">
      <section className="mx-auto max-w-6xl px-4 sm:px-6">
        <div className="mb-6 rounded-2xl border border-[#e5e2e1] bg-white px-5 py-6 shadow-sm sm:px-7">
          <div className="flex flex-col gap-5 md:flex-row md:items-center md:justify-between">
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

        {contestsQuery.isLoading ? (
          <CardListSkeleton
            count={3}
            className="grid gap-6 space-y-0 md:grid-cols-2 lg:grid-cols-3"
            itemClassName="h-96 rounded-2xl"
          />
        ) : contests.length === 0 ? (
          <EmptyState
            icon={ShieldAlert}
            title="Chưa có giải đấu công khai"
            description="Hiện tại các giải đấu đang được chuẩn bị. Vui lòng quay lại sau để cập nhật thông tin mới nhất."
            className="rounded-3xl border-2 border-slate-200 bg-white p-16 shadow-sm"
          />
        ) : featuredContest ? (
          <div className="space-y-6">
            <FeaturedContestShowcase contest={featuredContest} />

            <div className="flex flex-wrap items-end justify-between gap-3">
              <div>
                <h2 className="text-lg font-black text-[#1f2424]">Tất cả giải đấu</h2>
                <p className="text-sm font-medium text-[#747878]">
                  Ưu tiên giải đang live, đang mở đăng ký và sắp mở để người chơi không bỏ lỡ mốc quan trọng.
                </p>
              </div>
            </div>

            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {secondaryContests.map((contest) => (
                <ContestListCard key={contest.id} contest={contest} />
              ))}
            </div>
          </div>
        ) : null}
      </section>
    </main>
  )
}

function FeaturedContestShowcase({ contest }: { contest: ContestItem }) {
  const effectiveStatus = getEffectiveContestStatus(contest)
  const registrationAvailability = getContestRegistrationAvailability(contest)
  const capacityLabel = getCapacityLabel(contest)

  return (
    <Link
      to={routePaths.contestDetail.replace(":contestId", contest.id)}
      className="group grid overflow-hidden rounded-2xl border border-[#e5e2e1] bg-white shadow-sm transition hover:border-orange-200 hover:shadow-md lg:grid-cols-[1.35fr_0.85fr]"
    >
      <div className="relative min-h-[320px] overflow-hidden bg-[#1f2424]">
        {contest.banner_image_url ? (
          <img
            src={contest.banner_image_url}
            alt={contest.name}
            className="absolute inset-0 h-full w-full object-cover transition duration-500 group-hover:scale-[1.03]"
          />
        ) : (
          <div className="absolute inset-0 bg-[linear-gradient(135deg,#1f2424,#3f3027_54%,#c45a1a)]" />
        )}
        <div className="absolute inset-0 bg-gradient-to-r from-black/85 via-black/45 to-black/10" />
        <div className="relative flex min-h-[320px] flex-col justify-between p-6 text-white sm:p-8">
          <div className="flex flex-wrap gap-2">
            <ContestAvailabilityBadge
              contest={contest}
              className="rounded-full px-3 py-1 text-[11px] font-black shadow-sm"
            />
            {effectiveStatus === "RUNNING" ? (
              <span className="rounded-full border border-white/20 bg-white/15 px-3 py-1 text-[11px] font-black text-white backdrop-blur">
                Bracket live
              </span>
            ) : null}
          </div>
          <div className="max-w-2xl">
            <p className="text-xs font-black uppercase tracking-[0.22em] text-orange-200">
              {contest.contest_format?.name ?? "RC Contest"} · {contest.track_type?.name ?? "Track"}
            </p>
            <h2 className="mt-3 text-3xl font-black leading-tight sm:text-4xl">
              {contest.name}
            </h2>
            <p className="mt-4 line-clamp-2 text-sm font-medium leading-7 text-slate-200">
              {contest.description ?? "Theo dõi lịch thi đấu, bracket và bảng xếp hạng của cộng đồng RCField."}
            </p>
          </div>
        </div>
      </div>

      <div className="flex flex-col justify-between gap-5 p-6">
        <div className="grid grid-cols-2 gap-3">
          <InfoTile label="Đăng ký" value={String(contest.public_stats?.registration_count ?? 0)} />
          <InfoTile label="Còn chỗ" value={capacityLabel} />
          <InfoTile label="Bắt đầu" value={formatDateTime(contest.starts_at)} />
          <InfoTile label="Lệ phí" value={formatCurrency(contest.entry_fee)} />
        </div>
        <div className="rounded-xl border border-orange-100 bg-orange-50 px-4 py-3 text-sm font-bold text-orange-800">
          {getContestHint(registrationAvailability, effectiveStatus)}
        </div>
        <div className="inline-flex items-center justify-center gap-2 rounded-xl bg-[#1f2424] px-4 py-3 text-sm font-black text-white transition group-hover:bg-orange-600">
          {getContestCtaLabel(registrationAvailability, effectiveStatus)}
          <ArrowRight className="size-4" />
        </div>
      </div>
    </Link>
  )
}

function ContestListCard({ contest }: { contest: ContestItem }) {
  const effectiveStatus = getEffectiveContestStatus(contest)
  const registrationAvailability = getContestRegistrationAvailability(contest)

  return (
    <Link
      to={routePaths.contestDetail.replace(":contestId", contest.id)}
      className="group flex min-h-full flex-col overflow-hidden rounded-2xl border border-[#e5e2e1] bg-white shadow-sm transition hover:-translate-y-1 hover:border-orange-200 hover:shadow-md"
    >
      <div className="relative h-36 overflow-hidden bg-[#1f2424]">
        {contest.banner_image_url ? (
          <img
            src={contest.banner_image_url}
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
          <ContestAvailabilityBadge
            contest={contest}
            className="rounded-full px-2.5 py-1 text-[10px] font-black shadow-sm"
          />
        </div>
        <div className="absolute bottom-4 left-4 right-4 flex items-center gap-1.5 text-white">
          <Award className="size-4 shrink-0" />
          <span className="truncate text-xs font-black">
            {contest.contest_type?.name || "Tự do"}
          </span>
        </div>
      </div>

      <div className="flex flex-1 flex-col p-5">
        <h3 className="line-clamp-2 text-lg font-black text-[#1f2424] transition group-hover:text-orange-600">
          {contest.name}
        </h3>
        <p className="mt-2 line-clamp-2 min-h-10 text-sm font-medium leading-5 text-[#5d5f5f]">
          {contest.description || "Xem thể thức, lịch thi đấu, bracket và kết quả công bố."}
        </p>

        <div className="mt-5 grid gap-2 text-xs font-bold text-[#5d5f5f]">
          <MetaLine icon={<MapPin className="size-4 text-red-500" />} value={contest.host_branch?.cafe?.name || "Tất cả chi nhánh"} />
          <MetaLine icon={<Calendar className="size-4 text-[#747878]" />} value={`Bắt đầu ${formatDateTime(contest.starts_at)}`} />
          <MetaLine icon={<Users className="size-4 text-[#747878]" />} value={`${contest.public_stats?.registration_count ?? 0} đăng ký · ${getCapacityLabel(contest)}`} />
        </div>

        <div className="mt-auto pt-5">
          <div className="flex items-center justify-between border-t border-slate-100 pt-4">
            <span className="text-[10px] font-bold uppercase tracking-wide text-[#747878]">
              Lệ phí
            </span>
            <span className="text-sm font-black text-orange-600">
              {formatCurrency(contest.entry_fee)}
            </span>
          </div>
          <div className="mt-4 rounded-full bg-[#1f2424] px-4 py-2.5 text-center text-xs font-black text-white transition group-hover:bg-orange-600">
            {getContestCtaLabel(registrationAvailability, effectiveStatus)}
          </div>
        </div>
      </div>
    </Link>
  )
}

function InfoTile({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-[#e5e2e1] bg-[#f7f4f2] p-3">
      <p className="text-[10px] font-bold uppercase tracking-wide text-[#747878]">{label}</p>
      <p className="mt-1 text-sm font-black text-[#1f2424]">{value}</p>
    </div>
  )
}

function MetaLine({ icon, value }: { icon: ReactNode; value: string }) {
  return (
    <div className="flex items-center gap-2">
      <span className="shrink-0">{icon}</span>
      <span className="truncate">{value}</span>
    </div>
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

function rankContestsForDiscovery(contests: ContestItem[]) {
  const score = (contest: ContestItem) => {
    const effectiveStatus = getEffectiveContestStatus(contest)
    const availability = getContestRegistrationAvailability(contest)
    if (effectiveStatus === "RUNNING") return 0
    if (availability === "AVAILABLE") return 1
    if (availability === "NOT_OPEN_YET") return 2
    if (effectiveStatus === "COMPLETED") return 3
    return 4
  }

  return [...contests].sort((a, b) => {
    const statusDiff = score(a) - score(b)
    if (statusDiff !== 0) return statusDiff
    return new Date(a.starts_at).getTime() - new Date(b.starts_at).getTime()
  })
}

function getCapacityLabel(contest: ContestItem) {
  const remaining = contest.public_stats?.capacity_remaining
  if (remaining !== null && remaining !== undefined) return `${remaining} chỗ`
  if (contest.capacity) return `${contest.capacity} suất`
  return "Mở"
}

function formatDateTime(value: string | null) {
  if (!value) return "--"
  return new Date(value).toLocaleString("vi-VN", {
    dateStyle: "short",
    timeStyle: "short",
  })
}

function formatCurrency(value: number) {
  if (value === 0) return "Miễn phí"
  return new Intl.NumberFormat("vi-VN", {
    style: "currency",
    currency: "VND",
    maximumFractionDigits: 0,
  }).format(value)
}

function getContestHint(
  availability: ContestRegistrationAvailability,
  status: ContestItem["status"],
) {
  if (availability === "AVAILABLE") {
    return "Đang nhận đăng ký. Kiểm tra điều kiện xe, booking phù hợp và giữ chỗ trước khi hết suất."
  }
  if (availability === "NOT_OPEN_YET") {
    return "Sắp mở đăng ký. Xem trước thể thức, chi nhánh và chuẩn bị booking phù hợp."
  }
  if (status === "RUNNING") {
    return "Giải đang diễn ra. Vào chi tiết để xem bracket live và người đã vào vòng trong."
  }
  if (status === "COMPLETED") {
    return "Giải đã kết thúc. Xem leaderboard và hành trình thi đấu đã công bố."
  }
  return "Xem thông tin chi tiết và các mốc vận hành của giải."
}
