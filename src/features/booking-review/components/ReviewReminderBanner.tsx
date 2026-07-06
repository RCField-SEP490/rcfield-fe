import { useState } from "react"
import { createPortal } from "react-dom"
import { Star, X, MapPin, Clock } from "lucide-react"
import { ReviewFormModal } from "./ReviewFormModal"
import { useDismissReview } from "../hooks/useDismissReview"
import { usePendingReviews } from "../hooks/usePendingReviews"

export function ReviewReminderBanner() {
  const { data: pending } = usePendingReviews()
  const [dismissed, setDismissed] = useState(false)
  const [showForm, setShowForm] = useState(false)
  const dismiss = useDismissReview()

  const booking = pending?.[0]
  if (!booking || dismissed) return null

  const handleDismiss = () => {
    setDismissed(true)
    dismiss.mutate(booking.bookingId)
  }

  const slotDate = new Date(booking.slotStart)
  const slotEnd = new Date(booking.slotEnd)

  return createPortal(
    <>
      {/* Backdrop — ẩn khi form đang mở */}
      {!showForm && <div
        className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/60 p-4"
        onClick={handleDismiss}
      >
        {/* Card */}
        <div
          className="relative w-full max-w-sm overflow-hidden rounded-3xl bg-white shadow-2xl"
          onClick={(e) => e.stopPropagation()}
          style={{ animation: "popIn 0.25s cubic-bezier(0.34,1.56,0.64,1) both" }}
        >
          {/* ── Gradient header ── */}
          <div className="relative bg-gradient-to-br from-amber-400 via-orange-400 to-orange-500 px-6 pb-8 pt-6 text-center">
            {/* Close */}
            <button
              onClick={handleDismiss}
              className="absolute right-3 top-3 flex h-7 w-7 items-center justify-center rounded-full bg-white/20 text-white hover:bg-white/30"
              aria-label="Đóng"
            >
              <X className="h-3.5 w-3.5" />
            </button>

            {/* Floating star icon */}
            <div className="relative mx-auto mb-3 flex h-20 w-20 items-center justify-center">
              <div className="absolute inset-0 rounded-full bg-white/20" />
              <div className="absolute inset-2 rounded-full bg-white/20" />
              <div className="relative flex h-12 w-12 items-center justify-center rounded-full bg-white shadow-lg">
                <Star className="h-6 w-6 fill-amber-400 text-amber-400" />
              </div>
            </div>

            <h3 className="text-lg font-extrabold text-white drop-shadow-sm">
              Buổi chơi của bạn đã hoàn thành!
            </h3>
            <p className="mt-1 text-sm text-white/85">
              Chia sẻ cảm nhận để giúp cộng đồng RC
            </p>

            {/* 5 stars preview */}
            <div className="mt-3 flex justify-center gap-1.5">
              {[1, 2, 3, 4, 5].map((i) => (
                <Star key={i} className="h-5 w-5 fill-white/70 text-white/70 drop-shadow-sm" />
              ))}
            </div>

            {/* Decorative wave bottom */}
            <div className="absolute -bottom-px left-0 right-0">
              <svg viewBox="0 0 400 24" className="w-full fill-white" preserveAspectRatio="none">
                <path d="M0,24 C100,0 300,0 400,24 L400,24 L0,24 Z" />
              </svg>
            </div>
          </div>

          {/* ── Body ── */}
          <div className="px-6 pb-6 pt-4">
            {/* Cafe info card */}
            <div className="mb-4 rounded-2xl bg-slate-50 px-4 py-3">
              <div className="flex items-center gap-2 mb-1">
                <MapPin className="h-3.5 w-3.5 shrink-0 text-orange-400" />
                <p className="text-sm font-bold text-slate-800">{booking.cafeName}</p>
              </div>
              <div className="flex items-center gap-2">
                <Clock className="h-3.5 w-3.5 shrink-0 text-slate-400" />
                <p className="text-xs text-slate-500">
                  {slotDate.toLocaleDateString("vi-VN", {
                    weekday: "long",
                    day: "numeric",
                    month: "numeric",
                  })}
                  {" · "}
                  {slotDate.toLocaleTimeString("vi-VN", { hour: "2-digit", minute: "2-digit" })}
                  {" – "}
                  {slotEnd.toLocaleTimeString("vi-VN", { hour: "2-digit", minute: "2-digit" })}
                </p>
              </div>
            </div>

            {/* CTA */}
            <button
              onClick={() => setShowForm(true)}
              className="w-full rounded-2xl bg-gradient-to-r from-amber-400 to-orange-500 py-3.5 text-sm font-extrabold text-white shadow-lg shadow-orange-200 transition-all hover:from-amber-500 hover:to-orange-600 hover:shadow-orange-300 active:scale-[0.98]"
            >
              ⭐ Đánh giá ngay
            </button>

            <button
              onClick={handleDismiss}
              className="mt-3 w-full text-center text-xs font-medium text-slate-400 hover:text-slate-600"
            >
              Để sau
            </button>
          </div>
        </div>
      </div>}

      <style>{`
        @keyframes popIn {
          from { opacity: 0; transform: scale(0.85) translateY(20px); }
          to   { opacity: 1; transform: scale(1) translateY(0); }
        }
      `}</style>

      {showForm && (
        <ReviewFormModal
          booking={booking}
          onClose={() => {
            setShowForm(false)
            setDismissed(true)
          }}
        />
      )}
    </>,
    document.body,
  )
}
