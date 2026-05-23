import { useState } from "react"
import { Link } from "react-router"
import { bookingCatalog } from "@/features/booking/data/booking-options"
import type { Cafe } from "@/shared/data/explore-data"
import { formatCurrency } from "@/shared/lib/format"
import { buildCafeBookingPath } from "../cafe-detail-utils"

type Tab = "hourly" | "slotPackage" | "recurring"

export function CafeBookingCard({ cafe }: { cafe: Cafe }) {
  const [tab, setTab] = useState<Tab>("hourly")
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().slice(0, 10))
  const [selectedTimeId, setSelectedTimeId] = useState(bookingCatalog.timeOptions[0])

  const plans = tab === "hourly" ? bookingCatalog.hourlyPlans
    : tab === "slotPackage" ? bookingCatalog.slotPackages
    : bookingCatalog.recurringPlans

  const displayPrice = tab === "slotPackage"
    ? plans[0]?.price ?? 0
    : tab === "recurring"
    ? (plans[0] as any)?.pricePerMonth ?? 0
    : (plans[0] as any)?.pricePerHour ?? 0

  const priceLabel = tab === "hourly" ? "/giờ" : tab === "slotPackage" ? "" : "/tháng"

  return (
    <div className="border border-slate-200 bg-white">
      {/* Tabs */}
      <div className="flex border-b border-slate-200">
        {(["hourly", "slotPackage", "recurring"] as const).map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`flex-1 px-3 py-2.5 text-xs font-semibold transition ${
              tab === t
                ? "border-b-2 border-slate-900 bg-slate-50 text-slate-900"
                : "text-slate-500 hover:text-slate-700"
            }`}
          >
            {t === "hourly" ? "Theo giờ" : t === "slotPackage" ? "Gói slot" : "Cố định"}
          </button>
        ))}
      </div>

      <div className="p-4">
        {/* Current plan preview */}
        <div className="mb-3 border border-slate-200 bg-slate-50 p-3">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-semibold text-slate-900">{plans[0]?.label ?? "Chọn gói"}</p>
              <p className="mt-0.5 text-[11px] text-slate-500">{plans[0]?.note}</p>
            </div>
            <div className="text-right">
              <p className="text-sm font-bold text-slate-900">{formatCurrency(displayPrice)}{priceLabel}</p>
              {tab === "slotPackage" && <p className="text-[10px] text-slate-400">{(plans[0] as any)?.slots ?? 0} slot</p>}
            </div>
          </div>
        </div>

        {/* Date */}
        <div className="mb-3">
          <p className="mb-1 text-[11px] font-semibold text-slate-600">NGÀY</p>
          <input
            type="date"
            value={selectedDate}
            onChange={(e) => setSelectedDate(e.target.value)}
            className="w-full border border-slate-200 px-2.5 py-2 text-xs outline-none focus:border-slate-400"
          />
        </div>

        {/* Time slots */}
        <div className="mb-3">
          <p className="mb-1 text-[11px] font-semibold text-slate-600">GIỜ</p>
          <div className="grid grid-cols-3 gap-1">
            {bookingCatalog.timeOptions.map((t) => (
              <button
                key={t}
                onClick={() => setSelectedTimeId(t)}
                className={`py-1.5 text-[11px] font-medium border transition ${
                  selectedTimeId === t
                    ? "border-slate-900 bg-slate-900 text-white"
                    : "border-slate-200 text-slate-600 hover:border-slate-400"
                }`}
              >
                {t}
              </button>
            ))}
          </div>
        </div>

        {/* Vehicle selector */}
        <div className="mb-3">
          <p className="mb-1 text-[11px] font-semibold text-slate-600">XE THUÊ</p>
          <div className="space-y-1">
            {cafe.availableVehicles.slice(0, 3).map((v) => (
              <div key={v.id} className="flex items-center justify-between border border-slate-200 px-2.5 py-1.5">
                <div className="min-w-0 flex-1">
                  <p className="truncate text-[11px] font-medium text-slate-700">{v.name}</p>
                  <p className="text-[10px] text-slate-400">{v.scale}</p>
                </div>
                <div className="text-right">
                  <p className="text-[11px] font-semibold text-slate-800">{formatCurrency(v.pricePerHour)}</p>
                  <span className={`text-[10px] ${v.status === "available" ? "text-emerald-600" : "text-red-500"}`}>
                    {v.status === "available" ? "Sẵn" : "Bận"}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* CTA */}
        <Link
          to={buildCafeBookingPath(cafe.id, tab)}
          className="mt-3 block w-full bg-slate-900 py-2.5 text-center text-sm font-semibold text-white hover:bg-orange-600"
        >
          Tiến hành đặt
        </Link>
      </div>
    </div>
  )
}
