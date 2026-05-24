import { useEffect, useState } from "react"
import { Link, useNavigate } from "react-router"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { AnimatePresence, motion } from "framer-motion"
import {
  Briefcase,
  Car,
  ChevronLeft,
  Eye,
  EyeOff,
  Lock,
  Mail,
  ShieldAlert,
  Sparkles,
  User,
  Zap,
} from "lucide-react"
import * as z from "zod"

import { routePaths } from "@/app/router/route-paths"
import { loginWithPassword } from "@/features/auth/api/auth.api"
import { useAuthStore } from "@/features/auth/stores/auth.store"
import { Checkbox } from "@/shared/ui/checkbox"
import { Button } from "@/shared/ui/button"
import { Input } from "@/shared/ui/input"
import { Label } from "@/shared/ui/label"
import { storageKeys } from "@/shared/lib/storage"
import type { UserRole } from "@/shared/types/common"
import { toast } from "sonner"

type LoginRole = UserRole

const loginSchema = z.object({
  email: z.string().min(1, { message: "Vui lòng nhập email" }).email({ message: "Email không hợp lệ" }),
  password: z.string().min(6, { message: "Mật khẩu phải chứa ít nhất 6 ký tự" }),
})

type LoginFormValues = z.infer<typeof loginSchema>

const roleLabels: Record<LoginRole, string> = {
  customer: "Người chơi",
  staff: "Nhân viên",
  provider: "Chủ quán",
  admin: "Quản trị",
}

const roleRedirects: Record<LoginRole, string> = {
  customer: routePaths.home,
  staff: routePaths.staffDashboard,
  provider: routePaths.providerDashboard,
  admin: routePaths.adminDashboard,
}

const roleOptions: Array<{ key: LoginRole; label: string; icon: typeof User }> = [
  { key: "customer", label: "Người chơi", icon: User },
  { key: "staff", label: "Nhân viên", icon: Car },
  { key: "provider", label: "Chủ quán", icon: Briefcase },
  { key: "admin", label: "Quản trị", icon: ShieldAlert },
]

const rotatingTaglines = [
  {
    title: "Đặt lịch rảnh tay",
    desc: "Khám phá sân đua RC Cafe và giữ chỗ chỉ trong 30 giây.",
    icon: Car,
    color: "from-orange-500 to-red-500",
  },
  {
    title: "Serious Inspection",
    desc: "Bàn giao xe thuê minh bạch bằng quy trình đối chiếu ảnh 4 góc.",
    icon: Sparkles,
    color: "from-red-500 to-pink-500",
  },
  {
    title: "Quản trị doanh thu",
    desc: "Tự động phân tách phí dịch vụ, cọc và F&B qua hệ thống Ledger chi tiết.",
    icon: Zap,
    color: "from-indigo-500 to-blue-500",
  },
]

export function LoginPage() {
  const navigate = useNavigate()
  const setAuthenticated = useAuthStore((state) => state.setAuthenticated)
  const [selectedRole, setSelectedRole] = useState<LoginRole>("customer")
  const [showPassword, setShowPassword] = useState(false)
  const [rememberMe, setRememberMe] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [taglineIndex, setTaglineIndex] = useState(0)

  useEffect(() => {
    const interval = window.setInterval(() => {
      setTaglineIndex((current) => (current + 1) % rotatingTaglines.length)
    }, 4500)

    return () => window.clearInterval(interval)
  }, [])

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: "",
      password: "",
    },
  })

  const onSubmit = async (data: LoginFormValues) => {
    setIsLoading(true)

    try {
      const auth = await loginWithPassword({
        email: data.email.trim().toLowerCase(),
        password: data.password,
      })

      setAuthenticated(auth.user.role)

      const authPayload = JSON.stringify({
        accessToken: auth.accessToken,
        refreshToken: auth.refreshToken,
        user: auth.user,
        role: auth.user.role,
        email: auth.user.email,
      })
      const storage = rememberMe ? localStorage : sessionStorage
      const staleStorage = rememberMe ? sessionStorage : localStorage
      staleStorage.removeItem(storageKeys.auth)
      storage.setItem(storageKeys.auth, authPayload)

      toast.success(`Đăng nhập thành công với vai trò ${roleLabels[auth.user.role]}!`, {
        description: `Chào mừng quay trở lại, ${auth.user.email}.`,
      })

      navigate(roleRedirects[auth.user.role])
    } catch (error: any) {
      const code = error?.response?.data?.code
      const message = error?.response?.data?.message

      if (code === "INVALID_CREDENTIALS") {
        toast.error("Email hoặc mật khẩu không đúng", {
          description: "Vui lòng kiểm tra lại thông tin đăng nhập từ hệ thống.",
        })
      } else if (code === "ACCOUNT_LOCKED") {
        toast.error("Tài khoản đang bị khóa", {
          description: message ?? "Vui lòng liên hệ quản trị viên để được hỗ trợ.",
        })
      } else if (code === "VALIDATION_ERROR") {
        toast.error("Thông tin đăng nhập không hợp lệ", {
          description: "Backend hiện hỗ trợ đăng nhập bằng email và mật khẩu.",
        })
      } else {
        toast.error("Không thể đăng nhập", {
          description: message ?? "Không kết nối được tới máy chủ xác thực. Vui lòng thử lại.",
        })
      }
    } finally {
      setIsLoading(false)
    }
  }

  const ActiveIcon = rotatingTaglines[taglineIndex].icon

  return (
    <div className="flex min-h-screen items-stretch overflow-hidden bg-slate-50 font-sans">
      <section className="relative hidden w-1/2 select-none flex-col justify-between overflow-hidden bg-slate-950 p-12 text-white lg:flex">
        <div className="pointer-events-none absolute -left-32 -top-32 h-[560px] w-[560px] rounded-full bg-orange-600/20 blur-[120px]" />
        <div className="pointer-events-none absolute -bottom-32 -right-32 h-[560px] w-[560px] rounded-full bg-red-600/10 blur-[120px]" />

        <Link to={routePaths.home} className="relative z-10 flex w-fit items-center gap-2">
          <div className="flex size-10 items-center justify-center rounded-xl bg-gradient-to-br from-orange-500 to-red-600 shadow-lg shadow-orange-500/20">
            <Zap className="size-5 fill-current" />
          </div>
          <span className="text-lg font-black tracking-tight">RCField</span>
        </Link>

        <div className="relative z-10 my-auto max-w-md space-y-10">
          <AnimatePresence mode="wait">
            <motion.div
              key={taglineIndex}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.45 }}
              className="space-y-6"
            >
              <div
                className={`flex size-12 items-center justify-center rounded-2xl bg-gradient-to-br ${rotatingTaglines[taglineIndex].color} shadow-lg`}
              >
                <ActiveIcon className="size-6" />
              </div>
              <div className="space-y-3">
                <h2 className="text-3xl font-black leading-tight tracking-tight">{rotatingTaglines[taglineIndex].title}</h2>
                <p className="text-sm font-medium leading-relaxed text-slate-400">{rotatingTaglines[taglineIndex].desc}</p>
              </div>
            </motion.div>
          </AnimatePresence>

          <div className="flex items-center gap-2">
            {rotatingTaglines.map((_, index) => (
              <button
                key={index}
                type="button"
                aria-label={`Xem giới thiệu ${index + 1}`}
                onClick={() => setTaglineIndex(index)}
                className={`h-2 rounded-full transition-all ${taglineIndex === index ? "w-8 bg-orange-500" : "w-2 bg-slate-800"}`}
              />
            ))}
          </div>
        </div>

        <div className="relative z-10 flex items-center justify-between text-[10px] font-bold text-slate-500">
          <span>Hệ thống booking và vận hành RC Cafe số 1</span>
          <span>© 2026 RCField</span>
        </div>
      </section>

      <section className="relative flex w-full items-center justify-center bg-white p-6 md:p-12 lg:w-1/2">
        <button
          type="button"
          onClick={() => navigate(routePaths.home)}
          className="absolute left-6 top-6 inline-flex items-center gap-1 text-xs font-bold text-slate-500 transition-colors hover:text-slate-900"
        >
          <ChevronLeft className="size-4" />
          Về Trang chủ
        </button>

        <div className="w-full max-w-md space-y-8">
          <header className="space-y-2">
            <h1 className="text-2xl font-extrabold tracking-tight text-slate-950 md:text-3xl">Chào mừng quay trở lại</h1>
            <p className="text-xs font-semibold text-slate-500">
              Đăng nhập tài khoản để đặt sân đua và quản lý phiên chơi của bạn.
            </p>
          </header>

          <div className="space-y-2">
            <Label className="text-xs font-bold uppercase tracking-wider text-slate-500">Đăng nhập với tư cách</Label>
            <div className="grid grid-cols-2 gap-2 md:grid-cols-4">
              {roleOptions.map((role) => {
                const RoleIcon = role.icon
                const isSelected = selectedRole === role.key

                return (
                  <button
                    key={role.key}
                    type="button"
                    onClick={() => setSelectedRole(role.key)}
                    className={`flex flex-col items-center gap-1.5 rounded-lg border px-3 py-2 text-xs font-bold transition-all ${
                      isSelected
                        ? "border-orange-500 bg-orange-50 text-orange-700 shadow-sm shadow-orange-500/10"
                        : "border-slate-200 text-slate-600 hover:border-slate-300"
                    }`}
                  >
                    <RoleIcon className={`size-4 ${isSelected ? "text-orange-600" : "text-slate-400"}`} />
                    {role.label}
                  </button>
                )
              })}
            </div>
          </div>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
            <div className="space-y-1.5">
              <Label htmlFor="email" className="text-xs font-bold text-slate-700">
                Email
              </Label>
              <div className="relative">
                <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3.5 text-slate-400">
                  <Mail className="size-4" />
                </div>
                <Input
                  id="email"
                  type="email"
                  placeholder="provider@gmail.com"
                  className={`h-11 rounded-xl border-slate-200 pl-10 focus:border-orange-500 focus:ring-orange-500/20 ${
                    errors.email ? "border-red-500 focus:border-red-500" : ""
                  }`}
                  {...register("email")}
                />
              </div>
              {errors.email ? <p className="text-[11px] font-bold text-red-500">{errors.email.message}</p> : null}
            </div>

            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <Label htmlFor="password" className="text-xs font-bold text-slate-700">
                  Mật khẩu
                </Label>
                <Link to={routePaths.forgotPassword} className="text-xs font-bold text-orange-600 hover:text-orange-700">
                  Quên mật khẩu?
                </Link>
              </div>
              <div className="relative">
                <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3.5 text-slate-400">
                  <Lock className="size-4" />
                </div>
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  placeholder="••••••••"
                  className={`h-11 rounded-xl border-slate-200 pl-10 pr-10 focus:border-orange-500 focus:ring-orange-500/20 ${
                    errors.password ? "border-red-500 focus:border-red-500" : ""
                  }`}
                  {...register("password")}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((value) => !value)}
                  className="absolute inset-y-0 right-0 flex items-center pr-3.5 text-slate-400 hover:text-slate-600"
                >
                  {showPassword ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                </button>
              </div>
              {errors.password ? <p className="text-[11px] font-bold text-red-500">{errors.password.message}</p> : null}
            </div>

            <div className="flex items-center gap-2">
              <Checkbox
                id="rememberMe"
                checked={rememberMe}
                onCheckedChange={(checked) => setRememberMe(checked === true)}
                className="border-slate-300 data-[state=checked]:border-orange-500 data-[state=checked]:bg-orange-500"
              />
              <Label htmlFor="rememberMe" className="cursor-pointer text-xs font-bold text-slate-600">
                Ghi nhớ tài khoản này trên thiết bị
              </Label>
            </div>

            <Button
              type="submit"
              disabled={isLoading}
              className="flex h-11 w-full items-center justify-center gap-2 rounded-xl bg-slate-950 font-bold text-white shadow-md transition-all hover:bg-slate-900"
            >
              {isLoading ? (
                <>
                  <span className="size-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                  Đang xử lý đăng nhập...
                </>
              ) : (
                <>
                  Đăng nhập
                  <Zap className="size-4 fill-current text-orange-400" />
                </>
              )}
            </Button>
          </form>

          <div className="relative my-6 text-center">
            <span className="absolute inset-x-0 top-1/2 h-px -translate-y-1/2 bg-slate-200/80" />
            <span className="relative bg-white px-3 text-[10px] font-extrabold uppercase tracking-widest text-slate-400">
              Hoặc tiếp tục với
            </span>
          </div>

          <Button
            variant="outline"
            className="flex h-11 w-full items-center justify-center gap-2.5 rounded-xl border-slate-200 font-bold text-slate-700 hover:bg-slate-50"
            onClick={() => toast.info("Đăng nhập bằng tài khoản Google đang được phát triển.")}
          >
            <svg className="size-4" viewBox="0 0 24 24" fill="none" aria-hidden="true">
              <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
              <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
              <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" fill="#FBBC05" />
              <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" fill="#EA4335" />
            </svg>
            Google
          </Button>

          <p className="text-center text-xs font-semibold text-slate-500">
            Bạn chưa có tài khoản?{" "}
            <Link to={routePaths.register} className="font-extrabold text-orange-600 hover:text-orange-700 hover:underline">
              Đăng ký tại đây
            </Link>
          </p>
        </div>
      </section>
    </div>
  )
}
