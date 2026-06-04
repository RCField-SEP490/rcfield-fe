import React, { useState, useEffect } from "react"
import { useNavigate } from "react-router"
import {
  Play,
  ClipboardList,
  QrCode,
  Coffee,
  Car,
  MapPin,
  Phone,
  ArrowRight,
  Sparkles,
} from "lucide-react"
import { useStaffOperations } from "./context/StaffOperationContext"
import { cafeApi } from "@/features/cafes/api/cafe.api"
import type { BackendCafe } from "@/features/cafes/types"
import { toast } from "sonner"
import { cn } from "@/shared/lib/utils"
import {
  StaffHeader,
  StaffCard,
  StaffBadge,
  StaffButton,
  StaffStatCard,
} from "./components/StaffUI"

export default function StaffDashboardPage() {
  const navigate = useNavigate()
  const {
    assignedCafeId,
    bookings,
    sessions,
    fnbOrders,
    startCheckIn,
  } = useStaffOperations()

  const [activeCafe, setActiveCafe] = useState<BackendCafe | null>(null)
  const [loadingCafe, setLoadingCafe] = useState(false)
  const [simulatedCode, setSimulatedCode] = useState("")

  // Load active cafe details
  useEffect(() => {
    if (assignedCafeId) {
      setLoadingCafe(true)
      cafeApi
        .getCafe(assignedCafeId)
        .then((data) => {
          setActiveCafe(data)
        })
        .catch((err) => {
          console.error("Error loading cafe details:", err)
          toast.error("Không thể tải thông tin chi nhánh chi tiết.")
        })
        .finally(() => {
          setLoadingCafe(false)
        })
    } else {
      setActiveCafe(null)
    }
  }, [assignedCafeId])

  // QR scanner simulation logic
  const handleQRSimulate = (e: React.FormEvent) => {
    e.preventDefault()
    if (!simulatedCode.trim()) return

    const trimmed = simulatedCode.trim().toUpperCase()
    const match = bookings.find(
      (b) => b.shortCode.toUpperCase() === trimmed || b.bookingId === simulatedCode.trim()
    )

    if (!match) {
      toast.error(`Mã đặt lịch "${simulatedCode}" không tồn tại trong hôm nay!`)
      return
    }

    if (match.status === "CANCELLED") {
      toast.error("Đơn đặt lịch này đã bị hủy!")
      return
    }

    if (match.status === "COMPLETED") {
      toast.error("Đơn đặt lịch này đã hoàn thành trước đó!")
      return
    }

    if (match.status === "NO_SHOW") {
      toast.error("Đơn đặt lịch này đã bị đánh dấu vắng mặt (No-Show)!")
      return
    }

    if (match.sessions && match.sessions.length > 0) {
      const activeSession = match.sessions[0]
      toast.info(`Đơn đặt lịch này đã Check-In. Đang chuyển hướng đến phiên chạy ${activeSession.sessionId}...`)
      navigate(`/staff/sessions/${activeSession.sessionId}`)
      return
    }

    // Start Check-in flow
    startCheckIn(match.bookingId)
    toast.success(`Quét mã QR ${match.shortCode} thành công!`)
    setTimeout(() => {
      const stored = localStorage.getItem(`rcfield:staff_operations:bookings:${localStorage.getItem("rcfield:auth") ? JSON.parse(localStorage.getItem("rcfield:auth")!).user?.id : "anonymous"}`)
      if (stored) {
        const parsedBookings = JSON.parse(stored)
        const updatedMatch = parsedBookings.find((b: any) => b.bookingId === match.bookingId)
        const newSessionId = updatedMatch?.sessions?.[0]?.sessionId
        if (newSessionId) {
          navigate(`/staff/sessions/${newSessionId}`)
        }
      }
    }, 500)
  }

  // 1. Unassigned cafe guard fallback (layout guard handles most, but safe fallback here)
  if (!assignedCafeId) {
    return (
      <div className="flex min-h-[60vh] flex-col items-center justify-center text-center p-4">
        <StaffCard className="max-w-md w-full p-8 text-center" variant="warning">
          <div className="mx-auto mb-4 flex size-14 items-center justify-center rounded-full bg-[#fff3eb] text-[#ea580c]">
            <QrCode className="size-7" />
          </div>
          <h2 className="text-xl font-bold text-[#1c1b1b] mb-2">Chưa được phân công</h2>
          <p className="text-sm text-[#6b7280] mb-6">
            Tài khoản nhân viên của bạn chưa có lịch phân công hoặc liên kết chi nhánh.
            Vui lòng liên hệ với quản lý chi nhánh của bạn.
          </p>
        </StaffCard>
      </div>
    )
  }

  const activeSessions = sessions.filter((s) => s.status === "ACTIVE" || s.status === "EXTENDING")
  const pendingInspections = sessions.filter((s) => s.status === "CHECKED_IN" || s.status === "CHECKING_OUT")
  const activeFnbOrders = fnbOrders.filter((o) => o.status === "PENDING" || o.status === "PREPARING")

  return (
    <div className="space-y-6">
      {/* 1. Header Area */}
      <StaffHeader
        title="Trực Ca Chi Nhánh"
        subtitle="Quản lý phiên chạy xe, F&B và an toàn đường đua thời gian thực"
        action={
          <StaffButton
            variant="secondary"
            size="sm"
            icon={Sparkles}
            onClick={() => navigate("/staff/today-bookings")}
          >
            Danh sách lịch đặt
          </StaffButton>
        }
      />

      {/* 2. Branch Info Banner */}
      {loadingCafe ? (
        <div className="h-28 animate-pulse rounded-xl bg-white border border-[#e5e2e1]" />
      ) : activeCafe ? (
        <StaffCard className="relative overflow-hidden border-orange-100 bg-gradient-to-br from-white to-[#fffaf7]">
          <div className="absolute right-0 top-0 h-full w-1/3 bg-gradient-to-l from-[#fff3eb]/40 to-transparent pointer-events-none" />
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2 mb-1.5">
                <StaffBadge variant="orange">Chi nhánh làm việc</StaffBadge>
                <span className="text-xs text-[#6b7280] font-medium">Mã: {activeCafe.id}</span>
              </div>
              <h2 className="text-xl font-extrabold text-[#1c1b1b] tracking-tight">{activeCafe.name}</h2>
              <div className="mt-2.5 flex flex-wrap gap-x-6 gap-y-1.5 text-xs text-[#4c4a49] font-medium">
                <span className="flex items-center gap-1.5">
                  <MapPin className="size-3.5 text-[#ea580c]/80" />
                  {activeCafe.address}, {activeCafe.city}
                </span>
                {activeCafe.phone && (
                  <span className="flex items-center gap-1.5">
                    <Phone className="size-3.5 text-[#ea580c]/80" />
                    {activeCafe.phone}
                  </span>
                )}
              </div>
            </div>
            <div className="flex items-center gap-2 border-t md:border-t-0 pt-3 md:pt-0 border-[#e5e2e1]">
              <span className="relative flex h-2 w-2 mr-1">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-500"></span>
              </span>
              <span className="text-xs font-semibold text-emerald-700">Đang Trực Ca</span>
            </div>
          </div>
        </StaffCard>
      ) : null}

      {/* 3. Metric Stat Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StaffStatCard
          title="Đang chạy"
          value={activeSessions.length}
          description="Phiên chạy xe đang chạy"
          icon={Play}
        />
        <StaffStatCard
          title="Tổng lịch hôm nay"
          value={bookings.length}
          description="Đơn đặt lịch trong ngày"
          icon={ClipboardList}
        />
        <StaffStatCard
          title="Đợi kiểm xe"
          value={pendingInspections.length}
          description="Check-in / Check-out"
          icon={Car}
        />
        <StaffStatCard
          title="Đơn F&B chờ"
          value={activeFnbOrders.length}
          description="Đang chế biến & phục vụ"
          icon={Coffee}
        />
      </div>

      {/* 4. Action Forms Panel */}
      <div className="grid md:grid-cols-3 gap-6">
        {/* Check-In QR Simulator */}
        <StaffCard className="md:col-span-2 space-y-4" glow>
          <div className="flex items-center gap-2 text-[#ea580c]">
            <QrCode className="size-5" />
            <h3 className="font-bold text-[#1c1b1b] text-base">Quét mã QR Check-In</h3>
          </div>

          <form onSubmit={handleQRSimulate} className="flex gap-2">
            <input
              type="text"
              placeholder="Nhập mã đặt lịch hoặc Shortcode (Ví dụ: RCF-8829)"
              value={simulatedCode}
              onChange={(e) => setSimulatedCode(e.target.value)}
              className="flex-1 rounded-lg border border-[#e5e2e1] bg-white px-4 py-2.5 text-sm font-semibold text-[#1c1b1b] focus:border-[#ea580c] focus:outline-none focus:ring-1 focus:ring-[#ea580c] placeholder-[#a09e9d] transition-all"
            />
            <StaffButton type="submit" variant="primary">
              Check-In
            </StaffButton>
          </form>
          <p className="text-xs text-[#6b7280] leading-relaxed">
            Nhập nhanh mã code hoặc quét QR của khách hàng để mở nhanh giao diện kiểm xe bàn giao cho lượt chạy mới.
          </p>
        </StaffCard>

        {/* Walk-in Booking Shortcut */}
        <StaffCard className="flex flex-col justify-between p-6">
          <div>
            <h4 className="font-bold text-[#1c1b1b] text-base mb-1">Khách Vãng Lai (Walk-in)</h4>
            <p className="text-xs text-[#6b7280] leading-relaxed">
              Tạo và ghi nhận nhanh thông tin lượt chơi, cấu hình xe chạy trực tiếp cho khách mua vé tại quầy.
            </p>
          </div>
          <StaffButton
            variant="outline"
            className="w-full mt-4 text-[#ea580c] border-orange-200 bg-[#fff3eb]/30 hover:bg-[#fff3eb]"
            onClick={() => navigate("/staff/today-bookings?tab=walkin")}
          >
            + Lập đơn chơi trực tiếp
          </StaffButton>
        </StaffCard>
      </div>

      {/* 5. Live Track View */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-base font-bold text-[#1c1b1b] tracking-tight">Trạng Thái Làn Đua Thời Gian Thực</h3>
          <span className="text-[10px] text-[#6b7280] font-bold uppercase tracking-wider bg-[#f5f3f2] px-2 py-0.5 rounded border border-[#e5e2e1]">
            Live Map
          </span>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {(activeCafe?.trackTypes || []).map((t) => {
            const trackSessions = activeSessions.filter((s) => {
              const b = bookings.find((bk) => bk.bookingId === s.bookingId)
              return b?.trackType === t.code || b?.trackName?.toLowerCase().includes(t.name.toLowerCase())
            })

            const isOccupied = trackSessions.length > 0
            const activeSession = trackSessions[0]
            const matchingBooking = activeSession
              ? bookings.find((b) => b.bookingId === activeSession.bookingId)
              : null

            return (
              <StaffCard
                key={t.id}
                onClick={() => {
                  if (activeSession) {
                    navigate(`/staff/sessions/${activeSession.sessionId}`)
                  } else {
                    navigate(`/staff/today-bookings?tab=walkin&track=${encodeURIComponent(t.name)}&type=${t.code}`)
                  }
                }}
                className={cn(
                  "cursor-pointer transition-all duration-200 hover:scale-[1.01] hover:-translate-y-[2px]",
                  isOccupied
                    ? "border-emerald-200 bg-emerald-50/20 hover:border-emerald-300"
                    : "hover:border-orange-200"
                )}
              >
                <div className="flex items-center justify-between mb-4">
                  <span className="font-bold text-sm text-[#1c1b1b]">{t.name}</span>
                  <StaffBadge variant={isOccupied ? "success" : "neutral"}>
                    <span
                      className={cn(
                        "size-1.5 rounded-full mr-1.5",
                        isOccupied ? "bg-emerald-500 animate-pulse" : "bg-gray-400"
                      )}
                    />
                    {isOccupied ? "BẬN" : "SẴN SÀNG"}
                  </StaffBadge>
                </div>

                {isOccupied && activeSession && matchingBooking ? (
                  <div className="space-y-3.5">
                    <div className="flex justify-between items-start bg-white/60 p-2.5 rounded-lg border border-[#e5e2e1]/60">
                      <div>
                        <p className="text-[10px] font-semibold text-[#6b7280] uppercase">Khách hàng</p>
                        <p className="text-sm font-bold text-[#1c1b1b] mt-0.5">
                          {matchingBooking.plannedParticipants[0] || "Khách hàng"}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="text-[10px] font-semibold text-[#6b7280] uppercase">Mã số</p>
                        <p className="text-sm font-bold text-[#1c1b1b] mt-0.5">{matchingBooking.shortCode}</p>
                      </div>
                    </div>

                    <div className="flex justify-between items-center text-xs text-[#4c4a49] pt-2 border-t border-dashed border-[#e5e2e1]">
                      <span className="flex items-center gap-1.5 font-medium">
                        <Car className="size-3.5 text-[#6b7280]" />
                        {activeSession.vehicles[0]?.name || "Xe tự mang (BYOC)"}
                      </span>
                      <span className="flex items-center gap-1 text-[#ea580c] font-bold">
                        Chi tiết <ArrowRight className="size-3" />
                      </span>
                    </div>
                  </div>
                ) : (
                  <div className="py-6 text-center text-[#6b7280] space-y-1.5 bg-[#fcf8f8]/50 rounded-lg border border-dashed border-[#e5e2e1]">
                    <p className="text-xs font-medium">Chưa có phiên chạy hoạt động</p>
                    <p className="text-[10px] text-[#ea580c] font-bold tracking-wide uppercase">
                      + Tạo ca chạy tại quầy
                    </p>
                  </div>
                )}
              </StaffCard>
            )
          })}

          {activeCafe?.trackTypes && activeCafe.trackTypes.length === 0 && (
            <div className="col-span-full rounded-xl border border-dashed border-[#e5e2e1] bg-white p-8 text-center text-[#6b7280] text-xs font-semibold italic">
              Chi nhánh này hiện chưa được cấu hình đường đua nào.
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
