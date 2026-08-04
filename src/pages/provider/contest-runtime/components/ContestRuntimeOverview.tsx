import type {
  ContestItem,
  ContestMatch,
  ContestMetrics,
  ContestRegistration,
} from "@/features/contests/types"
import {
  formatContestDateTime,
  getContestRuntimeFormat,
  getEligibleRuntimeRegistrations,
} from "@/features/contests/lib/contest-runtime"
import {
  getContestFormatLabel,
  getContestStatusLabel,
} from "@/features/contests/lib/contest-status"
import {
  Panel,
  PanelTitle,
} from "@/pages/provider/components/ProviderPrimitives"
import { Badge } from "@/shared/ui/badge"

export function ContestRuntimeOverview({
  contest,
  registrations,
  matches,
  metrics,
}: {
  contest: ContestItem
  registrations: ContestRegistration[]
  matches: ContestMatch[]
  metrics: ContestMetrics | undefined
}) {
  const eligibleRegistrations = getEligibleRuntimeRegistrations(registrations)
  const runtimeFormat = getContestRuntimeFormat(contest)
  const finalists = contest.config?.finalists

  return (
    <div className="grid gap-4 xl:grid-cols-[1.2fr_0.8fr]">
      <Panel>
        <PanelTitle
          title="Tóm tắt giải đấu"
          subtitle="Thông tin giải đấu và các tham số vận hành đang áp dụng."
        />
        <div className="grid gap-4 md:grid-cols-2">
          {/* Trạng thái chuyển về đây từ header: nó thuộc về phần thông tin
              giải, không phải một nhãn treo cạnh tên. */}
          <Info
            label="Trạng thái"
            value={getContestStatusLabel(contest.status)}
          />
          <Info label="Loại giải" value={contest.contest_type?.name ?? "--"} />
          <Info
            label="Hình thức thi đấu"
            value={getContestFormatLabel(
              runtimeFormat || contest.contest_format?.code,
            )}
          />
          <Info
            label="Mẫu vận hành"
            value={contest.contest_template?.name ?? "--"}
          />
          {runtimeFormat === "QUALIFYING_FINAL" ? (
            <Info label="Số VĐV vào chung kết" value={String(finalists ?? 4)} />
          ) : null}
          <Info
            label="Chi nhánh tổ chức"
            value={contest.host_branch?.cafe?.name ?? "--"}
          />
          <Info
            label="Bắt đầu"
            value={formatContestDateTime(contest.starts_at)}
          />
          <Info
            label="Kết thúc"
            value={formatContestDateTime(contest.ends_at)}
          />
          <Info
            label="Mở đăng ký"
            value={formatContestDateTime(contest.registration_opens_at)}
          />
          <Info
            label="Đóng đăng ký"
            value={formatContestDateTime(contest.registration_closes_at)}
          />
          <Info
            label="Lệ phí tham gia"
            value={formatCurrency(contest.entry_fee)}
          />
          <Info
            label="Quy tắc xe"
            value={String(contest.vehicle_rule?.vehicle_policy ?? "--")}
          />
        </div>
      </Panel>

      <div className="space-y-4">
        <Panel>
          <PanelTitle
            title="Mức sẵn sàng vận hành"
            subtitle="Xác nhận giải đấu đã đủ dữ liệu để chuyển sang thi đấu thật."
          />
          <div className="space-y-3 text-sm font-semibold text-[#5d5f5f]">
            <StatusRow
              label="Người chơi đã điểm danh"
              value={`${eligibleRegistrations.length}/${registrations.length}`}
              good={eligibleRegistrations.length > 0}
            />
            <StatusRow
              label="Nhánh đấu đã tạo"
              value={
                matches.length > 0 ? `${matches.length} lượt/trận` : "Chưa tạo"
              }
              good={matches.length > 0}
            />
            <StatusRow
              label="Thể thức vận hành"
              value={getContestFormatLabel(
                runtimeFormat || contest.contest_format?.code,
              )}
              good
            />
            <StatusRow
              label="Bảng xếp hạng"
              value={
                metrics?.leaderboard.published ? "Đã công bố" : "Chưa công bố"
              }
              good={Boolean(metrics?.leaderboard.published)}
            />
          </div>
        </Panel>

        <Panel>
          <PanelTitle
            title="Chi nhánh tham gia"
            subtitle="Các địa điểm đang tham gia giải đấu."
          />
          <div className="space-y-2">
            {contest.participating_branches.map((branch) => (
              <div
                key={branch.id}
                className="flex items-center justify-between rounded-lg border border-[#e5e2e1] px-3 py-2"
              >
                <div>
                  <p className="text-sm font-bold text-[#1c1b1b]">
                    {branch.cafe?.name ?? branch.cafe_id}
                  </p>
                  <p className="text-xs font-semibold text-[#747878]">
                    {branch.cafe?.district}, {branch.cafe?.city}
                  </p>
                </div>
                <Badge className="border border-[#c4c7c8] bg-[#f6f3f2] text-[#444748]">
                  {branch.role}
                </Badge>
              </div>
            ))}
          </div>
        </Panel>
      </div>
    </div>
  )
}

function Info({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border border-[#e5e2e1] bg-[#fcf8f8] px-4 py-3">
      <p className="text-[11px] font-extrabold uppercase tracking-wider text-[#747878]">
        {label}
      </p>
      <p className="mt-1 text-sm font-bold text-[#1c1b1b]">{value}</p>
    </div>
  )
}

function StatusRow({
  label,
  value,
  good,
}: {
  label: string
  value: string
  good?: boolean
}) {
  return (
    <div className="flex items-center justify-between rounded-lg border border-[#e5e2e1] px-3 py-2">
      <span>{label}</span>
      <span className={good ? "text-emerald-700" : "text-amber-700"}>
        {value}
      </span>
    </div>
  )
}

function formatCurrency(value: number) {
  return new Intl.NumberFormat("vi-VN", {
    style: "currency",
    currency: "VND",
    maximumFractionDigits: 0,
  }).format(value)
}
