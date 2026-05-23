import { useState } from "react"
import { 
  mockCustomerBookings, 
  type MockBooking 
} from "@/shared/data/user-mock-data"
import { 
  Calendar, 
  MapPin, 
  Car, 
  ShieldCheck, 
  AlertTriangle,
  XCircle,
  HelpCircle
} from "lucide-react"

import { Button } from "@/shared/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/shared/ui/card"
import { Badge } from "@/shared/ui/badge"
import { toast } from "sonner"
import { CustomerSubNav } from "./components/CustomerSubNav"

export function CustomerBookingsPage() {
  const [bookings, setBookings] = useState<MockBooking[]>(mockCustomerBookings)
  const [activeFilter, setActiveFilter] = useState<"all" | "pending" | "confirmed" | "completed" | "cancelled">("all")
  const [showCancelDialog, setShowCancelDialog] = useState<string | null>(null)

  // Filter logic
  const filteredBookings = bookings.filter(b => {
    if (activeFilter === "all") return true
    return b.status === activeFilter
  })

  // Cancel Booking handler
  const handleCancelBooking = (bookingId: string) => {
    setBookings(prev => 
      prev.map(b => b.bookingId === bookingId ? { ...b, status: "cancelled" } : b)
    )
    setShowCancelDialog(null)
    toast.success(`Đã hủy lịch đặt ${bookingId} thành công!`, {
      description: "Hệ thống đã cập nhật trạng thái hủy. Điểm uy tín của bạn được giữ nguyên vì hủy trước 24 tiếng."
    })
  }

  // Format currencies helper
  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND" }).format(val)
  }

  // Helper to map status colors
  const getStatusBadge = (status: MockBooking["status"]) => {
    switch (status) {
      case "pending":
        return <Badge className="bg-amber-100 text-amber-800 border-none font-bold text-xs">Chờ duyệt</Badge>
      case "confirmed":
        return <Badge className="bg-emerald-100 text-emerald-800 border-none font-bold text-xs">Đã duyệt</Badge>
      case "completed":
        return <Badge className="bg-indigo-100 text-indigo-800 border-none font-bold text-xs">Hoàn tất</Badge>
      case "cancelled":
        return <Badge className="bg-red-100 text-red-800 border-none font-bold text-xs">Đã hủy</Badge>
    }
  }

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 font-sans p-6 md:p-12 relative">
      
      {/* Decorative Glows */}
      <div className="absolute top-0 right-[10%] w-[350px] h-[350px] rounded-full bg-orange-400/10 blur-[100px] pointer-events-none" />
      <div className="absolute bottom-[10%] left-[10%] w-[350px] h-[350px] rounded-full bg-indigo-400/10 blur-[100px] pointer-events-none" />

      <div className="max-w-5xl mx-auto space-y-8 relative z-10">
        
        {/* Header Ribbon */}
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 border-b border-slate-200 pb-6">
          <div className="space-y-1">
            <div className="flex items-center gap-2 text-xs font-bold text-slate-500 uppercase tracking-widest">
              <ShieldCheck className="h-4 w-4 text-orange-500" />
              Trang cá nhân Người chơi
            </div>
            <h1 className="text-3xl font-extrabold text-slate-950 tracking-tight">
              Quản Lý Lịch Đặt Sân
            </h1>
          </div>

          {/* User Score Stats Card */}
          <div className="flex items-center gap-4 bg-white border border-slate-200 rounded-xl p-3.5 shadow-sm">
            <div className="h-10 w-10 rounded-lg bg-orange-50 text-orange-600 flex items-center justify-center font-black text-sm">
              98
            </div>
            <div>
              <p className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider leading-none">Điểm uy tín (Trust Score)</p>
              <p className="text-xs font-bold text-slate-800 mt-1">Cực kỳ uy tín (Hạng vàng)</p>
            </div>
          </div>
        </div>

        {/* SUB NAVIGATION BAR FOR CUSTOMER SPACE */}
        <CustomerSubNav activeTab="bookings" />

        {/* STATE FILTERS BUTTONS */}
        <div className="flex flex-wrap items-center gap-2">
          {[
            { key: "all", label: "Tất cả đặt lịch" },
            { key: "pending", label: "Chờ duyệt" },
            { key: "confirmed", label: "Đã duyệt" },
            { key: "completed", label: "Hoàn tất" },
            { key: "cancelled", label: "Đã hủy" }
          ].map(filter => (
            <button 
              key={filter.key}
              onClick={() => setActiveFilter(filter.key as "all" | "pending" | "confirmed" | "completed" | "cancelled")}
              className={`py-2 px-4 rounded-xl text-xs font-bold transition-all ${activeFilter === filter.key ? 'bg-slate-950 text-white shadow-md' : 'bg-white border border-slate-200 text-slate-600 hover:border-slate-300'}`}
            >
              {filter.label}
            </button>
          ))}
        </div>

        {/* BOOKINGS LIST */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {filteredBookings.length > 0 ? (
            filteredBookings.map((booking) => (
              <Card key={booking.bookingId} className="border-slate-200/80 shadow-sm hover:shadow-md transition-all relative overflow-hidden bg-white">
                
                {/* Decorative border highlight */}
                <div className={`absolute top-0 left-0 right-0 h-1.5 ${booking.status === 'confirmed' ? 'bg-emerald-500' : booking.status === 'pending' ? 'bg-amber-500' : booking.status === 'completed' ? 'bg-indigo-500' : 'bg-slate-300'}`} />

                <CardHeader className="flex flex-row items-center justify-between pb-3">
                  <div>
                    <CardTitle className="text-base font-extrabold text-slate-950 flex items-center gap-1.5">
                      {booking.bookingId}
                    </CardTitle>
                    <CardDescription className="text-[10px] font-bold text-slate-400 mt-0.5">MÃ GIAO DỊCH</CardDescription>
                  </div>
                  {getStatusBadge(booking.status)}
                </CardHeader>

                <CardContent className="space-y-3.5 text-xs text-slate-700 font-semibold border-t border-slate-50 pt-3">
                  
                  {/* Cafe Details */}
                  <div className="flex items-start gap-2">
                    <MapPin className="h-4.5 w-4.5 text-slate-400 mt-0.5 shrink-0" />
                    <div>
                      <p className="font-extrabold text-slate-900">{booking.cafeName}</p>
                      <p className="text-[10px] font-medium text-slate-400">{booking.trackName}</p>
                    </div>
                  </div>

                  {/* Timing Slot */}
                  <div className="flex items-center gap-2">
                    <Calendar className="h-4.5 w-4.5 text-slate-400 shrink-0" />
                    <span>{booking.dateTime}</span>
                  </div>

                  {/* Vehicle details */}
                  <div className="flex items-center gap-2">
                    <Car className="h-4.5 w-4.5 text-slate-400 shrink-0" />
                    <span className="flex items-center gap-1.5">
                      {booking.vehicleName}
                      <Badge className={`text-[9px] px-1.5 py-0 border-none font-bold ${booking.type === 'rent' ? 'bg-orange-100 text-orange-800' : 'bg-blue-100 text-blue-800'}`}>
                        {booking.type === 'rent' ? 'Thuê xe' : 'Xe riêng'}
                      </Badge>
                    </span>
                  </div>

                  {/* Payment statistics */}
                  <div className="p-3 bg-slate-50 rounded-xl grid grid-cols-2 gap-2 text-[11px] font-bold text-slate-600">
                    <div>
                      <span className="block text-[9px] text-slate-400 uppercase">Đã cọc (VietQR)</span>
                      <span className="text-slate-900">{formatCurrency(booking.depositAmount)}</span>
                    </div>
                    <div>
                      <span className="block text-[9px] text-slate-400 uppercase">Tổng cộng ước tính</span>
                      <span className="text-slate-900">{formatCurrency(booking.totalAmount)}</span>
                    </div>
                  </div>

                </CardContent>

                {/* Cancel Booking action footer */}
                {booking.status === "confirmed" || booking.status === "pending" ? (
                  <CardFooter className="pt-3 border-t border-slate-50 justify-end">
                    <Button 
                      variant="outline" 
                      className="border-red-200 hover:bg-red-50 text-red-600 font-bold text-xs h-9 rounded-lg"
                      onClick={() => setShowCancelDialog(booking.bookingId)}
                    >
                      <XCircle className="h-4 w-4 mr-1" />
                      Yêu cầu hủy lịch
                    </Button>
                  </CardFooter>
                ) : null}

              </Card>
            ))
          ) : (
            <div className="col-span-1 md:col-span-2 py-16 bg-white border border-dashed border-slate-300/80 rounded-2xl text-center space-y-4">
              <HelpCircle className="h-12 w-12 text-slate-300 mx-auto" />
              <div className="space-y-1">
                <p className="text-sm font-extrabold text-slate-950">Không tìm thấy lịch đặt nào</p>
                <p className="text-xs text-slate-400 font-medium max-w-xs mx-auto">Bạn không có giao dịch đặt lịch nào khớp với bộ lọc trạng thái đã chọn.</p>
              </div>
            </div>
          )}
        </div>

      </div>

      {/* CANCEL CONFIRMATION DIALOG MODAL */}
      {showCancelDialog && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full border border-slate-200/80 shadow-2xl p-6 space-y-5 animate-in fade-in zoom-in-95 duration-200 text-left">
            <div className="h-12 w-12 rounded-full bg-red-50 text-red-600 flex items-center justify-center text-xl shrink-0">
              <AlertTriangle className="h-6 w-6" />
            </div>
            
            <div className="space-y-2">
              <h3 className="text-lg font-black text-slate-950">Xác nhận hủy đặt lịch sân?</h3>
              <p className="text-xs font-semibold text-slate-500 leading-relaxed">
                Hệ thống RCField quy định nếu hủy lịch sát giờ chơi (<strong className="text-slate-800">&lt; 2 tiếng trước giờ hẹn</strong>), tài khoản của bạn sẽ bị khấu trừ <strong className="text-red-600">5 điểm uy tín (Trust Score)</strong>.
              </p>
              <div className="p-3 bg-slate-50 rounded-xl text-[10px] text-slate-600 font-bold border border-slate-200">
                Lịch cọc: <span className="text-slate-900">{showCancelDialog}</span> sẽ được hoàn tiền tự động theo cơ chế Ledger của quán đối tác sau khi trừ phí hủy (nếu có).
              </div>
            </div>

            <div className="flex items-center gap-3 justify-end pt-2">
              <Button 
                variant="outline" 
                className="border-slate-200 font-bold h-10 text-xs rounded-xl"
                onClick={() => setShowCancelDialog(null)}
              >
                Không, giữ lịch
              </Button>
              <Button 
                className="bg-red-600 hover:bg-red-700 text-white font-bold h-10 text-xs rounded-xl"
                onClick={() => handleCancelBooking(showCancelDialog)}
              >
                Có, xác nhận hủy
              </Button>
            </div>
          </div>
        </div>
      )}

    </div>
  )
}
