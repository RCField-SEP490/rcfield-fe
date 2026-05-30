import { useState } from "react"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { AlertTriangle, Building2, Plus, TrendingUp } from "lucide-react"
import { toast } from "sonner"

import { cafeApi, cafeQueryKeys } from "@/features/cafes/api/cafe.api"
import type { BackendCafe, CafeImage, CafeStatus, CafeUpsertBody } from "@/features/cafes/types"
import { BranchList, MetricCard, Panel, PanelTitle, ProviderHeader } from "@/pages/provider/components/ProviderPrimitives"
import { ProviderCafeFormDialog } from "@/pages/provider/components/ProviderCafeFormDialog"
import { ProviderShell } from "@/pages/provider/components/ProviderShell"

export function ProviderCafesPage() {
  const queryClient = useQueryClient()
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editingCafe, setEditingCafe] = useState<BackendCafe | null>(null)

  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: cafeQueryKeys.list({ page: 1, limit: 100 }),
    queryFn: () => cafeApi.listCafes({ page: 1, limit: 100 }),
  })
  const cafes = data?.data ?? []
  const activeCount = cafes.filter((cafe) => cafe.status === "ACTIVE").length
  const pendingCount = cafes.filter((cafe) => cafe.status === "PENDING").length
  const suspendedCount = cafes.filter((cafe) => cafe.status === "SUSPENDED").length

  const saveMutation = useMutation({
    mutationFn: async ({ values, files, cafe }: { values: CafeUpsertBody; files: File[]; cafe: BackendCafe | null }) => {
      debugProviderCafe("save start", { mode: cafe ? "update" : "create", cafeId: cafe?.id, files: files.length })
      const savedCafe = cafe ? await cafeApi.updateCafe(cafe.id, values) : await cafeApi.createCafe(values)
      if (files.length > 0) {
        await cafeApi.uploadCafeImages(savedCafe.id, files)
      }
      debugProviderCafe("save success", { cafeId: savedCafe.id, status: savedCafe.status })
      return savedCafe
    },
    onSuccess: async (savedCafe) => {
      await invalidateCafeQueries(queryClient, savedCafe.id)
      toast.success(editingCafe ? "Đã cập nhật cơ sở" : "Đã tạo cơ sở", {
        description: savedCafe.name,
      })
      setDialogOpen(false)
      setEditingCafe(null)
    },
    onError: (error) => {
      debugProviderCafe("save failed", error)
      toast.error("Không thể lưu cơ sở", {
        description: "Vui lòng kiểm tra dữ liệu nhập và trạng thái tài khoản provider.",
      })
    },
  })

  const statusMutation = useMutation({
    mutationFn: ({ cafe, status }: { cafe: BackendCafe; status: CafeStatus }) => {
      debugProviderCafe("status update", { cafeId: cafe.id, from: cafe.status, to: status })
      return cafeApi.updateCafeStatus(cafe.id, status)
    },
    onSuccess: async (savedCafe) => {
      await invalidateCafeQueries(queryClient, savedCafe.id)
      toast.success("Đã cập nhật trạng thái cơ sở", { description: savedCafe.name })
    },
    onError: (error) => {
      debugProviderCafe("status update failed", error)
      toast.error("Không thể cập nhật trạng thái cơ sở")
    },
  })

  const deleteImageMutation = useMutation({
    mutationFn: async (image: CafeImage) => {
      debugProviderCafe("delete image", { imageId: image.id, cafeId: image.cafeId })
      await cafeApi.deleteCafeImage(image.id)
      return image
    },
    onSuccess: async (image) => {
      await queryClient.invalidateQueries({ queryKey: cafeQueryKeys.images(image.cafeId) })
      toast.success("Đã xóa ảnh cơ sở")
    },
    onError: (error) => {
      debugProviderCafe("delete image failed", error)
      toast.error("Không thể xóa ảnh cơ sở")
    },
  })

  const handleOpenCreate = () => {
    setEditingCafe(null)
    setDialogOpen(true)
  }

  const handleOpenEdit = (cafe: BackendCafe) => {
    setEditingCafe(cafe)
    setDialogOpen(true)
  }

  const handleToggleStatus = (cafe: BackendCafe) => {
    const nextStatus: CafeStatus = cafe.status === "SUSPENDED" ? "ACTIVE" : "SUSPENDED"
    statusMutation.mutate({ cafe, status: nextStatus })
  }

  return (
    <ProviderShell>
      <ProviderHeader
        title="Quản lý cơ sở"
        description="Tạo, cập nhật và kiểm soát trạng thái các cơ sở xe RC thuộc provider của bạn."
        actionLabel="Thêm cơ sở"
        actionIcon={<Plus className="size-5" />}
        onAction={handleOpenCreate}
      />
      <section className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <MetricCard label="Cơ sở hoạt động" value={`${activeCount}/${cafes.length}`} helper={`${pendingCount} chờ duyệt`} icon={<Building2 />} tone="success" />
        <MetricCard label="Tỷ lệ lấp đầy TB" value="--" helper="Chưa có API vận hành" icon={<TrendingUp />} tone="neutral" />
        <MetricCard label="Cảnh báo vận hành" value={`${suspendedCount}`} helper="Cơ sở đang tạm ngưng" icon={<AlertTriangle />} tone={suspendedCount > 0 ? "warning" : "success"} />
      </section>
      <Panel className="mt-4">
        <PanelTitle title="Danh sách cơ sở" subtitle="Sắp xếp theo doanh thu tháng hiện tại" />
        {isLoading ? (
          <div className="space-y-3">
            {Array.from({ length: 3 }).map((_, index) => (
              <div key={index} className="h-32 animate-pulse rounded-lg bg-[#f6f3f2]" />
            ))}
          </div>
        ) : isError ? (
          <button type="button" onClick={() => void refetch()} className="rounded-lg border border-[#c4c7c8] px-4 py-2 text-sm font-semibold text-[#1c1b1b]">
            Tải lại danh sách cơ sở
          </button>
        ) : (
          <BranchList cafes={cafes} onEdit={handleOpenEdit} onToggleStatus={handleToggleStatus} />
        )}
      </Panel>
      <ProviderCafeFormDialog
        open={dialogOpen}
        cafe={editingCafe}
        isPending={saveMutation.isPending}
        onOpenChange={(open) => {
          setDialogOpen(open)
          if (!open) setEditingCafe(null)
        }}
        onSubmit={async (values, files) => {
          await saveMutation.mutateAsync({ values, files, cafe: editingCafe })
        }}
        onDeleteImage={async (image) => {
          await deleteImageMutation.mutateAsync(image)
        }}
      />
    </ProviderShell>
  )
}

function debugProviderCafe(message: string, details?: unknown) {
  if (import.meta.env.DEV) {
    console.debug(`[ProviderCafesPage] ${message}`, details ?? "")
  }
}

async function invalidateCafeQueries(queryClient: ReturnType<typeof useQueryClient>, cafeId: string) {
  await Promise.all([
    queryClient.invalidateQueries({ queryKey: cafeQueryKeys.all }),
    queryClient.invalidateQueries({ queryKey: cafeQueryKeys.detail(cafeId) }),
    queryClient.invalidateQueries({ queryKey: cafeQueryKeys.images(cafeId) }),
  ])
}
