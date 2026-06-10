import { ChevronLeft } from "lucide-react"
import { useMemo, useState } from "react"
import { Link, useSearchParams } from "react-router"
import type { BookingMode } from "@/features/booking/data/booking-options"
import { bookingCatalog } from "@/features/booking/data/booking-options"
import type { CheckoutStep, CustomerPaymentMethod, CustomerPlayMode, PaymentComponentLine } from "@/features/customer-booking/data/customer-booking-demo"
import { menuApi, menuQueryKeys } from "@/features/menu/api/menu.api"
import { mockCafes } from "@/shared/data/explore-data"
import { Button } from "@/shared/ui/button"
import { useQuery } from "@tanstack/react-query"
import { cafeApi, cafeQueryKeys } from "@/features/cafes/api/cafe.api"
import { vehicleApi } from "@/features/vehicles/api/vehicle.api"
import { mapCafeToExploreCafe, mapCatalogToExploreVehicle } from "@/features/cafes/lib/cafe.mappers"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/shared/ui/alert-dialog"
import { CheckoutStepper } from "./components/checkout/CheckoutStepper"
import { CheckoutSummaryCard } from "./components/checkout/CheckoutSummaryCard"
import { FnbStep } from "./components/checkout/FnbStep"
import { ParticipantsStep, type Companion } from "./components/checkout/ParticipantsStep"
import { PaymentStep } from "./components/checkout/PaymentStep"
import { TrackSelectionStep } from "./components/checkout/TrackSelectionStep"
import type { TrackConfig } from "@/features/cafes/types"
import { useAvailability, useCreateBooking, useCreateCheckout } from "@/features/booking/hooks/use-booking"
import { toast } from "sonner"

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

// "track" step now includes date + slot selection — no separate "schedule" step
const ALL_STEPS: CheckoutStep[] = ["track", "participants", "fnb", "payment"]
const STEPS_WITHOUT_SCHEDULE: CheckoutStep[] = ALL_STEPS

export function CreateBookingPage() {
  const [searchParams] = useSearchParams()
  const cafeId = searchParams.get("cafeId") ?? mockCafes[0].id
  const vehicleId = searchParams.get("vehicleId") ?? undefined
  const modeParam = searchParams.get("mode") as BookingMode | null

  const isMockId = cafeId.startsWith("cafe-")

  // Fetch real cafe data if not a mock ID
  const { data: realCafe } = useQuery({
    queryKey: cafeQueryKeys.detail(isMockId ? undefined : cafeId),
    queryFn: () => cafeApi.getCafe(cafeId),
    enabled: !isMockId && !!cafeId,
  })

  // Fetch cafe images if real cafe is loaded
  const { data: cafeImages = [] } = useQuery({
    queryKey: cafeQueryKeys.images(isMockId ? undefined : cafeId),
    queryFn: () => cafeApi.listCafeImages(cafeId),
    enabled: !isMockId && !!cafeId,
  })

  // Fetch real catalogs data
  const { data: catalogs = [] } = useQuery({
    queryKey: ["cafe-catalogs", isMockId ? undefined : cafeId],
    queryFn: () => vehicleApi.listCatalogs(cafeId),
    enabled: !isMockId && !!cafeId,
  })

  // Fetch real menu items
  const { data: menuData, isLoading: menuLoading } = useQuery({
    queryKey: menuQueryKeys.list(isMockId ? undefined : cafeId, { available: true }),
    queryFn: () => menuApi.listMenuItems(cafeId, { available: true, limit: 50 }),
    enabled: !isMockId && !!cafeId,
  })
  const menuItems = menuData?.data ?? []

  const cafe = useMemo(() => {
    if (!isMockId && realCafe) {
      const mapped = mapCafeToExploreCafe(realCafe, cafeImages)
      if (catalogs && catalogs.length > 0) {
        mapped.availableVehicles = catalogs.map(mapCatalogToExploreVehicle)
      }
      return mapped
    }
    return mockCafes.find((item) => item.id === cafeId) ?? mockCafes[0]
  }, [cafeId, isMockId, realCafe, cafeImages, catalogs])

  // Parse F&B quantities from URL e.g. "fnb-1:2,fnb-2:1"
  const parseFnbParam = (param: string | null): Record<string, number> => {
    if (!param) return {}
    const res: Record<string, number> = {}
    param.split(",").forEach((pair) => {
      const [id, qtyStr] = pair.split(":")
      if (id && qtyStr) {
        const qty = parseInt(qtyStr, 10)
        if (!isNaN(qty) && qty > 0) {
          res[id] = qty
        }
      }
    })
    return res
  }

  // Khi có date + slot từ cafe detail → bỏ schedule step
  const hasPreselectedSlot = !!(searchParams.get("date") && searchParams.get("slot"))
  const orderedSteps = hasPreselectedSlot ? STEPS_WITHOUT_SCHEDULE : ALL_STEPS

  const stepParam = searchParams.get("step") as CheckoutStep | null
  const [currentStep, setCurrentStep] = useState<CheckoutStep>(
    orderedSteps.includes(stepParam!) ? stepParam! : orderedSteps[0]
  )
  const [mode, setMode] = useState<BookingMode>(modeParam ?? "hourly")
  const [planId, setPlanId] = useState(getDefaultPlanId(modeParam ?? "hourly"))
  const [date, setDate] = useState(searchParams.get("date") ?? new Date().toISOString().slice(0, 10))
  const [time, setTime] = useState(searchParams.get("slot") ?? bookingCatalog.timeOptions[0])
  const [preselectedSlotEnd, setPreselectedSlotEnd] = useState(searchParams.get("slotEnd") ?? null)
  const [playMode, setPlayMode] = useState<CustomerPlayMode>("RENTAL")
  const [participants, setParticipants] = useState(1)
  const [companions, setCompanions] = useState<Companion[]>([])
  const [selectedVehicleIds, setSelectedVehicleIds] = useState<string[]>(vehicleId ? [vehicleId] : [])
  const [fnbQuantities, setFnbQuantities] = useState<Record<string, number>>(() => parseFnbParam(searchParams.get("fnb")))
  const [paymentMethod, setPaymentMethod] = useState<CustomerPaymentMethod>("vnpay")
  const [selectedTrackConfig, setSelectedTrackConfig] = useState<TrackConfig | null>(null)

  const [pendingPlayMode, setPendingPlayMode] = useState<CustomerPlayMode | null>(null)

  const handlePlayModeChange = (mode: CustomerPlayMode) => {
    if (mode === "BYOC" && selectedVehicleIds.length > 0) {
      setPendingPlayMode("BYOC")
      return
    }
    setPlayMode(mode)
    if (mode === "BYOC") setSelectedVehicleIds([])
  }

  const confirmSwitchToBYOC = () => {
    setPlayMode("BYOC")
    setSelectedVehicleIds([])
    setPendingPlayMode(null)
  }

  const createBookingMutation = useCreateBooking()
  const createCheckoutMutation = useCreateCheckout()
  const isSubmitting = createBookingMutation.isPending || createCheckoutMutation.isPending

  // BYOC capacity check — only for real cafes when a time slot is selected
  const slotStartForCheck = `${date}T${time}:00+07:00`
  const slotEndForCheck = preselectedSlotEnd
    ? `${date}T${preselectedSlotEnd}:00+07:00`
    : buildSlotEnd(date, time, mode, planId)
  const { data: availabilityData } = useAvailability(
    cafeId,
    {
      slot_start: slotStartForCheck,
      slot_end: slotEndForCheck,
      play_mode: 'BYOC',
      ...(selectedTrackConfig ? { track_config_id: selectedTrackConfig.id } : {}),
    },
    !isMockId && !!date && !!time,
  )
  const byocRemaining = availabilityData?.byoc_remaining
  const isByocFull = playMode === "BYOC" && byocRemaining !== undefined && byocRemaining === 0

  const selectedVehicles = cafe.availableVehicles.filter((v) => selectedVehicleIds.includes(v.id))
  const fnbTotal = useMemo(
    () =>
      menuItems.reduce((sum, item) => {
        const price = typeof item.price === "string" ? parseFloat(item.price) : item.price
        return sum + price * (fnbQuantities[item.id] ?? 0)
      }, 0),
    [fnbQuantities, menuItems],
  )

  const numSlots = useMemo(() => {
    if (!time || !preselectedSlotEnd) return 1
    const [sh, sm] = time.split(":").map(Number)
    const [eh, em] = preselectedSlotEnd.split(":").map(Number)
    const diffMinutes = (eh * 60 + em) - (sh * 60 + sm)
    const slotDuration = cafe.slotDurationMinutes ?? 60
    return Math.max(1, Math.round(diffMinutes / slotDuration))
  }, [time, preselectedSlotEnd, cafe.slotDurationMinutes])

  const paymentComponents = useMemo(
    () => buildPaymentComponents({
      mode,
      planId,
      slotFeeRate: cafe.slotFeeRate ?? 0,
      selectedVehicles,
      fnbTotal,
      numSlots,
    }),
    [fnbTotal, mode, planId, selectedVehicles, cafe.slotFeeRate, numSlots],
  )

  const handleNext = () => {
    const index = orderedSteps.indexOf(currentStep)
    setCurrentStep(orderedSteps[Math.min(index + 1, orderedSteps.length - 1)])
  }

  const handleBack = () => {
    const index = orderedSteps.indexOf(currentStep)
    setCurrentStep(orderedSteps[Math.max(index - 1, 0)])
  }

  const handleConfirmPayment = async () => {
    if (isMockId) {
      toast.error("Không thể đặt lịch với dữ liệu demo. Vui lòng chọn một cơ sở thực tế.")
      return
    }
    if (playMode === "BYOC" && byocRemaining !== undefined && byocRemaining === 0) {
      toast.error("Slot này đã hết chỗ BYOC. Vui lòng chọn khung giờ khác.")
      return
    }
    try {
      const slotStart = `${date}T${time}:00+07:00`
      const slotEnd = preselectedSlotEnd
        ? `${date}T${preselectedSlotEnd}:00+07:00`
        : buildSlotEnd(date, time, mode, planId)
      const vehicleIds = selectedVehicleIds.filter((id) => UUID_REGEX.test(id))

      // Build companion participants — booker is auto-inserted by backend as BOOKER type
      const participantList = companions.map((c) => ({
        participant_type: "WALK_IN_GUEST" as const,
        ...(c.name ? { guest_name: c.name } : {}),
        ...(c.phone ? { guest_phone: c.phone } : {}),
      }))

      const booking = await createBookingMutation.mutateAsync({
        cafe_id: cafeId,
        play_mode: playMode === "RENTAL" ? "RENTAL" : "BYOC",
        slot_start: slotStart,
        slot_end: slotEnd,
        vehicle_ids: vehicleIds,
        participants: participantList,
        fnb_items: Object.entries(fnbQuantities)
          .filter(([, qty]) => qty > 0)
          .map(([menu_item_id, quantity]) => ({ menu_item_id, quantity })),
        ...(selectedTrackConfig ? { track_config_id: selectedTrackConfig.id } : {}),
      })

      const checkout = await createCheckoutMutation.mutateAsync(booking.booking_id)
      window.location.href = checkout.payment_url
    } catch (err) {
      let message = "Vui lòng thử lại."
      if (err instanceof Error) {
        message = err.message
      }
      // Check backend error codes for specific user-facing messages
      const axiosErr = err as { response?: { data?: { code?: string } } }
      const code = axiosErr?.response?.data?.code
      if (code === "VEHICLE_TRACK_INCOMPATIBLE") {
        toast.error("Xe bạn chọn không tương thích với loại sân này. Vui lòng chọn xe khác.")
        return
      }
      if (code === "TRACK_CONFIG_NOT_FOUND") {
        toast.error("Loại sân không còn hoạt động. Vui lòng quay lại và chọn loại sân khác.")
        return
      }
      if (code === "BYOC_CAPACITY_FULL") {
        toast.error("Slot BYOC đã hết chỗ cho khung giờ này. Vui lòng chọn giờ khác.")
        return
      }
      toast.error(`Không thể tạo đơn đặt lịch. ${message}`)
      console.error("[CreateBooking]", err)
    }
  }

  return (
    <div className="min-h-screen bg-muted/30">
      <section className="border-b bg-background">
        <div className="mx-auto w-full max-w-7xl px-4 py-5 md:px-6">
          <Button asChild variant="ghost" className="-ml-3 mb-3 gap-2">
            <Link to={`/cafes/${cafe.slug}`}>
              <ChevronLeft className="h-4 w-4" /> Quay lại cơ sở
            </Link>
          </Button>
          <div className="mb-4">
            <p className="text-sm font-medium text-muted-foreground">RCField Checkout</p>
            <h1 className="text-3xl font-semibold tracking-tight md:text-4xl">Hoàn tất đặt lịch chạy RC</h1>
          </div>
          <CheckoutStepper currentStep={currentStep} visibleSteps={orderedSteps} />
        </div>
      </section>

      <div className="mx-auto grid w-full max-w-7xl gap-5 px-4 py-5 md:px-6 lg:grid-cols-[minmax(0,1fr)_360px]">
        <main className="min-w-0">
          {currentStep === "track" && (selectedVehicleIds.length > 0 || Object.values(fnbQuantities).some((q) => q > 0)) && (
            <PreSelectionBanner
              vehicleName={selectedVehicles[0]?.name}
              vehicleCount={selectedVehicleIds.length}
              fnbCount={Object.values(fnbQuantities).reduce((s, q) => s + q, 0)}
            />
          )}
          {currentStep === "track" && (
            <TrackSelectionStep
              cafeId={isMockId ? "" : cafeId}
              date={date}
              setDate={setDate}
              selectedSlot={time}
              setSelectedSlot={setTime}
              selectedSlotEnd={preselectedSlotEnd}
              setSelectedSlotEnd={setPreselectedSlotEnd}
              selectedTrackConfig={selectedTrackConfig}
              onSelectTrack={setSelectedTrackConfig}
              slotDurationMinutes={cafe.slotDurationMinutes ?? 60}
              playMode={playMode === "RENTAL" ? "RENTAL" : "BYOC"}
              onPlayModeChange={handlePlayModeChange}
            />
          )}
          {currentStep === "participants" && (
            <ParticipantsStep
              cafe={cafe}
              playMode={playMode}
              onPlayModeChange={handlePlayModeChange}
              participants={participants}
              onParticipantsChange={setParticipants}
              companions={companions}
              onCompanionsChange={setCompanions}
              selectedVehicleIds={selectedVehicleIds}
              onVehicleSelect={setSelectedVehicleIds}
              byocRemaining={byocRemaining}
            />
          )}
          {currentStep === "fnb" && (
            <FnbStep
              menuItems={menuItems}
              isLoading={menuLoading}
              quantities={fnbQuantities}
              onQuantityChange={(itemId, quantity) => setFnbQuantities((current) => ({ ...current, [itemId]: quantity }))}
            />
          )}
          {currentStep === "payment" && (
            <PaymentStep paymentMethod={paymentMethod} onPaymentMethodChange={setPaymentMethod} />
          )}
        </main>

        <CheckoutSummaryCard
          cafe={cafe}
          mode={mode}
          playMode={playMode}
          date={date}
          time={preselectedSlotEnd ? `${time} – ${preselectedSlotEnd}` : time}
          selectedVehicles={selectedVehicles}
          fnbTotal={fnbTotal}
          components={paymentComponents}
          currentStep={currentStep}
          onNext={handleNext}
          onBack={handleBack}
          onConfirmPayment={() => void handleConfirmPayment()}
          isSubmitting={isSubmitting}
          isNextDisabled={
            (currentStep === "track" && (!selectedTrackConfig || !time)) ||
            (currentStep === "participants" && isByocFull)
          }
          selectedTrackConfig={selectedTrackConfig}
        />
      </div>

      <AlertDialog open={!!pendingPlayMode} onOpenChange={(open) => !open && setPendingPlayMode(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Chuyển sang mang xe riêng?</AlertDialogTitle>
            <AlertDialogDescription>
              Bạn đang có{" "}
              <strong>{selectedVehicles.length > 0 ? selectedVehicles.map((v) => v.name).join(", ") : `${selectedVehicleIds.length} xe`}</strong>{" "}
              đã chọn để thuê. Chuyển sang chế độ mang xe riêng sẽ xóa toàn bộ lựa chọn xe thuê này.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setPendingPlayMode(null)}>Giữ lại xe thuê</AlertDialogCancel>
            <AlertDialogAction onClick={confirmSwitchToBYOC} className="bg-orange-500 hover:bg-orange-600">
              Chuyển sang mang xe riêng
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}

function PreSelectionBanner({
  vehicleName,
  vehicleCount,
  fnbCount,
}: {
  vehicleName?: string
  vehicleCount: number
  fnbCount: number
}) {
  const parts: string[] = []
  if (vehicleCount > 0) parts.push(vehicleName ?? `${vehicleCount} xe`)
  if (fnbCount > 0) parts.push(`${fnbCount} món F&B`)
  return (
    <div className="mb-4 flex items-center gap-2 rounded-xl border border-orange-100 bg-orange-50/60 px-4 py-2.5 text-sm text-orange-800">
      <span>🛒 Giỏ của bạn có sẵn <strong>{parts.join(" và ")}</strong> — chọn sân & giờ là đặt được ngay!</span>
    </div>
  )
}

function buildSlotEnd(date: string, time: string, mode: BookingMode, planId: string): string {
  let hours = 1
  if (mode === "hourly") {
    hours = bookingCatalog.hourlyPlans.find((p) => p.id === planId)?.durationHours ?? 1
  } else if (mode === "slotPackage") {
    const pkg = bookingCatalog.slotPackages.find((p) => p.id === planId)
    hours = pkg ? pkg.minutesPerSlot / 60 : 1
  }
  const [hh, mm] = time.split(":").map(Number)
  const totalMinutes = hh * 60 + mm + Math.round(hours * 60)
  const endHH = String(Math.floor(totalMinutes / 60)).padStart(2, "0")
  const endMM = String(totalMinutes % 60).padStart(2, "0")
  return `${date}T${endHH}:${endMM}:00+07:00`
}

function getDefaultPlanId(mode: BookingMode) {
  if (mode === "slotPackage") return bookingCatalog.slotPackages[0].id
  if (mode === "recurring") return bookingCatalog.recurringPlans[0].id
  return bookingCatalog.hourlyPlans[0].id
}

function buildPaymentComponents({
  mode,
  planId,
  slotFeeRate,
  selectedVehicles,
  fnbTotal,
  numSlots = 1,
}: {
  mode: BookingMode
  planId: string
  slotFeeRate: number
  selectedVehicles: import("@/shared/data/explore-data").Vehicle[]
  fnbTotal: number
  numSlots?: number
}): PaymentComponentLine[] {
  const slotFee = mode === "hourly"
    ? slotFeeRate * numSlots
    : getPlanPrice(mode, planId, slotFeeRate)
  const slotLabel = numSlots > 1 ? `Phí lịch chơi (${numSlots} slot)` : "Phí lịch chơi"
  const lines: PaymentComponentLine[] = [
    { id: "slot", type: "SLOT_FEE", label: slotLabel, amount: slotFee, status: "PENDING" },
  ]

  if (selectedVehicles.length > 0) {
    const rentalPerHour = selectedVehicles.reduce((sum, v) => sum + v.pricePerHour, 0)
    const rentalTotal = rentalPerHour * numSlots
    const depositTotal = selectedVehicles.reduce((sum, v) => sum + v.securityDeposit, 0)
    const vehicleLabel = selectedVehicles.length === 1 ? selectedVehicles[0].name : `${selectedVehicles.length} xe`
    lines.push({ id: "rental", type: "RENTAL_FEE", label: `Phí thuê ${vehicleLabel}`, amount: rentalTotal, status: "PENDING" })
    lines.push({ id: "deposit", type: "SECURITY_DEPOSIT", label: `Cọc xe (×${selectedVehicles.length})`, amount: depositTotal, status: "HELD" })
  }

  if (fnbTotal > 0) {
    lines.push({ id: "fnb", type: "FNB_PREORDER", label: "F&B preorder", amount: fnbTotal, status: "PENDING" })
  }

  return lines
}

function getPlanPrice(mode: BookingMode, planId: string, slotFeeRate: number) {
  if (mode === "slotPackage") {
    const pkg = bookingCatalog.slotPackages.find((p) => p.id === planId)
    return pkg ? slotFeeRate * (pkg.slots * pkg.minutesPerSlot / 60) : 0
  }
  if (mode === "recurring") {
    return bookingCatalog.recurringPlans.find((p) => p.id === planId)?.sessionsPerMonth
      ? slotFeeRate * (bookingCatalog.recurringPlans.find((p) => p.id === planId)!.sessionsPerMonth)
      : 0
  }
  const plan = bookingCatalog.hourlyPlans.find((p) => p.id === planId)
  return plan ? slotFeeRate * plan.durationHours : slotFeeRate
}
