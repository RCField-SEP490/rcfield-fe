import { useNavigate, useParams, useSearchParams } from "react-router"
import { useQuery, useQueryClient } from "@tanstack/react-query"
import { AlertTriangle, Loader2 } from "lucide-react"
import { toast } from "sonner"

import {
  bookingApi,
  bookingQueryKeys,
} from "@/features/booking/api/booking.api"
import { routePaths } from "@/app/router/route-paths"
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
  const queryClient = useQueryClient()

  // `?mode=settlement` là khoản phát sinh cuối phiên (gia hạn, đồ ăn tại quầy,
  // hư hỏng) — endpoint khác, mã tham chiếu khác. Không có tham số thì vẫn là
  // tiền đặt lịch ban đầu, đúng như trước.
  const [searchParams] = useSearchParams()
  const isSettlement = searchParams.get("mode") === "settlement"

  const { data, isLoading, isError } = useQuery({
    queryKey: ["bank-transfer-checkout", bookingId, isSettlement],
    queryFn: async () => {
      const result = isSettlement
        ? await bookingApi.createCheckoutAdditionalPayment(
            bookingId!,
            "bank_transfer",
          )
        : await bookingApi.createCheckout(bookingId!, "bank_transfer")
      // Ném lỗi thay vì trả về phản hồi thiếu mã QR.
      //
      // `staleTime: Infinity` bên dưới sẽ giữ mãi thứ gì trả về được — nên nếu
      // coi phản hồi hụt này là dữ liệu hợp lệ, khách kẹt ở màn "Không mở được
      // trang thanh toán" suốt phiên, kể cả khi phía sau đã sẵn sàng trả mã.
      // Là lỗi thì React Query tự gọi lại lúc vào trang lần sau.
      if (!result.bank_transfer) {
        throw new Error("Phản hồi thanh toán không kèm mã QR chuyển khoản")
      }
      return result
    },
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
        <h1 className="mt-4 text-xl font-black">
          Không mở được trang thanh toán
        </h1>
        <p className="mt-2 text-sm text-muted-foreground">
          {isSettlement
            ? "Khoản phát sinh này có thể đã được thanh toán, hoặc chi nhánh chưa bật nhận chuyển khoản."
            : "Đơn này có thể đã thanh toán xong, đã huỷ, hoặc hết thời gian giữ chỗ."}
        </p>
        <Button
          className="mt-5"
          onClick={() => void navigate("/customer/bookings")}
        >
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
        subject={{ kind: "booking", bookingId: bookingId! }}
        checkout={data.bank_transfer}
        onPaid={() => {
          toast.success("Đã nhận được thanh toán!")
          // Làm mới ngay khi tiền về, trong lúc màn thành công còn đếm ngược
          // 10 giây. Không làm thì lúc sang trang chi tiết còn một nhịp hiện
          // bản cache cũ ghi "chờ thanh toán" — đúng thứ khách vừa làm xong.
          void queryClient.invalidateQueries({
            queryKey: bookingQueryKeys.detail(bookingId),
          })
        }}
        onContinue={() =>
          // Về thẳng đơn vừa trả tiền chứ không về danh sách: khách vừa chuyển
          // tiền xong, thứ họ muốn xem là đơn đó.
          void navigate(
            routePaths.customerBookingDetail.replace(":bookingId", bookingId!),
            // Thay vì đẩy thêm một mục vào lịch sử: bấm quay lại từ trang chi
            // tiết mà rơi về màn mã QR của một đơn đã trả xong là vô nghĩa.
            { replace: true },
          )
        }
      />
    </div>
  )
}
