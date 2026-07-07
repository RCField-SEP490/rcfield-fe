import React, { useState, useEffect } from "react"
import { useParams, useNavigate } from "react-router"
import {
  Clock,
  Car,
  Coffee,
  Plus,
  ArrowLeftRight,
  ChevronLeft,
  AlertTriangle,
  ClipboardCheck,
  FileText,
  HelpCircle,
  Banknote,
  CheckCircle2,
  ShieldCheck,
  Package,
} from "lucide-react"
import { useStaffOperations } from "./context/StaffOperationContext"
import { staffApi } from "@/features/staff/api/staff.api"
import { vehicleApi } from "@/features/vehicles/api/vehicle.api"
import { menuApi } from "@/features/menu/api/menu.api"
import type { VehicleUnit } from "@/features/vehicles/types"
import type { MenuItem } from "@/features/menu/types"
import { toast } from "sonner"
import {
  StaffCard,
  StaffBadge,
  StaffButton,
} from "./components/StaffUI"

export default function StaffSessionDetailPage() {
  const { sessionId } = useParams<{ sessionId: string }>()
  const navigate = useNavigate()
  const {
    bookings,
    sessions,
    fleetStates,
    proposeExtension,
    addFnbOrder,
    swapSessionVehicle,
    refreshData,
  } = useStaffOperations()

  // Find corresponding session and booking
  const session = sessions.find((s) => s.sessionId === sessionId)
  const booking = session ? bookings.find((b) => b.bookingId === session.bookingId) : null

  // Local state controls
  const [timeLeft, setTimeLeft] = useState("")
  const [menuItems, setMenuItems] = useState<MenuItem[]>([])
  const [loadingMenu, setLoadingMenu] = useState(false)
  const [availableFleet, setAvailableFleet] = useState<VehicleUnit[]>([])
  const [settlingPayment, setSettlingPayment] = useState(false)
  const [confirmSettleOpen, setConfirmSettleOpen] = useState(false)

  // F&B local form state
  const [selectedItemName, setSelectedItemName] = useState("")
  const [selectedQty, setSelectedQty] = useState(1)

  // Swap Vehicle local modal state
  const [swapModalOpen, setSwapModalOpen] = useState(false)
  const [swappingVehicleId, setSwappingVehicleId] = useState("") // old vehicle ID
  const [selectedSwapNewUnitId, setSelectedSwapNewUnitId] = useState("")
  const [oldVehicleNewStatus, setOldVehicleNewStatus] = useState<"AVAILABLE" | "MAINTENANCE">("MAINTENANCE")

  // Real-time countdown timer
  useEffect(() => {
    if (!session || (session.status !== "ACTIVE" && session.status !== "EXTENDING")) {
      setTimeLeft("")
      return
    }

    const updateTimer = () => {
      const planned = new Date(session.plannedEnd).getTime()
      const diff = planned - Date.now()
      if (diff <= 0) {
        setTimeLeft("Hết giờ!")
      } else {
        const minutes = Math.floor(diff / 60000)
        const seconds = Math.floor((diff % 60000) / 1000)
        setTimeLeft(`${minutes.toString().padStart(2, "0")}:${seconds.toString().padStart(2, "0")}`)
      }
    }

    updateTimer()
    const interval = setInterval(updateTimer, 1000)
    return () => clearInterval(interval)
  }, [session])

  // Fetch branch catalog data (Menu & Fleet)
  useEffect(() => {
    if (booking?.cafeId) {
      // Menu Items
      setLoadingMenu(true)
      menuApi
        .listMenuItems(booking.cafeId)
        .then((res) => {
          setMenuItems(res.data)
          if (res.data.length > 0) {
            setSelectedItemName(res.data[0].name)
          }
        })
        .catch((err) => console.error("Error loading menu:", err))
        .finally(() => setLoadingMenu(false))

      // Fleet Units for Swap
      vehicleApi
        .listUnits(booking.cafeId)
        .then((units) => {
          setAvailableFleet(units)
        })
        .catch((err) => console.error("Error loading vehicles list for swap:", err))
    }
  }, [booking?.cafeId])

  if (!session || !booking) {
    return (
      <div className="flex min-h-[50vh] flex-col items-center justify-center p-4">
        <AlertTriangle className="size-12 text-[#6b7280] mb-3 animate-bounce" />
        <h3 className="text-lg font-bold text-[#1c1b1b]">Không tìm thấy thông tin ca chơi</h3>
        <p className="text-xs text-[#6b7280] mt-1 font-semibold">Vui lòng kiểm tra lại mã phiên hoặc danh sách hôm nay.</p>
        <StaffButton
          onClick={() => navigate("/staff/today-bookings")}
          variant="primary"
          className="mt-4"
        >
          Trở lại danh sách
        </StaffButton>
      </div>
    )
  }

  // Handle adding custom F&B order
  const handleAddFnb = (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedItemName) return

    const menuItem = menuItems.find((i) => i.name === selectedItemName)
    const price = menuItem ? Number(menuItem.price) || 30000 : 30000

    addFnbOrder(session.sessionId, [
      {
        name: selectedItemName,
        qty: selectedQty,
        price,
      },
    ])
    setSelectedQty(1)
  }

  const handleSettlePayment = async () => {
    if (!booking) return
    try {
      setSettlingPayment(true)
      await staffApi.settlePendingPayments(booking.bookingId)
      toast.success("Xác nhận thanh toán thành công!")
      await refreshData()
    } catch (err: any) {
      toast.error("Không thể quyết toán thanh toán: " + (err.message || err))
    } finally {
      setSettlingPayment(false)
    }
  }

  // Handle Swap Vehicle confirmation
  const handleConfirmSwap = () => {
    if (!selectedSwapNewUnitId) {
      toast.error("Vui lòng chọn xe thay thế!")
      return
    }

    const newUnit = availableFleet.find((u) => u.id === selectedSwapNewUnitId)
    if (!newUnit) return

    swapSessionVehicle(
      session.sessionId,
      swappingVehicleId,
      newUnit.id,
      oldVehicleNewStatus,
      {
        name: newUnit.catalog?.name || newUnit.identifier,
        imageUrl: newUnit.distinctive_image_url || undefined,
      }
    )

    setSwapModalOpen(false)
    setSelectedSwapNewUnitId("")
  }

  // Compute Badge variant dynamically
  const sessionBadgeVariant =
    session.status === "ACTIVE"
      ? "success"
      : session.status === "CHECKED_IN"
      ? "info"
      : session.status === "EXTENDING"
      ? "orange"
      : session.status === "CHECKING_OUT"
      ? "warning"
      : "neutral"

  const checkInInspection = session.inspections.find((inspection) => inspection.type === "CHECK_IN")
  const checkOutInspection = session.inspections.find((inspection) => inspection.type === "CHECK_OUT")
  const checkInPending = Boolean(checkInInspection && !checkInInspection.customerConfirmed && !checkInInspection.customerConfirmedAt)
  const checkOutPending = Boolean(checkOutInspection && !checkOutInspection.customerConfirmed && !checkOutInspection.customerConfirmedAt)
  const checkInDisputed = Boolean(checkInInspection && !checkInInspection.customerConfirmed && checkInInspection.customerConfirmedAt)
  const checkOutDisputed = Boolean(checkOutInspection && !checkOutInspection.customerConfirmed && checkOutInspection.customerConfirmedAt)
  const extensionPending = session.extensionProposal?.status === "PENDING"
  const approvedExtensionFee = session.extensionProposal?.status === "APPROVED" ? session.extensionProposal.additionalFee : 0

  // Extension fee derived from booking slot rate (placed after approvedExtensionFee to avoid TDZ)
  const sessionDurationMinutes =
    (new Date(booking.slotEnd).getTime() - new Date(booking.slotStart).getTime()) / 60000
  const slotRatePerMinute = sessionDurationMinutes > 0 ? booking.slotFee / sessionDurationMinutes : 0
  const calcExtensionFee = (mins: number) =>
    Math.round((slotRatePerMinute * mins) / 1000) * 1000
  const maxExtensionFee = booking.depositAmount > 0 ? booking.depositAmount * 0.5 : Infinity
  const remainingCap = Math.max(0, maxExtensionFee - approvedExtensionFee)
  const extensionOptions = ([15, 30, 60] as const).map((mins) => {
    const fee = calcExtensionFee(mins)
    return { mins, fee, blocked: fee > remainingCap }
  })
  const handleExtension = (mins: number, fee: number) => proposeExtension(session.sessionId, mins, fee)
  const slotEndMs = new Date(booking.slotEnd).getTime()
  const projectedEnd = (extraMins: number) =>
    new Date(slotEndMs + extraMins * 60000).toLocaleTimeString("vi-VN", { hour: "2-digit", minute: "2-digit" })
  const fnbTotal = (session.fnbOrders || []).reduce((sum, order) => sum + order.total, 0)
  const damageCharge = session.damageClaim?.finalCharge ?? 0

  // ── Best Practice Billing Separation ──
  const depositAmount = booking.depositAmount

  // Deposit ONLY offsets vehicle damage charge (asset protection)
  const depositConsumedByDamage = Math.min(depositAmount, damageCharge)
  const depositRefundAmount = depositAmount - depositConsumedByDamage    // cash to return to customer
  const damageExceedingDeposit = Math.max(0, damageCharge - depositAmount) // extra damage to bill at counter

  // Counter service bill = F&B + Extension + damage that exceeds deposit
  const totalCounterBill = fnbTotal + approvedExtensionFee + damageExceedingDeposit
  // Net amount customer hands over at the counter (positive = customer pays, negative = staff returns change)
  const netCounterAmount = totalCounterBill - depositRefundAmount

  // UI flags
  const hasPendingCounterPayment = booking.payment_components?.some(
    (c: any) => c.status === "PENDING"
  ) ?? false
  const hasPendingDepositRefund = booking.payment_components?.some(
    (c: any) => c.type === "SECURITY_DEPOSIT" && c.status === "PENDING_REFUND"
  ) ?? false
  const isFullySettled = !hasPendingCounterPayment && !hasPendingDepositRefund &&
    booking.payment_components?.some((c: any) => c.status === "DISBURSED")

  return (
    <div className="space-y-6">
      {/* 1. Header Navigation Bar */}
      <div className="flex items-center gap-3">
        <StaffButton
          onClick={() => navigate("/staff/today-bookings")}
          variant="outline"
          size="sm"
          className="p-2 min-w-0 rounded-lg"
        >
          <ChevronLeft className="size-5 text-[#6b7280]" />
        </StaffButton>
        <div>
          <span className="text-xs text-[#6b7280] font-bold font-mono uppercase">Mã phiên: {session.sessionId}</span>
          <h2 className="text-xl font-extrabold text-[#1c1b1b] tracking-tight">Chi Tiết Ca Chạy Xe</h2>
        </div>
      </div>

      {/* 2. SESSION INFO CARD */}
      <StaffCard className="relative overflow-hidden">
        <div className="absolute right-0 top-0 h-full w-1/5 bg-gradient-to-l from-[#fff3eb]/15 to-transparent pointer-events-none" />

        {/* Top row: status badge + track name + timer */}
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3 flex-wrap">
            <StaffBadge variant={sessionBadgeVariant}>
              {session.status === "ACTIVE" && "ĐANG CHƠI"}
              {session.status === "CHECKED_IN" && "ĐÃ CHECK-IN"}
              {session.status === "EXTENDING" && "YÊU CẦU GIA HẠN"}
              {session.status === "CHECKING_OUT" && "ĐANG TRẢ XE"}
              {session.status === "COMPLETED" && "ĐÃ ĐÓNG"}
            </StaffBadge>
            <div>
              <h3 className="text-xl font-black text-[#1c1b1b] tracking-tight leading-tight">{booking.trackName}</h3>
              <p className="text-[11px] text-[#6b7280] font-semibold">{booking.trackType} · {booking.shortCode}</p>
            </div>
          </div>

          {(session.status === "ACTIVE" || session.status === "EXTENDING") && (
            <div className="bg-[#fff3eb] border border-[#ffdbca] rounded-xl px-5 py-2 text-center min-w-32 shrink-0 shadow-sm">
              <span className="text-[10px] font-extrabold text-[#ea580c] uppercase tracking-wider block">
                Còn lại
              </span>
              <span className="text-2xl font-mono font-black text-[#ea580c] tracking-tight">{timeLeft}</span>
            </div>
          )}
        </div>

        {/* Bottom metadata strip */}
        <div className="mt-4 pt-3 border-t border-[#e5e2e1] grid grid-cols-2 sm:grid-cols-4 gap-x-6 gap-y-3 text-xs font-semibold">
          <div className="col-span-2 sm:col-span-2">
            <span className="text-[#6b7280] block mb-1">
              Người chơi ({booking.participantDetails?.length ?? booking.plannedParticipants.length})
            </span>
            <div className="space-y-0.5">
              {(booking.participantDetails
                ? booking.participantDetails
                : booking.plannedParticipants.map((name) => ({ name, phone: undefined, isBooker: false }))
              ).map((p, i) => (
                <div key={i} className="flex items-center gap-1.5 flex-wrap">
                  <span className="text-[#1c1b1b] font-bold">{p.name}</span>
                  {p.isBooker && (
                    <span className="text-[9px] font-extrabold uppercase tracking-wide bg-[#fff3eb] text-[#ea580c] border border-[#ffdbca] rounded px-1 py-0.5 leading-none">
                      Booker
                    </span>
                  )}
                  {p.phone && (
                    <span className="text-[#9b8fa8] font-normal">{p.phone}</span>
                  )}
                </div>
              ))}
            </div>
          </div>
          <div>
            <span className="text-[#6b7280] block mb-0.5">Giờ chơi</span>
            <span className="text-[#1c1b1b] font-bold">
              {new Date(booking.slotStart).toLocaleTimeString("vi-VN", { hour: "2-digit", minute: "2-digit" })}
              {" – "}
              {new Date(booking.slotEnd).toLocaleTimeString("vi-VN", { hour: "2-digit", minute: "2-digit" })}
            </span>
          </div>
          <div>
            <span className="text-[#6b7280] block mb-0.5">Nhân viên trực</span>
            <span className="text-[#1c1b1b] font-bold">{session.staffName}</span>
          </div>
        </div>
      </StaffCard>

      {/* 3. PRE-SESSION INFO STRIP — show before session goes ACTIVE */}
      {(session.status === "CHECKED_IN") && (
        <div className="grid sm:grid-cols-3 gap-3">
          {/* Play mode */}
          <div className="rounded-xl border border-[#e5e2e1] bg-white px-4 py-3 flex items-start gap-3">
            <div className="flex size-8 items-center justify-center rounded-lg bg-[#fff3eb] shrink-0 mt-0.5">
              <ShieldCheck className="size-4 text-[#ea580c]" />
            </div>
            <div>
              <p className="text-[10px] font-extrabold uppercase tracking-wide text-[#6b7280] mb-0.5">Chế độ chơi</p>
              <p className="text-sm font-extrabold text-[#1c1b1b]">
                {booking.playMode === "RENTAL" ? "Thuê xe tại quán" : booking.playMode === "BYOC" ? "Mang xe cá nhân" : booking.playMode}
              </p>
              {booking.playMode === "RENTAL" && (
                <p className="text-[11px] text-[#ea580c] font-semibold mt-0.5">Cần bàn giao xe cho khách</p>
              )}
              {booking.playMode === "BYOC" && (
                <p className="text-[11px] text-[#6b7280] font-semibold mt-0.5">Khách tự mang xe</p>
              )}
            </div>
          </div>

          {/* Planned vehicles */}
          <div className="rounded-xl border border-[#e5e2e1] bg-white px-4 py-3 flex items-start gap-3">
            <div className="flex size-8 items-center justify-center rounded-lg bg-[#fff3eb] shrink-0 mt-0.5">
              <Car className="size-4 text-[#ea580c]" />
            </div>
            <div className="min-w-0">
              <p className="text-[10px] font-extrabold uppercase tracking-wide text-[#6b7280] mb-0.5">Xe đã đặt ({booking.plannedVehicles.length})</p>
              {booking.plannedVehicles.length > 0 ? (
                <div className="space-y-0.5">
                  {booking.plannedVehicles.map((v, i) => (
                    <p key={i} className="text-xs font-bold text-[#1c1b1b] truncate">{v}</p>
                  ))}
                </div>
              ) : (
                <p className="text-xs text-[#6b7280] font-semibold">Chưa chỉ định xe</p>
              )}
            </div>
          </div>

          {/* Pre-ordered F&B */}
          <div className="rounded-xl border border-[#e5e2e1] bg-white px-4 py-3 flex items-start gap-3">
            <div className={`flex size-8 items-center justify-center rounded-lg shrink-0 mt-0.5 ${booking.fnbPreorderFee > 0 ? "bg-amber-50" : "bg-[#f5f3f2]"}`}>
              <Package className={`size-4 ${booking.fnbPreorderFee > 0 ? "text-amber-600" : "text-[#6b7280]"}`} />
            </div>
            <div>
              <p className="text-[10px] font-extrabold uppercase tracking-wide text-[#6b7280] mb-0.5">F&B đặt trước</p>
              {booking.fnbPreorderFee > 0 ? (
                <>
                  <p className="text-sm font-extrabold text-amber-700">{booking.fnbPreorderFee.toLocaleString("vi-VN")} đ</p>
                  <p className="text-[11px] text-amber-600 font-semibold mt-0.5">Chuẩn bị trước khi bắt đầu</p>
                </>
              ) : (
                <p className="text-xs text-[#6b7280] font-semibold">Không có đặt trước</p>
              )}
            </div>
          </div>
        </div>
      )}

      {/* 4. CORE ACTION MODULES (F&B / Extensions / Fleet controls) */}
      {(session.status === "ACTIVE" || session.status === "EXTENDING") && (
        <div className="grid md:grid-cols-2 gap-6">
          {/* Module 1: Fleet swap & Extension Controls */}
          <div className="space-y-6">
            {/* Extensions panel */}
            <StaffCard className="space-y-3">
              <div className="flex items-center justify-between">
                <h4 className="text-sm font-bold text-[#1c1b1b] uppercase tracking-wider flex items-center gap-2">
                  <Clock className="size-4 text-[#ea580c]" />
                  Gia hạn ca chạy
                </h4>
                <span className="text-[11px] font-semibold text-[#6b7280]">
                  Kết thúc lúc{" "}
                  <span className="text-[#1c1b1b] font-extrabold">
                    {new Date(booking.slotEnd).toLocaleTimeString("vi-VN", { hour: "2-digit", minute: "2-digit" })}
                  </span>
                </span>
              </div>

              {extensionPending ? (
                <div className="rounded-xl border border-orange-200 bg-orange-50 p-3 text-xs font-semibold text-orange-800 flex items-center gap-2">
                  <Clock className="size-3.5 shrink-0" />
                  Đang chờ khách phản hồi đề xuất gia hạn {session.extensionProposal?.extraMinutes} phút…
                </div>
              ) : (
                <div className="grid grid-cols-3 gap-2">
                  {extensionOptions.map(({ mins, fee, blocked }) => (
                    <button
                      key={mins}
                      type="button"
                      disabled={blocked}
                      onClick={() => !blocked && handleExtension(mins, fee)}
                      title={blocked ? `Vượt giới hạn gia hạn (tối đa ${(maxExtensionFee === Infinity ? "—" : (maxExtensionFee).toLocaleString("vi-VN") + " đ")})` : undefined}
                      className={`rounded-xl border transition-all p-2.5 text-center group ${
                        blocked
                          ? "border-[#e5e2e1] bg-[#f5f3f2] opacity-50 cursor-not-allowed"
                          : "border-[#e5e2e1] bg-white hover:border-[#ea580c] hover:bg-[#fff3eb] cursor-pointer"
                      }`}
                    >
                      <span className={`block text-sm font-extrabold ${blocked ? "text-[#9b8fa8]" : "text-[#ea580c]"}`}>
                        +{mins < 60 ? `${mins} phút` : "1 giờ"}
                      </span>
                      <span className="block text-[10px] text-[#6b7280] font-semibold mt-0.5">
                        → {projectedEnd(mins)}
                      </span>
                      <span className={`block text-[10px] font-bold mt-1 ${blocked ? "text-[#9b8fa8]" : "text-[#1c1b1b]"}`}>
                        {fee.toLocaleString("vi-VN")} đ
                      </span>
                    </button>
                  ))}
                </div>
              )}

              <p className="text-[10px] text-[#9b8fa8] leading-relaxed">
                Nếu slot tiếp theo đã có đơn, hệ thống sẽ báo lỗi và không gửi đề xuất.
              </p>
            </StaffCard>

            {/* Active Vehicles & Swap Button */}
            <StaffCard className="space-y-4">
              {(() => {
                // For BYOC: pad vehicle list to match participant count if DB had old data (1 vehicle only)
                const participantNames = booking.participantDetails?.map((p) => p.name)
                  ?? booking.plannedParticipants
                const isByocMode = booking.playMode === "BYOC"
                const displayVehicles = isByocMode && session.vehicles.length < participantNames.length
                  ? [
                      ...session.vehicles,
                      ...participantNames.slice(session.vehicles.length).map((name, i) => ({
                        vehicleId: `byoc-placeholder-${i}`,
                        name: `Xe của ${name} (BYOC)`,
                        type: "BYOC" as const,
                        imageUrl: undefined,
                      })),
                    ]
                  : session.vehicles

                return (
                  <>
                    <h4 className="text-sm font-bold text-[#1c1b1b] uppercase tracking-wider flex items-center gap-2">
                      <Car className="size-4.5 text-[#ea580c]" />
                      Xe đang chạy trên làn đua ({displayVehicles.length})
                    </h4>

                    <div className="space-y-2">
                      {displayVehicles.map((v) => (
                  <div
                    key={v.vehicleId}
                    className="flex items-center justify-between rounded-lg bg-[#fcf8f8] p-3 border border-[#e5e2e1]"
                  >
                    <div className="flex items-center gap-3">
                      <div className="flex size-9 items-center justify-center rounded-lg bg-white border border-[#e5e2e1]">
                        <Car className="size-4.5 text-[#6b7280]" />
                      </div>
                      <div>
                        <p className="text-xs font-bold text-[#1c1b1b]">{v.name}</p>
                        <p className="text-[10px] text-[#6b7280] font-semibold">Mã ID: {v.vehicleId}</p>
                      </div>
                    </div>

                    {/* Swap Trigger */}
                    {v.type === "RENT" && (
                      <StaffButton
                        onClick={() => {
                          setSwappingVehicleId(v.vehicleId)
                          setSwapModalOpen(true)
                        }}
                        variant="secondary"
                        size="sm"
                        className="py-1 px-2.5 text-[10px] font-bold rounded-lg"
                      >
                        <ArrowLeftRight className="size-3" />
                        Đổi Xe Khác
                      </StaffButton>
                    )}
                      </div>
                    ))}
                  </div>
                  </>
                )
              })()}
            </StaffCard>
          </div>

          {/* Module 2: Menu F&B Console */}
          <StaffCard className="space-y-4">
            <h4 className="text-sm font-bold text-[#1c1b1b] uppercase tracking-wider flex items-center gap-2">
              <Coffee className="size-4.5 text-[#ea580c]" />
              Gọi dịch vụ ăn uống (F&B)
            </h4>

            {loadingMenu ? (
              <div className="h-44 animate-pulse bg-[#fcf8f8] border border-[#e5e2e1] rounded-xl" />
            ) : (
              <form onSubmit={handleAddFnb} className="space-y-4">
                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-wider text-[#4c4a49] mb-1.5">
                    Chọn món ăn/nước uống
                  </label>
                  <select
                    value={selectedItemName}
                    onChange={(e) => setSelectedItemName(e.target.value)}
                    className="w-full rounded-lg border border-[#e5e2e1] bg-white px-3.5 py-2.5 text-sm font-semibold text-[#1c1b1b] focus:border-[#ea580c] focus:outline-none focus:ring-1 focus:ring-[#ea580c]"
                  >
                    {menuItems.map((item) => (
                      <option key={item.id} value={item.name}>
                        {item.name} - {Number(item.price).toLocaleString("vi-VN")} đ
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-wider text-[#4c4a49] mb-1.5">
                    Số lượng
                  </label>
                  <input
                    type="number"
                    min={1}
                    max={10}
                    value={selectedQty}
                    onChange={(e) => setSelectedQty(Number(e.target.value))}
                    className="w-full rounded-lg border border-[#e5e2e1] bg-white px-3.5 py-2.5 text-sm font-semibold text-[#1c1b1b] focus:border-[#ea580c] focus:outline-none focus:ring-1 focus:ring-[#ea580c]"
                  />
                </div>

                <StaffButton
                  type="submit"
                  variant="primary"
                  className="w-full text-xs uppercase tracking-wider"
                >
                  <Plus className="size-4" />
                  Thêm món & Báo chế biến
                </StaffButton>
              </form>
            )}
          </StaffCard>
        </div>
      )}

      {/* 4. RENDER INSPECTION BANNER */}
      {session.status === "CHECKED_IN" && !checkInPending && (
        <StaffCard variant="warning" className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1">
            <h4 className="text-sm font-bold text-amber-900">
              {checkInDisputed ? "Khách phản hồi sai lệch biên bản nhận xe" : "Yêu cầu chụp ảnh kiểm xe bàn giao"}
            </h4>
            <p className="text-xs text-amber-800 leading-relaxed">
              {checkInDisputed
                ? "Staff cần kiểm tra lại tình trạng xe với khách và lập biên bản check-in mới."
                : "Nhân viên cần chụp ảnh thực tế 4 góc của xe để đối chiếu trước khi cho khách khởi động lượt chạy."}
            </p>
          </div>
          <StaffButton
            onClick={() => navigate(`/staff/inspections/${session.sessionId}?type=CHECK_IN`)}
            variant="primary"
            className="bg-amber-600 hover:bg-amber-700 font-bold uppercase tracking-wider text-xs shadow-sm shrink-0"
          >
            <ClipboardCheck className="size-4" />
            Lập Biên Bản Check-In
          </StaffButton>
        </StaffCard>
      )}

      {checkInPending && (
        <StaffCard className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-blue-200 bg-blue-50">
          <div className="space-y-1">
            <h4 className="text-sm font-bold text-blue-900">Đã gửi biên bản nhận xe cho khách</h4>
            <p className="text-xs text-blue-800 leading-relaxed">
              Khách cần mở ứng dụng để xác nhận tình trạng xe. Khi khách đồng ý, phiên sẽ tự chuyển sang ACTIVE qua WebSocket.
            </p>
          </div>
          <StaffBadge variant="info">CHỜ KHÁCH XÁC NHẬN</StaffBadge>
        </StaffCard>
      )}

      {(session.status === "ACTIVE" || session.status === "EXTENDING") && !checkOutDisputed && (
        <StaffCard variant="warning" className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1">
            <h4 className="text-sm font-bold text-amber-900">Yêu cầu lập biên bản thu hồi Check-Out</h4>
            <p className="text-xs text-amber-800 leading-relaxed">
              Thực hiện chụp ảnh đối chiếu tình trạng xe sau khi hoàn thành lượt chạy để phát hiện hư hại (nếu có).
            </p>
          </div>
          <StaffButton
            onClick={() => navigate(`/staff/inspections/${session.sessionId}?type=CHECK_OUT`)}
            variant="primary"
            className="bg-amber-600 hover:bg-amber-700 font-bold uppercase tracking-wider text-xs shadow-sm shrink-0"
          >
            <ClipboardCheck className="size-4" />
            Kiểm Xe Thu Hồi (Check-Out)
          </StaffButton>
        </StaffCard>
      )}

      {(session.status === "ACTIVE" || session.status === "EXTENDING") && checkOutDisputed && (
        <StaffCard variant="warning" className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1">
            <h4 className="text-sm font-bold text-amber-900">Khách phản hồi sai lệch biên bản trả xe</h4>
            <p className="text-xs text-amber-800 leading-relaxed">
              Cần đối chiếu lại ảnh, tình trạng xe và lập biên bản check-out mới trước khi đóng phiên.
            </p>
          </div>
          <StaffButton
            onClick={() => navigate(`/staff/inspections/${session.sessionId}?type=CHECK_OUT`)}
            variant="primary"
            className="bg-amber-600 hover:bg-amber-700 font-bold uppercase tracking-wider text-xs shadow-sm shrink-0"
          >
            <ClipboardCheck className="size-4" />
            Lập Lại Biên Bản Check-Out
          </StaffButton>
        </StaffCard>
      )}

      {session.status === "CHECKING_OUT" && (
        <StaffCard className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-blue-200 bg-blue-50">
          <div className="space-y-1">
            <h4 className="text-sm font-bold text-blue-900">Đã gửi biên bản trả xe cho khách</h4>
            <p className="text-xs text-blue-800 leading-relaxed">
              Chờ khách xác nhận biên bản trên ứng dụng. Sau khi khách đồng ý, hệ thống sẽ đóng phiên và cập nhật booking.
            </p>
          </div>
          <StaffBadge variant="info">CHỜ KHÁCH XÁC NHẬN</StaffBadge>
        </StaffCard>
      )}

      {/* 5. RENDER BILLING AND ORDER HISTORY — only after session starts */}
      {(session.status === "ACTIVE" || session.status === "EXTENDING" || session.status === "CHECKING_OUT" || session.status === "COMPLETED") && (
      <div className="grid md:grid-cols-5 gap-4 items-start">
        {/* F&B Ordered Items — narrow column */}
        <StaffCard className="md:col-span-2 space-y-3">
          <h4 className="text-sm font-bold text-[#1c1b1b] uppercase tracking-wider flex items-center gap-2">
            <Coffee className="size-4 text-[#ea580c]" />
            F&B đã gọi
          </h4>

          <div className="space-y-1.5">
            {(session.fnbOrders || []).map((order) => (
              <div
                key={order.orderId}
                className="rounded-lg bg-[#fcf8f8] px-3 py-2 border border-[#e5e2e1] text-xs flex justify-between items-start font-semibold"
              >
                <div className="space-y-0.5">
                  {order.items.map((i, idx) => (
                    <span key={idx} className="block text-[#1c1b1b]">
                      {i.name} <span className="text-[#6b7280] font-normal">×{i.qty}</span>
                    </span>
                  ))}
                </div>
                <span className="font-extrabold text-[#ea580c] shrink-0 ml-3">{order.total.toLocaleString("vi-VN")} đ</span>
              </div>
            ))}

            {(session.fnbOrders || []).length === 0 && (
              <p className="text-xs text-[#6b7280] italic py-4 text-center">Chưa gọi món.</p>
            )}
          </div>
        </StaffCard>

        {/* Dynamic Billing Summary Box — wide column */}
        <StaffCard className="md:col-span-3 space-y-4">
          <h4 className="text-sm font-bold text-[#1c1b1b] uppercase tracking-wider flex items-center gap-2">
            <FileText className="size-4.5 text-[#ea580c]" />
            Bảng Quyết Toán Hóa Đơn
          </h4>

          {(hasPendingCounterPayment || hasPendingDepositRefund) && (
            <div className="flex items-start gap-2.5 rounded-xl bg-orange-50 border border-orange-200 px-3.5 py-3">
              <Banknote className="size-4 text-orange-600 shrink-0 mt-0.5" />
              <div>
                <p className="text-xs font-extrabold text-orange-900">Chưa quyết toán — cần thu/hoàn tiền</p>
                <p className="text-[11px] text-orange-700 mt-0.5 leading-relaxed">
                  Ca đã đóng nhưng chưa hoàn tất giao dịch tài chính. Xem tóm tắt bên dưới rồi xác nhận.
                </p>
              </div>
            </div>
          )}

          <div className="space-y-3 text-xs font-semibold">
            {/* Section 1: Prepaid Online */}
            <div className="space-y-1.5 pb-2 border-b border-[#e5e2e1]/60">
              <span className="text-[10px] font-extrabold text-[#6b7280] uppercase tracking-wider block">
                1. Đã thanh toán online (Prepaid)
              </span>
              <div className="flex justify-between text-[#4c4a49]">
                <span>Phí đặt vé đường đua (Slot Fee)</span>
                <span className="text-[#1c1b1b] font-bold">{booking.slotFee.toLocaleString("vi-VN")} đ</span>
              </div>
              <div className="flex justify-between text-[#4c4a49]">
                <span>Phí thuê xe (Rental Fee)</span>
                <span className="text-[#1c1b1b] font-bold">{booking.rentalFee.toLocaleString("vi-VN")} đ</span>
              </div>
              {booking.fnbPreorderFee > 0 && (
                <div className="flex justify-between text-[#4c4a49]">
                  <span>F&B đặt trước (Preordered)</span>
                  <span className="text-[#1c1b1b] font-bold">{booking.fnbPreorderFee.toLocaleString("vi-VN")} đ</span>
                </div>
              )}
            </div>

            {/* Section 2: Vehicle Deposit Refund (Asset Protection) */}
            {depositAmount > 0 && (
              <div className="space-y-1.5 pb-2 border-b border-[#e5e2e1]/60">
                <span className="text-[10px] font-extrabold text-blue-600 uppercase tracking-wider block">
                  2. Tiền cọc xe (Vehicle Deposit Refund)
                </span>
                <div className="flex justify-between text-[#4c4a49]">
                  <span>Cọc xe đã giữ trước</span>
                  <span className="text-[#1c1b1b] font-bold">{depositAmount.toLocaleString("vi-VN")} đ</span>
                </div>
                {damageCharge > 0 && (
                  <div className="flex justify-between text-rose-700 bg-rose-50 border border-rose-100 p-2 rounded-lg">
                    <span>Khấu trừ đền bù hư hỏng xe ({session.damageClaim?.damageMultiplier}x)</span>
                    <span className="font-extrabold">−{depositConsumedByDamage.toLocaleString("vi-VN")} đ</span>
                  </div>
                )}
                <div className="flex justify-between text-[11px] border-t border-[#e5e2e1]/60 pt-1.5 mt-1">
                  <span className="font-bold text-blue-700">Tiền cọc hoàn lại (Deposit Refund):</span>
                  <span className="text-emerald-700 font-extrabold">{depositRefundAmount.toLocaleString("vi-VN")} đ</span>
                </div>
              </div>
            )}

            {/* Section 3: Counter Service Bill */}
            <div className="space-y-1.5 pb-2 border-b border-[#e5e2e1]/60">
              <span className="text-[10px] font-extrabold text-[#ea580c] uppercase tracking-wider block">
                3. Chi phí dịch vụ tại quầy (Counter Bill)
              </span>
              {fnbTotal > 0 && (
                <div className="flex justify-between text-[#4c4a49]">
                  <span>Gọi món F&B tại ca</span>
                  <span className="text-[#1c1b1b] font-bold">+{fnbTotal.toLocaleString("vi-VN")} đ</span>
                </div>
              )}
              {approvedExtensionFee > 0 && (
                <div className="flex justify-between text-[#4c4a49]">
                  <span>Phụ thu gia hạn thêm giờ</span>
                  <span className="text-[#1c1b1b] font-bold">+{approvedExtensionFee.toLocaleString("vi-VN")} đ</span>
                </div>
              )}
              {damageExceedingDeposit > 0 && (
                <div className="flex justify-between text-rose-700 bg-rose-50 border border-rose-100 p-2 rounded-lg">
                  <span>Đền bù hư hỏng vượt cọc</span>
                  <span className="font-extrabold">+{damageExceedingDeposit.toLocaleString("vi-VN")} đ</span>
                </div>
              )}
              {totalCounterBill === 0 && (
                <p className="text-[11px] text-[#6b7280] italic">Không phát sinh chi phí dịch vụ tại quầy.</p>
              )}
              <div className="flex justify-between text-[11px] border-t border-[#e5e2e1]/60 pt-1.5 mt-1">
                <span className="font-bold">Tổng dịch vụ tại quầy:</span>
                <span className="text-[#ea580c] font-extrabold">{totalCounterBill.toLocaleString("vi-VN")} đ</span>
              </div>
            </div>

             {/* Settle Action */}
             {(hasPendingCounterPayment || hasPendingDepositRefund) ? (
               <div className="rounded-xl bg-slate-50 border border-slate-200 p-4 space-y-3">
                 <p className="text-[10px] font-extrabold text-slate-500 uppercase tracking-wide">Giao dịch tại quầy</p>
                 {depositRefundAmount > 0 && (
                   <div className="flex justify-between items-center text-[11px] font-semibold">
                     <span className="flex items-center gap-2 text-slate-600">
                       <span className="size-2 rounded-full bg-emerald-500 inline-block" />
                       Hoàn trả cọc xe cho khách
                     </span>
                     <span className="text-emerald-700 font-extrabold">{depositRefundAmount.toLocaleString("vi-VN")} đ</span>
                   </div>
                 )}
                 {totalCounterBill > 0 && (
                   <div className="flex justify-between items-center text-[11px] font-semibold">
                     <span className="flex items-center gap-2 text-slate-600">
                       <span className="size-2 rounded-full bg-orange-500 inline-block" />
                       Thu phí dịch vụ từ khách
                     </span>
                     <span className="text-orange-700 font-extrabold">{totalCounterBill.toLocaleString("vi-VN")} đ</span>
                   </div>
                 )}
                 <div className="border-t border-slate-200 pt-3 flex justify-between items-center">
                   <span className="text-slate-800 font-extrabold text-sm">
                     {netCounterAmount >= 0 ? "Khách trả thêm" : "Staff hoàn lại"}
                   </span>
                   <span className={`font-extrabold text-lg ${netCounterAmount >= 0 ? "text-orange-700" : "text-emerald-700"}`}>
                     {Math.abs(netCounterAmount).toLocaleString("vi-VN")} đ
                   </span>
                 </div>
                 <StaffButton
                   onClick={() => setConfirmSettleOpen(true)}
                   disabled={settlingPayment}
                   variant="primary"
                   className="w-full py-3 rounded-xl font-bold bg-emerald-600 hover:bg-emerald-700 text-white transition-all shadow-md active:scale-[0.98]"
                 >
                   <Banknote className="size-4" />
                   {settlingPayment ? "Đang xử lý..." : "Xác nhận đã thu tiền mặt"}
                 </StaffButton>
               </div>
            ) : isFullySettled ? (
              <div className="bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-xl p-3 text-xs font-bold text-center mt-2 flex items-center justify-center gap-2">
                <CheckCircle2 className="size-4" />
                <span>Đã quyết toán hoàn tất</span>
              </div>
            ) : null}
          </div>
        </StaffCard>
      </div>
      )}

      {/* Helpful Operational tips */}
      <div className="rounded-lg border border-[#e5e2e1] bg-[#f5f3f2]/30 p-4 space-y-1">
        <div className="flex items-center gap-2 text-xs font-bold text-[#4c4a49]">
          <HelpCircle className="size-4 text-[#6b7280]" />
          Lưu ý vận hành ca chơi
        </div>
        <p className="text-[11px] text-[#6b7280] leading-relaxed">
          Nếu khách chơi gặp sự cố ngoài đường đua hoặc xe gặp lỗi cơ khí cần đổi nhanh sang xe mới, sử dụng tính năng <strong className="text-[#1c1b1b]">Đổi Xe Khác</strong> để thu hồi xe hỏng về khu vực kỹ thuật bảo trì và bàn giao xe thay thế phù hợp.
        </p>
      </div>

      {/* SETTLE PAYMENT CONFIRMATION MODAL */}
      {confirmSettleOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
          <div className="w-full max-w-sm rounded-2xl border border-slate-200 bg-white p-6 shadow-2xl space-y-4">
            <div className="flex items-center gap-2.5">
              <div className="flex size-10 items-center justify-center rounded-full bg-emerald-100">
                <Banknote className="size-5 text-emerald-700" />
              </div>
              <div>
                <h3 className="font-extrabold text-base text-slate-900">Xác nhận quyết toán</h3>
                <p className="text-[11px] text-slate-500">Đảm bảo đã thực hiện xong với khách tại quầy</p>
              </div>
            </div>

            <div className="rounded-xl bg-slate-50 border border-slate-200 p-4 space-y-2.5 text-xs font-semibold">
              {depositRefundAmount > 0 && (
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-slate-600">
                    <span className="size-2.5 rounded-full bg-emerald-500 inline-block shrink-0" />
                    Hoàn trả tiền cọc cho khách
                  </div>
                  <span className="text-emerald-700 font-extrabold">{depositRefundAmount.toLocaleString("vi-VN")} đ</span>
                </div>
              )}
              {totalCounterBill > 0 && (
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-slate-600">
                    <span className="size-2.5 rounded-full bg-orange-500 inline-block shrink-0" />
                    Thu phí dịch vụ từ khách
                  </div>
                  <span className="text-orange-700 font-extrabold">{totalCounterBill.toLocaleString("vi-VN")} đ</span>
                </div>
              )}
              <div className="border-t border-slate-200 pt-2.5 flex justify-between items-center">
                <span className="text-slate-800 font-extrabold text-sm">
                  {netCounterAmount >= 0 ? "Khách trả thêm tại quầy" : "Staff hoàn lại cho khách"}
                </span>
                <span className={`font-extrabold text-base ${netCounterAmount >= 0 ? "text-orange-700" : "text-emerald-700"}`}>
                  {Math.abs(netCounterAmount).toLocaleString("vi-VN")} đ
                </span>
              </div>
            </div>

            <div className="flex gap-2.5">
              <StaffButton
                onClick={() => setConfirmSettleOpen(false)}
                variant="outline"
                className="flex-1"
              >
                Huỷ bỏ
              </StaffButton>
              <StaffButton
                onClick={() => { setConfirmSettleOpen(false); void handleSettlePayment() }}
                variant="primary"
                className="flex-1 bg-emerald-600 hover:bg-emerald-700"
              >
                <CheckCircle2 className="size-4" />
                Đã thu xong
              </StaffButton>
            </div>
          </div>
        </div>
      )}

      {/* VEHICLE SWAP MODAL */}
      {swapModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-2xl border border-[#e5e2e1] bg-white p-6 shadow-2xl space-y-4">
            <div className="flex items-center gap-2 text-[#ea580c] mb-2">
              <ArrowLeftRight className="size-5" />
              <h3 className="font-bold text-base text-[#1c1b1b]">Đổi xe đang chơi</h3>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-[#4c4a49] mb-1.5">
                  Tình trạng xe cũ (Mã ID: {swappingVehicleId})
                </label>
                <select
                  value={oldVehicleNewStatus}
                  onChange={(e) => setOldVehicleNewStatus(e.target.value as any)}
                  className="w-full rounded-lg border border-[#e5e2e1] bg-white px-3.5 py-2.5 text-sm font-semibold text-[#1c1b1b] focus:border-[#ea580c] focus:outline-none focus:ring-1 focus:ring-[#ea580c]"
                >
                  <option value="MAINTENANCE">Xe bị hỏng hóc (Chuyển vào bảo trì)</option>
                  <option value="AVAILABLE">Xe bình thường (Đưa lại kho trống)</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-[#4c4a49] mb-1.5">
                  Chọn xe thay thế khả dụng
                </label>
                <select
                  value={selectedSwapNewUnitId}
                  onChange={(e) => setSelectedSwapNewUnitId(e.target.value)}
                  className="w-full rounded-lg border border-[#e5e2e1] bg-white px-3.5 py-2.5 text-sm font-semibold text-[#1c1b1b] focus:border-[#ea580c] focus:outline-none focus:ring-1 focus:ring-[#ea580c]"
                >
                  <option value="">-- Chọn xe trống khả dụng --</option>
                  {availableFleet
                    .filter((u) => {
                      const st = fleetStates[u.id] || u.status
                      return st === "AVAILABLE" && u.id !== swappingVehicleId
                    })
                    .map((u) => (
                      <option key={u.id} value={u.id}>
                        {u.catalog?.name || u.identifier} (Mã: {u.identifier} | {u.color})
                      </option>
                    ))}
                </select>
              </div>
            </div>

            <div className="flex gap-2 pt-2">
              <StaffButton
                onClick={() => {
                  setSwapModalOpen(false)
                  setSelectedSwapNewUnitId("")
                }}
                variant="outline"
                className="flex-1"
              >
                Hủy bỏ
              </StaffButton>
              <StaffButton
                onClick={handleConfirmSwap}
                variant="primary"
                className="flex-1"
              >
                Xác nhận đổi
              </StaffButton>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
