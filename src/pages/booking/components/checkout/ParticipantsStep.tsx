import { AlertCircle, Car, UserRound, Users, X } from "lucide-react"
import type { CustomerPlayMode } from "@/features/customer-booking/data/customer-booking-demo"
import type { Cafe } from "@/shared/data/explore-data"
import { Button } from "@/shared/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/shared/ui/card"
import { Input } from "@/shared/ui/input"
import { Badge } from "@/shared/ui/badge"
import { cn } from "@/shared/lib/utils"
import { formatCurrency } from "@/shared/lib/format"
import type { TrackConfig } from "@/features/cafes/types"

export type Companion = { name: string; phone: string }

/** Kiểm tra SĐT Việt Nam: 10 chữ số, bắt đầu bằng 0 */
export function isValidVietnamesePhone(phone: string): boolean {
  return /^0\d{9}$/.test(phone.trim())
}

/** Trả về true nếu SĐT hợp lệ hoặc bỏ trống */
export function isPhoneOkOrEmpty(phone: string): boolean {
  const trimmed = phone.trim()
  return trimmed === '' || isValidVietnamesePhone(trimmed)
}

type ParticipantsStepProps = {
  cafe: Cafe
  playMode: CustomerPlayMode
  onPlayModeChange: (mode: CustomerPlayMode) => void
  participants: number
  onParticipantsChange: (value: number) => void
  companions: Companion[]
  onCompanionsChange: (companions: Companion[]) => void
  selectedVehicleIds: string[]
  onVehicleSelect: (ids: string[]) => void
  byocRemaining?: number
  selectedTrackConfig?: TrackConfig | null
}

export function ParticipantsStep({
  cafe,
  playMode,
  participants,
  onParticipantsChange,
  companions,
  onCompanionsChange,
  selectedVehicleIds,
  onVehicleSelect,
  byocRemaining,
  selectedTrackConfig,
}: ParticipantsStepProps) {
  const isByocFull = playMode === "BYOC" && byocRemaining !== undefined && byocRemaining === 0
  // BYOC: 1 người = 1 xe = 1 slot → hard cap theo byocRemaining
  // RENTAL: participants là informational (nhóm bao nhiêu người đến), 1 booking = 1 xe thuê
  const maxParticipants = playMode === "BYOC" && byocRemaining !== undefined ? byocRemaining : 10

  function handleParticipantsChange(value: number) {
    const clamped = Math.max(1, Math.min(maxParticipants, value))
    onParticipantsChange(clamped)
    // Sync companions array length to clamped - 1 (booker is always participant #1)
    const companionCount = clamped - 1
    const updated = Array.from({ length: companionCount }, (_, i) => companions[i] ?? { name: "", phone: "" })
    onCompanionsChange(updated)
  }

  function updateCompanion(index: number, field: keyof Companion, value: string) {
    const updated = companions.map((c, i) => (i === index ? { ...c, [field]: value } : c))
    onCompanionsChange(updated)
  }

  /** Kiểm tra SĐT của 1 companion: lỗi nếu có nhập nhưng sai định dạng */
  function getPhoneError(phone: string): string | null {
    const trimmed = phone.trim()
    if (trimmed === '') return null
    return isValidVietnamesePhone(trimmed)
      ? null
      : 'SĐT phải gồm 10 chữ số và bắt đầu bằng số 0'
  }

  return (
    <Card className="rounded-xl shadow-sm">
      <CardHeader>
        <CardTitle>Người chơi & phương tiện</CardTitle>
        <p className="text-sm text-muted-foreground">
          Người đặt lịch là người chơi chính. Thêm người đi kèm nếu có — họ tên là bắt buộc để tiếp tục. Staff có thể bổ sung khi check-in.
        </p>
      </CardHeader>
      <CardContent className="space-y-5">

        {/* Play mode — read-only, already selected in step 1 */}
        <div className="flex items-center gap-2 rounded-lg border border-orange-100 bg-orange-50/50 px-4 py-2.5">
          <span className="text-sm text-muted-foreground">Hình thức:</span>
          <span className="text-sm font-semibold text-orange-700">
            {playMode === "RENTAL" ? "Thuê xe" : "Mang xe cá nhân"}
          </span>
        </div>

        {/* BYOC full warning */}
        {isByocFull && (
          <div className="flex items-start gap-3 rounded-xl border border-red-200 bg-red-50 p-4">
            <AlertCircle className="mt-0.5 h-5 w-5 shrink-0 text-red-500" />
            <div>
              <p className="text-sm font-semibold text-red-800">Slot này đã hết chỗ mang xe riêng</p>
              <p className="mt-0.5 text-xs text-red-600">Quay lại bước 1 và chọn "Thuê xe" hoặc đổi khung giờ khác.</p>
            </div>
          </div>
        )}

        {/* Participant count */}
        <div className="space-y-2">
          <label className="flex items-center gap-2 text-sm font-medium">
            <Users className="h-4 w-4 text-muted-foreground" /> Số người tham gia
          </label>
          <div className="flex items-center gap-3">
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="h-9 w-9 rounded-lg p-0"
              onClick={() => handleParticipantsChange(participants - 1)}
              disabled={participants <= 1}
            >
              −
            </Button>
            <span className="w-8 text-center text-base font-semibold">{participants}</span>
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="h-9 w-9 rounded-lg p-0"
              onClick={() => handleParticipantsChange(participants + 1)}
              disabled={participants >= maxParticipants}
            >
              +
            </Button>
            <span className="text-xs text-muted-foreground">
              {playMode === "BYOC"
                ? `/ ${maxParticipants} chỗ còn lại · mỗi người 1 xe`
                : "người · 1 booking = 1 xe thuê"}
            </span>
          </div>
          {playMode === "BYOC" && participants >= maxParticipants && !isByocFull && (
            <p className="text-xs text-amber-600">Đã đạt giới hạn chỗ BYOC còn trống cho slot này.</p>
          )}
        </div>

        {/* Companion details */}
        {participants > 1 && (
          <div className="space-y-3">
            <p className="text-sm font-medium text-slate-700">
              Thông tin người đi kèm
              <span className="ml-1.5 text-xs font-normal text-rose-500">(bắt buộc điền họ tên)</span>
            </p>
            {companions.map((companion, i) => {
                const phoneError = getPhoneError(companion.phone)
                return (
                  <div key={i} className="space-y-1">
                    <div className="flex items-center gap-2">
                      <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-slate-100 text-xs font-bold text-slate-500">
                        {i + 2}
                      </div>
                      <Input
                        placeholder="Họ tên"
                        value={companion.name}
                        onChange={(e) => updateCompanion(i, "name", e.target.value)}
                        className="h-9 text-sm"
                      />
                      <Input
                        placeholder="Số điện thoại"
                        value={companion.phone}
                        onChange={(e) => updateCompanion(i, "phone", e.target.value)}
                        maxLength={10}
                        className={cn(
                          "h-9 w-36 shrink-0 text-sm",
                          phoneError && "border-rose-400 focus-visible:ring-rose-300",
                        )}
                      />
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="h-9 w-9 shrink-0 rounded-lg p-0 text-muted-foreground hover:text-destructive"
                        onClick={() => handleParticipantsChange(participants - 1)}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                    {phoneError && (
                      <p className="pl-9 text-[11px] text-rose-500">{phoneError}</p>
                    )}
                  </div>
                )
              })}
            <p className="text-[11px] text-muted-foreground">
              Staff sẽ cập nhật thông tin còn thiếu khi check-in.
            </p>
          </div>
        )}

        {/* RENTAL: vehicle picker */}
        {playMode !== "BYOC" && (
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <p className="flex items-center gap-2 text-sm font-medium">
                <Car className="h-4 w-4 text-muted-foreground" /> Xe thuê dự kiến
                <span className="text-xs font-normal text-rose-500">(chọn đủ {participants} xe)</span>
              </p>
              <div className="flex items-center gap-2">
                {selectedVehicleIds.length > 0 && (
                  <Badge variant={selectedVehicleIds.length >= participants ? "default" : "destructive"}>
                    {selectedVehicleIds.length}/{participants} xe
                  </Badge>
                )}
                <Badge variant="secondary">{cafe.availableVehicles.length} xe có sẵn</Badge>
              </div>
            </div>
            {selectedVehicleIds.length < participants && selectedVehicleIds.length > 0 && (
              <p className="text-xs text-rose-500">Cần chọn thêm {participants - selectedVehicleIds.length} xe nữa.</p>
            )}
            {selectedVehicleIds.length === 0 && (
              <p className="text-xs text-rose-500">Vui lòng chọn xe để tiếp tục.</p>
            )}
            {cafe.availableVehicles.length === 0 ? (
              <p className="text-sm text-muted-foreground">Cơ sở chưa cập nhật danh sách xe.</p>
            ) : (
              <div className="grid gap-3 md:grid-cols-3">
                {cafe.availableVehicles.map((vehicle) => {
                  const isSelected = selectedVehicleIds.includes(vehicle.id)
                  const isCompatible =
                    !selectedTrackConfig ||
                    !vehicle.compatibleTrackTypes ||
                    vehicle.compatibleTrackTypes.length === 0 ||
                    vehicle.compatibleTrackTypes.some(
                      (t) =>
                        t.id === selectedTrackConfig.track_type_id ||
                        t.code === selectedTrackConfig.track_type?.code
                    )
                  const isDisabled = vehicle.status !== "available" || !isCompatible
                  return (
                    <button
                      key={vehicle.id}
                      type="button"
                      disabled={isDisabled}
                      onClick={() => {
                        const next = isSelected
                          ? selectedVehicleIds.filter((id) => id !== vehicle.id)
                          : [...selectedVehicleIds, vehicle.id]
                        onVehicleSelect(next)
                      }}
                      className={cn(
                        "overflow-hidden rounded-xl border bg-background text-left transition hover:border-primary/40",
                        isSelected && "border-primary ring-2 ring-primary/10",
                        isDisabled && "cursor-not-allowed opacity-50 bg-slate-50/50",
                      )}
                    >
                      <img src={vehicle.image} alt={vehicle.name} className="h-28 w-full object-cover" />
                      <div className="space-y-1 p-3">
                        <div className="flex items-center justify-between gap-1.5">
                          <p className="line-clamp-1 text-sm font-semibold">{vehicle.name}</p>
                          {!isCompatible && (
                            <Badge className="shrink-0 text-[9px] px-1 py-0 h-4 bg-amber-500 text-white border-none hover:bg-amber-500">
                              K.Tương thích
                            </Badge>
                          )}
                        </div>
                        <p className="text-xs text-muted-foreground">{vehicle.type} · {vehicle.scale}</p>
                        <p className="text-sm font-semibold">{formatCurrency(vehicle.pricePerHour)}/giờ</p>
                      </div>
                    </button>
                  )
                })}
              </div>
            )}
          </div>
        )}

        {/* BYOC info */}
        {playMode !== "RENTAL" && (
          <div className={cn("rounded-xl border p-4", isByocFull ? "border-red-200 bg-red-50/50" : "border-slate-200 bg-muted/40")}>
            <div className="flex items-start gap-3">
              <UserRound className={cn("mt-0.5 h-5 w-5 shrink-0", isByocFull ? "text-red-400" : "text-muted-foreground")} />
              <div className="flex-1">
                <div className="flex items-center justify-between gap-3">
                  <p className="font-medium text-sm">BYOC sẽ được kiểm tra tại quầy</p>
                  {byocRemaining !== undefined && (
                    <Badge
                      variant={byocRemaining > 0 ? "secondary" : "destructive"}
                      className="shrink-0 text-xs"
                    >
                      {byocRemaining > 0 ? `Còn ${byocRemaining} chỗ BYOC` : "Hết chỗ BYOC"}
                    </Badge>
                  )}
                </div>
                <p className="mt-1 text-xs text-muted-foreground">
                  Mỗi booking chiếm 1 slot BYOC (không phân biệt số người). Staff xác nhận xe tại check-in.
                </p>
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
