import { useRef, useState } from "react"
import { ImagePlus, PlusCircle, ToggleLeft, ToggleRight, Upload } from "lucide-react"
import { trackTypeApi } from "@/features/cafes/api/cafe.api"
import {
  useTrackConfigs,
  useCreateTrackConfig,
  useUpdateTrackConfig,
  useUploadTrackConfigImages,
} from "@/features/cafes/hooks/useTrackConfigs"
import type { TrackConfig, CreateTrackConfigBody } from "@/features/cafes/types"
import { Button } from "@/shared/ui/button"
import { Input } from "@/shared/ui/input"
import { Label } from "@/shared/ui/label"
import { Textarea } from "@/shared/ui/textarea"
import { Badge } from "@/shared/ui/badge"
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/shared/ui/dialog"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/shared/ui/alert-dialog"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/shared/ui/select"
import { useQuery } from "@tanstack/react-query"
import { trackTypeQueryKeys } from "@/features/cafes/api/cafe.api"

interface TrackConfigManagerProps {
  cafeId: string
}

export function TrackConfigManager({ cafeId }: TrackConfigManagerProps) {
  const { data: configs = [], isLoading } = useTrackConfigs(cafeId)
  const { data: trackTypes = [], isLoading: trackTypesLoading } = useQuery({
    queryKey: trackTypeQueryKeys.all,
    queryFn: () => trackTypeApi.listAll(),
  })

  const createMutation = useCreateTrackConfig(cafeId)
  const updateMutation = useUpdateTrackConfig(cafeId)
  const uploadMutation = useUploadTrackConfigImages(cafeId)

  const [showCreateDialog, setShowCreateDialog] = useState(false)
  const [deactivatingConfig, setDeactivatingConfig] = useState<TrackConfig | null>(null)
  const [uploadingConfigId, setUploadingConfigId] = useState<string | null>(null)

  const [form, setForm] = useState<{ track_type_id: string; byoc_capacity: string; description: string; sort_order: string }>({
    track_type_id: "",
    byoc_capacity: "1",
    description: "",
    sort_order: "0",
  })

  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleCreate = async () => {
    if (!form.track_type_id || !form.byoc_capacity) return
    const body: CreateTrackConfigBody = {
      track_type_id: form.track_type_id,
      byoc_capacity: Number(form.byoc_capacity),
      description: form.description || undefined,
      sort_order: Number(form.sort_order),
    }
    await createMutation.mutateAsync(body)
    setShowCreateDialog(false)
    setForm({ track_type_id: "", byoc_capacity: "1", description: "", sort_order: "0" })
  }

  const handleToggleActive = (config: TrackConfig) => {
    if (config.is_active) {
      setDeactivatingConfig(config)
    } else {
      updateMutation.mutate({ configId: config.id, body: { is_active: true } })
    }
  }

  const handleConfirmDeactivate = () => {
    if (!deactivatingConfig) return
    updateMutation.mutate({ configId: deactivatingConfig.id, body: { is_active: false } })
    setDeactivatingConfig(null)
  }

  const handleUploadClick = (configId: string) => {
    setUploadingConfigId(configId)
    fileInputRef.current?.click()
  }

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!uploadingConfigId || !e.target.files?.length) return
    const files = Array.from(e.target.files)
    await uploadMutation.mutateAsync({ configId: uploadingConfigId, files })
    e.target.value = ""
    setUploadingConfigId(null)
  }

  if (isLoading) {
    return (
      <div className="space-y-3">
        {Array.from({ length: 2 }).map((_, i) => (
          <div key={i} className="h-24 animate-pulse rounded-xl bg-[#f6f3f2]" />
        ))}
      </div>
    )
  }

  const usedTrackTypeIds = new Set(configs.map((c) => c.track_type_id))
  const availableTrackTypes = trackTypes.filter((tt) => !usedTrackTypeIds.has(tt.id))

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-sm font-bold text-[#1c1b1b]">Loại sân</h3>
          <p className="text-xs text-[#747878]">Cấu hình loại sân và BYOC capacity cho chi nhánh</p>
        </div>
        <Button
          type="button"
          size="sm"
          onClick={() => setShowCreateDialog(true)}
          className="h-8 gap-1.5 rounded-lg font-bold text-xs"
        >
          <PlusCircle className="size-3.5" />
          Thêm loại sân
        </Button>
      </div>

      {configs.length === 0 ? (
        <div className="rounded-xl border border-dashed border-[#c4c7c8] bg-[#fafafa] p-8 text-center">
          <ImagePlus className="mx-auto mb-2 size-8 text-[#c4c7c8]" />
          <p className="text-sm font-medium text-[#747878]">Chưa có loại sân nào</p>
          <p className="mt-1 text-xs text-[#747878]">Thêm loại sân để customer có thể chọn khi đặt lịch</p>
        </div>
      ) : (
        <div className="space-y-3">
          {configs.map((config) => (
            <TrackConfigCard
              key={config.id}
              config={config}
              onToggleActive={() => handleToggleActive(config)}
              onUploadImages={() => handleUploadClick(config.id)}
              isToggling={updateMutation.isPending}
              isUploading={uploadMutation.isPending && uploadingConfigId === config.id}
            />
          ))}
        </div>
      )}

      <input
        ref={fileInputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp"
        multiple
        className="hidden"
        onChange={(e) => void handleFileChange(e)}
      />

      {/* Create dialog */}
      <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="font-bold">Thêm loại sân mới</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="track-type" className="text-sm font-bold">Loại sân</Label>
              {trackTypesLoading ? (
                <div className="h-10 animate-pulse rounded-md bg-[#f6f3f2]" />
              ) : availableTrackTypes.length === 0 ? (
                <p className="rounded-md border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-800">
                  {trackTypes.length === 0
                    ? "Admin chưa tạo loại sân nào trong hệ thống."
                    : "Tất cả loại sân đã được cấu hình cho chi nhánh này."}
                </p>
              ) : (
                <Select value={form.track_type_id} onValueChange={(v) => setForm((f) => ({ ...f, track_type_id: v }))}>
                  <SelectTrigger id="track-type" className="h-10">
                    <SelectValue placeholder="Chọn loại sân" />
                  </SelectTrigger>
                  <SelectContent>
                    {availableTrackTypes.map((tt) => (
                      <SelectItem key={tt.id} value={tt.id}>{tt.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="byoc-capacity" className="text-sm font-bold">BYOC Capacity (số xe cùng lúc)</Label>
              <Input
                id="byoc-capacity"
                type="number"
                min={1}
                value={form.byoc_capacity}
                onChange={(e) => setForm((f) => ({ ...f, byoc_capacity: e.target.value }))}
                className="h-10"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="description" className="text-sm font-bold">Mô tả (tuỳ chọn)</Label>
              <Textarea
                id="description"
                rows={3}
                placeholder="Mô tả ngắn về loại sân..."
                value={form.description}
                onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="sort-order" className="text-sm font-bold">Thứ tự hiển thị</Label>
              <Input
                id="sort-order"
                type="number"
                min={0}
                value={form.sort_order}
                onChange={(e) => setForm((f) => ({ ...f, sort_order: e.target.value }))}
                className="h-10"
              />
            </div>
          </div>
          <DialogFooter className="gap-2">
            <Button type="button" variant="outline" onClick={() => setShowCreateDialog(false)} className="font-bold">
              Hủy
            </Button>
            <Button
              type="button"
              onClick={() => void handleCreate()}
              disabled={!form.track_type_id || !form.byoc_capacity || createMutation.isPending || availableTrackTypes.length === 0}
              className="font-bold"
            >
              {createMutation.isPending ? "Đang tạo..." : "Tạo loại sân"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Deactivation confirmation */}
      <AlertDialog open={!!deactivatingConfig} onOpenChange={(open) => !open && setDeactivatingConfig(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="font-bold">Tắt loại sân</AlertDialogTitle>
            <AlertDialogDescription>
              Loại sân "<strong>{deactivatingConfig?.track_type?.name}</strong>" sẽ không còn hiển thị với khách đặt lịch.
              Nếu còn booking sắp tới, hành động này sẽ bị chặn.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="font-bold">Hủy</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleConfirmDeactivate}
              className="bg-red-600 text-white font-bold hover:bg-red-700"
            >
              Tắt loại sân
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}

function TrackConfigCard({
  config,
  onToggleActive,
  onUploadImages,
  isToggling,
  isUploading,
}: {
  config: TrackConfig
  onToggleActive: () => void
  onUploadImages: () => void
  isToggling: boolean
  isUploading: boolean
}) {
  return (
    <div className={`rounded-xl border p-4 transition-colors ${config.is_active ? "border-[#c4c7c8] bg-white" : "border-[#e5e2e1] bg-[#fafafa] opacity-70"}`}>
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-sm font-bold text-[#1c1b1b]">{config.track_type?.name ?? config.track_type_id}</span>
            <Badge variant={config.is_active ? "default" : "secondary"} className="text-xs font-bold">
              {config.is_active ? "Đang hoạt động" : "Tạm tắt"}
            </Badge>
          </div>
          <div className="mt-1 flex flex-wrap gap-3 text-xs text-[#747878]">
            <span>BYOC: {config.byoc_capacity} xe</span>
            <span>{config.images.length} ảnh</span>
            {config.description && <span className="truncate max-w-[200px]">{config.description}</span>}
          </div>
        </div>
        <div className="flex shrink-0 items-center gap-2">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={onUploadImages}
            disabled={isUploading}
            className="h-8 gap-1.5 rounded-lg border-[#c4c7c8] text-xs font-bold"
          >
            <Upload className="size-3.5" />
            {isUploading ? "Đang upload..." : "Upload ảnh"}
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={onToggleActive}
            disabled={isToggling}
            className="h-8 gap-1.5 rounded-lg text-xs font-bold"
          >
            {config.is_active ? (
              <><ToggleRight className="size-4 text-orange-600" /> Tắt</>
            ) : (
              <><ToggleLeft className="size-4 text-[#747878]" /> Bật</>
            )}
          </Button>
        </div>
      </div>

      {config.images.length > 0 && (
        <div className="mt-3 flex gap-2 overflow-x-auto pb-1">
          {config.images.slice(0, 6).map((url, i) => (
            <img
              key={i}
              src={url}
              alt={`Ảnh sân ${i + 1}`}
              className="h-16 w-16 shrink-0 rounded-lg object-cover"
            />
          ))}
          {config.images.length > 6 && (
            <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-lg bg-[#f6f3f2] text-xs font-bold text-[#747878]">
              +{config.images.length - 6}
            </div>
          )}
        </div>
      )}
    </div>
  )
}
