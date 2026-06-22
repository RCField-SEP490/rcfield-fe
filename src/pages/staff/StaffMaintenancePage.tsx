import { useMemo, useState } from "react"
import { Plus, ClipboardList, User, DollarSign, Filter, Car } from "lucide-react"
import { useStaffOperations } from "./context/StaffOperationContext"
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
  } = useStaffOperations()

  // Local state controls
  const [showLogForm, setShowLogForm] = useState(false)
  
  // Form input fields
  const [vehicleId, setVehicleId] = useState("")
  const [vehicleName, setVehicleName] = useState("")
  const [issueDescription, setIssueDescription] = useState("")
  const [staffNotes, setStaffNotes] = useState("")
  const [cost, setCost] = useState(0)
  const [performedBy, setPerformedBy] = useState("")

  // Filter states
  const [statusFilter, setStatusFilter] = useState<"ALL" | "SCHEDULED" | "IN_PROGRESS" | "COMPLETED">("ALL")
  const [searchQuery, setSearchQuery] = useState("")

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
      toast.error("Vui lòng chọn xe, nhập lỗi cơ học và tên thợ sửa!")
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
    })

    // Also auto-toggle vehicle status to MAINTENANCE
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
  const filteredLogs = maintenanceLogs.filter((log) => {
    const matchesStatus = statusFilter === "ALL" || log.status === statusFilter
    const matchesSearch =
      log.vehicleName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      log.vehicleId.toLowerCase().includes(searchQuery.toLowerCase()) ||
      log.logId.toLowerCase().includes(searchQuery.toLowerCase()) ||
      log.issueDescription.toLowerCase().includes(searchQuery.toLowerCase())
    return matchesStatus && matchesSearch
  })

  return (
    <div className="space-y-6">
      {/* 1. Page Header with CTA Action button */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <StaffHeader
          title="Bảo trì & Kỹ thuật Đội xe"
          subtitle="Quản lý lịch sửa chữa xe bị hỏng, thay thế linh kiện hao mòn và sạc pin định kỳ"
        />

        <StaffButton
          onClick={() => setShowLogForm(!showLogForm)}
          variant="primary"
          className="shrink-0 uppercase tracking-wider text-xs"
        >
          <Plus className="size-4" />
          {showLogForm ? "Đóng Phiếu" : "Lập Phiếu Sửa Chữa"}
        </StaffButton>
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* 2. FLEET STATUS QUICK PANEL GRID */}
        <StaffCard className="space-y-4 h-fit">
          <h3 className="text-sm font-bold uppercase tracking-wider text-[#1c1b1b] flex items-center gap-2">
            <Car className="size-4.5 text-[#ea580c]" />
            Trạng thái đội xe cho thuê
          </h3>
          <p className="text-[11px] text-[#6b7280] leading-relaxed">
            Nhấp chọn bên dưới để thay đổi nhanh trạng thái kho xe (Sẵn sàng hoặc Đưa vào kho bảo trì):
          </p>

          <div className="space-y-3">
            {vehicleOptions.map((v) => {
              const liveStatus = fleetStates[v.id] || "AVAILABLE"
              
              // status badge mapping
              const vehicleBadgeVariant =
                liveStatus === "AVAILABLE"
                  ? "success"
                  : liveStatus === "MAINTENANCE"
                  ? "warning"
                  : "info"

              return (
                <div key={v.id} className="rounded-lg border border-[#e5e2e1] bg-[#fcf8f8] p-3 space-y-2.5">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <h4 className="text-xs font-bold text-[#1c1b1b] line-clamp-1">{v.name}</h4>
                      <span className="text-[10px] text-[#6b7280] font-mono">ID: {v.id}</span>
                    </div>
                    <StaffBadge variant={vehicleBadgeVariant}>
                      {liveStatus === "AVAILABLE" && "SẴN SÀNG"}
                      {liveStatus === "MAINTENANCE" && "BẢO TRÌ"}
                      {liveStatus === "IN_USE" && "ĐANG CHẠY"}
                    </StaffBadge>
                  </div>

                  <div className="flex gap-2 pt-2 border-t border-dashed border-[#e5e2e1]">
                    <button
                      onClick={() => {
                        updateFleetVehicleStatus(v.id, "AVAILABLE")
                        toast.success(`Đã đưa xe ${v.id} về trạng thái Khả dụng.`)
                      }}
                      className="flex-1 py-1 rounded bg-white border border-[#e5e2e1] hover:border-[#ea580c] hover:text-[#ea580c] text-[10px] font-bold text-[#6b7280] text-center transition-all"
                    >
                      Sẵn sàng
                    </button>
                    <button
                      onClick={() => {
                        updateFleetVehicleStatus(v.id, "MAINTENANCE")
                        toast.warning(`Đã chuyển xe ${v.id} vào bảo trì.`)
                      }}
                      className="flex-1 py-1 rounded bg-[#fff3eb] border border-[#ffdbca] text-[#ea580c] hover:bg-[#ffeade] text-[10px] font-bold text-center transition-all"
                    >
                      Bảo trì
                    </button>
                  </div>
                </div>
              )
            })}

            {vehicleOptions.length === 0 && (
              <div className="rounded-lg border border-dashed border-[#e5e2e1] bg-white p-4 text-center text-xs font-semibold text-[#6b7280]">
                Chưa có xe nào trong đội xe của ca trực.
              </div>
            )}
          </div>
        </StaffCard>

        {/* 3. LOGS QUEUE & REPORT FORM COLUMN */}
        <div className="lg:col-span-2 space-y-6">
          {/* LOGS CREATION FORM */}
          {showLogForm && (
            <form onSubmit={handleSubmit} className="animate-fadeIn">
              <StaffCard className="p-5 space-y-6 border-orange-100 bg-[#fffbf9]/60">
                <h3 className="text-base font-bold text-[#1c1b1b]">Đăng ký biên bản sửa chữa linh kiện</h3>

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
                      Chi phí thay thế linh kiện (đ)
                    </label>
                    <div className="relative">
                      <span className="absolute inset-y-0 left-3.5 flex items-center text-[#6b7280]">
                        <DollarSign className="size-3.5" />
                      </span>
                      <input
                        type="number"
                        placeholder="0"
                        value={cost}
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
                    placeholder="Ví dụ: motor bốc khói, nứt gãy bánh răng truyền động..."
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
                    placeholder="Đã hàn lại cổ góp điện, thay pin dự phòng dung lượng cao..."
                    value={staffNotes}
                    onChange={(e) => setStaffNotes(e.target.value)}
                    className="w-full rounded-lg border border-[#e5e2e1] bg-white p-3 text-xs font-semibold text-[#1c1b1b] focus:border-[#ea580c] focus:outline-none placeholder-[#a09e9d] resize-none"
                  />
                </div>

                <StaffButton type="submit" variant="primary" className="uppercase tracking-wider text-xs">
                  Ghi phiếu sửa chữa
                </StaffButton>
              </StaffCard>
            </form>
          )}

          {/* FILTER CONTROL PANEL */}
          <div className="space-y-4">
            <div className="flex flex-col sm:flex-row gap-4 items-center justify-between rounded-xl border border-[#e5e2e1] bg-white p-4 shadow-sm">
              <div className="flex items-center gap-1.5 overflow-x-auto w-full sm:w-auto pb-1 sm:pb-0">
                <Filter className="size-4 text-[#6b7280] shrink-0" />
                {[
                  { code: "ALL", label: "Tất cả" },
                  { code: "SCHEDULED", label: "Chờ sửa" },
                  { code: "IN_PROGRESS", label: "Đang sửa" },
                  { code: "COMPLETED", label: "Đã xong" },
                ].map((item) => (
                  <button
                    key={item.code}
                    onClick={() => setStatusFilter(item.code as any)}
                    className={cn(
                      "rounded-full px-3 py-1 text-xs font-bold transition-all border shrink-0",
                      statusFilter === item.code
                        ? "bg-[#ea580c] text-white border-[#ea580c]"
                        : "bg-white text-[#6b7280] border-[#e5e2e1] hover:text-[#1c1b1b] hover:bg-[#fcf8f8]"
                    )}
                  >
                    {item.label}
                  </button>
                ))}
              </div>

              <input
                type="text"
                placeholder="Tìm tên xe hoặc mã phiếu..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full sm:w-56 rounded-xl border border-[#e5e2e1] bg-white px-4 py-2 text-xs font-semibold text-[#1c1b1b] focus:outline-none focus:ring-1 focus:ring-[#ea580c] focus:border-[#ea580c]"
              />
            </div>

            {/* MAINTENANCE LOGS QUEUE CARDS */}
            <div className="grid sm:grid-cols-2 gap-4">
              {filteredLogs.map((log) => {
                // status colors
                const logBadgeVariant =
                  log.status === "SCHEDULED"
                    ? "warning"
                    : log.status === "IN_PROGRESS"
                    ? "orange"
                    : "success"

                return (
                  <StaffCard key={log.logId} className="flex flex-col justify-between space-y-4 h-full">
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] text-[#6b7280] font-bold font-mono">{log.logId}</span>
                        <StaffBadge variant={logBadgeVariant}>
                          {log.status === "SCHEDULED" && "CHỜ SỬA CHỮA"}
                          {log.status === "IN_PROGRESS" && "ĐANG KHẮC PHỤC"}
                          {log.status === "COMPLETED" && "ĐÃ HOÀN TẤT"}
                        </StaffBadge>
                      </div>

                      <div>
                        <h4 className="text-xs font-bold text-[#1c1b1b]">{log.vehicleName}</h4>
                        <p className="text-[10px] text-[#6b7280] font-semibold mt-0.5">Mã ID: {log.vehicleId}</p>
                      </div>

                      <div className="rounded-lg bg-[#fcf8f8] border border-[#e5e2e1] p-2.5 text-xs text-[#4c4a49] font-medium leading-relaxed space-y-1">
                        <p>
                          <strong className="text-[#1c1b1b]">Lỗi chẩn đoán:</strong> {log.issueDescription}
                        </p>
                        {log.staffNotes && (
                          <p className="border-t border-[#e5e2e1] pt-1 mt-1 text-[11px] text-[#6b7280]">
                            <strong className="text-[#4c4a49]">Cách xử lý:</strong> {log.staffNotes}
                          </p>
                        )}
                      </div>
                    </div>

                    <div className="border-t border-[#e5e2e1] pt-2.5 space-y-2.5 font-bold text-xs">
                      <div className="flex justify-between items-center text-[11px] text-[#6b7280]">
                        <span>Thợ sửa: {log.performedBy}</span>
                        {log.cost > 0 && <span className="text-[#ea580c] font-extrabold">{log.cost.toLocaleString("vi-VN")} đ</span>}
                      </div>

                      {log.status !== "COMPLETED" && (
                        <div className="flex gap-2 pt-1 border-t border-dashed border-[#e5e2e1]">
                          {log.status === "SCHEDULED" && (
                            <button
                              onClick={() => updateMaintenanceStatus(log.logId, "IN_PROGRESS", "Đang tháo dỡ máy để làm nguội và thay thế.")}
                              className="w-full rounded bg-[#ea580c] hover:bg-orange-500 py-1.5 text-[10px] font-bold text-white text-center transition-all"
                            >
                              Tiến hành sửa
                            </button>
                          )}
                          {log.status === "IN_PROGRESS" && (
                            <button
                              onClick={() => {
                                updateMaintenanceStatus(log.logId, "COMPLETED", "Đã hoàn thành bảo trì linh kiện, chạy thử nghiệm đạt chuẩn.")
                                updateFleetVehicleStatus(log.vehicleId, "AVAILABLE")
                              }}
                              className="w-full rounded bg-emerald-600 hover:bg-emerald-500 py-1.5 text-[10px] font-bold text-white text-center transition-all"
                            >
                              Bàn giao hoàn thành
                            </button>
                          )}
                        </div>
                      )}
                    </div>
                  </StaffCard>
                )
              })}

              {filteredLogs.length === 0 && (
                <StaffCard className="col-span-full py-16 text-center text-[#6b7280] space-y-2 border-dashed">
                  <ClipboardList className="size-10 text-[#6b7280] mx-auto" />
                  <p className="text-sm font-bold">Không có phiếu sửa chữa nào</p>
                </StaffCard>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
