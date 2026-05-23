import { useState } from "react"
import { Award, ArrowUpRight, ArrowDownRight, AwardIcon } from "lucide-react"

import { AdminShell } from "@/pages/admin/components/AdminShell"
import {
  AdminHeader,
  AdminPanel,
  AdminPanelTitle,
  AdminSearchBar,
  AdminTable,
} from "@/pages/admin/components/AdminPrimitives"
import { mockTrustScoreLogs as initialLogs } from "@/shared/data/admin-mock-data"
import type { TrustScoreLog } from "@/shared/data/admin-mock-data"

export function AdminTrustScoreLogsPage() {
  const [logs] = useState<TrustScoreLog[]>(initialLogs)
  const [searchTerm, setSearchTerm] = useState("")
  const [deltaFilter, setDeltaFilter] = useState<string>("ALL")

  // Filter logs
  const filteredLogs = logs.filter((log) => {
    const matchesSearch =
      log.userName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      log.userId.toLowerCase().includes(searchTerm.toLowerCase()) ||
      log.reason.toLowerCase().includes(searchTerm.toLowerCase())

    const matchesDelta =
      deltaFilter === "ALL" ||
      (deltaFilter === "INCREASES" && log.delta > 0) ||
      (deltaFilter === "DECREASES" && log.delta < 0)

    return matchesSearch && matchesDelta
  })

  // Table Setup
  const columns = ["Mã Log", "Thành viên", "Điểm cũ", "Điểm mới", "Thay đổi", "Lý do điều chỉnh", "Thời gian"]

  const rows = filteredLogs.map((log) => [
    <span key={log.id} className="font-mono text-xs text-[#747878]">{log.id}</span>,
    <div key={`${log.id}-user`}>
      <div className="font-bold text-[#1c1b1b]">{log.userName}</div>
      <div className="font-mono text-[10px] text-[#747878] mt-0.5">{log.userId}</div>
    </div>,
    <span key={`${log.id}-prev`} className="font-mono font-bold text-xs text-[#747878]">{log.previousScore}</span>,
    <span key={`${log.id}-new`} className="font-mono font-bold text-xs text-[#1c1b1b]">{log.newScore}</span>,
    <span
      key={`${log.id}-delta`}
      className={`font-mono font-extrabold text-sm flex items-center gap-0.5 ${
        log.delta > 0 ? "text-emerald-600" : "text-red-500"
      }`}
    >
      {log.delta > 0 ? (
        <>
          <ArrowUpRight className="size-3.5" />
          +{log.delta}
        </>
      ) : (
        <>
          <ArrowDownRight className="size-3.5" />
          {log.delta}
        </>
      )}
    </span>,
    <span key={`${log.id}-reason`} className="text-xs font-semibold text-[#444748] block max-w-sm leading-relaxed">
      {log.reason}
    </span>,
    <span key={`${log.id}-time`} className="font-mono text-xs text-[#747878]">{log.timestamp}</span>,
  ])

  return (
    <AdminShell>
      <AdminHeader
        title="Nhật ký Điểm Uy tín"
        description="Tra cứu và giám sát toàn bộ hoạt động cộng/trừ điểm tín nhiệm của người chơi và đối tác trên toàn hệ thống."
      />

      {/* Stats Summary Panel */}
      <section className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
        <div className="rounded-xl border border-[#e5e2e1] bg-white p-4 shadow-sm flex items-center gap-3">
          <div className="size-10 rounded-lg bg-emerald-50 flex items-center justify-center text-emerald-600">
            <Award className="size-5" />
          </div>
          <div>
            <div className="text-[10px] font-bold text-[#747878] uppercase tracking-wider">Tổng lượt cộng thưởng</div>
            <div className="text-xl font-extrabold text-[#1c1b1b] mt-0.5">
              {logs.filter((l) => l.delta > 0).length} giao dịch
            </div>
          </div>
        </div>

        <div className="rounded-xl border border-[#e5e2e1] bg-white p-4 shadow-sm flex items-center gap-3">
          <div className="size-10 rounded-lg bg-red-50 flex items-center justify-center text-red-600">
            <AwardIcon className="size-5 rotate-180" />
          </div>
          <div>
            <div className="text-[10px] font-bold text-[#747878] uppercase tracking-wider">Tổng lượt khấu trừ phạt</div>
            <div className="text-xl font-extrabold text-[#1c1b1b] mt-0.5">
              {logs.filter((l) => l.delta < 0).length} giao dịch
            </div>
          </div>
        </div>
      </section>

      {/* Logs Table Panel */}
      <AdminPanel>
        <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <AdminSearchBar
            placeholder="Tìm theo tên thành viên, ID hoặc lý do..."
            value={searchTerm}
            onChange={setSearchTerm}
          />

          <div className="flex items-center gap-1.5">
            <span className="text-xs font-bold text-[#747878]">Loại biến động:</span>
            <select
              value={deltaFilter}
              onChange={(e) => setDeltaFilter(e.target.value)}
              className="h-9 rounded-lg border border-[#e5e2e1] bg-white px-2.5 text-xs font-bold text-[#1c1b1b] outline-none focus:border-orange-500"
            >
              <option value="ALL">Tất cả biến động</option>
              <option value="INCREASES">Chỉ các lượt cộng điểm (+)</option>
              <option value="DECREASES">Chỉ các lượt trừ điểm (-)</option>
            </select>
          </div>
        </div>

        <AdminPanelTitle
          title={`Nhật ký kiểm toán biến động điểm (${filteredLogs.length})`}
          subtitle="Các bản ghi biến động điểm tín dụng để tính toán độ tin cậy và chính sách đặt sân."
        />

        <AdminTable columns={columns} rows={rows} />
      </AdminPanel>
    </AdminShell>
  )
}
