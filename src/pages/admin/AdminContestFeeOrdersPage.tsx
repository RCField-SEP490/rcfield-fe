import { useState } from "react"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { CheckCircle, Megaphone, Sparkles, XCircle } from "lucide-react"
import { toast } from "sonner"

import { contestApi } from "@/features/contests/api/contest.api"
import type {
  AdminContestFeeOrder,
  ContestFeeOrderStatus,
  PendingFeaturedPopup,
} from "@/features/contests/types"
import {
  AdminHeader,
  AdminPanel,
  AdminPanelTitle,
} from "@/pages/admin/components/AdminPrimitives"
import { AdminShell } from "@/pages/admin/components/AdminShell"
import { Badge } from "@/shared/ui/badge"
import { Button } from "@/shared/ui/button"
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/shared/ui/dialog"
import { Label } from "@/shared/ui/label"
import { Textarea } from "@/shared/ui/textarea"

const STATUS_LABEL: Record<ContestFeeOrderStatus, string> = {
  PENDING_PAYMENT: "Chờ provider chuyển khoản",
  PENDING_REVIEW: "Chờ đối soát",
  PAID: "Đã xác nhận",
  REJECTED: "Đã từ chối",
  CANCELLED: "Đã huỷ",
}

const STATUS_CLASS: Record<ContestFeeOrderStatus, string> = {
  PENDING_PAYMENT: "bg-slate-100 text-slate-700",
  PENDING_REVIEW: "bg-amber-100 text-amber-800",
  PAID: "bg-emerald-100 text-emerald-800",
  REJECTED: "bg-red-100 text-red-800",
  CANCELLED: "bg-slate-100 text-slate-500",
}

function formatVnd(value: number) {
  return new Intl.NumberFormat("vi-VN", {
    style: "currency",
    currency: "VND",
    maximumFractionDigits: 0,
  }).format(value)
}

/**
 * Hai hàng đợi của admin cho mảng giải đấu.
 *
 * Đối soát tiền và duyệt nội dung quảng bá là hai việc tách rời: tiền vào rồi
 * nội dung vẫn có thể bị từ chối. Gộp chung một trang vì cùng một người làm và
 * việc thứ hai luôn sinh ra từ việc thứ nhất.
 */
export function AdminContestFeeOrdersPage() {
  const queryClient = useQueryClient()
  const [rejectTarget, setRejectTarget] = useState<AdminContestFeeOrder | null>(
    null,
  )
  const [rejectReason, setRejectReason] = useState("")

  const ordersQuery = useQuery({
    queryKey: ["admin", "contest-fee-orders"],
    queryFn: () => contestApi.listContestFeeOrdersForAdmin({ limit: 50 }),
  })
  const pendingPopupsQuery = useQuery({
    queryKey: ["admin", "featured-popups", "pending"],
    queryFn: contestApi.listPendingFeaturedPopups,
  })

  const invalidate = async () => {
    await Promise.all([
      queryClient.invalidateQueries({
        queryKey: ["admin", "contest-fee-orders"],
      }),
      queryClient.invalidateQueries({
        queryKey: ["admin", "featured-popups", "pending"],
      }),
    ])
  }

  const confirmMutation = useMutation({
    mutationFn: (orderId: string) => contestApi.confirmContestFeeOrder(orderId),
    onSuccess: invalidate,
  })
  const rejectMutation = useMutation({
    mutationFn: ({ orderId, reason }: { orderId: string; reason: string }) =>
      contestApi.rejectContestFeeOrder(orderId, reason),
    onSuccess: invalidate,
  })
  const reviewMutation = useMutation({
    mutationFn: ({
      popupId,
      approve,
      notes,
    }: {
      popupId: string
      approve: boolean
      notes?: string
    }) => contestApi.reviewFeaturedPopup(popupId, { approve, notes }),
    onSuccess: invalidate,
  })

  const orders = ordersQuery.data?.data ?? []
  const waitingOrders = orders.filter(
    (order) => order.status === "PENDING_REVIEW",
  )
  const pendingPopups = pendingPopupsQuery.data ?? []

  return (
    <AdminShell>
      <AdminHeader
        title="Phí tổ chức giải"
        description="Đối soát chuyển khoản của provider và duyệt nội dung quảng bá trước khi lên trang chủ."
      />

      <AdminPanel className="mb-4">
        <AdminPanelTitle
          title={`Chờ đối soát (${waitingOrders.length})`}
          subtitle="Đối chiếu mã giao dịch với sao kê ngân hàng rồi xác nhận. Xác nhận xong provider mở đăng ký được ngay."
        />
        {ordersQuery.isLoading ? (
          <p className="text-sm text-slate-500">Đang tải...</p>
        ) : waitingOrders.length === 0 ? (
          <p className="rounded-lg border border-dashed border-slate-200 p-6 text-center text-sm text-slate-500">
            Không có đơn nào chờ đối soát.
          </p>
        ) : (
          <div className="space-y-3">
            {waitingOrders.map((order) => (
              <div
                key={order.id}
                className="rounded-xl border border-slate-200 p-4"
              >
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="text-sm font-bold text-slate-900">
                      {order.contest_name ?? "Giải đấu"}
                    </p>
                    <p className="mt-1 text-xs text-slate-500">
                      {order.plan?.name} · {formatVnd(order.amount)}
                      {order.featured_days > 0
                        ? ` · ${order.featured_days} ngày quảng bá`
                        : ""}
                    </p>
                    <p className="mt-2 text-xs font-semibold text-slate-700">
                      Mã giao dịch: {order.transfer_reference} · Ngày{" "}
                      {order.transfer_date}
                    </p>
                    <Badge className={`mt-2 ${STATUS_CLASS[order.status]}`}>
                      {STATUS_LABEL[order.status]}
                    </Badge>
                  </div>
                  <div className="flex shrink-0 gap-2">
                    <Button
                      className="h-9 gap-1.5 bg-emerald-600 text-xs font-bold text-white hover:bg-emerald-700"
                      disabled={confirmMutation.isPending}
                      onClick={async () => {
                        try {
                          await confirmMutation.mutateAsync(order.id)
                          toast.success("Đã xác nhận đơn phí")
                        } catch {
                          toast.error("Không xác nhận được đơn")
                        }
                      }}
                    >
                      <CheckCircle className="size-3.5" />
                      Xác nhận
                    </Button>
                    <Button
                      variant="outline"
                      className="h-9 gap-1.5 border-red-200 text-xs font-bold text-red-700 hover:bg-red-50"
                      onClick={() => {
                        setRejectTarget(order)
                        setRejectReason("")
                      }}
                    >
                      <XCircle className="size-3.5" />
                      Từ chối
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </AdminPanel>

      <AdminPanel>
        <AdminPanelTitle
          title={`Duyệt nội dung quảng bá (${pendingPopups.length})`}
          subtitle="Provider đã trả tiền, nhưng nội dung chỉ lên trang chủ sau khi bạn duyệt ảnh và tiêu đề."
        />
        {pendingPopupsQuery.isLoading ? (
          <p className="text-sm text-slate-500">Đang tải...</p>
        ) : pendingPopups.length === 0 ? (
          <p className="rounded-lg border border-dashed border-slate-200 p-6 text-center text-sm text-slate-500">
            Không có nội dung nào chờ duyệt.
          </p>
        ) : (
          <div className="space-y-3">
            {pendingPopups.map((popup) => (
              <PendingPopupRow
                key={popup.id}
                popup={popup}
                pending={reviewMutation.isPending}
                onReview={async (approve, notes) => {
                  try {
                    await reviewMutation.mutateAsync({
                      popupId: popup.id,
                      approve,
                      notes,
                    })
                    toast.success(
                      approve
                        ? "Đã cho lên trang chủ"
                        : "Đã từ chối nội dung này",
                    )
                  } catch {
                    toast.error("Không xử lý được")
                  }
                }}
              />
            ))}
          </div>
        )}
      </AdminPanel>

      <Dialog
        open={Boolean(rejectTarget)}
        onOpenChange={() => setRejectTarget(null)}
      >
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Từ chối đơn phí</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-slate-600">
            Provider sẽ nhận được lý do này và khai báo lại chuyển khoản.
          </p>
          <div className="space-y-2">
            <Label>
              Lý do <span className="text-red-600">*</span>
            </Label>
            <Textarea
              rows={3}
              value={rejectReason}
              placeholder="Ví dụ: không tìm thấy giao dịch trong sao kê ngày 04/08"
              onChange={(event) => setRejectReason(event.target.value)}
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setRejectTarget(null)}>
              Quay lại
            </Button>
            <Button
              className="bg-red-600 text-white hover:bg-red-700 disabled:opacity-50"
              disabled={rejectReason.trim().length < 5}
              onClick={async () => {
                if (!rejectTarget) return
                try {
                  await rejectMutation.mutateAsync({
                    orderId: rejectTarget.id,
                    reason: rejectReason.trim(),
                  })
                  toast.success("Đã từ chối đơn phí")
                  setRejectTarget(null)
                } catch {
                  toast.error("Không từ chối được đơn")
                }
              }}
            >
              Từ chối
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AdminShell>
  )
}

function PendingPopupRow({
  popup,
  pending,
  onReview,
}: {
  popup: PendingFeaturedPopup
  pending: boolean
  onReview: (approve: boolean, notes?: string) => void
}) {
  const [notes, setNotes] = useState("")

  return (
    <div className="rounded-xl border border-slate-200 p-4">
      <div className="flex flex-wrap gap-4">
        {popup.image_url ? (
          <img
            src={popup.image_url}
            alt="Ảnh bìa giải"
            className="h-24 w-40 shrink-0 rounded-lg object-cover"
          />
        ) : (
          <div className="flex h-24 w-40 shrink-0 items-center justify-center rounded-lg border border-dashed border-slate-200 text-xs font-semibold text-amber-700">
            Chưa có ảnh bìa
          </div>
        )}

        <div className="min-w-0 flex-1">
          <p className="flex items-center gap-1.5 text-sm font-bold text-slate-900">
            <Megaphone className="size-4 text-orange-500" />
            {popup.title}
          </p>
          {popup.subtitle ? (
            <p className="mt-1 line-clamp-2 text-xs text-slate-600">
              {popup.subtitle}
            </p>
          ) : null}
          <p className="mt-2 flex items-center gap-1 text-xs font-semibold text-slate-500">
            <Sparkles className="size-3" />
            Hiển thị {new Date(popup.starts_at).toLocaleDateString(
              "vi-VN",
            )} → {new Date(popup.ends_at).toLocaleDateString("vi-VN")}
          </p>

          <div className="mt-3 flex flex-wrap items-center gap-2">
            <Textarea
              rows={1}
              value={notes}
              placeholder="Ghi chú cho provider (bắt buộc khi từ chối)"
              className="min-w-[16rem] flex-1"
              onChange={(event) => setNotes(event.target.value)}
            />
            <Button
              className="h-9 bg-emerald-600 text-xs font-bold text-white hover:bg-emerald-700"
              disabled={pending}
              onClick={() => onReview(true, notes.trim() || undefined)}
            >
              Cho lên trang chủ
            </Button>
            <Button
              variant="outline"
              className="h-9 border-red-200 text-xs font-bold text-red-700 hover:bg-red-50 disabled:opacity-50"
              disabled={pending || notes.trim().length < 5}
              onClick={() => onReview(false, notes.trim())}
            >
              Từ chối
            </Button>
          </div>
        </div>
      </div>

      <Badge className="mt-3 bg-amber-100 text-amber-800">
        Đã thu tiền · chờ duyệt nội dung
      </Badge>
    </div>
  )
}
