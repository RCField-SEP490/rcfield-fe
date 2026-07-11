import { useQuery } from "@tanstack/react-query"

import { contestApi, contestQueryKeys } from "@/features/contests/api/contest.api"
import { CustomerPageShell } from "@/pages/customer/components/CustomerPageShell"

export function CustomerContestRegistrationsPage() {
  const registrationsQuery = useQuery({
    queryKey: contestQueryKeys.myRegistrations(),
    queryFn: contestApi.listMyRegistrations,
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
          registrations.map((registration) => (
            <article key={registration.id} className="rounded-2xl border border-border bg-card p-5 shadow-sm">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <p className="text-sm font-extrabold text-foreground">{registration.id.slice(0, 8)}</p>
                  <p className="mt-1 text-sm font-medium text-muted-foreground">
                    Status: {registration.status} · Fee: {registration.paymentStatus}
                  </p>
                </div>
                <div className="text-right text-xs font-semibold text-muted-foreground">
                  <p>Check-in code</p>
                  <p className="mt-1 text-sm font-bold text-foreground">{registration.checkInCode ?? "--"}</p>
                </div>
              </div>
            </article>
          ))
        )}
      </div>
    </CustomerPageShell>
  )
}
