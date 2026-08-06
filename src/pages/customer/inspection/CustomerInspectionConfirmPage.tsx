import { useState, useEffect, useCallback } from "react"
import { useParams, useNavigate, useSearchParams } from "react-router"
import { useQueryClient } from "@tanstack/react-query"
import { type MockSessionDetail, type MockInspection } from "@/shared/data/customer-operational-mock-data"
import { customerSessionApi } from "@/features/customer-session/api/customer-session.api"
import { bookingQueryKeys } from "@/features/booking/api/booking.api"
import { 
  CheckCircle2, 
  AlertTriangle, 
  XCircle, 
  Clock, 
  Maximize2,
  ChevronLeft,
  ChevronRight,
  Minus,
  Plus,
  Bookmark,
  ShieldCheck,
  Check
} from "lucide-react"
import { Button } from "@/shared/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/shared/ui/card"
import { toast } from "sonner"

export function CustomerInspectionConfirmPage() {
  const { sessionId } = useParams<{ sessionId: string }>()
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const [searchParams] = useSearchParams()
  const targetInspectionId = searchParams.get("inspectionId")

  const [session, setSession] = useState<MockSessionDetail | null>(null)
  const [inspection, setInspection] = useState<MockInspection | null>(null)
  const [isLoading, setIsLoading] = useState<boolean>(true)
  const [loadError, setLoadError] = useState<string>("")
  
  // Timer countdown: 15 minutes checking in
  const [timeLeft, setTimeLeft] = useState<number>(15 * 60)
  const [activePhotoIdx, setActivePhotoIdx] = useState<number>(0)
  const [showLightbox, setShowLightbox] = useState<boolean>(false)
  const [lightboxZoom, setLightboxZoom] = useState<number>(1)
  const [disagreeMode, setDisagreeMode] = useState<boolean>(false)
  const [disagreeText, setDisagreeText] = useState<string>("")
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false)

  const loadSession = useCallback(async (silent = false) => {
    if (!sessionId) {
      setIsLoading(false)
      return
    }
    if (!silent) setIsLoading(true)
    setLoadError("")
    try {
      const detail = await customerSessionApi.getSessionDetail(sessionId)
      const pendingInspection =
        detail.inspections.find((item) => item.inspectionId === targetInspectionId) ??
        detail.inspections.find((item) => !item.customerConfirmed && item.type === "CHECK_OUT") ??
        detail.inspections.find((item) => !item.customerConfirmed && item.type === "CHECK_IN") ??
        detail.inspections[detail.inspections.length - 1] ??
        null

      setSession(detail)
      setInspection(pendingInspection)
      setActivePhotoIdx(0)
    } catch (err) {
      const message =
        err && typeof err === "object" && "response" in err
          ? (err as { response?: { data?: { message?: string } } }).response?.data?.message
          : undefined
      setLoadError(message ?? "Không thể tải biên bản kiểm xe.")
      setSession(null)
      setInspection(null)
    } finally {
      if (!silent) setIsLoading(false)
    }
  }, [sessionId, targetInspectionId])

  useEffect(() => {
    queueMicrotask(() => {
      void loadSession()
    })
  }, [loadSession])

  useEffect(() => {
    const handleRefresh = () => {
      void loadSession(true)
    }
    window.addEventListener("refresh-session-detail", handleRefresh)
    return () => window.removeEventListener("refresh-session-detail", handleRefresh)
  }, [loadSession])

  // Countdown clock simulation
  useEffect(() => {
    const timer = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) {
          clearInterval(timer)
          return 0
        }
        return prev - 1
      })
    }, 1000)
    return () => clearInterval(timer)
  }, [])

  // Check-in is an informational handover record, not a separate blocking
  // customer flow. Old notifications can still target this route, so route
  // them into the handover section of the booking once the session is active.
  useEffect(() => {
    if (
      session &&
      inspection?.type === "CHECK_IN" &&
      ["ACTIVE", "EXTENDING"].includes(session.status)
    ) {
      navigate(`/customer/bookings/${session.bookingId}?section=handover`, { replace: true })
    }
  }, [inspection?.type, navigate, session])

  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-6">
        <Card className="max-w-md w-full text-center p-8 space-y-4">
          <Clock className="h-12 w-12 text-orange-500 mx-auto animate-pulse" />
          <h2 className="text-xl font-bold text-slate-900">Đang tải biên bản kiểm xe</h2>
          <p className="text-sm text-slate-500">Hệ thống đang lấy dữ liệu mới nhất từ quầy staff.</p>
        </Card>
      </div>
    )
  }

  if (!session || !inspection) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-6">
        <Card className="max-w-md w-full text-center p-8 space-y-4">
          <AlertTriangle className="h-12 w-12 text-red-500 mx-auto" />
          <h2 className="text-xl font-bold text-slate-900">Không tìm thấy phiên bàn giao xe</h2>
          <p className="text-sm text-slate-500">{loadError || `Mã phiên ${sessionId} không tồn tại hoặc thủ tục bàn giao xe chưa được staff khởi tạo.`}</p>
          <Button onClick={() => navigate("/customer/bookings")} className="w-full bg-slate-900 text-white rounded-xl">
            Quay lại Lịch đặt sân
          </Button>
        </Card>
      </div>
    )
  }

  // Format time helper
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`
  }

  const isCheckoutInspection = inspection.type === "CHECK_OUT"
  const isHandoverReview = !isCheckoutInspection && ["ACTIVE", "EXTENDING"].includes(session.status)

  // Approve vehicle handler
  const handleApprove = async () => {
    setIsSubmitting(true)
    try {
      await customerSessionApi.confirmInspection(session.sessionId, inspection.inspectionId, { agreed: true })
      toast.success(isCheckoutInspection ? "Xác nhận trả xe thành công!" : "Đã ghi nhận bạn đã xem biên bản!", {
        description: isCheckoutInspection
          ? "Phiên chơi đã được đóng sau khi đối chiếu biên bản."
          : "Phiên chơi đang diễn ra. Cảm ơn bạn đã cùng đối chiếu tình trạng xe."
      })
      await queryClient.invalidateQueries({ queryKey: bookingQueryKeys.detail(session.bookingId) })
      navigate(`/customer/bookings/${session.bookingId}`)
    } catch (err) {
      const message =
        err && typeof err === "object" && "response" in err
          ? (err as { response?: { data?: { message?: string } } }).response?.data?.message
          : undefined
      toast.error(message ?? "Không thể gửi xác nhận biên bản.")
    } finally {
      setIsSubmitting(false)
    }
  }

  // Reject / Disagree handler
  const handleDisagree = async () => {
    if (!disagreeText.trim()) {
      toast.error("Vui lòng nhập lý do từ chối bàn giao xe.")
      return
    }
    setIsSubmitting(true)
    try {
      await customerSessionApi.confirmInspection(session.sessionId, inspection.inspectionId, {
        agreed: false,
        disagreementNote: disagreeText.trim(),
      })
      toast.warning("Đã gửi phản hồi sai lệch cho nhân viên quầy!", {
        description: "Staff phụ trách sẽ kiểm tra lại xe và liên hệ trực tiếp với bạn ngay."
      })
      setDisagreeMode(false)
      navigate(`/customer/bookings`)
    } catch (err) {
      const message =
        err && typeof err === "object" && "response" in err
          ? (err as { response?: { data?: { message?: string } } }).response?.data?.message
          : undefined
      toast.error(message ?? "Không thể gửi phản hồi sai lệch.")
    } finally {
      setIsSubmitting(false)
    }
  }

  const activePhoto = inspection.photos[activePhotoIdx]

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 p-4 md:p-8 font-sans relative">
      <div className="max-w-4xl mx-auto space-y-6">
        
        {/* Progress Bar & Header */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-white border border-slate-200 p-5 rounded-2xl shadow-xs">
          <div className="space-y-1">
            <span className="text-[10px] font-black text-orange-500 uppercase tracking-widest flex items-center gap-1">
              <ShieldCheck className="h-4 w-4 shrink-0" />
              {isCheckoutInspection ? "Xác nhận trả xe" : "Biên bản bàn giao xe"}
            </span>
            <h1 className="text-xl font-black text-slate-950">
              {isCheckoutInspection ? "Kiểm Tra Tình Trạng Trả Xe" : "Xem Tình Trạng Xe Đã Nhận"}
            </h1>
            <p className="text-xs text-slate-500 font-semibold">Phiên chơi: <strong className="text-slate-800">{session.sessionId}</strong> • Nhân viên bàn giao: <strong className="text-slate-800">{session.staffName}</strong></p>
          </div>

          {isCheckoutInspection ? (
            <div className="flex items-center gap-3 bg-rose-50 border border-rose-100 px-4 py-2.5 rounded-xl self-end md:self-auto">
              <Clock className="h-5 w-5 text-rose-500 animate-pulse shrink-0" />
              <div>
                <p className="text-[9px] font-black text-rose-400 uppercase tracking-wider leading-none">Hết hạn sau</p>
                <p className="text-base font-black text-rose-600 mt-1 leading-none">{formatTime(timeLeft)}</p>
              </div>
            </div>
          ) : (
            <div className="flex items-center gap-2 bg-emerald-50 border border-emerald-100 px-4 py-2.5 rounded-xl self-end md:self-auto">
              <CheckCircle2 className="h-5 w-5 text-emerald-600 shrink-0" />
              <p className="text-xs font-extrabold text-emerald-700">
                {isHandoverReview ? "Phiên chơi đang diễn ra" : "Đang hoàn tất bàn giao"}
              </p>
            </div>
          )}
        </div>

        {/* Dynamic Stepper Info */}
        <div className="bg-orange-500/5 border border-orange-200/50 p-4 rounded-xl text-xs font-semibold text-orange-950 flex gap-2">
          <AlertTriangle className="h-5 w-5 text-orange-500 shrink-0 mt-0.5" />
          <p className="leading-relaxed">
            <strong>Lưu ý:</strong> Vui lòng xem kỹ các góc ảnh chụp thực tế dưới đây. Nếu thấy sai lệch, hãy báo ngay để staff kiểm tra trực tiếp với bạn.
          </p>
        </div>

        {/* Main Content Split: Carousel Left, Details Right */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          
          {/* Carousel Left Column */}
          <div className="space-y-3.5">
            <Card className="border-slate-200/80 shadow-sm overflow-hidden bg-white relative">
              <div className="aspect-video w-full bg-slate-950 relative flex items-center justify-center group overflow-hidden">
                {activePhoto?.url ? (
                  <img 
                    src={activePhoto.url} 
                    alt={`Góc ${activePhoto.direction}`} 
                    className="max-h-full max-w-full object-contain transform transition-transform duration-500 group-hover:scale-105"
                  />
                ) : (
                  <div className="text-xs font-bold text-white/60">Chưa có ảnh kiểm xe</div>
                )}
                
                {/* Image Overlay Corner */}
                <div className="absolute top-3 left-3 bg-black/60 backdrop-blur-md px-3 py-1.5 rounded-lg border border-white/10 text-white text-[10px] font-black tracking-widest uppercase">
                  GÓC: {activePhoto?.direction ?? "N/A"}
                </div>

                <button 
                  onClick={() => {
                    setLightboxZoom(1)
                    setShowLightbox(true)
                  }}
                  className="absolute bottom-3 right-3 h-9 w-9 rounded-xl bg-black/60 backdrop-blur-md border border-white/10 flex items-center justify-center text-white cursor-pointer hover:bg-black/80 transition-colors"
                >
                  <Maximize2 className="h-4.5 w-4.5" />
                </button>
              </div>

              {/* Notes for active photo */}
              <div className="p-4 bg-slate-50 border-t border-slate-100 text-xs font-medium text-slate-700">
                <span className="block text-[9px] text-slate-400 font-black uppercase">Ghi chú ảnh của Staff</span>
                <p className="text-slate-900 mt-1">{activePhoto?.notes || "Không có ghi chú hư hại nào."}</p>
              </div>

              {/* Navigation controls overlay inside card footer */}
              <CardFooter className="p-3 border-t border-slate-100 bg-white flex justify-between gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  className="h-8 rounded-lg text-xs"
                  onClick={() => setActivePhotoIdx(prev => prev === 0 ? inspection.photos.length - 1 : prev - 1)}
                  disabled={inspection.photos.length === 0}
                >
                  <ChevronLeft className="h-4 w-4 mr-0.5" />
                  Góc trước
                </Button>
                
                <span className="text-[11px] font-extrabold text-slate-400 self-center">
                  Góc {inspection.photos.length === 0 ? 0 : activePhotoIdx + 1} / {inspection.photos.length}
                </span>

                <Button
                  variant="outline"
                  size="sm"
                  className="h-8 rounded-lg text-xs"
                  onClick={() => setActivePhotoIdx(prev => prev === inspection.photos.length - 1 ? 0 : prev + 1)}
                  disabled={inspection.photos.length === 0}
                >
                  Góc sau
                  <ChevronRight className="h-4 w-4 ml-0.5" />
                </Button>
              </CardFooter>
            </Card>

            {/* Micro Thumbnail Grid */}
            <div className="grid grid-cols-4 gap-2">
              {inspection.photos.map((photo, idx) => (
                <button
                  key={idx}
                  onClick={() => setActivePhotoIdx(idx)}
                  className={`aspect-video rounded-lg overflow-hidden border-2 transition-all relative ${activePhotoIdx === idx ? 'border-orange-500 shadow-sm shadow-orange-500/10 scale-102' : 'border-slate-200 opacity-60 hover:opacity-100'}`}
                >
                  <img src={photo.url} alt="" className="w-full h-full object-cover" />
                  <div className="absolute inset-0 bg-black/20 flex items-center justify-center text-[9px] font-black text-white uppercase">
                    {photo.direction[0]}
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Details & Checklist Right Column */}
          <div className="space-y-6">
            
            {/* Checklist Card */}
            <Card className="border-slate-200/80 shadow-sm bg-white">
              <CardHeader className="pb-3 border-b border-slate-100">
                <CardTitle className="text-xs font-black text-slate-950 uppercase tracking-widest flex items-center gap-1.5">
                  <Bookmark className="h-4.5 w-4.5 text-orange-500" />
                  Checklist An Toàn Thiết Bị
                </CardTitle>
                <CardDescription className="text-xs">
                  Nhân viên đã kiểm thử thực tế và tick chọn.
                </CardDescription>
              </CardHeader>
              <CardContent className="p-5 space-y-4">
                <div className="space-y-2.5">
                  {inspection.checklist.map((item) => (
                    <div key={item.id} className="flex items-start gap-3 p-2.5 bg-slate-50/50 rounded-xl border border-slate-100">
                      <div className="h-5 w-5 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0 mt-0.5 border border-emerald-100">
                        <Check className="h-3 w-3 stroke-[3]" />
                      </div>
                      <div>
                        <p className="text-xs font-extrabold text-slate-800">{item.label}</p>
                        {item.notes && <p className="text-[10px] text-slate-400 font-semibold mt-0.5">{item.notes}</p>}
                      </div>
                    </div>
                  ))}
                </div>

                {inspection.staffNotes && (
                  <div className="p-3 bg-slate-50 border border-slate-100 rounded-xl space-y-1">
                    <span className="block text-[9px] text-slate-400 font-black uppercase">Mô tả tổng quát từ nhân viên</span>
                    <p className="text-xs font-semibold text-slate-700 leading-relaxed">{inspection.staffNotes}</p>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Decision Area */}
            {!disagreeMode ? (
              <div className="space-y-3">
                <Button
                  onClick={handleApprove}
                  disabled={isSubmitting}
                  className="w-full bg-slate-950 hover:bg-slate-900 text-white font-extrabold text-xs h-12 rounded-xl shadow-md cursor-pointer transition-all flex items-center justify-center gap-1.5"
                >
                  <CheckCircle2 className="h-4 w-4 text-orange-400" />
                  {isCheckoutInspection ? "Tôi đồng ý biên bản trả xe & Hoàn tất phiên" : "Tôi đã xem biên bản bàn giao"}
                </Button>

                <Button
                  variant="outline"
                  onClick={() => setDisagreeMode(true)}
                  className="w-full border-red-200 hover:bg-red-50 text-red-600 font-extrabold text-xs h-12 rounded-xl cursor-pointer transition-all flex items-center justify-center gap-1.5"
                >
                  <XCircle className="h-4 w-4" />
                  {isCheckoutInspection ? "Tôi phát hiện sai lệch / Từ chối trả xe" : "Báo sai lệch bàn giao xe"}
                </Button>
              </div>
            ) : (
              <Card className="border-red-200/80 shadow-md bg-white p-5 space-y-4">
                <div className="space-y-1">
                  <h4 className="text-xs font-black text-red-600 uppercase tracking-widest flex items-center gap-1">
                    <AlertTriangle className="h-4 w-4" />
                    Báo cáo sai lệch xe
                  </h4>
                  <p className="text-[10px] font-semibold text-slate-400 leading-normal">
                    Hãy ghi rõ điểm khác biệt bạn thấy trên thực tế (ví dụ: cản trước có vết xước sâu mà ảnh chụp không rõ) để Staff ghi nhận.
                  </p>
                </div>

                <textarea
                  value={disagreeText}
                  onChange={(e) => setDisagreeText(e.target.value)}
                  placeholder="Ghi rõ chi tiết lỗi bạn phát hiện..."
                  className="w-full min-h-[90px] p-3 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-red-400 font-medium"
                />

                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    className="flex-1 border-slate-200 text-xs rounded-xl h-10 font-bold"
                    onClick={() => setDisagreeMode(false)}
                  >
                    Hủy bỏ
                  </Button>
                  <Button
                    className="flex-1 bg-red-600 hover:bg-red-700 text-white text-xs rounded-xl h-10 font-bold"
                    onClick={handleDisagree}
                    disabled={isSubmitting}
                  >
                    {isSubmitting ? "Đang gửi..." : "Gửi báo cáo"}
                  </Button>
                </div>
              </Card>
            )}

          </div>

        </div>

      </div>

      {/* LIGHTBOX MODAL */}
      {showLightbox && (
        <div className="fixed inset-0 bg-black/95 backdrop-blur-md z-50 flex items-center justify-center p-4">
          <button 
            onClick={() => setShowLightbox(false)}
            className="absolute top-6 right-6 text-white/70 hover:text-white font-extrabold text-sm bg-white/10 px-3 py-1.5 rounded-xl border border-white/20"
          >
            Đóng [ESC]
          </button>
          
          <div className="max-w-4xl w-full h-[80vh] flex items-center justify-center relative overflow-auto">
            {activePhoto?.url ? (
              <img
                src={activePhoto.url}
                alt={`Ảnh kiểm xe ${activePhoto.direction}`}
                style={{ transform: `scale(${lightboxZoom})`, transition: "transform 150ms ease" }}
                className="max-h-full max-w-full object-contain"
              />
            ) : (
              <div className="text-sm font-bold text-white/70">Chưa có ảnh kiểm xe</div>
            )}
            
            {/* Info overlay */}
            <div className="absolute bottom-4 left-4 right-4 bg-black/60 border border-white/10 backdrop-blur-md p-4 rounded-xl text-white space-y-1 text-center">
              <span className="text-[10px] font-black text-orange-400 tracking-wider uppercase">GÓC CHỤP: {activePhoto?.direction ?? "N/A"}</span>
              <p className="text-xs font-semibold text-white/90">{activePhoto?.notes || "Ảnh chất lượng cao kiểm tra chi tiết thiết bị."}</p>
            </div>
            <div className="absolute top-4 left-4 flex items-center gap-2 rounded-xl border border-white/20 bg-black/60 p-1.5 text-white">
              <button
                type="button"
                aria-label="Thu nhỏ ảnh"
                disabled={lightboxZoom <= 1}
                onClick={() => setLightboxZoom((value) => Math.max(1, value - 0.5))}
                className="rounded-lg p-2 disabled:opacity-40 hover:bg-white/10"
              >
                <Minus className="size-4" />
              </button>
              <span className="min-w-10 text-center text-xs font-bold">{Math.round(lightboxZoom * 100)}%</span>
              <button
                type="button"
                aria-label="Phóng to ảnh"
                disabled={lightboxZoom >= 3}
                onClick={() => setLightboxZoom((value) => Math.min(3, value + 0.5))}
                className="rounded-lg p-2 disabled:opacity-40 hover:bg-white/10"
              >
                <Plus className="size-4" />
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  )
}
