import { useState } from "react"
import { AlertCircle, Scale, Sparkles, User, CheckCircle } from "lucide-react"
import { toast } from "sonner"

import { AdminShell } from "@/pages/admin/components/AdminShell"
import {
  AdminHeader,
  AdminPanel,
  AdminPanelTitle,
  AdminSearchBar,
  AdminTable,
  DisputeStatusBadge,
} from "@/pages/admin/components/AdminPrimitives"
import { mockAdminDisputes as initialDisputes } from "@/shared/data/admin-mock-data"
import type { AdminDispute } from "@/shared/data/admin-mock-data"
import { Button } from "@/shared/ui/button"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/shared/ui/dialog"
import { Textarea } from "@/shared/ui/textarea"
import { Label } from "@/shared/ui/label"

export function AdminDisputesPage() {
  const [disputes, setDisputes] = useState<AdminDispute[]>(initialDisputes)
  const [searchTerm, setSearchTerm] = useState("")
  const [statusFilter, setStatusFilter] = useState<string>("ALL")
  const [activeDispute, setActiveDispute] = useState<AdminDispute | null>(null)

  // Arbitration form state
  const [responsibleParty, setResponsibleParty] = useState<string>("CUSTOMER")
  const [resolutionFavor, setResolutionFavor] = useState<string>("PROVIDER")
  const [refundAmount, setRefundAmount] = useState<number>(0)
  const [resolutionNote, setResolutionNote] = useState("")

  const handleOpenArbitration = (dispute: AdminDispute) => {
    setActiveDispute(dispute)
    setResponsibleParty(dispute.responsibleParty || "CUSTOMER")
    setResolutionFavor(dispute.resolutionFavor || "PROVIDER")
    setRefundAmount(dispute.status === "RESOLVED" ? dispute.amount : 0)
    setResolutionNote(dispute.resolutionNote || "")
  }

  const handleResolveDispute = () => {
    if (!activeDispute) return

    setDisputes((prev) =>
      prev.map((d) =>
        d.id === activeDispute.id
          ? {
              ...d,
              status: "RESOLVED",
              responsibleParty: responsibleParty as AdminDispute["responsibleParty"],
              resolutionFavor: resolutionFavor as AdminDispute["resolutionFavor"],
              resolutionNote: resolutionNote,
            }
          : d
      )
    )

    toast.success(`Đã ban hành phán quyết cho tranh chấp ${activeDispute.id}!`, {
      description: `Bên chịu trách nhiệm: ${responsibleParty}. Hướng giải quyết: ${resolutionFavor}.`,
    })

    setActiveDispute(null)
  }

  const handleWaiveDispute = (dispute: AdminDispute) => {
    setDisputes((prev) =>
      prev.map((d) => (d.id === dispute.id ? { ...d, status: "WAIVED", resolutionNote: "Miễn giảm các khoản phí theo yêu cầu." } : d))
    )
    toast.success(`Đã chuyển trạng thái tranh chấp ${dispute.id} sang Miễn giảm (Waived).`)
  }

  // Quick statistics
  const openCount = disputes.filter((d) => d.status === "OPEN").length
  const underReviewCount = disputes.filter((d) => d.status === "UNDER_REVIEW").length
  const resolvedCount = disputes.filter((d) => d.status === "RESOLVED").length

  // Filter list
  const filteredDisputes = disputes.filter((d) => {
    const matchesSearch =
      d.customerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      d.cafeName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      d.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
      d.bookingId.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesStatus = statusFilter === "ALL" || d.status === statusFilter
    return matchesSearch && matchesStatus
  })

  // Table Columns
  const columns = ["ID Tranh chấp", "Đơn hàng / Phiên", "Cơ sở", "Người chơi", "Loại", "Số tiền tranh chấp", "Trạng thái", "Hành động"]

  const rows = filteredDisputes.map((d) => [
    <span key={d.id} className="font-mono text-xs text-[#747878]">{d.id}</span>,
    <div key={`${d.id}-bks`}>
      <div className="font-mono text-xs text-[#1c1b1b]">{d.bookingId}</div>
      <div className="font-mono text-[10px] text-[#747878] mt-0.5">{d.sessionId}</div>
    </div>,
    <span key={`${d.id}-cafe`} className="font-bold text-[#1c1b1b]">{d.cafeName}</span>,
    <span key={`${d.id}-cust`} className="font-bold text-[#1c1b1b]">{d.customerName}</span>,
    <span key={`${d.id}-type`} className="text-xs font-semibold text-[#444748]">
      {d.type === "DAMAGE_CHARGE" && "Hư hỏng thiết bị"}
      {d.type === "SERVICE_QUALITY" && "Chất lượng dịch vụ"}
      {d.type === "TIMING" && "Thời gian chơi"}
    </span>,
    <span key={`${d.id}-amount`} className="font-bold text-[#1c1b1b]">
      {d.amount.toLocaleString()} ₫
    </span>,
    <DisputeStatusBadge key={`${d.id}-badge`} status={d.status} />,
    <div key={`${d.id}-actions`} className="flex items-center gap-1.5">
      <Button
        size="sm"
        onClick={() => handleOpenArbitration(d)}
        className="h-8 bg-orange-600 hover:bg-orange-700 text-white font-bold text-xs rounded-md shadow-none px-2.5"
      >
        {d.status === "RESOLVED" ? "Xem phán quyết" : "Trọng tài"}
      </Button>
      {d.status !== "RESOLVED" && d.status !== "WAIVED" && (
        <Button
          size="sm"
          variant="outline"
          onClick={() => handleWaiveDispute(d)}
          className="h-8 border-zinc-200 hover:bg-zinc-50 text-zinc-700 font-bold text-xs rounded-md shadow-none px-2"
        >
          Bỏ qua
        </Button>
      )}
    </div>
  ])

  return (
    <AdminShell>
      <AdminHeader
        title="Giải quyết Khiếu nại"
        description="Giải quyết các tranh chấp phát sinh giữa chủ sân và khách chơi dựa trên bằng chứng bàn giao xe (Inspection Photos & Checklists)."
      />

      {/* Statistics */}
      <section className="grid grid-cols-3 gap-4 mb-6">
        <div className="rounded-xl border border-[#e5e2e1] bg-white p-4 shadow-sm flex items-center gap-3">
          <div className="size-10 rounded-lg bg-red-50 flex items-center justify-center text-red-600">
            <AlertCircle className="size-5" />
          </div>
          <div>
            <div className="text-[10px] font-bold text-[#747878] uppercase tracking-wider">Mới mở</div>
            <div className="text-xl font-extrabold text-[#1c1b1b] mt-0.5">{openCount}</div>
          </div>
        </div>

        <div className="rounded-xl border border-[#e5e2e1] bg-white p-4 shadow-sm flex items-center gap-3">
          <div className="size-10 rounded-lg bg-amber-50 flex items-center justify-center text-amber-600">
            <Scale className="size-5" />
          </div>
          <div>
            <div className="text-[10px] font-bold text-[#747878] uppercase tracking-wider">Đang xét xử</div>
            <div className="text-xl font-extrabold text-[#1c1b1b] mt-0.5">{underReviewCount}</div>
          </div>
        </div>

        <div className="rounded-xl border border-[#e5e2e1] bg-white p-4 shadow-sm flex items-center gap-3">
          <div className="size-10 rounded-lg bg-emerald-50 flex items-center justify-center text-emerald-600">
            <CheckCircle className="size-5" />
          </div>
          <div>
            <div className="text-[10px] font-bold text-[#747878] uppercase tracking-wider">Đã giải quyết</div>
            <div className="text-xl font-extrabold text-[#1c1b1b] mt-0.5">{resolvedCount}</div>
          </div>
        </div>
      </section>

      {/* Main Panel */}
      <AdminPanel>
        <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <AdminSearchBar
            placeholder="Tìm theo ID, khách hàng hoặc cơ sở..."
            value={searchTerm}
            onChange={setSearchTerm}
          />

          <div className="flex items-center gap-1.5">
            <span className="text-xs font-bold text-[#747878]">Trạng thái:</span>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="h-9 rounded-lg border border-[#e5e2e1] bg-white px-2.5 text-xs font-bold text-[#1c1b1b] outline-none focus:border-orange-500"
            >
              <option value="ALL">Tất cả</option>
              <option value="OPEN">Mới mở</option>
              <option value="UNDER_REVIEW">Đang xử lý</option>
              <option value="RESOLVED">Đã phán quyết</option>
              <option value="WAIVED">Miễn giảm</option>
            </select>
          </div>
        </div>

        <AdminPanelTitle
          title={`Hồ sơ tranh chấp đang quản lý (${filteredDisputes.length})`}
          subtitle="Admin là cấp quyết định cuối cùng dựa trên đối chiếu tình trạng thiết bị check-in và check-out."
        />

        <AdminTable columns={columns} rows={rows} />
      </AdminPanel>

      {/* Side-by-side Inspection Arbitration Dialog */}
      <Dialog open={activeDispute !== null} onOpenChange={(open) => !open && setActiveDispute(null)}>
        <DialogContent className="max-w-5xl sm:max-w-5xl bg-white border border-[#e5e2e1] rounded-xl font-sans max-h-[90vh] overflow-y-auto">
          <DialogHeader className="border-b border-[#e5e2e1] pb-4">
            <DialogTitle className="text-xl font-extrabold text-[#1c1b1b] flex items-center gap-2">
              <Scale className="size-5 text-orange-600" />
              Chi tiết Trọng tài Tranh chấp: {activeDispute?.id}
            </DialogTitle>
            <DialogDescription className="text-xs font-semibold text-[#5d5f5f]">
              Đơn hàng: {activeDispute?.bookingId} | Phiên: {activeDispute?.sessionId} | Cơ sở: {activeDispute?.cafeName}
            </DialogDescription>
          </DialogHeader>

          {/* Dispute details */}
          <div className="my-5 p-4 rounded-xl bg-orange-50/50 border border-orange-100/50">
            <h4 className="text-sm font-bold text-orange-800 flex items-center gap-1.5">
              <AlertCircle className="size-4" />
              Lý do khiếu nại (khách hàng {activeDispute?.customerName}):
            </h4>
            <p className="text-xs font-semibold text-[#1c1b1b] mt-1.5 leading-relaxed">
              {activeDispute?.reason}
            </p>
            <div className="mt-3 text-xs font-bold text-orange-950">
              Số tiền đang tranh chấp: <span className="text-sm font-extrabold">{activeDispute?.amount.toLocaleString()} ₫</span>
            </div>
          </div>

          {/* Side-by-side Evidence Compare (BR-DI-004 / BR-DI-005) */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 border-b border-[#e5e2e1] pb-6">
            {/* Check-In Baseline (Trái) */}
            <div className="space-y-4">
              <div className="flex items-center justify-between border-b border-[#e5e2e1] pb-2">
                <h5 className="text-sm font-extrabold text-[#1c1b1b] flex items-center gap-1.5">
                  <Sparkles className="size-4 text-emerald-600" />
                  1. CHECK-IN INSPECTION (Baseline)
                </h5>
                <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-100">Bàn giao</span>
              </div>

              {/* Checklist details */}
              <div className="space-y-1.5 rounded-lg border border-[#e5e2e1] bg-[#fcf8f8] p-3 text-xs">
                <div className="flex justify-between font-semibold"><span className="text-[#747878]">Cản trước:</span> <strong className="text-[#1c1b1b]">{activeDispute?.checkInEvidence.checklist.frontBumper}</strong></div>
                <div className="flex justify-between font-semibold"><span className="text-[#747878]">Lốp & Mâm:</span> <strong className="text-[#1c1b1b]">{activeDispute?.checkInEvidence.checklist.tires}</strong></div>
                <div className="flex justify-between font-semibold"><span className="text-[#747878]">Khung gầm:</span> <strong className="text-[#1c1b1b]">{activeDispute?.checkInEvidence.checklist.chassis}</strong></div>
                <div className="flex justify-between font-semibold"><span className="text-[#747878]">Đuôi gió:</span> <strong className="text-[#1c1b1b]">{activeDispute?.checkInEvidence.checklist.spoiler}</strong></div>
              </div>

              {/* Image views */}
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <div className="text-[9px] font-bold text-[#747878] uppercase mb-1">Mặt Trước (FRONT)</div>
                  <img src={activeDispute?.checkInEvidence.photos.front} alt="Front Checkin" className="h-32 w-full object-cover rounded-lg border border-[#e5e2e1]" />
                </div>
                <div>
                  <div className="text-[9px] font-bold text-[#747878] uppercase mb-1">Mặt Sau (BACK)</div>
                  <img src={activeDispute?.checkInEvidence.photos.back} alt="Back Checkin" className="h-32 w-full object-cover rounded-lg border border-[#e5e2e1]" />
                </div>
                <div>
                  <div className="text-[9px] font-bold text-[#747878] uppercase mb-1">Bên Trái (LEFT)</div>
                  <img src={activeDispute?.checkInEvidence.photos.left} alt="Left Checkin" className="h-32 w-full object-cover rounded-lg border border-[#e5e2e1]" />
                </div>
                <div>
                  <div className="text-[9px] font-bold text-[#747878] uppercase mb-1">Bên Phải (RIGHT)</div>
                  <img src={activeDispute?.checkInEvidence.photos.right} alt="Right Checkin" className="h-32 w-full object-cover rounded-lg border border-[#e5e2e1]" />
                </div>
              </div>
            </div>

            {/* Check-Out Current State (Phải) */}
            <div className="space-y-4">
              <div className="flex items-center justify-between border-b border-[#e5e2e1] pb-2">
                <h5 className="text-sm font-extrabold text-[#1c1b1b] flex items-center gap-1.5">
                  <AlertCircle className="size-4 text-red-500" />
                  2. CHECK-OUT INSPECTION (Current)
                </h5>
                <span className="text-[10px] font-bold text-red-700 bg-red-50 px-2 py-0.5 rounded border border-red-100">Trả thiết bị</span>
              </div>

              {/* Checklist details */}
              <div className="space-y-1.5 rounded-lg border border-[#e5e2e1] bg-[#fcf8f8] p-3 text-xs">
                <div className="flex justify-between font-semibold">
                  <span className="text-[#747878]">Cản trước:</span> 
                  <strong className={activeDispute?.checkOutEvidence.checklist.frontBumper.includes("NỨT") || activeDispute?.checkOutEvidence.checklist.frontBumper.includes("BỂ") ? "text-red-600 font-extrabold" : "text-[#1c1b1b]"}>
                    {activeDispute?.checkOutEvidence.checklist.frontBumper}
                  </strong>
                </div>
                <div className="flex justify-between font-semibold"><span className="text-[#747878]">Lốp & Mâm:</span> <strong className="text-[#1c1b1b]">{activeDispute?.checkOutEvidence.checklist.tires}</strong></div>
                <div className="flex justify-between font-semibold"><span className="text-[#747878]">Khung gầm:</span> <strong className="text-[#1c1b1b]">{activeDispute?.checkOutEvidence.checklist.chassis}</strong></div>
                <div className="flex justify-between font-semibold">
                  <span className="text-[#747878]">Đuôi gió:</span> 
                  <strong className={activeDispute?.checkOutEvidence.checklist.spoiler.includes("GÃY") || activeDispute?.checkOutEvidence.checklist.spoiler.includes("MẤT") ? "text-red-600 font-extrabold" : "text-[#1c1b1b]"}>
                    {activeDispute?.checkOutEvidence.checklist.spoiler}
                  </strong>
                </div>
              </div>

              {/* Image views */}
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <div className="text-[9px] font-bold text-[#747878] uppercase mb-1">Mặt Trước (FRONT)</div>
                  <img src={activeDispute?.checkOutEvidence.photos.front} alt="Front Checkout" className="h-32 w-full object-cover rounded-lg border border-[#e5e2e1]" />
                </div>
                <div>
                  <div className="text-[9px] font-bold text-[#747878] uppercase mb-1">Mặt Sau (BACK)</div>
                  <img src={activeDispute?.checkOutEvidence.photos.back} alt="Back Checkout" className="h-32 w-full object-cover rounded-lg border border-[#e5e2e1]" />
                </div>
                <div>
                  <div className="text-[9px] font-bold text-[#747878] uppercase mb-1">Bên Trái (LEFT)</div>
                  <img src={activeDispute?.checkOutEvidence.photos.left} alt="Left Checkout" className="h-32 w-full object-cover rounded-lg border border-[#e5e2e1]" />
                </div>
                <div>
                  <div className="text-[9px] font-bold text-[#747878] uppercase mb-1">Bên Phải (RIGHT)</div>
                  <img src={activeDispute?.checkOutEvidence.photos.right} alt="Right Checkout" className="h-32 w-full object-cover rounded-lg border border-[#e5e2e1]" />
                </div>
              </div>
            </div>
          </div>

          {/* Arbitration Decisions & Ruling Inputs */}
          {activeDispute?.status !== "RESOLVED" ? (
            <div className="mt-5 space-y-4">
              <h5 className="text-sm font-extrabold text-[#1c1b1b] flex items-center gap-1">
                <User className="size-4 text-orange-600" />
                3. BAN HÀNH PHÁN QUYẾT TRỌNG TÀI
              </h5>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {/* Responsible party */}
                <div className="space-y-1.5">
                  <Label htmlFor="resp" className="text-xs font-bold text-[#444748]">Bên chịu trách nhiệm chính:</Label>
                  <select
                    id="resp"
                    value={responsibleParty}
                    onChange={(e) => setResponsibleParty(e.target.value)}
                    className="w-full h-10 rounded-lg border border-[#e5e2e1] bg-white px-2.5 text-xs font-bold text-[#1c1b1b] outline-none focus:border-orange-500"
                  >
                    <option value="CUSTOMER">Khách hàng (CUSTOMER)</option>
                    <option value="PROVIDER">Chủ cơ sở (PROVIDER)</option>
                    <option value="STAFF">Nhân viên bàn giao (STAFF)</option>
                    <option value="SHARED">Chia sẻ trách nhiệm (SHARED)</option>
                    <option value="UNKNOWN">Chưa xác định (UNKNOWN)</option>
                  </select>
                </div>

                {/* Resolution Favor */}
                <div className="space-y-1.5">
                  <Label htmlFor="favor" className="text-xs font-bold text-[#444748]">Hướng phân xử (Bên nhận bồi thường):</Label>
                  <select
                    id="favor"
                    value={resolutionFavor}
                    onChange={(e) => setResolutionFavor(e.target.value)}
                    className="w-full h-10 rounded-lg border border-[#e5e2e1] bg-white px-2.5 text-xs font-bold text-[#1c1b1b] outline-none focus:border-orange-500"
                  >
                    <option value="PROVIDER">Gửi trả chủ quán (Phạt cọc khách)</option>
                    <option value="CUSTOMER">Hoàn trả khách hàng (Hủy cọc/Phạt quán)</option>
                    <option value="SPLIT">Chia đôi chi phí (Split)</option>
                  </select>
                </div>

                {/* Amount to collect */}
                <div className="space-y-1.5">
                  <Label htmlFor="refAmount" className="text-xs font-bold text-[#444748]">Phí phạt cuối cùng (₫):</Label>
                  <input
                    id="refAmount"
                    type="number"
                    value={refundAmount}
                    onChange={(e) => setRefundAmount(Number(e.target.value))}
                    max={activeDispute?.amount}
                    className="w-full h-10 rounded-lg border border-[#e5e2e1] bg-white px-2.5 text-xs font-bold text-[#1c1b1b] outline-none focus:border-orange-500"
                  />
                </div>
              </div>

              {/* Decision Note */}
              <div className="space-y-1.5">
                <Label htmlFor="resNote" className="text-xs font-bold text-[#444748]">Lý lẽ phán quyết (Gửi tới hai bên):</Label>
                <Textarea
                  id="resNote"
                  placeholder="Ghi rõ lập luận phán quyết, trích dẫn rõ bằng chứng ảnh rạn nứt hay rách gãy..."
                  value={resolutionNote}
                  onChange={(e) => setResolutionNote(e.target.value)}
                  className="min-h-20 rounded-lg border-[#e5e2e1] text-xs font-semibold text-[#1c1b1b]"
                />
              </div>
            </div>
          ) : (
            <div className="mt-5 p-4 rounded-xl bg-emerald-50 border border-emerald-100 space-y-2">
              <h5 className="text-sm font-extrabold text-emerald-800 flex items-center gap-1.5">
                <CheckCircle className="size-4" />
                PHÁN QUYẾT ĐÃ BAN HÀNH:
              </h5>
              <div className="grid grid-cols-2 gap-4 text-xs font-semibold text-[#1c1b1b] my-2">
                <div>Bên chịu trách nhiệm: <strong className="text-emerald-700">{activeDispute.responsibleParty}</strong></div>
                <div>Quyết định nghiêng về: <strong className="text-emerald-700">{activeDispute.resolutionFavor}</strong></div>
              </div>
              <div className="text-xs font-bold text-[#1c1b1b]">Nội dung phân tích:</div>
              <p className="text-xs text-[#444748] italic leading-relaxed">{activeDispute.resolutionNote}</p>
            </div>
          )}

          <DialogFooter className="border-t border-[#e5e2e1] pt-4 mt-6">
            <Button
              variant="outline"
              onClick={() => setActiveDispute(null)}
              className="h-10 rounded-lg border-[#c4c7c8] bg-white text-[#1c1b1b] hover:bg-[#e5e2e1]/30 font-bold"
            >
              Đóng
            </Button>
            {activeDispute?.status !== "RESOLVED" && (
              <Button
                onClick={handleResolveDispute}
                className="h-10 rounded-lg bg-orange-600 hover:bg-orange-700 text-white font-bold"
              >
                Ban hành Phán quyết
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AdminShell>
  )
}
