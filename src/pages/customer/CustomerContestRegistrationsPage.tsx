import { useMemo, useState } from "react"
import type { ReactNode } from "react"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { Link, useSearchParams } from "react-router"
import { ArrowRight, CalendarClock, MapPin, ShieldAlert, Swords, Trophy } from "lucide-react"
import { toast } from "sonner"

import { contestApi, contestQueryKeys } from "@/features/contests/api/contest.api"
import {
  formatContestDateTime,
  formatMatchLabel,
  getRegistrationDisplayName,
} from "@/features/contests/lib/contest-runtime"
import {
  getJourneyStatusClass,
  getJourneyStatusLabel,
  getPaymentStatusClass,
  getPaymentStatusLabel,
  getRegistrationStatusClass,
  getRegistrationStatusLabel,
} from "@/features/contests/lib/contest-status"
import { CustomerPageShell } from "@/pages/customer/components/CustomerPageShell"
import { routePaths } from "@/app/router/route-paths"
import { Button } from "@/shared/ui/button"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/shared/ui/dialog"

const journeyOptions = [
  { value: "ALL", label: "Tất cả hành trình" },
  { value: "PENDING_APPROVAL", label: "Chờ duyệt" },
  { value: "APPROVED_WAITING_CHECKIN", label: "Chờ check-in" },
  { value: "READY_TO_RACE", label: "Sẵn sàng đua" },
  { value: "IN_BRACKET", label: "Đang trong bracket" },
  { value: "ADVANCED", label: "Đã vào vòng tiếp" },
  { value: "ELIMINATED", label: "Đã bị loại" },
  { value: "FINISHED", label: "Đã hoàn thành" },
] as const

const contestStatusOptions = [
  { value: "ALL", label: "Mọi trạng thái giải" },
  { value: "OPEN", label: "Đang mở" },
  { value: "CLOSED", label: "Đã đóng đăng ký" },
  { value: "RUNNING", label: "Đang diễn ra" },
  { value: "COMPLETED", label: "Đã hoàn thành" },
] as const

export function CustomerContestRegistrationsPage() {
  const queryClient = useQueryClient()
  const [searchParams, setSearchParams] = useSearchParams()
  const [cancelId, setCancelId] = useState<string | null>(null)
  const query = searchParams.get("query") ?? ""
  const journeyStatus = searchParams.get("journey") ?? "ALL"
  const contestStatus = searchParams.get("contestStatus") ?? "ALL"

  const registrationsQuery = useQuery({
    queryKey: contestQueryKeys.myRegistrations({
      query,
      journeyStatus,
      contestStatus,
    }),
    queryFn: () =>
      contestApi.listMyRegistrations({
        query: query || undefined,
        customer_journey_status: journeyStatus === "ALL" ? undefined : (journeyStatus as never),
        contest_status: contestStatus === "ALL" ? undefined : (contestStatus as never),
      }),
  })

  const cancelMutation = useMutation({
    mutationFn: (registrationId: string) => contestApi.cancelRegistration(registrationId),
    onSuccess: () => {
      toast.success("Hủy đăng ký giải đấu thành công!")
      void queryClient.invalidateQueries({ queryKey: contestQueryKeys.myRegistrations() })
      void queryClient.invalidateQueries({ queryKey: contestQueryKeys.all })
    },
    onError: (error) => {
      toast.error("Không thể hủy đăng ký", {
        description: getErrorMessage(error),
      })
    },
  })

  const registrations = registrationsQuery.data ?? []
  const stats = useMemo(() => {
    return {
      total: registrations.length,
      inBracket: registrations.filter((item) => item.customerJourneyStatus === "IN_BRACKET").length,
      advanced: registrations.filter((item) => item.customerJourneyStatus === "ADVANCED").length,
    }
  }, [registrations])

  return (
    <CustomerPageShell>
      <div className="mb-6 rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <h1 className="text-3xl font-extrabold text-slate-950 font-display">Hành trình contest của bạn</h1>
            <p className="mt-2 text-sm font-medium text-slate-500">
              Theo dõi trạng thái đăng ký, trận gần nhất và bracket của các giải bạn đang tham gia.
            </p>
          </div>
          <div className="grid gap-3 sm:grid-cols-3">
            <Metric label="Đã tham gia" value={String(stats.total)} />
            <Metric label="Trong bracket" value={String(stats.inBracket)} />
            <Metric label="Đã vào vòng tiếp" value={String(stats.advanced)} />
          </div>
        </div>

        <div className="mt-5 grid gap-3 lg:grid-cols-[minmax(0,1fr)_220px_220px]">
          <input
            value={query}
            onChange={(event) => updateSearchParams(setSearchParams, { query: event.target.value, page: null })}
            placeholder="Tìm theo tên giải, tên người chơi hoặc email"
            className="h-11 rounded-2xl border border-slate-200 bg-slate-50 px-4 text-sm outline-none transition focus:border-orange-300 focus:bg-white"
          />
          <select
            value={journeyStatus}
            onChange={(event) => updateSearchParams(setSearchParams, { journey: event.target.value })}
            className="h-11 rounded-2xl border border-slate-200 bg-white px-4 text-sm"
          >
            {journeyOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
          <select
            value={contestStatus}
            onChange={(event) => updateSearchParams(setSearchParams, { contestStatus: event.target.value })}
            className="h-11 rounded-2xl border border-slate-200 bg-white px-4 text-sm"
          >
            {contestStatusOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="space-y-4">
        {registrationsQuery.isLoading ? (
          Array.from({ length: 3 }).map((_, index) => (
            <div key={index} className="h-52 animate-pulse rounded-3xl bg-muted" />
          ))
        ) : registrations.length === 0 ? (
          <div className="rounded-3xl border-2 border-dashed border-slate-200 bg-white p-12 text-center shadow-sm">
            <Trophy className="mx-auto mb-4 size-12 text-slate-300" />
            <h3 className="text-lg font-bold text-slate-900">Bạn chưa có contest phù hợp bộ lọc</h3>
            <p className="mx-auto mt-2 mb-6 max-w-sm text-sm text-slate-500">
              Hãy khám phá thêm các giải đang mở đăng ký hoặc điều chỉnh bộ lọc để xem hành trình thi đấu của bạn.
            </p>
            <Button asChild className="rounded-xl bg-orange-600 px-6 py-5 font-bold text-white hover:bg-orange-700">
              <Link to="/contests">Khám phá giải đấu</Link>
            </Button>
          </div>
        ) : (
          registrations.map((registration) => {
            const contest = registration.contest
            const latestMatch = registration.latestMatch
            const opponentNames = latestMatch && contest
              ? registrations
                  .filter((item) => item.contest?.id === contest.id && item.id !== registration.id)
                  .slice(0, 2)
                  .map((item) => getRegistrationDisplayName(item))
              : []

            return (
              <article
                key={registration.id}
                className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm transition hover:shadow-md"
              >
                <div className="grid gap-0 lg:grid-cols-[240px_minmax(0,1fr)]">
                  <div className="relative min-h-[210px] bg-slate-900">
                    {contest?.banner_image_url ? (
                      <img src={contest.banner_image_url} alt={contest.name} className="absolute inset-0 h-full w-full object-cover" />
                    ) : null}
                    <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-900/70 to-slate-900/30" />
                    <div className="absolute inset-x-0 bottom-0 p-5 text-white">
                      <p className="text-xs font-black uppercase tracking-[0.22em] text-orange-200">
                        {contest?.contest_format?.name ?? "Contest"}
                      </p>
                      <h3 className="mt-2 text-xl font-black leading-tight">{contest?.name ?? "Contest đang cập nhật"}</h3>
                      <div className="mt-3 flex items-center gap-2 text-sm text-white/80">
                        <MapPin className="size-4" />
                        <span>{contest?.host_branch?.cafe?.name ?? "Chi nhánh RC Field"}</span>
                      </div>
                    </div>
                  </div>

                  <div className="p-6">
                    <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
                      <div className="space-y-3">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className={`inline-flex items-center rounded-full border px-3 py-1 text-xs font-bold ${getJourneyStatusClass(registration.customerJourneyStatus)}`}>
                            {getJourneyStatusLabel(registration.customerJourneyStatus)}
                          </span>
                          <span className={`inline-flex items-center rounded-full border px-3 py-1 text-xs font-bold ${getRegistrationStatusClass(registration.status)}`}>
                            {getRegistrationStatusLabel(registration.status)}
                          </span>
                          <span className={`inline-flex items-center rounded-full border px-3 py-1 text-xs font-bold ${getPaymentStatusClass(registration.paymentStatus)}`}>
                            {getPaymentStatusLabel(registration.paymentStatus)}
                          </span>
                        </div>
                        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
                          <InfoTile label="Người thi đấu" value={getRegistrationDisplayName(registration)} />
                          <InfoTile label="Check-in code" value={registration.checkInCode ?? "--"} />
                          <InfoTile label="Lịch thi đấu" value={formatContestDateTime(contest?.starts_at ?? null)} icon={<CalendarClock className="size-4" />} />
                        </div>
                      </div>

                      <div className="flex flex-wrap gap-2">
                        <Button asChild variant="outline" className="rounded-xl border-slate-200">
                          <Link to={routePaths.contestDetail.replace(":contestId", contest?.id ?? registration.contestId)}>
                            Xem bracket
                            <ArrowRight className="ml-2 size-4" />
                          </Link>
                        </Button>
                        {["PENDING", "CONFIRMED"].includes(registration.status) ? (
                          <Button
                            type="button"
                            variant="outline"
                            className="rounded-xl border-red-200 bg-red-50 font-bold text-red-700 hover:bg-red-100 hover:text-red-800"
                            onClick={() => setCancelId(registration.id)}
                          >
                            Hủy đăng ký
                          </Button>
                        ) : null}
                      </div>
                    </div>

                    <div className="mt-5 grid gap-4 xl:grid-cols-[minmax(0,1.2fr)_minmax(0,0.8fr)]">
                      <section className="rounded-2xl border border-slate-200 bg-slate-50/60 p-4">
                        <div className="flex items-center gap-2 text-slate-900">
                          <Swords className="size-4 text-orange-500" />
                          <h4 className="text-sm font-black uppercase tracking-wide">Trận gần nhất</h4>
                        </div>
                        {latestMatch ? (
                          <div className="mt-3 space-y-2">
                            <p className="text-base font-bold text-slate-900">{formatMatchLabel({
                              id: latestMatch.matchId,
                              contest_id: latestMatch.contestId,
                              cafe_id: contest?.host_branch?.cafe_id ?? "",
                              track_config_id: null,
                              round_no: latestMatch.roundNo,
                              match_no: latestMatch.matchNo,
                              name: latestMatch.name,
                              match_type: latestMatch.matchType,
                              status: latestMatch.status,
                              scheduled_at: latestMatch.scheduledAt,
                              started_at: latestMatch.startedAt,
                              ended_at: latestMatch.endedAt,
                              next_match_id: latestMatch.nextMatchId,
                              advancement_rule: {},
                              result_summary: {},
                              metadata: {},
                              decided_by: null,
                              decided_at: null,
                              participants: [],
                            })}</p>
                            <p className="text-sm font-medium text-slate-600">Trạng thái trận: {latestMatch.status}</p>
                            <p className="text-sm font-medium text-slate-600">
                              Kết quả gần nhất: {latestMatch.isWinner ? "Bạn vừa thắng" : latestMatch.finishPosition ? `Về vị trí #${latestMatch.finishPosition}` : "Đang chờ cập nhật"}
                            </p>
                            <p className="text-sm font-medium text-slate-600">
                              Đối thủ nổi bật: {opponentNames.length > 0 ? opponentNames.join(", ") : "Sẽ cập nhật theo bracket"}
                            </p>
                          </div>
                        ) : (
                          <p className="mt-3 text-sm font-medium text-slate-500">
                            Bạn đã được ghi nhận ở contest này, nhưng hệ thống chưa có runtime match gần nhất.
                          </p>
                        )}
                      </section>

                      <section className="rounded-2xl border border-slate-200 bg-white p-4">
                        <h4 className="text-sm font-black uppercase tracking-wide text-slate-900">Gợi ý theo dõi</h4>
                        <div className="mt-3 space-y-2 text-sm text-slate-600">
                          <p>Contest: {contest?.status ?? "--"}</p>
                          <p>Người thi đấu: {registration.participant?.email ?? "Đang cập nhật"}</p>
                          <p>Lệ phí: {getPaymentStatusLabel(registration.paymentStatus)}</p>
                          <p>Check-in: {registration.checkedInAt ? formatContestDateTime(registration.checkedInAt) : "Chưa check-in"}</p>
                        </div>
                      </section>
                    </div>
                  </div>
                </div>
              </article>
            )
          })
        )}
      </div>

      <Dialog open={!!cancelId} onOpenChange={(v) => { if (!v) setCancelId(null) }}>
        <DialogContent className="rounded-2xl border-none sm:max-w-md">
          <DialogHeader>
            <div className="mx-auto mb-2 flex size-12 items-center justify-center rounded-full bg-red-50 text-red-600">
              <ShieldAlert className="size-6" />
            </div>
            <DialogTitle className="text-center text-lg font-bold text-slate-950">Xác nhận hủy đăng ký</DialogTitle>
            <DialogDescription className="mt-2 text-center text-sm leading-relaxed text-slate-500">
              Bạn có chắc chắn muốn hủy đăng ký tham gia giải đấu này không? Hành động này không thể hoàn tác.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="mt-6 gap-2 sm:justify-center">
            <Button
              type="button"
              variant="outline"
              onClick={() => setCancelId(null)}
              disabled={cancelMutation.isPending}
              className="rounded-xl border-slate-200 font-bold"
            >
              Quay lại
            </Button>
            <Button
              type="button"
              disabled={cancelMutation.isPending}
              className="rounded-xl bg-red-600 font-bold text-white hover:bg-red-700"
              onClick={async () => {
                if (cancelId) {
                  await cancelMutation.mutateAsync(cancelId)
                  setCancelId(null)
                }
              }}
            >
              {cancelMutation.isPending ? "Đang hủy..." : "Xác nhận hủy"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </CustomerPageShell>
  )
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3">
      <p className="text-xs font-bold uppercase tracking-wide text-slate-400">{label}</p>
      <p className="mt-1 text-2xl font-black text-slate-950">{value}</p>
    </div>
  )
}

function InfoTile({ label, value, icon }: { label: string; value: string; icon?: ReactNode }) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white px-4 py-3">
      <p className="text-xs font-bold uppercase tracking-wide text-slate-400">{label}</p>
      <div className="mt-1 flex items-center gap-2">
        {icon}
        <p className="text-sm font-bold text-slate-900">{value}</p>
      </div>
    </div>
  )
}

function updateSearchParams(
  setSearchParams: ReturnType<typeof useSearchParams>[1],
  nextValues: Record<string, string | null>,
) {
  setSearchParams((current) => {
    const next = new URLSearchParams(current)
    for (const [key, value] of Object.entries(nextValues)) {
      if (!value || value === "ALL") next.delete(key)
      else next.set(key, value)
    }
    return next
  })
}

function getErrorMessage(error: unknown) {
  const maybe = error as { response?: { data?: { message?: string } } }
  return maybe.response?.data?.message ?? "Vui lòng thử lại."
}
