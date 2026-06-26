import { useState } from "react"
import { useParams, Link } from "react-router"
import { useQuery, useMutation } from "@tanstack/react-query"
import { AlertCircle, ArrowLeft, Calendar, QrCode, Users } from "lucide-react"
import { contestsApi, contestQueryKeys } from "../api/contests.api"
import { ContestSearchInput } from "../components/TournamentPrimitives"
import { getContestErrorMessage } from "../lib/errors"
import { useStaffOperations } from "@/pages/staff/context/StaffOperationContext"
import { Button } from "@/shared/ui/button"
import { Input } from "@/shared/ui/input"
import { Badge } from "@/shared/ui/badge"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/shared/ui/dialog"
import { toast } from "sonner"
import type { ContestRegistration } from "../types"

export function StaffContestDetailPage() {
  const { contestId } = useParams<{ contestId: string }>()
  const { assignedCafeId } = useStaffOperations()

  const [search, setSearch] = useState("")
  const [showScanDialog, setShowScanDialog] = useState(false)
  const [manualCode, setManualCode] = useState("")
  const [lookedUpRegistrations, setLookedUpRegistrations] = useState<
    ContestRegistration[]
  >([])

  // Queries
  const { data: contest, isLoading: isContestLoading } = useQuery({
    queryKey: contestQueryKeys.detail(contestId),
    queryFn: () => contestsApi.getContestDetail(contestId!),
    enabled: !!contestId,
  })

  // Mutations
  const checkInMutation = useMutation({
    mutationFn: (regId: string) => {
      if (!assignedCafeId)
        throw new Error("Staff chưa được cấu hình chi nhánh làm việc.")
      return contestsApi.checkInParticipant(regId, { cafe_id: assignedCafeId })
    },
    onSuccess: (registration) => {
      toast.success("Điểm danh check-in vận động viên thành công!")
      setLookedUpRegistrations((prev) => {
        const existing = prev.some((item) => item.id === registration.id)
        return existing
          ? prev.map((item) =>
              item.id === registration.id ? registration : item,
            )
          : [registration, ...prev]
      })
    },
    onError: (err: unknown) => {
      toast.error(getContestErrorMessage(err, "Check-in thất bại."))
    },
  })

  const lookupMutation = useMutation({
    mutationFn: (code: string) =>
      contestsApi.lookupContestRegistrationByCode(contestId!, code),
    onSuccess: (registration) => {
      setLookedUpRegistrations((prev) => {
        const existing = prev.some((item) => item.id === registration.id)
        return existing
          ? prev.map((item) =>
              item.id === registration.id ? registration : item,
            )
          : [registration, ...prev]
      })
      if (registration.status !== "CONFIRMED") {
        toast.error(
          "Mã hợp lệ nhưng vận động viên không ở trạng thái chờ check-in.",
        )
        return
      }
      checkInMutation.mutate(registration.id)
    },
    onError: (err: unknown) => {
      toast.error(getContestErrorMessage(err, "Mã check-in không hợp lệ."))
    },
  })

  const handleManualCheckInSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!manualCode) return
    if (!assignedCafeId) {
      toast.error(
        "Vui lòng kích hoạt/chọn chi nhánh làm việc trước khi thực hiện check-in!",
      )
      return
    }

    lookupMutation.mutate(manualCode.trim())
    setShowScanDialog(false)
    setManualCode("")
  }

  const filteredRegs = lookedUpRegistrations.filter((r) => {
    const fullName = r.user?.fullName?.toLowerCase() || ""
    const email = r.user?.email?.toLowerCase() || ""
    const code = r.check_in_code?.toLowerCase() || ""
    const term = search.toLowerCase()

    return (
      fullName.includes(term) || email.includes(term) || code.includes(term)
    )
  })

  if (isContestLoading) {
    return (
      <div className="min-h-screen bg-[#fcf8f8] text-[#1c1b1b] flex items-center justify-center">
        <div className="text-center space-y-4">
          <div className="w-10 h-10 border-4 border-orange-500 border-t-transparent rounded-full animate-spin mx-auto animate-spin" />
          <p className="text-[#6f6c6a] text-sm">
            Đang tải chi tiết giải đấu...
          </p>
        </div>
      </div>
    )
  }

  if (!contest) return null

  return (
    <div className="space-y-6 text-[#1c1b1b] p-6 max-w-6xl mx-auto">
      {/* Header Info */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div className="flex items-center gap-3">
          <Button
            asChild
            variant="ghost"
            className="text-[#6f6c6a] hover:text-[#1c1b1b] hover:bg-[#e5e2e1]/50 rounded-xl"
          >
            <Link to="/staff/contests">
              <ArrowLeft size={16} />
            </Link>
          </Button>
          <div>
            <h1 className="text-2xl font-extrabold text-[#1c1b1b] line-clamp-1">
              {contest.name}
            </h1>
            <p className="text-xs text-[#6f6c6a] mt-1 flex items-center gap-2">
              <Calendar size={13} className="text-orange-600" /> Khai mạc:{" "}
              {new Date(contest.starts_at).toLocaleString("vi-VN")}
            </p>
          </div>
        </div>

        <Button
          onClick={() => setShowScanDialog(true)}
          className="bg-orange-600 hover:bg-orange-700 text-white font-bold flex items-center gap-1.5 rounded-xl"
        >
          <QrCode size={18} /> Quét Check-in Thủ Công
        </Button>
      </div>

      {/* Warnings & Notices */}
      {!assignedCafeId && (
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 flex gap-3 text-amber-800">
          <AlertCircle className="shrink-0 text-amber-600" />
          <div>
            <h4 className="font-bold text-sm">Chi nhánh chưa được gán</h4>
            <p className="text-xs mt-1 text-amber-700">
              Bạn cần chọn một chi nhánh làm việc trong thanh bên trước khi có
              thể thực hiện check-in cho khách hàng.
            </p>
          </div>
        </div>
      )}

      {/* Main Registrations Control Panel */}
      <div className="bg-white border border-[#e5e2e1] rounded-2xl p-6 space-y-6 shadow-sm">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h3 className="font-bold text-[#1c1b1b] flex items-center gap-2">
              <Users size={18} className="text-orange-600" /> Danh sách điểm
              danh Vận động viên
            </h3>
            <p className="text-[10px] text-[#6f6c6a] mt-0.5">
              Tổng số đăng ký: {contest.registration_summary?.active ?? 0} | Đã
              check-in: {contest.registration_summary?.checked_in ?? 0}
            </p>
          </div>

          <ContestSearchInput
            value={search}
            onChange={setSearch}
            placeholder="Tên, email hoặc mã check-in..."
            className="w-full sm:w-64"
            inputClassName="h-10 bg-[#f6f3f2] text-xs"
            ariaLabel="Tìm vận động viên đã lookup"
          />
        </div>

        {filteredRegs.length === 0 ? (
          <div className="text-center py-12 text-[#6f6c6a] text-sm">
            Nhập hoặc quét mã check-in để tra cứu vận động viên thuộc giải đấu
            này.
          </div>
        ) : (
          <div className="overflow-x-auto rounded-xl border border-[#e5e2e1] bg-[#fcf8f8]">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-[#f6f3f2] border-b border-[#e5e2e1] text-[#6f6c6a] font-bold">
                  <th className="p-3">Họ Tên</th>
                  <th className="p-3">Email</th>
                  <th className="p-3">Mã Check-in</th>
                  <th className="p-3">Loại Xe</th>
                  <th className="p-3">Ghi Chú</th>
                  <th className="p-3">Trạng Thái</th>
                  <th className="p-3 text-right">Thực Hiện</th>
                </tr>
              </thead>
              <tbody>
                {filteredRegs.map((reg) => (
                  <tr
                    key={reg.id}
                    className="border-b border-[#e5e2e1] hover:bg-white transition-colors"
                  >
                    <td className="p-3 font-bold text-[#1c1b1b]">
                      {reg.user?.fullName || "VĐV"}
                    </td>
                    <td className="p-3 text-[#6f6c6a]">{reg.user?.email}</td>
                    <td className="p-3 font-mono font-bold text-orange-600">
                      {reg.check_in_code}
                    </td>
                    <td className="p-3 text-[#1c1b1b]">{reg.vehicle_source}</td>
                    <td className="p-3 text-[#6f6c6a] truncate max-w-[120px]">
                      {reg.metadata?.note || "-"}
                    </td>
                    <td className="p-3">
                      <Badge
                        className={`uppercase text-[9px] font-bold ${reg.status === "CHECKED_IN" ? "bg-green-500/10 text-green-700 border border-green-500/25" : "bg-orange-500/10 text-orange-700 border border-orange-500/25"}`}
                      >
                        {reg.status}
                      </Badge>
                    </td>
                    <td className="p-3 text-right">
                      {reg.status === "CONFIRMED" && (
                        <Button
                          size="sm"
                          onClick={() => checkInMutation.mutate(reg.id)}
                          disabled={
                            checkInMutation.isPending || !assignedCafeId
                          }
                          className="bg-green-600 hover:bg-green-700 text-white font-bold h-7 text-[10px]"
                        >
                          Check-in
                        </Button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Manual Code Input Dialog */}
      <Dialog open={showScanDialog} onOpenChange={setShowScanDialog}>
        <DialogContent className="bg-white border border-[#e5e2e1] text-[#1c1b1b] max-w-md">
          <DialogHeader>
            <DialogTitle className="text-[#1c1b1b] font-extrabold flex items-center gap-1.5">
              <QrCode className="text-orange-600" /> Nhập mã Check-in điểm danh
            </DialogTitle>
            <DialogDescription className="text-[#6f6c6a] text-xs">
              Nhập mã check-in gồm các ký tự chữ hoặc số để ghi nhận vận động
              viên đã có mặt tại cơ sở.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleManualCheckInSubmit} className="space-y-4 py-4">
            <div className="space-y-1.5">
              <label className="text-xs font-bold uppercase tracking-wider text-[#6f6c6a]">
                Mã check-in điểm danh
              </label>
              <Input
                placeholder="Ví dụ: e4f84e38..."
                value={manualCode}
                onChange={(e) => setManualCode(e.target.value)}
                className="bg-[#f6f3f2] border-[#e5e2e1] text-[#1c1b1b] font-mono tracking-widest text-center"
                required
              />
            </div>

            <div className="flex justify-end gap-3 pt-2">
              <Button
                type="button"
                variant="ghost"
                onClick={() => setShowScanDialog(false)}
                className="text-[#6f6c6a] hover:bg-[#f6f3f2]"
              >
                Hủy
              </Button>
              <Button
                type="submit"
                disabled={lookupMutation.isPending || checkInMutation.isPending}
                className="bg-orange-600 hover:bg-orange-700 font-bold text-white"
              >
                Xác nhận
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}
export default StaffContestDetailPage
