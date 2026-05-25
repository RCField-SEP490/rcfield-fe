import { useState } from "react"
import { useNavigate } from "react-router"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import * as z from "zod"
import { Mail, Lock, User, Phone, Building2, ChevronLeft, CheckCircle2, Sparkles } from "lucide-react"

import { AppLogo } from "@/shared/components/AppLogo"
import { Button } from "@/shared/ui/button"
import { Input } from "@/shared/ui/input"
import { Label } from "@/shared/ui/label"
import { Textarea } from "@/shared/ui/textarea"
import { toast } from "sonner"
import { subscriptionApi } from "@/features/subscriptions/api/subscription.api"
import { routePaths } from "@/app/router/route-paths"

const schema = z
  .object({
    full_name: z.string().min(2, "Họ tên tối thiểu 2 ký tự"),
    email: z.string().email("Email không hợp lệ"),
    phone: z.string().min(9, "Số điện thoại không hợp lệ").optional().or(z.literal("")),
    password: z.string().min(8, "Mật khẩu tối thiểu 8 ký tự"),
    confirm_password: z.string(),
    business_name: z.string().min(2, "Tên doanh nghiệp tối thiểu 2 ký tự"),
    business_description: z.string().max(1000).optional(),
  })
  .refine((d) => d.password === d.confirm_password, {
    message: "Mật khẩu xác nhận không trùng",
    path: ["confirm_password"],
  })

type FormValues = z.infer<typeof schema>

export function ProviderRegisterPage() {
  const navigate = useNavigate()
  const [submitting, setSubmitting] = useState(false)
  const [success, setSuccess] = useState(false)

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<FormValues>({ resolver: zodResolver(schema) })

  const onSubmit = async (data: FormValues) => {
    setSubmitting(true)
    try {
      await subscriptionApi.registerProvider({
        email: data.email,
        password: data.password,
        full_name: data.full_name,
        phone: data.phone || undefined,
        business_name: data.business_name,
        business_description: data.business_description,
      })
      setSuccess(true)
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message
      toast.error(msg ?? "Đăng ký thất bại. Vui lòng thử lại.")
    } finally {
      setSubmitting(false)
    }
  }

  if (success) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 p-6">
        <div className="w-full max-w-md space-y-6 bg-white rounded-2xl border border-slate-100 shadow-sm p-8 text-center">
          <div className="flex justify-center">
            <div className="flex size-16 items-center justify-center rounded-full bg-emerald-100">
              <CheckCircle2 className="size-8 text-emerald-600" />
            </div>
          </div>
          <div>
            <h2 className="text-xl font-bold text-slate-900">Đăng ký thành công!</h2>
            <p className="mt-2 text-sm text-slate-500">
              Tài khoản của bạn đang chờ duyệt. Chúng tôi sẽ thông báo qua email khi được phê duyệt.
            </p>
          </div>
          <Button className="w-full" onClick={() => navigate(routePaths.login)}>
            Quay lại Đăng nhập
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-slate-50 flex items-stretch overflow-hidden">
      <div className="hidden lg:flex lg:w-2/5 bg-slate-950 text-white flex-col justify-between p-12 relative overflow-hidden">
        <div className="absolute top-[-20%] left-[-20%] w-[500px] h-[500px] rounded-full bg-orange-600/15 blur-[100px] pointer-events-none" />
        <AppLogo variant="dark" className="relative z-10" />
        <div className="relative z-10 space-y-8">
          <div>
            <h2 className="text-2xl font-extrabold leading-tight">Đăng ký tài khoản Partner</h2>
            <p className="mt-3 text-sm text-slate-400 leading-relaxed">
              Số hóa hoạt động vận hành sân RC của bạn. Quản lý chi nhánh, đặt lịch, nhân viên — tất cả trong một nền tảng.
            </p>
          </div>
          <div className="space-y-3 text-xs font-semibold text-slate-400">
            {[
              "30 ngày dùng thử miễn phí",
              "Hỗ trợ AI chatbot tích hợp",
              "Quản lý nhiều chi nhánh",
            ].map((item) => (
              <div key={item} className="flex items-center gap-2">
                <CheckCircle2 className="size-4 text-emerald-500 shrink-0" />
                {item}
              </div>
            ))}
          </div>
        </div>
        <p className="relative z-10 text-[10px] text-slate-500">© 2024 RCField</p>
      </div>

      <div className="w-full lg:w-3/5 flex items-center justify-center p-6 md:p-12 bg-white overflow-y-auto">
        <button
          onClick={() => navigate(routePaths.login)}
          className="absolute top-6 left-6 lg:hidden inline-flex items-center gap-1 text-xs font-bold text-slate-500 hover:text-slate-900"
        >
          <ChevronLeft className="size-4" />
          Đăng nhập
        </button>

        <div className="w-full max-w-lg space-y-5 pt-10 pb-8">
          <div>
            <h1 className="text-2xl font-extrabold text-slate-950">Đăng ký đối tác</h1>
            <p className="mt-1 text-xs text-slate-500">Điền đầy đủ thông tin để tạo tài khoản Provider.</p>
          </div>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Field label="Họ và tên *" error={errors.full_name?.message}>
                <InputIcon icon={User}>
                  <Input placeholder="Nguyễn Văn A" {...register("full_name")} className="pl-10 h-11 rounded-xl" />
                </InputIcon>
              </Field>
              <Field label="Email *" error={errors.email?.message}>
                <InputIcon icon={Mail}>
                  <Input type="email" placeholder="you@company.com" {...register("email")} className="pl-10 h-11 rounded-xl" />
                </InputIcon>
              </Field>
              <Field label="Số điện thoại" error={errors.phone?.message}>
                <InputIcon icon={Phone}>
                  <Input placeholder="0987654321" {...register("phone")} className="pl-10 h-11 rounded-xl" />
                </InputIcon>
              </Field>
              <Field label="Tên doanh nghiệp *" error={errors.business_name?.message}>
                <InputIcon icon={Building2}>
                  <Input placeholder="RC Cafe Quận 7" {...register("business_name")} className="pl-10 h-11 rounded-xl" />
                </InputIcon>
              </Field>
              <Field label="Mật khẩu *" error={errors.password?.message}>
                <InputIcon icon={Lock}>
                  <Input type="password" placeholder="••••••••" {...register("password")} className="pl-10 h-11 rounded-xl" />
                </InputIcon>
              </Field>
              <Field label="Xác nhận mật khẩu *" error={errors.confirm_password?.message}>
                <InputIcon icon={Lock}>
                  <Input type="password" placeholder="••••••••" {...register("confirm_password")} className="pl-10 h-11 rounded-xl" />
                </InputIcon>
              </Field>
            </div>

            <Field label="Mô tả doanh nghiệp" error={errors.business_description?.message}>
              <Textarea
                placeholder="Giới thiệu ngắn về doanh nghiệp của bạn..."
                rows={3}
                {...register("business_description")}
                className="rounded-xl resize-none"
              />
            </Field>

            <Button type="submit" disabled={submitting} className="w-full h-11 rounded-xl bg-slate-950 hover:bg-slate-900 font-bold gap-2">
              {submitting ? (
                <><span className="size-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> Đang gửi...</>
              ) : (
                <><Sparkles className="size-4 text-orange-400" /> Đăng ký Partner</>
              )}
            </Button>

            <p className="text-center text-xs text-slate-500">
              Đã có tài khoản?{" "}
              <button type="button" onClick={() => navigate(routePaths.login)} className="font-bold text-orange-600 hover:underline">
                Đăng nhập
              </button>
            </p>
          </form>
        </div>
      </div>
    </div>
  )
}

function Field({ label, error, children }: { label: string; error?: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1.5">
      <Label className="text-xs font-bold text-slate-700">{label}</Label>
      {children}
      {error && <p className="text-[11px] font-bold text-red-500">{error}</p>}
    </div>
  )
}

function InputIcon({ icon: Icon, children }: { icon: React.ElementType; children: React.ReactElement }) {
  return (
    <div className="relative">
      <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
        <Icon className="size-4" />
      </div>
      {children}
    </div>
  )
}
