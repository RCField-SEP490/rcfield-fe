import { useEffect, useState, type FormEvent } from "react"
import { Eye, EyeOff, Copy, Check, Sparkles, AlertCircle } from "lucide-react"
import { toast } from "sonner"

import type { BackendCafe } from "@/features/cafes/types"
import type { StaffUser, StaffCreateBody } from "@/features/staff/types"
import { Button } from "@/shared/ui/button"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/shared/ui/dialog"
import { Input } from "@/shared/ui/input"
import { Label } from "@/shared/ui/label"
import { Checkbox } from "@/shared/ui/checkbox"

type ProviderStaffFormDialogProps = {
  open: boolean
  staff: StaffUser | null // null means Creation mode
  cafes: BackendCafe[]
  isPending: boolean
  onOpenChange: (open: boolean) => void
  onSubmit: (values: StaffCreateBody) => Promise<unknown>
}

const VN_PHONE_REGEX = /^(0|84)(3|5|7|8|9)[0-9]{8}$/
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

function generateRandomPassword() {
  const chars = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*"
  let pass = "RCF-"
  for (let i = 0; i < 8; i++) {
    pass += chars.charAt(Math.floor(Math.random() * chars.length))
  }
  return pass
}

export function ProviderStaffFormDialog({
  open,
  staff,
  cafes,
  isPending,
  onOpenChange,
  onSubmit,
}: ProviderStaffFormDialogProps) {
  // Form states
  const [fullName, setFullName] = useState("")
  const [email, setEmail] = useState("")
  const [phone, setPhone] = useState("")
  const [cafeId, setCafeId] = useState("")
  const [password, setPassword] = useState("")
  const [showPassword, setShowPassword] = useState(false)
  const [autoGeneratePassword, setAutoGeneratePassword] = useState(true)

  // Creation Success State (displays credentials once)
  const [createdCredentials, setCreatedCredentials] = useState<{
    email: string
    password: string
    fullName: string
    cafeName: string
  } | null>(null)

  const [copied, setCopied] = useState(false)
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [apiError, setApiError] = useState<string | null>(null)

  // Reset form when dialog opens/closes/changes mode
  useEffect(() => {
    if (!open) {
      setCreatedCredentials(null)
      setErrors({})
      setApiError(null)
      return
    }

    if (!staff) {
      // Creation Mode
      setFullName("")
      setEmail("")
      setPhone("")
      setCafeId(cafes[0]?.id ?? "")
      const initialPass = generateRandomPassword()
      setPassword(initialPass)
      setAutoGeneratePassword(true)
      setShowPassword(false)
    } else {
      // Edit Mode
      setFullName(staff.fullName)
      setEmail(staff.email)
      setPhone(staff.phone ?? "")
      setCafeId(staff.cafeId)
      setPassword("")
    }
  }, [staff, open, cafes])

  // Handle password generation toggle
  useEffect(() => {
    if (!staff && autoGeneratePassword) {
      setPassword(generateRandomPassword())
    }
  }, [autoGeneratePassword, staff])

  const validate = () => {
    const newErrors: Record<string, string> = {}

    if (fullName.trim().length < 2 || fullName.trim().length > 255) {
      newErrors.fullName = "Họ và tên phải từ 2 đến 255 ký tự"
    }

    const cleanEmail = email.trim()
    if (!cleanEmail) {
      newErrors.email = "Email là bắt buộc"
    } else if (cleanEmail.length > 255) {
      newErrors.email = "Email không được vượt quá 255 ký tự"
    } else if (!EMAIL_REGEX.test(cleanEmail)) {
      newErrors.email = "Email không hợp lệ"
    }

    if (phone.trim()) {
      if (!VN_PHONE_REGEX.test(phone.trim())) {
        newErrors.phone = "Số điện thoại Việt Nam không hợp lệ (ví dụ: 0901234567)"
      }
    }

    if (!staff) {
      if (password.length < 6 || password.length > 100) {
        newErrors.password = "Mật khẩu phải từ 6 đến 100 ký tự"
      }
      if (!cafeId) {
        newErrors.cafeId = "Cơ sở trực thuộc là bắt buộc"
      }
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleFormSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setApiError(null)

    if (!validate()) return

    try {
      const payload: StaffCreateBody = {
        cafe_id: cafeId,
        full_name: fullName.trim(),
        email: email.trim().toLowerCase(),
        phone: phone.trim() || null,
      }

      if (!staff) {
        payload.password = password
      }

      await onSubmit(payload)

      if (!staff) {
        // Find assigned cafe name
        const cafeName = cafes.find(c => c.id === cafeId)?.name ?? "Cơ sở đã chọn"
        setCreatedCredentials({
          email: email.trim().toLowerCase(),
          password: password,
          fullName: fullName.trim(),
          cafeName: cafeName
        })
      } else {
        // Edit flow completes directly
        onOpenChange(false)
      }
    } catch (error: any) {
      const code = error?.response?.data?.code
      const msg = error?.response?.data?.message

      if (code === "EMAIL_ALREADY_EXISTS") {
        setErrors(prev => ({ ...prev, email: "Email này đã tồn tại trên hệ thống." }))
      } else if (code === "ACCOUNT_NOT_ACTIVE") {
        setApiError("Tài khoản Provider của bạn chưa được kích hoạt hoặc đang bị khoá.")
      } else if (code === "CAFE_NOT_FOUND") {
        setApiError("Cơ sở đã chọn không tồn tại hoặc không thuộc quyền quản lý của bạn.")
      } else if (code === "VALIDATION_ERROR") {
        setApiError("Dữ liệu nhập vào không hợp lệ theo quy định hệ thống.")
      } else {
        setApiError(msg ?? "Đã xảy ra lỗi không xác định. Vui lòng thử lại.")
      }
    }
  }

  const copyToClipboard = async () => {
    if (!createdCredentials) return
    const text = `Tài khoản nhân viên RCField của bạn đã được tạo!
-------------------------------------------
Họ và tên: ${createdCredentials.fullName}
Cơ sở: ${createdCredentials.cafeName}
Email: ${createdCredentials.email}
Mật khẩu: ${createdCredentials.password}
-------------------------------------------
Vui lòng đăng nhập tại hệ thống RCField.`

    try {
      await navigator.clipboard.writeText(text)
      setCopied(true)
      toast.success("Đã sao chép thông tin tài khoản!")
      setTimeout(() => setCopied(false), 2000)
    } catch {
      toast.error("Không thể sao chép tự động.")
    }
  }

  // If successfully created staff, display details and copy screen
  if (createdCredentials) {
    return (
      <Dialog open={open} onOpenChange={(val) => { if (!val) onOpenChange(false) }}>
        <DialogContent className="max-w-lg rounded-xl bg-white p-6 shadow-xl border-none">
          <DialogHeader className="text-center">
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-emerald-100 text-emerald-600 mb-3">
              <Check className="h-6 w-6" />
            </div>
            <DialogTitle className="text-xl font-bold text-slate-900">Tạo tài khoản thành công!</DialogTitle>
            <DialogDescription className="text-sm font-medium text-slate-500 mt-1">
              Nhân viên mới đã được thêm vào cơ sở thành công. Hãy sao chép thông tin dưới đây để gửi cho nhân viên.
            </DialogDescription>
          </DialogHeader>

          <div className="mt-4 rounded-xl border border-slate-100 bg-slate-50 p-4 space-y-3 font-sans text-xs">
            <div className="flex justify-between py-1.5 border-b border-slate-200/50">
              <span className="font-bold text-slate-500">HỌ VÀ TÊN</span>
              <span className="font-extrabold text-slate-900">{createdCredentials.fullName}</span>
            </div>
            <div className="flex justify-between py-1.5 border-b border-slate-200/50">
              <span className="font-bold text-slate-500">CƠ SỞ</span>
              <span className="font-extrabold text-slate-900">{createdCredentials.cafeName}</span>
            </div>
            <div className="flex justify-between py-1.5 border-b border-slate-200/50">
              <span className="font-bold text-slate-500">EMAIL ĐĂNG NHẬP</span>
              <span className="font-extrabold text-slate-900 select-all">{createdCredentials.email}</span>
            </div>
            <div className="flex justify-between py-1.5 items-center">
              <span className="font-bold text-slate-500">MẬT KHẨU TẠM</span>
              <span className="font-mono font-black text-orange-600 bg-orange-50 px-2 py-0.5 rounded border border-orange-100 select-all">
                {createdCredentials.password}
              </span>
            </div>
          </div>

          <div className="mt-4 flex flex-col gap-2">
            <Button
              type="button"
              onClick={copyToClipboard}
              className="w-full flex items-center justify-center gap-2 bg-slate-950 text-white font-bold h-10 hover:bg-slate-900 transition-colors"
            >
              {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
              {copied ? "Đã sao chép!" : "Sao chép thông tin gửi nhân viên"}
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              className="w-full h-10 font-bold border-slate-200 text-slate-700 hover:bg-slate-50"
            >
              Hoàn tất & Đóng
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    )
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[95svh] max-w-2xl overflow-y-auto rounded-2xl bg-white p-0 shadow-2xl border-none">
        <form onSubmit={handleFormSubmit}>
          <DialogHeader className="border-b border-slate-100 px-6 py-5">
            <DialogTitle className="text-xl font-bold text-slate-900">
              {staff ? "Cập nhật nhân viên" : "Mời nhân viên mới"}
            </DialogTitle>
            <DialogDescription className="text-xs font-semibold text-slate-500 mt-1">
              {staff 
                ? "Chỉnh sửa thông tin cơ bản và phân công cơ sở làm việc." 
                : "Tạo tài khoản STAFF được gán vào cơ sở quản lý của bạn."}
            </DialogDescription>
          </DialogHeader>

          {/* Form Content */}
          <div className="space-y-4 px-6 py-5">
            {apiError && (
              <div className="flex items-start gap-2.5 rounded-xl bg-red-50 border border-red-100 p-3.5 text-xs text-red-700 font-semibold">
                <AlertCircle className="h-4.5 w-4.5 shrink-0 text-red-500 mt-0.5" />
                <span>{apiError}</span>
              </div>
            )}

            {/* Input Name */}
            <div className="space-y-1.5">
              <Label htmlFor="fullName" className="text-xs font-bold text-slate-700">Họ và tên *</Label>
              <Input
                id="fullName"
                value={fullName}
                placeholder="Nguyễn Văn A"
                onChange={(e) => setFullName(e.target.value)}
                className={`rounded-xl border-slate-200 focus:ring-slate-900/10 focus:border-slate-900 ${errors.fullName ? "border-red-500 focus:border-red-500" : ""}`}
              />
              {errors.fullName && <p className="text-[10px] font-bold text-red-500">{errors.fullName}</p>}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Input Email */}
              <div className="space-y-1.5">
                <Label htmlFor="email" className="text-xs font-bold text-slate-700">Email *</Label>
                <Input
                  id="email"
                  type="email"
                  value={email}
                  placeholder="staff@rcfield.vn"
                  onChange={(e) => setEmail(e.target.value)}
                  className={`rounded-xl border-slate-200 focus:ring-slate-900/10 focus:border-slate-900 ${errors.email ? "border-red-500 focus:border-red-500" : ""}`}
                />
                {errors.email && <p className="text-[10px] font-bold text-red-500">{errors.email}</p>}
              </div>

              {/* Input Phone */}
              <div className="space-y-1.5">
                <Label htmlFor="phone" className="text-xs font-bold text-slate-700">Số điện thoại (VN)</Label>
                <Input
                  id="phone"
                  value={phone}
                  placeholder="0901234567"
                  onChange={(e) => setPhone(e.target.value)}
                  className={`rounded-xl border-slate-200 focus:ring-slate-900/10 focus:border-slate-900 ${errors.phone ? "border-red-500 focus:border-red-500" : ""}`}
                />
                {errors.phone && <p className="text-[10px] font-bold text-red-500">{errors.phone}</p>}
              </div>
            </div>

            {/* Select Cafe */}
            <div className="space-y-1.5">
              <Label htmlFor="cafeId" className="text-xs font-bold text-slate-700">Cơ sở trực thuộc *</Label>
              <select
                id="cafeId"
                value={cafeId}
                onChange={(e) => setCafeId(e.target.value)}
                className={`w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm font-semibold text-slate-800 transition-colors focus:border-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-900/10 ${errors.cafeId ? "border-red-500" : ""}`}
              >
                <option value="" disabled>-- Chọn cơ sở --</option>
                {cafes.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name} ({c.district}, {c.city})
                  </option>
                ))}
              </select>
              {errors.cafeId && <p className="text-[10px] font-bold text-red-500">{errors.cafeId}</p>}
            </div>

            {/* Password Section (Creation mode only) */}
            {!staff && (
              <div className="rounded-xl border border-slate-100 bg-slate-50 p-4 space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 select-none">
                    <Checkbox
                      id="autoGenPass"
                      checked={autoGeneratePassword}
                      onCheckedChange={(checked) => setAutoGeneratePassword(checked === true)}
                      className="border-slate-300 data-[state=checked]:bg-slate-950 data-[state=checked]:border-slate-950"
                    />
                    <Label htmlFor="autoGenPass" className="text-xs font-bold text-slate-700 cursor-pointer flex items-center gap-1">
                      Tự động tạo mật khẩu mạnh
                      <Sparkles className="h-3.5 w-3.5 text-amber-500" />
                    </Label>
                  </div>
                </div>

                {!autoGeneratePassword && (
                  <div className="space-y-1.5">
                    <Label htmlFor="passInput" className="text-xs font-bold text-slate-700">Mật khẩu *</Label>
                    <div className="relative">
                      <Input
                        id="passInput"
                        type={showPassword ? "text" : "password"}
                        value={password}
                        placeholder="Mật khẩu tối thiểu 6 ký tự"
                        onChange={(e) => setPassword(e.target.value)}
                        className={`rounded-xl border-slate-200 pr-10 focus:ring-slate-900/10 focus:border-slate-900 ${errors.password ? "border-red-500 focus:border-red-500" : ""}`}
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-slate-400 hover:text-slate-600 focus:outline-none"
                      >
                        {showPassword ? <EyeOff className="h-4.5 w-4.5" /> : <Eye className="h-4.5 w-4.5" />}
                      </button>
                    </div>
                    {errors.password && <p className="text-[10px] font-bold text-red-500">{errors.password}</p>}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Footer Actions */}
          <DialogFooter className="border-t border-slate-100 px-6 py-4 bg-slate-50/50 flex gap-2">
            <Button
              type="button"
              variant="outline"
              disabled={isPending}
              onClick={() => onOpenChange(false)}
              className="h-10 border-slate-200 text-slate-700 font-bold hover:bg-slate-50"
            >
              Hủy
            </Button>
            <Button
              type="submit"
              disabled={isPending}
              className="h-10 bg-slate-950 text-white font-bold hover:bg-slate-900"
            >
              {isPending ? "Đang xử lý..." : staff ? "Lưu thay đổi" : "Tạo nhân viên"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
