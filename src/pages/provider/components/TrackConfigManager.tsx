import { useRef, useState } from "react"
import { ImagePlus, PlusCircle, ToggleLeft, ToggleRight, Upload, X, Check, Pencil } from "lucide-react"
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

const EMPTY_FORM = { track_type_id: "", max_concurrent: "5", byoc_capacity: "0", description: "", sort_order: "0" }

export function TrackConfigManager({ cafeId }: TrackConfigManagerProps) {
  const { data: configs = [], isLoading } = useTrackConfigs(cafeId)
  const { data: trackTypes = [], isLoading: trackTypesLoading } = useQuery({
    queryKey: trackTypeQueryKeys.all,
    queryFn: () => trackTypeApi.listAll(),
  })

  const createMutation = useCreateTrackConfig(cafeId)
  const updateMutation = useUpdateTrackConfig(cafeId)
  const uploadMutation = useUploadTrackConfigImages(cafeId)

  const [showAddForm, setShowAddForm] = useState(false)
  const [deactivatingConfig, setDeactivatingConfig] = useState<TrackConfig | null>(null)
  const [uploadingConfigId, setUploadingConfigId] = useState<string | null>(null)
  const [form, setForm] = useState(EMPTY_FORM)

  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleCreate = async () => {
    const mc = parseInt(form.max_concurrent, 10) || 0
    const bc = parseInt(form.byoc_capacity, 10) || 0
    if (!form.track_type_id || (mc === 0 && bc === 0)) return
    const body: CreateTrackConfigBody = {
      track_type_id: form.track_type_id,
      max_concurrent: mc,
      byoc_capacity: bc,
      description: form.description.trim() || undefined,
      sort_order: parseInt(form.sort_order, 10) || 0,
    }
    await createMutation.mutateAsync(body)
    setShowAddForm(false)
    setForm(EMPTY_FORM)
  }

  const handleCancelAdd = () => {
    setShowAddForm(false)
    setForm(EMPTY_FORM)
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
          <div key={i} className="h-28 animate-pulse rounded-xl bg-[#f6f3f2]" />
        ))}
      </div>
    )
  }

  const usedTrackTypeIds = new Set(configs.map((c) => c.track_type_id))
  const availableTrackTypes = trackTypes.filter((tt) => !usedTrackTypeIds.has(tt.id))

  return (
    <div className="space-y-3">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-sm font-bold text-[#1c1b1b]">Loại sân</h3>
          <p className="text-xs text-[#747878]">Cấu hình từng sân: số slot RENTAL và BYOC tối đa</p>
        </div>
        {!showAddForm && (
          <Button
            type="button"
            size="sm"
            onClick={() => setShowAddForm(true)}
            disabled={availableTrackTypes.length === 0 && trackTypes.length > 0}
            className="h-8 gap-1.5 rounded-lg font-bold text-xs"
          >
            <PlusCircle className="size-3.5" />
            Thêm loại sân
          </Button>
        )}
      </div>

      {/* Inline add form */}
      {showAddForm && (
        <div className="rounded-xl border-2 border-orange-200 bg-orange-50/30 p-5">
          <div className="mb-4 flex items-center justify-between">
            <p className="text-sm font-bold text-[#1c1b1b]">Sân mới</p>
            <button
              type="button"
              onClick={handleCancelAdd}
              className="flex size-7 items-center justify-center rounded-full text-[#747878] hover:bg-[#f6f3f2] hover:text-[#1c1b1b]"
            >
              <X className="size-4" />
            </button>
          </div>

          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {/* Track type selector — full row on small */}
            <div className="space-y-1.5 sm:col-span-2 lg:col-span-1">
              <Label className="text-xs font-bold text-[#1c1b1b]">Loại sân</Label>
              {trackTypesLoading ? (
                <div className="h-10 animate-pulse rounded-md bg-[#f6f3f2]" />
              ) : availableTrackTypes.length === 0 ? (
                <p className="rounded-md border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-800">
                  Tất cả loại sân đã được cấu hình.
                </p>
              ) : (
                <Select value={form.track_type_id} onValueChange={(v) => setForm((f) => ({ ...f, track_type_id: v }))}>
                  <SelectTrigger className="h-10 bg-white">
                    <SelectValue placeholder="Chọn loại sân..." />
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
              <Label className="text-xs font-bold text-[#1c1b1b]">
                Số chỗ thuê xe tối đa
              </Label>
              <Input
                type="number"
                min={1}
                value={form.max_concurrent}
                onChange={(e) => setForm((f) => ({ ...f, max_concurrent: e.target.value }))}
                className="h-10 bg-white"
              />
              <p className="text-[10px] text-[#747878]">Số xe thuê có thể chạy cùng lúc trên sân</p>
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs font-bold text-[#1c1b1b]">
                Số chỗ xe riêng tối đa
              </Label>
              <Input
                type="number"
                min={0}
                value={form.byoc_capacity}
                onChange={(e) => setForm((f) => ({ ...f, byoc_capacity: e.target.value }))}
                className="h-10 bg-white"
              />
              <p className="text-[10px] text-[#747878]">0 = sân không nhận xe riêng</p>
            </div>

            <div className="space-y-1.5 sm:col-span-2">
              <Label className="text-xs font-bold text-[#1c1b1b]">Mô tả sân (tuỳ chọn)</Label>
              <Textarea
                rows={2}
                placeholder="Sân drift ngoài trời, bề mặt asphalt, diện tích 500m²..."
                value={form.description}
                onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
                className="bg-white resize-none"
              />
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs font-bold text-[#1c1b1b]">Thứ tự hiển thị</Label>
              <Input
                type="number"
                min={0}
                value={form.sort_order}
                onChange={(e) => setForm((f) => ({ ...f, sort_order: e.target.value }))}
                className="h-10 bg-white"
              />
            </div>
          </div>

          <div className="mt-4 flex items-center justify-end gap-2 border-t border-orange-100 pt-4">
            <Button type="button" variant="outline" size="sm" onClick={handleCancelAdd} className="h-8 font-bold text-xs">
              Hủy
            </Button>
            <Button
              type="button"
              size="sm"
              onClick={() => void handleCreate()}
              disabled={!form.track_type_id || ((parseInt(form.max_concurrent, 10) || 0) === 0 && (parseInt(form.byoc_capacity, 10) || 0) === 0) || createMutation.isPending}
              className="h-8 gap-1.5 font-bold text-xs"
            >
              <Check className="size-3.5" />
              {createMutation.isPending ? "Đang lưu..." : "Lưu loại sân"}
            </Button>
          </div>
        </div>
      )}

      {/* Config list */}
      {configs.length === 0 && !showAddForm ? (
        <div className="rounded-xl border border-dashed border-[#c4c7c8] bg-[#fafafa] p-10 text-center">
          <ImagePlus className="mx-auto mb-2 size-9 text-[#c4c7c8]" />
          <p className="text-sm font-medium text-[#747878]">Chưa có loại sân nào</p>
          <p className="mt-1 text-xs text-[#747878]">Bấm "Thêm loại sân" để bắt đầu cấu hình</p>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2">
          {configs.map((config) => (
            <TrackConfigCard
              key={config.id}
              config={config}
              onToggleActive={() => handleToggleActive(config)}
              onUploadImages={() => handleUploadClick(config.id)}
              onSaveEdit={(body) => updateMutation.mutate({ configId: config.id, body })}
              isToggling={updateMutation.isPending}
              isUploading={uploadMutation.isPending && uploadingConfigId === config.id}
              isSaving={updateMutation.isPending}
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

type UpdateTrackConfigBody = {
  max_concurrent?: number
  byoc_capacity?: number
  description?: string
  sort_order?: number
  is_active?: boolean
}

function TrackConfigCard({
  config,
  onToggleActive,
  onUploadImages,
  onSaveEdit,
  isToggling,
  isUploading,
  isSaving,
}: {
  config: TrackConfig
  onToggleActive: () => void
  onUploadImages: () => void
  onSaveEdit: (body: UpdateTrackConfigBody) => void
  isToggling: boolean
  isUploading: boolean
  isSaving: boolean
}) {
  const [editing, setEditing] = useState(false)
  const [editForm, setEditForm] = useState({
    max_concurrent: String(config.max_concurrent ?? 5),
    byoc_capacity: String(config.byoc_capacity ?? 0),
    description: config.description ?? "",
    sort_order: String(config.sort_order ?? 0),
  })

  const coverImage = config.images[0] ?? null

  const handleSave = () => {
    const mc = parseInt(editForm.max_concurrent, 10) || 0
    const bc = parseInt(editForm.byoc_capacity, 10) || 0
    const so = parseInt(editForm.sort_order, 10) || 0
    if (mc < 0 || bc < 0 || (mc === 0 && bc === 0)) return
    onSaveEdit({
      max_concurrent: mc,
      byoc_capacity: bc,
      description: editForm.description.trim() || undefined,
      sort_order: Math.max(0, so),
    })
    setEditing(false)
  }

  const handleCancel = () => {
    setEditForm({
      max_concurrent: String(config.max_concurrent ?? 5),
      byoc_capacity: String(config.byoc_capacity ?? 0),
      description: config.description ?? "",
      sort_order: String(config.sort_order ?? 0),
    })
    setEditing(false)
  }

  return (
    <div className={`overflow-hidden rounded-xl border transition-colors ${config.is_active ? "border-[#c4c7c8] bg-white" : "border-[#e5e2e1] bg-[#fafafa] opacity-60"}`}>
      {/* Cover — fixed 16:9 */}
      <button
        type="button"
        onClick={onUploadImages}
        disabled={isUploading || editing}
        className="group relative block w-full overflow-hidden bg-[#f0edec]"
        style={{ aspectRatio: "16/9" }}
        title={coverImage ? "Bấm để thay ảnh" : "Bấm để thêm ảnh"}
      >
        {coverImage ? (
          <img src={coverImage} alt={config.track_type?.name} className="h-full w-full object-cover" />
        ) : (
          <div className="flex h-full w-full flex-col items-center justify-center gap-2 text-[#c4c7c8]">
            <ImagePlus className="size-8" />
            <span className="text-xs font-medium">Thêm ảnh đại diện sân</span>
          </div>
        )}
        <div className="absolute inset-0 flex flex-col items-center justify-center gap-1.5 bg-black/0 transition-colors group-hover:bg-black/35 group-disabled:hidden">
          <Upload className="size-5 text-white opacity-0 transition-opacity group-hover:opacity-100" />
          <span className="text-xs font-semibold text-white opacity-0 transition-opacity group-hover:opacity-100">
            {isUploading ? "Đang upload..." : coverImage ? "Thay ảnh" : "Thêm ảnh"}
          </span>
        </div>
      </button>

      {/* Content */}
      <div className="p-4">
        {/* Header — name + status badge */}
        <div className="flex flex-wrap items-center gap-1.5">
          <span className="text-sm font-bold text-[#1c1b1b]">{config.track_type?.name ?? config.track_type_id}</span>
          <Badge
            variant="outline"
            className={`text-[10px] font-semibold ${config.is_active ? "border-green-200 bg-green-50 text-green-700" : "border-[#e5e2e1] bg-[#f6f3f2] text-[#747878]"}`}
          >
            {config.is_active ? "Hoạt động" : "Tạm tắt"}
          </Badge>
        </div>

        {/* Inline edit form */}
        {editing ? (
          <div className="mt-3 space-y-3">
            {(() => {
              const mc = parseInt(editForm.max_concurrent, 10) || 0
              const bc = parseInt(editForm.byoc_capacity, 10) || 0
              const bothZero = mc === 0 && bc === 0
              return (
                <div className="space-y-2">
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <Label className="text-[10px] font-bold text-[#1c1b1b]">Chỗ thuê xe tối đa</Label>
                      <Input
                        type="number"
                        min={0}
                        value={editForm.max_concurrent}
                        onChange={(e) => setEditForm((f) => ({ ...f, max_concurrent: e.target.value }))}
                        className={`h-8 text-xs ${bothZero ? "border-rose-400" : ""}`}
                      />
                      <p className="text-[10px] text-[#747878]">0 = sân không có xe thuê</p>
                    </div>
                    <div className="space-y-1">
                      <Label className="text-[10px] font-bold text-[#1c1b1b]">Chỗ xe riêng tối đa</Label>
                      <Input
                        type="number"
                        min={0}
                        value={editForm.byoc_capacity}
                        onChange={(e) => setEditForm((f) => ({ ...f, byoc_capacity: e.target.value }))}
                        className={`h-8 text-xs ${bothZero ? "border-rose-400" : ""}`}
                      />
                      <p className="text-[10px] text-[#747878]">0 = sân không nhận xe riêng</p>
                    </div>
                  </div>
                  {bothZero && (
                    <p className="text-[10px] text-rose-500">Sân phải hỗ trợ ít nhất một hình thức chơi (thuê xe hoặc xe riêng)</p>
                  )}
                </div>
              )
            })()}
            <div className="space-y-1">
              <Label className="text-[10px] font-bold text-[#1c1b1b]">Mô tả (tuỳ chọn)</Label>
              <Textarea
                rows={2}
                value={editForm.description}
                onChange={(e) => setEditForm((f) => ({ ...f, description: e.target.value }))}
                className="resize-none text-xs"
                placeholder="Mô tả sân..."
              />
            </div>
            <div className="space-y-1">
              <Label className="text-[10px] font-bold text-[#1c1b1b]">Thứ tự hiển thị</Label>
              <Input
                type="number"
                min={0}
                value={editForm.sort_order}
                onChange={(e) => setEditForm((f) => ({ ...f, sort_order: e.target.value }))}
                className="h-8 text-xs"
              />
            </div>
            <div className="flex items-center justify-end gap-2 border-t border-[#f0edec] pt-3">
              <Button type="button" variant="outline" size="sm" onClick={handleCancel} className="h-7 text-xs font-semibold">
                Hủy
              </Button>
              <Button
                type="button"
                size="sm"
                onClick={handleSave}
                disabled={isSaving || ((parseInt(editForm.max_concurrent, 10) || 0) === 0 && (parseInt(editForm.byoc_capacity, 10) || 0) === 0)}
                className="h-7 gap-1 text-xs font-semibold"
              >
                <Check className="size-3" />
                {isSaving ? "Đang lưu..." : "Lưu"}
              </Button>
            </div>
          </div>
        ) : (
          <>
            {config.description ? (
              <p className="mt-1 text-xs leading-relaxed text-[#747878] line-clamp-2">{config.description}</p>
            ) : (
              <p className="mt-1 text-xs italic text-[#c4c7c8]">Chưa có mô tả</p>
            )}
            <div className="mt-3 flex items-center gap-4 text-xs text-[#747878]">
              <span><span className="font-bold text-[#1c1b1b]">{config.max_concurrent}</span> chỗ thuê xe</span>
              {config.byoc_capacity > 0 ? (
                <span><span className="font-bold text-[#1c1b1b]">{config.byoc_capacity}</span> chỗ xe riêng</span>
              ) : (
                <span className="text-[#c4c7c8]">Không nhận xe riêng</span>
              )}
            </div>
          </>
        )}

        {/* Action footer */}
        {!editing && (
          <div className="mt-3 flex items-center gap-1 border-t border-[#f0edec] pt-3">
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={onToggleActive}
              disabled={isToggling}
              className="h-7 gap-1.5 rounded-lg px-2 text-xs font-semibold text-[#747878] hover:text-[#1c1b1b]"
            >
              {config.is_active
                ? <><ToggleRight className="size-3.5 text-orange-500" /> Tắt sân</>
                : <><ToggleLeft className="size-3.5" /> Bật sân</>}
            </Button>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => setEditing(true)}
              className="h-7 gap-1.5 rounded-lg px-2 text-xs font-semibold text-[#747878] hover:text-[#1c1b1b]"
            >
              <Pencil className="size-3.5" /> Chỉnh sửa
            </Button>
          </div>
        )}
      </div>
    </div>
  )
}
