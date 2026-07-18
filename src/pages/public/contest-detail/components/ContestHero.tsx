import { formatContestDateTime } from "@/features/contests/lib/contest-runtime"
import {
  getContestStatusClass,
  getContestStatusLabel,
} from "@/features/contests/lib/contest-status"
import type { ContestItem } from "@/features/contests/types"

import { formatCurrency } from "../utils"

export function ContestHero({
  contest,
  effectiveStatus,
}: {
  contest: ContestItem
  effectiveStatus: ContestItem["status"]
}) {
  const statusClass = getContestStatusClass(effectiveStatus)

  return (
    <section className="overflow-hidden rounded-2xl border border-[#e5e2e1] bg-white shadow-sm">
      <div className="relative min-h-[340px] overflow-hidden bg-[#1f2424] p-6 text-white sm:p-8 lg:p-10">
        {contest.banner_image_url ? (
          <img
            src={contest.banner_image_url}
            alt={contest.name}
            className="absolute inset-0 h-full w-full object-cover"
          />
        ) : null}
        <div className="absolute inset-0 bg-[linear-gradient(90deg,rgba(31,36,36,0.94),rgba(31,36,36,0.72)_56%,rgba(196,90,26,0.38))]" />
        <div className="relative z-10 flex min-h-[292px] flex-col justify-between">
          <div className="flex flex-wrap items-center gap-3">
            <span className="inline-flex items-center rounded-full border border-white/20 bg-white/10 px-3 py-1 text-xs font-bold uppercase tracking-wider text-orange-100 backdrop-blur">
              {contest.contest_type?.name ?? "Giải đấu"} ·{" "}
              {contest.contest_format?.name ?? "Standard"}
            </span>
            <span
              className={`rounded-full border px-3 py-1 text-xs font-semibold ${statusClass}`}
            >
              {getContestStatusLabel(effectiveStatus)}
            </span>
          </div>
          <div className="max-w-4xl">
            <h1 className="mt-8 text-3xl font-black leading-tight sm:text-5xl">
              {contest.name}
            </h1>
            <p className="mt-4 max-w-2xl whitespace-pre-line text-sm font-medium leading-7 text-slate-200">
              {contest.description || "Xem thể thức, lịch thi đấu, bracket và bảng xếp hạng công khai của giải."}
            </p>
          </div>
          <div className="mt-7 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <HeroFact
              label="Chi nhánh tổ chức"
              value={contest.host_branch?.cafe?.name ?? "--"}
            />
            <HeroFact
              label="Bắt đầu"
              value={formatContestDateTime(contest.starts_at)}
            />
            <HeroFact label="Lệ phí" value={formatCurrency(contest.entry_fee)} />
            <HeroFact
              label="Sức chứa"
              value={
                contest.capacity === null ? "Không giới hạn" : `${contest.capacity}`
              }
            />
          </div>
        </div>
      </div>
    </section>
  )
}

function HeroFact({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-white/10 bg-white/10 p-4 backdrop-blur-sm">
      <p className="text-xs font-bold uppercase tracking-wider text-orange-100/80">
        {label}
      </p>
      <p className="mt-2 text-sm font-bold text-white">{value}</p>
    </div>
  )
}
