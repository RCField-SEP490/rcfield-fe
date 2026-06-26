import { useMemo, useState, type ReactNode } from "react"
import {
  Car,
  CheckCircle2,
  Clock,
  Eye,
  Mail,
  MapPin,
  QrCode,
  ShieldCheck,
  UserRound,
  Users,
  XCircle,
} from "lucide-react"

import type { Contest, ContestRegistration } from "../types"
import { ContestSearchInput } from "./TournamentPrimitives"
import {
  checkedInCafeName,
  filterContestRegistrations,
  formatContestDateTime,
  getParticipantRoleLabel,
  getRegistrationCounts,
  getRegistrationStatusLabel,
  getVehicleSourceLabel,
  registrationEmail,
  registrationName,
  registrationNote,
  type RegistrationFilterState,
} from "../lib/tournament"
import { Badge } from "@/shared/ui/badge"
import { Button } from "@/shared/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/shared/ui/dialog"
import { Input } from "@/shared/ui/input"
import { cn } from "@/shared/lib/utils"

interface ParticipantManagementPanelProps {
  contest: Contest
  registrations: ContestRegistration[]
  defaultCafeId: string
  actionPending?: boolean
  onCheckIn: (registrationId: string, cafeId: string) => void
  onCancel: (registrationId: string, reason: string) => void
  onApprove: (registrationId: string) => void
  onReject: (registrationId: string, reason: string) => void
}

const statusTone: Record<string, string> = {
  PENDING: "border-amber-500/25 bg-amber-500/10 text-amber-300",
  CONFIRMED: "border-orange-500/25 bg-orange-500/10 text-orange-300",
  CHECKED_IN: "border-emerald-500/25 bg-emerald-500/10 text-emerald-300",
  CANCELLED: "border-red-500/25 bg-red-500/10 text-red-300",
}

export function ParticipantManagementPanel({
  contest,
  registrations,
  defaultCafeId,
  actionPending,
  onCheckIn,
  onCancel,
  onApprove,
  onReject,
}: ParticipantManagementPanelProps) {
  const [filters, setFilters] = useState<RegistrationFilterState>({
    search: "",
    status: "ALL",
    vehicleSource: "ALL",
    cafeId: "ALL",
  })
  const [selectedRegistration, setSelectedRegistration] =
    useState<ContestRegistration | null>(null)
  const [cancelTarget, setCancelTarget] = useState<ContestRegistration | null>(
    null,
  )
  const [cancelReason, setCancelReason] = useState("")

  const [rejectTarget, setRejectTarget] = useState<ContestRegistration | null>(null)
  const [rejectReason, setRejectReason] = useState("")

  const counts = useMemo(
    () => getRegistrationCounts(registrations, contest.capacity),
    [contest.capacity, registrations],
  )
  const filteredRegistrations = useMemo(
    () => filterContestRegistrations(registrations, filters),
    [filters, registrations],
  )
  const selectedCafeId =
    defaultCafeId || contest.participating_cafes[0]?.id || ""

  const updateFilter = <K extends keyof RegistrationFilterState>(
    key: K,
    value: RegistrationFilterState[K],
  ) => {
    setFilters((current) => ({ ...current, [key]: value }))
  }

  const openCancelDialog = (registration: ContestRegistration) => {
    setCancelTarget(registration)
    setCancelReason("")
  }

  const submitCancel = () => {
    if (!cancelTarget || !cancelReason.trim()) return
    onCancel(cancelTarget.id, cancelReason.trim())
    setCancelTarget(null)
    setCancelReason("")
  }

  const openRejectDialog = (registration: ContestRegistration) => {
    setRejectTarget(registration)
    setRejectReason("")
  }

  const submitReject = () => {
    if (!rejectTarget || !rejectReason.trim()) return
    onReject(rejectTarget.id, rejectReason.trim())
    setRejectTarget(null)
    setRejectReason("")
  }

  return (
    <section className="space-y-5 rounded-2xl border border-slate-800 bg-slate-900 p-5 shadow-xl">
      <div className="flex flex-col gap-4 border-b border-slate-800 pb-5 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <h3 className="flex items-center gap-2 font-bold text-slate-100">
            <Users size={18} className="text-orange-500" /> Quản lý người tham
            gia
          </h3>
          <p className="mt-1 text-xs font-medium text-slate-400">
            Theo dõi đăng ký, xe, check-in và thao tác vận hành trong ngày thi
            đấu.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2 text-[10px] font-bold uppercase tracking-wider text-slate-500">
          <span>{filteredRegistrations.length} đang hiển thị</span>
          <span className="h-1 w-1 rounded-full bg-slate-700" />
          <span>{counts.remaining} chỗ còn lại</span>
        </div>
      </div>

      <div className="grid gap-3 md:grid-cols-4 xl:grid-cols-7">
        <ParticipantMetric label="Tổng" value={counts.total} icon={<Users />} />
        <ParticipantMetric
          label="Confirmed"
          value={counts.confirmed}
          icon={<ShieldCheck />}
        />
        <ParticipantMetric
          label="Check-in"
          value={counts.checkedIn}
          icon={<CheckCircle2 />}
        />
        <ParticipantMetric
          label="Đã hủy"
          value={counts.cancelled}
          icon={<XCircle />}
        />
        <ParticipantMetric label="BYOC" value={counts.byoc} icon={<Car />} />
        <ParticipantMetric
          label="Rental"
          value={counts.rental}
          icon={<Car />}
        />
        <ParticipantMetric
          label="Còn chỗ"
          value={counts.remaining}
          icon={<Clock />}
        />
      </div>

      <div className="grid gap-3 lg:grid-cols-[minmax(240px,1fr)_160px_160px_200px]">
        <ContestSearchInput
          ariaLabel="Tìm người tham gia"
          placeholder="Tìm tên, email, mã check-in, ghi chú..."
          value={filters.search}
          onChange={(value) => updateFilter("search", value)}
          inputClassName="h-10 border-slate-800 bg-slate-950 text-slate-100 placeholder:text-slate-500 focus-visible:ring-orange-500"
        />
        <select
          aria-label="Lọc trạng thái"
          value={filters.status}
          onChange={(event) =>
            updateFilter(
              "status",
              event.target.value as RegistrationFilterState["status"],
            )
          }
          className="h-10 rounded-lg border border-slate-800 bg-slate-950 px-3 text-sm font-semibold text-slate-200 outline-none"
        >
          <option value="ALL">Mọi trạng thái</option>
          <option value="PENDING">Chờ xác nhận</option>
          <option value="CONFIRMED">Đã xác nhận</option>
          <option value="CHECKED_IN">Đã check-in</option>
          <option value="CANCELLED">Đã hủy</option>
        </select>
        <select
          aria-label="Lọc nguồn xe"
          value={filters.vehicleSource}
          onChange={(event) =>
            updateFilter(
              "vehicleSource",
              event.target.value as RegistrationFilterState["vehicleSource"],
            )
          }
          className="h-10 rounded-lg border border-slate-800 bg-slate-950 px-3 text-sm font-semibold text-slate-200 outline-none"
        >
          <option value="ALL">Mọi loại xe</option>
          <option value="BYOC">BYOC</option>
          <option value="RENTAL">Rental</option>
        </select>
        <select
          aria-label="Lọc chi nhánh check-in"
          value={filters.cafeId}
          onChange={(event) => updateFilter("cafeId", event.target.value)}
          className="h-10 rounded-lg border border-slate-800 bg-slate-950 px-3 text-sm font-semibold text-slate-200 outline-none"
        >
          <option value="ALL">Mọi chi nhánh</option>
          {contest.participating_cafes.map((cafe) => (
            <option key={cafe.id} value={cafe.id}>
              {cafe.name}
            </option>
          ))}
        </select>
      </div>

      {registrations.length === 0 ? (
        <EmptyParticipantState />
      ) : filteredRegistrations.length === 0 ? (
        <div className="rounded-xl border border-dashed border-slate-800 bg-slate-950 px-4 py-10 text-center text-sm font-semibold text-slate-500">
          Không tìm thấy người tham gia khớp bộ lọc hiện tại.
        </div>
      ) : (
        <div className="overflow-x-auto rounded-xl border border-slate-800 bg-slate-950">
          <table className="w-full min-w-[1120px] border-collapse text-left text-xs">
            <thead>
              <tr className="border-b border-slate-800 bg-slate-900 text-[10px] font-extrabold uppercase tracking-wider text-slate-500">
                <th className="px-4 py-3">Người tham gia</th>
                <th className="px-4 py-3">Role</th>
                <th className="px-4 py-3">Xe</th>
                <th className="px-4 py-3">Ghi chú</th>
                <th className="px-4 py-3">Mã check-in</th>
                <th className="px-4 py-3">Cafe check-in</th>
                <th className="px-4 py-3">Trạng thái</th>
                <th className="px-4 py-3 text-right">Thao tác</th>
              </tr>
            </thead>
            <tbody>
              {filteredRegistrations.map((registration) => (
                <tr
                  key={registration.id}
                  className="border-b border-slate-900 hover:bg-slate-900/55"
                >
                  <td className="px-4 py-3">
                    <div className="font-extrabold text-slate-100">
                      {registrationName(registration)}
                    </div>
                    <div className="mt-1 flex items-center gap-1 text-[11px] font-medium text-slate-500">
                      <Mail className="size-3" />
                      <span className="truncate">
                        {registrationEmail(registration) || "--"}
                      </span>
                    </div>
                  </td>
                  <td className="px-4 py-3 font-semibold text-slate-300">
                    {getParticipantRoleLabel(
                      registration.participant_role_snapshot,
                    )}
                  </td>
                  <td className="px-4 py-3">
                    <Badge
                      variant="secondary"
                      className="border border-slate-800 bg-slate-900 text-[10px] text-slate-300"
                    >
                      {getVehicleSourceLabel(registration.vehicle_source)}
                    </Badge>
                  </td>
                  <td className="max-w-[180px] truncate px-4 py-3 font-medium text-slate-400">
                    {registrationNote(registration) || "-"}
                  </td>
                  <td className="px-4 py-3 font-mono text-[11px] font-bold text-orange-300">
                    {registration.check_in_code}
                  </td>
                  <td className="px-4 py-3 text-slate-400">
                    <div className="max-w-[180px] truncate font-semibold">
                      {checkedInCafeName(
                        registration,
                        contest.participating_cafes,
                      ) || "-"}
                    </div>
                    <div className="mt-1 text-[10px] text-slate-600">
                      {registration.checked_in_at
                        ? formatContestDateTime(registration.checked_in_at)
                        : ""}
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <RegistrationStatusBadge status={registration.status} />
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex justify-end gap-2">
                      <Button
                        type="button"
                        size="sm"
                        variant="outline"
                        onClick={() => setSelectedRegistration(registration)}
                        className="h-8 border-slate-800 bg-slate-950 px-2 text-slate-300 hover:bg-slate-900"
                      >
                        <Eye className="size-3.5" />
                      </Button>
                      {registration.status === "PENDING" ? (
                        <>
                          <Button
                            type="button"
                            size="sm"
                            onClick={() => onApprove(registration.id)}
                            disabled={actionPending}
                            className="h-8 bg-emerald-600 px-3 text-[10px] font-bold text-white hover:bg-emerald-700"
                          >
                            Duyệt
                          </Button>
                          <Button
                            type="button"
                            size="sm"
                            variant="outline"
                            onClick={() => openRejectDialog(registration)}
                            disabled={actionPending}
                            className="h-8 border-red-500/30 bg-slate-950 px-3 text-[10px] font-bold text-red-300 hover:bg-red-500/10"
                          >
                            Từ chối
                          </Button>
                        </>
                      ) : null}
                      {registration.status === "CONFIRMED" ? (
                        <>
                          <Button
                            type="button"
                            size="sm"
                            onClick={() =>
                              onCheckIn(registration.id, selectedCafeId)
                            }
                            disabled={actionPending || !selectedCafeId}
                            className="h-8 bg-emerald-600 px-3 text-[10px] font-bold text-white hover:bg-emerald-700"
                          >
                            Check-in
                          </Button>
                          <Button
                            type="button"
                            size="sm"
                            variant="outline"
                            onClick={() => openCancelDialog(registration)}
                            disabled={actionPending}
                            className="h-8 border-red-500/30 bg-slate-950 px-3 text-[10px] font-bold text-red-300 hover:bg-red-500/10"
                          >
                            Hủy
                          </Button>
                        </>
                      ) : null}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <ParticipantDetailDialog
        contest={contest}
        registration={selectedRegistration}
        onOpenChange={(open) => {
          if (!open) setSelectedRegistration(null)
        }}
      />

      <Dialog
        open={Boolean(cancelTarget)}
        onOpenChange={(open) => {
          if (!open) {
            setCancelTarget(null)
            setCancelReason("")
          }
        }}
      >
        <DialogContent className="border-slate-800 bg-slate-900 text-slate-100">
          <DialogHeader>
            <DialogTitle className="font-extrabold">
              Hủy đăng ký người tham gia
            </DialogTitle>
            <DialogDescription className="text-slate-400">
              Ghi lý do để đội vận hành có thể đối soát sau sự kiện.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3">
            <div className="rounded-lg border border-slate-800 bg-slate-950 p-3 text-sm">
              <div className="font-bold text-slate-100">
                {registrationName(cancelTarget ?? undefined)}
              </div>
              <div className="mt-1 text-xs text-slate-500">
                {registrationEmail(cancelTarget ?? undefined)}
              </div>
            </div>
            <Input
              aria-label="Lý do hủy đăng ký"
              placeholder="Nhập lý do hủy..."
              value={cancelReason}
              onChange={(event) => setCancelReason(event.target.value)}
              className="border-slate-800 bg-slate-950 text-slate-100 placeholder:text-slate-500"
            />
            <div className="flex justify-end gap-2">
              <Button
                type="button"
                variant="ghost"
                onClick={() => {
                  setCancelTarget(null)
                  setCancelReason("")
                }}
                className="text-slate-400"
              >
                Đóng
              </Button>
              <Button
                type="button"
                disabled={!cancelReason.trim() || actionPending}
                onClick={submitCancel}
                className="bg-red-600 font-bold text-white hover:bg-red-700"
              >
                Xác nhận hủy
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog
        open={Boolean(rejectTarget)}
        onOpenChange={(open) => {
          if (!open) {
            setRejectTarget(null)
            setRejectReason("")
          }
        }}
      >
        <DialogContent className="border-slate-800 bg-slate-900 text-slate-100">
          <DialogHeader>
            <DialogTitle className="font-extrabold">
              Từ chối đăng ký người tham gia
            </DialogTitle>
            <DialogDescription className="text-slate-400">
              Ghi lý do từ chối đăng ký tham gia giải đấu này.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3">
            <div className="rounded-lg border border-slate-800 bg-slate-950 p-3 text-sm">
              <div className="font-bold text-slate-100">
                {registrationName(rejectTarget ?? undefined)}
              </div>
              <div className="mt-1 text-xs text-slate-500">
                {registrationEmail(rejectTarget ?? undefined)}
              </div>
            </div>
            <Input
              aria-label="Lý do từ chối đăng ký"
              placeholder="Nhập lý do từ chối..."
              value={rejectReason}
              onChange={(event) => setRejectReason(event.target.value)}
              className="border-slate-800 bg-slate-950 text-slate-100 placeholder:text-slate-500"
            />
            <div className="flex justify-end gap-2">
              <Button
                type="button"
                variant="ghost"
                onClick={() => {
                  setRejectTarget(null)
                  setRejectReason("")
                }}
                className="text-slate-400"
              >
                Đóng
              </Button>
              <Button
                type="button"
                disabled={!rejectReason.trim() || actionPending}
                onClick={submitReject}
                className="bg-red-600 font-bold text-white hover:bg-red-700"
              >
                Xác nhận từ chối
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </section>
  )
}

function ParticipantMetric({
  label,
  value,
  icon,
}: {
  label: string
  value: number
  icon: ReactNode
}) {
  return (
    <div className="rounded-xl border border-slate-800 bg-slate-950 p-4">
      <div className="flex items-center justify-between gap-3 text-[10px] font-extrabold uppercase tracking-wider text-slate-500">
        <span>{label}</span>
        <span className="[&_svg]:size-4">{icon}</span>
      </div>
      <div className="mt-3 text-2xl font-black text-slate-100">{value}</div>
    </div>
  )
}

function RegistrationStatusBadge({ status }: { status: string }) {
  return (
    <Badge
      className={cn(
        "border text-[9px] font-extrabold uppercase tracking-wide",
        statusTone[status] ?? statusTone.PENDING,
      )}
    >
      {getRegistrationStatusLabel(status)}
    </Badge>
  )
}

function ParticipantDetailDialog({
  contest,
  registration,
  onOpenChange,
}: {
  contest: Contest
  registration: ContestRegistration | null
  onOpenChange: (open: boolean) => void
}) {
  return (
    <Dialog open={Boolean(registration)} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl border-slate-800 bg-slate-900 text-slate-100">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 font-extrabold">
            <UserRound className="size-5 text-orange-400" /> Chi tiết người tham
            gia
          </DialogTitle>
          <DialogDescription className="text-slate-400">
            Thông tin dùng để đối soát check-in, xe và trạng thái đăng ký.
          </DialogDescription>
        </DialogHeader>

        {registration ? (
          <div className="grid gap-4 md:grid-cols-[1fr_260px]">
            <div className="space-y-4">
              <div className="rounded-xl border border-slate-800 bg-slate-950 p-4">
                <div className="text-lg font-black text-slate-100">
                  {registrationName(registration)}
                </div>
                <div className="mt-1 text-sm font-medium text-slate-500">
                  {registrationEmail(registration) || "--"}
                </div>
                <div className="mt-3 flex flex-wrap gap-2">
                  <RegistrationStatusBadge status={registration.status} />
                  <Badge className="border border-slate-800 bg-slate-900 text-slate-300">
                    {getParticipantRoleLabel(
                      registration.participant_role_snapshot,
                    )}
                  </Badge>
                  <Badge className="border border-slate-800 bg-slate-900 text-slate-300">
                    {getVehicleSourceLabel(registration.vehicle_source)}
                  </Badge>
                </div>
              </div>

              <div className="grid gap-3 sm:grid-cols-2">
                <DetailItem
                  label="Vehicle ID"
                  value={registration.vehicle_id || "--"}
                />
                <DetailItem
                  label="Customer vehicle ID"
                  value={registration.customer_vehicle_id || "--"}
                />
                <DetailItem
                  label="Ghi chú xe"
                  value={registrationNote(registration) || "--"}
                />
                <DetailItem
                  label="Cafe check-in"
                  value={
                    checkedInCafeName(
                      registration,
                      contest.participating_cafes,
                    ) || "--"
                  }
                />
                <DetailItem
                  label="Check-in lúc"
                  value={formatContestDateTime(registration.checked_in_at)}
                />
                <DetailItem
                  label="Hủy lúc"
                  value={formatContestDateTime(registration.cancelled_at)}
                />
                <DetailItem
                  label="Lý do hủy"
                  value={registration.cancellation_reason || "--"}
                  wide
                />
              </div>
            </div>

            <div className="rounded-xl border border-orange-500/20 bg-orange-500/5 p-4 text-center">
              <QrCode className="mx-auto size-24 text-orange-300" />
              <div className="mt-3 break-all rounded-lg border border-slate-800 bg-slate-950 p-3 font-mono text-xs font-black text-orange-200">
                {registration.check_in_code}
              </div>
              <div className="mt-3 text-[10px] font-bold uppercase tracking-wider text-slate-500">
                Mã check-in
              </div>
              <div className="mt-5 space-y-3 text-left">
                <TimelineItem
                  label="Tạo đăng ký"
                  value={formatContestDateTime(registration.created_at)}
                />
                <TimelineItem
                  label="Check-in"
                  value={formatContestDateTime(registration.checked_in_at)}
                />
                <TimelineItem
                  label="Cập nhật cuối"
                  value={formatContestDateTime(registration.updated_at)}
                />
              </div>
            </div>
          </div>
        ) : null}
      </DialogContent>
    </Dialog>
  )
}

function DetailItem({
  label,
  value,
  wide,
}: {
  label: string
  value: string
  wide?: boolean
}) {
  return (
    <div
      className={cn(
        "rounded-lg border border-slate-800 bg-slate-950 p-3",
        wide && "sm:col-span-2",
      )}
    >
      <div className="text-[10px] font-extrabold uppercase tracking-wider text-slate-500">
        {label}
      </div>
      <div className="mt-1 break-words text-sm font-semibold text-slate-200">
        {value}
      </div>
    </div>
  )
}

function TimelineItem({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-start gap-2 text-xs">
      <MapPin className="mt-0.5 size-3.5 text-orange-400" />
      <div>
        <div className="font-bold text-slate-300">{label}</div>
        <div className="mt-0.5 text-slate-500">{value}</div>
      </div>
    </div>
  )
}

function EmptyParticipantState() {
  return (
    <div className="rounded-xl border border-dashed border-slate-800 bg-slate-950 px-4 py-12 text-center">
      <Users className="mx-auto size-10 text-slate-600" />
      <h4 className="mt-3 text-sm font-extrabold text-slate-200">
        Chưa có người tham gia
      </h4>
      <p className="mx-auto mt-1 max-w-md text-xs font-semibold leading-relaxed text-slate-500">
        Khi contest được mở đăng ký, danh sách tay đua, trạng thái check-in và
        thông tin xe sẽ xuất hiện tại đây.
      </p>
    </div>
  )
}
