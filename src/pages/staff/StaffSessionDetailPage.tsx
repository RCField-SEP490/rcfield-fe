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
  Sparkles,
  ClipboardCheck,
  FileText,
  HelpCircle,
} from "lucide-react"
import { useStaffOperations } from "./context/StaffOperationContext"
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
    simulateClientExtensionResponse,
    simulateClientCheckInResponse,
    simulateClientCheckOutResponse,
    addFnbOrder,
    swapSessionVehicle,
  } = useStaffOperations()

  // Find corresponding session and booking
  const session = sessions.find((s) => s.sessionId === sessionId)
  const booking = session ? bookings.find((b) => b.bookingId === session.bookingId) : null

  // Local state controls
  const [timeLeft, setTimeLeft] = useState("")
  const [menuItems, setMenuItems] = useState<MenuItem[]>([])
  const [loadingMenu, setLoadingMenu] = useState(false)
  const [availableFleet, setAvailableFleet] = useState<VehicleUnit[]>([])

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

  // Handle extension proposal
  const handleExtension = (mins: number) => {
    const additionalFee = mins === 15 ? 40000 : mins === 30 ? 75000 : 100000
    proposeExtension(session.sessionId, mins, additionalFee)
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

      {/* 2. TOP TIMER DISPLAY & SIMULATOR ACTION SUMMARY */}
      <div className="grid md:grid-cols-3 gap-6">
        <StaffCard className="md:col-span-2 relative overflow-hidden flex flex-col justify-between">
          <div className="absolute right-0 top-0 h-full w-1/4 bg-gradient-to-l from-[#fff3eb]/20 to-transparent pointer-events-none" />
          
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <div className="mb-2">
                <StaffBadge variant={sessionBadgeVariant}>
                  {session.status === "ACTIVE" && "ĐANG CHƠI"}
                  {session.status === "CHECKED_IN" && "ĐÃ CHECK-IN"}
                  {session.status === "EXTENDING" && "YÊU CẦU GIA HẠN"}
                  {session.status === "CHECKING_OUT" && "ĐANG TRẢ XE"}
                  {session.status === "COMPLETED" && "ĐÃ ĐÓNG"}
                </StaffBadge>
              </div>
              <h3 className="text-2xl font-black text-[#1c1b1b] tracking-tight">{booking.trackName}</h3>
              <p className="text-xs text-[#6b7280] font-semibold mt-1">Đường đua: {booking.trackType}</p>
            </div>

            {/* Live Timer widget */}
            {(session.status === "ACTIVE" || session.status === "EXTENDING") && (
              <div className="bg-[#fff3eb] border border-[#ffdbca] rounded-xl px-5 py-2.5 text-center min-w-36 shrink-0 shadow-sm">
                <span className="text-[10px] font-extrabold text-[#ea580c] uppercase tracking-wider block mb-0.5">
                  Thời gian còn lại
                </span>
                <span className="text-3xl font-mono font-black text-[#ea580c] tracking-tight">{timeLeft}</span>
              </div>
            )}
          </div>

          {/* Details metadata grid */}
          <div className="mt-6 border-t border-[#e5e2e1] pt-4 grid grid-cols-2 sm:grid-cols-3 gap-4 text-xs font-semibold">
            <div>
              <span className="text-[#6b7280] block mb-0.5">Khách hàng</span>
              <span className="text-[#1c1b1b] font-bold">{booking.plannedParticipants[0]}</span>
            </div>
            <div>
              <span className="text-[#6b7280] block mb-0.5">Mã đơn gốc</span>
              <span className="text-[#1c1b1b] font-bold">{booking.shortCode}</span>
            </div>
            <div>
              <span className="text-[#6b7280] block mb-0.5">Nhân viên trực ca</span>
              <span className="text-[#1c1b1b] font-bold">{session.staffName}</span>
            </div>
          </div>
        </StaffCard>

        {/* SIMULATOR RESPONSE ACTIONS */}
        <StaffCard className="border-orange-100 bg-[#fffbf9] flex flex-col justify-between p-5">
          <div className="space-y-2">
            <div className="flex items-center gap-1.5 text-[#ea580c]">
              <Sparkles className="size-4.5" />
              <h4 className="font-bold text-xs uppercase tracking-wider">Khách hàng phản hồi (Mô phỏng)</h4>
            </div>
            <p className="text-[11px] text-[#6b7280] leading-relaxed">
              Duyệt nhanh yêu cầu và tình trạng biên bản thay cho khách chạy xe trên ứng dụng di động:
            </p>
          </div>

          <div className="grid gap-2 pt-4">
            {session.status === "CHECKED_IN" && (
              <StaffButton
                onClick={() => simulateClientCheckInResponse(session.sessionId)}
                variant="primary"
                size="sm"
              >
                Khách duyệt nhận xe (Bắt đầu chơi)
              </StaffButton>
            )}

            {session.status === "EXTENDING" && (
              <div className="flex gap-2">
                <StaffButton
                  onClick={() => simulateClientExtensionResponse(session.sessionId, true)}
                  variant="primary"
                  size="sm"
                  className="flex-1"
                >
                  Đồng ý
                </StaffButton>
                <StaffButton
                  onClick={() => simulateClientExtensionResponse(session.sessionId, false)}
                  variant="outline"
                  size="sm"
                  className="flex-1 bg-white"
                >
                  Từ chối
                </StaffButton>
              </div>
            )}

            {session.status === "CHECKING_OUT" && (
              <StaffButton
                onClick={() => simulateClientCheckOutResponse(session.sessionId)}
                variant="primary"
                size="sm"
              >
                Khách ký trả xe (Đóng phiên)
              </StaffButton>
            )}

            {session.status !== "CHECKED_IN" && session.status !== "EXTENDING" && session.status !== "CHECKING_OUT" && (
              <p className="text-xs text-[#6b7280] italic text-center py-4">
                Không có sự kiện phản hồi nào đang chờ từ khách hàng.
              </p>
            )}
          </div>
        </StaffCard>
      </div>

      {/* 3. CORE ACTION MODULES (F&B / Extensions / Fleet controls) */}
      {session.status === "ACTIVE" && (
        <div className="grid md:grid-cols-2 gap-6">
          {/* Module 1: Fleet swap & Extension Controls */}
          <div className="space-y-6">
            {/* Extensions panel */}
            <StaffCard className="space-y-4">
              <h4 className="text-sm font-bold text-[#1c1b1b] uppercase tracking-wider flex items-center gap-2">
                <Clock className="size-4.5 text-[#ea580c]" />
                Yêu cầu gia hạn ca chạy
              </h4>
              <p className="text-xs text-[#6b7280]">
                Tạo yêu cầu gia hạn thêm lượt chơi nhanh chóng cho khách hàng tại quầy:
              </p>
              
              <div className="grid grid-cols-3 gap-2 pt-1">
                <StaffButton
                  onClick={() => handleExtension(15)}
                  variant="outline"
                  size="sm"
                  className="bg-white text-[#ea580c] hover:bg-[#fff3eb]"
                >
                  +15 phút
                </StaffButton>
                <StaffButton
                  onClick={() => handleExtension(30)}
                  variant="outline"
                  size="sm"
                  className="bg-white text-[#ea580c] hover:bg-[#fff3eb]"
                >
                  +30 phút
                </StaffButton>
                <StaffButton
                  onClick={() => handleExtension(60)}
                  variant="outline"
                  size="sm"
                  className="bg-white text-[#ea580c] hover:bg-[#fff3eb]"
                >
                  +1 giờ
                </StaffButton>
              </div>
            </StaffCard>

            {/* Active Vehicles & Swap Button */}
            <StaffCard className="space-y-4">
              <h4 className="text-sm font-bold text-[#1c1b1b] uppercase tracking-wider flex items-center gap-2">
                <Car className="size-4.5 text-[#ea580c]" />
                Xe đang chạy trên làn đua ({session.vehicles.length})
              </h4>

              <div className="space-y-2">
                {session.vehicles.map((v) => (
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
      {session.status === "CHECKED_IN" && (
        <StaffCard variant="warning" className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1">
            <h4 className="text-sm font-bold text-amber-900">Yêu cầu chụp ảnh kiểm xe bàn giao</h4>
            <p className="text-xs text-amber-800 leading-relaxed">
              Nhân viên cần chụp ảnh thực tế 4 góc của xe để đối chiếu trước khi cho khách khởi động lượt chạy.
            </p>
          </div>
          <StaffButton
            onClick={() => navigate(`/staff/inspection?sessionId=${session.sessionId}&type=CHECK_IN`)}
            variant="primary"
            className="bg-amber-600 hover:bg-amber-700 font-bold uppercase tracking-wider text-xs shadow-sm shrink-0"
          >
            <ClipboardCheck className="size-4" />
            Lập Biên Bản Check-In
          </StaffButton>
        </StaffCard>
      )}

      {session.status === "ACTIVE" && (
        <StaffCard variant="warning" className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1">
            <h4 className="text-sm font-bold text-amber-900">Yêu cầu lập biên bản thu hồi Check-Out</h4>
            <p className="text-xs text-amber-800 leading-relaxed">
              Thực hiện chụp ảnh đối chiếu tình trạng xe sau khi hoàn thành lượt chạy để phát hiện hư hại (nếu có).
            </p>
          </div>
          <StaffButton
            onClick={() => navigate(`/staff/inspection?sessionId=${session.sessionId}&type=CHECK_OUT`)}
            variant="primary"
            className="bg-amber-600 hover:bg-amber-700 font-bold uppercase tracking-wider text-xs shadow-sm shrink-0"
          >
            <ClipboardCheck className="size-4" />
            Kiểm Xe Thu Hồi (Check-Out)
          </StaffButton>
        </StaffCard>
      )}

      {/* 5. RENDER BILLING AND ORDER HISTORY */}
      <div className="grid md:grid-cols-2 gap-6">
        {/* F&B Ordered Items Grid */}
        <StaffCard className="space-y-4">
          <h4 className="text-sm font-bold text-[#1c1b1b] uppercase tracking-wider flex items-center gap-2">
            <Coffee className="size-4.5 text-[#ea580c]" />
            Lịch sử đặt món F&B tại phiên
          </h4>

          <div className="space-y-2">
            {(session.fnbOrders || []).map((order) => (
              <div
                key={order.orderId}
                className="rounded-lg bg-[#fcf8f8] p-3 border border-[#e5e2e1] text-xs flex justify-between items-center font-semibold"
              >
                <div>
                  <p className="text-[#1c1b1b] font-bold">Mã F&B: {order.orderId}</p>
                  <div className="text-[11px] text-[#6b7280] mt-1 font-medium space-y-0.5">
                    {order.items.map((i, idx) => (
                      <span key={idx} className="block">
                        {i.name} (x{i.qty})
                      </span>
                    ))}
                  </div>
                </div>
                <div className="text-right">
                  <span className="font-extrabold text-[#ea580c]">{order.total.toLocaleString("vi-VN")} đ</span>
                </div>
              </div>
            ))}

            {(session.fnbOrders || []).length === 0 && (
              <p className="text-xs text-[#6b7280] italic py-4 text-center">Ca chơi chưa gọi món F&B nào.</p>
            )}
          </div>
        </StaffCard>

        {/* Dynamic Billing Summary Box */}
        <StaffCard className="space-y-4">
          <h4 className="text-sm font-bold text-[#1c1b1b] uppercase tracking-wider flex items-center gap-2">
            <FileText className="size-4.5 text-[#ea580c]" />
            Quyết toán hóa đơn & Đặt cọc
          </h4>

          <div className="space-y-2.5 text-xs font-semibold">
            <div className="flex justify-between text-[#4c4a49]">
              <span>Phí đặt vé đường đua (Slot Fee)</span>
              <span className="text-[#1c1b1b] font-bold">{booking.slotFee.toLocaleString("vi-VN")} đ</span>
            </div>
            <div className="flex justify-between text-[#4c4a49]">
              <span>Phí thuê xe tại quầy (Rental Fee)</span>
              <span className="text-[#1c1b1b] font-bold">{booking.rentalFee.toLocaleString("vi-VN")} đ</span>
            </div>
            
            {session.fnbOrders && session.fnbOrders.length > 0 && (
              <div className="flex justify-between text-[#4c4a49]">
                <span>Dịch vụ ăn uống F&B</span>
                <span className="text-[#1c1b1b] font-bold">
                  {session.fnbOrders.reduce((sum, o) => sum + o.total, 0).toLocaleString("vi-VN")} đ
                </span>
              </div>
            )}

            {session.damageClaim && (
              <div className="flex justify-between text-rose-800 bg-rose-50 border border-rose-200 p-2.5 rounded-lg">
                <span>Khấu trừ bồi thường xe ({session.damageClaim.damageMultiplier}x)</span>
                <span className="font-black text-rose-700">{session.damageClaim.finalCharge.toLocaleString("vi-VN")} đ</span>
              </div>
            )}

            <div className="border-t border-[#e5e2e1] pt-2.5 flex justify-between items-center text-sm text-[#1c1b1b] font-bold">
              <span>Tổng hóa đơn hiện tại:</span>
              <span className="text-[#ea580c] font-black text-base">
                {booking.totalAmount.toLocaleString("vi-VN")} đ
              </span>
            </div>

            <div className="border-t border-[#e5e2e1] pt-2.5 mt-2 bg-[#fcf8f8] p-3 rounded-lg space-y-1.5">
              <span className="text-[10px] font-extrabold text-[#ea580c] uppercase tracking-wider block mb-1">
                Phương thức quyết toán đặt cọc
              </span>
              <div className="flex justify-between text-[11px] text-[#4c4a49]">
                <span>Tiền cọc giữ trước:</span>
                <span className="text-[#1c1b1b] font-bold">{booking.depositAmount.toLocaleString("vi-VN")} đ</span>
              </div>
              <div className="flex justify-between text-[11px]">
                <span>Quyết toán thực tế:</span>
                <span className="text-emerald-700 font-bold">
                  {session.damageClaim
                    ? `Khấu trừ ${Math.min(booking.depositAmount, session.damageClaim.finalCharge).toLocaleString("vi-VN")} đ từ cọc`
                    : "Hoàn lại 100% tiền đặt cọc"}
                </span>
              </div>
            </div>
          </div>
        </StaffCard>
      </div>

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
