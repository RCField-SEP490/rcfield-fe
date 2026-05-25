import { useState } from "react"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { CheckCircle2, Unplug, Wifi } from "lucide-react"
import { toast } from "sonner"
import { channelApi } from "@/features/channels/api/channel.api"
import { FacebookConnectButton } from "@/features/channels/components/FacebookConnectButton"

const DEMO_CAFE_ID = "00000000-0000-0000-0000-000000000001"

export function ChannelSettingsPage() {
  const queryClient = useQueryClient()
  const [confirmDisconnect, setConfirmDisconnect] = useState(false)

  const cafeId = DEMO_CAFE_ID

  const { data: status, isLoading } = useQuery({
    queryKey: ["channel-status", cafeId],
    queryFn: () => channelApi.getStatus(cafeId),
  })

  const disconnectMutation = useMutation({
    mutationFn: () => channelApi.disconnect(cafeId),
    onSuccess: () => {
      toast.success("Đã ngắt kết nối Facebook Page")
      void queryClient.invalidateQueries({ queryKey: ["channel-status", cafeId] })
      setConfirmDisconnect(false)
    },
    onError: () => {
      toast.error("Ngắt kết nối thất bại, vui lòng thử lại.")
    },
  })

  return (
    <div className="mx-auto max-w-2xl space-y-6 p-6">
      <div>
        <h1 className="text-xl font-semibold">Kênh Messenger</h1>
        <p className="mt-1 text-sm text-gray-500">
          Kết nối Facebook Page để AI tự động trả lời tin nhắn từ khách hàng.
        </p>
      </div>

      <div className="rounded-xl border bg-white p-6 shadow-sm">
        <div className="flex items-center gap-3">
          <div className="flex size-10 items-center justify-center rounded-full bg-[#1877F2]/10">
            <svg className="size-5 text-[#1877F2]" fill="currentColor" viewBox="0 0 24 24">
              <path d="M24 12.073C24 5.405 18.627 0 12 0S0 5.405 0 12.073C0 18.1 4.388 23.094 10.125 24v-8.437H7.078v-3.49h3.047V9.41c0-3.025 1.792-4.697 4.533-4.697 1.312 0 2.686.236 2.686.236v2.97h-1.513c-1.491 0-1.956.93-1.956 1.886v2.268h3.328l-.532 3.49h-2.796V24C19.612 23.094 24 18.1 24 12.073z" />
            </svg>
          </div>
          <div>
            <p className="font-medium">Facebook Messenger</p>
            <p className="text-sm text-gray-500">Nhắn tin qua Facebook Page</p>
          </div>
        </div>

        <div className="mt-5">
          {isLoading ? (
            <div className="h-10 w-40 animate-pulse rounded-lg bg-gray-100" />
          ) : status?.connected ? (
            <div className="space-y-4">
              <div className="flex items-center gap-2 text-sm text-green-600">
                <CheckCircle2 className="size-4" />
                <span>
                  Đã kết nối: <strong>{status.pageName}</strong>
                </span>
              </div>
              {status.connectedAt && (
                <p className="text-xs text-gray-400">
                  Kết nối lúc {new Date(status.connectedAt).toLocaleString("vi-VN")}
                </p>
              )}

              {confirmDisconnect ? (
                <div className="space-y-2">
                  <p className="text-sm text-red-600">
                    Xác nhận ngắt kết nối? AI sẽ ngừng trả lời tin nhắn từ Page này ngay lập tức.
                  </p>
                  <div className="flex gap-2">
                    <button
                      onClick={() => disconnectMutation.mutate()}
                      disabled={disconnectMutation.isPending}
                      className="rounded-lg bg-red-600 px-3 py-1.5 text-sm text-white hover:bg-red-700 disabled:opacity-60"
                    >
                      {disconnectMutation.isPending ? "Đang xử lý..." : "Xác nhận ngắt kết nối"}
                    </button>
                    <button
                      onClick={() => setConfirmDisconnect(false)}
                      className="rounded-lg border px-3 py-1.5 text-sm hover:bg-gray-50"
                    >
                      Huỷ
                    </button>
                  </div>
                </div>
              ) : (
                <button
                  onClick={() => setConfirmDisconnect(true)}
                  className="inline-flex items-center gap-2 rounded-lg border border-red-200 px-3 py-1.5 text-sm text-red-600 hover:bg-red-50"
                >
                  <Unplug className="size-4" />
                  Ngắt kết nối
                </button>
              )}
            </div>
          ) : (
            <div className="space-y-3">
              <div className="flex items-center gap-2 text-sm text-gray-500">
                <Wifi className="size-4" />
                <span>Chưa kết nối</span>
              </div>
              <FacebookConnectButton cafeId={cafeId} />
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
