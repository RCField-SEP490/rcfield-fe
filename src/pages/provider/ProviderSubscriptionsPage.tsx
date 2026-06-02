import { useQuery } from "@tanstack/react-query"
import { ProviderPageHeader } from "@/pages/provider/components/ProviderPrimitives"
import { ProviderShell } from "@/pages/provider/components/ProviderShell"
import { SubscriptionStatusCard } from "@/features/subscriptions/components/SubscriptionStatusCard"
import { UsageQuotaBars } from "@/features/subscriptions/components/UsageQuotaBars"
import { PaymentRequestForm } from "@/features/subscriptions/components/PaymentRequestForm"
import { subscriptionApi } from "@/features/subscriptions/api/subscription.api"
import { cafeApi, cafeQueryKeys } from "@/features/cafes/api/cafe.api"
import { Badge } from "@/shared/ui/badge"
import type { PaymentRequestStatus } from "@/features/subscriptions/types"

const PR_STATUS_LABELS: Record<PaymentRequestStatus, string> = {
  PENDING: "Chờ xác nhận",
  CONFIRMED: "Đã xác nhận",
  REJECTED: "Bị từ chối",
}

const PR_STATUS_COLORS: Record<PaymentRequestStatus, string> = {
  PENDING: "bg-amber-100 text-amber-800 border-amber-200",
  CONFIRMED: "bg-emerald-100 text-emerald-800 border-emerald-200",
  REJECTED: "bg-red-100 text-red-800 border-red-200",
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

  const { data: cafeData } = useQuery({
    queryKey: cafeQueryKeys.list({ limit: 1, scope: "managed" }),
    queryFn: () => cafeApi.listCafes({ limit: 1, scope: "managed" }),
  })

  const subscription = subData?.data ?? null
  const requests = prData?.data ?? []
  const hasPending = requests.some((r) => r.status === "PENDING")
  const branchCount = cafeData?.meta.total ?? 0

  return (
    <ProviderShell>
      <ProviderPageHeader title="Hội viên" description="Quản lý gói đăng ký và lịch sử thanh toán." />
      <div className="space-y-6">

        {isLoading ? (
          <div className="py-12 text-center text-sm font-semibold text-[#747878]">Đang tải...</div>
        ) : (
          <>
            <SubscriptionStatusCard subscription={subscription} />
            <UsageQuotaBars subscription={subscription} branchCount={branchCount} />
          </>
        )}

        <PaymentRequestForm hasPendingRequest={hasPending} />

        {requests.length > 0 && (
          <div className="rounded-xl border border-[#e5e2e1] bg-white overflow-hidden">
            <div className="px-5 py-4 border-b border-[#e5e2e1] bg-[#fcf8f8]">
              <h3 className="text-base font-bold text-[#1c1b1b]">Lịch sử yêu cầu thanh toán</h3>
            </div>
            <table className="w-full text-sm">
              <thead className="bg-[#fcf8f8]/60 text-xs font-bold text-[#747878] uppercase tracking-wider border-b border-[#e5e2e1]">
                <tr>
                  <th className="px-4 py-3 text-left">Gói</th>
                  <th className="px-4 py-3 text-left">Số tiền</th>
                  <th className="px-4 py-3 text-left">Ngày CK</th>
                  <th className="px-4 py-3 text-left">Trạng thái</th>
                  <th className="px-4 py-3 text-left">Ghi chú Admin</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#e5e2e1]">
                {requests.map((r) => (
                  <tr key={r.id} className="hover:bg-[#fcf8f8] transition-colors">
                    <td className="px-4 py-3 font-bold text-[#1c1b1b]">{r.planId}</td>
                    <td className="px-4 py-3 font-bold text-[#1c1b1b]">{r.transferAmount.toLocaleString("vi-VN")} đ</td>
                    <td className="px-4 py-3 text-[#5d5f5f] text-xs font-semibold">
                      {new Date(r.transferDate).toLocaleDateString("vi-VN")}
                    </td>
                    <td className="px-4 py-3">
                      <Badge className={`text-[11px] font-bold border ${PR_STATUS_COLORS[r.status]}`}>
                        {PR_STATUS_LABELS[r.status]}
                      </Badge>
                    </td>
                    <td className="px-4 py-3 text-[#5d5f5f] text-xs font-semibold">{r.adminNotes ?? "—"}</td>
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
