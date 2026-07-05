import { useState, useRef } from "react"
import { toast } from "sonner"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"

import { AdminShell } from "@/pages/admin/components/AdminShell"
import {
  AdminHeader,
  AdminPanel,
  AdminPanelTitle,
  AdminSearchBar,
} from "@/pages/admin/components/AdminPrimitives"
import { adminFeatureFlagsApi, type ApiFeatureFlag } from "@/features/admin/api/admin-feature-flags.api"

const FLAG_DESCRIPTIONS: Record<string, string> = {
  AI_CHATBOT: "Kích hoạt chatbot Gemini AI trả lời tự động cho khách hàng tại từng chi nhánh",
  AI_REVENUE_ANALYTICS: "Bảng phân tích doanh thu bằng AI Gemini trong Provider Dashboard",
}

export function AdminFeatureFlagsPage() {
  const queryClient = useQueryClient()
  const [searchTerm, setSearchTerm] = useState("")

  const { data: flags = [], isLoading } = useQuery({
    queryKey: ["admin-feature-flags"],
    queryFn: adminFeatureFlagsApi.list,
  })

  const updateMutation = useMutation({
    mutationFn: ({ key, isEnabled }: { key: string; isEnabled: boolean }) =>
      adminFeatureFlagsApi.update(key, { isEnabled }),
    onSuccess: (_, { key, isEnabled }) => {
      void queryClient.invalidateQueries({ queryKey: ["admin-feature-flags"] })
      toast.success(`${key} → ${isEnabled ? "Bật" : "Tắt"}`)
    },
    onError: (_err, { key }) => {
      toast.error(`Không thể cập nhật "${key}"`)
    },
  })

  const updateQuotaMutation = useMutation({
    mutationFn: ({ key, monthlyQuota }: { key: string; monthlyQuota: number }) =>
      adminFeatureFlagsApi.update(key, { config: { monthly_quota: monthlyQuota } }),
    onSuccess: (_, { key, monthlyQuota }) => {
      void queryClient.invalidateQueries({ queryKey: ["admin-feature-flags"] })
      toast.success(`${key} → quota ${monthlyQuota === 0 ? "không giới hạn" : `${monthlyQuota} lượt/tháng`}`)
    },
    onError: (_err, { key }) => {
      toast.error(`Không thể cập nhật quota "${key}"`)
    },
  })

  const filtered = flags.filter(
    (f) =>
      f.feature_key.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (FLAG_DESCRIPTIONS[f.feature_key] ?? "").toLowerCase().includes(searchTerm.toLowerCase()),
  )

  return (
    <AdminShell>
      <AdminHeader
        title="Feature Flags"
        description="Bật hoặc tắt các tính năng nền tảng. Thay đổi có hiệu lực ngay lập tức, không cần deploy lại."
      />

      <AdminPanel>
        <div className="mb-6">
          <AdminSearchBar
            placeholder="Tìm theo tên flag..."
            value={searchTerm}
            onChange={setSearchTerm}
          />
        </div>

        <AdminPanelTitle
          title="Danh sách Feature Flags"
          subtitle={`${flags.filter((f) => f.is_enabled).length} đang bật · ${flags.filter((f) => !f.is_enabled).length} đang tắt`}
        />

        <div className="border border-[#e5e2e1] rounded-xl overflow-hidden divide-y divide-[#e5e2e1]">
          {isLoading ? (
            <div className="p-8 text-center text-sm text-[#747878]">Đang tải...</div>
          ) : filtered.length === 0 ? (
            <div className="p-8 text-center text-sm font-semibold text-[#747878]">
              Không tìm thấy flag nào.
            </div>
          ) : (
            filtered.map((flag) => (
              <FlagRow
                key={flag.feature_key}
                flag={flag}
                onToggle={(isEnabled) => updateMutation.mutate({ key: flag.feature_key, isEnabled })}
                onUpdateQuota={(monthlyQuota) => updateQuotaMutation.mutate({ key: flag.feature_key, monthlyQuota })}
                isPending={updateMutation.isPending || updateQuotaMutation.isPending}
              />
            ))
          )}
        </div>
      </AdminPanel>
    </AdminShell>
  )
}

function FlagRow({
  flag,
  onToggle,
  onUpdateQuota,
  isPending,
}: {
  flag: ApiFeatureFlag
  onToggle: (isEnabled: boolean) => void
  onUpdateQuota: (monthlyQuota: number) => void
  isPending: boolean
}) {
  const description = FLAG_DESCRIPTIONS[flag.feature_key] ?? flag.feature_key
  const monthlyQuota = (flag.config as { monthly_quota?: number })?.monthly_quota
  const [editingQuota, setEditingQuota] = useState(false)
  const [quotaInput, setQuotaInput] = useState("")
  const inputRef = useRef<HTMLInputElement>(null)

  const startEdit = () => {
    setQuotaInput(String(monthlyQuota ?? 0))
    setEditingQuota(true)
    setTimeout(() => inputRef.current?.select(), 0)
  }

  const commitEdit = () => {
    const val = parseInt(quotaInput, 10)
    if (!isNaN(val) && val >= 0 && val !== monthlyQuota) {
      onUpdateQuota(val)
    }
    setEditingQuota(false)
  }

  return (
    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 p-4 bg-white hover:bg-[#fcf8f8]/50 transition-colors">
      <div className="space-y-1 min-w-0">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="font-mono text-sm font-extrabold text-[#1c1b1b]">{flag.feature_key}</span>
          <span
            className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
              flag.is_enabled
                ? "bg-emerald-100 text-emerald-700"
                : "bg-zinc-100 text-zinc-500"
            }`}
          >
            {flag.is_enabled ? "Đang bật" : "Đang tắt"}
          </span>
          {monthlyQuota !== undefined && (
            editingQuota ? (
              <div className="flex items-center gap-1">
                <input
                  ref={inputRef}
                  type="number"
                  min="0"
                  value={quotaInput}
                  onChange={(e) => setQuotaInput(e.target.value)}
                  onBlur={commitEdit}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") commitEdit()
                    if (e.key === "Escape") setEditingQuota(false)
                  }}
                  className="w-20 text-[11px] font-semibold px-1.5 py-0.5 rounded border border-[#c5c2c1] focus:outline-none focus:border-violet-400 text-[#1c1b1b]"
                />
                <span className="text-[10px] text-[#747878]">lượt/tháng (0=∞)</span>
              </div>
            ) : (
              <button
                onClick={startEdit}
                title="Nhấn để sửa quota"
                className="text-[10px] font-semibold text-[#747878] bg-[#f6f3f2] hover:bg-[#edeae9] px-2 py-0.5 rounded-full border border-[#e5e2e1] transition-colors cursor-pointer"
              >
                {monthlyQuota === 0 ? "Không giới hạn" : `${monthlyQuota} lượt/tháng`}
              </button>
            )
          )}
        </div>
        <p className="text-xs text-[#5d5f5f] font-medium leading-relaxed">{description}</p>
      </div>

      {/* Toggle */}
      <button
        onClick={() => onToggle(!flag.is_enabled)}
        disabled={isPending}
        className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 focus:outline-none disabled:opacity-50 disabled:cursor-not-allowed ${
          flag.is_enabled ? "bg-emerald-500" : "bg-zinc-300"
        }`}
        aria-checked={flag.is_enabled}
        role="switch"
      >
        <span
          className={`pointer-events-none inline-block size-5 rounded-full bg-white shadow-md transform transition-transform duration-200 ${
            flag.is_enabled ? "translate-x-5" : "translate-x-0"
          }`}
        />
      </button>
    </div>
  )
}
