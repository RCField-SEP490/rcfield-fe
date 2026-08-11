import { useCallback, useEffect, useMemo, useRef, useState } from "react"
import { useQuery } from "@tanstack/react-query"
import { CheckCircle2, Clock, Copy, Loader2, TimerOff } from "lucide-react"
import { toast } from "sonner"

import { bookingApi } from "@/features/booking/api/booking.api"
import type { BankTransferCheckout } from "@/features/booking/types/booking.types"
import { useWebSocket } from "@/features/notifications/hooks/useWebSocket"
import { Button } from "@/shared/ui/button"
import { cn } from "@/shared/lib/utils"

/**
 * Màn chờ chuyển khoản.
 *
 * Khách quét mã bằng điện thoại, còn màn hình này ở trên máy khác — nên nó phải
 * tự biết khi nào tiền về. Hai đường song song:
 *
 * 1. WebSocket, thường về trong ~1 giây.
 * 2. Hỏi lại mỗi 5 giây, làm lưới an toàn. Mất kết nối một lần lúc demo là hỏng
 *    cả buổi, và một truy vấn nhỏ mỗi 5 giây rẻ hơn nhiều so với rủi ro đó.
 *
 * Đúng ba trạng thái: đang chờ, thành công, hết hạn. Không có trạng thái trung
 * gian cho việc chuyển thiếu — mã QR đã mang sẵn số tiền nên khách không tự gõ.
 */

type Phase = "waiting" | "paid" | "expired"

function formatVnd(value: number) {
  return `${value.toLocaleString("vi-VN")}đ`
}

function useCountdown(expiresAt: string): number {
  const target = useMemo(() => new Date(expiresAt).getTime(), [expiresAt])
  const [remaining, setRemaining] = useState(() =>
    Math.max(0, Math.floor((target - Date.now()) / 1000)),
  )

  useEffect(() => {
    const id = setInterval(() => {
      setRemaining(Math.max(0, Math.floor((target - Date.now()) / 1000)))
    }, 1000)
    return () => clearInterval(id)
  }, [target])

  return remaining
}

/** Số giây để khách kịp đọc màn hình thành công trước khi chuyển trang. */
const REDIRECT_SECONDS = 10

export function BankTransferQrPanel({
  bookingId,
  checkout,
  onPaid,
  onContinue,
  onExpired,
}: {
  bookingId: string
  checkout: BankTransferCheckout
  /** Chạy đúng một lần ngay khi phát hiện tiền về. */
  onPaid: () => void
  /** Chạy khi hết đếm ngược, hoặc khi khách bấm đi ngay. */
  onContinue?: () => void
  onExpired?: () => void
}) {
  // Chỉ giữ đúng một mẩu state: "realtime đã báo tiền về chưa". Hết hạn và
  // "đã trả theo dữ liệu hỏi lại" đều suy ra được, nên không cần state riêng —
  // và suy ra thì không bao giờ lệch nhau.
  const [paidByRealtime, setPaidByRealtime] = useState(false)
  const remaining = useCountdown(checkout.expires_at)

  // Đường 1 — realtime.
  useWebSocket(
    useCallback(
      (msg) => {
        const data = msg.data as { bookingId?: string; booking_id?: string } | null
        const id = data?.bookingId ?? data?.booking_id
        if (id !== bookingId) return
        if (msg.event === "BOOKING_UPDATED" || msg.event === "BOOKING_PAID") {
          setPaidByRealtime(true)
        }
      },
      [bookingId],
    ),
    !paidByRealtime,
  )

  // Đường 2 — lưới an toàn khi realtime rớt.
  const { data: booking } = useQuery({
    queryKey: ["booking-payment-poll", bookingId],
    queryFn: () => bookingApi.getBooking(bookingId),
    enabled: !paidByRealtime && remaining > 0,
    refetchInterval: 5000,
    refetchIntervalInBackground: true,
  })

  const paidByPolling = Boolean(booking?.status && booking.status !== "PENDING")
  const paid = paidByRealtime || paidByPolling

  const phase: Phase = paid ? "paid" : remaining <= 0 ? "expired" : "waiting"

  // Báo ra ngoài đúng một lần cho mỗi trạng thái cuối.
  const notified = useRef<Phase | null>(null)
  useEffect(() => {
    if (phase === "waiting" || notified.current === phase) return
    notified.current = phase
    if (phase === "paid") onPaid()
    else onExpired?.()
  }, [phase, onPaid, onExpired])

  if (phase === "paid") {
    return <PaidPanel onContinue={onContinue} />
  }

  if (phase === "expired") {
    return (
      <div className="rounded-2xl border border-[#e5e2e1] bg-[#fcf8f8] p-8 text-center">
        <TimerOff className="mx-auto size-12 text-[#adaaaa]" />
        <h3 className="mt-4 text-lg font-black text-[#1c1b1b]">Hết thời gian giữ chỗ</h3>
        <p className="mt-1.5 text-sm text-[#747878]">
          Mã này không còn hiệu lực. Nếu bạn đã chuyển tiền, liên hệ quán để được
          hỗ trợ — tiền vẫn được ghi nhận trong sổ đối soát.
        </p>
      </div>
    )
  }

  const minutes = Math.floor(remaining / 60)
  const seconds = remaining % 60
  const urgent = remaining <= 120

  return (
    <div className="rounded-2xl border border-[#e5e2e1] bg-white p-6">
      {checkout.is_sandbox && (
        <div className="mb-4 rounded-lg bg-amber-50 px-3 py-2.5 text-sm text-amber-900">
          <span className="font-bold">Giao dịch mô phỏng.</span> Không có tiền
          thật nào được chuyển.
        </div>
      )}

      <div className="flex flex-col items-center">
        <img
          src={checkout.qr_image_data_url}
          alt="Mã QR chuyển khoản"
          className="size-64 rounded-xl border border-[#f1eeee]"
        />

        <p className="mt-4 text-3xl font-black text-[#1c1b1b]">
          {formatVnd(checkout.amount)}
        </p>

        <div
          className={cn(
            "mt-2 inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-sm font-bold",
            urgent ? "bg-red-50 text-red-700" : "bg-[#f6f4f4] text-[#5d5f5f]",
          )}
        >
          <Clock className="size-3.5" />
          Còn {minutes}:{String(seconds).padStart(2, "0")}
        </div>
      </div>

      <dl className="mt-5 space-y-2.5 border-t border-[#f1eeee] pt-4 text-sm">
        <Row label="Ngân hàng" value={checkout.bank_name} />
        <Row label="Chủ tài khoản" value={checkout.account_name} />
        <Row label="Số tài khoản" value={checkout.account_number} copyable />
        <Row label="Nội dung" value={checkout.ref_code} copyable highlight />
      </dl>

      <p className="mt-4 flex items-center justify-center gap-2 text-sm text-[#747878]">
        <Loader2 className="size-4 animate-spin" />
        Đang chờ quán nhận tiền — màn hình sẽ tự cập nhật
      </p>

      <p className="mt-2 text-center text-xs text-[#adaaaa]">
        Giữ đúng nội dung chuyển khoản để hệ thống nhận ra đơn của bạn.
      </p>
    </div>
  )
}

function Row({
  label,
  value,
  copyable,
  highlight,
}: {
  label: string
  value: string
  copyable?: boolean
  highlight?: boolean
}) {
  return (
    <div className="flex items-center justify-between gap-3">
      <dt className="text-[#747878]">{label}</dt>
      <dd className="flex items-center gap-1.5">
        <span
          className={cn(
            "font-bold text-[#1c1b1b]",
            highlight && "rounded bg-orange-50 px-2 py-0.5 text-orange-700",
          )}
        >
          {value}
        </span>
        {copyable && (
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="size-7 p-0"
            onClick={() => {
              void navigator.clipboard.writeText(value)
              toast.success("Đã sao chép")
            }}
          >
            <Copy className="size-3.5" />
          </Button>
        )}
      </dd>
    </div>
  )
}

/**
 * Màn thành công, tự chuyển trang sau vài giây.
 *
 * Chuyển ngay lập tức thì khách chưa kịp đọc gì đã thấy trang khác — với một
 * giao dịch vừa trừ tiền thật, khoảnh khắc xác nhận rõ ràng đáng giá hơn vài
 * giây tiết kiệm được. Vẫn để nút đi ngay cho người không muốn chờ.
 */
function PaidPanel({ onContinue }: { onContinue?: () => void }) {
  const [remaining, setRemaining] = useState(REDIRECT_SECONDS)

  useEffect(() => {
    const id = setInterval(() => {
      setRemaining((current) => (current <= 0 ? 0 : current - 1))
    }, 1000)
    return () => clearInterval(id)
  }, [])

  const done = remaining <= 0
  useEffect(() => {
    if (done) onContinue?.()
  }, [done, onContinue])

  return (
    <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-8 text-center">
      <CheckCircle2 className="mx-auto size-14 text-emerald-600" />
      <h3 className="mt-4 text-xl font-black text-emerald-900">Đã thanh toán</h3>
      <p className="mt-1.5 text-sm text-emerald-800">
        Quán đã nhận được tiền. Đơn của bạn được xác nhận.
      </p>

      {onContinue && (
        <>
          <p
            className="mt-5 text-sm text-emerald-800"
            aria-live="polite"
            aria-atomic="true"
          >
            Chuyển sang đơn của bạn sau{" "}
            <span className="font-black tabular-nums">{remaining}</span> giây
          </p>

          <Button
            type="button"
            className="mt-3 h-10 bg-emerald-600 hover:bg-emerald-700"
            onClick={onContinue}
          >
            Xem đơn của tôi ngay
          </Button>
        </>
      )}
    </div>
  )
}
