import { useState } from "react"
import { Save } from "lucide-react"
import { toast } from "sonner"

import { AdminShell } from "@/pages/admin/components/AdminShell"
import {
  AdminHeader,
  AdminPanel,
  AdminPanelTitle,
  AdminSearchBar,
  FeatureStatusBadge,
} from "@/pages/admin/components/AdminPrimitives"
import { mockFeatureFlags as initialFlags } from "@/shared/data/admin-mock-data"
import type { FeatureFlag } from "@/shared/data/admin-mock-data"
import { Button } from "@/shared/ui/button"

export function AdminFeatureFlagsPage() {
  const [flags, setFlags] = useState<FeatureFlag[]>(initialFlags)
  const [searchTerm, setSearchTerm] = useState("")

  const handleStatusChange = (key: string, nextStatus: FeatureFlag["status"]) => {
    setFlags((prev) =>
      prev.map((f) => {
        // If it's a parent flag being disabled, disabled its children too
        if (f.key === key) {
          return { ...f, status: nextStatus }
        }
        // Cascade disable to sub-keys if parent is disabled
        if (f.parentKey === key && nextStatus === "DISABLED") {
          return { ...f, status: "DISABLED" }
        }
        return f
      })
    )

    toast.info(`Đã cập nhật cấu hình "${key}" sang [${nextStatus}]`, {
      duration: 1500,
    })
  }

  const handleSaveAll = () => {
    toast.success("Đã ghi cấu hình hệ thống vào máy chủ phân phối Flag!")
  }

  // Filter flags
  const filteredFlags = flags.filter((f) =>
    f.key.toLowerCase().includes(searchTerm.toLowerCase()) ||
    f.description.toLowerCase().includes(searchTerm.toLowerCase())
  )

  // Separating root flags vs nested sub-flags for cleaner tree rendering
  const rootFlags = filteredFlags.filter((f) => !f.parentKey)
  const getSubFlags = (parentKey: string) => filteredFlags.filter((f) => f.parentKey === parentKey)

  return (
    <AdminShell>
      <AdminHeader
        title="Cấu hình Hệ thống"
        description="Quản trị các tính năng nền tảng. Điều chỉnh giữa trạng thái Sẵn sàng (READY), Chạy giả lập (MOCK) hoặc Tắt tính năng (DISABLED)."
      />

      {/* Controls Block */}
      <div className="mb-6 flex flex-wrap items-center justify-end gap-4 rounded-xl border border-[#e5e2e1] bg-white p-4 shadow-sm">
        <Button
          onClick={handleSaveAll}
          className="h-10 bg-orange-600 hover:bg-orange-700 text-white font-bold rounded-lg shadow-none flex items-center gap-1.5"
        >
          <Save className="size-4" />
          Lưu thay đổi
        </Button>
      </div>

      {/* Overview stats panel */}
      <section className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <div className="rounded-xl border border-[#e5e2e1] bg-white p-4 shadow-sm flex items-center gap-3">
          <div className="size-9 rounded-lg bg-emerald-50 flex items-center justify-center text-emerald-600 font-mono font-extrabold text-sm">
            {flags.filter((f) => f.status === "READY").length}
          </div>
          <div>
            <div className="text-[10px] font-bold text-[#747878] uppercase tracking-wider">Hoạt động (READY)</div>
            <p className="text-xs text-[#5d5f5f] font-semibold mt-0.5">Tính năng được bật hoàn toàn</p>
          </div>
        </div>

        <div className="rounded-xl border border-[#e5e2e1] bg-white p-4 shadow-sm flex items-center gap-3">
          <div className="size-9 rounded-lg bg-amber-50 flex items-center justify-center text-amber-600 font-mono font-extrabold text-sm">
            {flags.filter((f) => f.status === "MOCK").length}
          </div>
          <div>
            <div className="text-[10px] font-bold text-[#747878] uppercase tracking-wider">Chạy giả lập (MOCK)</div>
            <p className="text-xs text-[#5d5f5f] font-semibold mt-0.5">Sử dụng dữ liệu tĩnh cục bộ</p>
          </div>
        </div>

        <div className="rounded-xl border border-[#e5e2e1] bg-white p-4 shadow-sm flex items-center gap-3">
          <div className="size-9 rounded-lg bg-zinc-100 flex items-center justify-center text-zinc-600 font-mono font-extrabold text-sm">
            {flags.filter((f) => f.status === "DISABLED").length}
          </div>
          <div>
            <div className="text-[10px] font-bold text-[#747878] uppercase tracking-wider">Vô hiệu hóa (DISABLED)</div>
            <p className="text-xs text-[#5d5f5f] font-semibold mt-0.5">Ẩn tính năng khỏi giao diện</p>
          </div>
        </div>
      </section>

      {/* Config Editor Panel */}
      <AdminPanel>
        <div className="mb-6">
          <AdminSearchBar
            placeholder="Tìm kiếm cấu hình flag hoặc từ khóa..."
            value={searchTerm}
            onChange={setSearchTerm}
          />
        </div>

        <AdminPanelTitle
          title="Bảng điều khiển Feature Flags"
          subtitle="Tính năng lồng cấp (dot-notation) sẽ tự động thừa hưởng trạng thái Vô hiệu hóa nếu Module chính bị tắt."
        />

        {/* Feature Flags Configuration Tree list */}
        <div className="border border-[#e5e2e1] rounded-xl overflow-hidden divide-y divide-[#e5e2e1]">
          {rootFlags.length === 0 ? (
            <div className="p-8 text-center text-sm font-semibold text-[#747878] bg-[#fcf8f8]/30">
              Không tìm thấy cấu hình feature flag nào phù hợp.
            </div>
          ) : (
            rootFlags.map((flag) => {
              const subs = getSubFlags(flag.key)
              
              return (
                <div key={flag.key} className="bg-white">
                  {/* Parent Flag row */}
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 p-4 hover:bg-[#fcf8f8]/50 transition-colors">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-sm font-extrabold text-[#1c1b1b]">{flag.key}</span>
                        <FeatureStatusBadge status={flag.status} />
                      </div>
                      <p className="text-xs font-semibold text-[#5d5f5f] leading-relaxed max-w-2xl">{flag.description}</p>
                    </div>

                    {/* Radio select controls */}
                    <div className="flex items-center gap-1 bg-[#f6f3f2] p-1 rounded-lg border border-[#e5e2e1] self-start sm:self-center">
                      {(["READY", "MOCK", "DISABLED"] as const).map((st) => (
                        <button
                          key={st}
                          onClick={() => handleStatusChange(flag.key, st)}
                          className={`px-3 py-1 text-[10px] font-extrabold uppercase rounded-md transition-all ${
                            flag.status === st
                              ? st === "READY"
                                ? "bg-emerald-600 text-white shadow-sm"
                                : st === "MOCK"
                                  ? "bg-amber-500 text-white shadow-sm"
                                  : "bg-zinc-700 text-white shadow-sm"
                              : "text-[#5d5f5f] hover:bg-[#e5e2e1]/50"
                          }`}
                        >
                          {st === "READY" && "Ready"}
                          {st === "MOCK" && "Mock"}
                          {st === "DISABLED" && "Off"}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Sub Flags (Indented child rendering) */}
                  {subs.length > 0 && (
                    <div className="bg-[#fcf8f8]/40 border-t border-[#e5e2e1]/60 pl-6 sm:pl-10 divide-y divide-[#e5e2e1]/40">
                      {subs.map((sub) => {
                        const parentDisabled = flag.status === "DISABLED"
                        
                        return (
                          <div key={sub.key} className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 py-3.5 pr-4 hover:bg-[#fcf8f8]/80 transition-colors">
                            <div className="space-y-1">
                              <div className="flex items-center gap-2">
                                <span className="font-mono text-xs font-bold text-[#444748] pl-2 border-l-2 border-[#c4c7c8]">
                                  {sub.key.replace(`${flag.key}.`, "")}
                                </span>
                                <FeatureStatusBadge status={parentDisabled ? "DISABLED" : sub.status} />
                                {parentDisabled && (
                                  <span className="text-[9px] font-bold text-red-600 bg-red-50 px-1.5 py-0.5 rounded border border-red-100">
                                    Thừa hưởng tắt
                                  </span>
                                )}
                              </div>
                              <p className="text-xs font-semibold text-[#747878] pl-2">{sub.description}</p>
                            </div>

                            {/* Sub Controls */}
                            <div className="flex items-center gap-1 bg-[#f6f3f2] p-1 rounded-lg border border-[#e5e2e1] self-start sm:self-center">
                              {(["READY", "MOCK", "DISABLED"] as const).map((st) => (
                                <button
                                  key={st}
                                  disabled={parentDisabled}
                                  onClick={() => handleStatusChange(sub.key, st)}
                                  className={`px-2.5 py-1 text-[9px] font-extrabold uppercase rounded-md transition-all ${
                                    (parentDisabled ? "DISABLED" : sub.status) === st
                                      ? st === "READY"
                                        ? "bg-emerald-600 text-white shadow-sm"
                                        : st === "MOCK"
                                          ? "bg-amber-500 text-white shadow-sm"
                                          : "bg-zinc-700 text-white shadow-sm"
                                      : "text-[#5d5f5f] hover:bg-[#e5e2e1]/50 disabled:opacity-50"
                                  }`}
                                >
                                  {st === "READY" && "Ready"}
                                  {st === "MOCK" && "Mock"}
                                  {st === "DISABLED" && "Off"}
                                </button>
                              ))}
                            </div>
                          </div>
                        )
                      })}
                    </div>
                  )}
                </div>
              )
            })
          )}
        </div>
      </AdminPanel>
    </AdminShell>
  )
}
