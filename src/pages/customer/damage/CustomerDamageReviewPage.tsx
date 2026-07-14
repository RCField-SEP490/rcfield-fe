import { useState, useEffect } from "react"
import { useParams, useNavigate } from "react-router"
import { 
  mockCustomerBookingDetails, 
  type MockSessionDetail,
  type MockDamageClaim 
} from "@/shared/data/customer-operational-mock-data"
import { 
  AlertTriangle, 
  Check, 
  ArrowLeft, 
  ShieldCheck, 
  Eye, 
  FileText,
  DollarSign,
  Clock,
  XCircle
} from "lucide-react"
import { Button } from "@/shared/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/shared/ui/card"
import { Badge } from "@/shared/ui/badge"
import { toast } from "sonner"

export function CustomerDamageReviewPage() {
  const { sessionId } = useParams<{ sessionId: string }>()
  const navigate = useNavigate()

  const [session, setSession] = useState<MockSessionDetail | null>(null)
  const [claim, setClaim] = useState<MockDamageClaim | null>(null)
  const [hoursLeft, setHoursLeft] = useState<number>(24)
  const [disputeMode, setDisputeMode] = useState<boolean>(false)
  const [disputeText, setDisputeText] = useState<string>("")
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false)
  const [showLightbox, setShowLightbox] = useState<string | null>(null)

  useEffect(() => {
    let foundSession: MockSessionDetail | null = null
    for (const b of mockCustomerBookingDetails) {
      const s = b.sessions.find(item => item.sessionId === sessionId)
      if (s) {
        foundSession = s
        break
      }
    }

    if (foundSession && foundSession.damageClaim) {
      const expiry = new Date(foundSession.damageClaim.expiresAt).getTime()
      const remaining = Math.max(0, Math.floor((expiry - Date.now()) / (1000 * 60 * 60)))
      queueMicrotask(() => {
        setSession(foundSession)
        setClaim(foundSession.damageClaim ?? null)
        setHoursLeft(remaining)
      })
    }
  }, [sessionId])

  if (!session || !claim) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-6">
        <Card className="max-w-md w-full text-center p-8 space-y-4">
          <ShieldCheck className="h-12 w-12 text-emerald-500 mx-auto" />
          <h2 className="text-xl font-bold text-slate-900">Không tìm thấy yêu cầu bồi thường</h2>
          <p className="text-sm text-slate-500">Phiên {sessionId} hoạt động an toàn hoàn mỹ, không phát sinh bất kỳ yêu cầu bồi thường thiệt hại nào.</p>
          <Button onClick={() => navigate("/customer/bookings")} className="w-full bg-slate-900 text-white rounded-xl">
            Quay lại Lịch đặt sân
          </Button>
        </Card>
      </div>
    )
  }

  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND" }).format(val)
  }

  // Handle actions
  const handleAccept = () => {
    setIsSubmitting(true)
    setTimeout(() => {
      setIsSubmitting(false)
      toast.success("Đã đồng ý bồi thường thiệt hại!", {
        description: "Hệ thống Ledger đã ghi nhận. Khoản bồi thường sẽ được thanh toán trực tiếp tại quầy check-out."
      })
      navigate("/customer/bookings")
    }, 1200)
  }

  const handleDispute = () => {
    if (!disputeText.trim()) {
      toast.error("Vui lòng ghi rõ lý do khiếu nại.")
      return
    }
    setIsSubmitting(true)
    setTimeout(() => {
      setIsSubmitting(false)
      toast.warning("Yêu cầu khiếu nại đã được gửi lên hệ thống Admin!", {
        description: "Admin sẽ xem xét bằng chứng ảnh đối chiếu và điều tra vụ việc. Trạng thái bồi thường tạm thời đóng băng."
      })
      setDisputeMode(false)
      navigate("/customer/bookings")
    }, 1200)
  }

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 p-4 md:p-8 font-sans relative overflow-x-hidden">
      
      {/* Decorative Glows */}
      <div className="absolute top-0 right-0 w-[500px] h-[500px] rounded-full bg-rose-500/5 blur-[120px] pointer-events-none" />

      <div className="max-w-4xl mx-auto space-y-6 relative z-10">
        
        {/* Top bar */}
        <div className="flex items-center justify-between">
          <button
            onClick={() => navigate(`/customer/sessions/${session.sessionId}`)}
            className="inline-flex items-center gap-2 text-xs font-extrabold text-slate-500 hover:text-slate-900 transition-colors bg-white px-3.5 py-2 rounded-xl border border-slate-200 shadow-sm"
          >
            <ArrowLeft className="h-4 w-4 text-orange-500" />
            Quay lại Live Session
          </button>

          <span className="text-xs font-bold text-slate-400">
            Yêu cầu bồi thường: <strong className="text-slate-800">{claim.claimId}</strong>
          </span>
        </div>

        {/* Header Alert Header */}
        <div className="bg-white border border-rose-200 rounded-2xl p-6 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="flex flex-wrap items-center gap-2.5">
              <Badge className="px-2.5 py-1 text-xs font-bold border-none uppercase tracking-wide bg-rose-100 text-rose-800">
                PHÁT HIỆN SỰ CỐ XE HƯ HẠI
              </Badge>
              <Badge className="bg-amber-100 text-amber-800 border-none font-bold text-xs uppercase tracking-wide">
                Đang chờ duyệt
              </Badge>
            </div>
            <h1 className="text-2xl font-black text-slate-950 tracking-tight">
              Đối Chiếu Ảnh Nhận & Trả Xe
            </h1>
            <p className="text-xs text-slate-500 font-semibold">Vui lòng đối chiếu bằng chứng ảnh thực tế chụp ở góc hư hại dưới đây.</p>
          </div>

          {/* Auto confirm countdown */}
          <div className="flex items-center gap-3 bg-amber-50 border border-amber-100 px-4 py-2.5 rounded-xl self-end md:self-auto shrink-0">
            <Clock className="h-5 w-5 text-amber-600 animate-pulse shrink-0" />
            <div>
              <p className="text-[9px] font-black text-amber-500 uppercase tracking-wider leading-none">TỰ ĐỘNG XÁC NHẬN SAU</p>
              <p className="text-base font-black text-amber-700 mt-1 leading-none">~{hoursLeft} tiếng nữa</p>
            </div>
          </div>
        </div>

        {/* Side-by-Side Photographic Evidence Compare (Awesome feature!) */}
        <Card className="border-slate-200/80 shadow-md bg-white overflow-hidden">
          <CardHeader className="pb-3 border-b border-slate-100 bg-slate-50/50">
            <CardTitle className="text-xs font-black text-slate-950 uppercase tracking-widest flex items-center gap-2">
              <Eye className="h-4.5 w-4.5 text-orange-500" />
              ĐỐI CHIẾU ẢNH THỰC TẾ TRƯỚC VÀ SAU KHI CHƠI (GÓC TRƯỚC/BÊN TRÁI)
            </CardTitle>
          </CardHeader>
          <CardContent className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              
              {/* Check-in photo (Before) */}
              <div className="space-y-2">
                <span className="inline-flex items-center gap-1 text-[11px] font-black text-emerald-600 uppercase tracking-widest">
                  <Check className="h-3.5 w-3.5" />
                  Ảnh Nhận Xe (Trước khi chơi)
                </span>
                <div className="aspect-video w-full bg-slate-950 rounded-xl overflow-hidden relative group border border-slate-200 shadow-2xs">
                  <img src={claim.checkInPhoto} alt="Check-in" className="w-full h-full object-cover" />
                  <button 
                    onClick={() => setShowLightbox(claim.checkInPhoto)}
                    className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white text-xs font-bold gap-1.5"
                  >
                    <Eye className="h-4 w-4" /> Phóng to ảnh nhận
                  </button>
                </div>
                <p className="text-[10px] text-slate-400 font-semibold italic text-center">Xe nguyên vẹn, không có trầy xước phát sinh ở bánh trước bên trái.</p>
              </div>

              {/* Check-out photo (After) */}
              <div className="space-y-2">
                <span className="inline-flex items-center gap-1 text-[11px] font-black text-rose-600 uppercase tracking-widest">
                  <AlertTriangle className="h-3.5 w-3.5" />
                  Ảnh Trả Xe (Phát hiện hư hại)
                </span>
                <div className="aspect-video w-full bg-slate-950 rounded-xl overflow-hidden relative group border-2 border-rose-300 shadow-2xs">
                  <img src={claim.checkOutPhoto} alt="Check-out" className="w-full h-full object-cover" />
                  <button 
                    onClick={() => setShowLightbox(claim.checkOutPhoto)}
                    className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white text-xs font-bold gap-1.5"
                  >
                    <Eye className="h-4 w-4" /> Phóng to ảnh trả
                  </button>
                </div>
                <p className="text-[10px] text-rose-500 font-semibold italic text-center">Vết đâm trực diện, mẻ nứt vành lốp nhựa trước bên trái.</p>
              </div>

            </div>
          </CardContent>
        </Card>

        {/* Claim Details Breakdown Split */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-start">
          
          {/* Claim info (Col-span 2) */}
          <Card className="md:col-span-2 border-slate-200/80 shadow-sm bg-white">
            <CardHeader className="pb-3 border-b border-slate-100">
              <CardTitle className="text-xs font-black text-slate-950 uppercase tracking-widest flex items-center gap-2">
                <FileText className="h-4.5 w-4.5 text-orange-500" />
                Mô tả chi tiết và Biên bản Staff
              </CardTitle>
            </CardHeader>
            <CardContent className="p-5 space-y-4">
              
              <div className="p-4 bg-rose-50/50 border border-rose-100 rounded-2xl space-y-1.5 text-xs text-rose-950">
                <span className="font-extrabold uppercase text-[10px] text-rose-600 block">Thiệt hại mô tả</span>
                <p className="font-black text-sm">{claim.description}</p>
              </div>

              {session.inspections.find(i => i.type === "CHECK_OUT")?.staffNotes && (
                <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl space-y-1.5 text-xs text-slate-700 font-semibold">
                  <span className="block text-[9px] text-slate-400 font-black uppercase">Ghi chú vận hành của Staff</span>
                  <p className="text-slate-900 leading-relaxed italic">
                    "{session.inspections.find(i => i.type === "CHECK_OUT")?.staffNotes}"
                  </p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Money Breakdown Receipt (Col-span 1) */}
          <div className="space-y-6">
            <Card className="border-slate-200/80 shadow-md bg-white overflow-hidden">
              <CardHeader className="pb-3 border-b border-slate-100 bg-slate-50/50">
                <CardTitle className="text-xs font-black text-slate-950 uppercase tracking-widest flex items-center gap-1.5">
                  <DollarSign className="h-4.5 w-4.5 text-orange-500" />
                  Định Giá Bồi Thường
                </CardTitle>
              </CardHeader>
              <CardContent className="p-5 space-y-4 text-xs font-semibold text-slate-700">
                
                <div className="space-y-2.5">
                  <div className="flex justify-between">
                    <span className="text-slate-400">Chi phí sửa chữa/thay thế</span>
                    <span className="text-slate-800">{formatCurrency(claim.estimatedCost)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Hệ số nhân phân khúc xe</span>
                    <span className="text-slate-800">x{claim.damageMultiplier}</span>
                  </div>
                </div>

                <div className="h-px bg-slate-200 my-2" />

                <div className="flex justify-between font-black text-sm text-slate-950">
                  <span>Tổng tiền bồi thường phạt</span>
                  <span className="text-rose-600">{formatCurrency(claim.finalCharge)}</span>
                </div>

                <div className="p-3 bg-rose-50/30 rounded-xl border border-rose-100 space-y-1 text-[9px] text-rose-800 leading-normal font-bold">
                  * Số tiền bồi thường phạt này sẽ được ghi nhận vào hóa đơn dịch vụ và thanh toán trực tiếp tại quầy check-out.
                </div>

              </CardContent>
            </Card>

            {/* Decision panel */}
            {!disputeMode ? (
              <div className="space-y-3.5">
                <Button
                  onClick={handleAccept}
                  disabled={isSubmitting}
                  className="w-full bg-slate-950 hover:bg-slate-900 text-white font-extrabold text-xs h-12 rounded-xl shadow-md cursor-pointer transition-all flex items-center justify-center gap-1.5"
                >
                  <Check className="h-4.5 w-4.5 text-orange-400 stroke-[3]" />
                  Tôi đồng ý thanh toán bồi thường
                </Button>

                <Button
                  variant="outline"
                  onClick={() => setDisputeMode(true)}
                  className="w-full border-red-200 hover:bg-red-50 text-red-600 font-extrabold text-xs h-12 rounded-xl cursor-pointer transition-all flex items-center justify-center gap-1.5"
                >
                  <XCircle className="h-4.5 w-4.5" />
                  Yêu cầu khiếu nại (Dispute)
                </Button>
              </div>
            ) : (
              <Card className="border-red-200 shadow-md bg-white p-5 space-y-4">
                <div className="space-y-1">
                  <h4 className="text-xs font-black text-red-600 uppercase tracking-widest flex items-center gap-1">
                    <AlertTriangle className="h-4 w-4" />
                    Khiếu nại lên Ban Quản Trị (Admin)
                  </h4>
                  <p className="text-[10px] font-semibold text-slate-400 leading-normal">
                    Yêu cầu sẽ được chuyển đến Admin để phân giải. Vui lòng mô tả rõ lý do bạn khiếu nại vết hư hại này.
                  </p>
                </div>

                <textarea
                  value={disputeText}
                  onChange={(e) => setDisputeText(e.target.value)}
                  placeholder="Tôi khiếu nại vết mẻ vành bánh xe vì..."
                  className="w-full min-h-[90px] p-3 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-red-400 font-medium"
                />

                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    className="flex-1 border-slate-200 text-xs rounded-xl h-10 font-bold"
                    onClick={() => setDisputeMode(false)}
                  >
                    Hủy bỏ
                  </Button>
                  <Button
                    className="flex-1 bg-red-600 hover:bg-red-700 text-white text-xs rounded-xl h-10 font-bold"
                    onClick={handleDispute}
                    disabled={isSubmitting}
                  >
                    {isSubmitting ? "Đang gửi..." : "Gửi khiếu nại"}
                  </Button>
                </div>
              </Card>
            )}

          </div>

        </div>

      </div>

      {/* LIGHTBOX EVIDENCE VIEW */}
      {showLightbox && (
        <div className="fixed inset-0 bg-black/95 backdrop-blur-md z-50 flex items-center justify-center p-4">
          <button 
            onClick={() => setShowLightbox(null)}
            className="absolute top-6 right-6 text-white/70 hover:text-white font-extrabold text-sm bg-white/10 px-3 py-1.5 rounded-xl border border-white/20"
          >
            Đóng [ESC]
          </button>
          
          <div className="max-w-4xl w-full h-[80vh] flex items-center justify-center">
            <img src={showLightbox} alt="" className="max-h-full max-w-full object-contain" />
          </div>
        </div>
      )}

    </div>
  )
}
