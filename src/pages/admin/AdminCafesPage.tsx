import { useMemo, useState, type ReactNode } from "react"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { Building2, CheckCircle2, ShieldAlert, XCircle } from "lucide-react"
import { toast } from "sonner"

import { cafeApi, cafeQueryKeys } from "@/features/cafes/api/cafe.api"
import type { BackendCafe, CafeStatus } from "@/features/cafes/types"
import { getCafeSlotFeeRate } from "@/features/cafes/lib/cafe.mappers"
import { AdminShell } from "@/pages/admin/components/AdminShell"
import {
  AdminHeader,
  AdminPanel,
  AdminPanelTitle,
  AdminSearchBar,
  AdminTable,
  CafeStatusBadge,
} from "@/pages/admin/components/AdminPrimitives"
import { Button } from "@/shared/ui/button"
import { Badge } from "@/shared/ui/badge"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/shared/ui/dialog"
import { Textarea } from "@/shared/ui/textarea"
import { Label } from "@/shared/ui/label"

type StatusFilter = "ALL" | CafeStatus
type ActionType = "APPROVE" | "SUSPEND" | "REACTIVATE"

export function AdminCafesPage() {
  const queryClient = useQueryClient()
  const [searchTerm, setSearchTerm] = useState("")
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("ALL")
  const [planFilter, setPlanFilter] = useState<string>("ALL")
  const [selectedCafe, setSelectedCafe] = useState<BackendCafe | null>(null)
  const [actionType, setActionType] = useState<ActionType | null>(null)
  const [note, setNote] = useState("")

  const queryParams = useMemo(
    () => ({ page: 1, limit: 100, status: statusFilter === "ALL" ? undefined : statusFilter }),
    [statusFilter],
  )
  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: cafeQueryKeys.list(queryParams),
    queryFn: () => cafeApi.listCafes(queryParams),
  })
  const cafes = data?.data ?? []

  const statusMutation = useMutation({
    mutationFn: ({ cafeId, status }: { cafeId: string; status: CafeStatus }) => cafeApi.updateCafeStatus(cafeId, status),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: cafeQueryKeys.all })
      toast.success("Đã cập nhật trạng thái cơ sở")
      setSelectedCafe(null)
      setActionType(null)
      setNote("")
    },
    onError: () => {
      toast.error("Không thể cập nhật trạng thái cơ sở")
    },
  })

  const handleOpenAction = (cafe: BackendCafe, type: ActionType) => {
    setSelectedCafe(cafe)
    setActionType(type)
    setNote("")
  }

  const handleConfirmAction = () => {
    if (!selectedCafe || !actionType) return

    const nextStatus: CafeStatus = actionType === "SUSPEND" ? "SUSPENDED" : "ACTIVE"
    statusMutation.mutate({ cafeId: selectedCafe.id, status: nextStatus })
  }

  const totalCount = cafes.length
  const pendingCount = cafes.filter((cafe) => cafe.status === "PENDING").length
  const activeCount = cafes.filter((cafe) => cafe.status === "ACTIVE").length
  const suspendedCount = cafes.filter((cafe) => cafe.status === "SUSPENDED").length

  const filteredCafes = cafes.filter((cafe) => {
    const keyword = searchTerm.trim().toLowerCase()
    const matchesSearch =
      keyword === "" ||
      cafe.name.toLowerCase().includes(keyword) ||
      cafe.address.toLowerCase().includes(keyword) ||
      cafe.district.toLowerCase().includes(keyword) ||
      cafe.city.toLowerCase().includes(keyword) ||
      cafe.providerId.toLowerCase().includes(keyword)
    return matchesSearch && planFilter === "ALL"
  })

  const columns = ["Cơ sở & Provider", "Liên hệ", "Địa chỉ / Chi nhánh", "Phí slot", "Trạng thái", "Ngày tạo", "Hành động"]
  const rows = filteredCafes.map((cafe) => [
    <div key={`${cafe.id}-name`} className="flex items-center gap-3">
      {cafe.coverImageUrl ? (
        <img src={cafe.coverImageUrl} alt={cafe.name} className="size-9 rounded-lg border border-[#e5e2e1] object-cover" />
      ) : (
        <div className="flex size-9 items-center justify-center rounded-lg border border-[#e5e2e1] bg-[#f6f3f2]">
          <Building2 className="size-4 text-[#747878]" />
        </div>
      )}
      <div>
        <div className="flex items-center gap-1.5 font-bold text-[#1c1b1b]">
          {cafe.name}
          <span className="rounded bg-[#f6f3f2] px-1 font-mono text-[9px] font-bold text-[#747878]">{cafe.id.slice(0, 8)}</span>
        </div>
        <div className="mt-0.5 text-xs font-semibold text-[#5d5f5f]">Provider: {cafe.providerId.slice(0, 8)}</div>
      </div>
    </div>,
    <div key={`${cafe.id}-contact`}>
      <div className="text-xs font-bold text-[#1c1b1b]">{cafe.phone ?? "--"}</div>
      <div className="mt-0.5 text-[11px] font-semibold text-[#747878]">{cafe.slug}</div>
    </div>,
    <span key={`${cafe.id}-addr`} className="block max-w-xs truncate text-xs font-semibold text-[#444748]">
      {cafe.address}
    </span>,
    <Badge key={`${cafe.id}-fee`} variant="outline" className="rounded-md border-[#c4c7c8] bg-[#f6f3f2] px-2.5 py-0.5 font-bold text-[#1c1b1b] shadow-none">
      {formatSlotFee(cafe)}
    </Badge>,
    <CafeStatusBadge key={`${cafe.id}-status`} status={cafe.status} />,
    <span key={`${cafe.id}-date`} className="font-mono text-xs text-[#747878]">{formatDate(cafe.createdAt)}</span>,
    <div key={`${cafe.id}-actions`} className="flex items-center gap-1.5">
      {cafe.status === "PENDING" && (
        <Button size="sm" onClick={() => handleOpenAction(cafe, "APPROVE")} className="h-8 rounded-md bg-emerald-600 px-2.5 text-xs font-bold text-white shadow-none hover:bg-emerald-700">
          Duyệt
        </Button>
      )}
      {cafe.status === "ACTIVE" && (
        <Button size="sm" variant="outline" onClick={() => handleOpenAction(cafe, "SUSPEND")} className="h-8 rounded-md border-zinc-200 px-2 text-xs font-bold text-zinc-700 shadow-none hover:bg-zinc-50">
          Tạm ngưng
        </Button>
      )}
      {cafe.status === "SUSPENDED" && (
        <Button size="sm" onClick={() => handleOpenAction(cafe, "REACTIVATE")} className="h-8 rounded-md bg-orange-600 px-2 text-xs font-bold text-white shadow-none hover:bg-orange-700">
          Kích hoạt lại
        </Button>
      )}
    </div>,
  ])

  return (
    <AdminShell>
      <AdminHeader
        title="Phê duyệt Đối tác"
        description="Xem xét thông tin cơ sở và cập nhật trạng thái hoạt động dựa trên dữ liệu backend."
      />

      <section className="grid grid-cols-2 gap-4 md:grid-cols-4">
        <OverviewCard label="Tổng cơ sở" value={totalCount} icon={<Building2 className="size-5" />} tone="orange" />
        <OverviewCard label="Đang chờ duyệt" value={pendingCount} icon={<ShieldAlert className="size-5" />} tone="amber" />
        <OverviewCard label="Hoạt động" value={activeCount} icon={<CheckCircle2 className="size-5" />} tone="emerald" />
        <OverviewCard label="Tạm ngưng" value={suspendedCount} icon={<XCircle className="size-5" />} tone="red" />
      </section>

      <AdminPanel className="mt-6">
        <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <AdminSearchBar
            placeholder="Tìm theo tên cơ sở, địa chỉ hoặc provider id..."
            value={searchTerm}
            onChange={setSearchTerm}
          />

          <div className="flex flex-wrap gap-2.5">
            <div className="flex items-center gap-1.5">
              <span className="text-xs font-bold text-[#747878]">Trạng thái:</span>
              <select
                value={statusFilter}
                onChange={(event) => setStatusFilter(event.target.value as StatusFilter)}
                className="h-9 rounded-lg border border-[#e5e2e1] bg-white px-2.5 text-xs font-bold text-[#1c1b1b] outline-none focus:border-orange-500"
              >
                <option value="ALL">Tất cả</option>
                <option value="PENDING">Chờ duyệt</option>
                <option value="ACTIVE">Hoạt động</option>
                <option value="SUSPENDED">Tạm ngưng</option>
              </select>
            </div>

            <div className="flex items-center gap-1.5">
              <span className="text-xs font-bold text-[#747878]">Gói SaaS:</span>
              <select
                value={planFilter}
                onChange={(event) => setPlanFilter(event.target.value)}
                className="h-9 rounded-lg border border-[#e5e2e1] bg-white px-2.5 text-xs font-bold text-[#1c1b1b] outline-none focus:border-orange-500"
              >
                <option value="ALL">Chưa có API</option>
              </select>
            </div>
          </div>
        </div>

        <AdminPanelTitle
          title={`Danh sách cơ sở đối tác (${filteredCafes.length})`}
          subtitle="Quản lý trạng thái PENDING, ACTIVE, SUSPENDED từ cafe API"
        />

        {isLoading ? (
          <div className="space-y-3">
            {Array.from({ length: 5 }).map((_, index) => <div key={index} className="h-14 animate-pulse rounded-lg bg-[#f6f3f2]" />)}
          </div>
        ) : isError ? (
          <Button type="button" variant="outline" onClick={() => void refetch()}>
            Tải lại dữ liệu
          </Button>
        ) : (
          <AdminTable columns={columns} rows={rows} />
        )}
      </AdminPanel>

      <Dialog open={selectedCafe !== null} onOpenChange={(open) => !open && setSelectedCafe(null)}>
        <DialogContent className="max-w-md rounded-xl border border-[#e5e2e1] bg-white font-sans">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-lg font-extrabold text-[#1c1b1b]">
              {actionType === "APPROVE" && "Xác nhận duyệt cơ sở"}
              {actionType === "SUSPEND" && "Tạm ngưng cơ sở"}
              {actionType === "REACTIVATE" && "Kích hoạt lại cơ sở"}
            </DialogTitle>
            <DialogDescription className="mt-1.5 text-xs font-semibold text-[#5d5f5f]">
              Bạn đang thay đổi trạng thái của <strong className="text-[#1c1b1b]">"{selectedCafe?.name}"</strong>.
            </DialogDescription>
          </DialogHeader>

          <div className="my-4 space-y-2">
            <Label htmlFor="note" className="text-xs font-bold text-[#444748]">Ghi chú nội bộ</Label>
            <Textarea
              id="note"
              placeholder="BE hiện chưa lưu ghi chú cho cafe status; ghi chú này chỉ dùng để xác nhận thao tác trên UI."
              value={note}
              onChange={(event) => setNote(event.target.value)}
              className="min-h-24 rounded-lg border-[#e5e2e1] text-xs font-semibold text-[#1c1b1b]"
            />
          </div>

          <DialogFooter className="gap-2 sm:gap-0">
            <Button variant="outline" onClick={() => setSelectedCafe(null)} className="h-10 rounded-lg border-[#c4c7c8] bg-white font-bold text-[#1c1b1b] hover:bg-[#e5e2e1]/30">
              Hủy
            </Button>
            <Button
              onClick={handleConfirmAction}
              disabled={statusMutation.isPending}
              className="h-10 rounded-lg bg-[#1c1b1b] font-bold text-white hover:bg-[#313030]"
            >
              Xác nhận
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AdminShell>
  )
}

function OverviewCard({ label, value, icon, tone }: { label: string; value: number; icon: ReactNode; tone: "orange" | "amber" | "emerald" | "red" }) {
  const toneClass = {
    orange: "bg-orange-50 text-orange-600",
    amber: "bg-amber-50 text-amber-600",
    emerald: "bg-emerald-50 text-emerald-600",
    red: "bg-red-50 text-red-600",
  }[tone]

  return (
    <div className="flex items-center gap-3 rounded-xl border border-[#e5e2e1] bg-white p-4 shadow-sm">
      <div className={`flex size-10 items-center justify-center rounded-lg ${toneClass}`}>{icon}</div>
      <div>
        <div className="text-[10px] font-bold uppercase tracking-wider text-[#747878]">{label}</div>
        <div className="mt-0.5 text-xl font-extrabold text-[#1c1b1b]">{value}</div>
      </div>
    </div>
  )
}

function formatSlotFee(cafe: BackendCafe) {
  const slotFeeRate = getCafeSlotFeeRate(cafe)
  if (slotFeeRate <= 0) return "--"
  return new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND", maximumFractionDigits: 0 }).format(slotFeeRate)
}

function formatDate(value: string) {
  return new Intl.DateTimeFormat("vi-VN", { day: "2-digit", month: "2-digit", year: "numeric" }).format(new Date(value))
}
