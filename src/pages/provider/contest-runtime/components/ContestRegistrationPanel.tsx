import { useMemo, useState } from "react"
import {
  AlertTriangle,
  BadgeCheck,
  CircleDollarSign,
  Search,
  TicketSlash,
} from "lucide-react"
import type { ContestRegistration } from "@/features/contests/types"
import {
  formatContestDateTime,
  getRegistrationDisplayName,
  getRegistrationSubtitle,
} from "@/features/contests/lib/contest-runtime"
import {
  getPaymentStatusClass,
  getRegistrationStatusClass,
} from "@/features/contests/lib/contest-status"
import { Panel, PanelTitle } from "@/pages/provider/components/ProviderPrimitives"
import { Badge } from "@/shared/ui/badge"
import { Button } from "@/shared/ui/button"
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/shared/ui/dialog"
import { Input } from "@/shared/ui/input"
import { Label } from "@/shared/ui/label"
import { Textarea } from "@/shared/ui/textarea"
import { toast } from "sonner"
import { getErrorMessage } from "@/features/contests/lib/contest-runtime"
import type { useContestWorkspace } from "@/features/contests/hooks/useContestWorkspace"

type WorkspaceHook = ReturnType<typeof useContestWorkspace>

type DialogState =
  | { kind: null; registration: null }
  | {
      kind:
        | "markPaid"
        | "waive"
        | "approve"
        | "reject"
        | "cancel"
      registration: ContestRegistration
    }

export function ContestRegistrationPanel({
  registrations,
  workspace,
}: {
  registrations: ContestRegistration[]
  workspace: WorkspaceHook
}) {
  const [search, setSearch] = useState("")
  const [statusFilter, setStatusFilter] = useState<"ALL" | ContestRegistration["status"]>("ALL")
  const [paymentFilter, setPaymentFilter] = useState<"ALL" | ContestRegistration["paymentStatus"]>("ALL")
  const [dialogState, setDialogState] = useState<DialogState>({
    kind: null,
    registration: null,
  })
  const [reason, setReason] = useState("")

  const filteredRegistrations = useMemo(() => {
    const normalized = search.trim().toLowerCase()
    return registrations.filter((registration) => {
      const matchesSearch =
        normalized.length === 0 ||
        registration.id.toLowerCase().includes(normalized) ||
        (registration.checkInCode ?? "").toLowerCase().includes(normalized) ||
        getRegistrationDisplayName(registration).toLowerCase().includes(normalized) ||
        (registration.participant?.email ?? "").toLowerCase().includes(normalized)
      const matchesStatus =
        statusFilter === "ALL" || registration.status === statusFilter
      const matchesPayment =
        paymentFilter === "ALL" || registration.paymentStatus === paymentFilter
      return matchesSearch && matchesStatus && matchesPayment
    })
  }, [paymentFilter, registrations, search, statusFilter])

  const summary = useMemo(
    () => ({
      total: registrations.length,
      pending: registrations.filter((item) => item.status === "PENDING").length,
      confirmed: registrations.filter((item) => item.status === "CONFIRMED").length,
      checkedIn: registrations.filter((item) => item.status === "CHECKED_IN").length,
    }),
    [registrations],
  )

  const closeDialog = () => {
    setDialogState({ kind: null, registration: null })
    setReason("")
  }

  const handleDialogAction = async () => {
    const registration = dialogState.registration
    if (!registration || !dialogState.kind) return

    try {
      if (dialogState.kind === "markPaid") {
        await workspace.eventDay.markPaidMutation.mutateAsync({
          registrationId: registration.id,
          note: reason || undefined,
        })
      } else if (dialogState.kind === "waive") {
        await workspace.eventDay.waiveFeeMutation.mutateAsync({
          registrationId: registration.id,
          note: reason || undefined,
        })
      } else if (dialogState.kind === "approve") {
        await workspace.eventDay.approveMutation.mutateAsync({
          registrationId: registration.id,
          reason: reason || undefined,
        })
      } else if (dialogState.kind === "reject") {
        await workspace.eventDay.rejectMutation.mutateAsync({
          registrationId: registration.id,
          reason: reason || undefined,
        })
      } else {
        await workspace.eventDay.cancelRegistrationMutation.mutateAsync(
          registration.id,
        )
      }
      toast.success("Đã cập nhật đăng ký")
      closeDialog()
    } catch (error) {
      toast.error("Không thể cập nhật đăng ký", {
        description: getErrorMessage(error).message,
      })
    }
  }

  return (
    <div className="space-y-4">
      <div className="grid gap-4 lg:grid-cols-4">
        <SummaryCard label="Tổng đăng ký" value={String(summary.total)} icon={<BadgeCheck className="size-4" />} />
        <SummaryCard label="Chờ duyệt" value={String(summary.pending)} icon={<AlertTriangle className="size-4" />} />
        <SummaryCard label="Đã xác nhận" value={String(summary.confirmed)} icon={<CircleDollarSign className="size-4" />} />
        <SummaryCard label="Đã check-in" value={String(summary.checkedIn)} icon={<TicketSlash className="size-4" />} />
      </div>

      <Panel>
        <PanelTitle
          title="Quản lý người chơi và đăng ký"
          subtitle="Tách riêng phần duyệt danh sách, xử lý lệ phí tay và trạng thái tham gia."
        />

        <div className="mb-4 grid gap-3 xl:grid-cols-[minmax(0,1.4fr)_220px_220px]">
          <div className="relative">
            <Search className="absolute left-3 top-3.5 size-4 text-[#747878]" />
            <Input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Tìm theo tên, email, mã check-in hoặc registration id"
              className="pl-9"
            />
          </div>
          <select
            className="h-10 rounded-lg border border-[#c4c7c8] bg-white px-3 text-sm"
            value={statusFilter}
            onChange={(event) =>
              setStatusFilter(event.target.value as typeof statusFilter)
            }
          >
            <option value="ALL">Tất cả trạng thái</option>
            <option value="PENDING">PENDING</option>
            <option value="CONFIRMED">CONFIRMED</option>
            <option value="CHECKED_IN">CHECKED_IN</option>
            <option value="CANCELLED">CANCELLED</option>
          </select>
          <select
            className="h-10 rounded-lg border border-[#c4c7c8] bg-white px-3 text-sm"
            value={paymentFilter}
            onChange={(event) =>
              setPaymentFilter(event.target.value as typeof paymentFilter)
            }
          >
            <option value="ALL">Tất cả thanh toán</option>
            <option value="NOT_REQUIRED">NOT_REQUIRED</option>
            <option value="PENDING_PAYMENT">PENDING_PAYMENT</option>
            <option value="PENDING_REVIEW">PENDING_REVIEW</option>
            <option value="WAIVED">WAIVED</option>
            <option value="MARKED_PAID">MARKED_PAID</option>
          </select>
        </div>

        <div className="space-y-3">
          {filteredRegistrations.map((registration) => (
            <article
              key={registration.id}
              className="rounded-xl border border-[#e5e2e1] bg-[#fcf8f8] p-4"
            >
              <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="text-sm font-extrabold text-[#1c1b1b]">
                      {getRegistrationDisplayName(registration)}
                    </p>
                    <Badge
                      className={`border ${getRegistrationStatusClass(registration.status)}`}
                    >
                      {registration.status}
                    </Badge>
                    <Badge
                      className={`border ${getPaymentStatusClass(registration.paymentStatus)}`}
                    >
                      {registration.paymentStatus}
                    </Badge>
                    {registration.customerJourneyStatus ? (
                      <Badge className="border border-[#c4c7c8] bg-white text-[#444748]">
                        {registration.customerJourneyStatus}
                      </Badge>
                    ) : null}
                  </div>

                  <p className="mt-1 text-xs font-semibold text-[#747878]">
                    {getRegistrationSubtitle(registration) ??
                      `Registration ${registration.id.slice(0, 8)}`}
                  </p>

                  <div className="mt-3 grid gap-2 text-xs font-semibold text-[#5d5f5f] md:grid-cols-2 xl:grid-cols-4">
                    <MetaRow
                      label="Mã check-in"
                      value={registration.checkInCode ?? "--"}
                    />
                    <MetaRow
                      label="Lệ phí"
                      value={
                        registration.entryFeeAmount
                          ? formatCurrency(registration.entryFeeAmount)
                          : "--"
                      }
                    />
                    <MetaRow
                      label="Check-in"
                      value={formatContestDateTime(registration.checkedInAt)}
                    />
                    <MetaRow
                      label="Trận gần nhất"
                      value={
                        registration.latestMatch?.name ??
                        (registration.latestMatch
                          ? `R${registration.latestMatch.roundNo} · M${registration.latestMatch.matchNo}`
                          : "--")
                      }
                    />
                  </div>
                </div>

                <div className="flex flex-wrap gap-2 xl:max-w-[440px] xl:justify-end">
                  <TinyAction
                    label="Đánh dấu đã thu"
                    disabled={registration.paymentStatus === "MARKED_PAID"}
                    onClick={() =>
                      setDialogState({ kind: "markPaid", registration })
                    }
                  />
                  <TinyAction
                    label="Miễn phí"
                    disabled={registration.paymentStatus === "WAIVED"}
                    onClick={() =>
                      setDialogState({ kind: "waive", registration })
                    }
                  />
                  <Button
                    className="h-8 rounded-lg bg-emerald-600 px-3 text-xs text-white hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-50"
                    disabled={registration.status !== "PENDING"}
                    onClick={() =>
                      setDialogState({ kind: "approve", registration })
                    }
                  >
                    Duyệt
                  </Button>
                  <Button
                    variant="outline"
                    className="h-8 rounded-lg border-red-200 bg-red-50 px-3 text-xs text-red-700 hover:bg-red-100 disabled:cursor-not-allowed disabled:opacity-50"
                    disabled={registration.status === "CANCELLED"}
                    onClick={() =>
                      setDialogState({ kind: "reject", registration })
                    }
                  >
                    Từ chối
                  </Button>
                  <Button
                    variant="outline"
                    className="h-8 rounded-lg border-[#c4c7c8] bg-white px-3 text-xs text-[#1c1b1b] hover:bg-[#f6f3f2] disabled:cursor-not-allowed disabled:opacity-50"
                    disabled={registration.status === "CANCELLED"}
                    onClick={() =>
                      setDialogState({ kind: "cancel", registration })
                    }
                  >
                    Hủy đăng ký
                  </Button>
                </div>
              </div>
            </article>
          ))}

          {filteredRegistrations.length === 0 ? (
            <div className="rounded-lg border border-dashed border-[#c4c7c8] p-8 text-center text-sm font-semibold text-[#747878]">
              Không có đăng ký phù hợp bộ lọc.
            </div>
          ) : null}
        </div>
      </Panel>

      <Dialog open={Boolean(dialogState.kind)} onOpenChange={closeDialog}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>{dialogTitle(dialogState.kind)}</DialogTitle>
          </DialogHeader>
          <div className="space-y-2">
            <Label className="text-sm font-bold text-[#1c1b1b]">
              Ghi chú / lý do
            </Label>
            <Textarea
              rows={4}
              value={reason}
              onChange={(event) => setReason(event.target.value)}
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={closeDialog}>
              Hủy
            </Button>
            <Button onClick={() => void handleDialogAction()}>Xác nhận</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

function SummaryCard({
  label,
  value,
  icon,
}: {
  label: string
  value: string
  icon: React.ReactNode
}) {
  return (
    <div className="rounded-xl border border-[#c4c7c8] bg-white p-4 shadow-sm">
      <div className="mb-3 flex items-center justify-between gap-2">
        <span className="text-xs font-extrabold uppercase tracking-wider text-[#747878]">
          {label}
        </span>
        <span className="text-[#5d5f5f]">{icon}</span>
      </div>
      <div className="text-2xl font-extrabold text-[#1c1b1b]">{value}</div>
    </div>
  )
}

function MetaRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border border-[#e5e2e1] bg-white px-3 py-2">
      <p className="text-[10px] font-extrabold uppercase tracking-wider text-[#747878]">
        {label}
      </p>
      <p className="mt-1 text-sm font-bold text-[#1c1b1b]">{value}</p>
    </div>
  )
}

function TinyAction({
  label,
  onClick,
  disabled,
}: {
  label: string
  onClick: () => void
  disabled?: boolean
}) {
  return (
    <Button
      variant="outline"
      className="h-8 rounded-lg border-[#c4c7c8] bg-white px-3 text-xs text-[#1c1b1b] hover:bg-[#f6f3f2] disabled:cursor-not-allowed disabled:opacity-50"
      disabled={disabled}
      onClick={onClick}
    >
      {label}
    </Button>
  )
}

function dialogTitle(kind: DialogState["kind"]) {
  switch (kind) {
    case "markPaid":
      return "Đánh dấu đã thu lệ phí"
    case "waive":
      return "Miễn lệ phí tham gia"
    case "approve":
      return "Duyệt người chơi vào giải"
    case "reject":
      return "Từ chối đăng ký"
    case "cancel":
      return "Hủy đăng ký"
    default:
      return "Cập nhật đăng ký"
  }
}

function formatCurrency(value: number) {
  return new Intl.NumberFormat("vi-VN", {
    style: "currency",
    currency: "VND",
    maximumFractionDigits: 0,
  }).format(value)
}
