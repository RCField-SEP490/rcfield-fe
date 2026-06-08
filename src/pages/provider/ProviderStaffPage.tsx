import { useState } from "react"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { ArrowLeftRight, Clock, Mail, MapPin, MoreHorizontal, Phone, Search, UserPlus, AlertCircle, Loader2, RefreshCw, Ban, CheckCircle2 } from "lucide-react"
import { toast } from "sonner"

import { ProviderPageHeader } from "@/pages/provider/components/ProviderPrimitives"
import { ProviderShell } from "@/pages/provider/components/ProviderShell"
import { cn } from "@/shared/lib/utils"
import { Button } from "@/shared/ui/button"
import { staffApi, staffQueryKeys, type StaffListItem, type InviteStaffBody } from "@/features/staff/api/staff.api"
import { cafeApi, cafeQueryKeys } from "@/features/cafes/api/cafe.api"

function formatExpiry(isoString: string): { label: string; urgent: boolean } {
  const diff = new Date(isoString).getTime() - Date.now()
  if (diff <= 0) return { label: "Đã hết hạn", urgent: true }
  const hours = Math.floor(diff / 3_600_000)
  const minutes = Math.floor((diff % 3_600_000) / 60_000)
  if (hours >= 24) return { label: `Hết hạn sau ${Math.floor(hours / 24)} ngày`, urgent: false }
  if (hours > 0) return { label: `Hết hạn sau ${hours} giờ ${minutes} phút`, urgent: hours < 4 }
  return { label: `Hết hạn sau ${minutes} phút`, urgent: true }
}

const STATUS_LABELS: Record<StaffListItem["status"], string> = {
  ACTIVE: "Đang hoạt động",
  PENDING: "Chờ kích hoạt",
  DISABLED: "Vô hiệu hóa",
}

const emptyForm: InviteStaffBody = { cafe_id: "", full_name: "", email: "", phone: "" }

export function ProviderStaffPage() {
  const queryClient = useQueryClient()
  const [search, setSearch] = useState("")
  const [selectedCafeId, setSelectedCafeId] = useState<string | undefined>(undefined)
  const [showInviteModal, setShowInviteModal] = useState(false)
  const [form, setForm] = useState<InviteStaffBody>(emptyForm)
  const [transferTarget, setTransferTarget] = useState<StaffListItem | null>(null)
  const [transferCafeId, setTransferCafeId] = useState("")

  const { data: staffList = [], isLoading, isError } = useQuery({
    queryKey: staffQueryKeys.list(selectedCafeId),
    queryFn: () => staffApi.listStaff(selectedCafeId),
  })

  const { data: cafesResp } = useQuery({
    queryKey: cafeQueryKeys.list({ scope: "managed" }),
    queryFn: () => cafeApi.listCafes({ limit: 100, scope: "managed" }),
  })
  const cafes = cafesResp?.data ?? []

  const inviteMutation = useMutation({
    mutationFn: (body: InviteStaffBody) => staffApi.inviteStaff(body),
    onSuccess: (result) => {
      queryClient.invalidateQueries({ queryKey: staffQueryKeys.all })
      setShowInviteModal(false)
      setForm(emptyForm)
      if (!result.emailSent) {
        toast.warning("Đã tạo tài khoản nhưng gửi email thất bại. Dùng 'Gửi lại lời mời' sau.")
      } else {
        toast.success("Đã gửi lời mời cho nhân viên.")
      }
    },
    onError: () => toast.error("Không thể mời nhân viên. Vui lòng thử lại."),
  })

  const deactivateMutation = useMutation({
    mutationFn: (staffId: string) => staffApi.deactivateStaff(staffId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: staffQueryKeys.all })
      toast.success("Đã vô hiệu hóa tài khoản nhân viên.")
    },
    onError: () => toast.error("Không thể vô hiệu hóa. Vui lòng thử lại."),
  })

  const reactivateMutation = useMutation({
    mutationFn: (staffId: string) => staffApi.reactivateStaff(staffId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: staffQueryKeys.all })
      toast.success("Đã kích hoạt lại tài khoản nhân viên.")
    },
    onError: () => toast.error("Không thể kích hoạt lại. Vui lòng thử lại."),
  })

  const transferMutation = useMutation({
    mutationFn: ({ staffId, cafeId }: { staffId: string; cafeId: string }) =>
      staffApi.transferStaff(staffId, cafeId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: staffQueryKeys.all })
      setTransferTarget(null)
      setTransferCafeId("")
      toast.success("Đã chuyển nhân viên sang chi nhánh mới.")
    },
    onError: () => toast.error("Không thể chuyển chi nhánh. Vui lòng thử lại."),
  })

  const resendMutation = useMutation({
    mutationFn: (staffId: string) => staffApi.resendInvite(staffId),
    onSuccess: (result) => {
      if (!result.emailSent) {
        toast.warning("Gửi lại lời mời thất bại. Vui lòng kiểm tra cài đặt email.")
      } else {
        toast.success("Đã gửi lại lời mời thành công.")
      }
    },
    onError: () => toast.error("Không thể gửi lại lời mời."),
  })

  const filtered = staffList.filter(
    (s) =>
      s.fullName.toLowerCase().includes(search.toLowerCase()) ||
      s.email.toLowerCase().includes(search.toLowerCase()) ||
      s.cafeName.toLowerCase().includes(search.toLowerCase()),
  )

  const handleInviteSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!form.cafe_id || !form.full_name || !form.email) {
      toast.error("Vui lòng điền đầy đủ thông tin.")
      return
    }
    inviteMutation.mutate({ ...form, phone: form.phone || undefined })
  }

  return (
    <ProviderShell>
      <ProviderPageHeader
        title="Quản lý nhân sự"
        description="Danh sách nhân viên, trạng thái và quản lý quyền truy cập."
      />

      <section className="mb-4 flex flex-col gap-2 rounded-lg border border-[#c4c7c8] bg-[#fcf8f8] p-2 shadow-[0_4px_6px_-1px_rgba(0,0,0,0.02)] md:flex-row">
        <div className="relative flex flex-grow items-center">
          <Search className="absolute left-3 size-5 text-[#444748]" />
          <input
            className="w-full border-none bg-transparent py-2 pl-10 pr-4 text-base font-semibold leading-relaxed text-[#1c1b1b] placeholder:text-[#747878] focus:ring-0"
            placeholder="Tìm kiếm nhân viên..."
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <div className="mx-2 h-px w-full bg-[#c4c7c8] md:h-auto md:w-px" />
        <select
          className="h-10 cursor-pointer rounded-lg border-none bg-[#f6f3f2] px-3 py-2 text-xs font-bold text-[#1c1b1b] focus:ring-1 focus:ring-[#747878]"
          value={selectedCafeId ?? ""}
          onChange={(e) => setSelectedCafeId(e.target.value || undefined)}
        >
          <option value="">Tất cả chi nhánh</option>
          {cafes.map((c) => (
            <option key={c.id} value={c.id}>{c.name}</option>
          ))}
        </select>
        <div className="mx-2 h-px w-full bg-[#c4c7c8] md:h-auto md:w-px" />
        <Button
          className="h-10 gap-2 rounded-lg bg-[#1c1b1b] text-xs font-bold uppercase tracking-wider text-[#fcf8f8] hover:bg-[#313030]"
          onClick={() => setShowInviteModal(true)}
        >
          <UserPlus className="size-[18px]" />
          Mời nhân viên mới
        </Button>
      </section>

      {isLoading && (
        <div className="flex items-center justify-center py-16">
          <Loader2 className="size-6 animate-spin text-[#747878]" />
        </div>
      )}

      {isError && (
        <div className="flex items-center gap-2 rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700">
          <AlertCircle className="size-4 shrink-0" />
          Không thể tải danh sách nhân viên. Vui lòng thử lại.
        </div>
      )}

      {!isLoading && !isError && (
        <section className="mb-16 grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
          {filtered.map((staff) => (
            <StaffCard
              key={staff.id}
              staff={staff}
              onDeactivate={() => deactivateMutation.mutate(staff.id)}
              onReactivate={() => reactivateMutation.mutate(staff.id)}
              onResend={() => resendMutation.mutate(staff.id)}
              onTransfer={() => { setTransferTarget(staff); setTransferCafeId(staff.cafeId) }}
            />
          ))}
          {filtered.length === 0 && (
            <p className="col-span-full py-12 text-center text-sm text-[#747878]">
              {staffList.length === 0 ? "Chưa có nhân viên nào. Nhấn 'Mời nhân viên mới' để bắt đầu." : "Không tìm thấy nhân viên phù hợp."}
            </p>
          )}
        </section>
      )}

      {showInviteModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-md rounded-xl border border-[#c4c7c8] bg-white p-6 shadow-xl">
            <h2 className="mb-4 text-lg font-bold text-[#1c1b1b]">Mời nhân viên mới</h2>
            <form onSubmit={handleInviteSubmit} className="space-y-3">
              <div>
                <label className="mb-1 block text-xs font-bold uppercase tracking-wider text-[#444748]">Chi nhánh *</label>
                <select
                  required
                  className="w-full rounded-lg border border-[#c4c7c8] bg-white px-3 py-2 text-sm"
                  value={form.cafe_id}
                  onChange={(e) => setForm({ ...form, cafe_id: e.target.value })}
                >
                  <option value="">Chọn chi nhánh</option>
                  {cafes.map((c) => (
                    <option key={c.id} value={c.id}>{c.name}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="mb-1 block text-xs font-bold uppercase tracking-wider text-[#444748]">Họ và tên *</label>
                <input
                  required
                  type="text"
                  className="w-full rounded-lg border border-[#c4c7c8] px-3 py-2 text-sm"
                  value={form.full_name}
                  onChange={(e) => setForm({ ...form, full_name: e.target.value })}
                  placeholder="Nguyễn Văn A"
                />
              </div>
              <div>
                <label className="mb-1 block text-xs font-bold uppercase tracking-wider text-[#444748]">Email *</label>
                <input
                  required
                  type="email"
                  className="w-full rounded-lg border border-[#c4c7c8] px-3 py-2 text-sm"
                  value={form.email}
                  onChange={(e) => setForm({ ...form, email: e.target.value })}
                  placeholder="nhanvien@example.com"
                />
              </div>
              <div>
                <label className="mb-1 block text-xs font-bold uppercase tracking-wider text-[#444748]">Số điện thoại</label>
                <input
                  type="tel"
                  className="w-full rounded-lg border border-[#c4c7c8] px-3 py-2 text-sm"
                  value={form.phone}
                  onChange={(e) => setForm({ ...form, phone: e.target.value })}
                  placeholder="090 123 4567"
                />
              </div>
              <div className="flex gap-2 pt-2">
                <Button
                  type="button"
                  variant="outline"
                  className="flex-1"
                  onClick={() => { setShowInviteModal(false); setForm(emptyForm) }}
                >
                  Hủy
                </Button>
                <Button
                  type="submit"
                  className="flex-1 bg-[#1c1b1b] text-white hover:bg-[#313030]"
                  disabled={inviteMutation.isPending}
                >
                  {inviteMutation.isPending ? <Loader2 className="size-4 animate-spin" /> : "Gửi lời mời"}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
      {transferTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-sm rounded-xl border border-[#c4c7c8] bg-white p-6 shadow-xl">
            <h2 className="mb-1 text-lg font-bold text-[#1c1b1b]">Chuyển chi nhánh</h2>
            <p className="mb-4 text-sm text-[#747878]">
              Chuyển <span className="font-semibold text-[#1c1b1b]">{transferTarget.fullName}</span> sang chi nhánh khác.
            </p>
            <div className="mb-4">
              <label className="mb-1 block text-xs font-bold uppercase tracking-wider text-[#444748]">Chi nhánh mới</label>
              <select
                className="w-full rounded-lg border border-[#c4c7c8] bg-white px-3 py-2 text-sm"
                value={transferCafeId}
                onChange={(e) => setTransferCafeId(e.target.value)}
              >
                {cafes.map((c) => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </select>
            </div>
            <div className="flex gap-2">
              <Button
                type="button"
                variant="outline"
                className="flex-1"
                onClick={() => { setTransferTarget(null); setTransferCafeId("") }}
              >
                Hủy
              </Button>
              <Button
                type="button"
                className="flex-1 bg-[#1c1b1b] text-white hover:bg-[#313030]"
                disabled={transferMutation.isPending || transferCafeId === transferTarget.cafeId}
                onClick={() => transferMutation.mutate({ staffId: transferTarget.id, cafeId: transferCafeId })}
              >
                {transferMutation.isPending ? <Loader2 className="size-4 animate-spin" /> : "Xác nhận"}
              </Button>
            </div>
          </div>
        </div>
      )}
    </ProviderShell>
  )
}

function StaffCard({
  staff,
  onDeactivate,
  onReactivate,
  onResend,
  onTransfer,
}: {
  staff: StaffListItem
  onDeactivate: () => void
  onReactivate: () => void
  onResend: () => void
  onTransfer: () => void
}) {
  const [menuOpen, setMenuOpen] = useState(false)

  return (
    <article
      className={cn(
        "group relative rounded-xl border border-[#c4c7c8] bg-[#fcf8f8] p-5 transition-colors hover:border-[#747878]",
        staff.status === "DISABLED" && "opacity-60 grayscale-[0.5]",
        staff.status === "PENDING" && "opacity-80",
      )}
    >
      {/* Decorative corner — needs its own overflow-hidden wrapper so the article can overflow for the dropdown */}
      {staff.status === "ACTIVE" && (
        <div className="pointer-events-none absolute inset-0 overflow-hidden rounded-xl">
          <div className="absolute right-0 top-0 size-16 rounded-bl-full bg-[#e5e2e1] opacity-50 transition-transform group-hover:scale-110" />
        </div>
      )}

      <div className="relative z-10 mb-4 flex items-start justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="flex size-12 items-center justify-center rounded-full border border-[#c4c7c8] bg-[#ebe7e7] text-xl font-bold text-[#444748]">
            {staff.fullName.charAt(0).toUpperCase()}
          </div>
          <div>
            <h3 className="text-lg font-bold leading-relaxed text-[#1c1b1b]">{staff.fullName}</h3>
            <p className="text-xs font-bold uppercase tracking-wider text-[#747878]">Nhân viên</p>
          </div>
        </div>
        <span className={statusClassName(staff.status)}>{STATUS_LABELS[staff.status]}</span>
      </div>

      <div className="relative z-10 mt-4 space-y-2 text-xs font-semibold text-[#5d5f5f]">
        {staff.phone && (
          <div className="flex items-center gap-2">
            <Phone className="size-4 text-[#747878]" />
            <span className="tabular-nums">{staff.phone}</span>
          </div>
        )}
        <div className="flex items-center gap-2">
          <Mail className="size-4 text-[#747878]" />
          <span className="truncate normal-case">{staff.email}</span>
        </div>
        <div className="flex items-center gap-2">
          <MapPin className="size-4 text-[#747878]" />
          <span className="normal-case">{staff.cafeName}</span>
        </div>
        {staff.status === "PENDING" && staff.inviteExpiresAt && (() => {
          const { label, urgent } = formatExpiry(staff.inviteExpiresAt)
          return (
            <div className={cn(
              "flex items-center gap-2 rounded-md px-2 py-1",
              urgent ? "bg-red-50 text-red-600" : "bg-amber-50 text-amber-700",
            )}>
              <Clock className="size-4 shrink-0" />
              <span className="normal-case">{label}</span>
            </div>
          )
        })()}
      </div>

      <div className="relative z-10 mt-5 flex items-center justify-end border-t border-[#c4c7c8] pt-4">
        <div className="relative">
          <button
            className="p-1 text-[#444748] transition-colors hover:text-[#1c1b1b]"
            onClick={() => setMenuOpen(!menuOpen)}
          >
            <MoreHorizontal className="size-5" />
          </button>
          {menuOpen && (
            <div
              className="absolute right-0 top-8 z-20 min-w-[180px] rounded-lg border border-[#c4c7c8] bg-white py-1 shadow-lg"
              onMouseLeave={() => setMenuOpen(false)}
            >
              {staff.status === "PENDING" && (
                <button
                  className="flex w-full items-center gap-2 px-4 py-2 text-sm hover:bg-[#f6f3f2]"
                  onClick={() => { setMenuOpen(false); onResend() }}
                >
                  <RefreshCw className="size-4 text-[#747878]" />
                  Gửi lại lời mời
                </button>
              )}
              {(staff.status === "ACTIVE" || staff.status === "PENDING") && (
                <button
                  className="flex w-full items-center gap-2 px-4 py-2 text-sm hover:bg-[#f6f3f2]"
                  onClick={() => { setMenuOpen(false); onTransfer() }}
                >
                  <ArrowLeftRight className="size-4 text-[#747878]" />
                  Chuyển chi nhánh
                </button>
              )}
              {staff.status === "ACTIVE" && (
                <button
                  className="flex w-full items-center gap-2 px-4 py-2 text-sm text-red-600 hover:bg-red-50"
                  onClick={() => { setMenuOpen(false); onDeactivate() }}
                >
                  <Ban className="size-4" />
                  Vô hiệu hóa
                </button>
              )}
              {staff.status === "DISABLED" && (
                <button
                  className="flex w-full items-center gap-2 px-4 py-2 text-sm text-green-700 hover:bg-green-50"
                  onClick={() => { setMenuOpen(false); onReactivate() }}
                >
                  <CheckCircle2 className="size-4" />
                  Kích hoạt lại
                </button>
              )}
            </div>
          )}
        </div>
      </div>
    </article>
  )
}

function statusClassName(status: StaffListItem["status"]) {
  if (status === "ACTIVE") {
    return "inline-flex rounded bg-[#e6f4ea] px-2 py-1 font-mono text-[10px] font-bold uppercase tracking-wider text-[#137333]"
  }
  if (status === "PENDING") {
    return "inline-flex rounded bg-[#fef7e0] px-2 py-1 font-mono text-[10px] font-bold uppercase tracking-wider text-[#b06000]"
  }
  return "inline-flex rounded border border-[#c4c7c8] bg-[#ebe7e7] px-2 py-1 font-mono text-[10px] font-bold uppercase tracking-wider text-[#444748]"
}
