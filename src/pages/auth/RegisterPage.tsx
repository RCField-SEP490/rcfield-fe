import { useEffect, useState } from "react"
import { Link, useNavigate } from "react-router"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { AnimatePresence, motion } from "framer-motion"
import { Briefcase, Car, CheckCircle2, ChevronLeft, Lock, Mail, Phone, Sparkles, User, Zap } from "lucide-react"
import * as z from "zod"

import { routePaths } from "@/app/router/route-paths"
import { registerWithPassword } from "@/features/auth/api/auth.api"
import { useAuthStore } from "@/features/auth/stores/auth.store"
import { Button } from "@/shared/ui/button"
import { Checkbox } from "@/shared/ui/checkbox"
import { Input } from "@/shared/ui/input"
import { Label } from "@/shared/ui/label"
import { storageKeys } from "@/shared/lib/storage"
import { toast } from "sonner"

type RegisterRole = "customer" | "provider"

const registerSchema = z
  .object({
    fullName: z.string().min(2, { message: "Họ và tên phải chứa ít nhất 2 ký tự" }).max(255),
    email: z.string().email({ message: "Địa chỉ email không hợp lệ" }),
    phoneNumber: z
      .string()
      .regex(/^(84|0[3|5|7|8|9])([0-9]{8})$/, { message: "Số điện thoại không đúng định dạng Việt Nam" })
      .optional()
      .or(z.literal("")),
    password: z.string().min(6, { message: "Mật khẩu phải chứa ít nhất 6 ký tự" }),
    confirmPassword: z.string().min(6, { message: "Vui lòng nhập lại mật khẩu xác nhận" }),
    agreeToTerms: z.boolean().refine((value) => value, {
      message: "Bạn phải đồng ý với Điều khoản & Chính sách bảo mật",
    }),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Mật khẩu xác nhận không trùng khớp",
    path: ["confirmPassword"],
  })

type RegisterFormValues = z.infer<typeof registerSchema>

const roleRedirects: Record<RegisterRole, string> = {
  customer: routePaths.home,
  provider: routePaths.providerDashboard,
}

const roleOptions: Array<{ key: RegisterRole; label: string; desc: string; icon: typeof Car }> = [
  { key: "customer", label: "Người chơi", desc: "Đặt sân và lái xe thuê", icon: Car },
  { key: "provider", label: "Chủ quán", desc: "Số hóa vận hành sân", icon: Briefcase },
]

const rotatingBanners = [
  {
    title: "Trải nghiệm đua xe đỉnh cao",
    desc: "Đăng ký để đặt chỗ sân đua, thuê xe cao cấp và lưu trữ lịch sử đua chuyên nghiệp.",
    icon: Car,
    color: "from-orange-500 to-red-500",
  },
  {
    title: "Số hóa cơ sở RC Cafe",
    desc: "Vận hành sân đua rảnh tay, quản lý gói hội viên và theo dõi doanh thu theo thời gian thực.",
    icon: Briefcase,
    color: "from-indigo-500 to-blue-500",
  },
]

export function RegisterPage() {
  const navigate = useNavigate()
  const setAuthenticated = useAuthStore((state) => state.setAuthenticated)
  const [selectedRole, setSelectedRole] = useState<RegisterRole>("customer")
  const [isLoading, setIsLoading] = useState(false)
  const [bannerIndex, setBannerIndex] = useState(0)

  useEffect(() => {
    const interval = window.setInterval(() => {
      setBannerIndex((current) => (current + 1) % rotatingBanners.length)
    }, 5000)

    return () => window.clearInterval(interval)
  }, [])

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm<RegisterFormValues>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      fullName: "",
      email: "",
      phoneNumber: "",
      password: "",
      confirmPassword: "",
      agreeToTerms: false,
    },
  })

  const agreeToTerms = watch("agreeToTerms")

  const onSubmit = async (data: RegisterFormValues) => {
    setIsLoading(true)

    try {
      const auth = await registerWithPassword({
        fullName: data.fullName.trim(),
        email: data.email.trim().toLowerCase(),
        phone: data.phoneNumber?.trim() || undefined,
        password: data.password,
        role: selectedRole,
      })

      setAuthenticated(auth.user.role)
      sessionStorage.setItem(
        storageKeys.auth,
        JSON.stringify({
          accessToken: auth.accessToken,
          refreshToken: auth.refreshToken,
          user: auth.user,
          role: auth.user.role,
          email: auth.user.email,
        })
      )
      localStorage.removeItem(storageKeys.auth)

      toast.success("Đăng ký tài khoản thành công!", {
        description: `Chào mừng ${data.fullName} tham gia RCField.`,
      })

      navigate(roleRedirects[selectedRole])
    } catch (error: any) {
      const code = error?.response?.data?.code
      const message = error?.response?.data?.message

      if (code === "EMAIL_ALREADY_EXISTS") {
        toast.error("Email đã được sử dụng", {
          description: "Vui lòng đăng nhập hoặc sử dụng địa chỉ email khác.",
        })
      } else if (code === "VALIDATION_ERROR") {
        toast.error("Thông tin đăng ký không hợp lệ", {
          description: "Vui lòng kiểm tra lại email, số điện thoại và mật khẩu.",
        })
      } else {
        toast.error("Không thể đăng ký", {
          description: message ?? "Không kết nối được tới máy chủ. Vui lòng thử lại.",
        })
      }
    } finally {
      setIsLoading(false)
    }
  }

  const ActiveIcon = rotatingBanners[bannerIndex].icon

  return (
    <div className="flex min-h-screen items-stretch overflow-hidden bg-slate-50 font-sans">
      <section className="relative hidden w-1/2 select-none flex-col justify-between overflow-hidden bg-slate-950 p-12 text-white lg:flex">
        <div className="pointer-events-none absolute -left-32 -top-32 h-[560px] w-[560px] rounded-full bg-orange-600/15 blur-[120px]" />
        <div className="pointer-events-none absolute -bottom-32 -right-32 h-[560px] w-[560px] rounded-full bg-indigo-600/15 blur-[120px]" />

        <Link to={routePaths.home} className="relative z-10 flex w-fit items-center gap-2">
          <div className="flex size-10 items-center justify-center rounded-xl bg-gradient-to-br from-orange-500 to-red-600 shadow-lg shadow-orange-500/20">
            <Zap className="size-5 fill-current" />
          </div>
          <span className="text-lg font-black tracking-tight">RCField</span>
        </Link>

        <div className="relative z-10 my-auto max-w-md space-y-8">
          <AnimatePresence mode="wait">
            <motion.div
              key={bannerIndex}
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              transition={{ duration: 0.45 }}
              className="space-y-6"
            >
              <div
                className={`flex size-12 items-center justify-center rounded-2xl bg-gradient-to-br ${rotatingBanners[bannerIndex].color} shadow-lg`}
              >
                <ActiveIcon className="size-6" />
              </div>
              <div className="space-y-3">
                <h2 className="text-3xl font-black leading-tight tracking-tight">{rotatingBanners[bannerIndex].title}</h2>
                <p className="text-sm font-medium leading-relaxed text-slate-400">{rotatingBanners[bannerIndex].desc}</p>
              </div>
            </motion.div>
          </AnimatePresence>

          <div className="flex items-center gap-2">
            {rotatingBanners.map((_, index) => (
              <button
                key={index}
                type="button"
                aria-label={`Xem giới thiệu ${index + 1}`}
                onClick={() => setBannerIndex(index)}
                className={`h-2 rounded-full transition-all ${bannerIndex === index ? "w-8 bg-orange-500" : "w-2 bg-slate-800"}`}
              />
            ))}
          </div>

          <div className="space-y-2 border-t border-slate-900 pt-6 text-xs font-semibold text-slate-400">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="size-4 text-emerald-500" />
              Tạo tài khoản cá nhân hoặc nhà cung cấp miễn phí
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle2 className="size-4 text-emerald-500" />
              Bảo mật bằng tài khoản và phân quyền theo vai trò
            </div>
          </div>
        </div>

        <div className="relative z-10 flex items-center justify-between text-[10px] font-bold text-slate-500">
          <span>Khám phá và chinh phục đường đua RC</span>
          <span>© 2026 RCField</span>
        </div>
      </section>

      <section className="relative flex w-full items-center justify-center overflow-y-auto bg-white p-6 md:p-12 lg:w-1/2">
        <button
          type="button"
          onClick={() => navigate(routePaths.home)}
          className="absolute left-6 top-6 inline-flex items-center gap-1 text-xs font-bold text-slate-500 transition-colors hover:text-slate-900"
        >
          <ChevronLeft className="size-4" />
          Về Trang chủ
        </button>

        <div className="w-full max-w-md space-y-6 pb-8 pt-10">
          <header className="space-y-2">
            <h1 className="text-2xl font-extrabold tracking-tight text-slate-950 md:text-3xl">Đăng ký tài khoản mới</h1>
            <p className="text-xs font-semibold text-slate-500">
              Nhập thông tin của bạn để tham gia hệ sinh thái RCField.
            </p>
          </header>

          <div className="space-y-2">
            <Label className="text-xs font-bold uppercase tracking-wider text-slate-500">Vai trò đăng ký</Label>
            <div className="grid grid-cols-2 gap-3">
              {roleOptions.map((role) => {
                const RoleIcon = role.icon
                const isSelected = selectedRole === role.key

                return (
                  <button
                    key={role.key}
                    type="button"
                    onClick={() => setSelectedRole(role.key)}
                    className={`flex flex-col gap-1.5 rounded-xl border px-4 py-3 text-left transition-all ${
                      isSelected
                        ? "border-orange-500 bg-orange-50 text-orange-950 shadow-sm shadow-orange-500/5"
                        : "border-slate-200 text-slate-600 hover:border-slate-300"
                    }`}
                  >
                    <div className="flex w-full items-center justify-between">
                      <RoleIcon className={`size-5 ${isSelected ? "text-orange-600" : "text-slate-400"}`} />
                      {isSelected ? <span className="size-2 rounded-full bg-orange-600" /> : null}
                    </div>
                    <div>
                      <p className="text-xs font-bold leading-none">{role.label}</p>
                      <p className="mt-1 text-[10px] font-medium text-slate-400">{role.desc}</p>
                    </div>
                  </button>
                )
              })}
            </div>
          </div>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <FieldError label="Họ và tên" error={errors.fullName?.message}>
              <User className="size-4" />
              <Input
                id="fullName"
                type="text"
                placeholder="Nguyễn Văn A"
                className={`h-11 rounded-xl border-slate-200 pl-10 focus:border-orange-500 focus:ring-orange-500/20 ${
                  errors.fullName ? "border-red-500 focus:border-red-500" : ""
                }`}
                {...register("fullName")}
              />
            </FieldError>

            <FieldError label="Email" error={errors.email?.message}>
              <Mail className="size-4" />
              <Input
                id="email"
                type="email"
                placeholder="name@example.com"
                className={`h-11 rounded-xl border-slate-200 pl-10 focus:border-orange-500 focus:ring-orange-500/20 ${
                  errors.email ? "border-red-500 focus:border-red-500" : ""
                }`}
                {...register("email")}
              />
            </FieldError>

            <FieldError label="Số điện thoại" error={errors.phoneNumber?.message}>
              <Phone className="size-4" />
              <Input
                id="phoneNumber"
                type="tel"
                placeholder="0987654321"
                className={`h-11 rounded-xl border-slate-200 pl-10 focus:border-orange-500 focus:ring-orange-500/20 ${
                  errors.phoneNumber ? "border-red-500 focus:border-red-500" : ""
                }`}
                {...register("phoneNumber")}
              />
            </FieldError>

            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <FieldError label="Mật khẩu" error={errors.password?.message}>
                <Lock className="size-4" />
                <Input
                  id="password"
                  type="password"
                  placeholder="••••••••"
                  className={`h-11 rounded-xl border-slate-200 pl-10 focus:border-orange-500 focus:ring-orange-500/20 ${
                    errors.password ? "border-red-500 focus:border-red-500" : ""
                  }`}
                  {...register("password")}
                />
              </FieldError>

              <FieldError label="Xác nhận" error={errors.confirmPassword?.message}>
                <Lock className="size-4" />
                <Input
                  id="confirmPassword"
                  type="password"
                  placeholder="••••••••"
                  className={`h-11 rounded-xl border-slate-200 pl-10 focus:border-orange-500 focus:ring-orange-500/20 ${
                    errors.confirmPassword ? "border-red-500 focus:border-red-500" : ""
                  }`}
                  {...register("confirmPassword")}
                />
              </FieldError>
            </div>

            <div className="space-y-1">
              <div className="flex items-start gap-2.5 pt-1">
                <Checkbox
                  id="agreeToTerms"
                  checked={agreeToTerms}
                  onCheckedChange={(checked) =>
                    setValue("agreeToTerms", checked === true, {
                      shouldDirty: true,
                      shouldValidate: true,
                    })
                  }
                  className="mt-0.5 border-slate-300 data-[state=checked]:border-orange-500 data-[state=checked]:bg-orange-500"
                />
                <Label htmlFor="agreeToTerms" className="cursor-pointer text-xs font-bold leading-tight text-slate-600">
                  Tôi đồng ý với{" "}
                  <Link to={routePaths.home} className="text-orange-600 hover:underline">
                    Điều khoản dịch vụ
                  </Link>{" "}
                  và{" "}
                  <Link to={routePaths.home} className="text-orange-600 hover:underline">
                    Chính sách bảo mật
                  </Link>{" "}
                  của RCField.
                </Label>
              </div>
              {errors.agreeToTerms ? <p className="text-[11px] font-bold text-red-500">{errors.agreeToTerms.message}</p> : null}
            </div>

            <Button
              type="submit"
              disabled={isLoading}
              className="flex h-11 w-full items-center justify-center gap-2 rounded-xl bg-slate-950 pt-1 font-bold text-white shadow-md transition-all hover:bg-slate-900"
            >
              {isLoading ? (
                <>
                  <span className="size-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                  Đang thiết lập tài khoản...
                </>
              ) : (
                <>
                  Đăng ký thành viên
                  <Sparkles className="size-4 text-orange-400 transition-transform group-hover:scale-110" />
                </>
              )}
            </Button>
          </form>

          <div className="relative my-4 text-center">
            <span className="absolute inset-x-0 top-1/2 h-px -translate-y-1/2 bg-slate-200/80" />
            <span className="relative bg-white px-3 text-[10px] font-extrabold uppercase tracking-widest text-slate-400">
              Đã có tài khoản?
            </span>
          </div>

          <Button
            variant="outline"
            className="h-11 w-full rounded-xl border-slate-200 font-bold text-slate-700 hover:bg-slate-50"
            onClick={() => navigate(routePaths.login)}
          >
            Quay lại đăng nhập
          </Button>
        </div>
      </section>
    </div>
  )
}

function FieldError({
  label,
  error,
  children,
}: {
  label: string
  error?: string
  children: React.ReactNode
}) {
  const input = Array.isArray(children) ? children[1] : children
  const icon = Array.isArray(children) ? children[0] : null

  return (
    <div className="space-y-1.5">
      <Label className="text-xs font-bold text-slate-700">{label}</Label>
      <div className="relative">
        <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3.5 text-slate-400">{icon}</div>
        {input}
      </div>
      {error ? <p className="text-[11px] font-bold text-red-500">{error}</p> : null}
    </div>
  )
}
