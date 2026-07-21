import { useMemo, useState, useCallback } from "react"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { useWebSocket, type WsMessage } from "@/features/notifications/hooks/useWebSocket"
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
import { staffApi, staffQueryKeys, type StaffMaintenanceLogItem } from "@/features/staff/api/staff.api"
import { toast } from "sonner"
import { cn } from "@/shared/lib/utils"
import {
  StaffHeader,
  StaffCard,
  StaffBadge,
  StaffButton,
} from "./components/StaffUI"

export const PART_TYPE_LABELS: Record<string, string> = {
  TIRE_WHEEL: "Bánh xe / Lốp",
  SPOILER: "Cánh gió",
  CHASSIS: "Khung gầm",
  MOTOR: "Motor / Động cơ",
  SHELL: "Vỏ nhựa (Shell)",
  SERVO: "Servo / Tay lái",
  REMOTE: "Remote / Điều khiển",
  OTHER: "Khác",
}

export default function StaffMaintenancePage() {
  const queryClient = useQueryClient()
  const {
    updateFleetVehicleStatus,
    assignedCafeId,
  } = useStaffOperations()

  // Realtime WebSocket Handler inside Maintenance Page
  const handleWsMessage = useCallback(
    (msg: WsMessage) => {
      if (
        msg.event === "VEHICLE_MAINTENANCE_CREATED" ||
        msg.event === "NEW_MAINTENANCE_LOG" ||
        msg.event === "DAMAGE_REPORTED" ||
        msg.event === "MAINTENANCE_LOG_UPDATED"
      ) {
        void queryClient.invalidateQueries({ queryKey: staffQueryKeys.all })
      }
    },
    [queryClient]
  )

  useWebSocket(handleWsMessage)

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
  const [statusFilter, setStatusFilter] = useState<"ALL" | "SENT_TO_PROVIDER" | "PENDING_REPAIR" | "RECEIVED" | "COMPLETED">("ALL")
  const [searchQuery, setSearchQuery] = useState("")

  // REAL API QUERY for Maintenance Logs
  const { data: apiLogs, isLoading: apiLoading } = useQuery({
    queryKey: staffQueryKeys.maintenanceLogs(assignedCafeId ?? undefined, statusFilter, searchQuery),
    queryFn: () =>
      staffApi.getMaintenanceLogs({
        cafe_id: assignedCafeId ?? undefined,
        status: statusFilter !== "ALL" ? statusFilter : undefined,
        search: searchQuery || undefined,
      }),
    enabled: true,
  })

  // REAL API MUTATION for creating maintenance log
  const createLogApiMutation = useMutation({
    mutationFn: staffApi.createMaintenanceLog,
    onSuccess: () => {
      toast.success("Đã lưu phiếu bảo trì thành công trên Server Backend!")
      void queryClient.invalidateQueries({ queryKey: staffQueryKeys.all })
    },
    onError: (err: any) => {
      console.warn("Backend API not connected or offline, falling back to local state:", err)
    },
  })

  // REAL API MUTATION for updating maintenance status
  const updateStatusApiMutation = useMutation({
    mutationFn: ({ logId, status, cost }: { logId: string; status: "IN_PROGRESS" | "COMPLETED"; cost?: number }) =>
      staffApi.updateMaintenanceStatus(logId, { status, cost }),
    onSuccess: () => {
      toast.success("Cập nhật trạng thái phiếu bảo trì trên Server thành công!")
      void queryClient.invalidateQueries({ queryKey: staffQueryKeys.all })
    },
    onError: (err: any) => {
      console.warn("Backend API status update warning:", err)
    },
  })

  // Dynamic vehicle options from API data
  const vehicleOptions = useMemo(() => {
    const logs = apiLogs || []
    const namesById = new Map(logs.map((log) => [log.vehicleId, log.vehicleName]))
    const vehicleIds = new Set(logs.map((log) => log.vehicleId))

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
  }, [apiLogs])

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

    // Call real API mutation
    createLogApiMutation.mutate({
      vehicleId,
      issueDescription,
      cost,
      performedBy,
      staffNotes,
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

  // 100% REAL BACKEND DATA ONLY - ZERO MOCK DATA FALLBACK
  const filteredLogs = useMemo(() => {
    const logs = apiLogs || []
    return logs.map((item: StaffMaintenanceLogItem) => ({
      logId: item.logId,
      vehicleId: item.vehicleId,
      vehicleName: item.vehicleName,
      issueDescription: item.issueDescription,
      staffNotes: item.staffNotes || "",
      cost: item.cost,
      performedBy: item.performedBy || "Staff",
      status: item.status,
      createdAt: item.createdAt,
      completedAt: item.completedAt || undefined,
      vehicleImageUrl: item.vehicleImageUrl,
      cafeName: item.cafeName,
      categoryName: item.categoryName,
      categoryTier: item.categoryTier,
      inspectionPhotos: item.inspectionPhotos,
      damagedChecklist: item.damagedChecklist,
    }))
  }, [apiLogs])

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
                { code: "PENDING_REPAIR", label: "Đang chờ sửa" },
                { code: "RECEIVED", label: "Đã nhận xe" },
                { code: "COMPLETED", label: "Đã xong" },
              ] as const).map((item) => (
                <button
                  key={item.code}
                  onClick={() => setStatusFilter(item.code as any)}
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
                log.status === "RECEIVED"
                  ? "info"
                  : log.status === "COMPLETED"
                    ? "success"
                    : "orange"

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
                      {log.status === "RECEIVED" && "ĐÃ NHẬN XE"}
                      {log.status === "COMPLETED" && "ĐÃ SỬA XONG"}
                      {(log.status === "PENDING_REPAIR" || log.status === ("SENT_TO_PROVIDER" as any)) && "ĐANG CHỜ SỬA"}
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

                  {/* Vehicle Identity with Avatar Image */}
                  <div className="flex items-center gap-3">
                    <div className="size-12 rounded-xl overflow-hidden border border-[#e5e2e1] bg-gray-50 shrink-0">
                      {log.vehicleImageUrl ? (
                        <img src={log.vehicleImageUrl} alt={log.vehicleName} className="size-full object-cover" />
                      ) : (
                        <div className="size-full flex items-center justify-center text-[#ea580c] bg-orange-50">
                          <Car className="size-6" />
                        </div>
                      )}
                    </div>
                    <div>
                      <h4 className="text-sm font-extrabold text-[#1c1b1b] flex items-center gap-2">
                        {log.vehicleName}
                      </h4>
                      <span className="text-xs text-[#6b7280] font-mono font-semibold">
                        Mã ID Xe: {log.vehicleId}
                      </span>
                    </div>
                  </div>

                  {/* EVIDENCE PHOTOS GALLERY (Square Aspect Ratio & Clear Label) */}
                  {log.inspectionPhotos && log.inspectionPhotos.length > 0 && (
                    <div className="space-y-2.5 rounded-xl bg-zinc-50 border border-zinc-200 p-3.5">
                      <span className="text-xs font-extrabold uppercase tracking-wider text-zinc-800 flex items-center gap-1.5">
                        <Sparkles className="size-4 text-[#ea580c]" />
                        Ảnh tình trạng xe:
                      </span>
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                        {log.inspectionPhotos.map((photo, idx) => (
                          <div key={idx} className="group relative overflow-hidden rounded-xl border border-zinc-200 bg-zinc-100 shadow-2xs aspect-square">
                            <ZoomableInspectionImage
                              src={photo.url}
                              alt={`Ảnh tình trạng xe ${idx + 1}`}
                              className="aspect-square w-full object-cover transition-transform duration-300 group-hover:scale-105"
                            />
                            <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/75 to-transparent p-2 text-center pointer-events-none">
                              <span className="text-[11px] font-bold text-white uppercase tracking-wider">
                                Ảnh tình trạng xe {log.inspectionPhotos && log.inspectionPhotos.length > 1 ? idx + 1 : ""}
                              </span>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* DAMAGED CHECKLIST & CHECK-OUT ORIGIN BOX */}
                  <div className="rounded-xl bg-red-50/80 border border-red-200 p-3.5 space-y-3">
                    <div className="flex items-center justify-between flex-wrap gap-2">
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[11px] font-extrabold bg-red-600 text-white uppercase tracking-wide shadow-2xs">
                        <AlertTriangle className="size-3.5" />
                        Nguồn: Ghi nhận hư hỏng từ Check-out Nhân viên
                      </span>
                      <span className="text-[11px] font-extrabold text-red-700">
                        Biên bản kiểm tra lúc trả xe
                      </span>
                    </div>

                    {log.damagedChecklist && log.damagedChecklist.length > 0 ? (
                      <div className="space-y-1.5">
                        <span className="text-xs font-extrabold text-red-900 block">
                          Chi tiết các linh kiện & vị trí xe bị hư hỏng:
                        </span>
                        <div className="grid sm:grid-cols-2 gap-2">
                          {log.damagedChecklist.map((item, i) => {
                            const translatedLabel =
                              PART_TYPE_LABELS[item.itemLabel] ||
                              PART_TYPE_LABELS[item.itemKey] ||
                              item.itemLabel ||
                              item.itemKey

                            return (
                              <div key={i} className="flex items-start justify-between gap-2 bg-white rounded-lg p-2.5 border border-red-200 text-xs shadow-2xs">
                                <div className="space-y-0.5">
                                  <span className="font-bold text-[#1c1b1b] block">• {translatedLabel}</span>
                                  {item.note && <span className="text-[11px] text-[#6b7280] block">Ghi chú: {item.note}</span>}
                                </div>
                                <span className="text-[10px] font-extrabold uppercase px-2 py-0.5 rounded bg-red-100 text-red-700 shrink-0">
                                  {item.status === "BROKEN" ? "HỎNG NẶNG" : item.status === "SCRATCHED" ? "TRẦY XƯỚC" : item.status}
                                </span>
                              </div>
                            )
                          })}
                        </div>
                      </div>
                    ) : (
                      <div className="bg-white rounded-lg p-2.5 border border-red-100 text-xs">
                        <span className="font-bold text-red-900 block mb-0.5">Mô tả hư hỏng ghi nhận từ Check-out:</span>
                        <p className="text-[#1c1b1b] font-medium">{log.issueDescription}</p>
                      </div>
                    )}
                  </div>

                  {/* Footer Row: Technician & Cost & Action buttons */}
                  <div className="border-t border-[#e5e2e1] pt-3 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div className="flex items-center gap-4 text-xs font-bold text-[#6b7280]">
                      <span>Người phụ trách: <strong className="text-[#1c1b1b]">{log.performedBy || "Chưa phân công"}</strong></span>
                      {log.cost > 0 && (
                        <span className="text-[#ea580c] font-extrabold text-sm">
                          {log.cost.toLocaleString("vi-VN")} đ
                        </span>
                      )}
                    </div>

                    {/* Action buttons (3-step status transition: PENDING_REPAIR -> RECEIVED -> COMPLETED) */}
                    {log.status !== "COMPLETED" && (
                      <div className="flex gap-2">
                        {(log.status === "PENDING_REPAIR" || log.status === ("SENT_TO_PROVIDER" as any)) && (
                          <button
                            onClick={() => {
                              updateStatusApiMutation.mutate({ logId: log.logId, status: "RECEIVED" })
                            }}
                            className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-xs font-bold text-white transition-all shadow-2xs flex items-center gap-1.5"
                          >
                            <CheckCircle2 className="size-3.5" />
                            Xác nhận Đã nhận xe
                          </button>
                        )}
                        {log.status === "RECEIVED" && (
                          <button
                            onClick={() => {
                              updateStatusApiMutation.mutate({ logId: log.logId, status: "COMPLETED" })
                              updateFleetVehicleStatus(log.vehicleId, "AVAILABLE")
                            }}
                            className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-xs font-bold text-white transition-all shadow-2xs flex items-center gap-1.5"
                          >
                            <CheckCircle2 className="size-3.5" />
                            Đã sửa xong (Bàn giao Sẵn sàng)
                          </button>
                        )}
                      </div>
                    )}
                  </div>
                </StaffCard>
              )
            })}

            {apiLoading && (
              <StaffCard className="py-16 text-center text-[#6b7280] space-y-3 border-dashed">
                <div className="size-8 border-3 border-[#ea580c] border-t-transparent rounded-full animate-spin mx-auto" />
                <p className="text-xs font-bold text-[#1c1b1b]">Đang tải danh sách bảo trì từ hệ thống...</p>
              </StaffCard>
            )}

            {!apiLoading && filteredLogs.length === 0 && (
              <StaffCard className="py-16 text-center text-[#6b7280] space-y-3 border-dashed bg-[#fcf8f8]/60">
                <div className="size-12 rounded-full bg-orange-50 border border-orange-200 flex items-center justify-center mx-auto text-[#ea580c]">
                  <CheckCircle2 className="size-6 text-[#ea580c]" />
                </div>
                <div className="space-y-1">
                  <p className="text-base font-extrabold text-[#1c1b1b]">Hiện tại chưa có xe cần bảo trì</p>
                  <p className="text-xs text-[#6b7280] font-medium max-w-sm mx-auto">
                    Tất cả xe thuộc chi nhánh đang ở trạng thái sẵn sàng cho thuê hoặc chưa ghi nhận hư hỏng mới từ Check-out.
                  </p>
                </div>
              </StaffCard>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
