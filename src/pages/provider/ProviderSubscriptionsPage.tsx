import { useQuery } from "@tanstack/react-query"
import { ProviderShell } from "@/pages/provider/components/ProviderShell"
import { SubscriptionStatusCard } from "@/features/subscriptions/components/SubscriptionStatusCard"
import { UsageQuotaBars } from "@/features/subscriptions/components/UsageQuotaBars"
import { PaymentRequestForm } from "@/features/subscriptions/components/PaymentRequestForm"
import { subscriptionApi } from "@/features/subscriptions/api/subscription.api"
import { Badge } from "@/shared/ui/badge"
import type { PaymentRequestStatus } from "@/features/subscriptions/types"

const PR_STATUS_LABELS: Record<PaymentRequestStatus, string> = {
  PENDING: "Chờ xác nhận",
  CONFIRMED: "Đã xác nhận",
  REJECTED: "Bị từ chối",
}

const PR_STATUS_COLORS: Record<PaymentRequestStatus, string> = {
  PENDING: "bg-yellow-100 text-yellow-800",
  CONFIRMED: "bg-emerald-100 text-emerald-800",
  REJECTED: "bg-red-100 text-red-800",
}

export function ProviderSubscriptionsPage() {
  const { data: subData, isLoading } = useQuery({
    queryKey: ["provider-subscription"],
    queryFn: () => subscriptionApi.getSubscriptionStatus(),
  })

  const { data: prData } = useQuery({
    queryKey: ["my-payment-requests"],
    queryFn: () => subscriptionApi.listMyPaymentRequests(),
  })

  const subscription = subData?.data ?? null
  const requests = prData?.data ?? []
  const hasPending = requests.some((r) => r.status === "PENDING")

  return (
    <ProviderShell>
      <div className="space-y-6">
        <div>
          <h1 className="text-xl font-extrabold text-slate-900">Subscription</h1>
          <p className="text-sm text-slate-500 mt-1">Quản lý gói đăng ký và lịch sử thanh toán.</p>
        </div>

        {isLoading ? (
          <div className="py-12 text-center text-sm text-slate-400">Đang tải...</div>
        ) : (
          <>
            <SubscriptionStatusCard subscription={subscription} />
            <UsageQuotaBars subscription={subscription} />
          </>
        )}

        <PaymentRequestForm hasPendingRequest={hasPending} />

        {requests.length > 0 && (
          <div className="rounded-xl border border-slate-200 bg-white overflow-hidden">
            <div className="px-5 py-3 border-b border-slate-100">
              <h3 className="text-sm font-bold text-slate-700">Lịch sử yêu cầu thanh toán</h3>
            </div>
            <table className="w-full text-sm">
              <thead className="bg-slate-50 text-xs font-bold text-slate-500 uppercase tracking-wide">
                <tr>
                  <th className="px-4 py-2.5 text-left">Gói</th>
                  <th className="px-4 py-2.5 text-left">Số tiền</th>
                  <th className="px-4 py-2.5 text-left">Ngày CK</th>
                  <th className="px-4 py-2.5 text-left">Trạng thái</th>
                  <th className="px-4 py-2.5 text-left">Ghi chú Admin</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {requests.map((r) => (
                  <tr key={r.id} className="hover:bg-slate-50">
                    <td className="px-4 py-3 font-semibold">{r.planId}</td>
                    <td className="px-4 py-3">{r.transferAmount.toLocaleString("vi-VN")}₫</td>
                    <td className="px-4 py-3 text-slate-400 text-xs">
                      {new Date(r.transferDate).toLocaleDateString("vi-VN")}
                    </td>
                    <td className="px-4 py-3">
                      <Badge className={`text-[11px] font-bold ${PR_STATUS_COLORS[r.status]}`}>
                        {PR_STATUS_LABELS[r.status]}
                      </Badge>
                    </td>
                    <td className="px-4 py-3 text-slate-400 text-xs">{r.adminNotes ?? "—"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </ProviderShell>
  )
}
