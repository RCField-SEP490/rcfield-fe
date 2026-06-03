import { useEffect, useMemo } from "react"
import { useForm, type Resolver } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import * as z from "zod"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { toast } from "sonner"
import { CreditCard } from "lucide-react"

import { Button } from "@/shared/ui/button"
import { Input } from "@/shared/ui/input"
import { Label } from "@/shared/ui/label"
import { subscriptionApi } from "../api/subscription.api"

const schema = z.object({
  plan_id: z.string().min(1, "Chọn gói"),
  transfer_reference: z.string().min(1, "Nhập nội dung chuyển khoản"),
  transfer_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Định dạng YYYY-MM-DD"),
  transfer_amount: z.coerce.number().min(0, "Số tiền không hợp lệ"),
})

type FormValues = z.infer<typeof schema>

interface Props {
  hasPendingRequest: boolean
  onSuccess?: () => void
  selectedPlanId?: string
  onSelectedPlanChange?: (planId: string) => void
}

function todayInputValue() {
  const now = new Date()
  const timezoneOffset = now.getTimezoneOffset() * 60000
  return new Date(now.getTime() - timezoneOffset).toISOString().slice(0, 10)
}

function parseVndInput(value: string) {
  const digits = value.replace(/\D/g, "")
  return digits ? Number(digits) : 0
}

function formatVndInput(value?: number) {
  if (value === undefined || Number.isNaN(value)) return ""
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
    reset,
    setValue,
    watch,
    formState: { errors },
  } = useForm<FormValues>({
    resolver: zodResolver(schema) as Resolver<FormValues>,
    defaultValues: {
      plan_id: selectedPlanId ?? "",
      transfer_date: todayInputValue(),
    },
  })

  const watchedPlanId = watch("plan_id")
  const watchedTransferAmount = watch("transfer_amount")
  const activePlanId = selectedPlanId || watchedPlanId
  const selectedPlan = useMemo(
    () => plans.find((plan) => plan.id === activePlanId),
    [activePlanId, plans],
  )

  useEffect(() => {
    if (!selectedPlanId) return
    setValue("plan_id", selectedPlanId, { shouldValidate: true })
  }, [selectedPlanId, setValue])

  useEffect(() => {
    if (!selectedPlan) return
    setValue("transfer_amount", selectedPlan.pricePerMonth, { shouldValidate: true })
    setValue("transfer_reference", `RCFIELD ${selectedPlan.isTrial ? "TRIAL" : "SUBSCRIPTION"} ${selectedPlan.name}`, {
      shouldValidate: true,
    })
    setValue("transfer_date", todayInputValue(), { shouldValidate: true })
  }, [selectedPlan, setValue])

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
      reset({ plan_id: "", transfer_date: todayInputValue() })
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
      <div className="rounded-xl border border-yellow-100 bg-yellow-50 px-5 py-4 text-sm font-semibold text-yellow-800">
        Bạn đang có yêu cầu thanh toán chờ xử lý. Vui lòng đợi Admin xác nhận trước khi gửi yêu cầu mới.
      </div>
    )
  }

  return (
    <div className="space-y-4 rounded-xl border border-slate-200 bg-white p-5">
      <div className="flex items-center gap-2">
        <CreditCard className="size-4 text-slate-500" />
        <h3 className="text-sm font-bold text-slate-700">Gửi yêu cầu thay đổi gói</h3>
      </div>
      <p className="text-xs text-slate-500">
        Chọn gói ở phía trên, chuyển khoản đến tài khoản RCField, sau đó gửi thông tin để Admin xác nhận.
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

        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <div className="space-y-1.5">
            <Label className="text-xs font-bold">Nội dung chuyển khoản</Label>
            <Input {...register("transfer_reference")} placeholder="VD: RCFIELD UPGRADE PRO" className="h-9 rounded-lg" />
            {errors.transfer_reference && (
              <p className="text-[11px] font-bold text-red-500">{errors.transfer_reference.message}</p>
            )}
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs font-bold">Ngày chuyển khoản</Label>
            <Input type="date" {...register("transfer_date")} className="h-9 rounded-lg" />
            {errors.transfer_date && <p className="text-[11px] font-bold text-red-500">{errors.transfer_date.message}</p>}
          </div>
        </div>

        <div className="space-y-1.5">
          <Label className="text-xs font-bold">Số tiền đã chuyển (VNĐ)</Label>
          <input type="hidden" {...register("transfer_amount")} />
          <Input
            inputMode="numeric"
            value={formatVndInput(watchedTransferAmount)}
            onChange={(event) => {
              setValue("transfer_amount", parseVndInput(event.target.value), { shouldValidate: true })
            }}
            placeholder="299.000 đ"
            className="h-9 rounded-lg"
          />
          {errors.transfer_amount && <p className="text-[11px] font-bold text-red-500">{errors.transfer_amount.message}</p>}
        </div>

        <Button type="submit" disabled={mutation.isPending} className="h-10 w-full font-bold">
          {mutation.isPending ? "Đang gửi..." : "Gửi yêu cầu thanh toán"}
        </Button>
      </form>
    </div>
  )
}
