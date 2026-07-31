import { useState } from "react"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { Car, CreditCard, KeyRound, ShieldCheck } from "lucide-react"
import { toast } from "sonner"

import { bookingApi } from "@/features/booking/api/booking.api"
import {
  contestApi,
  contestQueryKeys,
} from "@/features/contests/api/contest.api"
import { JourneyStatusBadge } from "@/features/contests/components"
import { formatContestDateTime } from "@/features/contests/lib/contest-runtime"
import {
  getPaymentStatusLabel,
  getRegistrationStatusLabel,
  type ContestRegistrationAvailability,
} from "@/features/contests/lib/contest-status"
import {
  contestByocDeclarationSchema,
  contestRentalSlotSchema,
} from "@/features/contests/schemas/contest.schema"
import type { ContestItem, ContestRegistration } from "@/features/contests/types"
import { cn } from "@/shared/lib/utils"
import { Button } from "@/shared/ui/button"
import { Card } from "@/shared/ui/card"
import { Input } from "@/shared/ui/input"
import { Label } from "@/shared/ui/label"

import { formatCurrency, getErrorMessage } from "../utils"
import { MiniInfo } from "./DetailPrimitives"
import {
  ContestRentalSlotPicker,
  type RentalSlotValue,
} from "./ContestRentalSlotPicker"

export function ContestRegistrationPanel({
  contest,
  registrationAvailability,
  role,
  profileName,
  existingRegistration,
  onRegistered,
}: {
  contest: ContestItem
  registrationAvailability: ContestRegistrationAvailability
  role: string | null
  profileName: string
  existingRegistration: ContestRegistration | null
  onRegistered?: () => void
}) {
  const queryClient = useQueryClient()
  const registrationClosed = registrationAvailability !== "AVAILABLE"
  const registrationBlockedMessage = getRegistrationBlockedMessage(
    registrationAvailability,
    contest,
  )

  const vehiclePolicy = contest.vehicle_rule?.vehicle_policy
  const byocOnly = vehiclePolicy === "BYOC_ONLY"
  const rentalOnly = vehiclePolicy === "RENTAL_ONLY"
  const allowsByoc = !rentalOnly

  const [registrationMode, setRegistrationMode] = useState<"RENTAL" | "BYOC">(
    byocOnly ? "BYOC" : "RENTAL",
  )
  const source: "RENTAL" | "BYOC" = byocOnly ? "BYOC" : registrationMode

  const [byocVehicleName, setByocVehicleName] = useState("")
  const [byocVehicleBrand, setByocVehicleBrand] = useState("")
  const [byocVehicleClass, setByocVehicleClass] = useState("")
  const [byocVehicleNotes, setByocVehicleNotes] = useState("")
  const [rentalSlotValue, setRentalSlotValue] = useState<RentalSlotValue | null>(
    null,
  )
  const [rentalSlotEstimate, setRentalSlotEstimate] = useState(0)

  const rentalOptionsQuery = useQuery({
    queryKey: ["contests", "rental-options", contest.id],
    queryFn: () => contestApi.getContestRentalOptions(contest.id),
    enabled: !byocOnly,
    staleTime: 60_000,
  })
  const rentalOptions = rentalOptionsQuery.data ?? null
  const selectedRentalCafe =
    rentalOptions?.cafes.find((cafe) => cafe.id === rentalSlotValue?.cafe_id) ??
    null
  const selectedRentalCatalog =
    rentalOptions?.vehicle_catalogs.find(
      (catalog) => catalog.id === rentalSlotValue?.vehicle_catalog_id,
    ) ?? null

  const detailsValid =
    source === "BYOC"
      ? byocVehicleName.trim().length >= 2
      : Boolean(
          rentalSlotValue?.cafe_id &&
            rentalSlotValue.slot_start &&
            rentalSlotValue.slot_end &&
            rentalSlotValue.vehicle_catalog_id,
        )

  const needsPayment =
    contest.entry_fee > 0 || (source === "RENTAL" && rentalSlotEstimate > 0)

  const registerMutation = useMutation({
    mutationFn: async () => {
      if (source === "BYOC") {
        return contestApi.registerContest(contest.id, {
          vehicle_source: "BYOC",
          byoc_vehicle_name: byocVehicleName,
          byoc_vehicle_brand: byocVehicleBrand || undefined,
          byoc_vehicle_class: byocVehicleClass || undefined,
          byoc_vehicle_notes: byocVehicleNotes || undefined,
        })
      }
      if (!rentalSlotValue) throw new Error("Thiếu thông tin thuê xe")
      return contestApi.registerContest(contest.id, {
        vehicle_source: "RENTAL",
        rental_slot: rentalSlotValue,
      })
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({
        queryKey: contestQueryKeys.myRegistrations(),
      })
      void queryClient.invalidateQueries({
        queryKey: contestQueryKeys.detail(contest.id),
      })
      void queryClient.invalidateQueries({
        queryKey: contestQueryKeys.matches(contest.id),
      })
      onRegistered?.()
    },
  })
  const entryFeePaymentMutation = useMutation({
    mutationFn: async (registrationId: string) =>
      contestApi.createEntryFeePayment(registrationId),
  })
  const bookingCheckoutMutation = useMutation({
    mutationFn: async (bookingId: string) =>
      bookingApi.createCheckout(bookingId),
  })

  const registerPending =
    registerMutation.isPending ||
    entryFeePaymentMutation.isPending ||
    bookingCheckoutMutation.isPending

  const handleRegister = async () => {
    try {
      // Client-side validation before hitting the API.
      if (source === "BYOC") {
        const parsed = contestByocDeclarationSchema.safeParse({
          byoc_vehicle_name: byocVehicleName,
          byoc_vehicle_brand: byocVehicleBrand,
          byoc_vehicle_class: byocVehicleClass,
          byoc_vehicle_notes: byocVehicleNotes || undefined,
        })
        if (!parsed.success) {
          toast.error("Thông tin xe cá nhân chưa hợp lệ", {
            description: parsed.error.issues[0]?.message,
          })
          return
        }
      } else {
        const parsed = contestRentalSlotSchema.safeParse(rentalSlotValue)
        if (!parsed.success) {
          toast.error("Thông tin thuê xe chưa hợp lệ", {
            description: parsed.error.issues[0]?.message,
          })
          return
        }
      }

      const registration = await registerMutation.mutateAsync()
      // WF-B: registration có thể kèm booking thuê xe inline cần thanh toán —
      // checkout booking giờ đã bao gồm cả lệ phí giải nên chỉ cần 1 redirect.
      const linkedBooking = registration.booking
      if (linkedBooking && linkedBooking.status === "PENDING") {
        const checkout = await bookingCheckoutMutation.mutateAsync(
          linkedBooking.id,
        )
        if (checkout.payment_url) {
          window.location.assign(checkout.payment_url)
          return
        }
      }
      if (registration.paymentStatus === "PENDING_PAYMENT") {
        const payment = await entryFeePaymentMutation.mutateAsync(
          registration.id,
        )
        window.location.assign(payment.payment_url)
        return
      }
      toast.success("Đăng ký tham gia giải đấu thành công!")
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
                  disabled={entryFeePaymentMutation.isPending}
                  onClick={() => void handleContinuePayment()}
                >
                  {entryFeePaymentMutation.isPending
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
            {registrationBlockedMessage ? (
              <div className="rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm font-semibold text-amber-900">
                {registrationBlockedMessage}
              </div>
            ) : null}

            {allowsByoc && !byocOnly ? (
              <div className="grid grid-cols-2 gap-2 rounded-2xl border border-slate-200 bg-slate-50/70 p-2">
                <VehicleModeToggle
                  icon={KeyRound}
                  label="Thuê xe tại quầy"
                  selected={source === "RENTAL"}
                  disabled={registrationClosed}
                  onClick={() => setRegistrationMode("RENTAL")}
                />
                <VehicleModeToggle
                  icon={Car}
                  label="Xe cá nhân (BYOC)"
                  selected={source === "BYOC"}
                  disabled={registrationClosed}
                  onClick={() => setRegistrationMode("BYOC")}
                />
              </div>
            ) : (
              <p className="rounded-xl border border-slate-200 bg-slate-50/70 px-3 py-2 text-xs font-semibold text-slate-600">
                {byocOnly
                  ? "Giải này chỉ nhận xe cá nhân (BYOC) — khai báo xe của bạn bên dưới."
                  : "Giải này yêu cầu thuê xe tại quầy — chọn chi nhánh, khung giờ và dòng xe bên dưới."}
              </p>
            )}

            {source === "RENTAL" ? (
              <div className="space-y-4">
                <ContestRentalSlotPicker
                  contestId={contest.id}
                  value={rentalSlotValue}
                  onChange={(value, estimate) => {
                    setRentalSlotValue(value)
                    setRentalSlotEstimate(estimate)
                  }}
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
                      Giá tính theo đơn giá/giờ của dòng xe tại chi nhánh. Phí
                      thuê chính thức sẽ hiển thị ở bước thanh toán.
                    </p>
                    <p className="mt-1 text-xs font-bold text-emerald-800">
                      Miễn đặt cọc xe
                    </p>
                  </div>
                ) : null}
              </div>
            ) : (
              <div className="space-y-3">
                <div className="grid gap-3 sm:grid-cols-2">
                  <div>
                    <Label className="mb-2 block text-xs font-bold text-slate-700">
                      Tên xe cá nhân
                    </Label>
                    <Input
                      value={byocVehicleName}
                      onChange={(event) =>
                        setByocVehicleName(event.target.value)
                      }
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
                      onChange={(event) =>
                        setByocVehicleBrand(event.target.value)
                      }
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
                      onChange={(event) =>
                        setByocVehicleClass(event.target.value)
                      }
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
                    onChange={(event) =>
                      setByocVehicleNotes(event.target.value)
                    }
                    disabled={registrationClosed}
                    placeholder="Phụ kiện, setup, lưu ý kỹ thuật..."
                  />
                </div>
                <div className="rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-xs text-amber-800">
                  Xe cá nhân sẽ đi theo luồng khai báo thủ công và chờ
                  provider/staff duyệt trước khi được xếp thi đấu.
                </div>
              </div>
            )}

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
                      : "Thuê xe tại quầy"
                  }
                />
                <MiniInfo label="Người đăng ký" value={profileName} />
                {source === "RENTAL" && rentalSlotValue ? (
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
              {source === "RENTAL" && rentalSlotEstimate > 0 ? (
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
                    <span className="font-black text-slate-900">
                      Tổng ước tính
                    </span>
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
                {source === "RENTAL"
                  ? "Sau khi xác nhận, hệ thống tạo booking thuê xe và chuyển bạn sang cổng thanh toán VNPay — một lần thanh toán duy nhất đã bao gồm phí thuê xe và lệ phí giải (miễn đặt cọc xe)."
                  : "Xe cá nhân sẽ chờ provider/staff duyệt. Lệ phí giải (nếu có) thanh toán qua VNPay ngay sau khi gửi đăng ký."}
              </span>
            </div>

            <Button
              type="button"
              className="w-full rounded-xl bg-orange-600 py-6 text-sm font-bold text-white shadow-md shadow-orange-600/10 transition hover:bg-orange-700"
              disabled={registrationClosed || registerPending || !detailsValid}
              onClick={() => void handleRegister()}
            >
              {registerPending
                ? "Đang xử lý..."
                : registrationClosed
                  ? getClosedButtonLabel(registrationAvailability)
                  : needsPayment
                    ? "Đăng ký & thanh toán"
                    : "Đăng ký"}
            </Button>
          </div>
        )}
      </div>
    </Card>
  )
}

function VehicleModeToggle({
  icon: Icon,
  label,
  selected,
  disabled,
  onClick,
}: {
  icon: typeof Car
  label: string
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
        "flex items-center justify-center gap-2 rounded-xl border px-3 py-2.5 text-sm font-extrabold transition",
        selected
          ? "border-orange-500 bg-orange-50/80 text-orange-700 shadow-sm"
          : "border-slate-200 bg-white text-slate-500 hover:border-orange-200 hover:bg-orange-50/30",
        disabled && "cursor-not-allowed opacity-60",
      )}
    >
      <Icon className="size-4" />
      {label}
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
