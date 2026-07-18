import { CalendarClock, Info as InfoIcon, ShieldCheck } from "lucide-react"

import { JourneyStatusBadge } from "@/features/contests/components"
import { formatContestDateTime } from "@/features/contests/lib/contest-runtime"
import {
  getPaymentStatusLabel,
  getRegistrationStatusLabel,
  type ContestRegistrationAvailability,
} from "@/features/contests/lib/contest-status"
import type { ContestItem, ContestRegistration } from "@/features/contests/types"
import { Button } from "@/shared/ui/button"
import { Card } from "@/shared/ui/card"
import { Input } from "@/shared/ui/input"
import { Label } from "@/shared/ui/label"

import { formatCurrency } from "../utils"
import { MiniInfo } from "./DetailPrimitives"
import { ContestRentalSlotPicker, type RentalSlotValue } from "./ContestRentalSlotPicker"

export function ContestRegistrationPanel({
  contest,
  registrationAvailability,
  role,
  profileName,
  existingRegistration,
  entryFeePaymentPending,
  onContinuePayment,
  allowsByoc,
  rentalOnly,
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
  rentalOnly: boolean
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
            {existingRegistration.paymentStatus === "PENDING_PAYMENT" ? (
              <Button
                type="button"
                className="w-full rounded-xl bg-orange-600 py-5 text-sm font-bold text-white hover:bg-orange-700"
                disabled={entryFeePaymentPending}
                onClick={onContinuePayment}
              >
                {entryFeePaymentPending
                  ? "Đang chuyển sang thanh toán..."
                  : "Thanh toán lệ phí qua VNPay"}
              </Button>
            ) : null}
          </div>
        ) : (
          <div className="space-y-4">
            <div className="rounded-2xl border border-slate-200 bg-slate-50/70 p-4">
              <div className="flex items-start gap-3">
                <CalendarClock className="mt-0.5 size-4 shrink-0 text-orange-500" />
                <div className="space-y-1 text-sm">
                  <p className="font-bold text-slate-900">Điều kiện đăng ký</p>
                  <p className="text-slate-600">
                    Cần có booking <span className="font-semibold">CONFIRMED</span>{" "}
                    đúng chi nhánh, đúng loại track và khung giờ giao với
                    contest.
                  </p>
                  <p className="text-slate-600">
                    Sau khi gửi đăng ký, hệ thống sẽ gửi email xác nhận, tạo
                    thông báo trong app và nhắc lịch gần giờ thi đấu.
                  </p>
                </div>
              </div>
            </div>

            {registrationBlockedMessage ? (
              <div className="rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm font-semibold text-amber-900">
                {registrationBlockedMessage}
              </div>
            ) : null}

            {allowsByoc ? (
              <div className="grid grid-cols-2 gap-2 rounded-2xl border border-slate-200 bg-slate-50/70 p-2">
                <button
                  type="button"
                  className={`rounded-xl px-4 py-3 text-sm font-bold transition ${registrationMode === "RENTAL" ? "bg-slate-900 text-white" : "bg-white text-slate-600"}`}
                  disabled={
                    contest.vehicle_rule?.vehicle_policy === "BYOC_ONLY" ||
                    registrationClosed
                  }
                  onClick={() => setRegistrationMode("RENTAL")}
                >
                  Đi bằng xe thuê
                </button>
                <button
                  type="button"
                  className={`rounded-xl px-4 py-3 text-sm font-bold transition ${registrationMode === "BYOC" ? "bg-orange-600 text-white" : "bg-white text-slate-600"}`}
                  disabled={rentalOnly || registrationClosed}
                  onClick={() => setRegistrationMode("BYOC")}
                >
                  Đi bằng xe cá nhân
                </button>
              </div>
            ) : null}

            {registrationMode === "BYOC" ? (
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
            ) : (
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-2 rounded-2xl border border-slate-200 bg-slate-50/70 p-2">
                  <button
                    type="button"
                    className={`rounded-xl px-3 py-2.5 text-xs font-bold transition ${rentalMode === "EXISTING_BOOKING" ? "bg-slate-900 text-white" : "bg-white text-slate-600"}`}
                    disabled={registrationClosed}
                    onClick={() => setRentalMode("EXISTING_BOOKING")}
                  >
                    Dùng booking đã có
                  </button>
                  <button
                    type="button"
                    className={`rounded-xl px-3 py-2.5 text-xs font-bold transition ${rentalMode === "NEW_RENTAL" ? "bg-orange-600 text-white" : "bg-white text-slate-600"}`}
                    disabled={registrationClosed}
                    onClick={() => setRentalMode("NEW_RENTAL")}
                  >
                    Thuê xe ngay
                  </button>
                </div>

                {rentalMode === "EXISTING_BOOKING" ? (
                  <>
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
                    </div>

                    <div>
                      <Label className="mb-2 block text-xs font-bold text-slate-700">
                        Xe thuê từ lịch đặt
                      </Label>
                      <select
                        className="h-10 w-full rounded-lg border border-slate-200 bg-card px-3 text-sm focus:border-orange-500 focus:outline-none focus:ring-1 focus:ring-orange-500 disabled:bg-slate-50 disabled:text-slate-400"
                        value={selectedVehicleId}
                        onChange={(event) =>
                          setSelectedVehicleId(event.target.value)
                        }
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
                  </>
                ) : (
                  <>
                    <ContestRentalSlotPicker
                      contestId={contest.id}
                      value={rentalSlotValue}
                      onChange={onRentalSlotChange}
                      disabled={registrationClosed}
                    />
                    {rentalSlotEstimate > 0 ? (
                      <div className="rounded-2xl border border-emerald-100 bg-emerald-50/50 p-4 text-sm">
                        <div className="flex items-center justify-between">
                          <span className="font-bold text-emerald-900">Tiền thuê xe ước tính</span>
                          <span className="font-black text-emerald-700">{formatCurrency(rentalSlotEstimate)}</span>
                        </div>
                        <p className="mt-1 text-xs text-emerald-700">
                          Hệ thống sẽ tạo booking PENDING. Bạn thanh toán booking thuê xe, sau đó provider mới duyệt đăng ký giải.
                        </p>
                      </div>
                    ) : null}
                  </>
                )}
              </div>
            )}

            <div className="mt-4 rounded-2xl border border-slate-200 bg-slate-50/70 p-4">
              <div className="flex items-center justify-between text-sm">
                <span className="font-bold text-slate-700">Lệ phí giải đấu</span>
                <span className="font-black text-slate-900">{formatCurrency(contest.entry_fee)}</span>
              </div>
              {rentalMode === "NEW_RENTAL" && rentalSlotEstimate > 0 ? (
                <>
                  <div className="my-2 border-t border-slate-200" />
                  <div className="flex items-center justify-between text-sm">
                    <span className="font-bold text-slate-700">Tiền thuê xe</span>
                    <span className="font-black text-slate-900">{formatCurrency(rentalSlotEstimate)}</span>
                  </div>
                  <div className="my-2 border-t border-slate-200" />
                  <div className="flex items-center justify-between text-sm">
                    <span className="font-black text-slate-900">Tổng ước tính</span>
                    <span className="font-black text-orange-600">{formatCurrency(contest.entry_fee + rentalSlotEstimate)}</span>
                  </div>
                </>
              ) : null}
            </div>

            <Button
              type="button"
              className="mt-2 w-full rounded-xl bg-orange-600 py-6 text-sm font-bold text-white shadow-md shadow-orange-600/10 transition hover:bg-orange-700"
              disabled={
                registrationClosed ||
                registerPending ||
                (registrationMode === "BYOC"
                  ? byocVehicleName.trim().length === 0
                  : rentalMode === "EXISTING_BOOKING"
                    ? !selectedBookingId || !selectedVehicleId
                    : !rentalSlotValue?.cafe_id ||
                      !rentalSlotValue?.slot_start ||
                      !rentalSlotValue?.slot_end ||
                      !rentalSlotValue?.vehicle_catalog_id)
              }
              onClick={onRegister}
            >
              {registerPending
                ? "Đang gửi đăng ký..."
                : registrationClosed
                  ? getClosedButtonLabel(registrationAvailability)
                  : "Gửi đăng ký tham gia"}
            </Button>
          </div>
        )}
      </div>
    </Card>
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
