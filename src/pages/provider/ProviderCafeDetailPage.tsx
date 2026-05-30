import { useQuery } from "@tanstack/react-query"
import { useParams } from "react-router"
import { BarChart3, Car, CheckCircle2, Clock3, Image, MapPin, Settings, TrendingUp } from "lucide-react"

import { MetricCard, Panel, PanelTitle, ProviderHeader, ProviderTable, StatusBadge } from "@/pages/provider/components/ProviderPrimitives"
import { ProviderShell } from "@/pages/provider/components/ProviderShell"
import { cafeApi, cafeQueryKeys } from "@/features/cafes/api/cafe.api"
import { CAFE_PLACEHOLDER_IMAGE, formatTrackType, getCafeSlotFeeRate } from "@/features/cafes/lib/cafe.mappers"
import { formatCurrency } from "@/shared/lib/format"

export function ProviderCafeDetailPage() {
  const { cafeId } = useParams()
  const { data: cafe, isLoading, isError, refetch } = useQuery({
    queryKey: cafeQueryKeys.detail(cafeId),
    queryFn: () => cafeApi.getCafe(cafeId!),
    enabled: !!cafeId,
  })
  const { data: images = [] } = useQuery({
    queryKey: cafeQueryKeys.images(cafeId),
    queryFn: () => cafeApi.listCafeImages(cafeId!),
    enabled: !!cafeId,
  })

  if (isLoading) {
    return (
      <ProviderShell>
        <div className="space-y-4 p-6">
          <div className="h-28 animate-pulse rounded-xl bg-[#f6f3f2]" />
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-4">
            {Array.from({ length: 4 }).map((_, index) => <div key={index} className="h-44 animate-pulse rounded-xl bg-[#f6f3f2]" />)}
          </div>
        </div>
      </ProviderShell>
    )
  }

  if (isError || !cafe) {
    return (
      <ProviderShell>
        <div className="p-6">
          <button type="button" onClick={() => void refetch()} className="rounded-lg border border-[#c4c7c8] px-4 py-2 text-sm font-semibold text-[#1c1b1b]">
            Tải lại dữ liệu cơ sở
          </button>
        </div>
      </ProviderShell>
    )
  }

  const slotFeeRate = getCafeSlotFeeRate(cafe)
  const imageUrls = images.map((item) => item.url)

  return (
    <ProviderShell>
      <ProviderHeader title={cafe.name} description={`${cafe.district}, ${cafe.city}. Theo dõi cấu hình và trạng thái cơ sở.`} actionLabel="Cập nhật cơ sở" actionIcon={<Settings className="size-5" />} />

      <section className="grid grid-cols-1 gap-4 sm:grid-cols-4">
        <MetricCard label="Doanh thu tháng" value="--" helper="Chưa có API doanh thu" icon={<BarChart3 />} tone="neutral" />
        <MetricCard label="Tỷ lệ lấp đầy" value="--" helper="Chưa có API vận hành" icon={<TrendingUp />} tone="neutral" />
        <MetricCard label="Đội xe" value="--" helper="Chưa có API xe theo cơ sở" icon={<Car />} tone="neutral" />
        <MetricCard label="Trạng thái" value={formatCafeStatus(cafe.status)} helper="Theo dữ liệu backend" icon={<CheckCircle2 />} tone={cafe.status === "SUSPENDED" ? "warning" : "success"} />
      </section>

      <section className="mt-4 grid grid-cols-1 gap-4 xl:grid-cols-12">
        <Panel className="xl:col-span-7">
          <PanelTitle title="Thông tin cơ sở" subtitle="Dữ liệu cấu hình lấy trực tiếp từ backend" />
          <ProviderTable
            columns={["Trường", "Giá trị", "Trạng thái"]}
            rows={[
              ["Địa chỉ", cafe.address, <StatusBadge key="address" status="Đã cập nhật" />],
              ["Loại track", cafe.trackTypes.map(formatTrackType).join(", ") || "--", <StatusBadge key="track" status={cafe.trackTypes.length > 0 ? "Đã cập nhật" : "Cần bổ sung"} />],
              ["Phí slot", slotFeeRate > 0 ? formatCurrency(slotFeeRate) : "--", <StatusBadge key="fee" status={slotFeeRate > 0 ? "Đã cập nhật" : "Cần bổ sung"} />],
              ["Thời lượng slot", `${cafe.slotDurationMinutes} phút`, <StatusBadge key="duration" status="Đã cập nhật" />],
              ["Sức chứa BYOC", `${cafe.byocCapacity}`, <StatusBadge key="capacity" status="Đã cập nhật" />],
            ]}
          />
        </Panel>

        <Panel className="xl:col-span-5">
          <PanelTitle title="Ảnh cơ sở" subtitle="Gallery từ cafe image API" />
          <div className="space-y-3">
            {[cafe.coverImageUrl ?? CAFE_PLACEHOLDER_IMAGE, ...imageUrls].filter(Boolean).slice(0, 5).map((url, index) => (
              <div key={`${url}-${index}`} className="overflow-hidden rounded-lg border border-[#e5e2e1]">
                <img src={url} alt={`${cafe.name} ${index + 1}`} className="h-36 w-full object-cover" />
              </div>
            ))}
            <div className="grid grid-cols-1 gap-2 text-xs font-semibold text-[#444748]">
              <span className="flex items-center gap-2"><MapPin className="size-4" /> {cafe.address}</span>
              <span className="flex items-center gap-2"><Clock3 className="size-4" /> Thông báo trước {cafe.minBookingNoticeMinutes} phút</span>
              <span className="flex items-center gap-2"><Image className="size-4" /> {images.length} ảnh gallery</span>
            </div>
          </div>
        </Panel>
      </section>
    </ProviderShell>
  )
}

function formatCafeStatus(status: string) {
  if (status === "ACTIVE") return "Hoạt động"
  if (status === "PENDING") return "Chờ duyệt"
  return "Tạm ngưng"
}
