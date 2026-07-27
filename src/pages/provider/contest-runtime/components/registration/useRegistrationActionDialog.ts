import { useState } from "react"
import { toast } from "sonner"
import type { ContestRegistration } from "@/features/contests/types"
import { getErrorMessage } from "@/features/contests/lib/contest-runtime"
import type { useContestWorkspace } from "@/features/contests/hooks/useContestWorkspace"
import type { RegistrationActionKind } from "../RegistrationRowActions"

type WorkspaceHook = ReturnType<typeof useContestWorkspace>

type DialogState =
  | { kind: null; registration: null }
  | { kind: RegistrationActionKind; registration: ContestRegistration }

export function useRegistrationActionDialog(workspace: WorkspaceHook) {
  const [dialogState, setDialogState] = useState<DialogState>({
    kind: null,
    registration: null,
  })
  const [reason, setReason] = useState("")

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
      } else if (dialogState.kind === "confirmRefund") {
        const refundTxnId = (dialogState.registration.metadata?.refund_txn_id as string | undefined) ?? ""
        if (!refundTxnId) {
          throw new Error("Thiếu mã giao dịch hoàn tiền")
        }
        await workspace.confirmEntryFeeRefundMutation.mutateAsync({
          registrationId: registration.id,
          refundTxnId,
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

  return {
    dialogState,
    reason,
    setReason,
    openDialog,
    closeDialog,
    handleDialogAction,
  }
}
