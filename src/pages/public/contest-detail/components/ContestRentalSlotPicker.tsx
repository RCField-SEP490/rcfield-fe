import { useEffect, useMemo, useState } from "react"

import { contestApi } from "@/features/contests/api/contest.api"
import type {
  ContestAvailableRentalCatalogGroup,
  ContestRentalOptions,
} from "@/features/contests/types"
import { Card } from "@/shared/ui/card"
import { Input } from "@/shared/ui/input"
import { Label } from "@/shared/ui/label"
import { Skeleton } from "@/shared/ui/skeleton"

export type RentalSlotValue = {
  cafe_id: string
  slot_start: string
  slot_end: string
  track_config_id?: string | null
  vehicle_catalog_id?: string | null
}

export function ContestRentalSlotPicker({
  contestId,
  value,
  onChange,
  disabled,
}: {
  contestId: string
  value: RentalSlotValue | null
  onChange: (value: RentalSlotValue, rentalFeeEstimate: number) => void
  disabled?: boolean
}) {
  const [options, setOptions] = useState<ContestRentalOptions | null>(null)
  const [available, setAvailable] = useState<ContestAvailableRentalCatalogGroup[]>([])
  const [loadingOptions, setLoadingOptions] = useState(false)
  const [loadingVehicles, setLoadingVehicles] = useState(false)

  useEffect(() => {
    let cancelled = false
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setLoadingOptions(true)
    contestApi
      .getContestRentalOptions(contestId)
      .then((data) => {
        if (!cancelled) setOptions(data)
      })
      .finally(() => {
        if (!cancelled) setLoadingOptions(false)
      })
    return () => {
      cancelled = true
    }
  }, [contestId])

  const selectedCafe = useMemo(
    () => options?.cafes.find((c) => c.id === value?.cafe_id) ?? null,
    [options, value?.cafe_id],
  )

  const selectedCatalog = useMemo(
    () =>
      options?.vehicle_catalogs.find((c) => c.id === value?.vehicle_catalog_id) ?? null,
    [options, value?.vehicle_catalog_id],
  )

  useEffect(() => {
    if (!value?.cafe_id || !value?.slot_start || !value?.slot_end) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setAvailable([])
      return
    }
    let cancelled = false
    setLoadingVehicles(true)
    contestApi
      .getContestAvailableRentalVehicles(contestId, {
        cafe_id: value.cafe_id,
        slot_start: value.slot_start,
        slot_end: value.slot_end,
        track_config_id: value.track_config_id ?? null,
      })
      .then((data) => {
        if (!cancelled) setAvailable(data)
      })
      .finally(() => {
        if (!cancelled) setLoadingVehicles(false)
      })
    return () => {
      cancelled = true
    }
  }, [contestId, value?.cafe_id, value?.slot_start, value?.slot_end, value?.track_config_id])

  const rentalFeeEstimate = useMemo(() => {
    if (!selectedCatalog || !value?.slot_start || !value?.slot_end) return 0
    const start = new Date(value.slot_start).getTime()
    const end = new Date(value.slot_end).getTime()
    const hours = Math.max(0, end - start) / 3600000
    return Math.round(selectedCatalog.hourly_rate * hours)
  }, [selectedCatalog, value])

  useEffect(() => {
    if (value) onChange(value, rentalFeeEstimate)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [rentalFeeEstimate])

  if (loadingOptions || !options) {
    return (
      <div className="space-y-3">
        <Skeleton className="h-10 w-full" />
        <Skeleton className="h-10 w-full" />
        <Skeleton className="h-10 w-full" />
      </div>
    )
  }

  const trackConfigs = options.track_configs.filter(
    (tc) => tc.cafe_id === value?.cafe_id,
  )

  const handleChange = (patch: Partial<RentalSlotValue>) => {
    const next: RentalSlotValue = {
      cafe_id: value?.cafe_id ?? options.cafes[0]?.id ?? "",
      slot_start: value?.slot_start ?? "",
      slot_end: value?.slot_end ?? "",
      track_config_id: value?.track_config_id ?? null,
      vehicle_catalog_id: value?.vehicle_catalog_id ?? null,
      ...patch,
    }
    onChange(next, rentalFeeEstimate)
  }

  return (
    <Card className="space-y-4 rounded-2xl border border-slate-200 bg-slate-50/70 p-4">
      <div>
        <Label className="mb-2 block text-xs font-bold text-slate-700">
          Chi nhánh thuê xe
        </Label>
        <select
          className="h-10 w-full rounded-lg border border-slate-200 bg-card px-3 text-sm focus:border-orange-500 focus:outline-none focus:ring-1 focus:ring-orange-500 disabled:bg-slate-50"
          value={value?.cafe_id ?? ""}
          disabled={disabled}
          onChange={(e) =>
            handleChange({
              cafe_id: e.target.value,
              track_config_id: null,
              vehicle_catalog_id: null,
            })
          }
        >
          <option value="">-- Chọn chi nhánh --</option>
          {options.cafes.map((cafe) => (
            <option key={cafe.id} value={cafe.id}>
              {cafe.name}
              {cafe.district ? ` · ${cafe.district}` : ""}
              {cafe.city ? `, ${cafe.city}` : ""}
            </option>
          ))}
        </select>
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        <div>
          <Label className="mb-2 block text-xs font-bold text-slate-700">
            Bắt đầu thuê
          </Label>
          <Input
            type="datetime-local"
            value={value?.slot_start ? formatLocalDateTime(value.slot_start) : ""}
            disabled={disabled}
            onChange={(e) =>
              handleChange({ slot_start: toIsoDateTime(e.target.value) })
            }
          />
        </div>
        <div>
          <Label className="mb-2 block text-xs font-bold text-slate-700">
            Kết thúc thuê
          </Label>
          <Input
            type="datetime-local"
            value={value?.slot_end ? formatLocalDateTime(value.slot_end) : ""}
            disabled={disabled}
            onChange={(e) =>
              handleChange({ slot_end: toIsoDateTime(e.target.value) })
            }
          />
        </div>
      </div>

      <div>
        <Label className="mb-2 block text-xs font-bold text-slate-700">
          Track config (tùy chọn)
        </Label>
        <select
          className="h-10 w-full rounded-lg border border-slate-200 bg-card px-3 text-sm focus:border-orange-500 focus:outline-none focus:ring-1 focus:ring-orange-500 disabled:bg-slate-50"
          value={value?.track_config_id ?? ""}
          disabled={disabled || trackConfigs.length === 0}
          onChange={(e) =>
            handleChange({
              track_config_id: e.target.value || null,
            })
          }
        >
          <option value="">-- Track config mặc định --</option>
          {trackConfigs.map((tc) => (
            <option key={tc.id} value={tc.id}>
              {tc.track_type_name ?? `Track ${tc.track_type_id.slice(0, 8)}`} ·{" "}
              {tc.max_concurrent} xe
            </option>
          ))}
        </select>
      </div>

      <div>
        <Label className="mb-2 block text-xs font-bold text-slate-700">
          Dòng xe thuê
        </Label>
        <select
          className="h-10 w-full rounded-lg border border-slate-200 bg-card px-3 text-sm focus:border-orange-500 focus:outline-none focus:ring-1 focus:ring-orange-500 disabled:bg-slate-50"
          value={value?.vehicle_catalog_id ?? ""}
          disabled={disabled || !selectedCafe}
          onChange={(e) => handleChange({ vehicle_catalog_id: e.target.value || null })}
        >
          <option value="">-- Chọn dòng xe --</option>
          {options.vehicle_catalogs
            .filter((c) => c.cafe_id === value?.cafe_id)
            .map((catalog) => (
              <option key={catalog.id} value={catalog.id}>
                {catalog.name} · {catalog.tier} · {formatCurrency(catalog.hourly_rate)}/giờ
              </option>
            ))}
        </select>
      </div>

      {loadingVehicles ? (
        <Skeleton className="h-8 w-full" />
      ) : selectedCatalog && value?.vehicle_catalog_id ? (
        <div className="rounded-xl border border-slate-200 bg-white p-3 text-sm">
          <p className="font-bold text-slate-900">
            {selectedCatalog.name} · {selectedCatalog.tier}
          </p>
          <p className="text-slate-600">
            {formatCurrency(selectedCatalog.hourly_rate)}/giờ
          </p>
          {(() => {
            const group = available.find(
              (g) => g.catalog_id === value.vehicle_catalog_id,
            )
            if (!group) return null
            return (
              <p className="mt-1 text-xs text-emerald-700">
                Có {group.available_units.length} xe khả dụng
              </p>
            )
          })()}
        </div>
      ) : null}

      {value?.slot_start && value?.slot_end && selectedCatalog ? (
        <div className="flex items-center justify-between rounded-xl border border-emerald-100 bg-emerald-50/50 p-3 text-sm">
          <span className="font-bold text-emerald-900">Ước tính tiền thuê xe</span>
          <span className="font-black text-emerald-700">
            {formatCurrency(rentalFeeEstimate)}
          </span>
        </div>
      ) : null}
    </Card>
  )
}

function formatLocalDateTime(iso: string): string {
  const date = new Date(iso)
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, "0")
  const day = String(date.getDate()).padStart(2, "0")
  const hours = String(date.getHours()).padStart(2, "0")
  const minutes = String(date.getMinutes()).padStart(2, "0")
  return `${year}-${month}-${day}T${hours}:${minutes}`
}

function toIsoDateTime(local: string): string {
  return new Date(local).toISOString()
}

function formatCurrency(amount: number): string {
  return new Intl.NumberFormat("vi-VN", {
    style: "currency",
    currency: "VND",
    maximumFractionDigits: 0,
  }).format(amount)
}
