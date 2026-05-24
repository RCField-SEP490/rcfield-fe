import { Car, UserRound, Users } from "lucide-react"
import type { CustomerPlayMode } from "@/features/customer-booking/data/customer-booking-demo"
import type { Cafe } from "@/shared/data/explore-data"
import { Button } from "@/shared/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/shared/ui/card"
import { Input } from "@/shared/ui/input"
import { Badge } from "@/shared/ui/badge"
import { cn } from "@/shared/lib/utils"
import { formatCurrency } from "@/shared/lib/format"

type ParticipantsStepProps = {
  cafe: Cafe
  playMode: CustomerPlayMode
  onPlayModeChange: (mode: CustomerPlayMode) => void
  participants: number
  onParticipantsChange: (value: number) => void
  selectedVehicleId?: string
  onVehicleSelect: (id?: string) => void
}

const playModeOptions: Array<{ value: CustomerPlayMode; label: string; description: string }> = [
  { value: "RENTAL", label: "Thuê xe", description: "Dùng xe của cơ sở" },
  { value: "BYOC", label: "BYOC", description: "Mang xe cá nhân" },
  { value: "MIXED", label: "Mixed", description: "Vừa thuê vừa BYOC" },
]

export function ParticipantsStep({
  cafe,
  playMode,
  onPlayModeChange,
  participants,
  onParticipantsChange,
  selectedVehicleId,
  onVehicleSelect,
}: ParticipantsStepProps) {
  return (
    <Card className="rounded-xl shadow-sm">
      <CardHeader>
        <CardTitle>Người chơi & phương tiện</CardTitle>
        <p className="text-sm text-muted-foreground">Planned participants và planned rental vehicles được tách riêng theo database rules.</p>
      </CardHeader>
      <CardContent className="space-y-5">
        <div className="grid gap-2 md:grid-cols-3">
          {playModeOptions.map((item) => (
            <Button
              key={item.value}
              type="button"
              variant={playMode === item.value ? "default" : "outline"}
              className="h-auto justify-start p-4"
              onClick={() => onPlayModeChange(item.value)}
            >
              <span className="text-left">
                <span className="block font-medium">{item.label}</span>
                <span className={cn("block text-xs", playMode === item.value ? "text-primary-foreground/80" : "text-muted-foreground")}>
                  {item.description}
                </span>
              </span>
            </Button>
          ))}
        </div>

        <label className="block max-w-xs space-y-2">
          <span className="flex items-center gap-2 text-sm font-medium">
            <Users className="h-4 w-4 text-muted-foreground" /> Số người tham gia
          </span>
          <Input
            type="number"
            min={1}
            max={8}
            value={participants}
            onChange={(event) => onParticipantsChange(Number(event.target.value))}
          />
        </label>

        {playMode !== "BYOC" && (
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <p className="flex items-center gap-2 text-sm font-medium">
                <Car className="h-4 w-4 text-muted-foreground" /> Xe thuê dự kiến
              </p>
              <Badge variant="secondary">{cafe.availableVehicles.length} xe</Badge>
            </div>
            <div className="grid gap-3 md:grid-cols-3">
              {cafe.availableVehicles.map((vehicle) => {
                const isSelected = selectedVehicleId === vehicle.id
                const isDisabled = vehicle.status !== "available"

                return (
                  <button
                    key={vehicle.id}
                    type="button"
                    disabled={isDisabled}
                    onClick={() => onVehicleSelect(isSelected ? undefined : vehicle.id)}
                    className={cn(
                      "overflow-hidden rounded-xl border bg-background text-left transition hover:border-primary/40",
                      isSelected && "border-primary ring-2 ring-primary/10",
                      isDisabled && "cursor-not-allowed opacity-50",
                    )}
                  >
                    <img src={vehicle.image} alt={vehicle.name} className="h-28 w-full object-cover" />
                    <div className="space-y-1 p-3">
                      <p className="line-clamp-1 text-sm font-semibold">{vehicle.name}</p>
                      <p className="text-xs text-muted-foreground">{vehicle.type} · {vehicle.scale}</p>
                      <p className="text-sm font-semibold">{formatCurrency(vehicle.pricePerHour)}/giờ</p>
                    </div>
                  </button>
                )
              })}
            </div>
          </div>
        )}

        {playMode !== "RENTAL" && (
          <div className="rounded-xl border bg-muted/40 p-4">
            <div className="flex items-start gap-3">
              <UserRound className="mt-0.5 h-5 w-5 text-muted-foreground" />
              <div>
                <p className="font-medium">BYOC sẽ được kiểm tra tại quầy</p>
                <p className="mt-1 text-sm text-muted-foreground">
                  Staff sẽ tạo actual session vehicles khi check-in. Xe cá nhân không lưu trực tiếp trong bookings.
                </p>
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
