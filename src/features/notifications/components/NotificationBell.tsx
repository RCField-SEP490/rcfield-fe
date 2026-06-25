import { useState, useEffect, useRef } from "react"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { Bell, CheckCheck, X } from "lucide-react"
import { cn } from "@/shared/lib/utils"
import { useAuthStore } from "@/features/auth/stores/auth.store"
import { notificationApi } from "../api/notification.api"
import type { Notification } from "../types"

const TYPE_ICONS: Record<string, string> = {
  ACCOUNT_APPROVED: "✅",
  ACCOUNT_REJECTED: "❌",
  ACCOUNT_SUSPENDED: "🔒",
  ACCOUNT_UNSUSPENDED: "🔓",
  TRIAL_EXPIRING_SOON: "⏰",
  GRACE_PERIOD_STARTED: "⚠️",
  SUBSCRIPTION_EXPIRED: "🚫",
  SUBSCRIPTION_ACTIVATED: "🎉",
  PAYMENT_REQUEST_CONFIRMED: "💳",
  PAYMENT_REQUEST_REJECTED: "❌",
}

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime()
  const mins = Math.floor(diff / 60000)
  if (mins < 1) return "vừa xong"
  if (mins < 60) return `${mins} phút trước`
  const hours = Math.floor(mins / 60)
  if (hours < 24) return `${hours} giờ trước`
  return `${Math.floor(hours / 24)} ngày trước`
}

export function NotificationBell() {
  const qc = useQueryClient()
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  const user = useAuthStore((state) => state.user)
  const hasAccess = user?.role === "provider" || user?.role === "staff"

  const { data } = useQuery({
    queryKey: ["notifications"],
    queryFn: () => notificationApi.list({ limit: 15 }),
    refetchInterval: hasAccess ? 30000 : undefined,
    enabled: !!hasAccess,
  })

  const markReadMutation = useMutation({
    mutationFn: (id: string) => notificationApi.markRead(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["notifications"] }),
  })

  const markAllMutation = useMutation({
    mutationFn: () => notificationApi.markAllRead(),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["notifications"] }),
  })

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false)
      }
    }
    document.addEventListener("mousedown", handleClick)
    return () => document.removeEventListener("mousedown", handleClick)
  }, [])

  if (!hasAccess) return null

  const notifications = data?.data ?? []
  const unreadCount = data?.unreadCount ?? 0

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen((v) => !v)}
        className="relative flex size-9 items-center justify-center rounded-full hover:bg-slate-100 transition-colors"
        aria-label="Thông báo"
      >
        <Bell className="size-5 text-slate-600" />
        {unreadCount > 0 && (
          <span className="absolute -top-0.5 -right-0.5 flex size-4 items-center justify-center rounded-full bg-red-500 text-[9px] font-extrabold text-white leading-none">
            {unreadCount > 9 ? "9+" : unreadCount}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 top-11 z-50 w-80 rounded-xl border border-slate-200 bg-white shadow-xl overflow-hidden">
          <div className="flex items-center justify-between px-4 py-3 border-b border-slate-100">
            <span className="text-sm font-bold text-slate-800">Thông báo</span>
            <div className="flex items-center gap-2">
              {unreadCount > 0 && (
                <button
                  onClick={() => markAllMutation.mutate()}
                  className="text-xs font-semibold text-orange-600 hover:underline flex items-center gap-1"
                >
                  <CheckCheck className="size-3.5" /> Đọc tất cả
                </button>
              )}
              <button onClick={() => setOpen(false)} className="text-slate-400 hover:text-slate-600">
                <X className="size-4" />
              </button>
            </div>
          </div>

          <div className="max-h-80 overflow-y-auto divide-y divide-slate-50">
            {notifications.length === 0 ? (
              <div className="py-10 text-center text-xs text-slate-400">Không có thông báo nào</div>
            ) : (
              notifications.map((n: Notification) => (
                <button
                  key={n.id}
                  className={cn(
                    "w-full text-left px-4 py-3 hover:bg-slate-50 transition-colors",
                    !n.readAt && "bg-orange-50/60",
                  )}
                  onClick={() => {
                    if (!n.readAt) markReadMutation.mutate(n.id)
                  }}
                >
                  <div className="flex items-start gap-2.5">
                    <span className="text-base leading-none mt-0.5">{TYPE_ICONS[n.type] ?? "🔔"}</span>
                    <div className="flex-1 min-w-0">
                      <p className={cn("text-xs font-bold truncate", !n.readAt ? "text-slate-800" : "text-slate-600")}>
                        {n.title}
                      </p>
                      <p className="text-[11px] text-slate-400 mt-0.5 line-clamp-2">{n.message}</p>
                      <p className="text-[10px] text-slate-300 mt-1">{timeAgo(n.createdAt)}</p>
                    </div>
                    {!n.readAt && <span className="size-2 rounded-full bg-orange-500 shrink-0 mt-1" />}
                  </div>
                </button>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  )
}
