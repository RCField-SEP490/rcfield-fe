import { useEffect, useState, type FormEvent } from "react"
import { ImagePlus } from "lucide-react"

import type { MenuItem, MenuUpsertBody } from "@/features/menu/types"
import { FNB_CATEGORIES } from "@/features/menu/types"
import { uploadImage } from "@/features/uploads/api/upload.api"
import { Button } from "@/shared/ui/button"
import { Checkbox } from "@/shared/ui/checkbox"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/shared/ui/dialog"
import { Input } from "@/shared/ui/input"
import { Label } from "@/shared/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/shared/ui/select"
import { Textarea } from "@/shared/ui/textarea"

type ProviderMenuItemFormDialogProps = {
  open: boolean
  item: MenuItem | null
  isPending: boolean
  onOpenChange: (open: boolean) => void
  onSubmit: (values: MenuUpsertBody) => Promise<void>
}

const defaultValues: MenuUpsertBody = {
  name: "",
  description: "",
  price: 0,
  category: "Đồ uống",
  image_url: null,
  is_available: true,
}

export function ProviderMenuItemFormDialog({
  open,
  item,
  isPending,
  onOpenChange,
  onSubmit,
}: ProviderMenuItemFormDialogProps) {
  const [values, setValues] = useState<MenuUpsertBody>(defaultValues)
  const [uploading, setUploading] = useState(false)

  useEffect(() => {
    if (!open) return
    if (!item) {
      queueMicrotask(() => setValues(defaultValues))
      return
    }

    const nextValues = {
      name: item.name,
      description: item.description ?? "",
      price: Number(item.price),
      category: item.category ?? "",
      image_url: item.imageUrl ?? null,
      is_available: item.isAvailable,
    }
    queueMicrotask(() => setValues(nextValues))
  }, [item, open])

  const setField = <K extends keyof MenuUpsertBody>(field: K, value: MenuUpsertBody[K]) => {
    setValues((current) => ({ ...current, [field]: value }))
  }

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    await onSubmit({
      name: values.name.trim(),
      description: values.description?.trim() ? values.description.trim() : null,
      price: Number(values.price),
      category: values.category?.trim() ? values.category.trim() : null,
      image_url: values.image_url?.trim() ? values.image_url.trim() : null,
      is_available: values.is_available ?? true,
    })
  }

  const handleUpload = async (file: File | undefined) => {
    if (!file) return
    setUploading(true)
    try {
      const uploaded = await uploadImage(file, "menu")
      setField("image_url", uploaded.url)
    } finally {
      setUploading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[92svh] max-w-2xl sm:max-w-2xl overflow-y-auto rounded-xl bg-white p-0">
        <form onSubmit={handleSubmit}>
          <DialogHeader className="border-b border-[#e5e2e1] px-5 py-4">
            <DialogTitle className="text-xl font-bold text-[#1c1b1b]">{item ? "Cập nhật món" : "Thêm món"}</DialogTitle>
            <DialogDescription>Quản lý món ăn/uống của cơ sở provider bằng dữ liệu backend.</DialogDescription>
          </DialogHeader>

          <div className="space-y-4 p-5">
            {/* Row 1: tên + giá */}
            <div className="grid gap-3 sm:grid-cols-2">
              <TextField label="Tên món" value={values.name} onChange={(value) => setField("name", value)} required />
              <NumberField label="Giá bán" value={values.price} onChange={(value) => setField("price", value ?? 0)} min={0} />
            </div>

            {/* Row 2: danh mục + trạng thái */}
            <div className="grid gap-3 sm:grid-cols-[1fr_160px] sm:items-end">
              <CategoryField
                value={values.category ?? ""}
                onChange={(value) => setField("category", value)}
              />
              <Label className="flex h-10 cursor-pointer items-center gap-2 rounded-lg border border-[#e5e2e1] px-3">
                <Checkbox
                  checked={values.is_available ?? true}
                  onCheckedChange={(checked) => setField("is_available", checked === true)}
                />
                <span className="text-sm font-semibold text-[#1c1b1b]">Đang bán</span>
              </Label>
            </div>

            {/* Row 3: mô tả */}
            <label className="block space-y-2">
              <span className="text-sm font-bold text-[#1c1b1b]">Mô tả</span>
              <Textarea
                value={values.description ?? ""}
                onChange={(event) => setField("description", event.target.value)}
                className="min-h-24 rounded-lg border-[#c4c7c8]"
              />
            </label>

            {/* Row 4: upload ảnh + preview */}
            {values.image_url ? (
              <div className="flex items-center gap-3 rounded-lg border border-[#e5e2e1] bg-[#fcf8f8] p-3 min-w-0 overflow-hidden">
                <img src={values.image_url} alt="" className="size-16 shrink-0 rounded-md object-cover" />
                <div className="min-w-0 flex-1">
                  <span className="block truncate text-xs font-medium text-[#444748]">{values.image_url}</span>
                  <button
                    type="button"
                    onClick={() => setField("image_url", null)}
                    className="mt-1 text-xs font-semibold text-red-500 hover:underline"
                  >
                    Xóa ảnh
                  </button>
                </div>
              </div>
            ) : (
              <label className="block cursor-pointer rounded-lg border border-dashed border-[#c4c7c8] bg-[#fcf8f8] p-4 text-sm font-semibold text-[#444748] hover:bg-[#f6f3f2]">
                <span className="flex items-center gap-2">
                  <ImagePlus className="size-4" />
                  {uploading ? "Đang upload ảnh..." : "Upload ảnh món"}
                </span>
                <input
                  type="file"
                  accept="image/jpeg,image/png,image/webp"
                  disabled={uploading || isPending}
                  className="sr-only"
                  onChange={(event) => void handleUpload(event.target.files?.[0])}
                />
              </label>
            )}
          </div>

          <DialogFooter className="px-5">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={isPending || uploading}>
              Hủy
            </Button>
            <Button type="submit" disabled={isPending || uploading || values.name.trim().length < 2} className="bg-[#1c1b1b] text-white hover:bg-[#313030]">
              {isPending ? "Đang lưu..." : item ? "Lưu thay đổi" : "Tạo món"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}

function TextField({
  label,
  value,
  onChange,
  required = false,
}: {
  label: string
  value: string
  onChange: (value: string) => void
  required?: boolean
}) {
  return (
    <label className="block space-y-2">
      <span className="text-sm font-bold text-[#1c1b1b]">{label}</span>
      <Input value={value} onChange={(event) => onChange(event.target.value)} required={required} className="rounded-lg border-[#c4c7c8]" />
    </label>
  )
}

function CategoryField({ value, onChange }: { value: string; onChange: (value: string) => void }) {
  return (
    <div className="space-y-2">
      <span className="text-sm font-bold text-[#1c1b1b]">Danh mục</span>
      <Select value={value || ""} onValueChange={onChange}>
        <SelectTrigger className="h-10 w-full rounded-lg border-[#c4c7c8]">
          <SelectValue placeholder="Chọn danh mục" />
        </SelectTrigger>
        <SelectContent>
          {FNB_CATEGORIES.map((cat) => (
            <SelectItem key={cat.value} value={cat.value}>
              {cat.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  )
}

function NumberField({
  label,
  value,
  onChange,
  min,
}: {
  label: string
  value: number
  onChange: (value: number | null) => void
  min?: number
}) {
  return (
    <label className="block space-y-2">
      <span className="text-sm font-bold text-[#1c1b1b]">{label}</span>
      <Input
        type="number"
        value={Number.isFinite(value) ? value : ""}
        min={min}
        step="1000"
        onChange={(event) => onChange(event.target.value === "" ? null : Number(event.target.value))}
        className="rounded-lg border-[#c4c7c8]"
      />
    </label>
  )
}
