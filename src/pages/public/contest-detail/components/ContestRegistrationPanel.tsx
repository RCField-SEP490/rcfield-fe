import { useMemo, useState } from "react"
import { useQuery } from "@tanstack/react-query"
import {
  ArrowLeft,
  ArrowRight,
  CalendarCheck,
  CalendarClock,
  Car,
  Check,
  CreditCard,
  Info as InfoIcon,
  KeyRound,
  ShieldCheck,
  Trophy,
} from "lucide-react"

import { contestApi } from "@/features/contests/api/contest.api"
import { JourneyStatusBadge } from "@/features/contests/components"
import { formatContestDateTime } from "@/features/contests/lib/contest-runtime"
import {
  getPaymentStatusLabel,
  getRegistrationStatusLabel,
  type ContestRegistrationAvailability,
} from "@/features/contests/lib/contest-status"
import type { ContestItem, ContestRegistration } from "@/features/contests/types"
import { cn } from "@/shared/lib/utils"
import { Button } from "@/shared/ui/button"
import { Card } from "@/shared/ui/card"
import { Input } from "@/shared/ui/input"
import { Label } from "@/shared/ui/label"

import { formatCurrency } from "../utils"
import { MiniInfo } from "./DetailPrimitives"
import { ContestRentalSlotPicker, type RentalSlotValue } from "./ContestRentalSlotPicker"
import { RegistrationStepper } from "./RegistrationStepper"

type VehicleSourceKey = "EXISTING_BOOKING" | "NEW_RENTAL" | "BYOC"
type StepId = "source" | "details" | "confirm"

export function ContestRegistrationPanel({
  contest,
  registrationAvailability,
  role,
  profileName,
  existingRegistration,
  entryFeePaymentPending,
  onContinuePayment,
  allowsByoc,
  registrationMode,
  setRegistrationMode,
  byocVehicleName,
  setByocVehicleName,
  byocVehicleBrand,
  setByocVehicleBrand,
  byocVehicleClass,
  setByocVehicleClass,
  byocVehicleNotes,
  setByocVehicleNotes,
  bookingOptions,
  bookingsLoading,
  selectedBookingId,
  setSelectedBookingId,
  selectedVehicleId,
  setSelectedVehicleId,
  selectedBooking,
  selectedVehicle,
  bookingHelperMessage,
  registrationClosed,
  registerPending,
  onRegister,
  rentalMode,
  setRentalMode,
  rentalSlotValue,
  rentalSlotEstimate,
  onRentalSlotChange,
}: {
  contest: ContestItem
  registrationAvailability: ContestRegistrationAvailability
  role: string | null
  profileName: string
  existingRegistration: ContestRegistration | null
  entryFeePaymentPending: boolean
  onContinuePayment: () => void
  allowsByoc: boolean
  registrationMode: "RENTAL" | "BYOC"
  setRegistrationMode: (mode: "RENTAL" | "BYOC") => void
  byocVehicleName: string
  setByocVehicleName: (value: string) => void
  byocVehicleBrand: string
  setByocVehicleBrand: (value: string) => void
  byocVehicleClass: string
  setByocVehicleClass: (value: string) => void
  byocVehicleNotes: string
  setByocVehicleNotes: (value: string) => void
  bookingOptions: Array<{
    id: string
    slotStart: string
  }>
  bookingsLoading: boolean
  selectedBookingId: string
  setSelectedBookingId: (value: string) => void
  selectedVehicleId: string
  setSelectedVehicleId: (value: string) => void
  selectedBooking: {
    slotStart: string
    cafe?: { name?: string | null } | null
    track_type_name?: string | null
    vehicles: Array<{
      vehicleId: string
      catalogName?: string | null
      identifier?: string | null
    }>
  } | undefined
  selectedVehicle:
    | {
        vehicleId: string
        catalogName?: string | null
        identifier?: string | null
      }
    | null
  bookingHelperMessage: string | null
  registrationClosed: boolean
  registerPending: boolean
  onRegister: () => void
  rentalMode: "EXISTING_BOOKING" | "NEW_RENTAL"
  setRentalMode: (mode: "EXISTING_BOOKING" | "NEW_RENTAL") => void
  rentalSlotValue: RentalSlotValue | null
  rentalSlotEstimate: number
  onRentalSlotChange: (value: RentalSlotValue, estimate: number) => void
}) {
  const registrationBlockedMessage = getRegistrationBlockedMessage(
    registrationAvailability,
    contest,
  )

  const byocOnly = contest.vehicle_rule?.vehicle_policy === "BYOC_ONLY"
  // Nguồn xe thuê (booking có sẵn hoặc thuê mới tại quầy) khả dụng cho mọi giải
  // trừ BYOC_ONLY. Trước đây RENTAL_ONLY bị ẩn bước chọn nguồn xe khiến ngưởi
  // chưa có booking không thể tới được "Thuê xe tại quầy".
  const rentalAllowed = !byocOnly
  const source: VehicleSourceKey =
    byocOnly || (registrationMode === "BYOC" && allowsByoc)
      ? "BYOC"
      : rentalMode
  const noConfirmedBookings = !bookingsLoading && bookingOptions.length === 0

  const steps = useMemo<Array<{ id: StepId; label: string }>>(() => {
    const list: Array<{ id: StepId; label: string }> = []
    if (rentalAllowed) list.push({ id: "source", label: "Nguồn xe" })
    list.push({
      id: "details",
      label: source === "BYOC" ? "Khai báo xe" : "Xe & khung giờ",
    })
    list.push({ id: "confirm", label: "Xác nhận" })
    return list
  }, [rentalAllowed, source])

  const [step, setStep] = useState<StepId>(rentalAllowed ? "source" : "details")

  const rentalOptionsQuery = useQuery({
    queryKey: ["contests", "rental-options", contest.id],
    queryFn: () => contestApi.getContestRentalOptions(contest.id),
    enabled: rentalAllowed,
    staleTime: 60_000,
  })
  const rentalOptions = rentalOptionsQuery.data ?? null
  const minHourlyRate = useMemo(() => {
    if (!rentalOptions || rentalOptions.vehicle_catalogs.length === 0) return null
    return Math.min(...rentalOptions.vehicle_catalogs.map((c) => c.hourly_rate))
  }, [rentalOptions])
  const selectedRentalCafe =
    rentalOptions?.cafes.find((cafe) => cafe.id === rentalSlotValue?.cafe_id) ?? null
  const selectedRentalCatalog =
    rentalOptions?.vehicle_catalogs.find(
      (catalog) => catalog.id === rentalSlotValue?.vehicle_catalog_id,
    ) ?? null

  const detailsValid =
    source === "BYOC"
      ? byocVehicleName.trim().length > 0
      : source === "EXISTING_BOOKING"
        ? Boolean(selectedBookingId && selectedVehicleId)
        : Boolean(
            rentalSlotValue?.cafe_id &&
              rentalSlotValue.slot_start &&
              rentalSlotValue.slot_end &&
              rentalSlotValue.vehicle_catalog_id,
          )

  const selectSource = (next: VehicleSourceKey) => {
    if (next === "BYOC") {
      setRegistrationMode("BYOC")
      return
    }
    setRegistrationMode("RENTAL")
    setRentalMode(next)
  }

  const goNext = () => {
    if (step === "source") setStep("details")
    else if (step === "details") setStep("confirm")
  }
  const goBack = () => {
    if (step === "confirm") setStep("details")
    else if (step === "details" && rentalAllowed) setStep("source")
  }

  const needsPayment =
    contest.entry_fee > 0 || (source === "NEW_RENTAL" && rentalSlotEstimate > 0)

  const renderStepContent = () => {
    if (step === "source") {
      return (
        <div className="space-y-3">
          <div className="flex flex-col gap-3 rounded-xl border border-orange-100 bg-orange-50/60 px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-start gap-3">
              <div className="flex size-9 shrink-0 items-center justify-center rounded-lg border border-orange-200 bg-white text-orange-600">
                <Trophy className="size-4" />
              </div>
              <div className="text-sm">
                <p className="font-semibold text-orange-900">
                  Cần thuê xe cho giải đấu?
                </p>
                <p className="text-orange-800/80">
                  Chọn "Thuê xe tại quầy" bên dưới để chọn chi nhánh, khung giờ
                  và dòng xe ngay trong luồng đăng ký.
                </p>
              </div>
            </div>
          </div>
          <div className="rounded-2xl border border-slate-200 bg-slate-50/70 p-4">
            <div className="flex items-start gap-3">
              <CalendarClock className="mt-0.5 size-4 shrink-0 text-orange-500" />
              <div className="space-y-1 text-sm">
                <p className="font-bold text-slate-900">Điều kiện đăng ký</p>
                <p className="text-slate-600">
                  Xe thi đấu phải gắn với booking tại chi nhánh tổ chức, đúng
                  loại track và khung giờ giao với contest.
                </p>
              </div>
            </div>
          </div>

          <VehicleSourceCard
            icon={CalendarCheck}
            title="Xe của tôi"
            description={
              noConfirmedBookings
                ? "Bạn chưa có booking thuê xe nào đã xác nhận (CONFIRMED) — hãy chọn “Thuê xe tại quầy” bên dưới, không cần chuẩn bị trước."
                : "Dùng booking thuê xe đã xác nhận (CONFIRMED) của bạn tại chi nhánh tổ chức — không phát sinh phí thuê mới."
            }
            priceHint={noConfirmedBookings ? null : "Không phát sinh phí thuê"}
            selected={source === "EXISTING_BOOKING"}
            disabled={registrationClosed || noConfirmedBookings}
            onClick={() => selectSource("EXISTING_BOOKING")}
          />
          <VehicleSourceCard
            icon={KeyRound}
            title="Thuê xe tại quầy"
            description="Chọn chi nhánh, khung giờ và dòng xe — hệ thống tạo booking thuê mới, bạn thanh toán ngay sau khi đăng ký."
            priceHint={
              minHourlyRate !== null
                ? `Từ ${formatCurrency(minHourlyRate)}/giờ`
                : null
            }
            selected={source === "NEW_RENTAL"}
            disabled={registrationClosed}
            onClick={() => selectSource("NEW_RENTAL")}
          />
          {allowsByoc ? (
            <VehicleSourceCard
              icon={Car}
              title="Xe cá nhân mang theo"
              description="Khai báo xe tự mang (BYOC), chờ provider/staff duyệt trước khi được xếp trận."
              priceHint={`Chỉ trả lệ phí giải ${formatCurrency(contest.entry_fee)}`}
              selected={source === "BYOC"}
              disabled={registrationClosed}
              onClick={() => selectSource("BYOC")}
            />
          ) : null}
        </div>
      )
    }

    if (step === "details") {
      if (source === "BYOC") {
        return (
          <div className="space-y-3">
            <div className="grid gap-3 sm:grid-cols-2">
              <div>
                <Label className="mb-2 block text-xs font-bold text-slate-700">
                  Tên xe cá nhân
                </Label>
                <Input
                  value={byocVehicleName}
                  onChange={(event) => setByocVehicleName(event.target.value)}
                  disabled={registrationClosed}
                  placeholder="Ví dụ: MST RMX 2.5"
                />
              </div>
              <div>
                <Label className="mb-2 block text-xs font-bold text-slate-700">
                  Hãng xe
                </Label>
                <Input
                  value={byocVehicleBrand}
                  onChange={(event) => setByocVehicleBrand(event.target.value)}
                  disabled={registrationClosed}
                  placeholder="Ví dụ: MST"
                />
              </div>
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              <div>
                <Label className="mb-2 block text-xs font-bold text-slate-700">
                  Class
                </Label>
                <Input
                  value={byocVehicleClass}
                  onChange={(event) => setByocVehicleClass(event.target.value)}
                  disabled={registrationClosed}
                  placeholder="Ví dụ: Drift / Touring"
                />
              </div>
              <div>
                <Label className="mb-2 block text-xs font-bold text-slate-700">
                  Người đăng ký
                </Label>
                <Input value={profileName} readOnly />
              </div>
            </div>
            <div>
              <Label className="mb-2 block text-xs font-bold text-slate-700">
                Ghi chú xe tự mang
              </Label>
              <Input
                value={byocVehicleNotes}
                onChange={(event) => setByocVehicleNotes(event.target.value)}
                disabled={registrationClosed}
                placeholder="Phụ kiện, setup, lưu ý kỹ thuật..."
              />
            </div>
            <div className="rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-xs text-amber-800">
              Xe cá nhân sẽ đi theo luồng khai báo thủ công và chờ
              provider/staff duyệt trước khi được xếp thi đấu.
            </div>
          </div>
        )
      }

      if (source === "EXISTING_BOOKING") {
        return (
          <div className="space-y-4">
            <div>
              <Label className="mb-2 block text-xs font-bold text-slate-700">
                Lịch đặt đã xác nhận
              </Label>
              <select
                className="h-10 w-full rounded-lg border border-slate-200 bg-card px-3 text-sm focus:border-orange-500 focus:outline-none focus:ring-1 focus:ring-orange-500"
                value={selectedBookingId}
                disabled={registrationClosed}
                onChange={(event) => {
                  setSelectedBookingId(event.target.value)
                  setSelectedVehicleId("")
                }}
              >
                <option value="">-- Chọn lịch đặt sân phù hợp --</option>
                {bookingOptions.map((booking) => (
                  <option key={booking.id} value={booking.id}>
                    {new Date(booking.slotStart).toLocaleString("vi-VN", {
                      dateStyle: "short",
                      timeStyle: "short",
                    })}{" "}
                    · Mã: {booking.id.slice(0, 8)}
                  </option>
                ))}
              </select>
              {bookingHelperMessage ? (
                <div className="mt-2 flex items-start gap-2 rounded-xl border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-800">
                  <InfoIcon className="mt-0.5 size-3.5 shrink-0" />
                  <span>{bookingHelperMessage}</span>
                </div>
              ) : null}
              {noConfirmedBookings ? (
                <Button
                  type="button"
                  variant="outline"
                  className="mt-2 w-full rounded-xl border-orange-300 text-xs font-bold text-orange-600 hover:bg-orange-50 hover:text-orange-700"
                  disabled={registrationClosed}
                  onClick={() => selectSource("NEW_RENTAL")}
                >
                  <KeyRound className="size-3.5" />
                  Thuê xe tại quầy ngay
                </Button>
              ) : null}
            </div>

            <div>
              <Label className="mb-2 block text-xs font-bold text-slate-700">
                Xe thuê từ lịch đặt
              </Label>
              <select
                className="h-10 w-full rounded-lg border border-slate-200 bg-card px-3 text-sm focus:border-orange-500 focus:outline-none focus:ring-1 focus:ring-orange-500 disabled:bg-slate-50 disabled:text-slate-400"
                value={selectedVehicleId}
                onChange={(event) => setSelectedVehicleId(event.target.value)}
                disabled={registrationClosed || !selectedBooking}
              >
                <option value="">-- Chọn xe thi đấu --</option>
                {selectedBooking?.vehicles.map((vehicle) => (
                  <option key={vehicle.vehicleId} value={vehicle.vehicleId}>
                    {vehicle.catalogName ??
                      vehicle.identifier ??
                      `Xe #${vehicle.vehicleId.slice(0, 8)}`}
                  </option>
                ))}
              </select>
            </div>

            {selectedBooking ? (
              <div className="grid gap-3 rounded-2xl border border-slate-200 bg-slate-50/60 p-4 text-sm sm:grid-cols-2">
                <MiniInfo
                  label="Booking đã chọn"
                  value={new Date(selectedBooking.slotStart).toLocaleString(
                    "vi-VN",
                    {
                      dateStyle: "short",
                      timeStyle: "short",
                    },
                  )}
                />
                <MiniInfo
                  label="Chi nhánh"
                  value={
                    selectedBooking.cafe?.name ??
                    contest.host_branch?.cafe?.name ??
                    "--"
                  }
                />
                <MiniInfo
                  label="Track"
                  value={
                    selectedBooking.track_type_name ??
                    contest.track_type?.name ??
                    "--"
                  }
                />
                <MiniInfo
                  label="Xe thi đấu"
                  value={
                    selectedVehicle?.catalogName ??
                    selectedVehicle?.identifier ??
                    (selectedVehicle
                      ? `Xe #${selectedVehicle.vehicleId.slice(0, 8)}`
                      : "--")
                  }
                />
              </div>
            ) : null}
          </div>
        )
      }

      return (
        <div className="space-y-4">
          <ContestRentalSlotPicker
            contestId={contest.id}
            value={rentalSlotValue}
            onChange={onRentalSlotChange}
            disabled={registrationClosed}
          />
          {rentalSlotEstimate > 0 ? (
            <div className="rounded-2xl border border-emerald-100 bg-emerald-50/50 p-4 text-sm">
              <div className="flex items-center justify-between">
                <span className="font-bold text-emerald-900">
                  Tiền thuê xe ước tính
                </span>
                <span className="font-black text-emerald-700">
                  {formatCurrency(rentalSlotEstimate)}
                </span>
              </div>
              <p className="mt-1 text-xs text-emerald-700">
                Giá tính theo đơn giá/giờ của dòng xe tại chi nhánh. Phí thuê
                chính thức sẽ hiển thị ở bước thanh toán booking.
              </p>
              <p className="mt-1 text-xs font-bold text-emerald-800">
                Tiền cọc xe: sẽ hiển thị ở bước thanh toán VNPay
              </p>
            </div>
          ) : null}
        </div>
      )
    }

    return (
      <div className="space-y-4">
        <div className="rounded-2xl border border-slate-200 bg-slate-50/60 p-4">
          <p className="text-xs font-bold uppercase tracking-wide text-slate-400">
            Tóm tắt đăng ký
          </p>
          <div className="mt-3 grid gap-3 text-sm sm:grid-cols-2">
            <MiniInfo
              label="Nguồn xe"
              value={
                source === "BYOC"
                  ? "Xe cá nhân mang theo"
                  : source === "EXISTING_BOOKING"
                    ? "Xe của tôi (booking đã có)"
                    : "Thuê xe tại quầy"
              }
            />
            <MiniInfo label="Người đăng ký" value={profileName} />
            {source === "EXISTING_BOOKING" && selectedBooking ? (
              <>
                <MiniInfo
                  label="Booking"
                  value={new Date(selectedBooking.slotStart).toLocaleString(
                    "vi-VN",
                    { dateStyle: "short", timeStyle: "short" },
                  )}
                />
                <MiniInfo
                  label="Xe thi đấu"
                  value={
                    selectedVehicle?.catalogName ??
                    selectedVehicle?.identifier ??
                    (selectedVehicle
                      ? `Xe #${selectedVehicle.vehicleId.slice(0, 8)}`
                      : "--")
                  }
                />
              </>
            ) : null}
            {source === "NEW_RENTAL" && rentalSlotValue ? (
              <>
                <MiniInfo
                  label="Chi nhánh thuê"
                  value={selectedRentalCafe?.name ?? "--"}
                />
                <MiniInfo
                  label="Khung giờ thuê"
                  value={`${formatContestDateTime(rentalSlotValue.slot_start)} → ${formatContestDateTime(rentalSlotValue.slot_end)}`}
                />
                <MiniInfo
                  label="Dòng xe"
                  value={
                    selectedRentalCatalog
                      ? `${selectedRentalCatalog.name} · ${selectedRentalCatalog.tier}`
                      : "--"
                  }
                />
                <MiniInfo
                  label="Đơn giá"
                  value={
                    selectedRentalCatalog
                      ? `${formatCurrency(selectedRentalCatalog.hourly_rate)}/giờ`
                      : "--"
                  }
                />
              </>
            ) : null}
            {source === "BYOC" ? (
              <>
                <MiniInfo label="Tên xe" value={byocVehicleName || "--"} />
                <MiniInfo
                  label="Hãng / Class"
                  value={
                    [byocVehicleBrand, byocVehicleClass]
                      .filter(Boolean)
                      .join(" · ") || "--"
                  }
                />
              </>
            ) : null}
          </div>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-slate-50/70 p-4">
          <div className="flex items-center justify-between text-sm">
            <span className="font-bold text-slate-700">Lệ phí giải đấu</span>
            <span className="font-black text-slate-900">
              {formatCurrency(contest.entry_fee)}
            </span>
          </div>
          {source === "NEW_RENTAL" && rentalSlotEstimate > 0 ? (
            <>
              <div className="my-2 border-t border-slate-200" />
              <div className="flex items-center justify-between text-sm">
                <span className="font-bold text-slate-700">
                  Tiền thuê xe (ước tính)
                </span>
                <span className="font-black text-slate-900">
                  {formatCurrency(rentalSlotEstimate)}
                </span>
              </div>
              <div className="my-2 border-t border-slate-200" />
              <div className="flex items-center justify-between text-sm">
                <span className="font-black text-slate-900">Tổng ước tính</span>
                <span className="font-black text-orange-600">
                  {formatCurrency(contest.entry_fee + rentalSlotEstimate)}
                </span>
              </div>
            </>
          ) : null}
        </div>

        <div className="flex items-start gap-2 rounded-2xl border border-slate-200 bg-white px-4 py-3 text-xs text-slate-600">
          <CreditCard className="mt-0.5 size-4 shrink-0 text-orange-500" />
          <span>
            {source === "NEW_RENTAL"
              ? "Sau khi xác nhận, hệ thống tạo booking thuê xe và chuyển bạn sang cổng thanh toán VNPay để thanh toán booking (gồm phí thuê và cọc nếu có). Lệ phí giải (nếu có) thanh toán sau tại mục Đăng ký của tôi."
              : source === "EXISTING_BOOKING"
                ? "Booking của bạn đã được xác nhận và thanh toán. Sau khi gửi đăng ký, bạn sẽ thanh toán lệ phí giải (nếu có) qua VNPay."
                : "Xe cá nhân sẽ chờ provider/staff duyệt. Lệ phí giải (nếu có) thanh toán qua VNPay sau khi gửi đăng ký."}
          </span>
        </div>
      </div>
    )
  }

  return (
    <Card className="rounded-2xl border border-[#e5e2e1] bg-white p-6 shadow-sm">
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-2">
          <ShieldCheck className="size-5 text-orange-500" />
          <h3 className="text-lg font-black text-[#1f2424]">
            Đăng ký tham gia
          </h3>
        </div>
        <span className={`shrink-0 rounded-full border px-3 py-1 text-[11px] font-black ${registrationClosed ? "border-amber-200 bg-amber-50 text-amber-800" : "border-emerald-200 bg-emerald-50 text-emerald-700"}`}>
          {registrationClosed ? getClosedButtonLabel(registrationAvailability) : "Đang mở"}
        </span>
      </div>

      <div className="mt-5">
        {role !== "customer" ? (
          <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50/50 p-6 text-center">
            <p className="text-sm font-semibold text-slate-600">
              Vui lòng đăng nhập với tài khoản Khách hàng để đăng ký tham gia
              giải đấu này.
            </p>
          </div>
        ) : existingRegistration ? (
          <div className="space-y-4 rounded-2xl border border-orange-100 bg-orange-50/30 p-5">
            <div className="flex items-center gap-2 text-emerald-600">
              <ShieldCheck className="size-5 shrink-0" />
              <span className="text-sm font-bold">
                Bạn đã đăng ký giải đấu này
              </span>
            </div>
            {existingRegistration.paymentStatus === "PENDING_PAYMENT" ? (
              <div className="rounded-xl border border-orange-200 bg-white p-3">
                <p className="text-xs font-semibold text-orange-800">
                  Đăng ký của bạn đang chờ thanh toán lệ phí để hoàn tất.
                </p>
                <Button
                  type="button"
                  className="mt-2 w-full rounded-xl bg-orange-600 py-5 text-sm font-bold text-white hover:bg-orange-700"
                  disabled={entryFeePaymentPending}
                  onClick={onContinuePayment}
                >
                  {entryFeePaymentPending
                    ? "Đang chuyển sang thanh toán..."
                    : "Thanh toán lệ phí qua VNPay"}
                </Button>
              </div>
            ) : null}
            <JourneyStatusBadge
              status={existingRegistration.customerJourneyStatus}
              className="h-auto px-3 py-1 font-bold"
            />
            <div className="grid grid-cols-2 gap-3 border-t border-orange-100 pt-2 text-xs">
              <div>
                <p className="font-bold text-slate-400">Trạng thái đăng ký</p>
                <p className="mt-1 text-sm font-extrabold text-slate-900">
                  {getRegistrationStatusLabel(existingRegistration.status)}
                </p>
              </div>
              <div>
                <p className="font-bold text-slate-400">Lệ phí thi đấu</p>
                <p className="mt-1 text-sm font-extrabold text-slate-900">
                  {getPaymentStatusLabel(existingRegistration.paymentStatus)}
                </p>
              </div>
            </div>
            {existingRegistration.checkInCode ? (
              <div className="rounded-xl border border-orange-100/50 bg-white p-3 text-center">
                <p className="text-2xs font-bold uppercase tracking-wider text-slate-400">
                  Mã điểm danh (Check-in)
                </p>
                <p className="mt-1 text-lg font-black tracking-widest text-slate-900">
                  {existingRegistration.checkInCode}
                </p>
              </div>
            ) : null}
          </div>
        ) : (
          <div className="space-y-4">
            <RegistrationStepper
              steps={steps}
              currentStep={step}
              onStepClick={(stepId) => setStep(stepId as StepId)}
            />

            {registrationBlockedMessage ? (
              <div className="rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm font-semibold text-amber-900">
                {registrationBlockedMessage}
              </div>
            ) : null}

            {renderStepContent()}

            <div className="flex items-center gap-2">
              {step !== steps[0]?.id ? (
                <Button
                  type="button"
                  variant="outline"
                  className="rounded-xl"
                  disabled={registerPending}
                  onClick={goBack}
                >
                  <ArrowLeft className="size-4" />
                  Quay lại
                </Button>
              ) : null}
              {step !== "confirm" ? (
                <Button
                  type="button"
                  className="flex-1 rounded-xl bg-orange-600 py-5 text-sm font-bold text-white shadow-md shadow-orange-600/10 transition hover:bg-orange-700"
                  disabled={
                    registrationClosed || (step === "details" && !detailsValid)
                  }
                  onClick={goNext}
                >
                  Tiếp tục
                  <ArrowRight className="size-4" />
                </Button>
              ) : (
                <Button
                  type="button"
                  className="flex-1 rounded-xl bg-orange-600 py-6 text-sm font-bold text-white shadow-md shadow-orange-600/10 transition hover:bg-orange-700"
                  disabled={
                    registrationClosed || registerPending || !detailsValid
                  }
                  onClick={onRegister}
                >
                  {registerPending
                    ? "Đang xử lý..."
                    : registrationClosed
                      ? getClosedButtonLabel(registrationAvailability)
                      : needsPayment
                        ? "Xác nhận & thanh toán"
                        : "Xác nhận đăng ký"}
                </Button>
              )}
            </div>
          </div>
        )}
      </div>
    </Card>
  )
}

function VehicleSourceCard({
  icon: Icon,
  title,
  description,
  priceHint,
  selected,
  disabled,
  onClick,
}: {
  icon: typeof Car
  title: string
  description: string
  priceHint: string | null
  selected: boolean
  disabled?: boolean
  onClick: () => void
}) {
  return (
    <button
      type="button"
      disabled={disabled}
      onClick={onClick}
      className={cn(
        "w-full rounded-2xl border p-4 text-left transition",
        selected
          ? "border-orange-500 bg-orange-50/60 shadow-sm"
          : "border-slate-200 bg-white hover:border-orange-200 hover:bg-orange-50/30",
        disabled && "cursor-not-allowed opacity-60",
      )}
    >
      <div className="flex items-start gap-3">
        <div
          className={cn(
            "flex size-10 shrink-0 items-center justify-center rounded-xl",
            selected
              ? "bg-orange-500 text-white"
              : "bg-slate-100 text-slate-500",
          )}
        >
          <Icon className="size-5" />
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex items-center justify-between gap-2">
            <p className="text-sm font-extrabold text-slate-900">{title}</p>
            {selected ? (
              <Check className="size-4 shrink-0 text-orange-500" />
            ) : null}
          </div>
          <p className="mt-1 text-xs leading-relaxed text-slate-500">
            {description}
          </p>
          {priceHint ? (
            <p className="mt-2 text-xs font-bold text-orange-600">{priceHint}</p>
          ) : null}
        </div>
      </div>
    </button>
  )
}

function getRegistrationBlockedMessage(
  status: ContestRegistrationAvailability,
  contest: ContestItem,
) {
  switch (status) {
    case "NOT_OPEN_YET":
      return `Giải sẽ mở đăng ký từ ${formatContestDateTime(contest.registration_opens_at)}. Bạn có thể xem trước thể thức, chi nhánh và chuẩn bị booking phù hợp.`
    case "CLOSED":
      return `Giải đã đóng đăng ký từ ${formatContestDateTime(contest.registration_closes_at)}. Bạn vẫn có thể vào tab Trận đấu để theo dõi bracket và các vòng đã vào trong.`
    case "RUNNING":
      return "Giải đang diễn ra nên hệ thống không nhận thêm đăng ký mới. Bạn vẫn có thể theo dõi trận live, bracket và kết quả từng vòng."
    case "COMPLETED":
      return "Giải đã kết thúc. Bạn vẫn có thể xem bracket lịch sử và bảng xếp hạng đã công bố."
    case "CANCELLED":
      return "Giải đấu này đã bị hủy và hiện không nhận đăng ký."
    default:
      return null
  }
}

function getClosedButtonLabel(status: ContestRegistrationAvailability) {
  switch (status) {
    case "CLOSED":
      return "Đã đóng đăng ký"
    case "RUNNING":
      return "Giải đang diễn ra"
    case "COMPLETED":
      return "Giải đã kết thúc"
    case "CANCELLED":
      return "Giải đã hủy"
    default:
      return "Chưa mở đăng ký"
  }
}
