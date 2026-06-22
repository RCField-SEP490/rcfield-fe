import React, { useState, useEffect } from "react"
import { useParams, useSearchParams, useNavigate } from "react-router"
import {
  Camera,
  ClipboardList,
  AlertTriangle,
  ChevronLeft,
  Info,
  FileCheck,
} from "lucide-react"
import { useStaffOperations } from "./context/StaffOperationContext"
import { toast } from "sonner"
import { cn } from "@/shared/lib/utils"
import {
  StaffCard,
  StaffButton,
} from "./components/StaffUI"

export default function StaffInspectionPage() {
  const [searchParams] = useSearchParams()
  const { sessionId: routeSessionId } = useParams<{ sessionId: string }>()
  const navigate = useNavigate()
  const { sessions, bookings, submitInspection } = useStaffOperations()

  // Resolve query params
  const sessionId = routeSessionId ?? searchParams.get("sessionId")
  const type = searchParams.get("type") as "CHECK_IN" | "CHECK_OUT" | null

  // Find session and booking
  const session = sessions.find((s) => s.sessionId === sessionId)
  const booking = session ? bookings.find((b) => b.bookingId === session.bookingId) : null

  // Form states
  const [photoUrls, setPhotoUrls] = useState<Record<string, string>>({
    FRONT: "",
    BACK: "",
    LEFT: "",
    RIGHT: "",
  })
  const [photoNotes, setPhotoNotes] = useState<Record<string, string>>({
    FRONT: "",
    BACK: "",
    LEFT: "",
    RIGHT: "",
  })

  // Checklists (stateful array)
  const [checklist, setChecklist] = useState<
    { id: string; label: string; checked: boolean; notes?: string }[]
  >([])

  const [staffNotes, setStaffNotes] = useState("")

  // Check-out only: Damage claim calculator state
  const [damageFlagged, setDamageFlagged] = useState(false)
  const [damageDescription, setDamageDescription] = useState("")
  const [estimatedCost, setEstimatedCost] = useState(50000)
  const [damageMultiplier, setDamageMultiplier] = useState(1.0)
  
  // Baseline comparison toggle
  const [showCheckInBaselines, setShowCheckInBaselines] = useState(false)

  // Initialize checklists depending on type
  useEffect(() => {
    if (type === "CHECK_IN") {
      setChecklist([
        { id: "ck-1", label: "Pin đã được sạc đầy 100% trước ca chạy", checked: true },
        { id: "ck-2", label: "Hệ thống lái Servo nhạy bén, kiểm tra bẻ cua mượt mà", checked: true },
        { id: "ck-3", label: "Bộ lốp drift/onroad lắp ráp chắc chắn, không bị rơ", checked: true },
        { id: "ck-4", label: "Điều khiển từ xa (Remote) đã bật kết nối sóng ổn định", checked: true },
      ])
    } else if (type === "CHECK_OUT") {
      setChecklist([
        { id: "ck-o1", label: "Khung gầm xe nguyên vẹn, không nứt nẻ gãy vỡ", checked: true },
        { id: "ck-o2", label: "Cánh gió vững chãi, không móp méo rơi rụng", checked: true },
        { id: "ck-o3", label: "Động cơ điện (motor) hoạt động bình thường, không tỏa khét", checked: true },
        { id: "ck-o4", label: "Vỏ nhựa (Shell) không có vết xước sâu hoặc móp rách mới", checked: true },
      ])
    }
  }, [type])

  // Look up damage multiplier from booking vehicle catalogs if available
  useEffect(() => {
    if (type === "CHECK_OUT" && session) {
      const hasPremium = session.vehicles.some((v) => v.name.toLowerCase().includes("premium") || v.name.toLowerCase().includes("gtr"))
      setDamageMultiplier(hasPremium ? 1.5 : 1.0)
    }
  }, [type, session])

  if (!sessionId || !type || !session || !booking) {
    return (
      <div className="flex min-h-[50vh] flex-col items-center justify-center p-4">
        <AlertTriangle className="size-12 text-[#6b7280] mb-3" />
        <h3 className="text-lg font-bold text-[#1c1b1b]">Không tìm thấy thông tin ca kiểm xe</h3>
        <p className="text-xs text-[#6b7280] mt-1 font-semibold">Thiếu tham số sessionId hoặc loại kiểm xe.</p>
      </div>
    )
  }

  const handlePhotoFileChange = (
    angle: "FRONT" | "BACK" | "LEFT" | "RIGHT",
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    const file = event.target.files?.[0]
    if (!file) return

    if (!file.type.startsWith("image/")) {
      toast.error("Vui lòng chọn đúng định dạng ảnh.")
      return
    }

    if (file.size > 5 * 1024 * 1024) {
      toast.error("Ảnh kiểm xe không nên vượt quá 5MB.")
      return
    }

    const reader = new FileReader()
    reader.onload = () => {
      const url = String(reader.result)
      setPhotoUrls((prev) => ({
        ...prev,
        [angle]: url,
      }))
      setPhotoNotes((prev) => ({
        ...prev,
        [angle]: prev[angle] || `Ảnh kiểm xe góc ${angle}`,
      }))
      toast.success(`Đã thêm ảnh kiểm xe góc ${angle}.`)
    }
    reader.readAsDataURL(file)
  }

  // Toggle checklist checkboxes
  const toggleChecklistItem = (id: string) => {
    setChecklist(
      checklist.map((item) => (item.id === id ? { ...item, checked: !item.checked } : item))
    )
  }

  // Handle checklist notes change
  const handleChecklistNotes = (id: string, notes: string) => {
    setChecklist(
      checklist.map((item) => (item.id === id ? { ...item, notes } : item))
    )
  }

  const finalCharge = estimatedCost * damageMultiplier

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()

    // Validation: Require all 4 photos
    const missingPhotos = Object.entries(photoUrls).filter(([_, url]) => !url)
    if (missingPhotos.length > 0) {
      toast.error("Vui lòng chụp đủ 4 góc FRONT, BACK, LEFT, RIGHT để lập biên bản!")
      return
    }

    const photosArray = Object.entries(photoUrls).map(([direction, url]) => ({
      direction: direction as any,
      url,
      notes: photoNotes[direction],
    }))

    const damageDetails = damageFlagged
      ? {
          description: damageDescription || "Phát hiện vết nứt vỡ vỏ gầm mới.",
          estimatedCost,
          damageMultiplier,
          finalCharge,
        }
      : undefined

    submitInspection(
      session.sessionId,
      type,
      photosArray,
      checklist,
      staffNotes,
      damageFlagged,
      damageDetails
    )

    navigate(`/staff/sessions/${session.sessionId}`)
  }

  // Locate matching Check-In photos for side-by-side comparison in Check-Out
  const checkInInspection = session.inspections.find((i) => i.type === "CHECK_IN")

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* 1. Page Header with Back button */}
      <div className="flex items-center gap-3">
        <StaffButton
          onClick={() => navigate(`/staff/sessions/${session.sessionId}`)}
          variant="outline"
          size="sm"
          className="p-2 min-w-0 rounded-lg"
          type="button"
        >
          <ChevronLeft className="size-5 text-[#6b7280]" />
        </StaffButton>
        <div>
          <span className="text-xs text-[#6b7280] font-bold font-mono">Phiên chạy: {session.sessionId}</span>
          <h2 className="text-xl font-extrabold text-[#1c1b1b] tracking-tight">
            {type === "CHECK_IN" ? "Lập Biên Bản Bàn Giao (Check-In)" : "Lập Biên Bản Bàn Giao Xe Trả (Check-Out)"}
          </h2>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* 2. Photo Upload Widget Card */}
        <StaffCard className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <h3 className="text-sm font-bold uppercase tracking-wider text-[#1c1b1b] flex items-center gap-2">
              <Camera className="size-4.5 text-[#ea580c]" />
              Chụp ảnh thực tế phương tiện (Bắt buộc 4 hướng)
            </h3>
            {type === "CHECK_OUT" && checkInInspection && (
              <StaffButton
                type="button"
                onClick={() => setShowCheckInBaselines(!showCheckInBaselines)}
                variant={showCheckInBaselines ? "primary" : "outline"}
                size="sm"
              >
                {showCheckInBaselines ? "Ẩn ảnh so sánh Check-In" : "So sánh ảnh Check-In gốc"}
              </StaffButton>
            )}
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {(["FRONT", "BACK", "LEFT", "RIGHT"] as const).map((direction) => {
              const url = photoUrls[direction]
              const checkInPhoto = checkInInspection?.photos.find((p) => p.direction === direction)?.url

              return (
                <div key={direction} className="space-y-2">
                  <span className="block text-[11px] font-bold text-[#4c4a49] uppercase tracking-wider text-center">
                    Hướng: {direction === "FRONT" ? "Trước" : direction === "BACK" ? "Sau" : direction === "LEFT" ? "Trái" : "Phải"}
                  </span>

                  <label
                    htmlFor={`inspection-photo-${direction}`}
                    className={cn(
                      "aspect-video rounded-xl border border-dashed border-[#e5e2e1] bg-[#fcf8f8] flex flex-col items-center justify-center cursor-pointer hover:border-[#ea580c] hover:bg-[#fff3eb]/30 overflow-hidden relative group transition-all duration-200",
                      url && "border-solid border-[#e5e2e1]"
                    )}
                  >
                    {url ? (
                      <>
                        <img src={url} alt={direction} className="w-full h-full object-cover" />
                        <div className="absolute inset-0 bg-black/60 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                          <Camera className="size-5 text-white" />
                        </div>
                      </>
                    ) : (
                      <>
                        <Camera className="size-5 text-[#6b7280] mb-1" />
                        <span className="text-[10px] font-bold text-[#ea580c]">+ Thêm ảnh</span>
                      </>
                    )}
                    <input
                      id={`inspection-photo-${direction}`}
                      type="file"
                      accept="image/*"
                      className="sr-only"
                      onChange={(event) => handlePhotoFileChange(direction, event)}
                    />
                  </label>

                  {/* Note Input for Specific Angle */}
                  {url && (
                    <input
                      type="text"
                      placeholder="Ghi chú trầy xước góc..."
                      value={photoNotes[direction]}
                      onChange={(e) =>
                        setPhotoNotes({
                          ...photoNotes,
                          [direction]: e.target.value,
                        })
                      }
                      className="w-full rounded-lg border border-[#e5e2e1] bg-white px-2.5 py-1 text-[11px] font-semibold text-[#1c1b1b] placeholder-[#a09e9d] focus:outline-none focus:border-[#ea580c]"
                    />
                  )}

                  {/* Check-In Baseline reference thumbnail */}
                  {showCheckInBaselines && checkInPhoto && (
                    <div className="rounded-lg border border-blue-200 bg-blue-50/50 overflow-hidden">
                      <span className="block text-[9px] text-blue-800 font-extrabold p-1 text-center bg-blue-100">
                        ẢNH GỐC NHẬN XE
                      </span>
                      <img src={checkInPhoto} alt={`Check-In ${direction}`} className="w-full h-16 object-cover" />
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        </StaffCard>

        {/* 3. CHECKLIST & NOTES GRID */}
        <div className="grid md:grid-cols-2 gap-6">
          {/* Checklist card */}
          <StaffCard className="space-y-4">
            <h3 className="text-sm font-bold uppercase tracking-wider text-[#1c1b1b] flex items-center gap-2">
              <ClipboardList className="size-4.5 text-[#ea580c]" />
              Danh mục kiểm tra an toàn linh kiện
            </h3>

            <div className="space-y-3.5">
              {checklist.map((item) => (
                <div key={item.id} className="space-y-1">
                  <label className="flex items-start gap-2.5 cursor-pointer select-none">
                    <input
                      type="checkbox"
                      checked={item.checked}
                      onChange={() => toggleChecklistItem(item.id)}
                      className="mt-0.5 rounded border-[#e5e2e1] text-[#ea580c] focus:ring-[#ea580c] bg-white"
                    />
                    <span className="text-xs font-semibold text-[#4c4a49] leading-tight">
                      {item.label}
                    </span>
                  </label>
                  {!item.checked && (
                    <input
                      type="text"
                      placeholder="Mô tả cụ thể hao tổn hoặc linh kiện lỗi..."
                      value={item.notes || ""}
                      onChange={(e) => handleChecklistNotes(item.id, e.target.value)}
                      className="ml-6 w-[calc(100%-1.5rem)] rounded-lg border border-rose-200 bg-rose-50 px-2.5 py-1 text-[11px] text-rose-800 font-bold focus:outline-none"
                    />
                  )}
                </div>
              ))}
            </div>
          </StaffCard>

          {/* Text Notes card */}
          <StaffCard className="space-y-4">
            <h3 className="text-sm font-bold uppercase tracking-wider text-[#1c1b1b]">
              Ghi chú tổng quan biên bản
            </h3>
            <textarea
              rows={4}
              placeholder="Nhập nhận xét chung của kiểm định viên về trạng thái tổng thể..."
              value={staffNotes}
              onChange={(e) => setStaffNotes(e.target.value)}
              className="w-full rounded-xl border border-[#e5e2e1] bg-white p-4 text-xs font-semibold text-[#1c1b1b] focus:border-[#ea580c] focus:outline-none placeholder-[#a09e9d] resize-none"
            />
          </StaffCard>
        </div>

        {/* 4. PENALTY / DAMAGE CLAIM MODULE (CHECK-OUT ONLY) */}
        {type === "CHECK_OUT" && (
          <StaffCard className="space-y-4">
            <label className="flex items-center gap-2.5 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={damageFlagged}
                onChange={(e) => setDamageFlagged(e.target.checked)}
                className="rounded border-[#e5e2e1] bg-white text-[#ea580c] focus:ring-[#ea580c]"
              />
              <span className="text-sm font-bold text-[#1c1b1b]">
                Phát hiện hư hỏng do va chạm (Yêu cầu bồi thường sửa chữa)
              </span>
            </label>

            {damageFlagged && (
              <div className="border-t border-[#e5e2e1] pt-4 grid md:grid-cols-2 gap-6 animate-fadeIn">
                <div className="space-y-4">
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-[#4c4a49] mb-1.5">
                      Chi tiết mô tả lỗi hư hỏng thực tế
                    </label>
                    <input
                      type="text"
                      placeholder="Mô tả lỗi (Ví dụ: vỡ cánh gió sau, cong trục lái...)"
                      value={damageDescription}
                      onChange={(e) => setDamageDescription(e.target.value)}
                      className="w-full rounded-lg border border-[#e5e2e1] bg-white px-4 py-2.5 text-xs font-semibold text-[#1c1b1b] placeholder-[#a09e9d] focus:outline-none"
                    />
                  </div>

                  <div>
                    <div className="flex justify-between items-center text-xs font-bold text-[#4c4a49] mb-1.5">
                      <span>Dự toán chi phí khắc phục</span>
                      <span className="text-[#ea580c] font-black text-sm">
                        {estimatedCost.toLocaleString("vi-VN")} đ
                      </span>
                    </div>
                    <input
                      type="range"
                      min={10000}
                      max={500000}
                      step={10000}
                      value={estimatedCost}
                      onChange={(e) => setEstimatedCost(Number(e.target.value))}
                      className="w-full accent-[#ea580c] bg-gray-200 rounded-lg appearance-none h-1.5 cursor-pointer"
                    />
                    <div className="flex justify-between text-[9px] text-[#6b7280] font-bold mt-1">
                      <span>10k đ</span>
                      <span>250k đ</span>
                      <span>500k đ</span>
                    </div>
                  </div>
                </div>

                <div className="bg-[#fcf8f8] rounded-xl border border-[#e5e2e1] p-4 flex flex-col justify-between">
                  <div className="space-y-2 text-xs font-semibold">
                    <h5 className="font-bold uppercase tracking-wider text-[#6b7280]">
                      Chi phí bồi thường dự kiến
                    </h5>
                    <div className="flex justify-between text-[#4c4a49]">
                      <span>Dự toán linh kiện & sửa chữa:</span>
                      <span>{estimatedCost.toLocaleString("vi-VN")} đ</span>
                    </div>
                    <div className="flex justify-between text-[#4c4a49]">
                      <span>Hệ số dòng xe (Premium Mult):</span>
                      <span className="font-mono text-[#1c1b1b] font-extrabold">{damageMultiplier}x</span>
                    </div>
                    <div className="flex justify-between text-[#1c1b1b] border-t border-[#e5e2e1] pt-2 font-bold">
                      <span>Tổng phí bồi thường đề xuất:</span>
                      <span className="text-rose-600 text-sm font-black">
                        {finalCharge.toLocaleString("vi-VN")} đ
                      </span>
                    </div>
                  </div>

                  <div className="rounded-lg bg-amber-50 border border-amber-200 p-2.5 text-[10px] text-amber-800 flex gap-1.5 mt-4 font-semibold">
                    <Info className="size-4 shrink-0 text-amber-600" />
                    Báo cáo hư hại này sẽ đính kèm vào biên bản Check-Out của ca chạy và khấu trừ từ khoản ký quỹ ban đầu.
                  </div>
                </div>
              </div>
            )}
          </StaffCard>
        )}

        {/* 5. SUBMIT ACTIONS */}
        <div className="flex gap-4 pt-2">
          <StaffButton
            type="button"
            onClick={() => navigate(`/staff/sessions/${session.sessionId}`)}
            variant="outline"
            className="flex-1"
          >
            Hủy bỏ
          </StaffButton>
          <StaffButton
            type="submit"
            variant="primary"
            className="flex-1 uppercase tracking-wider gap-1.5 font-bold"
          >
            <FileCheck className="size-4.5" />
            Lưu biên bản kiểm định
          </StaffButton>
        </div>
      </form>
    </div>
  )
}
