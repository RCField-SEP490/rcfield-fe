import type { ContestRegistration } from "@/features/contests/types"
import { Panel, PanelTitle } from "@/pages/provider/components/ProviderPrimitives"
import type { useContestWorkspace } from "@/features/contests/hooks/useContestWorkspace"
import { ContestRegistrationTable } from "./ContestRegistrationTable"
import { RegistrationActionDialog } from "./registration/RegistrationActionDialog"
import {
  RegistrationFilters,
  RegistrationSummary,
} from "./registration/RegistrationFilters"
import { useRegistrationActionDialog } from "./registration/useRegistrationActionDialog"
import { useRegistrationFilters } from "./registration/useRegistrationFilters"

type WorkspaceHook = ReturnType<typeof useContestWorkspace>

export function ContestRegistrationPanel({
  registrations,
  workspace,
}: {
  registrations: ContestRegistration[]
  workspace: WorkspaceHook
}) {
  const {
    search,
    setSearch,
    statusFilter,
    setStatusFilter,
    paymentFilter,
    setPaymentFilter,
    filteredRegistrations,
    summary,
  } = useRegistrationFilters(registrations)

  const {
    dialogState,
    reason,
    setReason,
    openDialog,
    closeDialog,
    handleDialogAction,
  } = useRegistrationActionDialog(workspace)

  return (
    <div className="space-y-4">
      <RegistrationSummary summary={summary} />

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

        <RegistrationFilters
          search={search}
          onSearchChange={setSearch}
          statusFilter={statusFilter}
          onStatusFilterChange={setStatusFilter}
          paymentFilter={paymentFilter}
          onPaymentFilterChange={setPaymentFilter}
        />

        <ContestRegistrationTable
          registrations={filteredRegistrations}
          onAction={openDialog}
        />
      </Panel>

      <RegistrationActionDialog
        kind={dialogState.kind}
        open={Boolean(dialogState.kind)}
        onOpenChange={closeDialog}
        reason={reason}
        onReasonChange={setReason}
        onConfirm={handleDialogAction}
      />
    </div>
  )
}
