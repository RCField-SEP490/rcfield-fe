import { useState } from "react"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import {
  AlertTriangle,
  Building2,
  CheckCircle2,
  Loader2,
  ShieldCheck,
} from "lucide-react"
import { toast } from "sonner"

import {
  bankPaymentApi,
  bankPaymentQueryKeys,
} from "@/features/payments/api/bank-payment.api"
import { Button } from "@/shared/ui/button"
import { Input } from "@/shared/ui/input"
import { cn } from "@/shared/lib/utils"

/**
 * Cấu hình tài khoản nhận tiền của một chi nhánh.
 *
 * Điểm quan trọng nhất của màn này không phải cái form, mà là **bước quét thử
 * mã QR mẫu**. Hệ thống không có cách nào biết số tài khoản chủ quán nhập vào
 * có thật là của họ hay không — gõ sai một chữ số là tiền của mọi khách chảy
 * vào tài khoản người lạ, và chỉ bị phát hiện khi có người khiếu nại.
 *
 * Vì thế cấu hình chưa xác minh thì chi nhánh vẫn dùng cổng thanh toán chung.
 */

export function CafePaymentSettingsCard({ cafeId }: { cafeId: string }) {
  const queryClient = useQueryClient()
  const [bankCode, setBankCode] = useState("")
  const [accountNumber, setAccountNumber] = useState("")
  const [accountName, setAccountName] = useState("")
  const [showSampleQr, setShowSampleQr] = useState(false)
  const [syncedKey, setSyncedKey] = useState<string | null>(null)

  const { data: settings, isLoading } = useQuery({
    queryKey: bankPaymentQueryKeys.settingsEdit(cafeId),
    queryFn: () => bankPaymentApi.getSettingsForEdit(cafeId),
    enabled: Boolean(cafeId),
  })

  // Bảng tra tĩnh phía backend, cả phiên chỉ cần tải một lần.
  const { data: banks = [], isLoading: loadingBanks } = useQuery({
    queryKey: bankPaymentQueryKeys.banks(),
    queryFn: bankPaymentApi.listBanks,
    staleTime: Infinity,
  })

  // Đồng bộ form với dữ liệu vừa tải về NGAY TRONG RENDER thay vì trong effect.
  // Đây là cách React khuyến nghị cho state suy ra từ props/dữ liệu: React sẽ
  // render lại ngay lập tức mà không vẽ ra màn hình lần thừa, còn làm trong
  // effect thì khách thấy form trống một nhịp rồi mới nhảy sang dữ liệu thật.
  const settingsKey = settings
    ? `${settings.bank_code ?? ""}|${settings.account_number ?? ""}|${settings.account_name ?? ""}`
    : null

  if (settingsKey !== null && settingsKey !== syncedKey) {
    setSyncedKey(settingsKey)
    setBankCode(settings?.bank_code ?? "")
    setAccountNumber(settings?.account_number ?? "")
    setAccountName(settings?.account_name ?? "")
  }

  const invalidate = () => {
    void queryClient.invalidateQueries({
      queryKey: bankPaymentQueryKeys.settingsEdit(cafeId),
    })
    void queryClient.invalidateQueries({
      queryKey: bankPaymentQueryKeys.methods(cafeId),
    })
  }

  const saveMutation = useMutation({
    mutationFn: () =>
      bankPaymentApi.updateSettings(cafeId, {
        method: "BANK_TRANSFER",
        bank_code: bankCode,
        account_number: accountNumber.trim(),
        account_name: accountName.trim().toUpperCase(),
      }),
    onSuccess: () => {
      invalidate()
      setShowSampleQr(false)
      toast.success("Đã lưu. Quét mã QR mẫu để xác nhận đúng tài khoản.")
    },
    onError: (err: { response?: { data?: { message?: string } } }) =>
      toast.error(err.response?.data?.message ?? "Không lưu được cấu hình"),
  })

  const disableMutation = useMutation({
    mutationFn: () => bankPaymentApi.updateSettings(cafeId, { method: "VNPAY" }),
    onSuccess: () => {
      invalidate()
      toast.success("Đã chuyển về cổng thanh toán chung")
    },
  })

  const { data: sampleQr, isFetching: loadingQr } = useQuery({
    queryKey: bankPaymentQueryKeys.sampleQr(cafeId),
    queryFn: () => bankPaymentApi.getSampleQr(cafeId),
    enabled: showSampleQr,
  })

  const verifyMutation = useMutation({
    mutationFn: () => bankPaymentApi.verifySettings(cafeId),
    onSuccess: () => {
      invalidate()
      setShowSampleQr(false)
      toast.success("Chi nhánh đã bật nhận chuyển khoản")
    },
    onError: (err: { response?: { data?: { message?: string } } }) =>
      toast.error(err.response?.data?.message ?? "Không xác minh được"),
  })

  if (isLoading) {
    return (
      <div className="rounded-xl border border-border bg-white p-6">
        <Loader2 className="size-5 animate-spin text-muted-foreground" />
      </div>
    )
  }

  const isBankTransfer = settings?.method === "BANK_TRANSFER"
  const isVerified = Boolean(settings?.is_verified)
  const canSave =
    bankCode !== "" && accountNumber.trim().length >= 4 && accountName.trim().length >= 2

  return (
    <div className="rounded-xl border border-border bg-white p-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h3 className="flex items-center gap-2 text-base font-black">
            <Building2 className="size-4 text-muted-foreground" />
            Nhận thanh toán
          </h3>
          <p className="mt-1 text-sm text-muted-foreground">
            Khách chuyển khoản thẳng vào tài khoản của bạn, đơn tự xác nhận khi
            tiền về.
          </p>
        </div>

        {isBankTransfer && (
          <span
            className={cn(
              "inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-bold",
              isVerified
                ? "bg-emerald-50 text-emerald-700"
                : "bg-amber-50 text-amber-800",
            )}
          >
            {isVerified ? (
              <>
                <ShieldCheck className="size-3.5" />
                Đang hoạt động
              </>
            ) : (
              <>
                <AlertTriangle className="size-3.5" />
                Chưa xác minh
              </>
            )}
          </span>
        )}
      </div>

      {!isVerified && (
        <p className="mt-4 rounded-lg bg-[#f6f4f4] px-3 py-2.5 text-sm text-[#5d5f5f]">
          Chưa xác minh thì chi nhánh vẫn nhận tiền qua cổng thanh toán chung như
          hiện tại. Không có gì gián đoạn.
        </p>
      )}

      <div className="mt-5 grid gap-4 sm:grid-cols-2">
        <label className="block">
          <span className="mb-1.5 block text-xs font-bold text-muted-foreground">
            Ngân hàng
          </span>
          <select
            value={bankCode}
            disabled={loadingBanks}
            onChange={(event) => setBankCode(event.target.value)}
            className="h-10 w-full rounded-lg border border-border bg-white px-3 text-sm font-semibold disabled:opacity-60"
          >
            <option value="">
              {loadingBanks ? "Đang tải danh sách…" : "Chọn ngân hàng"}
            </option>
            {banks.map((bank) => (
              <option key={bank.code} value={bank.code}>
                {bank.name}
              </option>
            ))}
          </select>
        </label>

        <label className="block">
          <span className="mb-1.5 block text-xs font-bold text-muted-foreground">
            Số tài khoản
          </span>
          <Input
            className="h-10"
            inputMode="numeric"
            value={accountNumber}
            placeholder="0123456789"
            onChange={(event) =>
              setAccountNumber(event.target.value.replace(/\D/g, ""))
            }
          />
        </label>

        <label className="block sm:col-span-2">
          <span className="mb-1.5 block text-xs font-bold text-muted-foreground">
            Tên chủ tài khoản
          </span>
          <Input
            className="h-10 uppercase"
            value={accountName}
            placeholder="NGUYEN VAN A"
            onChange={(event) => setAccountName(event.target.value)}
          />
          <span className="mt-1 block text-xs text-muted-foreground">
            Viết không dấu, đúng như trên sao kê ngân hàng.
          </span>
        </label>
      </div>

      <div className="mt-4 flex flex-wrap gap-2">
        <Button
          type="button"
          className="h-10"
          disabled={!canSave || saveMutation.isPending}
          onClick={() => saveMutation.mutate()}
        >
          {saveMutation.isPending && <Loader2 className="mr-1.5 size-4 animate-spin" />}
          Lưu tài khoản
        </Button>

        {isBankTransfer && (
          <>
            <Button
              type="button"
              variant="outline"
              className="h-10"
              onClick={() => setShowSampleQr((v) => !v)}
            >
              {showSampleQr ? "Ẩn mã QR mẫu" : "Xem mã QR mẫu"}
            </Button>
            <Button
              type="button"
              variant="ghost"
              className="h-10 text-muted-foreground"
              onClick={() => disableMutation.mutate()}
            >
              Dùng cổng chung
            </Button>
          </>
        )}
      </div>

      {showSampleQr && (
        /*
          Chỉ một đường kẻ ngăn phần kiểm tra với form phía trên, không đóng
          khung: thẻ thanh toán bên trong đã là một khung rồi, bọc thêm nữa
          thành ba lớp viền lồng nhau và mắt không biết bám vào đâu.
        */
        <div className="mt-6 border-t border-border pt-5">
          <h4 className="text-sm font-black">Kiểm tra trước khi bật</h4>
          <p className="mt-1 text-sm text-muted-foreground">
            Quét bằng <strong>app ngân hàng</strong> trên điện thoại — camera
            thường hay app quét QR bất kỳ chỉ hiện ra một dãy ký tự, vì đây là
            chuỗi VietQR thô mà chỉ app ngân hàng đọc được.
          </p>

          {loadingQr && (
            <Loader2 className="mt-4 size-5 animate-spin text-muted-foreground" />
          )}

          {sampleQr && (
            <>
              {/*
                Khối này cố tình trông như một thẻ thanh toán chứ không như một
                ô ảnh trong form: chủ quán sắp giao cho hệ thống quyền nhận tiền
                thật của khách, và cầm điện thoại lên soi từng chữ số là việc
                người ta chỉ chịu làm nghiêm túc khi thứ trước mặt trông nghiêm
                túc.

                Số tài khoản mới là con số lớn nhất ở đây, không phải số tiền —
                số tiền 10.000đ chỉ là mồi để mã QR hợp lệ, còn thứ duy nhất cần
                đối chiếu với app ngân hàng là số tài khoản.
              */}
              {/*
                Logo VietQR để trong `public/brand/` chứ không nhúng thẳng từ
                trang ngoài: đường dẫn của người ta đổi hay hỏng lúc nào không
                ai báo, và luồng thanh toán thì không được phụ thuộc một máy
                chủ mình không kiểm soát (D9).
              */}
              <div className="mx-auto mt-5 w-full max-w-[300px] rounded-xl border border-border bg-white p-5 text-center">
                <img
                  src="/brand/vietqr-logo.png"
                  alt="VietQR"
                  width={831}
                  height={311}
                  className="mx-auto h-9 w-auto"
                />

                {/*
                  Không đệm thêm quanh mã: ảnh QR đã mang sẵn vùng trắng 4
                  module theo chuẩn, đệm nữa thành hai lớp trắng chồng nhau và
                  mã trông bé lọt thỏm giữa một ô trống.
                */}
                <div className="relative mx-auto mt-3 w-fit">
                  <img
                    src={sampleQr.qr_image_data_url}
                    alt={`Mã QR chuyển khoản tới ${sampleQr.account_name}`}
                    className="block size-56"
                  />

                  {/*
                    Chữ V giữa mã, đúng cách VietQR vẫn trình bày. Ô này che
                    3,9% diện tích mã, trong khi mức sửa lỗi M đang dùng phục
                    hồi được tới 15% — nên không cần nâng mức sửa lỗi, mà nâng
                    còn phản tác dụng: mã sẽ dày lên và mỗi ô nhỏ đi, khó quét
                    hơn chứ không an toàn hơn.
                  */}
                  <span className="absolute left-1/2 top-1/2 flex size-11 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-lg bg-white">
                    <img
                      src="/brand/vietqr-mark.png"
                      alt=""
                      aria-hidden
                      width={223}
                      height={223}
                      className="size-7"
                    />
                  </span>
                </div>

                <dl className="mt-3 space-y-0.5 text-xs leading-relaxed text-[#5d5f5f]">
                  <div>
                    <dt className="inline">Tên chủ TK: </dt>
                    <dd className="inline font-bold text-[#1a1618]">
                      {sampleQr.account_name}
                    </dd>
                  </div>
                  <div>
                    <dt className="inline">Số TK: </dt>
                    <dd className="inline font-bold tabular-nums text-[#1a1618]">
                      {sampleQr.account_number}
                    </dd>
                  </div>
                  <div>
                    <dt className="inline">Ngân hàng: </dt>
                    <dd className="inline">{sampleQr.bank_name}</dd>
                  </div>
                </dl>

                <p className="mt-3 border-t border-border pt-3 text-xs text-muted-foreground">
                  {sampleQr.amount.toLocaleString("vi-VN")}đ · {sampleQr.memo}
                </p>
              </div>

              <p className="mt-3 text-xs text-muted-foreground">
                Ngân hàng và số tài khoản phải trùng khít. Tên chủ tài khoản thì
                app lấy từ hồ sơ ngân hàng nên có thể khác cách viết — miễn đúng
                là bạn. Ra tên người lạ thì đừng bấm xác nhận.
              </p>

              <p className="mt-4 rounded-lg bg-amber-50 px-3 py-2.5 text-sm text-amber-900">
                Đây là mã ngân hàng thật. Bạn có thể quét thử mà không cần chuyển
                tiền — chỉ cần xem tên người nhận hiện ra.
              </p>

              <Button
                type="button"
                className="mt-4 h-10 w-full gap-2"
                disabled={verifyMutation.isPending}
                onClick={() => verifyMutation.mutate()}
              >
                {verifyMutation.isPending ? (
                  <Loader2 className="size-4 animate-spin" />
                ) : (
                  <CheckCircle2 className="size-4" />
                )}
                Tôi đã quét và xác nhận đúng tài khoản
              </Button>
            </>
          )}
        </div>
      )}
    </div>
  )
}
