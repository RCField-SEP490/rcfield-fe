import { useForm, type Resolver } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import * as z from "zod"
import { useMutation, useQueryClient } from "@tanstack/react-query"
import { toast } from "sonner"
import { CreditCard } from "lucide-react"

import { Button } from "@/shared/ui/button"
import { Input } from "@/shared/ui/input"
import { Label } from "@/shared/ui/label"
import { subscriptionApi } from "../api/subscription.api"

const PLANS = [
  { id: "__starter__", name: "STARTER", label: "Starter — 299,000₫/tháng", price: 299000 },
  { id: "__growth__", name: "GROWTH", label: "Growth — 699,000₫/tháng", price: 699000 },
  { id: "__pro__", name: "PRO", label: "Pro — 1,499,000₫/tháng", price: 1499000 },
]

const schema = z.object({
  plan_id: z.string().min(1, "Chọn gói"),
  transfer_reference: z.string().min(1, "Nhập nội dung chuyển khoản"),
  transfer_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Định dạng YYYY-MM-DD"),
  transfer_amount: z.coerce.number().positive("Số tiền phải lớn hơn 0"),
})

type FormValues = z.infer<typeof schema>

interface Props {
  hasPendingRequest: boolean
  onSuccess?: () => void
}

export function PaymentRequestForm({ hasPendingRequest, onSuccess }: Props) {
  const qc = useQueryClient()
  const { register, handleSubmit, reset, formState: { errors } } = useForm<FormValues>({
    resolver: zodResolver(schema) as Resolver<FormValues>,
  })

  const mutation = useMutation({
    mutationFn: (data: FormValues) =>
      subscriptionApi.submitPaymentRequest({
        plan_id: data.plan_id,
        transfer_reference: data.transfer_reference,
        transfer_date: data.transfer_date,
        transfer_amount: data.transfer_amount,
      }),
    onSuccess: () => {
      toast.success("Đã gửi yêu cầu thanh toán. Admin sẽ xác nhận trong vòng 1-2 ngày làm việc.")
      reset()
      qc.invalidateQueries({ queryKey: ["my-payment-requests"] })
      onSuccess?.()
    },
    onError: (err: unknown) => {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message
      toast.error(msg ?? "Gửi yêu cầu thất bại")
    },
  })

  if (hasPendingRequest) {
    return (
      <div className="rounded-xl border border-yellow-100 bg-yellow-50 px-5 py-4 text-sm text-yellow-800 font-semibold">
        ⏳ Bạn đang có yêu cầu thanh toán chờ xử lý. Vui lòng đợi Admin xác nhận trước khi gửi yêu cầu mới.
      </div>
    )
  }

  return (
    <div className="rounded-xl border border-slate-200 bg-white p-5 space-y-4">
      <div className="flex items-center gap-2">
        <CreditCard className="size-4 text-slate-500" />
        <h3 className="text-sm font-bold text-slate-700">Gửi yêu cầu nâng cấp</h3>
      </div>
      <p className="text-xs text-slate-500">
        Chuyển khoản đến tài khoản RCField, sau đó điền thông tin dưới đây để Admin xác nhận.
      </p>

      <form onSubmit={handleSubmit((d) => mutation.mutate(d))} className="space-y-4">
        <div className="space-y-1.5">
          <Label className="text-xs font-bold">Gói đăng ký</Label>
          <select
            {...register("plan_id")}
            className="w-full h-9 rounded-lg border border-slate-200 px-3 text-sm bg-white"
          >
            <option value="">-- Chọn gói --</option>
            {PLANS.map((p) => <option key={p.name} value={p.name}>{p.label}</option>)}
          </select>
          {errors.plan_id && <p className="text-[11px] text-red-500 font-bold">{errors.plan_id.message}</p>}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <Label className="text-xs font-bold">Nội dung chuyển khoản</Label>
            <Input {...register("transfer_reference")} placeholder="VD: RCFIELD UPGRADE PRO" className="h-9 rounded-lg" />
            {errors.transfer_reference && <p className="text-[11px] text-red-500 font-bold">{errors.transfer_reference.message}</p>}
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs font-bold">Ngày chuyển khoản</Label>
            <Input type="date" {...register("transfer_date")} className="h-9 rounded-lg" />
            {errors.transfer_date && <p className="text-[11px] text-red-500 font-bold">{errors.transfer_date.message}</p>}
          </div>
        </div>

        <div className="space-y-1.5">
          <Label className="text-xs font-bold">Số tiền đã chuyển (VNĐ)</Label>
          <Input type="number" {...register("transfer_amount")} placeholder="299000" className="h-9 rounded-lg" />
          {errors.transfer_amount && <p className="text-[11px] text-red-500 font-bold">{errors.transfer_amount.message}</p>}
        </div>

        <Button type="submit" disabled={mutation.isPending} className="w-full h-10 font-bold">
          {mutation.isPending ? "Đang gửi..." : "Gửi yêu cầu thanh toán"}
        </Button>
      </form>
    </div>
  )
}
