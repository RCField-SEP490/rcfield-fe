import { useState } from "react"
import { toast } from "sonner"
import type { ContestRegistration } from "@/features/contests/types"
import { formatContestDateTime, getRegistrationDisplayName, getRegistrationSubtitle } from "@/features/contests/lib/contest-runtime"
import { getPaymentStatusLabel, getRegistrationStatusLabel } from "@/features/contests/lib/contest-status"
import { uploadImage } from "@/features/uploads/api/upload.api"
import { StaffBadge, StaffButton, StaffCard } from "@/pages/staff/components/StaffUI"

type ByocInspectionPhoto = { url: string; angle?: string; notes?: string }
type ByocPhotoSlot = ByocInspectionPhoto & { uploading?: boolean }
type ByocInspectionChecklistItem = {
  itemKey: string
  itemLabel: string
  status?: "OK" | "NOT_OK" | "NA"
  note?: string
}

export function ContestCheckInResultCard({
  registration,
  onCheckIn,
  isPending,
}: {
  registration: ContestRegistration | null
  onCheckIn: (payload: {
    byocConfirmed?: boolean
    byocInspection?: {
      photos: ByocInspectionPhoto[]
      checklist: ByocInspectionChecklistItem[]
    }
  }) => void
  isPending?: boolean
}) {
  const [byocConfirmed, setByocConfirmed] = useState(false)
  const [byocPhotos, setByocPhotos] = useState<ByocPhotoSlot[]>([])
  const [byocChecklist, setByocChecklist] = useState<ByocInspectionChecklistItem[]>([
    { itemKey: "body", itemLabel: "Thân xe / vỏ xe", status: "OK" },
    { itemKey: "power_system", itemLabel: "Hệ thống nguồn / pin / motor", status: "OK" },
    { itemKey: "wheels", itemLabel: "Bánh xe / lốp / trục bánh", status: "OK" },
  ])

  const isByoc = registration?.vehicleSource === "BYOC"
  const isCheckedIn = registration?.status === "CHECKED_IN"
  const byocDeclaration = (registration?.metadata?.byoc_declaration ?? null) as {
    vehicle_name?: string | null
    vehicle_brand?: string | null
    vehicle_class?: string | null
    notes?: string | null
  } | null

  const requiredChecklistKeys = new Set(["body", "power_system", "wheels"])
  const providedChecklistKeys = new Set(byocChecklist.map((item) => item.itemKey))
  const missingChecklistKeys = Array.from(requiredChecklistKeys).filter(
    (key) => !providedChecklistKeys.has(key),
  )

  const validPhotoCount = byocPhotos.filter(
    (photo) => photo.url.trim().length > 0 && !photo.uploading,
  ).length
  const anyUploading = byocPhotos.some((photo) => photo.uploading)
  const canCheckIn =
    !isByoc ||
    (byocConfirmed &&
      validPhotoCount >= 2 &&
      missingChecklistKeys.length === 0 &&
      !anyUploading)

  const handleCheckIn = () => {
    if (!registration) return
    if (isByoc) {
      onCheckIn({
        byocConfirmed,
        byocInspection: {
          photos: byocPhotos
            .filter((photo) => photo.url.trim().length > 0)
            .map(({ url, angle, notes }) => ({ url, angle, notes })),
          checklist: byocChecklist,
        },
      })
    } else {
      onCheckIn({})
    }
  }

  const addPhoto = () => {
    setByocPhotos((prev) => [...prev, { url: "" }])
  }

  const updatePhoto = (index: number, patch: Partial<ByocPhotoSlot>) => {
    setByocPhotos((prev) => prev.map((p, i) => (i === index ? { ...p, ...patch } : p)))
  }

  const removePhoto = (index: number) => {
    setByocPhotos((prev) => prev.filter((_, i) => i !== index))
  }

  const handlePhotoFile = async (index: number, file: File) => {
    updatePhoto(index, { uploading: true })
    try {
      const uploaded = await uploadImage(file, "contest-checkin")
      updatePhoto(index, { url: uploaded.url, uploading: false })
    } catch (error) {
      updatePhoto(index, { uploading: false })
      toast.error("Không thể tải ảnh lên", {
        description: error instanceof Error ? error.message : "Vui lòng thử lại.",
      })
    }
  }

  const updateChecklistItem = (index: number, patch: Partial<ByocInspectionChecklistItem>) => {
    setByocChecklist((prev) => prev.map((item, i) => (i === index ? { ...item, ...patch } : item)))
  }

  return (
    <StaffCard className="space-y-4">
      <h3 className="text-base font-extrabold text-[#1c1b1b]">Kết quả tra cứu</h3>
      {registration ? (
        <>
          <div className="flex flex-wrap items-center gap-2">
            <p className="text-sm font-extrabold text-[#1c1b1b]">{getRegistrationDisplayName(registration)}</p>
            <StaffBadge variant={registration.status === "CHECKED_IN" ? "info" : registration.status === "CONFIRMED" ? "success" : registration.status === "CANCELLED" ? "error" : "warning"}>
              {getRegistrationStatusLabel(registration.status)}
            </StaffBadge>
            <StaffBadge variant={registration.paymentStatus === "MARKED_PAID" || registration.paymentStatus === "WAIVED" ? "success" : registration.paymentStatus === "PENDING_REVIEW" ? "info" : "warning"}>
              {getPaymentStatusLabel(registration.paymentStatus)}
            </StaffBadge>
            <StaffBadge variant={isByoc ? "warning" : "info"}>
              {isByoc ? "Xe cá nhân (BYOC)" : "Xe thuê"}
            </StaffBadge>
          </div>
          <div className="space-y-2 text-sm font-semibold text-[#4c4a49]">
            <p>Ngườ thi đấu: {getRegistrationSubtitle(registration) ?? `Mã đăng ký ${registration.id.slice(0, 8)}`}</p>
            <p>Mã điểm danh: {registration.checkInCode ?? "--"}</p>
            <p>Đã điểm danh lúc: {formatContestDateTime(registration.checkedInAt)}</p>
            <p>Trạng thái thanh toán: {getPaymentStatusLabel(registration.paymentStatus)}</p>
          </div>

          {isCheckedIn ? (
            <div className="rounded-xl border border-blue-200 bg-blue-50 p-4">
              <StaffBadge variant="info">Đã điểm danh</StaffBadge>
              <p className="mt-2 text-sm font-semibold text-blue-800">
                Đăng ký này đã được điểm danh. Không thể điểm danh lại.
              </p>
            </div>
          ) : (
            <>
              {isByoc ? (
                <div className="rounded-xl border border-amber-200 bg-amber-50 p-4 space-y-4">
                  <h4 className="text-sm font-extrabold text-amber-900">Xác nhận xe cá nhân (BYOC)</h4>
                  <div className="grid gap-2 text-sm text-amber-800">
                    <p><span className="font-semibold">Tên xe:</span> {byocDeclaration?.vehicle_name ?? "--"}</p>
                    <p><span className="font-semibold">Hãng:</span> {byocDeclaration?.vehicle_brand ?? "--"}</p>
                    <p><span className="font-semibold">Class:</span> {byocDeclaration?.vehicle_class ?? "--"}</p>
                    {byocDeclaration?.notes ? (
                      <p><span className="font-semibold">Ghi chú:</span> {byocDeclaration.notes}</p>
                    ) : null}
                  </div>

                  <div className="space-y-2">
                    <h5 className="text-xs font-extrabold text-amber-900 uppercase tracking-wide">Checklist kiểm tra xe</h5>
                    {byocChecklist.map((item, index) => (
                      <div key={item.itemKey} className="flex items-start gap-2 text-sm text-amber-900">
                        <span className="font-semibold min-w-[140px]">{item.itemLabel}</span>
                        <select
                          className="rounded border border-amber-300 bg-white px-2 py-1 text-xs"
                          value={item.status ?? "OK"}
                          onChange={(e) =>
                            updateChecklistItem(index, { status: e.target.value as "OK" | "NOT_OK" | "NA" })
                          }
                        >
                          <option value="OK">Đạt</option>
                          <option value="NOT_OK">Không đạt</option>
                          <option value="NA">Không áp dụng</option>
                        </select>
                        <input
                          type="text"
                          placeholder="Ghi chú"
                          className="flex-1 rounded border border-amber-300 bg-white px-2 py-1 text-xs"
                          value={item.note ?? ""}
                          onChange={(e) => updateChecklistItem(index, { note: e.target.value })}
                        />
                      </div>
                    ))}
                  </div>

                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <h5 className="text-xs font-extrabold text-amber-900 uppercase tracking-wide">Ảnh kiểm tra xe (tối thiểu 2 ảnh)</h5>
                      <button
                        type="button"
                        onClick={addPhoto}
                        className="text-xs font-bold text-amber-800 hover:text-amber-950"
                      >
                        + Thêm ảnh
                      </button>
                    </div>
                    {byocPhotos.length === 0 ? (
                      <p className="text-xs text-amber-700">Chưa có ảnh nào.</p>
                    ) : (
                      <div className="space-y-2">
                        {byocPhotos.map((photo, index) => (
                          <div key={index} className="flex items-start gap-2">
                            <div className="flex size-16 shrink-0 items-center justify-center overflow-hidden rounded-lg border border-amber-300 bg-white">
                              {photo.uploading ? (
                                <span className="text-[10px] font-bold text-amber-700">Đang tải...</span>
                              ) : photo.url ? (
                                <img
                                  src={photo.url}
                                  alt={`Ảnh kiểm tra ${index + 1}`}
                                  className="h-full w-full object-cover"
                                />
                              ) : (
                                <span className="text-[10px] font-bold text-amber-500">Chưa có</span>
                              )}
                            </div>
                            <div className="flex-1 space-y-1">
                              <input
                                type="file"
                                accept="image/*"
                                disabled={photo.uploading}
                                className="w-full rounded border border-amber-300 bg-white px-2 py-1 text-xs file:mr-2 file:rounded file:border-0 file:bg-amber-100 file:px-2 file:py-0.5 file:text-xs file:font-bold file:text-amber-800"
                                onChange={(e) => {
                                  const file = e.target.files?.[0]
                                  if (file) void handlePhotoFile(index, file)
                                }}
                              />
                              <input
                                type="text"
                                placeholder="Góc chụp"
                                className="w-full rounded border border-amber-300 bg-white px-2 py-1 text-xs"
                                value={photo.angle ?? ""}
                                onChange={(e) => updatePhoto(index, { angle: e.target.value })}
                              />
                            </div>
                            <button
                              type="button"
                              onClick={() => removePhoto(index)}
                              disabled={photo.uploading}
                              className="text-xs font-bold text-red-600 hover:text-red-800 disabled:opacity-50"
                            >
                              Xóa
                            </button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  <label className="flex items-start gap-2 text-sm text-amber-900 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={byocConfirmed}
                      onChange={(e) => setByocConfirmed(e.target.checked)}
                      className="mt-0.5"
                    />
                    <span>
                      Tôi xác nhận xe cá nhân đã kiểm tra đạt chuẩn thi đấu và đúng như khai báo.
                    </span>
                  </label>

                  {isByoc && !canCheckIn ? (
                    <p className="text-xs text-amber-700">
                      Vui lòng hoàn tất checklist, tải lên ít nhất 2 ảnh (chờ tải xong), và xác nhận xe đạt chuẩn trước khi điểm danh.
                    </p>
                  ) : null}
                </div>
              ) : null}

              <StaffButton
                onClick={handleCheckIn}
                disabled={isPending || !canCheckIn || anyUploading}
              >
                {isPending ? "Đang điểm danh..." : "Xác nhận điểm danh"}
              </StaffButton>
            </>
          )}
        </>
      ) : (
        <p className="text-sm font-semibold text-[#6b7280]">Chưa có kết quả tra cứu.</p>
      )}
    </StaffCard>
  )
}
