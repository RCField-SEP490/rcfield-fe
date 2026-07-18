import { useMemo, useState } from "react"
import {
  AlertTriangle,
  BadgeCheck,
  CircleDollarSign,
  Search,
  TicketSlash,
} from "lucide-react"
import type { ContestRegistration } from "@/features/contests/types"
import { getRegistrationDisplayName } from "@/features/contests/lib/contest-runtime"
import { Panel, PanelTitle } from "@/pages/provider/components/ProviderPrimitives"
import { Button } from "@/shared/ui/button"
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/shared/ui/dialog"
import { Input } from "@/shared/ui/input"
import { Label } from "@/shared/ui/label"
import { Textarea } from "@/shared/ui/textarea"
import { toast } from "sonner"
import { getErrorMessage } from "@/features/contests/lib/contest-runtime"
import type { useContestWorkspace } from "@/features/contests/hooks/useContestWorkspace"
import { ContestRegistrationTable } from "./ContestRegistrationTable"
import type { RegistrationActionKind } from "./RegistrationRowActions"

type WorkspaceHook = ReturnType<typeof useContestWorkspace>

type DialogState =
  | { kind: null; registration: null }
  | {
      kind: RegistrationActionKind
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

  const openDialog = (
    kind: RegistrationActionKind,
    registration: ContestRegistration,
  ) => {
    setDialogState({ kind, registration })
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
        <div className="mb-4 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm font-semibold text-amber-900">
          Lệ phí là phí tham gia contest. Customer có thể thanh toán VNPay nếu
          registration đang chờ phí; còn nút "Đánh dấu đã thu" dùng khi
          provider/staff đã thu trực tiếp bên ngoài hệ thống và cần xác nhận lại
          trên dashboard.
        </div>

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

        <ContestRegistrationTable
          registrations={filteredRegistrations}
          onAction={openDialog}
        />
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
