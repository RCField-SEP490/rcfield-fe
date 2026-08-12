import { useEffect, useMemo } from "react"
import { useForm, useWatch, type Resolver } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import * as z from "zod"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { toast } from "sonner"
import { CreditCard, Loader2 } from "lucide-react"

import { Button } from "@/shared/ui/button"
import { Label } from "@/shared/ui/label"
import { subscriptionApi } from "../api/subscription.api"

const schema = z.object({
  plan_id: z.string().min(1, "Chọn gói"),
})

type FormValues = z.infer<typeof schema>

interface Props {
  hasPendingRequest: boolean
  onSuccess?: () => void
  selectedPlanId?: string
  onSelectedPlanChange?: (planId: string) => void
}

function formatVnd(value?: number) {
  if (value === undefined || Number.isNaN(value)) return "0 đ"
  return `${value.toLocaleString("vi-VN")} đ`
}

export function PaymentRequestForm({ hasPendingRequest, onSuccess, selectedPlanId, onSelectedPlanChange }: Props) {
  const qc = useQueryClient()
  const { data: plans = [] } = useQuery({
    queryKey: ["subscription-plans"],
    queryFn: () => subscriptionApi.listSubscriptionPlans(),
  })

  const {
    register,
    handleSubmit,
    control,
    setValue,
    formState: { errors },
  } = useForm<FormValues>({
    resolver: zodResolver(schema) as Resolver<FormValues>,
    defaultValues: {
      plan_id: selectedPlanId ?? "",
    },
  })

  const watchedPlanId = useWatch({ control, name: "plan_id" })
  const activePlanId = selectedPlanId || watchedPlanId
  const selectedPlan = useMemo(
    () => plans.find((plan) => plan.id === activePlanId),
    [activePlanId, plans],
  )

  useEffect(() => {
    if (!selectedPlanId) return
    setValue("plan_id", selectedPlanId, { shouldValidate: true })
  }, [selectedPlanId, setValue])

  const mutation = useMutation({
    mutationFn: (data: FormValues) =>
      subscriptionApi.getPayOSLink({
        plan_id: data.plan_id,
      }),
    onSuccess: (res) => {
      if (res.data?.checkoutUrl) {
        toast.success("Tạo link thanh toán thành công! Đang chuyển hướng sang PayOS...")
        window.location.href = res.data.checkoutUrl
      } else {
        toast.error("Không nhận được liên kết thanh toán từ máy chủ")
      }
      qc.invalidateQueries({ queryKey: ["my-payment-requests"] })
      onSuccess?.()
    },
    onError: (err: unknown) => {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message
      toast.error(msg ?? "Gửi yêu cầu thanh toán thất bại")
    },
  })

  if (hasPendingRequest) {
    return (
      <div className="rounded-xl border border-yellow-100 bg-yellow-50 px-5 py-4 text-sm font-semibold text-yellow-800">
        Bạn đang có yêu cầu thanh toán chờ xử lý. Vui lòng hoàn tất thanh toán hoặc đợi hệ thống xử lý trước khi gửi yêu cầu mới.
      </div>
    )
  }

  return (
    <div className="space-y-4 rounded-xl border border-slate-200 bg-white p-5">
      <div className="flex items-center gap-2">
        <CreditCard className="size-4 text-slate-500" />
        <h3 className="text-sm font-bold text-slate-700">Thanh toán đăng ký gói hội viên</h3>
      </div>
      <p className="text-xs text-slate-500">
        Chọn gói ở phía trên và nhấn nút bên dưới để tiến hành thanh toán an toàn qua cổng PayOS.
      </p>

      <form onSubmit={handleSubmit((data) => mutation.mutate(data))} className="space-y-4">
        <div className="space-y-1.5">
          <Label className="text-xs font-bold">Gói đăng ký</Label>
          <select
            {...register("plan_id")}
            value={activePlanId}
            onChange={(event) => {
              setValue("plan_id", event.target.value, { shouldValidate: true })
              onSelectedPlanChange?.(event.target.value)
            }}
            className="h-9 w-full rounded-lg border border-slate-200 bg-white px-3 text-sm"
          >
            <option value="">-- Chọn gói --</option>
            {plans.map((plan) => (
              <option key={plan.id} value={plan.id}>
                {plan.name} - {plan.pricePerMonth.toLocaleString("vi-VN")}đ/tháng
              </option>
            ))}
          </select>
          {errors.plan_id && <p className="text-[11px] font-bold text-red-500">{errors.plan_id.message}</p>}
        </div>

        {selectedPlan && (
          <div className="rounded-lg bg-slate-50 p-4 border border-slate-100">
            <div className="flex justify-between items-center text-sm font-semibold">
              <span className="text-slate-600">Số tiền cần thanh toán:</span>
              <span className="text-[#d92d20] text-lg font-black">{formatVnd(selectedPlan.pricePerMonth)}</span>
            </div>
            <p className="text-[11px] text-slate-400 mt-1">
              Giao dịch sẽ được xử lý tự động và cập nhật gói dịch vụ ngay khi bạn chuyển tiền thành công.
            </p>
          </div>
        )}

        <Button type="submit" disabled={mutation.isPending} className="h-10 w-full font-bold">
          {mutation.isPending ? (
            <span className="flex items-center justify-center gap-2">
              <Loader2 className="size-4 animate-spin" />
              Đang chuyển hướng sang PayOS...
            </span>
          ) : (
            "Thanh toán qua PayOS"
          )}
        </Button>
      </form>
    </div>
  )
}
