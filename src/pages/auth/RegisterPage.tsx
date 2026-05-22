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
  User, 
  Phone, 
  ChevronLeft, 
  Car, 
  Briefcase,
  Sparkles,
  CheckCircle2
} from "lucide-react"

import { Button } from "@/shared/ui/button"
import { Input } from "@/shared/ui/input"
import { Label } from "@/shared/ui/label"
import { Checkbox } from "@/shared/ui/checkbox"
import { toast } from "sonner"

// Zod Schema for Registration validation
const registerSchema = z.object({
  fullName: z.string().min(2, { message: "Họ và tên phải chứa ít nhất 2 ký tự" }),
  email: z.string().email({ message: "Địa chỉ email không hợp lệ" }),
  phoneNumber: z.string()
    .regex(/(84|0[3|5|7|8|9])+([0-9]{8})\b/, { message: "Số điện thoại không đúng định dạng Việt Nam" }),
  password: z.string().min(6, { message: "Mật khẩu phải chứa ít nhất 6 ký tự" }),
  confirmPassword: z.string().min(6, { message: "Vui lòng nhập lại mật khẩu xác nhận" }),
  agreeToTerms: z.boolean().refine(val => val === true, {
    message: "Bạn phải đồng ý với Điều khoản & Chính sách bảo mật"
  })
}).refine((data) => data.password === data.confirmPassword, {
  message: "Mật khẩu xác nhận không trùng khớp",
  path: ["confirmPassword"], // Highlight confirmPassword input field on failure
})

type RegisterFormValues = z.infer<typeof registerSchema>

const rotatingBanners = [
  {
    title: "Trải Nghiệm Đua Xe Đỉnh Cao",
    desc: "Đăng ký để đặt chỗ sân đua, thuê các dòng xe cao cấp và lưu trữ lịch sử đua chuyên nghiệp.",
    icon: Car,
    color: "from-orange-500 to-red-500"
  },
  {
    title: "Số Hóa Cơ Sở RC Cafe",
    desc: "Tham gia với tư cách đối tác để vận hành sân đua rảnh tay, quản lý gói hội viên và tăng tối đa doanh thu.",
    icon: Briefcase,
    color: "from-indigo-500 to-blue-500"
  }
]

export function RegisterPage() {
  const navigate = useNavigate()
  const [isLoading, setIsLoading] = useState(false)
  const [selectedRole, setSelectedRole] = useState<"customer" | "provider">("customer")
  const [bannerIndex, setBannerIndex] = useState(0)

  // Rotate highlight banners
  useEffect(() => {
    const interval = setInterval(() => {
      setBannerIndex(prev => (prev + 1) % rotatingBanners.length)
    }, 5000)
    return () => clearInterval(interval)
  }, [])

  const { register, handleSubmit, formState: { errors } } = useForm<RegisterFormValues>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      fullName: "",
      email: "",
      phoneNumber: "",
      password: "",
      confirmPassword: "",
      agreeToTerms: false
    }
  })

  const onSubmit = (data: RegisterFormValues) => {
    setIsLoading(true)
    
    // Simulate Registration API
    setTimeout(() => {
      setIsLoading(false)
      toast.success("Đăng ký tài khoản thành công!", {
        description: `Chào mừng ${data.fullName} tham gia cộng đồng RCField!`
      })
      navigate("/auth/login")
    }, 1500)
  }

  const ActiveIcon = rotatingBanners[bannerIndex].icon

  return (
    <div className="min-h-screen bg-slate-50 flex items-stretch overflow-hidden font-sans">
      
      {/* LEFT SPLIT BREATHTAKING PANEL */}
      <div className="hidden lg:flex lg:w-1/2 bg-slate-950 text-white relative flex-col justify-between p-12 overflow-hidden select-none">
        
        {/* Glow Effects */}
        <div className="absolute top-[-20%] left-[-20%] w-[600px] h-[600px] rounded-full bg-orange-600/15 blur-[120px] pointer-events-none" />
        <div className="absolute bottom-[-20%] right-[-20%] w-[600px] h-[600px] rounded-full bg-indigo-600/15 blur-[120px] pointer-events-none" />

        {/* Brand logo link */}
        <Link to="/" className="flex items-center gap-2 group self-start relative z-10">
          <div className="h-9 w-9 rounded-lg bg-gradient-to-br from-orange-500 to-red-600 flex items-center justify-center text-white shadow-md shadow-orange-500/20 group-hover:scale-105 transition-transform">
            <Zap className="h-4.5 w-4.5 fill-current" />
          </div>
          <span className="text-lg font-black tracking-tight text-white">
            RCField
          </span>
        </Link>

        {/* Rotating animated showcase content */}
        <div className="relative z-10 my-auto max-w-md space-y-8">
          <AnimatePresence mode="wait">
            <motion.div 
              key={bannerIndex}
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              transition={{ duration: 0.5 }}
              className="space-y-6"
            >
              <div className={`inline-flex h-12 w-12 rounded-2xl bg-gradient-to-br ${rotatingBanners[bannerIndex].color} items-center justify-center text-white shadow-lg`}>
                <ActiveIcon className="h-6 w-6" />
              </div>
              <div className="space-y-3">
                <h2 className="text-2xl md:text-3xl font-extrabold tracking-tight leading-tight">
                  {rotatingBanners[bannerIndex].title}
                </h2>
                <p className="text-sm font-medium leading-relaxed text-slate-400">
                  {rotatingBanners[bannerIndex].desc}
                </p>
              </div>
            </motion.div>
          </AnimatePresence>

          {/* Stepper Dots Indicator */}
          <div className="flex items-center gap-2">
            {rotatingBanners.map((_, idx) => (
              <button 
                key={idx}
                className={`h-2 rounded-full transition-all ${bannerIndex === idx ? 'w-8 bg-orange-500' : 'w-2 bg-slate-800'}`}
                onClick={() => setBannerIndex(idx)}
              />
            ))}
          </div>

          {/* Value Checklist */}
          <div className="pt-6 border-t border-slate-900 space-y-2 text-xs font-semibold text-slate-400">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4 text-emerald-500" />
              Tạo tài khoản cá nhân & đội đua hoàn toàn miễn phí
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4 text-emerald-500" />
              Tích hợp Serious Inspection giải quyết tranh chấp thông minh
            </div>
          </div>
        </div>

        {/* Footer legal */}
        <div className="relative z-10 text-[10px] font-bold text-slate-500 flex items-center justify-between">
          <span>Khám phá & Chinh phục Đường đua RC</span>
          <span>© 2024 RCField</span>
        </div>
      </div>

      {/* RIGHT SPLIT FORM PANEL */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-6 md:p-12 bg-white relative overflow-y-auto">
        
        {/* Mobile Go Back button */}
        <button 
          onClick={() => navigate("/")}
          className="absolute top-6 left-6 inline-flex items-center gap-1 text-xs font-bold text-slate-500 hover:text-slate-900 transition-colors"
        >
          <ChevronLeft className="h-4 w-4" />
          Về Trang chủ
        </button>

        <div className="w-full max-w-md space-y-6 pt-10 pb-8">
          
          {/* Heading */}
          <div className="space-y-2">
            <h1 className="text-2xl md:text-3xl font-extrabold text-slate-950 tracking-tight">
              Đăng ký tài khoản mới
            </h1>
            <p className="text-xs font-semibold text-slate-500">
              Nhập đầy đủ thông tin cá nhân của bạn để trải nghiệm hệ sinh thái RC chuyên nghiệp.
            </p>
          </div>

          {/* ROLE SELECTOR GRID */}
          <div className="space-y-2">
            <Label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Vai trò đăng ký</Label>
            <div className="grid grid-cols-2 gap-3">
              {[
                { key: "customer", label: "Người chơi (Customer)", icon: Car, desc: "Đặt sân & lái xe thuê" },
                { key: "provider", label: "Chủ quán (Provider)", icon: Briefcase, desc: "Số hóa vận hành sân" }
              ].map(role => {
                const RoleIcon = role.icon
                const isSelected = selectedRole === role.key
                return (
                  <button 
                    key={role.key}
                    type="button"
                    onClick={() => setSelectedRole(role.key as any)}
                    className={`py-3 px-4 rounded-xl border text-left transition-all flex flex-col gap-1.5 ${isSelected ? 'border-orange-500 bg-orange-50 text-orange-950 shadow-sm shadow-orange-500/5' : 'border-slate-200 text-slate-600 hover:border-slate-300'}`}
                  >
                    <div className="flex items-center justify-between w-full">
                      <RoleIcon className={`h-5 w-5 ${isSelected ? 'text-orange-600' : 'text-slate-400'}`} />
                      {isSelected && <span className="h-2 w-2 rounded-full bg-orange-600" />}
                    </div>
                    <div>
                      <p className="text-xs font-bold leading-none">{role.label}</p>
                      <p className="text-[10px] font-medium text-slate-400 mt-1">{role.desc}</p>
                    </div>
                  </button>
                )
              })}
            </div>
          </div>

          {/* SIGNUP FORM */}
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            
            {/* Input FullName */}
            <div className="space-y-1.5">
              <Label htmlFor="fullName" className="text-xs font-bold text-slate-700">Họ và tên</Label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                  <User className="h-4.5 w-4.5" />
                </div>
                <Input 
                  id="fullName" 
                  type="text" 
                  placeholder="Nguyễn Văn A" 
                  className={`pl-10 h-11 rounded-xl border-slate-200 focus:border-orange-500 focus:ring-orange-500/20 ${errors.fullName ? 'border-red-500 focus:border-red-500' : ''}`}
                  {...register("fullName")}
                />
              </div>
              {errors.fullName && (
                <p className="text-[11px] font-bold text-red-500">{errors.fullName.message}</p>
              )}
            </div>

            {/* Input Email */}
            <div className="space-y-1.5">
              <Label htmlFor="email" className="text-xs font-bold text-slate-700">Email</Label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                  <Mail className="h-4.5 w-4.5" />
                </div>
                <Input 
                  id="email" 
                  type="email" 
                  placeholder="name@example.com" 
                  className={`pl-10 h-11 rounded-xl border-slate-200 focus:border-orange-500 focus:ring-orange-500/20 ${errors.email ? 'border-red-500 focus:border-red-500' : ''}`}
                  {...register("email")}
                />
              </div>
              {errors.email && (
                <p className="text-[11px] font-bold text-red-500">{errors.email.message}</p>
              )}
            </div>

            {/* Input Phone */}
            <div className="space-y-1.5">
              <Label htmlFor="phoneNumber" className="text-xs font-bold text-slate-700">Số điện thoại</Label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                  <Phone className="h-4.5 w-4.5" />
                </div>
                <Input 
                  id="phoneNumber" 
                  type="tel" 
                  placeholder="0987654321" 
                  className={`pl-10 h-11 rounded-xl border-slate-200 focus:border-orange-500 focus:ring-orange-500/20 ${errors.phoneNumber ? 'border-red-500 focus:border-red-500' : ''}`}
                  {...register("phoneNumber")}
                />
              </div>
              {errors.phoneNumber && (
                <p className="text-[11px] font-bold text-red-500">{errors.phoneNumber.message}</p>
              )}
            </div>

            {/* Password */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label htmlFor="password" className="text-xs font-bold text-slate-700">Mật khẩu</Label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                    <Lock className="h-4.5 w-4.5" />
                  </div>
                  <Input 
                    id="password" 
                    type="password" 
                    placeholder="••••••••" 
                    className={`pl-10 h-11 rounded-xl border-slate-200 focus:border-orange-500 focus:ring-orange-500/20 ${errors.password ? 'border-red-500 focus:border-red-500' : ''}`}
                    {...register("password")}
                  />
                </div>
                {errors.password && (
                  <p className="text-[11px] font-bold text-red-500">{errors.password.message}</p>
                )}
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="confirmPassword" className="text-xs font-bold text-slate-700">Xác nhận</Label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                    <Lock className="h-4.5 w-4.5" />
                  </div>
                  <Input 
                    id="confirmPassword" 
                    type="password" 
                    placeholder="••••••••" 
                    className={`pl-10 h-11 rounded-xl border-slate-200 focus:border-orange-500 focus:ring-orange-500/20 ${errors.confirmPassword ? 'border-red-500 focus:border-red-500' : ''}`}
                    {...register("confirmPassword")}
                  />
                </div>
                {errors.confirmPassword && (
                  <p className="text-[11px] font-bold text-red-500">{errors.confirmPassword.message}</p>
                )}
              </div>
            </div>

            {/* Terms checkbox */}
            <div className="space-y-1">
              <div className="flex items-start gap-2.5 pt-1 select-none">
                <Checkbox 
                  id="agreeToTerms" 
                  className="mt-0.5 border-slate-300 data-[state=checked]:bg-orange-500 data-[state=checked]:border-orange-500"
                  onCheckedChange={() => {
                    // Handled automatically by hook form
                  }}
                  {...register("agreeToTerms")}
                />
                <Label htmlFor="agreeToTerms" className="text-xs font-bold text-slate-600 leading-tight cursor-pointer">
                  Tôi đồng ý với{" "}
                  <a href="#" className="text-orange-600 hover:underline">Điều khoản dịch vụ</a> và{" "}
                  <a href="#" className="text-orange-600 hover:underline">Chính sách bảo mật</a> của RCField.
                </Label>
              </div>
              {errors.agreeToTerms && (
                <p className="text-[11px] font-bold text-red-500">{errors.agreeToTerms.message}</p>
              )}
            </div>

            {/* Submit */}
            <Button 
              type="submit" 
              disabled={isLoading}
              className="w-full bg-slate-950 hover:bg-slate-900 text-white font-bold h-11 rounded-xl shadow-md flex items-center justify-center gap-2 group transition-all pt-1"
            >
              {isLoading ? (
                <>
                  <span className="h-4 w-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Đang thiết lập tài khoản...
                </>
              ) : (
                <>
                  Đăng Ký Thành Viên
                  <Sparkles className="h-4 w-4 text-orange-400 group-hover:scale-110 transition-transform" />
                </>
              )}
            </Button>

          </form>

          {/* Social Sign In Divider */}
          <div className="relative my-4 text-center">
            <span className="absolute inset-x-0 top-1/2 -translate-y-1/2 h-[1px] bg-slate-200/80" />
            <span className="relative bg-white px-3 text-[10px] font-extrabold text-slate-400 uppercase tracking-widest">
              Đã có tài khoản?
            </span>
          </div>

          {/* Go to Login */}
          <Button 
            variant="outline" 
            className="w-full border-slate-200 hover:bg-slate-50 font-bold h-11 rounded-xl text-slate-700"
            onClick={() => navigate("/auth/login")}
          >
            Quay lại Đăng nhập
          </Button>

        </div>
      </div>

    </div>
  )
}
