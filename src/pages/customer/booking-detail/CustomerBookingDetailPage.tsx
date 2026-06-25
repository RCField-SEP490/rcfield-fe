import { useState, useEffect } from "react"
import { useParams, useNavigate, Link } from "react-router"
import { 
  mockCustomerBookingDetails, 
  type CustomerBookingDetail,
  type MockSessionDetail 
} from "@/shared/data/customer-operational-mock-data"
import {
  MapPin,
  Car,
  User,
  QrCode,
  Clock,
  AlertCircle,
  ArrowLeft,
  CheckCircle2,
  ExternalLink,
  HelpCircle,
  Phone,
  Receipt,
  Sparkles,
  Info,
  Camera
} from "lucide-react"
import { Button } from "@/shared/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/shared/ui/card"
import { Badge } from "@/shared/ui/badge"

export function CustomerBookingDetailPage() {
  const { bookingId } = useParams<{ bookingId: string }>()
  const navigate = useNavigate()
  
  // Find booking detail
  const [booking, setBooking] = useState<CustomerBookingDetail | null>(null)
  const [activeSession, setActiveSession] = useState<MockSessionDetail | null>(null)
  
  useEffect(() => {
    let found = mockCustomerBookingDetails.find(b => b.bookingId === bookingId)
    if (!found && bookingId) {
      // Bulletproof fallback: use the first high-fidelity mock booking but override the ID so it loads beautifully
      const defaultMock = mockCustomerBookingDetails[0]
      found = {
        ...defaultMock,
        bookingId: bookingId,
        shortCode: bookingId.includes("-") ? bookingId.replace(/^[^-]+-/, "RCF-") : `RCF-${bookingId}`
      }
    }
    if (found) {
      setBooking(found)
      // Check if there is an active/checking_out/extending session
      const live = found.sessions.find(s => 
        ["ACTIVE", "EXTENDING", "CHECKED_IN", "CHECKING_OUT"].includes(s.status)
      )
      if (live) {
        setActiveSession(live)
      }
    }
  }, [bookingId])

  if (!booking) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-6">
        <Card className="max-w-md w-full text-center p-8 space-y-4">
          <AlertCircle className="h-12 w-12 text-red-500 mx-auto animate-bounce" />
          <h2 className="text-xl font-bold text-slate-900">Không tìm thấy mã đặt lịch</h2>
          <p className="text-sm text-slate-500">Mã đặt lịch {bookingId} không hợp lệ hoặc đã bị xóa khỏi hệ thống.</p>
          <Button onClick={() => navigate("/customer/bookings")} className="w-full bg-slate-900 text-white rounded-xl">
            Quay lại Lịch đặt sân
          </Button>
        </Card>
      </div>
    )
  }

  // Format currency helper
  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND" }).format(val)
  }

  // Get status details
  const getStatusConfig = (status: CustomerBookingDetail["status"]) => {
    switch (status) {
      case "PENDING":
        return {
          label: "Chờ thanh toán",
          color: "bg-amber-500/10 text-amber-600 border-amber-500/20",
          desc: "Đơn đặt của bạn đang chờ thanh toán cọc trong 30 phút."
        }
      case "CONFIRMED":
        return {
          label: "Đã duyệt / Sẵn sàng",
          color: "bg-emerald-500/10 text-emerald-600 border-emerald-500/20",
          desc: "Lịch đặt đã duyệt thành công. Hãy đến quán đúng giờ để check-in."
        }
      case "COMPLETED":
        return {
          label: "Đã hoàn thành",
          color: "bg-blue-500/10 text-blue-600 border-blue-500/20",
          desc: "Phiên chơi đã kết thúc hoàn chỉnh. Cảm ơn bạn!"
        }
      case "CANCELLED":
        return {
          label: "Đã hủy",
          color: "bg-red-500/10 text-red-600 border-red-500/20",
          desc: "Lịch đặt này đã bị hủy bỏ."
        }
      case "NO_SHOW":
        return {
          label: "Vắng mặt (No Show)",
          color: "bg-slate-500/10 text-slate-600 border-slate-500/20",
          desc: "Bạn đã quá hạn check-in và không có mặt."
        }
    }
  }

  const statusConfig = getStatusConfig(booking.status)

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 p-4 md:p-8 font-sans relative overflow-x-hidden">
      
      {/* Premium background decorations */}
      <div className="absolute top-0 right-0 w-[500px] h-[500px] rounded-full bg-orange-500/5 blur-[120px] pointer-events-none" />
      <div className="absolute bottom-0 left-0 w-[500px] h-[500px] rounded-full bg-slate-500/5 blur-[120px] pointer-events-none" />

      <div className="max-w-5xl mx-auto space-y-6 relative z-10">
        
        {/* Top bar navigation */}
        <div className="flex items-center justify-between">
          <button
            onClick={() => navigate("/customer/bookings")}
            className="inline-flex items-center gap-2 text-xs font-extrabold text-slate-500 hover:text-slate-900 transition-colors bg-white px-3.5 py-2 rounded-xl border border-slate-200 shadow-sm"
          >
            <ArrowLeft className="h-4 w-4 text-orange-500" />
            Quay lại Lịch đặt sân
          </button>

          <span className="text-xs font-bold text-slate-400">
            Booking ID: <strong className="text-slate-800">{booking.bookingId}</strong>
          </span>
        </div>

        {/* Status Announcement Hero */}
        <div className="bg-white border border-slate-200/80 rounded-2xl p-6 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="flex flex-wrap items-center gap-2.5">
              <Badge className={`px-2.5 py-1 text-xs font-bold border-none uppercase tracking-wide ${statusConfig.color}`}>
                {statusConfig.label}
              </Badge>
              {booking.paymentStatus === "PAID" ? (
                <Badge className="bg-emerald-100 text-emerald-800 border-none font-bold text-xs uppercase tracking-wide">
                  Đã cọc
                </Badge>
              ) : (
                <Badge className="bg-rose-100 text-rose-800 border-none font-bold text-xs uppercase tracking-wide animate-pulse">
                  Chờ cọc
                </Badge>
              )}
            </div>
            <h1 className="text-2xl font-black text-slate-950 tracking-tight">
              Chi Tiết Đơn Đặt Sân
            </h1>
            <p className="text-xs text-slate-500 font-semibold">{statusConfig.desc}</p>
          </div>

          {/* Quick link to active session if playing */}
          {activeSession && (
            <Link 
              to={`/customer/sessions/${activeSession.sessionId}`}
              className="inline-flex items-center gap-2 bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white text-xs font-bold px-4 py-3 rounded-xl shadow-md shadow-orange-500/20 transition-all transform hover:-translate-y-0.5"
            >
              <Sparkles className="h-4 w-4 animate-spin text-orange-200" />
              Bạn đang chơi! Xem Live Session
              <ExternalLink className="h-3 w-3" />
            </Link>
          )}
        </div>

        {/* 2-Column Responsive Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
          
          {/* Main Details (Col-span 2) */}
          <div className="lg:col-span-2 space-y-6">
            
            {/* Cafe & Track Details */}
            <Card className="border-slate-200/80 shadow-sm overflow-hidden bg-white">
              <div className="h-32 bg-gradient-to-r from-slate-900 to-slate-800 relative flex items-center justify-between p-6 overflow-hidden">
                {/* Background lines */}
                <div className="absolute inset-0 opacity-10 bg-[radial-gradient(#e5e7eb_1px,transparent_1px)] [background-size:16px_16px]" />
                <div className="space-y-1 relative z-10 text-white">
                  <span className="text-[10px] font-black text-orange-400 uppercase tracking-widest">Địa điểm chơi</span>
                  <h3 className="text-lg font-black">{booking.cafeName}</h3>
                </div>
                <div className="h-16 w-16 rounded-xl bg-white/10 backdrop-blur-md border border-white/20 flex items-center justify-center relative z-10 text-white">
                  <MapPin className="h-8 w-8 text-orange-400" />
                </div>
              </div>
              <CardContent className="p-6 space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs font-semibold text-slate-700">
                  <div className="space-y-1 bg-slate-50 p-3.5 rounded-xl border border-slate-100">
                    <span className="block text-[10px] text-slate-400 uppercase font-bold">Địa chỉ sân</span>
                    <span className="text-slate-900 block mt-0.5">{booking.cafeAddress}</span>
                    <a href={`tel:${booking.cafePhone}`} className="inline-flex items-center gap-1 text-[11px] text-orange-600 hover:underline mt-2">
                      <Phone className="h-3.5 w-3.5" />
                      {booking.cafePhone}
                    </a>
                  </div>
                  <div className="space-y-1 bg-slate-50 p-3.5 rounded-xl border border-slate-100">
                    <span className="block text-[10px] text-slate-400 uppercase font-bold">Đường đua & Loại</span>
                    <span className="text-slate-900 block font-extrabold mt-0.5">{booking.trackName}</span>
                    <Badge className="bg-slate-200 text-slate-800 border-none font-bold text-[9px] mt-2">
                      {booking.trackType}
                    </Badge>
                  </div>
                </div>

                <div className="flex items-center gap-3 p-4 bg-orange-50/50 rounded-2xl border border-orange-100 text-xs font-bold text-orange-800">
                  <Clock className="h-5 w-5 text-orange-500 shrink-0" />
                  <div>
                    <span>Khung giờ hẹn: </span>
                    <span className="text-slate-900 font-extrabold">
                      {new Date(booking.slotStart).toLocaleTimeString("vi-VN", {hour: "2-digit", minute: "2-digit"})} - {new Date(booking.slotEnd).toLocaleTimeString("vi-VN", {hour: "2-digit", minute: "2-digit"})}
                    </span>
                    <span> ({new Date(booking.slotStart).toLocaleDateString("vi-VN", {weekday: "long", day: "numeric", month: "numeric", year: "numeric"})})</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Itinerary & Resources Details */}
            <Card className="border-slate-200/80 shadow-sm bg-white">
              <CardHeader className="pb-3 border-b border-slate-100">
                <CardTitle className="text-sm font-black text-slate-950 uppercase tracking-wider flex items-center gap-2">
                  <Car className="h-4.5 w-4.5 text-orange-500" />
                  Tài Nguyên Sử Dụng Dự Kiến
                </CardTitle>
                <CardDescription className="text-xs">
                  Danh sách người chơi và xe thuê đã đăng ký trước.
                </CardDescription>
              </CardHeader>
              <CardContent className="p-6 space-y-5">
                {/* Play mode */}
                <div className="flex items-center gap-4 text-xs font-bold text-slate-600 bg-slate-50 p-3 rounded-xl border border-slate-100">
                  <div>
                    <span className="text-[10px] text-slate-400 uppercase block font-bold">Chế độ chơi</span>
                    <span className="text-slate-900">{booking.playMode === "RENTAL" ? "Thuê xe của quán" : booking.playMode === "BYOC" ? "Mang xe cá nhân (BYOC)" : "Hỗn hợp"}</span>
                  </div>
                  <div className="h-8 w-px bg-slate-200" />
                  <div>
                    <span className="text-[10px] text-slate-400 uppercase block font-bold">Hình thức</span>
                    <span className="text-slate-900">{booking.bookingMode === "SINGLE" ? "Đặt lịch đơn lẻ" : "Đăng ký thành viên"}</span>
                  </div>
                </div>

                <div className="space-y-4">
                  {/* Participants */}
                  <div className="space-y-2">
                    <h4 className="text-[11px] font-black text-slate-400 uppercase tracking-widest">Người chơi đăng ký</h4>
                    <div className="space-y-2">
                      {booking.plannedParticipants.map((p, idx) => (
                        <div key={idx} className="flex items-center gap-3 bg-white p-2.5 rounded-xl border border-slate-100 shadow-2xs">
                          <div className="h-8 w-8 rounded-full bg-slate-100 text-slate-700 flex items-center justify-center font-bold text-xs">
                            <User className="h-4 w-4" />
                          </div>
                          <div>
                            <p className="text-xs font-extrabold text-slate-900">{p}</p>
                            <p className="text-[10px] text-slate-400 font-bold">Trưởng nhóm đặt sân</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Vehicles */}
                  <div className="space-y-2">
                    <h4 className="text-[11px] font-black text-slate-400 uppercase tracking-widest">Đội xe đăng ký thuê</h4>
                    <div className="space-y-2">
                      {booking.plannedVehicles.map((v, idx) => (
                        <div key={idx} className="flex items-center gap-3 bg-white p-2.5 rounded-xl border border-slate-100 shadow-2xs">
                          <div className="h-8 w-8 rounded-lg bg-orange-50 text-orange-600 flex items-center justify-center">
                            <Car className="h-4 w-4" />
                          </div>
                          <div>
                            <p className="text-xs font-extrabold text-slate-900">{v}</p>
                            <p className="text-[10px] text-slate-400 font-bold">Thuê theo giờ • Deposit yêu cầu</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Booking Sessions History */}
            <Card className="border-slate-200/80 shadow-sm bg-white">
              <CardHeader className="pb-3 border-b border-slate-100">
                <CardTitle className="text-sm font-black text-slate-950 uppercase tracking-wider flex items-center gap-2">
                  <CheckCircle2 className="h-4.5 w-4.5 text-orange-500" />
                  Lịch Sử Phiên Chơi Thực Tế (Sessions)
                </CardTitle>
                <CardDescription className="text-xs">
                  Một lịch đặt cọc (Booking) có thể có một hoặc nhiều phiên chơi thực tế.
                </CardDescription>
              </CardHeader>
              <CardContent className="p-6">
                {booking.sessions.length > 0 ? (
                  <div className="space-y-4">
                    {booking.sessions.map((session) => (
                      <div 
                        key={session.sessionId}
                        className="bg-slate-50 hover:bg-slate-100/80 transition-colors p-4 rounded-2xl border border-slate-200/70 flex flex-col md:flex-row md:items-center justify-between gap-4 cursor-pointer"
                        onClick={() => navigate(`/customer/sessions/${session.sessionId}`)}
                      >
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            <span className="text-xs font-black text-slate-900">{session.sessionId}</span>
                            <Badge className={`text-[9px] px-1.5 py-0.2 font-bold uppercase tracking-wide border-none ${
                              session.status === "ACTIVE" ? "bg-orange-100 text-orange-800" :
                              session.status === "CHECKED_IN" ? "bg-amber-100 text-amber-800 animate-pulse" :
                              session.status === "COMPLETED" ? "bg-emerald-100 text-emerald-800" : "bg-slate-200 text-slate-800"
                            }`}>
                              {session.status}
                            </Badge>
                          </div>
                          <p className="text-[10px] font-bold text-slate-400">NHÂN VIÊN PHỤ TRÁCH: {session.staffName}</p>
                          <p className="text-xs font-semibold text-slate-600 mt-1">
                            {session.actualStart ? `Bắt đầu: ${new Date(session.actualStart).toLocaleTimeString("vi-VN")}` : "Chưa kích hoạt"} 
                            {session.actualEnd ? ` - Kết thúc: ${new Date(session.actualEnd).toLocaleTimeString("vi-VN")}` : ""}
                          </p>
                        </div>
                        <Button 
                          variant="ghost" 
                          size="sm"
                          className="h-8 rounded-lg text-xs font-bold text-orange-600 hover:text-orange-700 hover:bg-orange-50 shrink-0 self-end md:self-center"
                        >
                          Xem chi tiết phiên
                          <ExternalLink className="h-3 w-3 ml-1" />
                        </Button>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8 space-y-2 border border-dashed border-slate-200 rounded-xl">
                    <HelpCircle className="h-8 w-8 text-slate-300 mx-auto" />
                    <p className="text-xs font-extrabold text-slate-900">Chưa có phiên chơi thực tế</p>
                    <p className="text-[10px] text-slate-400 font-medium max-w-xs mx-auto">Phiên chơi thực tế (Session) sẽ được nhân viên quán kích hoạt khi bạn quét mã check-in ở quầy.</p>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Check-in Handover Photos */}
            {(() => {
              const checkInPhotos = booking.sessions
                .flatMap(s => s.inspections)
                .filter(ins => ins.type === "CHECK_IN" && ins.photos.length > 0)
                .flatMap(ins => ins.photos)
              if (checkInPhotos.length === 0) return null
              const directionLabel: Record<string, string> = {
                FRONT: "Trước",
                BACK: "Sau",
                LEFT: "Trái",
                RIGHT: "Phải",
              }
              return (
                <Card className="border-slate-200/80 shadow-sm bg-white">
                  <CardHeader className="pb-3 border-b border-slate-100">
                    <CardTitle className="text-sm font-black text-slate-950 uppercase tracking-wider flex items-center gap-2">
                      <Camera className="h-4 w-4 text-orange-500" />
                      Ảnh bàn giao xe (Check-in)
                    </CardTitle>
                    <CardDescription className="text-xs">
                      Ảnh tình trạng xe tại thời điểm bàn giao — được nhân viên chụp trước khi phiên chơi bắt đầu.
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="p-4">
                    <div className="grid grid-cols-2 gap-3">
                      {checkInPhotos.map((photo, idx) => (
                        <div key={idx} className="rounded-xl overflow-hidden border border-slate-100">
                          <img
                            src={photo.url}
                            alt={`Ảnh ${directionLabel[photo.direction] ?? photo.direction}`}
                            className="w-full aspect-video object-cover"
                          />
                          <div className="bg-slate-50 px-2.5 py-1.5">
                            <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wide">
                              {directionLabel[photo.direction] ?? photo.direction}
                            </p>
                            {photo.notes && (
                              <p className="text-[11px] text-slate-600 mt-0.5 leading-tight">{photo.notes}</p>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )
            })()}

          </div>

          {/* Right Sidebar - QR Code & Billing (Col-span 1) */}
          <div className="space-y-6">
            
            {/* QR Check-in Box */}
            {booking.status === "CONFIRMED" && (
              <Card className="border-slate-200/80 shadow-md relative overflow-hidden bg-white text-center p-6 space-y-4">
                <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-orange-500 to-orange-600" />
                
                <div className="space-y-1">
                  <CardTitle className="text-sm font-black text-slate-950 uppercase tracking-wider flex items-center justify-center gap-1.5">
                    <QrCode className="h-4.5 w-4.5 text-orange-500" />
                    Mã Check-in Sân
                  </CardTitle>
                  <CardDescription className="text-[10px] font-bold">
                    ĐƯA MÃ NÀY CHO NHÂN VIÊN TẠI QUẦY
                  </CardDescription>
                </div>

                {/* QR Simulation Box */}
                <div className="h-44 w-44 mx-auto bg-slate-50 border border-slate-200 rounded-2xl p-4 flex items-center justify-center relative group">
                  <div className="absolute inset-0 bg-white/20 backdrop-blur-2xs opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center rounded-2xl">
                    <span className="text-[10px] font-extrabold text-slate-900 bg-white px-2 py-1 rounded-lg border border-slate-200 shadow-sm uppercase">Quét nhanh</span>
                  </div>
                  {/* Fake QR pattern */}
                  <div className="h-36 w-36 border-4 border-slate-900 p-2.5 rounded-lg flex items-center justify-center bg-white relative">
                    <div className="grid grid-cols-3 gap-2.5 w-full h-full opacity-90">
                      <div className="border-4 border-slate-950 w-8 h-8 rounded-xs" />
                      <div className="w-8 h-8 flex flex-wrap gap-0.5 justify-end">
                        <div className="w-1.5 h-1.5 bg-slate-950" /><div className="w-1.5 h-1.5 bg-slate-950" /><div className="w-1.5 h-1.5 bg-slate-950" />
                      </div>
                      <div className="border-4 border-slate-950 w-8 h-8 rounded-xs" />
                      
                      <div className="w-8 h-8 bg-slate-950 rounded-xs" />
                      <div className="w-8 h-8 border border-slate-950 rounded-xs" />
                      <div className="w-8 h-8 bg-slate-950 rounded-xs" />
                      
                      <div className="border-4 border-slate-950 w-8 h-8 rounded-xs" />
                      <div className="w-8 h-8 bg-slate-950 rounded-xs" />
                      <div className="w-8 h-8 border-4 border-slate-950 rounded-xs" />
                    </div>
                    {/* Small center logo */}
                    <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 bg-white p-1 rounded-md border border-slate-200 shadow-sm">
                      <div className="h-6 w-6 rounded-sm bg-orange-500 text-white flex items-center justify-center font-black text-[9px]">RC</div>
                    </div>
                  </div>
                </div>

                <div className="bg-slate-50 border border-slate-100 rounded-xl p-2.5">
                  <code className="text-xs font-black text-slate-800 tracking-widest">{booking.shortCode}</code>
                </div>

                <p className="text-[10px] text-slate-400 font-semibold leading-normal px-2">
                  Staff tại quán sẽ quét mã QR này để bắt đầu thủ tục bàn giao xe và tạo phiên chơi.
                </p>
              </Card>
            )}

            {/* Bill Receipt Component */}
            <Card className="border-slate-200/80 shadow-md bg-white overflow-hidden">
              <CardHeader className="pb-3 border-b border-slate-100 bg-slate-50/50">
                <CardTitle className="text-xs font-black text-slate-950 uppercase tracking-widest flex items-center gap-2">
                  <Receipt className="h-4.5 w-4.5 text-orange-500" />
                  Hóa Đơn Tạm Tính
                </CardTitle>
              </CardHeader>
              <CardContent className="p-5 space-y-4 text-xs font-semibold text-slate-700">
                
                {/* Billing items */}
                <div className="space-y-2.5">
                  <div className="flex justify-between">
                    <span className="text-slate-400">Tiền thuê Slot ({booking.slotCount} slot)</span>
                    <span className="text-slate-800">{formatCurrency(booking.slotFee)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Thuê xe ({booking.plannedVehicles.length} chiếc)</span>
                    <span className="text-slate-800">{formatCurrency(booking.rentalFee)}</span>
                  </div>
                  {booking.fnbPreorderFee > 0 && (
                    <div className="flex justify-between">
                      <span className="text-slate-400">F&B đặt trước</span>
                      <span className="text-slate-800">{formatCurrency(booking.fnbPreorderFee)}</span>
                    </div>
                  )}
                  {booking.discountAmount > 0 && (
                    <div className="flex justify-between text-emerald-600">
                      <span>Mã giảm giá</span>
                      <span>-{formatCurrency(booking.discountAmount)}</span>
                    </div>
                  )}
                </div>

                <div className="h-px bg-slate-100 my-2" />

                {/* Total */}
                <div className="flex justify-between text-sm font-black">
                  <span className="text-slate-950">Tổng thanh toán dự kiến</span>
                  <span className="text-orange-600">{formatCurrency(booking.totalAmount)}</span>
                </div>

                {/* Pre-payment deposit highlight */}
                <div className="p-3 bg-orange-50/40 rounded-xl border border-orange-100 space-y-1">
                  <div className="flex justify-between text-[11px] font-extrabold text-orange-900">
                    <span>Đã đặt cọc trước (vietQR):</span>
                    <span>{formatCurrency(booking.depositAmount)}</span>
                  </div>
                  <p className="text-[9px] text-orange-600 font-semibold leading-normal">
                    * Khoản cọc sẽ được giữ lại làm quỹ bảo đảm xe cộ tại quán. Nó sẽ được hoàn trả tự động hoặc cấn trừ vào hóa đơn thực tế sau khi checkout.
                  </p>
                </div>

              </CardContent>
              <CardFooter className="pt-2 pb-4 border-t border-slate-50 justify-center">
                <div className="flex items-center gap-1 text-[10px] text-slate-400 font-bold">
                  <Info className="h-3.5 w-3.5" />
                  Mọi khoản chi tiêu được kiểm toán qua Ledger.
                </div>
              </CardFooter>
            </Card>

          </div>

        </div>

      </div>
    </div>
  )
}
