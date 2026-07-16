import React, { useState, useEffect } from "react"
import { useParams, useSearchParams, useNavigate } from "react-router"
import {
  Camera,
  ClipboardList,
  AlertTriangle,
  ChevronLeft,
  Info,
  FileCheck,
  CheckCircle2,
  Plus,
  Trash2,
  ImagePlus,
  Loader2,
} from "lucide-react"
import { useStaffOperations } from "./context/StaffOperationContext"
import { staffApi, type DamageLineItemInput } from "@/features/staff/api/staff.api"
import { uploadImage } from "@/features/uploads/api/upload.api"
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
  const { sessions, bookings, submitInspection, refreshData } = useStaffOperations()

  const sessionId = routeSessionId ?? searchParams.get("sessionId")
  const type = searchParams.get("type") as "CHECK_IN" | "CHECK_OUT" | null

  const session = sessions.find((s) => s.sessionId === sessionId)
  const booking = session ? bookings.find((b) => b.bookingId === session.bookingId) : null
  const isByoc = booking?.playMode === "BYOC"

  // Rental evidence is flexible: staff can add the useful angles for this car.
  type RentalPhoto = { id: string; url: string; notes: string }
  const [rentalPhotos, setRentalPhotos] = useState<RentalPhoto[]>([])
  const [isUploadingRentalPhotos, setIsUploadingRentalPhotos] = useState(false)

  // ── BYOC: per-participant photo state ────────────────────────────────────────
  type ByocPhoto = { participantName: string; url: string; notes: string }
  const [byocPhotos, setByocPhotos] = useState<ByocPhoto[]>([])

  // Sync slots when booking data arrives (handles direct URL load where booking may be null on first render)
  useEffect(() => {
    if (!isByoc || !booking) return
    const names = booking.participantDetails?.map((p) => p.name) ??
      booking.plannedParticipants ??
      ["Người chơi"]
    queueMicrotask(() => {
      setByocPhotos((prev) =>
        names.map((name) => prev.find((p) => p.participantName === name) ?? { participantName: name, url: "", notes: "" })
      )
    })
  }, [booking, isByoc])

  const [checklist, setChecklist] = useState<
    { id: string; label: string; checked: boolean; notes?: string }[]
  >([])
  const [staffNotes, setStaffNotes] = useState("")

  // RENTAL check-out only
  const [damageFlagged, setDamageFlagged] = useState(false)
  const [damageLineItems, setDamageLineItems] = useState<DamageLineItemInput[]>([])
  const [showCheckInBaselines, setShowCheckInBaselines] = useState(false)
  const [isClosing, setIsClosing] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)

  useEffect(() => {
    if (isByoc) {
      queueMicrotask(() => {
        setChecklist([
          { id: "byoc-1", label: "Khách đến đúng giờ và xuất trình xe cá nhân", checked: true },
          { id: "byoc-2", label: "Xe của khách đã được kiểm tra an toàn cơ bản (pin, remote)", checked: true },
          { id: "byoc-3", label: "Khách đã xác nhận tự chịu trách nhiệm về xe cá nhân", checked: true },
        ])
      })
      return
    }

    if (type === "CHECK_IN") {
      queueMicrotask(() => {
        setChecklist([
          { id: "ck-1", label: "Pin đã được sạc đầy 100% trước ca chạy", checked: true },
          { id: "ck-2", label: "Hệ thống lái Servo nhạy bén, kiểm tra bẻ cua mượt mà", checked: true },
          { id: "ck-3", label: "Bộ lốp drift/onroad lắp ráp chắc chắn, không bị rơ", checked: true },
          { id: "ck-4", label: "Điều khiển từ xa (Remote) đã bật kết nối sóng ổn định", checked: true },
        ])
      })
    } else if (type === "CHECK_OUT") {
      queueMicrotask(() => {
        setChecklist([
          { id: "ck-o1", label: "Đã kiểm tra khung gầm xe (nứt, gãy, biến dạng)", checked: true },
          { id: "ck-o2", label: "Đã kiểm tra cánh gió (móp méo, rơi rụng)", checked: true },
          { id: "ck-o3", label: "Đã kiểm tra động cơ điện / motor (hoạt động, mùi khét)", checked: true },
          { id: "ck-o4", label: "Đã kiểm tra vỏ nhựa / shell (xước sâu, móp rách)", checked: true },
        ])
      })
    }
  }, [type, isByoc])


  if (!sessionId || !type || !session || !booking) {
    return (
      <div className="flex min-h-[50vh] flex-col items-center justify-center p-4">
        <AlertTriangle className="size-12 text-[#6b7280] mb-3" />
        <h3 className="text-lg font-bold text-[#1c1b1b]">Không tìm thấy thông tin ca kiểm xe</h3>
        <p className="text-xs text-[#6b7280] mt-1 font-semibold">Thiếu tham số sessionId hoặc loại kiểm xe.</p>
      </div>
    )
  }

  // BYOC không có checkout inspection — staff đóng phiên trực tiếp
  if (isByoc && type === "CHECK_OUT") {
    const handleCloseByocSession = async () => {
      setIsClosing(true)
      try {
        await staffApi.simulateClientCheckOut(session.sessionId)
        toast.success("Đã đóng phiên chơi thành công!", {
          description: "Booking đã được cập nhật trạng thái hoàn thành.",
        })
        await refreshData()
        navigate(`/staff/sessions/${session.sessionId}`)
      } catch (err) {
        const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message
        toast.error(msg ?? "Không thể đóng phiên chơi. Vui lòng thử lại.")
      } finally {
        setIsClosing(false)
      }
    }

    return (
      <div className="flex min-h-[50vh] flex-col items-center justify-center gap-4 p-4">
        <Info className="size-12 text-blue-400" />
        <h3 className="text-lg font-bold text-[#1c1b1b]">Không cần kiểm tra trả xe</h3>
        <p className="text-sm text-[#6b7280] text-center max-w-xs font-semibold">
          Chế độ mang xe riêng — khách tự chịu trách nhiệm với xe của họ, không cần biên bản trả xe.
        </p>
        <div className="flex flex-col gap-2 w-full max-w-xs">
          <StaffButton
            type="button"
            onClick={handleCloseByocSession}
            disabled={isClosing}
            className="w-full"
          >
            <CheckCircle2 className="size-4" />
            {isClosing ? "Đang đóng phiên..." : "Đóng phiên chơi"}
          </StaffButton>
          <StaffButton
            type="button"
            variant="outline"
            onClick={() => navigate(`/staff/sessions/${session.sessionId}`)}
            className="w-full"
          >
            <ChevronLeft className="size-4" />
            Quay lại phiên chạy
          </StaffButton>
        </div>
      </div>
    )
  }

  const handleRentalPhotoFiles = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files ?? [])
    event.target.value = ""
    if (files.length === 0) return

    const remaining = 6 - rentalPhotos.length
    if (remaining <= 0) {
      toast.error("Mỗi biên bản chỉ nhận tối đa 6 ảnh.")
      return
    }

    const limitedFiles = files.slice(0, remaining)
    const validFiles = limitedFiles.filter(
      (file) => file.type.startsWith("image/") && file.size <= 5 * 1024 * 1024,
    )
    if (validFiles.length !== limitedFiles.length) {
      toast.error("Chỉ nhận ảnh tối đa 5MB mỗi tệp. Các tệp không hợp lệ đã được bỏ qua.")
    }
    if (files.length > remaining) {
      toast.info(`Chỉ thêm ${remaining} ảnh để đủ giới hạn 6 ảnh.`)
    }
    if (validFiles.length === 0) return

    setIsUploadingRentalPhotos(true)
    try {
      const uploaded = await Promise.all(validFiles.map((file) => uploadImage(file, "inspections")))
      setRentalPhotos((previous) => [
        ...previous,
        ...uploaded.map((item) => ({ id: item.publicId, url: item.url, notes: "" })),
      ])
      toast.success(`Đã tải lên ${uploaded.length} ảnh bàn giao.`)
    } catch (error) {
      const message = (error as { response?: { data?: { message?: string } } })?.response?.data?.message
      toast.error(message ?? "Không thể tải ảnh. Vui lòng thử lại.")
    } finally {
      setIsUploadingRentalPhotos(false)
    }
  }

  const handleByocPhotoChange = (index: number, event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return
    if (!file.type.startsWith("image/")) { toast.error("Vui lòng chọn đúng định dạng ảnh."); return }
    if (file.size > 5 * 1024 * 1024) { toast.error("Ảnh không nên vượt quá 5MB."); return }

    const reader = new FileReader()
    reader.onload = () => {
      setByocPhotos((prev) =>
        prev.map((p, i) => i === index ? { ...p, url: String(reader.result) } : p)
      )
      toast.success(`Đã thêm ảnh xác nhận xe của ${byocPhotos[index]?.participantName ?? "khách"}.`)
    }
    reader.readAsDataURL(file)
  }

  const toggleChecklistItem = (id: string) => {
    setChecklist(checklist.map((item) => (item.id === id ? { ...item, checked: !item.checked } : item)))
  }

  const handleChecklistNotes = (id: string, notes: string) => {
    setChecklist(checklist.map((item) => (item.id === id ? { ...item, notes } : item)))
  }

  const PART_TYPE_LABELS: Record<string, string> = {
    TIRE_WHEEL: "Bánh xe / Lốp",
    SPOILER: "Cánh gió",
    CHASSIS: "Khung gầm",
    MOTOR: "Motor / Động cơ",
    SHELL: "Vỏ nhựa (Shell)",
    SERVO: "Servo / Tay lái",
    REMOTE: "Remote / Điều khiển",
    OTHER: "Khác",
  }

  const totalDamageCharge = damageLineItems.reduce(
    (sum, item) => sum + (item.partsPrice || 0) + (item.laborPrice || 0), 0
  )

  const addDamageItem = () =>
    setDamageLineItems((prev) => [...prev, { partType: "TIRE_WHEEL", partsPrice: 0, laborPrice: 0 }])

  const removeDamageItem = (index: number) =>
    setDamageLineItems((prev) => prev.filter((_, i) => i !== index))

  const updateDamageItem = (index: number, field: keyof DamageLineItemInput, value: string | number) =>
    setDamageLineItems((prev) => prev.map((item, i) => i === index ? { ...item, [field]: value } : item))

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (isSubmitting) return
    setIsSubmitting(true)

    try {
      let submitted: boolean

      if (isByoc) {
        const missing = byocPhotos.filter((p) => !p.url)
        if (missing.length > 0) {
          toast.error(`Vui lòng chụp ảnh xác nhận xe cho: ${missing.map((p) => p.participantName).join(", ")}`)
          return
        }
        const directions = ["FRONT", "BACK", "LEFT", "RIGHT"] as const
        submitted = await submitInspection(
          session.sessionId,
          type,
          byocPhotos.map((p, i) => ({
            direction: directions[i % directions.length],
            url: p.url,
            notes: p.notes || `Xe của ${p.participantName}`,
          })),
          checklist,
          staffNotes,
          false,
          undefined,
        )
      } else {
        if (rentalPhotos.length === 0) {
          toast.error("Vui lòng thêm ít nhất một ảnh thực tế của xe để lập biên bản.")
          return
        }
        if (damageFlagged && damageLineItems.length === 0) {
          toast.error("Vui lòng thêm ít nhất một hạng mục hư hỏng.")
          return
        }
        if (damageFlagged && damageLineItems.some((item) => item.partType === "OTHER" && !item.customPartName?.trim())) {
          toast.error('Vui lòng nhập tên hư hỏng cho mục "Khác".')
          return
        }

        const photosArray = rentalPhotos.map((photo) => ({
          direction: "OTHER" as const,
          url: photo.url,
          notes: photo.notes || undefined,
        }))

        submitted = await submitInspection(
          session.sessionId,
          type,
          photosArray,
          checklist,
          staffNotes,
          damageFlagged,
          damageFlagged ? damageLineItems : undefined,
        )
      }

      if (!submitted) return

      if (type === "CHECK_OUT") {
        navigate(`/staff/sessions/${session.sessionId}/checkout-summary`)
      } else {
        navigate(`/staff/sessions/${session.sessionId}`)
      }
    } finally {
      setIsSubmitting(false)
    }
  }

  const checkInInspection = session.inspections.find((i) => i.type === "CHECK_IN")

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
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
            {type === "CHECK_IN"
              ? isByoc ? "Xác nhận xe tự mang" : "Lập biên bản bàn giao"
              : "Lập Biên Bản Bàn Giao Xe Trả (Check-Out)"}
          </h2>
          {isByoc && (
            <span className="inline-block mt-0.5 rounded-full bg-blue-100 px-2 py-0.5 text-[10px] font-bold text-blue-700 uppercase tracking-wide">
              Chế độ mang xe riêng
            </span>
          )}
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Photo Section */}
        <StaffCard className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <h3 className="text-sm font-bold uppercase tracking-wider text-[#1c1b1b] flex items-center gap-2">
              <Camera className="size-4.5 text-[#ea580c]" />
              {isByoc
                ? `Chụp ảnh xác nhận xe khách (${byocPhotos.length} người — bắt buộc mỗi xe 1 ảnh)`
                : `Ảnh bàn giao xe (${rentalPhotos.length}/6)`}
            </h3>
            {!isByoc && type === "CHECK_OUT" && checkInInspection && (
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

          {isByoc ? (
            /* BYOC: one photo slot per participant */
            <div className={cn(
              "grid gap-4",
              byocPhotos.length === 1 ? "grid-cols-1 max-w-xs mx-auto" :
              byocPhotos.length === 2 ? "grid-cols-2" :
              "grid-cols-2 md:grid-cols-3"
            )}>
              {byocPhotos.map((slot, index) => (
                <div key={index} className="space-y-2">
                  {/* Participant label */}
                  <div className="flex items-center gap-1.5">
                    <span className="text-[11px] font-extrabold text-[#4c4a49] uppercase tracking-wider truncate">
                      {slot.participantName}
                    </span>
                    {slot.url && (
                      <span className="shrink-0 text-[9px] font-extrabold text-emerald-700 bg-emerald-50 border border-emerald-200 rounded px-1 py-0.5 leading-none uppercase">
                        ✓ Đã chụp
                      </span>
                    )}
                    {!slot.url && (
                      <span className="shrink-0 text-[9px] font-extrabold text-rose-600 bg-rose-50 border border-rose-200 rounded px-1 py-0.5 leading-none uppercase">
                        Bắt buộc
                      </span>
                    )}
                  </div>

                  {/* Photo upload zone */}
                  <label
                    htmlFor={`byoc-photo-${index}`}
                    className={cn(
                      "aspect-video rounded-xl border-2 border-dashed border-[#e5e2e1] bg-[#fcf8f8] flex flex-col items-center justify-center cursor-pointer hover:border-[#ea580c] hover:bg-[#fff3eb]/30 overflow-hidden relative group transition-all",
                      slot.url && "border-solid border-[#e5e2e1]",
                      !slot.url && "border-rose-200"
                    )}
                  >
                    {slot.url ? (
                      <>
                        <img src={slot.url} alt={slot.participantName} className="w-full h-full object-cover" />
                        <div className="absolute inset-0 bg-black/60 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                          <Camera className="size-5 text-white" />
                        </div>
                      </>
                    ) : (
                      <>
                        <Camera className="size-6 text-[#6b7280] mb-1.5" />
                        <span className="text-xs font-bold text-[#ea580c]">+ Chụp ảnh xe</span>
                        <span className="text-[10px] text-[#a09e9d] mt-0.5 font-semibold px-2 text-center">Toàn cảnh xe để xác nhận</span>
                      </>
                    )}
                    <input
                      id={`byoc-photo-${index}`}
                      type="file"
                      accept="image/*"
                      capture="environment"
                      className="sr-only"
                      onChange={(e) => handleByocPhotoChange(index, e)}
                    />
                  </label>

                  {/* Notes field */}
                  {slot.url && (
                    <input
                      type="text"
                      placeholder="Màu, đặc điểm xe..."
                      value={slot.notes}
                      onChange={(e) => setByocPhotos((prev) =>
                        prev.map((p, i) => i === index ? { ...p, notes: e.target.value } : p)
                      )}
                      className="w-full rounded-lg border border-[#e5e2e1] bg-white px-2.5 py-1.5 text-[11px] font-semibold text-[#1c1b1b] placeholder-[#a09e9d] focus:outline-none focus:border-[#ea580c]"
                    />
                  )}
                </div>
              ))}
            </div>
          ) : (
            <div className="space-y-4">
              <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-xs font-semibold leading-relaxed text-amber-900">
                Chụp rõ tổng thể xe, phía trước, phía sau, hai bên và cận cảnh mọi vết xước hoặc hư hỏng hiện có nếu cần. Không bắt buộc thứ tự hoặc đủ 4 góc; chỉ cần ảnh phản ánh đúng tình trạng xe.
              </div>

              {rentalPhotos.length < 6 && (
                <label
                  htmlFor="rental-inspection-photos"
                  className={cn(
                    "flex min-h-32 cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed border-[#f4b08c] bg-[#fff7f2] px-4 text-center transition-colors hover:border-[#ea580c] hover:bg-[#fff1e8]",
                    isUploadingRentalPhotos && "pointer-events-none opacity-60",
                  )}
                >
                  {isUploadingRentalPhotos ? (
                    <Loader2 className="mb-2 size-6 animate-spin text-[#ea580c]" />
                  ) : (
                    <ImagePlus className="mb-2 size-6 text-[#ea580c]" />
                  )}
                  <span className="text-sm font-extrabold text-[#1c1b1b]">
                    {isUploadingRentalPhotos ? "Đang tải ảnh..." : "Chọn nhiều ảnh cùng lúc"}
                  </span>
                  <span className="mt-1 text-xs font-medium text-[#6b7280]">Tối đa 6 ảnh, JPG/PNG/WEBP, mỗi ảnh không quá 5MB</span>
                  <input
                    id="rental-inspection-photos"
                    type="file"
                    accept="image/jpeg,image/png,image/webp"
                    multiple
                    className="sr-only"
                    onChange={handleRentalPhotoFiles}
                  />
                </label>
              )}

              {rentalPhotos.length > 0 && (
                <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                  {rentalPhotos.map((photo, index) => (
                    <div key={photo.id} className="overflow-hidden rounded-xl border border-[#e5e2e1] bg-white">
                      <div className="relative aspect-video bg-[#f5f3f2]">
                        <img src={photo.url} alt={`Ảnh bàn giao xe ${index + 1}`} className="h-full w-full object-cover" />
                        <button
                          type="button"
                          onClick={() => setRentalPhotos((previous) => previous.filter((item) => item.id !== photo.id))}
                          className="absolute right-2 top-2 rounded-lg bg-white/95 p-1.5 text-rose-600 shadow-sm transition-colors hover:bg-rose-50"
                          aria-label={`Xóa ảnh ${index + 1}`}
                        >
                          <Trash2 className="size-4" />
                        </button>
                      </div>
                      <div className="space-y-1.5 p-2.5">
                        <span className="text-[10px] font-extrabold uppercase tracking-wider text-[#6b7280]">Ảnh {index + 1}</span>
                        <input
                          type="text"
                          placeholder="Ghi chú tùy chọn, ví dụ: vết xước cản trước"
                          value={photo.notes}
                          onChange={(event) => setRentalPhotos((previous) => previous.map((item) => item.id === photo.id ? { ...item, notes: event.target.value } : item))}
                          className="w-full rounded-lg border border-[#e5e2e1] bg-white px-2.5 py-1.5 text-[11px] font-semibold text-[#1c1b1b] placeholder-[#a09e9d] focus:border-[#ea580c] focus:outline-none"
                        />
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {showCheckInBaselines && checkInInspection && (
                <div className="border-t border-[#e5e2e1] pt-4">
                  <p className="mb-2 text-[11px] font-extrabold uppercase tracking-wider text-blue-800">Ảnh bàn giao lúc nhận xe</p>
                  <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
                    {checkInInspection.photos.map((photo, index) => (
                      <img key={`${photo.url}-${index}`} src={photo.url} alt={`Ảnh nhận xe ${index + 1}`} className="aspect-video w-full rounded-lg border border-blue-200 object-cover" />
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </StaffCard>

        {/* Checklist & Notes */}
        <div className="grid md:grid-cols-2 gap-6">
          <StaffCard className="space-y-4">
            <h3 className="text-sm font-bold uppercase tracking-wider text-[#1c1b1b] flex items-center gap-2">
              <ClipboardList className="size-4.5 text-[#ea580c]" />
              {isByoc ? "Xác nhận điều kiện tham gia" : type === "CHECK_OUT" ? "Xác nhận đã kiểm tra linh kiện" : "Danh mục kiểm tra an toàn linh kiện"}
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
                    <span className="text-xs font-semibold text-[#4c4a49] leading-tight">{item.label}</span>
                  </label>
                  {!item.checked && (
                    <input
                      type="text"
                      placeholder="Ghi chú thêm..."
                      value={item.notes || ""}
                      onChange={(e) => handleChecklistNotes(item.id, e.target.value)}
                      className="ml-6 w-[calc(100%-1.5rem)] rounded-lg border border-rose-200 bg-rose-50 px-2.5 py-1 text-[11px] text-rose-800 font-bold focus:outline-none"
                    />
                  )}
                </div>
              ))}
            </div>
          </StaffCard>

          <StaffCard className="space-y-4">
            <h3 className="text-sm font-bold uppercase tracking-wider text-[#1c1b1b]">
              Ghi chú tổng quan biên bản
            </h3>
            <textarea
              rows={4}
              placeholder={isByoc ? "Ghi chú về xe khách hoặc điều kiện đặc biệt..." : "Nhập nhận xét chung của kiểm định viên..."}
              value={staffNotes}
              onChange={(e) => setStaffNotes(e.target.value)}
              className="w-full rounded-xl border border-[#e5e2e1] bg-white p-4 text-xs font-semibold text-[#1c1b1b] focus:border-[#ea580c] focus:outline-none placeholder-[#a09e9d] resize-none"
            />
          </StaffCard>
        </div>

        {/* Damage section — RENTAL check-out only */}
        {!isByoc && type === "CHECK_OUT" && (
          <StaffCard className="space-y-4">
            <label className="flex items-center gap-2.5 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={damageFlagged}
                onChange={(e) => {
                  setDamageFlagged(e.target.checked)
                  if (!e.target.checked) setDamageLineItems([])
                }}
                className="rounded border-[#e5e2e1] bg-white text-[#ea580c] focus:ring-[#ea580c]"
              />
              <span className="text-sm font-bold text-[#1c1b1b]">
                Phát hiện hư hỏng do va chạm (Yêu cầu bồi thường sửa chữa)
              </span>
            </label>

            {damageFlagged && (
              <div className="border-t border-[#e5e2e1] pt-4 space-y-3 animate-fadeIn">
                <div className="flex items-center justify-between">
                  <h5 className="text-xs font-bold uppercase tracking-wider text-[#4c4a49]">
                    Danh sách hạng mục hư hỏng
                  </h5>
                  <StaffButton type="button" size="sm" variant="outline" onClick={addDamageItem}>
                    <Plus className="size-3.5" />
                    Thêm hạng mục
                  </StaffButton>
                </div>

                {damageLineItems.length === 0 && (
                  <div className="rounded-lg border border-dashed border-[#e5e2e1] p-4 text-center">
                    <p className="text-xs text-[#6b7280] font-semibold">
                      Chưa có hạng mục nào. Nhấn "Thêm hạng mục" để bắt đầu ghi nhận hư hỏng.
                    </p>
                  </div>
                )}

                {damageLineItems.map((item, index) => (
                  <div key={index} className="rounded-lg border border-[#e5e2e1] bg-[#fafaf9] p-3 space-y-2.5">
                    <div className="flex items-center gap-2">
                      <select
                        value={item.partType}
                        onChange={(e) => updateDamageItem(index, "partType", e.target.value)}
                        className="flex-1 rounded-lg border border-[#e5e2e1] bg-white px-3 py-2 text-xs font-semibold text-[#1c1b1b] focus:outline-none focus:ring-1 focus:ring-[#ea580c]"
                      >
                        {Object.entries(PART_TYPE_LABELS).map(([value, label]) => (
                          <option key={value} value={value}>{label}</option>
                        ))}
                      </select>
                      <button
                        type="button"
                        onClick={() => removeDamageItem(index)}
                        className="p-1.5 rounded text-[#6b7280] hover:text-rose-600 hover:bg-rose-50 transition-colors"
                      >
                        <Trash2 className="size-4" />
                      </button>
                    </div>

                    {item.partType === "OTHER" && (
                      <input
                        type="text"
                        placeholder="Nhập tên hư hỏng cụ thể..."
                        value={item.customPartName ?? ""}
                        onChange={(e) => updateDamageItem(index, "customPartName", e.target.value)}
                        className="w-full rounded-lg border border-[#e5e2e1] bg-white px-3 py-2 text-xs font-semibold text-[#1c1b1b] placeholder-[#a09e9d] focus:outline-none focus:ring-1 focus:ring-[#ea580c]"
                      />
                    )}

                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label className="block text-[10px] font-bold uppercase tracking-wider text-[#6b7280] mb-1">
                          Giá linh kiện (đ)
                        </label>
                        <input
                          type="number"
                          min={0}
                          step={1000}
                          placeholder="0"
                          value={item.partsPrice || ""}
                          onChange={(e) => updateDamageItem(index, "partsPrice", Number(e.target.value))}
                          className="w-full rounded-lg border border-[#e5e2e1] bg-white px-3 py-2 text-xs font-semibold text-[#1c1b1b] focus:outline-none focus:ring-1 focus:ring-[#ea580c]"
                        />
                      </div>
                      <div>
                        <label className="block text-[10px] font-bold uppercase tracking-wider text-[#6b7280] mb-1">
                          Phí công sửa (đ)
                        </label>
                        <input
                          type="number"
                          min={0}
                          step={1000}
                          placeholder="0"
                          value={item.laborPrice || ""}
                          onChange={(e) => updateDamageItem(index, "laborPrice", Number(e.target.value))}
                          className="w-full rounded-lg border border-[#e5e2e1] bg-white px-3 py-2 text-xs font-semibold text-[#1c1b1b] focus:outline-none focus:ring-1 focus:ring-[#ea580c]"
                        />
                      </div>
                    </div>

                    <div className="flex justify-end text-xs font-bold text-[#4c4a49]">
                      Dòng này: {((item.partsPrice || 0) + (item.laborPrice || 0)).toLocaleString("vi-VN")} đ
                    </div>
                  </div>
                ))}

                {damageLineItems.length > 0 && (
                  <div className="rounded-xl bg-[#fcf8f8] border border-[#e5e2e1] p-4 space-y-3">
                    <div className="flex justify-between items-center text-sm font-extrabold text-[#1c1b1b]">
                      <span>Tổng phí bồi thường:</span>
                      <span className="text-rose-600 text-base">{totalDamageCharge.toLocaleString("vi-VN")} đ</span>
                    </div>
                    <div className="rounded-lg bg-amber-50 border border-amber-200 p-2.5 text-[10px] text-amber-800 flex gap-1.5 font-semibold">
                      <Info className="size-4 shrink-0 text-amber-600" />
                      Khách hàng sẽ xem chi tiết breakdown và xác nhận trước khi thanh toán.
                    </div>
                  </div>
                )}
              </div>
            )}
          </StaffCard>
        )}

        {/* Actions */}
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
            disabled={isSubmitting}
          >
            <FileCheck className="size-4.5" />
            {isSubmitting
              ? "Đang lưu..."
              : isByoc
                ? "Xác nhận xe khách"
                : "Lưu biên bản kiểm định"}
          </StaffButton>
        </div>
      </form>
    </div>
  )
}
