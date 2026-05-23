import { ChevronLeft } from "lucide-react"
import { useMemo, useState } from "react"
import { Link, useSearchParams } from "react-router"
import type { BookingMode } from "@/features/booking/data/booking-options"
import { bookingCatalog } from "@/features/booking/data/booking-options"
import type { CheckoutStep, CustomerPaymentMethod, CustomerPlayMode, PaymentComponentLine } from "@/features/customer-booking/data/customer-booking-demo"
import { fnbMenuItems } from "@/features/customer-booking/data/customer-booking-demo"
import { mockCafes } from "@/shared/data/explore-data"
import { Button } from "@/shared/ui/button"
import { CheckoutStepper } from "./components/checkout/CheckoutStepper"
import { CheckoutSummaryCard } from "./components/checkout/CheckoutSummaryCard"
import { FnbStep } from "./components/checkout/FnbStep"
import { ParticipantsStep } from "./components/checkout/ParticipantsStep"
import { PaymentStep } from "./components/checkout/PaymentStep"
import { ScheduleStep } from "./components/checkout/ScheduleStep"

const orderedSteps: CheckoutStep[] = ["schedule", "participants", "fnb", "payment"]

export function CreateBookingPage() {
  const [searchParams] = useSearchParams()
  const cafeId = searchParams.get("cafeId") ?? mockCafes[0].id
  const vehicleId = searchParams.get("vehicleId") ?? undefined
  const modeParam = searchParams.get("mode") as BookingMode | null
  const cafe = mockCafes.find((item) => item.id === cafeId) ?? mockCafes[0]

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

  const stepParam = searchParams.get("step")
  const [currentStep, setCurrentStep] = useState<CheckoutStep>(
    stepParam === "payment" ? "payment" : "schedule"
  )
  const [mode, setMode] = useState<BookingMode>(modeParam ?? "hourly")
  const [planId, setPlanId] = useState(getDefaultPlanId(modeParam ?? "hourly"))
  const [date, setDate] = useState(searchParams.get("date") ?? new Date().toISOString().slice(0, 10))
  const [time, setTime] = useState(searchParams.get("slot") ?? bookingCatalog.timeOptions[0])
  const [playMode, setPlayMode] = useState<CustomerPlayMode>(vehicleId ? "RENTAL" : "BYOC")
  const [participants, setParticipants] = useState(2)
  const [selectedVehicleId, setSelectedVehicleId] = useState<string | undefined>(vehicleId)
  const [fnbQuantities, setFnbQuantities] = useState<Record<string, number>>(() => parseFnbParam(searchParams.get("fnb")))
  const [paymentMethod, setPaymentMethod] = useState<CustomerPaymentMethod>("vnpay")

  const selectedVehicle = cafe.availableVehicles.find((vehicle) => vehicle.id === selectedVehicleId)
  const fnbTotal = useMemo(
    () =>
      fnbMenuItems.reduce((sum, item) => {
        return sum + item.price * (fnbQuantities[item.id] ?? 0)
      }, 0),
    [fnbQuantities],
  )
  const paymentComponents = useMemo(
    () => buildPaymentComponents({ mode, planId, selectedVehiclePrice: selectedVehicle?.pricePerHour ?? 0, fnbTotal }),
    [fnbTotal, mode, planId, selectedVehicle],
  )

  const handleNext = () => {
    const index = orderedSteps.indexOf(currentStep)
    setCurrentStep(orderedSteps[Math.min(index + 1, orderedSteps.length - 1)])
  }

  const handleBack = () => {
    const index = orderedSteps.indexOf(currentStep)
    setCurrentStep(orderedSteps[Math.max(index - 1, 0)])
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
          <div className="grid gap-4 lg:grid-cols-[1fr_360px] lg:items-end">
            <div>
              <p className="text-sm font-medium text-muted-foreground">RCField Checkout</p>
              <h1 className="text-3xl font-semibold tracking-tight md:text-4xl">Hoàn tất đặt lịch chạy RC</h1>
              <p className="mt-2 max-w-2xl text-sm leading-6 text-muted-foreground">
                Demo full luồng Customer: booking planned data, xe rental/BYOC, F&B preorder, payment ledger và gateway transaction.
              </p>
            </div>
            <CheckoutStepper currentStep={currentStep} />
          </div>
        </div>
      </section>

      <div className="mx-auto grid w-full max-w-7xl gap-5 px-4 py-5 md:px-6 lg:grid-cols-[minmax(0,1fr)_360px]">
        <main className="min-w-0">
          {currentStep === "schedule" && (
            <ScheduleStep
              mode={mode}
              onModeChange={(value) => {
                setMode(value)
                setPlanId(getDefaultPlanId(value))
              }}
              planId={planId}
              onPlanChange={setPlanId}
              date={date}
              onDateChange={setDate}
              time={time}
              onTimeChange={setTime}
            />
          )}
          {currentStep === "participants" && (
            <ParticipantsStep
              cafe={cafe}
              playMode={playMode}
              onPlayModeChange={setPlayMode}
              participants={participants}
              onParticipantsChange={setParticipants}
              selectedVehicleId={selectedVehicleId}
              onVehicleSelect={setSelectedVehicleId}
            />
          )}
          {currentStep === "fnb" && (
            <FnbStep
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
          time={time}
          selectedVehicle={selectedVehicle}
          fnbTotal={fnbTotal}
          components={paymentComponents}
          currentStep={currentStep}
          onNext={handleNext}
          onBack={handleBack}
        />
      </div>
    </div>
  )
}

function getDefaultPlanId(mode: BookingMode) {
  if (mode === "slotPackage") return bookingCatalog.slotPackages[0].id
  if (mode === "recurring") return bookingCatalog.recurringPlans[0].id
  return bookingCatalog.hourlyPlans[0].id
}

function buildPaymentComponents({
  mode,
  planId,
  selectedVehiclePrice,
  fnbTotal,
}: {
  mode: BookingMode
  planId: string
  selectedVehiclePrice: number
  fnbTotal: number
}): PaymentComponentLine[] {
  const slotFee = getPlanPrice(mode, planId)
  const lines: PaymentComponentLine[] = [
    { id: "slot", type: mode === "slotPackage" ? "PACKAGE_PURCHASE" : "SLOT_FEE", label: mode === "slotPackage" ? "Mua gói slot" : "Phí lịch chơi", amount: slotFee, status: "PENDING" },
  ]

  if (selectedVehiclePrice > 0) {
    lines.push({ id: "rental", type: "RENTAL_FEE", label: "Phí thuê xe", amount: selectedVehiclePrice, status: "PENDING" })
    lines.push({ id: "deposit", type: "SECURITY_DEPOSIT", label: "Cọc xe dự phòng", amount: 100000, status: "HELD" })
  }

  if (fnbTotal > 0) {
    lines.push({ id: "fnb", type: "FNB_PREORDER", label: "F&B preorder", amount: fnbTotal, status: "PENDING" })
  }

  const taxable = lines.reduce((sum, item) => sum + item.amount, 0)
  lines.push({ id: "vat", type: "VAT", label: "Thuế VAT 10%", amount: Math.round(taxable * 0.1), status: "PENDING" })
  return lines
}

function getPlanPrice(mode: BookingMode, planId: string) {
  if (mode === "slotPackage") return bookingCatalog.slotPackages.find((plan) => plan.id === planId)?.price ?? 0
  if (mode === "recurring") return bookingCatalog.recurringPlans.find((plan) => plan.id === planId)?.pricePerMonth ?? 0
  const plan = bookingCatalog.hourlyPlans.find((item) => item.id === planId)
  return plan ? plan.pricePerHour * plan.durationHours : 0
}
