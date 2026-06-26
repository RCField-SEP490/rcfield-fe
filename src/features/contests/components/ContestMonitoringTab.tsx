import { BarChart3, Activity } from "lucide-react"
import { Badge } from "@/shared/ui/badge"
import type { ContestAuditLog, ContestMetrics } from "../types"

function formatDateTime(dateStr: string) {
  try {
    const d = new Date(dateStr)
    if (isNaN(d.getTime())) return dateStr
    return d.toLocaleDateString("vi-VN", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    })
  } catch {
    return dateStr
  }
}

const EVENT_LABELS: Record<string, string> = {
  "registration.created": "Đăng ký tham gia giải đấu",
  "registration.confirmed": "Phê duyệt đăng ký tham gia",
  "registration.checked_in": "Check-in vận động viên thành công",
  "registration.cancelled": "Hủy đăng ký vận động viên",
  "match.schedule_generated": "Tạo sơ đồ nhánh đấu Knockout",
  "match.participants_updated": "Cập nhật tay đua tham gia trận đấu",
  "match.result_submitted": "Ghi nhận kết quả trận đấu Knockout",
  "match.advanced": "Vận động viên chiến thắng đi tiếp",
  "leaderboard.published": "Công bố bảng xếp hạng chung cuộc",
  "reward.created": "Thiết lập giải thưởng giải đấu",
  "reward.issued": "Phát quà / cúp cho các tay đua",
}

interface ContestMonitoringTabProps {
  metrics?: ContestMetrics
  auditLogs: ContestAuditLog[]
}

export function ContestMonitoringTab({
  metrics,
  auditLogs,
}: ContestMonitoringTabProps) {
  return (
    <div className="space-y-6">
      {/* Metrics Section */}
      <section className="space-y-6 rounded-xl border border-[#e5e2e1] bg-white p-6 shadow-sm">
        <h3 className="flex items-center gap-1.5 border-b border-[#e5e2e1] pb-3 font-bold text-[#1c1b1b]">
          <BarChart3 size={18} className="text-orange-600" /> Thống kê vận hành
        </h3>

        <div className="space-y-4">
          <div>
            <h4 className="mb-2 text-xs font-bold uppercase tracking-widest text-[#747878]">
              Thống kê Vận động viên
            </h4>
            <div className="grid grid-cols-2 gap-4 md:grid-cols-5">
              <MetricTile
                label="Tổng Đăng ký"
                value={metrics?.registration_stats?.total ?? 0}
                color="text-orange-600"
              />
              <MetricTile
                label="Đang chờ duyệt"
                value={metrics?.registration_stats?.pending ?? 0}
                color="text-amber-600"
              />
              <MetricTile
                label="Đã xác nhận"
                value={metrics?.registration_stats?.confirmed ?? 0}
                color="text-emerald-600"
              />
              <MetricTile
                label="Đã Check-in"
                value={metrics?.registration_stats?.checkedIn ?? 0}
                color="text-blue-600"
              />
              <MetricTile
                label="Đã Hủy bỏ"
                value={metrics?.registration_stats?.cancelled ?? 0}
                color="text-red-600"
              />
            </div>
          </div>

          <div className="pt-2">
            <h4 className="mb-2 text-xs font-bold uppercase tracking-widest text-[#747878]">
              Thống kê trận đấu Knockout
            </h4>
            <div className="grid grid-cols-2 gap-4 md:grid-cols-5">
              <MetricTile
                label="Tổng trận đấu"
                value={metrics?.match_stats?.total ?? 0}
                color="text-[#1c1b1b]"
              />
              <MetricTile
                label="Nháp (Draft)"
                value={metrics?.match_stats?.draft ?? 0}
                color="text-[#747878]"
              />
              <MetricTile
                label="Sẵn sàng (Ready)"
                value={metrics?.match_stats?.ready ?? 0}
                color="text-amber-600"
              />
              <MetricTile
                label="Hoàn thành"
                value={metrics?.match_stats?.completed ?? 0}
                color="text-emerald-600"
              />
              <MetricTile
                label="Bị hủy"
                value={metrics?.match_stats?.cancelled ?? 0}
                color="text-red-600"
              />
            </div>
          </div>
        </div>
      </section>

      {/* Audit Logs Section */}
      <section className="space-y-6 rounded-xl border border-[#e5e2e1] bg-white p-6 shadow-sm">
        <h3 className="flex items-center gap-1.5 border-b border-[#e5e2e1] pb-3 font-bold text-[#1c1b1b]">
          <Activity size={18} className="text-orange-600" /> Lịch sử thay đổi
          hệ thống (Audit Logs)
        </h3>

        {auditLogs.length === 0 ? (
          <div className="py-8 text-center text-sm text-[#747878]">
            Không tìm thấy nhật ký thay đổi nào cho giải đấu này.
          </div>
        ) : (
          <div className="relative ml-2 space-y-6 border-l-2 border-[#e5e2e1] pl-6">
            {auditLogs.map((log) => {
              const eventLabel = EVENT_LABELS[log.eventType] ?? log.eventType
              const isRegistration = log.eventType.startsWith("registration")
              const isMatch = log.eventType.startsWith("match")
              const isReward = log.eventType.startsWith("reward")

              const dotColor = isRegistration
                ? "border-blue-500"
                : isMatch
                  ? "border-orange-500"
                  : isReward
                    ? "border-emerald-500"
                    : "border-[#c4c7c8]"

              return (
                <div key={log.id} className="relative">
                  {/* Timeline dot */}
                  <span
                    className={`absolute -left-[31px] top-1.5 h-4 w-4 rounded-full border-2 bg-white ${dotColor}`}
                  />

                  <div className="space-y-2 rounded-xl border border-[#e5e2e1] bg-[#fcf8f8] p-4 transition-all hover:border-[#c4c7c8]">
                    <div className="flex flex-col items-start justify-between gap-2 sm:flex-row sm:items-center">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-extrabold text-[#1c1b1b]">
                          {eventLabel}
                        </span>
                        <Badge
                          variant="secondary"
                          className="border border-[#e5e2e1] bg-white px-1 py-0 text-[9px] font-bold uppercase tracking-wider text-[#747878]"
                        >
                          {log.eventType}
                        </Badge>
                      </div>
                      <span className="text-[10px] text-[#747878]">
                        {formatDateTime(log.createdAt)}
                      </span>
                    </div>

                    <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-[#6f6c6a]">
                      <div>
                        Tác nhân:{" "}
                        <span className="font-bold text-[#444748]">
                          {log.actorRole || "N/A"}
                        </span>
                      </div>
                      {log.reason && (
                        <div>
                          Lý do:{" "}
                          <span className="font-semibold text-red-600">
                            &quot;{log.reason}&quot;
                          </span>
                        </div>
                      )}
                    </div>

                    {log.metadata &&
                      Object.keys(log.metadata).length > 0 && (
                        <div className="overflow-x-auto rounded-lg border border-[#e5e2e1] bg-white p-2.5 font-mono text-[10px] text-[#6f6c6a]">
                          <span className="mb-1 block text-[9px] font-bold uppercase tracking-wider text-[#747878]">
                            Dữ liệu sự kiện:
                          </span>
                          {JSON.stringify(log.metadata, null, 2)}
                        </div>
                      )}
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </section>
    </div>
  )
}

function MetricTile({
  label,
  value,
  color,
}: {
  label: string
  value: number
  color: string
}) {
  return (
    <div className="flex flex-col justify-between rounded-xl border border-[#e5e2e1] bg-[#fcf8f8] p-4">
      <span className="text-[10px] font-bold uppercase tracking-wider text-[#747878]">
        {label}
      </span>
      <span className={`mt-2 text-2xl font-extrabold ${color}`}>{value}</span>
    </div>
  )
}
