import { useMemo, useState } from "react"
import { CheckCircle2, QrCode, Search } from "lucide-react"
import type { ContestItem, ContestRegistration } from "@/features/contests/types"
import {
  getErrorMessage,
  formatContestDateTime,
} from "@/features/contests/lib/contest-runtime"
import {
  getPaymentStatusClass,
  getRegistrationStatusClass,
} from "@/features/contests/lib/contest-status"
import { Panel, PanelTitle } from "@/pages/provider/components/ProviderPrimitives"
import { Badge } from "@/shared/ui/badge"
import { Button } from "@/shared/ui/button"
import { Input } from "@/shared/ui/input"
import { Label } from "@/shared/ui/label"
import { toast } from "sonner"
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/shared/ui/dialog"
import { Textarea } from "@/shared/ui/textarea"
import type { useContestEventDay } from "@/features/contests/hooks/useContestEventDay"

type EventDayHook = ReturnType<typeof useContestEventDay>

export function ContestEventDayPanel({
  contest,
  registrations,
  selectedCafeId,
  onChangeSelectedCafeId,
  eventDay,
}: {
  contest: ContestItem
  registrations: ContestRegistration[]
  selectedCafeId: string
  onChangeSelectedCafeId: (cafeId: string) => void
  eventDay: EventDayHook
}) {
  const [search, setSearch] = useState("")
  const [statusFilter, setStatusFilter] = useState<"ALL" | ContestRegistration["status"]>("ALL")
  const [paymentFilter, setPaymentFilter] = useState<"ALL" | ContestRegistration["paymentStatus"]>("ALL")
  const [lookupCode, setLookupCode] = useState("")
  const [dialogState, setDialogState] = useState<{
    kind: "markPaid" | "waive" | "approve" | "reject" | null
    registration: ContestRegistration | null
  }>({ kind: null, registration: null })
  const [reason, setReason] = useState("")

  const filteredRegistrations = useMemo(() => {
    return registrations.filter((registration) => {
      const matchesSearch =
        search.trim() === "" ||
        registration.id.toLowerCase().includes(search.toLowerCase()) ||
        (registration.checkInCode ?? "").toLowerCase().includes(search.toLowerCase())
      const matchesStatus = statusFilter === "ALL" || registration.status === statusFilter
      const matchesPayment = paymentFilter === "ALL" || registration.paymentStatus === paymentFilter
      return matchesSearch && matchesStatus && matchesPayment
    })
  }, [paymentFilter, registrations, search, statusFilter])

  const handleLookup = async () => {
    if (!lookupCode.trim()) return
    try {
      await eventDay.lookupMutation.mutateAsync(lookupCode.trim())
    } catch (error) {
      toast.error("Không thể tra cứu registration", { description: getErrorMessage(error).message })
    }
  }

  const handleCheckIn = async (registrationId: string) => {
    if (!selectedCafeId) {
      toast.error("Vui lòng chọn branch check-in trước.")
      return
    }
    try {
      await eventDay.checkInMutation.mutateAsync({ registrationId, checkedInCafeId: selectedCafeId })
      toast.success("Đã check-in registration")
    } catch (error) {
      toast.error("Không thể check-in", { description: getErrorMessage(error).message })
    }
  }

  const handleDialogAction = async () => {
    const registration = dialogState.registration
    const kind = dialogState.kind
    if (!registration || !kind) return

    try {
      if (kind === "markPaid") {
        await eventDay.markPaidMutation.mutateAsync({ registrationId: registration.id, note: reason || undefined })
      } else if (kind === "waive") {
        await eventDay.waiveFeeMutation.mutateAsync({ registrationId: registration.id, note: reason || undefined })
      } else if (kind === "approve") {
        await eventDay.approveMutation.mutateAsync({ registrationId: registration.id, reason: reason || undefined })
      } else {
        await eventDay.rejectMutation.mutateAsync({ registrationId: registration.id, reason: reason || undefined })
      }
      toast.success("Đã cập nhật registration")
      setDialogState({ kind: null, registration: null })
      setReason("")
    } catch (error) {
      toast.error("Không thể cập nhật registration", { description: getErrorMessage(error).message })
    }
  }

  const lookupRegistration = eventDay.lookupMutation.data

  return (
    <div className="grid gap-4 xl:grid-cols-[1.1fr_0.9fr]">
      <Panel>
        <PanelTitle title="Registrations live" subtitle="Xử lý payment status, approval và check-in theo dữ liệu thật." />

        <div className="mb-4 flex flex-col gap-3 lg:flex-row">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-3.5 size-4 text-[#747878]" />
            <Input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Tìm registration id hoặc check-in code"
              className="pl-9"
            />
          </div>
          <select
            className="h-10 rounded-lg border border-[#c4c7c8] bg-white px-3 text-sm"
            value={statusFilter}
            onChange={(event) => setStatusFilter(event.target.value as typeof statusFilter)}
          >
            <option value="ALL">Tất cả status</option>
            <option value="PENDING">PENDING</option>
            <option value="CONFIRMED">CONFIRMED</option>
            <option value="CHECKED_IN">CHECKED_IN</option>
            <option value="CANCELLED">CANCELLED</option>
          </select>
          <select
            className="h-10 rounded-lg border border-[#c4c7c8] bg-white px-3 text-sm"
            value={paymentFilter}
            onChange={(event) => setPaymentFilter(event.target.value as typeof paymentFilter)}
          >
            <option value="ALL">Tất cả payment</option>
            <option value="PENDING_PAYMENT">PENDING_PAYMENT</option>
            <option value="PENDING_REVIEW">PENDING_REVIEW</option>
            <option value="WAIVED">WAIVED</option>
            <option value="MARKED_PAID">MARKED_PAID</option>
            <option value="NOT_REQUIRED">NOT_REQUIRED</option>
          </select>
        </div>

        <div className="space-y-3">
          {filteredRegistrations.map((registration) => (
            <article key={registration.id} className="rounded-lg border border-[#e5e2e1] bg-white p-4">
              <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="text-sm font-extrabold text-[#1c1b1b]">{registration.id.slice(0, 8)}</p>
                    <Badge className={`border ${getRegistrationStatusClass(registration.status)}`}>{registration.status}</Badge>
                    <Badge className={`border ${getPaymentStatusClass(registration.paymentStatus)}`}>{registration.paymentStatus}</Badge>
                  </div>
                  <div className="mt-2 flex flex-wrap gap-x-4 gap-y-2 text-xs font-semibold text-[#747878]">
                    <span>Check-in code: {registration.checkInCode ?? "--"}</span>
                    <span>Checked in: {formatContestDateTime(registration.checkedInAt)}</span>
                    <span>Fee: {registration.entryFeeAmount ? formatCurrency(registration.entryFeeAmount) : "--"}</span>
                  </div>
                </div>

                <div className="flex flex-wrap gap-2">
                  <ActionButton label="Mark paid" onClick={() => setDialogState({ kind: "markPaid", registration })} />
                  <ActionButton label="Waive" onClick={() => setDialogState({ kind: "waive", registration })} />
                  <Button className="h-8 rounded-lg bg-emerald-600 px-3 text-xs text-white hover:bg-emerald-700" onClick={() => setDialogState({ kind: "approve", registration })}>
                    Approve
                  </Button>
                  <Button variant="outline" className="h-8 rounded-lg border-red-200 bg-red-50 px-3 text-xs text-red-700 hover:bg-red-100" onClick={() => setDialogState({ kind: "reject", registration })}>
                    Reject
                  </Button>
                  <Button variant="outline" className="h-8 rounded-lg border-blue-200 bg-blue-50 px-3 text-xs text-blue-700 hover:bg-blue-100" onClick={() => void handleCheckIn(registration.id)}>
                    Check-in
                  </Button>
                </div>
              </div>
            </article>
          ))}

          {filteredRegistrations.length === 0 ? (
            <div className="rounded-lg border border-dashed border-[#c4c7c8] p-8 text-center text-sm font-semibold text-[#747878]">
              Không có registration phù hợp bộ lọc.
            </div>
          ) : null}
        </div>
      </Panel>

      <div className="space-y-4">
        <Panel>
          <PanelTitle title="Quick lookup" subtitle="Tra cứu nhanh theo check-in code và xác nhận tại branch hiện trường." />
          <div className="space-y-3">
            <Label className="text-sm font-bold text-[#1c1b1b]">Branch check-in</Label>
            <select
              className="h-10 w-full rounded-lg border border-[#c4c7c8] bg-white px-3 text-sm"
              value={selectedCafeId}
              onChange={(event) => onChangeSelectedCafeId(event.target.value)}
            >
              {contest.participating_branches.map((branch) => (
                <option key={branch.id} value={branch.cafe_id}>
                  {branch.cafe?.name ?? branch.cafe_id}
                </option>
              ))}
            </select>
            <div className="flex gap-2">
              <Input
                value={lookupCode}
                onChange={(event) => setLookupCode(event.target.value)}
                placeholder="Nhập check-in code"
              />
              <Button className="h-10 gap-2 rounded-lg bg-[#1c1b1b] text-white hover:bg-[#313030]" onClick={() => void handleLookup()}>
                <QrCode className="size-4" />
                Tra cứu
              </Button>
            </div>
          </div>
        </Panel>

        <Panel>
          <PanelTitle title="Lookup result" subtitle="Kết quả tra cứu mới nhất từ API event-day." />
          {eventDay.lookupMutation.isPending ? (
            <p className="text-sm font-semibold text-[#747878]">Đang tra cứu...</p>
          ) : lookupRegistration ? (
            <div className="space-y-3">
              <div className="flex flex-wrap items-center gap-2">
                <p className="text-sm font-extrabold text-[#1c1b1b]">{lookupRegistration.id.slice(0, 8)}</p>
                <Badge className={`border ${getRegistrationStatusClass(lookupRegistration.status)}`}>{lookupRegistration.status}</Badge>
                <Badge className={`border ${getPaymentStatusClass(lookupRegistration.paymentStatus)}`}>{lookupRegistration.paymentStatus}</Badge>
              </div>
              <div className="space-y-2 text-sm font-semibold text-[#5d5f5f]">
                <p>Check-in code: {lookupRegistration.checkInCode ?? "--"}</p>
                <p>Checked in: {formatContestDateTime(lookupRegistration.checkedInAt)}</p>
                <p>Payment status: {lookupRegistration.paymentStatus}</p>
              </div>
              <Button className="h-10 gap-2 rounded-lg bg-blue-600 text-white hover:bg-blue-700" onClick={() => void handleCheckIn(lookupRegistration.id)}>
                <CheckCircle2 className="size-4" />
                Xác nhận check-in
              </Button>
            </div>
          ) : (
            <p className="text-sm font-semibold text-[#747878]">Chưa có kết quả tra cứu.</p>
          )}
        </Panel>
      </div>

      <Dialog open={Boolean(dialogState.kind)} onOpenChange={() => setDialogState({ kind: null, registration: null })}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>
              {dialogState.kind === "markPaid"
                ? "Mark entry fee paid"
                : dialogState.kind === "waive"
                  ? "Waive entry fee"
                  : dialogState.kind === "approve"
                    ? "Approve registration"
                    : "Reject registration"}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-2">
            <Label className="text-sm font-bold text-[#1c1b1b]">Ghi chú / lý do</Label>
            <Textarea rows={4} value={reason} onChange={(event) => setReason(event.target.value)} />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogState({ kind: null, registration: null })}>Hủy</Button>
            <Button onClick={() => void handleDialogAction()}>Xác nhận</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

function ActionButton({ label, onClick }: { label: string; onClick: () => void }) {
  return (
    <Button
      type="button"
      variant="outline"
      className="h-8 rounded-lg border-[#c4c7c8] bg-[#f6f3f2] px-3 text-xs text-[#1c1b1b] hover:bg-[#ebe7e7]"
      onClick={onClick}
    >
      {label}
    </Button>
  )
}

function formatCurrency(value: number) {
  return new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND", maximumFractionDigits: 0 }).format(value)
}
