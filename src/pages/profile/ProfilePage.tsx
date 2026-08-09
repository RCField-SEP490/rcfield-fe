import { useEffect, useRef, useState } from "react"
import { useNavigate } from "react-router"
import { toast } from "sonner"
import { Camera, Mail, Phone } from "lucide-react"

import { AdminShell } from "@/pages/admin/components/AdminShell"
import { AdminHeader } from "@/pages/admin/components/AdminPrimitives"
import { CustomerProfilePage } from "@/pages/customer/profile/CustomerProfilePage"
import { ProviderPageHeader } from "@/pages/provider/components/ProviderPrimitives"
import { ProviderShell } from "@/pages/provider/components/ProviderShell"
import { StaffShell } from "@/pages/staff/components/StaffShell"
import { StaffHeader } from "@/pages/staff/components/StaffUI"
import { StaffOperationContextProvider } from "@/pages/staff/context/StaffOperationContext"
import {
  getMe,
  updateMe,
  changePassword,
  logoutSession,
} from "@/features/auth/api/auth.api"
import { useAuthStore } from "@/features/auth/stores/auth.store"
import { uploadImage } from "@/features/uploads/api/upload.api"
import { cafeApi } from "@/features/cafes/api/cafe.api"
import type { BackendCafe } from "@/features/cafes/types"
import { PublicPageShell } from "@/shared/components/PublicPageShell"
import { storageKeys } from "@/shared/lib/storage"
import { subscriptionApi } from "@/features/subscriptions/api/subscription.api"
import type { ProviderDetail } from "@/features/subscriptions/types"
import { cn } from "@/shared/lib/utils"
import { Button } from "@/shared/ui/button"
import { Input } from "@/shared/ui/input"
import { Label } from "@/shared/ui/label"
import { Textarea } from "@/shared/ui/textarea"

export function ProfilePage() {
  const role = useAuthStore((state) => state.role)

  if (role === "provider") {
    return (
      <ProviderShell>
        <ProviderPageHeader
          title="Hồ sơ cá nhân"
          description="Quản lý thông tin tài khoản, doanh nghiệp và bảo mật."
        />
        <ProfileContent />
      </ProviderShell>
    )
  }

  if (role === "admin") {
    return (
      <AdminShell>
        <AdminHeader
          title="Hồ sơ cá nhân"
          description="Quản lý thông tin tài khoản, bảo mật và cấu hình hệ thống."
        />
        <ProfileContent />
      </AdminShell>
    )
  }

  if (role === "customer") {
    return (
      <PublicPageShell>
        <CustomerProfilePage />
      </PublicPageShell>
    )
  }

  if (role === "staff") {
    return (
      <StaffOperationContextProvider>
        <StaffShell>
          <StaffHeader
            title="Hồ sơ cá nhân"
            subtitle="Quản lý thông tin tài khoản và cấu hình cá nhân."
          />
          <ProfileContent />
        </StaffShell>
      </StaffOperationContextProvider>
    )
  }

  return (
    <div className="min-h-screen bg-[#fcf8f8]">
      <ProfileContent />
    </div>
  )
}

function ProfileContent() {
  const user = useAuthStore((state) => state.user)
  const role = useAuthStore((state) => state.role)
  const setUser = useAuthStore((state) => state.setUser)
  const clearAuthenticated = useAuthStore((state) => state.clearAuthenticated)
  const navigate = useNavigate()

  const [passwordForm, setPasswordForm] = useState({
    currentPassword: "",
    newPassword: "",
    confirmNewPassword: "",
  })
  const [resettingPassword, setResettingPassword] = useState(false)

  const handleLogout = async () => {
    const storedAuth =
      localStorage.getItem(storageKeys.auth) ??
      sessionStorage.getItem(storageKeys.auth)
    if (storedAuth) {
      try {
        const auth = JSON.parse(storedAuth) as {
          accessToken?: string
          refreshToken?: string
        }
        if (auth.accessToken && auth.refreshToken) {
          await logoutSession(auth.accessToken, auth.refreshToken)
        }
      } catch {
        // Best-effort remote logout; local session cleanup still runs below.
      }
    }
    clearAuthenticated()
    localStorage.removeItem(storageKeys.auth)
    sessionStorage.removeItem(storageKeys.auth)
    navigate("/login", { replace: true })
  }

  const handleResetPassword = async () => {
    if (!passwordForm.currentPassword) {
      toast.error("Vui lòng nhập mật khẩu hiện tại.")
      return
    }
    if (passwordForm.newPassword.length < 6) {
      toast.error("Mật khẩu mới phải có tối thiểu 6 ký tự.")
      return
    }
    if (passwordForm.newPassword !== passwordForm.confirmNewPassword) {
      toast.error("Mật khẩu mới nhập lại không khớp.")
      return
    }

    setResettingPassword(true)
    try {
      await changePassword({
        currentPassword: passwordForm.currentPassword,
        newPassword: passwordForm.newPassword,
      })
      toast.success("Đổi mật khẩu thành công. Vui lòng đăng nhập lại.")
      await handleLogout()
    } catch (e: unknown) {
      const msg =
        (e as { response?: { data?: { message?: string } } }).response?.data
          ?.message ||
        "Đổi mật khẩu thất bại. Vui lòng kiểm tra lại mật khẩu hiện tại."
      toast.error(msg)
    } finally {
      setResettingPassword(false)
    }
  }

  const [assignedCafe, setAssignedCafe] = useState<BackendCafe | null>(null)
  const [loadingCafe, setLoadingCafe] = useState(false)

  useEffect(() => {
    if (role === "staff" && user?.assignedCafeId) {
      queueMicrotask(() => setLoadingCafe(true))
      cafeApi
        .getCafe(user.assignedCafeId)
        .then((data) => queueMicrotask(() => setAssignedCafe(data)))
        .catch((err) =>
          console.error("Error loading cafe in staff profile", err),
        )
        .finally(() => queueMicrotask(() => setLoadingCafe(false)))
    }
  }, [role, user?.assignedCafeId])

  /*
    Khối này từng là dữ liệu cắm cứng: mọi provider đều thấy cùng một công ty,
    cùng một mã số thuế, cùng một số tài khoản. Nút "Lưu" chờ 500ms cho ra vẻ
    bận rồi ghi vào localStorage và báo thành công — đổi máy là mất sạch, mà
    backend thì chưa bao giờ nhận được gì.

    Khối "Tài khoản ngân hàng nhận doanh thu" bị gỡ hẳn: hệ thống không có bảng
    đối soát hay chi trả nào, nền tảng cũng không chia phần trăm booking. Giữ
    lại là ôm số tài khoản ngân hàng của provider cho một khoản chi không tồn tại.
  */
  const [businessForm, setBusinessForm] = useState({
    business_name: "",
    business_description: "",
    tax_code: "",
    business_email: "",
  })
  const [loadingBusiness, setLoadingBusiness] = useState(false)
  const [savingBusiness, setSavingBusiness] = useState(false)
  const [businessError, setBusinessError] = useState<string | null>(null)

  useEffect(() => {
    if (role !== "provider") return
    // queueMicrotask giống hệt effect tải chi nhánh của staff ở trên: đặt state
    // thẳng trong effect bị react-hooks/set-state-in-effect chặn.
    queueMicrotask(() => setLoadingBusiness(true))
    subscriptionApi
      .getProviderMe()
      .then((res: { data: ProviderDetail }) =>
        queueMicrotask(() =>
          setBusinessForm({
            business_name: res.data.business_name ?? "",
            business_description: res.data.business_description ?? "",
            tax_code: res.data.tax_code ?? "",
            business_email: res.data.business_email ?? "",
          }),
        ),
      )
      .catch((err: unknown) => {
        console.error("Error loading provider business profile", err)
        queueMicrotask(() =>
          setBusinessError("Không tải được thông tin doanh nghiệp."),
        )
      })
      .finally(() => queueMicrotask(() => setLoadingBusiness(false)))
  }, [role])

  const handleSaveBusiness = async () => {
    setSavingBusiness(true)
    setBusinessError(null)
    try {
      const updated = await subscriptionApi.updateProviderMe({
        business_name: businessForm.business_name.trim(),
        business_description: businessForm.business_description.trim() || null,
        tax_code: businessForm.tax_code.trim(),
        business_email: businessForm.business_email.trim(),
      })
      setBusinessForm({
        business_name: updated.business_name ?? "",
        business_description: updated.business_description ?? "",
        tax_code: updated.tax_code ?? "",
        business_email: updated.business_email ?? "",
      })
      toast.success("Đã cập nhật thông tin doanh nghiệp.")
    } catch (err) {
      // Backend nói rõ sai ở đâu (mã số thuế trùng, sai định dạng...) — hiện
      // đúng câu đó thay vì một dòng "Không thể lưu" chẳng giúp gì.
      const message =
        (err as { response?: { data?: { message?: string } } }).response?.data
          ?.message ?? "Không thể lưu thông tin."
      setBusinessError(message)
      toast.error(message)
    } finally {
      setSavingBusiness(false)
    }
  }

  const fileInputRef = useRef<HTMLInputElement | null>(null)

  const displayName = user?.fullName ?? user?.email ?? "RCField User"
  const email = user?.email ?? "user@rcfield.vn"
  const [firstName, lastName] = splitName(displayName)
  const [form, setForm] = useState({
    firstName,
    lastName,
    email,
    phone: user?.phone ?? "",
    avatarUrl: user?.avatarUrl ?? "",
  })
  const [saving, setSaving] = useState(false)
  const [uploading, setUploading] = useState(false)

  useEffect(() => {
    let mounted = true
    getMe()
      .then((profile) => {
        if (!mounted) return
        setUser(profile)
        persistUser(profile)
      })
      .catch(() => undefined)

    return () => {
      mounted = false
    }
  }, [setUser])

  useEffect(() => {
    queueMicrotask(() => {
      setForm({
        firstName,
        lastName,
        email,
        phone: user?.phone ?? "",
        avatarUrl: user?.avatarUrl ?? "",
      })
    })
  }, [email, firstName, lastName, user?.avatarUrl, user?.phone])

  const saveProfile = async (nextAvatarUrl = form.avatarUrl) => {
    setSaving(true)
    try {
      const profile = await updateMe({
        fullName: `${form.firstName} ${form.lastName}`.trim(),
        phone: form.phone.trim() || null,
        avatarUrl: nextAvatarUrl || null,
      })
      setUser({ ...profile, role: profile.role ?? role ?? "customer" })
      persistUser(profile)
      toast.success("Đã cập nhật hồ sơ.")
    } finally {
      setSaving(false)
    }
  }

  const handleAvatarChange = async (file: File | undefined) => {
    if (!file) return
    setUploading(true)
    try {
      const uploaded = await uploadImage(file, "profile-avatar")
      setForm((current) => ({ ...current, avatarUrl: uploaded.url }))
      await saveProfile(uploaded.url)
    } finally {
      setUploading(false)
    }
  }

  const isDashboardRole =
    role === "admin" || role === "provider" || role === "staff"

  const pageContent = (
    <div className="space-y-6">
      {/* Avatar */}
      <ProfileCard title="Ảnh đại diện">
        <div className="flex flex-col items-start gap-6 sm:flex-row sm:items-center">
          <button
            type="button"
            className="group relative size-20 overflow-hidden rounded-full border-2 border-[#e5e2e1]"
            aria-label="Change profile picture"
            onClick={() => fileInputRef.current?.click()}
          >
            {form.avatarUrl ? (
              <img
                alt="Current avatar"
                className="size-full rounded-full object-cover transition-opacity group-hover:opacity-75"
                src={form.avatarUrl}
              />
            ) : (
              <span className="flex size-full items-center justify-center rounded-full bg-[#f6f3f2] text-xl font-bold text-[#8a3218]">
                {getInitials(displayName)}
              </span>
            )}
            <span className="absolute inset-0 flex items-center justify-center bg-[#1c1b1b]/10 opacity-0 transition-opacity group-hover:opacity-100">
              <Camera className="size-5 text-[#1c1b1b]" />
            </span>
          </button>
          <input
            ref={fileInputRef}
            className="hidden"
            type="file"
            accept="image/jpeg,image/png,image/webp,image/jpg"
            onChange={(event) =>
              void handleAvatarChange(event.target.files?.[0])
            }
          />
          <div className="flex flex-col gap-3">
            <div className="flex flex-wrap gap-2">
              <Button
                disabled={uploading}
                onClick={() => fileInputRef.current?.click()}
                className="rounded-lg bg-[#1c1b1b] px-4 text-sm text-white hover:bg-[#313030]"
              >
                {uploading ? "Đang tải..." : "Tải ảnh mới"}
              </Button>
              <Button
                variant="outline"
                className="rounded-lg border-[#e5e2e1] bg-white px-4 text-sm text-[#1c1b1b] hover:bg-[#f6f3f2]"
                onClick={() => {
                  setForm((current) => ({ ...current, avatarUrl: "" }))
                  void saveProfile("")
                }}
              >
                Xóa ảnh
              </Button>
            </div>
            <p className="text-xs text-[#747878]">
              Định dạng JPG, PNG. Tối đa 5MB.
            </p>
          </div>
        </div>
      </ProfileCard>

      {/* Basic Info */}
      <ProfileCard title="Thông tin cá nhân">
        <form className="grid grid-cols-1 gap-5 md:grid-cols-2">
          <Field
            label="Họ"
            id="firstName"
            value={form.firstName}
            onChange={(value) =>
              setForm((current) => ({ ...current, firstName: value }))
            }
          />
          <Field
            label="Tên"
            id="lastName"
            value={form.lastName}
            onChange={(value) =>
              setForm((current) => ({ ...current, lastName: value }))
            }
          />
          <Field
            label="Email"
            id="email"
            type="email"
            value={form.email}
            icon={<Mail className="size-4" />}
            className="md:col-span-2"
            disabled
          />
          <Field
            label="Số điện thoại"
            id="phone"
            type="tel"
            value={form.phone}
            onChange={(value) =>
              setForm((current) => ({ ...current, phone: value }))
            }
            icon={<Phone className="size-4" />}
            className="md:col-span-2"
          />
          <div className="mt-2 flex justify-end border-t border-[#e5e2e1] pt-5 md:col-span-2">
            <Button
              disabled={saving}
              type="button"
              onClick={() => void saveProfile()}
              className="rounded-lg bg-[#1c1b1b] px-5 text-sm text-white hover:bg-[#313030]"
            >
              {saving ? "Đang lưu..." : "Lưu thay đổi"}
            </Button>
          </div>
        </form>
      </ProfileCard>

      {/* Staff: work info */}
      {role === "staff" && (
        <>
          <ProfileCard title="Thông tin phân công chi nhánh">
            {loadingCafe ? (
              <div className="text-center py-6 text-sm text-[#747878]">
                Đang tải thông tin chi nhánh...
              </div>
            ) : user?.assignedCafeId ? (
              <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
                <div>
                  <p className="text-xs font-semibold text-[#747878] uppercase tracking-wider mb-1">
                    Chi nhánh làm việc
                  </p>
                  <p className="text-sm font-semibold text-[#1c1b1b]">
                    {assignedCafe?.name || "Chi nhánh đã phân công"}
                  </p>
                </div>
                <div>
                  <p className="text-xs font-semibold text-[#747878] uppercase tracking-wider mb-1">
                    Mã nhân viên
                  </p>
                  <p className="text-sm font-semibold text-[#1c1b1b]">
                    EMP-{(user?.id || "staff").slice(0, 8).toUpperCase()}
                  </p>
                </div>
                <div className="sm:col-span-2">
                  <p className="text-xs font-semibold text-[#747878] uppercase tracking-wider mb-1">
                    Địa chỉ
                  </p>
                  <p className="text-sm text-[#5d5f5f]">
                    {assignedCafe?.address || "Đang cập nhật địa chỉ..."}
                  </p>
                </div>
                <div>
                  <p className="text-xs font-semibold text-[#747878] uppercase tracking-wider mb-1">
                    Vị trí công việc
                  </p>
                  <p className="text-sm font-semibold text-[#1c1b1b]">
                    Nhân viên trực ca (Staff)
                  </p>
                </div>
                <div>
                  <p className="text-xs font-semibold text-[#747878] uppercase tracking-wider mb-1">
                    Trạng thái hoạt động
                  </p>
                  <p className="text-sm flex items-center gap-1.5 text-emerald-600 font-semibold">
                    <span className="relative flex h-2 w-2">
                      <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75"></span>
                      <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-500"></span>
                    </span>
                    Đang làm việc
                  </p>
                </div>
              </div>
            ) : (
              <div className="rounded-lg border border-yellow-200 bg-yellow-50 p-4">
                <p className="text-sm font-semibold text-yellow-800">
                  Chưa được phân công chi nhánh
                </p>
                <p className="mt-1 text-xs text-yellow-700">
                  Liên hệ với Quản lý của bạn (Provider) để được cập nhật phân
                  công ca trực.
                </p>
              </div>
            )}
          </ProfileCard>

          <ProfileCard title="Hiệu suất trực ca">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
              <div className="rounded-lg border border-[#e5e2e1] bg-[#fcf8f8] p-4 text-center">
                <p className="text-xs font-semibold text-[#747878] uppercase tracking-wider">
                  Số ca tuần này
                </p>
                <p className="mt-2 text-2xl font-bold text-[#1c1b1b]">5 ca</p>
              </div>
              <div className="rounded-lg border border-[#e5e2e1] bg-[#fcf8f8] p-4 text-center">
                <p className="text-xs font-semibold text-[#747878] uppercase tracking-wider">
                  Đánh giá chung
                </p>
                <p className="mt-2 text-2xl font-bold text-emerald-600">
                  4.9 / 5.0
                </p>
              </div>
              <div className="rounded-lg border border-[#e5e2e1] bg-[#fcf8f8] p-4 text-center">
                <p className="text-xs font-semibold text-[#747878] uppercase tracking-wider">
                  Check-in đúng giờ
                </p>
                <p className="mt-2 text-2xl font-bold text-[#1c1b1b]">100%</p>
              </div>
            </div>
          </ProfileCard>
        </>
      )}

      {/* Provider: business info */}
      {role === "provider" && (
        <>
          <ProfileCard title="Thông tin doanh nghiệp">
            {loadingBusiness ? (
              <div className="h-40 animate-pulse rounded-lg bg-[#f6f3f2]" />
            ) : (
              <form
                className="space-y-5"
                onSubmit={(e) => {
                  e.preventDefault()
                  void handleSaveBusiness()
                }}
              >
                <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
                  <Field
                    label="Tên doanh nghiệp / Hộ kinh doanh"
                    id="companyName"
                    value={businessForm.business_name}
                    onChange={(value) =>
                      setBusinessForm((prev) => ({
                        ...prev,
                        business_name: value,
                      }))
                    }
                  />
                  <Field
                    label="Mã số thuế"
                    id="taxCode"
                    value={businessForm.tax_code}
                    onChange={(value) =>
                      setBusinessForm((prev) => ({ ...prev, tax_code: value }))
                    }
                  />
                  <Field
                    label="Email liên hệ doanh nghiệp"
                    id="businessEmail"
                    type="email"
                    value={businessForm.business_email}
                    onChange={(value) =>
                      setBusinessForm((prev) => ({
                        ...prev,
                        business_email: value,
                      }))
                    }
                    className="md:col-span-2"
                  />
                </div>
                <div>
                  <Label className="mb-2 block text-sm font-bold text-[#1c1b1b]">
                    Giới thiệu
                  </Label>
                  <Textarea
                    rows={4}
                    value={businessForm.business_description}
                    placeholder="Giới thiệu sơ lược về sân đua, số lượng xe cho thuê, dịch vụ đi kèm..."
                    onChange={(event: React.ChangeEvent<HTMLTextAreaElement>) =>
                      setBusinessForm((prev) => ({
                        ...prev,
                        business_description: event.target.value,
                      }))
                    }
                  />
                </div>
                {businessError ? (
                  <p className="text-sm font-semibold text-red-600">
                    {businessError}
                  </p>
                ) : null}
                <div className="flex justify-end pt-2 border-t border-[#e5e2e1]">
                  <Button
                    type="submit"
                    disabled={savingBusiness}
                    className="rounded-lg bg-[#1c1b1b] px-5 text-sm text-white hover:bg-[#313030]"
                  >
                    {savingBusiness ? "Đang lưu..." : "Lưu thông tin"}
                  </Button>
                </div>
              </form>
            )}
          </ProfileCard>

          <ProfileCard title="Gói dịch vụ đăng ký (Subscription)">
            <div className="rounded-lg border border-[#e5e2e1] p-5 space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                <div>
                  <p className="text-sm font-bold text-orange-600">
                    Premium Track Partner
                  </p>
                  <p className="text-xs text-[#5d5f5f] mt-1">
                    Gói dịch vụ cao cấp dành cho nhà vận hành chuyên nghiệp.
                  </p>
                </div>
                <span className="px-2.5 py-1 bg-emerald-100 text-emerald-700 rounded-full text-[10px] font-bold w-fit">
                  ĐANG HOẠT ĐỘNG
                </span>
              </div>
              <div className="grid grid-cols-2 gap-4 border-t border-[#e5e2e1] pt-4 text-sm">
                <div>
                  <p className="text-xs text-[#747878]">
                    Ngày hết hạn / gia hạn tiếp theo
                  </p>
                  <p className="font-semibold text-[#1c1b1b] mt-0.5">
                    31/12/2026
                  </p>
                </div>
                <div>
                  <p className="text-xs text-[#747878]">
                    Tổng số chi nhánh cho phép
                  </p>
                  <p className="font-semibold text-[#1c1b1b] mt-0.5">
                    5 chi nhánh (Đã dùng 3/5)
                  </p>
                </div>
                <div>
                  <p className="text-xs text-[#747878]">
                    Phương thức thanh toán gia hạn
                  </p>
                  <p className="font-semibold text-[#1c1b1b] mt-0.5">
                    Thẻ Visa (Đuôi *8829)
                  </p>
                </div>
                <div>
                  <p className="text-xs text-[#747878]">
                    Giới hạn nhân viên trực ca
                  </p>
                  <p className="font-semibold text-[#1c1b1b] mt-0.5">
                    30 nhân viên (Đã dùng 12/30)
                  </p>
                </div>
              </div>
              <div className="flex justify-end pt-2 border-t border-[#e5e2e1]">
                <Button
                  variant="outline"
                  className="rounded-lg border-[#e5e2e1] bg-white text-sm"
                >
                  Quản lý gói dịch vụ
                </Button>
              </div>
            </div>
          </ProfileCard>
        </>
      )}

      {/* Security */}
      <ProfileCard title="Đổi mật khẩu">
        <form
          className="grid grid-cols-1 gap-5 md:grid-cols-2"
          onSubmit={(e) => {
            e.preventDefault()
            void handleResetPassword()
          }}
        >
          <Field
            label="Mật khẩu hiện tại"
            id="currentPassword"
            type="password"
            value={passwordForm.currentPassword}
            onChange={(value) =>
              setPasswordForm((current) => ({
                ...current,
                currentPassword: value,
              }))
            }
            className="md:col-span-2"
          />
          <Field
            label="Mật khẩu mới"
            id="newPassword"
            type="password"
            value={passwordForm.newPassword}
            onChange={(value) =>
              setPasswordForm((current) => ({ ...current, newPassword: value }))
            }
          />
          <Field
            label="Nhập lại mật khẩu mới"
            id="confirmNewPassword"
            type="password"
            value={passwordForm.confirmNewPassword}
            onChange={(value) =>
              setPasswordForm((current) => ({
                ...current,
                confirmNewPassword: value,
              }))
            }
          />
          <div className="mt-2 flex justify-end border-t border-[#e5e2e1] pt-5 md:col-span-2">
            <Button
              disabled={resettingPassword}
              type="submit"
              className="rounded-lg bg-[#1c1b1b] px-5 text-sm text-white hover:bg-[#313030]"
            >
              {resettingPassword ? "Đang xử lý..." : "Đổi mật khẩu"}
            </Button>
          </div>
        </form>
      </ProfileCard>

      {/* Admin: role scope */}
      {role === "admin" && (
        <ProfileCard title="Vai trò quản trị">
          <div className="space-y-3 text-sm text-[#1c1b1b]">
            <div className="flex justify-between py-2 border-b border-[#e5e2e1]">
              <span className="text-xs font-semibold text-[#747878] uppercase tracking-wider">
                Vai trò tài khoản
              </span>
              <span className="text-sm font-bold text-orange-600">
                Quản trị viên hệ thống
              </span>
            </div>
            <div className="rounded-lg border border-[#e5e2e1] bg-[#fcf8f8] p-4">
              <p className="text-sm font-semibold text-[#1c1b1b]">Có thể thực hiện</p>
              <ul className="mt-2 grid gap-x-6 gap-y-1.5 text-xs text-[#5d5f5f] sm:grid-cols-2">
                <li>• Duyệt và quản lý Provider, cơ sở</li>
                <li>• Xử lý yêu cầu thanh toán, phí giải</li>
                <li>• Cấu hình gói, tiện ích, loại đường chạy</li>
                <li>• Quản lý kênh, nội dung và cấu hình hệ thống</li>
              </ul>
              <p className="mt-3 border-t border-[#e5e2e1] pt-3 text-xs text-[#747878]">
                Quyền áp dụng theo vai trò ADMIN; hiện chưa có phân quyền riêng theo từng tài khoản quản trị.
              </p>
            </div>
          </div>
        </ProfileCard>
      )}
    </div>
  )

  if (isDashboardRole) {
    return <div className="w-full py-4">{pageContent}</div>
  }

  return (
    <main className="mx-auto w-full max-w-4xl px-4 py-8 md:px-6 md:py-12">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-[#1c1b1b]">Cài đặt tài khoản</h1>
        <p className="mt-1.5 text-sm text-[#5d5f5f]">
          Quản lý thông tin cá nhân, bảo mật và thanh toán.
        </p>
      </div>
      {pageContent}
    </main>
  )
}

function ProfileCard({
  title,
  children,
}: {
  title: string
  children: React.ReactNode
}) {
  return (
    <section className="rounded-xl border border-[#e5e2e1] bg-white p-5 md:p-6">
      <h2 className="mb-5 text-sm font-bold text-[#1c1b1b]">{title}</h2>
      {children}
    </section>
  )
}

function Field({
  label,
  id,
  type = "text",
  value,
  onChange,
  icon,
  className,
  disabled = false,
}: {
  label: string
  id: string
  type?: string
  value: string
  onChange?: (value: string) => void
  icon?: React.ReactNode
  className?: string
  disabled?: boolean
}) {
  return (
    <div className={cn("flex flex-col gap-1.5", className)}>
      <label
        className="text-xs font-semibold text-[#747878] uppercase tracking-wider"
        htmlFor={id}
      >
        {label}
      </label>
      <div className="relative">
        {icon ? (
          <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#747878]">
            {icon}
          </span>
        ) : null}
        <Input
          id={id}
          type={type}
          value={value}
          disabled={disabled}
          onChange={(event) => onChange?.(event.target.value)}
          className={cn(
            "h-10 rounded-lg border-[#e5e2e1] bg-white px-3.5 text-sm text-[#1c1b1b] focus:border-[#747878] focus:ring-[#747878]",
            icon && "pl-10",
          )}
        />
      </div>
    </div>
  )
}

function persistUser(user: {
  id: string
  email: string
  fullName: string
  phone?: string
  avatarUrl?: string
  role?: string
  registrationStatus?: string
}) {
  const storage = localStorage.getItem(storageKeys.auth)
    ? localStorage
    : sessionStorage
  const raw = storage.getItem(storageKeys.auth)
  if (!raw) return

  try {
    const parsed = JSON.parse(raw) as Record<string, unknown>
    storage.setItem(storageKeys.auth, JSON.stringify({ ...parsed, user }))
  } catch {
    // ignore malformed storage
  }
}

function splitName(name: string) {
  const parts = name.trim().split(/\s+/).filter(Boolean)
  if (parts.length <= 1) return [parts[0] ?? "", ""]
  return [parts[0], parts.slice(1).join(" ")]
}

function getInitials(name: string) {
  return name
    .split(" ")
    .map((part) => part[0])
    .join("")
    .slice(-2)
    .toUpperCase()
}
