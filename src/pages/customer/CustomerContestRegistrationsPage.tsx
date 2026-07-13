import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { useState } from "react"
import { toast } from "sonner"
import { Link } from "react-router"
import { Trophy, ShieldAlert } from "lucide-react"

import { contestApi, contestQueryKeys } from "@/features/contests/api/contest.api"
import {
  getRegistrationStatusClass,
  getPaymentStatusClass,
  getRegistrationStatusLabel,
  getPaymentStatusLabel,
} from "@/features/contests/lib/contest-status"
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
      toast.success("Hủy đăng ký giải đấu thành công!")
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
      <div className="mb-6">
        <h1 className="text-3xl font-extrabold text-slate-950 font-display">Giải đấu đã tham gia</h1>
        <p className="mt-2 text-sm font-medium text-slate-500">
          Theo dõi trạng thái đăng ký giải đấu, lệ phí thi đấu và mã điểm danh (check-in) của bạn.
        </p>
      </div>

      <div className="space-y-4">
        {registrationsQuery.isLoading ? (
          Array.from({ length: 4 }).map((_, index) => (
            <div key={index} className="h-28 animate-pulse rounded-2xl bg-muted" />
          ))
        ) : registrations.length === 0 ? (
          <div className="rounded-3xl border-2 border-dashed border-slate-200 bg-white p-12 text-center shadow-sm">
            <Trophy className="size-12 text-slate-300 mx-auto mb-4" />
            <h3 className="text-lg font-bold text-slate-900">Bạn chưa đăng ký giải đấu nào</h3>
            <p className="mt-2 text-sm text-slate-500 max-w-sm mx-auto mb-6">
              Đăng ký tham gia đấu trường RC Field ngay để giao lưu cùng nhiều tay đua cừ khôi khác!
            </p>
            <Button asChild className="rounded-xl bg-orange-600 font-bold text-white hover:bg-orange-700 px-6 py-5 shadow-md shadow-orange-600/10">
              <Link to="/contests">Khám phá giải đấu ngay</Link>
            </Button>
          </div>
        ) : (
          registrations.map((registration) => {
            const contestName = registration.contest?.name || `Giải đấu #${registration.contestId.slice(0, 8)}`
            const branchName = registration.contest?.host_branch?.cafe?.name || "Chi nhánh RC Field"

            return (
              <article key={registration.id} className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm transition hover:shadow-md">
                <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                  <div className="space-y-2">
                    <p className="text-lg font-bold text-slate-900">{contestName}</p>
                    <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">{branchName}</p>
                    <div className="flex flex-wrap items-center gap-2 pt-1">
                      <span className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-bold uppercase tracking-wider ${getRegistrationStatusClass(registration.status)}`}>
                        {getRegistrationStatusLabel(registration.status)}
                      </span>
                      <span className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-bold uppercase tracking-wider ${getPaymentStatusClass(registration.paymentStatus)}`}>
                        {getPaymentStatusLabel(registration.paymentStatus)}
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center justify-between sm:flex-col sm:items-end gap-4 border-t border-slate-100 pt-4 sm:border-t-0 sm:pt-0">
                    <div className="text-left sm:text-right">
                      <p className="text-2xs font-bold uppercase tracking-wider text-slate-400">Mã điểm danh</p>
                      <p className="mt-1 text-base font-black text-slate-900 tracking-wider bg-slate-50 border border-slate-100 rounded-lg px-2.5 py-1 text-center min-w-[100px]">
                        {registration.checkInCode ?? "--"}
                      </p>
                    </div>
                    {["PENDING", "CONFIRMED"].includes(registration.status) && (
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        className="border-red-200 bg-red-50 text-red-700 hover:bg-red-100 hover:text-red-800 font-bold rounded-xl h-9"
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
        <DialogContent className="sm:max-w-md rounded-2xl border-none">
          <DialogHeader>
            <div className="mx-auto flex size-12 items-center justify-center rounded-full bg-red-50 text-red-600 mb-2">
              <ShieldAlert className="size-6" />
            </div>
            <DialogTitle className="text-lg font-bold text-center text-slate-950">Xác nhận hủy đăng ký</DialogTitle>
            <DialogDescription className="text-sm text-slate-500 text-center mt-2 leading-relaxed">
              Bạn có chắc chắn muốn hủy đăng ký tham gia giải đấu này không? Hành động này không thể hoàn tác.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="mt-6 gap-2 sm:justify-center">
            <Button
              type="button"
              variant="outline"
              onClick={() => setCancelId(null)}
              disabled={cancelMutation.isPending}
              className="rounded-xl font-bold border-slate-200"
            >
              Quay lại
            </Button>
            <Button
              type="button"
              disabled={cancelMutation.isPending}
              className="bg-red-600 hover:bg-red-700 text-white font-bold rounded-xl gap-2 shadow-md shadow-red-600/10"
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
                  Đang hủy...
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
