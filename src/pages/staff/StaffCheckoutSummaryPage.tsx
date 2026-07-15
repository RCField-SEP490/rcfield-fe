import { useState, useEffect, useCallback } from "react"
import { useParams, useNavigate } from "react-router"
import {
  ChevronLeft,
  AlertTriangle,
  CheckCircle2,
  Info,
  Plus,
  Trash2,
  FileCheck,
  ShieldAlert,
} from "lucide-react"
import {
  staffApi,
  type DamageLineItemInput,
} from "@/features/staff/api/staff.api"
import { toast } from "sonner"
import { StaffCard, StaffButton } from "./components/StaffUI"

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

interface DamageLineItemRow {
  id?: string
  partType: string
  customPartName?: string | null
  partsPrice: number
  laborPrice: number
  lineTotal: number
}

interface CheckoutInspection {
  inspectionId: string
  damageFlagged: boolean
  damageLineItems: DamageLineItemRow[]
  totalDamageCharge: number
  photos: { url: string; angle: string; notes: string }[]
  checklist: { itemLabel: string; checked: boolean; notes: string }[]
  staffNotes: string
  customerConfirmed: boolean
}

export default function StaffCheckoutSummaryPage() {
  const { sessionId } = useParams<{ sessionId: string }>()
  const navigate = useNavigate()

  const [loading, setLoading] = useState(true)
  const [checkoutInspection, setCheckoutInspection] =
    useState<CheckoutInspection | null>(null)
  const [sessionStatus, setSessionStatus] = useState<string>("")

  // Editable damage items state
  const [editMode, setEditMode] = useState(false)
  const [editItems, setEditItems] = useState<DamageLineItemInput[]>([])
  const [savingItems, setSavingItems] = useState(false)

  // Confirm checkout
  const [confirming, setConfirming] = useState(false)

  // Dispute escalation
  const [disputeOpen, setDisputeOpen] = useState(false)
  const [disputeNote, setDisputeNote] = useState("")
  const [escalating, setEscalating] = useState(false)

  const loadSession = useCallback(async () => {
    try {
      setLoading(true)
      const data = await staffApi.getSessionDetail(sessionId!)
      setCheckoutInspection(data.checkoutInspection ?? null)
      setSessionStatus(data.status ?? "")
    } catch {
      toast.error("Không thể tải thông tin phiên chơi.")
    } finally {
      setLoading(false)
    }
  }, [sessionId])

  useEffect(() => {
    if (!sessionId) return
    queueMicrotask(() => {
      void loadSession()
    })
  }, [sessionId, loadSession])

  const enterEditMode = () => {
    if (!checkoutInspection) return
    setEditItems(
      checkoutInspection.damageLineItems.map((li) => ({
        partType: li.partType as DamageLineItemInput["partType"],
        customPartName: li.customPartName ?? undefined,
        partsPrice: li.partsPrice,
        laborPrice: li.laborPrice,
      })),
    )
    setEditMode(true)
  }

  const addEditItem = () =>
    setEditItems((prev) => [
      ...prev,
      { partType: "TIRE_WHEEL", partsPrice: 0, laborPrice: 0 },
    ])

  const removeEditItem = (index: number) =>
    setEditItems((prev) => prev.filter((_, i) => i !== index))

  const updateEditItem = (
    index: number,
    field: keyof DamageLineItemInput,
    value: string | number,
  ) =>
    setEditItems((prev) =>
      prev.map((item, i) => (i === index ? { ...item, [field]: value } : item)),
    )

  const saveEditItems = async () => {
    if (!checkoutInspection) return
    if (
      editItems.some(
        (item) => item.partType === "OTHER" && !item.customPartName?.trim(),
      )
    ) {
      toast.error('Vui lòng nhập tên hư hỏng cho mục "Khác".')
      return
    }
    setSavingItems(true)
    try {
      const result = await staffApi.updateDamageItems(
        sessionId!,
        checkoutInspection.inspectionId,
        editItems,
      )
      setCheckoutInspection((prev) =>
        prev
          ? {
              ...prev,
              damageLineItems: result.damageLineItems,
              totalDamageCharge: result.totalDamageCharge,
              damageFlagged: result.damageLineItems.length > 0,
            }
          : prev,
      )
      setEditMode(false)
      toast.success("Đã cập nhật danh sách hư hỏng.")
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } } })
        ?.response?.data?.message
      toast.error(msg ?? "Không thể cập nhật hư hỏng.")
    } finally {
      setSavingItems(false)
    }
  }

  const handleConfirmCheckout = async () => {
    if (!checkoutInspection) return
    setConfirming(true)
    try {
      await staffApi.confirmCheckout(
        sessionId!,
        checkoutInspection.inspectionId,
      )
      toast.success("Đã xác nhận trả xe thành công. Phiên chơi đã hoàn tất!")
      void loadSession()
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } } })
        ?.response?.data?.message
      toast.error(msg ?? "Không thể xác nhận checkout.")
    } finally {
      setConfirming(false)
    }
  }

  const handleEscalate = async () => {
    if (!checkoutInspection || !disputeNote.trim()) {
      toast.error("Vui lòng nhập lý do tranh chấp.")
      return
    }
    setEscalating(true)
    try {
      await staffApi.escalateDispute(
        sessionId!,
        checkoutInspection.inspectionId,
        disputeNote,
      )
      toast.success(
        "Đã leo thang tranh chấp lên Provider. Vui lòng chờ phán quyết.",
      )
      setDisputeOpen(false)
      navigate("/staff/today-bookings")
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } } })
        ?.response?.data?.message
      toast.error(msg ?? "Không thể gửi tranh chấp.")
    } finally {
      setEscalating(false)
    }
  }

  if (loading) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center">
        <p className="text-sm text-[#6b7280] font-semibold animate-pulse">
          Đang tải biên bản...
        </p>
      </div>
    )
  }

  if (!checkoutInspection) {
    return (
      <div className="flex min-h-[50vh] flex-col items-center justify-center gap-3 p-4">
        <AlertTriangle className="size-12 text-[#6b7280]" />
        <h3 className="text-lg font-bold text-[#1c1b1b]">
          Chưa có biên bản Check-Out
        </h3>
        <p className="text-xs text-[#6b7280] font-semibold text-center max-w-xs">
          Cần hoàn tất kiểm tra xe trước khi xem biên bản này.
        </p>
        <StaffButton
          variant="outline"
          onClick={() => navigate(`/staff/sessions/${sessionId}`)}
        >
          <ChevronLeft className="size-4" />
          Quay lại phiên chạy
        </StaffButton>
      </div>
    )
  }

  const editTotal = editItems.reduce(
    (sum, item) => sum + (item.partsPrice || 0) + (item.laborPrice || 0),
    0,
  )

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <StaffButton
          onClick={() => navigate(`/staff/sessions/${sessionId}`)}
          variant="outline"
          size="sm"
          className="p-2 min-w-0 rounded-lg"
          type="button"
        >
          <ChevronLeft className="size-5 text-[#6b7280]" />
        </StaffButton>
        <div>
          <span className="text-xs text-[#6b7280] font-bold font-mono">
            Phiên: {sessionId}
          </span>
          <h2 className="text-xl font-extrabold text-[#1c1b1b] tracking-tight">
            Biên Bản Trả Xe — Xác Nhận Checkout
          </h2>
        </div>
      </div>

      {/* Status banner */}
      {sessionStatus === "CHECKING_OUT" && (
        <div className="rounded-xl bg-amber-50 border border-amber-200 px-4 py-3 flex items-center gap-2.5 text-sm font-semibold text-amber-800">
          <Info className="size-5 shrink-0 text-amber-600" />
          Đang chờ xác nhận — Trình bày biên bản cho khách xem, sau đó nhấn "Xác
          nhận Checkout".
        </div>
      )}

      {/* Checklist summary */}
      <StaffCard className="space-y-3">
        <h3 className="text-xs font-bold uppercase tracking-wider text-[#4c4a49]">
          Kết quả kiểm tra
        </h3>
        <div className="space-y-1.5">
          {checkoutInspection.checklist.map((item, i) => (
            <div
              key={i}
              className="flex items-start gap-2 text-xs font-semibold text-[#1c1b1b]"
            >
              <span
                className={`mt-0.5 ${item.checked ? "text-emerald-500" : "text-rose-500"}`}
              >
                {item.checked ? "✓" : "✗"}
              </span>
              <span className={item.checked ? "" : "text-rose-700"}>
                {item.itemLabel}
                {item.notes && (
                  <span className="text-[#6b7280] font-normal">
                    {" "}
                    — {item.notes}
                  </span>
                )}
              </span>
            </div>
          ))}
          {checkoutInspection.checklist.length === 0 && (
            <p className="text-xs text-[#6b7280] font-semibold">
              Không có mục kiểm tra.
            </p>
          )}
        </div>
        {checkoutInspection.staffNotes && (
          <div className="rounded-lg bg-[#fafaf9] border border-[#e5e2e1] p-2.5 text-xs font-semibold text-[#4c4a49]">
            Ghi chú: {checkoutInspection.staffNotes}
          </div>
        )}
      </StaffCard>

      {/* Damage breakdown */}
      <StaffCard className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-xs font-bold uppercase tracking-wider text-[#4c4a49]">
            Bảng kê hư hỏng & bồi thường
          </h3>
          {!editMode && sessionStatus === "CHECKING_OUT" && (
            <StaffButton
              type="button"
              size="sm"
              variant="outline"
              onClick={enterEditMode}
            >
              Sửa danh sách
            </StaffButton>
          )}
        </div>

        {!checkoutInspection.damageFlagged && !editMode && (
          <div className="flex items-center gap-2.5 rounded-xl bg-emerald-50 border border-emerald-200 p-4">
            <CheckCircle2 className="size-6 text-emerald-500 shrink-0" />
            <div>
              <p className="text-sm font-bold text-emerald-800">
                Xe trả lại nguyên vẹn
              </p>
              <p className="text-xs text-emerald-700 font-semibold mt-0.5">
                Không ghi nhận hư hỏng mới. Hoàn toàn ký quỹ.
              </p>
            </div>
          </div>
        )}

        {checkoutInspection.damageFlagged && !editMode && (
          <div className="space-y-2">
            {checkoutInspection.damageLineItems.map((item, i) => (
              <div
                key={item.id ?? i}
                className="rounded-lg border border-[#e5e2e1] bg-[#fafaf9] p-3"
              >
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-xs font-bold text-[#1c1b1b]">
                      {PART_TYPE_LABELS[item.partType] ?? item.partType}
                      {item.customPartName && (
                        <span className="text-[#4c4a49] font-semibold">
                          {" "}
                          — {item.customPartName}
                        </span>
                      )}
                    </p>
                    <div className="flex gap-4 mt-1 text-[10px] font-semibold text-[#6b7280]">
                      <span>
                        Linh kiện: {item.partsPrice.toLocaleString("vi-VN")} đ
                      </span>
                      {item.laborPrice > 0 && (
                        <span>
                          Công sửa: {item.laborPrice.toLocaleString("vi-VN")} đ
                        </span>
                      )}
                    </div>
                  </div>
                  <span className="text-sm font-extrabold text-rose-600">
                    {item.lineTotal.toLocaleString("vi-VN")} đ
                  </span>
                </div>
              </div>
            ))}

            <div className="rounded-xl bg-rose-50 border border-rose-200 p-4 flex items-center justify-between">
              <span className="text-sm font-bold text-rose-900">
                Tổng phí bồi thường:
              </span>
              <span className="text-xl font-extrabold text-rose-700">
                {checkoutInspection.totalDamageCharge.toLocaleString("vi-VN")} đ
              </span>
            </div>
          </div>
        )}

        {/* Edit mode */}
        {editMode && (
          <div className="space-y-3 border-t border-[#e5e2e1] pt-4">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-[#4c4a49]">
                Chỉnh sửa hư hỏng
              </span>
              <StaffButton
                type="button"
                size="sm"
                variant="outline"
                onClick={addEditItem}
              >
                <Plus className="size-3.5" />
                Thêm hạng mục
              </StaffButton>
            </div>

            {editItems.length === 0 && (
              <div className="rounded-lg border border-dashed border-[#e5e2e1] p-4 text-center">
                <p className="text-xs text-[#6b7280] font-semibold">
                  Không có hư hỏng — nhấn "Thêm hạng mục" để ghi nhận.
                </p>
              </div>
            )}

            {editItems.map((item, index) => (
              <div
                key={index}
                className="rounded-lg border border-[#e5e2e1] bg-[#fafaf9] p-3 space-y-2.5"
              >
                <div className="flex items-center gap-2">
                  <select
                    value={item.partType}
                    onChange={(e) =>
                      updateEditItem(index, "partType", e.target.value)
                    }
                    className="flex-1 rounded-lg border border-[#e5e2e1] bg-white px-3 py-2 text-xs font-semibold text-[#1c1b1b] focus:outline-none focus:ring-1 focus:ring-[#ea580c]"
                  >
                    {Object.entries(PART_TYPE_LABELS).map(([value, label]) => (
                      <option key={value} value={value}>
                        {label}
                      </option>
                    ))}
                  </select>
                  <button
                    type="button"
                    onClick={() => removeEditItem(index)}
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
                    onChange={(e) =>
                      updateEditItem(index, "customPartName", e.target.value)
                    }
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
                      onChange={(e) =>
                        updateEditItem(
                          index,
                          "partsPrice",
                          Number(e.target.value),
                        )
                      }
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
                      onChange={(e) =>
                        updateEditItem(
                          index,
                          "laborPrice",
                          Number(e.target.value),
                        )
                      }
                      className="w-full rounded-lg border border-[#e5e2e1] bg-white px-3 py-2 text-xs font-semibold text-[#1c1b1b] focus:outline-none focus:ring-1 focus:ring-[#ea580c]"
                    />
                  </div>
                </div>
                <div className="flex justify-end text-xs font-bold text-[#4c4a49]">
                  Dòng này:{" "}
                  {(
                    (item.partsPrice || 0) + (item.laborPrice || 0)
                  ).toLocaleString("vi-VN")}{" "}
                  đ
                </div>
              </div>
            ))}

            {editItems.length > 0 && (
              <div className="flex justify-between items-center text-sm font-extrabold text-[#1c1b1b] pt-1">
                <span>Tổng mới:</span>
                <span className="text-rose-600">
                  {editTotal.toLocaleString("vi-VN")} đ
                </span>
              </div>
            )}

            <div className="flex gap-2 pt-1">
              <StaffButton
                type="button"
                variant="outline"
                className="flex-1"
                onClick={() => setEditMode(false)}
              >
                Hủy
              </StaffButton>
              <StaffButton
                type="button"
                variant="primary"
                className="flex-1"
                onClick={saveEditItems}
                disabled={savingItems}
              >
                {savingItems ? "Đang lưu..." : "Lưu thay đổi"}
              </StaffButton>
            </div>
          </div>
        )}
      </StaffCard>

      {/* Dispute escalation modal */}
      {disputeOpen && (
        <StaffCard className="space-y-3 border-2 border-amber-300">
          <div className="flex items-center gap-2">
            <ShieldAlert className="size-5 text-amber-600" />
            <h3 className="text-sm font-bold text-amber-900">
              Leo thang tranh chấp lên Provider
            </h3>
          </div>
          <p className="text-xs text-[#6b7280] font-semibold">
            Provider sẽ được thông báo và có toàn quyền phán quyết về mức bồi
            thường.
          </p>
          <textarea
            rows={3}
            placeholder="Mô tả lý do tranh chấp (ví dụ: khách không đồng ý với mức giá cánh gió)..."
            value={disputeNote}
            onChange={(e) => setDisputeNote(e.target.value)}
            className="w-full rounded-lg border border-[#e5e2e1] bg-white px-3 py-2 text-xs font-semibold text-[#1c1b1b] placeholder-[#a09e9d] focus:outline-none focus:ring-1 focus:ring-amber-500 resize-none"
          />
          <div className="flex gap-2">
            <StaffButton
              type="button"
              variant="outline"
              className="flex-1"
              onClick={() => setDisputeOpen(false)}
            >
              Hủy
            </StaffButton>
            <StaffButton
              type="button"
              className="flex-1 bg-amber-600 hover:bg-amber-700 text-white font-bold"
              onClick={handleEscalate}
              disabled={escalating || !disputeNote.trim()}
            >
              {escalating ? "Đang gửi..." : "Gửi tranh chấp"}
            </StaffButton>
          </div>
        </StaffCard>
      )}

      {/* Actions */}
      {!editMode && sessionStatus === "CHECKING_OUT" && (
        <div className="space-y-3 pt-2">
          <StaffButton
            type="button"
            variant="primary"
            className="w-full uppercase tracking-wider gap-2 font-bold text-sm py-3"
            onClick={handleConfirmCheckout}
            disabled={confirming}
          >
            <FileCheck className="size-5" />
            {confirming
              ? "Đang xác nhận..."
              : "Xác nhận Checkout — Hoàn tất phiên chơi"}
          </StaffButton>

          {!disputeOpen && (
            <StaffButton
              type="button"
              variant="outline"
              className="w-full gap-2 text-amber-700 border-amber-300 hover:bg-amber-50"
              onClick={() => setDisputeOpen(true)}
            >
              <ShieldAlert className="size-4" />
              Khách phản hồi sai lệch — Leo thang lên Provider
            </StaffButton>
          )}
        </div>
      )}

      {sessionStatus === "COMPLETED" && (
        <div className="rounded-xl bg-emerald-50 border border-emerald-200 p-4 flex items-center gap-3">
          <CheckCircle2 className="size-6 text-emerald-500 shrink-0" />
          <div>
            <p className="text-sm font-bold text-emerald-800">
              Phiên chơi đã hoàn tất
            </p>
            <p className="text-xs text-emerald-700 font-semibold mt-0.5">
              Biên bản đã được xác nhận và quyết toán.
            </p>
          </div>
        </div>
      )}
    </div>
  )
}
