import { MapPin, Clock, Star, Info } from "lucide-react"
import { useMemo, useState } from "react"
import { Link, useSearchParams } from "react-router"
import { bookingCatalog } from "@/features/booking/data/booking-options"
import { mockCafeDetail } from "@/features/booking/data/mock-cafe-detail"
import { routePaths } from "@/app/router/route-paths"
import { Button } from "@/shared/ui/button"
import { Badge } from "@/shared/ui/badge"
import { formatCurrency } from "@/shared/lib/format"
import { CafeGallery } from "./components/CafeGallery"
import { SlotTimeGrid } from "./components/SlotTimeGrid"
import { BookingVehiclePicker } from "./components/BookingVehiclePicker"

type BookingTab = "hourly" | "slotPackage" | "recurring"

const tabs: { key: BookingTab; label: string; desc: string }[] = [
  { key: "hourly", label: "Theo giờ", desc: "Chọn giờ chơi linh hoạt" },
  { key: "slotPackage", label: "Gói slot", desc: "Mua gói dùng dần" },
  { key: "recurring", label: "Lịch cố định", desc: "Tập luyện định kỳ" },
]

export function CreateBookingPage() {
  const [searchParams] = useSearchParams()
  const vehicleParam = searchParams.get("vehicleId")
  const cafe = mockCafeDetail
  const [tab, setTab] = useState<BookingTab>("hourly")
  const [selectedPlanId, setSelectedPlanId] = useState(bookingCatalog.hourlyPlans[0].id)
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().slice(0, 10))
  const [selectedTimes, setSelectedTimes] = useState<string[]>([bookingCatalog.timeOptions[0]])
  const [selectedVehicleId, setSelectedVehicleId] = useState<string | undefined>(vehicleParam ?? undefined)

  const plans = useMemo(() => {
    if (tab === "hourly") return bookingCatalog.hourlyPlans
    if (tab === "slotPackage") return bookingCatalog.slotPackages
    return bookingCatalog.recurringPlans
  }, [tab])

  const currentPlan = useMemo(
    () => plans.find((p) => p.id === selectedPlanId) ?? plans[0],
    [plans, selectedPlanId],
  )

  const cafeVehicles = cafe.availableVehicles
  const selectedVehicle = cafeVehicles.find((v) => v.id === selectedVehicleId)

  const isSlotMode = tab === "slotPackage"
  const isMultiSlot = isSlotMode

  // Tính tiền
  const planPrice = useMemo(() => {
    if (!currentPlan) return 0
    if ("price" in currentPlan) return currentPlan.price
    if ("pricePerMonth" in currentPlan) return currentPlan.pricePerMonth
    return currentPlan.pricePerHour * currentPlan.durationHours
  }, [currentPlan])

  const slotCount = isSlotMode ? selectedTimes.length : 0
  const slotPrice = slotCount > 0 && "minutesPerSlot" in (currentPlan ?? {})
    ? (currentPlan as { price: number; slots: number }).price / (currentPlan as { slots: number }).slots * slotCount
    : 0

  const subtotal = isSlotMode && slotCount > 0 ? slotPrice : planPrice
  const serviceFee = tab === "recurring" ? 0 : 15000
  const total = subtotal + serviceFee

  const handleTabChange = (newTab: BookingTab) => {
    setTab(newTab)
    const id =
      newTab === "hourly"
        ? bookingCatalog.hourlyPlans[0].id
        : newTab === "slotPackage"
          ? bookingCatalog.slotPackages[0].id
          : bookingCatalog.recurringPlans[0].id
    setSelectedPlanId(id)
    if (newTab !== "slotPackage") {
      setSelectedTimes([bookingCatalog.timeOptions[0]])
    }
  }

  const handleTimeToggle = (time: string) => {
    if (isMultiSlot) {
      setSelectedTimes((prev) =>
        prev.includes(time) ? prev.filter((t) => t !== time) : [...prev, time],
      )
    } else {
      setSelectedTimes([time])
    }
  }

  return (
    <div className="min-h-screen bg-white">
      {/* Header breadcrumb */}
      <div className="border-b border-slate-200">
        <div className="mx-auto flex max-w-7xl items-center gap-2 px-4 py-3 text-xs font-medium text-slate-400 md:px-6">
          <Link to={routePaths.cafes} className="hover:text-slate-600">Khám phá</Link>
          <span>/</span>
          <span className="text-slate-600">{cafe.name}</span>
          <span>/</span>
          <span className="text-slate-800">Đặt lịch</span>
        </div>
      </div>

      <div className="mx-auto max-w-7xl px-4 py-6 md:px-6">
        {/* Cafe header */}
        <div className="mb-6">
          <div className="flex items-start justify-between gap-4">
            <div>
              <div className="flex items-center gap-2 text-sm text-slate-500">
                <MapPin className="h-3.5 w-3.5" />
                <span>{cafe.address}</span>
                <span className="text-slate-300">|</span>
                <Clock className="h-3.5 w-3.5" />
                <span>{cafe.operatingHours}</span>
              </div>
              <h1 className="mt-1 text-2xl font-bold tracking-tight text-slate-900">{cafe.name}</h1>
              <div className="mt-1 flex items-center gap-3">
                <div className="flex items-center gap-1 text-sm font-semibold text-slate-700">
                  <Star className="h-4 w-4 fill-amber-400 text-amber-400" />
                  {cafe.rating} ({cafe.reviewsCount} đánh giá)
                </div>
                <div className="flex gap-1.5">
                  {cafe.trackTypes.map((t) => (
                    <Badge key={t} variant="outline" className="border-slate-200 text-[11px] font-medium text-slate-600">
                      {t}
                    </Badge>
                  ))}
                </div>
              </div>
            </div>
            <Button variant="outline" size="sm" asChild className="shrink-0 border-slate-200 text-xs">
              <Link to={`${routePaths.cafes}/${cafe.slug}`}>
                <Info className="h-3.5 w-3.5" />
                Chi tiết
              </Link>
            </Button>
          </div>
        </div>

        {/* Main grid: Gallery + Booking form */}
        <div className="grid gap-6 lg:grid-cols-[1fr_380px]">
          {/* LEFT: Gallery + Plan selection */}
          <div className="space-y-6">
            {/* Gallery - like hotel booking, compact with thumbnail strip */}
            <CafeGallery images={cafe.gallery} name={cafe.name} />

            {/* Tab selector - slim tabs */}
            <div className="border-b border-slate-200">
              <div className="flex gap-0">
                {tabs.map((t) => (
                  <button
                    key={t.key}
                    type="button"
                    onClick={() => handleTabChange(t.key)}
                    className={`relative px-5 py-3 text-sm font-semibold transition ${
                      tab === t.key
                        ? "text-black after:absolute after:bottom-0 after:left-0 after:h-0.5 after:w-full after:bg-black"
                        : "text-slate-400 hover:text-slate-600"
                    }`}
                  >
                    {t.label}
                    <span className="ml-1.5 text-[11px] font-normal text-slate-400">{t.desc}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Plans - dạng row gọn */}
            <div className="grid grid-cols-3 gap-2">
              {plans.map((plan) => {
                const isSelected = plan.id === selectedPlanId
                const price =
                  "price" in plan
                    ? plan.price
                    : "pricePerMonth" in plan
                      ? plan.pricePerMonth
                      : plan.pricePerHour * plan.durationHours
                const meta =
                  "slots" in plan
                    ? `${plan.slots} slot · ${plan.minutesPerSlot}ph/slot`
                    : "sessionsPerMonth" in plan
                      ? `${plan.sessionsPerMonth} buổi/tháng`
                      : `${plan.durationHours}h · ${formatCurrency(plan.pricePerHour)}/h`

                return (
                  <button
                    key={plan.id}
                    type="button"
                    onClick={() => setSelectedPlanId(plan.id)}
                    className={`rounded-xl border p-3 text-left transition-all duration-200 ${
                      isSelected ? "border-slate-900 bg-slate-900 text-white shadow-lg shadow-slate-900/20" : "border-slate-200 bg-white text-slate-700 hover:border-slate-300 hover:shadow-sm"
                    }`}
                  >
                    <p className={`text-sm font-semibold ${isSelected ? "text-white" : "text-slate-900"}`}>{plan.label}</p>
                    <p className={`mt-0.5 text-[11px] font-medium ${isSelected ? "text-white/60" : "text-slate-400"}`}>{plan.note}</p>
                    <p className={`mt-2 text-lg font-bold ${isSelected ? "text-white" : "text-slate-900"}`}>{formatCurrency(price)}</p>
                    <p className={`text-[10px] font-medium ${isSelected ? "text-white/50" : "text-slate-400"}`}>{meta}</p>
                  </button>
                )
              })}
            </div>

            {/* Date picker */}
            <div className="space-y-2">
              <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                {tab === "recurring" ? "Ngày bắt đầu" : "Chọn ngày"}
              </p>
              <input
                type="date"
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                className="h-10 w-full rounded-xl border border-slate-200 px-3 text-sm font-medium text-slate-800 transition-all focus:border-slate-400 focus:outline-none focus:shadow-sm"
              />
            </div>

            {/* Time slots grid */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                  {isMultiSlot ? "Chọn một hoặc nhiều khung giờ" : "Chọn khung giờ"}
                </p>
                {isMultiSlot && selectedTimes.length > 0 && (
                  <span className="text-xs font-semibold text-black">
                    Đã chọn {selectedTimes.length} slot
                  </span>
                )}
              </div>
              <SlotTimeGrid
                timeOptions={bookingCatalog.timeOptions}
                selectedTimes={selectedTimes}
                onToggle={handleTimeToggle}
                mode={isMultiSlot ? "multiple" : "single"}
              />
              {isSlotMode && selectedTimes.length > 1 && (
                <p className="flex items-center gap-1 text-[11px] font-medium text-emerald-600">
                  <Info className="h-3 w-3" />
                  Bạn có thể chọn nhiều slot để đặt trong cùng một ngày
                </p>
              )}
            </div>

            {/* Weekday (for recurring) */}
            {tab === "recurring" && (
              <div className="space-y-2">
                <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">Ngày lặp trong tuần</p>
                <div className="flex flex-wrap gap-1.5">
                  {bookingCatalog.weekdayOptions.map((wd) => (
                    <button
                      key={wd}
                      type="button"
                      className="rounded-xl border border-slate-200 px-3 py-1.5 text-xs font-medium text-slate-600 transition-all duration-200 hover:border-slate-300 hover:shadow-sm"
                    >
                      {wd}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Vehicle picker - gọn nhẹ */}
            <BookingVehiclePicker
              vehicles={cafeVehicles}
              selectedId={selectedVehicleId}
              onSelect={(id) =>
                setSelectedVehicleId((prev) => (prev === id ? undefined : id))
              }
            />
          </div>

          {/* RIGHT: Summary panel - sticky */}
          <aside className="lg:sticky lg:top-6 lg:self-start">
            <div className="rounded-2xl border border-slate-200 bg-white shadow-sm">
              {/* Cafe mini info */}
              <div className="border-b border-slate-200 p-4">
                <div className="flex items-center gap-3">
                  <div className="h-12 w-12 shrink-0 overflow-hidden rounded-xl bg-slate-100">
                    <img src={cafe.image} alt={cafe.name} className="h-full w-full object-cover" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-slate-900">{cafe.name}</p>
                    <p className="truncate text-xs text-slate-500">{cafe.address}</p>
                  </div>
                </div>
              </div>

              {/* Booking summary */}
              <div className="space-y-3 p-4 text-sm">
                <div className="flex justify-between">
                  <span className="text-slate-500">Loại đặt</span>
                  <span className="font-semibold text-slate-900">{tabs.find((t) => t.key === tab)?.label}</span>
                </div>
                {currentPlan && (
                  <div className="flex justify-between">
                    <span className="text-slate-500">Gói</span>
                    <span className="font-semibold text-slate-900">{currentPlan.label}</span>
                  </div>
                )}
                <div className="flex justify-between">
                  <span className="text-slate-500">Ngày</span>
                  <span className="font-semibold text-slate-900">
                    {new Date(selectedDate).toLocaleDateString("vi-VN")}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Giờ</span>
                  <span className="font-semibold text-slate-900">
                    {isSlotMode && selectedTimes.length > 1
                      ? `${selectedTimes[0]} … +${selectedTimes.length - 1} slot`
                      : selectedTimes[0]}
                  </span>
                </div>
                {selectedVehicle && (
                  <div className="flex justify-between">
                    <span className="text-slate-500">Xe thuê</span>
                    <span className="font-semibold text-slate-900">{selectedVehicle.name}</span>
                  </div>
                )}
              </div>

              {/* Price breakdown */}
              <div className="border-t border-slate-200 p-4">
                <div className="space-y-2 text-sm">
                  {isSlotMode && slotCount > 0 ? (
                    <div className="flex justify-between text-slate-600">
                      <span>Đơn giá slot</span>
                      <span>
                        {formatCurrency((currentPlan as { price: number; slots: number }).price / (currentPlan as { slots: number }).slots)} × {slotCount}
                      </span>
                    </div>
                  ) : null}
                  <div className="flex justify-between text-slate-600">
                    <span>{isSlotMode ? "Tạm tính slot" : "Phí lịch chơi"}</span>
                    <span>{formatCurrency(subtotal)}</span>
                  </div>
                  <div className="flex justify-between text-slate-600">
                    <span>Phí dịch vụ</span>
                    <span>{formatCurrency(serviceFee)}</span>
                  </div>
                </div>
                <div className="mt-3 flex items-center justify-between border-t border-slate-200 pt-3">
                  <span className="text-sm font-bold text-slate-900">Tổng cộng</span>
                  <span className="text-xl font-bold text-slate-900">{formatCurrency(total)}</span>
                </div>
              </div>

              {/* CTA */}
              <div className="border-t border-slate-200 p-4">
                <Button className="h-11 w-full bg-black text-sm font-semibold text-white hover:bg-slate-800">
                  Đặt lịch ngay
                </Button>
                <p className="mt-2 text-center text-[10px] text-slate-400">
                  {isSlotMode
                    ? "Bạn có thể thanh toán sau khi đặt"
                    : "Đặt trước, thanh toán tại quán"}
                </p>
              </div>
            </div>
          </aside>
        </div>
      </div>
    </div>
  )
}
