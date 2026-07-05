import { useCallback } from "react"
import { useNavigate } from "react-router"
import { toast } from "sonner"
import { useQueryClient } from "@tanstack/react-query"
import { useWebSocket, type WsMessage } from "@/features/notifications/hooks/useWebSocket"

type SessionNotificationData = {
  sessionId?: string
  inspectionId?: string
  proposalId?: string
  extraMinutes?: number
  additionalFee?: number
}

export function useSessionNotifications(enabled = true): void {
  const navigate = useNavigate()
  const qc = useQueryClient()

  const handleMessage = useCallback(
    (msg: WsMessage) => {
      const data = msg.data as (SessionNotificationData & { bookingId?: string }) | undefined
      const sessionId = data?.sessionId
      const bookingId = data?.bookingId
      if (!sessionId && !bookingId) return

      // Invalidate notifications and bookings queries immediately
      void qc.invalidateQueries({ queryKey: ["notifications"] })
      void qc.invalidateQueries({ queryKey: ["bookings"] })

      // Dispatch global event for active pages to refetch
      window.dispatchEvent(new CustomEvent("refresh-session-detail"))

      if (msg.event === "SESSION_CHECKOUT_INSPECTION") {
        const params = data?.inspectionId ? `?inspectionId=${encodeURIComponent(data.inspectionId)}` : ""
        toast.info("Staff vừa gửi biên bản trả xe", {
          description: "Vui lòng kiểm tra ảnh, checklist và xác nhận.",
        })
        navigate(`/customer/inspections/${sessionId}${params}`)
        return
      }

      if (msg.event === "SESSION_EXTENSION_PROPOSED") {
        toast.info("Staff vừa gửi đề xuất gia hạn", {
          description: data?.extraMinutes ? `Gia hạn thêm ${data.extraMinutes} phút đang chờ phản hồi.` : undefined,
        })
        navigate(`/customer/extension-response/${sessionId}`)
        return
      }

      if (msg.event === "SESSION_FNB_ORDER_ADDED") {
        toast.info("Dịch vụ ăn uống được thêm", {
          description: "Nhân viên vừa thêm món mới vào phiên chơi của bạn.",
        })
        return
      }

      if (msg.event === "CUSTOMER_PAYMENT_CONFIRMED") {
        toast.success("Thanh toán thành công!", {
          description: "Phí phát sinh tại quầy đã được xác nhận thanh toán thành công.",
        })
        return
      }
    },
    [navigate, qc],
  )

  useWebSocket(handleMessage, enabled)
}
