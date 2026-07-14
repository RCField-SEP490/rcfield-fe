import { useMemo, useState } from "react"
import type { ContestAuditLogItem } from "@/features/contests/types"
import { getAuditGroup } from "@/features/contests/lib/contest-runtime"
import { Panel, PanelTitle } from "@/pages/provider/components/ProviderPrimitives"

export function ContestAuditPanel({ logs }: { logs: ContestAuditLogItem[] }) {
  const [filter, setFilter] = useState<"all" | "contest" | "registration" | "match">("all")
  const [expandedLogId, setExpandedLogId] = useState<string | null>(null)

  const filteredLogs = useMemo(() => {
    return filter === "all" ? logs : logs.filter((log) => getAuditGroup(log) === filter)
  }, [filter, logs])

  return (
    <Panel>
      <PanelTitle title="Nhật ký thao tác" subtitle="Theo dõi mọi thay đổi phát sinh trong quá trình vận hành giải đấu." />

      <div className="mb-4 flex flex-wrap gap-2">
        {(["all", "contest", "registration", "match"] as const).map((value) => (
          <button
            key={value}
            type="button"
            onClick={() => setFilter(value)}
            className={`rounded-lg border px-3 py-2 text-sm font-bold ${
              filter === value
                ? "border-orange-200 bg-orange-50 text-orange-700"
                : "border-[#e5e2e1] bg-white text-[#5d5f5f] hover:bg-[#fcf8f8]"
            }`}
          >
            {value === "all" ? "Tất cả" : value === "contest" ? "Giải đấu" : value === "registration" ? "Đăng ký" : "Trận đấu"}
          </button>
        ))}
      </div>

      <div className="space-y-3">
        {filteredLogs.map((log) => (
          <article key={log.id} className="rounded-lg border border-[#e5e2e1] p-4">
            <div className="flex flex-col gap-2 lg:flex-row lg:items-start lg:justify-between">
              <div className="min-w-0 flex-1">
                <p className="text-sm font-extrabold text-[#1c1b1b]">{log.eventType}</p>
                <div className="mt-1 flex flex-wrap gap-x-4 gap-y-1 text-xs font-semibold text-[#747878]">
                  <span>{new Date(log.createdAt).toLocaleString("vi-VN")}</span>
                  <span>{log.actorRole ?? "--"}</span>
                  <span>{log.matchId ? `match ${log.matchId.slice(0, 8)}` : "--"}</span>
                  <span>{log.registrationId ? `registration ${log.registrationId.slice(0, 8)}` : "--"}</span>
                </div>
                {log.reason ? <p className="mt-2 text-sm font-semibold text-[#5d5f5f]">{log.reason}</p> : null}
              </div>
              <button
                type="button"
                onClick={() => setExpandedLogId((current) => (current === log.id ? null : log.id))}
                className="text-sm font-bold text-orange-700"
              >
                {expandedLogId === log.id ? "Ẩn JSON" : "Xem JSON"}
              </button>
            </div>
            {expandedLogId === log.id ? (
              <div className="mt-3 grid gap-3 xl:grid-cols-2">
                <pre className="overflow-x-auto rounded-lg bg-[#fcf8f8] p-3 text-xs text-[#444748]">
                  {JSON.stringify(log.beforeJson ?? {}, null, 2)}
                </pre>
                <pre className="overflow-x-auto rounded-lg bg-[#fcf8f8] p-3 text-xs text-[#444748]">
                  {JSON.stringify(log.afterJson ?? {}, null, 2)}
                </pre>
              </div>
            ) : null}
          </article>
        ))}
        {filteredLogs.length === 0 ? (
          <p className="text-sm font-semibold text-[#747878]">Chưa có audit log nào.</p>
        ) : null}
      </div>
    </Panel>
  )
}
