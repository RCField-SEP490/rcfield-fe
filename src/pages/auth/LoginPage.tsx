import { useState, useEffect } from "react"
import { useNavigate, Link } from "react-router"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import * as z from "zod"
import { motion, AnimatePresence } from "framer-motion"
import { 
  Zap, 
  Mail, 
  Lock, 
  Eye, 
  EyeOff, 
  ChevronLeft, 
  Car, 
  User, 
  ShieldAlert, 
  Briefcase,
  Sparkles
} from "lucide-react"

import { Button } from "@/shared/ui/button"
import { Input } from "@/shared/ui/input"
import { Label } from "@/shared/ui/label"
import { Checkbox } from "@/shared/ui/checkbox"
import { toast } from "sonner"

// Form validation schema with Zod
const loginSchema = z.object({
  email: z.string()
    .min(1, { message: "Vui lòng nhập email hoặc số điện thoại" })
    .refine(val => {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
      const phoneRegex = /(84|0[3|5|7|8|9])+([0-9]{8})\b/
      return emailRegex.test(val) || phoneRegex.test(val)
    }, { message: "Email hoặc số điện thoại không hợp lệ" }),
  password: z.string().min(6, { message: "Mật khẩu phải chứa ít nhất 6 ký tự" }),
  rememberMe: z.boolean().optional(),
})

type LoginFormValues = z.infer<typeof loginSchema>

const rotatingTaglines = [
  {
    title: "Đặt Lịch Rảnh Tay",
    desc: "Khám phá hàng chục sân đua RC Cafe và giữ chỗ chỉ trong 30 giây.",
    icon: Car,
    color: "from-orange-500 to-red-500"
  },
  {
    title: "Serious Inspection",
    desc: "Bàn giao xe thuê minh bạch tuyệt đối qua quy trình đối chiếu ảnh 4 góc.",
    icon: Sparkles,
    color: "from-red-500 to-pink-500"
  },
  {
    title: "Quản Trị Doanh Thu",
    desc: "Tự động phân tách phí dịch vụ, cọc và F&B qua hệ thống Ledger chi tiết.",
    icon: Zap,
    color: "from-indigo-500 to-blue-500"
  }
]

export function LoginPage() {
  const navigate = useNavigate()
  const [showPassword, setShowPassword] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [selectedRole, setSelectedRole] = useState<"customer" | "staff" | "provider" | "admin">("customer")
  const [taglineIndex, setTaglineIndex] = useState(0)

  // Auto rotate the taglines on the left panel
  useEffect(() => {
    const interval = setInterval(() => {
      setTaglineIndex(prev => (prev + 1) % rotatingTaglines.length)
    }, 4500)
    return () => clearInterval(interval)
  }, [])

  const { register, handleSubmit, formState: { errors } } = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: "",
      password: "",
      rememberMe: false
    }
  })

  const onSubmit = (data: LoginFormValues) => {
    setIsLoading(true)
    
    // Simulate API authorization response
    setTimeout(() => {
      setIsLoading(false)
      toast.success(`Đăng nhập thành công với vai trò ${selectedRole.toUpperCase()}!`, {
        description: `Chào mừng quay trở lại, ${data.email}.`
      })
      
      // Navigate to home or dashboard accordingly
      if (selectedRole === "customer") {
        navigate("/")
      } else if (selectedRole === "staff") {
        navigate("/staff/dashboard")
      } else if (selectedRole === "provider") {
        navigate("/provider/dashboard")
      } else {
        navigate("/admin/dashboard")
      }
    }, 1500)
  }

  const ActiveIcon = rotatingTaglines[taglineIndex].icon

  return (
    <div className="min-h-screen bg-slate-50 flex items-stretch overflow-hidden font-sans">
      
      {/* LEFT SPLIT PANEL: PREMIUM SHOWCASE */}
      <div className="hidden lg:flex lg:w-1/2 bg-slate-950 text-white relative flex-col justify-between p-12 overflow-hidden select-none">
        
        {/* Glow Effects */}
        <div className="absolute top-[-20%] left-[-20%] w-[600px] h-[600px] rounded-full bg-orange-600/20 blur-[130px] pointer-events-none" />
        <div className="absolute bottom-[-20%] right-[-20%] w-[600px] h-[600px] rounded-full bg-red-600/10 blur-[130px] pointer-events-none" />

        {/* Header brand info */}
        <Link to="/" className="flex items-center gap-2 group self-start relative z-10">
          <div className="h-9 w-9 rounded-xl bg-gradient-to-br from-orange-500 to-red-600 flex items-center justify-center text-white shadow-md shadow-orange-500/20 group-hover:scale-105 transition-transform">
            <Zap className="h-4.5 w-4.5 fill-current" />
          </div>
          <span className="text-lg font-black tracking-tight text-white">
            RCField
          </span>
        </Link>

        {/* Rotating animated showcase content */}
        <div className="relative z-10 my-auto max-w-md space-y-12">
          <AnimatePresence mode="wait">
            <motion.div 
              key={taglineIndex}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.5 }}
              className="space-y-6"
            >
              <div className={`inline-flex h-12 w-12 rounded-2xl bg-gradient-to-br ${rotatingTaglines[taglineIndex].color} items-center justify-center text-white shadow-lg`}>
                <ActiveIcon className="h-6 w-6" />
              </div>
              <div className="space-y-3">
                <h2 className="text-3xl font-black tracking-tight leading-tight">
                  {rotatingTaglines[taglineIndex].title}
                </h2>
                <p className="text-sm font-medium leading-relaxed text-slate-400">
                  {rotatingTaglines[taglineIndex].desc}
                </p>
              </div>
            </motion.div>
          </AnimatePresence>

          {/* Stepper Dots Indicator */}
          <div className="flex items-center gap-2">
            {rotatingTaglines.map((_, idx) => (
              <button 
                key={idx}
                className={`h-2 rounded-full transition-all ${taglineIndex === idx ? 'w-8 bg-orange-500' : 'w-2 bg-slate-800'}`}
                onClick={() => setTaglineIndex(idx)}
              />
            ))}
          </div>
        </div>

        {/* Footer legal placeholder */}
        <div className="relative z-10 text-[10px] font-bold text-slate-500 flex items-center justify-between">
          <span>Hệ thống booking & vận hành RC Cafe số 1</span>
          <span>© 2024 RCField</span>
        </div>
      </div>

      {/* RIGHT SPLIT PANEL: GORGEOUS FORM */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-6 md:p-12 bg-white relative">
        
        {/* Mobile Go Back button */}
        <button 
          onClick={() => navigate("/")}
          className="absolute top-6 left-6 inline-flex items-center gap-1 text-xs font-bold text-slate-500 hover:text-slate-900 transition-colors"
        >
          <ChevronLeft className="h-4 w-4" />
          Về Trang chủ
        </button>

        <div className="w-full max-w-md space-y-8">
          
          {/* Header titles */}
          <div className="space-y-2">
            <h1 className="text-2xl md:text-3xl font-extrabold text-slate-950 tracking-tight">
              Chào mừng quay trở lại
            </h1>
            <p className="text-xs font-semibold text-slate-500">
              Đăng nhập tài khoản để đặt sân đua và quản lý phiên chơi của bạn.
            </p>
          </div>

          {/* ROLE SELECTOR GRID */}
          <div className="space-y-2">
            <Label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Đăng nhập với tư cách</Label>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
              {[
                { key: "customer", label: "Người chơi", icon: User },
                { key: "staff", label: "Nhân viên", icon: Car },
                { key: "provider", label: "Chủ quán", icon: Briefcase },
                { key: "admin", label: "Quản trị", icon: ShieldAlert }
              ].map(role => {
                const RoleIcon = role.icon
                const isSelected = selectedRole === role.key
                return (
                  <button 
                    key={role.key}
                    type="button"
                    onClick={() => setSelectedRole(role.key as "customer" | "staff" | "provider" | "admin")}
                    className={`py-2.5 px-3 rounded-xl border text-xs font-bold transition-all duration-200 flex flex-col items-center gap-1.5 ${isSelected ? 'border-orange-500 bg-orange-50 text-orange-700 shadow-sm shadow-orange-500/10' : 'border-slate-200 text-slate-600 hover:border-slate-300 hover:bg-slate-50'}`}
                  >
                    <RoleIcon className={`h-4 w-4 ${isSelected ? 'text-orange-600' : 'text-slate-400'}`} />
                    {role.label}
                  </button>
                )
              })}
            </div>
          </div>

          {/* LOGIN FORM */}
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
            
            {/* Input Email/Phone */}
            <div className="space-y-1.5">
              <Label htmlFor="email" className="text-xs font-bold text-slate-700">Email hoặc Số điện thoại</Label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                  <Mail className="h-4.5 w-4.5" />
                </div>
                <Input 
                  id="email" 
                  type="text" 
                  placeholder="name@example.com hoặc 0987654321" 
                  className={`pl-10 h-11 rounded-xl border-slate-200 focus:border-orange-500 focus:ring-orange-500/20 bg-white ${errors.email ? 'border-red-500 focus:border-red-500' : ''}`}
                  {...register("email")}
                />
              </div>
              {errors.email && (
                <p className="text-[11px] font-bold text-red-500 flex items-center gap-1">
                  {errors.email.message}
                </p>
              )}
            </div>

            {/* Input Password */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <Label htmlFor="password" className="text-xs font-bold text-slate-700">Mật khẩu</Label>
                <Link to="/auth/forgot-password" className="text-xs font-bold text-orange-600 hover:text-orange-700 transition-colors">
                  Quên mật khẩu?
                </Link>
              </div>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                  <Lock className="h-4.5 w-4.5" />
                </div>
                <Input 
                  id="password" 
                  type={showPassword ? "text" : "password"} 
                  placeholder="••••••••" 
                  className={`pl-10 pr-10 h-11 rounded-xl border-slate-200 focus:border-orange-500 focus:ring-orange-500/20 ${errors.password ? 'border-red-500 focus:border-red-500' : ''}`}
                  {...register("password")}
                />
                <button 
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-slate-400 hover:text-slate-600 focus:outline-none"
                >
                  {showPassword ? <EyeOff className="h-4.5 w-4.5" /> : <Eye className="h-4.5 w-4.5" />}
                </button>
              </div>
              {errors.password && (
                <p className="text-[11px] font-bold text-red-500 flex items-center gap-1">
                  {errors.password.message}
                </p>
              )}
            </div>

            {/* Remember Me checkbox */}
            <div className="flex items-center gap-2 select-none">
              <Checkbox 
                id="rememberMe" 
                className="border-slate-300 data-[state=checked]:bg-orange-500 data-[state=checked]:border-orange-500"
                onCheckedChange={() => {
                  // Direct mapping as needed
                }}
              />
              <Label htmlFor="rememberMe" className="text-xs font-bold text-slate-600 cursor-pointer">
                Ghi nhớ tài khoản này trên thiết bị
              </Label>
            </div>

            {/* Submit Button */}
            <Button 
              type="submit" 
              disabled={isLoading}
              className="w-full bg-slate-950 hover:bg-slate-900 text-white font-bold h-11 rounded-xl shadow-md flex items-center justify-center gap-2 group transition-all"
            >
              {isLoading ? (
                <>
                  <span className="h-4 w-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Đang xử lý đăng nhập...
                </>
              ) : (
                <>
                  Đăng Nhập
                  <Zap className="h-4 w-4 text-orange-400 group-hover:scale-110 transition-transform fill-current" />
                </>
              )}
            </Button>

          </form>

          {/* Social Sign In Divider */}
          <div className="relative my-6 text-center">
            <span className="absolute inset-x-0 top-1/2 -translate-y-1/2 h-[1px] bg-slate-200/80" />
            <span className="relative bg-white px-3 text-[10px] font-extrabold text-slate-400 uppercase tracking-widest">
              Hoặc tiếp tục với
            </span>
          </div>

          {/* Google Sign-in */}
          <Button 
            variant="outline" 
            className="w-full border-slate-200 hover:bg-slate-50 font-bold h-11 rounded-xl text-slate-700 flex items-center justify-center gap-2.5"
            onClick={() => {
              toast.info("Đăng nhập bằng tài khoản Google đang được phát triển.")
            }}
          >
            {/* Simple colored SVG Google Logo */}
            <svg className="h-4.5 w-4.5" viewBox="0 0 24 24" fill="none">
              <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
              <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
              <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" fill="#FBBC05"/>
              <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" fill="#EA4335"/>
            </svg>
            Google
          </Button>

          {/* Go to Signup */}
          <p className="text-center text-xs font-semibold text-slate-500">
            Bạn chưa có tài khoản?{" "}
            <Link to="/auth/register" className="text-orange-600 hover:text-orange-700 font-extrabold hover:underline">
              Đăng ký tại đây
            </Link>
          </p>

        </div>
      </div>

    </div>
  )
}
