import { BatteryCharging, Car, Check, Gauge } from "lucide-react"
import type { Cafe } from "@/shared/data/explore-data"
import { formatCurrency } from "@/shared/lib/format"
import { cn } from "@/shared/lib/utils"

import { CafeSection, SectionNote } from "./SectionShell"

type CafeVehiclesSectionProps = {
  cafe: Cafe
  selectedVehicleId?: string
  onSelectVehicle: (id: string | undefined) => void
}

/**
 * Danh sách xe cho thuê dạng hàng ngang.
 *
 * Bản cũ là lưới 3 cột thẻ ảnh 4:3 — mỗi mẫu xe chiếm gần nửa màn hình chiều cao
 * trong khi thông tin thật chỉ có tên, giá và ba thông số ngắn. Hàng ngang cho
 * thấy nhiều mẫu hơn trong một tầm mắt và so giá dễ hơn vì các con số thẳng cột.
 */
export function CafeVehiclesSection({ cafe, selectedVehicleId, onSelectVehicle }: CafeVehiclesSectionProps) {
  return (
    <CafeSection
      title="Chọn xe thuê"
      lead="Bấm vào một mẫu để thuê nhanh — xe đã chọn được cộng thẳng vào tạm tính bên phải."
    >
      {cafe.availableVehicles.length === 0 ? (
        <SectionNote>Cơ sở này chưa công khai dữ liệu xe thuê.</SectionNote>
      ) : (
        <ul className="divide-y divide-slate-200 border-y border-slate-200">
          {cafe.availableVehicles.map((vehicle) => {
            const isSelected = vehicle.id === selectedVehicleId
            const isBusy = vehicle.status !== "available"

            return (
              <li key={vehicle.id}>
                <button
                  type="button"
                  aria-pressed={isSelected}
                  onClick={() => onSelectVehicle(isSelected ? undefined : vehicle.id)}
                  className={cn(
                    "flex w-full items-center gap-4 py-4 pl-0 pr-2 text-left transition-colors",
                    isSelected ? "bg-orange-50/60 pl-3" : "hover:bg-slate-50",
                  )}
                >
                  <span
                    aria-hidden
                    className={cn(
                      "h-14 w-1 shrink-0 rounded-full transition-colors",
                      isSelected ? "bg-orange-500" : "bg-transparent",
                    )}
                  />

                  <span className="relative size-20 shrink-0 overflow-hidden rounded-xl bg-slate-100">
                    <img src={vehicle.image} alt="" className="h-full w-full object-cover" />
                  </span>

                  <span className="min-w-0 flex-1">
                    <span className="flex flex-wrap items-center gap-2">
                      <span className="text-base font-bold text-slate-950">{vehicle.name}</span>
                      {isBusy && (
                        <span className="rounded-full bg-slate-100 px-2 py-0.5 text-xs font-bold text-slate-500">
                          Đang bận
                        </span>
                      )}
                    </span>
                    <span className="mt-1 block text-sm text-slate-500">
                      {vehicle.type} · {vehicle.scale}
                    </span>
                    <span className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-slate-500">
                      <Spec icon={BatteryCharging} label={vehicle.specs.battery} />
                      <Spec icon={Gauge} label={vehicle.specs.motor} />
                      <Spec icon={Car} label={vehicle.specs.brand} />
                    </span>
                  </span>

                  <span className="shrink-0 text-right">
                    <span className="block text-base font-black text-slate-950">
                      {formatCurrency(vehicle.pricePerHour)}
                    </span>
                    <span className="block text-xs font-semibold text-slate-400">mỗi giờ</span>
                  </span>

                  <span
                    className={cn(
                      "flex size-8 shrink-0 items-center justify-center rounded-full border-2 transition-colors",
                      isSelected
                        ? "border-orange-500 bg-orange-500 text-white"
                        : "border-slate-200 text-transparent",
                    )}
                  >
                    <Check className="size-4" />
                  </span>
                </button>
              </li>
            )
          })}
        </ul>
      )}
    </CafeSection>
  )
}

function Spec({ icon: Icon, label }: { icon: typeof BatteryCharging; label: string }) {
  return (
    <span className="flex min-w-0 items-center gap-1.5">
      <Icon className="size-4 shrink-0 text-slate-400" />
      <span className="truncate">{label}</span>
    </span>
  )
}
