import { useState } from "react"
import { Building2, CheckCircle2, ShieldAlert, XCircle } from "lucide-react"
import { toast } from "sonner"

import { AdminShell } from "@/pages/admin/components/AdminShell"
import {
  AdminHeader,
  AdminPanel,
  AdminPanelTitle,
  AdminSearchBar,
  AdminTable,
  CafeStatusBadge,
} from "@/pages/admin/components/AdminPrimitives"
import { mockAdminCafes as initialCafes } from "@/shared/data/admin-mock-data"
import type { AdminCafe } from "@/shared/data/admin-mock-data"
import { Button } from "@/shared/ui/button"
import { Badge } from "@/shared/ui/badge"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/shared/ui/dialog"
import { Textarea } from "@/shared/ui/textarea"
import { Label } from "@/shared/ui/label"

export function AdminCafesPage() {
  const [cafes, setCafes] = useState<AdminCafe[]>(initialCafes)
  const [searchTerm, setSearchTerm] = useState("")
  const [statusFilter, setStatusFilter] = useState<string>("ALL")
  const [planFilter, setPlanFilter] = useState<string>("ALL")
  
  // Dialog State
  const [selectedCafe, setSelectedCafe] = useState<AdminCafe | null>(null)
  const [actionType, setActionType] = useState<"APPROVE" | "REJECT" | "SUSPEND" | null>(null)
  const [note, setNote] = useState("")

  const handleOpenAction = (cafe: AdminCafe, type: "APPROVE" | "REJECT" | "SUSPEND") => {
    setSelectedCafe(cafe)
    setActionType(type)
    setNote("")
  }

  const handleConfirmAction = () => {
    if (!selectedCafe || !actionType) return

    let nextStatus: AdminCafe["status"] = "APPROVED"
    let successMsg = ""

    if (actionType === "APPROVE") {
      nextStatus = "APPROVED"
      successMsg = `Đã phê duyệt đối tác "${selectedCafe.name}" thành công!`
    } else if (actionType === "REJECT") {
      nextStatus = "REJECTED"
      successMsg = `Đã từ chối đơn đăng ký của "${selectedCafe.name}".`
    } else if (actionType === "SUSPEND") {
      nextStatus = "SUSPENDED"
      successMsg = `Đã tạm ngưng hoạt động của đối tác "${selectedCafe.name}".`
    }

    setCafes((prev) =>
      prev.map((c) => (c.id === selectedCafe.id ? { ...c, status: nextStatus } : c))
    )

    toast.success(successMsg, {
      description: note ? `Ghi chú: ${note}` : undefined,
    })

    setSelectedCafe(null)
    setActionType(null)
  }

  // Calculate quick metrics
  const totalCount = cafes.length
  const pendingCount = cafes.filter((c) => c.status === "PENDING").length
  const activeCount = cafes.filter((c) => c.status === "APPROVED").length
  const suspendedCount = cafes.filter((c) => c.status === "SUSPENDED").length

  // Filter cafes
  const filteredCafes = cafes.filter((cafe) => {
    const matchesSearch =
      cafe.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      cafe.providerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      cafe.email.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesStatus = statusFilter === "ALL" || cafe.status === statusFilter
    const matchesPlan = planFilter === "ALL" || cafe.saasPlan === planFilter
    return matchesSearch && matchesStatus && matchesPlan
  })

  // Table Setup
  const columns = ["Cơ sở & Provider", "Liên hệ", "Địa chỉ / Chi nhánh", "Gói SaaS", "Trạng thái", "Ngày tạo", "Hành động"]
  
  const rows = filteredCafes.map((cafe) => [
    <div key={`${cafe.id}-name`} className="flex items-center gap-3">
      {cafe.logo ? (
        <img src={cafe.logo} alt={cafe.name} className="size-9 rounded-lg object-cover border border-[#e5e2e1]" />
      ) : (
        <div className="size-9 rounded-lg bg-[#f6f3f2] flex items-center justify-center border border-[#e5e2e1]">
          <Building2 className="size-4 text-[#747878]" />
        </div>
      )}
      <div>
        <div className="font-bold text-[#1c1b1b] flex items-center gap-1.5">
          {cafe.name}
          <span className="text-[9px] font-mono font-bold bg-[#f6f3f2] border border-[#e5e2e1] px-1 rounded text-[#747878]">{cafe.id}</span>
        </div>
        <div className="text-xs font-semibold text-[#5d5f5f] mt-0.5">Chủ: {cafe.providerName}</div>
      </div>
    </div>,
    <div key={`${cafe.id}-contact`}>
      <div className="text-xs font-bold text-[#1c1b1b]">{cafe.email}</div>
      <div className="text-[11px] text-[#747878] font-semibold mt-0.5">{cafe.phone}</div>
    </div>,
    <span key={`${cafe.id}-addr`} className="text-xs font-semibold text-[#444748] block max-w-xs truncate">{cafe.address}</span>,
    <Badge key={`${cafe.id}-plan`} variant="outline" className="border-[#c4c7c8] bg-[#f6f3f2] text-[#1c1b1b] font-bold shadow-none rounded-md px-2.5 py-0.5">
      {cafe.saasPlan}
    </Badge>,
    <CafeStatusBadge key={`${cafe.id}-status`} status={cafe.status} />,
    <span key={`${cafe.id}-date`} className="font-mono text-xs text-[#747878]">{cafe.createdDate}</span>,
    <div key={`${cafe.id}-actions`} className="flex items-center gap-1.5">
      {cafe.status === "PENDING" && (
        <>
          <Button
            size="sm"
            onClick={() => handleOpenAction(cafe, "APPROVE")}
            className="h-8 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-md shadow-none px-2.5"
          >
            Duyệt
          </Button>
          <Button
            size="sm"
            variant="outline"
            onClick={() => handleOpenAction(cafe, "REJECT")}
            className="h-8 border-red-200 hover:bg-red-50 text-red-700 font-bold text-xs rounded-md shadow-none px-2.5"
          >
            Từ chối
          </Button>
        </>
      )}
      {cafe.status === "APPROVED" && (
        <Button
          size="sm"
          variant="outline"
          onClick={() => handleOpenAction(cafe, "SUSPEND")}
          className="h-8 border-zinc-200 hover:bg-zinc-50 text-zinc-700 font-bold text-xs rounded-md shadow-none px-2"
        >
          Tạm ngưng
        </Button>
      )}
      {cafe.status === "SUSPENDED" && (
        <Button
          size="sm"
          onClick={() => handleOpenAction(cafe, "APPROVE")}
          className="h-8 bg-orange-600 hover:bg-orange-700 text-white font-bold text-xs rounded-md shadow-none px-2"
        >
          Kích hoạt lại
        </Button>
      )}
      {cafe.status === "REJECTED" && (
        <span className="text-xs font-semibold text-[#747878] italic">Không hành động</span>
      )}
    </div>
  ])

  return (
    <AdminShell>
      <AdminHeader
        title="Phê duyệt Đối tác"
        description="Xem xét thông tin đăng ký, hồ sơ và kiểm tra trạng thái kích hoạt SaaS của các sân đua."
      />

      {/* Mini Overview Cards */}
      <section className="grid grid-cols-2 gap-4 md:grid-cols-4">
        <div className="rounded-xl border border-[#e5e2e1] bg-white p-4 shadow-sm flex items-center gap-3">
          <div className="size-10 rounded-lg bg-orange-50 flex items-center justify-center text-orange-600">
            <Building2 className="size-5" />
          </div>
          <div>
            <div className="text-[10px] font-bold text-[#747878] uppercase tracking-wider">Tổng đối tác</div>
            <div className="text-xl font-extrabold text-[#1c1b1b] mt-0.5">{totalCount}</div>
          </div>
        </div>

        <div className="rounded-xl border border-[#e5e2e1] bg-white p-4 shadow-sm flex items-center gap-3">
          <div className="size-10 rounded-lg bg-amber-50 flex items-center justify-center text-amber-600">
            <ShieldAlert className="size-5" />
          </div>
          <div>
            <div className="text-[10px] font-bold text-[#747878] uppercase tracking-wider">Đang chờ duyệt</div>
            <div className="text-xl font-extrabold text-[#1c1b1b] mt-0.5">{pendingCount}</div>
          </div>
        </div>

        <div className="rounded-xl border border-[#e5e2e1] bg-white p-4 shadow-sm flex items-center gap-3">
          <div className="size-10 rounded-lg bg-emerald-50 flex items-center justify-center text-emerald-600">
            <CheckCircle2 className="size-5" />
          </div>
          <div>
            <div className="text-[10px] font-bold text-[#747878] uppercase tracking-wider">Hoạt động</div>
            <div className="text-xl font-extrabold text-[#1c1b1b] mt-0.5">{activeCount}</div>
          </div>
        </div>

        <div className="rounded-xl border border-[#e5e2e1] bg-white p-4 shadow-sm flex items-center gap-3">
          <div className="size-10 rounded-lg bg-red-50 flex items-center justify-center text-red-600">
            <XCircle className="size-5" />
          </div>
          <div>
            <div className="text-[10px] font-bold text-[#747878] uppercase tracking-wider">Tạm ngưng</div>
            <div className="text-xl font-extrabold text-[#1c1b1b] mt-0.5">{suspendedCount}</div>
          </div>
        </div>
      </section>

      {/* Filter and Table Panel */}
      <AdminPanel className="mt-6">
        <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <AdminSearchBar
            placeholder="Tìm theo tên cơ sở, provider hoặc email..."
            value={searchTerm}
            onChange={setSearchTerm}
          />
          
          <div className="flex flex-wrap gap-2.5">
            {/* Status Filter */}
            <div className="flex items-center gap-1.5">
              <span className="text-xs font-bold text-[#747878]">Trạng thái:</span>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="h-9 rounded-lg border border-[#e5e2e1] bg-white px-2.5 text-xs font-bold text-[#1c1b1b] outline-none focus:border-orange-500"
              >
                <option value="ALL">Tất cả</option>
                <option value="PENDING">Chờ duyệt</option>
                <option value="APPROVED">Hoạt động</option>
                <option value="SUSPENDED">Tạm ngưng</option>
                <option value="REJECTED">Từ chối</option>
              </select>
            </div>

            {/* Plan Filter */}
            <div className="flex items-center gap-1.5">
              <span className="text-xs font-bold text-[#747878]">Gói SaaS:</span>
              <select
                value={planFilter}
                onChange={(e) => setPlanFilter(e.target.value)}
                className="h-9 rounded-lg border border-[#e5e2e1] bg-white px-2.5 text-xs font-bold text-[#1c1b1b] outline-none focus:border-orange-500"
              >
                <option value="ALL">Tất cả gói</option>
                <option value="Professional">Professional</option>
                <option value="Starter">Starter</option>
                <option value="Free">Free</option>
              </select>
            </div>
          </div>
        </div>

        <AdminPanelTitle
          title={`Danh sách cơ sở đối tác (${filteredCafes.length})`}
          subtitle="Quản lý và cập nhật quyền truy cập SaaS của các chủ sân"
        />

        <AdminTable columns={columns} rows={rows} />
      </AdminPanel>

      {/* Confirmation Dialog */}
      <Dialog open={selectedCafe !== null} onOpenChange={(open) => !open && setSelectedCafe(null)}>
        <DialogContent className="max-w-md bg-white border border-[#e5e2e1] rounded-xl font-sans">
          <DialogHeader>
            <DialogTitle className="text-lg font-extrabold text-[#1c1b1b] flex items-center gap-2">
              {actionType === "APPROVE" && "Xác nhận duyệt đối tác"}
              {actionType === "REJECT" && "Từ chối duyệt đối tác"}
              {actionType === "SUSPEND" && "Tạm ngưng tài khoản đối tác"}
            </DialogTitle>
            <DialogDescription className="text-xs font-semibold text-[#5d5f5f] mt-1.5">
              Bạn đang thay đổi trạng thái hoạt động của đối tác{" "}
              <strong className="text-[#1c1b1b]">"{selectedCafe?.name}"</strong>.
            </DialogDescription>
          </DialogHeader>
          
          <div className="my-4 space-y-2">
            <Label htmlFor="note" className="text-xs font-bold text-[#444748]">Ghi chú phê duyệt / lý do từ chối:</Label>
            <Textarea
              id="note"
              placeholder="Nhập nội dung ghi chú lưu lại nhật ký hệ thống..."
              value={note}
              onChange={(e) => setNote(e.target.value)}
              className="min-h-24 rounded-lg border-[#e5e2e1] text-xs font-semibold text-[#1c1b1b]"
            />
          </div>

          <DialogFooter className="gap-2 sm:gap-0">
            <Button
              variant="outline"
              onClick={() => setSelectedCafe(null)}
              className="h-10 rounded-lg border-[#c4c7c8] bg-white text-[#1c1b1b] hover:bg-[#e5e2e1]/30 font-bold"
            >
              Hủy
            </Button>
            <Button
              onClick={handleConfirmAction}
              className={`h-10 rounded-lg text-white font-bold ${
                actionType === "APPROVE"
                  ? "bg-emerald-600 hover:bg-emerald-700"
                  : actionType === "REJECT"
                    ? "bg-red-600 hover:bg-red-700"
                    : "bg-zinc-700 hover:bg-zinc-800"
              }`}
            >
              Xác nhận
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AdminShell>
  )
}
