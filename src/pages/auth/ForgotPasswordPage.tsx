import { useState } from "react"
import { useNavigate, Link } from "react-router"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import * as z from "zod"
import { motion, AnimatePresence } from "framer-motion"
import { 
  Zap, 
  Mail, 
  ChevronLeft, 
  Send, 
  CheckCircle2, 
  ArrowRight 
} from "lucide-react"

import { Button } from "@/shared/ui/button"
import { Input } from "@/shared/ui/input"
import { Label } from "@/shared/ui/label"
import { toast } from "sonner"

const forgotPasswordSchema = z.object({
  email: z.string()
    .min(1, { message: "Vui lòng nhập địa chỉ email" })
    .email({ message: "Địa chỉ email không hợp lệ" })
})

type ForgotPasswordValues = z.infer<typeof forgotPasswordSchema>

export function ForgotPasswordPage() {
  const navigate = useNavigate()
  const [isLoading, setIsLoading] = useState(false)
  const [isSent, setIsSent] = useState(false)
  const [sentEmail, setSentEmail] = useState("")

  const { register, handleSubmit, formState: { errors } } = useForm<ForgotPasswordValues>({
    resolver: zodResolver(forgotPasswordSchema),
    defaultValues: { email: "" }
  })

  const onSubmit = (data: ForgotPasswordValues) => {
    setIsLoading(true)
    
    // Simulate API request
    setTimeout(() => {
      setIsLoading(false)
      setIsSent(true)
      setSentEmail(data.email)
      toast.success("Đã gửi mã đặt lại mật khẩu thành công!", {
        description: `Vui lòng kiểm tra hộp thư đến tại ${data.email}.`
      })
    }, 1500)
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col justify-center items-center p-6 relative font-sans">
      
      {/* Background glowing rings */}
      <div className="absolute top-[10%] left-[10%] w-[450px] h-[450px] rounded-full bg-orange-600/10 blur-[120px] pointer-events-none" />
      <div className="absolute bottom-[10%] right-[10%] w-[450px] h-[450px] rounded-full bg-indigo-600/10 blur-[120px] pointer-events-none" />

      {/* Brand logo header */}
      <Link to="/" className="flex items-center gap-2 group mb-8 relative z-10">
        <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-orange-500 to-red-600 flex items-center justify-center text-white shadow-md shadow-orange-500/20 group-hover:scale-105 transition-transform">
          <Zap className="h-5 w-5 fill-current" />
        </div>
        <span className="text-xl font-black tracking-tight text-white">
          RCField
        </span>
      </Link>

      <div className="w-full max-w-md relative z-10">
        
        {/* BACK TO LOGIN */}
        <button 
          onClick={() => navigate("/auth/login")}
          className="mb-4 inline-flex items-center gap-1 text-xs font-bold text-slate-400 hover:text-white transition-colors"
        >
          <ChevronLeft className="h-4 w-4" />
          Quay lại Đăng nhập
        </button>

        <div className="bg-slate-900 border border-slate-800/80 rounded-2xl p-6 md:p-8 shadow-2xl space-y-6">
          
          <AnimatePresence mode="wait">
            {!isSent ? (
              <motion.div 
                key="form"
                initial={{ opacity: 0, scale: 0.98 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.98 }}
                transition={{ duration: 0.2 }}
                className="space-y-6"
              >
                
                {/* Intro Title */}
                <div className="space-y-2 text-center md:text-left">
                  <h1 className="text-2xl font-extrabold text-white tracking-tight">
                    Khôi phục mật khẩu
                  </h1>
                  <p className="text-xs font-semibold text-slate-400 leading-relaxed">
                    Nhập địa chỉ email đăng ký của bạn. Chúng tôi sẽ gửi hướng dẫn thiết lập mật khẩu mới ngay lập tức.
                  </p>
                </div>

                {/* Reset Form */}
                <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                  <div className="space-y-1.5">
                    <Label htmlFor="email" className="text-xs font-bold text-slate-300">Địa chỉ Email</Label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-500">
                        <Mail className="h-4.5 w-4.5" />
                      </div>
                      <Input 
                        id="email" 
                        type="email" 
                        placeholder="name@example.com" 
                        className={`bg-slate-950 border-slate-800 text-white pl-10 h-11 rounded-xl focus:border-orange-500 focus:ring-orange-500/20 ${errors.email ? 'border-red-500 focus:border-red-500' : ''}`}
                        {...register("email")}
                      />
                    </div>
                    {errors.email && (
                      <p className="text-[11px] font-bold text-red-500">{errors.email.message}</p>
                    )}
                  </div>

                  <Button 
                    type="submit" 
                    disabled={isLoading}
                    className="w-full bg-orange-600 hover:bg-orange-700 text-white font-bold h-11 rounded-xl shadow-md shadow-orange-500/10 flex items-center justify-center gap-2 group transition-all"
                  >
                    {isLoading ? (
                      <>
                        <span className="h-4 w-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                        Đang truyền dữ liệu...
                      </>
                    ) : (
                      <>
                        Gửi Yêu Cầu Khôi Phục
                        <Send className="h-4 w-4 text-white group-hover:translate-x-0.5 transition-transform" />
                      </>
                    )}
                  </Button>
                </form>

              </motion.div>
            ) : (
              <motion.div 
                key="success"
                initial={{ opacity: 0, scale: 0.98 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.98 }}
                transition={{ duration: 0.2 }}
                className="space-y-6 text-center py-4"
              >
                
                {/* Success Circle */}
                <div className="mx-auto h-14 w-14 rounded-full bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center text-emerald-500">
                  <CheckCircle2 className="h-7 w-7" />
                </div>

                <div className="space-y-2">
                  <h2 className="text-xl font-extrabold text-white tracking-tight">
                    Kiểm tra hộp thư đến!
                  </h2>
                  <p className="text-xs font-semibold text-slate-400 leading-relaxed max-w-sm mx-auto">
                    Chúng tôi đã gửi một email chứa liên kết bảo mật để đặt lại mật khẩu đến <strong className="text-slate-200">{sentEmail}</strong>.
                  </p>
                </div>

                {/* Simulated Link Action for Flow Completeness */}
                <div className="p-3 bg-slate-950 rounded-xl border border-slate-800 text-left text-xs space-y-1">
                  <span className="font-bold text-orange-500 block uppercase text-[9px] tracking-wider">Mô phỏng Email</span>
                  <p className="text-slate-400 font-medium">Bấm vào đây để mô phỏng liên kết nhận được từ hòm thư của bạn:</p>
                  <Button 
                    variant="link" 
                    className="p-0 h-auto font-bold text-indigo-400 hover:text-indigo-300"
                    onClick={() => navigate("/auth/reset-password")}
                  >
                    Thiết lập mật khẩu mới <ArrowRight className="h-3.5 w-3.5 ml-1" />
                  </Button>
                </div>

                {/* Back Link */}
                <button 
                  onClick={() => setIsSent(false)}
                  className="text-xs font-bold text-slate-500 hover:text-slate-300 transition-colors"
                >
                  Tôi chưa nhận được email? Gửi lại
                </button>

              </motion.div>
            )}
          </AnimatePresence>

        </div>
      </div>

    </div>
  )
}
