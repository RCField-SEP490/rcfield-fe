import { useState } from "react"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { ArrowLeft, BarChart3, Car, CheckCircle2, Clock3, Image, MapPin, Pencil, Power, ShieldAlert, TrendingUp } from "lucide-react"
import { useNavigate, useParams } from "react-router"
import { toast } from "sonner"

import { routePaths } from "@/app/router/route-paths"
import { cafeApi, cafeQueryKeys } from "@/features/cafes/api/cafe.api"
import { CAFE_PLACEHOLDER_IMAGE, formatTrackType, getCafeSlotFeeRate } from "@/features/cafes/lib/cafe.mappers"
import type { BackendCafe, CafeImage, CafeStatus, CafeUpsertBody } from "@/features/cafes/types"
import { ProviderCafeForm } from "@/pages/provider/components/ProviderCafeForm"
import { MetricCard, Panel, PanelTitle, ProviderPageHeader, ProviderTable, StatusBadge } from "@/pages/provider/components/ProviderPrimitives"
import { ProviderShell } from "@/pages/provider/components/ProviderShell"
import { formatCurrency } from "@/shared/lib/format"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogMedia,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/shared/ui/alert-dialog"
import { Button } from "@/shared/ui/button"

export function ProviderCafeDetailPage() {
  const { cafeId } = useParams()
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const [isEditing, setIsEditing] = useState(false)

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

  const saveMutation = useMutation({
    mutationFn: async ({ values, files }: { values: CafeUpsertBody; files: File[] }) => {
      const savedCafe = await cafeApi.updateCafe(cafeId!, values)
      if (files.length > 0) {
        await cafeApi.uploadCafeImages(savedCafe.id, files)
      }
      return savedCafe
    },
    onSuccess: async (savedCafe) => {
      await invalidateCafeQueries(queryClient, savedCafe.id)
      toast.success("Đã cập nhật cơ sở", { description: savedCafe.name })
      setIsEditing(false)
    },
    onError: () => {
      toast.error("Không thể cập nhật cơ sở")
    },
  })

  const statusMutation = useMutation({
    mutationFn: ({ cafe, status }: { cafe: BackendCafe; status: CafeStatus }) => cafeApi.updateCafeStatus(cafe.id, status),
    onSuccess: async (savedCafe) => {
      await invalidateCafeQueries(queryClient, savedCafe.id)
      toast.success("Đã cập nhật trạng thái cơ sở", { description: savedCafe.name })
      setIsEditing(false)
    },
    onError: () => {
      toast.error("Không thể cập nhật trạng thái cơ sở")
    },
  })

  const deleteImageMutation = useMutation({
    mutationFn: async (image: CafeImage) => {
      await cafeApi.deleteCafeImage(image.id)
      return image
    },
    onSuccess: async (image) => {
      await queryClient.invalidateQueries({ queryKey: cafeQueryKeys.images(image.cafeId) })
      toast.success("Đã xóa ảnh cơ sở")
    },
    onError: () => {
      toast.error("Không thể xóa ảnh cơ sở")
    },
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
        <ProviderPageHeader
          title="Không tải được cơ sở"
          description="Cơ sở không tồn tại hoặc bạn không có quyền xem/cập nhật cơ sở này."
          actions={
            <Button type="button" variant="outline" onClick={() => navigate(routePaths.providerCafes)} className="h-10 gap-2 rounded-lg border-[#c4c7c8] bg-[#f1edec] text-[#1c1b1b] hover:bg-[#e5e2e1]">
              <ArrowLeft className="size-5" />
              Danh sách cơ sở
            </Button>
          }
        />
        <div className="p-6">
          <Button type="button" variant="outline" onClick={() => void refetch()}>
            Tải lại dữ liệu cơ sở
          </Button>
        </div>
      </ProviderShell>
    )
  }

  const slotFeeRate = getCafeSlotFeeRate(cafe)
  const imageUrls = images.map((item) => item.url)
  const canProviderToggle = cafe.status !== "PENDING"
  const nextStatus: CafeStatus = cafe.status === "SUSPENDED" ? "ACTIVE" : "SUSPENDED"

  return (
    <ProviderShell>
      <ProviderPageHeader
        title={cafe.name}
        description={`${cafe.district}, ${cafe.city}. Xem và cập nhật dữ liệu cơ sở trên một trang.`}
        actions={
          <Button type="button" variant="outline" onClick={() => navigate(routePaths.providerCafes)} className="h-10 gap-2 rounded-lg border-[#c4c7c8] bg-[#f1edec] text-[#1c1b1b] hover:bg-[#e5e2e1]">
            <ArrowLeft className="size-5" />
            Danh sách
          </Button>
        }
      />

      <div className="space-y-4 p-4 md:p-6">
        <section className="grid grid-cols-1 gap-4 sm:grid-cols-4">
          <MetricCard label="Doanh thu tháng" value="--" helper="Chưa có API doanh thu" icon={<BarChart3 />} tone="neutral" />
          <MetricCard label="Tỷ lệ lấp đầy" value="--" helper="Chưa có API vận hành" icon={<TrendingUp />} tone="neutral" />
          <MetricCard label="Đội xe" value="--" helper="Chưa có API xe theo cơ sở" icon={<Car />} tone="neutral" />
          <MetricCard label="Trạng thái" value={formatCafeStatus(cafe.status)} helper="Theo dữ liệu backend" icon={<CheckCircle2 />} tone={cafe.status === "SUSPENDED" || cafe.status === "PENDING" ? "warning" : "success"} />
        </section>

        <section className="grid grid-cols-1 gap-4 xl:grid-cols-12">
          <Panel className="xl:col-span-8">
            <PanelTitle title="Thông tin cơ sở" subtitle="Dữ liệu cấu hình lấy trực tiếp từ backend" />
            <ProviderTable
              columns={["Trường", "Giá trị", "Trạng thái"]}
              rows={[
                ["Địa chỉ", cafe.address, <StatusBadge key="address" status="Đã cập nhật" />],
                ["Liên hệ", cafe.phone ?? "--", <StatusBadge key="phone" status={cafe.phone ? "Đã cập nhật" : "Cần bổ sung"} />],
                ["Mô tả", cafe.description ?? "--", <StatusBadge key="description" status={cafe.description ? "Đã cập nhật" : "Cần bổ sung"} />],
                ["Loại track", cafe.trackTypes.map(formatTrackType).join(", ") || "--", <StatusBadge key="track" status={cafe.trackTypes.length > 0 ? "Đã cập nhật" : "Cần bổ sung"} />],
                ["Phí slot", slotFeeRate > 0 ? formatCurrency(slotFeeRate) : "--", <StatusBadge key="fee" status={slotFeeRate > 0 ? "Đã cập nhật" : "Cần bổ sung"} />],
                ["Thời lượng slot", `${cafe.slotDurationMinutes} phút`, <StatusBadge key="duration" status="Đã cập nhật" />],
                ["Booking đồng thời", `${cafe.maxConcurrentBookings}`, <StatusBadge key="max" status="Đã cập nhật" />],
                ["Sức chứa BYOC", `${cafe.byocCapacity}`, <StatusBadge key="capacity" status="Đã cập nhật" />],
                ["Tọa độ", cafe.latitude && cafe.longitude ? `${cafe.latitude}, ${cafe.longitude}` : "--", <StatusBadge key="location" status={cafe.latitude && cafe.longitude ? "Đã cập nhật" : "Cần bổ sung"} />],
              ]}
            />
          </Panel>

          <div className="space-y-4 xl:col-span-4">
            <Panel>
              <PanelTitle title="Thao tác" subtitle="Cập nhật vận hành cơ sở" />
              <div className="space-y-3">
                <Button type="button" variant={isEditing ? "secondary" : "outline"} onClick={() => setIsEditing((current) => !current)} className="h-10 w-full justify-start gap-2 rounded-lg border-[#c4c7c8]">
                  <Pencil className="size-4" />
                  {isEditing ? "Đang chỉnh sửa" : "Chỉnh sửa cơ sở"}
                </Button>
                <StatusConfirmAction
                  cafe={cafe}
                  nextStatus={nextStatus}
                  disabled={!canProviderToggle || statusMutation.isPending}
                  onConfirm={() => statusMutation.mutate({ cafe, status: nextStatus })}
                />
              </div>
              {cafe.status === "PENDING" ? (
                <div className="mt-4 rounded-lg border border-amber-200 bg-amber-50 p-3 text-xs font-semibold leading-5 text-amber-800">
                  Cơ sở đang chờ admin duyệt nên provider chưa thể tự kích hoạt hoặc tạm ngưng.
                </div>
              ) : null}
            </Panel>

            <Panel>
              <PanelTitle title="Ảnh cơ sở" subtitle="Cover và gallery từ cafe image API" />
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
          </div>
        </section>

        {isEditing ? (
          <ProviderCafeForm
            cafe={cafe}
            isPending={saveMutation.isPending}
            onCancel={() => setIsEditing(false)}
            onSubmit={async (values, files) => {
              await saveMutation.mutateAsync({ values, files })
            }}
            onDeleteImage={async (image) => {
              await deleteImageMutation.mutateAsync(image)
            }}
          />
        ) : (
          <Panel>
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h3 className="text-xl font-semibold leading-tight text-[#1c1b1b]">Cấu hình chi tiết</h3>
                <p className="mt-1 text-sm font-medium text-[#444748]">Nhấn Chỉnh sửa cơ sở trong khu thao tác để cập nhật hồ sơ, giá, sức chứa và ảnh gallery.</p>
              </div>
              <Button type="button" onClick={() => setIsEditing(true)} className="h-10 gap-2 rounded-lg bg-[#1c1b1b] text-white hover:bg-[#313030]">
                <Pencil className="size-4" />
                Chỉnh sửa
              </Button>
            </div>
          </Panel>
        )}
      </div>
    </ProviderShell>
  )
}

function StatusConfirmAction({
  cafe,
  nextStatus,
  disabled,
  onConfirm,
}: {
  cafe: BackendCafe
  nextStatus: CafeStatus
  disabled: boolean
  onConfirm: () => void
}) {
  const isReactivating = nextStatus === "ACTIVE"
  const label = isReactivating ? "Kích hoạt cơ sở" : "Tạm ngưng cơ sở"
  const description = isReactivating
    ? "Cơ sở sẽ có thể quay lại trạng thái hoạt động sau khi xác nhận."
    : "Cơ sở sẽ bị tạm ngưng và provider cần kích hoạt lại trước khi vận hành tiếp."

  return (
    <AlertDialog>
      <AlertDialogTrigger asChild>
        <Button
          type="button"
          variant={isReactivating ? "outline" : "destructive"}
          disabled={disabled}
          className="h-10 w-full justify-start gap-2 rounded-lg border-[#c4c7c8]"
        >
          <Power className="size-4" />
          {cafe.status === "PENDING" ? "Chờ admin duyệt" : label}
        </Button>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogMedia className={isReactivating ? "bg-emerald-50 text-emerald-700" : "bg-red-50 text-red-700"}>
            <ShieldAlert className="size-5" />
          </AlertDialogMedia>
          <AlertDialogTitle>{label}</AlertDialogTitle>
          <AlertDialogDescription>
            Bạn có chắc chắn muốn {isReactivating ? "kích hoạt lại" : "tạm ngưng"} "{cafe.name}"? {description}
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Hủy</AlertDialogCancel>
          <AlertDialogAction variant={isReactivating ? "default" : "destructive"} onClick={onConfirm}>
            Xác nhận
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}

function formatCafeStatus(status: string) {
  if (status === "ACTIVE") return "Hoạt động"
  if (status === "PENDING") return "Chờ duyệt"
  return "Tạm ngưng"
}

async function invalidateCafeQueries(queryClient: ReturnType<typeof useQueryClient>, cafeId: string) {
  await Promise.all([
    queryClient.invalidateQueries({ queryKey: cafeQueryKeys.all }),
    queryClient.invalidateQueries({ queryKey: cafeQueryKeys.detail(cafeId) }),
    queryClient.invalidateQueries({ queryKey: cafeQueryKeys.images(cafeId) }),
  ])
}
