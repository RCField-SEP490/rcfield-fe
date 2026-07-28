import { useState, useEffect } from "react"
import { useQuery, useQueryClient } from "@tanstack/react-query"
import { AlertTriangle, CalendarClock, CreditCard, XCircle, ChevronLeft, ChevronRight, Wrench, X, Clock, User, PlayCircle, ShieldCheck } from "lucide-react"
import { toast } from "sonner"
import { useSearchParams } from "react-router"

import { cafeApi, cafeQueryKeys } from "@/features/cafes/api/cafe.api"
import { useCafeBookings, useCancelBooking, useBooking, useCafeSessions, useCafeSessionStats } from "@/features/booking/hooks/use-booking"
import { useWebSocket } from "@/features/notifications/hooks/useWebSocket"
import { sanitizeImageUrl } from "@/shared/lib/utils"
import type { BookingStatus, CafeBookingListItem } from "@/features/booking/types/booking.types"
import { MetricCard, Panel, PanelTitle, ProviderPageHeader } from "@/pages/provider/components/ProviderPrimitives"
import { ProviderShell } from "@/pages/provider/components/ProviderShell"
import { Badge } from "@/shared/ui/badge"
import { Button } from "@/shared/ui/button"
import { Input } from "@/shared/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/shared/ui/select"

const PART_TYPE_LABELS: Record<string, string> = {
  TIRE_WHEEL: "Bánh xe",
  SPOILER: "Cánh gió",
  CHASSIS: "Khung gầm",
  MOTOR: "Motor",
  SHELL: "Vỏ nhựa",
  SERVO: "Servo",
  REMOTE: "Tay điều khiển",
  OTHER: "Khác",
}

const DAMAGE_STATUS_LABELS: Record<string, { label: string; className: string }> = {
  SETTLED: { label: "Đã thu", className: "bg-emerald-100 text-emerald-800" },
  AWAITING_PAYMENT: { label: "Thu thêm", className: "bg-orange-100 text-orange-800" },
  PENDING: { label: "Đang xử lý", className: "bg-amber-100 text-amber-800" },
}

function BookingDetailDrawer({ bookingId, onClose }: { bookingId: string; onClose: () => void }) {
  const { data: booking, isLoading } = useBooking(bookingId)
  const damage = booking?.damage_breakdown

  const booker = booking?.participants?.find((p) => p.participantType === "BOOKER") ?? booking?.participants?.[0]

  return (
    <div className="fixed inset-0 z-50 flex justify-end">
      <div className="fixed inset-0 bg-black/40" onClick={onClose} />
      <div className="relative z-10 w-full max-w-md bg-white shadow-2xl flex flex-col h-full overflow-y-auto">
        <div className="flex items-center justify-between p-5 border-b border-slate-100">
          <h2 className="text-sm font-black text-slate-900">
            Chi tiết đặt lịch #{bookingId.substring(0, 8).toUpperCase()}
          </h2>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 transition-colors">
            <X className="h-5 w-5" />
          </button>
        </div>

        {isLoading ? (
          <div className="flex-1 flex items-center justify-center text-sm text-slate-400">Đang tải...</div>
        ) : !booking ? (
          <div className="flex-1 flex items-center justify-center text-sm text-slate-400">Không tìm thấy thông tin đặt lịch.</div>
        ) : (
          <div className="p-5 space-y-5">
            {/* Status + mode badges */}
            <div className="flex items-center gap-2 flex-wrap">
              {(() => {
                if (booking.session?.status === "ACTIVE") {
                  return (
                    <span className="inline-flex rounded-full px-2 py-0.5 text-[10px] font-bold bg-emerald-100 text-emerald-800 animate-pulse">
                      Đang chơi
                    </span>
                  )
                }
                if (booking.session?.status === "EXTENDING") {
                  return (
                    <span className="inline-flex rounded-full px-2 py-0.5 text-[10px] font-bold bg-amber-100 text-amber-800">
                      Đang gia hạn
                    </span>
                  )
                }
                if (booking.session?.status === "CHECKING_OUT") {
                  return (
                    <span className="inline-flex rounded-full px-2 py-0.5 text-[10px] font-bold bg-blue-100 text-blue-800">
                      Chờ trả xe
                    </span>
                  )
                }
                const s = STATUS_LABELS[booking.status as BookingStatus]
                return s ? (
                  <span className={`inline-flex rounded-full px-2 py-0.5 text-[10px] font-bold ${s.className}`}>{s.label}</span>
                ) : null
              })()}
              <span className={`inline-flex rounded-full px-2 py-0.5 text-[10px] font-bold ${booking.playMode === "RENTAL" ? "bg-orange-100 text-orange-800" : "bg-blue-100 text-blue-800"}`}>
                {booking.playMode === "RENTAL" ? "Thuê xe" : "Xe riêng"}
              </span>
            </div>

            {/* Time slot */}
            <div className="space-y-1">
              <div className="flex items-center gap-2 text-sm text-slate-700">
                <Clock className="h-4 w-4 text-slate-400 shrink-0" />
                <span className="font-semibold">
                  {formatTime(booking.slotStart)} – {formatTime(booking.session?.plannedEndAt || booking.slotEnd)}
                </span>
                <span className="text-xs text-slate-400">
                  {new Date(booking.slotStart).toLocaleDateString("vi-VN")}
                </span>
              </div>
              {booking.session?.approvedExtensionMinutes && booking.session.approvedExtensionMinutes > 0 ? (
                <div className="pl-6 text-[11px] font-bold text-orange-600 flex items-center gap-1 animate-pulse">
                  <span>( +{booking.session.approvedExtensionMinutes}p gia hạn )</span>
                </div>
              ) : null}
            </div>

            {/* Customer info with Avatar */}
            {booker?.resolvedName && (
              <div className="flex items-center gap-3 bg-slate-50 border border-slate-100 rounded-xl p-3">
                <div className="h-10 w-10 rounded-full overflow-hidden bg-slate-200 flex-shrink-0 flex items-center justify-center border border-slate-100">
                  {booker.resolvedAvatarUrl ? (
                    <img
                      src={sanitizeImageUrl(booker.resolvedAvatarUrl)}
                      alt={booker.resolvedName}
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <User className="h-5 w-5 text-slate-400" />
                  )}
                </div>
                <div>
                  <p className="font-bold text-xs text-slate-900">{booker.resolvedName}</p>
                  <p className="text-[10px] text-slate-500">{booker.resolvedPhone || "Chưa có sđt"}</p>
                </div>
              </div>
            )}

            {/* Vehicles list with images */}
            <div className="space-y-2">
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Phương tiện</p>
              {booking.vehicles.length === 0 ? (
                <div className="rounded-xl bg-slate-50 border border-slate-100 p-3 text-xs text-slate-400">
                  Xe riêng (BYOC)
                </div>
              ) : (
                <div className="grid grid-cols-1 gap-2">
                  {booking.vehicles.map((v, idx) => (
                    <div key={idx} className="flex items-center gap-3 bg-slate-50 border border-slate-100 rounded-xl p-3">
                      <div className="h-12 w-20 rounded-lg overflow-hidden bg-slate-100 flex-shrink-0 flex items-center justify-center border border-slate-200">
                        {v.coverImageUrl ? (
                          <img
                            src={sanitizeImageUrl(v.coverImageUrl)}
                            alt={v.catalogName || "Xe thuê"}
                            className="h-full w-full object-cover"
                          />
                        ) : (
                          <Wrench className="h-5 w-5 text-slate-400" />
                        )}
                      </div>
                      <div>
                        <p className="font-bold text-xs text-slate-900">{v.catalogName || "Xe thuê"}</p>
                        <p className="text-[10px] text-slate-500">
                          {v.tier ? (v.tier === "STANDARD" ? "Tiêu Chuẩn" : v.tier === "PREMIUM" ? "Cao Cấp" : "Giới Hạn") : "Tiêu Chuẩn"}
                          {v.color ? ` • ${v.color}` : ""}
                          {v.identifier ? ` • #${v.identifier}` : ""}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Session info */}
            {booking.session && (
              <div className="rounded-xl bg-slate-50 border border-slate-100 p-3 text-xs space-y-2">
                <p className="font-semibold text-slate-700 text-[11px] uppercase tracking-wide">Ca chơi đang diễn ra</p>
                <div className="flex items-center justify-between text-slate-500">
                  <span>Trạng thái</span>
                  <span className="font-bold text-slate-800">
                    {(() => {
                      switch (booking.session.status) {
                        case "ACTIVE":
                          return "Đang chơi"
                        case "EXTENDING":
                          return `Đang gia hạn (${booking.session.proposedExtensionMinutes || 15} phút)`
                        case "CHECKING_OUT":
                          return "Chờ trả xe"
                        case "COMPLETED":
                          return "Hoàn thành"
                        case "CANCELLED":
                          return "Đã hủy"
                        default:
                          return booking.session.status
                      }
                    })()}
                  </span>
                </div>
                {booking.session.actualStartAt && (
                  <div className="flex items-center justify-between text-slate-500">
                    <span>Bắt đầu thực tế</span>
                    <span className="font-medium text-slate-700">
                      {new Date(booking.session.actualStartAt).toLocaleTimeString("vi-VN", { hour: "2-digit", minute: "2-digit" })}
                    </span>
                  </div>
                )}
                {booking.session.status === "ACTIVE" && (
                  <div className="flex items-center justify-between text-slate-500">
                    <span>Thời lượng chơi còn lại</span>
                    <SessionTimer
                      plannedEndAt={booking.session.plannedEndAt}
                      actualStartAt={booking.session.actualStartAt}
                      status={booking.session.status}
                    />
                  </div>
                )}
                {booking.session.actualEndAt && (
                  <div className="flex items-center justify-between text-slate-500">
                    <span>Kết thúc thực tế</span>
                    <span className="font-medium text-slate-700">
                      {new Date(booking.session.actualEndAt).toLocaleTimeString("vi-VN", { hour: "2-digit", minute: "2-digit" })}
                    </span>
                  </div>
                )}
              </div>
            )}

            {/* Damage breakdown */}
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <Wrench className="h-4 w-4 text-orange-500" />
                <span className="text-sm font-black text-slate-900">Đền bù hư hỏng</span>
                {damage && (() => {
                  const s = DAMAGE_STATUS_LABELS[damage.status] ?? DAMAGE_STATUS_LABELS.PENDING
                  return (
                    <span className={`ml-auto inline-flex rounded-full px-2 py-0.5 text-[10px] font-bold ${s.className}`}>
                      {s.label}
                    </span>
                  )
                })()}
              </div>

              {!damage ? (
                <div className="rounded-xl bg-slate-50 border border-slate-100 p-4 text-center">
                  <p className="text-xs text-slate-400">Không có hư hỏng xe trong lần thuê này.</p>
                </div>
              ) : damage.lineItems.length === 0 ? (
                <p className="text-xs text-slate-400">Chưa có hạng mục hư hỏng nào được ghi nhận.</p>
              ) : (
                <div className="border border-slate-100 rounded-xl overflow-hidden">
                  <table className="w-full text-xs">
                    <thead className="bg-slate-50">
                      <tr className="text-left text-slate-500 font-semibold">
                        <th className="py-2 px-3">Hạng mục</th>
                        <th className="py-2 px-3 text-right">Linh kiện</th>
                        <th className="py-2 px-3 text-right">Công</th>
                        <th className="py-2 px-3 text-right">Thành tiền</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-50">
                      {damage.lineItems.map((item) => (
                        <tr key={item.id}>
                          <td className="py-2 px-3 font-medium text-slate-800">
                            {PART_TYPE_LABELS[item.partType] ?? item.partType}
                            {item.customPartName && (
                              <span className="block text-[10px] text-slate-400">{item.customPartName}</span>
                            )}
                          </td>
                          <td className="py-2 px-3 text-right text-slate-600">
                            {item.partsPrice.toLocaleString("vi-VN")}đ
                          </td>
                          <td className="py-2 px-3 text-right text-slate-600">
                            {item.laborPrice.toLocaleString("vi-VN")}đ
                          </td>
                          <td className="py-2 px-3 text-right font-bold text-slate-800">
                            {item.subtotal.toLocaleString("vi-VN")}đ
                          </td>
                        </tr>
                      ))}
                    </tbody>
                    <tfoot className="bg-orange-50 border-t border-orange-100">
                      <tr>
                        <td colSpan={3} className="py-2.5 px-3 font-black text-slate-900 text-xs">
                          Tổng đền bù
                        </td>
                        <td className="py-2.5 px-3 text-right font-black text-orange-700">
                          {damage.totalDamageCharge.toLocaleString("vi-VN")}đ
                        </td>
                      </tr>
                    </tfoot>
                  </table>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

const today = new Date().toISOString().split("T")[0]

const STATUS_LABELS: Record<BookingStatus, { label: string; className: string }> = {
  PENDING: { label: "Chờ thanh toán", className: "bg-amber-100 text-amber-800" },
  CONFIRMED: { label: "Đã xác nhận", className: "bg-emerald-100 text-emerald-800" },
  AWAITING_PAYMENT: { label: "Chờ thanh toán phí phát sinh", className: "bg-amber-100 text-amber-800" },
  NO_SHOW: { label: "Không đến", className: "bg-orange-100 text-orange-800" },
  COMPLETED: { label: "Hoàn thành", className: "bg-indigo-100 text-indigo-800" },
  CANCELLED: { label: "Đã hủy", className: "bg-red-100 text-red-800" },
}

const PLAY_MODE_LABELS: Record<string, string> = {
  RENTAL: "Thuê xe",
  BYOC: "Xe riêng",
}

function formatTime(iso: string) {
  return new Date(iso).toLocaleTimeString("vi-VN", { hour: "2-digit", minute: "2-digit", hour12: false })
}

function CancelDialog({
  booking,
  onConfirm,
  onCancel,
  isPending,
}: {
  booking: CafeBookingListItem
  onConfirm: (reason: string) => void
  onCancel: () => void
  isPending: boolean
}) {
  const [reason, setReason] = useState("")
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="bg-white rounded-2xl max-w-md w-full border border-slate-200 shadow-2xl p-6 space-y-5">
        <div className="h-12 w-12 rounded-full bg-red-50 text-red-600 flex items-center justify-center">
          <AlertTriangle className="h-6 w-6" />
        </div>
        <div className="space-y-1">
          <h3 className="text-lg font-black text-slate-950">Xác nhận hủy đặt lịch?</h3>
          <p className="text-xs text-slate-500">
            Mã đặt lịch: <span className="font-bold text-slate-700">#{booking.id.substring(0, 8).toUpperCase()}</span>
            {" · "}
            {formatTime(booking.slotStart)} – {formatTime(booking.slotEnd)}
          </p>
        </div>
        <div className="space-y-1.5">
          <label className="text-xs font-semibold text-slate-700">Lý do hủy (tùy chọn)</label>
          <Input
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            placeholder="Nhập lý do..."
            className="text-sm"
          />
        </div>
        <div className="flex items-center gap-3 justify-end">
          <Button variant="outline" className="font-bold text-xs h-10 rounded-xl" onClick={onCancel}>
            Không, giữ lịch
          </Button>
          <Button
            className="bg-red-600 hover:bg-red-700 text-white font-bold text-xs h-10 rounded-xl"
            onClick={() => onConfirm(reason)}
            disabled={isPending}
          >
            {isPending ? "Đang hủy..." : "Xác nhận hủy"}
          </Button>
        </div>
      </div>
    </div>
  )
}

function SessionTimer({ plannedEndAt, actualStartAt, status }: { plannedEndAt: string; actualStartAt: string; status: string }) {
  const [timeStr, setTimeStr] = useState("")

  useEffect(() => {
    if (status !== 'ACTIVE') {
      setTimeStr(status === 'EXTENDING' ? 'Gia hạn' : 'Chờ xác nhận')
      return
    }

    const interval = setInterval(() => {
      const now = Date.now()
      const end = new Date(plannedEndAt).getTime()
      const diff = end - now
      const isOverdue = diff < 0
      const absDiff = Math.abs(diff)

      const hrs = Math.floor(absDiff / 3600000)
      const mins = Math.floor((absDiff % 3600000) / 60000)
      const secs = Math.floor((absDiff % 60000) / 1000)

      const format = (n: number) => String(n).padStart(2, "0")
      const timeFormatted = `${format(hrs)}:${format(mins)}:${format(secs)}`

      if (isOverdue) {
        setTimeStr(`Quá giờ: ${timeFormatted}`)
      } else {
        setTimeStr(timeFormatted)
      }
    }, 1000)

    return () => clearInterval(interval)
  }, [plannedEndAt, actualStartAt, status])

  const isOverdue = new Date(plannedEndAt).getTime() < Date.now() && status === 'ACTIVE'
  return (
    <span className={isOverdue ? "text-red-500 font-bold" : "text-slate-700 font-mono font-medium"}>
      {timeStr || "00:00:00"}
    </span>
  )
}

export function ProviderBookingsPage() {
  const [selectedDate, setSelectedDate] = useState(today)
  const [selectedCafeId, setSelectedCafeId] = useState<string>("")
  const [cancelTarget, setCancelTarget] = useState<CafeBookingListItem | null>(null)
  const [detailBookingId, setDetailBookingId] = useState<string | null>(null)
  const [page, setPage] = useState(1)
  const [now] = useState(() => Date.now())
  const limit = 20

  const queryClient = useQueryClient()

  // WebSocket real-time synchronization
  useWebSocket((msg) => {
    if (
      msg.event === "SESSION_CHECKIN_CONFIRMED" ||
      msg.event === "SESSION_EXTENSION_PROPOSED" ||
      msg.event === "CUSTOMER_CHECKOUT_CONFIRMED" ||
      msg.event === "SESSION_STATUS_CHANGED" ||
      msg.event === "booking.new"
    ) {
      void queryClient.invalidateQueries({ queryKey: ["bookings"] })
      if (detailBookingId) {
        void queryClient.invalidateQueries({ queryKey: ["booking", detailBookingId] })
      }
    }
  })

  const { data: cafesData } = useQuery({
    queryKey: cafeQueryKeys.list({ page: 1, limit: 100, scope: "managed" }),
    queryFn: () => cafeApi.listCafes({ page: 1, limit: 100, scope: "managed" }),
  })
  const cafes = cafesData?.data ?? []
  const activeCafeId = selectedCafeId || cafes[0]?.id

  const { data, isLoading, refetch } = useCafeBookings(activeCafeId, {
    date: selectedDate,
    page,
    limit,
  })
  const bookings = data?.data ?? []
  const total = data?.total ?? 0

  const cancelMutation = useCancelBooking()

  const confirmedCount = bookings.filter((b) => b.status === "CONFIRMED").length
  const pendingCount = bookings.filter((b) => b.status === "PENDING").length
  const noShowRisk = bookings.filter((b) => {
    if (b.status !== "CONFIRMED") return false
    const diff = (new Date(b.slotStart).getTime() - now) / 60000
    return diff < 30 && diff > 0
  }).length

  const handleCancelConfirm = (reason: string) => {
    if (!cancelTarget) return
    cancelMutation.mutate(
      { bookingId: cancelTarget.id, reason: reason || undefined },
      {
        onSuccess: () => {
          setCancelTarget(null)
          toast.success("Đã hủy lịch đặt thành công!")
          void refetch()
        },
        onError: () => {
          toast.error("Không thể hủy đơn. Vui lòng thử lại.")
        },
      },
    )
  }

  return (
    <ProviderShell>
      <ProviderPageHeader
        title="Danh sách đặt lịch"
        description="Quản lý đặt lịch theo trạng thái thanh toán, khung giờ và cơ sở."
      />

      <section className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <MetricCard
          label="Hôm nay"
          value={String(bookings.length)}
          helper={`${confirmedCount} confirmed, ${pendingCount} pending`}
          icon={<CalendarClock />}
          tone="info"
        />
        <MetricCard
          label="Tổng booking"
          value={String(total)}
          helper={`Trang ${page}/${Math.ceil(total / limit) || 1}`}
          icon={<CreditCard />}
          tone="success"
        />
        <MetricCard
          label="No-show risk"
          value={String(noShowRisk)}
          helper="Sắp quá 30 phút"
          icon={<AlertTriangle />}
          tone={noShowRisk > 0 ? "warning" : "success"}
        />
      </section>

      <Panel className="mt-4">
        <PanelTitle
          title="Danh sách đặt lịch"
          subtitle="Theo dõi đặt lịch theo cơ sở, thời gian và trạng thái."
          action={
            <div className="flex flex-wrap items-center gap-3">
              {cafes.length > 1 && (
                <Select value={activeCafeId} onValueChange={(v) => { setSelectedCafeId(v); setPage(1) }}>
                  <SelectTrigger className="h-9 w-52 text-xs rounded-lg">
                    <SelectValue placeholder="Chọn cơ sở" />
                  </SelectTrigger>
                  <SelectContent>
                    {cafes.map((cafe) => (
                      <SelectItem key={cafe.id} value={cafe.id} className="text-xs">
                        {cafe.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
              <Input
                type="date"
                value={selectedDate}
                onChange={(e) => { setSelectedDate(e.target.value); setPage(1) }}
                className="h-9 w-40 text-xs rounded-lg"
              />
            </div>
          }
        />

        {isLoading ? (
          <div className="py-12 text-center text-sm text-slate-500">Đang tải...</div>
        ) : bookings.length === 0 ? (
          <div className="py-12 text-center text-sm text-slate-400">
            Không có đặt lịch nào cho ngày {selectedDate}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead>
                <tr className="border-b border-slate-100 text-left text-slate-500 font-semibold">
                  <th className="pb-3 pl-1">Mã</th>
                  <th className="pb-3">Khách hàng</th>
                  <th className="pb-3">Thời gian</th>
                  <th className="pb-3">Chế độ</th>
                  <th className="pb-3">Trạng thái</th>
                  <th className="pb-3 text-right pr-1">Thao tác</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {bookings.map((booking) => {
                  const statusInfo = STATUS_LABELS[booking.status] ?? STATUS_LABELS.PENDING
                  const canCancel = booking.status === "CONFIRMED" || booking.status === "PENDING"
                  return (
                    <tr key={booking.id} className="hover:bg-slate-50/50 transition-colors">
                      <td className="py-3 pl-1 font-mono font-bold text-slate-800">
                        #{booking.id.substring(0, 8).toUpperCase()}
                      </td>
                      <td className="py-3">
                        <p className="font-semibold text-slate-800">{booking.customerName}</p>
                        {booking.customerPhone && (
                          <p className="text-[10px] text-slate-400">{booking.customerPhone}</p>
                        )}
                      </td>
                      <td className="py-3 text-slate-700">
                        {formatTime(booking.slotStart)} – {formatTime(booking.slotEnd)}
                      </td>
                      <td className="py-3">
                        <Badge className={`text-[10px] px-1.5 py-0 border-none font-bold ${booking.playMode === "RENTAL" ? "bg-orange-100 text-orange-800" : "bg-blue-100 text-blue-800"}`}>
                          {PLAY_MODE_LABELS[booking.playMode] ?? booking.playMode}
                        </Badge>
                      </td>
                      <td className="py-3">
                        {(() => {
                          if (booking.sessionStatus === "ACTIVE") {
                            return (
                              <span className="inline-flex rounded-full px-2 py-0.5 text-[10px] font-bold bg-emerald-100 text-emerald-800 animate-pulse">
                                Đang chơi
                              </span>
                            )
                          }
                          if (booking.sessionStatus === "EXTENDING") {
                            return (
                              <span className="inline-flex rounded-full px-2 py-0.5 text-[10px] font-bold bg-amber-100 text-amber-800">
                                Đang gia hạn
                              </span>
                            )
                          }
                          if (booking.sessionStatus === "CHECKING_OUT") {
                            return (
                              <span className="inline-flex rounded-full px-2 py-0.5 text-[10px] font-bold bg-blue-100 text-blue-800">
                                Chờ trả xe
                              </span>
                            )
                          }
                          return (
                            <span className={`inline-flex rounded-full px-2 py-0.5 text-[10px] font-bold ${statusInfo.className}`}>
                              {statusInfo.label}
                            </span>
                          )
                        })()}
                      </td>
                      <td className="py-3 pr-1 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <Button
                            size="sm"
                            variant="outline"
                            className="h-7 text-[10px] font-bold border-slate-200 text-slate-600 hover:bg-slate-50 rounded-lg px-2"
                            onClick={() => setDetailBookingId(booking.id)}
                          >
                            Chi tiết
                          </Button>
                          {canCancel && (
                            <Button
                              size="sm"
                              variant="outline"
                              className="h-7 text-[10px] font-bold border-red-200 text-red-600 hover:bg-red-50 rounded-lg px-2"
                              onClick={() => setCancelTarget(booking)}
                            >
                              <XCircle className="h-3 w-3 mr-1" />
                              Hủy
                            </Button>
                          )}
                        </div>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>

            {total > limit && (
              <div className="flex items-center justify-center gap-3 pt-4 border-t border-slate-100">
                <Button
                  variant="outline"
                  size="sm"
                  className="h-8 text-xs"
                  disabled={page <= 1}
                  onClick={() => setPage((p) => p - 1)}
                >
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                <span className="text-xs text-slate-500">
                  {page} / {Math.ceil(total / limit)}
                </span>
                <Button
                  variant="outline"
                  size="sm"
                  className="h-8 text-xs"
                  disabled={page >= Math.ceil(total / limit)}
                  onClick={() => setPage((p) => p + 1)}
                >
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            )}
          </div>
        )}
      </Panel>

      {cancelTarget && (
        <CancelDialog
          booking={cancelTarget}
          onConfirm={handleCancelConfirm}
          onCancel={() => setCancelTarget(null)}
          isPending={cancelMutation.isPending}
        />
      )}

      {detailBookingId && (
        <BookingDetailDrawer
          bookingId={detailBookingId}
          onClose={() => setDetailBookingId(null)}
        />
      )}
    </ProviderShell>
  )
}
