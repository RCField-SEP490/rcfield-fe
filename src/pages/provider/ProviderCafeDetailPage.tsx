import { useState } from "react"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { ArrowLeft, BarChart3, Bot, Car, CheckCircle2, Power, ShieldAlert, TrendingUp } from "lucide-react"
import { useNavigate, useParams } from "react-router"
import { toast } from "sonner"

import { routePaths } from "@/app/router/route-paths"
import { cafeApi, cafeQueryKeys } from "@/features/cafes/api/cafe.api"
import type { BackendCafe, CafeImage, CafeStatus, CafeUpsertBody } from "@/features/cafes/types"
import { ProviderCafeForm } from "@/pages/provider/components/ProviderCafeForm"
import { WidgetConfigForm } from "@/pages/provider/components/WidgetConfigForm"
import { KbDocumentsSection } from "@/pages/provider/components/KbDocumentsSection"
import { MetricCard, ProviderPageHeader, StatusBadge } from "@/pages/provider/components/ProviderPrimitives"
import { ProviderShell } from "@/pages/provider/components/ProviderShell"
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

  const { data: cafe, isLoading, isError, refetch } = useQuery({
    queryKey: cafeQueryKeys.detail(cafeId),
    queryFn: () => cafeApi.getCafe(cafeId!),
    enabled: !!cafeId,
  })

  const saveMutation = useMutation({
    mutationFn: async ({ values, files, coverFile }: { values: CafeUpsertBody; files: File[]; coverFile: File | null }) => {
      let finalValues = values
      if (coverFile) {
        const [uploaded] = await cafeApi.uploadCafeImages(cafeId!, [coverFile])
        finalValues = { ...values, cover_image_url: uploaded.url }
      }
      const savedCafe = await cafeApi.updateCafe(cafeId!, finalValues)
      if (files.length > 0) {
        await cafeApi.uploadCafeImages(savedCafe.id, files)
      }
      return savedCafe
    },
    onSuccess: async (savedCafe) => {
      await invalidateCafeQueries(queryClient, savedCafe.id)
      toast.success("Đã cập nhật cơ sở", { description: savedCafe.name })
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

  const [tab, setTab] = useState<"info" | "widget">("info")

  if (isLoading) {
    return (
      <ProviderShell>
        <div className="space-y-4 p-6">
          <div className="h-28 animate-pulse rounded-xl bg-[#f6f3f2]" />
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-4">
            {Array.from({ length: 4 }).map((_, index) => (
              <div key={index} className="h-44 animate-pulse rounded-xl bg-[#f6f3f2]" />
            ))}
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
          <MetricCard
            label="Trạng thái"
            value={formatCafeStatus(cafe.status)}
            helper="Theo dữ liệu backend"
            icon={<CheckCircle2 />}
            tone={cafe.status === "SUSPENDED" || cafe.status === "PENDING" ? "warning" : "success"}
          />
        </section>

        <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-[#c4c7c8] bg-white px-5 py-4">
          <div className="flex items-center gap-3">
            <StatusBadge status={formatCafeStatus(cafe.status)} />
            {cafe.status === "PENDING" ? (
              <span className="text-xs font-semibold text-amber-700">Cơ sở đang chờ admin duyệt — chưa thể thay đổi trạng thái</span>
            ) : (
              <span className="text-sm font-medium text-[#444748]">Trạng thái vận hành hiện tại</span>
            )}
          </div>
          <StatusConfirmAction
            cafe={cafe}
            nextStatus={nextStatus}
            disabled={!canProviderToggle || statusMutation.isPending}
            onConfirm={() => statusMutation.mutate({ cafe, status: nextStatus })}
          />
        </div>

        <div>
          <div className="flex border-b border-[#e5e2e1]">
            <button
              type="button"
              onClick={() => setTab("info")}
              className={`flex items-center gap-2 border-b-2 px-4 py-3 text-sm font-semibold transition-colors ${
                tab === "info"
                  ? "border-orange-600 text-orange-600"
                  : "border-transparent text-[#747878]"
              }`}
            >
              Thông tin cơ sở
            </button>
            <button
              type="button"
              onClick={() => setTab("widget")}
              className={`flex items-center gap-2 border-b-2 px-4 py-3 text-sm font-semibold transition-colors ${
                tab === "widget"
                  ? "border-orange-600 text-orange-600"
                  : "border-transparent text-[#747878]"
              }`}
            >
              Widget Chat
            </button>
          </div>

          <div className="mt-4">
            {tab === "info" && (
              <ProviderCafeForm
                cafe={cafe}
                isPending={saveMutation.isPending}
                submitLabel="Lưu thay đổi"
                onSubmit={async (values, files, coverFile) => {
                  await saveMutation.mutateAsync({ values, files, coverFile })
                }}
                onDeleteImage={async (image) => {
                  await deleteImageMutation.mutateAsync(image)
                }}
              />
            )}
            {tab === "widget" && (
              <div className="space-y-4">
                <section className="rounded-xl border border-[#c4c7c8] bg-white">
                  <WidgetConfigForm cafeId={cafe.id} />
                </section>
                <section className="rounded-xl border border-[#c4c7c8] bg-white">
                  <KbDocumentsSection cafeId={cafe.id} />
                </section>
              </div>
            )}
          </div>
        </div>
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
          className="h-9 gap-2 rounded-lg border-[#c4c7c8] text-sm"
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
