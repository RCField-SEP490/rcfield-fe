import { useMemo, useState } from "react"
import {
  Plus,
  ClipboardList,
  User,
  DollarSign,
  Filter,
  Car,
  Building2,
  Tag,
  AlertTriangle,
  Wrench,
  CheckCircle2,
  Sparkles,
} from "lucide-react"
import { useStaffOperations } from "./context/StaffOperationContext"
import { ZoomableInspectionImage } from "@/shared/components/ZoomableInspectionImage"
import { toast } from "sonner"
import { cn } from "@/shared/lib/utils"
import {
  StaffHeader,
  StaffCard,
  StaffBadge,
  StaffButton,
} from "./components/StaffUI"

export default function StaffMaintenancePage() {
  const {
    maintenanceLogs,
    logMaintenance,
    updateMaintenanceStatus,
    fleetStates,
    updateFleetVehicleStatus,
    assignedCafeId,
  } = useStaffOperations()

  // Local state controls
  const [showLogForm, setShowLogForm] = useState(false)
  
  // Form input fields
  const [vehicleId, setVehicleId] = useState("")
  const [vehicleName, setVehicleName] = useState("")
  const [issueDescription, setIssueDescription] = useState("")
  const [staffNotes, setStaffNotes] = useState("")
  const [cost, setCost] = useState<number>(0)
  const [performedBy, setPerformedBy] = useState("")

  // Filter states
  const [statusFilter, setStatusFilter] = useState<"ALL" | "SCHEDULED" | "IN_PROGRESS" | "COMPLETED">("ALL")
  const [searchQuery, setSearchQuery] = useState("")

  // Dynamic vehicle options combining fleet and maintenance logs
  const vehicleOptions = useMemo(() => {
    const namesById = new Map(maintenanceLogs.map((log) => [log.vehicleId, log.vehicleName]))
    const vehicleIds = new Set([...Object.keys(fleetStates), ...maintenanceLogs.map((log) => log.vehicleId)])

    return Array.from(vehicleIds)
      .sort()
      .map((id) => ({
        id,
        name:
          namesById.get(id) ||
          id
            .replace(/^V-/, "")
            .split("-")
            .map((part) => part.charAt(0).toUpperCase() + part.slice(1).toLowerCase())
            .join(" "),
      }))
  }, [fleetStates, maintenanceLogs])

  const handleVehicleSelect = (id: string) => {
    setVehicleId(id)
    const match = vehicleOptions.find((v) => v.id === id)
    setVehicleName(match ? match.name : "")
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()

    if (!vehicleId || !issueDescription.trim() || !performedBy.trim()) {
      toast.error("Vui lòng chọn xe, nhập mô tả hư hỏng và tên kỹ thuật viên phụ trách!")
      return
    }

    logMaintenance({
      vehicleId,
      vehicleName,
      issueDescription,
      staffNotes,
      cost,
      performedBy,
      status: "SCHEDULED",
      cafeName: assignedCafeId ? `RC Field (${assignedCafeId})` : "RC Field Quận 4",
      categoryName: "Drift Special Nitro",
      categoryTier: "PREMIUM",
    })

    // Auto update vehicle state in fleet
    updateFleetVehicleStatus(vehicleId, "MAINTENANCE")

    // Reset Form
    setVehicleId("")
    setVehicleName("")
    setIssueDescription("")
    setStaffNotes("")
    setCost(0)
    setPerformedBy("")
    setShowLogForm(false)
  }

  // Filtered maintenance logs
  const filteredLogs = useMemo(() => {
    return maintenanceLogs.filter((log) => {
      const matchesStatus = statusFilter === "ALL" || log.status === statusFilter
      const query = searchQuery.toLowerCase().trim()
      if (!query) return matchesStatus

      const matchesSearch =
        log.vehicleName.toLowerCase().includes(query) ||
        log.vehicleId.toLowerCase().includes(query) ||
        log.logId.toLowerCase().includes(query) ||
        log.issueDescription.toLowerCase().includes(query) ||
        (log.cafeName && log.cafeName.toLowerCase().includes(query)) ||
        (log.categoryName && log.categoryName.toLowerCase().includes(query))

      return matchesStatus && matchesSearch
    })
  }, [maintenanceLogs, statusFilter, searchQuery])

  return (
    <div className="space-y-6">
      {/* 1. Page Header with CTA Action button */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <StaffHeader
          title="Bảo trì & Kỹ thuật Đội xe"
          subtitle="Quản lý lịch sửa chữa xe bị hỏng từ Check-out, thay thế linh kiện hao mòn và bàn giao đội xe"
        />

        <StaffButton
          onClick={() => setShowLogForm(!showLogForm)}
          variant="primary"
          className="shrink-0 uppercase tracking-wider text-xs shadow-sm"
        >
          <Plus className="size-4" />
          {showLogForm ? "Đóng Phiếu" : "Đăng ký Bảo Trì Định Kỳ"}
        </StaffButton>
      </div>

      <div className="space-y-6">
        {/* LOGS CREATION FORM */}
          {showLogForm && (
            <form onSubmit={handleSubmit} className="animate-fadeIn">
              <StaffCard className="p-5 space-y-5 border-orange-200 bg-[#fffbf9]/80 shadow-md">
                <div className="flex items-center justify-between border-b border-orange-100 pb-3">
                  <div>
                    <h3 className="text-sm font-bold uppercase tracking-wider text-[#1c1b1b] flex items-center gap-2">
                      <Wrench className="size-4 text-[#ea580c]" />
                      Biên bản Bảo trì Định kỳ & Sửa chữa Xe kho
                    </h3>
                    <p className="text-[11px] text-[#6b7280] mt-0.5 font-medium">
                      Khai báo lịch bảo trì định kỳ, thay pin/linh kiện hao mòn hoặc sự cố phát sinh ngoài lượt Check-out.
                    </p>
                  </div>
                  <span className="text-[10px] font-bold text-[#ea580c] uppercase bg-orange-50 px-2 py-0.5 rounded border border-orange-200 shrink-0">
                    Bảo trì định kỳ
                  </span>
                </div>

                <div className="grid sm:grid-cols-2 md:grid-cols-3 gap-4">
                  {/* Select vehicle */}
                  <div>
                    <label className="block text-[10px] font-bold uppercase tracking-wider text-[#4c4a49] mb-1.5">
                      Chọn xe hư hỏng *
                    </label>
                    <select
                      value={vehicleId}
                      onChange={(e) => handleVehicleSelect(e.target.value)}
                      className="w-full rounded-lg border border-[#e5e2e1] bg-white px-3 py-2.5 text-xs font-semibold text-[#1c1b1b] focus:border-[#ea580c] focus:outline-none focus:ring-1 focus:ring-[#ea580c]"
                    >
                      <option value="">-- Chọn xe từ kho --</option>
                      {vehicleOptions.map((v) => (
                        <option key={v.id} value={v.id}>
                          {v.name} ({v.id})
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Technician */}
                  <div>
                    <label className="block text-[10px] font-bold uppercase tracking-wider text-[#4c4a49] mb-1.5">
                      Kỹ thuật viên phụ trách *
                    </label>
                    <div className="relative">
                      <span className="absolute inset-y-0 left-3.5 flex items-center text-[#6b7280]">
                        <User className="size-3.5" />
                      </span>
                      <input
                        type="text"
                        placeholder="Họ tên thợ phụ trách..."
                        value={performedBy}
                        onChange={(e) => setPerformedBy(e.target.value)}
                        className="w-full rounded-lg border border-[#e5e2e1] bg-white pl-10 pr-3 py-2.5 text-xs font-semibold text-[#1c1b1b] focus:border-[#ea580c] focus:outline-none"
                      />
                    </div>
                  </div>

                  {/* Cost */}
                  <div>
                    <label className="block text-[10px] font-bold uppercase tracking-wider text-[#4c4a49] mb-1.5">
                      Chi phí thay linh kiện (đ)
                    </label>
                    <div className="relative">
                      <span className="absolute inset-y-0 left-3.5 flex items-center text-[#6b7280]">
                        <DollarSign className="size-3.5" />
                      </span>
                      <input
                        type="number"
                        placeholder="0"
                        value={cost || ""}
                        onChange={(e) => setCost(Number(e.target.value))}
                        className="w-full rounded-lg border border-[#e5e2e1] bg-white pl-10 pr-3 py-2.5 text-xs font-semibold text-[#1c1b1b] focus:border-[#ea580c] focus:outline-none"
                      />
                    </div>
                  </div>
                </div>

                {/* Issue Description */}
                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-wider text-[#4c4a49] mb-1.5">
                    Mô tả hỏng hóc hoặc chẩn đoán cơ học *
                  </label>
                  <input
                    type="text"
                    placeholder="Ví dụ: Mô-tơ bốc khói, nứt vỡ cản trước sau va chạm, mòn vỏ bánh xe drift..."
                    value={issueDescription}
                    onChange={(e) => setIssueDescription(e.target.value)}
                    className="w-full rounded-lg border border-[#e5e2e1] bg-white px-4 py-2.5 text-xs font-semibold text-[#1c1b1b] focus:border-[#ea580c] focus:outline-none"
                  />
                </div>

                {/* Treatment Notes */}
                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-wider text-[#4c4a49] mb-1.5">
                    Phương pháp xử lý & Linh kiện thay mới
                  </label>
                  <textarea
                    rows={2}
                    placeholder="Đã quấn lại cuộn roto, thay vỏ nhựa ABS loại Drift Tech, căn chỉnh lại góc đặt bánh..."
                    value={staffNotes}
                    onChange={(e) => setStaffNotes(e.target.value)}
                    className="w-full rounded-lg border border-[#e5e2e1] bg-white p-3 text-xs font-semibold text-[#1c1b1b] focus:border-[#ea580c] focus:outline-none placeholder-[#a09e9d] resize-none"
                  />
                </div>

                <div className="flex justify-end gap-3 pt-2">
                  <button
                    type="button"
                    onClick={() => setShowLogForm(false)}
                    className="px-4 py-2 rounded-lg border border-[#e5e2e1] text-xs font-bold text-[#6b7280] hover:bg-gray-50"
                  >
                    Hủy bỏ
                  </button>
                  <StaffButton type="submit" variant="primary" className="uppercase tracking-wider text-xs">
                    Ghi phiếu sửa chữa
                  </StaffButton>
                </div>
              </StaffCard>
            </form>
          )}

          {/* FILTER CONTROL PANEL */}
          <div className="space-y-4">
            <div className="flex flex-col sm:flex-row gap-4 items-center justify-between rounded-xl border border-[#e5e2e1] bg-white p-4 shadow-xs">
              <div className="flex items-center gap-1.5 overflow-x-auto w-full sm:w-auto pb-1 sm:pb-0">
                <Filter className="size-4 text-[#6b7280] shrink-0" />
                {([
                  { code: "ALL", label: "Tất cả" },
                  { code: "SCHEDULED", label: "Chờ sửa" },
                  { code: "IN_PROGRESS", label: "Đang sửa" },
                  { code: "COMPLETED", label: "Đã xong" },
                ] as const).map((item) => (
                  <button
                    key={item.code}
                    onClick={() => setStatusFilter(item.code)}
                    className={cn(
                      "rounded-full px-3 py-1 text-xs font-bold transition-all border shrink-0",
                      statusFilter === item.code
                        ? "bg-[#ea580c] text-white border-[#ea580c] shadow-2xs"
                        : "bg-white text-[#6b7280] border-[#e5e2e1] hover:text-[#1c1b1b] hover:bg-[#fcf8f8]"
                    )}
                  >
                    {item.label}
                  </button>
                ))}
              </div>

              <input
                type="text"
                placeholder="Tìm tên xe, cơ sở, loại xe..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full sm:w-60 rounded-xl border border-[#e5e2e1] bg-white px-4 py-2 text-xs font-semibold text-[#1c1b1b] focus:outline-none focus:ring-1 focus:ring-[#ea580c] focus:border-[#ea580c]"
              />
            </div>

            {/* MAINTENANCE LOGS CARDS LIST */}
            <div className="grid gap-4">
              {filteredLogs.map((log) => {
                const logBadgeVariant =
                  log.status === "SCHEDULED"
                    ? "warning"
                    : log.status === "IN_PROGRESS"
                    ? "orange"
                    : "success"

                return (
                  <StaffCard key={log.logId} className="space-y-4 border-[#e5e2e1] hover:border-orange-200 transition-all shadow-xs">
                    {/* Header Row: Log ID & Status Badge */}
                    <div className="flex items-center justify-between border-b border-[#f3f0ef] pb-3">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold font-mono text-[#ea580c] bg-orange-50 px-2 py-0.5 rounded border border-orange-200">
                          {log.logId}
                        </span>
                        {log.createdAt && (
                          <span className="text-[10px] text-[#6b7280]">
                            Tạo ngày: {new Date(log.createdAt).toLocaleDateString("vi-VN")} lúc {new Date(log.createdAt).toLocaleTimeString("vi-VN", { hour: "2-digit", minute: "2-digit" })}
                          </span>
                        )}
                      </div>

                      <StaffBadge variant={logBadgeVariant}>
                        {log.status === "SCHEDULED" && "CHỜ SỬA CHỮA"}
                        {log.status === "IN_PROGRESS" && "ĐANG KHẮC PHỤC"}
                        {log.status === "COMPLETED" && "ĐÃ HOÀN TẤT"}
                      </StaffBadge>
                    </div>

                    {/* CONTEXT METADATA BADGES: Cafe Name & Vehicle Category */}
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold bg-orange-50 text-[#ea580c] border border-orange-200">
                        <Building2 className="size-3.5" />
                        Cơ sở: {log.cafeName || "RC Field Quận 4"}
                      </span>

                      <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold bg-purple-50 text-purple-700 border border-purple-200">
                        <Tag className="size-3.5" />
                        Loại xe: {log.categoryName || "Drift Special Nitro"} {log.categoryTier ? `(${log.categoryTier})` : ""}
                      </span>
                    </div>

                    {/* Vehicle Identity */}
                    <div>
                      <h4 className="text-sm font-extrabold text-[#1c1b1b] flex items-center gap-2">
                        <Car className="size-4 text-[#ea580c]" />
                        {log.vehicleName}
                      </h4>
                      <span className="text-xs text-[#6b7280] font-mono font-semibold">
                        Mã ID Xe: {log.vehicleId}
                      </span>
                    </div>

                    {/* EVIDENCE PHOTOS GALLERY (Zoomable Lightbox) */}
                    {log.inspectionPhotos && log.inspectionPhotos.length > 0 && (
                      <div className="space-y-2 rounded-xl bg-[#fffcfb] border border-orange-100 p-3">
                        <span className="text-[10px] font-extrabold uppercase tracking-wider text-[#ea580c] flex items-center gap-1">
                          <Sparkles className="size-3" />
                          Ảnh chụp bằng chứng hư hỏng (Check-out Inspection):
                        </span>
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                          {log.inspectionPhotos.map((photo, idx) => (
                            <div key={idx} className="space-y-1">
                              <ZoomableInspectionImage
                                src={photo.url}
                                alt={`Ảnh ${photo.angle} xe ${log.vehicleName}`}
                                className="h-20 w-full rounded-lg object-cover border border-[#e5e2e1]"
                              />
                              <div className="text-[10px] font-bold text-[#6b7280] text-center truncate">
                                Góc {photo.angle}
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* DAMAGED CHECKLIST ITEMS */}
                    {log.damagedChecklist && log.damagedChecklist.length > 0 && (
                      <div className="rounded-xl bg-red-50/70 border border-red-200 p-3 space-y-2">
                        <span className="text-[10px] font-extrabold uppercase tracking-wider text-red-700 flex items-center gap-1">
                          <AlertTriangle className="size-3.5 text-red-600" />
                          Chi tiết linh kiện ghi nhận hỏng hóc từ Check-out:
                        </span>
                        <div className="grid sm:grid-cols-2 gap-2">
                          {log.damagedChecklist.map((item, i) => (
                            <div key={i} className="flex items-start justify-between gap-2 bg-white rounded-lg p-2 border border-red-100 text-xs">
                              <div className="space-y-0.5">
                                <span className="font-bold text-[#1c1b1b] block">{item.itemLabel}</span>
                                {item.note && <span className="text-[11px] text-[#6b7280] block">{item.note}</span>}
                              </div>
                              <span className="text-[10px] font-extrabold uppercase px-1.5 py-0.5 rounded bg-red-100 text-red-700 shrink-0">
                                {item.status}
                              </span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Diagnostic & Staff Notes Box */}
                    <div className="rounded-xl bg-[#fcf8f8] border border-[#e5e2e1] p-3 text-xs text-[#4c4a49] space-y-2">
                      <div>
                        <strong className="text-[#1c1b1b]">Mô tả chẩn đoán hư hỏng:</strong>
                        <p className="mt-0.5 text-xs font-semibold text-[#1c1b1b]">{log.issueDescription}</p>
                      </div>
                      {log.staffNotes && (
                        <div className="border-t border-[#e5e2e1] pt-2 text-[11px] text-[#6b7280]">
                          <strong className="text-[#4c4a49]">Phương pháp xử lý & Linh kiện thay mới:</strong>
                          <p className="mt-0.5">{log.staffNotes}</p>
                        </div>
                      )}
                    </div>

                    {/* Footer Row: Technician & Cost & Action buttons */}
                    <div className="border-t border-[#e5e2e1] pt-3 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                      <div className="flex items-center gap-4 text-xs font-bold text-[#6b7280]">
                        <span>Thợ phụ trách: <strong className="text-[#1c1b1b]">{log.performedBy || "Chưa phân công"}</strong></span>
                        {log.cost > 0 && (
                          <span className="text-[#ea580c] font-extrabold text-sm">
                            {log.cost.toLocaleString("vi-VN")} đ
                          </span>
                        )}
                      </div>

                      {/* Action buttons */}
                      {log.status !== "COMPLETED" && (
                        <div className="flex gap-2">
                          {log.status === "SCHEDULED" && (
                            <button
                              onClick={() => {
                                updateMaintenanceStatus(log.logId, "IN_PROGRESS", "Đang tiến hành tháo rắp và thay thế phụ tùng.")
                                updateFleetVehicleStatus(log.vehicleId, "MAINTENANCE")
                              }}
                              className="px-4 py-1.5 rounded-lg bg-[#ea580c] hover:bg-orange-600 text-xs font-bold text-white transition-all shadow-2xs flex items-center gap-1.5"
                            >
                              <Wrench className="size-3.5" />
                              Tiến hành sửa
                            </button>
                          )}
                          {log.status === "IN_PROGRESS" && (
                            <button
                              onClick={() => {
                                updateMaintenanceStatus(log.logId, "COMPLETED", "Đã hoàn thành bảo trì linh kiện, chạy thử nghiệm đạt chuẩn.")
                                updateFleetVehicleStatus(log.vehicleId, "AVAILABLE")
                              }}
                              className="px-4 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-xs font-bold text-white transition-all shadow-2xs flex items-center gap-1.5"
                            >
                              <CheckCircle2 className="size-3.5" />
                              Bàn giao hoàn thành (Khôi phục Sẵn sàng)
                            </button>
                          )}
                        </div>
                      )}
                    </div>
                  </StaffCard>
                )
              })}

              {filteredLogs.length === 0 && (
                <StaffCard className="py-16 text-center text-[#6b7280] space-y-2 border-dashed">
                  <ClipboardList className="size-10 text-[#6b7280] mx-auto opacity-50" />
                  <p className="text-sm font-bold">Không có phiếu sửa chữa nào khớp với bộ lọc</p>
                </StaffCard>
              )}
            </div>
          </div>
        </div>
    </div>
  )
}
