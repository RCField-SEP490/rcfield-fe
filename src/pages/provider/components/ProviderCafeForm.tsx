import { useEffect, useMemo, useState, type FormEvent } from "react"
import { ImageIcon, ImagePlus, Loader2, MapPin, Trash2 } from "lucide-react"
import { useQuery } from "@tanstack/react-query"

import { LocationPickerDialog } from "@/shared/components/LocationPickerDialog"

import { cafeApi, cafeQueryKeys } from "@/features/cafes/api/cafe.api"
import type { BackendCafe, CafeImage, CafeOperatingHour, CafeOperatingHours, CafeUpsertBody, TrackType } from "@/features/cafes/types"
import { cn } from "@/shared/lib/utils"
import { Button } from "@/shared/ui/button"
import { Checkbox } from "@/shared/ui/checkbox"
import { Input } from "@/shared/ui/input"
import { Label } from "@/shared/ui/label"
import { Textarea } from "@/shared/ui/textarea"

type Province = { code: number; name: string }
type Ward = { code: number; name: string }

async function fetchProvinces(): Promise<Province[]> {
  const res = await fetch("https://provinces.open-api.vn/api/v2/p/")
  if (!res.ok) throw new Error("Cannot load provinces")
  return res.json() as Promise<Province[]>
}

async function fetchWards(provinceCode: number): Promise<Ward[]> {
  const res = await fetch(`https://provinces.open-api.vn/api/v2/p/${provinceCode}?depth=2`)
  if (!res.ok) throw new Error("Cannot load wards")
  const data = await res.json() as { wards?: Ward[] }
  return data.wards ?? []
}

type ProviderCafeFormValues = CafeUpsertBody

type ProviderCafeFormProps = {
  cafe?: BackendCafe | null
  isPending: boolean
  submitLabel?: string
  onSubmit: (values: ProviderCafeFormValues, galleryFiles: File[], coverFile: File | null) => Promise<void>
  onCancel?: () => void
  onDeleteImage?: (image: CafeImage) => Promise<void>
}

const trackOptions: Array<{ value: TrackType; label: string }> = [
  { value: "DRIFT", label: "Drift" },
  { value: "OBSTACLE", label: "Obstacle" },
  { value: "HILL_CLIMB", label: "Hill climb" },
]

const dayKeys = ["mon", "tue", "wed", "thu", "fri", "sat", "sun"]

const dayLabels: Record<string, string> = {
  mon: "Thứ 2",
  tue: "Thứ 3",
  wed: "Thứ 4",
  thu: "Thứ 5",
  fri: "Thứ 6",
  sat: "Thứ 7",
  sun: "Chủ nhật",
}

function buildDefaultHours(): CafeOperatingHours {
  return Object.fromEntries(dayKeys.map((day) => [day, { open: "09:00", close: "22:00", is_closed: false }]))
}

const defaultValues: ProviderCafeFormValues = {
  name: "",
  description: "",
  phone: "",
  cover_image_url: null,
  address: "",
  district: "",
  city: "Thành phố Hồ Chí Minh",
  latitude: null,
  longitude: null,
  operating_hours: buildDefaultHours(),
  track_types: ["DRIFT"],
  slot_duration_minutes: 60,
  slot_fee_rate: 50000,
  max_concurrent_bookings: 6,
  min_booking_notice_minutes: 30,
  byoc_capacity: 3,
}

export function ProviderCafeForm({
  cafe = null,
  isPending,
  submitLabel,
  onSubmit,
  onCancel,
  onDeleteImage,
}: ProviderCafeFormProps) {
  const [values, setValues] = useState<ProviderCafeFormValues>(defaultValues)
  const [files, setFiles] = useState<File[]>([])
  const [coverFile, setCoverFile] = useState<File | null>(null)
  const [snap, setSnap] = useState<ProviderCafeFormValues>(defaultValues)
  const [mapOpen, setMapOpen] = useState(false)
  const [provinceCode, setProvinceCode] = useState<number | null>(null)

  const { data: provinces = [], isLoading: loadingProvinces } = useQuery({
    queryKey: ["vn-provinces"],
    queryFn: fetchProvinces,
    staleTime: Infinity,
  })

  const { data: wards = [], isLoading: loadingWards } = useQuery({
    queryKey: ["vn-wards", provinceCode],
    queryFn: () => fetchWards(provinceCode!),
    enabled: provinceCode !== null,
    staleTime: Infinity,
  })

  const coverPreview = useMemo(() => {
    if (coverFile) return URL.createObjectURL(coverFile)
    return values.cover_image_url ?? null
  }, [coverFile, values.cover_image_url])

  const { data: images = [], isLoading: loadingImages } = useQuery({
    queryKey: cafeQueryKeys.images(cafe?.id),
    queryFn: () => cafeApi.listCafeImages(cafe!.id),
    enabled: !!cafe?.id,
  })

  useEffect(() => {
    if (!cafe) {
      setValues(defaultValues)
      setSnap(defaultValues)
      setFiles([])
      return
    }

    const loadedHours: CafeOperatingHours = {}
    dayKeys.forEach((day) => {
      const h = cafe.operatingHours[day]
      loadedHours[day] = {
        open: h?.open ?? "09:00",
        close: h?.close ?? "22:00",
        is_closed: h?.is_closed ?? false,
      }
    })

    const nextValues: ProviderCafeFormValues = {
      name: cafe.name,
      description: cafe.description ?? "",
      phone: cafe.phone ?? "",
      cover_image_url: cafe.coverImageUrl ?? null,
      address: cafe.address,
      district: cafe.district,
      city: cafe.city,
      latitude: cafe.latitude === null ? null : Number(cafe.latitude),
      longitude: cafe.longitude === null ? null : Number(cafe.longitude),
      operating_hours: loadedHours,
      track_types: cafe.trackTypes.length > 0 ? cafe.trackTypes : ["DRIFT"],
      slot_duration_minutes: cafe.slotDurationMinutes,
      slot_fee_rate: Number(cafe.slotFeeRate),
      max_concurrent_bookings: cafe.maxConcurrentBookings,
      min_booking_notice_minutes: cafe.minBookingNoticeMinutes,
      byoc_capacity: cafe.byocCapacity,
    }

    setValues(nextValues)
    setSnap(nextValues)
    setFiles([])
  }, [cafe])

  // Sync provinceCode when cafe data or provinces list becomes available
  useEffect(() => {
    if (!provinces.length) return
    const cityName = cafe?.city ?? defaultValues.city
    const match = provinces.find((p) => p.name === cityName)
    setProvinceCode(match?.code ?? null)
  }, [cafe?.id, provinces])

  const selectedFileLabel = useMemo(() => {
    if (files.length === 0) return "Chưa chọn ảnh"
    return `${files.length} ảnh đã chọn`
  }, [files.length])

  const isDirty = useMemo(() => {
    if (files.length > 0) return true
    if (coverFile !== null) return true
    return (Object.keys(values) as Array<keyof ProviderCafeFormValues>).some((key) => {
      const a = values[key]
      const b = snap[key]
      if (Array.isArray(a) && Array.isArray(b)) {
        return JSON.stringify([...a].sort()) !== JSON.stringify([...b].sort())
      }
      if (a !== null && b !== null && typeof a === "object" && typeof b === "object") {
        return JSON.stringify(a) !== JSON.stringify(b)
      }
      return a !== b
    })
  }, [values, snap, files])

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    const body: ProviderCafeFormValues = {
      ...values,
      description: values.description?.trim() ? values.description.trim() : null,
      phone: values.phone?.trim() ? values.phone.trim() : null,
      cover_image_url: values.cover_image_url?.trim() ? values.cover_image_url.trim() : null,
      latitude: values.latitude === null || Number.isNaN(values.latitude) ? null : Number(values.latitude),
      longitude: values.longitude === null || Number.isNaN(values.longitude) ? null : Number(values.longitude),
    }
    await onSubmit(body, files, coverFile)
    setFiles([])
    setCoverFile(null)
  }

  const setField = <K extends keyof ProviderCafeFormValues>(field: K, value: ProviderCafeFormValues[K]) => {
    setValues((current) => ({ ...current, [field]: value }))
  }

  const toggleTrack = (trackType: TrackType, checked: boolean) => {
    setValues((current) => {
      const next = checked
        ? Array.from(new Set([...current.track_types, trackType]))
        : current.track_types.filter((item) => item !== trackType)
      return { ...current, track_types: next.length > 0 ? next : current.track_types }
    })
  }

  return (
    <form onSubmit={handleSubmit} className="rounded-xl border border-[#c4c7c8] bg-white">
      <div className="border-b border-[#e5e2e1] px-5 py-4">
        <h3 className="text-xl font-bold text-[#1c1b1b]">{cafe ? "Cập nhật cơ sở" : "Thêm cơ sở"}</h3>
        {/* <p className="mt-1 text-sm font-medium text-[#444748]">Quản lý dữ liệu cơ sở trực tiếp trên trang, không dùng popup.</p> */}
      </div>

      <div className="grid gap-5 p-5 lg:grid-cols-[minmax(0,1fr)_320px]">
        <div className="space-y-4">
          <div className="grid gap-3 sm:grid-cols-2">
            <TextField label="Tên cơ sở" value={values.name} onChange={(value) => setField("name", value)} required minLength={2} maxLength={255} />
            <TextField label="Số điện thoại" value={values.phone ?? ""} onChange={(value) => setField("phone", value)} minLength={9} maxLength={20} />

            <label className="block space-y-2">
              <span className="flex items-center gap-1.5 text-sm font-bold text-[#1c1b1b]">
                Tỉnh / Thành phố
                {loadingProvinces && <Loader2 className="size-3 animate-spin text-[#747878]" />}
              </span>
              <select
                required
                value={values.city}
                onChange={(e) => {
                  const name = e.target.value
                  const province = provinces.find((p) => p.name === name)
                  setField("city", name)
                  setField("district", "")
                  setProvinceCode(province?.code ?? null)
                }}
                className="w-full rounded-lg border border-[#c4c7c8] bg-white px-3 py-2 text-sm font-medium text-[#1c1b1b] outline-none focus:border-orange-400 focus:ring-1 focus:ring-orange-200 disabled:opacity-50"
                disabled={loadingProvinces}
              >
                <option value="">— Chọn tỉnh/thành —</option>
                {/* Preserve existing value if not in list (old data) */}
                {values.city && !provinces.some((p) => p.name === values.city) && (
                  <option value={values.city}>{values.city}</option>
                )}
                {provinces.map((p) => (
                  <option key={p.code} value={p.name}>{p.name}</option>
                ))}
              </select>
            </label>

            <label className="block space-y-2">
              <span className="flex items-center gap-1.5 text-sm font-bold text-[#1c1b1b]">
                Phường / Xã
                {loadingWards && <Loader2 className="size-3 animate-spin text-[#747878]" />}
              </span>
              <select
                required
                value={values.district}
                onChange={(e) => setField("district", e.target.value)}
                disabled={!provinceCode || loadingWards}
                className="w-full rounded-lg border border-[#c4c7c8] bg-white px-3 py-2 text-sm font-medium text-[#1c1b1b] outline-none focus:border-orange-400 focus:ring-1 focus:ring-orange-200 disabled:opacity-50"
              >
                <option value="">— Chọn phường/xã —</option>
                {/* Preserve existing value if not in list (old data) */}
                {values.district && !wards.some((w) => w.name === values.district) && (
                  <option value={values.district}>{values.district}</option>
                )}
                {wards.map((w) => (
                  <option key={w.code} value={w.name}>{w.name}</option>
                ))}
              </select>
            </label>
          </div>

          <TextField label="Địa chỉ cụ thể:" value={values.address} onChange={(value) => setField("address", value)} required />

          <label className="block space-y-2">
            <span className="text-sm font-bold text-[#1c1b1b]">Mô tả:</span>
            <Textarea
              value={values.description ?? ""}
              onChange={(event) => setField("description", event.target.value)}
              className="min-h-24 rounded-lg border-[#c4c7c8]"
              placeholder="Mô tả đường đua, tiện ích, quy định cơ sở..."
            />
          </label>

          <div className="rounded-lg border border-[#e5e2e1] p-3">
            <div className="mb-2 text-sm font-bold text-[#1c1b1b]">Vị trí địa lý</div>
            <div className="flex items-center gap-3">
              <div className="flex-1 rounded-lg border border-[#c4c7c8] bg-[#f6f3f2] px-3 py-2 text-sm font-medium text-[#444748]">
                {values.latitude != null && values.longitude != null
                  ? `${Number(values.latitude).toFixed(7)}, ${Number(values.longitude).toFixed(7)}`
                  : <span className="text-[#747878]">Chưa chọn vị trí</span>}
              </div>
              <Button
                type="button"
                variant="outline"
                className="h-9 gap-2 rounded-lg border-[#c4c7c8] text-sm"
                onClick={() => setMapOpen(true)}
              >
                <MapPin className="size-4 text-orange-600" />
                Chọn trên bản đồ
              </Button>
            </div>
          </div>

          <LocationPickerDialog
            open={mapOpen}
            onOpenChange={setMapOpen}
            initialLat={values.latitude}
            initialLng={values.longitude}
            onConfirm={(lat, lng) => {
              setField("latitude", lat)
              setField("longitude", lng)
            }}
          />

          <div className="grid gap-3 sm:grid-cols-2">
            <NumberField label="Phí slot (VNĐ)" value={values.slot_fee_rate} onChange={(value) => setField("slot_fee_rate", value ?? 0)} min={0} formatted />
            <NumberField label="Thời lượng slot (phút)" value={values.slot_duration_minutes} onChange={(value) => setField("slot_duration_minutes", value ?? 60)} min={1} max={1440} />
            <NumberField label="Booking đồng thời tối đa" value={values.max_concurrent_bookings} onChange={(value) => setField("max_concurrent_bookings", value ?? 1)} min={1} />
            <NumberField label="Báo trước (phút)" value={values.min_booking_notice_minutes} onChange={(value) => setField("min_booking_notice_minutes", value ?? 0)} min={0} />
            <NumberField label="Sức chứa BYOC (xe)" value={values.byoc_capacity} onChange={(value) => setField("byoc_capacity", value ?? 0)} min={0} />
          </div>

          <div className="rounded-lg border border-[#e5e2e1] p-3">
            <div className="mb-3 text-sm font-bold text-[#1c1b1b]">Loại track</div>
            <div className="flex flex-wrap gap-3">
              {trackOptions.map((option) => (
                <Label key={option.value} className="rounded-lg border border-[#e5e2e1] px-3 py-2">
                  <Checkbox
                    checked={values.track_types.includes(option.value)}
                    onCheckedChange={(checked) => toggleTrack(option.value, checked === true)}
                  />
                  {option.label}
                </Label>
              ))}
            </div>
          </div>

          <div className="space-y-2">
            <span className="text-sm font-bold text-[#1c1b1b]">Giờ hoạt động</span>
            <OperatingHoursField
              value={values.operating_hours}
              onChange={(updated) => setField("operating_hours", updated)}
            />
          </div>
        </div>

        <aside className="space-y-4">
          {/* Cover image */}
          <div className="rounded-xl border border-[#e5e2e1] bg-[#fcf8f8] p-4">
            <div className="mb-3 flex items-center gap-2 text-sm font-bold text-[#1c1b1b]">
              <ImageIcon className="size-4" />
              Ảnh bìa
            </div>

            {coverPreview ? (
              <div className="relative overflow-hidden rounded-lg border border-[#e5e2e1]">
                <img
                  src={coverPreview}
                  alt="Ảnh bìa"
                  className="h-36 w-full object-cover"
                  onError={(e) => { (e.target as HTMLImageElement).style.display = "none" }}
                />
                {coverFile && (
                  <div className="absolute bottom-1.5 left-1.5 rounded bg-orange-600 px-2 py-0.5 text-[10px] font-bold text-white">
                    Ảnh mới
                  </div>
                )}
              </div>
            ) : (
              <div className="flex h-36 items-center justify-center rounded-lg border border-dashed border-[#c4c7c8] bg-white">
                <span className="text-xs font-medium text-[#747878]">Chưa có ảnh bìa</span>
              </div>
            )}

            <label className="mt-3 block cursor-pointer rounded-lg border border-dashed border-[#c4c7c8] bg-white p-3 text-center text-sm font-semibold text-[#444748] hover:bg-[#f6f3f2]">
              {coverFile ? coverFile.name : "Tải ảnh bìa lên"}
              <input
                type="file"
                accept="image/jpeg,image/png,image/webp"
                className="sr-only"
                onChange={(e) => setCoverFile(e.target.files?.[0] ?? null)}
              />
            </label>
          </div>

          {/* Gallery */}
          <div className="rounded-xl border border-[#e5e2e1] bg-[#fcf8f8] p-4">
            <div className="mb-3 flex items-center gap-2 text-sm font-bold text-[#1c1b1b]">
              <ImagePlus className="size-4" />
              Ảnh gallery
            </div>
            <label className="block cursor-pointer rounded-lg border border-dashed border-[#c4c7c8] bg-white p-4 text-center text-sm font-semibold text-[#444748] hover:bg-[#f6f3f2]">
              {selectedFileLabel}
              <input
                type="file"
                accept="image/jpeg,image/png,image/webp"
                multiple
                className="sr-only"
                onChange={(event) => setFiles(Array.from(event.target.files ?? []))}
              />
            </label>
            {cafe ? (
              <div className="mt-4 space-y-2">
                <div className="text-xs font-bold uppercase tracking-wide text-[#747878]">Ảnh hiện tại</div>
                {loadingImages ? (
                  <div className="h-24 animate-pulse rounded-lg bg-[#e5e2e1]" />
                ) : images.length === 0 ? (
                  <div className="rounded-lg border border-dashed border-[#c4c7c8] p-3 text-xs font-medium text-[#747878]">Chưa có ảnh gallery.</div>
                ) : (
                  images.map((image) => (
                    <div key={image.id} className="flex items-center gap-2 rounded-lg border border-[#e5e2e1] bg-white p-2">
                      <img src={image.url} alt="" className="size-12 rounded-md object-cover" />
                      <span className="min-w-0 flex-1 truncate text-xs font-medium text-[#444748]">{image.url}</span>
                      {onDeleteImage ? (
                        <Button type="button" variant="ghost" size="icon-sm" onClick={() => void onDeleteImage(image)} className="text-red-600 hover:bg-red-50 hover:text-red-700">
                          <Trash2 className="size-4" />
                        </Button>
                      ) : null}
                    </div>
                  ))
                )}
              </div>
            ) : (
              <p className="mt-3 text-xs font-medium text-[#747878]">Ảnh sẽ được upload sau khi cơ sở được tạo thành công.</p>
            )}
          </div>
        </aside>
      </div>

      <div className="flex flex-wrap justify-end gap-3 border-t border-[#e5e2e1] px-5 py-4">
        {onCancel ? (
          <Button type="button" variant="outline" onClick={onCancel} disabled={isPending}>
            Hủy
          </Button>
        ) : null}
        <Button type="submit" disabled={isPending || values.track_types.length === 0 || (cafe !== null && !isDirty)} className="bg-[#1c1b1b] text-white hover:bg-[#313030]">
          {isPending ? "Đang lưu..." : submitLabel ?? (cafe ? "Lưu thay đổi" : "Tạo cơ sở")}
        </Button>
      </div>
    </form>
  )
}

function OperatingHoursField({
  value,
  onChange,
}: {
  value: CafeOperatingHours
  onChange: (updated: CafeOperatingHours) => void
}) {
  const setDay = (day: string, patch: Partial<CafeOperatingHour>) => {
    onChange({ ...value, [day]: { ...value[day], ...patch } })
  }

  return (
    <div className="overflow-hidden rounded-lg border border-[#e5e2e1]">
      <div className="grid grid-cols-[100px_1fr_1fr_40px] gap-0 border-b border-[#e5e2e1] bg-[#f6f3f2] px-3 py-2">
        <span className="font-mono text-[10px] font-medium uppercase tracking-widest text-[#747878]">Ngày</span>
        <span className="font-mono text-[10px] font-medium uppercase tracking-widest text-[#747878]">Mở cửa</span>
        <span className="font-mono text-[10px] font-medium uppercase tracking-widest text-[#747878]">Đóng cửa</span>
        <span className="font-mono text-[10px] font-medium uppercase tracking-widest text-[#747878]">Nghỉ</span>
      </div>
      {dayKeys.map((day) => {
        const h = value[day] ?? { open: "09:00", close: "22:00", is_closed: false }
        const isClosed = h.is_closed ?? false
        return (
          <div
            key={day}
            className={cn(
              "grid grid-cols-[100px_1fr_1fr_40px] items-center gap-3 border-b border-[#e5e2e1] px-3 py-2 last:border-0 hover:bg-[#fcf8f8]",
              isClosed && "opacity-50"
            )}
          >
            <span className="text-sm font-semibold text-[#1c1b1b]">{dayLabels[day]}</span>
            <Input
              type="time"
              value={h.open ?? "09:00"}
              disabled={isClosed}
              onChange={(e) => setDay(day, { open: e.target.value })}
              className="h-8 rounded-lg border-[#c4c7c8] text-sm"
            />
            <Input
              type="time"
              value={h.close ?? "22:00"}
              disabled={isClosed}
              onChange={(e) => setDay(day, { close: e.target.value })}
              className="h-8 rounded-lg border-[#c4c7c8] text-sm"
            />
            <Checkbox
              checked={isClosed}
              onCheckedChange={(checked) => setDay(day, { is_closed: checked === true })}
              title="Đóng cửa ngày này"
            />
          </div>
        )
      })}
    </div>
  )
}

function TextField({
  label,
  value,
  onChange,
  type = "text",
  required = false,
  minLength,
  maxLength,
}: {
  label: string
  value: string
  onChange: (value: string) => void
  type?: string
  required?: boolean
  minLength?: number
  maxLength?: number
}) {
  return (
    <label className="block space-y-2">
      <span className="text-sm font-bold text-[#1c1b1b]">{label}</span>
      <Input type={type} value={value} onChange={(event) => onChange(event.target.value)} required={required} minLength={minLength} maxLength={maxLength} className="rounded-lg border-[#c4c7c8]" />
    </label>
  )
}

function NumberField({
  label,
  value,
  onChange,
  min,
  max,
  step = "1",
  formatted = false,
}: {
  label: string
  value: number | ""
  onChange: (value: number | null) => void
  min?: number
  max?: number
  step?: string
  formatted?: boolean
}) {
  if (formatted) {
    const display = value === "" ? "" : Number(value).toLocaleString("vi-VN")
    return (
      <label className="block space-y-2">
        <span className="text-sm font-bold text-[#1c1b1b]">{label}</span>
        <Input
          type="text"
          inputMode="numeric"
          value={display}
          onChange={(e) => {
            const digits = e.target.value.replace(/\D/g, "")
            onChange(digits === "" ? null : Number(digits))
          }}
          className="rounded-lg border-[#c4c7c8]"
        />
      </label>
    )
  }

  return (
    <label className="block space-y-2">
      <span className="text-sm font-bold text-[#1c1b1b]">{label}</span>
      <Input
        type="number"
        value={value}
        min={min}
        max={max}
        step={step}
        onChange={(event) => onChange(event.target.value === "" ? null : Number(event.target.value))}
        className="rounded-lg border-[#c4c7c8]"
      />
    </label>
  )
}
