import { useState } from "react"
import { useQuery } from "@tanstack/react-query"
import { AlertTriangle, CalendarClock, CreditCard, XCircle, ChevronLeft, ChevronRight } from "lucide-react"
import { toast } from "sonner"

import { cafeApi, cafeQueryKeys } from "@/features/cafes/api/cafe.api"
import { useCafeBookings, useCancelBooking } from "@/features/booking/hooks/use-booking"
import type { BookingStatus, CafeBookingListItem } from "@/features/booking/types/booking.types"
import { MetricCard, Panel, PanelTitle, ProviderPageHeader } from "@/pages/provider/components/ProviderPrimitives"
import { ProviderShell } from "@/pages/provider/components/ProviderShell"
import { Badge } from "@/shared/ui/badge"
import { Button } from "@/shared/ui/button"
import { Input } from "@/shared/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/shared/ui/select"

const today = new Date().toISOString().split("T")[0]

const STATUS_LABELS: Record<BookingStatus, { label: string; className: string }> = {
  PENDING: { label: "Chờ TT", className: "bg-amber-100 text-amber-800" },
  CONFIRMED: { label: "Đã xác nhận", className: "bg-emerald-100 text-emerald-800" },
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

export function ProviderBookingsPage() {
  const [selectedDate, setSelectedDate] = useState(today)
  const [selectedCafeId, setSelectedCafeId] = useState<string>("")
  const [cancelTarget, setCancelTarget] = useState<CafeBookingListItem | null>(null)
  const [page, setPage] = useState(1)
  const limit = 20

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
    const diff = (new Date(b.slotStart).getTime() - Date.now()) / 60000
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
                        <span className={`inline-flex rounded-full px-2 py-0.5 text-[10px] font-bold ${statusInfo.className}`}>
                          {statusInfo.label}
                        </span>
                      </td>
                      <td className="py-3 pr-1 text-right">
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
    </ProviderShell>
  )
}
