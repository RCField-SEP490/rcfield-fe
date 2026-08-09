import { useEffect, useMemo, useRef, useState } from "react"
import { toast } from "sonner"
import { Camera, LockKeyhole, Mail, Phone, Save, Trash2 } from "lucide-react"
import { getMe, updateMe } from "@/features/auth/api/auth.api"
import { useAuthStore } from "@/features/auth/stores/auth.store"
import { uploadImage } from "@/features/uploads/api/upload.api"
import { storageKeys } from "@/shared/lib/storage"
import { Button } from "@/shared/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/shared/ui/card"
import { Input } from "@/shared/ui/input"
import { Label } from "@/shared/ui/label"
import { Separator } from "@/shared/ui/separator"

export function ProfileSettingsCard() {
  const user = useAuthStore((state) => state.user)
  const role = useAuthStore((state) => state.role)
  const setUser = useAuthStore((state) => state.setUser)
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

  return (
    <Card className="rounded-xl shadow-sm">
      <CardHeader>
        <CardTitle>Cài đặt & bảo mật</CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        <section className="space-y-4">
          <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Ảnh đại diện</p>
          <div className="flex flex-col gap-5 sm:flex-row sm:items-center">
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="group relative size-24 overflow-hidden rounded-full border-2 border-slate-200"
              aria-label="Đổi ảnh đại diện"
            >
              {form.avatarUrl ? (
                <img alt="Ảnh đại diện" className="size-full rounded-full object-cover transition-opacity group-hover:opacity-75" src={form.avatarUrl} />
              ) : (
                <span className="flex size-full items-center justify-center rounded-full bg-muted text-2xl font-bold text-muted-foreground">
                  {getInitials(displayName)}
                </span>
              )}
              <span className="absolute inset-0 flex items-center justify-center bg-slate-950/10 opacity-0 transition-opacity group-hover:opacity-100">
                <Camera className="size-6 text-slate-950" />
              </span>
            </button>
            <input
              ref={fileInputRef}
              className="hidden"
              type="file"
              accept="image/jpeg,image/png,image/webp,image/jpg"
              onChange={(event) => void handleAvatarChange(event.target.files?.[0])}
            />
            <div className="space-y-3">
              <div className="flex flex-wrap gap-3">
                <Button disabled={uploading} onClick={() => fileInputRef.current?.click()}>
                  {uploading ? "Đang tải..." : "Tải ảnh mới"}
                </Button>
                <Button
                  variant="outline"
                  onClick={() => {
                    setForm((current) => ({ ...current, avatarUrl: "" }))
                    void saveProfile("")
                  }}
                >
                  Xóa ảnh
                </Button>
              </div>
              <p className="text-sm text-muted-foreground">Định dạng JPG, PNG hoặc WEBP. Dung lượng tối đa 5MB.</p>
            </div>
          </div>
        </section>

        <Separator />

        <section className="space-y-3">
          <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Thông tin cơ bản</p>
          <div className="grid gap-4 md:grid-cols-2">
            <label className="space-y-2">
              <Label>Họ</Label>
              <Input value={form.firstName} onChange={(event) => setForm((current) => ({ ...current, firstName: event.target.value }))} />
            </label>
            <label className="space-y-2">
              <Label>Tên</Label>
              <Input value={form.lastName} onChange={(event) => setForm((current) => ({ ...current, lastName: event.target.value }))} />
            </label>
            <label className="space-y-2 md:col-span-2">
              <Label>Email</Label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                <Input className="pl-9" value={form.email} disabled />
              </div>
            </label>
            <label className="space-y-2 md:col-span-2">
              <Label>Số điện thoại</Label>
              <div className="relative">
                <Phone className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                <Input className="pl-9" value={form.phone} onChange={(event) => setForm((current) => ({ ...current, phone: event.target.value }))} />
              </div>
            </label>
          </div>
        </section>

        <Separator />

        <section className="space-y-3">
          <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Bảo mật</p>
          <div className="flex flex-wrap gap-2">
            <Button variant="outline">
              <LockKeyhole className="h-4 w-4" /> Đổi mật khẩu
            </Button>
            <Button variant="destructive">
              <Trash2 className="h-4 w-4" /> Xóa tài khoản
            </Button>
          </div>
        </section>

        <div className="flex justify-end">
          <Button disabled={saving} onClick={() => void saveProfile()}>
            <Save className="h-4 w-4" /> {saving ? "Đang lưu..." : "Lưu thay đổi"}
          </Button>
        </div>
      </CardContent>
    </Card>
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
