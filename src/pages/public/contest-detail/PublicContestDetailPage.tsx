import { useMemo, useState } from "react"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { ArrowLeft, Info as InfoIcon, ShieldCheck } from "lucide-react"
import { Link, useParams } from "react-router"
import { toast } from "sonner"

import { routePaths } from "@/app/router/route-paths"
import { useAuthStore } from "@/features/auth/stores/auth.store"
import {
  bookingApi,
  bookingQueryKeys,
} from "@/features/booking/api/booking.api"
import {
  contestApi,
  contestQueryKeys,
} from "@/features/contests/api/contest.api"
import { groupMatchesByRound } from "@/features/contests/lib/contest-runtime"
import {
  getContestStatusLabel,
  getContestRegistrationAvailability,
  getEffectiveContestStatus,
  getJourneyStatusLabel,
} from "@/features/contests/lib/contest-status"
import type { ContestItem, ContestRegistration } from "@/features/contests/types"
import { Card } from "@/shared/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/shared/ui/tabs"

import { ContestBracketBoard, ContestRuntimeOverview } from "./components/ContestBracketSection"
import { ContestHero } from "./components/ContestHero"
import { ContestLeaderboardSection } from "./components/ContestLeaderboardSection"
import {
  ContestPrizeAndBranches,
  ContestSummaryCards,
  ContestTimeline,
} from "./components/ContestOverviewSection"
import { ContestRegistrationPanel } from "./components/ContestRegistrationPanel"
import { StatusRow } from "./components/DetailPrimitives"
import { MyRegistrationMatches } from "./components/MyRegistrationSection"
import { getErrorMessage } from "./utils"

type DetailTab = "overview" | "matches" | "leaderboard" | "registration"

export function PublicContestDetailPage() {
  const { contestId } = useParams()
  const queryClient = useQueryClient()
  const role = useAuthStore((state) => state.role)
  const profile = useAuthStore((state) => state.user)
  const [selectedBookingId, setSelectedBookingId] = useState("")
  const [selectedVehicleId, setSelectedVehicleId] = useState("")
  const [registrationMode, setRegistrationMode] = useState<"RENTAL" | "BYOC">(
    "RENTAL",
  )
  const [byocVehicleName, setByocVehicleName] = useState("")
  const [byocVehicleBrand, setByocVehicleBrand] = useState("")
  const [byocVehicleClass, setByocVehicleClass] = useState("")
  const [byocVehicleNotes, setByocVehicleNotes] = useState("")
  const [activeTab, setActiveTab] = useState<DetailTab>("overview")

  const contestQuery = useQuery({
    queryKey: contestQueryKeys.detail(contestId),
    queryFn: () => contestApi.getContest(contestId!),
    enabled: Boolean(contestId),
  })
  const matchesQuery = useQuery({
    queryKey: contestQueryKeys.matches(contestId),
    queryFn: () => contestApi.listMatches(contestId!),
    enabled: Boolean(contestId),
  })
  const myBookingsQuery = useQuery({
    queryKey: bookingQueryKeys.mine({
      status: "CONFIRMED",
      page: 1,
      limit: 50,
    }),
    queryFn: () =>
      bookingApi.listMyBookings({ status: "CONFIRMED", page: 1, limit: 50 }),
    enabled: role === "customer",
  })
  const bookingDetailQuery = useQuery({
    queryKey: bookingQueryKeys.detail(selectedBookingId),
    queryFn: () => bookingApi.getBooking(selectedBookingId),
    enabled: Boolean(selectedBookingId),
  })
  const myRegistrationsQuery = useQuery({
    queryKey: contestQueryKeys.myRegistrations(),
    queryFn: () => contestApi.listMyRegistrations(),
    enabled: role === "customer",
  })

  const registerMutation = useMutation({
    mutationFn: async () => {
      if (!contestId) throw new Error("Missing contestId")
      if (registrationMode === "BYOC") {
        return contestApi.registerContest(contestId, {
          vehicle_source: "BYOC",
          byoc_vehicle_name: byocVehicleName,
          byoc_vehicle_brand: byocVehicleBrand || undefined,
          byoc_vehicle_class: byocVehicleClass || undefined,
          byoc_vehicle_notes: byocVehicleNotes || undefined,
        })
      }
      return contestApi.registerContest(contestId, {
        booking_id: selectedBookingId,
        vehicle_id: selectedVehicleId,
        vehicle_source: "RENTAL",
      })
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({
        queryKey: contestQueryKeys.myRegistrations(),
      })
      void queryClient.invalidateQueries({
        queryKey: contestQueryKeys.detail(contestId),
      })
      void queryClient.invalidateQueries({
        queryKey: contestQueryKeys.matches(contestId),
      })
      setActiveTab("registration")
    },
  })
  const entryFeePaymentMutation = useMutation({
    mutationFn: async (registrationId: string) =>
      contestApi.createEntryFeePayment(registrationId),
  })

  const contest = contestQuery.data
  const bookingOptions = myBookingsQuery.data?.data ?? []
  const selectedBooking = bookingDetailQuery.data
  const existingRegistration = useMemo(
    () =>
      contest?.my_registration ??
      myRegistrationsQuery.data?.find((item) => item.contestId === contestId) ??
      null,
    [contest?.my_registration, myRegistrationsQuery.data, contestId],
  )
  const matches = useMemo(() => matchesQuery.data ?? [], [matchesQuery.data])
  const groupedMatches = useMemo(() => groupMatchesByRound(matches), [matches])
  const myMatches = useMemo(
    () =>
      matches.filter((match) =>
        match.participants.some(
          (participant) => participant.registration?.is_my_registration,
        ),
      ),
    [matches],
  )
  const selectedVehicle =
    selectedBooking?.vehicles.find(
      (vehicle) => vehicle.vehicleId === selectedVehicleId,
    ) ?? null
  const runtimeSummary = contest?.runtime_summary
  const highlightRounds = contest?.highlight_rounds ?? runtimeSummary?.highlight_rounds ?? []
  const leaderboard = contest?.published_leaderboard ?? null
  const effectiveStatus = contest ? getEffectiveContestStatus(contest) : null
  const registrationAvailability = contest
    ? getContestRegistrationAvailability(contest)
    : null
  const registrationClosed = registrationAvailability !== "AVAILABLE"
  const allowsByoc =
    contest?.vehicle_rule?.vehicle_policy === "BYOC_ONLY" ||
    contest?.vehicle_rule?.vehicle_policy === "MIXED"
  const rentalOnly = contest?.vehicle_rule?.vehicle_policy === "RENTAL_ONLY"
  const prizeStructure = contest?.prize_structure
  const prizeItems = Array.isArray(prizeStructure?.items)
    ? (prizeStructure.items as Array<Record<string, unknown>>)
    : Array.isArray(prizeStructure?.tiers)
      ? (prizeStructure.tiers as Array<Record<string, unknown>>)
      : []
  const bookingHelperMessage = useMemo(() => {
    if (!contest) return null
    if (myBookingsQuery.isLoading) {
      return "Đang tải danh sách booking phù hợp..."
    }
    if (bookingOptions.length > 0) return null

    const branchName = contest.host_branch?.cafe?.name ?? "chi nhánh tổ chức"
    const trackName = contest.track_type?.name ?? "track tương ứng"
    return `Bạn chưa có booking CONFIRMED phù hợp tại ${branchName} với track ${trackName}. Hãy tạo booking trước rồi quay lại đăng ký contest.`
  }, [contest, myBookingsQuery.isLoading, bookingOptions.length])

  const handleRegister = async () => {
    try {
      const registration = await registerMutation.mutateAsync()
      toast.success("Đăng ký tham gia giải đấu thành công!")
      if (
        (registration.entryFeeAmount ?? 0) > 0 &&
        registration.paymentStatus === "PENDING_PAYMENT"
      ) {
        const payment = await entryFeePaymentMutation.mutateAsync(
          registration.id,
        )
        window.location.assign(payment.payment_url)
      }
    } catch (error) {
      toast.error("Không thể đăng ký giải đấu", {
        description: getErrorMessage(error),
      })
    }
  }

  const handleContinuePayment = async () => {
    if (!existingRegistration) return
    try {
      const payment = await entryFeePaymentMutation.mutateAsync(
        existingRegistration.id,
      )
      window.location.assign(payment.payment_url)
    } catch (error) {
      toast.error("Không thể tạo thanh toán lệ phí", {
        description: getErrorMessage(error),
      })
    }
  }

  return (
    <section className="bg-[#f7f4f2]">
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6">
      <Link
        to={routePaths.contests}
        className="mb-5 inline-flex items-center gap-2 text-sm font-bold text-[#5d5f5f] transition hover:text-[#1f2424]"
      >
        <ArrowLeft className="size-4" />
        <span>Quay lại danh sách giải đấu</span>
      </Link>

      {!contest ? (
        <div className="h-96 animate-pulse rounded-3xl bg-muted" />
      ) : (
        <div className="space-y-8">
          <ContestHero contest={contest} effectiveStatus={effectiveStatus ?? contest.status} />

          <Tabs
            value={activeTab}
            onValueChange={(value) => setActiveTab(value as DetailTab)}
            className="space-y-6"
          >
            <TabsList className="flex w-full flex-wrap gap-2 rounded-2xl border border-[#e5e2e1] bg-white p-2 shadow-sm">
              <TabsTrigger value="overview" className="rounded-xl px-4 py-2.5 data-[state=active]:bg-[#1f2424] data-[state=active]:text-white">
                Tổng quan
              </TabsTrigger>
              <TabsTrigger value="matches" className="rounded-xl px-4 py-2.5 data-[state=active]:bg-[#1f2424] data-[state=active]:text-white">
                Trận đấu
              </TabsTrigger>
              <TabsTrigger
                value="leaderboard"
                className="rounded-xl px-4 py-2.5 data-[state=active]:bg-[#1f2424] data-[state=active]:text-white"
              >
                Bảng xếp hạng
              </TabsTrigger>
              <TabsTrigger
                value="registration"
                className="rounded-xl px-4 py-2.5 data-[state=active]:bg-[#1f2424] data-[state=active]:text-white"
              >
                Đăng ký của tôi
              </TabsTrigger>
            </TabsList>

            <div className="grid gap-8 lg:grid-cols-[1.2fr_0.8fr]">
              <div className="space-y-6">
                <TabsContent value="overview" className="mt-0 space-y-6">
                  <ContestSummaryCards contest={contest} />
                  <ContestPrizeAndBranches
                    contest={contest}
                    prizeItems={prizeItems}
                  />
                  <ContestTimeline contest={contest} />
                </TabsContent>

                <TabsContent value="matches" className="mt-0 space-y-6">
                  <ContestRuntimeOverview
                    effectiveStatus={effectiveStatus ?? contest.status}
                    runtimeSummary={runtimeSummary}
                    highlightRounds={highlightRounds}
                  />
                  <ContestBracketBoard
                    matches={matches}
                    groupedMatches={groupedMatches}
                    existingRegistration={existingRegistration}
                    loading={matchesQuery.isLoading}
                  />
                </TabsContent>

                <TabsContent value="leaderboard" className="mt-0 space-y-6">
                  <ContestLeaderboardSection
                    leaderboard={leaderboard}
                    matches={matches}
                  />
                </TabsContent>

                <TabsContent value="registration" className="mt-0 space-y-6">
                  {existingRegistration ? (
                    <MyRegistrationMatches
                      registration={existingRegistration}
                      matches={myMatches}
                      loading={matchesQuery.isLoading}
                    />
                  ) : (
                    <Card className="rounded-3xl border border-slate-200/80 p-6 shadow-sm">
                      <div className="flex items-start gap-3">
                        <InfoIcon className="mt-0.5 size-5 shrink-0 text-orange-500" />
                        <div className="space-y-2">
                          <h3 className="text-lg font-extrabold text-slate-900">
                            Chưa có đăng ký của bạn
                          </h3>
                          <p className="text-sm text-slate-500">
                            Hãy hoàn thành đăng ký ở khung bên phải. Sau khi
                            được duyệt và được xếp trận, bracket của bạn sẽ hiện
                            tại đây.
                          </p>
                        </div>
                      </div>
                    </Card>
                  )}
                </TabsContent>
              </div>

              <div className="space-y-6">
                <ContestAsideStatus
                  effectiveStatus={effectiveStatus ?? contest.status}
                  runtimeSummary={runtimeSummary}
                  existingRegistration={existingRegistration}
                />
                <ContestRegistrationPanel
                  contest={contest}
                  registrationAvailability={registrationAvailability ?? "DRAFT"}
                  role={role}
                  profileName={profile?.email ?? profile?.fullName ?? "--"}
                  existingRegistration={existingRegistration}
                  entryFeePaymentPending={entryFeePaymentMutation.isPending}
                  onContinuePayment={() => void handleContinuePayment()}
                  allowsByoc={allowsByoc}
                  rentalOnly={rentalOnly}
                  registrationMode={registrationMode}
                  setRegistrationMode={setRegistrationMode}
                  byocVehicleName={byocVehicleName}
                  setByocVehicleName={setByocVehicleName}
                  byocVehicleBrand={byocVehicleBrand}
                  setByocVehicleBrand={setByocVehicleBrand}
                  byocVehicleClass={byocVehicleClass}
                  setByocVehicleClass={setByocVehicleClass}
                  byocVehicleNotes={byocVehicleNotes}
                  setByocVehicleNotes={setByocVehicleNotes}
                  bookingOptions={bookingOptions}
                  selectedBookingId={selectedBookingId}
                  setSelectedBookingId={setSelectedBookingId}
                  selectedVehicleId={selectedVehicleId}
                  setSelectedVehicleId={setSelectedVehicleId}
                  selectedBooking={selectedBooking}
                  selectedVehicle={selectedVehicle}
                  bookingHelperMessage={bookingHelperMessage}
                  registrationClosed={registrationClosed}
                  registerPending={registerMutation.isPending}
                  onRegister={() => void handleRegister()}
                />
              </div>
            </div>
          </Tabs>
        </div>
      )}
      </div>
    </section>
  )
}

function ContestAsideStatus({
  effectiveStatus,
  runtimeSummary,
  existingRegistration,
}: {
  effectiveStatus: ContestItem["status"]
  runtimeSummary: ContestItem["runtime_summary"]
  existingRegistration: ContestRegistration | null
}) {
  return (
    <Card className="rounded-2xl border border-[#e5e2e1] bg-white p-6 shadow-sm">
      <div className="flex items-center gap-2">
        <ShieldCheck className="size-5 text-emerald-500" />
        <h3 className="text-lg font-black text-[#1f2424]">
          Trạng thái theo dõi
        </h3>
      </div>
      <div className="mt-4 space-y-3">
        <StatusRow label="Giải đấu" value={getContestStatusLabel(effectiveStatus)} />
        <StatusRow
          label="Round hiện tại"
          value={
            runtimeSummary?.current_round_no
              ? `Vòng ${runtimeSummary.current_round_no}`
              : "Chưa có"
          }
        />
        <StatusRow
          label="Hành trình của bạn"
          value={
            existingRegistration?.customerJourneyStatus
              ? getJourneyStatusLabel(existingRegistration.customerJourneyStatus)
              : "Chưa đăng ký"
          }
        />
      </div>
    </Card>
  )
}
