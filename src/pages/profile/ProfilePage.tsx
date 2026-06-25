import { useEffect, useMemo, useRef, useState } from "react"
import { useNavigate } from "react-router"
import { toast } from "sonner"
import {
  Bell,
  Camera,
  CreditCard,
  Mail,
  Phone,
  Shield,
  UserRound,
  Building,
} from "lucide-react"

import { AdminShell } from "@/pages/admin/components/AdminShell"
import { AdminHeader } from "@/pages/admin/components/AdminPrimitives"
import { CustomerProfilePage } from "@/pages/customer/profile/CustomerProfilePage"
import { ProviderPageHeader } from "@/pages/provider/components/ProviderPrimitives"
import { ProviderShell } from "@/pages/provider/components/ProviderShell"
import { StaffShell } from "@/pages/staff/components/StaffShell"
import { StaffHeader } from "@/pages/staff/components/StaffUI"
import { StaffOperationContextProvider } from "@/pages/staff/context/StaffOperationContext"
import { getMe, updateMe, changePassword, logoutSession } from "@/features/auth/api/auth.api"
import { useAuthStore } from "@/features/auth/stores/auth.store"
import { uploadImage } from "@/features/uploads/api/upload.api"
import { cafeApi } from "@/features/cafes/api/cafe.api"
import { PublicPageShell } from "@/shared/components/PublicPageShell"
import { storageKeys } from "@/shared/lib/storage"
import { cn } from "@/shared/lib/utils"
import { Button } from "@/shared/ui/button"
import { Input } from "@/shared/ui/input"
import { Switch } from "@/shared/ui/switch"

type ProfileTab = "personal" | "business" | "work" | "security" | "notifications" | "payment"

const profileTabsByRole = {
  staff: [
    { id: "personal" as const, label: "Thông tin cá nhân", icon: UserRound },
    { id: "work" as const, label: "Thông tin làm việc", icon: Building },
    { id: "security" as const, label: "Bảo mật", icon: Shield },
    { id: "notifications" as const, label: "Thông báo ca làm", icon: Bell },
  ],
  provider: [
    { id: "personal" as const, label: "Thông tin cá nhân", icon: UserRound },
    { id: "business" as const, label: "Thông tin doanh nghiệp", icon: Building },
    { id: "security" as const, label: "Bảo mật", icon: Shield },
    { id: "notifications" as const, label: "Thông báo hệ thống", icon: Bell },
    { id: "payment" as const, label: "Phương thức thanh toán", icon: CreditCard },
  ],
  admin: [
    { id: "personal" as const, label: "Thông tin cá nhân", icon: UserRound },
    { id: "security" as const, label: "Bảo mật & Phân quyền", icon: Shield },
    { id: "notifications" as const, label: "Cảnh báo hệ thống", icon: Bell },
  ],
  default: [
    { id: "personal" as const, label: "Personal Information", icon: UserRound },
    { id: "security" as const, label: "Security", icon: Shield },
    { id: "notifications" as const, label: "Notifications", icon: Bell },
    { id: "payment" as const, label: "Payment Methods", icon: CreditCard },
  ]
}

export function ProfilePage() {
  const role = useAuthStore((state) => state.role)

  if (role === "provider") {
    return (
      <ProviderShell>
        <ProviderPageHeader
          title="Hồ sơ cá nhân"
          description="Quản lý thông tin tài khoản, bảo mật và phương thức thanh toán."
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
    const storedAuth = localStorage.getItem(storageKeys.auth) ?? sessionStorage.getItem(storageKeys.auth)
    if (storedAuth) {
      try {
        const auth = JSON.parse(storedAuth) as { accessToken?: string; refreshToken?: string }
        if (auth.accessToken && auth.refreshToken) {
          await logoutSession(auth.accessToken, auth.refreshToken)
        }
      } catch {}
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
    } catch (e: any) {
      const msg = e.response?.data?.message || "Đổi mật khẩu thất bại. Vui lòng kiểm tra lại mật khẩu hiện tại."
      toast.error(msg)
    } finally {
      setResettingPassword(false)
    }
  }

  const tabs = useMemo(() => {
    const roleKey = (role || "default") as keyof typeof profileTabsByRole
    return profileTabsByRole[roleKey] || profileTabsByRole.default
  }, [role])

  const [activeTab, setActiveTab] = useState<ProfileTab>("personal")

  useEffect(() => {
    if (tabs.length > 0 && !tabs.some((t) => t.id === activeTab)) {
      setActiveTab(tabs[0].id)
    }
  }, [tabs, activeTab])

  const [assignedCafe, setAssignedCafe] = useState<any>(null)
  const [loadingCafe, setLoadingCafe] = useState(false)

  useEffect(() => {
    if (role === "staff" && user?.assignedCafeId) {
      setLoadingCafe(true)
      cafeApi
        .getCafe(user.assignedCafeId)
        .then((data) => setAssignedCafe(data))
        .catch((err) => console.error("Error loading cafe in staff profile", err))
        .finally(() => setLoadingCafe(false))
    }
  }, [role, user?.assignedCafeId])

  const [businessForm, setBusinessForm] = useState({
    companyName: "Công ty Cổ phần RCField Việt Nam",
    businessEmail: "partner@rcfield.vn",
    taxCode: "0109283745",
    bankName: "Techcombank (TCB)",
    bankAccountNumber: "19034567890123",
    bankAccountHolder: "NGUYEN VAN PROVIDER",
  })
  const [savingBusiness, setSavingBusiness] = useState(false)

  useEffect(() => {
    if (user?.id) {
      const saved = localStorage.getItem(`rcfield:provider_profile:business:${user.id}`)
      if (saved) {
        try {
          setBusinessForm(JSON.parse(saved))
        } catch (e) {
          console.error("Error parsing provider business info", e)
        }
      }
    }
  }, [user?.id])

  const handleSaveBusiness = async () => {
    setSavingBusiness(true)
    try {
      await new Promise((resolve) => setTimeout(resolve, 500))
      localStorage.setItem(`rcfield:provider_profile:business:${user?.id}`, JSON.stringify(businessForm))
      toast.success("Đã cập nhật thông tin doanh nghiệp.")
    } catch (e) {
      toast.error("Không thể lưu thông tin.")
    } finally {
      setSavingBusiness(false)
    }
  }

  const fileInputRef = useRef<HTMLInputElement | null>(null)

  const displayName = user?.fullName ?? user?.email ?? "RCField User"
  const email = user?.email ?? "user@rcfield.vn"
  const [firstName, lastName] = useMemo(() => splitName(displayName), [displayName])
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
    setForm({
      firstName,
      lastName,
      email,
      phone: user?.phone ?? "",
      avatarUrl: user?.avatarUrl ?? "",
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

  const isDashboardRole = role === "admin" || role === "provider" || role === "staff"

  const gridContent = (
    <div className="grid grid-cols-1 items-start gap-8 md:grid-cols-12 md:gap-12">
      <aside className="flex flex-col gap-2 md:sticky md:top-24 md:col-span-3">
        {tabs.map((tab) => {
          const Icon = tab.icon
          const active = activeTab === tab.id

          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveTab(tab.id)}
              className={cn(
                "flex items-center gap-3 rounded-lg px-4 py-3 text-left font-semibold transition-colors",
                active
                  ? "bg-[#ebe7e7] text-[#1c1b1b]"
                  : "text-[#444748] hover:bg-[#f6f3f2] hover:text-[#1c1b1b]"
              )}
            >
              <Icon className={cn("size-5", active && "fill-current")} />
              {tab.label}
            </button>
          )
        })}
      </aside>

      <section className="flex flex-col gap-8 md:col-span-9">
        {activeTab === "personal" && (
          <>
            <ProfileCard title="Profile Picture">
              <div className="flex flex-col items-start gap-6 sm:flex-row sm:items-center">
                <button
                  type="button"
                  className="group relative size-24 overflow-hidden rounded-full border-2 border-[#e5e2e1]"
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
                    <span className="flex size-full items-center justify-center rounded-full bg-[#f6f3f2] text-2xl font-bold text-[#8a3218]">
                      {getInitials(displayName)}
                    </span>
                  )}
                  <span className="absolute inset-0 flex items-center justify-center bg-[#1c1b1b]/10 opacity-0 transition-opacity group-hover:opacity-100">
                    <Camera className="size-6 text-[#1c1b1b]" />
                  </span>
                </button>
                <input
                  ref={fileInputRef}
                  className="hidden"
                  type="file"
                  accept="image/jpeg,image/png,image/webp,image/jpg"
                  onChange={(event) => void handleAvatarChange(event.target.files?.[0])}
                />

                <div className="flex flex-col gap-3">
                  <div className="flex flex-wrap gap-3">
                    <Button disabled={uploading} onClick={() => fileInputRef.current?.click()} className="rounded-lg bg-[#1c1b1b] px-5 text-white hover:bg-[#313030]">
                      {uploading ? "Uploading..." : "Upload new"}
                    </Button>
                    <Button
                      variant="outline"
                      className="rounded-lg border-[#c4c7c8] bg-white px-5 text-[#1c1b1b] hover:bg-[#f6f3f2]"
                      onClick={() => {
                        setForm((current) => ({ ...current, avatarUrl: "" }))
                        void saveProfile("")
                      }}
                    >
                      Remove
                    </Button>
                  </div>
                  <p className="text-sm text-[#444748]">Recommended format: JPG, PNG, or GIF. Max size: 5MB.</p>
                </div>
              </div>
            </ProfileCard>

            <ProfileCard title="Basic Information">
              <form className="grid grid-cols-1 gap-6 md:grid-cols-2">
                <Field label="First Name" id="firstName" value={form.firstName} onChange={(value) => setForm((current) => ({ ...current, firstName: value }))} />
                <Field label="Last Name" id="lastName" value={form.lastName} onChange={(value) => setForm((current) => ({ ...current, lastName: value }))} />
                <Field label="Email Address" id="email" type="email" value={form.email} icon={<Mail className="size-5" />} className="md:col-span-2" disabled />
                <Field label="Phone Number" id="phone" type="tel" value={form.phone} onChange={(value) => setForm((current) => ({ ...current, phone: value }))} icon={<Phone className="size-5" />} className="md:col-span-2" />
                <div className="mt-4 flex justify-end border-t border-[#c4c7c8] pt-6 md:col-span-2">
                  <Button disabled={saving} type="button" onClick={() => void saveProfile()} className="rounded-lg bg-[#1c1b1b] px-6 text-white hover:bg-[#313030]">
                    {saving ? "Saving..." : "Save Changes"}
                  </Button>
                </div>
              </form>
            </ProfileCard>

            <ProfileCard title="Reset Password">
              <form className="grid grid-cols-1 gap-6 md:grid-cols-2" onSubmit={(e) => { e.preventDefault(); void handleResetPassword(); }}>
                <Field
                  label="Mật khẩu hiện tại"
                  id="currentPassword"
                  type="password"
                  value={passwordForm.currentPassword}
                  onChange={(value) => setPasswordForm((current) => ({ ...current, currentPassword: value }))}
                  className="md:col-span-2"
                />
                <Field
                  label="Mật khẩu mới"
                  id="newPassword"
                  type="password"
                  value={passwordForm.newPassword}
                  onChange={(value) => setPasswordForm((current) => ({ ...current, newPassword: value }))}
                />
                <Field
                  label="Nhập lại mật khẩu mới"
                  id="confirmNewPassword"
                  type="password"
                  value={passwordForm.confirmNewPassword}
                  onChange={(value) => setPasswordForm((current) => ({ ...current, confirmNewPassword: value }))}
                />
                <div className="mt-4 flex justify-end border-t border-[#c4c7c8] pt-6 md:col-span-2">
                  <Button
                    disabled={resettingPassword}
                    type="submit"
                    className="rounded-lg bg-[#1c1b1b] px-6 text-white hover:bg-[#313030]"
                  >
                    {resettingPassword ? "Đang xử lý..." : "Reset Password"}
                  </Button>
                </div>
              </form>
            </ProfileCard>
          </>
        )}

        {activeTab === "work" && role === "staff" && (
          <div className="space-y-6">
            <ProfileCard title="Thông tin phân công chi nhánh">
              {loadingCafe ? (
                <div className="text-center py-6 text-sm text-[#444748]">Đang tải thông tin chi nhánh...</div>
              ) : user?.assignedCafeId ? (
                <div className="space-y-4">
                  <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
                    <div>
                      <p className="font-mono text-xs font-medium uppercase tracking-[0.05em] text-[#444748]">Chi nhánh làm việc</p>
                      <p className="mt-1 text-base font-semibold text-[#1c1b1b]">{assignedCafe?.name || "Chi nhánh đã phân công"}</p>
                    </div>
                    <div>
                      <p className="font-mono text-xs font-medium uppercase tracking-[0.05em] text-[#444748]">Mã nhân viên</p>
                      <p className="mt-1 text-base font-semibold text-[#1c1b1b]">EMP-{(user?.id || "staff").slice(0, 8).toUpperCase()}</p>
                    </div>
                    <div className="sm:col-span-2">
                      <p className="font-mono text-xs font-medium uppercase tracking-[0.05em] text-[#444748]">Địa chỉ</p>
                      <p className="mt-1 text-sm text-[#444748]">{assignedCafe?.address || "Đang cập nhật địa chỉ..."}</p>
                    </div>
                    <div>
                      <p className="font-mono text-xs font-medium uppercase tracking-[0.05em] text-[#444748]">Vị trí công việc</p>
                      <p className="mt-1 text-base font-semibold text-[#1c1b1b]">Nhân viên trực ca (Staff)</p>
                    </div>
                    <div>
                      <p className="font-mono text-xs font-medium uppercase tracking-[0.05em] text-[#444748]">Trạng thái hoạt động</p>
                      <p className="mt-1 flex items-center gap-1.5 text-emerald-600 font-semibold">
                        <span className="relative flex h-2 w-2">
                          <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75"></span>
                          <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-500"></span>
                        </span>
                        Đang làm việc
                      </p>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="rounded-lg border border-yellow-200 bg-yellow-50 p-4 text-center">
                  <p className="text-sm font-semibold text-yellow-800">Chưa được phân công chi nhánh</p>
                  <p className="mt-1 text-xs text-yellow-700">Liên hệ với Quản lý của bạn (Provider) để được cập nhật phân công ca trực.</p>
                </div>
              )}
            </ProfileCard>

            <ProfileCard title="Hiệu suất trực ca">
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                <div className="rounded-lg border border-[#c4c7c8] bg-[#fcf8f8] p-4 text-center">
                  <p className="text-xs text-[#444748] font-medium uppercase">Số ca tuần này</p>
                  <p className="mt-2 text-2xl font-bold text-[#1c1b1b]">5 ca</p>
                </div>
                <div className="rounded-lg border border-[#c4c7c8] bg-[#fcf8f8] p-4 text-center">
                  <p className="text-xs text-[#444748] font-medium uppercase">Đánh giá chung</p>
                  <p className="mt-2 text-2xl font-bold text-emerald-600">4.9 / 5.0</p>
                </div>
                <div className="rounded-lg border border-[#c4c7c8] bg-[#fcf8f8] p-4 text-center">
                  <p className="text-xs text-[#444748] font-medium uppercase">Tỷ lệ Check-in đúng giờ</p>
                  <p className="mt-2 text-2xl font-bold text-[#1c1b1b]">100%</p>
                </div>
              </div>
            </ProfileCard>
          </div>
        )}

        {activeTab === "business" && role === "provider" && (
          <div className="space-y-6">
            <ProfileCard title="Thông tin doanh nghiệp & Nhận thanh toán">
              <form className="space-y-6" onSubmit={(e) => { e.preventDefault(); void handleSaveBusiness(); }}>
                <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                  <Field
                    label="Tên doanh nghiệp / Hộ kinh doanh"
                    id="companyName"
                    value={businessForm.companyName}
                    onChange={(value) => setBusinessForm(prev => ({ ...prev, companyName: value }))}
                  />
                  <Field
                    label="Mã số thuế"
                    id="taxCode"
                    value={businessForm.taxCode}
                    onChange={(value) => setBusinessForm(prev => ({ ...prev, taxCode: value }))}
                  />
                  <Field
                    label="Email liên hệ doanh nghiệp"
                    id="businessEmail"
                    type="email"
                    value={businessForm.businessEmail}
                    onChange={(value) => setBusinessForm(prev => ({ ...prev, businessEmail: value }))}
                    className="md:col-span-2"
                  />
                  <div className="md:col-span-2 border-t border-[#c4c7c8]/50 pt-4 mt-2">
                    <h3 className="text-sm font-bold text-[#1c1b1b] mb-4">Tài khoản ngân hàng nhận tiền rút doanh thu (Payout)</h3>
                  </div>
                  <Field
                    label="Ngân hàng thụ hưởng"
                    id="bankName"
                    value={businessForm.bankName}
                    onChange={(value) => setBusinessForm(prev => ({ ...prev, bankName: value }))}
                  />
                  <Field
                    label="Số tài khoản"
                    id="bankAccountNumber"
                    value={businessForm.bankAccountNumber}
                    onChange={(value) => setBusinessForm(prev => ({ ...prev, bankAccountNumber: value }))}
                  />
                  <Field
                    label="Tên chủ tài khoản"
                    id="bankAccountHolder"
                    value={businessForm.bankAccountHolder}
                    onChange={(value) => setBusinessForm(prev => ({ ...prev, bankAccountHolder: value }))}
                    className="md:col-span-2"
                  />
                </div>
                <div className="flex justify-end pt-4 border-t border-[#c4c7c8]">
                  <Button
                    type="submit"
                    disabled={savingBusiness}
                    className="rounded-lg bg-[#1c1b1b] px-6 text-white hover:bg-[#313030]"
                  >
                    {savingBusiness ? "Đang lưu..." : "Lưu thông tin"}
                  </Button>
                </div>
              </form>
            </ProfileCard>

            <ProfileCard title="Gói dịch vụ đăng ký (Subscription)">
              <div className="rounded-lg border border-[#c4c7c8] p-5 space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                  <div>
                    <h3 className="text-lg font-bold text-orange-600">Premium Track Partner</h3>
                    <p className="text-sm text-[#444748] mt-1">Gói dịch vụ cao cấp dành cho nhà vận hành chuyên nghiệp.</p>
                  </div>
                  <div className="px-3 py-1 bg-emerald-100 text-emerald-800 rounded-full text-xs font-bold w-fit">
                    ĐANG HOẠT ĐỘNG
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4 border-t border-[#c4c7c8]/50 pt-4 text-sm">
                  <div>
                    <p className="text-[#444748]">Ngày hết hạn / gia hạn tiếp theo:</p>
                    <p className="font-semibold text-[#1c1b1b] mt-0.5">31/12/2026</p>
                  </div>
                  <div>
                    <p className="text-[#444748]">Tổng số chi nhánh cho phép:</p>
                    <p className="font-semibold text-[#1c1b1b] mt-0.5">5 chi nhánh (Đã dùng 3/5)</p>
                  </div>
                  <div>
                    <p className="text-[#444748]">Phương thức thanh toán gia hạn:</p>
                    <p className="font-semibold text-[#1c1b1b] mt-0.5">Thẻ Visa (Đuôi *8829)</p>
                  </div>
                  <div>
                    <p className="text-[#444748]">Giới hạn nhân viên trực ca:</p>
                    <p className="font-semibold text-[#1c1b1b] mt-0.5">30 nhân viên (Đã dùng 12/30)</p>
                  </div>
                </div>
                <div className="flex justify-end pt-4 border-t border-[#c4c7c8]/50">
                  <Button variant="outline" className="rounded-lg border-[#c4c7c8] bg-white">
                    Quản lý gói dịch vụ
                  </Button>
                </div>
              </div>
            </ProfileCard>
          </div>
        )}

        {activeTab === "security" && (
          <div className="space-y-6">
            <ProfileCard title="Security">
              <div className="space-y-4">
                <SettingRow title="Password" description="Update your password and keep your account protected." action="Change password" />
                <SettingRow title="Two-factor authentication" description="Require a second verification step when signing in." toggle />
              </div>
            </ProfileCard>

            {role === "admin" && (
              <ProfileCard title="Cấp độ quản trị & Quyền hạn hệ thống">
                <div className="space-y-4 text-sm text-[#1c1b1b]">
                  <div className="flex justify-between py-2 border-b border-[#c4c7c8]/40">
                    <span className="text-[#444748]">Phân quyền tài khoản</span>
                    <span className="font-bold text-orange-600">Super Administrator (Quyền tối cao)</span>
                  </div>
                  <div className="flex justify-between py-2 border-b border-[#c4c7c8]/40">
                    <span className="text-[#444748]">Lần đăng nhập gần nhất</span>
                    <span className="font-medium text-[#1c1b1b]">Hôm nay, 22:15:34 (từ IP 14.226.45.18)</span>
                  </div>
                  <div className="py-2">
                    <span className="text-[#444748] block mb-2">Các quyền được gán trực tiếp:</span>
                    <div className="flex flex-wrap gap-2">
                      <span className="px-2.5 py-1 bg-orange-50 text-orange-800 rounded-md border border-orange-100 text-xs font-bold">
                        PHÊ DUYỆT ĐỐI TÁC
                      </span>
                      <span className="px-2.5 py-1 bg-orange-50 text-orange-800 rounded-md border border-orange-100 text-xs font-bold">
                        QUẢN LÝ CHI NHÁNH
                      </span>
                      <span className="px-2.5 py-1 bg-orange-50 text-orange-800 rounded-md border border-orange-100 text-xs font-bold">
                        PHÂN XỬ TRANH CHẤP
                      </span>
                      <span className="px-2.5 py-1 bg-orange-50 text-orange-800 rounded-md border border-orange-100 text-xs font-bold">
                        GIÁM SÁT GIAO DỊCH
                      </span>
                    </div>
                  </div>
                  <div className="flex justify-end pt-4 border-t border-[#c4c7c8]/50">
                    <Button variant="outline" className="rounded-lg border-[#c4c7c8] bg-white">
                      Nhật ký bảo mật hệ thống
                    </Button>
                  </div>
                </div>
              </ProfileCard>
            )}
          </div>
        )}

        {activeTab === "notifications" && (
          <ProfileCard title="Thông báo">
            <div className="space-y-4">
              {role === "staff" && (
                <>
                  <SettingRow title="Thay đổi lịch trực" description="Nhận thông báo khi quản lý điều chỉnh ca làm việc của bạn." toggle enabled />
                  <SettingRow title="Báo cáo sự cố" description="Cập nhật khẩn cấp khi có sự cố xảy ra tại chi nhánh đang trực." toggle enabled />
                  <SettingRow title="Nhiệm vụ trực ca" description="Nhận nhắc nhở và danh sách kiểm tra vệ sinh/bảo trì xe được giao." toggle enabled />
                </>
              )}
              {role === "provider" && (
                <>
                  <SettingRow title="Lịch đặt mới" description="Thông báo khi khách hàng đặt lịch hoặc đặt món F&B tại các chi nhánh." toggle enabled />
                  <SettingRow title="Thông báo thanh toán" description="Xác nhận thanh toán thành công và cảnh báo gia hạn gói dịch vụ." toggle enabled />
                  <SettingRow title="Yêu cầu rút tiền" description="Cập nhật trạng thái xử lý khi bạn thực hiện rút doanh thu (payout)." toggle enabled />
                </>
              )}
              {role === "admin" && (
                <>
                  <SettingRow title="Yêu cầu phê duyệt" description="Yêu cầu đăng ký tài khoản đối tác mới từ các Provider." toggle enabled />
                  <SettingRow title="Lỗi & Cảnh báo hệ thống" description="Báo cáo downtime, lỗi máy chủ hoặc lưu lượng tải bất thường." toggle enabled />
                  <SettingRow title="Phân xử khiếu nại" description="Thông báo khi có tranh chấp cần phân xử giữa Provider và Khách hàng." toggle enabled />
                </>
              )}
              {(!role || role === "customer") && (
                <>
                  <SettingRow title="Booking updates" description="Receive booking, payment, and session status updates." toggle enabled />
                  <SettingRow title="Marketing emails" description="Product news, promotions, and partner updates." toggle />
                </>
              )}
            </div>
          </ProfileCard>
        )}

        {activeTab === "payment" && (role === "provider" || !role || role === "customer") && (
          <ProfileCard title="Payment Methods">
            <div className="rounded-lg border border-[#c4c7c8] bg-[#f6f3f2] p-5">
              <div className="flex items-center gap-3">
                <CreditCard className="size-6 text-[#5d5f5f]" />
                <div>
                  <p className="font-semibold text-[#1c1b1b]">No saved payment method</p>
                  <p className="text-sm text-[#444748]">Add a card or wallet for faster checkout.</p>
                </div>
              </div>
              <Button className="mt-5 rounded-lg bg-[#1c1b1b] text-white hover:bg-[#313030]">Add payment method</Button>
            </div>
          </ProfileCard>
        )}
      </section>
    </div>
  )

  if (isDashboardRole) {
    return (
      <div className="w-full text-[#1c1b1b] py-4">
        {gridContent}
      </div>
    )
  }

  return (
    <main className="mx-auto w-full max-w-7xl px-4 py-8 text-[#1c1b1b] md:px-6 md:py-12">
      <div className="mb-10">
        <h1 className="text-3xl font-semibold leading-tight text-[#1c1b1b]">Account Settings</h1>
        <p className="mt-2 text-lg leading-relaxed text-[#444748]">
          Manage your personal information, security preferences, and billing.
        </p>
      </div>
      {gridContent}
    </main>
  )
}

function ProfileCard({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="rounded-xl border border-[#c4c7c8] bg-white p-6 shadow-[0_4px_24px_-4px_rgba(0,0,0,0.02)] md:p-8">
      <h2 className="mb-6 text-lg font-semibold text-[#1c1b1b]">{title}</h2>
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
    <div className={cn("flex flex-col gap-2", className)}>
      <label className="font-mono text-xs font-medium uppercase tracking-[0.05em] text-[#444748]" htmlFor={id}>
        {label}
      </label>
      <div className="relative">
        {icon ? <span className="absolute left-4 top-1/2 -translate-y-1/2 text-[#444748]">{icon}</span> : null}
        <Input
          id={id}
          type={type}
          value={value}
          disabled={disabled}
          onChange={(event) => onChange?.(event.target.value)}
          className={cn(
            "h-12 rounded-lg border-[#c4c7c8] bg-white px-4 text-[#1c1b1b] focus:border-[#747878] focus:ring-[#747878]",
            icon && "pl-12"
          )}
        />
      </div>
    </div>
  )
}

function persistUser(user: { id: string; email: string; fullName: string; phone?: string; avatarUrl?: string; role?: string; registrationStatus?: string }) {
  const storage = localStorage.getItem(storageKeys.auth) ? localStorage : sessionStorage
  const raw = storage.getItem(storageKeys.auth)
  if (!raw) return

  try {
    const parsed = JSON.parse(raw) as Record<string, unknown>
    storage.setItem(storageKeys.auth, JSON.stringify({ ...parsed, user }))
  } catch {
    // ignore malformed storage
  }
}

function SettingRow({
  title,
  description,
  action,
  toggle = false,
  enabled = false,
}: {
  title: string
  description: string
  action?: string
  toggle?: boolean
  enabled?: boolean
}) {
  return (
    <div className="flex flex-col gap-4 rounded-lg border border-[#c4c7c8] bg-[#f6f3f2] p-4 sm:flex-row sm:items-center sm:justify-between">
      <div>
        <p className="font-semibold text-[#1c1b1b]">{title}</p>
        <p className="mt-1 text-sm text-[#444748]">{description}</p>
      </div>
      {toggle ? <Switch defaultChecked={enabled} /> : <Button variant="outline" className="rounded-lg bg-white">{action}</Button>}
    </div>
  )
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
