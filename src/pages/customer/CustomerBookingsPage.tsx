import { useState } from "react"
import { useNavigate, Link } from "react-router"
import {
  Calendar,
  Car,
  ShieldCheck,
  AlertTriangle,
  XCircle,
  HelpCircle,
  ChevronLeft,
  Clock,
  CreditCard,
  Loader2,
} from "lucide-react"
import { Button } from "@/shared/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/shared/ui/card"
import { Badge } from "@/shared/ui/badge"
import { toast } from "sonner"
import { CustomerSubNav } from "./components/CustomerSubNav"
import { useMyBookings, useCancelBooking, useCreateCheckout } from "@/features/booking/hooks/use-booking"
import type { BookingStatus } from "@/features/booking/types/booking.types"

type FilterKey = "all" | BookingStatus

const STATUS_LABELS: Record<BookingStatus, { label: string; badge: string }> = {
  PENDING: { label: "Chờ thanh toán", badge: "bg-amber-100 text-amber-800 border-none font-bold text-xs" },
  CONFIRMED: { label: "Đã xác nhận", badge: "bg-emerald-100 text-emerald-800 border-none font-bold text-xs" },
  NO_SHOW: { label: "Không đến", badge: "bg-orange-100 text-orange-800 border-none font-bold text-xs" },
  COMPLETED: { label: "Hoàn thành", badge: "bg-indigo-100 text-indigo-800 border-none font-bold text-xs" },
  CANCELLED: { label: "Đã hủy", badge: "bg-red-100 text-red-800 border-none font-bold text-xs" },
}

const TOP_COLOR: Record<BookingStatus, string> = {
  PENDING: "bg-amber-500",
  CONFIRMED: "bg-emerald-500",
  NO_SHOW: "bg-orange-400",
  COMPLETED: "bg-indigo-500",
  CANCELLED: "bg-slate-300",
}

const FILTERS: Array<{ key: FilterKey; label: string }> = [
  { key: "all", label: "Tất cả" },
  { key: "PENDING", label: "Chờ thanh toán" },
  { key: "CONFIRMED", label: "Đã xác nhận" },
  { key: "COMPLETED", label: "Hoàn thành" },
  { key: "CANCELLED", label: "Đã hủy" },
]

export function CustomerBookingsPage() {
  const navigate = useNavigate()
  const [activeFilter, setActiveFilter] = useState<FilterKey>("all")
  const [cancelTarget, setCancelTarget] = useState<string | null>(null)
  const [resumingId, setResumingId] = useState<string | null>(null)

  const status = activeFilter === "all" ? undefined : activeFilter
  const { data, isLoading } = useMyBookings({ status })
  const cancelMutation = useCancelBooking()
  const checkoutMutation = useCreateCheckout()

  const handleResumePayment = (bookingId: string) => {
    setResumingId(bookingId)
    checkoutMutation.mutate(bookingId, {
      onSuccess: (result) => {
        window.location.href = result.payment_url
      },
      onError: () => {
        toast.error("Không thể tạo link thanh toán. Vui lòng thử lại.")
        setResumingId(null)
      },
    })
  }

  const bookings = data?.data ?? []

  const handleCancelConfirm = () => {
    if (!cancelTarget) return
    cancelMutation.mutate(
      { bookingId: cancelTarget },
      {
        onSuccess: () => {
          setCancelTarget(null)
          toast.success("Đã hủy lịch đặt thành công!")
        },
        onError: () => {
          toast.error("Không thể hủy đơn. Vui lòng thử lại.")
        },
      },
    )
  }

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 font-sans p-6 md:p-12 relative">
      <div className="absolute top-0 right-[10%] w-[350px] h-[350px] rounded-full bg-orange-400/10 blur-[100px] pointer-events-none" />
      <div className="absolute bottom-[10%] left-[10%] w-[350px] h-[350px] rounded-full bg-indigo-400/10 blur-[100px] pointer-events-none" />

      <div className="max-w-5xl mx-auto space-y-6 relative z-10">
        <div>
          <button
            onClick={() => navigate(-1)}
            className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-500 hover:text-slate-900 transition-colors bg-white px-3 py-1.5 rounded-xl border border-slate-200/80 shadow-sm hover:bg-slate-50"
          >
            <ChevronLeft className="h-4 w-4" />
            Quay lại trang trước
          </button>
        </div>

        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 border-b border-slate-200 pb-6">
          <div className="space-y-1">
            <div className="flex items-center gap-2 text-xs font-bold text-slate-500 uppercase tracking-widest">
              <ShieldCheck className="h-4 w-4 text-orange-500" />
              Trang cá nhân Người chơi
            </div>
            <h1 className="text-3xl font-extrabold text-slate-950 tracking-tight">Quản Lý Lịch Đặt Sân</h1>
          </div>
        </div>

        <CustomerSubNav activeTab="bookings" />

        <div className="flex flex-wrap items-center gap-2">
          {FILTERS.map((f) => (
            <button
              key={f.key}
              onClick={() => setActiveFilter(f.key)}
              className={`py-2 px-4 rounded-xl text-xs font-bold transition-all duration-200 ${activeFilter === f.key ? "bg-slate-950 text-white shadow-md shadow-slate-900/20" : "bg-white border border-slate-200 text-slate-600 hover:border-slate-300 hover:bg-slate-50"}`}
            >
              {f.label}
            </button>
          ))}
        </div>

        {isLoading ? (
          <div className="py-16 text-center text-sm text-slate-500">Đang tải dữ liệu...</div>
        ) : bookings.length === 0 ? (
          <div className="py-16 bg-white border border-dashed border-slate-300/80 rounded-2xl text-center space-y-4">
            <HelpCircle className="h-12 w-12 text-slate-300 mx-auto" />
            <div className="space-y-1">
              <p className="text-sm font-extrabold text-slate-950">Không tìm thấy lịch đặt nào</p>
              <p className="text-xs text-slate-400 font-medium max-w-xs mx-auto">Bạn không có giao dịch đặt lịch nào khớp với bộ lọc trạng thái đã chọn.</p>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {bookings.map((booking) => {
              const statusInfo = STATUS_LABELS[booking.status] ?? STATUS_LABELS.PENDING
              const topColor = TOP_COLOR[booking.status] ?? "bg-slate-300"
              const slotStart = new Date(booking.slotStart)
              const slotEnd = new Date(booking.slotEnd)
              const shortId = booking.id.substring(0, 8).toUpperCase()

              return (
                <Card key={booking.id} className="border-slate-200/80 shadow-sm hover:shadow-md transition-all relative overflow-hidden bg-white">
                  <div className={`absolute top-0 left-0 right-0 h-1.5 ${topColor}`} />

                  <CardHeader className="flex flex-row items-center justify-between pb-3">
                    <div>
                      <CardTitle className="text-base font-extrabold text-slate-950">
                        #{shortId}
                      </CardTitle>
                      <CardDescription className="text-[10px] font-bold text-slate-400 mt-0.5">MÃ ĐẶT LỊCH</CardDescription>
                    </div>
                    <Badge className={statusInfo.badge}>{statusInfo.label}</Badge>
                  </CardHeader>

                  <CardContent className="space-y-3.5 text-xs text-slate-700 font-semibold border-t border-slate-50 pt-3">
                    <div className="flex items-center gap-2">
                      <Calendar className="h-4 w-4 text-slate-400 shrink-0" />
                      <span>
                        {slotStart.toLocaleDateString("vi-VN")} · {slotStart.toLocaleTimeString("vi-VN", { hour: "2-digit", minute: "2-digit", hour12: false })}–{slotEnd.toLocaleTimeString("vi-VN", { hour: "2-digit", minute: "2-digit", hour12: false })}
                      </span>
                    </div>

                    <div className="flex items-center gap-2">
                      <Car className="h-4 w-4 text-slate-400 shrink-0" />
                      <Badge className={`text-[9px] px-1.5 py-0 border-none font-bold ${booking.playMode === "RENTAL" ? "bg-orange-100 text-orange-800" : "bg-blue-100 text-blue-800"}`}>
                        {booking.playMode === "RENTAL" ? "Thuê xe quán" : "Mang xe riêng"}
                      </Badge>
                    </div>

                    {booking.status === "PENDING" && booking.paymentExpiresAt && (
                      <div className="flex items-center gap-2 text-amber-700">
                        <Clock className="h-4 w-4 shrink-0" />
                        <span>Hết hạn TT: {new Date(booking.paymentExpiresAt).toLocaleTimeString("vi-VN", { hour: "2-digit", minute: "2-digit" })}</span>
                      </div>
                    )}
                  </CardContent>

                  <CardFooter className="pt-3 border-t border-slate-50 flex gap-2 justify-end flex-wrap">
                    <Button asChild variant="outline" className="font-bold text-xs h-9 rounded-lg">
                      <Link to={`/booking/${booking.id}`}>Xem chi tiết</Link>
                    </Button>
                    {booking.status === "PENDING" && (
                      <Button
                        className="bg-orange-500 hover:bg-orange-600 text-white font-bold text-xs h-9 rounded-lg shadow-sm"
                        onClick={() => handleResumePayment(booking.id)}
                        disabled={resumingId === booking.id}
                      >
                        {resumingId === booking.id ? (
                          <Loader2 className="h-3.5 w-3.5 mr-1 animate-spin" />
                        ) : (
                          <CreditCard className="h-3.5 w-3.5 mr-1" />
                        )}
                        Tiếp tục thanh toán
                      </Button>
                    )}
                    {(booking.status === "CONFIRMED" || booking.status === "PENDING") && (
                      <Button
                        variant="outline"
                        className="border-red-200 hover:bg-red-50 text-red-600 font-bold text-xs h-9 rounded-lg"
                        onClick={() => setCancelTarget(booking.id)}
                      >
                        <XCircle className="h-4 w-4 mr-1" />
                        Hủy
                      </Button>
                    )}
                  </CardFooter>
                </Card>
              )
            })}
          </div>
        )}
      </div>

      {cancelTarget && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full border border-slate-200/80 shadow-2xl p-6 space-y-5 animate-in fade-in zoom-in-95 duration-200 text-left">
            <div className="h-12 w-12 rounded-full bg-red-50 text-red-600 flex items-center justify-center text-xl shrink-0">
              <AlertTriangle className="h-6 w-6" />
            </div>
            <div className="space-y-2">
              <h3 className="text-lg font-black text-slate-950">Xác nhận hủy đặt lịch sân?</h3>
              <p className="text-xs font-semibold text-slate-500 leading-relaxed">
                Hủy trước <strong className="text-slate-800">24 giờ</strong>: hoàn 100% phí lịch. Hủy trong 12–24h: hoàn 50%. Dưới 12h: không hoàn phí lịch.
              </p>
            </div>
            <div className="flex items-center gap-3 justify-end pt-2">
              <Button variant="outline" className="border-slate-200 font-bold h-10 text-xs rounded-xl" onClick={() => setCancelTarget(null)}>
                Không, giữ lịch
              </Button>
              <Button
                className="bg-red-600 hover:bg-red-700 text-white font-bold h-10 text-xs rounded-xl"
                onClick={handleCancelConfirm}
                disabled={cancelMutation.isPending}
              >
                {cancelMutation.isPending ? "Đang hủy..." : "Có, xác nhận hủy"}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
