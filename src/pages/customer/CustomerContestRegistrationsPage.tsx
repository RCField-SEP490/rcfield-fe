import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { useState } from "react"
import { toast } from "sonner"

import { contestApi, contestQueryKeys } from "@/features/contests/api/contest.api"
import { getRegistrationStatusClass, getPaymentStatusClass } from "@/features/contests/lib/contest-status"
import { CustomerPageShell } from "@/pages/customer/components/CustomerPageShell"
import { Button } from "@/shared/ui/button"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/shared/ui/dialog"

export function CustomerContestRegistrationsPage() {
  const queryClient = useQueryClient()
  const [cancelId, setCancelId] = useState<string | null>(null)

  const registrationsQuery = useQuery({
    queryKey: contestQueryKeys.myRegistrations(),
    queryFn: contestApi.listMyRegistrations,
  })

  const cancelMutation = useMutation({
    mutationFn: (registrationId: string) => contestApi.cancelRegistration(registrationId),
    onSuccess: () => {
      toast.success("Hủy đăng ký thành công")
      void queryClient.invalidateQueries({ queryKey: contestQueryKeys.myRegistrations() })
    },
    onError: (error) => {
      toast.error("Không thể hủy đăng ký", {
        description: getErrorMessage(error),
      })
    },
  })

  const registrations = registrationsQuery.data ?? []

  return (
    <CustomerPageShell>
      <div>
        <h1 className="text-3xl font-extrabold text-foreground">Contest registrations</h1>
        <p className="mt-2 text-sm font-medium text-muted-foreground">
          Theo dõi trạng thái đăng ký contest, contest fee và mã check-in của bạn.
        </p>
      </div>
      <div className="space-y-3">
        {registrationsQuery.isLoading ? (
          Array.from({ length: 4 }).map((_, index) => (
            <div key={index} className="h-24 animate-pulse rounded-2xl bg-muted" />
          ))
        ) : registrations.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-border bg-card p-10 text-center text-sm font-semibold text-muted-foreground">
            Bạn chưa có contest registration nào.
          </div>
        ) : (
          registrations.map((registration) => {
            const contestName = registration.contest?.name || `Giải đấu #${registration.contestId.slice(0, 8)}`
            const branchName = registration.contest?.host_branch?.cafe?.name || "Chi nhánh RC"

            return (
              <article key={registration.id} className="rounded-2xl border border-border bg-card p-5 shadow-sm">
                <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                  <div className="space-y-1">
                    <p className="text-base font-extrabold text-foreground">{contestName}</p>
                    <p className="text-xs font-semibold text-muted-foreground">{branchName}</p>
                    <div className="flex flex-wrap items-center gap-2 pt-1">
                      <span className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold ${getRegistrationStatusClass(registration.status)}`}>
                        {registration.status}
                      </span>
                      <span className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold ${getPaymentStatusClass(registration.paymentStatus)}`}>
                        {registration.paymentStatus}
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center justify-between sm:flex-col sm:items-end gap-3">
                    <div className="text-left sm:text-right text-xs font-semibold text-muted-foreground">
                      <p>Check-in code</p>
                      <p className="mt-1 text-sm font-bold text-foreground">{registration.checkInCode ?? "--"}</p>
                    </div>
                    {["PENDING", "CONFIRMED"].includes(registration.status) && (
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        className="border-red-200 bg-red-50 text-red-700 hover:bg-red-100 font-bold rounded-lg h-8"
                        onClick={() => setCancelId(registration.id)}
                      >
                        Hủy đăng ký
                      </Button>
                    )}
                  </div>
                </div>
              </article>
            )
          })
        )}
      </div>

      <Dialog open={!!cancelId} onOpenChange={(v) => { if (!v) setCancelId(null) }}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-lg font-bold text-foreground">Xác nhận hủy đăng ký</DialogTitle>
            <DialogDescription className="text-sm text-muted-foreground mt-2">
              Bạn có chắc chắn muốn hủy đăng ký giải đấu này không? Hành động này không thể hoàn tác.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="mt-4 gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => setCancelId(null)}
              disabled={cancelMutation.isPending}
              className="rounded-lg"
            >
              Quay lại
            </Button>
            <Button
              type="button"
              disabled={cancelMutation.isPending}
              className="bg-red-600 hover:bg-red-700 text-white font-bold rounded-lg gap-2"
              onClick={async () => {
                if (cancelId) {
                  await cancelMutation.mutateAsync(cancelId)
                  setCancelId(null)
                }
              }}
            >
              {cancelMutation.isPending ? (
                <>
                  <span className="size-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Đang xử lý...
                </>
              ) : (
                "Xác nhận hủy"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </CustomerPageShell>
  )
}

function getErrorMessage(error: unknown) {
  const maybe = error as { response?: { data?: { message?: string } } }
  return maybe.response?.data?.message ?? "Vui lòng thử lại."
}

