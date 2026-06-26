import { Link } from "react-router"
import { Settings, MapPin, Play, XCircle } from "lucide-react"

import { Button } from "@/shared/ui/button"
import { Badge } from "@/shared/ui/badge"
import type { Contest } from "../types"

function formatDateTime(dateStr: string) {
  try {
    const d = new Date(dateStr)
    if (isNaN(d.getTime())) return dateStr
    return d.toLocaleDateString("vi-VN", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    })
  } catch {
    return dateStr
  }
}

interface ContestGeneralTabProps {
  contest: Contest
  bracketSizeDisplay: string
  onOpenContest: () => void
  onCancelContest: () => void
  isOpenPending: boolean
  isCancelPending: boolean
}

export function ContestGeneralTab({
  contest,
  bracketSizeDisplay,
  onOpenContest,
  onCancelContest,
  isOpenPending,
  isCancelPending,
}: ContestGeneralTabProps) {
  return (
    <div className="space-y-6">
      {/* Action Bar */}
      <div className="flex flex-wrap items-center gap-2">
        {contest.status === "DRAFT" && (
          <Button
            onClick={onOpenContest}
            disabled={isOpenPending}
            className="bg-emerald-600 hover:bg-emerald-700 font-bold text-white"
          >
            <Play size={16} className="mr-1.5" /> Mở Đăng Ký
          </Button>
        )}
        {contest.status !== "CANCELLED" && contest.status !== "COMPLETED" && (
          <Button
            onClick={() => {
              if (confirm("Bạn có chắc chắn muốn hủy giải đấu này?")) {
                onCancelContest()
              }
            }}
            disabled={isCancelPending}
            variant="outline"
            className="border-red-200 font-bold text-red-600 hover:bg-red-50"
          >
            <XCircle size={16} className="mr-1.5" /> Hủy giải đấu
          </Button>
        )}
      </div>

      {/* Info Card */}
      <section className="rounded-xl border border-[#e5e2e1] bg-white p-6 shadow-sm space-y-6">
        <div className="flex items-center justify-between border-b border-[#e5e2e1] pb-4">
          <h3 className="flex items-center gap-1.5 font-bold text-[#1c1b1b]">
            <Settings size={18} className="text-orange-600" /> Thông tin tổng
            quan giải đấu
          </h3>
          {contest.status === "DRAFT" && (
            <Button
              asChild
              size="sm"
              variant="outline"
              className="border-[#e5e2e1] text-[#444748]"
            >
              <Link to={`/provider/contests/${contest.id}/edit`}>
                Chỉnh sửa cài đặt
              </Link>
            </Button>
          )}
        </div>

        <div className="grid grid-cols-1 gap-6 text-sm md:grid-cols-3">
          <InfoField label="Trạng thái giải đấu">
            <Badge className="border border-orange-200 bg-orange-50 text-orange-700">
              {contest.status}
            </Badge>
          </InfoField>
          <InfoField label="Lệ phí giải đấu">
            <span className="font-bold text-[#1c1b1b]">
              {contest.entry_fee.toLocaleString()} đ
            </span>
          </InfoField>
          <InfoField label="Giới hạn vận động viên">
            <span className="font-bold text-[#1c1b1b]">
              {contest.capacity} người
            </span>
          </InfoField>
          <InfoField label="Nhánh Knockout tối đa">
            <span className="font-bold text-[#1c1b1b]">
              {bracketSizeDisplay}
            </span>
          </InfoField>
          <InfoField label="Thời gian khai mạc">
            <span className="font-bold text-[#1c1b1b]">
              {formatDateTime(contest.starts_at)}
            </span>
          </InfoField>
          <InfoField label="Hạn đóng đăng ký">
            <span className="font-bold text-[#1c1b1b]">
              {formatDateTime(contest.registration_closes_at)}
            </span>
          </InfoField>
        </div>

        <div className="border-t border-[#e5e2e1] pt-6">
          <h4 className="mb-3 text-xs font-bold uppercase tracking-wider text-[#747878]">
            Các cơ sở đăng cai tổ chức
          </h4>
          <div className="flex flex-wrap gap-3">
            {contest.participating_cafes.map((c) => (
              <div
                key={c.id}
                className="flex items-center gap-2 rounded-xl border border-[#e5e2e1] bg-[#fcf8f8] px-4 py-2"
              >
                <MapPin size={14} className="text-orange-600" />
                <span className="text-xs font-bold text-[#444748]">
                  {c.name} ({c.city})
                </span>
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  )
}

function InfoField({
  label,
  children,
}: {
  label: string
  children: React.ReactNode
}) {
  return (
    <div className="space-y-1">
      <span className="block text-[10px] font-semibold uppercase text-[#747878]">
        {label}
      </span>
      {children}
    </div>
  )
}

