import { CalendarClock, MapPinned, Timer, Users } from "lucide-react"

import { formatContestDateTime } from "@/features/contests/lib/contest-runtime"
import type { ContestItem } from "@/features/contests/types"
import { Card } from "@/shared/ui/card"

import { getVehiclePolicyLabel } from "../utils"
import { FactStrip, Info } from "./DetailPrimitives"

export function ContestSummaryCards({ contest }: { contest: ContestItem }) {
  const publicStats = contest.public_stats

  return (
    <>
      <Card className="rounded-3xl border border-slate-200/80 p-6 sm:p-8 shadow-sm">
        <h3 className="text-sm font-bold uppercase tracking-wider text-slate-400">
          Thông số chi tiết
        </h3>
        <div className="mt-4 grid gap-4 sm:grid-cols-2">
          <Info
            label="Chi nhánh tổ chức"
            value={contest.host_branch?.cafe?.name ?? "--"}
          />
          <Info label="Loại đường đua" value={contest.track_type?.name ?? "--"} />
          <Info
            label="Mở đăng ký"
            value={formatContestDateTime(contest.registration_opens_at)}
          />
          <Info
            label="Luật sử dụng xe"
            value={getVehiclePolicyLabel(
              contest.vehicle_rule?.vehicle_policy as string,
            )}
          />
          <Info
            label="Hạn chót đăng ký"
            value={formatContestDateTime(contest.registration_closes_at)}
          />
          <Info
            label="Thời gian bắt đầu"
            value={formatContestDateTime(contest.starts_at)}
          />
        </div>
      </Card>

      <Card className="rounded-3xl border border-slate-200/80 p-6 sm:p-8 shadow-sm">
        <h3 className="text-sm font-bold uppercase tracking-wider text-slate-400">
          Tổng quan tham gia
        </h3>
        <div className="mt-4 grid gap-4 sm:grid-cols-3">
          <Info
            label="Đã đăng ký"
            value={String(publicStats?.registration_count ?? 0)}
          />
          <Info
            label="Đã xác nhận"
            value={String(publicStats?.confirmed_count ?? 0)}
          />
          <Info
            label="Còn chỗ"
            value={
              publicStats?.capacity_remaining === null ||
              publicStats?.capacity_remaining === undefined
                ? "--"
                : String(publicStats.capacity_remaining)
            }
          />
        </div>
        <div className="mt-4 grid gap-3 sm:grid-cols-3">
          <FactStrip
            icon={<Users className="size-4" />}
            label="Hình thức"
            value={contest.contest_format?.name ?? "--"}
          />
          <FactStrip
            icon={<Timer className="size-4" />}
            label="Track type"
            value={contest.track_type?.name ?? "--"}
          />
          <FactStrip
            icon={<MapPinned className="size-4" />}
            label="Điểm thi đấu"
            value={String(contest.participating_branches.length)}
          />
        </div>
      </Card>
    </>
  )
}

export function ContestPrizeAndBranches({
  contest,
  prizeItems,
}: {
  contest: ContestItem
  prizeItems: Array<Record<string, unknown>>
}) {
  return (
    <Card className="rounded-3xl border border-slate-200/80 p-6 sm:p-8 shadow-sm">
      <h3 className="text-sm font-bold uppercase tracking-wider text-slate-400">
        Giải thưởng & địa điểm thi đấu
      </h3>
      <div className="mt-4 grid gap-6 lg:grid-cols-[0.9fr_1.1fr]">
        <div className="space-y-3">
          {prizeItems.length > 0 ? (
            prizeItems.map((item, index) => (
              <div
                key={`${index}-${String(item.position ?? item.rank ?? "prize")}`}
                className="rounded-2xl border border-orange-100 bg-orange-50/40 p-4"
              >
                <p className="text-xs font-bold uppercase tracking-wide text-orange-700">
                  {String(item.position ?? item.rank ?? `Top ${index + 1}`)}
                </p>
                <p className="mt-1 text-sm font-extrabold text-slate-900">
                  {String(
                    item.label ??
                      item.reward ??
                      item.prize ??
                      "Giải thưởng công bố trong điều lệ",
                  )}
                </p>
                {item.note ? (
                  <p className="mt-1 text-xs text-slate-500">
                    {String(item.note)}
                  </p>
                ) : null}
              </div>
            ))
          ) : (
            <div className="rounded-2xl border border-dashed border-slate-200 p-4 text-sm text-slate-500">
              Giải thưởng chưa được cấu hình chi tiết trên contest này.
            </div>
          )}
        </div>
        <div className="space-y-3">
          {contest.participating_branches.map((branch) => (
            <div
              key={branch.id}
              className="rounded-2xl border border-slate-200 bg-slate-50/50 p-4"
            >
              <p className="font-bold text-slate-900">
                {branch.cafe?.name ?? branch.cafe_id}
              </p>
              <p className="mt-1 text-sm text-slate-500">
                {branch.cafe?.district}, {branch.cafe?.city}
              </p>
              <p className="mt-2 text-xs font-semibold text-slate-500">
                Vai trò: {branch.role} · Check-in{" "}
                {branch.check_in_enabled ? "bật" : "tắt"}
              </p>
            </div>
          ))}
        </div>
      </div>
    </Card>
  )
}

export function ContestTimeline({ contest }: { contest: ContestItem }) {
  const timeline = [
    {
      label: "Mở đăng ký",
      value: formatContestDateTime(contest.registration_opens_at),
    },
    {
      label: "Đóng đăng ký",
      value: formatContestDateTime(contest.registration_closes_at),
    },
    {
      label: "Bắt đầu thi đấu",
      value: formatContestDateTime(contest.starts_at),
    },
    {
      label: "Kết thúc dự kiến",
      value: formatContestDateTime(contest.ends_at),
    },
  ]

  return (
    <Card className="rounded-3xl border border-slate-200/80 p-6 sm:p-8 shadow-sm">
      <div className="flex items-center gap-2">
        <CalendarClock className="size-5 text-orange-500" />
        <h3 className="text-lg font-extrabold text-slate-900">
          Hành trình giải đấu
        </h3>
      </div>
      <div className="mt-5 grid gap-3 sm:grid-cols-2">
        {timeline.map((item) => (
          <div
            key={item.label}
            className="rounded-2xl border border-slate-200 bg-slate-50/50 p-4"
          >
            <p className="text-[11px] font-bold uppercase tracking-wide text-slate-400">
              {item.label}
            </p>
            <p className="mt-1 text-sm font-extrabold text-slate-900">
              {item.value}
            </p>
          </div>
        ))}
      </div>
    </Card>
  )
}
