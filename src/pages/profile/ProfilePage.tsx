import { useEffect, useMemo, useRef, useState } from "react"
import { toast } from "sonner"
import {
  Bell,
  Camera,
  CreditCard,
  Mail,
  Phone,
  Shield,
  UserRound,
} from "lucide-react"

import { AdminShell } from "@/pages/admin/components/AdminShell"
import { CustomerProfilePage } from "@/pages/customer/profile/CustomerProfilePage"
import { ProviderPageHeader } from "@/pages/provider/components/ProviderPrimitives"
import { ProviderShell } from "@/pages/provider/components/ProviderShell"
import { getMe, updateMe } from "@/features/auth/api/auth.api"
import { useAuthStore } from "@/features/auth/stores/auth.store"
import { uploadImage } from "@/features/uploads/api/upload.api"
import { PublicPageShell } from "@/shared/components/PublicPageShell"
import { storageKeys } from "@/shared/lib/storage"
import { cn } from "@/shared/lib/utils"
import { Button } from "@/shared/ui/button"
import { Input } from "@/shared/ui/input"
import { Switch } from "@/shared/ui/switch"

type ProfileTab = "personal" | "security" | "notifications" | "payment"

const profileTabs = [
  { id: "personal" as const, label: "Personal Information", icon: UserRound },
  { id: "security" as const, label: "Security", icon: Shield },
  { id: "notifications" as const, label: "Notifications", icon: Bell },
  { id: "payment" as const, label: "Payment Methods", icon: CreditCard },
]

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
  const [activeTab, setActiveTab] = useState<ProfileTab>("personal")
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

  return (
    <main className="mx-auto w-full max-w-7xl px-4 py-8 text-[#1c1b1b] md:px-6 md:py-12">
        <div className="mb-10">
          <h1 className="text-3xl font-semibold leading-tight text-[#1c1b1b]">Account Settings</h1>
          <p className="mt-2 text-lg leading-relaxed text-[#444748]">
            Manage your personal information, security preferences, and billing.
          </p>
        </div>

        <div className="grid grid-cols-1 items-start gap-8 md:grid-cols-12 md:gap-12">
          <aside className="flex flex-col gap-2 md:sticky md:top-24 md:col-span-3">
            {profileTabs.map((tab) => {
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
              </>
            )}

            {activeTab === "security" && (
              <ProfileCard title="Security">
                <div className="space-y-4">
                  <SettingRow title="Password" description="Update your password and keep your account protected." action="Change password" />
                  <SettingRow title="Two-factor authentication" description="Require a second verification step when signing in." toggle />
                </div>
              </ProfileCard>
            )}

            {activeTab === "notifications" && (
              <ProfileCard title="Notifications">
                <div className="space-y-4">
                  <SettingRow title="Booking updates" description="Receive booking, payment, and session status updates." toggle enabled />
                  <SettingRow title="Marketing emails" description="Product news, promotions, and partner updates." toggle />
                </div>
              </ProfileCard>
            )}

            {activeTab === "payment" && (
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
