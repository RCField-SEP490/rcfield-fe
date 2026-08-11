import { useNavigate, useParams } from "react-router"
import { useQuery } from "@tanstack/react-query"
import { AlertTriangle, Loader2 } from "lucide-react"
import { toast } from "sonner"

import { bookingApi } from "@/features/booking/api/booking.api"
import { Button } from "@/shared/ui/button"
import { BankTransferQrPanel } from "./components/checkout/BankTransferQrPanel"

/**
 * Trang chờ chuyển khoản, đánh địa chỉ theo `bookingId`.
 *
 * Tồn tại vì `payment_url` phải dẫn tới một trang có thật: khách tải lại trang,
 * mở lại link trong lịch sử, hay bấm thanh toán lần hai đều phải ra đúng mã QR
 * của đơn mình — không phải trang 404.
 *
 * Lấy dữ liệu bằng cách gọi lại checkout: backend trả về đúng giao dịch đang
 * chờ nếu còn hiệu lực, nên gọi nhiều lần không sinh thêm mã tham chiếu mới.
 */
export function BankTransferPaymentPage() {
  const { bookingId } = useParams<{ bookingId: string }>()
  const navigate = useNavigate()

  const { data, isLoading, isError } = useQuery({
    queryKey: ["bank-transfer-checkout", bookingId],
    queryFn: () => bookingApi.createCheckout(bookingId!, "bank_transfer"),
    enabled: Boolean(bookingId),
    retry: false,
    // Mã QR gắn với một giao dịch cụ thể; tự tải lại sẽ tạo nhầm phiên mới.
    refetchOnWindowFocus: false,
    staleTime: Infinity,
  })

  if (isLoading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <Loader2 className="size-6 animate-spin text-muted-foreground" />
      </div>
    )
  }

  if (isError || !data?.bank_transfer) {
    return (
      <div className="mx-auto max-w-md px-4 py-16 text-center">
        <AlertTriangle className="mx-auto size-12 text-[#adaaaa]" />
        <h1 className="mt-4 text-xl font-black">Không mở được trang thanh toán</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Đơn này có thể đã thanh toán xong, đã huỷ, hoặc hết thời gian giữ chỗ.
        </p>
        <Button className="mt-5" onClick={() => void navigate("/customer/bookings")}>
          Xem đơn của tôi
        </Button>
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-lg px-4 py-10">
      <h1 className="mb-1 text-2xl font-black">Chuyển khoản để hoàn tất</h1>
      <p className="mb-6 text-sm text-muted-foreground">
        Quét mã bằng ứng dụng ngân hàng. Màn hình này tự cập nhật khi quán nhận
        được tiền — bạn không cần bấm gì thêm.
      </p>

      <BankTransferQrPanel
        bookingId={bookingId!}
        checkout={data.bank_transfer}
        onPaid={() => toast.success("Đã nhận được thanh toán!")}
        onContinue={() => void navigate("/customer/bookings")}
      />
    </div>
  )
}
